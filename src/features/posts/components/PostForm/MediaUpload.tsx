/**
 * Media Upload Component
 * Handles file uploads with drag and drop, progress tracking, and enhanced preview
 * Also supports external image URLs
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { PostApiService } from '../../services/postApi';
import { UploadProgress } from '../../types/post.types';
import { UploadResponse } from '../../types/api.types';
import { cn } from '../../../../lib/utils';
import { Upload, X, Image, AlertCircle, CheckCircle, Check, Eye, Edit, Link } from 'lucide-react';
import { getImageUrl } from '../../../../config/api.config';
import SafeImage from '../../../../components/SafeImage';
import { ExternalImageInput } from './ExternalImageInput';
import { showError } from '../../../../lib/toast-helpers';
import { devError, devLog, devWarn } from '../../../../lib/devLogger';

const SUPPORTED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const SUPPORTED_IMAGE_ACCEPT = SUPPORTED_IMAGE_MIME_TYPES.join(',');

// Helper function to extract URL from urls object
const extractFromUrls = (urls: any): string | null => {
  const url = urls.optimized || urls.original || null;
    if (url) devLog('URL extraite depuis urls:', url);
  return url;
};

// Helper function to extract URL from data object
const extractFromData = (data: any): string | null => {
  if (data?.url) {
    devLog('URL extraite depuis data:', data.url);
    return data.url;
  }
  if (typeof data === 'string') {
    devLog('URL extraite comme string:', data);
    return data;
  }
  return null;
};

// Helper function to extract URL from various response formats
const getUrlFromResponse = (response: UploadResponse): string | null => {
  if (response.urls) {
    return extractFromUrls(response.urls);
  }
  
  if (response.url) {
    devLog('URL extraite directement:', response.url);
    return response.url;
  }
  
  if (response.success && response.data) {
    return extractFromData(response.data);
  }
  
  return null;
};

// Helper function to normalize URLs
const normalizeUrl = (url: string): string => {
  const originalUrl = url;
  let normalizedUrl = url;
  
  if (url.startsWith('http://localhost/')) {
    normalizedUrl = url.replace('http://localhost/', 'http://localhost:4200/');
    devLog('URL corrigée (port ajouté):', originalUrl, '->', normalizedUrl);
  } else if (url.includes('http://localhost:') && !url.includes('http://localhost:4200')) {
    const urlParts = url.split('/');
    urlParts[2] = 'localhost:4200';
    normalizedUrl = urlParts.join('/');
    devLog('URL corrigée (port modifié):', originalUrl, '->', normalizedUrl);
  } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
    normalizedUrl = getImageUrl(url);
    devLog('URL construite depuis chemin relatif:', originalUrl, '->', normalizedUrl);
  }
  
  devLog('URL finale à utiliser:', normalizedUrl);
  return normalizedUrl;
};

const isRecordWithUrl = (value: unknown): value is { url: unknown } => {
  return typeof value === 'object' && value !== null && 'url' in value;
};

const safeJsonStringify = (value: unknown): string => {
  try {
    return JSON.stringify(value);
  } catch (error) {
    devWarn('Unable to stringify media value:', error);
    return '';
  }
};

const stringifyPrimitive = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return String(value);
  return '';
};

// Helper function to extract URL string from raw value
const extractUrlString = (raw: unknown): string => {
  if (typeof raw === 'string') {
    return raw;
  }
  if (isRecordWithUrl(raw) && typeof raw.url === 'string') {
    return raw.url;
  }
  if (typeof raw === 'object' && raw !== null) {
    return safeJsonStringify(raw);
  }

  return stringifyPrimitive(raw);
};

// Helper function to check if URL needs image URL conversion
const needsImageUrlConversion = (url: string): boolean => {
  if (!url) return false;
  
  const hasProtocol = url.startsWith('http://') || url.startsWith('https://');
  const isDataUrl = url.startsWith('blob:') || url.startsWith('data:');
  
  return !hasProtocol && !isDataUrl;
};

// Helper function to normalize display URLs
const normalizeDisplayUrl = (raw: unknown): string | null => {
  const url = extractUrlString(raw);
  
  if (typeof url !== 'string') return null;
  
  if (needsImageUrlConversion(url)) {
    return getImageUrl(url);
  }
  
  return url;
};

// Helper function to get debug URL string
const getDebugUrlString = (raw: unknown): string => {
  if (typeof raw === 'string') {
    return raw;
  }
  if (isRecordWithUrl(raw) && typeof raw.url === 'string') {
    return raw.url;
  }
  return safeJsonStringify(raw);
};

interface MediaUploadProps {
  readonly value: string;
  readonly onChange: (url: string) => void;
  readonly accept?: string;
  readonly maxSize?: number; // in bytes
  readonly className?: string;
  readonly isCoverImage?: boolean; // Indique si c'est une image de couverture
  readonly hasError?: boolean; // Indique s'il y a une erreur de validation
}

export function MediaUpload({
  value,
  onChange,
  accept = SUPPORTED_IMAGE_ACCEPT,
  maxSize = 5 * 1024 * 1024, // 5MB default
  className = '',
  isCoverImage = false,
  hasError = false,
}: MediaUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showExternalInput, setShowExternalInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const apiService = PostApiService.getInstance();

  // Create preview URL for selected file
  useEffect(() => {
    if (selectedFile?.type.startsWith('image/')) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [selectedFile]);

  // Clear selected file when upload completes
  useEffect(() => {
    if (value && selectedFile) {
      setSelectedFile(null);
    }
  }, [value, selectedFile]);

  // Show toast when validation error occurs
  useEffect(() => {
    if (hasError && isCoverImage && !value?.trim()) {
      showError('Veuillez ajouter une image de couverture avant de publier l\'article', 'Image de couverture requise');
    }
  }, [hasError, isCoverImage, value]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const getAllowedMimeTypes = useCallback((): string[] => {
    const requestedTypes = accept.split(',').map(type => type.trim());
    const shouldUseSupportedImages = requestedTypes.includes('*/*') || requestedTypes.includes('image/*');

    return shouldUseSupportedImages ? SUPPORTED_IMAGE_MIME_TYPES : requestedTypes;
  }, [accept]);

  const validateFile = useCallback((file: File): boolean => {
    const allowedMimeTypes = getAllowedMimeTypes();

    if (!allowedMimeTypes.includes(file.type)) {
      setError(`Type de fichier invalide. Types acceptés: ${SUPPORTED_IMAGE_ACCEPT}`);
      return false;
    }

    // Check file size
    if (file.size > maxSize) {
      setError(`Fichier trop volumineux. Taille maximum: ${Math.round(maxSize / 1024 / 1024)}MB`);
      return false;
    }

    return true;
  }, [getAllowedMimeTypes, maxSize]);

  const extractUrlFromResponse = useCallback((response: UploadResponse): string | null => {
    devLog('Réponse d\'upload reçue:', response);
    const extractedUrl = getUrlFromResponse(response);
    return extractedUrl ? normalizeUrl(extractedUrl) : null;
  }, []);

  const uploadFile = useCallback(async (file: File) => {
    setIsUploading(true);
    setError(null);
    setUploadProgress(null);

    try {
      const isValid = validateFile(file);
      if (!isValid) {
        setIsUploading(false);
        setSelectedFile(null);
        return;
      }

      devLog('Début de l\'upload du fichier:', file.name);

      const response = await apiService.uploadFile(file, (progress) => {
        setUploadProgress(progress);
        devLog('Progression upload:', `${progress.percentage}%`);
      });

      devLog('Réponse complète du serveur:', response);

      const fileUrl = extractUrlFromResponse(response);

      if (!fileUrl) {
        devError('Impossible d\'extraire l\'URL de la réponse:', response);
        setError(response.message || 'Échec du téléchargement - URL manquante');
        setIsUploading(false);
        setSelectedFile(null);
        return;
      }

      devLog('Upload réussi, URL utilisée:', fileUrl);
      onChange(fileUrl);
      setIsUploading(false);
      setSelectedFile(null);
      
      // Petit délai pour voir le succès
      setTimeout(() => {
        setUploadProgress(null);
      }, 1000);

    } catch (error) {
      devError('Erreur lors de l\'upload:', error);
      setError(error instanceof Error ? error.message : 'Échec du téléchargement');
      setIsUploading(false);
      setSelectedFile(null);
      setUploadProgress(null);
    }
  }, [apiService, extractUrlFromResponse, onChange, validateFile]);

  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLButtonElement>) => {
      e.preventDefault();
      setIsDragging(false);

      if (e.dataTransfer.files?.length > 0) {
        const file = e.dataTransfer.files[0];
        setSelectedFile(file);
        await uploadFile(file);
      }
    },
    [uploadFile]
  );

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.length > 0) {
        const file = e.target.files[0];
        setSelectedFile(file);
        await uploadFile(file);
        // Reset the input value so the same file can be selected again
        e.target.value = '';
      }
    },
    [uploadFile]
  );

  const handleButtonClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleRemove = useCallback(() => {
    onChange('');
    setError(null);
    setSelectedFile(null);
    setUploadProgress(null);
  }, [onChange]);

  const handleCancelUpload = useCallback(() => {
    setSelectedFile(null);
    setIsUploading(false);
    setUploadProgress(null);
    setError(null);
  }, []);

  const togglePreviewMode = useCallback(() => {
    setPreviewMode(prev => !prev);
  }, []);

  const isImage = (url: string) => {
    return /\.(jpeg|jpg|gif|png|svg|webp)$/i.exec(url);
  };

  const getDisplayImageUrl = () => {
    const raw = value || previewUrl;
    if (!raw) return null;
    return normalizeDisplayUrl(raw);
  };

  const hasImageToShow = () => {
    return value || (previewUrl && !isUploading);
  };

  const getUploadTabClass = (isActive: boolean) => (
    isActive
      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
  );

  const getDropzoneBorderClass = () => {
    if (isDragging) {
      return 'border-blue-500 bg-blue-50 dark:bg-blue-950/20 scale-105';
    }

    if (hasError) {
      return 'border-red-300 dark:border-red-600 hover:border-red-400 dark:hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20';
    }

    return 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-gray-50 dark:hover:bg-gray-800/50';
  };

  const getAcceptedFormatsLabel = () => `Formats acceptés: ${SUPPORTED_IMAGE_ACCEPT}`;
  const displayImageUrl = getDisplayImageUrl();
  const shouldShowDisplayImage = Boolean(displayImageUrl && isImage(displayImageUrl));

  return (
    <div className={cn('w-full space-y-4', className)}>
      {/* File input (hidden) */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={SUPPORTED_IMAGE_ACCEPT}
        className="hidden"
      />

      {/* Mode Selection Tabs */}
      {!hasImageToShow() && !isUploading && (
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={() => setShowExternalInput(false)}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
              getUploadTabClass(!showExternalInput)
            )}
          >
            <Upload className="h-4 w-4 mr-2 inline" />
            Télécharger un fichier
          </button>
          <button
            type="button"
            onClick={() => setShowExternalInput(true)}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
              getUploadTabClass(showExternalInput)
            )}
          >
            <Link className="h-4 w-4 mr-2 inline" />
            URL externe
          </button>
        </div>
      )}

      {/* External Image Input */}
      {!hasImageToShow() && !isUploading && showExternalInput && (
        <ExternalImageInput
          value={value}
          onChange={onChange}
          isCoverImage={isCoverImage}
          placeholder={isCoverImage ? "URL de l'image de couverture..." : "URL de l'image..."}
        />
      )}

      {/* Upload area */}
      {!hasImageToShow() && !isUploading && !showExternalInput && (
        <button
          type="button"
          className={cn(
            'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 w-full',
            getDropzoneBorderClass(),
            'flex flex-col items-center justify-center gap-4 min-h-[250px]'
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleButtonClick}
          aria-label={isCoverImage ? 'Ajouter une image de couverture' : 'Télécharger un fichier'}
        >
          <div className={cn(
            'w-20 h-20 rounded-full flex items-center justify-center transition-colors',
            isDragging 
              ? 'bg-blue-100 dark:bg-blue-900/30' 
              : 'bg-gray-100 dark:bg-gray-700'
          )}>
            <Upload className={cn(
              'h-10 w-10 transition-colors',
              isDragging 
                ? 'text-blue-600 dark:text-blue-400' 
                : 'text-gray-500 dark:text-gray-400'
            )} />
          </div>
          
          <div className="space-y-3">
            <div className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {isCoverImage ? 'Ajouter une image de couverture' : 'Télécharger un fichier'}
            </div>
            <div className="text-base text-gray-600 dark:text-gray-400">
              Glissez-déposez votre fichier ici ou cliquez pour parcourir
            </div>
          </div>

          <div className="flex flex-col gap-2 text-sm text-gray-500 dark:text-gray-400">
            <div>{getAcceptedFormatsLabel()}</div>
            <div>Taille maximum: {Math.round(maxSize / 1024 / 1024)}MB</div>
          </div>

          {isCoverImage && (
            <div className="px-6 py-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <div className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                💡 Cette image sera utilisée comme couverture de l'article
              </div>
            </div>
          )}
        </button>
      )}

      {/* Upload progress with preview */}
      {isUploading && selectedFile && (
        <div className="space-y-4">
          {previewUrl && isImage(previewUrl) && (
            <div className="border rounded-xl overflow-hidden bg-white dark:bg-gray-800 shadow-sm">
              <div className="h-64 relative">
                <SafeImage
                  src={previewUrl}
                  alt="Aperçu en cours de téléchargement"
                  className="w-full h-full object-cover"
                  height={256}
                  loading="eager"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-xl p-6 min-w-[300px] shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        Téléchargement en cours...
                      </div>
                      <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        {uploadProgress ? `${Math.round(uploadProgress.percentage)}%` : '0%'}
                      </div>
                    </div>
                    
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 mb-3">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-4 rounded-full transition-all duration-500 ease-out"
                        style={{
                          width: uploadProgress ? `${uploadProgress.percentage}%` : '0%',
                        }}
                      />
                    </div>
                    
                    <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {selectedFile.name}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Cancel button - bien visible */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleCancelUpload}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-lg"
            >
              <X className="h-5 w-5 mr-2 inline" />
              Annuler le téléchargement
            </button>
          </div>
        </div>
      )}
      {/* Enlarged preview modal */}
      {previewMode && displayImageUrl && shouldShowDisplayImage && (
        <button 
          type="button"
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-8 border-0" 
          onClick={togglePreviewMode}
          aria-label="Fermer l'aperçu agrandi"
        >
          <div className="relative max-w-7xl max-h-[90vh] overflow-auto">
            <img 
              src={displayImageUrl} 
              alt="Aperçu agrandi" 
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" 
            />
            <button 
              className="absolute top-8 right-8 bg-white text-gray-800 rounded-full p-4 shadow-xl hover:shadow-2xl transition-all"
              onClick={(e) => {
                e.stopPropagation();
                togglePreviewMode();
              }}
            >
              <X className="h-8 w-8" />
            </button>
          </div>
        </button>
      )}

      {/* Uploaded file preview - Layout complètement séparé */}
      {hasImageToShow() && !isUploading && (
        <div className="space-y-4">
          {/* Image preview */}
          <div className="border rounded-xl overflow-hidden bg-white dark:bg-gray-800 shadow-sm">
            {shouldShowDisplayImage && displayImageUrl ? (
              <div className="h-64 relative overflow-hidden bg-gray-100 dark:bg-gray-700">
                <img
                  src={displayImageUrl}
                  alt="Media téléchargé"
                  className="w-full h-full object-cover"
                />
                
                {/* Status badge en bas à gauche */}
                <div className="absolute bottom-4 left-4">
                  {isCoverImage && value && (
                    <div className="bg-green-500 text-white text-sm px-4 py-2 rounded-full flex items-center gap-2 font-medium shadow-lg">
                      <Check className="h-4 w-4" />
                      Image de couverture
                    </div>
                  )}
                  {!value && previewUrl && (
                    <div className="bg-blue-500 text-white text-sm px-4 py-2 rounded-full flex items-center gap-2 font-medium shadow-lg">
                      <Upload className="h-4 w-4" />
                      En attente
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                    <Image className="h-6 w-6 text-gray-500" />
                  </div>
                  <span className="text-base font-medium text-gray-900 dark:text-gray-100">
                    {displayImageUrl?.split('/').pop()}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Action buttons - Séparés et bien visibles */}
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={togglePreviewMode}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-medium transition-colors"
            >
              <Eye className="h-5 w-5" />
              Agrandir
            </button>
            
            <button
              type="button"
              onClick={handleButtonClick}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-300 rounded-lg font-medium transition-colors"
            >
              <Edit className="h-5 w-5" />
              Changer
            </button>
            
            <button
              type="button"
              onClick={handleRemove}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-800 text-red-700 dark:text-red-300 rounded-lg font-medium transition-colors"
            >
              <X className="h-5 w-5" />
              Supprimer
            </button>
          </div>

          {/* Status info avec debug */}
          <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-base text-gray-600 dark:text-gray-400">
                {value ? '✅ Image téléchargée et prête' : '⏳ Aperçu local - non sauvegardé'}
              </span>
              {value && (
                <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                  Sauvegardée
                </span>
              )}
            </div>
            {value && (
              <div className="text-xs text-gray-500 dark:text-gray-400 font-mono bg-gray-100 dark:bg-gray-700 p-2 rounded">
                URL: {getDebugUrlString(value)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center gap-3 text-red-800 dark:text-red-200">
            <AlertCircle className="h-6 w-6 flex-shrink-0" />
            <span className="text-base font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* Success message */}
      {value && !error && !isUploading && (
        <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center gap-3 text-green-800 dark:text-green-200">
            <CheckCircle className="h-6 w-6 flex-shrink-0" />
            <span className="text-base font-medium">Fichier téléchargé avec succès</span>
          </div>
        </div>
      )}
    </div>
  );
}
export default MediaUpload;
