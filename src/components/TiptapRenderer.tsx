import React from 'react'
import { renderTiptapNode } from './tiptapNodeRenderers'
import {
  CSS_CLASS,
  EMPTY_CONTENT_LABEL,
  TiptapDoc
} from './tiptapRendererModel'

interface TiptapRendererProps {
  doc: TiptapDoc
  className?: string
}

const TiptapRenderer: React.FC<TiptapRendererProps> = ({ doc, className = '' }) => {
  if (!doc?.content) {
    return <div className={className}>{EMPTY_CONTENT_LABEL}</div>
  }

  return (
    <div className={`${CSS_CLASS.TIPTAP_CONTENT} ${className}`}>
      {doc.content.map((node, index) => renderTiptapNode(node, index))}
    </div>
  )
}

export default TiptapRenderer
