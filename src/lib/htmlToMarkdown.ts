/**
 * Utility function to convert HTML to Markdown
 * This is a robust implementation that handles ReactQuill HTML output
 */
export function htmlToMarkdown(html: string): string {
  if (!html) return '';

  let markdown = html;

  // Remove empty paragraphs first
  markdown = markdown.replace(/<p[^>]*>\s*<\/p>/gi, '');

  // Handle ReactQuill specific formatting
  markdown = markdown.replace(/<p[^>]*><br[^>]*><\/p>/gi, '\n\n');

  // Preserve line breaks but normalize whitespace within content
  markdown = markdown.replace(/\s+/g, ' ').trim();

  // Remove any script tags and their content
  markdown = markdown.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Handle headings
  markdown = markdown.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n');
  markdown = markdown.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n');
  markdown = markdown.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n');
  markdown = markdown.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n');
  markdown = markdown.replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n\n');
  markdown = markdown.replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n\n');

  // Handle paragraphs - preserve content without adding extra formatting
  markdown = markdown.replace(/<p[^>]*>(.*?)<\/p>/gi, function(match, content) {
    // Clean up the content and add proper spacing
    const cleanContent = content.trim();
    // Don't add extra newlines if content is empty or already has markdown formatting
    if (!cleanContent) return '';
    if (cleanContent.match(/^#+\s/)) return cleanContent + '\n\n'; // Headers
    return cleanContent + '\n\n';
  });

  // Handle line breaks
  markdown = markdown.replace(/<br\s*\/?>/gi, '\n');

  // Handle bold text
  markdown = markdown.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
  markdown = markdown.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');

  // Handle italic text
  markdown = markdown.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
  markdown = markdown.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');

  // Handle strikethrough text
  markdown = markdown.replace(/<del[^>]*>(.*?)<\/del>/gi, '~~$1~~');
  markdown = markdown.replace(/<s[^>]*>(.*?)<\/s>/gi, '~~$1~~');

  // Handle blockquotes
  markdown = markdown.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, '> $1\n\n');

  // Handle unordered lists
  markdown = markdown.replace(/<ul[^>]*>(.*?)<\/ul>/gi, function(match, content) {
    return content.replace(/<li[^>]*>(.*?)<\/li>/gi, '* $1\n') + '\n';
  });

  // Handle ordered lists
  markdown = markdown.replace(/<ol[^>]*>(.*?)<\/ol>/gi, function(match, content) {
    let index = 1;
    const listItems = content.replace(/<li[^>]*>(.*?)<\/li>/gi, function(match, item) {
      return (index++) + '. ' + item.trim() + '\n';
    });
    return listItems + '\n';
  });

  // Handle links
  markdown = markdown.replace(/<a[^>]*href=["'](.*?)["'][^>]*>(.*?)<\/a>/gi, '[$2]($1)');

  // Handle images
  markdown = markdown.replace(/<img[^>]*src=["'](.*?)["'][^>]*alt=["'](.*?)["'][^>]*>/gi, '![$2]($1)');
  markdown = markdown.replace(/<img[^>]*alt=["'](.*?)["'][^>]*src=["'](.*?)["'][^>]*>/gi, '![$1]($2)');
  markdown = markdown.replace(/<img[^>]*src=["'](.*?)["'][^>]*>/gi, '![]($1)');

  // Handle code blocks
  markdown = markdown.replace(/<pre[^>]*><code[^>]*>(.*?)<\/code><\/pre>/gi, '```\n$1\n```\n\n');

  // Handle inline code
  markdown = markdown.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`');

  // Handle horizontal rules
  markdown = markdown.replace(/<hr[^>]*>/gi, '---\n\n');

  // Remove remaining HTML tags
  markdown = markdown.replace(/<[^>]*>/g, '');

  // Decode HTML entities
  markdown = markdown.replace(/&nbsp;/g, ' ');
  markdown = markdown.replace(/&amp;/g, '&');
  markdown = markdown.replace(/&lt;/g, '<');
  markdown = markdown.replace(/&gt;/g, '>');
  markdown = markdown.replace(/&quot;/g, '"');
  markdown = markdown.replace(/&#39;/g, "'");

  // Fix multiple line breaks and clean up
  markdown = markdown.replace(/\n\s*\n\s*\n+/g, '\n\n');
  markdown = markdown.replace(/^\s+|\s+$/g, ''); // Trim whitespace

  // Remove any remaining HTML artifacts
  markdown = markdown.replace(/<\/?[^>]+(>|$)/g, '');

  return markdown;
}
