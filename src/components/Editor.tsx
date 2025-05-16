"use client"

import ReactQuill from "react-quill"
import React, { useEffect, useState } from "react"
import { EditorProps } from "../types/EditorProps"
import { htmlToMarkdown } from "../lib/htmlToMarkdown"

/**
 * Editor component for text editing with specified modules and formats.
 * Handles both HTML and Markdown content.
 */
export default function Editor({ value, onChange, className = "" }: EditorProps): React.ReactElement {
  // State to track if the content is HTML or Markdown
  const [isHtml, setIsHtml] = useState<boolean>(false)

  // Initialize editor content
  useEffect(() => {
    // Check if the value is HTML
    const isHtmlContent = value && value.trim().startsWith('<') && value.includes('</')
    setIsHtml(isHtmlContent)
  }, [])

  // Handle editor content change
  const handleChange = (content: string) => {
    // If the content is HTML, convert it to Markdown before passing it to the parent component
    if (content && content.trim().startsWith('<') && content.includes('</')) {
      // Convert HTML to Markdown
      const markdownContent = htmlToMarkdown(content)
      onChange(markdownContent)
    } else {
      // Pass the content as is
      onChange(content)
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
        value={value}
        theme="snow"
        modules={modules}
        formats={formats}
        onChange={handleChange}
        className={`h-64 p-2 border-lime-700 ${className}`}
      />
      <div className="text-xs text-gray-500 mt-1">
        <span>Content will be saved as Markdown to preserve formatting.</span>
      </div>
    </div>
  )
}
