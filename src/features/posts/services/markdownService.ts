/**
 * Enhanced Markdown Service
 * Handles all markdown processing with proper conversion and validation
 */

import { TocItem, ValidationResult } from '../types/editor.types';

export class MarkdownService {
  private static instance: MarkdownService;

  public static getInstance(): MarkdownService {
    if (!MarkdownService.instance) {
      MarkdownService.instance = new MarkdownService();
    }
    return MarkdownService.instance;
  }

  /**
   * Convert markdown to HTML for display
   */
  public markdownToHtml(markdown: string): string {
    if (!markdown) return '';

    let html = markdown;

    // Escape HTML entities first
    html = html
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Convert headers (must be first)
    html = html.replace(/^######\s+(.*$)/gm, '<h6>$1</h6>');
    html = html.replace(/^#####\s+(.*$)/gm, '<h5>$1</h5>');
    html = html.replace(/^####\s+(.*$)/gm, '<h4>$1</h4>');
    html = html.replace(/^###\s+(.*$)/gm, '<h3>$1</h3>');
    html = html.replace(/^##\s+(.*$)/gm, '<h2>$1</h2>');
    html = html.replace(/^#\s+(.*$)/gm, '<h1>$1</h1>');

    // Convert code blocks (before inline code)
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>');

    // Convert inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Convert bold text
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');

    // Convert italic text
    html = html.replace(/\*([^*\n]+)\*/g, '<em>$1</em>');
    html = html.replace(/_([^_\n]+)_/g, '<em>$1</em>');

    // Convert strikethrough
    html = html.replace(/~~(.*?)~~/g, '<del>$1</del>');

    // Convert links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    // Convert images
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img alt="$1" src="$2" class="markdown-image" />');

    // Convert blockquotes
    html = html.replace(/^>\s+(.*$)/gm, '<blockquote>$1</blockquote>');

    // Convert horizontal rules
    html = html.replace(/^---+$/gm, '<hr />');

    // Convert unordered lists
    html = html.replace(/^[\*\-\+]\s+(.*$)/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');

    // Convert ordered lists
    html = html.replace(/^\d+\.\s+(.*$)/gm, '<li>$1</li>');
    // Note: This will conflict with unordered lists, need better logic

    // Convert line breaks and paragraphs
    html = html.split('\n\n').map(paragraph => {
      const trimmed = paragraph.trim();
      if (!trimmed) return '';
      
      // Don't wrap if already has HTML tags
      if (trimmed.match(/^<(h[1-6]|ul|ol|blockquote|pre|hr)/)) {
        return trimmed;
      }
      
      // Convert single line breaks to <br>
      const withBreaks = trimmed.replace(/\n/g, '<br />');
      return `<p>${withBreaks}</p>`;
    }).filter(Boolean).join('\n\n');

    // Clean up nested lists and fix HTML structure
    html = this.cleanupHtml(html);

    // Unescape HTML entities in content
    html = html.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

    return html;
  }

  /**
   * Convert HTML to markdown for editing
   */
  public htmlToMarkdown(html: string): string {
    if (!html) return '';

    let markdown = html;

    // Remove empty paragraphs and normalize whitespace
    markdown = markdown.replace(/<p[^>]*>\s*<\/p>/gi, '');
    markdown = markdown.replace(/<p[^>]*><br[^>]*><\/p>/gi, '\n\n');

    // Convert headers
    markdown = markdown.replace(/<h([1-6])[^>]*>(.*?)<\/h[1-6]>/gi, (match, level, content) => {
      const hashes = '#'.repeat(parseInt(level));
      return `${hashes} ${content.trim()}`;
    });

    // Convert code blocks
    markdown = markdown.replace(/<pre><code[^>]*class="language-(\w+)"[^>]*>([\s\S]*?)<\/code><\/pre>/gi, '```$1\n$2\n```');
    markdown = markdown.replace(/<pre><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, '```\n$1\n```');

    // Convert inline code
    markdown = markdown.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`');

    // Convert bold
    markdown = markdown.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
    markdown = markdown.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');

    // Convert italic
    markdown = markdown.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
    markdown = markdown.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');

    // Convert strikethrough
    markdown = markdown.replace(/<del[^>]*>(.*?)<\/del>/gi, '~~$1~~');

    // Convert links
    markdown = markdown.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)');

    // Convert images
    markdown = markdown.replace(/<img[^>]*alt="([^"]*)"[^>]*src="([^"]*)"[^>]*\/?>/gi, '![$1]($2)');

    // Convert blockquotes
    markdown = markdown.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, '> $1');

    // Convert horizontal rules
    markdown = markdown.replace(/<hr[^>]*\/?>/gi, '---');

    // Convert lists
    markdown = markdown.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (match, content) => {
      return content.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1');
    });

    markdown = markdown.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (match, content) => {
      let counter = 1;
      return content.replace(/<li[^>]*>(.*?)<\/li>/gi, () => `${counter++}. $1`);
    });

    // Convert paragraphs
    markdown = markdown.replace(/<p[^>]*>(.*?)<\/p>/gi, (match, content) => {
      const cleaned = content.replace(/<br[^>]*\/?>/gi, '\n').trim();
      return cleaned ? cleaned + '\n\n' : '';
    });

    // Convert line breaks
    markdown = markdown.replace(/<br[^>]*\/?>/gi, '\n');

    // Clean up extra whitespace and HTML artifacts
    markdown = markdown.replace(/<[^>]+>/g, ''); // Remove any remaining HTML tags
    markdown = markdown.replace(/\n\s*\n\s*\n+/g, '\n\n'); // Fix multiple line breaks
    markdown = markdown.replace(/^\s+|\s+$/g, ''); // Trim

    return markdown;
  }

  /**
   * Validate markdown content
   */
  public validateMarkdown(markdown: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!markdown || markdown.trim().length === 0) {
      errors.push('Content cannot be empty');
    }

    // Check for unmatched code blocks
    const codeBlockMatches = markdown.match(/```/g);
    if (codeBlockMatches && codeBlockMatches.length % 2 !== 0) {
      errors.push('Unmatched code block delimiters');
    }

    // Check for unmatched inline code
    const inlineCodeMatches = markdown.match(/`/g);
    if (inlineCodeMatches && inlineCodeMatches.length % 2 !== 0) {
      warnings.push('Unmatched inline code delimiters');
    }

    // Check for unmatched bold/italic markers
    const boldMatches = markdown.match(/\*\*/g);
    if (boldMatches && boldMatches.length % 2 !== 0) {
      warnings.push('Unmatched bold text markers');
    }

    const italicMatches = markdown.match(/(?<!\*)\*(?!\*)/g);
    if (italicMatches && italicMatches.length % 2 !== 0) {
      warnings.push('Unmatched italic text markers');
    }

    return {
      isValid: errors.length === 0,
      errors: errors.map(msg => ({ line: 0, column: 0, message: msg, severity: 'error' as const, rule: 'syntax' })),
      warnings: warnings.map(msg => ({ line: 0, column: 0, message: msg, severity: 'warning' as const, rule: 'syntax' }))
    };
  }

  /**
   * Generate table of contents from markdown
   */
  public generateToc(markdown: string): TocItem[] {
    const toc: TocItem[] = [];
    const lines = markdown.split('\n');
    
    lines.forEach((line, index) => {
      const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
      if (headerMatch) {
        const level = headerMatch[1].length;
        const title = headerMatch[2].trim();
        const anchor = this.generateAnchor(title);
        
        toc.push({
          id: `toc-${index}`,
          title,
          level,
          anchor,
        });
      }
    });

    return this.buildTocHierarchy(toc);
  }

  /**
   * Extract metadata from markdown frontmatter
   */
  public extractMetadata(markdown: string): Record<string, any> {
    const frontmatterMatch = markdown.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) return {};

    const frontmatter = frontmatterMatch[1];
    const metadata: Record<string, any> = {};

    frontmatter.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split(':');
      if (key && valueParts.length > 0) {
        const value = valueParts.join(':').trim();
        metadata[key.trim()] = value.replace(/^["']|["']$/g, ''); // Remove quotes
      }
    });

    return metadata;
  }

  /**
   * Calculate reading time and word count
   */
  public calculateStats(markdown: string): { wordCount: number; readingTime: number } {
    const text = markdown
      .replace(/```[\s\S]*?```/g, '') // Remove code blocks
      .replace(/`[^`]+`/g, '') // Remove inline code
      .replace(/[#*_~`\[\]()]/g, '') // Remove markdown syntax
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    const wordCount = text.split(' ').filter(word => word.length > 0).length;
    const readingTime = Math.ceil(wordCount / 200); // Assuming 200 words per minute

    return { wordCount, readingTime };
  }

  /**
   * Check if content is markdown
   */
  public isMarkdown(content: string): boolean {
    if (!content) return false;
    
    const markdownPatterns = [
      /^#+\s/m,           // Headers
      /\*\*.*?\*\*/,      // Bold
      /\*.*?\*/,          // Italic
      /```[\s\S]*?```/,   // Code blocks
      /`.*?`/,            // Inline code
      /^\*\s/m,           // Unordered list
      /^\d+\.\s/m,        // Ordered list
      /^\>\s/m,           // Blockquote
      /\[.*?\]\(.*?\)/,   // Links
      /!\[.*?\]\(.*?\)/,  // Images
    ];

    return markdownPatterns.some(pattern => pattern.test(content));
  }

  private cleanupHtml(html: string): string {
    // Fix nested lists and other HTML structure issues
    html = html.replace(/(<\/ul>)\s*(<ul>)/g, ''); // Merge adjacent ul tags
    html = html.replace(/(<\/ol>)\s*(<ol>)/g, ''); // Merge adjacent ol tags
    
    return html;
  }

  private generateAnchor(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  private buildTocHierarchy(flatToc: TocItem[]): TocItem[] {
    const result: TocItem[] = [];
    const stack: TocItem[] = [];

    flatToc.forEach(item => {
      // Find the correct parent level
      while (stack.length > 0 && stack[stack.length - 1].level >= item.level) {
        stack.pop();
      }

      if (stack.length === 0) {
        result.push(item);
      } else {
        const parent = stack[stack.length - 1];
        if (!parent.children) parent.children = [];
        parent.children.push(item);
      }

      stack.push(item);
    });

    return result;
  }
}
