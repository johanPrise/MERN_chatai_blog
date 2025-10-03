# API Reference

<cite>
**Referenced Files in This Document**   
- [auth.controller.ts](file://api-fastify/src/controllers/auth.controller.ts)
- [user.controller.ts](file://api-fastify/src/controllers/user.controller.ts)
- [post.controller.ts](file://api-fastify/src/controllers/post.controller.ts)
- [comment.controller.ts](file://api-fastify/src/controllers/comment.controller.ts)
- [category.controller.ts](file://api-fastify/src/controllers/category.controller.ts)
- [notification.controller.ts](file://api-fastify/src/controllers/notification.controller.ts)
- [ai.controller.ts](file://api-fastify/src/controllers/ai.controller.ts)
- [auth.routes.ts](file://api-fastify/src/routes/auth.routes.ts)
- [user.routes.ts](file://api-fastify/src/routes/user.routes.ts)
- [post.routes.ts](file://api-fastify/src/routes/post.routes.ts)
- [comment.routes.ts](file://api-fastify/src/routes/comment.routes.ts)
- [category.routes.ts](file://api-fastify/src/routes/category.routes.ts)
- [notification.routes.ts](file://api-fastify/src/routes/notification.routes.ts)
- [ai.routes.ts](file://api-fastify/src/routes/ai.routes.ts)
- [auth.middleware.ts](file://api-fastify/src/middlewares/auth.middleware.ts)
- [rate-limit.middleware.ts](file://api-fastify/src/middlewares/rate-limit.middleware.ts)
- [auth.schema.ts](file://api-fastify/src/schemas/auth.schema.ts)
- [user.schema.ts](file://api-fastify/src/schemas/user.schema.ts)
- [post.schema.ts](file://api-fastify/src/schemas/post.schema.ts)
- [comment.schema.ts](file://api-fastify/src/schemas/comment.schema.ts)
- [category.schema.ts](file://api-fastify/src/schemas/category.schema.ts)
- [notification.types.ts](file://api-fastify/src/types/notification.types.ts)
- [auth.types.ts](file://api-fastify/src/types/auth.types.ts)
- [user.types.ts](file://api-fastify/src/types/user.types.ts)
- [post.types.ts](file://api-fastify/src/types/post.types.ts)
- [comment.types.ts](file://api-fastify/src/types/comment.types.ts)
- [category.types.ts](file://api-fastify/src/types/category.types.ts)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Authentication](#authentication)
3. [User Endpoints](#user-endpoints)
4. [Post Endpoints](#post-endpoints)
5. [Comment Endpoints](#comment-endpoints)
6. [Category Endpoints](#category-endpoints)
7. [Notification Endpoints](#notification-endpoints)
8. [AI Endpoints](#ai-endpoints)
9. [Rate Limiting](#rate-limiting)
10. [Error Handling](#error-handling)
11. [Client Implementation Guidelines](#client-implementation-guidelines)
12. [Security Considerations](#security-considerations)

## Introduction

The MERN_chatai_blog API provides a comprehensive RESTful interface for managing blog content, user interactions, and administrative functions. Built with Fastify, the API follows modern web standards and provides robust authentication, rate limiting, and error handling mechanisms. This documentation covers all endpoint groups including authentication, users, posts, comments, categories, notifications, and AI functionality.

The API is organized under the `/api` prefix and uses JWT-based authentication with secure cookie storage. All endpoints return JSON responses with consistent error and success formats. The API supports both cookie-based and token-based authentication, with CSRF protection via SameSite cookie policies.

**Section sources**
- [server.ts](file://api-fastify/src/server.ts#L1-L50)
- [index.ts](file://api-fastify/src/routes/index.ts#L1-L52)

## Authentication

The authentication system uses JWT tokens stored in HTTP-only cookies for enhanced security. The API provides endpoints for user registration, login, password management, and session control. Authentication is handled through the `/api/auth` endpoint group.

### Authentication Endpoints

#### POST /api/auth/register
Registers a new user account.

**Request Body**
```json
{
  "username": "string",
  "email": "string",
  "password": "string"
}
```

**Response (201)**
```json
{
  "message": "Registration successful. Please verify your email to activate your account.",
  "user": {
    "id": "string",
    "username": "string",
    "email": "string",
    "role": "USER|AUTHOR|EDITOR|ADMIN",
    "createdAt": "string",
    "updatedAt": "string"
  }
}
```

**Error Responses**
- 400: Username or email already in use
- 500: Server error during registration

#### POST /api/auth/login
Authenticates a user and returns a JWT token.

**Request Body**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response (200)**
```json
{
  "token": "string",
  "user": {
    "id": "string",
    "username": "string",
    "email": "string",
    "role": "USER|AUTHOR|EDITOR|ADMIN"
  }
}
```

The response sets an HTTP-only cookie named `token` with the JWT. The cookie is secure in production and has a 30-day expiration.

**Error Responses**
- 401: Invalid credentials
- 500: Server error during login

#### POST /api/auth/logout
Terminates the current user session.

**Response (200)**
```json
{
  "message": "Logout successful"
}
```

This endpoint clears the authentication cookie.

#### GET /api/auth/me
Retrieves the current authenticated user's information.

**Response (200)**
```json
{
  "user": {
    "id": "string",
    "username": "string",
    "email": "string",
    "role": "USER|AUTHOR|EDITOR|ADMIN",
    "createdAt": "string",
    "updatedAt": "string"
  }
}
```

**Error Responses**
- 401: Unauthorized (no valid token)
- 404: User not found
- 500: Server error

#### POST /api/auth/forgot-password
Initiates the password reset process.

**Request Body**
```json
{
  "email": "string"
}
```

**Response (200)**
```json
{
  "message": "If an account exists with this email, a reset link has been sent."
}
```

#### POST /api/auth/reset-password
Resets the user's password using a reset token.

**Request Body**
```json
{
  "token": "string",
  "password": "string"
}
```

**Response (200)**
```json
{
  "message": "Password reset successfully. You can now log in."
}
```

#### POST /api/auth/change-password
Changes the current user's password.

**Request Body**
```json
{
  "currentPassword": "string",
  "newPassword": "string"
}
```

**Response (200)**
```json
{
  "message": "Password changed successfully"
}
```

**Section sources**
- [auth.controller.ts](file://api-fastify/src/controllers/auth.controller.ts#L1-L329)
- [auth.routes.ts](file://api-fastify/src/routes/auth.routes.ts#L1-L50)
- [auth.schema.ts](file://api-fastify/src/schemas/auth.schema.ts#L1-L100)
- [auth.types.ts](file://api-fastify/src/types/auth.types.ts#L1-L50)
- [auth.middleware.ts](file://api-fastify/src/middlewares/auth.middleware.ts#L1-L127)

## User Endpoints

The user endpoints provide functionality for user management, profile retrieval, and role-based access control. These endpoints are accessible at `/api/users` and require appropriate authentication and authorization.

### User Management Endpoints

#### GET /api/users
Retrieves a paginated list of users.

**Query Parameters**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)
- `search`: Search term for username or email

**Response (200)**
```json
{
  "users": [
    {
      "id": "string",
      "username": "string",
      "email": "string",
      "role": "USER|AUTHOR|EDITOR|ADMIN",
      "createdAt": "string",
      "updatedAt": "string"
    }
  ],
  "total": "number",
  "page": "number",
  "pages": "number",
  "limit": "number"
}
```

**Authentication**: Admin only

#### GET /api/users/{id}
Retrieves a specific user by ID.

**Response (200)**
```json
{
  "user": {
    "id": "string",
    "username": "string",
    "email": "string",
    "role": "USER|AUTHOR|EDITOR|ADMIN",
    "createdAt": "string",
    "updatedAt": "string"
  }
}
```

**Authentication**: Admin only

#### PUT /api/users/{id}
Updates a user's information.

**Request Body**
```json
{
  "username": "string",
  "email": "string",
  "role": "USER|AUTHOR|EDITOR|ADMIN"
}
```

**Response (200)**
```json
{
  "message": "User updated successfully",
  "user": {
    "id": "string",
    "username": "string",
    "email": "string",
    "role": "USER|AUTHOR|EDITOR|ADMIN",
    "createdAt": "string",
    "updatedAt": "string"
  }
}
```

**Authentication**: Admin only

#### DELETE /api/users/{id}
Deletes a user account.

**Response (200)**
```json
{
  "message": "User deleted successfully"
}
```

**Authentication**: Admin only

### User Profile Endpoints

#### GET /api/users/profile
Retrieves the current user's profile.

**Response (200)**
```json
{
  "user": {
    "id": "string",
    "username": "string",
    "email": "string",
    "role": "USER|AUTHOR|EDITOR|ADMIN",
    "createdAt": "string",
    "updatedAt": "string"
  }
}
```

**Authentication**: Required

#### PUT /api/users/profile
Updates the current user's profile.

**Request Body**
```json
{
  "username": "string",
  "email": "string"
}
```

**Response (200)**
```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": "string",
    "username": "string",
    "email": "string",
    "role": "USER|AUTHOR|EDITOR|ADMIN",
    "createdAt": "string",
    "updatedAt": "string"
  }
}
```

**Authentication**: Required

#### DELETE /api/users/profile
Deletes the current user's account.

**Response (200)**
```json
{
  "message": "User account deleted successfully"
}
```

**Authentication**: Required

#### POST /api/users/{id}/role
Changes a user's role.

**Request Body**
```json
{
  "role": "USER|AUTHOR|EDITOR|ADMIN"
}
```

**Response (200)**
```json
{
  "message": "User role changed successfully",
  "user": {
    "id": "string",
    "username": "string",
    "email": "string",
    "role": "USER|AUTHOR|EDITOR|ADMIN",
    "createdAt": "string",
    "updatedAt": "string"
  }
}
```

**Authentication**: Admin only

**Section sources**
- [user.controller.ts](file://api-fastify/src/controllers/user.controller.ts#L1-L314)
- [user.routes.ts](file://api-fastify/src/routes/user.routes.ts#L1-L50)
- [user.schema.ts](file://api-fastify/src/schemas/user.schema.ts#L1-L50)
- [user.types.ts](file://api-fastify/src/types/user.types.ts#L1-L30)

## Post Endpoints

The post endpoints provide comprehensive functionality for managing blog posts, including creation, retrieval, updating, deletion, and interaction (likes/dislikes). These endpoints are accessible at `/api/posts` and implement role-based access control.

### Post Management Endpoints

#### GET /api/posts
Retrieves a paginated list of posts with optional filtering.

**Query Parameters**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)
- `search`: Search term for title or content
- `category`: Filter by category ID
- `tag`: Filter by tag
- `author`: Filter by author ID
- `status`: Filter by status (DRAFT, PUBLISHED, ARCHIVED)

**Response (200)**
```json
{
  "posts": [
    {
      "id": "string",
      "title": "string",
      "slug": "string",
      "content": "string",
      "contentBlocks": "array",
      "excerpt": "string",
      "status": "DRAFT|PUBLISHED|ARCHIVED",
      "featured": "boolean",
      "publishedAt": "string",
      "author": {
        "id": "string",
        "username": "string",
        "role": "string"
      },
      "categories": [
        {
          "id": "string",
          "name": "string",
          "slug": "string"
        }
      ],
      "tags": ["string"],
      "likeCount": "number",
      "dislikeCount": "number",
      "viewCount": "number",
      "createdAt": "string",
      "updatedAt": "string"
    }
  ],
  "total": "number",
  "page": "number",
  "pages": "number",
  "limit": "number"
}
```

**Authentication**: Optional (some draft posts require authentication)

#### GET /api/posts/{idOrSlug}
Retrieves a specific post by ID or slug.

**Response (200)**
```json
{
  "post": {
    "id": "string",
    "title": "string",
    "slug": "string",
    "content": "string",
    "contentBlocks": "array",
    "excerpt": "string",
    "status": "DRAFT|PUBLISHED|ARCHIVED",
    "featured": "boolean",
    "publishedAt": "string",
    "author": {
      "id": "string",
      "username": "string",
      "role": "string"
    },
    "categories": [
      {
        "id": "string",
        "name": "string",
        "slug": "string"
      }
    ],
    "tags": ["string"],
    "likeCount": "number",
    "dislikeCount": "number",
    "viewCount": "number",
    "createdAt": "string",
    "updatedAt": "string"
  }
}
```

**Authentication**: Required for draft posts

#### POST /api/posts
Creates a new post.

**Request Body**
```json
{
  "title": "string",
  "content": "string",
  "contentBlocks": "array",
  "excerpt": "string",
  "status": "DRAFT|PUBLISHED",
  "featured": "boolean",
  "categories": ["string"],
  "tags": ["string"]
}
```

**Response (201)**
```json
{
  "message": "Post created successfully",
  "post": {
    "id": "string",
    "title": "string",
    "slug": "string",
    "content": "string",
    "contentBlocks": "array",
    "excerpt": "string",
    "status": "DRAFT|PUBLISHED",
    "featured": "boolean",
    "author": {
      "id": "string",
      "username": "string",
      "role": "string"
    },
    "categories": [
      {
        "id": "string",
        "name": "string",
        "slug": "string"
      }
    ],
    "tags": ["string"],
    "likeCount": "number",
    "dislikeCount": "number",
    "createdAt": "string",
    "updatedAt": "string"
  }
}
```

**Authentication**: Author, Editor, or Admin

#### PUT /api/posts/{id}
Updates an existing post.

**Request Body**
```json
{
  "title": "string",
  "content": "string",
  "contentBlocks": "array",
  "excerpt": "string",
  "status": "DRAFT|PUBLISHED|ARCHIVED",
  "featured": "boolean",
  "categories": ["string"],
  "tags": ["string"]
}
```

**Response (200)**
```json
{
  "success": "boolean",
  "message": "Post updated successfully",
  "post": {
    "id": "string",
    "title": "string",
    "slug": "string",
    "content": "string",
    "contentBlocks": "array",
    "excerpt": "string",
    "status": "DRAFT|PUBLISHED|ARCHIVED",
    "featured": "boolean",
    "publishedAt": "string",
    "author": {
      "id": "string",
      "username": "string",
      "role": "string"
    },
    "categories": [
      {
        "id": "string",
        "name": "string",
        "slug": "string"
      }
    ],
    "tags": ["string"],
    "likeCount": "number",
    "dislikeCount": "number",
    "viewCount": "number",
    "createdAt": "string",
    "updatedAt": "string"
  }
}
```

**Authentication**: Post author, Editor, or Admin

#### DELETE /api/posts/{id}
Deletes a post.

**Request Body (Optional)**
```json
{
  "soft": "boolean"
}
```

**Response (200)**
```json
{
  "message": "Post deleted successfully",
  "data": {
    "soft": "boolean",
    "deletedAt": "string"
  }
}
```

**Authentication**: Post author (soft delete), Editor, or Admin (hard delete)

### Post Interaction Endpoints

#### POST /api/posts/{id}/like
Likes a post.

**Response (200)**
```json
{
  "message": "Post liked successfully",
  "likes": ["string"],
  "dislikes": ["string"],
  "likeCount": "number",
  "dislikeCount": "number",
  "isLiked": "boolean",
  "isDisliked": "boolean"
}
```

**Authentication**: Required

#### POST /api/posts/{id}/unlike
Removes a like from a post.

**Response (200)**
```json
{
  "message": "Post unliked successfully",
  "likes": ["string"],
  "dislikes": ["string"],
  "likeCount": "number",
  "dislikeCount": "number",
  "isLiked": "boolean",
  "isDisliked": "boolean"
}
```

**Authentication**: Required

#### POST /api/posts/{id}/dislike
Dislikes a post.

**Response (200)**
```json
{
  "message": "Post disliked successfully",
  "likes": ["string"],
  "dislikes": ["string"],
  "likeCount": "number",
  "dislikeCount": "number",
  "isLiked": "boolean",
  "isDisliked": "boolean"
}
```

**Authentication**: Required

**Section sources**
- [post.controller.ts](file://api-fastify/src/controllers/post.controller.ts#L1-L482)
- [post.routes.ts](file://api-fastify/src/routes/post.routes.ts#L1-L50)
- [post.schema.ts](file://api-fastify/src/schemas/post.schema.ts#L1-L100)
- [post.types.ts](file://api-fastify/src/types/post.types.ts#L1-L50)

## Comment Endpoints

The comment endpoints provide functionality for managing comments on blog posts, including creation, retrieval, updating, deletion, and interaction (likes/dislikes). These endpoints are accessible at `/api/comments` and implement hierarchical comment structures.

### Comment Management Endpoints

#### GET /api/comments/post/{postId}
Retrieves comments for a specific post.

**Query Parameters**
- `parent`: Filter by parent comment ID (for replies)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)

**Response (200)**
```json
{
  "comments": [
    {
      "id": "string",
      "content": "string",
      "author": {
        "id": "string",
        "username": "string"
      },
      "post": "string",
      "parent": "string",
      "replies": [
        {
          "id": "string",
          "content": "string",
          "author": {
            "id": "string",
            "username": "string"
          },
          "createdAt": "string",
          "updatedAt": "string"
        }
      ],
      "likeCount": "number",
      "dislikeCount": "number",
      "createdAt": "string",
      "updatedAt": "string"
    }
  ],
  "total": "number",
  "page": "number",
  "pages": "number",
  "limit": "number"
}
```

**Authentication**: Optional

#### GET /api/comments/{id}
Retrieves a specific comment by ID.

**Response (200)**
```json
{
  "comment": {
    "id": "string",
    "content": "string",
    "author": {
      "id": "string",
      "username": "string"
    },
    "post": "string",
    "parent": "string",
    "replies": [
      {
        "id": "string",
        "content": "string",
        "author": {
          "id": "string",
          "username": "string"
        },
        "createdAt": "string",
        "updatedAt": "string"
      }
    ],
    "likeCount": "number",
    "dislikeCount": "number",
    "createdAt": "string",
    "updatedAt": "string"
  }
}
```

**Authentication**: Optional

#### POST /api/comments
Creates a new comment.

**Request Body**
```json
{
  "content": "string",
  "post": "string",
  "parent": "string"
}
```

**Response (201)**
```json
{
  "message": "Comment created successfully",
  "comment": {
    "id": "string",
    "content": "string",
    "author": {
      "id": "string",
      "username": "string"
    },
    "post": "string",
    "parent": "string",
    "replies": [],
    "likeCount": "number",
    "dislikeCount": "number",
    "createdAt": "string",
    "updatedAt": "string"
  }
}
```

**Authentication**: Required

#### PUT /api/comments/{id}
Updates an existing comment.

**Request Body**
```json
{
  "content": "string"
}
```

**Response (200)**
```json
{
  "message": "Comment updated successfully",
  "comment": {
    "id": "string",
    "content": "string",
    "author": {
      "id": "string",
      "username": "string"
    },
    "post": "string",
    "parent": "string",
    "replies": [],
    "likeCount": "number",
    "dislikeCount": "number",
    "createdAt": "string",
    "updatedAt": "string"
  }
}
```

**Authentication**: Comment author, Editor, or Admin

#### DELETE /api/comments/{id}
Deletes a comment.

**Response (200)**
```json
{
  "message": "Comment deleted successfully"
}
```

**Authentication**: Comment author, Editor, or Admin

### Comment Interaction Endpoints

#### POST /api/comments/{id}/like
Likes a comment.

**Response (200)**
```json
{
  "message": "Reaction updated successfully",
  "likes": ["string"],
  "dislikes": ["string"],
  "likeCount": "number",
  "dislikeCount": "number",
  "isLiked": "boolean",
  "isDisliked": "boolean"
}
```

**Authentication**: Required

#### POST /api/comments/{id}/unlike
Removes a like from a comment.

**Response (200)**
```json
{
  "message": "Comment unliked successfully",
  "likes": ["string"],
  "dislikes": ["string"],
  "likeCount": "number",
  "dislikeCount": "number",
  "isLiked": "boolean",
  "isDisliked": "boolean"
}
```

**Authentication**: Required

#### POST /api/comments/{id}/dislike
Dislikes a comment.

**Response (200)**
```json
{
  "message": "Reaction updated successfully",
  "likes": ["string"],
  "dislikes": ["string"],
  "likeCount": "number",
  "dislikeCount": "number",
  "isLiked": "boolean",
  "isDisliked": "boolean"
}
```

**Authentication**: Required

**Section sources**
- [comment.controller.ts](file://api-fastify/src/controllers/comment.controller.ts#L1-L485)
- [comment.routes.ts](file://api-fastify/src/routes/comment.routes.ts#L1-L50)
- [comment.schema.ts](file://api-fastify/src/schemas/comment.schema.ts#L1-L50)
- [comment.types.ts](file://api-fastify/src/types/comment.types.ts#L1-L30)

## Category Endpoints

The category endpoints provide functionality for managing blog categories. These endpoints are accessible at `/api/categories` and require appropriate authorization.

### Category Management Endpoints

#### GET /api/categories
Retrieves a list of all categories.

**Response (200)**
```json
{
  "categories": [
    {
      "id": "string",
      "name": "string",
      "slug": "string",
      "description": "string",
      "createdAt": "string",
      "updatedAt": "string"
    }
  ]
}
```

**Authentication**: Optional

#### POST /api/categories
Creates a new category.

**Request Body**
```json
{
  "name": "string",
  "description": "string"
}
```

**Response (201)**
```json
{
  "message": "Category created successfully",
  "category": {
    "id": "string",
    "name": "string",
    "slug": "string",
    "description": "string",
    "createdAt": "string",
    "updatedAt": "string"
  }
}
```

**Authentication**: Author, Editor, or Admin

#### PUT /api/categories/{id}
Updates an existing category.

**Request Body**
```json
{
  "name": "string",
  "description": "string"
}
```

**Response (200)**
```json
{
  "message": "Category updated successfully",
  "category": {
    "id": "string",
    "name": "string",
    "slug": "string",
    "description": "string",
    "createdAt": "string",
    "updatedAt": "string"
  }
}
```

**Authentication**: Editor or Admin

#### DELETE /api/categories/{id}
Deletes a category.

**Response (200)**
```json
{
  "message": "Category deleted successfully"
}
```

**Authentication**: Editor or Admin

**Section sources**
- [category.controller.ts](file://api-fastify/src/controllers/category.controller.ts#L1-L150)
- [category.routes.ts](file://api-fastify/src/routes/category.routes.ts#L1-L50)
- [category.schema.ts](file://api-fastify/src/schemas/category.schema.ts#L1-L50)
- [category.types.ts](file://api-fastify/src/types/category.types.ts#L1-L30)

## Notification Endpoints

The notification endpoints provide administrative functionality for managing system notifications. These endpoints are accessible at `/api/admin/notifications` and require admin authentication.

### Notification Management Endpoints

#### GET /api/admin/notifications
Retrieves a paginated list of admin notifications.

**Query Parameters**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 50, max: 100)
- `unreadOnly`: Filter for unread notifications only (default: false)

**Response (200)**
```json
{
  "notifications": [
    {
      "id": "string",
      "title": "string",
      "message": "string",
      "type": "INFO|WARNING|ERROR",
      "read": "boolean",
      "createdAt": "string",
      "updatedAt": "string"
    }
  ],
  "total": "number",
  "page": "number",
  "pages": "number",
  "limit": "number"
}
```

**Authentication**: Admin only

#### POST /api/admin/notifications/{id}/read
Marks a notification as read.

**Response (200)**
```json
{
  "message": "Notification marked as read successfully",
  "notification": {
    "id": "string",
    "title": "string",
    "message": "string",
    "type": "INFO|WARNING|ERROR",
    "read": "boolean",
    "createdAt": "string",
    "updatedAt": "string"
  }
}
```

**Authentication**: Admin only

#### POST /api/admin/notifications/read-all
Marks all notifications as read.

**Response (200)**
```json
{
  "message": "{count} notifications marked as read successfully",
  "modifiedCount": "number"
}
```

**Authentication**: Admin only

#### POST /api/admin/notifications/cleanup
Manually triggers cleanup of old notifications.

**Response (200)**
```json
{
  "message": "{count} old notifications deleted successfully",
  "deletedCount": "number"
}
```

**Authentication**: Admin only

#### GET /api/admin/notifications/status
Retrieves the status of the notification cleanup service.

**Response (200)**
```json
{
  "message": "Cleanup service status retrieved successfully",
  "status": {
    "enabled": "boolean",
    "interval": "number",
    "lastRun": "string",
    "nextRun": "string"
  }
}
```

**Authentication**: Admin only

**Section sources**
- [notification.controller.ts](file://api-fastify/src/controllers/notification.controller.ts#L1-L216)
- [notification.routes.ts](file://api-fastify/src/routes/notification.routes.ts#L1-L50)
- [notification.types.ts](file://api-fastify/src/types/notification.types.ts#L1-L50)

## AI Endpoints

The AI endpoints provide functionality for interacting with the chatbot AI. These endpoints are accessible at `/api/ai` and require authentication.

### AI Interaction Endpoints

#### POST /api/ai/message
Sends a message to the AI chatbot.

**Request Body**
```json
{
  "input": "string",
  "sessionId": "string"
}
```

**Response (200)**
```json
{
  "response": "string",
  "success": "boolean",
  "sessionId": "string"
}
```

**Error Responses**
- 400: Missing input or sessionId
- 429: Rate limit exceeded
- 500: Server error

**Authentication**: Required

The AI system implements rate limiting and response caching to optimize performance and reduce API costs. Responses are cached based on input content, and session history is maintained for context preservation.

**Section sources**
- [ai.controller.ts](file://api-fastify/src/controllers/ai.controller.ts#L1-L69)
- [ai.routes.ts](file://api-fastify/src/routes/ai.routes.ts#L1-L50)
- [ai.service.ts](file://api-fastify/src/services/ai.service.ts#L1-L100)

## Rate Limiting

The API implements comprehensive rate limiting to prevent abuse and ensure service availability. Rate limits are enforced through Redis-based counters and are applied differently based on endpoint type and user role.

### Rate Limiting Rules

#### Authentication Endpoints
- 10 requests per minute per IP address
- Applies to login, registration, and password reset endpoints
- Designed to prevent brute force attacks

#### Notification Endpoints
- 100 requests per minute per user
- 30 requests per minute for modification endpoints (mark as read, cleanup)
- Uses user ID as identifier when authenticated, falls back to IP address

#### AI Endpoints
- 10 requests per minute per user
- Implemented at the service level with in-memory tracking
- Prevents excessive AI API usage

#### General API Endpoints
- 100 requests per minute per user
- Applies to all GET, POST, PUT, and DELETE operations
- Uses user ID as primary identifier, IP address as fallback

### Rate Limiting Headers

All responses include rate limiting information in the headers:

- `X-RateLimit-Limit`: Maximum number of requests in the current window
- `X-RateLimit-Remaining`: Number of requests remaining in the current window
- `X-RateLimit-Reset`: Timestamp when the current window resets
- `Retry-After`: Seconds to wait before retrying after rate limit exceeded

When a rate limit is exceeded, the API returns a 429 status code with a message indicating the user should retry later.

**Section sources**
- [rate-limit.middleware.ts](file://api-fastify/src/middlewares/rate-limit.middleware.ts#L1-L91)
- [auth.middleware.ts](file://api-fastify/src/middlewares/auth.middleware.ts#L1-L127)
- [chat-cache.service.ts](file://api-fastify/src/services/chat-cache.service.ts#L1-L50)

## Error Handling

The API implements consistent error handling across all endpoints. Error responses follow a standardized format and include appropriate HTTP status codes.

### Error Response Format

```json
{
  "message": "string",
  "error": "string"
}
```

The `error` field is only included in development mode to prevent information leakage in production.

### Common Error Codes

#### 400 Bad Request
- Invalid request parameters
- Missing required fields
- Validation errors
- Invalid IDs or slugs

#### 401 Unauthorized
- Missing or invalid authentication token
- Expired session
- No authentication provided for protected endpoint

#### 403 Forbidden
- Insufficient permissions for requested operation
- Attempting to modify resources without proper authorization
- Role-based access violations

#### 404 Not Found
- Resource not found (user, post, comment, etc.)
- Invalid endpoint URL

#### 409 Conflict
- Resource state conflicts with requested operation
- Attempting to delete already deleted resource
- Duplicate resource creation

#### 429 Too Many Requests
- Rate limit exceeded
- Requires waiting before retrying

#### 500 Internal Server Error
- Unexpected server error
- Database connection issues
- Service failures

The API logs all errors with detailed context for debugging purposes while returning generic error messages to clients in production to prevent information disclosure.

**Section sources**
- [auth.controller.ts](file://api-fastify/src/controllers/auth.controller.ts#L1-L329)
- [user.controller.ts](file://api-fastify/src/controllers/user.controller.ts#L1-L314)
- [post.controller.ts](file://api-fastify/src/controllers/post.controller.ts#L1-L482)
- [error-logger.middleware.ts](file://api-fastify/src/middlewares/error-logger.middleware.ts#L1-L50)

## Client Implementation Guidelines

### Authentication Flow

```javascript
// Login example
async function login(email, password) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
    credentials: 'include' // Required for cookies
  });
  
  if (response.ok) {
    const data = await response.json();
    // Token is stored in cookie automatically
    return data.user;
  }
  
  throw new Error('Login failed');
}
```

```bash
# curl example
curl -X POST https://api.example.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}' \
  -c cookies.txt
```

### API Request Patterns

```javascript
// GET request with authentication
async function getPosts() {
  const response = await fetch('/api/posts', {
    method: 'GET',
    credentials: 'include' // Send cookies
  });
  
  if (response.ok) {
    return await response.json();
  }
  
  const error = await response.json();
  throw new Error(error.message);
}
```

```javascript
// POST request with authentication
async function createPost(postData) {
  const response = await fetch('/api/posts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(postData),
    credentials: 'include'
  });
  
  if (response.ok) {
    return await response.json();
  }
  
  const error = await response.json();
  throw new Error(error.message);
}
```

### Error Handling

```javascript
// Generic error handling
async function apiCall(url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      credentials: 'include'
    });
    
    if (response.status === 401) {
      // Handle unauthorized - redirect to login
      window.location.href = '/login';
      return;
    }
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API call failed:', error.message);
    throw error;
  }
}
```

### Performance Optimization

1. **Use query parameters** for filtering and pagination to reduce payload size
2. **Implement client-side caching** for frequently accessed resources
3. **Batch requests** when possible to reduce network overhead
4. **Handle rate limiting** by implementing exponential backoff
5. **Use conditional requests** with ETag or Last-Modified headers when supported

**Section sources**
- [auth.controller.ts](file://api-fastify/src/controllers/auth.controller.ts#L1-L329)
- [post.controller.ts](file://api-fastify/src/controllers/post.controller.ts#L1-L482)
- [comment.controller.ts](file://api-fastify/src/controllers/comment.controller.ts#L1-L485)

## Security Considerations

### Authentication Security

- JWT tokens are stored in HTTP-only, secure cookies to prevent XSS attacks
- Cookies use SameSite=lax policy to protect against CSRF attacks
- Passwords are hashed with bcrypt before storage
- Session tokens have a 30-day expiration
- Email verification is required for new accounts

### Input Validation

- All endpoints validate input data using schema validation
- String fields are sanitized to prevent XSS attacks
- Object IDs are validated for proper format
- User roles are validated on the server side for all privileged operations
- Content is sanitized before storage and rendering

### Rate Limiting

- Implemented to prevent brute force attacks on authentication endpoints
- Protects against denial of service attacks
- Limits AI API usage to control costs
- Uses Redis for distributed rate limiting in clustered environments

### Data Protection

- Sensitive operations require explicit user authentication
- Role-based access control prevents unauthorized resource access
- Soft deletion is used for posts to allow recovery
- Audit logging tracks administrative actions
- Error messages are sanitized in production to prevent information leakage

### API Security Headers

The API includes security headers in all responses:
- Content Security Policy (CSP)
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- Strict-Transport-Security (HSTS) in production

**Section sources**
- [auth.middleware.ts](file://api-fastify/src/middlewares/auth.middleware.ts#L1-L127)
- [auth.controller.ts](file://api-fastify/src/controllers/auth.controller.ts#L1-L329)
- [rate-limit.middleware.ts](file://api-fastify/src/middlewares/rate-limit.middleware.ts#L1-L91)
- [error-logger.middleware.ts](file://api-fastify/src/middlewares/error-logger.middleware.ts#L1-L50)