/**
 * Mobile-Optimized Lazy Loading Hook
 * Provides efficient lazy loading with mobile performance optimizations
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { createIntersectionObserver, isMobileDevice, isLowEndDevice } from '../utils/mobileOptimizations';

interface UseLazyLoadingOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
  disabled?: boolean;
}

export function useLazyLoading<T extends HTMLElement = HTMLElement>(
  options: UseLazyLoadingOptions = {}
) {
  const {
    threshold = 0.1,
    rootMargin = isMobileDevice() ? '50px' : '100px',
    triggerOnce = true,
    disabled = false
  } = options;

  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const elementRef = useRef<T>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const cleanup = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (disabled || !elementRef.current) return;

    // Skip intersection observer for low-end devices and load immediately
    if (isLowEndDevice()) {
      setIsIntersecting(true);
      setHasTriggered(true);
      return;
    }

    const element = elementRef.current;

    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      
      if (entry.isIntersecting) {
        setIsIntersecting(true);
        
        if (triggerOnce) {
          setHasTriggered(true);
          cleanup();
        }
      } else if (!triggerOnce) {
        setIsIntersecting(false);
      }
    };

    observerRef.current = createIntersectionObserver(handleIntersection);
    observerRef.current.observe(element);

    return cleanup;
  }, [disabled, triggerOnce, threshold, rootMargin, cleanup]);

  // Reset state when disabled changes
  useEffect(() => {
    if (disabled) {
      setIsIntersecting(false);
      setHasTriggered(false);
      cleanup();
    }
  }, [disabled, cleanup]);

  return {
    ref: elementRef,
    isIntersecting: disabled ? true : isIntersecting,
    hasTriggered: disabled ? true : hasTriggered,
  };
}

// Hook for lazy loading images with mobile optimizations
export function useLazyImage(src: string, options: UseLazyLoadingOptions = {}) {
  const { ref, isIntersecting } = useLazyLoading<HTMLImageElement>(options);
  const [imageSrc, setImageSrc] = useState<string>('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (isIntersecting && src && !imageSrc) {
      setImageSrc(src);
    }
  }, [isIntersecting, src, imageSrc]);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    setHasError(false);
  }, []);

  const handleError = useCallback(() => {
    setHasError(true);
    setIsLoaded(false);
  }, []);

  return {
    ref,
    src: imageSrc,
    isLoaded,
    hasError,
    isIntersecting,
    onLoad: handleLoad,
    onError: handleError,
  };
}

// Hook for lazy loading components
export function useLazyComponent<T>(
  importFn: () => Promise<{ default: T }>,
  options: UseLazyLoadingOptions = {}
) {
  const { ref, isIntersecting } = useLazyLoading(options);
  const [Component, setComponent] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (isIntersecting && !Component && !isLoading) {
      setIsLoading(true);
      setError(null);

      importFn()
        .then((module) => {
          setComponent(module.default);
        })
        .catch((err) => {
          setError(err);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isIntersecting, Component, isLoading, importFn]);

  return {
    ref,
    Component,
    isLoading,
    error,
    isIntersecting,
  };
}

// Hook for lazy loading with preloading support
export function useLazyWithPreload<T extends HTMLElement = HTMLElement>(
  preloadCondition: boolean,
  options: UseLazyLoadingOptions = {}
) {
  const { ref, isIntersecting, hasTriggered } = useLazyLoading<T>(options);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    if (preloadCondition || isIntersecting) {
      setShouldLoad(true);
    }
  }, [preloadCondition, isIntersecting]);

  return {
    ref,
    shouldLoad,
    isIntersecting,
    hasTriggered,
  };
}