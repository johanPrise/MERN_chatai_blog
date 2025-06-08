/**
 * Test utilities for markdown conversion
 * This file can be used to test the markdown conversion functions
 */

import { htmlToMarkdown } from './htmlToMarkdown';
import { markdownToHtml, isMarkdown } from './markdownToHtml';

// Test cases for debugging
export const testMarkdownConversion = () => {
  console.log('=== Testing Markdown Conversion ===');
  
  // Test 1: Simple paragraph
  const simpleText = "This is a simple paragraph.";
  console.log('Simple text:', simpleText);
  console.log('Is markdown:', isMarkdown(simpleText));
  
  // Test 2: Markdown with headers
  const markdownText = `# Main Title

This is a paragraph with **bold text** and *italic text*.

## Subtitle

Another paragraph with a [link](https://example.com).

- List item 1
- List item 2

\`\`\`javascript
console.log("Hello world");
\`\`\``;

  console.log('\nMarkdown text:', markdownText);
  console.log('Is markdown:', isMarkdown(markdownText));
  
  const htmlFromMarkdown = markdownToHtml(markdownText);
  console.log('HTML from markdown:', htmlFromMarkdown);
  
  const backToMarkdown = htmlToMarkdown(htmlFromMarkdown);
  console.log('Back to markdown:', backToMarkdown);
  
  // Test 3: ReactQuill HTML
  const reactQuillHtml = `<p>This is a paragraph from ReactQuill.</p><p><strong>Bold text</strong> and <em>italic text</em>.</p><h2>A heading</h2><p>Another paragraph.</p>`;
  
  console.log('\nReactQuill HTML:', reactQuillHtml);
  const markdownFromHtml = htmlToMarkdown(reactQuillHtml);
  console.log('Markdown from HTML:', markdownFromHtml);
  
  return {
    simpleText,
    markdownText,
    htmlFromMarkdown,
    backToMarkdown,
    reactQuillHtml,
    markdownFromHtml
  };
};

// Call this function in the browser console to test
if (typeof window !== 'undefined') {
  (window as any).testMarkdownConversion = testMarkdownConversion;
}
