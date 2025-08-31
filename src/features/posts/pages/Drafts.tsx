/**
 * Drafts Page
 * Enhanced with global state synchronization for real-time updates
 */

import React, { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { PostProvider, usePostContext } from '../context/PostContext';
import { PostCard } from '../components/PostList/PostCard';
import { PostStatus } from '../types/post.types';
import { UserContext } from '../../../UserContext';
import { cn } from '../../../lib/utils';
import { Plus, RefreshCw, FileText, Edit3 } from 'lucide-react';
import { useGlobalStateEvents, globalStateManager } from '../../../services/globalStateManager';
import { enhancedNavigationService } from '../../../services/enhancedNavigationService';
import { toast } from 'sonner';

interface DraftsProps {
  className?: string;
}

function DraftsContent({ className = '' }: DraftsProps) {
  const { state, actions } = usePostContext();
  const { userInfo, isLoading: authLoading } = UserContext();
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [publishingId, setPublishingId] = useState<string | null>(null);

  // Check access control - only admins and authors can access drafts
  const hasAccess = userInfo && (userInfo.role === 'admin' || userInfo.role === 'author');

  const loadDrafts = React.useCallback(async (page = currentPage) => {
    setIsLoading(true);
    try {
      // Set filters to only show draft posts
      const draftFilters = {
        status: PostStatus.DRAFT
      };
      
      await actions.fetchPosts(draftFilters, page);
    } finally {
      setIsLoading(false);
    }
  }, [actions]);

  // Load draft posts on mount
  useEffect(() => {
    if (hasAccess) {
      loadDrafts(currentPage);
    }
  }, [hasAccess, currentPage]);

  // Subscribe to global state changes for real-time draft updates
  useGlobalStateEvents([
    {
      type: 'POST_UPDATED',
      handler: React.useCallback(({ postId, postData, source }) => {
        console.log('[Drafts] Received post update:', { postId, source, hasData: !!postData });
        
        // If a draft was published (status changed from draft to published)
        if (source === 'publish' && postData.status !== PostStatus.DRAFT) {
          // Refresh drafts list to remove the published post
          loadDrafts();
        }
      }, [loadDrafts])
    },
    {
      type: 'POST_DELETED',
      handler: React.useCallback(({ postId, source }) => {
        console.log('[Drafts] Received post deletion:', { postId, source });
        
        if (source === 'draft-delete') {
          // Refresh drafts list
          loadDrafts();
        }
      }, [loadDrafts])
    },
    {
      type: 'DRAFT_UPDATED',
      handler: React.useCallback(({ postId, postData }) => {
        console.log('[Drafts] Received draft update:', { postId, hasData: !!postData });
        
        // Refresh drafts to show updated content
        loadDrafts();
      }, [loadDrafts])
    }
  ], [loadDrafts, hasAccess])

  // Handle refresh
  const handleRefresh = () => {
    loadDrafts();
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Enhanced delete function with global state synchronization
  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this draft? This action cannot be undone.')) {
      try {
        const success = await actions.deletePost(id, true); // Soft delete
        if (success) {
          toast.success('Draft deleted successfully');
          
          // Global state manager will automatically handle notifications
          // Local state will be updated via PostContext
          
          // Refresh local drafts list to ensure consistency
          await loadDrafts();
        } else {
          toast.error('Failed to delete draft. Please try again.');
        }
      } catch (error) {
        console.error('Delete draft error:', error);
        toast.error('An unexpected error occurred.');
      }
    }
  };

  // Enhanced publish function with global state synchronization
  const handlePublish = async (id: string) => {
    if (window.confirm('Are you sure you want to publish this draft? It will be visible to all users.')) {
      if (publishingId) return; // Prevent multiple simultaneous publishes
      
      setPublishingId(id);
      try {
        const result = await actions.publishPost(id);
        
        if (result) {
          toast.success('Draft published successfully!');
          
          // Global state manager will handle the publication notification
          // This will update Home page and other components automatically
          
          // Refresh the drafts list to remove the published post
          await loadDrafts();
        } else {
          toast.error('Failed to publish draft. Please try again.');
        }
      } catch (error) {
        console.error('Publish draft error:', error);
        toast.error('An unexpected error occurred while publishing.');
      } finally {
        setPublishingId(null);
      }
    }
  };

  // Filter posts to only show drafts (additional safety check)
  // For admins: show all drafts, for authors: show only their own drafts
  const draftPosts = state.posts.filter(post => {
    if (post.status !== PostStatus.DRAFT) return false;
    
    // Admins can see all drafts
    if (userInfo?.role === 'admin') return true;
    
    // Authors can only see their own drafts
    return post.author?.id === userInfo?.id;
  });
  
  const hasError = state.errors.hasError;

  // Helper function to get drafts count message
  const getDraftsCountMessage = () => {
    if (draftPosts.length === 0) return 'No drafts found';
    return `${draftPosts.length} draft${draftPosts.length !== 1 ? 's' : ''} found`;
  };

  // Redirect if user doesn't have access
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className={cn('min-h-screen bg-gray-50 dark:bg-gray-900', className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
              <FileText className="h-8 w-8 mr-3 text-primary-600" />
              My Drafts
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {getDraftsCountMessage()}
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')} />
              Refresh
            </button>

            {/* Create New Post Button */}
            <Link
              to="/posts/create"
              className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md text-sm font-medium transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Post
            </Link>
          </div>
        </div>

        {/* Error State */}
        {hasError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="text-red-400 mr-3">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Failed to load drafts
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  {state.errors.lastError?.message || 'An unexpected error occurred'}
                </p>
              </div>
              <button
                onClick={handleRefresh}
                className="ml-auto text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && draftPosts.length === 0 && (
          <div className="flex justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading your drafts...</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !hasError && draftPosts.length === 0 && (
          <div className="text-center py-12">
            <div className="mx-auto h-24 w-24 text-gray-400 mb-4">
              <Edit3 className="h-full w-full" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No drafts yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              You haven't created any draft posts yet. Start writing your first post and save it as a draft to see it here.
            </p>
            <Link
              to="/posts/create"
              className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md text-sm font-medium transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Draft
            </Link>
          </div>
        )}

        {/* Drafts Grid */}
        {draftPosts.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {draftPosts.map((post) => (
              <div key={post.id} className="relative">
                {/* Draft Badge */}
                <div className="absolute top-2 left-2 z-10">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                    <FileText className="h-3 w-3 mr-1" />
                    Draft
                  </span>
                </div>

                <PostCard
                  post={post}
                  layout="grid"
                  linkBase="/posts/edit"
                  linkLabel="Edit Post"
                  onEdit={(id) => {
                    enhancedNavigationService.navigateToEditPost(id);
                  }}
                  onDelete={handleDelete}
                  onPublish={handlePublish}
                  showActions={true}
                  isPublishing={publishingId === post.id}
                  className="pt-8" // Add padding top to accommodate the draft badge
                />
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {(() => {
          const totalPages = Math.ceil(state.pagination.total / state.pagination.limit);
          return totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <nav className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
                >
                  Previous
                </button>
                
                <span className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Page {currentPage} of {totalPages}
                </span>
                
                <button
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
                >
                  Next
                </button>
              </nav>
            </div>
          );
        })()}

        {/* Loading overlay for subsequent loads */}
        {isLoading && draftPosts.length > 0 && (
          <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Loading drafts...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
export
 function Drafts({ className = '' }: DraftsProps) {
  return (
    <PostProvider>
      <DraftsContent className={className} />
    </PostProvider>
  );
}