/**
 * Mobile Performance Optimization Utilities
 * Provides utilities for optimizing performance on mobile devices
 */

// Device detection utilities
export const isMobileDevice = (): boolean => {
  return window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

export const isLowEndDevice = (): boolean => {
  // Check for low-end device indicators
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  const isSlowConnection = connection && (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g');
  const isLowMemory = (navigator as any).deviceMemory && (navigator as any).deviceMemory < 4;
  const isLowConcurrency = navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4;
  
  return isSlowConnection || isLowMemory || isLowConcurrency;
};

// Image optimization utilities
export const getOptimalImageSize = (originalWidth: number, originalHeight: number): { width: number; height: number } => {
  const maxMobileWidth = 800;
  const maxMobileHeight = 600;
  
  if (!isMobileDevice()) {
    return { width: originalWidth, height: originalHeight };
  }
  
  const aspectRatio = originalWidth / originalHeight;
  
  if (originalWidth > maxMobileWidth) {
    return {
      width: maxMobileWidth,
      height: Math.round(maxMobileWidth / aspectRatio)
    };
  }
  
  if (originalHeight > maxMobileHeight) {
    return {
      width: Math.round(maxMobileHeight * aspectRatio),
      height: maxMobileHeight
    };
  }
  
  return { width: originalWidth, height: originalHeight };
};

// Lazy loading utilities
export const createIntersectionObserver = (callback: (entries: IntersectionObserverEntry[]) => void): IntersectionObserver => {
  const options = {
    root: null,
    rootMargin: isMobileDevice() ? '50px' : '100px', // Smaller margin for mobile
    threshold: 0.1
  };
  
  return new IntersectionObserver(callback, options);
};

// Animation optimization for mobile
export const shouldReduceMotion = (): boolean => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches || isLowEndDevice();
};

// Bundle size optimization
export const loadComponentLazily = async <T>(importFn: () => Promise<{ default: T }>): Promise<T> => {
  try {
    const module = await importFn();
    return module.default;
  } catch (error) {
    console.error('Failed to load component lazily:', error);
    throw error;
  }
};

// Memory optimization utilities
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate?: boolean
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    
    const callNow = immediate && !timeout;
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    
    if (callNow) func(...args);
  };
};

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Touch optimization utilities
export const addTouchOptimizations = (element: HTMLElement): void => {
  // Add touch-action for better scrolling performance
  element.style.touchAction = 'manipulation';
  
  // Add will-change for elements that will be animated
  if (element.classList.contains('animate') || element.classList.contains('transition')) {
    element.style.willChange = 'transform, opacity';
  }
};

// Viewport utilities
export const getViewportSize = (): { width: number; height: number } => {
  return {
    width: Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0),
    height: Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0)
  };
};

// Performance monitoring
export const measurePerformance = (name: string, fn: () => void): void => {
  if (typeof performance !== 'undefined' && performance.mark) {
    performance.mark(`${name}-start`);
    fn();
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
  } else {
    fn();
  }
};

// CSS optimization utilities
export const addCriticalCSS = (css: string): void => {
  const style = document.createElement('style');
  style.textContent = css;
  style.setAttribute('data-critical', 'true');
  document.head.appendChild(style);
};

// Resource hints
export const addResourceHint = (href: string, rel: 'preload' | 'prefetch' | 'preconnect', as?: string): void => {
  const link = document.createElement('link');
  link.rel = rel;
  link.href = href;
  if (as) link.setAttribute('as', as);
  document.head.appendChild(link);
};

// Mobile-specific optimizations
export const optimizeForMobile = (): void => {
  if (!isMobileDevice()) return;
  
  // Add viewport meta tag if not present
  if (!document.querySelector('meta[name="viewport"]')) {
    const viewport = document.createElement('meta');
    viewport.name = 'viewport';
    viewport.content = 'width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes';
    document.head.appendChild(viewport);
  }
  
  // Add touch-action to body for better scrolling
  document.body.style.touchAction = 'manipulation';
  
  // Optimize scrolling performance
  document.documentElement.style.scrollBehavior = shouldReduceMotion() ? 'auto' : 'smooth';
  
  // Add critical CSS for mobile
  addCriticalCSS(`
    * {
      -webkit-tap-highlight-color: transparent;
      -webkit-touch-callout: none;
    }
    
    body {
      -webkit-overflow-scrolling: touch;
      overscroll-behavior: contain;
    }
    
    img, video {
      max-width: 100%;
      height: auto;
    }
  `);
};

// Initialize mobile optimizations
export const initMobileOptimizations = (): void => {
  if (typeof window !== 'undefined') {
    optimizeForMobile();
    
    // Add resource hints for common resources
    addResourceHint('https://fonts.googleapis.com', 'preconnect');
    addResourceHint('https://fonts.gstatic.com', 'preconnect');
  }
};