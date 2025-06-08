/**
 * PostList Component
 * Modern post listing with CRUD operations and proper state management
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { usePostContext } from '../../context/PostContext';
import { PostCard } from './PostCard';
import { PostFilters } from './PostFilters';
import { LoadingSpinner } from '../../../ui/LoadingSpinner';
import { ErrorMessage } from '../../../ui/ErrorMessage';
import { EmptyState } from '../../../ui/EmptyState';
import { Pagination } from '../../../ui/Pagination';
import { cn } from '../../../../lib/utils';
import { Plus, RefreshCw } from 'lucide-react';

interface PostListProps {
  className?: string;
  showFilters?: boolean;
  showCreateButton?: boolean;
  pageSize?: number;
  layout?: 'grid' | 'list';
}

export function PostList({
  className = '',
  showFilters = true,
  showCreateButton = true,
  pageSize = 12,
  layout = 'grid',
}: PostListProps) {
  const { state, actions } = usePostContext();
  const [currentPage, setCurrentPage] = useState(1);

  // Load posts on mount and when filters change
  useEffect(() => {
    actions.fetchPosts(state.filters, currentPage);
  }, [actions, state.filters, currentPage]);

  // Load categories for filters
  useEffect(() => {
    actions.fetchCategories();
  }, [actions]);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle refresh
  const handleRefresh = () => {
    actions.fetchPosts(state.filters, currentPage);
  };

  // Handle filter change
  const handleFilterChange = (filters: any) => {
    actions.setFilters(filters);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const isLoading = state.loading.isFetching;
  const hasError = state.errors.fetch;
  const posts = state.posts;
  const pagination = state.pagination;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Blog Posts
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {pagination.total > 0 
              ? `${pagination.total} post${pagination.total !== 1 ? 's' : ''} found`
              : 'No posts found'
            }
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            <RefreshCw className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')} />
            Refresh
          </button>

          {/* Create Post Button */}
          {showCreateButton && (
            <Link
              to="/posts/create"
              className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md text-sm font-medium transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Post
            </Link>
          )}
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <PostFilters
          filters={state.filters}
          categories={state.categories}
          onFilterChange={handleFilterChange}
          isLoading={isLoading}
        />
      )}

      {/* Error State */}
      {hasError && (
        <ErrorMessage
          title="Failed to load posts"
          message={hasError.message}
          onRetry={handleRefresh}
        />
      )}

      {/* Loading State */}
      {isLoading && posts.length === 0 && (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !hasError && posts.length === 0 && (
        <EmptyState
          title="No posts found"
          description="There are no posts matching your criteria. Try adjusting your filters or create a new post."
          action={
            showCreateButton ? (
              <Link
                to="/posts/create"
                className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md text-sm font-medium"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create First Post
              </Link>
            ) : undefined
          }
        />
      )}

      {/* Posts Grid/List */}
      {posts.length > 0 && (
        <div
          className={cn(
            layout === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
              : 'space-y-4'
          )}
        >
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              layout={layout}
              onEdit={(id) => {
                // Handle edit - could navigate to edit page or open modal
                window.location.href = `/posts/${id}/edit`;
              }}
              onDelete={async (id) => {
                if (window.confirm('Are you sure you want to delete this post?')) {
                  const success = await actions.deletePost(id, true); // Soft delete
                  if (success) {
                    // Refresh the list
                    actions.fetchPosts(state.filters, currentPage);
                  }
                }
              }}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
            showInfo={true}
            totalItems={pagination.total}
            itemsPerPage={pagination.limit}
          />
        </div>
      )}

      {/* Loading overlay for subsequent loads */}
      {isLoading && posts.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg">
            <LoadingSpinner size="md" />
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Loading posts...</p>
          </div>
        </div>
      )}
    </div>
  );
}
