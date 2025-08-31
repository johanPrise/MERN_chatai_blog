/**
 * Interface pour l'auteur d'un post ou commentaire
 */
export interface Author {
  _id: string
  username: string
}

/**
 * Interface pour la catégorie d'un post
 */
export interface Category {
  _id: string
  name: string
  description?: string
}

/**
 * Interface pour un commentaire
 */
export interface Comment {
  _id: string
  author: Author
  content: string
  createdAt: string
  likes: string[]
  dislikes: string[]
  replies?: Comment[]
  post?: string
}

/**
 * Interface pour une référence d'image
 */
export interface ImageRef {
  url: string
  alt?: string
}

/**
 * Interface complète pour un post
 */
export interface Post {
  _id: string
  title: string
  summary: string
  content: string
  // Image de couverture standardisée
  coverImage: ImageRef
  author: Author
  category?: Category | null
  categories?: Category[] // Ajout du champ categories pour compatibilité avec le backend
  createdAt: string
  updatedAt?: string
  likes: string[]
  dislikes: string[]
  featured?: boolean
  comments?: Comment[]
  views?: number // Champ pour le compteur de vues (à implémenter côté API)
}

/**
 * Type pour la compatibilité avec le code existant
 * @deprecated Utiliser l'interface Post à la place
 */
export type PostType = Post