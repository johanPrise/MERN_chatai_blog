/**
 * Enhanced Edit Post Page
 * Uses the new post management system
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PostForm } from '../components/PostForm';
import { PostProvider, usePostContext } from '../context/PostContext';
import { UpdatePostInput } from '../types/post.types';
import { toast } from 'sonner';
import { Loader2, AlertCircle } from 'lucide-react';

function EditPostContent() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state, actions } = usePostContext();
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Load post data on mount
  useEffect(() => {
    const loadPost = async () => {
      if (!id) {
        toast.error('Post ID is required');
        navigate('/');
        return;
      }

      try {
        await actions.fetchPost(id);
      } catch (error) {
        console.error('Failed to load post:', error);
        toast.error('Failed to load post data');
      } finally {
        setIsInitialLoading(false);
      }
    };

    loadPost();
  }, [id, actions, navigate]);

  // Handle form submission
  const handleSubmit = async (data: UpdatePostInput) => {
    if (!id) return;

    try {
      const result = await actions.updatePost(id, data);
      
      if (result) {
        toast.success('Post updated successfully!');
        navigate(`/post/${result.id}`);
      } else {
        toast.error('Failed to update post. Please try again.');
      }
    } catch (error) {
      console.error('Update post error:', error);
      toast.error('An unexpected error occurred.');
    }
  };

  // Handle cancel
  const handleCancel = () => {
    if (state.currentPost) {
      navigate(`/post/${state.currentPost.id}`);
    } else {
      navigate('/');
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
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Go Home
            </button>
            <button
              onClick={() => {
                actions.clearErrors();
                if (id) {
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
        <PostForm
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
      <PostForm
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
