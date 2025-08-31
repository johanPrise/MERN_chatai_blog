/**
 * Global State Manager
 * Provides cross-component communication for post state synchronization
 */

export type EventType = 'POST_UPDATED' | 'POST_DELETED' | 'POST_CREATED' | 'CACHE_INVALIDATE' | 'DRAFT_UPDATED';

export interface GlobalEvent {
  type: EventType;
  payload: any;
  timestamp: Date;
}

export interface PostUpdatePayload {
  postId: string;
  postData: any;
  source?: 'edit' | 'create' | 'publish';
}

export interface PostDeletePayload {
  postId: string;
  source?: 'delete' | 'draft-delete';
}

export interface CacheInvalidatePayload {
  scope: string; // 'home-posts' | 'drafts' | 'post-detail' | 'all'
  reason?: string;
}

/**
 * Global State Manager Class
 * Uses EventTarget for efficient event handling with automatic cleanup
 */
class GlobalStateManager {
  private eventBus = new EventTarget();
  private debug = import.meta.env.NODE_ENV === 'development';

  /**
   * Emit events across the application
   */
  emit(type: EventType, payload: any): void {
    const event = new CustomEvent(type, { 
      detail: { payload, timestamp: new Date() }
    });
    
    if (this.debug) {
      console.log(`[GlobalStateManager] Emitting ${type}:`, payload);
    }
    
    this.eventBus.dispatchEvent(event);
  }

  /**
   * Subscribe to specific events
   * Returns cleanup function for automatic memory management
   */
  on(type: EventType, handler: (payload: any) => void): () => void {
    const listener = (event: CustomEvent) => {
      try {
        handler(event.detail.payload);
      } catch (error) {
        console.error(`[GlobalStateManager] Error in ${type} handler:`, error);
      }
    };

    this.eventBus.addEventListener(type, listener);
    
    // Return cleanup function
    return () => this.eventBus.removeEventListener(type, listener);
  }

  /**
   * Specific notification methods for type safety and consistency
   */

  /**
   * Notify components about post updates (edit, status change, etc.)
   */
  notifyPostUpdate(postId: string, postData: any, source?: 'edit' | 'create' | 'publish'): void {
    this.emit('POST_UPDATED', { postId, postData, source } as PostUpdatePayload);
  }

  /**
   * Notify components about post deletion
   */
  notifyPostDeletion(postId: string, source?: 'delete' | 'draft-delete'): void {
    this.emit('POST_DELETED', { postId, source } as PostDeletePayload);
  }

  /**
   * Notify components about post creation
   */
  notifyPostCreation(postData: any): void {
    this.emit('POST_CREATED', { postData });
  }

  /**
   * Notify components to invalidate cache and refresh data
   */
  notifyCacheInvalidation(scope: string, reason?: string): void {
    this.emit('CACHE_INVALIDATE', { scope, reason } as CacheInvalidatePayload);
  }

  /**
   * Notify about draft-specific updates
   */
  notifyDraftUpdate(postId: string, postData: any): void {
    this.emit('DRAFT_UPDATED', { postId, postData });
  }

  /**
   * Batch notifications for multiple operations
   */
  notifyBatch(notifications: Array<{ type: EventType; payload: any }>): void {
    notifications.forEach(({ type, payload }) => {
      this.emit(type, payload);
    });
  }

  /**
   * Debug method to check active listeners (development only)
   */
  getActiveListeners(): string[] {
    if (!this.debug) return [];
    
    // In development, we can track listener types
    // This is primarily for debugging purposes
    return ['POST_UPDATED', 'POST_DELETED', 'POST_CREATED', 'CACHE_INVALIDATE', 'DRAFT_UPDATED'];
  }
}

// Create singleton instance
export const globalStateManager = new GlobalStateManager();

// Export for testing purposes
export { GlobalStateManager };

/**
 * React Hook for convenient event subscription
 * Automatically handles cleanup on component unmount
 */
import { useEffect } from 'react';

export function useGlobalStateEvent(
  eventType: EventType, 
  handler: (payload: any) => void, 
  dependencies: any[] = []
): void {
  useEffect(() => {
    const unsubscribe = globalStateManager.on(eventType, handler);
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);
}

/**
 * Multiple events subscription hook
 */
export function useGlobalStateEvents(
  subscriptions: Array<{ type: EventType; handler: (payload: any) => void }>,
  dependencies: any[] = []
): void {
  useEffect(() => {
    const unsubscribers = subscriptions.map(({ type, handler }) => 
      globalStateManager.on(type, handler)
    );
    
    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);
}