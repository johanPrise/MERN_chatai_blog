import React from 'react'
import { CSS_CLASS, MARK_TYPE, type TiptapNode } from './tiptapRendererModel'

export const renderTextWithMarks = (
  text: string,
  marks?: TiptapNode['marks'],
): React.ReactNode => {
  let content: React.ReactNode = text

  if (!marks) return content

  marks.forEach((mark) => {
    switch (mark.type) {
      case MARK_TYPE.BOLD:
        content = <strong>{content}</strong>
        break
      case MARK_TYPE.ITALIC:
        content = <em>{content}</em>
        break
      case MARK_TYPE.UNDERLINE:
        content = <u>{content}</u>
        break
      case MARK_TYPE.STRIKE:
        content = <s>{content}</s>
        break
      case MARK_TYPE.CODE:
        content = <code className={CSS_CLASS.INLINE_CODE}>{content}</code>
        break
    }
  })

  return content
}
