/**
 * External Image Input Component
 * Allows users to add images from external URLs
 */

import React, { useState, useCallback } from 'react';
import { Link, Check, X, AlertCircle, Eye, Loader } from 'lucide-react';
import { cn } from '../../../../lib/utils';

interface ExternalImageInputProps {
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
  className?: string;
  isCoverImage?: boolean;
}

export function ExternalImageInput({
  value,
  onChange,
  placeholder = "Collez l'URL de votre image...",
  className = '',
  isCoverImage = false,
}: ExternalImageInputProps) {
  const [inputUrl, setInputUrl] = useState(value);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const validateImageUrl = useCallback(async (url: string): Promise<boolean> => {
    if (!url.trim()) {
      setValidationError(null);
      setIsValid(false);
      return false;
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      setValidationError('URL invalide');
      setIsValid(false);
      return false;
    }

    // Check if URL looks like an image
    const imageExtensions = /\.(jpg|jpeg|png|gif|svg|webp|bmp|ico)(\?.*)?$/i;
    const isImageExtension = imageExtensions.test(url);
    
    // Common image hosting domains
    const imageHosts = [
      'imgur.com',
      'unsplash.com',
      'pexels.com',
      'pixabay.com',
      'freepik.com',
      'shutterstock.com',
      'getty',
      'cloudinary.com',
      'amazonaws.com',
      'googleusercontent.com',
      'githubusercontent.com',
      'wikimedia.org',
      'wikipedia.org'
    ];
    
    const isFromImageHost = imageHosts.some(host => url.toLowerCase().includes(host));

    if (!isImageExtension && !isFromImageHost) {
      setValidationError('Cette URL ne semble pas pointer vers une image');
      setIsValid(false);
      return false;
    }

    // Try to load the image to verify it exists and is accessible
    return new Promise((resolve) => {
      const img = new Image();
      const timeout = setTimeout(() => {
        setValidationError('Impossible de charger l\'image (timeout)');
        setIsValid(false);
        resolve(false);
      }, 5000); // 5 second timeout

      img.onload = () => {
        clearTimeout(timeout);
        setValidationError(null);
        setIsValid(true);
        resolve(true);
      };

      img.onerror = () => {
        clearTimeout(timeout);
        setValidationError('Impossible de charger l\'image depuis cette URL');
        setIsValid(false);
        resolve(false);
      };

      // Add crossOrigin to handle CORS
      img.crossOrigin = 'anonymous';
      img.src = url;
    });
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setInputUrl(newUrl);
    setValidationError(null);
    setIsValid(false);
  }, []);

  const handleValidateAndApply = useCallback(async () => {
    if (!inputUrl.trim()) {
      onChange('');
      return;
    }

    setIsValidating(true);
    const isValidUrl = await validateImageUrl(inputUrl.trim());
    setIsValidating(false);

    if (isValidUrl) {
      onChange(inputUrl.trim());
    }
  }, [inputUrl, validateImageUrl, onChange]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleValidateAndApply();
    }
  }, [handleValidateAndApply]);

  const handleClear = useCallback(() => {
    setInputUrl('');
    setValidationError(null);
    setIsValid(false);
    onChange('');
  }, [onChange]);

  const togglePreview = useCallback(() => {
    setShowPreview(prev => !prev);
  }, []);

  const hasValidImage = value && !validationError;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Input Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          <Link className="h-4 w-4" />
          <span>Image depuis une URL externe</span>
        </div>

        <div className="relative">
          <input
            type="url"
            value={inputUrl}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            className={cn(
              'w-full px-4 py-3 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
              'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
              'border-gray-300 dark:border-gray-600',
              validationError && 'border-red-500 focus:ring-red-500',
              isValid && 'border-green-500 focus:ring-green-500'
            )}
          />
          
          {/* Status Icon */}
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {isValidating && (
              <Loader className="h-5 w-5 text-blue-500 animate-spin" />
            )}
            {!isValidating && isValid && (
              <Check className="h-5 w-5 text-green-500" />
            )}
            {!isValidating && validationError && (
              <AlertCircle className="h-5 w-5 text-red-500" />
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleValidateAndApply}
            disabled={isValidating || !inputUrl.trim()}
            className={cn(
              'px-4 py-2 rounded-lg font-medium transition-colors',
              'bg-blue-600 hover:bg-blue-700 text-white',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {isValidating ? 'Validation...' : 'Appliquer'}
          </button>

          {(inputUrl || value) && (
            <button
              type="button"
              onClick={handleClear}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Effacer
            </button>
          )}
        </div>
      </div>

      {/* Validation Error */}
      {validationError && (
        <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm">{validationError}</span>
          </div>
        </div>
      )}

      {/* Success Message */}
      {hasValidImage && (
        <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
            <Check className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm">Image externe ajoutée avec succès</span>
          </div>
        </div>
      )}

      {/* Image Preview */}
      {hasValidImage && (
        <div className="space-y-3">
          <div className="border rounded-lg overflow-hidden bg-white dark:bg-gray-800 shadow-sm">
            <div className="h-48 relative overflow-hidden bg-gray-100 dark:bg-gray-700">
              <img
                src={value}
                alt="Aperçu de l'image externe"
                className="w-full h-full object-cover"
                onError={() => {
                  setValidationError('Erreur lors du chargement de l\'image');
                  setIsValid(false);
                }}
              />
              
              {/* Status Badge */}
              <div className="absolute bottom-3 left-3">
                {isCoverImage ? (
                  <div className="bg-green-500 text-white text-sm px-3 py-1 rounded-full flex items-center gap-2 font-medium shadow-lg">
                    <Check className="h-3 w-3" />
                    Image de couverture
                  </div>
                ) : (
                  <div className="bg-blue-500 text-white text-sm px-3 py-1 rounded-full flex items-center gap-2 font-medium shadow-lg">
                    <Link className="h-3 w-3" />
                    Image externe
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Preview Actions */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={togglePreview}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium transition-colors"
            >
              <Eye className="h-4 w-4" />
              Agrandir
            </button>
          </div>

          {/* URL Display */}
          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">URL de l'image :</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 font-mono bg-gray-100 dark:bg-gray-700 p-2 rounded break-all">
              {value}
            </div>
          </div>
        </div>
      )}

      {/* Enlarged Preview Modal */}
      {showPreview && hasValidImage && (
        <div 
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-8" 
          onClick={togglePreview}
        >
          <div className="relative max-w-7xl max-h-[90vh] overflow-auto">
            <img 
              src={value} 
              alt="Aperçu agrandi de l'image externe" 
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" 
            />
            <button 
              className="absolute top-8 right-8 bg-white text-gray-800 rounded-full p-4 shadow-xl hover:shadow-2xl transition-all"
              onClick={(e) => {
                e.stopPropagation();
                togglePreview();
              }}
            >
              <X className="h-8 w-8" />
            </button>
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
        <div>💡 Vous pouvez utiliser des images depuis Unsplash, Imgur, ou tout autre service d'hébergement d'images</div>
        <div>⚠️ Assurez-vous que l'image est accessible publiquement et que vous avez le droit de l'utiliser</div>
      </div>
    </div>
  );
}