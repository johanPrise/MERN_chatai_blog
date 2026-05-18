import type React from 'react'
import type { TiptapNode } from './tiptapRendererModel'

export type RenderTiptapNode = (node: TiptapNode, index: number) => React.ReactNode

export type TiptapRenderRequest = Readonly<{
  node: TiptapNode
  index: number
  renderNode: RenderTiptapNode
}>

export type NodeRenderer = (request: TiptapRenderRequest) => React.ReactNode
