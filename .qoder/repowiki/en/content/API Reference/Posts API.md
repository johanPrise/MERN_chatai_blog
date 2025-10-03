# Posts API Documentation

<cite>
**Referenced Files in This Document**
- [post.schema.ts](file://api-fastify/src/schemas/post.schema.ts)
- [post.controller.ts](file://api-fastify/src/controllers/post.controller.ts)
- [post.service.ts](file://api-fastify/src/services/post.service.ts)
- [post.model.ts](file://api-fastify/src/models/post.model.ts)
- [post.types.ts](file://api-fastify/src/types/post.types.ts)
- [post.routes.ts](file://api-fastify/src/routes/post.routes.ts)
- [auth.middleware.ts](file://api-fastify/src/middlewares/auth.middleware.ts)
- [rate-limit.middleware.ts](file://api-fastify/src/middlewares/rate-limit.middleware.ts)
- [postApi.ts](file://src/features/posts/services/postApi.ts)
- [api.config.ts](file://src/config/api.config.ts)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Authentication](#authentication)
3. [Rate Limiting](#rate-limiting)
4. [API Endpoints](#api-endpoints)
5. [Request/Response Schemas](#requestresponse-schemas)
6. [Error Handling](#error-handling)
7. [Validation Rules](#validation-rules)
8. [Soft Delete Behavior](#soft-delete-behavior)
9. [Permission Requirements](#permission-requirements)
10. [Usage Examples](#usage-examples)
11. [Troubleshooting](#troubleshooting)

## Introduction

The Posts API provides comprehensive endpoints for managing blog articles in the MERN_chatai_blog application. This API supports full CRUD operations for posts, including advanced features like content blocks, categorization, tagging, likes/dislikes, and soft deletion. The API is built with Fastify framework and follows RESTful conventions with JSON responses.

Key features include:
- **Content Flexibility**: Supports both legacy markdown content and modern block-based content
- **Advanced Filtering**: Comprehensive query parameters for searching and filtering posts
- **Permission System**: Role-based access control for authors, editors, and administrators
- **Soft Deletion**: Non-destructive removal with restoration capabilities
- **Real-time Interactions**: Like/dislike functionality with caching support
- **Performance Optimization**: Built-in caching and rate limiting

## Authentication

All POST, PUT, and DELETE endpoints require JWT authentication. The API supports authentication through cookies and Authorization headers.

### Authentication Methods

**Cookie-based Authentication:**
```http
GET /posts HTTP/1.1
Host: api.example.com
Cookie: token=your-jwt-token
```

**Header-based Authentication:**
```http
GET /posts HTTP/1.1
Host: api.example.com
Authorization: Bearer your-jwt-token
```

### Authentication Middleware

The API uses the `authenticate` middleware for protected routes:

```typescript
export const authenticate = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    await request.jwtVerify();
    console.log('Utilisateur authentifié:', request.user);
  } catch (error) {
    reply.status(401).send({
      message: 'Non autorisé - Veuillez vous connecter',
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
};
```

**Section sources**
- [auth.middleware.ts](file://api-fastify/src/middlewares/auth.middleware.ts#L10-L40)

## Rate Limiting

The API implements intelligent rate limiting to prevent abuse and ensure fair usage.

### Rate Limiting Configuration

**Default Rate Limits:**
- **Standard Requests**: 100 requests per minute per IP address
- **Admin Actions**: 30 requests per minute per user
- **Notification Actions**: 100 requests per minute per user

### Rate Limit Headers

When rate limits are exceeded, the API returns the following headers:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1640995200000
Retry-After: 60
```

### Rate Limit Middleware Implementation

```typescript
export function createRateLimitMiddleware(options: RateLimitOptions) {
  const {
    windowMs,
    maxRequests,
    keyGenerator = (request: FastifyRequest) => request.ip,
  } = options;

  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const key = `rate_limit:${keyGenerator(request)}`;
      const windowStart = Math.floor(Date.now() / windowMs) * windowMs;
      const windowKey = `${key}:${windowStart}`;

      const currentRequests = await cache.get<number>(windowKey) || 0;

      if (currentRequests >= maxRequests) {
        const resetTime = windowStart + windowMs;
        const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);

        reply.header('X-RateLimit-Limit', maxRequests);
        reply.header('X-RateLimit-Remaining', 0);
        reply.header('X-RateLimit-Reset', resetTime);
        reply.header('Retry-After', retryAfter);

        return reply.status(429).send({
          message: 'Trop de requêtes. Veuillez réessayer plus tard.',
          retryAfter,
        });
      }

      // Increment counter and set TTL
      const newCount = currentRequests + 1;
      const ttl = Math.ceil((windowStart + windowMs - Date.now()) / 1000);
      await cache.set(windowKey, newCount, ttl);
    } catch (error) {
      request.log.error('Erreur dans le rate limiting:', error);
    }
  };
}
```

**Section sources**
- [rate-limit.middleware.ts](file://api-fastify/src/middlewares/rate-limit.middleware.ts#L15-L60)

## API Endpoints

### GET /posts - Retrieve All Posts

Retrieves all posts with pagination and filtering capabilities.

**HTTP Method:** GET  
**Endpoint:** `/posts`  
**Authentication:** Optional  
**Rate Limit:** 100 req/min per IP  

#### Query Parameters

| Parameter | Type | Description | Default | Range |
|-----------|------|-------------|---------|-------|
| `page` | number | Page number for pagination | 1 | ≥ 1 |
| `limit` | number | Number of posts per page | 10 | 1-100 |
| `search` | string | Search term for title/content | - | - |
| `category` | string | Filter by category ID | - | - |
| `tag` | string | Filter by tag | - | - |
| `author` | string | Filter by author ID | - | - |
| `status` | string | Filter by post status | - | draft, published, archived |

#### Response Format

```json
{
  "posts": [
    {
      "_id": "651234567890abcdef123456",
      "title": "Sample Blog Post",
      "contentBlocks": [
        {
          "type": "paragraph",
          "data": {
            "text": "This is a paragraph."
          }
        }
      ],
      "excerpt": "Brief summary of the post...",
      "slug": "sample-blog-post",
      "author": {
        "_id": "651234567890abcdef123457",
        "username": "john_doe",
        "profilePicture": "https://example.com/avatar.jpg"
      },
      "categories": [
        {
          "_id": "651234567890abcdef123458",
          "name": "Technology",
          "slug": "technology"
        }
      ],
      "tags": ["react", "javascript"],
      "featuredImage": "https://example.com/image.jpg",
      "coverImage": {
        "url": "https://example.com/cover.jpg",
        "alt": "Cover image description"
      },
      "images": [
        {
          "url": "https://example.com/image1.jpg",
          "alt": "Image description"
        }
      ],
      "status": "published",
      "viewCount": 150,
      "likes": [],
      "dislikes": [],
      "likeCount": 0,
      "dislikeCount": 0,
      "commentCount": 5,
      "isLiked": false,
      "isDisliked": false,
      "createdAt": "2023-09-20T10:30:00.000Z",
      "updatedAt": "2023-09-20T11:00:00.000Z",
      "publishedAt": "2023-09-20T10:30:00.000Z"
    }
  ],
  "total": 15,
  "page": 1,
  "limit": 10,
  "totalPages": 2
}
```

### GET /posts/:idOrSlug - Retrieve Single Post

Retrieves a single post by ID or slug.

**HTTP Method:** GET  
**Endpoint:** `/posts/:idOrSlug`  
**Authentication:** Optional  
**Rate Limit:** 100 req/min per IP  

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `idOrSlug` | string | Post ID or slug |

#### Response Format

Same as GET /posts with single post object in `post` property.

### POST /posts - Create New Post

Creates a new blog post.

**HTTP Method:** POST  
**Endpoint:** `/posts`  
**Authentication:** Required  
**Rate Limit:** 100 req/min per user  

#### Request Body

```json
{
  "title": "My New Blog Post",
  "content": "# Heading\n\nThis is my blog post content.",
  "contentBlocks": [
    {
      "type": "paragraph",
      "data": {
        "text": "This is a paragraph."
      }
    },
    {
      "type": "heading",
      "data": {
        "level": 2,
        "text": "Subheading"
      }
    }
  ],
  "excerpt": "Brief summary of the post...",
  "summary": "Alias for excerpt field",
  "categories": ["651234567890abcdef123458"],
  "tags": ["react", "javascript"],
  "featuredImage": "https://example.com/image.jpg",
  "coverImage": {
    "url": "https://example.com/cover.jpg",
    "alt": "Cover image description"
  },
  "images": [
    {
      "url": "https://example.com/image1.jpg",
      "alt": "Image description"
    }
  ],
  "status": "draft"
}
```

#### Response Format

```json
{
  "message": "Article créé avec succès",
  "post": {
    "_id": "651234567890abcdef123456",
    "title": "My New Blog Post",
    "content": "# Heading\n\nThis is my blog post content.",
    "contentBlocks": [...],
    "excerpt": "Brief summary of the post...",
    "slug": "my-new-blog-post",
    "author": {...},
    "categories": [...],
    "tags": ["react", "javascript"],
    "status": "draft",
    "viewCount": 0,
    "likes": [],
    "dislikes": [],
    "likeCount": 0,
    "dislikeCount": 0,
    "commentCount": 0,
    "createdAt": "2023-09-20T10:30:00.000Z",
    "updatedAt": "2023-09-20T10:30:00.000Z"
  }
}
```

### PUT /posts/:id - Update Post

Updates an existing blog post.

**HTTP Method:** PUT  
**Endpoint:** `/posts/:id`  
**Authentication:** Required  
**Rate Limit:** 100 req/min per user  

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Post ID |

#### Request Body

Partial update object with any combination of fields:

```json
{
  "title": "Updated Post Title",
  "content": "Updated content...",
  "contentBlocks": [...],
  "excerpt": "Updated excerpt...",
  "summary": "Updated summary...",
  "categories": ["651234567890abcdef123458"],
  "tags": ["updated-tag"],
  "featuredImage": "https://example.com/new-image.jpg",
  "coverImage": {
    "url": "https://example.com/new-cover.jpg",
    "alt": "New cover image"
  },
  "status": "published"
}
```

### DELETE /posts/:id - Delete Post

Deletes a post (soft delete by default).

**HTTP Method:** DELETE  
**Endpoint:** `/posts/:id`  
**Authentication:** Required  
**Rate Limit:** 100 req/min per user  

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Post ID |

#### Request Body

```json
{
  "soft": true
}
```

**soft**: boolean - Whether to perform soft delete (true) or hard delete (false)

#### Response Format

```json
{
  "message": "Article supprimé avec succès",
  "data": {
    "soft": true,
    "deletedAt": "2023-09-20T10:30:00.000Z"
  }
}
```

### POST /posts/:id/like - Like Post

Adds a like to a post.

**HTTP Method:** POST  
**Endpoint:** `/posts/:id/like`  
**Authentication:** Required  
**Rate Limit:** 100 req/min per user  

#### Response Format

```json
{
  "message": "Article liké avec succès",
  "likes": ["651234567890abcdef123457", "651234567890abcdef123458"],
  "dislikes": [],
  "likeCount": 2,
  "dislikeCount": 0,
  "isLiked": true,
  "isDisliked": false
}
```

### POST /posts/:id/unlike - Unlike Post

Removes a like from a post.

**HTTP Method:** POST  
**Endpoint:** `/posts/:id/unlike`  
**Authentication:** Required  
**Rate Limit:** 100 req/min per user  

### POST /posts/:id/dislike - Dislike Post

Adds a dislike to a post.

**HTTP Method:** POST  
**Endpoint:** `/posts/:id/dislike`  
**Authentication:** Required  
**Rate Limit:** 100 req/min per user  

**Section sources**
- [post.routes.ts](file://api-fastify/src/routes/post.routes.ts#L15-L125)

## Request/Response Schemas

### GET /posts Schema

```typescript
export const getPostsSchema: FastifySchema = {
  querystring: {
    type: 'object',
    properties: {
      page: { type: 'number', minimum: 1 },
      limit: { type: 'number', minimum: 1, maximum: 100 },
      search: { type: 'string' },
      category: { type: 'string' },
      tag: { type: 'string' },
      author: { type: 'string' },
      status: { type: 'string', enum: Object.values(PostStatus) },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        posts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              title: { type: 'string' },
              contentBlocks: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    type: { type: 'string' },
                    data: { type: 'object', additionalProperties: true }
                  }
                },
                nullable: true
              },
              excerpt: { type: 'string', nullable: true },
              summary: { type: 'string', nullable: true },
              slug: { type: 'string' },
              author: { /* ... */ },
              categories: { /* ... */ },
              tags: { type: 'array', items: { type: 'string' } },
              featuredImage: { type: 'string', nullable: true },
              coverImage: { /* ... */ },
              images: { /* ... */ },
              status: { type: 'string' },
              viewCount: { type: 'number' },
              likes: { type: 'array', items: { type: 'string' } },
              dislikes: { type: 'array', items: { type: 'string' } },
              likeCount: { type: 'number' },
              dislikeCount: { type: 'number' },
              commentCount: { type: 'number' },
              isLiked: { type: 'boolean', nullable: true },
              isDisliked: { type: 'boolean', nullable: true },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
              publishedAt: { type: 'string', format: 'date-time', nullable: true },
            },
          },
        },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
        totalPages: { type: 'number' },
      },
    },
  },
};
```

### POST /posts Schema

```typescript
export const createPostSchema: FastifySchema = {
  body: {
    type: 'object',
    required: ['title'],
    properties: {
      title: { type: 'string', minLength: 3, maxLength: 200 },
      content: { type: 'string', minLength: 1 },
      contentBlocks: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            data: { type: 'object', additionalProperties: true }
          },
          required: ['type', 'data']
        }
      },
      excerpt: { type: 'string', maxLength: 500 },
      summary: { type: 'string', maxLength: 500 },
      categories: {
        type: 'array',
        items: { type: 'string' },
      },
      tags: {
        type: 'array',
        items: { type: 'string' },
      },
      featuredImage: { type: 'string' },
      coverImage: {
        type: 'object',
        properties: {
          url: { type: 'string' },
          alt: { type: 'string' }
        }
      },
      images: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            url: { type: 'string' },
            alt: { type: 'string' }
          }
        }
      },
      status: { type: 'string', enum: Object.values(PostStatus) },
    },
    additionalProperties: false,
  },
  response: {
    201: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        post: { /* ... */ },
      },
    },
    400: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
  },
};
```

**Section sources**
- [post.schema.ts](file://api-fastify/src/schemas/post.schema.ts#L1-L702)

## Error Handling

The API implements comprehensive error handling with specific HTTP status codes and meaningful error messages.

### HTTP Status Codes

| Status Code | Description | Common Scenarios |
|-------------|-------------|------------------|
| 200 | OK | Successful GET requests |
| 201 | Created | Successful POST requests |
| 200 | OK | Successful PUT/DELETE requests |
| 400 | Bad Request | Invalid input data, missing required fields |
| 401 | Unauthorized | Missing or invalid JWT token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource does not exist |
| 409 | Conflict | Resource already exists or state conflict |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected server error |

### Error Response Format

```json
{
  "message": "Specific error description",
  "error": "Optional detailed error message",
  "details": {
    "field": "Invalid field name",
    "reason": "Validation failure reason"
  }
}
```

### Common Error Messages

**Authentication Errors:**
- `"Non autorisé - Veuillez vous connecter"` - Missing or invalid token
- `"Accès refusé - Droits d'administrateur requis"` - Insufficient privileges

**Validation Errors:**
- `"ID article invalide"` - Invalid post ID format
- `"Article non trouvé"` - Post not found
- `"Vous n'êtes pas autorisé à mettre à jour cet article"` - Permission denied
- `"Une ou plusieurs catégories n'existent pas"` - Invalid category references

**Business Logic Errors:**
- `"Article déjà supprimé"` - Attempting to delete already deleted post
- `"Vous avez déjà liké cet article"` - Duplicate like operation
- `"Vous n'avez pas liké cet article"` - Attempting to unlike non-liked post

**Section sources**
- [post.controller.ts](file://api-fastify/src/controllers/post.controller.ts#L10-L25)

## Validation Rules

### Post Creation Validation

**Title Validation:**
- Minimum length: 3 characters
- Maximum length: 200 characters
- Required field

**Content Validation:**
- Minimum length: 1 character (if provided)
- Can be either `content` (legacy) or `contentBlocks` (modern)

**Content Blocks Validation:**
- Each block requires `type` and `data` properties
- Supported block types:
  - `paragraph` - Text content
  - `heading` - Level 1-4 headings
  - `image` - Image with URL and optional alt text
  - `code` - Code with language and content
  - `quote` - Quoted text with optional author
  - `list` - Ordered/unordered lists
  - `embed` - YouTube, X, GitHub, or generic embeds
  - `callout` - Info/warning/success/danger variants

**Excerpt Validation:**
- Maximum length: 500 characters
- Automatically generated if not provided

**Category Validation:**
- Must reference existing categories
- Categories must exist in database

**Status Validation:**
- Enum values: `draft`, `published`, `archived`

### Field-Specific Rules

**Slug Generation:**
- Automatically generated from title
- Unique constraint enforced
- Lowercase, trimmed, URL-safe

**Date Fields:**
- `publishedAt`: Set automatically when status changes to published
- `createdAt`: Managed by MongoDB
- `updatedAt`: Managed by MongoDB

**Counter Fields:**
- `viewCount`: Incremented on post view (except by author)
- `likeCount`: Calculated from `likedBy` array
- `dislikeCount`: Calculated from `dislikedBy` array
- `commentCount`: Managed separately

**Section sources**
- [post.schema.ts](file://api-fastify/src/schemas/post.schema.ts#L250-L350)
- [post.types.ts](file://api-fastify/src/types/post.types.ts#L15-L50)

## Soft Delete Behavior

The API implements soft deletion to preserve data integrity while allowing posts to be hidden from normal views.

### Soft Delete Features

**Deletion Process:**
1. Mark `isDeleted` as `true`
2. Set `deletedAt` timestamp
3. Store `deletedBy` user ID
4. Remove from normal queries

**Restoration Process:**
1. Set `isDeleted` to `false`
2. Clear `deletedAt` and `deletedBy`
3. Restore to normal visibility

### Soft Delete Queries

Posts are excluded from queries by default using the `isDeleted: { $ne: true }` condition.

```typescript
const buildPostQuery = (options: GetPostsOptions) => {
  const { search, category, tag, author, status, currentUserId, currentUserRole } = options;
  let query: any = { isDeleted: { $ne: true } };

  // Additional filtering...
  return query;
};
```

### Hard Delete (Administrator Only)

Hard deletion removes posts permanently and is restricted to administrators:

```typescript
if (soft) {
  // Soft delete - mark as deleted
  await Post.findByIdAndUpdate(id, {
    isDeleted: true,
    deletedAt: new Date(),
    deletedBy: currentUserId,
  });
} else {
  // Hard delete - remove completely
  if (currentUserRole !== 'admin') {
    throw new Error('Seuls les administrateurs peuvent supprimer définitivement un article');
  }
  await Post.findByIdAndDelete(id);
}
```

**Section sources**
- [post.service.ts](file://api-fastify/src/services/post.service.ts#L650-L690)
- [post.model.ts](file://api-fastify/src/models/post.model.ts#L70-L85)

## Permission Requirements

The API implements a role-based permission system with different access levels for various operations.

### User Roles

**Available Roles:**
- `admin`: Full access to all features
- `editor`: Can edit and publish posts
- `author`: Can create and manage own posts

### Permission Matrix

| Operation | Author | Editor | Admin |
|-----------|--------|--------|-------|
| Create Post | ✅ | ✅ | ✅ |
| Update Own Post | ✅ | ✅ | ✅ |
| Update Others' Post | ❌ | ✅ | ✅ |
| Delete Own Post | ✅ | ✅ | ✅ |
| Delete Others' Post | ❌ | ❌ | ✅ |
| Hard Delete | ❌ | ❌ | ✅ |
| Like/Unlike | ✅ | ✅ | ✅ |
| Dislike | ✅ | ✅ | ✅ |

### Permission Implementation

```typescript
// Permission checking in updatePost service
const authorId = post.author._id.toString();
const isAuthor = authorId === currentUserId;
const isAdminOrEditor = currentUserRole === 'admin' || currentUserRole === 'editor';

if (!isAuthor && !isAdminOrEditor) {
  throw new Error("Vous n'êtes pas autorisé à mettre à jour cet article");
}
```

### Role-Based Access Control

**Author Middleware:**
```typescript
export const isAuthorEditorOrAdmin = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    await request.jwtVerify();
    const user = await User.findById(request.user._id);

    if (!user || (user.role !== UserRole.AUTHOR && user.role !== UserRole.EDITOR && user.role !== UserRole.ADMIN)) {
      return reply.status(403).send({ 
        message: 'Accès refusé - Droits d\'auteur, d\'éditeur ou d\'administrateur requis' 
      });
    }
  } catch (error) {
    reply.status(401).send({ message: 'Non autorisé - Veuillez vous connecter' });
  }
};
```

**Section sources**
- [post.service.ts](file://api-fastify/src/services/post.service.ts#L350-L400)
- [auth.middleware.ts](file://api-fastify/src/middlewares/auth.middleware.ts#L70-L90)

## Usage Examples

### Creating a Post with Content Blocks

```javascript
// Using fetch API
fetch('https://api.example.com/posts', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-jwt-token'
  },
  body: JSON.stringify({
    title: 'Modern Blog Post with Blocks',
    contentBlocks: [
      {
        type: 'paragraph',
        data: {
          text: 'Welcome to our modern blog post!'
        }
      },
      {
        type: 'heading',
        data: {
          level: 2,
          text: 'Main Section'
        }
      },
      {
        type: 'image',
        data: {
          url: 'https://example.com/image.jpg',
          alt: 'Example image'
        }
      },
      {
        type: 'code',
        data: {
          language: 'javascript',
          code: 'console.log("Hello World");'
        }
      }
    ],
    excerpt: 'Learn about modern content blocks in our blog posts.',
    categories: ['651234567890abcdef123458'],
    tags: ['modern', 'blocks', 'tutorial'],
    status: 'draft'
  })
})
.then(response => response.json())
.then(data => console.log('Post created:', data))
.catch(error => console.error('Error:', error));
```

### Updating Post Status

```javascript
// Using JavaScript fetch
async function publishPost(postId) {
  try {
    const response = await fetch(`https://api.example.com/posts/${postId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer your-jwt-token'
      },
      body: JSON.stringify({
        status: 'published'
      })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('Post published successfully:', result.post);
    } else {
      console.error('Failed to publish post:', result.message);
    }
  } catch (error) {
    console.error('Network error:', error);
  }
}
```

### Retrieving Posts with Filters

```bash
# Using curl with various filters
curl -H "Authorization: Bearer your-jwt-token" \
  "https://api.example.com/posts?page=1&limit=10&category=651234567890abcdef123458&status=published&search=react"
```

### Managing Likes

```javascript
// Like a post
async function likePost(postId) {
  try {
    const response = await fetch(`https://api.example.com/posts/${postId}/like`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer your-jwt-token'
      }
    });
    
    const result = await response.json();
    console.log('Post liked:', result);
  } catch (error) {
    console.error('Failed to like post:', error);
  }
}

