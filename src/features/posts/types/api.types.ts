/**
 * API-specific types for post management
 */

import { PostData, PostFilters, CreatePostInput, UpdatePostInput, PostStatus, PostVisibility } from './post.types';

// Base API types
export interface APIConfig {
  baseURL: string;
  timeout: number;
  retries: number;
  headers: Record<string, string>;
}

export interface APIError {
  code: string;
  message: string;
  status: number;
  details?: any;
  timestamp: Date;
}

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
    timestamp?: Date;
  };
}

// Post API endpoints
export interface PostEndpoints {
  list: string;
  detail: (id: string) => string;
  create: string;
  update: (id: string) => string;
  delete: (id: string) => string;
  restore: (id: string) => string;
  duplicate: (id: string) => string;
  versions: (id: string) => string;
  revert: (id: string, version: number) => string;
  publish: (id: string) => string;
  unpublish: (id: string) => string;
  schedule: (id: string) => string;
  search: string;
  bulk: string;
}

// Request/Response types
export interface GetPostsRequest {
  page?: number;
  limit?: number;
  filters?: PostFilters;
  sort?: {
    field: string;
    order: 'asc' | 'desc';
  };
  include?: string[]; // Relations to include
}

export interface GetPostsResponse extends APIResponse {
  data: {
    posts: PostData[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
    filters: PostFilters;
  };
}

export interface GetPostRequest {
  id: string;
  include?: string[];
  version?: number;
}

export interface GetPostResponse extends APIResponse {
  data: PostData;
}

export interface CreatePostRequest {
  data: CreatePostInput;
  options?: {
    autoSave?: boolean;
    validate?: boolean;
    generateSlug?: boolean;
  };
}

export interface CreatePostResponse extends APIResponse {
  data: PostData;
}

export interface UpdatePostRequest {
  id: string;
  data: UpdatePostInput;
  options?: {
    createVersion?: boolean;
    validate?: boolean;
    autoSave?: boolean;
  };
}

export interface UpdatePostResponse extends APIResponse {
  data: PostData;
}

export interface DeletePostRequest {
  id: string;
  options?: {
    soft?: boolean;
    reason?: string;
  };
}

export interface DeletePostResponse extends APIResponse {
  data: {
    id: string;
    deleted: boolean;
    deletedAt?: Date;
  };
}

export interface BulkOperationRequest {
  ids: string[];
  operation: 'delete' | 'publish' | 'unpublish' | 'archive' | 'restore';
  options?: {
    soft?: boolean;
    reason?: string;
  };
}

export interface BulkOperationResponse extends APIResponse {
  data: {
    successful: string[];
    failed: Array<{
      id: string;
      error: string;
    }>;
    total: number;
  };
}

export interface SearchPostsRequest {
  query: string;
  filters?: PostFilters;
  options?: {
    fuzzy?: boolean;
    highlight?: boolean;
    facets?: string[];
  };
}

export interface SearchPostsResponse extends APIResponse {
  data: {
    posts: PostData[];
    total: number;
    facets?: Record<string, any>;
    suggestions?: string[];
  };
}

// Upload API types
export interface UploadRequest {
  file: File;
  options?: {
    folder?: string;
    resize?: boolean;
    quality?: number;
    generateThumbnail?: boolean;
  };
}

export interface UploadResponse {
  message: string;
  url: string;
  success?: boolean; // Optionnel pour compatibilité
  data?: {
    url: string;
    filename?: string;
    size?: number;
    type?: string;
    thumbnail?: string;
  };
  // Nouveau format structuré renvoyé par le backend
  urls?: {
    original: string;
    optimized?: string;
    thumbnail?: string;
  };
}

export interface UploadProgressCallback {
  (progress: {
    loaded: number;
    total: number;
    percentage: number;
  }): void;
}

// Category API types
export interface CategoryRequest {
  name: string;
  slug?: string;
  description?: string;
  color?: string;
  parent?: string;
}

export interface CategoryResponse extends APIResponse {
  data: {
    id: string;
    name: string;
    slug: string;
    description?: string;
    color?: string;
    postCount: number;
    createdAt: Date;
    updatedAt: Date;
  };
}

// Tag API types
export interface TagSuggestionsRequest {
  query: string;
  limit?: number;
}

export interface TagSuggestionsResponse extends APIResponse {
  data: Array<{
    name: string;
    count: number;
  }>;
}

// Analytics API types
export interface PostAnalyticsRequest {
  id: string;
  period?: 'day' | 'week' | 'month' | 'year';
  metrics?: string[];
}

export interface PostAnalyticsResponse extends APIResponse {
  data: {
    views: number;
    likes: number;
    shares: number;
    comments: number;
    readingTime: number;
    bounceRate: number;
    timeline: Array<{
      date: Date;
      views: number;
      likes: number;
    }>;
  };
}

// Auto-save API types
export interface AutoSaveRequest {
  id: string;
  content: string;
  metadata?: {
    title?: string;
    summary?: string;
    lastEditedAt: Date;
  };
}

export interface AutoSaveResponse extends APIResponse {
  data: {
    saved: boolean;
    version: number;
    lastSaved: Date;
  };
}

// Version control API types
export interface GetVersionsRequest {
  postId: string;
  page?: number;
  limit?: number;
}

export interface GetVersionsResponse extends APIResponse {
  data: {
    versions: Array<{
      id: string;
      version: number;
      title: string;
      summary: string;
      editedBy: string;
      editedAt: Date;
      changeDescription?: string;
      size: number;
    }>;
    total: number;
  };
}

export interface RevertVersionRequest {
  postId: string;
  version: number;
  reason?: string;
}

export interface RevertVersionResponse extends APIResponse {
  data: PostData;
}

// SEO API types
export interface SEOAnalysisRequest {
  content: string;
  title: string;
  description?: string;
  keywords?: string[];
}

export interface SEOAnalysisResponse extends APIResponse {
  data: {
    score: number;
    suggestions: Array<{
      type: 'error' | 'warning' | 'info';
      message: string;
      field?: string;
    }>;
    readability: {
      score: number;
      level: string;
      suggestions: string[];
    };
    keywords: {
      density: Record<string, number>;
      suggestions: string[];
    };
  };
}

// Client configuration
export interface PostAPIClient {
  config: APIConfig;
  endpoints: PostEndpoints;
  
  // Core CRUD operations
  getPosts(request: GetPostsRequest): Promise<GetPostsResponse>;
  getPost(request: GetPostRequest): Promise<GetPostResponse>;
  createPost(request: CreatePostRequest): Promise<CreatePostResponse>;
  updatePost(request: UpdatePostRequest): Promise<UpdatePostResponse>;
  deletePost(request: DeletePostRequest): Promise<DeletePostResponse>;
  
  // Bulk operations
  bulkOperation(request: BulkOperationRequest): Promise<BulkOperationResponse>;
  
  // Search
  searchPosts(request: SearchPostsRequest): Promise<SearchPostsResponse>;
  
  // Upload
  uploadFile(request: UploadRequest, onProgress?: UploadProgressCallback): Promise<UploadResponse>;
  
  // Auto-save
  autoSave(request: AutoSaveRequest): Promise<AutoSaveResponse>;
  
  // Versions
  getVersions(request: GetVersionsRequest): Promise<GetVersionsResponse>;
  revertVersion(request: RevertVersionRequest): Promise<RevertVersionResponse>;
  
  // SEO
  analyzeSEO(request: SEOAnalysisRequest): Promise<SEOAnalysisResponse>;
}
