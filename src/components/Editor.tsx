"use client"

import ReactQuill from "react-quill"
import React, { useEffect, useState, useMemo } from "react"
import { EditorProps } from "../types/EditorProps"
import { htmlToMarkdown } from "../lib/htmlToMarkdown"
import { markdownToHtml, isMarkdown } from "../lib/markdownToHtml"

/**
 * Editor component for text editing with specified modules and formats.
 * Handles both HTML and Markdown content with proper conversion.
 */
export default function Editor({ value, onChange, className = "" }: EditorProps): React.ReactElement {
  // State to track the editor's HTML content
  const [editorContent, setEditorContent] = useState<string>("")

  // Convert markdown to HTML for the editor when value changes
  useEffect(() => {
    if (value) {
      if (isMarkdown(value)) {
        // Convert markdown to HTML for the editor
        const htmlContent = markdownToHtml(value)
        setEditorContent(htmlContent)
      } else {
        // Assume it's already HTML or plain text
        setEditorContent(value)
      }
    } else {
      setEditorContent("")
    }
  }, [value])

  // Handle editor content change
  const handleChange = (content: string) => {
    // Update the editor content state
    setEditorContent(content)

    // Always convert HTML from ReactQuill to Markdown for storage
    if (content && content.trim()) {
      const markdownContent = htmlToMarkdown(content)
      onChange(markdownContent)
    } else {
      onChange("")
    }
  }

  const modules = {
    toolbar: [
      [{ header: [1, 2, false] }],
      ["bold", "italic", "underline", "strike", "blockquote"],
      [{ list: "ordered" }, { list: "bullet" }, { indent: "-1" }, { indent: "+1" }],
      ["link", "image"],
      ["clean"],
    ],
  }

  const formats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "blockquote",
    "list",
    "bullet",
    "indent",
    "link",
    "image",
  ]

  return (
    <div className="editor-container">
      <ReactQuill
        value={editorContent}
        theme="snow"
        modules={modules}
        formats={formats}
        onChange={handleChange}
        className={`h-64 p-2 border-lime-700 ${className}`}
        placeholder="Start writing your content..."
      />
      <div className="text-xs text-gray-500 mt-1">
        <span>Content will be saved as Markdown to preserve formatting.</span>
      </div>
    </div>
  )
}
