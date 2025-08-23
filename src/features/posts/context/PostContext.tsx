/**
 * Post Context - Centralized state management for posts
 */

import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import { PostData, CreatePostInput, UpdatePostInput, PostFilters, LoadingState, PostErrorState, PostError } from '../types/post.types';
import { PostApiService } from '../services/postApi';

// State interface
interface PostState {
  posts: PostData[];
  currentPost: PostData | null;
  filters: PostFilters;
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
  loading: LoadingState;
  errors: PostErrorState;
  categories: any[];
  lastFetch: Date | null;
}

// Action types
type PostAction =
  | { type: 'SET_LOADING'; payload: Partial<LoadingState> }
  | { type: 'SET_ERROR'; payload: PostError }
  | { type: 'CLEAR_ERRORS' }
  | { type: 'SET_POSTS'; payload: { posts: PostData[]; pagination?: any } }
  | { type: 'ADD_POST'; payload: PostData }
  | { type: 'UPDATE_POST'; payload: PostData }
  | { type: 'REMOVE_POST'; payload: string }
  | { type: 'SET_CURRENT_POST'; payload: PostData | null }
  | { type: 'SET_FILTERS'; payload: PostFilters }
  | { type: 'SET_CATEGORIES'; payload: any[] }
  | { type: 'RESET_STATE' };

// Initial state
const initialState: PostState = {
  posts: [],
  currentPost: null,
  filters: {},
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    hasMore: false,
  },
  loading: {
    isLoading: false,
    isCreating: false,
    isUpdating: false,
    isDeleting: false,
    isSaving: false,
    isUploading: false,
  },
  errors: {
    hasError: false,
    errors: [],
  },
  categories: [],
  lastFetch: null,
};

// Reducer
function postReducer(state: PostState, action: PostAction): PostState {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        loading: { ...state.loading, ...action.payload },
      };

    case 'SET_ERROR':
      return {
        ...state,
        errors: {
          hasError: true,
          errors: [...state.errors.errors, action.payload],
          lastError: action.payload,
        },
      };

    case 'CLEAR_ERRORS':
      return {
        ...state,
        errors: {
          hasError: false,
          errors: [],
        },
      };

    case 'SET_POSTS':
      return {
        ...state,
        posts: action.payload.posts,
        pagination: action.payload.pagination || state.pagination,
        lastFetch: new Date(),
      };

    case 'ADD_POST':
      return {
        ...state,
        posts: [action.payload, ...state.posts],
        pagination: {
          ...state.pagination,
          total: state.pagination.total + 1,
        },
      };

    case 'UPDATE_POST':
      return {
        ...state,
        posts: state.posts.map(post =>
          post.id === action.payload.id ? action.payload : post
        ),
        currentPost: state.currentPost?.id === action.payload.id ? action.payload : state.currentPost,
      };

    case 'REMOVE_POST':
      return {
        ...state,
        posts: state.posts.filter(post => post.id !== action.payload),
        currentPost: state.currentPost?.id === action.payload ? null : state.currentPost,
        pagination: {
          ...state.pagination,
          total: Math.max(0, state.pagination.total - 1),
        },
      };

    case 'SET_CURRENT_POST':
      return {
        ...state,
        currentPost: action.payload,
      };

    case 'SET_FILTERS':
      return {
        ...state,
        filters: action.payload,
        pagination: { ...state.pagination, page: 1 }, // Reset to first page when filters change
      };

    case 'SET_CATEGORIES':
      return {
        ...state,
        categories: action.payload,
        lastFetch: new Date(),
      };

    case 'RESET_STATE':
      return initialState;

    default:
      return state;
  }
}

// Context
interface PostContextType {
  state: PostState;
  actions: {
    fetchPosts: (filters?: PostFilters, page?: number) => Promise<void>;
    fetchPost: (id: string) => Promise<void>;
    createPost: (data: CreatePostInput) => Promise<PostData | null>;
    updatePost: (id: string, data: UpdatePostInput) => Promise<PostData | null>;
    deletePost: (id: string, soft?: boolean) => Promise<boolean>;
    setFilters: (filters: PostFilters) => void;
    clearErrors: () => void;
    resetState: () => void;
    fetchCategories: () => Promise<void>;
    publishPost: (id: string) => Promise<PostData | null>;
  };
}

