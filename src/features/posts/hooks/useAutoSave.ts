/**
 * Auto-save hook for post editing
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { PostApiService } from '../services/postApi';

interface UseAutoSaveOptions {
  enabled: boolean;
  interval: number; // milliseconds
  maxRetries: number;
  onSave?: (success: boolean, error?: string) => void;
}

interface UseAutoSaveReturn {
  isAutoSaving: boolean;
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
  saveNow: () => Promise<void>;
  resetAutoSave: () => void;
}

export function useAutoSave(
  postId: string | null,
  content: string,
  title?: string,
  summary?: string,
  options: UseAutoSaveOptions = {
    enabled: true,
    interval: 30000, // 30 seconds
    maxRetries: 3,
  }
): UseAutoSaveReturn {
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const apiService = PostApiService.getInstance();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastContentRef = useRef<string>('');
  const lastTitleRef = useRef<string>('');
  const lastSummaryRef = useRef<string>('');

  const saveContent = useCallback(async () => {
    if (!postId || !options.enabled || isAutoSaving) {
      return;
    }

    // Check if content has actually changed
    const contentChanged = content !== lastContentRef.current;
    const titleChanged = title !== lastTitleRef.current;
    const summaryChanged = summary !== lastSummaryRef.current;

    if (!contentChanged && !titleChanged && !summaryChanged) {
      return;
    }

    setIsAutoSaving(true);

    try {
      await apiService.autoSave({
        id: postId,
        content,
        metadata: {
          title,
          summary,
          lastEditedAt: new Date(),
        },
      });

      // Update refs with saved content
      lastContentRef.current = content;
      lastTitleRef.current = title || '';
      lastSummaryRef.current = summary || '';

      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      setRetryCount(0);

      options.onSave?.(true);
    } catch (error) {
      console.error('Auto-save failed:', error);

      if (retryCount < options.maxRetries) {
        setRetryCount(prev => prev + 1);
        // Retry with exponential backoff
        setTimeout(() => {
          saveContent();
        }, Math.pow(2, retryCount) * 1000);
      } else {
        options.onSave?.(false, error instanceof Error ? error.message : 'Auto-save failed');
      }
    } finally {
      setIsAutoSaving(false);
    }
  }, [postId, content, title, summary, options, isAutoSaving, retryCount, apiService]);

  const saveNow = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    await saveContent();
  }, [saveContent]);

  const resetAutoSave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    lastContentRef.current = content;
    lastTitleRef.current = title || '';
    lastSummaryRef.current = summary || '';
    setHasUnsavedChanges(false);
    setRetryCount(0);
  }, [content, title, summary]);

  // Track content changes
  useEffect(() => {
    const contentChanged = content !== lastContentRef.current;
    const titleChanged = title !== lastTitleRef.current;
    const summaryChanged = summary !== lastSummaryRef.current;

    if (contentChanged || titleChanged || summaryChanged) {
      setHasUnsavedChanges(true);
    }
  }, [content, title, summary]);

  // Set up auto-save timer
  useEffect(() => {
    if (!options.enabled || !postId || !hasUnsavedChanges) {
      return;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      saveContent();
    }, options.interval);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [options.enabled, options.interval, postId, hasUnsavedChanges, saveContent]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    isAutoSaving,
    lastSaved,
    hasUnsavedChanges,
    saveNow,
    resetAutoSave,
  };
}
