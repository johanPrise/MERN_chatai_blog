/**
 * useNavigation Hook
 * Custom hook for safe navigation in post-related components
 */

import { useEffect, useCallback } from 'react';

import { useNavigate } from 'react-router-dom';
import { navigationService, NavigationOptions } from '../services/navigationService';

export function useNavigation() {
  const navigate = useNavigate();

  // Initialize the navigation service with the current navigate function
  useEffect(() => {
    navigationService.initialize(navigate);
  }, [navigate]);

  // Stable wrappers to avoid changing identities across renders
  const navigateToPost = useCallback((postId: string | undefined | null, options?: NavigationOptions) => {
    return navigationService.navigateToPost(postId, options);
  }, []);

  const navigateToCreatePost = useCallback((options?: NavigationOptions) => {
    navigationService.navigateToCreatePost(options);
  }, []);

  const navigateToEditPost = useCallback((postId: string | undefined | null, options?: NavigationOptions) => {
    return navigationService.navigateToEditPost(postId, options);
  }, []);

  const navigateToDrafts = useCallback((options?: NavigationOptions) => {
    navigationService.navigateToDrafts(options);
  }, []);

  const navigateWithFallback = useCallback((primaryRoute: string, fallbackRoute?: string, options?: NavigationOptions) => {
    navigationService.navigateWithFallback(primaryRoute, fallbackRoute, options);
  }, []);

  const navigateToHome = useCallback((options?: NavigationOptions) => {
    navigationService.navigateToHome(options);
  }, []);

  const validatePostId = useCallback((id: string | undefined | null) => {
    return navigationService.validatePostId(id);
  }, []);

  const validateRoute = useCallback((route: string) => {
    return navigationService.validateRoute(route);
  }, []);

  return {
    /**
     * Navigate to a post page with validation
     */
    navigateToPost,

    /**
     * Navigate to post creation page
     */
    navigateToCreatePost,

    /**
     * Navigate to post edit page with validation
     */
    navigateToEditPost,

    /**
     * Navigate to drafts page
     */
    navigateToDrafts,

    /**
     * Navigate with fallback handling
     */
    navigateWithFallback,

    /**
     * Navigate to home page
     */
    navigateToHome,

    /**
     * Validate if a post ID is valid
     */
    validatePostId,

    /**
     * Validate if a route is valid
     */
    validateRoute,

    /**
     * Get the raw navigate function for direct use
     */
    navigate
  };
}