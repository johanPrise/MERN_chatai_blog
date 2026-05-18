import React from 'react'
import {
  CSS_CLASS,
  DEFAULT_CODE_LANGUAGE,
  DEFAULT_LINK_TARGET,
  getHeadingLevel,
  HEADING_CLASS,
  isSafeContentUrl,
  NODE_TYPE,
  SAFE_LINK_REL,
  type TiptapNodeType,
} from './tiptapRendererModel'
import { devLog } from '../lib/devLogger'
import { renderTextWithMarks } from './tiptapMarkRenderer'
import type { NodeRenderer, TiptapRenderRequest } from './tiptapRenderTypes'

const renderChildren = ({ node, renderNode }: TiptapRenderRequest): React.ReactNode => (
  node.content?.map((child, childIndex) => renderNode(child, childIndex))
)

const renderHeading: NodeRenderer = (request) => {
  const { node, index } = request
  const level = getHeadingLevel(node.attrs?.level)
  const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements

  return (
    <HeadingTag key={index} className={HEADING_CLASS[level]}>
      {renderChildren(request)}
    </HeadingTag>
  )
}

const renderCodeBlock: NodeRenderer = (request) => {
  const { node, index } = request
  const language = node.attrs?.language || DEFAULT_CODE_LANGUAGE

  return (
    <pre key={index} className={CSS_CLASS.CODE_BLOCK}>
      <code className={`language-${language}`}>
        {renderChildren(request)}
      </code>
    </pre>
  )
}

const renderImage: NodeRenderer = ({ node, index }) => {
  const src = node.attrs?.src
  const alt = node.attrs?.alt || ''
  const title = node.attrs?.title

  if (!isSafeContentUrl(src)) return null

  return (
    <img
      key={index}
      src={src}
      alt={alt}
      title={title}
      className={CSS_CLASS.IMAGE}
    />
  )
}

const renderLink: NodeRenderer = (request) => {
  const { node, index } = request
  const href = node.attrs?.href

  if (!isSafeContentUrl(href)) {
    return <span key={index}>{renderChildren(request)}</span>
  }

  return (
    <a
      key={index}
      href={href}
      target={node.attrs?.target || DEFAULT_LINK_TARGET}
      rel={SAFE_LINK_REL}
      className={CSS_CLASS.LINK}
    >
      {renderChildren(request)}
    </a>
  )
}

const renderParagraph: NodeRenderer = (request) => (
  <p key={request.index} className={CSS_CLASS.PARAGRAPH}>{renderChildren(request)}</p>
)

const renderBulletList: NodeRenderer = (request) => (
  <ul key={request.index} className={CSS_CLASS.BULLET_LIST}>{renderChildren(request)}</ul>
)

const renderOrderedList: NodeRenderer = (request) => (
  <ol key={request.index} className={CSS_CLASS.ORDERED_LIST}>{renderChildren(request)}</ol>
)

const renderListItem: NodeRenderer = (request) => (
  <li key={request.index} className={CSS_CLASS.LIST_ITEM}>{renderChildren(request)}</li>
)

const renderBlockquote: NodeRenderer = (request) => (
  <blockquote key={request.index} className={CSS_CLASS.BLOCKQUOTE}>{renderChildren(request)}</blockquote>
)

const renderText: NodeRenderer = ({ node, index }) => (
  <React.Fragment key={index}>{renderTextWithMarks(node.text || '', node.marks)}</React.Fragment>
)

const renderHardBreak: NodeRenderer = ({ index }) => <br key={index} />

const renderHorizontalRule: NodeRenderer = ({ index }) => (
  <hr key={index} className={CSS_CLASS.HORIZONTAL_RULE} />
)

const nodeRenderers: Partial<Record<TiptapNodeType, NodeRenderer>> = {
  [NODE_TYPE.PARAGRAPH]: renderParagraph,
  [NODE_TYPE.TEXT]: renderText,
  [NODE_TYPE.HARD_BREAK]: renderHardBreak,
  [NODE_TYPE.HORIZONTAL_RULE]: renderHorizontalRule,
  [NODE_TYPE.HEADING]: renderHeading,
  [NODE_TYPE.BULLET_LIST]: renderBulletList,
  [NODE_TYPE.ORDERED_LIST]: renderOrderedList,
  [NODE_TYPE.LIST_ITEM]: renderListItem,
  [NODE_TYPE.BLOCKQUOTE]: renderBlockquote,
  [NODE_TYPE.CODE_BLOCK]: renderCodeBlock,
  [NODE_TYPE.IMAGE]: renderImage,
  [NODE_TYPE.LINK]: renderLink,
}

export const getNodeRenderer = (nodeType: TiptapNodeType): NodeRenderer | undefined => (
  nodeRenderers[nodeType]
)

export const renderUnknownNode: NodeRenderer = (request) => {
  const { node, index } = request

  devLog('Unknown TipTap node type:', node.type, node)

  if (node.content) {
    return <div key={index}>{renderChildren(request)}</div>
  }

  return null
}
