import React from 'react'
import SimpleImage from './SimpleImage'

interface PostImageProps {
  src?: string | null
  alt?: string
  className?: string
  loading?: 'lazy' | 'eager'
}

export default function PostImage({ 
  src, 
  alt = 'Image de l\'article', 
  className = '',
  loading = 'lazy'
}: PostImageProps) {
  // Si pas d'image, afficher un placeholder
  if (!src) {
    return (
      <div className={`bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center text-gray-400 dark:text-gray-600">
          <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm font-medium">Aucune image</p>
        </div>
      </div>
    )
  }

  return (
    <SimpleImage
      src={src}
      alt={alt}
      className={className}
      loading={loading}
    />
  )
}