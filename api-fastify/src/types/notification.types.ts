export interface AdminNotification {
  id: string;
  type: 'user_registered' | 'post_published' | 'system_error' | 'user_activity' | 'content_moderation';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
  actionUrl?: string;
  metadata?: {
    userId?: string;
    postId?: string;
    username?: string;
    postTitle?: string;
    errorCode?: string;
  };
}

export interface GetNotificationsQuery {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
}

export interface GetNotificationsResponse {
  notifications: AdminNotification[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalNotifications: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  unreadCount: number;
}

export interface MarkAsReadParams {
  id: string;
}

export interface CreateNotificationInput {
  type: AdminNotification['type'];
  title: string;
  message: string;
  priority?: AdminNotification['priority'];
  actionUrl?: string;
  metadata?: AdminNotification['metadata'];
}