// Unlike a post
async function unlikePost(postId) {
  try {
    const response = await fetch(`https://api.example.com/posts/${postId}/unlike`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer your-jwt-token'
      }
    });
    
    const result = await response.json();
    console.log('Post unliked:', result);
  } catch (error) {
    console.error('Failed to unlike post:', error);
  }
}
```

### Deleting a Post

```javascript
// Soft delete (default)
async function deletePost(postId) {
  try {
    const response = await fetch(`https://api.example.com/posts/${postId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer your-jwt-token'
      },
      body: JSON.stringify({
        soft: true
      })
    });
    
    const result = await response.json();
    console.log('Post soft deleted:', result);
  } catch (error) {
    console.error('Failed to delete post:', error);
  }
}

// Hard delete (admin only)
async function hardDeletePost(postId) {
  try {
    const response = await fetch(`https://api.example.com/posts/${postId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer your-jwt-token'
      },
      body: JSON.stringify({
        soft: false
      })
    });
    
    const result = await response.json();
    console.log('Post hard deleted:', result);
  } catch (error) {
    console.error('Failed to hard delete post:', error);
  }
}
```

**Section sources**
- [postApi.ts](file://src/features/posts/services/postApi.ts#L100-L200)

## Troubleshooting

### Common Issues and Solutions

**Issue: 401 Unauthorized**
```bash
# Check if token is present and valid
curl -H "Authorization: Bearer your-token-here" https://api.example.com/posts

