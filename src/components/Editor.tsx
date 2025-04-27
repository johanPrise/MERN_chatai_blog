"use client"

import ReactQuill from "react-quill"
import React from "react"
import { EditorProps } from "../types/EditorProps"



/**
 * Editor component for text editing with specified modules and formats.
 */
export default function Editor({ value, onChange, className = "" }: EditorProps): React.ReactElement {
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
    <ReactQuill
      value={value}
      theme="snow"
      modules={modules}
      formats={formats}
      onChange={onChange}
      className={`h-64 p-2 border-lime-700 ${className}`}
    />
  )
}

