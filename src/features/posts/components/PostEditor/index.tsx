/**
 * Main Post Editor Component
 * Combines markdown editor with preview and auto-save functionality
 */

import React, { useState, useCallback, useEffect } from 'react';
import { MarkdownEditor } from './MarkdownEditor';
import { PreviewPane } from './PreviewPane';
import { useAutoSave } from '../../hooks/useAutoSave';
import { cn } from '../../../../lib/utils';
import { Eye, EyeOff, Save, Clock, AlertCircle, CheckCircle } from 'lucide-react';

interface PostEditorProps {
  value: string;
  onChange: (value: string) => void;
  postId?: string | null;
  title?: string;
  summary?: string;
  className?: string;
  placeholder?: string;
  readOnly?: boolean;
  autoFocus?: boolean;
  enableAutoSave?: boolean;
  autoSaveInterval?: number;
  onSave?: () => Promise<void>;
}

export function PostEditor({
  value,
  onChange,
  postId = null,
  title = '',
  summary = '',
  className = '',
  placeholder = 'Start writing your content...',
  readOnly = false,
  autoFocus = false,
  enableAutoSave = true,
  autoSaveInterval = 30000,
  onSave,
}: PostEditorProps) {
  const [showPreview, setShowPreview] = useState(true);
  const [editorScrollTop, setEditorScrollTop] = useState(0);
  const [previewScrollTop, setPreviewScrollTop] = useState(0);
  const [syncScroll, setSyncScroll] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Auto-save functionality
  const {
    isAutoSaving,
    lastSaved,
    hasUnsavedChanges,
    saveNow,
    resetAutoSave,
  } = useAutoSave(
    postId,
    value,
    title,
    summary,
    {
      enabled: enableAutoSave && !!postId,
      interval: autoSaveInterval,
      maxRetries: 3,
      onSave: (success, error) => {
        if (success) {
          setSaveStatus('saved');
          setTimeout(() => setSaveStatus('idle'), 2000);
        } else {
          setSaveStatus('error');
          console.error('Auto-save failed:', error);
        }
      },
    }
  );

  // Handle manual save
  const handleSave = useCallback(async () => {
    if (onSave) {
      setSaveStatus('saving');
      try {
        await onSave();
        setSaveStatus('saved');
        resetAutoSave();
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (error) {
        setSaveStatus('error');
        console.error('Save failed:', error);
      }
    } else if (postId) {
      await saveNow();
    }
  }, [onSave, postId, saveNow, resetAutoSave]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 's') {
      event.preventDefault();
      handleSave();
    }
    if ((event.ctrlKey || event.metaKey) && event.key === 'p') {
      event.preventDefault();
      setShowPreview(!showPreview);
    }
  }, [handleSave, showPreview]);

  // Set up keyboard shortcuts
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Handle content changes with formatting preservation
  const handleContentChange = useCallback((newValue: string) => {
    onChange(newValue);
    
    // Reset save status when content changes
    if (saveStatus === 'saved') {
      setSaveStatus('idle');
    }
  }, [onChange, saveStatus]);

  // Handle scroll synchronization
  const handleEditorScroll = useCallback((scrollTop: number) => {
    setEditorScrollTop(scrollTop);
    if (syncScroll) {
      setPreviewScrollTop(scrollTop);
    }
  }, [syncScroll]);

  const handlePreviewScroll = useCallback((scrollTop: number) => {
    setPreviewScrollTop(scrollTop);
    if (syncScroll) {
      setEditorScrollTop(scrollTop);
    }
  }, [syncScroll]);

  // Format last saved time
  const formatLastSaved = useCallback((date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'just now';
    if (minutes === 1) return '1 minute ago';
    if (minutes < 60) return `${minutes} minutes ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return '1 hour ago';
    if (hours < 24) return `${hours} hours ago`;
    
    return date.toLocaleDateString();
  }, []);

  // Render save status
  const renderSaveStatus = () => {
    if (isAutoSaving || saveStatus === 'saving') {
      return (
        <div className="flex items-center text-blue-600 dark:text-blue-400">
          <Clock className="h-4 w-4 mr-1 animate-spin" />
          <span className="text-sm">Saving...</span>
        </div>
      );
    }

    if (saveStatus === 'saved') {
      return (
        <div className="flex items-center text-green-600 dark:text-green-400">
          <CheckCircle className="h-4 w-4 mr-1" />
          <span className="text-sm">Saved</span>
        </div>
      );
    }

    if (saveStatus === 'error') {
      return (
        <div className="flex items-center text-red-600 dark:text-red-400">
          <AlertCircle className="h-4 w-4 mr-1" />
          <span className="text-sm">Save failed</span>
        </div>
      );
    }

    if (hasUnsavedChanges) {
      return (
        <div className="flex items-center text-orange-600 dark:text-orange-400">
          <Clock className="h-4 w-4 mr-1" />
          <span className="text-sm">Unsaved changes</span>
        </div>
      );
    }

    if (lastSaved) {
      return (
        <div className="flex items-center text-gray-500 dark:text-gray-400">
          <CheckCircle className="h-4 w-4 mr-1" />
          <span className="text-sm">Saved {formatLastSaved(lastSaved)}</span>
        </div>
      );
    }

    return null;
  };

  return (
    <div className={cn('flex flex-col h-full border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden', className)}>
      {/* Editor Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center space-x-4">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Content Editor
          </h3>
          {renderSaveStatus()}
        </div>

        <div className="flex items-center space-x-2">
          {/* Sync Scroll Toggle */}
          <button
            type="button"
            onClick={() => setSyncScroll(!syncScroll)}
            className={cn(
              'p-1 rounded text-xs',
              syncScroll
                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            )}
            title="Sync scroll between editor and preview"
          >
            Sync
          </button>

          {/* Manual Save Button */}
          <button
            type="button"
            onClick={handleSave}
            disabled={isAutoSaving || saveStatus === 'saving'}
            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
            title="Save now (Ctrl+S)"
          >
            <Save className="h-4 w-4" />
          </button>

          {/* Preview Toggle */}
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
            title="Toggle preview (Ctrl+P)"
          >
            {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Markdown Editor */}
        <div className={cn('flex-1 flex flex-col', showPreview && 'border-r border-gray-200 dark:border-gray-700')}>
          <MarkdownEditor
            value={value}
            onChange={handleContentChange}
            placeholder={placeholder}
            readOnly={readOnly}
            autoFocus={autoFocus}
            height="100%"
            callbacks={{
              onSave: handleSave,
              onScroll: handleEditorScroll,
            }}
            className="flex-1"
          />
        </div>

        {/* Preview Pane */}
        {showPreview && (
          <div className="flex-1 flex flex-col">
            <PreviewPane
              content={value}
              config={{
                showToc: true,
                syncScroll,
              }}
              onScroll={handlePreviewScroll}
              scrollTop={syncScroll ? editorScrollTop : undefined}
              className="flex-1"
            />
          </div>
        )}
      </div>

      {/* Editor Footer */}
      <div className="p-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-4">
            <span>Markdown Editor</span>
            {enableAutoSave && postId && (
              <span>Auto-save: {autoSaveInterval / 1000}s</span>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <span>Ctrl+S to save</span>
            <span>Ctrl+P to toggle preview</span>
          </div>
        </div>
      </div>
    </div>
  );
}