# Verify token format and expiration
echo "your-token-here" | base64 -d  # Decode to check validity
```

**Issue: 403 Forbidden**
```javascript
// Check user role and permissions
const user = await getUserFromToken(token);
if (user.role !== 'admin' && user.role !== 'editor' && user.role !== 'author') {
  console.error('Insufficient permissions');
}
```

**Issue: 400 Bad Request - Validation Errors**
```javascript
// Validate input data before sending
const validatePostData = (postData) => {
  const errors = [];
  
  if (!postData.title || postData.title.length < 3) {
    errors.push('Title must be at least 3 characters');
  }
  
  if (postData.categories && !Array.isArray(postData.categories)) {
    errors.push('Categories must be an array');
  }
  
  if (postData.status && !['draft', 'published', 'archived'].includes(postData.status)) {
    errors.push('Invalid status value');
  }
  
  return errors;
};
```

**Issue: 409 Conflict - Post Already Deleted**
```javascript
// Check post status before operations
async function safeDeletePost(postId) {
  try {
    const post = await getPostById(postId);
    
    if (post.isDeleted) {
      console.log('Post already deleted, attempting restore');
      await restorePost(postId);
    } else {
      await deletePost(postId);
    }
  } catch (error) {
    if (error.message === 'Article non trouvé') {
      console.log('Post not found or already deleted');
    }
  }
}
```

### Debugging Tips

**Enable Debug Logging:**
```typescript
// Enable debug logging in development
if (process.env.NODE_ENV === 'development') {
  request.log.debug({
    msg: '[endpoint] request received',
    userId: request.user?._id,
    method: request.method,
    url: request.url,
    body: request.body
  });
}
```

**Check Rate Limit Headers:**
```bash
# Monitor rate limit headers
curl -I -H "Authorization: Bearer your-token" https://api.example.com/posts
# Look for X-RateLimit-* headers
```

**Validate JWT Token:**
```javascript
// Decode JWT token to check claims
const jwt = require('jsonwebtoken');
const decoded = jwt.decode(token);
console.log('Token claims:', decoded);
```

### Performance Optimization

**Caching Strategy:**
- GET /posts: 10-minute cache
- GET /posts/:idOrSlug: 5-minute cache
- Implement cache invalidation on POST/PUT/DELETE

**Query Optimization:**
```typescript
// Use appropriate indexes
postSchema.index({ status: 1, createdAt: -1 });
postSchema.index({ status: 1, publishedAt: -1 });
postSchema.index({ author: 1 });
postSchema.index({ categories: 1 });
```

**Section sources**
- [post.controller.ts](file://api-fastify/src/controllers/post.controller.ts#L10-L25)
- [post.service.ts](file://api-fastify/src/services/post.service.ts#L650-L700)