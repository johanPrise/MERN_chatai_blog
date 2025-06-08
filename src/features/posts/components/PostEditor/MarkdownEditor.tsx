/**
 * Enhanced Markdown Editor Component
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { MarkdownEditorProps, EditorSelection } from '../../types/editor.types';
import { useMarkdown } from '../../hooks/useMarkdown';
import { cn } from '../../../../lib/utils';

export function MarkdownEditor({
  value,
  onChange,
  config = {},
  callbacks = {},
  className = '',
  placeholder = 'Start writing your content...',
  readOnly = false,
  autoFocus = false,
  height = '400px',
}: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [selection, setSelection] = useState<EditorSelection | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  const { validation, stats } = useMarkdown(value, {
    enableValidation: true,
    calculateStats: true,
  });

  // Handle content changes
  const handleChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = event.target.value;
    onChange(newValue);
    callbacks.onChange?.(newValue);
  }, [onChange, callbacks]);

  // Handle selection changes
  const handleSelectionChange = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);

    const newSelection: EditorSelection = {
      start: { line: 0, column: start },
      end: { line: 0, column: end },
      text: selectedText,
    };

    setSelection(newSelection);
    callbacks.onSelectionChange?.(newSelection);
  }, [value, callbacks]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    callbacks.onKeyDown?.(event.nativeEvent);

    // Handle common markdown shortcuts
    if (event.ctrlKey || event.metaKey) {
      switch (event.key) {
        case 'b':
          event.preventDefault();
          insertMarkdown('**', '**', 'bold text');
          break;
        case 'i':
          event.preventDefault();
          insertMarkdown('*', '*', 'italic text');
          break;
        case 'k':
          event.preventDefault();
          insertMarkdown('[', '](url)', 'link text');
          break;
        case 's':
          event.preventDefault();
          callbacks.onSave?.(value);
          break;
      }
    }

    // Handle tab for indentation
    if (event.key === 'Tab') {
      event.preventDefault();
      insertText('  '); // 2 spaces for indentation
    }
  }, [callbacks, value]);

  // Insert markdown formatting
  const insertMarkdown = useCallback((before: string, after: string, placeholder: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const textToInsert = selectedText || placeholder;
    const newText = before + textToInsert + after;

    const newValue = value.substring(0, start) + newText + value.substring(end);
    onChange(newValue);

    // Set cursor position
    setTimeout(() => {
      if (selectedText) {
        textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length);
      } else {
        textarea.setSelectionRange(start + before.length, start + before.length + placeholder.length);
      }
      textarea.focus();
    }, 0);
  }, [value, onChange]);

  // Insert plain text
  const insertText = useCallback((text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    const newValue = value.substring(0, start) + text + value.substring(end);
    onChange(newValue);

    // Set cursor position
    setTimeout(() => {
      textarea.setSelectionRange(start + text.length, start + text.length);
      textarea.focus();
    }, 0);
  }, [value, onChange]);

  // Handle focus events
  const handleFocus = useCallback(() => {
    setIsFocused(true);
    callbacks.onFocus?.();
  }, [callbacks]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    callbacks.onBlur?.();
  }, [callbacks]);

  // Handle paste events
  const handlePaste = useCallback((event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    callbacks.onPaste?.(event.nativeEvent);
  }, [callbacks]);

  // Handle drop events
  const handleDrop = useCallback((event: React.DragEvent<HTMLTextAreaElement>) => {
    event.preventDefault();
    callbacks.onDrop?.(event.nativeEvent);
  }, [callbacks]);

  // Auto-focus if requested
  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  // Expose editor actions
  const editorActions = {
    insertMarkdown,
    insertText,
    focus: () => textareaRef.current?.focus(),
    getSelection: () => selection,
  };

  // Make actions available to parent
  useEffect(() => {
    if (callbacks.onEditorReady) {
      callbacks.onEditorReady(editorActions);
    }
  }, [callbacks, editorActions]);

  return (
    <div className={cn('relative', className)}>
      {/* Editor Toolbar */}
      <div className="flex items-center justify-between p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => insertMarkdown('**', '**', 'bold text')}
            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
            title="Bold (Ctrl+B)"
          >
            <strong>B</strong>
          </button>
          <button
            type="button"
            onClick={() => insertMarkdown('*', '*', 'italic text')}
            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
            title="Italic (Ctrl+I)"
          >
            <em>I</em>
          </button>
          <button
            type="button"
            onClick={() => insertMarkdown('[', '](url)', 'link text')}
            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
            title="Link (Ctrl+K)"
          >
            🔗
          </button>
          <button
            type="button"
            onClick={() => insertMarkdown('![', '](url)', 'alt text')}
            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
            title="Image"
          >
            🖼️
          </button>
          <button
            type="button"
            onClick={() => insertMarkdown('```\n', '\n```', 'code')}
            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
            title="Code Block"
          >
            {'</>'}
          </button>
        </div>

        {/* Stats */}
        <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
          <span>{stats.wordCount} words</span>
          <span>{stats.readingTime} min read</span>
          {!validation.isValid && (
            <span className="text-red-500">{validation.errors.length} errors</span>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onSelect={handleSelectionChange}
          onPaste={handlePaste}
          onDrop={handleDrop}
          placeholder={placeholder}
          readOnly={readOnly}
          className={cn(
            'w-full p-4 font-mono text-sm resize-none border-0 outline-none',
            'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100',
            'placeholder-gray-400 dark:placeholder-gray-500',
            isFocused && 'ring-2 ring-primary-500 ring-opacity-50',
            className
          )}
          style={{ height, minHeight: '200px' }}
          spellCheck={config.spellCheck !== false}
        />

        {/* Validation Errors */}
        {validation.errors.length > 0 && (
          <div className="absolute bottom-2 right-2 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded p-2 text-xs">
            <div className="font-medium text-red-800 dark:text-red-200">Validation Errors:</div>
            <ul className="mt-1 text-red-700 dark:text-red-300">
              {validation.errors.slice(0, 3).map((error, index) => (
                <li key={index}>• {error.message}</li>
              ))}
              {validation.errors.length > 3 && (
                <li>• ... and {validation.errors.length - 3} more</li>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
