import type React from 'react'
import { getNodeRenderer, renderUnknownNode } from './tiptapBlockRenderers'
import type { TiptapNode } from './tiptapRendererModel'

export const renderTiptapNode = (node: TiptapNode, index: number): React.ReactNode => {
  if (!node) return null

  const renderRequest = {
    node,
    index,
    renderNode: renderTiptapNode,
  }
  const renderer = getNodeRenderer(node.type) ?? renderUnknownNode

  return renderer(renderRequest)
}
