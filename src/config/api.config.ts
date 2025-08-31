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
    drafts: `${API_BASE_URL}/posts?status=draft`,
    publish: (id: string) => `${API_BASE_URL}/posts/${id}/publish`,
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
 * @returns URL complète de l'image ou placeholder si invalide
 */
export function getImageUrl(imagePath?: string | null): string {
  // Si le chemin est vide, null ou undefined, retourner un placeholder
  if (!imagePath || imagePath.trim() === '') {
    return '/placeholder.svg';
  }
  
  // Si le chemin est déjà une URL complète, on le retourne tel quel
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // Si le chemin commence par 'data:', c'est une image base64
  if (imagePath.startsWith('data:')) {
    return imagePath;
  }
  
  // Si le chemin commence par 'blob:', c'est une URL d'objet temporaire
  if (imagePath.startsWith('blob:')) {
    return imagePath;
  }
  
  // Si le chemin commence par '/', c'est déjà un chemin absolu local
  if (imagePath.startsWith('/')) {
    // Spécial: servir les uploads depuis le backend (peut être sur un autre port/domaine)
    if (imagePath.startsWith('/uploads/')) {
      return `${SERVER_BASE_URL}${imagePath}`;
    }
    return imagePath;
  }
  
  // Nettoyer le chemin en supprimant les slashes en début
  const cleanPath = imagePath.replace(/^\/+/, '');
  
  // Si le chemin ne commence pas par 'uploads/', l'ajouter
  const finalPath = cleanPath.startsWith('uploads/') ? cleanPath : `uploads/${cleanPath}`;
  
  // Construit l'URL en fonction de l'environnement
  return `${SERVER_BASE_URL}/${finalPath}`;
}

/**
 * Vérifie si une URL d'image est valide
 * @param imageUrl URL de l'image à vérifier
 * @returns Promise<boolean> true si l'image est accessible
 */
export function validateImageUrl(imageUrl: string): Promise<boolean> {
  return new Promise((resolve) => {
    console.log('🔎 validateImageUrl - Testing:', imageUrl);
    
    if (!imageUrl || imageUrl === '/placeholder.svg') {
      console.log('⚠️ Invalid or placeholder URL, skipping validation');
      resolve(false);
      return;
    }
    
    const img = new Image();
    const timeout = setTimeout(() => {
      console.log('⏱️ Image validation timeout for:', imageUrl);
      resolve(false);
    }, 5000); // 5 secondes de timeout
    
    img.onload = () => {
      console.log('✅ Image loaded successfully:', imageUrl);
      clearTimeout(timeout);
      resolve(true);
    };
    
    img.onerror = (error) => {
      console.log('❌ Image failed to load:', imageUrl, error);
      clearTimeout(timeout);
      resolve(false);
    };
    
    img.src = imageUrl;
  });
}

/**
 * Interface pour les options d'image
 */
export interface ImageOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
}

/**
 * Génère une URL d'image optimisée avec fallback
 * @param imagePath Chemin de l'image
 * @param options Options d'optimisation
 * @returns URL optimisée ou fallback
 */
export function getOptimizedImageUrl(imagePath?: string | null, options?: ImageOptions): string {
  const baseUrl = getImageUrl(imagePath);
  
  // Si c'est un placeholder, retourner tel quel
  if (baseUrl === '/placeholder.svg') {
    return baseUrl;
  }
  
  // Si c'est une URL externe complète, retourner tel quel
  if (baseUrl.startsWith('http://') && !baseUrl.includes('localhost') || 
      baseUrl.startsWith('https://')) {
    return baseUrl;
  }
  
  // Pour les images locales, on peut ajouter des paramètres d'optimisation
  if (options && Object.keys(options).length > 0) {
    const params = new URLSearchParams();
    if (options.width) params.append('w', options.width.toString());
    if (options.height) params.append('h', options.height.toString());
    if (options.quality) params.append('q', options.quality.toString());
    if (options.format) params.append('f', options.format);
    
    const queryString = params.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  }
  
  return baseUrl;
}

/**
 * Système de fallback pour les images
 */
export const IMAGE_FALLBACKS = {
  primary: '/placeholder.svg',
  secondary: '/placeholder.svg',      // Fixed: use existing file
  error: '/placeholder-logo.svg',
  user: '/placeholder.svg',           // Fixed: use existing file
} as const;

/**
 * Obtient l'URL de fallback appropriée selon le type d'image
 * @param type Type de fallback
 * @returns URL de fallback
 */
export function getFallbackImageUrl(type: keyof typeof IMAGE_FALLBACKS = 'primary'): string {
  return IMAGE_FALLBACKS[type];
}

/**
 * Teste une chaîne de fallbacks pour trouver une image valide
 * @param imageUrls Liste d'URLs à tester
 * @returns Promise<string> Première URL valide ou fallback final
 */
export async function getValidImageUrl(imageUrls: (string | null | undefined)[]): Promise<string> {
  console.log('🔍 getValidImageUrl - Testing URLs:', imageUrls);
  
  for (const url of imageUrls) {
    if (!url) {
      console.log('⚠️ Skipping empty/null URL');
      continue;
    }
    
    const imageUrl = getImageUrl(url);
    console.log('🌍 Testing image URL:', imageUrl);
    
    const isValid = await validateImageUrl(imageUrl);
    console.log(`${isValid ? '✅' : '❌'} URL validation result for ${imageUrl}:`, isValid);
    
    if (isValid) {
      console.log('✨ Found valid image URL:', imageUrl);
      return imageUrl;
    }
  }
  
  // Si aucune image n'est valide, retourner le fallback principal
  const fallback = getFallbackImageUrl('primary');
  console.log('🔄 All URLs failed, using primary fallback:', fallback);
  return fallback;
}
