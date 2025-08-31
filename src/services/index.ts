/**
 * Export des services de notifications
 */

export { NotificationService, createNotificationService, getNotificationService, setNotificationService } from './NotificationService'
export { NotificationApiClient, ApiError, createNotificationApiClient, defaultApiConfig } from './NotificationApiClient'

// Types re-exportés pour faciliter l'utilisation
export type {
  INotificationService,
  NotificationListener,
  NotificationServiceConfig,
  NotificationServiceState,
  NotificationServiceError,
  UserRegistrationData,
  PostPublishedData,
  SystemErrorData,
  UserActivityData,
  ContentModerationData,
  NotificationGenerators
} from '../types/NotificationService'

export type {
  INotificationApiClient,
  NotificationApiConfig,
  GetNotificationsRequest,
  MarkAsReadRequest,
  MarkAllAsReadRequest
} from '../types/NotificationApi'