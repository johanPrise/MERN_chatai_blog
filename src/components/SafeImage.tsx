/**
 * SafeImage Component
 * Robust image component with fallback handling and error recovery
 * Integrated with global error handling system and mobile performance optimizations
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getFallbackImageUrl, getValidImageUrl, getOptimizedImageUrl } from '../config/api.config';
import { cn } from '../lib/utils';
import { useGlobalErrorHandler } from '../hooks/useGlobalErrorHandler';

export interface SafeImageProps {
  src: string | null | undefined;
  alt: string;
  fallbackSrc?: string;
  className?: string;
  onError?: (error: string) => void;
  onLoad?: () => void;
  loading?: 'lazy' | 'eager';
  sizes?: string;
  width?: number;
  height?: number;
  placeholder?: 'blur' | 'empty' | 'skeleton';
  retryCount?: number;
  timeout?: number;
  // Mobile performance optimizations
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png' | 'auto';
  responsive?: boolean;
  preload?: boolean;
  priority?: boolean;
}

export function SafeImage({
  src,
  alt,
  fallbackSrc,
  className = '',
  onError,
  onLoad,
  loading = 'lazy',
  sizes,
  width,
  height,
  placeholder = 'skeleton',
  retryCount = 2,
  timeout = 5000,
  quality = 80,
  format = 'auto',
  responsive = true,
  preload = false,
  priority = false,
}: SafeImageProps) {
  const [currentSrc, setCurrentSrc] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryAttempts, setRetryAttempts] = useState(0);
  const imgRef = useRef<HTMLImageElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const { handleImageError } = useGlobalErrorHandler();

  // Mobile performance optimization: Detect device capabilities
  const isMobile = useCallback(() => {
    return window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }, []);

  const supportsWebP = useCallback(() => {
    const canvas = document.createElement('canvas');
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }, []);

  // Optimize image URL for mobile performance
  const getOptimizedSrc = useCallback((originalSrc: string) => {
    if (!originalSrc) return originalSrc;

    const options: any = {};
    
    // Mobile-specific optimizations
    if (isMobile()) {
      options.quality = Math.min(quality, 70); // Lower quality for mobile
      options.width = Math.min(width || 800, 800); // Max width for mobile
    } else {
      options.quality = quality;
      if (width) options.width = width;
      if (height) options.height = height;
    }

    // Format optimization
    if (format === 'auto') {
      options.format = supportsWebP() ? 'webp' : 'jpeg';
    } else {
      options.format = format;
    }

    return getOptimizedImageUrl(originalSrc, options);
  }, [quality, width, height, format, isMobile, supportsWebP]);

  // Preload image if priority is set
  useEffect(() => {
    if (preload && src && priority) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = getOptimizedSrc(src);
      document.head.appendChild(link);
      
      return () => {
        document.head.removeChild(link);
      };
    }
  }, [src, preload, priority, getOptimizedSrc]);

  // Initialize image source with mobile optimizations
  useEffect(() => {
    const initializeImage = async () => {
      setIsLoading(true);
      setHasError(false);
      setRetryAttempts(0);

      if (!src) {
        setCurrentSrc(fallbackSrc || getFallbackImageUrl('primary'));
        setIsLoading(false);
        return;
      }

      // Optimize the source URL for mobile performance
      const optimizedSrc = getOptimizedSrc(src);
      const optimizedFallback = fallbackSrc ? getOptimizedSrc(fallbackSrc) : undefined;

      // Try to find a valid image URL from multiple sources
      const imageUrls = [
        optimizedSrc,
        optimizedFallback,
        getFallbackImageUrl('primary'),
        getFallbackImageUrl('secondary'),
      ].filter(Boolean) as string[];

      try {
        const validUrl = await getValidImageUrl(imageUrls);
        setCurrentSrc(validUrl);
      } catch (error) {
        setCurrentSrc(getFallbackImageUrl('error'));
        setHasError(true);
        
        // Use global error handler for centralized error management
        handleImageError(src || 'unknown', {
          context: { component: 'SafeImage', action: 'initialize_image' },
          showToUser: false // Don't show notification for image errors by default
        });
        
        onError?.('Failed to load any image source');
      }
    };

    initializeImage();
  }, [src, fallbackSrc, onError, getOptimizedSrc]);

  // Handle image load success
  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
    onLoad?.();
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  // Handle image load error with retry logic
  const handleError = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (retryAttempts < retryCount) {
      // Retry with a delay
      setTimeout(() => {
        setRetryAttempts(prev => prev + 1);
        if (imgRef.current) {
          imgRef.current.src = currentSrc + '?retry=' + (retryAttempts + 1);
        }
      }, 1000 * (retryAttempts + 1)); // Exponential backoff
      return;
    }

    // All retries failed, use fallback
    setIsLoading(false);
    setHasError(true);
    
    const fallbackUrl = fallbackSrc || getFallbackImageUrl('error');
    if (currentSrc !== fallbackUrl) {
      setCurrentSrc(fallbackUrl);
      return;
    }

    // Use global error handler for retry failures
    handleImageError(currentSrc, {
      context: { 
        component: 'SafeImage', 
        action: 'image_load_failed',
        userId: undefined // Could be populated if user context is available
      },
      showToUser: false // Don't show notification for image errors by default
    });

    onError?.(`Failed to load image after ${retryCount} retries`);
  };

  // Set up timeout for image loading
  useEffect(() => {
    if (isLoading && currentSrc) {
      timeoutRef.current = setTimeout(() => {
        handleError();
      }, timeout);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isLoading, currentSrc, timeout]);

  // Render loading placeholder
  const renderPlaceholder = () => {
    const placeholderClasses = cn(
      'flex items-center justify-center bg-gray-200 dark:bg-gray-700',
      className
    );

    switch (placeholder) {
      case 'blur':
        return (
          <div className={placeholderClasses} style={{ width, height }}>
            <div className="animate-pulse bg-gray-300 dark:bg-gray-600 w-full h-full rounded" />
          </div>
        );
      
      case 'skeleton':
        return (
          <div className={placeholderClasses} style={{ width, height }}>
            <div className="animate-pulse">
              <svg
                className="w-8 h-8 text-gray-400 dark:text-gray-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
        );
      
      case 'empty':
      default:
        return (
          <div className={placeholderClasses} style={{ width, height }}>
            <span className="text-gray-400 dark:text-gray-500 text-sm">Loading...</span>
          </div>
        );
    }
  };

  // Show placeholder while loading
  if (isLoading && !currentSrc) {
    return renderPlaceholder();
  }

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 z-10">
          {renderPlaceholder()}
        </div>
      )}
      
      <img
        ref={imgRef}
        src={currentSrc}
        alt={alt}
        className={cn(
          'max-w-full h-auto', // Ensure responsive behavior
          className,
          isLoading && 'opacity-0',
          hasError && 'opacity-75'
        )}
        onLoad={handleLoad}
        onError={handleError}
        loading={loading}
        sizes={sizes}
        width={width}
        height={height}
        style={{
          transition: 'opacity 0.3s ease-in-out',
          maxWidth: '100%',
          height: 'auto',
        }}
      />
      
      {hasError && retryAttempts >= retryCount && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 bg-opacity-75">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <svg
              className="w-8 h-8 mx-auto mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <p className="text-xs">Image failed to load</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Hook for using SafeImage with additional utilities
export function useSafeImage(src: string | null | undefined, options?: {
  fallbackSrc?: string;
  retryCount?: number;
  timeout?: number;
}) {
  const [imageState, setImageState] = useState({
    isLoading: true,
    hasError: false,
    currentSrc: '',
  });
  const { handleImageError } = useGlobalErrorHandler();

  useEffect(() => {
    const loadImage = async () => {
      setImageState(prev => ({ ...prev, isLoading: true, hasError: false }));

      if (!src) {
        setImageState({
          isLoading: false,
          hasError: false,
          currentSrc: options?.fallbackSrc || getFallbackImageUrl('primary'),
        });
        return;
      }

      try {
        const imageUrls = [
          src,
          options?.fallbackSrc,
          getFallbackImageUrl('primary'),
        ].filter(Boolean) as string[];

        const validUrl = await getValidImageUrl(imageUrls);
        setImageState({
          isLoading: false,
          hasError: false,
          currentSrc: validUrl,
        });
      } catch (error) {
        // Use global error handler for hook-based image loading
        handleImageError(src, {
          context: { component: 'useSafeImage', action: 'hook_image_load_failed' },
          showToUser: false // Don't show notification for image errors by default
        });

        setImageState({
          isLoading: false,
          hasError: true,
          currentSrc: getFallbackImageUrl('error'),
        });
      }
    };

    loadImage();
  }, [src, options?.fallbackSrc, handleImageError]);

  return imageState;
}

export default SafeImage;