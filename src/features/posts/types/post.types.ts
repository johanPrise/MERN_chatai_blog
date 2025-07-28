/**
 * Enhanced Post Management Types
 * Comprehensive type definitions for the new post system
 */

export enum PostStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
  SCHEDULED = 'scheduled',
}

export enum PostVisibility {
  PUBLIC = 'public',
  PRIVATE = 'private',
  UNLISTED = 'unlisted',
}

export interface Author {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  role: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
}

export interface PostMetadata {
  seoTitle?: string;
  seoDescription?: string;
  readingTime: number;
  wordCount: number;
  lastEditedBy: string;
  version: number;
  featuredImage?: string;
  excerpt?: string;
  publishedAt?: Date;
  scheduledFor?: Date;
}

export interface PostStats {
  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  lastViewed?: Date;
}

export interface PostVersion {
  id: string;
  version: number;
  title: string;
  content: string;
  summary: string;
  editedBy: string;
  editedAt: Date;
  changeDescription?: string;
}

export interface PostData {
  id: string;
  title: string;
  content: string; // Always stored as markdown
  summary: string;
  slug: string;
  coverImage?: string;
  categories: Category[];
  tags: string[];
  status: PostStatus;
  visibility: PostVisibility;
  metadata: PostMetadata;
  author: Author;
  createdAt: Date;
  updatedAt: Date;
  stats: PostStats;
  versions?: PostVersion[];
}

export interface CreatePostInput {
  title: string;
  content: string;
  summary: string;
  coverImage?: string;
  categories: string[]; // Category IDs
  tags: string[];
  status?: PostStatus;
  visibility?: PostVisibility;
  metadata?: Partial<PostMetadata>;
  scheduledFor?: Date;
}

export interface UpdatePostInput extends Partial<CreatePostInput> {
  id: string;
  changeDescription?: string;
}

export interface PostFilters {
  search?: string;
  category?: string;
  tag?: string;
  author?: string;
  status?: PostStatus;
  visibility?: PostVisibility;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface PostListResponse {
  posts: PostData[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface PostOperationResult {
  success: boolean;
  data?: PostData;
  error?: string;
  validationErrors?: Record<string, string>;
}

// Editor-specific types
export interface EditorState {
  content: string;
  isDirty: boolean;
  lastSaved: Date | null;
  isAutoSaving: boolean;
  hasUnsavedChanges: boolean;
}

export interface AutoSaveConfig {
  enabled: boolean;
  interval: number; // milliseconds
  maxRetries: number;
}

export interface MarkdownPreviewConfig {
  enabled: boolean;
  syncScroll: boolean;
  showLineNumbers: boolean;
  theme: 'light' | 'dark';
}

// Validation types
export interface ValidationRule {
  field: string;
  rule: string;
  message: string;
  params?: any;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

// Upload types
export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

// SEO types
export interface SEOData {
  title: string;
  description: string;
  keywords: string[];
  ogImage?: string;
  canonicalUrl?: string;
  structuredData?: any;
}

// API Response types
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string>;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    hasMore?: boolean;
  };
}

// Error types
export interface PostError {
  code: string;
  message: string;
  field?: string;
  details?: any;
}

export interface PostErrorState {
  hasError: boolean;
  errors: PostError[];
  lastError?: PostError;
}

// Loading states
export interface LoadingState {
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  isSaving: boolean;
  isUploading: boolean;
}

// Feature flags
export interface PostFeatures {
  autoSave: boolean;
  versionControl: boolean;
  collaborativeEditing: boolean;
  advancedEditor: boolean;
  seoOptimization: boolean;
  socialSharing: boolean;
  analytics: boolean;
}
