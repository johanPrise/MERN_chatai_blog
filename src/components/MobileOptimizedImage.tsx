/**
 * Mobile Optimized Image Component
 * Combines SafeImage with mobile-specific performance optimizations
 */

import React, { useState, useEffect } from 'react';
import SafeImage, { SafeImageProps } from './SafeImage';
import { useLazyLoading } from '../hooks/useLazyLoading';
import { isMobileDevice, isLowEndDevice } from '../utils/mobileOptimizations';
import { mobileImageOptimizations } from '../utils/imageCompression';
import { cn } from '../lib/utils';

interface MobileOptimizedImageProps extends Omit<SafeImageProps, 'loading' | 'quality' | 'format'> {
  priority?: boolean;
  enableLazyLoading?: boolean;
  mobileQuality?: number;
  desktopQuality?: number;
  generatePlaceholder?: boolean;
}

export function MobileOptimizedImage({
  src,
  alt,
  className,
  width,
  height,
  priority = false,
  enableLazyLoading = true,
  mobileQuality = 70,
  desktopQuality = 85,
  generatePlaceholder = true,
  ...props
}: MobileOptimizedImageProps) {
  const [placeholderSrc, setPlaceholderSrc] = useState<string>('');
  const { ref, isIntersecting } = useLazyLoading<HTMLDivElement>({
    disabled: !enableLazyLoading || priority || isLowEndDevice(),
    threshold: 0.1,
    rootMargin: isMobileDevice() ? '50px' : '100px',
  });

  // Generate placeholder for progressive loading
  useEffect(() => {
    if (generatePlaceholder && width && height && isMobileDevice()) {
      const placeholder = mobileImageOptimizations.generatePlaceholder(
        typeof width === 'number' ? width : 400,
        typeof height === 'number' ? height : 300
      );
      setPlaceholderSrc(placeholder);
    }
  }, [generatePlaceholder, width, height]);

  // Determine if image should load
  const shouldLoad = priority || !enableLazyLoading || isIntersecting || isLowEndDevice();

  // Get mobile-optimized settings
  const mobileSettings = isMobileDevice() ? mobileImageOptimizations.getMobileSettings() : {};

  const imageProps: SafeImageProps = {
    ...props,
    src: shouldLoad ? src : placeholderSrc || undefined,
    alt,
    className: cn('transition-opacity duration-300', !shouldLoad && 'opacity-50', className),
    width,
    height,
    loading: priority ? 'eager' : 'lazy',
    quality: isMobileDevice() ? mobileQuality : desktopQuality,
    format: 'auto',
    responsive: true,
    priority,
    ...mobileSettings,
  };

  return (
    <div ref={ref} className="relative">
      <SafeImage {...imageProps} />

      {/* Loading indicator for mobile */}
      {isMobileDevice() && !shouldLoad && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          <div className="animate-pulse">
            <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
          </div>
        </div>
      )}
    </div>
  );
}

// Hook for mobile-optimized image preloading
export function useMobileImagePreload(src: string, priority: boolean = false) {
  useEffect(() => {
    if (!src || !priority) return;

    // Only preload on desktop or high-end mobile devices
    if (isMobileDevice() && isLowEndDevice()) return;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    document.head.appendChild(link);

    return () => {
      try {
        document.head.removeChild(link);
      } catch (error) {
        // Link might have been removed already
      }
    };
  }, [src, priority]);
}

// Mobile-optimized image gallery component
export function MobileImageGallery({
  images,
  className = '',
}: {
  images: Array<{ src: string; alt: string; width?: number; height?: number }>;
  className?: string;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const isMobile = isMobileDevice();

  if (isMobile) {
    // Mobile: Show single image with navigation
    return (
      <div className={cn('relative', className)}>
        <MobileOptimizedImage
          src={images[currentIndex]?.src}
          alt={images[currentIndex]?.alt}
          className="w-full h-auto"
          priority={currentIndex === 0}
          mobileQuality={65}
        />

        {images.length > 1 && (
          <div className="flex justify-center mt-2 space-x-2">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={cn(
                  'w-2 h-2 rounded-full transition-colors',
                  index === currentIndex ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
                )}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Desktop: Show grid
  return (
    <div className={cn('grid grid-cols-2 md:grid-cols-3 gap-4', className)}>
      {images.map((image, index) => (
        <MobileOptimizedImage
          key={index}
          src={image.src}
          alt={image.alt}
          className="w-full h-auto rounded-lg"
          width={image.width}
          height={image.height}
          priority={index < 3} // Prioritize first 3 images
          desktopQuality={80}
        />
      ))}
    </div>
  );
}

export default MobileOptimizedImage;
