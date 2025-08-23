import React, { useMemo } from 'react';
import { getImageUrl } from '../config/api.config';
import { ImageRef } from '../types/PostType';

/**
 * Hook personnalisé pour corriger automatiquement les URLs d'images
 */
export const useImageUrl = (imageUrl: string | undefined | null): string => {
  return useMemo(() => {
    if (!imageUrl) return '';
    return getImageUrl(imageUrl);
  }, [imageUrl]);
};

/**
 * Hook pour plusieurs URLs d'images
 */
export const useImageUrls = (imageUrls: (string | undefined | null)[]): string[] => {
  return useMemo(() => {
    return imageUrls.map(url => url ? getImageUrl(url) : '');
  }, [imageUrls]);
};

/**
 * Hook pour gérer l'état d'erreur des images
 */
export const useImageWithFallback = (
  imageUrl: string | undefined | null, 
  fallbackUrl: string = '/placeholder.jpg'
) => {
  const correctedUrl = useImageUrl(imageUrl);
  const [hasError, setHasError] = React.useState(false);
  
  const handleError = React.useCallback(() => {
    setHasError(true);
  }, []);
  
  const finalUrl = hasError ? fallbackUrl : correctedUrl;
  
  // Reset error state when URL changes
  React.useEffect(() => {
    setHasError(false);
  }, [correctedUrl]);
  
  return {
    url: finalUrl,
    hasError,
    onError: handleError
  };
};

/**
 * Hook pour gérer les images de couverture au format objet
 */
export const useCoverImage = (
  coverImage: ImageRef | undefined | null,
  fallbackUrl: string = '/placeholder.jpg'
) => {
  const imageUrl = coverImage?.url;
  const imageAlt = coverImage?.alt || '';
  
  const { url, hasError, onError } = useImageWithFallback(imageUrl, fallbackUrl);
  
  return {
    url,
    alt: imageAlt,
    hasError,
    onError
  };
};

/**
 * Fonction utilitaire pour normaliser une image de couverture
 */
export const normalizeCoverImage = (
  coverImage: ImageRef | undefined | null
): ImageRef => {
  if (!coverImage) {
    return { url: '', alt: '' };
  }
  
  return coverImage;
};
