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
  PostOperationResult,
  PostStatus
} from '../types/post.types';
import {
  GetPostsRequest,
  GetPostsResponse,
  UploadResponse,
  AutoSaveRequest,
  AutoSaveResponse
} from '../types/api.types';

export class PostApiService {
  private static instance: PostApiService;
  private readonly baseURL: string;

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
   * Build URL parameters from request
   */
  private buildQueryParams(request: GetPostsRequest): URLSearchParams {
    const params = new URLSearchParams();

    this.appendQueryParam(params, 'page', request.page);
    this.appendQueryParam(params, 'limit', request.limit);

    if (request.filters) {
      Object.entries(request.filters).forEach(([key, value]) => {
        this.appendQueryParam(params, key, value);
      });
    }

    if (request.sort) {
      params.append('sort', `${request.sort.field}:${request.sort.order}`);
    }

    return params;
  }

  private appendQueryParam(params: URLSearchParams, key: string, value: unknown): void {
    const queryValue = this.toQueryParamValue(value);
    if (queryValue !== null) {
      params.append(key, queryValue);
    }
  }

  private hasValue(value: unknown): boolean {
    return value !== undefined && value !== null && value !== '';
  }

  private toQueryParamValue(value: unknown): string | null {
    if (!this.hasValue(value)) return null;
    if (value instanceof Date) return value.toISOString();

    switch (typeof value) {
      case 'string':
      case 'number':
      case 'boolean':
        return String(value);
      default:
        return null;
    }
  }

  /**
   * Normalize a single post object
   */
  private normalizePost(post: any): PostData {
    this.normalizeEntityId(post);
    this.normalizeEntityId(post?.author);
    this.normalizeCategories(post);
    this.normalizeSummary(post);
    return post;
  }

  private normalizeEntityId(entity: any): void {
    if (entity?._id && !entity.id) {
      entity.id = entity._id.toString();
    }
  }

  private normalizeCategories(post: any): void {
    if (!Array.isArray(post?.categories)) return;

    post.categories = post.categories.map((category: any) => {
      this.normalizeEntityId(category);
      return category;
    });
  }

  private normalizeSummary(post: any): void {
    if (post?.excerpt && !post.summary) {
      post.summary = post.excerpt;
    }
  }

  /**
   * Extract and normalize posts from API response
   */
  private extractPosts(raw: any): PostData[] {
    const postsArray: any[] = this.getResponseValue(raw, 'posts', []);
    return Array.isArray(postsArray) ? postsArray.map(post => this.normalizePost(post)) : [];
  }

