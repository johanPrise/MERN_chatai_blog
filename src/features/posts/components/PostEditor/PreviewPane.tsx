/**
 * Preview Pane Component for Markdown Editor
 */

import React, { useEffect, useRef } from 'react';
import { PreviewProps, TocItem } from '../../types/editor.types';
import { useMarkdown } from '../../hooks/useMarkdown';
import { cn } from '../../../../lib/utils';

export function PreviewPane({
  content,
  config = {},
  className = '',
  onScroll,
  scrollTop,
}: PreviewProps) {
  const previewRef = useRef<HTMLDivElement>(null);
  const { html, toc } = useMarkdown(content, {
    generateToc: config.showToc !== false,
  });

  // Handle scroll synchronization
  useEffect(() => {
    if (scrollTop !== undefined && previewRef.current) {
      previewRef.current.scrollTop = scrollTop;
    }
  }, [scrollTop]);

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    if (onScroll) {
      onScroll(event.currentTarget.scrollTop);
    }
  };

  // Render table of contents
  const renderToc = (items: TocItem[], level = 0) => {
    if (!items.length) return null;

    return (
      <ul className={cn('space-y-1', level > 0 && 'ml-4 mt-2')}>
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.anchor}`}
              className={cn(
                'block text-sm hover:text-primary-600 dark:hover:text-primary-400 transition-colors',
                level === 0 && 'font-medium',
                level === 1 && 'text-gray-700 dark:text-gray-300',
                level >= 2 && 'text-gray-600 dark:text-gray-400'
              )}
              onClick={(e) => {
                e.preventDefault();
                const element = previewRef.current?.querySelector(`#${item.anchor}`);
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            >
              {item.title}
            </a>
            {item.children && renderToc(item.children, level + 1)}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Table of Contents */}
      {config.showToc && toc.length > 0 && (
        <div className="border-b border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
            Table of Contents
          </h3>
          <div className="max-h-32 overflow-y-auto">
            {renderToc(toc)}
          </div>
        </div>
      )}

      {/* Preview Content */}
      <div
        ref={previewRef}
        className="flex-1 overflow-y-auto p-4 bg-white dark:bg-gray-900"
        onScroll={handleScroll}
      >
        {content ? (
          <div
            className={cn(
              'prose prose-sm max-w-none',
              'dark:prose-invert',
              'prose-headings:font-semibold',
              'prose-h1:text-2xl prose-h1:mb-4',
              'prose-h2:text-xl prose-h2:mb-3',
              'prose-h3:text-lg prose-h3:mb-2',
              'prose-p:mb-4 prose-p:leading-relaxed',
              'prose-a:text-primary-600 dark:prose-a:text-primary-400',
              'prose-a:no-underline hover:prose-a:underline',
              'prose-strong:text-gray-900 dark:prose-strong:text-gray-100',
              'prose-code:bg-gray-100 dark:prose-code:bg-gray-800',
              'prose-code:px-1 prose-code:py-0.5 prose-code:rounded',
              'prose-code:text-sm prose-code:font-mono',
              'prose-pre:bg-gray-100 dark:prose-pre:bg-gray-800',
              'prose-pre:border prose-pre:border-gray-200 dark:prose-pre:border-gray-700',
              'prose-blockquote:border-l-4 prose-blockquote:border-primary-500',
              'prose-blockquote:bg-gray-50 dark:prose-blockquote:bg-gray-800',
              'prose-blockquote:py-2 prose-blockquote:px-4',
              'prose-ul:list-disc prose-ol:list-decimal',
              'prose-li:mb-1',
              'prose-img:rounded-lg prose-img:shadow-md',
              'prose-hr:border-gray-300 dark:prose-hr:border-gray-600'
            )}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500">
            <div className="text-center">
              <div className="text-4xl mb-4">📝</div>
              <p className="text-lg font-medium">Start writing to see preview</p>
              <p className="text-sm mt-2">Your markdown will be rendered here in real-time</p>
            </div>
          </div>
        )}
      </div>

      {/* Preview Footer */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-2 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>Live Preview</span>
          {content && (
            <span>
              {html.length} characters rendered
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// Add CSS for better markdown rendering
const previewStyles = `
  .markdown-image {
    max-width: 100%;
    height: auto;
    border-radius: 0.5rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }

  .prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6 {
    scroll-margin-top: 2rem;
  }

  .prose pre {
    overflow-x: auto;
  }

  .prose code {
    word-break: break-word;
  }

  .prose table {
    width: 100%;
    border-collapse: collapse;
    margin: 1rem 0;
  }

  .prose th,
  .prose td {
    border: 1px solid #e5e7eb;
    padding: 0.5rem;
    text-align: left;
  }

  .dark .prose th,
  .dark .prose td {
    border-color: #374151;
  }

  .prose th {
    background-color: #f9fafb;
    font-weight: 600;
  }

  .dark .prose th {
    background-color: #1f2937;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = previewStyles;
  document.head.appendChild(styleElement);
}
