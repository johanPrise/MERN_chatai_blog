# Middleware & Interceptors

<cite>
**Referenced Files in This Document**   
- [auth.middleware.ts](file://api-fastify/src/middlewares/auth.middleware.ts)
- [rate-limit.middleware.ts](file://api-fastify/src/middlewares/rate-limit.middleware.ts)
- [cache.middleware.ts](file://api-fastify/src/middlewares/cache.middleware.ts)
- [error-logger.middleware.ts](file://api-fastify/src/middlewares/error-logger.middleware.ts)
- [error-notification.middleware.ts](file://api-fastify/src/middlewares/error-notification.middleware.ts)
- [notification-validation.middleware.ts](file://api-fastify/src/middlewares/notification-validation.middleware.ts)
- [cache.service.ts](file://api-fastify/src/services/cache.service.ts)
- [server.ts](file://api-fastify/src/server.ts)
- [notification.routes.ts](file://api-fastify/src/routes/notification.routes.ts)
- [notification.controller.ts](file://api-fastify/src/controllers/notification.controller.ts)
- [notification-audit.service.ts](file://api-fastify/src/services/notification-audit.service.ts)
- [notification-cleanup.service.ts](file://api-fastify/src/services/notification-cleanup.service.ts)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Middleware Pipeline Architecture](#middleware-pipeline-architecture)
3. [Authentication Validation](#authentication-validation)
4. [Rate Limiting](#rate-limiting)
5. [Caching](#caching)
6. [Error Logging](#error-logging)
7. [Error Notification](#error-notification)
8. [Request Validation](#request-validation)
9. [Execution Order & Request Lifecycle](#execution-order--request-lifecycle)
10. [Configuration Options](#configuration-options)
11. [Usage Examples](#usage-examples)
12. [Error Handling Cascade](#error-handling-cascade)
13. [Performance Implications](#performance-implications)
14. [Troubleshooting Guide](#troubleshooting-guide)

## Introduction
The MERN_chatai_blog Fastify backend implements a comprehensive middleware pipeline to handle authentication, rate limiting, caching, error logging, and request validation. This documentation provides a detailed analysis of the middleware architecture, implementation, and integration within the request lifecycle. The system is designed to ensure security, performance, and reliability while providing robust error handling and monitoring capabilities.

## Middleware Pipeline Architecture

```mermaid
graph TB
Client[Client Request] --> CORS[CORS Middleware]
CORS --> Auth[Authentication Middleware]
Auth --> RateLimit[Rate Limiting Middleware]
RateLimit --> Cache[Cache Middleware]
Cache --> Validation[Request Validation Middleware]
Validation --> ErrorLogger[Error Logger Middleware]
ErrorLogger --> BusinessLogic[Business Logic]
BusinessLogic --> ErrorHandler[Global Error Handler]
ErrorHandler --> ClientResponse[Client Response]
subgraph "Error Handling"
ErrorLogger --> ErrorNotification[Error Notification Middleware]
BusinessLogic --> ErrorNotification
ErrorNotification --> ErrorHandler
end
style Client fill:#f9f,stroke:#333
style ClientResponse fill:#f9f,stroke:#333
```

**Diagram sources**
- [server.ts](file://api-fastify/src/server.ts#L10-L173)
- [auth.middleware.ts](file://api-fastify/src/middlewares/auth.middleware.ts#L1-L128)
- [rate-limit.middleware.ts](file://api-fastify/src/middlewares/rate-limit.middleware.ts#L1-L92)

**Section sources**
- [server.ts](file://api-fastify/src/server.ts#L10-L173)
- [middlewares](file://api-fastify/src/middlewares)

## Authentication Validation

The authentication middleware system provides multiple layers of access control based on user roles. The implementation uses JWT tokens with cookie-based authentication and supports role-based authorization for different user types (admin, editor, author).

```mermaid
classDiagram
class authenticate {
+request : FastifyRequest
+reply : FastifyReply
+jwtVerify() : Promise~void~
+send(status : number, payload : any) : void
}
class isAdmin {
+request : FastifyRequest
+reply : FastifyReply
+User.findById(id) : Promise~User~
}
class isEditorOrAdmin {
+request : FastifyRequest
+reply : FastifyReply
+User.findById(id) : Promise~User~
}
class isAuthorEditorOrAdmin {
+request : FastifyRequest
+reply : FastifyReply
+User.findById(id) : Promise~User~
}
class optionalAuthMiddleware {
+request : FastifyRequest
+reply : FastifyReply
+jwtVerify() : Promise~void~
}
authenticate --> FastifyRequest : "uses"
authenticate --> FastifyReply : "uses"
isAdmin --> FastifyRequest : "uses"
isAdmin --> FastifyReply : "uses"
isAdmin --> User : "queries"
isEditorOrAdmin --> FastifyRequest : "uses"
isEditorOrAdmin --> FastifyReply : "uses"
isEditorOrAdmin --> User : "queries"
isAuthorEditorOrAdmin --> FastifyRequest : "uses"
isAuthorEditorOrAdmin --> FastifyReply : "uses"
isAuthorEditorOrAdmin --> User : "queries"
optionalAuthMiddleware --> FastifyRequest : "uses"
optionalAuthMiddleware --> FastifyReply : "uses"
```

**Diagram sources**
- [auth.middleware.ts](file://api-fastify/src/middlewares/auth.middleware.ts#L1-L128)

**Section sources**
- [auth.middleware.ts](file://api-fastify/src/middlewares/auth.middleware.ts#L1-L128)

## Rate Limiting

The rate limiting middleware implements a flexible rate limiting system using Redis for distributed rate tracking. The system supports configurable windows, request limits, and custom key generators to handle different rate limiting scenarios.

```mermaid
sequenceDiagram
participant Client as "Client"
participant RateLimit as "Rate Limit Middleware"
participant Redis as "Redis Cache"
Client->>RateLimit : HTTP Request
RateLimit->>Redis : GET rate_limit : {key} : {window}
Redis-->>RateLimit : Current Count
alt Count < Max Requests
RateLimit->>Redis : INCR rate_limit : {key} : {window}
RateLimit->>RateLimit : Set X-RateLimit headers
RateLimit->>Client : Continue Request
else Count >= Max Requests
RateLimit->>Client : 429 Too Many Requests
RateLimit->>Client : Set Retry-After header
end
```

**Diagram sources**
- [rate-limit.middleware.ts](file://api-fastify/src/middlewares/rate-limit.middleware.ts#L1-L92)
- [cache.service.ts](file://api-fastify/src/services/cache.service.ts#L1-L58)

**Section sources**
- [rate-limit.middleware.ts](file://api-fastify/src/middlewares/rate-limit.middleware.ts#L1-L92)

## Caching

The caching middleware implements a transparent caching layer using Redis to improve performance for GET requests. The system automatically caches successful responses and serves them on subsequent requests, reducing database load and improving response times.

```mermaid
flowchart TD
Start([Request Received]) --> IsGET{"Method is GET?"}
IsGET --> |No| Continue[Continue Processing]
IsGET --> |Yes| GenerateKey["Generate Cache Key<br>cache:{request.url}"]
GenerateKey --> CheckCache["Check Redis Cache"]
CheckCache --> HasCache{"Cache Exists?"}
HasCache --> |Yes| SetHeader["Set X-Cache: HIT"]
SetHeader --> SendResponse["Send Cached Response"]
HasCache --> |No| ProcessRequest["Process Request"]
ProcessRequest --> IsSuccess{"Status 200?"}
IsSuccess --> |Yes| StoreCache["Store in Redis<br>with TTL"]
StoreCache --> SetHeaderMISS["Set X-Cache: MISS"]
SetHeaderMISS --> SendResponse
IsSuccess --> |No| SendResponse
SendResponse --> End([Response Sent])
```

**Diagram sources**
- [cache.middleware.ts](file://api-fastify/src/middlewares/cache.middleware.ts#L1-L25)
- [cache.service.ts](file://api-fastify/src/services/cache.service.ts#L1-L58)

**Section sources**
- [cache.middleware.ts](file://api-fastify/src/middlewares/cache.middleware.ts#L1-L25)

## Error Logging

The error logging middleware intercepts responses with status codes 400 and above to log detailed error information. This provides comprehensive error tracking while maintaining separation between error handling and logging concerns.

```mermaid
sequenceDiagram
participant Request as "Request"
participant Reply as "Reply"
participant Logger as "Logger Service"
Request->>Reply : send(payload)
Reply->>Reply : Check status code
alt status >= 400
Reply->>Logger : log.error(message, error, context)
Logger-->>Reply : Error logged
end
Reply->>Request : Send response
```

**Diagram sources**
- [error-logger.middleware.ts](file://api-fastify/src/middlewares/error-logger.middleware.ts#L1-L22)
- [logger.service.ts](file://api-fastify/src/services/logger.service.ts)

**Section sources**
- [error-logger.middleware.ts](file://api-fastify/src/middlewares/error-logger.middleware.ts#L1-L22)

## Error Notification

The error notification system creates automated notifications for server errors (500+ status codes) and system exceptions. This ensures critical issues are immediately reported through the application's notification system.

```mermaid
sequenceDiagram
participant ErrorHandler as "Global Error Handler"
participant Notification as "Error Notification"
participant Service as "Notification Service"
ErrorHandler->>ErrorHandler : Check status code
alt status >= 500
ErrorHandler->>Notification : onSystemError(code, message)
Notification->>Service : Create notification
Service-->>Notification : Notification created
Notification-->>ErrorHandler : Promise resolved
end
ErrorHandler->>Client : Send 500 response
```

**Diagram sources**
- [error-notification.middleware.ts](file://api-fastify/src/middlewares/error-notification.middleware.ts#L1-L32)
- [server.ts](file://api-fastify/src/server.ts#L150-L173)

**Section sources**
- [error-notification.middleware.ts](file://api-fastify/src/middlewares/error-notification.middleware.ts#L1-L32)

## Request Validation

The request validation middleware provides comprehensive input validation for notification-related endpoints, including parameter validation, query string validation, and input sanitization to prevent injection attacks.

```mermaid
flowchart TD
Start([Request Received]) --> ValidateID["Validate Notification ID"]
ValidateID --> IsValidID{"Valid ObjectId?"}
IsValidID --> |No| Return400["Return 400 Bad Request"]
IsValidID --> |Yes| ValidateQuery["Validate Query Parameters"]
ValidateQuery --> IsValidPage{"Valid Page?"}
IsValidPage --> |No| Return400
IsValidPage --> |Yes| IsValidLimit{"Valid Limit?"}
IsValidLimit --> |No| Return400
IsValidLimit --> |Yes| SanitizeInput["Sanitize Input Parameters"]
SanitizeInput --> RemoveChars["Remove < > \" ' & characters"]
RemoveChars --> Continue[Continue Processing]
Return400 --> End([Response Sent])
Continue --> End
```

**Diagram sources**
- [notification-validation.middleware.ts](file://api-fastify/src/middlewares/notification-validation.middleware.ts#L1-L112)

**Section sources**
- [notification-validation.middleware.ts](file://api-fastify/src/middlewares/notification-validation.middleware.ts#L1-L112)

## Execution Order & Request Lifecycle

The middleware execution follows a specific order that aligns with the Fastify request lifecycle hooks. The system uses both global and route-specific middleware to provide layered security and functionality.

```mermaid
sequenceDiagram
participant Client as "Client"
participant Fastify as "Fastify Server"
participant CORS as "CORS Middleware"
participant Auth as "Auth Middleware"
participant RateLimit as "Rate Limit Middleware"
participant Cache as "Cache Middleware"
participant Validation as "Validation Middleware"
participant Controller as "Controller"
participant ErrorHandler as "Error Handler"
Client->>Fastify : HTTP Request
Fastify->>CORS : onRequest hook
CORS-->>Fastify : Continue
Fastify->>Auth : preValidation hook
Auth-->>Fastify : Continue or 401/403
Fastify->>RateLimit : preHandler hook
RateLimit-->>Fastify : Continue or 429
Fastify->>Cache : preHandler hook
Cache-->>Fastify : Serve cache or continue
Fastify->>Validation : preHandler hook
Validation-->>Fastify : Continue or 400
Fastify->>Controller : Handle request
Controller-->>Fastify : Response
Fastify->>Client : HTTP Response
alt Error occurs
Fastify->>ErrorHandler : setErrorHandler
ErrorHandler-->>Fastify : Error response
Fastify->>Client : Error response
end
```

**Diagram sources**
- [server.ts](file://api-fastify/src/server.ts#L10-L173)
- [notification.routes.ts](file://api-fastify/src/routes/notification.routes.ts#L1-L317)

**Section sources**
- [server.ts](file://api-fastify/src/server.ts#L10-L173)
- [notification.routes.ts](file://api-fastify/src/routes/notification.routes.ts#L1-L317)

## Configuration Options

The middleware system provides configurable options for rate limiting thresholds and cache TTLs through environment variables and middleware parameters. These configurations allow fine-tuning of system behavior based on deployment requirements.

```mermaid
classDiagram
class RateLimitOptions {
+windowMs : number
+maxRequests : number
+keyGenerator : function
+skipSuccessfulRequests : boolean
+skipFailedRequests : boolean
}
class CacheConfig {
+REDIS_URL : string
+defaultTTL : number
}
class RateLimitConfig {
+notificationRateLimit : RateLimitOptions
+notificationModifyRateLimit : RateLimitOptions
}
RateLimitOptions <|-- RateLimitConfig
CacheConfig <|-- cache.service.ts
```

**Diagram sources**
- [rate-limit.middleware.ts](file://api-fastify/src/middlewares/rate-limit.middleware.ts#L1-L92)
- [cache.service.ts](file://api-fastify/src/services/cache.service.ts#L1-L58)

**Section sources**
- [rate-limit.middleware.ts](file://api-fastify/src/middlewares/rate-limit.middleware.ts#L1-L92)
- [cache.service.ts](file://api-fastify/src/services/cache.service.ts#L1-L58)

## Usage Examples

The middleware system is applied to routes through Fastify's plugin architecture and hook system. Different routes can have different middleware combinations based on their security and performance requirements.

```mermaid
flowchart TD
subgraph "Notification Routes"
direction TB
PreHandler["server.addHook('preHandler')"]
PreHandler --> Sanitize[sanitizeInput]
PreHandler --> Auth[isAdmin]
GetRoute["GET /notifications"]
GetRoute --> RateLimit[notificationRateLimit]
GetRoute --> Validation[validateNotificationQuery]
PatchRoute["PATCH /notifications/:id/read"]
PatchRoute --> ModifyRateLimit[notificationModifyRateLimit]
PatchRoute --> ValidateID[validateNotificationId]
PostRoute["POST /notifications/cleanup"]
PostRoute --> ModifyRateLimit
end
style PreHandler fill:#ffcccc,stroke:#333
style GetRoute fill:#ccffcc,stroke:#333
style PatchRoute fill:#ccffcc,stroke:#333
style PostRoute fill:#ccffcc,stroke:#333
```

**Diagram sources**
- [notification.routes.ts](file://api-fastify/src/routes/notification.routes.ts#L1-L317)

**Section sources**
- [notification.routes.ts](file://api-fastify/src/routes/notification.routes.ts#L1-L317)

## Error Handling Cascade

The error handling system implements a cascading approach where errors are handled at multiple levels, from middleware-specific handling to global error handling, ensuring comprehensive error coverage and appropriate responses.

```mermaid
flowchart TD
Start([Request Processing]) --> Middleware["Middleware Layer"]
Middleware --> AuthError{"Authentication Error?"}
AuthError --> |Yes| Reply401["Reply 401 Unauthorized"]
AuthError --> |No| RateLimitError{"Rate Limit Exceeded?"}
RateLimitError --> |Yes| Reply429["Reply 429 Too Many Requests"]
RateLimitError --> |No| ValidationError{"Validation Error?"}
ValidationError --> |Yes| Reply400["Reply 400 Bad Request"]
ValidationError --> |No| BusinessLogic["Business Logic"]
BusinessLogic --> SystemError{"System Error?"}
SystemError --> |Yes| GlobalHandler["Global Error Handler"]
SystemError --> |No| Success["Success Response"]
GlobalHandler --> LogError["Log Error"]
GlobalHandler --> CreateNotification["Create Error Notification"]
GlobalHandler --> Reply500["Reply 500 Internal Error"]
Reply401 --> End([Response])
Reply429 --> End
Reply400 --> End
Success --> End
Reply500 --> End
```

**Diagram sources**
- [server.ts](file://api-fastify/src/server.ts#L150-L173)
- [error-logger.middleware.ts](file://api-fastify/src/middlewares/error-logger.middleware.ts#L1-L22)
- [error-notification.middleware.ts](file://api-fastify/src/middlewares/error-notification.middleware.ts#L1-L32)

**Section sources**
- [server.ts](file://api-fastify/src/server.ts#L150-L173)
- [error-logger.middleware.ts](file://api-fastify/src/middlewares/error-logger.middleware.ts#L1-L22)

## Performance Implications

The middleware chain has significant performance implications that are mitigated through careful design and optimization techniques. The system balances security and functionality with performance requirements.

```mermaid
graph LR
A[Performance Factors] --> B[Caching Benefits]
A --> C[Rate Limiting Overhead]
A --> D[Authentication Cost]
A --> E[Validation Overhead]
A --> F[Error Handling Impact]
B --> B1["Reduces database load"]
B --> B2["Improves response times"]
B --> B3["Reduces server CPU usage"]
C --> C1["Redis round-trip latency"]
C --> C2["Memory usage for tracking"]
C --> C3["Potential bottlenecks"]
D --> D1["JWT verification cost"]
D --> D2["Database lookup for user"]
D --> D3["Cookie parsing overhead"]
E --> E1["Input parsing time"]
E --> E2["Validation logic execution"]
E --> E3["Error response generation"]
F --> F1["Error logging I/O"]
F --> F2["Notification creation overhead"]
F --> F3["Stack trace generation"]
style A fill:#f9f,stroke:#333
```

**Diagram sources**
- [cache.middleware.ts](file://api-fastify/src/middlewares/cache.middleware.ts#L1-L25)
- [rate-limit.middleware.ts](file://api-fastify/src/middlewares/rate-limit.middleware.ts#L1-L92)
- [auth.middleware.ts](file://api-fastify/src/middlewares/auth.middleware.ts#L1-L128)

**Section sources**
- [cache.middleware.ts](file://api-fastify/src/middlewares/cache.middleware.ts#L1-L25)
- [rate-limit.middleware.ts](file://api-fastify/src/middlewares/rate-limit.middleware.ts#L1-L92)

## Troubleshooting Guide

This section provides guidance for diagnosing and resolving common middleware-related issues, including authentication failures, cache invalidation problems, and rate limiting issues.

```mermaid
flowchart TD
Problem[Issue Reported] --> AuthIssue{"Authentication Issue?"}
AuthIssue --> |Yes| CheckToken["Check JWT token validity"]
CheckToken --> CheckCookie["Verify token in cookies"]
CheckCookie --> CheckHeader["Verify token in Authorization header"]
CheckHeader --> CheckUser["Confirm user exists in database"]
CheckUser --> Solution1["Resolve authentication issue"]
AuthIssue --> |No| RateLimitIssue{"Rate Limit Issue?"}
RateLimitIssue --> |Yes| CheckIP["Verify client IP tracking"]
CheckIP --> CheckUser["Confirm user ID tracking"]
CheckUser --> CheckRedis["Validate Redis connection"]
CheckRedis --> Solution2["Resolve rate limiting issue"]
RateLimitIssue --> |No| CacheIssue{"Cache Issue?"}
CacheIssue --> |Yes| CheckKey["Verify cache key generation"]
CheckKey --> CheckTTL["Confirm TTL settings"]
CheckTTL --> CheckRedis["Validate Redis connection"]
CheckRedis --> Solution3["Resolve cache issue"]
CacheIssue --> |No| ValidationIssue{"Validation Issue?"}
ValidationIssue --> |Yes| CheckParams["Verify parameter validation"]
CheckParams --> CheckQuery["Confirm query validation"]
CheckQuery --> CheckSanitize["Validate input sanitization"]
CheckSanitize --> Solution4["Resolve validation issue"]
ValidationIssue --> |No| ErrorIssue{"Error Handling Issue?"}
ErrorIssue --> |Yes| CheckLogging["Verify error logging"]
CheckLogging --> CheckNotification["Confirm error notifications"]
CheckNotification --> Solution5["Resolve error handling issue"]
Solution1 --> Final[Issue Resolved]
Solution2 --> Final
Solution3 --> Final
Solution4 --> Final
Solution5 --> Final
```

**Diagram sources**
- [auth.middleware.ts](file://api-fastify/src/middlewares/auth.middleware.ts#L1-L128)
- [rate-limit.middleware.ts](file://api-fastify/src/middlewares/rate-limit.middleware.ts#L1-L92)
- [cache.middleware.ts](file://api-fastify/src/middlewares/cache.middleware.ts#L1-L25)
- [notification-validation.middleware.ts](file://api-fastify/src/middlewares/notification-validation.middleware.ts#L1-L112)

**Section sources**
- [auth.middleware.ts](file://api-fastify/src/middlewares/auth.middleware.ts#L1-L128)
- [rate-limit.middleware.ts](file://api-fastify/src/middlewares/rate-limit.middleware.ts#L1-L92)
- [cache.middleware.ts](file://api-fastify/src/middlewares/cache.middleware.ts#L1-L25)
- [notification-validation.middleware.ts](file://api-fastify/src/middlewares/notification-validation.middleware.ts#L1-L112)