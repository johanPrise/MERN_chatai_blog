import React, { useState } from 'react';
import { useGlobalErrorHandler } from '../hooks/useGlobalErrorHandler';
import { useInteractions } from '../hooks/useInteractions';
import { useNavigation } from '../hooks/useNavigation';
import { useImageHandler } from '../hooks/useImageHandler';
import { useContentFilter } from '../hooks/useContentFilter';
import { useThemeListener } from '../hooks/useThemeListener';
import ErrorBoundary from './ErrorBoundary';

/**
 * Demo component showcasing the global error handling system
 * This component demonstrates all error handling capabilities
 */
const ErrorHandlingDemo: React.FC = () => {
  const [testContent, setTestContent] = useState('');
  const [filteredContent, setFilteredContent] = useState('');

  // Error handling hooks
  const {
    handleApiError,
    handleImageError,
    handleNavigationError,
    handleInteractionError,
    handleContentFilterError,
    handleThemeError,
    handleGenericError,
  } = useGlobalErrorHandler();

  // Feature hooks with integrated error handling
  const { likePost, dislikePost, interactionState } = useInteractions();
  const { navigateTo, navigateToPost, currentPath } = useNavigation();
  const { uploadImage, validateImage, uploadState } = useImageHandler();
  const { filterContent, isContentAppropriate, filterState } = useContentFilter();

  // Theme listener for theme errors
  useThemeListener();

  // Demo functions to trigger different types of errors
  const triggerApiError = () => {
    const apiError = new Error('Demo API Error') as any;
    apiError.status = 500;
    handleApiError(apiError, {
      context: { component: 'ErrorHandlingDemo', action: 'demo_api_error' },
      showToUser: true,
    });
  };

  const triggerImageError = () => {
    handleImageError('https://invalid-image-url.com/image.jpg', {
      context: { component: 'ErrorHandlingDemo', action: 'demo_image_error' },
      showToUser: true,
    });
  };

  const triggerNavigationError = () => {
    handleNavigationError('/invalid/route', {
      context: { component: 'ErrorHandlingDemo', action: 'demo_navigation_error' },
      showToUser: true,
    });
  };

  const triggerInteractionError = () => {
    handleInteractionError('like', 'post', 'demo-post-123', {
      context: { component: 'ErrorHandlingDemo', action: 'demo_interaction_error' },
      showToUser: true,
    });
  };

  const triggerContentFilterError = () => {
    handleContentFilterError('Demo inappropriate content', {
      context: { component: 'ErrorHandlingDemo', action: 'demo_content_filter_error' },
      showToUser: true,
    });
  };

  const triggerThemeError = () => {
    handleThemeError('demo_theme_change', {
      context: { component: 'ErrorHandlingDemo', action: 'demo_theme_error' },
      showToUser: true,
    });
  };

  const triggerGenericError = () => {
    const error = new Error('Demo generic error');
    handleGenericError(error, 'UNKNOWN_ERROR', {
      context: { component: 'ErrorHandlingDemo', action: 'demo_generic_error' },
      showToUser: true,
    });
  };

  // Demo functions for feature hooks
  const testLikePost = async () => {
    const success = await likePost('demo-post-123');
    console.log('Like post result:', success);
  };

  const testNavigation = () => {
    navigateToPost('demo-post-123');
  };

  const testImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const isValid = validateImage(file);
      if (await isValid) {
        const imageUrl = await uploadImage(file);
        console.log('Uploaded image URL:', imageUrl);
      }
    }
  };

  const testContentFilter = async () => {
    if (testContent) {
      const filtered = await filterContent(testContent);
      setFilteredContent(filtered);
    }
  };

  // Component that will throw an error for ErrorBoundary demo
  const ErrorThrowingComponent = () => {
    const [shouldThrow, setShouldThrow] = useState(false);

    if (shouldThrow) {
      throw new Error('Demo React error for ErrorBoundary');
    }

    return (
      <div className="p-4 border rounded">
        <h4 className="font-semibold mb-2">ErrorBoundary Demo</h4>
        <button
          onClick={() => setShouldThrow(true)}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Trigger React Error
        </button>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Système de Gestion d'Erreurs Global</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Démonstration des capacités de gestion d'erreurs centralisée
        </p>
      </div>

      {/* Error Trigger Demos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Déclencheurs d'Erreurs</h2>

          <div className="space-y-2">
            <button
              onClick={triggerApiError}
              className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Erreur API
            </button>

            <button
              onClick={triggerImageError}
              className="w-full px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
            >
              Erreur Image
            </button>

            <button
              onClick={triggerNavigationError}
              className="w-full px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
            >
              Erreur Navigation
            </button>

            <button
              onClick={triggerInteractionError}
              className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Erreur Interaction
            </button>

            <button
              onClick={triggerContentFilterError}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Erreur Filtre Contenu
            </button>

            <button
              onClick={triggerThemeError}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Erreur Thème
            </button>

            <button
              onClick={triggerGenericError}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Erreur Générique
            </button>
          </div>
        </div>

        {/* Feature Hook Demos */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Hooks avec Gestion d'Erreurs</h2>

          <div className="space-y-2">
            <button
              onClick={testLikePost}
              disabled={interactionState.isLoading}
              className="w-full px-4 py-2 bg-pink-600 text-white rounded hover:bg-pink-700 disabled:opacity-50"
            >
              {interactionState.isLoading ? 'Chargement...' : 'Test Like Post'}
            </button>

            <button
              onClick={testNavigation}
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Test Navigation
            </button>

            <div>
              <label className="block text-sm font-medium mb-1">Test Upload Image:</label>
              <input
                type="file"
                accept="image/*"
                onChange={testImageUpload}
                className="w-full px-3 py-2 border rounded"
              />
              {uploadState.isUploading && (
                <div className="mt-2">
                  <div className="bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadState.progress}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{uploadState.progress}%</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content Filter Demo */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Test Filtre de Contenu</h2>
        <div className="space-y-2">
          <textarea
            value={testContent}
            onChange={e => setTestContent(e.target.value)}
            placeholder="Tapez du contenu à filtrer..."
            className="w-full px-3 py-2 border rounded h-24"
          />
          <button
            onClick={testContentFilter}
            disabled={filterState.isFiltering}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {filterState.isFiltering ? 'Filtrage...' : 'Filtrer Contenu'}
          </button>
          {filteredContent && (
            <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded">
              <p className="text-sm font-medium">Contenu filtré:</p>
              <p>{filteredContent}</p>
              {filterState.hasFiltered && (
                <p className="text-sm text-orange-600 mt-1">⚠️ Contenu modifié par le filtre</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ErrorBoundary Demo */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Test ErrorBoundary</h2>
        <ErrorBoundary context={{ component: 'ErrorHandlingDemo', action: 'demo_error_boundary' }}>
          <ErrorThrowingComponent />
        </ErrorBoundary>
      </div>

      {/* Current State Display */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">État Actuel</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded">
            <h3 className="font-medium mb-2">Navigation</h3>
            <p className="text-sm">Chemin actuel: {currentPath}</p>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded">
            <h3 className="font-medium mb-2">Interactions</h3>
            <p className="text-sm">État: {interactionState.isLoading ? 'Chargement' : 'Prêt'}</p>
            {interactionState.error && (
              <p className="text-sm text-red-600">Erreur: {interactionState.error}</p>
            )}
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded">
            <h3 className="font-medium mb-2">Upload Image</h3>
            <p className="text-sm">
              État: {uploadState.isUploading ? `Upload ${uploadState.progress}%` : 'Prêt'}
            </p>
            {uploadState.error && (
              <p className="text-sm text-red-600">Erreur: {uploadState.error}</p>
            )}
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded">
            <h3 className="font-medium mb-2">Filtre Contenu</h3>
            <p className="text-sm">État: {filterState.isFiltering ? 'Filtrage' : 'Prêt'}</p>
            {filterState.error && (
              <p className="text-sm text-red-600">Erreur: {filterState.error}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorHandlingDemo;
