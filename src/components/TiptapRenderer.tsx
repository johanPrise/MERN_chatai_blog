import React from 'react'

interface TiptapNode {
  type: string
  content?: TiptapNode[]
  text?: string
  marks?: Array<{ type: string }>
  attrs?: Record<string, any>
}

interface TiptapDoc {
  type: 'doc'
  content: TiptapNode[]
}

interface TiptapRendererProps {
  doc: TiptapDoc
  className?: string
}

const TiptapRenderer: React.FC<TiptapRendererProps> = ({ doc, className = '' }) => {
  const renderNode = (node: TiptapNode, index: number): React.ReactNode => {
    if (!node) return null

    switch (node.type) {
      case 'paragraph':
        return (
          <p key={index} className="mb-4">
            {node.content?.map((child, childIndex) => renderNode(child, childIndex))}
          </p>
        )

      case 'text': {
        let content: React.ReactNode = node.text || ''
        
        if (node.marks) {
          node.marks.forEach((mark) => {
            switch (mark.type) {
              case 'bold':
                content = <strong>{content}</strong>
                break
              case 'italic':
                content = <em>{content}</em>
                break
              case 'underline':
                content = <u>{content}</u>
                break
              case 'strike':
                content = <s>{content}</s>
                break
              case 'code':
                content = <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm">{content}</code>
                break
            }
          })
        }
        
        return <React.Fragment key={index}>{content}</React.Fragment>
      }

      case 'hardBreak':
        return <br key={index} />

      case 'horizontalRule':
        return <hr key={index} className="my-6 border-gray-300 dark:border-gray-600" />

      case 'heading': {
        const level = node.attrs?.level || 1
        const headingClasses = {
          1: 'text-3xl font-bold mb-6 mt-8 scroll-mt-24',
          2: 'text-2xl font-bold mb-4 mt-6 scroll-mt-24',
          3: 'text-xl font-bold mb-3 mt-5 scroll-mt-24',
          4: 'text-lg font-bold mb-2 mt-4 scroll-mt-24',
          5: 'text-base font-bold mb-2 mt-3 scroll-mt-24',
          6: 'text-sm font-bold mb-2 mt-2 scroll-mt-24'
        }
        
        const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements
        return (
          <HeadingTag key={index} className={headingClasses[level as keyof typeof headingClasses] || headingClasses[1]}>
            {node.content?.map((child, childIndex) => renderNode(child, childIndex))}
          </HeadingTag>
        )
      }

      case 'bulletList':
        return (
          <ul key={index} className="list-disc list-inside mb-4 space-y-1">
            {node.content?.map((child, childIndex) => renderNode(child, childIndex))}
          </ul>
        )

      case 'orderedList':
        return (
          <ol key={index} className="list-decimal list-inside mb-4 space-y-1">
            {node.content?.map((child, childIndex) => renderNode(child, childIndex))}
          </ol>
        )

      case 'listItem':
        return (
          <li key={index} className="mb-1">
            {node.content?.map((child, childIndex) => renderNode(child, childIndex))}
          </li>
        )

      case 'blockquote':
        return (
          <blockquote key={index} className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic my-4 text-gray-700 dark:text-gray-300">
            {node.content?.map((child, childIndex) => renderNode(child, childIndex))}
          </blockquote>
        )

      case 'codeBlock': {
        const language = node.attrs?.language || 'text'
        return (
          <pre key={index} className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto my-4">
            <code className={`language-${language}`}>
              {node.content?.map((child, childIndex) => renderNode(child, childIndex))}
            </code>
          </pre>
        )
      }

      case 'image': {
        const src = node.attrs?.src
        const alt = node.attrs?.alt || ''
        const title = node.attrs?.title
        
        if (!src) return null
        
        return (
          <img
            key={index}
            src={src}
            alt={alt}
            title={title}
            className="max-w-full h-auto rounded-lg my-4"
            loading="lazy"
          />
        )
      }

      case 'link': {
        const href = node.attrs?.href
        if (!href) {
          return (
            <span key={index}>
              {node.content?.map((child, childIndex) => renderNode(child, childIndex))}
            </span>
          )
        }
        
        return (
          <a
            key={index}
            href={href}
            target={node.attrs?.target || '_blank'}
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            {node.content?.map((child, childIndex) => renderNode(child, childIndex))}
          </a>
        )
      }

      default:
        console.log('Unknown TipTap node type:', node.type, node)
        // Fallback: try to render content if it exists
        if (node.content) {
          return (
            <div key={index}>
              {node.content.map((child, childIndex) => renderNode(child, childIndex))}
            </div>
          )
        }
        return null
    }
  }

  if (!doc || !doc.content) {
    return <div className={className}>Aucun contenu disponible</div>
  }

  return (
    <div className={`tiptap-content ${className}`}>
      {doc.content.map((node, index) => renderNode(node, index))}
    </div>
  )
}

export default TiptapRenderer