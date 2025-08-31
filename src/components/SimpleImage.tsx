import React, { useState } from 'react'
import { useImageUrl } from '../hooks/useImageUrl'

interface SimpleImageProps {
  src: string
  alt?: string
  className?: string
  loading?: 'lazy' | 'eager'
  onLoad?: () => void
  onError?: (error: string) => void
}

export default function SimpleImage({ 
  src, 
  alt = '', 
  className = '', 
  loading = 'lazy',
  onLoad,
  onError 
}: SimpleImageProps) {
  const { getImageUrl } = useImageUrl()
  const [hasError, setHasError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  const imageUrl = getImageUrl(src)

  const handleLoad = () => {
    setIsLoading(false)
    setHasError(false)
    onLoad?.()
  }

  const handleError = () => {
    setIsLoading(false)
    setHasError(true)
    onError?.(`Failed to load image: ${imageUrl}`)
  }

  if (hasError) {
    return (
      <div className={`bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center p-8 ${className}`}>
        <div className="text-center text-gray-500 dark:text-gray-400">
          <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm">Image non disponible</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      {isLoading && (
        <div className={`absolute inset-0 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse ${className}`} />
      )}
      <img
        src={imageUrl}
        alt={alt}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        loading={loading}
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  )
}