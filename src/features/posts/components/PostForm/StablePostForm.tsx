/**
 * Stable Post Form Wrapper
 * Prevents unnecessary re-renders and cursor jumping issues
 */

import React, { memo, useMemo } from 'react';
import { PostForm } from './index';
import { CreatePostInput, UpdatePostInput, PostData } from '../../types/post.types';

interface StablePostFormProps {
  mode: 'create' | 'edit';
  initialData?: Partial<PostData>;
  onSubmit?: (data: CreatePostInput | UpdatePostInput) => Promise<void>;
  onCancel?: () => void;
  className?: string;
}

// Memoized component to prevent unnecessary re-renders
const StablePostForm = memo(function StablePostForm({
  mode,
  initialData,
  onSubmit,
  onCancel,
  className = '',
}: StablePostFormProps) {
  // Memoize the initial data to prevent re-renders when parent re-renders
  const memoizedInitialData = useMemo(() => {
    if (!initialData) return undefined;
    
    // Create a stable reference for the initial data
    return {
      id: initialData.id,
      title: initialData.title || '',
      summary: initialData.summary || '',
      content: initialData.content || '',
      coverImage: initialData.coverImage,
      categories: initialData.categories || [],
      tags: initialData.tags || [],
      status: initialData.status,
      visibility: initialData.visibility,
      contentBlocks: initialData.contentBlocks || [],
    };
  }, [
    initialData?.id,
    initialData?.title,
    initialData?.summary,
    initialData?.content,
    initialData?.coverImage,
    initialData?.status,
    initialData?.visibility,
    // Don't include arrays/objects in deps as they change reference
    // We'll handle them in the component
  ]);

  return (
    <PostForm
      mode={mode}
      initialData={memoizedInitialData}
      onSubmit={onSubmit}
      onCancel={onCancel}
      className={className}
    />
  );
}, (prevProps, nextProps) => {
  // Custom comparison function to prevent unnecessary re-renders
  if (prevProps.mode !== nextProps.mode) return false;
  if (prevProps.className !== nextProps.className) return false;
  
  // Compare initial data more carefully
  const prevData = prevProps.initialData;
  const nextData = nextProps.initialData;
  
  if (!prevData && !nextData) return true;
  if (!prevData || !nextData) return false;
  
  // Compare key fields that matter for form state
  const keyFields = ['id', 'title', 'summary', 'content', 'status', 'visibility'];
  for (const field of keyFields) {
    if (prevData[field as keyof typeof prevData] !== nextData[field as keyof typeof nextData]) {
      return false;
    }
  }
  
  // Compare arrays by length and content - optimized version
  const arraysEqual = (a: any[] | undefined, b: any[] | undefined): boolean => {
    if (!a && !b) return true;
    if (!a || !b) return false;
    if (a.length !== b.length) return false;
    
    // For small arrays, compare directly
    if (a.length <= 5) {
      return JSON.stringify(a) === JSON.stringify(b);
    }
    
    // For larger arrays, do a shallow comparison first
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) {
        // If shallow comparison fails, fall back to JSON comparison
        return JSON.stringify(a) === JSON.stringify(b);
      }
    }
    return true;
  };
  
  if (!arraysEqual(prevData.tags, nextData.tags)) return false;
  if (!arraysEqual(prevData.categories, nextData.categories)) return false;
  if (!arraysEqual(prevData.contentBlocks, nextData.contentBlocks)) return false;
  
  return true;
});

export { StablePostForm };