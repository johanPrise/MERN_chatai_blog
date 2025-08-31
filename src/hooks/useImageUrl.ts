/**
 * Hook simple pour gérer les URLs d'images
 */
export function useImageUrl() {
  const getImageUrl = (imagePath?: string | null): string => {
    if (!imagePath || typeof imagePath !== 'string') return '/placeholder.svg'
    
    // Si c'est déjà une URL complète, la retourner telle quelle
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath
    }
    
    // Si c'est une image base64 ou blob
    if (imagePath.startsWith('data:') || imagePath.startsWith('blob:')) {
      return imagePath
    }
    
    // Pour les chemins relatifs, construire l'URL complète
    const baseUrl = import.meta.env.VITE_IMAGE_BASE_URL || 'http://localhost:4200'
    const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`
    
    return `${baseUrl}${cleanPath}`
  }

  return { getImageUrl }
}