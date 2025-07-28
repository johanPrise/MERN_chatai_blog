# Design Document

## Overview

Ce document détaille la conception technique pour résoudre les problèmes critiques du blog. L'approche se concentre sur la correction des dysfonctionnements existants tout en maintenant la compatibilité avec l'architecture actuelle basée sur React, TypeScript, et une API REST.

L'architecture actuelle utilise :
- **Frontend** : React 18 + TypeScript + Vite + TailwindCSS
- **State Management** : Context API (UserContext)
- **Routing** : React Router v6
- **API Communication** : Fetch API avec endpoints REST
- **Styling** : TailwindCSS avec système de thèmes CSS variables

## Architecture

### 1. Système de Likes/Dislikes Réparé

**Problème identifié** : Les likes/dislikes des posts ne fonctionnent pas, et ceux des commentaires ne persistent pas.

**Solution architecturale** :
```typescript
// Service de gestion des interactions
interface InteractionService {
  likePost(postId: string): Promise<InteractionResult>
  dislikePost(postId: string): Promise<InteractionResult>
  likeComment(commentId: string): Promise<InteractionResult>
  dislikeComment(commentId: string): Promise<InteractionResult>
}

interface InteractionResult {
  success: boolean
  likes: string[]
  dislikes: string[]
  userLiked: boolean
  userDisliked: boolean
}
```

**Stratégie de mise à jour** :
- Optimistic updates pour l'UX
- Rollback automatique en cas d'erreur
- Synchronisation avec le serveur
- Gestion des états de chargement

### 2. Navigation et Redirections Corrigées

**Problème identifié** : Redirection vers des pages "undefined" après création de posts.

**Solution** :
```typescript
// Hook de navigation sécurisée
interface NavigationService {
  navigateToPost(postId: string): void
  navigateWithFallback(primaryRoute: string, fallbackRoute: string): void
  validateRoute(route: string): boolean
}
```

**Implémentation** :
- Validation des IDs de posts avant redirection
- Routes de fallback en cas d'erreur
- Gestion des états de chargement pendant la création

### 3. Système de Gestion des Brouillons

**Architecture proposée** :
```typescript
interface DraftService {
  getDrafts(userId?: string): Promise<Draft[]>
  getDraftById(draftId: string): Promise<Draft>
  publishDraft(draftId: string): Promise<Post>
  deleteDraft(draftId: string): Promise<void>
}

interface Draft {
  _id: string
  title: string
  content: string
  summary?: string
  cover?: string
  author: User
  createdAt: Date
  updatedAt: Date
  status: 'draft'
}
```

**Contrôle d'accès** :
- Middleware de vérification des rôles
- Filtrage par auteur pour les créateurs
- Accès complet pour les administrateurs

### 4. Système d'Images Réparé

**Problème identifié** : Images ne s'affichent pas (locales et par URL).

**Solution multi-niveaux** :
```typescript
interface ImageService {
  validateImageUrl(url: string): Promise<boolean>
  getOptimizedImageUrl(url: string, options?: ImageOptions): string
  handleImageError(fallbackUrl?: string): string
  preloadImage(url: string): Promise<void>
}

interface ImageOptions {
  width?: number
  height?: number
  quality?: number
  format?: 'webp' | 'jpeg' | 'png'
}
```

**Stratégies de fallback** :
1. Image originale
2. Image optimisée
3. Placeholder générique
4. Placeholder avec message d'erreur

## Components and Interfaces

### 1. Hook d'Interaction Réparé

```typescript
// hooks/useInteractions.ts
interface UseInteractionsReturn {
  // Post interactions
  likePost: (postId: string) => Promise<void>
  dislikePost: (postId: string) => Promise<void>
  
  // Comment interactions
  likeComment: (commentId: string) => Promise<void>
  dislikeComment: (commentId: string) => Promise<void>
  
  // States
  isLoading: boolean
  error: string | null
  
  // Utils
  hasUserLiked: (likes: string[], userId?: string) => boolean
  hasUserDisliked: (dislikes: string[], userId?: string) => boolean
}
```

### 2. Composant d'Image Robuste

```typescript
// components/SafeImage.tsx
interface SafeImageProps {
  src: string
  alt: string
  fallbackSrc?: string
  className?: string
  onError?: () => void
  onLoad?: () => void
  loading?: 'lazy' | 'eager'
  sizes?: string
}
```

### 3. Éditeur de Posts Stabilisé

```typescript
// components/PostEditor.tsx
interface PostEditorProps {
  initialContent?: string
  initialSummary?: string
  onSave: (content: PostContent) => Promise<void>
  onError: (error: string) => void
  preserveFormatting?: boolean
}

interface PostContent {
  title: string
  content: string
  summary: string
  cover?: string
}
```

### 4. Système de Thème Global

```typescript
// contexts/ThemeContext.tsx
interface ThemeContextValue {
  theme: 'light' | 'dark'
  colorTheme: 'green' | 'blue' | 'purple' | 'amber'
  toggleTheme: () => void
  setColorTheme: (theme: string) => void
  applyTheme: () => void
}
```

## Data Models

### 1. Modèle d'Interaction Étendu

```typescript
interface PostInteraction {
  postId: string
  likes: string[] // User IDs
  dislikes: string[] // User IDs
  likesCount: number
  dislikesCount: number
  userInteraction?: {
    liked: boolean
    disliked: boolean
  }
}

interface CommentInteraction {
  commentId: string
  likes: string[]
  dislikes: string[]
  likesCount: number
  dislikesCount: number
  userInteraction?: {
    liked: boolean
    disliked: boolean
  }
}
```

