/**
 * useNavigation Hook
 * Custom hook for safe navigation in post-related components
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { navigationService, NavigationOptions } from '../services/navigationService';

export function useNavigation() {
  const navigate = useNavigate();

  // Initialize the navigation service with the current navigate function
  useEffect(() => {
    navigationService.initialize(navigate);
  }, [navigate]);

  return {
    /**
     * Navigate to a post page with validation
     */
    navigateToPost: (postId: string | undefined | null, options?: NavigationOptions) => {
      return navigationService.navigateToPost(postId, options);
    },

    /**
     * Navigate to post creation page
     */
    navigateToCreatePost: (options?: NavigationOptions) => {
      navigationService.navigateToCreatePost(options);
    },

    /**
     * Navigate to post edit page with validation
     */
    navigateToEditPost: (postId: string | undefined | null, options?: NavigationOptions) => {
      return navigationService.navigateToEditPost(postId, options);
    },

    /**
     * Navigate to drafts page
     */
    navigateToDrafts: (options?: NavigationOptions) => {
      navigationService.navigateToDrafts(options);
    },

    /**
     * Navigate with fallback handling
     */
    navigateWithFallback: (primaryRoute: string, fallbackRoute?: string, options?: NavigationOptions) => {
      navigationService.navigateWithFallback(primaryRoute, fallbackRoute, options);
    },

    /**
     * Navigate to home page
     */
    navigateToHome: (options?: NavigationOptions) => {
      navigationService.navigateToHome(options);
    },

    /**
     * Validate if a post ID is valid
     */
    validatePostId: (id: string | undefined | null) => {
      return navigationService.validatePostId(id);
    },

    /**
     * Validate if a route is valid
     */
    validateRoute: (route: string) => {
      return navigationService.validateRoute(route);
    },

    /**
     * Get the raw navigate function for direct use
     */
    navigate
  };
}