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
import { Upload, X, Image, AlertCircle, CheckCircle, Check, Eye, ZoomIn, Edit, Link } from 'lucide-react';
import { getImageUrl } from '../../../../config/api.config';
import { ExternalImageInput } from './ExternalImageInput';

interface MediaUploadProps {
  value: string;
  onChange: (url: string) => void;
  accept?: string;
  maxSize?: number; // in bytes
  className?: string;
  isCoverImage?: boolean; // Indique si c'est une image de couverture
}

export function MediaUpload({
  value,
  onChange,
  accept = '*/*',
  maxSize = 5 * 1024 * 1024, // 5MB default
  className = '',
  isCoverImage = false,
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
    if (selectedFile && selectedFile.type.startsWith('image/')) {
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

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const validateFile = async (file: File): Promise<boolean> => {
    // Check file type if accept is specified
    if (accept !== '*/*') {
      const acceptTypes = accept.split(',').map(type => type.trim());
      const fileType = file.type;
      const isValidType = acceptTypes.some(type => {
        if (type.includes('*')) {
          return fileType.startsWith(type.replace('*', ''));
        }
        return type === fileType;
      });

      if (!isValidType) {
        setError(`Type de fichier invalide. Types acceptés: ${accept}`);
        return false;
      }
    }

    // Check file size
    if (file.size > maxSize) {
      setError(`Fichier trop volumineux. Taille maximum: ${Math.round(maxSize / 1024 / 1024)}MB`);
      return false;
    }

    // Specific validation for SVG files
    if (file.type === 'image/svg+xml') {
      try {
        const text = await file.text();
        const viewBoxMatch = text.match(/viewBox\s*=\s*"([^"]*)"/i);
        if (!viewBoxMatch) {
          setError('SVG invalide: attribut viewBox manquant');
          return false;
        }
        const viewBoxValues = viewBoxMatch[1].trim().split(/\s+/);
        if (viewBoxValues.length !== 4 || !viewBoxValues.every(v => /^-?\d*\.?\d+$/.test(v))) {
          setError('SVG invalide: viewBox doit contenir 4 nombres (ex: "0 0 100 100")');
          return false;
        }
      } catch (error) {
        setError('Erreur lors de la validation du fichier SVG');
        return false;
      }
    }

    return true;
  };

  const extractUrlFromResponse = (response: UploadResponse): string | null => {
    console.log('📥 Réponse d\'upload reçue:', response);

    let extractedUrl: string | null = null;

    // Format du serveur actuel: { message: "...", url: "..." }
    if (response.url) {
      extractedUrl = response.url;
      console.log('🔗 URL extraite directement:', extractedUrl);
    }
    // Format alternatif avec success et data
    else if (response.success && response.data?.url) {
      extractedUrl = response.data.url;
      console.log('🔗 URL extraite depuis data:', extractedUrl);
    }
    // Autres formats possibles
    else if (response.data && typeof response.data === 'string') {
      extractedUrl = response.data;
      console.log('🔗 URL extraite comme string:', extractedUrl);
    }

    // Correction automatique de l'URL si elle utilise le mauvais port
    if (extractedUrl) {
      const originalUrl = extractedUrl;
      
      // Correction pour localhost sans port -> localhost:4200
      if (extractedUrl.startsWith('http://localhost/')) {
        extractedUrl = extractedUrl.replace('http://localhost/', 'http://localhost:4200/');
        console.log('🔧 URL corrigée (port ajouté):', originalUrl, '->', extractedUrl);
      }
      // Correction pour localhost avec mauvais port
      else if (extractedUrl.includes('http://localhost:') && !extractedUrl.includes('http://localhost:4200')) {
        const urlParts = extractedUrl.split('/');
        urlParts[2] = 'localhost:4200'; // Remplace host:port
        extractedUrl = urlParts.join('/');
        console.log('🔧 URL corrigée (port modifié):', originalUrl, '->', extractedUrl);
      }
      // Gestion des chemins relatifs
      else if (!extractedUrl.startsWith('http://') && !extractedUrl.startsWith('https://')) {
        const originalPath = extractedUrl;
        extractedUrl = getImageUrl(extractedUrl);
        console.log('🔧 URL construite depuis chemin relatif:', originalPath, '->', extractedUrl);
      }
    }

    console.log('✅ URL finale à utiliser:', extractedUrl);
    return extractedUrl;
  };

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setError(null);
    setUploadProgress(null);

    try {
      const isValid = await validateFile(file);
      if (!isValid) {
        setIsUploading(false);
        setSelectedFile(null);
        return;
      }

      console.log('📤 Début de l\'upload du fichier:', file.name);

      // Cast la réponse selon notre interface UploadResponse
      const response = await apiService.uploadFile(file, (progress) => {
        setUploadProgress(progress);
        console.log('📊 Progression upload:', `${progress.percentage}%`);
      }) as UploadResponse;

      console.log('📥 Réponse complète du serveur:', response);

      const fileUrl = extractUrlFromResponse(response);

      if (!fileUrl) {
        console.error('❌ Impossible d\'extraire l\'URL de la réponse:', response);
        setError(response.message || 'Échec du téléchargement - URL manquante');
        setIsUploading(false);
        setSelectedFile(null);
        return;
      }

      console.log('✅ Upload réussi, URL utilisée:', fileUrl);
      onChange(fileUrl);
      setIsUploading(false);
      setSelectedFile(null);
      
      // Petit délai pour voir le succès
      setTimeout(() => {
        setUploadProgress(null);
      }, 1000);

    } catch (error) {
      console.error('❌ Erreur lors de l\'upload:', error);
      setError(error instanceof Error ? error.message : 'Échec du téléchargement');
      setIsUploading(false);
      setSelectedFile(null);
      setUploadProgress(null);
    }
  };

  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        setSelectedFile(file);
        await uploadFile(file);
      }
    },
    [onChange]
  );

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        const file = e.target.files[0];
        setSelectedFile(file);
        await uploadFile(file);
        // Reset the input value so the same file can be selected again
        e.target.value = '';
      }
    },
    [onChange]
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
    return url.match(/\.(jpeg|jpg|gif|png|svg|webp)$/i);
  };

  const getDisplayImageUrl = () => {
    const url = value || previewUrl;
    if (url && !url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('blob:')) {
      return getImageUrl(url);
    }
    return url;
  };

  const hasImageToShow = () => {
    return value || (previewUrl && !isUploading);
  };

  const toggleExternalInput = useCallback(() => {
    setShowExternalInput(prev => !prev);
    setError(null);
  }, []);

  return (
    <div className={cn('w-full space-y-4', className)}>
      {/* File input (hidden) */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={accept}
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
              !showExternalInput
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
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
              showExternalInput
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
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
        <div
          className={cn(
            'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300',
            isDragging
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20 scale-105'
              : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-gray-50 dark:hover:bg-gray-800/50',
            'flex flex-col items-center justify-center gap-4 min-h-[250px]'
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleButtonClick}
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
            <div>{accept !== '*/*' ? `Formats acceptés: ${accept}` : 'Tous les types de fichiers acceptés'}</div>
            <div>Taille maximum: {Math.round(maxSize / 1024 / 1024)}MB</div>
          </div>

          {isCoverImage && (
            <div className="px-6 py-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <div className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                💡 Cette image sera utilisée comme couverture de l'article
              </div>
            </div>
          )}
        </div>
      )}

      {/* Upload progress with preview */}
      {isUploading && selectedFile && (
        <div className="space-y-4">
          {previewUrl && isImage(previewUrl) && (
            <div className="border rounded-xl overflow-hidden bg-white dark:bg-gray-800 shadow-sm">
              <div className="h-64 relative">
                <img
                  src={previewUrl}
                  alt="Aperçu en cours de téléchargement"
                  className="w-full h-full object-cover"
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
      {previewMode && getDisplayImageUrl() && isImage(getDisplayImageUrl()!) && (
        <div 
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-8" 
          onClick={togglePreviewMode}
        >
          <div className="relative max-w-7xl max-h-[90vh] overflow-auto">
            <img 
              src={getDisplayImageUrl()!} 
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
        </div>
      )}

      {/* Uploaded file preview - Layout complètement séparé */}
      {hasImageToShow() && !isUploading && (
        <div className="space-y-4">
          {/* Image preview */}
          <div className="border rounded-xl overflow-hidden bg-white dark:bg-gray-800 shadow-sm">
            {isImage(getDisplayImageUrl()!) ? (
              <div className="h-64 relative overflow-hidden bg-gray-100 dark:bg-gray-700">
                <img
                  src={getDisplayImageUrl()!}
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
                    {getDisplayImageUrl()!.split('/').pop()}
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
                URL: {value}
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