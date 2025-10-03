# Users API Documentation

<cite>
**Referenced Files in This Document**
- [user.routes.ts](file://api-fastify/src/routes/user.routes.ts)
- [user.controller.ts](file://api-fastify/src/controllers/user.controller.ts)
- [user.schema.ts](file://api-fastify/src/schemas/user.schema.ts)
- [user.types.ts](file://api-fastify/src/types/user.types.ts)
- [user.model.ts](file://api-fastify/src/models/user.model.ts)
- [user.service.ts](file://api-fastify/src/services/user.service.ts)
- [auth.middleware.ts](file://api-fastify/src/middlewares/auth.middleware.ts)
- [rate-limit.middleware.ts](file://api-fastify/src/middlewares/rate-limit.middleware.ts)
- [api.config.ts](file://src/config/api.config.ts)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Authentication Requirements](#authentication-requirements)
3. [Endpoint Overview](#endpoint-overview)
4. [User Profile Management](#user-profile-management)
5. [Administrative User Management](#administrative-user-management)
6. [Request/Response Schemas](#requestresponse-schemas)
7. [Security Considerations](#security-considerations)
8. [Error Responses](#error-responses)
9. [Rate Limiting](#rate-limiting)
10. [Examples](#examples)

## Introduction

The Users API provides comprehensive endpoints for user profile management within the MERN_chatAI_blog application. This API handles user authentication, profile updates, administrative user management, and account deletion. Built with Fastify framework and TypeScript, it follows RESTful principles with JWT-based authentication and role-based authorization.

The API is designed to manage user data securely while maintaining separation of concerns between user self-service capabilities and administrative functions. All endpoints require proper authentication, with additional role-based restrictions for administrative operations.

## Authentication Requirements

All user endpoints require JWT-based authentication. The authentication system uses cookies for token storage and validates tokens on each request.

### Authentication Flow

```mermaid
sequenceDiagram
participant Client as "Client Application"
participant API as "Users API"
participant Auth as "Auth Middleware"
participant DB as "Database"
Client->>API : Request with JWT Token
API->>Auth : authenticate middleware
Auth->>Auth : Verify JWT Token
Auth->>DB : Retrieve User from DB
DB-->>Auth : User Object
Auth-->>API : Authenticated User
API-->>Client : Authorized Response
Note over Client,DB : Token validation ensures<br/>user is authenticated
```

**Diagram sources**
- [auth.middleware.ts](file://api-fastify/src/middlewares/auth.middleware.ts#L10-L40)

### Authorization Rules

- **All user endpoints**: Require `authenticate` middleware
- **Administrative endpoints**: Require both `authenticate` and `isAdmin` middleware
- **User self-service**: Users can only modify their own profiles
- **Profile access**: Users can access their own profile and public user data

**Section sources**
- [auth.middleware.ts](file://api-fastify/src/middlewares/auth.middleware.ts#L10-L127)
- [user.routes.ts](file://api-fastify/src/routes/user.routes.ts#L15-L110)

## Endpoint Overview

The Users API consists of two main categories of endpoints:

### User Self-Service Endpoints
- `GET /api/users/profile` - Retrieve authenticated user profile
- `PUT /api/users/profile` - Update authenticated user profile
- `DELETE /api/users/delete-account` - Delete authenticated user account

### Administrative Endpoints
- `GET /api/users/` - List all users (admin only)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user (admin only)
- `DELETE /api/users/:id` - Delete user (admin only)
- `PATCH /api/users/:id/role` - Change user role (admin only)

```mermaid
graph TB
subgraph "User Endpoints"
A[GET /profile] --> A1[Retrieve User Profile]
B[PUT /profile] --> B1[Update User Profile]
C[DELETE /delete-account] --> C1[Delete Account]
end
subgraph "Admin Endpoints"
D[GET /] --> D1[List All Users]
E[GET /:id] --> E1[Get User by ID]
F[PUT /:id] --> F1[Update User]
G[DELETE /:id] --> G1[Delete User]
H[PATCH /:id/role] --> H1[Change Role]
end
subgraph "Authentication"
I[JWT Token] --> J[authenticate]
J --> K[isAdmin]
end
A1 --> J
B1 --> J
C1 --> J
D1 --> J
E1 --> J
F1 --> J
G1 --> J
H1 --> J
K --> D1
K --> F1
K --> G1
K --> H1
```

**Diagram sources**
- [user.routes.ts](file://api-fastify/src/routes/user.routes.ts#L15-L110)

**Section sources**
- [user.routes.ts](file://api-fastify/src/routes/user.routes.ts#L1-L110)

## User Profile Management

### GET /api/users/profile

Retrieves the authenticated user's profile information.

#### Request Headers
- `Authorization`: Bearer token (optional, falls back to cookie)
- `Cookie`: Contains JWT token

#### Response Format
```json
{
  "user": {
    "_id": "string",
    "username": "string",
    "email": "string",
    "firstName": "string|null",
    "lastName": "string|null",
    "profilePicture": "string|null",
    "bio": "string|null",
    "role": "string",
    "isVerified": "boolean",
    "createdAt": "string (ISO date)",
    "updatedAt": "string (ISO date)"
  }
}
```

#### Security Features
- Validates JWT token
- Returns only non-sensitive user data
- Filters out password, verification tokens, and reset tokens

### PUT /api/users/profile

Updates the authenticated user's profile information.

#### Request Body
```json
{
  "username": "string (3-30 chars, unique)",
  "firstName": "string",
  "lastName": "string",
  "profilePicture": "string (URL)",
  "bio": "string (max 500 chars)"
}
```

#### Validation Rules
- **Username**: Required, min 3 chars, max 30 chars, unique across users
- **First Name**: Optional string
- **Last Name**: Optional string
- **Profile Picture**: Optional URL string
- **Bio**: Optional, max 500 characters

#### Security Features
- Validates username uniqueness
- Prevents duplicate usernames
- Only allows updates to authenticated user's own profile

### DELETE /api/users/delete-account

Deletes the authenticated user's account permanently.

#### Security Features
- Confirms user ownership
- Prevents accidental deletions
- Triggers cleanup of associated data (TODO)

**Section sources**
- [user.controller.ts](file://api-fastify/src/controllers/user.controller.ts#L215-L315)
- [user.schema.ts](file://api-fastify/src/schemas/user.schema.ts#L1-L285)
- [user.service.ts](file://api-fastify/src/services/user.service.ts#L150-L239)

## Administrative User Management

### GET /api/users/

Lists all users with pagination and search capabilities (admin only).

#### Query Parameters
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `search`: Search term for username, email, firstName, lastName

#### Response Format
```json
{
  "users": [
    {
      "_id": "string",
      "username": "string",
      "email": "string",
      "firstName": "string|null",
      "lastName": "string|null",
      "profilePicture": "string|null",
      "bio": "string|null",
      "role": "string",
      "isVerified": "boolean",
      "createdAt": "string (ISO date)",
      "updatedAt": "string (ISO date)"
    }
  ],
  "total": "number",
  "page": "number",
  "limit": "number",
  "totalPages": "number"
}
```

### GET /api/users/:id

Retrieves a specific user by ID.

#### Path Parameters
- `id`: MongoDB ObjectId of the user

#### Security Features
- Requires authentication
- Validates user existence
- Returns filtered user data

### PUT /api/users/:id

Updates a user's information (admin only).

#### Path Parameters
- `id`: MongoDB ObjectId of the user

#### Request Body
Same as profile update endpoint.

#### Security Features
- Admin-only access
- Validates user ownership permissions
- Prevents unauthorized modifications

### DELETE /api/users/:id

Deletes a user account (admin only).

#### Path Parameters
- `id`: MongoDB ObjectId of the user

#### Security Features
- Prevents deletion of last admin
- Validates user existence
- Admin-only operation

### PATCH /api/users/:id/role

Changes a user's role (admin only).

#### Path Parameters
- `id`: MongoDB ObjectId of the user

#### Request Body
```json
{
  "role": "string (user|admin|editor|author)"
}
```

#### Security Features
- Prevents demotion of last admin
- Validates role values
- Admin-only operation

**Section sources**
- [user.controller.ts](file://api-fastify/src/controllers/user.controller.ts#L1-L214)
- [user.service.ts](file://api-fastify/src/services/user.service.ts#L1-L239)

## Request/Response Schemas

### User Model Schema

The user model defines the structure of user data stored in MongoDB:

```typescript
interface IUser {
  username: string;        // Required, unique, 3-30 chars
  email: string;           // Required, unique, valid format
  password: string;        // Required, hashed
  firstName?: string;      // Optional
  lastName?: string;       // Optional
  profilePicture?: string; // Optional URL
  bio?: string;           // Optional, max 500 chars
  role: UserRole;         // user|admin|editor|author
  isVerified: boolean;    // Verification status
  verificationToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### Role-Based Access Control

```mermaid
graph LR
subgraph "User Roles"
A[USER] --> A1[Basic Access]
B[ADMIN] --> B1[Full Access]
C[EDITOR] --> C1[Content Management]
D[AUTHOR] --> D1[Content Creation]
end
subgraph "Endpoints"
E[GET /profile] --> A1
F[PUT /profile] --> A1
G[GET /users/] --> B1
H[PUT /users/:id] --> B1
I[PATCH /users/:id/role] --> B1
end
```

**Diagram sources**
- [user.types.ts](file://api-fastify/src/types/user.types.ts#L5-L15)

**Section sources**
- [user.model.ts](file://api-fastify/src/models/user.model.ts#L1-L97)
- [user.types.ts](file://api-fastify/src/types/user.types.ts#L1-L59)

## Security Considerations

### Password Protection

The user model automatically hashes passwords using bcrypt with salt rounds of 10. Password comparison is handled through the `comparePassword` method.

### Data Filtering

Sensitive fields are automatically removed from responses:
- Password hashes
- Verification tokens
- Reset password tokens
- Reset password expiration dates

### Username Uniqueness

The API enforces username uniqueness across all users. When updating a username, the system checks for conflicts and prevents duplicate registrations.

### Role-Based Restrictions

- **User self-service**: Users can only modify their own profiles
- **Administrative access**: Only users with ADMIN role can access admin endpoints
- **Permission validation**: Each request validates user permissions against the requested resource

### Token Validation

JWT tokens are validated on each request with automatic refresh capabilities and secure token storage in cookies.

**Section sources**
- [user.model.ts](file://api-fastify/src/models/user.model.ts#L55-L97)
- [user.service.ts](file://api-fastify/src/services/user.service.ts#L50-L100)

## Error Responses

### Common Error Codes

| Status Code | Description | Scenario |
|-------------|-------------|----------|
| 400 | Bad Request | Invalid input data, duplicate username |
| 401 | Unauthorized | Missing or invalid JWT token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | User not found |
| 500 | Internal Server Error | Server-side error |

### Error Response Format

```json
{
  "message": "Descriptive error message",
  "error": "Optional error details"
}
```

### Specific Error Scenarios

#### Username Already Exists
```json
{
  "message": "Ce nom d'utilisateur est déjà utilisé"
}
```

#### Invalid User ID
```json
{
  "message": "ID utilisateur invalide"
}
```

#### Unauthorized Access
```json
{
  "message": "Vous n'êtes pas autorisé à mettre à jour cet utilisateur"
}
```

#### Last Admin Prevention
```json
{
  "message": "Impossible de supprimer le dernier administrateur"
}
```

**Section sources**
- [user.controller.ts](file://api-fastify/src/controllers/user.controller.ts#L1-L315)
- [user.service.ts](file://api-fastify/src/services/user.service.ts#L1-L239)

## Rate Limiting

The API implements sophisticated rate limiting to prevent abuse and ensure fair usage:

### Rate Limiting Configuration

```typescript
// General rate limiting (100 requests per minute)
const generalRateLimit = createRateLimitMiddleware({
  windowMs: 60 * 1000,
  maxRequests: 100,
  keyGenerator: (request) => request.user?._id || request.ip
});

// Strict rate limiting for modifications (30 requests per minute)
const modifyRateLimit = createRateLimitMiddleware({
  windowMs: 60 * 1000,
  maxRequests: 30,
  keyGenerator: (request) => request.user?._id || request.ip
});
```

### Rate Limit Headers

When rate limits are exceeded, the API returns the following headers:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining in current window
- `X-RateLimit-Reset`: Unix timestamp when limit resets
- `Retry-After`: Seconds until rate limit resets

### Rate Limiting Scope

- **Public endpoints**: IP-based rate limiting
- **Authenticated endpoints**: User ID-based rate limiting
- **Modification endpoints**: Stricter limits to prevent abuse
- **Failed requests**: Configurable whether to count failed requests

**Section sources**
- [rate-limit.middleware.ts](file://api-fastify/src/middlewares/rate-limit.middleware.ts#L1-L91)

## Examples

### Example 1: Retrieving User Profile

```bash
curl -X GET "http://localhost:4200/api/users/profile" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Cookie: token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response:**
```json
{
  "user": {
    "_id": "654321abcdef654321abcdef",
    "username": "john_doe",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "profilePicture": "https://example.com/uploads/avatar.jpg",
    "bio": "Software developer and tech enthusiast",
    "role": "user",
    "isVerified": true,
    "createdAt": "2023-10-01T10:00:00.000Z",
    "updatedAt": "2023-10-15T14:30:00.000Z"
  }
}
```

### Example 2: Updating User Profile

```bash
curl -X PUT "http://localhost:4200/api/users/profile" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe_new",
    "firstName": "Johnny",
    "lastName": "Doe",
    "profilePicture": "https://example.com/uploads/new-avatar.jpg",
    "bio": "Updated bio with new information"
  }'
```

**Response:**
```json
{
  "message": "Profil mis à jour avec succès",
  "user": {
    "_id": "654321abcdef654321abcdef",
    "username": "john_doe_new",
    "email": "john@example.com",
    "firstName": "Johnny",
    "lastName": "Doe",
    "profilePicture": "https://example.com/uploads/new-avatar.jpg",
    "bio": "Updated bio with new information",
    "role": "user",
    "isVerified": true,
    "createdAt": "2023-10-01T10:00:00.000Z",
    "updatedAt": "2023-10-15T15:00:00.000Z"
  }
}
```

### Example 3: Listing Users (Admin)

```bash
curl -X GET "http://localhost:4200/api/users?page=1&limit=10&search=john" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response:**
```json
{
  "users": [
    {
      "_id": "654321abcdef654321abcdef",
      "username": "john_doe",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user",
      "isVerified": true,
      "createdAt": "2023-10-01T10:00:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

### Example 4: Changing User Role (Admin)

```bash
curl -X PATCH "http://localhost:4200/api/users/654321abcdef654321abcdef/role" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{"role": "admin"}'
```

**Response:**
```json
{
  "message": "Rôle de l'utilisateur modifié avec succès",
  "user": {
    "_id": "654321abcdef654321abcdef",
    "username": "john_doe",
    "email": "john@example.com",
    "role": "admin"
  }
}
```

**Section sources**
- [api.config.ts](file://src/config/api.config.ts#L25-L45)
- [user.routes.ts](file://api-fastify/src/routes/user.routes.ts#L15-L110)