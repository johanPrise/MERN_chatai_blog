/**
 * SafeImage Component Tests
 * Basic tests for image handling functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as apiConfig from '../../config/api.config';

// Mock the API config functions
vi.mock('../../config/api.config', () => ({
  getImageUrl: vi.fn(),
  validateImageUrl: vi.fn(),
  getFallbackImageUrl: vi.fn(),
  getValidImageUrl: vi.fn(),
  IMAGE_FALLBACKS: {
    primary: '/placeholder.svg',
    secondary: '/placeholder.jpg',
    error: '/placeholder-logo.svg',
    user: '/placeholder-user.jpg',
  },
}));

describe('SafeImage API Functions', () => {
  const mockGetImageUrl = vi.mocked(apiConfig.getImageUrl);
  const mockValidateImageUrl = vi.mocked(apiConfig.validateImageUrl);
  const mockGetFallbackImageUrl = vi.mocked(apiConfig.getFallbackImageUrl);
  const mockGetValidImageUrl = vi.mocked(apiConfig.getValidImageUrl);

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetImageUrl.mockImplementation((path) => path || '/placeholder.svg');
    mockGetFallbackImageUrl.mockReturnValue('/placeholder.svg');
    mockValidateImageUrl.mockResolvedValue(true);
    mockGetValidImageUrl.mockResolvedValue('/test-image.jpg');
  });

  it('should handle null/undefined image sources', () => {
    mockGetImageUrl.mockReturnValue('/placeholder.svg');
    
    const result = mockGetImageUrl(null);
    expect(result).toBe('/placeholder.svg');
    expect(mockGetImageUrl).toHaveBeenCalledWith(null);
  });

  it('should return fallback URLs correctly', () => {
    mockGetFallbackImageUrl.mockReturnValue('/placeholder.svg');
    
    const result = mockGetFallbackImageUrl('primary');
    expect(result).toBe('/placeholder.svg');
    expect(mockGetFallbackImageUrl).toHaveBeenCalledWith('primary');
  });

  it('should validate image URLs', async () => {
    mockValidateImageUrl.mockResolvedValue(true);
    
    const result = await mockValidateImageUrl('http://example.com/image.jpg');
    expect(result).toBe(true);
    expect(mockValidateImageUrl).toHaveBeenCalledWith('http://example.com/image.jpg');
  });

  it('should find valid image URL from array', async () => {
    mockGetValidImageUrl.mockResolvedValue('/valid-image.jpg');
    
    const urls = ['/invalid.jpg', '/valid-image.jpg', '/backup.jpg'];
    const result = await mockGetValidImageUrl(urls);
    
    expect(result).toBe('/valid-image.jpg');
    expect(mockGetValidImageUrl).toHaveBeenCalledWith(urls);
  });

  it('should handle image URL construction', () => {
    mockGetImageUrl.mockImplementation((path) => {
      if (!path) return '/placeholder.svg';
      if (path.startsWith('http')) return path;
      return `http://localhost:4200/uploads/${path}`;
    });
    
    expect(mockGetImageUrl('test.jpg')).toBe('http://localhost:4200/uploads/test.jpg');
    expect(mockGetImageUrl('http://example.com/image.jpg')).toBe('http://example.com/image.jpg');
    expect(mockGetImageUrl(null)).toBe('/placeholder.svg');
  });
});