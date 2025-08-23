/**
 * Page d'édition de post
 * Version stable et fonctionnelle
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

interface Post {
  _id: string;
  id: string;
  title: string;
  content: string;
  excerpt: string;
  summary: string;
  status: 'draft' | 'published' | 'archived';
  categories: Array<{ _id: string; name: string; slug: string }>;
  tags: string[];
  coverImage?: string;
  author: {
    _id: string;
    username: string;
  };
}

interface Category {
  _id: string;
  name: string;
  slug: string;
}

const API_BASE = '/api';

export default function EditPost() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [post, setPost] = useState<Post | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // États du formulaire
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [summary, setSummary] = useState('');
  const [status, setStatus] = useState<'draft' | 'published' | 'archived'>('draft');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [tags, setTags] = useState('');
  const [coverImage, setCoverImage] = useState('');

  // Fonction pour faire des requêtes avec authentification
  const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        throw new Error('Impossible de se connecter au serveur. Vérifiez que le backend est démarré.');
      }
      throw error;
    }
  };

  // Charger le post à éditer
  useEffect(() => {
    const loadPost = async () => {
      if (!id) {
        setError('ID du post manquant');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');

        // Charger le post
        const postData = await apiRequest(`/posts/${id}`);
        console.log('Données reçues du serveur:', postData);
        
        const postInfo = postData.post || postData.data || postData;
        console.log('Post info extrait:', postInfo);

        setPost(postInfo);
        
        // Debug des valeurs avant de les setter
        console.log('Titre:', postInfo.title);
        console.log('Contenu:', postInfo.content);
        console.log('Résumé/Summary:', postInfo.summary);
        console.log('Excerpt:', postInfo.excerpt);
        
        setTitle(postInfo.title || '');
        setContent(postInfo.content || '');
        setSummary(postInfo.summary || postInfo.excerpt || '');
        setStatus(postInfo.status || 'draft');
        setSelectedCategory(postInfo.categories?.[0]?._id || '');
        setTags(Array.isArray(postInfo.tags) ? postInfo.tags.join(', ') : '');
        setCoverImage(postInfo.coverImage || '');

        // Charger les catégories
        try {
          const categoriesData = await apiRequest('/categories');
          setCategories(categoriesData.categories || categoriesData.data || []);
        } catch (catError) {
          console.warn('Erreur lors du chargement des catégories:', catError);
        }

      } catch (err) {
        console.error('Erreur lors du chargement du post:', err);
        setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
      } finally {
        setLoading(false);
      }
    };

    loadPost();
  }, [id]);

  // Sauvegarder les modifications
  const handleSave = async (newStatus?: 'draft' | 'published' | 'archived') => {
    if (!post || !id) return;

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const updateData = {
        title: title.trim(),
        content: content.trim(),
        summary: summary.trim(),
        status: newStatus || status,
        categories: selectedCategory ? [selectedCategory] : [],
        tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        coverImage: coverImage.trim() || undefined,
      };

      const result = await apiRequest(`/posts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });

      if (result.success !== false) {
        setSuccess('Post mis à jour avec succès !');
        
        // Mettre à jour l'état local
        const updatedPost = result.post || result.data || result;
        if (updatedPost) {
          setPost(updatedPost);
          setStatus(updatedPost.status || status);
        }

        // Rediriger après un délai
        setTimeout(() => {
          navigate(`/Post/${id}`);
        }, 1500);
      } else {
        throw new Error(result.message || 'Erreur lors de la mise à jour');
      }

    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  // Sauvegarder comme brouillon
  const handleSaveDraft = () => handleSave('draft');

  // Publier
  const handlePublish = () => handleSave('published');

  // Annuler
  const handleCancel = () => {
    navigate(`/Post/${id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement du post...</p>
        </div>
      </div>
    );
  }

  if (error && !post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Erreur</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Modifier le post</h1>
          <p className="text-gray-600 mt-2">Apportez vos modifications et sauvegardez</p>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
            {success}
          </div>
        )}

        {/* Formulaire */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="space-y-6">
            {/* Titre */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Titre *
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Titre du post"
                required
              />
            </div>

            {/* Résumé */}
            <div>
              <label htmlFor="summary" className="block text-sm font-medium text-gray-700 mb-2">
                Résumé *
              </label>
              <textarea
                id="summary"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Résumé du post"
                required
              />
            </div>

            {/* Contenu */}
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                Contenu *
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={12}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Contenu du post (Markdown supporté)"
                required
              />
            </div>

            {/* Image de couverture */}
            <div>
              <label htmlFor="coverImage" className="block text-sm font-medium text-gray-700 mb-2">
                Image de couverture (URL)
              </label>
              <input
                type="url"
                id="coverImage"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Catégorie */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                  Catégorie
                </label>
                <select
                  id="category"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sélectionner une catégorie</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Statut */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                  Statut
                </label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'draft' | 'published' | 'archived')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="draft">Brouillon</option>
                  <option value="published">Publié</option>
                  <option value="archived">Archivé</option>
                </select>
              </div>
            </div>

            {/* Tags */}
            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
                Tags (séparés par des virgules)
              </label>
              <input
                type="text"
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="tag1, tag2, tag3"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 flex flex-wrap gap-4">
            <button
              onClick={handleSaveDraft}
              disabled={saving || !title.trim() || !summary.trim()}
              className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Sauvegarde...' : 'Sauvegarder comme brouillon'}
            </button>

            <button
              onClick={handlePublish}
              disabled={saving || !title.trim() || !summary.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Publication...' : 'Publier'}
            </button>

            <button
              onClick={handleCancel}
              disabled={saving}
              className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 disabled:opacity-50"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}