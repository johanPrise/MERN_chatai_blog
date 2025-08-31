/**
 * Navigation Service
 * Handles safe navigation and route validation for post-related routes
 */

import { NavigateFunction } from 'react-router-dom';

export interface NavigationOptions {
  replace?: boolean;
  fallbackRoute?: string;
  validateId?: boolean;
}

export class NavigationService {
  private static instance: NavigationService;
  private navigate: NavigateFunction | null = null;

  private constructor() {}

  public static getInstance(): NavigationService {
    if (!NavigationService.instance) {
      NavigationService.instance = new NavigationService();
    }
    return NavigationService.instance;
  }

  /**
   * Initialize the service with the navigate function
   */
  public initialize(navigate: NavigateFunction): void {
    this.navigate = navigate;
  }

  /**
   * Validate if a post ID is valid (not undefined, null, or empty)
   */
  public validatePostId(id: string | undefined | null): boolean {
    return !!(id && id.trim() && id !== 'undefined' && id !== 'null');
  }

  /**
   * Navigate to a post page with validation
   */
  public navigateToPost(
    postId: string | undefined | null, 
    options: NavigationOptions = {}
  ): boolean {
    if (!this.navigate) {
      console.error('NavigationService not initialized');
      return false;
    }

    const { replace = false, fallbackRoute = '/', validateId = true } = options;

    // Validate post ID if required
    if (validateId && !this.validatePostId(postId)) {
      console.warn(`Invalid post ID: ${postId}, navigating to fallback route`);
      this.navigate(fallbackRoute, { replace });
      return false;
    }

    try {
      // Use the correct route format from App.tsx (/Post/:id with capital P)
      const route = `/Post/${postId}`;
      this.navigate(route, { replace });
      return true;
    } catch (error) {
      console.error('Navigation error:', error);
      this.navigate(fallbackRoute, { replace });
      return false;
    }
  }

  /**
   * Navigate to post creation page
   */
  public navigateToCreatePost(options: NavigationOptions = {}): void {
    if (!this.navigate) {
      console.error('NavigationService not initialized');
      return;
    }

    const { replace = false } = options;
    this.navigate('/posts/create', { replace });
  }

  /**
   * Navigate to post edit page with validation
   */
  public navigateToEditPost(
    postId: string | undefined | null,
    options: NavigationOptions = {}
  ): boolean {
    if (!this.navigate) {
      console.error('NavigationService not initialized');
      return false;
    }

    const { replace = false, fallbackRoute = '/', validateId = true } = options;

    // Validate post ID if required
    if (validateId && !this.validatePostId(postId)) {
      console.warn(`Invalid post ID: ${postId}, navigating to fallback route`);
      this.navigate(fallbackRoute, { replace });
      return false;
    }

    try {
      const route = `/posts/edit/${postId}`;
      this.navigate(route, { replace });
      return true;
    } catch (error) {
      console.error('Navigation error:', error);
      this.navigate(fallbackRoute, { replace });
      return false;
    }
  }

  /**
   * Navigate to drafts page
   */
  public navigateToDrafts(options: NavigationOptions = {}): void {
    if (!this.navigate) {
      console.error('NavigationService not initialized');
      return;
    }

    const { replace = false } = options;
    this.navigate('/posts/drafts', { replace });
  }

  /**
   * Navigate with fallback handling
   */
  public navigateWithFallback(
    primaryRoute: string,
    fallbackRoute: string = '/',
    options: NavigationOptions = {}
  ): void {
    if (!this.navigate) {
      console.error('NavigationService not initialized');
      return;
    }

    const { replace = false } = options;

    try {
      // Validate the primary route
      if (!primaryRoute || primaryRoute.trim() === '' || primaryRoute.includes('undefined')) {
        console.warn(`Invalid primary route: ${primaryRoute}, using fallback`);
        this.navigate(fallbackRoute, { replace });
        return;
      }

      this.navigate(primaryRoute, { replace });
    } catch (error) {
      console.error('Navigation error:', error);
      this.navigate(fallbackRoute, { replace });
    }
  }

  /**
   * Navigate to home page
   */
  public navigateToHome(options: NavigationOptions = {}): void {
    if (!this.navigate) {
      console.error('NavigationService not initialized');
      return;
    }

    const { replace = false } = options;
    this.navigate('/', { replace });
  }

  /**
   * Check if a route is valid (basic validation)
   */
  public validateRoute(route: string): boolean {
    if (!route || route.trim() === '') {
      return false;
    }

    // Check for common invalid patterns
    const invalidPatterns = [
      'undefined',
      'null',
      '/undefined',
      '/null',
      '///',
      '/Post/undefined',
      '/Post/null',
      '/posts/edit/undefined',
      '/posts/edit/null'
    ];

    return !invalidPatterns.some(pattern => route.includes(pattern));
  }

  /**
   * Get the current navigation function (for direct use if needed)
   */
  public getNavigate(): NavigateFunction | null {
    return this.navigate;
  }
}

// Export a singleton instance
export const navigationService = NavigationService.getInstance();