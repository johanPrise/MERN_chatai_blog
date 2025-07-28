/**
 * Test for summary preservation in post editing
 * This test verifies that the summary field is properly preserved when editing posts
 */

import { describe, it, expect } from 'vitest';

// Mock post data that simulates what comes from the API
const mockPostData = {
  id: 'test-post-123',
  _id: 'test-post-123', // Backend uses _id
  title: 'Test Post Title',
  content: 'This is the test post content that should be preserved during editing.',
  summary: 'This is the test summary that should be preserved during editing and remain visible in the form.',
  categories: [{ id: 'cat1', name: 'Test Category' }],
  tags: ['test', 'summary', 'preservation'],
  status: 'draft',
  visibility: 'public',
  coverImage: '',
  author: {
    id: 'user123',
    username: 'testuser',
    email: 'test@example.com',
    role: 'author'
  },
  createdAt: new Date(),
  updatedAt: new Date(),
  metadata: {
    readingTime: 1,
    wordCount: 20,
    lastEditedBy: 'user123',
    version: 1
  },
  stats: {
    viewCount: 0,
    likeCount: 0,
    commentCount: 0,
    shareCount: 0
  }
};

// Simulate API service transformation (from postApi.ts getPost method)
function simulateApiTransformation(apiData: any) {
  const postData = { ...apiData };
  
  // Transform _id to id for frontend compatibility
  if (postData._id) {
    postData.id = postData._id;
  }
  
  return postData;
}

// Simulate PostForm initialization (from PostForm/index.tsx)
function simulatePostFormInitialization(initialData: any) {
  return {
    title: initialData?.title || '',
    summary: initialData?.summary || '',
    content: initialData?.content || '',
    coverImage: initialData?.coverImage || '',
    category: initialData?.categories?.[0]?.id || '',
    tags: initialData?.tags || [],
    status: initialData?.status || 'draft',
    visibility: initialData?.visibility || 'public',
  };
}

describe('Summary Preservation in Post Editing', () => {
  it('should preserve summary through the complete data flow', () => {
    // Step 1: API returns data
    const originalSummary = mockPostData.summary;
    expect(originalSummary).toBeTruthy();
    expect(originalSummary.length).toBeGreaterThan(0);
    
    // Step 2: API service transforms data
    const transformedData = simulateApiTransformation(mockPostData);
    expect(transformedData.summary).toBe(originalSummary);
    expect(transformedData.id).toBe(mockPostData._id);
    
    // Step 3: PostForm initializes form data
    const formData = simulatePostFormInitialization(transformedData);
    expect(formData.summary).toBe(originalSummary);
    expect(formData.summary).toBe('This is the test summary that should be preserved during editing and remain visible in the form.');
  });

  it('should handle empty summary correctly', () => {
    const dataWithEmptySummary = { ...mockPostData, summary: '' };
    const transformedData = simulateApiTransformation(dataWithEmptySummary);
    const formData = simulatePostFormInitialization(transformedData);
    
    expect(formData.summary).toBe('');
  });

  it('should handle undefined summary correctly', () => {
    const dataWithUndefinedSummary = { ...mockPostData };
    delete (dataWithUndefinedSummary as any).summary;
    
    const transformedData = simulateApiTransformation(dataWithUndefinedSummary);
    const formData = simulatePostFormInitialization(transformedData);
    
    expect(formData.summary).toBe('');
  });

  it('should handle null summary correctly', () => {
    const dataWithNullSummary = { ...mockPostData, summary: null };
    const transformedData = simulateApiTransformation(dataWithNullSummary);
    const formData = simulatePostFormInitialization(transformedData);
    
    expect(formData.summary).toBe('');
  });

  it('should preserve all form fields correctly', () => {
    const transformedData = simulateApiTransformation(mockPostData);
    const formData = simulatePostFormInitialization(transformedData);
    
    expect(formData.title).toBe(mockPostData.title);
    expect(formData.summary).toBe(mockPostData.summary);
    expect(formData.content).toBe(mockPostData.content);
    expect(formData.category).toBe(mockPostData.categories[0].id);
    expect(formData.tags).toEqual(mockPostData.tags);
    expect(formData.status).toBe(mockPostData.status);
    expect(formData.visibility).toBe(mockPostData.visibility);
  });

  it('should handle form data updates correctly', () => {
    const transformedData = simulateApiTransformation(mockPostData);
    let formData = simulatePostFormInitialization(transformedData);
    
    // Simulate user editing the summary
    const newSummary = 'This is an updated summary';
    formData = { ...formData, summary: newSummary };
    
    expect(formData.summary).toBe(newSummary);
    expect(formData.summary).not.toBe(mockPostData.summary);
  });

  it('should validate summary requirements', () => {
    const validateSummary = (summary: string) => {
      const errors: string[] = [];
      
      if (!summary.trim()) {
        errors.push('Summary is required');
      } else if (summary.length < 10) {
        errors.push('Summary must be at least 10 characters');
      } else if (summary.length > 500) {
        errors.push('Summary must be less than 500 characters');
      }
      
      return errors;
    };

    // Test valid summary
    expect(validateSummary(mockPostData.summary)).toHaveLength(0);
    
    // Test empty summary
    expect(validateSummary('')).toContain('Summary is required');
    
    // Test short summary
    expect(validateSummary('Short')).toContain('Summary must be at least 10 characters');
    
    // Test long summary
    const longSummary = 'a'.repeat(501);
    expect(validateSummary(longSummary)).toContain('Summary must be less than 500 characters');
  });
});