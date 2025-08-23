/**
 * Enhanced Edit Post Page
 * Uses the new post management system with safe navigation
 */

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { StablePostForm } from '../components/PostForm/StablePostForm';
import { PostProvider, usePostContext } from '../context/PostContext';
import { UpdatePostInput, CreatePostInput } from '../types/post.types';
import { useNavigation } from '../hooks/useNavigation';
import { toast } from 'sonner';
import { Loader2, AlertCircle } from 'lucide-react';

function EditPostContent() {
  const { id } = useParams<{ id: string }>();
  const { navigateToPost, navigateToHome, validatePostId } = useNavigation();
  const { state, actions } = usePostContext();
  const { fetchPost } = actions;
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Load post data on mount
  useEffect(() => {
    const loadPost = async () => {
      if (!id || !validatePostId(id)) {
        toast.error('Post ID is required');
        navigateToHome();
        return;
      }

      try {
        await fetchPost(id);
      } catch (error) {
        console.error('Failed to load post:', error);
        toast.error('Failed to load post data');
      } finally {
        setIsInitialLoading(false);
      }
    };

    loadPost();
  }, [id, fetchPost, navigateToHome, validatePostId]);

  // Handle form submission
  const handleSubmit = async (data: UpdatePostInput | CreatePostInput) => {
    if (!id) return;

    try {
      // Since we're in edit mode, we need to ensure we have the id
      const updateData: UpdatePostInput = {
        ...data,
        id: id
      };

      const result = await actions.updatePost(id, updateData);
      
      if (result && result.id) {
        // Validate the post ID before navigation
        if (validatePostId(result.id)) {
          toast.success('Post updated successfully!');
          navigateToPost(result.id, { fallbackRoute: '/' });
        } else {
          console.error('Invalid post ID returned from API:', result.id);
          toast.success('Post updated successfully!');
          navigateToHome({ replace: true });
        }
      } else {
        toast.error('Failed to update post. Please try again.');
        console.error('Post update failed - no result or ID:', result);
      }
    } catch (error) {
      console.error('Update post error:', error);
      toast.error('An unexpected error occurred.');
    }
  };

  // Handle cancel
  const handleCancel = () => {
    if (state.currentPost && validatePostId(state.currentPost.id)) {
      navigateToPost(state.currentPost.id, { fallbackRoute: '/' });
    } else {
      navigateToHome();
    }
  };

  // Show initial loading state
  if (isInitialLoading || state.loading.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary-600 mx-auto" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading post data...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (state.errors.hasError || !state.currentPost) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center max-w-md">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Post Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {state.errors.lastError?.message || 'The post you are looking for does not exist or you do not have permission to edit it.'}
          </p>
          <div className="space-x-3">
            <button
              onClick={() => navigateToHome()}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Go Home
            </button>
            <button
              onClick={() => {
                actions.clearErrors();
                if (id && validatePostId(id)) {
                  actions.fetchPost(id);
                }
              }}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }



  // Show updating state
  if (state.loading.isUpdating) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-4" />
            <p className="text-gray-900 dark:text-gray-100">Updating your post...</p>
          </div>
        </div>
        <StablePostForm
          mode="edit"
          initialData={state.currentPost}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <StablePostForm
        mode="edit"
        initialData={state.currentPost}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  );
}

export function EditPost() {
  return (
    <PostProvider>
      <EditPostContent />
    </PostProvider>
  );
}