const PostContext = createContext<PostContextType | undefined>(undefined);

// Provider component
interface PostProviderProps {
  children: ReactNode;
}

export function PostProvider({ children }: PostProviderProps) {
  const [state, dispatch] = useReducer(postReducer, initialState);
  const apiService = PostApiService.getInstance();

  const setLoading = useCallback((loading: Partial<LoadingState>) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  }, []);

  const setError = useCallback((error: PostError) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);

  const clearErrors = useCallback(() => {
    dispatch({ type: 'CLEAR_ERRORS' });
  }, []);

  const fetchPosts = useCallback(async (filters?: PostFilters, page: number = 1) => {
    try {
      setLoading({ isLoading: true });
      clearErrors();

      const response = await apiService.getPosts({
        page,
        limit: state.pagination.limit,
        filters: filters || state.filters,
      });

      if (response.success && response.data) {
        dispatch({
          type: 'SET_POSTS',
          payload: {
            posts: response.data.posts,
            pagination: response.data.pagination,
          },
        });
      } else {
        setError({ code: 'FETCH_ERROR', message: 'Failed to fetch posts' });
      }
    } catch (error) {
      setError({
        code: 'FETCH_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch posts',
      });
    } finally {
      setLoading({ isLoading: false });
    }
  }, [apiService, state.filters, state.pagination.limit, setLoading, clearErrors, setError]);

  const fetchPost = useCallback(async (id: string) => {
    try {
      setLoading({ isLoading: true });
      clearErrors();

      const post = await apiService.getPost(id);
      dispatch({ type: 'SET_CURRENT_POST', payload: post });
    } catch (error) {
      setError({
        code: 'FETCH_POST_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch post',
      });
    } finally {
      setLoading({ isLoading: false });
    }
  }, [apiService, setLoading, clearErrors, setError]);

  const createPost = useCallback(async (data: CreatePostInput): Promise<PostData | null> => {
    try {
      setLoading({ isCreating: true });
      clearErrors();

      const result = await apiService.createPost(data);
      try {
        const cb = (result as any)?.data?.contentBlocks;
        console.debug('[PostContext] createPost result summary', {
          success: result?.success,
          id: (result as any)?.data?.id || (result as any)?.data?._id,
          contentBlocks: Array.isArray(cb)
            ? { length: cb.length, types: cb.map((b: any) => b?.type) }
            : cb,
        });
      } catch {}
      
      if (result.success && result.data) {
        dispatch({ type: 'ADD_POST', payload: result.data });
        return result.data;
      } else {
        setError({
          code: 'CREATE_ERROR',
          message: result.error || 'Failed to create post',
        });
        return null;
      }
    } catch (error) {
      setError({
        code: 'CREATE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to create post',
      });
      return null;
    } finally {
      setLoading({ isCreating: false });
    }
  }, [apiService, setLoading, clearErrors, setError]);

  const updatePost = useCallback(async (id: string, data: UpdatePostInput): Promise<PostData | null> => {
    console.log('[PostContext] updatePost called', { 
      id, 
      dataKeys: Object.keys(data),
      title: data.title?.substring(0, 50) + '...',
      status: data.status
    });

    try {
      setLoading({ isUpdating: true });
      clearErrors();

      // Valider les données avant envoi
      if (!id) {
        throw new Error('Post ID is required');
      }

      if (!data.title?.trim()) {
        throw new Error('Post title is required');
      }

      const result = await apiService.updatePost(id, data);
      
      console.log('[PostContext] updatePost result', {
        success: result?.success,
        hasData: !!result?.data,
        error: result?.error,
        postId: result?.data?.id
      });
      
      if (result.success && result.data) {
        // Mettre à jour le state avec le post modifié
        dispatch({ type: 'UPDATE_POST', payload: result.data });
        
        // Mettre à jour aussi currentPost si c'est le même
        if (state.currentPost && state.currentPost.id === id) {
          dispatch({ type: 'SET_CURRENT_POST', payload: result.data });
        }
        
        console.log('[PostContext] Post updated successfully in context', {
          id: result.data.id,
          title: result.data.title,
          status: result.data.status
        });
        
        return result.data;
      } else {
        const errorMessage = result.error || 'Failed to update post';
        console.error('[PostContext] Update failed', { error: errorMessage, validationErrors: result.validationErrors });
        
        setError({
          code: 'UPDATE_ERROR',
          message: errorMessage,
          details: result.validationErrors
        });
        return null;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update post';
      console.error('[PostContext] Update error', { error: errorMessage });
      
      setError({
        code: 'UPDATE_ERROR',
        message: errorMessage,
      });
      return null;
    } finally {
      setLoading({ isUpdating: false });
    }
  }, [apiService, setLoading, clearErrors, setError, state.currentPost]);

  const deletePost = useCallback(async (id: string, soft: boolean = true): Promise<boolean> => {
    try {
      setLoading({ isDeleting: true });
      clearErrors();

      const result = await apiService.deletePost(id, soft);
      
      if (result.success) {
        dispatch({ type: 'REMOVE_POST', payload: id });
        return true;
      } else {
        setError({
          code: 'DELETE_ERROR',
          message: result.error || 'Failed to delete post',
        });
        return false;
      }
    } catch (error) {
      setError({
        code: 'DELETE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to delete post',
      });
      return false;
    } finally {
      setLoading({ isDeleting: false });
    }
  }, [apiService, setLoading, clearErrors, setError]);

  const setFilters = useCallback((filters: PostFilters) => {
    dispatch({ type: 'SET_FILTERS', payload: filters });
  }, []);

  const resetState = useCallback(() => {
    dispatch({ type: 'RESET_STATE' });
  }, []);

  const fetchCategories = useCallback(async () => {
    // Vérifier si les catégories sont déjà chargées ou si la dernière requête est récente
    if (state.categories.length > 0 && state.lastFetch) {
      const now = new Date();
      const timeDiff = now.getTime() - state.lastFetch.getTime();
      const fiveMinutesInMs = 5 * 60 * 1000;
      
      // Si les catégories sont déjà chargées et la dernière requête date de moins de 5 minutes, ne pas refaire la requête
      if (timeDiff < fiveMinutesInMs) {
        console.log('Categories already loaded, skipping fetch');
        return;
      }
    }
    
    try {
      const categories = await apiService.getCategories();
      dispatch({ type: 'SET_CATEGORIES', payload: categories });
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  }, [apiService, state.categories, state.lastFetch]);

  const publishPost = useCallback(async (id: string): Promise<PostData | null> => {
    try {
      setLoading({ isUpdating: true });
      clearErrors();

      const result = await apiService.publishPost(id);
      
      if (result.success && result.data) {
        dispatch({ type: 'UPDATE_POST', payload: result.data });
        return result.data;
      } else {
        setError({
          code: 'PUBLISH_ERROR',
          message: result.error || 'Failed to publish post',
        });
        return null;
      }
    } catch (error) {
      setError({
        code: 'PUBLISH_ERROR',
        message: error instanceof Error ? error.message : 'Failed to publish post',
      });
      return null;
    } finally {
      setLoading({ isUpdating: false });
    }
  }, [apiService, setLoading, clearErrors, setError]);

  const contextValue: PostContextType = {
    state,
    actions: {
      fetchPosts,
      fetchPost,
      createPost,
      updatePost,
      deletePost,
      setFilters,
      clearErrors,
      resetState,
      fetchCategories,
      publishPost,
    },
  };

  return <PostContext.Provider value={contextValue}>{children}</PostContext.Provider>;
}

// Hook to use the context
export function usePostContext() {
  const context = useContext(PostContext);
  if (context === undefined) {
    throw new Error('usePostContext must be used within a PostProvider');
  }
  return context;
}
