import type { HTMLAttributeAnchorTarget } from 'react'

export const NODE_TYPE = {
  PARAGRAPH: 'paragraph',
  TEXT: 'text',
  HARD_BREAK: 'hardBreak',
  HORIZONTAL_RULE: 'horizontalRule',
  HEADING: 'heading',
  BULLET_LIST: 'bulletList',
  ORDERED_LIST: 'orderedList',
  LIST_ITEM: 'listItem',
  BLOCKQUOTE: 'blockquote',
  CODE_BLOCK: 'codeBlock',
  IMAGE: 'image',
  LINK: 'link'
} as const

export const MARK_TYPE = {
  BOLD: 'bold',
  ITALIC: 'italic',
  UNDERLINE: 'underline',
  STRIKE: 'strike',
  CODE: 'code'
} as const

export const CONTENT_PROTOCOL = {
  HTTP: 'http:',
  HTTPS: 'https:'
} as const

export const CSS_CLASS = {
  PARAGRAPH: 'mb-4',
  INLINE_CODE: 'bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm',
  CODE_BLOCK: 'bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto my-4',
  IMAGE: 'max-w-full h-auto rounded-lg my-4',
  LINK: 'text-blue-600 dark:text-blue-400 hover:underline',
  BULLET_LIST: 'list-disc list-inside mb-4 space-y-1',
  ORDERED_LIST: 'list-decimal list-inside mb-4 space-y-1',
  LIST_ITEM: 'mb-1',
  BLOCKQUOTE: 'border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic my-4 text-gray-700 dark:text-gray-300',
  HORIZONTAL_RULE: 'my-6 border-gray-300 dark:border-gray-600',
  TIPTAP_CONTENT: 'tiptap-content'
} as const

export const HEADING_CLASS = {
  1: 'text-3xl font-bold mb-6 mt-8 scroll-mt-24',
  2: 'text-2xl font-bold mb-4 mt-6 scroll-mt-24',
  3: 'text-xl font-bold mb-3 mt-5 scroll-mt-24',
  4: 'text-lg font-bold mb-2 mt-4 scroll-mt-24',
  5: 'text-base font-bold mb-2 mt-3 scroll-mt-24',
  6: 'text-sm font-bold mb-2 mt-2 scroll-mt-24'
} as const

export const DEFAULT_HEADING_LEVEL = 1
export const DEFAULT_CODE_LANGUAGE = 'text'
export const DEFAULT_LINK_TARGET = '_blank'
export const SAFE_LINK_REL = 'noopener noreferrer'
export const EMPTY_CONTENT_LABEL = 'Aucun contenu disponible'

export type TiptapNodeType = typeof NODE_TYPE[keyof typeof NODE_TYPE]
export type TiptapMarkType = typeof MARK_TYPE[keyof typeof MARK_TYPE]
export type HeadingLevel = keyof typeof HEADING_CLASS

export interface TiptapAttrs {
  level?: number
  language?: string
  src?: string
  alt?: string
  title?: string
  href?: string
  target?: HTMLAttributeAnchorTarget
  [key: string]: unknown
}

export interface TiptapNode {
  type: TiptapNodeType
  content?: TiptapNode[]
  text?: string
  marks?: Array<{ type: TiptapMarkType }>
  attrs?: TiptapAttrs
}

export interface TiptapDoc {
  type: 'doc'
  content: TiptapNode[]
}

const safeProtocols = new Set<string>([CONTENT_PROTOCOL.HTTP, CONTENT_PROTOCOL.HTTPS])

export const isSafeContentUrl = (value?: string): boolean => {
  if (!value || typeof value !== 'string') return false

  const trimmedValue = value.trim()
  if (!trimmedValue) return false

  if (trimmedValue.startsWith('/')) return !trimmedValue.startsWith('//')

  try {
    const url = new URL(trimmedValue)
    return safeProtocols.has(url.protocol)
  } catch {
    return false
  }
}

export const getHeadingLevel = (level?: number): HeadingLevel => (
  level && level in HEADING_CLASS ? level as HeadingLevel : DEFAULT_HEADING_LEVEL
)
