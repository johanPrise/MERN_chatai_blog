/**
 * Utility function to convert Markdown to HTML for ReactQuill editor
 * This handles the conversion from stored markdown to editor-friendly HTML
 */
export function markdownToHtml(markdown: string): string {
  if (!markdown) return '';

  let html = markdown;

  // Escape HTML entities first to prevent conflicts
  html = html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Convert headers
  html = html.replace(/^######\s+(.*$)/gm, '<h6>$1</h6>');
  html = html.replace(/^#####\s+(.*$)/gm, '<h5>$1</h5>');
  html = html.replace(/^####\s+(.*$)/gm, '<h4>$1</h4>');
  html = html.replace(/^###\s+(.*$)/gm, '<h3>$1</h3>');
  html = html.replace(/^##\s+(.*$)/gm, '<h2>$1</h2>');
  html = html.replace(/^#\s+(.*$)/gm, '<h1>$1</h1>');

  // Convert bold text
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');

  // Convert italic text
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  html = html.replace(/_([^_]+)_/g, '<em>$1</em>');

  // Convert strikethrough
  html = html.replace(/~~(.*?)~~/g, '<del>$1</del>');

  // Convert inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Convert code blocks
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>');

  // Convert links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // Convert images
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img alt="$1" src="$2" />');

  // Convert blockquotes
  html = html.replace(/^>\s+(.*$)/gm, '<blockquote>$1</blockquote>');

  // Convert unordered lists
  html = html.replace(/^[\*\-\+]\s+(.*$)/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/g, '<ul>$1</ul>');

  // Convert ordered lists
  html = html.replace(/^\d+\.\s+(.*$)/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/g, '<ol>$1</ol>');

  // Convert horizontal rules
  html = html.replace(/^---+$/gm, '<hr />');

  // Convert line breaks and paragraphs
  html = html.replace(/\n\n/g, '</p><p>');
  html = html.replace(/\n/g, '<br />');

  // Wrap in paragraphs if not already wrapped
  if (!html.startsWith('<') && html.trim()) {
    html = '<p>' + html + '</p>';
  }

  // Clean up empty paragraphs
  html = html.replace(/<p><\/p>/g, '');
  html = html.replace(/<p>\s*<\/p>/g, '');

  // Unescape HTML entities in attributes
  html = html.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

  return html;
}

/**
 * Check if content is likely markdown
 */
export function isMarkdown(content: string): boolean {
  if (!content) return false;
  
  // Check for common markdown patterns
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