  /**
   * Build pagination info from API response
   */
  private buildPaginationInfo(raw: any, request: GetPostsRequest, postsCount: number) {
    const page = this.getResponseValue(raw, 'page', request.page ?? 1);
    const limit = this.getResponseValue(raw, 'limit', request.limit ?? 10);
    const total = this.getResponseValue(raw, 'total', postsCount);
    const totalPages = this.getResponseValue(raw, 'totalPages', Math.max(1, Math.ceil(total / limit)));

    return {
      total,
      page,
      limit,
      pages: totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }

  private getResponseValue<T>(raw: any, key: string, fallback: T): T {
    return raw?.data?.[key] ?? raw?.[key] ?? fallback;
  }

  private getPostDetailUrl(id: string): string {
    const [postId, queryString] = id.split('?');
    const detailUrl = API_ENDPOINTS.posts.detail(postId);
    return queryString ? `${detailUrl}?${queryString}` : detailUrl;
  }

  private getPostFromResponse(result: any): any {
    return result?.post ?? result?.data ?? result;
  }

  private buildOperationFailure(result: any, fallback: string, response?: Response): PostOperationResult {
    const statusSuffix = response ? ` (${response.status})` : '';

    return {
      success: false,
      error: result?.message || `${fallback}${statusSuffix}`,
      validationErrors: result?.errors,
    };
  }

  private buildOperationSuccess(postData: any): PostOperationResult {
    return {
      success: true,
      data: this.normalizePost(postData),
    };
  }

  /**
   * Get posts with pagination and filters
   */
  async getPosts(request: GetPostsRequest = {}): Promise<GetPostsResponse> {
    try {
      const params = this.buildQueryParams(request);
      const url = `${API_ENDPOINTS.posts.list}?${params.toString()}`;
      const response = await this.fetchWithAuth(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch posts: ${response.status}`);
      }

      const raw = await response.json();
      const normalizedPosts = this.extractPosts(raw);
      const pagination = this.buildPaginationInfo(raw, request, normalizedPosts.length);

      return {
        success: true,
        data: {
          posts: normalizedPosts,
          pagination,
          filters: request.filters || {},
        },
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get a single post by ID
   */
  async getPost(id: string): Promise<PostData> {
    try {
      const response = await this.fetchWithAuth(this.getPostDetailUrl(id), {
        cache: 'no-cache'
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Post not found');
        }
        throw new Error(`Failed to fetch post: ${response.status}`);
      }

      const result = await response.json();
      return this.normalizePost(this.getPostFromResponse(result));
    } catch (error) {
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
        return this.buildOperationFailure(result, 'Failed to create post');
      }

      return this.buildOperationSuccess(this.getPostFromResponse(result));
    } catch (error) {
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
      const response = await this.sendPostUpdate(id, data);
      const result = await response.json();

      if (!response.ok) {
        return this.buildOperationFailure(result, 'Failed to update post', response);
      }

      const postData = this.getPostFromResponse(result);
      if (!postData) {
        return {
          success: false,
          error: 'No post data returned from server'
        };
      }

      return this.buildOperationSuccess(postData);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update post'
      };
    }
  }

  private async sendPostUpdate(id: string, data: UpdatePostInput): Promise<Response> {
    return this.fetchWithAuth(API_ENDPOINTS.posts.update(id), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(this.cleanUpdatePostData(data)),
    });
  }

  private cleanUpdatePostData(data: UpdatePostInput): Partial<UpdatePostInput> {
    const { id: _id, ...payload } = data;

    return Object.fromEntries(
      Object.entries(payload).filter(([, value]) => this.hasValue(value))
    ) as Partial<UpdatePostInput>;
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
        return this.buildOperationFailure(result, 'Failed to delete post');
      }

      return {
        success: true,
        data: result.data
      };
    } catch (error) {
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
      return await new Promise((resolve, reject) => {
        const xhr = this.createUploadRequest(onProgress, resolve, reject);
        xhr.send(this.createUploadFormData(file));
      });
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private createUploadFormData(file: File): FormData {
    const formData = new FormData();
    formData.append('file', file);
    return formData;
  }

  private createUploadRequest(
    onProgress: ((progress: { loaded: number; total: number; percentage: number }) => void) | undefined,
    resolve: (value: UploadResponse) => void,
    reject: (reason?: Error) => void
  ): XMLHttpRequest {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', event => this.handleUploadProgress(event, onProgress));
    xhr.addEventListener('load', () => this.handleUploadLoad(xhr, resolve, reject));
    xhr.addEventListener('error', () => reject(new Error('Upload failed')));

    xhr.open('POST', API_ENDPOINTS.uploads.file);
    xhr.withCredentials = true;
    this.applyAuthHeader(xhr);

    return xhr;
  }

  private handleUploadProgress(
    event: ProgressEvent<XMLHttpRequestEventTarget>,
    onProgress?: (progress: { loaded: number; total: number; percentage: number }) => void
  ): void {
    if (!event.lengthComputable || !onProgress) return;

    onProgress({
      loaded: event.loaded,
      total: event.total,
      percentage: Math.round((event.loaded / event.total) * 100),
    });
  }

  private handleUploadLoad(
    xhr: XMLHttpRequest,
    resolve: (value: UploadResponse) => void,
    reject: (reason?: Error) => void
  ): void {
    if (!this.isSuccessfulStatus(xhr.status)) {
      reject(new Error(`Upload failed: ${xhr.status} - ${xhr.responseText}`));
      return;
    }

    try {
      resolve(JSON.parse(xhr.responseText));
    } catch (parseError) {
      const message = parseError instanceof Error ? parseError.message : String(parseError);
      reject(new Error(`Format de réponse invalide (${message}): ${xhr.responseText}`));
    }
  }

  private isSuccessfulStatus(status: number): boolean {
    return status >= 200 && status < 300;
  }

  private applyAuthHeader(xhr: XMLHttpRequest): void {
    const token = this.getAuthToken();
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }
  }

  /**
   * Auto-save post content
   */
  async autoSave(request: AutoSaveRequest): Promise<AutoSaveResponse> {
    try {
      const result = await this.updatePost(request.id, this.buildAutoSavePayload(request));
      this.assertAutoSaveSuccess(result);
      return this.buildAutoSaveResponse(result);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private buildAutoSavePayload(request: AutoSaveRequest): UpdatePostInput {
    return {
      id: request.id,
      content: request.content,
      title: request.metadata?.title,
      summary: request.metadata?.summary,
    };
  }

  private assertAutoSaveSuccess(result: PostOperationResult): void {
    if (!result.success) {
      throw new Error(result.error || 'Auto-save failed');
    }
  }

  private buildAutoSaveResponse(result: PostOperationResult): AutoSaveResponse {
    return {
      success: true,
      data: {
        saved: true,
        version: result.data?.metadata?.version ?? 0,
        lastSaved: new Date(),
      },
    };
  }

  /**
   * Search posts
   */
  async searchPosts(query: string, filters?: PostFilters): Promise<GetPostsResponse> {
    try {
      return await this.getPosts({
        filters: {
          ...filters,
          search: query,
        },
      });
    } catch (error) {
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
      return [];
    }
  }

  /**
   * Get tag suggestions
   */
  async getTagSuggestions(query: string): Promise<string[]> {
    try {
      const normalizedQuery = query.trim().toLowerCase();
      if (!normalizedQuery) {
        return [];
      }

      const result = await this.getPosts({
        limit: 20,
        filters: { search: normalizedQuery },
      });

      const tags = result.data.posts.flatMap((post) => post.tags || []);
      return [...new Set(tags)]
        .filter((tag) => tag.toLowerCase().includes(normalizedQuery))
        .slice(0, 10);
    } catch (error) {
      return [];
    }
  }

  /**
   * Publish a draft post
   */
  async publishPost(id: string): Promise<PostOperationResult> {
    try {
      return await this.updatePost(id, {
        id,
        status: PostStatus.PUBLISHED,
      });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to publish post'
      };
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
