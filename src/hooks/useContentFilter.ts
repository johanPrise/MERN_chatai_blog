import { useState, useCallback } from 'react';
import { useGlobalErrorHandler } from './useGlobalErrorHandler';
import { contentFilterService } from '../services/contentFilter';

interface ContentFilterState {
  isFiltering: boolean;
  hasFiltered: boolean;
  error: string | null;
}

interface UseContentFilterReturn {
  filterContent: (content: string) => Promise<string>;
  filterState: ContentFilterState;
  clearError: () => void;
  isContentAppropriate: (content: string) => boolean;
}

/**
 * Hook for handling content filtering with centralized error handling
 * Provides content moderation and profanity filtering
 */
export const useContentFilter = (): UseContentFilterReturn => {
  const [filterState, setFilterState] = useState<ContentFilterState>({
    isFiltering: false,
    hasFiltered: false,
    error: null,
  });
  const { handleContentFilterError } = useGlobalErrorHandler();

  const clearError = useCallback(() => {
    setFilterState(prev => ({ ...prev, error: null }));
  }, []);

  const isContentAppropriate = useCallback(
    (content: string): boolean => {
      try {
        if (!content || typeof content !== 'string') {
          return true;
        }

        // Use the service's test method to check content
        const testResult = contentFilterService.testContent(content);
        return !testResult.hasInappropriateContent;
      } catch (error) {
        handleContentFilterError(content, {
          context: {
            component: 'useContentFilter',
            action: 'check_content_appropriateness',
            userId: undefined,
          },
          showToUser: false, // Don't show error for content checks
          logToConsole: true,
        });
        // Return true on error to avoid blocking content unnecessarily
        return true;
      }
    },
    [handleContentFilterError]
  );

  const filterContent = useCallback(
    async (content: string): Promise<string> => {
      setFilterState({ isFiltering: true, hasFiltered: false, error: null });

      try {
        if (!content || typeof content !== 'string') {
          setFilterState({ isFiltering: false, hasFiltered: false, error: null });
          return content;
        }

        // Use the service's built-in filtering method
        const filterResult = contentFilterService.filterContent(content);

        // Check for excessive profanity (more than 3 filtered words)
        if (filterResult.flaggedWords.length > 3) {
          handleContentFilterError(content, {
            context: {
              component: 'useContentFilter',
              action: 'excessive_profanity_detected',
              userId: undefined,
            },
            showToUser: true,
            logToConsole: true,
          });
          setFilterState({
            isFiltering: false,
            hasFiltered: true,
            error: 'Contenu excessivement inapproprié détecté',
          });
          return filterResult.filteredContent;
        }

        if (filterResult.wasFiltered) {
          handleContentFilterError(content, {
            context: {
              component: 'useContentFilter',
              action: 'content_filtered',
              userId: undefined,
            },
            showToUser: true,
            logToConsole: false, // Don't log normal filtering operations
          });
        }

        setFilterState({
          isFiltering: false,
          hasFiltered: filterResult.wasFiltered,
          error: null,
        });
        return filterResult.filteredContent;
      } catch (error) {
        handleContentFilterError(content, {
          context: {
            component: 'useContentFilter',
            action: 'filter_content_error',
            userId: undefined,
          },
          showToUser: true,
          logToConsole: true,
        });

        setFilterState({
          isFiltering: false,
          hasFiltered: false,
          error: 'Erreur lors du filtrage du contenu',
        });

        // Return original content on error
        return content;
      }
    },
    [handleContentFilterError]
  );

  return {
    filterContent,
    filterState,
    clearError,
    isContentAppropriate,
  };
};

/**
 * Simple content filter hook for backward compatibility
 * Provides a simplified interface for existing components
 */
export const useSimpleContentFilter = () => {
  const { isContentAppropriate } = useContentFilter();

  const testContent = useCallback((content: string) => {
    const testResult = contentFilterService.testContent(content);
    return {
      hasInappropriateContent: testResult.hasInappropriateContent,
      flaggedWords: testResult.flaggedWords,
    };
  }, []);

  const filterContent = useCallback((content: string) => {
    if (!content || typeof content !== 'string') {
      return {
        filteredContent: content,
        wasFiltered: false,
        flaggedWords: [],
        replacements: [],
      };
    }

    // Use the service's built-in filtering method
    const filterResult = contentFilterService.filterContent(content);
    
    return {
      filteredContent: filterResult.filteredContent,
      wasFiltered: filterResult.wasFiltered,
      flaggedWords: filterResult.flaggedWords,
      replacements: filterResult.replacements || [],
    };
  }, []);

  return {
    filterContent,
    testContent,
  };
};
