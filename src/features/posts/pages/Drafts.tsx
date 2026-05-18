/**
 * Drafts Page
 * Enhanced with global state synchronization for real-time updates
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { PostProvider, usePostContext } from '../context/PostContext';
import { PostCard } from '../components/PostList/PostCard';
import { PostStatus, type PostData } from '../types/post.types';
import { UserContext } from '../../../UserContext';
import { cn } from '../../../lib/utils';
import { Plus, RefreshCw, FileText, Edit3 } from 'lucide-react';
import { useGlobalStateEvents } from '../../../services/globalStateManager';
import { enhancedNavigationService } from '../../../services/enhancedNavigationService';
import { showError, showSuccess } from '../../../lib/toast-helpers';
import { devLog, devError } from '../../../lib/devLogger';

interface DraftsProps {
  className?: string;
}

type DraftsContentProps = Readonly<DraftsProps>;

type DraftsHeaderProps = Readonly<{
  countMessage: string;
  isLoading: boolean;
  onRefresh: () => void;
}>;

type DraftsErrorProps = Readonly<{
  errorMessage?: string;
  onRetry: () => void;
}>;

type DraftsGridProps = Readonly<{
  posts: PostData[];
  publishingId: string | null;
  onDelete: (id: string) => void;
  onPublish: (id: string) => void;
}>;

type DraftsPaginationProps = Readonly<{
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}>;

const getDraftsCountMessage = (draftCount: number) => {
  if (draftCount === 0) return 'No drafts found';
  const noun = draftCount === 1 ? 'draft' : 'drafts';
  return `${draftCount} ${noun} found`;
};

const canAccessDrafts = (role?: string) => role === 'admin' || role === 'author';

const isVisibleDraft = (post: PostData, userId?: string, role?: string) => {
  if (post.status !== PostStatus.DRAFT) return false;
  if (role === 'admin') return true;
  return post.author?.id === userId;
};

type LoadingMessageProps = Readonly<{
  message: string;
  spinnerClassName?: string;
  textClassName?: string;
}>;

function LoadingMessage({
  message,
  spinnerClassName = 'h-12 w-12',
  textClassName = 'mt-4',
}: LoadingMessageProps) {
  return (
    <div className="text-center">
      <div className={cn('animate-spin rounded-full border-b-2 border-primary-600 mx-auto', spinnerClassName)}></div>
      <p className={cn('text-gray-600 dark:text-gray-400', textClassName)}>{message}</p>
    </div>
  );
}

function FullPageLoader() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <LoadingMessage message="Loading..." />
    </div>
  );
}

function DraftsHeader({ countMessage, isLoading, onRefresh }: DraftsHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
          <FileText className="h-8 w-8 mr-3 text-primary-600" />
          My Drafts
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">{countMessage}</p>
      </div>

      <div className="flex items-center space-x-3">
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')} />
          Refresh
        </button>

        <Link
          to="/posts/create"
          className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md text-sm font-medium transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Post
        </Link>
      </div>
    </div>
  );
}

function DraftsError({ errorMessage, onRetry }: DraftsErrorProps) {
  return (
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
            {errorMessage || 'An unexpected error occurred'}
          </p>
        </div>
        <button
          onClick={onRetry}
          className="ml-auto text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

function DraftsInitialLoader() {
  return (
    <div className="flex justify-center py-12">
      <LoadingMessage message="Loading your drafts..." />
    </div>
  );
}

function EmptyDrafts() {
  return (
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
  );
}

function DraftsGrid({ posts, publishingId, onDelete, onPublish }: DraftsGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {posts.map((post) => (
        <div key={post.id} className="relative">
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
            onEdit={enhancedNavigationService.navigateToEditPost}
            onDelete={onDelete}
            onPublish={onPublish}
            showActions={true}
            isPublishing={publishingId === post.id}
            className="pt-8"
          />
        </div>
      ))}
    </div>
  );
}

function DraftsPagination({ currentPage, totalPages, onPageChange }: DraftsPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-center mt-8">
      <nav className="flex items-center space-x-2">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
        >
          Previous
        </button>

        <span className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          Page {currentPage} of {totalPages}
        </span>

        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
        >
          Next
        </button>
      </nav>
    </div>
  );
}

function DraftsLoadingOverlay() {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg">
        <LoadingMessage
          message="Loading drafts..."
          spinnerClassName="h-8 w-8"
          textClassName="mt-2 text-sm"
        />
      </div>
    </div>
  );
}

function DraftsContent({ className = '' }: DraftsContentProps) {
  const { state, actions } = usePostContext();
  const { userInfo, isLoading: authLoading } = UserContext();
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [publishingId, setPublishingId] = useState<string | null>(null);

  const hasAccess = canAccessDrafts(userInfo?.role);

  const loadDrafts = useCallback(async (page = currentPage) => {
    setIsLoading(true);
    try {
      const draftFilters = {
        status: PostStatus.DRAFT
      };
      
      await actions.fetchPosts(draftFilters, page);
    } finally {
      setIsLoading(false);
    }
  }, [actions, currentPage]);

  useEffect(() => {
    if (hasAccess) {
      loadDrafts();
    }
  }, [hasAccess, loadDrafts]);

  useGlobalStateEvents([
    {
      type: 'POST_UPDATED',
      handler: useCallback(({ postId, postData, source }) => {
        devLog('[Drafts] Received post update:', { postId, source, hasData: !!postData });
        
        if (source === 'publish' && postData.status !== PostStatus.DRAFT) {
          loadDrafts();
        }
      }, [loadDrafts])
    },
    {
      type: 'POST_DELETED',
      handler: useCallback(({ postId, source }) => {
        devLog('[Drafts] Received post deletion:', { postId, source });
        
        if (source === 'draft-delete') {
          loadDrafts();
        }
      }, [loadDrafts])
    },
    {
      type: 'DRAFT_UPDATED',
      handler: useCallback(({ postId, postData }) => {
        devLog('[Drafts] Received draft update:', { postId, hasData: !!postData });
        loadDrafts();
      }, [loadDrafts])
    }
  ], [loadDrafts, hasAccess])

  const handleRefresh = () => {
    loadDrafts();
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleDelete = async (id: string) => {
    if (globalThis.confirm('Are you sure you want to delete this draft? This action cannot be undone.')) {
      try {
        const success = await actions.deletePost(id, true);
        if (success) {
          showSuccess('Draft deleted successfully');
          await loadDrafts();
        } else {
          showError('Failed to delete draft. Please try again.');
        }
      } catch (error) {
        devError('Delete draft error:', error);
        showError('An unexpected error occurred.');
      }
    }
  };

  const handlePublish = async (id: string) => {
    if (globalThis.confirm('Are you sure you want to publish this draft? It will be visible to all users.')) {
      if (publishingId) return;
      
      setPublishingId(id);
      try {
        const result = await actions.publishPost(id);
        
        if (result) {
          showSuccess('Draft published successfully!');
          await loadDrafts();
        } else {
          showError('Failed to publish draft. Please try again.');
        }
      } catch (error) {
        devError('Publish draft error:', error);
        showError('An unexpected error occurred while publishing.');
      } finally {
        setPublishingId(null);
      }
    }
  };

  const draftPosts = useMemo(
    () => state.posts.filter((post) => isVisibleDraft(post, userInfo?.id, userInfo?.role)),
    [state.posts, userInfo?.id, userInfo?.role],
  );
  
  const hasError = state.errors.hasError;
  const hasDrafts = draftPosts.length > 0;
  const showInitialLoader = isLoading && hasDrafts === false;
  const showEmptyState = isLoading === false && hasError === false && hasDrafts === false;
  const showLoadingOverlay = isLoading && hasDrafts;
  const totalPages = Math.ceil(state.pagination.total / state.pagination.limit);

  if (authLoading) {
    return <FullPageLoader />;
  }

  if (!hasAccess) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className={cn('min-h-screen bg-gray-50 dark:bg-gray-900', className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DraftsHeader
          countMessage={getDraftsCountMessage(draftPosts.length)}
          isLoading={isLoading}
          onRefresh={handleRefresh}
        />

        {hasError && (
          <DraftsError errorMessage={state.errors.lastError?.message} onRetry={handleRefresh} />
        )}

        {showInitialLoader && <DraftsInitialLoader />}
        {showEmptyState && <EmptyDrafts />}
        {hasDrafts && <DraftsGrid posts={draftPosts} publishingId={publishingId} onDelete={handleDelete} onPublish={handlePublish} />}
        <DraftsPagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
        {showLoadingOverlay && <DraftsLoadingOverlay />}
      </div>
    </div>
  );
}

export function Drafts({ className = '' }: Readonly<DraftsProps>) {
  return (
    <PostProvider>
      <DraftsContent className={className} />
    </PostProvider>
  );
}
