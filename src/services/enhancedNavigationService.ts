/**
 * Enhanced Navigation Service
 * Provides smart navigation with cache-busting and state synchronization
 */

import { NavigateFunction } from 'react-router-dom';
import { globalStateManager } from './globalStateManager';

export interface NavigationOptions {
  triggerRefresh?: boolean;
  replaceState?: boolean;
  source?: 'edit' | 'delete' | 'create' | 'publish';
  fallbackRoute?: string;
}

export interface HomeNavigationOptions {
  refreshPostList?: boolean;
  replaceState?: boolean;
}

class EnhancedNavigationService {
  private navigate: NavigateFunction | null = null;
  private debug = import.meta.env.NODE_ENV === 'development';

  /**
   * Initialize the service with React Router's navigate function
   */
  initialize(navigate: NavigateFunction): void {
    this.navigate = navigate;
    if (this.debug) {
      console.log('[EnhancedNavigationService] Initialized');
    }
  }

  /**
   * Validate post ID format
   */
  private validatePostId(postId: string | undefined | null): boolean {
    if (!postId || typeof postId !== 'string') return false;
    
    // Check for MongoDB ObjectId format (24 hex characters) or other valid formats
    const objectIdPattern = /^[0-9a-fA-F]{24}$/;
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const shortIdPattern = /^[a-zA-Z0-9_-]{6,}$/; // At least 6 characters
    
    return objectIdPattern.test(postId) || uuidPattern.test(postId) || shortIdPattern.test(postId);
  }

  /**
   * Enhanced post navigation with state synchronization
   */
  navigateToPost(postId: string | undefined | null, options: NavigationOptions = {}): boolean {
    if (!this.navigate) {
      console.error('[EnhancedNavigationService] Navigate function not initialized');
      return false;
    }

    if (!this.validatePostId(postId)) {
      console.error('[EnhancedNavigationService] Invalid post ID:', postId);
      if (options.fallbackRoute) {
        this.navigate(options.fallbackRoute, { replace: options.replaceState || false });
      }
      return false;
    }

    const searchParams = new URLSearchParams();
    
    // Add cache-busting parameter if needed
    if (options.triggerRefresh) {
      searchParams.set('updated', Date.now().toString());
    }
    
    // Add source tracking for analytics and debugging
    if (options.source) {
      searchParams.set('from', options.source);
    }
    
    const queryString = searchParams.toString();
    const url = `/Post/${postId}${queryString ? '?' + queryString : ''}`;
    
    if (this.debug) {
      console.log('[EnhancedNavigationService] Navigating to post:', {
        postId,
        url,
        options
      });
    }
    
    try {
      this.navigate(url, { 
        replace: options.replaceState || false 
      });
      return true;
    } catch (error) {
      console.error('[EnhancedNavigationService] Navigation error:', error);
      
      // Fallback to direct URL change if React Router fails
      window.location.href = url;
      return true;
    }
  }

  /**
   * Enhanced home navigation with list refresh
   */
  navigateToHome(options: HomeNavigationOptions = {}): void {
    if (!this.navigate) {
      console.error('[EnhancedNavigationService] Navigate function not initialized');
      window.location.href = '/';
      return;
    }

    // Notify home page to refresh if needed
    if (options.refreshPostList) {
      globalStateManager.notifyCacheInvalidation('home-posts', 'navigation-refresh');
    }
    
    if (this.debug) {
      console.log('[EnhancedNavigationService] Navigating to home:', options);
    }
    
    try {
      this.navigate('/', { 
        replace: options.replaceState || false 
      });
    } catch (error) {
      console.error('[EnhancedNavigationService] Home navigation error:', error);
      window.location.href = '/';
    }
  }

  /**
   * Navigate to edit post page
   */
  navigateToEditPost(postId: string | undefined | null, options: NavigationOptions = {}): boolean {
    if (!this.navigate) {
      console.error('[EnhancedNavigationService] Navigate function not initialized');
      return false;
    }

    if (!this.validatePostId(postId)) {
      console.error('[EnhancedNavigationService] Invalid post ID for editing:', postId);
      return false;
    }

    const url = `/posts/edit/${postId}`;
    
    if (this.debug) {
      console.log('[EnhancedNavigationService] Navigating to edit post:', { postId, url });
    }
    
    try {
      this.navigate(url, { 
        replace: options.replaceState || false 
      });
      return true;
    } catch (error) {
      console.error('[EnhancedNavigationService] Edit navigation error:', error);
      return false;
    }
  }

  /**
   * Navigate to create post page
   */
  navigateToCreatePost(options: NavigationOptions = {}): void {
    if (!this.navigate) {
      console.error('[EnhancedNavigationService] Navigate function not initialized');
      window.location.href = '/posts/create';
      return;
    }
    
    try {
      this.navigate('/posts/create', { 
        replace: options.replaceState || false 
      });
    } catch (error) {
      console.error('[EnhancedNavigationService] Create navigation error:', error);
      window.location.href = '/posts/create';
    }
  }

  /**
   * Navigate to drafts page
   */
  navigateToDrafts(options: NavigationOptions = {}): void {
    if (!this.navigate) {
      console.error('[EnhancedNavigationService] Navigate function not initialized');
      window.location.href = '/posts/drafts';
      return;
    }
    
    try {
      this.navigate('/posts/drafts', { 
        replace: options.replaceState || false 
      });
    } catch (error) {
      console.error('[EnhancedNavigationService] Drafts navigation error:', error);
      window.location.href = '/posts/drafts';
    }
  }

  /**
   * Navigate with automatic fallback handling
   */
  navigateWithFallback(primaryRoute: string, fallbackRoute: string = '/', options: NavigationOptions = {}): void {
    if (!this.navigate) {
      console.error('[EnhancedNavigationService] Navigate function not initialized');
      window.location.href = fallbackRoute;
      return;
    }
    
    try {
      this.navigate(primaryRoute, { 
        replace: options.replaceState || false 
      });
    } catch (error) {
      console.error('[EnhancedNavigationService] Primary navigation failed, using fallback:', { primaryRoute, fallbackRoute, error });
      try {
        this.navigate(fallbackRoute, { 
          replace: options.replaceState || false 
        });
      } catch (fallbackError) {
        console.error('[EnhancedNavigationService] Fallback navigation failed:', fallbackError);
        window.location.href = fallbackRoute;
      }
    }
  }

  /**
   * Smart post update navigation - combines state update with navigation
   */
  handlePostUpdateNavigation(postId: string, postData: any, options: NavigationOptions = {}): boolean {
    // First, notify global state about the update
    globalStateManager.notifyPostUpdate(postId, postData, options.source || 'edit');
    
    // Force cache invalidation immediately
    globalStateManager.notifyCacheInvalidation('all', 'navigation-update');
    
    // Then navigate with cache-busting
    return this.navigateToPost(postId, {
      ...options,
      triggerRefresh: true
    });
  }

  /**
   * Smart post deletion navigation
   */
  handlePostDeletionNavigation(postId: string, options: HomeNavigationOptions = {}): void {
    // First, notify global state about the deletion
    globalStateManager.notifyPostDeletion(postId, 'delete');
    
    // Then navigate to home with refresh
    this.navigateToHome({
      ...options,
      refreshPostList: true,
      replaceState: true
    });
  }
}

// Create singleton instance
export const enhancedNavigationService = new EnhancedNavigationService();

// Export the class for testing
export { EnhancedNavigationService };