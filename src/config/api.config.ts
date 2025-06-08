// @ts-ignore
/**
 * Configuration des URLs de l'API
 */

// URL de base de l'API - utilise la variable d'environnement ou le proxy Vite
export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// URL de base du serveur (pour les fichiers statiques comme les images)
export const SERVER_BASE_URL = import.meta.env.VITE_IMAGE_BASE_URL || 'http://localhost:4200';

// Endpoints de l'API
export const API_ENDPOINTS = {
  // Authentification
  auth: {
    login: `${API_BASE_URL}/auth/login`,
    register: `${API_BASE_URL}/auth/register`,
    logout: `${API_BASE_URL}/auth/logout`,
    forgotPassword: `${API_BASE_URL}/auth/forgot-password`,
    resetPassword: (token: string) => `${API_BASE_URL}/auth/reset-password/${token}`,
    verifyEmail: (token: string) => `${API_BASE_URL}/auth/verify-email/${token}`,
    me: `${API_BASE_URL}/auth/me`,
    checkAdmin: `${API_BASE_URL}/auth/check-admin`,
    checkAuthor: `${API_BASE_URL}/auth/check-author`,
  },

  // Utilisateurs
  users: {
    profile: `${API_BASE_URL}/users/profile`,
    update: `${API_BASE_URL}/users/profile`,
    changePassword: `${API_BASE_URL}/auth/change-password`, // Corrigé: route dans auth, pas users
    delete: `${API_BASE_URL}/users/profile`,
    list: `${API_BASE_URL}/users`,
    detail: (id: string) => `${API_BASE_URL}/users/${id}`,
    changeRole: (id: string) => `${API_BASE_URL}/users/${id}/role`,
    deleteAccount: `${API_BASE_URL}/users/delete-account`,
  },

  // Articles
  posts: {
    list: `${API_BASE_URL}/posts`,
    detail: (idOrSlug: string) => `${API_BASE_URL}/posts/${idOrSlug}`,
    create: `${API_BASE_URL}/posts`,
    update: (id: string) => `${API_BASE_URL}/posts/${id}`,
    delete: (id: string) => `${API_BASE_URL}/posts/${id}`,
    search: `${API_BASE_URL}/posts/search`,
    like: (id: string) => `${API_BASE_URL}/posts/${id}/like`,
    dislike: (id: string) => `${API_BASE_URL}/posts/${id}/dislike`,
    unlike: (id: string) => `${API_BASE_URL}/posts/${id}/unlike`,
    stats: (id: string) => `${API_BASE_URL}/posts/${id}/stats`,
  },

// Commentaires
  comments: {
    list: `${API_BASE_URL}/comments`,
    byPost: (postId: string) => `${API_BASE_URL}/comments/post/${postId}`, // Ajouter cette ligne
    create: `${API_BASE_URL}/comments`,
    update: (id: string) => `${API_BASE_URL}/comments/${id}`,
    delete: (id: string) => `${API_BASE_URL}/comments/${id}`,
    like: (id: string) => `${API_BASE_URL}/comments/${id}/like`,
    unlike: (id: string) => `${API_BASE_URL}/comments/${id}/unlike`,
    dislike: (id: string) => `${API_BASE_URL}/comments/${id}/dislike`,
  },


  // Catégories
  categories: {
    list: `${API_BASE_URL}/categories`,
    detail: (idOrSlug: string) => `${API_BASE_URL}/categories/${idOrSlug}`,
  },

  // Uploads
  uploads: {
    file: `${API_BASE_URL}/uploads/file`,
    base64: `${API_BASE_URL}/uploads/base64`,
  },

  // IA
  ai: {
    message: `${API_BASE_URL}/ai/message`,
    test: `${API_BASE_URL}/ai/test`,
  },

  // Contenu
  content: {
    list: `${API_BASE_URL}/content`,
    detail: (slug: string) => `${API_BASE_URL}/content/${slug}`,
  },

  // Santé de l'API
  health: `${API_BASE_URL}/health`,
};

/**
 * Construit l'URL complète d'une image à partir d'un chemin relatif
 * @param imagePath Chemin relatif de l'image (ex: 'uploads/IHKq7irhQJ.png')
 * @returns URL complète de l'image
 */
export function getImageUrl(imagePath: string): string {
  // Si le chemin est déjà une URL complète, on le retourne tel quel
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // Construit l'URL en fonction de l'environnement
  return `${SERVER_BASE_URL}/${imagePath.replace(/^\//, '')}`;
}
