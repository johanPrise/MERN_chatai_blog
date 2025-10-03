# Error Handling and Display

<cite>
**Referenced Files in This Document**   
- [error-notification.middleware.ts](file://api-fastify/src/middlewares/error-notification.middleware.ts)
- [NotificationErrorDisplay.tsx](file://src/components/admin/NotificationErrorDisplay.tsx)
- [NotificationService.ts](file://src/services/NotificationService.ts)
- [NotificationErrorHandler.ts](file://src/services/NotificationErrorHandler.ts)
- [NotificationApiClient.ts](file://src/services/NotificationApiClient.ts)
- [ConnectionMonitor.ts](file://src/services/ConnectionMonitor.ts)
- [EnhancedNotificationService.ts](file://src/services/EnhancedNotificationService.ts)
- [AdminNotification.ts](file://src/types/AdminNotification.ts)
- [NotificationApi.ts](file://src/types/NotificationApi.ts)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Error Handling Architecture](#error-handling-architecture)
3. [Notification Error Type Structure](#notification-error-type-structure)
4. [Backend Error Interception](#backend-error-interception)
5. [Frontend Error Handling](#frontend-error-handling)
6. [Error Propagation Flow](#error-propagation-flow)
7. [Retry Mechanisms](#retry-mechanisms)
8. [Connection Status Visualization](#connection-status-visualization)
9. [Common Error Scenarios](#common-error-scenarios)
10. [User Feedback and Accessibility](#user-feedback-and-accessibility)
11. [Best Practices](#best-practices)

## Introduction
The MERN_chatai_blog application implements a comprehensive error handling system for notifications that spans both frontend and backend components. This system ensures that errors are properly captured, normalized, and presented to users in a meaningful way while providing appropriate recovery mechanisms. The architecture follows a layered approach with specialized components for error handling at different levels of the application stack.

**Section sources**
- [error-notification.middleware.ts](file://api-fastify/src/middlewares/error-notification.middleware.ts#L1-L31)
- [NotificationErrorDisplay.tsx](file://src/components/admin/NotificationErrorDisplay.tsx#L1-L107)

## Error Handling Architecture
The error handling system in MERN_chatai_blog follows a multi-layered architecture that captures errors at various points in the application flow. The system is designed to provide consistent error handling across both frontend and backend components while maintaining separation of concerns.

```mermaid
graph TD
A[API Request] --> B{Backend}
B --> C[error-notification.middleware.ts]
C --> D[notification-hooks.service.ts]
D --> E[System Error Notification]
F[Frontend] --> G[NotificationApiClient.ts]
G --> H[NotificationService.ts]
H --> I[NotificationErrorHandler.ts]
I --> J[NotificationErrorDisplay.tsx]
K[Connection Monitor] --> L[ConnectionStatus]
L --> J
E --> M[Database]
J --> N[User Interface]
style B fill:#f9f,stroke:#333
style F fill:#f9f,stroke:#333
```

**Diagram sources**
- [error-notification.middleware.ts](file://api-fastify/src/middlewares/error-notification.middleware.ts#L1-L31)
- [NotificationService.ts](file://src/services/NotificationService.ts#L1-L199)
- [NotificationApiClient.ts](file://src/services/NotificationApiClient.ts#L1-L199)

**Section sources**
- [error-notification.middleware.ts](file://api-fastify/src/middlewares/error-notification.middleware.ts#L1-L31)
- [NotificationService.ts](file://src/services/NotificationService.ts#L1-L199)

## Notification Error Type Structure
The NotificationError type provides a standardized structure for error objects across the application. This interface ensures consistency in error representation and enables predictable error handling patterns.

```mermaid
classDiagram
class NotificationError {
+code : string
+message : string
+userMessage : string
+retryable : boolean
+retryAfter? : number
+details? : any
}
class ErrorHandlerConfig {
+showUserMessages : boolean
+logErrors : boolean
+retryConfig : RetryConfig
}
class RetryConfig {
+maxAttempts : number
+baseDelay : number
+maxDelay : number
+backoffFactor : number
}
NotificationError --> ErrorHandlerConfig : "handled by"
NotificationError --> RetryConfig : "uses"
```

**Diagram sources**
- [NotificationErrorHandler.ts](file://src/services/NotificationErrorHandler.ts#L0-L56)
- [NotificationApi.ts](file://src/types/NotificationApi.ts#L100-L192)

**Section sources**
- [NotificationErrorHandler.ts](file://src/services/NotificationErrorHandler.ts#L0-L56)

## Backend Error Interception
The backend error interception system is implemented through the error-notification.middleware.ts file, which captures errors at the Fastify framework level. This middleware specifically handles server errors (5xx status codes) by creating system error notifications.

When an error occurs in the backend, the errorNotificationMiddleware captures the error, extracts relevant information such as the HTTP status code, request method, and URL, and creates a system error notification through the onSystemError hook. This process happens asynchronously to ensure that the error response is not delayed.

```mermaid
sequenceDiagram
participant Client
participant FastifyRequest
participant errorNotificationMiddleware
participant notificationHooks
participant Database
Client->>FastifyRequest : API Request
FastifyRequest->>errorNotificationMiddleware : Error occurs
alt Status >= 500
errorNotificationMiddleware->>notificationHooks : onSystemError()
notificationHooks->>Database : Create error notification
Database-->>notificationHooks : Confirmation
notificationHooks-->>errorNotificationMiddleware : Success
end
errorNotificationMiddleware->>Client : Error response
```

**Diagram sources**
- [error-notification.middleware.ts](file://api-fastify/src/middlewares/error-notification.middleware.ts#L1-L31)
- [notification-hooks.service.ts](file://api-fastify/src/services/notification-hooks.service.ts#L114-L138)

**Section sources**
- [error-notification.middleware.ts](file://api-fastify/src/middlewares/error-notification.middleware.ts#L1-L31)

## Frontend Error Handling
The frontend error handling system is centered around the NotificationService and NotificationErrorHandler classes. These components work together to capture, normalize, and handle errors that occur during API interactions.

The NotificationService implements various methods for notification operations (fetching, creating, updating, deleting) with comprehensive error handling in each method. When an error occurs, it is passed to the handleError method, which logs the error and preserves it for potential display to the user.

```mermaid
sequenceDiagram
participant NotificationService
participant NotificationApiClient
participant NotificationErrorHandler
participant UI
NotificationService->>NotificationApiClient : API Request
alt Request fails
NotificationApiClient->>NotificationService : Error response
NotificationService->>NotificationErrorHandler : handleError()
NotificationErrorHandler->>NotificationErrorHandler : normalizeError()
NotificationErrorHandler->>NotificationService : Normalized error
NotificationService->>UI : Error state
end
```

**Diagram sources**
- [NotificationService.ts](file://src/services/NotificationService.ts#L1-L199)
- [NotificationErrorHandler.ts](file://src/services/NotificationErrorHandler.ts#L0-L56)

**Section sources**
- [NotificationService.ts](file://src/services/NotificationService.ts#L1-L199)

## Error Propagation Flow
The error propagation flow in the notification system follows a well-defined path from API failure to user interface presentation. This flow ensures that errors are properly transformed and presented at each level of the application.

When an API call fails, the error is first captured by the NotificationApiClient, which determines whether to retry the request based on the error type and retry configuration. If retries are exhausted or not applicable, the error is propagated to the NotificationService, which normalizes it using the NotificationErrorHandler. Finally, the error is passed to the NotificationErrorDisplay component for user presentation.

```mermaid
flowchart TD
A[API Failure] --> B{NotificationApiClient}
B --> C[Retry Logic]
C --> |Retryable| D[Retry Request]
C --> |Non-retryable| E[Propagate Error]
D --> |Success| F[Process Response]
D --> |Failure| E
E --> G[NotificationService]
G --> H[NotificationErrorHandler]
H --> I[Normalize Error]
I --> J[NotificationErrorDisplay]
J --> K[User Interface]
style A fill:#ffcccc,stroke:#333
style K fill:#ccffcc,stroke:#333
```

**Diagram sources**
- [NotificationApiClient.ts](file://src/services/NotificationApiClient.ts#L200-L298)
- [NotificationService.ts](file://src/services/NotificationService.ts#L1-L199)
- [NotificationErrorDisplay.tsx](file://src/components/admin/NotificationErrorDisplay.tsx#L1-L107)

**Section sources**
- [NotificationApiClient.ts](file://src/services/NotificationApiClient.ts#L200-L298)

## Retry Mechanisms
The system implements sophisticated retry mechanisms at multiple levels to improve reliability and user experience. The NotificationErrorHandler class provides a generic executeWithRetry method that can wrap any operation with automatic retry capabilities.

Retry behavior is configurable through the RetryConfig interface, which defines parameters such as maximum attempts, base delay, maximum delay, and backoff factor. The system uses exponential backoff to prevent overwhelming the server during periods of high load or temporary failures.

```mermaid
sequenceDiagram
participant Operation
participant executeWithRetry
participant Delay
Operation->>executeWithRetry : Start operation
executeWithRetry->>Operation : Execute
alt Success
Operation-->>executeWithRetry : Result
executeWithRetry-->>Operation : Return result
else Failure
executeWithRetry->>executeWithRetry : normalizeError()
executeWithRetry->>executeWithRetry : canRetry()?
alt Retry allowed
executeWithRetry->>executeWithRetry : getRetryDelay()
executeWithRetry->>Delay : Wait
Delay-->>executeWithRetry : Resume
executeWithRetry->>Operation : Retry
else Retry not allowed
executeWithRetry-->>Operation : Throw error
end
end
```

**Diagram sources**
- [NotificationErrorHandler.ts](file://src/services/NotificationErrorHandler.ts#L213-L264)
- [NotificationApiClient.ts](file://src/services/NotificationApiClient.ts#L200-L298)

**Section sources**
- [NotificationErrorHandler.ts](file://src/services/NotificationErrorHandler.ts#L213-L264)

## Connection Status Visualization
The connection status visualization system provides users with real-time feedback about their network connectivity. This is implemented through the ConnectionMonitor service, which tracks the application's connection status and provides this information to UI components.

The ConnectionMonitor uses multiple strategies to determine connection status, including browser online/offline events and periodic HTTP requests to a health endpoint. This dual approach ensures accurate status detection even in cases where the browser's network detection is unreliable.

```mermaid
stateDiagram-v2
[*] --> Checking
Checking --> Online : Successful health check
Checking --> Offline : Failed health check
Online --> Checking : Periodic check
Offline --> Checking : Browser online event
Checking --> Offline : Failed health check
Offline --> Online : Successful health check
note right of Checking
Performs HEAD request
to /api/health endpoint
with timeout
end note
note right of Online
Green WiFi icon
"Connecté" status
end note
note right of Offline
Red WiFi icon
"Hors ligne" status
end note
```

**Diagram sources**
- [ConnectionMonitor.ts](file://src/services/ConnectionMonitor.ts#L1-L138)
- [NotificationErrorDisplay.tsx](file://src/components/admin/NotificationErrorDisplay.tsx#L1-L107)

**Section sources**
- [ConnectionMonitor.ts](file://src/services/ConnectionMonitor.ts#L1-L138)

## Common Error Scenarios
The system handles several common error scenarios with specific error codes and user messages. These scenarios include network failures, authentication errors, rate limiting, and server errors.

```mermaid
erDiagram
ERROR_TYPES {
string code PK
string message
string userMessage
boolean retryable
number retryAfter
}
ERROR_TYPES ||--o{ NETWORK_ERROR : "is"
ERROR_TYPES ||--o{ AUTHENTICATION_ERROR : "is"
ERROR_TYPES ||--o{ RATE_LIMIT_ERROR : "is"
ERROR_TYPES ||--o{ SERVER_ERROR : "is"
NETWORK_ERROR {
string NETWORK_ERROR
string "Erreur réseau"
string "Problème de connexion. Vérifiez votre réseau."
boolean true
number null
}
AUTHENTICATION_ERROR {
string AUTHENTICATION_ERROR
string "Non authentifié"
string "Vous devez vous reconnecter."
boolean false
number null
}
RATE_LIMIT_ERROR {
string RATE_LIMIT_ERROR
string "Trop de requêtes"
string "Trop de requêtes. Attendez un moment."
boolean true
number 60000
}
SERVER_ERROR {
string SERVER_ERROR
string "Erreur serveur"
string "Problème temporaire du serveur. Réessayez."
boolean true
number null
}
```

**Diagram sources**
- [NotificationErrorHandler.ts](file://src/services/NotificationErrorHandler.ts#L104-L156)
- [NotificationApi.ts](file://src/types/NotificationApi.ts#L100-L192)

**Section sources**
- [NotificationErrorHandler.ts](file://src/services/NotificationErrorHandler.ts#L104-L156)

## User Feedback and Accessibility
The user feedback system is designed with accessibility as a primary consideration. The NotificationErrorDisplay component provides clear visual indicators of errors and connection status, with appropriate icons and color coding.

Keyboard navigation is fully supported, with the NotificationPanel component handling keyboard shortcuts such as Escape to close the panel and Ctrl+A to mark all notifications as read. The component also manages focus states and prevents multiple rapid clicks on notification items.

```mermaid
flowchart TD
A[User Interaction] --> B{Keyboard Event}
B --> |Escape| C[Close Panel]
B --> |Ctrl+A| D{Unread Count > 0}
D --> |Yes| E[Mark All as Read]
D --> |No| F[No Action]
B --> |Arrow Keys| G[Navigation]
H[Click Event] --> I{Notification Read?}
I --> |No| J[Mark as Read]
I --> |Yes| K[No Action]
J --> L[Navigate to Action URL]
M[Accessibility] --> N[ARIA Labels]
M --> O[Focus Management]
M --> P[Keyboard Navigation]
M --> Q[Screen Reader Support]
style A fill:#f9f,stroke:#333
style M fill:#f9f,stroke:#333
```

**Diagram sources**
- [NotificationPanel.tsx](file://src/components/admin/NotificationPanel.tsx#L1-L199)
- [NotificationErrorDisplay.tsx](file://src/components/admin/NotificationErrorDisplay.tsx#L1-L107)

**Section sources**
- [NotificationPanel.tsx](file://src/components/admin/NotificationPanel.tsx#L1-L199)

## Best Practices
The error handling system in MERN_chatai_blog follows several best practices for error recovery, user feedback, and monitoring:

1. **Consistent Error Normalization**: All errors are normalized into a standard format with user-friendly messages.
2. **Appropriate Retry Strategies**: Retry logic is applied selectively based on error type, with exponential backoff.
3. **Offline Support**: The EnhancedNotificationService provides offline capabilities with local caching and action queuing.
4. **Comprehensive Logging**: Errors are logged both locally and remotely for monitoring and debugging.
5. **Accessibility First**: All error displays are designed with keyboard navigation and screen reader support.
6. **Clear User Guidance**: Error messages provide actionable guidance for users to resolve issues.

These practices ensure that the application remains usable even in adverse conditions while providing developers with the information needed to diagnose and fix issues.

**Section sources**
- [EnhancedNotificationService.ts](file://src/services/EnhancedNotificationService.ts#L1-L160)
- [NotificationErrorHandler.ts](file://src/services/NotificationErrorHandler.ts#L0-L56)
- [ConnectionMonitor.ts](file://src/services/ConnectionMonitor.ts#L1-L138)