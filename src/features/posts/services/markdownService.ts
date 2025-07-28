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
   * Convert markdown to HTML for display with improved formatting preservation
   */
  public markdownToHtml(markdown: string): string {
    if (!markdown) return '';

    let html = markdown;

    // Preserve existing HTML entities and escape only unescaped ones
    html = html
      .replace(/&(?!amp;|lt;|gt;|quot;|#\d+;|#x[0-9a-fA-F]+;)/g, '&amp;')
      .replace(/<(?![/]?[a-zA-Z][^>]*>)/g, '&lt;')
      .replace(/(?<!<[^>]*)>(?![^<]*>)/g, '&gt;');

    // Process in order to avoid conflicts
    
    // 1. Convert code blocks first (to protect content from other conversions)
    html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, (match, lang, code) => {
      const cleanCode = code.trim();
      return `<pre><code class="language-${lang || 'text'}">${cleanCode}</code></pre>`;
    });

    // 2. Convert inline code (protect from other formatting)
    html = html.replace(/`([^`\n]+)`/g, '<code>$1</code>');

    // 3. Convert headers with proper hierarchy preservation
    html = html.replace(/^(#{1,6})\s+(.+)$/gm, (match, hashes, content) => {
      const level = hashes.length;
      const cleanContent = content.trim();
      return `<h${level}>${cleanContent}</h${level}>`;
    });

    // 4. Convert lists with proper nesting and numbering
    html = this.convertLists(html);

    // 5. Convert blockquotes with proper nesting
    html = html.replace(/^>\s*(.+)$/gm, '<blockquote>$1</blockquote>');
    html = html.replace(/(<blockquote>.*?<\/blockquote>)\s*(<blockquote>.*?<\/blockquote>)/gs, 
      (match, first, second) => {
        return first.replace('</blockquote>', '') + '\n' + second.replace('<blockquote>', '') + '</blockquote>';
      });

    // 6. Convert horizontal rules
    html = html.replace(/^(-{3,}|\*{3,}|_{3,})$/gm, '<hr />');

    // 7. Convert text formatting (bold, italic, strikethrough)
    html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>'); // Bold + Italic
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>'); // Bold
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>'); // Italic
    html = html.replace(/___(.+?)___/g, '<strong><em>$1</em></strong>'); // Bold + Italic
    html = html.replace(/__(.+?)__/g, '<strong>$1</strong>'); // Bold
    html = html.replace(/_(.+?)_/g, '<em>$1</em>'); // Italic
    html = html.replace(/~~(.+?)~~/g, '<del>$1</del>'); // Strikethrough

    // 8. Convert links and images
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)(?:\s+"([^"]*)")?\)/g, 
      '<img alt="$1" src="$2" title="$3" class="markdown-image" />');
    html = html.replace(/\[([^\]]+)\]\(([^)]+)(?:\s+"([^"]*)")?\)/g, 
      '<a href="$2" title="$3" target="_blank" rel="noopener noreferrer">$1</a>');

    // 9. Convert paragraphs and line breaks
    html = this.convertParagraphs(html);

    // 10. Clean up and fix HTML structure
    html = this.cleanupHtml(html);

    // 11. Restore HTML entities in final content
    html = html.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

    return html;
  }

  /**
   * Convert HTML to markdown for editing with improved formatting preservation
   */
  public htmlToMarkdown(html: string): string {
    if (!html) return '';

    let markdown = html;

    // Normalize HTML first
    markdown = markdown.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // Convert in specific order to preserve structure

    // 1. Convert code blocks first (preserve content)
    markdown = markdown.replace(/<pre><code[^>]*class="language-(\w+)"[^>]*>([\s\S]*?)<\/code><\/pre>/gi, (match, lang, code) => {
      const cleanCode = code.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
      return `\n\`\`\`${lang}\n${cleanCode.trim()}\n\`\`\`\n`;
    });
    
    markdown = markdown.replace(/<pre><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, (match, code) => {
      const cleanCode = code.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
      return `\n\`\`\`\n${cleanCode.trim()}\n\`\`\`\n`;
    });

    // 2. Convert inline code
    markdown = markdown.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`');

    // 3. Convert headers with proper spacing
    markdown = markdown.replace(/<h([1-6])[^>]*>(.*?)<\/h[1-6]>/gi, (match, level, content) => {
      const hashes = '#'.repeat(parseInt(level));
      const cleanContent = content.replace(/<[^>]*>/g, '').trim();
      return `\n${hashes} ${cleanContent}\n`;
    });

    // 4. Convert lists with proper structure preservation
    markdown = this.convertHtmlListsToMarkdown(markdown);

    // 5. Convert blockquotes with proper nesting
    markdown = markdown.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (match, content) => {
      const lines = content.split('\n');
      const quotedLines = lines.map(line => {
        const trimmed = line.trim();
        return trimmed ? `> ${trimmed}` : '>';
      });
      return `\n${quotedLines.join('\n')}\n`;
    });

    // 6. Convert horizontal rules
    markdown = markdown.replace(/<hr[^>]*\/?>/gi, '\n---\n');

    // 7. Convert text formatting (preserve nested formatting)
    markdown = markdown.replace(/<strong[^>]*><em[^>]*>(.*?)<\/em><\/strong>/gi, '***$1***');
    markdown = markdown.replace(/<em[^>]*><strong[^>]*>(.*?)<\/strong><\/em>/gi, '***$1***');
    markdown = markdown.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
    markdown = markdown.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
    markdown = markdown.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
    markdown = markdown.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');
    markdown = markdown.replace(/<del[^>]*>(.*?)<\/del>/gi, '~~$1~~');

    // 8. Convert links and images
    markdown = markdown.replace(/<img[^>]*alt="([^"]*)"[^>]*src="([^"]*)"[^>]*title="([^"]*)"[^>]*\/?>/gi, '![$1]($2 "$3")');
    markdown = markdown.replace(/<img[^>]*alt="([^"]*)"[^>]*src="([^"]*)"[^>]*\/?>/gi, '![$1]($2)');
    markdown = markdown.replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*\/?>/gi, '![$2]($1)');
    
    markdown = markdown.replace(/<a[^>]*href="([^"]*)"[^>]*title="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$3]($1 "$2")');
    markdown = markdown.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)');

    // 9. Convert paragraphs with proper spacing
    markdown = markdown.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (match, content) => {
      // Handle line breaks within paragraphs
      const processedContent = content.replace(/<br[^>]*\/?>/gi, '\n');
      const cleanContent = processedContent.replace(/<[^>]*>/g, '').trim();
      return cleanContent ? `\n${cleanContent}\n` : '';
    });

    // 10. Convert remaining line breaks
    markdown = markdown.replace(/<br[^>]*\/?>/gi, '\n');

    // 11. Clean up remaining HTML tags
    markdown = markdown.replace(/<[^>]+>/g, '');

    // 12. Normalize whitespace and line breaks
    markdown = markdown.replace(/\n\s*\n\s*\n+/g, '\n\n'); // Fix multiple line breaks
    markdown = markdown.replace(/^\s+|\s+$/g, ''); // Trim
    markdown = markdown.replace(/\n{3,}/g, '\n\n'); // Limit consecutive line breaks

    return markdown;
  }

  /**
   * Convert HTML lists to markdown with proper numbering preservation
   */
  private convertHtmlListsToMarkdown(html: string): string {
    // Convert ordered lists with proper numbering
    html = html.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (match, content) => {
      const items = content.match(/<li[^>]*>([\s\S]*?)<\/li>/gi) || [];
      let counter = 1;
      const markdownItems = items.map(item => {
        const cleanContent = item.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '$1').replace(/<[^>]*>/g, '').trim();
        return `${counter++}. ${cleanContent}`;
      });
      return `\n${markdownItems.join('\n')}\n`;
    });

    // Convert unordered lists
    html = html.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (match, content) => {
      const items = content.match(/<li[^>]*>([\s\S]*?)<\/li>/gi) || [];
      const markdownItems = items.map(item => {
        const cleanContent = item.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '$1').replace(/<[^>]*>/g, '').trim();
        return `- ${cleanContent}`;
      });
      return `\n${markdownItems.join('\n')}\n`;
    });

    return html;
  }

  /**
   * Validate markdown content with improved error detection and specific messages
   */
  public validateMarkdown(markdown: string): ValidationResult {
    const errors: Array<{ line: number; column: number; message: string; severity: 'error'; rule: string }> = [];
    const warnings: Array<{ line: number; column: number; message: string; severity: 'warning'; rule: string }> = [];

    if (!markdown || markdown.trim().length === 0) {
      errors.push({
        line: 1,
        column: 1,
        message: 'Le contenu ne peut pas être vide. Veuillez ajouter du texte.',
        severity: 'error',
        rule: 'content-required'
      });
      return {
        isValid: false,
        errors,
        warnings
      };
    }

    const lines = markdown.split('\n');

    // Check for unmatched code blocks with line numbers
    let codeBlockCount = 0;
    let lastCodeBlockLine = -1;
    lines.forEach((line, index) => {
      const matches = line.match(/```/g);
      if (matches) {
        codeBlockCount += matches.length;
        lastCodeBlockLine = index + 1;
      }
    });

    if (codeBlockCount % 2 !== 0) {
      errors.push({
        line: lastCodeBlockLine,
        column: 1,
        message: 'Bloc de code non fermé. Ajoutez ``` pour fermer le bloc de code.',
        severity: 'error',
        rule: 'unmatched-code-block'
      });
    }

    // Check for unmatched inline code with line numbers
    lines.forEach((line, index) => {
      const inlineCodeMatches = line.match(/`/g);
      if (inlineCodeMatches && inlineCodeMatches.length % 2 !== 0) {
        warnings.push({
          line: index + 1,
          column: line.indexOf('`') + 1,
          message: 'Code inline non fermé. Ajoutez ` pour fermer le code inline.',
          severity: 'warning',
          rule: 'unmatched-inline-code'
        });
      }
    });

    // Check for unmatched bold/italic markers with line numbers
    lines.forEach((line, index) => {
      // Check bold markers (**)
      const boldMatches = line.match(/\*\*/g);
      if (boldMatches && boldMatches.length % 2 !== 0) {
        warnings.push({
          line: index + 1,
          column: line.indexOf('**') + 1,
          message: 'Marqueur de texte gras non fermé. Ajoutez ** pour fermer le texte gras.',
          severity: 'warning',
          rule: 'unmatched-bold'
        });
      }

      // Check italic markers (single *)
      const italicMatches = line.match(/(?<!\*)\*(?!\*)/g);
      if (italicMatches && italicMatches.length % 2 !== 0) {
        warnings.push({
          line: index + 1,
          column: line.search(/(?<!\*)\*(?!\*)/) + 1,
          message: 'Marqueur de texte italique non fermé. Ajoutez * pour fermer le texte italique.',
          severity: 'warning',
          rule: 'unmatched-italic'
        });
      }

      // Check strikethrough markers (~~)
      const strikethroughMatches = line.match(/~~/g);
      if (strikethroughMatches && strikethroughMatches.length % 2 !== 0) {
        warnings.push({
          line: index + 1,
          column: line.indexOf('~~') + 1,
          message: 'Marqueur de texte barré non fermé. Ajoutez ~~ pour fermer le texte barré.',
          severity: 'warning',
          rule: 'unmatched-strikethrough'
        });
      }
    });

    // Check for malformed headers
    lines.forEach((line, index) => {
      const headerMatch = line.match(/^(#{1,6})\s*(.*)$/);
      if (headerMatch) {
        const [, hashes, content] = headerMatch;
        if (!content.trim()) {
          warnings.push({
            line: index + 1,
            column: hashes.length + 1,
            message: 'Titre vide. Ajoutez du contenu après les #.',
            severity: 'warning',
            rule: 'empty-header'
          });
        }
        if (hashes.length > 6) {
          warnings.push({
            line: index + 1,
            column: 1,
            message: 'Niveau de titre trop élevé. Utilisez au maximum 6 # pour les titres.',
            severity: 'warning',
            rule: 'invalid-header-level'
          });
        }
      }
    });

    // Check for malformed links
    lines.forEach((line, index) => {
      const linkMatches = line.matchAll(/\[([^\]]*)\]\(([^)]*)\)/g);
      for (const match of linkMatches) {
        const [fullMatch, text, url] = match;
        if (!text.trim()) {
          warnings.push({
            line: index + 1,
            column: (match.index || 0) + 1,
            message: 'Texte de lien vide. Ajoutez du texte entre les crochets [].',
            severity: 'warning',
            rule: 'empty-link-text'
          });
        }
        if (!url.trim()) {
          warnings.push({
            line: index + 1,
            column: (match.index || 0) + text.length + 3,
            message: 'URL de lien vide. Ajoutez une URL entre les parenthèses ().',
            severity: 'warning',
            rule: 'empty-link-url'
          });
        }
      }
    });

    // Check for malformed images
    lines.forEach((line, index) => {
      const imageMatches = line.matchAll(/!\[([^\]]*)\]\(([^)]*)\)/g);
      for (const match of imageMatches) {
        const [fullMatch, alt, src] = match;
        if (!src.trim()) {
          errors.push({
            line: index + 1,
            column: (match.index || 0) + alt.length + 4,
            message: 'Source d\'image vide. Ajoutez une URL d\'image entre les parenthèses ().',
            severity: 'error',
            rule: 'empty-image-src'
          });
        }
      }
    });

    // Check for very long lines (readability warning)
    lines.forEach((line, index) => {
      if (line.length > 120) {
        warnings.push({
          line: index + 1,
          column: 121,
          message: 'Ligne très longue. Considérez diviser cette ligne pour améliorer la lisibilité.',
          severity: 'warning',
          rule: 'long-line'
        });
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
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

  /**
   * Convert lists with proper nesting and numbering preservation
   */
  private convertLists(html: string): string {
    const lines = html.split('\n');
    const result: string[] = [];
    let inList = false;
    let listType: 'ul' | 'ol' | null = null;
    let listItems: string[] = [];
    let currentIndent = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();

      // Check for ordered list item
      const orderedMatch = trimmedLine.match(/^(\d+)\.\s+(.+)$/);
      // Check for unordered list item
      const unorderedMatch = trimmedLine.match(/^[\*\-\+]\s+(.+)$/);

      if (orderedMatch) {
        if (!inList || listType !== 'ol') {
          if (inList) {
            // Close previous list
            result.push(`</${listType}>`);
          }
          // Start new ordered list
          result.push('<ol>');
          listType = 'ol';
          inList = true;
          listItems = [];
        }
        result.push(`<li>${orderedMatch[2]}</li>`);
      } else if (unorderedMatch) {
        if (!inList || listType !== 'ul') {
          if (inList) {
            // Close previous list
            result.push(`</${listType}>`);
          }
          // Start new unordered list
          result.push('<ul>');
          listType = 'ul';
          inList = true;
          listItems = [];
        }
        result.push(`<li>${unorderedMatch[1]}</li>`);
      } else {
        // Not a list item
        if (inList) {
          // Close current list
          result.push(`</${listType}>`);
          inList = false;
          listType = null;
        }
        result.push(line);
      }
    }

    // Close any remaining open list
    if (inList && listType) {
      result.push(`</${listType}>`);
    }

    return result.join('\n');
  }

  /**
   * Convert paragraphs and line breaks with proper formatting preservation
   */
  private convertParagraphs(html: string): string {
    const lines = html.split('\n');
    const result: string[] = [];
    let currentParagraph: string[] = [];
    let inCodeBlock = false;
    let inList = false;
    let inBlockquote = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();

      // Check if we're entering/leaving a code block
      if (trimmedLine.startsWith('<pre>')) {
        inCodeBlock = true;
      } else if (trimmedLine.endsWith('</pre>')) {
        inCodeBlock = false;
      }

      // Check if we're in a list
      if (trimmedLine.startsWith('<ul>') || trimmedLine.startsWith('<ol>')) {
        inList = true;
      } else if (trimmedLine.startsWith('</ul>') || trimmedLine.startsWith('</ol>')) {
        inList = false;
      }

      // Check if we're in a blockquote
      if (trimmedLine.startsWith('<blockquote>')) {
        inBlockquote = true;
      } else if (trimmedLine.endsWith('</blockquote>')) {
        inBlockquote = false;
      }

      // Skip processing if we're in special blocks
      if (inCodeBlock || inList || inBlockquote || 
          trimmedLine.startsWith('<h') || 
          trimmedLine.startsWith('<hr') ||
          trimmedLine.startsWith('<li>')) {
        // Flush current paragraph if any
        if (currentParagraph.length > 0) {
          const paragraphContent = currentParagraph.join(' ').trim();
          if (paragraphContent) {
            result.push(`<p>${paragraphContent}</p>`);
          }
          currentParagraph = [];
        }
        result.push(line);
        continue;
      }

      // Handle empty lines
      if (!trimmedLine) {
        if (currentParagraph.length > 0) {
          const paragraphContent = currentParagraph.join(' ').trim();
          if (paragraphContent) {
            result.push(`<p>${paragraphContent}</p>`);
          }
          currentParagraph = [];
        }
        continue;
      }

      // Add to current paragraph
      currentParagraph.push(trimmedLine);
    }

    // Flush any remaining paragraph
    if (currentParagraph.length > 0) {
      const paragraphContent = currentParagraph.join(' ').trim();
      if (paragraphContent) {
        result.push(`<p>${paragraphContent}</p>`);
      }
    }

    return result.join('\n');
  }

  private cleanupHtml(html: string): string {
    // Fix nested lists and other HTML structure issues
    html = html.replace(/(<\/ul>)\s*(<ul>)/g, ''); // Merge adjacent ul tags
    html = html.replace(/(<\/ol>)\s*(<ol>)/g, ''); // Merge adjacent ol tags
    
    // Fix empty list items
    html = html.replace(/<li>\s*<\/li>/g, '');
    
    // Fix nested blockquotes
    html = html.replace(/(<\/blockquote>)\s*(<blockquote>)/g, '\n');
    
    // Clean up extra whitespace
    html = html.replace(/\n\s*\n\s*\n+/g, '\n\n');
    
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
