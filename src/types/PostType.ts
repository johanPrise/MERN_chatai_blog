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
 * Interface complète pour un post
 */
export interface Post {
  _id: string
  title: string
  summary: string
  content: string
  cover: string
  author: Author
  category?: Category | null
  createdAt: string
  updatedAt?: string
  likes: string[]
  dislikes: string[]
  featured?: boolean
  comments?: Comment[]
}

/**
 * Type pour la compatibilité avec le code existant
 * @deprecated Utiliser l'interface Post à la place
 */
export type PostType = Post