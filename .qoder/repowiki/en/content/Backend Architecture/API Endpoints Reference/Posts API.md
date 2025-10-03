# Posts API Documentation

<cite>
**Referenced Files in This Document**
- [post.controller.ts](file://api-fastify/src/controllers/post.controller.ts)
- [post.routes.ts](file://api-fastify/src/routes/post.routes.ts)
- [post.schema.ts](file://api-fastify/src/schemas/post.schema.ts)
- [post.model.ts](file://api-fastify/src/models/post.model.ts)
- [post.types.ts](file://api-fastify/src/types/post.types.ts)
- [post.service.ts](file://api-fastify/src/services/post.service.ts)
- [postApi.ts](file://src/features/posts/services/postApi.ts)
- [api.config.ts](file://src/config/api.config.ts)
- [ai.controller.ts](file://api-fastify/src/controllers/ai.controller.ts)
- [ai.service.ts](file://api-fastify/src/services/ai.service.ts)
- [upload.controller.ts](file://api-fastify/src/controllers/upload.controller.ts)
- [rate-limit.middleware.ts](file://api-fastify/src/middlewares/rate-limit.middleware.ts)
- [cache.middleware.ts](file://api-fastify/src/middlewares/cache.middleware.ts)
- [CreatePost.tsx](file://src/features/posts/pages/CreatePost.tsx)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [API Overview](#api-overview)
3. [Authentication & Authorization](#authentication--authorization)
4. [CRUD Operations](#crud-operations)
5. [Content Management](#content-management)
6. [Image Upload & Media Handling](#image-upload--media-handling)
7. [AI Integration](#ai-integration)
8. [Performance & Caching](#performance--caching)
9. [Error Handling](#error-handling)
10. [Rate Limiting](#rate-limiting)
11. [Examples](#examples)
12. [Troubleshooting](#troubleshooting)

## Introduction

The Posts API is a comprehensive RESTful API built with Fastify that manages blog posts with advanced features including Tiptap content blocks, AI integration, image upload capabilities, and sophisticated caching strategies. This API serves as the backbone for the MERN_chatai_blog application, providing full CRUD operations for posts with support for both draft and published content.

The API follows modern REST principles while incorporating advanced features like real-time content editing, automatic content generation, and intelligent caching mechanisms to ensure optimal performance and user experience.

## API Overview

The Posts API consists of several key components working together to provide a robust blogging platform:

```mermaid
graph TB
subgraph "API Layer"
Routes[Routes Layer]
Controllers[Controllers]
Middlewares[Middlewares]
end
subgraph "Business Logic"
Services[Services]
Validation[Validation]
Authorization[Authorization]
end
subgraph "Data Layer"
Model[Post Model]
Database[(MongoDB)]
Cache[Redis Cache]
end
subgraph "External Services"
AI[AI Service]
Upload[Upload Service]
Notifications[Notification Service]
end
Routes --> Controllers
Controllers --> Services
Services --> Validation
Services --> Authorization
Services --> Model
Model --> Database
Services --> Cache
Services --> AI
Services --> Upload
Services --> Notifications
Controllers --> Middlewares
Middlewares --> Cache
```

**Diagram sources**
- [post.routes.ts](file://api-fastify/src/routes/post.routes.ts#L1-L126)
- [post.controller.ts](file://api-fastify/src/controllers/post.controller.ts#L1-L483)
- [post.service.ts](file://api-fastify/src/services/post.service.ts#L1-L731)

**Section sources**
- [post.routes.ts](file://api-fastify/src/routes/post.routes.ts#L1-L126)
- [post.controller.ts](file://api-fastify/src/controllers/post.controller.ts#L1-L483)
- [post.service.ts](file://api-fastify/src/services/post.service.ts#L1-L731)

## Authentication & Authorization

### JWT Authentication

All POST, PUT, and DELETE operations require JWT authentication. The API uses bearer tokens for secure communication.

```mermaid
sequenceDiagram
participant Client
participant AuthMiddleware
participant Controller
participant Service
participant Database
Client->>AuthMiddleware : Request with Bearer Token
AuthMiddleware->>AuthMiddleware : Validate JWT
AuthMiddleware->>Controller : Authorized Request
Controller->>Service : Business Logic Call
Service->>Database : Data Operation
Database-->>Service : Result
Service-->>Controller : Response
Controller-->>Client : Success Response
```

**Diagram sources**
- [post.controller.ts](file://api-fastify/src/controllers/post.controller.ts#L100-L150)
- [post.routes.ts](file://api-fastify/src/routes/post.routes.ts#L30-L50)

### Authorization Rules

The API implements role-based authorization with the following rules:

- **Authors**: Can create, read, update, and delete their own drafts
- **Editors**: Can manage all posts within their assigned categories
- **Admins**: Full access to all posts and administrative functions
- **Public Users**: Can only view published posts

```typescript
// Authorization logic from post.service.ts
const isAuthor = authorId === currentUserId;
const isAdminOrEditor = currentUserRole === 'admin' || currentUserRole === 'editor';

if (!isAuthor && !isAdminOrEditor) {
  throw new Error("Vous n'êtes pas autorisé à mettre à jour cet article");
}
```

**Section sources**
- [post.service.ts](file://api-fastify/src/services/post.service.ts#L300-L320)
- [post.controller.ts](file://api-fastify/src/controllers/post.controller.ts#L100-L150)

## CRUD Operations

### GET /api/posts - List Posts

Retrieve paginated and filtered posts with comprehensive metadata.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10, max: 100)
- `search` (string): Search term for title and content
- `category` (string): Filter by category ID
- `tag` (string): Filter by tag
- `author` (string): Filter by author ID
- `status` (string): Filter by post status (draft, published, archived)

**Response Format:**
```json
{
  "posts": [
    {
      "_id": "654321...",
      "title": "Sample Post",
      "slug": "sample-post",
      "status": "published",
      "viewCount": 150,
      "likeCount": 25,
      "dislikeCount": 3,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z",
      "author": {
        "_id": "user123",
        "username": "john_doe",
        "profilePicture": "/uploads/avatar.jpg"
      },
      "categories": [
        {
          "_id": "cat123",
          "name": "Technology",
          "slug": "technology"
        }
      ],
      "featuredImage": "/uploads/featured.jpg",
      "tags": ["javascript", "react", "nodejs"],
      "excerpt": "This is a sample post excerpt..."
    }
  ],
  "total": 150,
  "page": 1,
  "limit": 10,
  "totalPages": 15
}
```

### GET /api/posts/:idOrSlug - Get Post

Retrieve a single post by ID or slug with full content and metadata.

**Parameters:**
- `idOrSlug` (string): Post ID or URL-friendly slug

**Response Format:**
```json
{
  "post": {
    "_id": "654321...",
    "title": "Complete Post Content",
    "contentBlocks": [
      {
        "type": "paragraph",
        "data": {
          "text": "This is a paragraph block"
        }
      },
      {
        "type": "image",
        "data": {
          "url": "/uploads/image.jpg",
          "alt": "Alt text"
        }
      }
    ],
    "excerpt": "Post excerpt...",
    "summary": "Post summary...",
    "slug": "complete-post-content",
    "status": "published",
    "viewCount": 150,
    "likeCount": 25,
    "dislikeCount": 3,
    "isLiked": true,
    "isDisliked": false,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z",
    "publishedAt": "2024-01-01T00:00:00Z",
    "author": {
      "_id": "user123",
      "username": "john_doe",
      "profilePicture": "/uploads/avatar.jpg"
    },
    "categories": [...],
    "tags": [...],
    "featuredImage": "/uploads/featured.jpg",
    "coverImage": {
      "url": "/uploads/cover.jpg",
      "alt": "Cover image"
    },
    "images": [
      {
        "url": "/uploads/image1.jpg",
        "alt": "Additional image"
      }
    ]
  }
}
```

### POST /api/posts - Create Post

Create a new draft or published post with Tiptap content blocks.

**Request Body:**
```json
{
  "title": "My New Post",
  "contentBlocks": [
    {
      "type": "paragraph",
      "data": {
        "text": "Welcome to my new blog post!"
      }
    },
    {
      "type": "heading",
      "data": {
        "level": 2,
        "text": "Main Heading"
      }
    },
    {
      "type": "image",
      "data": {
        "url": "/uploads/image.jpg",
        "alt": "Description"
      }
    }
  ],
  "excerpt": "Custom excerpt (optional)",
  "summary": "Custom summary (optional)",
  "categories": ["category-id-1", "category-id-2"],
  "tags": ["tag1", "tag2"],
  "featuredImage": "/uploads/featured.jpg",
  "coverImage": {
    "url": "/uploads/cover.jpg",
    "alt": "Cover image description"
  },
  "images": [
    {
      "url": "/uploads/additional.jpg",
      "alt": "Additional image"
    }
  ],
  "status": "draft"
}
```

**Response:**
```json
{
  "message": "Article créé avec succès",
  "post": {
    "_id": "654321...",
    "title": "My New Post",
    "slug": "my-new-post",
    "status": "draft",
    "author": {
      "_id": "user123",
      "username": "john_doe"
    }
  }
}
```

### PUT /api/posts/:id - Update Post

Update an existing post with validation and permission checks.

**Parameters:**
- `id` (string): Post ID

**Request Body:**
```json
{
  "title": "Updated Post Title",
  "contentBlocks": [...],
  "excerpt": "Updated excerpt",
  "categories": ["new-category-id"],
  "tags": ["updated-tag"],
  "status": "published"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Article mis à jour avec succès",
  "post": {
    // Updated post data
  }
}
```

### DELETE /api/posts/:id - Delete Post

Soft delete a post by default or hard delete for administrators.

**Parameters:**
- `id` (string): Post ID

**Request Body:**
```json
{
  "soft": true
}
```

**Response:**
```json
{
  "message": "Article supprimé avec succès",
  "data": {
    "soft": true,
    "deletedAt": "2024-01-01T00:00:00Z"
  }
}
```

**Section sources**
- [post.controller.ts](file://api-fastify/src/controllers/post.controller.ts#L40-L483)
- [post.routes.ts](file://api-fastify/src/routes/post.routes.ts#L1-L126)
- [post.schema.ts](file://api-fastify/src/schemas/post.schema.ts#L1-L703)

## Content Management

### Tiptap Content Blocks

The API uses a flexible block-based content system that supports various content types:

```mermaid
classDiagram
class Block {
<<interface>>
+type : string
+data : object
}
class ParagraphBlock {
+type : "paragraph"
+data : ParagraphData
}
class HeadingBlock {
+type : "heading"
+data : HeadingData
}
class ImageBlock {
+type : "image"
+data : ImageData
}
class CodeBlock {
+type : "code"
+data : CodeData
}
class QuoteBlock {
+type : "quote"
+data : QuoteData
}
class ListBlock {
+type : "list"
+data : ListData
}
class EmbedBlock {
+type : "embed"
+data : EmbedData
}
class CalloutBlock {
+type : "callout"
+data : CalloutData
}
Block <|-- ParagraphBlock
Block <|-- HeadingBlock
Block <|-- ImageBlock
Block <|-- CodeBlock
Block <|-- QuoteBlock
Block <|-- ListBlock
Block <|-- EmbedBlock
Block <|-- CalloutBlock
```

**Diagram sources**
- [post.types.ts](file://api-fastify/src/types/post.types.ts#L85-L108)

### Content Validation & Processing

The API performs comprehensive validation and processing:

1. **Content Extraction**: Automatic excerpt generation from content blocks
2. **Slug Generation**: URL-friendly slugs from titles
3. **Category Validation**: Ensures referenced categories exist
4. **Content Sanitization**: Prevents XSS and other security issues

```typescript
// Content processing from post.service.ts
const blocksToPlainText = (blocks: any[] | undefined | null): string => {
  if (!Array.isArray(blocks)) return '';
  return blocks.map(extractTextFromBlock).filter(Boolean).join(' ').trim();
};

const extractTextFromBlock = (block: any): string => {
  if (!block) return '';
  const type = block.type;
  const data = block.data ?? block;
  
  if (['paragraph', 'heading', 'quote', 'callout'].includes(type) && typeof data.text === 'string') {
    return data.text;
  }
  // ... additional block types
  return '';
};
```

**Section sources**
- [post.service.ts](file://api-fastify/src/services/post.service.ts#L15-L30)
- [post.types.ts](file://api-fastify/src/types/post.types.ts#L85-L108)

## Image Upload & Media Handling

### File Upload Endpoint

The API provides comprehensive image upload capabilities with automatic optimization and thumbnail generation.

**Endpoint:** `POST /api/uploads/file`

**Supported Features:**
- Automatic image optimization
- Thumbnail generation
- Format conversion
- Size validation
- Security scanning

**Response:**
```json
{
  "message": "Fichier uploadé avec succès",
  "url": "http://localhost:4200/uploads/original.jpg",
  "urls": {
    "original": "http://localhost:4200/uploads/original.jpg",
    "optimized": "http://localhost:4200/uploads/optimized.jpg",
    "thumbnail": "http://localhost:4200/uploads/thumbnail.jpg"
  }
}
```

### Base64 Image Upload

Direct base64 image upload for inline content:

**Endpoint:** `POST /api/uploads/base64`

**Request Body:**
```json
{
  "filename": "image.jpg",
  "data": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
}
```

**Section sources**
- [upload.controller.ts](file://api-fastify/src/controllers/upload.controller.ts#L1-L120)

## AI Integration

### AI Chat Integration

The API integrates with AI services for content assistance and generation.

**Endpoint:** `POST /api/ai/message`

**Request Body:**
```json
{
  "input": "Write a blog post about JavaScript frameworks",
  "sessionId": "unique-session-id"
}
```

**Response:**
```json
{
  "response": "JavaScript frameworks are essential for modern web development...",
  "success": true,
  "sessionId": "unique-session-id"
}
```

### AI Service Architecture

```mermaid
sequenceDiagram
participant Client
participant AIController
participant AIService
participant ChatCache
participant GradioAPI
Client->>AIController : Send message
AIController->>ChatCache : Check cache
alt Cache miss
AIController->>AIService : Generate response
AIService->>GradioAPI : Call AI model
GradioAPI-->>AIService : AI response
AIService-->>AIController : Processed response
AIController->>ChatCache : Store in cache
else Cache hit
ChatCache-->>AIController : Cached response
end
AIController-->>Client : AI response
```

**Diagram sources**
- [ai.controller.ts](file://api-fastify/src/controllers/ai.controller.ts#L1-L70)
- [ai.service.ts](file://api-fastify/src/services/ai.service.ts#L1-L131)

**Section sources**
- [ai.controller.ts](file://api-fastify/src/controllers/ai.controller.ts#L1-L70)
- [ai.service.ts](file://api-fastify/src/services/ai.service.ts#L1-L131)

## Performance & Caching

### Caching Strategy

The API implements a multi-layer caching strategy:

1. **Redis Cache**: Distributed caching for shared data
2. **Memory Cache**: Local caching for frequently accessed data
3. **Browser Cache**: Frontend caching for static resources

**Cache Middleware Implementation:**
```typescript
export const cacheMiddleware = (ttl = 300) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (request.method !== 'GET') return;

    const cacheKey = `cache:${request.url}`;
    const cachedData = await cache.get(cacheKey);

    if (cachedData) {
      reply.header('X-Cache', 'HIT');
      return reply.send(cachedData);
    }

    const originalSend = reply.send;
    reply.send = function(payload: any) {
      if (reply.statusCode === 200) {
        cache.set(cacheKey, payload, ttl);
        reply.header('X-Cache', 'MISS');
      }
      return originalSend.call(this, payload);
    };
  };
};
```

### Cache Headers

The API provides detailed cache information:

- `X-Cache`: Cache status (HIT/MISS)
- `X-RateLimit-Limit`: Rate limit quota
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset time for rate limits

**Section sources**
- [cache.middleware.ts](file://api-fastify/src/middlewares/cache.middleware.ts#L1-L25)

## Error Handling

### Standard Error Response Format

```json
{
  "success": false,
  "message": "Specific error message",
  "errors": {
    "field1": "Validation error message",
    "field2": "Another validation error"
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### Common Error Codes

| Status Code | Error Type | Description |
|-------------|------------|-------------|
| 400 | Bad Request | Invalid input data |
| 401 | Unauthorized | Missing or invalid JWT |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected server error |

### Error Categories

1. **Validation Errors**: Input format and business rule violations
2. **Authorization Errors**: Permission and authentication failures
3. **Resource Errors**: Missing or deleted resources
4. **System Errors**: Database and external service failures

**Section sources**
- [post.controller.ts](file://api-fastify/src/controllers/post.controller.ts#L10-L30)

## Rate Limiting

### Rate Limiting Configuration

The API implements configurable rate limiting with different tiers:

```typescript
// Notification rate limiting: 100 requests per minute per user
export const notificationRateLimit = createRateLimitMiddleware({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100,
  keyGenerator: (request: FastifyRequest) => {
    return request.user?._id || request.ip;
  },
  skipSuccessfulRequests: false,
  skipFailedRequests: true,
});

// Strict rate limiting: 30 requests per minute per user
export const notificationModifyRateLimit = createRateLimitMiddleware({
  windowMs: 60 * 1000,
  maxRequests: 30,
  keyGenerator: (request: FastifyRequest) => {
    return request.user?._id || request.ip;
  },
  skipSuccessfulRequests: false,
  skipFailedRequests: true,
});
```

### Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200000
Retry-After: 30
```

**Section sources**
- [rate-limit.middleware.ts](file://api-fastify/src/middlewares/rate-limit.middleware.ts#L1-L92)

## Examples

### Creating a Draft Post

```javascript
// Using the frontend API service
const postApi = new PostApiService();

const draftData = {
  title: "My First Blog Post",
  contentBlocks: [
    {
      type: "paragraph",
      data: {
        text: "This is the introduction to my blog post."
      }
    }
  ],
  status: "draft",
  categories: ["technology"],
  tags: ["tutorial", "beginner"]
};

try {
  const result = await postApi.createPost(draftData);
  console.log("Draft created:", result.data.id);
} catch (error) {
  console.error("Failed to create draft:", error);
}
```

### Publishing a Post

```javascript
// Using the frontend API service
const postApi = new PostApiService();

try {
  const result = await postApi.publishPost(postId);
  if (result.success) {
    console.log("Post published successfully!");
  }
} catch (error) {
  console.error("Failed to publish post:", error);
}
```

### Retrieving Posts by Category

```javascript
// Using the frontend API service
const postApi = new PostApiService();

try {
  const response = await postApi.getPosts({
    filters: {
      category: "technology"
    },
    page: 1,
    limit: 10
  });
  
  console.log("Posts:", response.data.posts);
} catch (error) {
  console.error("Failed to fetch posts:", error);
}
```

### Using AI for Content Generation

```javascript
// Using the AI endpoint
fetch('/api/ai/message', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  },
  body: JSON.stringify({
    input: "Write a blog post about React hooks",
    sessionId: "unique-session-id"
  })
})
.then(response => response.json())
.then(data => {
  console.log("AI Response:", data.response);
});
```

**Section sources**
- [postApi.ts](file://src/features/posts/services/postApi.ts#L1-L605)
- [CreatePost.tsx](file://src/features/posts/pages/CreatePost.tsx#L1-L105)

## Troubleshooting

### Common Issues & Solutions

#### 1. Authentication Failures
**Problem**: 401 Unauthorized responses
**Solution**: Ensure valid JWT token is included in Authorization header

```javascript
// Correct header format
headers: {
  'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
}
```

#### 2. Rate Limiting
**Problem**: 429 Too Many Requests
**Solution**: Implement exponential backoff and respect Retry-After header

```javascript
// Handle rate limiting gracefully
const response = await fetch(endpoint, options);
if (response.status === 429) {
  const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
  await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
  // Retry request
}
```

#### 3. Content Validation Errors
**Problem**: 400 Bad Request with validation errors
**Solution**: Check input format against schema requirements

```javascript
// Ensure contentBlocks follow the correct structure
const validContentBlock = {
  type: "paragraph", // Must be a valid block type
  data: {
    text: "Required text content"
  }
};
```

#### 4. Image Upload Issues
**Problem**: Images not displaying correctly
**Solution**: Verify image paths and ensure proper CORS configuration

```javascript
// Use the API's image URL helper
import { getImageUrl } from './api.config';

const imageUrl = getImageUrl('/uploads/my-image.jpg');
console.log("Full image URL:", imageUrl);
```

### Debug Mode

Enable debug logging for detailed troubleshooting:

```javascript
// Enable debug mode in development
if (process.env.NODE_ENV === 'development') {
  console.log('[DEBUG] API Request:', request.url);
  console.log('[DEBUG] Request Body:', request.body);
}
```

### Performance Monitoring

Monitor API performance using built-in metrics:

```javascript
// Cache hit ratio monitoring
reply.header('X-Cache-Hit-Ratio', calculateCacheHitRatio());

// Response time tracking
const startTime = Date.now();
// ... API logic
const responseTime = Date.now() - startTime;
console.log(`[PERFORMANCE] ${request.url} took ${responseTime}ms`);
```

**Section sources**
- [post.controller.ts](file://api-fastify/src/controllers/post.controller.ts#L30-L50)
- [postApi.ts](file://src/features/posts/services/postApi.ts#L1-L605)