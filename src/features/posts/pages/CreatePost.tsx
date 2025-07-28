/**
 * Enhanced Create Post Page
 * Uses the new post management system with safe navigation
 */

import React, { useEffect } from 'react';
import { PostForm } from '../components/PostForm';
import { PostProvider, usePostContext } from '../context/PostContext';
import { CreatePostInput, UpdatePostInput } from '../types/post.types';
import { useNavigation } from '../hooks/useNavigation';
import { toast } from 'sonner';

export function CreatePost() {
  return (
    <PostProvider>
      <CreatePostContent />
    </PostProvider>
  );
}

function CreatePostContent() {
  const { navigateToPost, navigateToHome, validatePostId } = useNavigation();
  const { state, actions } = usePostContext();

  // Handle form submission
  const handleSubmit = async (data: CreatePostInput | UpdatePostInput) => {
    try {
      // Since this is a create form, we can assert the type
      const createData = data as CreatePostInput;
      const result = await actions.createPost(createData);
      
      if (result && result.id) {
        // Validate the post ID before navigation
        if (validatePostId(result.id)) {
          toast.success('Post created successfully!');
          navigateToPost(result.id, { fallbackRoute: '/' });
        } else {
          console.error('Invalid post ID returned from API:', result.id);
          toast.success('Post created successfully!');
          navigateToHome({ replace: true });
        }
      } else {
        toast.error('Failed to create post. Please try again.');
        console.error('Post creation failed - no result or ID:', result);
      }
    } catch (error) {
      console.error('Create post error:', error);
      toast.error('An unexpected error occurred.');
    }
  };

  // Handle cancel
  const handleCancel = () => {
    navigateToHome();
  };

  // Show loading state
  if (state.loading.isCreating) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Creating your post...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (state.errors.hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Something went wrong
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {state.errors.lastError?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={() => {
              actions.clearErrors();
              navigateToHome();
            }}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <PostForm
        mode="create"
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  );
}
