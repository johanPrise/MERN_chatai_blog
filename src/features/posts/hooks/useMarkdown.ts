/**
 * Markdown processing hook
 */

import { useMemo, useCallback } from 'react';
import { MarkdownService } from '../services/markdownService';
import { TocItem, ValidationResult } from '../types/editor.types';

interface UseMarkdownOptions {
  enableValidation?: boolean;
  generateToc?: boolean;
  calculateStats?: boolean;
}

interface UseMarkdownReturn {
  html: string;
  toc: TocItem[];
  validation: ValidationResult;
  stats: {
    wordCount: number;
    readingTime: number;
  };
  isMarkdown: boolean;
  toHtml: (markdown: string) => string;
  toMarkdown: (html: string) => string;
  validate: (markdown: string) => ValidationResult;
}

export function useMarkdown(
  content: string,
  options: UseMarkdownOptions = {}
): UseMarkdownReturn {
  const {
    enableValidation = true,
    generateToc = true,
    calculateStats = true,
  } = options;

  const markdownService = MarkdownService.getInstance();

  // Convert markdown to HTML
  const html = useMemo(() => {
    if (!content) return '';
    return markdownService.markdownToHtml(content);
  }, [content, markdownService]);

  // Generate table of contents
  const toc = useMemo(() => {
    if (!generateToc || !content) return [];
    return markdownService.generateToc(content);
  }, [content, generateToc, markdownService]);

  // Validate markdown
  const validation = useMemo(() => {
    if (!enableValidation || !content) {
      return { isValid: true, errors: [], warnings: [] };
    }
    return markdownService.validateMarkdown(content);
  }, [content, enableValidation, markdownService]);

  // Calculate stats
  const stats = useMemo(() => {
    if (!calculateStats || !content) {
      return { wordCount: 0, readingTime: 0 };
    }
    return markdownService.calculateStats(content);
  }, [content, calculateStats, markdownService]);

  // Check if content is markdown
  const isMarkdown = useMemo(() => {
    return markdownService.isMarkdown(content);
  }, [content, markdownService]);

  // Utility functions
  const toHtml = useCallback((markdown: string) => {
    return markdownService.markdownToHtml(markdown);
  }, [markdownService]);

  const toMarkdown = useCallback((html: string) => {
    return markdownService.htmlToMarkdown(html);
  }, [markdownService]);

  const validate = useCallback((markdown: string) => {
    return markdownService.validateMarkdown(markdown);
  }, [markdownService]);

  return {
    html,
    toc,
    validation,
    stats,
    isMarkdown,
    toHtml,
    toMarkdown,
    validate,
  };
}
