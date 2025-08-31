import { useState, useCallback } from 'react';
import { useGlobalErrorHandler } from './useGlobalErrorHandler';
import { API_ENDPOINTS } from '../config/api.config';

interface ImageUploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
}

interface UseImageHandlerReturn {
  uploadImage: (file: File) => Promise<string | null>;
  validateImage: (file: File) => Promise<boolean>;
  uploadState: ImageUploadState;
  clearError: () => void;
}

/**
 * Hook for handling image operations with centralized error handling
 * Provides image upload, validation, and error management
 */
export const useImageHandler = (): UseImageHandlerReturn => {
  const [uploadState, setUploadState] = useState<ImageUploadState>({
    isUploading: false,
    progress: 0,
    error: null,
  });
  const { handleImageError } = useGlobalErrorHandler();

  const clearError = useCallback(() => {
    setUploadState(prev => ({ ...prev, error: null }));
  }, []);

  const validateImage = useCallback(
    async (file: File): Promise<boolean> => {
      try {
        // Check file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
          handleImageError(file.name, {
            context: {
              component: 'useImageHandler',
              action: 'validate_image_type',
              userId: undefined,
            },
            showToUser: true,
            logToConsole: true,
          });
          setUploadState(prev => ({ ...prev, error: "Format d'image non supporté" }));
          return false;
        }

        // Check file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
          handleImageError(file.name, {
            context: {
              component: 'useImageHandler',
              action: 'validate_image_size',
              userId: undefined,
            },
            showToUser: true,
            logToConsole: true,
          });
          setUploadState(prev => ({ ...prev, error: "L'image est trop volumineuse (max 5MB)" }));
          return false;
        }

        // Check image dimensions (optional)
        return new Promise<boolean>(resolve => {
          const img = new Image();
          img.onload = () => {
            const maxWidth = 4000;
            const maxHeight = 4000;

            if (img.width > maxWidth || img.height > maxHeight) {
              handleImageError(file.name, {
                context: {
                  component: 'useImageHandler',
                  action: 'validate_image_dimensions',
                  userId: undefined,
                },
                showToUser: true,
                logToConsole: true,
              });
              setUploadState(prev => ({ ...prev, error: "Dimensions d'image trop importantes" }));
              resolve(false);
            } else {
              resolve(true);
            }
          };
          img.onerror = () => {
            handleImageError(file.name, {
              context: {
                component: 'useImageHandler',
                action: 'validate_image_load',
                userId: undefined,
              },
              showToUser: true,
              logToConsole: true,
            });
            setUploadState(prev => ({ ...prev, error: "Impossible de lire l'image" }));
            resolve(false);
          };
          img.src = URL.createObjectURL(file);
        });
      } catch (error) {
        handleImageError(file.name, {
          context: {
            component: 'useImageHandler',
            action: 'validate_image_error',
            userId: undefined,
          },
          showToUser: true,
          logToConsole: true,
        });
        setUploadState(prev => ({ ...prev, error: "Erreur lors de la validation de l'image" }));
        return false;
      }
    },
    [handleImageError]
  );

  const uploadImage = useCallback(
    async (file: File): Promise<string | null> => {
      setUploadState({ isUploading: true, progress: 0, error: null });

      try {
        // Validate image first
        const isValid = await validateImage(file);
        if (!isValid) {
          setUploadState(prev => ({ ...prev, isUploading: false }));
          return null;
        }

        // Create form data (backend expects 'file')
        const formData = new FormData();
        formData.append('file', file);

        // Upload with progress tracking
        const xhr = new XMLHttpRequest();

        return new Promise<string | null>((resolve, reject) => {
          xhr.upload.addEventListener('progress', event => {
            if (event.lengthComputable) {
              const progress = Math.round((event.loaded / event.total) * 100);
              setUploadState(prev => ({ ...prev, progress }));
            }
          });

          xhr.addEventListener('load', () => {
            if (xhr.status === 200) {
              try {
                const response = JSON.parse(xhr.responseText);
                setUploadState({ isUploading: false, progress: 100, error: null });
                // Prefer new structured urls, fallback to legacy fields
                const url: string | null =
                  (response.urls && (response.urls.optimized || response.urls.original)) ||
                  response.url ||
                  (response.data && response.data.url) ||
                  response.imageUrl ||
                  null;
                resolve(url);
              } catch (parseError) {
                handleImageError(file.name, {
                  context: {
                    component: 'useImageHandler',
                    action: 'upload_response_parse',
                    userId: undefined,
                  },
                  showToUser: true,
                  logToConsole: true,
                });
                setUploadState({
                  isUploading: false,
                  progress: 0,
                  error: 'Erreur lors du traitement de la réponse',
                });
                resolve(null);
              }
            } else {
              handleImageError(file.name, {
                context: {
                  component: 'useImageHandler',
                  action: 'upload_http_error',
                  userId: undefined,
                },
                showToUser: true,
                logToConsole: true,
              });
              setUploadState({
                isUploading: false,
                progress: 0,
                error: `Erreur d'upload: ${xhr.status}`,
              });
              resolve(null);
            }
          });

          xhr.addEventListener('error', () => {
            handleImageError(file.name, {
              context: {
                component: 'useImageHandler',
                action: 'upload_network_error',
                userId: undefined,
              },
              showToUser: true,
              logToConsole: true,
            });
            setUploadState({
              isUploading: false,
              progress: 0,
              error: "Erreur réseau lors de l'upload",
            });
            resolve(null);
          });

          xhr.addEventListener('timeout', () => {
            handleImageError(file.name, {
              context: {
                component: 'useImageHandler',
                action: 'upload_timeout',
                userId: undefined,
              },
              showToUser: true,
              logToConsole: true,
            });
            setUploadState({ isUploading: false, progress: 0, error: "Timeout lors de l'upload" });
            resolve(null);
          });

          xhr.open('POST', API_ENDPOINTS.uploads.file);
          xhr.withCredentials = true;
          xhr.timeout = 30000; // 30 seconds timeout
          xhr.send(formData);
        });
      } catch (error) {
        handleImageError(file.name, {
          context: {
            component: 'useImageHandler',
            action: 'upload_general_error',
            userId: undefined,
          },
          showToUser: true,
          logToConsole: true,
        });
        setUploadState({
          isUploading: false,
          progress: 0,
          error: "Erreur lors de l'upload de l'image",
        });
        return null;
      }
    },
    [validateImage, handleImageError]
  );

  return {
    uploadImage,
    validateImage,
    uploadState,
    clearError,
  };
};
