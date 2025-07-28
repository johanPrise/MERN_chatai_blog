/**
 * Image Compression Utility for Mobile Performance
 * Provides client-side image compression and optimization
 */

interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'webp' | 'png';
  progressive?: boolean;
}

interface CompressionResult {
  blob: Blob;
  dataUrl: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}

export class ImageCompressor {
  private static instance: ImageCompressor;

  public static getInstance(): ImageCompressor {
    if (!ImageCompressor.instance) {
      ImageCompressor.instance = new ImageCompressor();
    }
    return ImageCompressor.instance;
  }

  /**
   * Compress an image file for mobile optimization
   */
  async compressImage(
    file: File,
    options: CompressionOptions = {}
  ): Promise<CompressionResult> {
    const {
      maxWidth = 1200,
      maxHeight = 800,
      quality = 0.8,
      format = 'jpeg',
      progressive = true
    } = options;

    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      img.onload = () => {
        // Calculate optimal dimensions
        const { width, height } = this.calculateOptimalDimensions(
          img.width,
          img.height,
          maxWidth,
          maxHeight
        );

        canvas.width = width;
        canvas.height = height;

        // Enable image smoothing for better quality
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob with compression
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }

            const dataUrl = canvas.toDataURL(`image/${format}`, quality);
            const compressionRatio = (file.size - blob.size) / file.size;

            resolve({
              blob,
              dataUrl,
              originalSize: file.size,
              compressedSize: blob.size,
              compressionRatio
            });
          },
          `image/${format}`,
          quality
        );
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Create responsive image variants for different screen sizes
   */
  async createResponsiveVariants(
    file: File,
    variants: Array<{ width: number; suffix: string; quality?: number }>
  ): Promise<Array<{ variant: string; result: CompressionResult }>> {
    const results: Array<{ variant: string; result: CompressionResult }> = [];

    for (const variant of variants) {
      try {
        const result = await this.compressImage(file, {
          maxWidth: variant.width,
          maxHeight: Math.round(variant.width * 0.75), // 4:3 aspect ratio
          quality: variant.quality || 0.8,
          format: this.getOptimalFormat()
        });

        results.push({
          variant: variant.suffix,
          result
        });
      } catch (error) {
        console.error(`Failed to create variant ${variant.suffix}:`, error);
      }
    }

    return results;
  }

  /**
   * Generate WebP version with JPEG fallback
   */
  async generateWebPWithFallback(
    file: File,
    options: CompressionOptions = {}
  ): Promise<{ webp?: CompressionResult; jpeg: CompressionResult }> {
    const results: { webp?: CompressionResult; jpeg: CompressionResult } = {
      jpeg: await this.compressImage(file, { ...options, format: 'jpeg' })
    };

    // Only generate WebP if supported
    if (this.supportsWebP()) {
      try {
        results.webp = await this.compressImage(file, { ...options, format: 'webp' });
      } catch (error) {
        console.warn('WebP compression failed, using JPEG only:', error);
      }
    }

    return results;
  }

  /**
   * Calculate optimal dimensions maintaining aspect ratio
   */
  private calculateOptimalDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
  ): { width: number; height: number } {
    const aspectRatio = originalWidth / originalHeight;

    let width = originalWidth;
    let height = originalHeight;

    // Scale down if too wide
    if (width > maxWidth) {
      width = maxWidth;
      height = width / aspectRatio;
    }

    // Scale down if too tall
    if (height > maxHeight) {
      height = maxHeight;
      width = height * aspectRatio;
    }

    return {
      width: Math.round(width),
      height: Math.round(height)
    };
  }

  /**
   * Check WebP support
   */
  private supportsWebP(): boolean {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }

  /**
   * Get optimal format based on browser support
   */
  private getOptimalFormat(): 'webp' | 'jpeg' {
    return this.supportsWebP() ? 'webp' : 'jpeg';
  }

  /**
   * Estimate file size before compression
   */
  estimateCompressedSize(
    originalSize: number,
    quality: number,
    scaleFactor: number = 1
  ): number {
    // Rough estimation based on quality and scale
    const qualityFactor = quality;
    const sizeFactor = scaleFactor * scaleFactor; // Area scaling
    return Math.round(originalSize * qualityFactor * sizeFactor);
  }

  /**
   * Validate image file
   */
  validateImageFile(file: File): { valid: boolean; error?: string } {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Unsupported file type. Please use JPEG, PNG, WebP, or GIF.'
      };
    }

    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'File too large. Maximum size is 10MB.'
      };
    }

    return { valid: true };
  }
}

// Utility functions for mobile-specific optimizations
export const mobileImageOptimizations = {
  /**
   * Get mobile-optimized compression settings
   */
  getMobileSettings(): CompressionOptions {
    const isMobile = window.innerWidth <= 768;
    const isLowEnd = (navigator as any).deviceMemory && (navigator as any).deviceMemory < 4;

    return {
      maxWidth: isMobile ? 800 : 1200,
      maxHeight: isMobile ? 600 : 800,
      quality: isLowEnd ? 0.6 : isMobile ? 0.7 : 0.8,
      format: 'jpeg' // More compatible for mobile
    };
  },

  /**
   * Create mobile-optimized variants
   */
  getMobileVariants() {
    return [
      { width: 400, suffix: 'mobile', quality: 0.7 },
      { width: 800, suffix: 'tablet', quality: 0.8 },
      { width: 1200, suffix: 'desktop', quality: 0.85 }
    ];
  },

  /**
   * Progressive loading placeholder
   */
  generatePlaceholder(width: number, height: number): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return '';

    canvas.width = width;
    canvas.height = height;

    // Create a simple gradient placeholder
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#f3f4f6');
    gradient.addColorStop(1, '#e5e7eb');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    return canvas.toDataURL('image/jpeg', 0.1);
  }
};

export default ImageCompressor;