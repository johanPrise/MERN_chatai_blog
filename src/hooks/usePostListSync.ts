/**
 * Hook for synchronizing post lists across components
 * Ensures immediate updates when posts are modified
 */

import { useCallback, useRef } from 'react';
import { useGlobalStateEvents } from '../services/globalStateManager';

export interface PostListSyncOptions {
  onPostUpdate?: (postId: string, postData: any) => void;
  onPostDelete?: (postId: string) => void;
  onPostCreate?: (postData: any) => void;
  onCacheInvalidate?: (scope: string, reason?: string) => void;
  autoRefresh?: boolean;
}

export function usePostListSync(options: PostListSyncOptions = {}) {
  const {
    onPostUpdate,
    onPostDelete,
    onPostCreate,
    onCacheInvalidate,
    autoRefresh = true
  } = options;

  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced refresh function to prevent multiple rapid refreshes
  const debouncedRefresh = useCallback((callback: () => void, delay = 150) => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }
    
    refreshTimeoutRef.current = setTimeout(() => {
      callback();
      refreshTimeoutRef.current = null;
    }, delay);
  }, []);

  // Subscribe to global state events
  useGlobalStateEvents([
    {
      type: 'POST_UPDATED',
      handler: useCallback(({ postId, postData, source }) => {
        console.log('[usePostListSync] Post updated:', { postId, source });
        
        if (onPostUpdate) {
          if (autoRefresh) {
            debouncedRefresh(() => onPostUpdate(postId, postData));
          } else {
            onPostUpdate(postId, postData);
          }
        }
      }, [onPostUpdate, autoRefresh, debouncedRefresh])
    },
    {
      type: 'POST_DELETED',
      handler: useCallback(({ postId, source }) => {
        console.log('[usePostListSync] Post deleted:', { postId, source });
        
        if (onPostDelete) {
          if (autoRefresh) {
            debouncedRefresh(() => onPostDelete(postId));
          } else {
            onPostDelete(postId);
          }
        }
      }, [onPostDelete, autoRefresh, debouncedRefresh])
    },
    {
      type: 'POST_CREATED',
      handler: useCallback(({ postData }) => {
        console.log('[usePostListSync] Post created:', { postId: postData?.id });
        
        if (onPostCreate) {
          if (autoRefresh) {
            debouncedRefresh(() => onPostCreate(postData));
          } else {
            onPostCreate(postData);
          }
        }
      }, [onPostCreate, autoRefresh, debouncedRefresh])
    },
    {
      type: 'CACHE_INVALIDATE',
      handler: useCallback(({ scope, reason }) => {
        console.log('[usePostListSync] Cache invalidated:', { scope, reason });
        
        if (onCacheInvalidate) {
          if (autoRefresh) {
            debouncedRefresh(() => onCacheInvalidate(scope, reason));
          } else {
            onCacheInvalidate(scope, reason);
          }
        }
      }, [onCacheInvalidate, autoRefresh, debouncedRefresh])
    }
  ], [onPostUpdate, onPostDelete, onPostCreate, onCacheInvalidate, autoRefresh, debouncedRefresh]);

  // Cleanup timeout on unmount
  const cleanup = useCallback(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }
  }, []);

  return {
    cleanup,
    debouncedRefresh
  };
}