### 2. Modèle de Brouillon

```typescript
interface DraftModel extends Omit<Post, 'status' | 'publishedAt'> {
  status: 'draft'
  lastEditedAt: Date
  autoSaveEnabled: boolean
  version: number
}
```

### 3. Modèle d'Image Étendu

```typescript
interface ImageModel {
  url: string
  originalUrl: string
  optimizedUrl?: string
  alt: string
  width?: number
  height?: number
  size?: number
  format?: string
  isValid: boolean
  lastValidated: Date
}
```

## Error Handling

### 1. Gestion d'Erreurs Centralisée

```typescript
interface ErrorHandler {
  handleApiError(error: ApiError): UserFriendlyError
  handleImageError(imageUrl: string): string
  handleNavigationError(route: string): void
  handleInteractionError(type: 'like' | 'dislike', target: 'post' | 'comment'): void
}

interface UserFriendlyError {
  message: string
  type: 'warning' | 'error' | 'info'
  action?: {
    label: string
    handler: () => void
  }
}
```

### 2. Messages d'Erreur Spécifiques

```typescript
const ERROR_MESSAGES = {
  LIKE_FAILED: "Impossible d'aimer ce contenu. Veuillez réessayer.",
  IMAGE_LOAD_FAILED: "Impossible de charger l'image.",
  POST_CREATION_FAILED: "Erreur lors de la création du post.",
  NAVIGATION_FAILED: "Page introuvable.",
  THEME_CHANGE_FAILED: "Impossible de changer le thème.",
  CONTENT_FILTER_APPLIED: "Votre contenu a été modifié pour respecter les règles de la communauté."
}
```

## Testing Strategy

### 1. Tests d'Intégration pour les Interactions

```typescript
describe('Post Interactions', () => {
  test('should like post and update UI optimistically', async () => {
    // Test optimistic update
    // Test server sync
    // Test rollback on error
  })
  
  test('should persist comment likes after page reload', async () => {
    // Test persistence
    // Test state restoration
  })
})
```

### 2. Tests de Responsive Design

```typescript
describe('Mobile Responsiveness', () => {
  test('should not cause horizontal scroll on mobile', () => {
    // Test viewport constraints
    // Test content wrapping
    // Test image scaling
  })
})
```

### 3. Tests de Gestion d'Images

```typescript
describe('Image Handling', () => {
  test('should fallback to placeholder on image error', () => {
    // Test error handling
    // Test fallback chain
  })
  
  test('should optimize images for different screen sizes', () => {
    // Test responsive images
    // Test optimization parameters
  })
})
```

## Performance Optimizations

### 1. Optimisation des Images

- **Lazy loading** pour toutes les images
- **Responsive images** avec srcset
- **Format WebP** avec fallback
- **Compression automatique**
- **Cache des validations d'images**

### 2. Optimisation des Interactions

- **Debouncing** des actions like/dislike
- **Batch updates** pour les interactions multiples
- **Cache local** des états d'interaction
- **Optimistic updates** avec rollback

### 3. Optimisation Mobile

- **CSS Container Queries** pour la responsivité
- **Touch-friendly** targets (44px minimum)
- **Reduced motion** pour les animations
- **Viewport meta tag** optimisé

## Security Considerations

### 1. Filtrage de Contenu

```typescript
interface ContentFilter {
  filterProfanity(content: string): FilterResult
  validateImageUrl(url: string): boolean
  sanitizeHtml(html: string): string
}

interface FilterResult {
  filteredContent: string
  wasFiltered: boolean
  flaggedWords: string[]
}
```

### 2. Validation des Données

- **Validation côté client** pour l'UX
- **Sanitization** des entrées utilisateur
- **Validation des URLs** d'images
- **Protection CSRF** pour les interactions

### 3. Contrôle d'Accès

- **Vérification des rôles** pour les brouillons
- **Validation des permissions** pour les actions
- **Rate limiting** pour les interactions

## Migration Strategy

### Phase 1 : Corrections Critiques (Priorité Haute)
1. Réparation du système de likes/dislikes
2. Correction des redirections post-création
3. Résolution des problèmes d'affichage d'images
4. Correction du scroll horizontal mobile

### Phase 2 : Améliorations UX (Priorité Moyenne)
1. Implémentation de la page des brouillons
2. Stabilisation de l'éditeur de posts
3. Correction du système de thème global
4. Amélioration des messages d'erreur

### Phase 3 : Fonctionnalités Avancées (Priorité Basse)
1. Implémentation du filtrage de contenu
2. Optimisations de performance
3. Tests automatisés complets
4. Monitoring et analytics

## Rollback Plan

En cas de problème lors du déploiement :

1. **Rollback immédiat** vers la version précédente
2. **Isolation des composants** problématiques
3. **Déploiement progressif** par fonctionnalité
4. **Tests en environnement de staging** obligatoires

## Monitoring and Metrics

### Métriques à surveiller :
- **Taux d'erreur** des interactions (likes/dislikes)
- **Temps de chargement** des images
- **Taux de réussite** des créations de posts
- **Erreurs JavaScript** côté client
- **Performance mobile** (Core Web Vitals)

### Alertes à configurer :
- **Erreurs d'API** > 5%
- **Images non chargées** > 10%
- **Erreurs de navigation** > 2%
- **Temps de réponse** > 3 secondes