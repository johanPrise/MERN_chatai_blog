/**
 * Image Integration Tests
 * Tests for the actual image handling functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  getImageUrl, 
  validateImageUrl, 
  getOptimizedImageUrl, 
  getFallbackImageUrl, 
  getValidImageUrl,
  IMAGE_FALLBACKS 
} from '../../config/api.config';

describe('Image Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('getImageUrl', () => {
    it('should return placeholder for null/undefined/empty inputs', () => {
      expect(getImageUrl(null)).toBe('/placeholder.svg');
      expect(getImageUrl(undefined)).toBe('/placeholder.svg');
      expect(getImageUrl('')).toBe('/placeholder.svg');
      expect(getImageUrl('   ')).toBe('/placeholder.svg');
    });

    it('should return full URLs unchanged', () => {
      const httpUrl = 'http://example.com/image.jpg';
      const httpsUrl = 'https://example.com/image.jpg';
      
      expect(getImageUrl(httpUrl)).toBe(httpUrl);
      expect(getImageUrl(httpsUrl)).toBe(httpsUrl);
    });

    it('should return data URLs unchanged', () => {
      const dataUrl = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...';
      expect(getImageUrl(dataUrl)).toBe(dataUrl);
    });

    it('should return blob URLs unchanged', () => {
      const blobUrl = 'blob:http://localhost:3000/12345678-1234-1234-1234-123456789012';
      expect(getImageUrl(blobUrl)).toBe(blobUrl);
    });

    it('should return absolute paths unchanged', () => {
      const absolutePath = '/images/test.jpg';
      expect(getImageUrl(absolutePath)).toBe(absolutePath);
    });

    it('should construct server URLs for relative paths', () => {
      expect(getImageUrl('test.jpg')).toBe('http://localhost:4200/uploads/test.jpg');
      expect(getImageUrl('uploads/test.jpg')).toBe('http://localhost:4200/uploads/test.jpg');
    });
  });

  describe('getFallbackImageUrl', () => {
    it('should return correct fallback URLs', () => {
      expect(getFallbackImageUrl('primary')).toBe(IMAGE_FALLBACKS.primary);
      expect(getFallbackImageUrl('secondary')).toBe(IMAGE_FALLBACKS.secondary);
      expect(getFallbackImageUrl('error')).toBe(IMAGE_FALLBACKS.error);
      expect(getFallbackImageUrl('user')).toBe(IMAGE_FALLBACKS.user);
    });

    it('should return primary fallback by default', () => {
      expect(getFallbackImageUrl()).toBe(IMAGE_FALLBACKS.primary);
    });
  });

  describe('getOptimizedImageUrl', () => {
    it('should return placeholder for null input', () => {
      expect(getOptimizedImageUrl(null)).toBe('/placeholder.svg');
    });

    it('should return external URLs unchanged', () => {
      const externalUrl = 'https://example.com/image.jpg';
      expect(getOptimizedImageUrl(externalUrl)).toBe(externalUrl);
    });

    it('should return base URL when no options provided', () => {
      const result = getOptimizedImageUrl('test.jpg');
      expect(result).toBe('http://localhost:4200/uploads/test.jpg');
    });

    it('should add optimization parameters for local images', () => {
      const result = getOptimizedImageUrl('test.jpg', {
        width: 300,
        height: 200,
        quality: 80,
        format: 'webp'
      });
      
      expect(result).toContain('w=300');
      expect(result).toContain('h=200');
      expect(result).toContain('q=80');
      expect(result).toContain('f=webp');
    });
  });

  describe('validateImageUrl', () => {
    let mockImage: any;

    beforeEach(() => {
      mockImage = {
        onload: null,
        onerror: null,
        src: '',
      };

      global.Image = vi.fn(() => mockImage) as any;
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return false for placeholder URLs', async () => {
      const result = validateImageUrl('/placeholder.svg');
      expect(result).resolves.toBe(false);
    });

    it('should return false for empty URLs', async () => {
      const result = validateImageUrl('');
      expect(result).resolves.toBe(false);
    });

    it('should return true for valid images', async () => {
      const promise = validateImageUrl('http://example.com/image.jpg');
      
      // Simulate successful image load
      setTimeout(() => {
        if (mockImage.onload) mockImage.onload();
      }, 100);

      vi.advanceTimersByTime(100);
      
      await expect(promise).resolves.toBe(true);
    });

    it('should return false for invalid images', async () => {
      const promise = validateImageUrl('http://example.com/invalid.jpg');
      
      // Simulate image error
      setTimeout(() => {
        if (mockImage.onerror) mockImage.onerror();
      }, 100);

      vi.advanceTimersByTime(100);
      
      await expect(promise).resolves.toBe(false);
    });

    it('should timeout after 5 seconds', async () => {
      const promise = validateImageUrl('http://example.com/slow-image.jpg');
      
      // Don't trigger onload or onerror, let it timeout
      vi.advanceTimersByTime(5000);
      
      await expect(promise).resolves.toBe(false);
    });
  });
});