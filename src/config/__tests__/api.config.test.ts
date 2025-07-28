/**
 * API Config Tests
 * Tests for image URL handling and fallback mechanisms
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  getImageUrl, 
  validateImageUrl, 
  getOptimizedImageUrl, 
  getFallbackImageUrl, 
  getValidImageUrl,
  IMAGE_FALLBACKS 
} from '../api.config';

// Mock environment variables
vi.mock('../../lib/env', () => ({
  env: {
    VITE_IMAGE_BASE_URL: 'http://localhost:4200',
  },
}));

describe('getImageUrl', () => {
  it('returns placeholder for null or undefined input', () => {
    expect(getImageUrl(null)).toBe('/placeholder.svg');
    expect(getImageUrl(undefined)).toBe('/placeholder.svg');
    expect(getImageUrl('')).toBe('/placeholder.svg');
    expect(getImageUrl('   ')).toBe('/placeholder.svg');
  });

  it('returns full URLs unchanged', () => {
    const httpUrl = 'http://example.com/image.jpg';
    const httpsUrl = 'https://example.com/image.jpg';
    
    expect(getImageUrl(httpUrl)).toBe(httpUrl);
    expect(getImageUrl(httpsUrl)).toBe(httpsUrl);
  });

  it('returns data URLs unchanged', () => {
    const dataUrl = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...';
    expect(getImageUrl(dataUrl)).toBe(dataUrl);
  });

  it('returns blob URLs unchanged', () => {
    const blobUrl = 'blob:http://localhost:3000/12345678-1234-1234-1234-123456789012';
    expect(getImageUrl(blobUrl)).toBe(blobUrl);
  });

  it('returns absolute paths unchanged', () => {
    const absolutePath = '/images/test.jpg';
    expect(getImageUrl(absolutePath)).toBe(absolutePath);
  });

  it('constructs server URLs for relative paths', () => {
    expect(getImageUrl('test.jpg')).toBe('http://localhost:4200/uploads/test.jpg');
    expect(getImageUrl('uploads/test.jpg')).toBe('http://localhost:4200/uploads/test.jpg');
  });

  it('handles paths with leading slashes', () => {
    expect(getImageUrl('/test.jpg')).toBe('/test.jpg');
    expect(getImageUrl('//test.jpg')).toBe('http://localhost:4200/uploads/test.jpg');
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
    vi.clearAllMocks();
  });

  it('returns false for placeholder URLs', async () => {
    const result = validateImageUrl('/placeholder.svg');
    expect(result).resolves.toBe(false);
  });

  it('returns false for empty URLs', async () => {
    const result = validateImageUrl('');
    expect(result).resolves.toBe(false);
  });

  it('returns true for valid images', async () => {
    const promise = validateImageUrl('http://example.com/image.jpg');
    
    // Simulate successful image load
    setTimeout(() => {
      if (mockImage.onload) mockImage.onload();
    }, 100);

    vi.advanceTimersByTime(100);
    
    await expect(promise).resolves.toBe(true);
  });

  it('returns false for invalid images', async () => {
    const promise = validateImageUrl('http://example.com/invalid.jpg');
    
    // Simulate image error
    setTimeout(() => {
      if (mockImage.onerror) mockImage.onerror();
    }, 100);

    vi.advanceTimersByTime(100);
    
    await expect(promise).resolves.toBe(false);
  });

  it('times out after 5 seconds', async () => {
    const promise = validateImageUrl('http://example.com/slow-image.jpg');
    
    // Don't trigger onload or onerror, let it timeout
    vi.advanceTimersByTime(5000);
    
    await expect(promise).resolves.toBe(false);
  });
});

describe('getOptimizedImageUrl', () => {
  it('returns placeholder for null input', () => {
    expect(getOptimizedImageUrl(null)).toBe('/placeholder.svg');
  });

  it('returns external URLs unchanged', () => {
    const externalUrl = 'https://example.com/image.jpg';
    expect(getOptimizedImageUrl(externalUrl)).toBe(externalUrl);
  });

  it('adds optimization parameters for local images', () => {
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

  it('returns base URL when no options provided', () => {
    const result = getOptimizedImageUrl('test.jpg');
    expect(result).toBe('http://localhost:4200/uploads/test.jpg');
  });
});

describe('getFallbackImageUrl', () => {
  it('returns correct fallback URLs', () => {
    expect(getFallbackImageUrl('primary')).toBe(IMAGE_FALLBACKS.primary);
    expect(getFallbackImageUrl('secondary')).toBe(IMAGE_FALLBACKS.secondary);
    expect(getFallbackImageUrl('error')).toBe(IMAGE_FALLBACKS.error);
    expect(getFallbackImageUrl('user')).toBe(IMAGE_FALLBACKS.user);
  });

  it('returns primary fallback by default', () => {
    expect(getFallbackImageUrl()).toBe(IMAGE_FALLBACKS.primary);
  });
});

describe('getValidImageUrl', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns first valid URL from array', async () => {
    // Mock validateImageUrl to return true for the second URL
    const mockValidateImageUrl = vi.fn()
      .mockResolvedValueOnce(false) // First URL fails
      .mockResolvedValueOnce(true); // Second URL succeeds

    vi.doMock('../api.config', async () => {
      const actual = await vi.importActual('../api.config');
      return {
        ...actual,
        validateImageUrl: mockValidateImageUrl,
      };
    });

    const urls = ['invalid.jpg', 'valid.jpg', 'backup.jpg'];
    const result = await getValidImageUrl(urls);
    
    expect(result).toContain('valid.jpg');
  });

  it('returns fallback when all URLs fail', async () => {
    const urls = ['invalid1.jpg', 'invalid2.jpg'];
    const result = await getValidImageUrl(urls);
    
    expect(result).toBe('/placeholder.svg');
  });

  it('skips null and undefined URLs', async () => {
    const urls = [null, undefined, 'valid.jpg'];
    const result = await getValidImageUrl(urls);
    
    // Should process the valid URL
    expect(result).toContain('valid.jpg');
  });
});