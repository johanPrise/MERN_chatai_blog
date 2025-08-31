/**
 * Lazy Component Loading Utilities
 * Provides code splitting and lazy loading for better mobile performance
 */

import React, { lazy, ComponentType } from 'react';
import { isMobileDevice, isLowEndDevice } from './mobileOptimizations';

// Lazy loading with mobile-specific optimizations
export const createLazyComponent = <T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: ComponentType
): ComponentType<any> => {
  // For low-end devices, load components immediately to avoid loading delays
  if (isLowEndDevice()) {
    let Component: T | null = null;
    importFn().then(module => {
      Component = module.default;
    });

    return (props: any) => {
      if (Component) {
        return React.createElement(Component, props);
      }
      return fallback ? React.createElement(fallback, props) : null;
    };
  }

  return lazy(importFn);
};

// Mobile-optimized lazy loading with preloading
export const createPreloadableLazyComponent = <T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  preloadCondition?: () => boolean
) => {
  const LazyComponent = lazy(importFn);

  // Preload component if condition is met
  if (preloadCondition && preloadCondition()) {
    importFn().catch(console.error);
  }

  return LazyComponent;
};

// Lazy load pages with mobile optimizations
export const Pages = {
  Home: createLazyComponent(() => import('../pages/Home'), undefined),

  Post: createLazyComponent(() => import('../pages/Post'), undefined),

  CreatePost: createLazyComponent(
    () =>
      import('../features/posts/pages/CreatePost').then(module => ({ default: module.CreatePost })),
    undefined
  ),

  EditPost: createLazyComponent(
    () => import('../features/posts/pages/EditPost').then(module => ({ default: module.EditPost })),
    undefined
  ),

  Drafts: createPreloadableLazyComponent(
    () => import('../features/posts/pages/Drafts').then(module => ({ default: module.Drafts })),
    () => !isMobileDevice() // Preload on desktop only
  ),

  // Admin components - lazy load only when needed
  ContentFilterAdmin: createLazyComponent(
    () =>
      import('../components/admin/ContentFilterAdmin').then(module => ({
        default: module.ContentFilterAdmin,
      })),
    undefined
  ),

  UsersTable: createLazyComponent(
    () => import('../components/UsersTable').then(module => ({ default: module.UsersTable })),
    undefined
  ),
};

// Lazy load heavy components
export const Components = {
  PostForm: createLazyComponent(
    () =>
      import('../features/posts/components/PostForm').then(module => ({
        default: module.PostForm,
      })),
    undefined
  ),

  // ErrorHandlingDemo removed as it was unused
  // ErrorHandlingDemo: createLazyComponent(
  //   () => import('../components/ErrorHandlingDemo'),
  //   undefined
  // ),
};

// Preload critical components for mobile
export const preloadCriticalComponents = () => {
  if (isMobileDevice()) {
    // Preload essential components for mobile users
    import('../components/SafeImage').catch(console.error);
    import('../features/posts/components/PostList/PostCard').catch(console.error);
    import('../components/ui/container').catch(console.error);
  }
};

// Preload components based on user interaction
export const preloadOnInteraction = {
  createPost: () => {
    import('../features/posts/pages/CreatePost').catch(console.error);
    import('../features/posts/components/PostForm').catch(console.error);
  },

  editPost: () => {
    import('../features/posts/pages/EditPost').catch(console.error);
  },

  viewDrafts: () => {
    import('../features/posts/pages/Drafts').catch(console.error);
  },

  adminPanel: () => {
    import('../components/admin/ContentFilterAdmin').catch(console.error);
    import('../components/UsersTable').catch(console.error);
  },
};

// Resource hints for better loading performance
export const addResourceHints = () => {
  const hints = [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: true },
    { rel: 'dns-prefetch', href: 'http://localhost:4200' }, // API server
  ];

  hints.forEach(hint => {
    const link = document.createElement('link');
    link.rel = hint.rel;
    link.href = hint.href;
    if (hint.crossorigin) link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });
};

// Initialize performance optimizations
export const initPerformanceOptimizations = () => {
  // Add resource hints
  addResourceHints();

  // Preload critical components
  preloadCriticalComponents();

  // Check for IntersectionObserver support (graceful degradation)
  if (!('IntersectionObserver' in window)) {
    console.warn(
      'IntersectionObserver not supported - lazy loading will fall back to immediate loading'
    );
    // The lazy loading hooks will handle this gracefully by loading content immediately
  }

  // Add performance monitoring with proper type casting
  if ('performance' in window && 'PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver(list => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.entryType === 'largest-contentful-paint') {
            console.log('LCP:', entry.startTime);
          }
          if (entry.entryType === 'first-input') {
            // Type assertion for first-input entries
            const fidEntry = entry as any;
            if (fidEntry.processingStart) {
              console.log('FID:', fidEntry.processingStart - entry.startTime);
            }
          }
          if (entry.entryType === 'layout-shift') {
            // Type assertion for layout-shift entries
            const clsEntry = entry as any;
            if (clsEntry.value !== undefined) {
              console.log('CLS:', clsEntry.value);
            }
          }
        });
      });

      observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
    } catch (error) {
      console.warn('Performance monitoring not available:', error);
    }
  }
};
