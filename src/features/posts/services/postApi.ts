/**
 * Post API Service
 * Handles all API communications for post management
 */

import { API_ENDPOINTS } from '../../../config/api.config';
import {
  PostData,
  CreatePostInput,
  UpdatePostInput,
  PostFilters,
  PostOperationResult
} from '../types/post.types';
import {
  APIResponse,
  GetPostsRequest,
  GetPostsResponse,
  CreatePostRequest,
  CreatePostResponse,
  UpdatePostRequest,
  UpdatePostResponse,
  DeletePostRequest,
  DeletePostResponse,
  UploadRequest,
  UploadResponse,
  AutoSaveRequest,
  AutoSaveResponse
} from '../types/api.types';

export class PostApiService {
  private static instance: PostApiService;
  private baseURL: string;

  constructor() {
    this.baseURL = API_ENDPOINTS.posts.list.replace('/posts', '');
  }

  public static getInstance(): PostApiService {
    if (!PostApiService.instance) {
      PostApiService.instance = new PostApiService();
    }
    return PostApiService.instance;
  }

  /**
   * Get posts with pagination and filters
   */
  async getPosts(request: GetPostsRequest = {}): Promise<GetPostsResponse> {
    try {
      const params = new URLSearchParams();

      if (request.page) params.append('page', request.page.toString());
      if (request.limit) params.append('limit', request.limit.toString());

      if (request.filters) {
        Object.entries(request.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, value.toString());
          }
        });
      }

      if (request.sort) {
        params.append('sort', `${request.sort.field}:${request.sort.order}`);
      }

      const url = `${API_ENDPOINTS.posts.list}?${params.toString()}`;
      const response = await this.fetchWithAuth(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch posts: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching posts:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get a single post by ID
   */
  async getPost(id: string): Promise<PostData> {
    try {
      const response = await this.fetchWithAuth(API_ENDPOINTS.posts.detail(id));

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Post not found');
        }
        throw new Error(`Failed to fetch post: ${response.status}`);
      }

      const result = await response.json();
      return result.post || result.data || result;
    } catch (error) {
      console.error('Error fetching post:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Create a new post
   */
  async createPost(data: CreatePostInput): Promise<PostOperationResult> {
    try {
      const response = await this.fetchWithAuth(API_ENDPOINTS.posts.create, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.message || 'Failed to create post',
          validationErrors: result.errors
        };
      }

      return {
        success: true,
        data: result.post || result.data
      };
    } catch (error) {
      console.error('Error creating post:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create post'
      };
    }
  }

  /**
   * Update an existing post
   */
  async updatePost(id: string, data: UpdatePostInput): Promise<PostOperationResult> {
    try {
      const response = await this.fetchWithAuth(API_ENDPOINTS.posts.update(id), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.message || 'Failed to update post',
          validationErrors: result.errors
        };
      }

      return {
        success: true,
        data: result.post || result.data
      };
    } catch (error) {
      console.error('Error updating post:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update post'
      };
    }
  }

  /**
   * Delete a post
   */
  async deletePost(id: string, soft: boolean = true): Promise<PostOperationResult> {
    try {
      const response = await this.fetchWithAuth(API_ENDPOINTS.posts.delete(id), {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ soft }),
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.message || 'Failed to delete post'
        };
      }

      return {
        success: true,
        data: result.data
      };
    } catch (error) {
      console.error('Error deleting post:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete post'
      };
    }
  }

  /**
   * Upload a file
   */
  async uploadFile(
    file: File,
    onProgress?: (progress: { loaded: number; total: number; percentage: number }) => void
  ): Promise<UploadResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const xhr = new XMLHttpRequest();

      return new Promise((resolve, reject) => {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable && onProgress) {
            const percentage = Math.round((event.loaded / event.total) * 100);
            onProgress({
              loaded: event.loaded,
              total: event.total,
              percentage
            });
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const result = JSON.parse(xhr.responseText);
              resolve(result);
            } catch (error) {
              console.error('Réponse invalide:', xhr.responseText);
              reject(new Error(`Format de réponse invalide: ${xhr.responseText}`));
            }
          } else {
            reject(new Error(`Upload failed: ${xhr.status} - ${xhr.responseText}`));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Upload failed'));
        });

        xhr.open('POST', API_ENDPOINTS.uploads.file);
        xhr.withCredentials = true; // Ajouté pour envoyer les cookies

        // Add auth headers
        const token = this.getAuthToken();
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }

        xhr.send(formData);
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Auto-save post content
   */
  async autoSave(request: AutoSaveRequest): Promise<AutoSaveResponse> {
    try {
      const response = await this.fetchWithAuth(`${API_ENDPOINTS.posts.update(request.id)}/autosave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: request.content,
          metadata: {
            title: request.metadata?.title,
            summary: request.metadata?.summary,
            lastEditedAt: new Date(),
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Auto-save failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error auto-saving:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Search posts
   */
  async searchPosts(query: string, filters?: PostFilters): Promise<GetPostsResponse> {
    try {
      const params = new URLSearchParams();
      params.append('q', query);

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, value.toString());
          }
        });
      }

      const url = `${API_ENDPOINTS.posts.list}/search?${params.toString()}`;
      const response = await this.fetchWithAuth(url);

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error searching posts:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get categories
   */
  async getCategories(): Promise<any[]> {
    try {
      const response = await this.fetchWithAuth(`${this.baseURL}/categories`);

      if (!response.ok) {
        throw new Error(`Failed to fetch categories: ${response.status}`);
      }

      const result = await response.json();
      return result.categories || result.data || [];
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  }

  /**
   * Get tag suggestions
   */
  async getTagSuggestions(query: string): Promise<string[]> {
    try {
      const response = await this.fetchWithAuth(`${this.baseURL}/tags/suggestions?q=${encodeURIComponent(query)}`);

      if (!response.ok) {
        return [];
      }

      const result = await response.json();
      return result.suggestions || result.data || [];
    } catch (error) {
      console.error('Error fetching tag suggestions:', error);
      return [];
    }
  }

  private async fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
    const token = this.getAuthToken();

    const headers = {
      ...options.headers,
      ...(token && { Authorization: `Bearer ${token}` }),
    };

    return fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });
  }

  private getAuthToken(): string | null {
    // This should integrate with your auth system
    // For now, we'll rely on cookies
    return null;
  }

  private handleError(error: any): Error {
    if (error instanceof Error) {
      return error;
    }
    return new Error('An unexpected error occurred');
  }
}
