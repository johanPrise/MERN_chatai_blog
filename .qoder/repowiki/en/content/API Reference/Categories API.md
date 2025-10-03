# Categories API Documentation

<cite>
**Referenced Files in This Document**
- [category.routes.ts](file://api-fastify/src/routes/category.routes.ts)
- [category.controller.ts](file://api-fastify/src/controllers/category.controller.ts)
- [category.schema.ts](file://api-fastify/src/schemas/category.schema.ts)
- [category.types.ts](file://api-fastify/src/types/category.types.ts)
- [category.service.ts](file://api-fastify/src/services/category.service.ts)
- [category.model.ts](file://api-fastify/src/models/category.model.ts)
- [auth.middleware.ts](file://api-fastify/src/middlewares/auth.middleware.ts)
- [user.types.ts](file://api-fastify/src/types/user.types.ts)
- [post.model.ts](file://api-fastify/src/models/post.model.ts)
- [createCategory.tsx](file://src/pages/createCategory.tsx)
- [DelCategory.tsx](file://src/pages/DelCategory.tsx)
- [api.config.ts](file://src/config/api.config.ts)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Authentication and Authorization](#authentication-and-authorization)
3. [API Endpoints](#api-endpoints)
4. [Request/Response Schemas](#requestresponse-schemas)
5. [Error Handling](#error-handling)
6. [Category Model](#category-model)
7. [Relationship with Posts](#relationship-with-posts)
8. [Frontend Integration](#frontend-integration)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)

## Introduction

The Categories API provides comprehensive endpoints for managing blog categories in the MERN_chatai_blog application. This API enables CRUD operations for categories with hierarchical support, validation rules, and role-based access control. Categories are essential for organizing blog posts and providing structured content navigation.

The API follows RESTful principles and implements JWT-based authentication with role-based access control. Only users with AUTHOR, EDITOR, or ADMIN roles can modify categories, while all authenticated users can view them.

## Authentication and Authorization

### JWT Token Requirement

All category management endpoints require a valid JWT token in either cookies or Authorization header:

```http
Authorization: Bearer <jwt_token>
```

### Role-Based Access Control

The API implements strict role-based access control:

- **GET endpoints**: Available to all authenticated users
- **POST/PUT/DELETE endpoints**: Restricted to ADMIN, EDITOR, or AUTHOR roles

### Authentication Middleware

```typescript
// Authentication middleware checks for valid JWT token
await request.jwtVerify();

// Role verification middleware
if (!user || user.role !== UserRole.ADMIN) {
  return reply.status(403).send({ 
    message: 'Accès refusé - Droits d\'administrateur requis' 
  });
}
```

**Section sources**
- [auth.middleware.ts](file://api-fastify/src/middlewares/auth.middleware.ts#L1-L128)
- [user.types.ts](file://api-fastify/src/types/user.types.ts#L1-L59)

## API Endpoints

### GET /categories

**Description**: Retrieve all categories with their associated post counts

**Method**: GET  
**URL**: `/api/categories`  
**Authentication**: Required  
**Roles**: AUTHOR, EDITOR, ADMIN  

**Response Format**:
```json
{
  "categories": [
    {
      "_id": "string",
      "name": "string",
      "slug": "string",
      "description": "string|null",
      "image": "string|null",
      "parent": "string|null",
      "postCount": number,
      "createdAt": "date-time",
      "updatedAt": "date-time"
    }
  ]
}
```

**Example Request**:
```bash
curl -H "Authorization: Bearer <token>" \
     https://api.example.com/api/categories
```

**Example Response**:
```json
{
  "categories": [
    {
      "_id": "651234567890abcdef123456",
      "name": "Technology",
      "slug": "technology",
      "description": "Latest tech news and trends",
      "image": "/uploads/tech-category.jpg",
      "parent": null,
      "postCount": 15,
      "createdAt": "2023-09-15T10:30:00Z",
      "updatedAt": "2023-09-15T10:30:00Z"
    }
  ]
}
```

### GET /categories/:idOrSlug

**Description**: Retrieve a specific category by ID or slug

**Method**: GET  
**URL**: `/api/categories/{idOrSlug}`  
**Authentication**: Required  
**Roles**: AUTHOR, EDITOR, ADMIN  

**Parameters**:
- `idOrSlug` (string): Category ID or slug

**Response Format**:
```json
{
  "category": {
    "_id": "string",
    "name": "string",
    "slug": "string",
    "description": "string|null",
    "image": "string|null",
    "parent": {
      "_id": "string",
      "name": "string",
      "slug": "string"
    } | null,
    "postCount": number,
    "createdAt": "date-time",
    "updatedAt": "date-time"
  }
}
```

**Example Request**:
```bash
curl -H "Authorization: Bearer <token>" \
     https://api.example.com/api/categories/technology
```

### POST /categories

**Description**: Create a new category

**Method**: POST  
**URL**: `/api/categories`  
**Authentication**: Required  
**Roles**: ADMIN, EDITOR, AUTHOR  

**Request Body**:
```json
{
  "name": "string (required, 2-50 chars)",
  "description": "string (optional, max 500 chars)",
  "image": "string (optional)",
  "parent": "string (optional, parent category ID)"
}
```

**Response Format**:
```json
{
  "message": "Catégorie créée avec succès",
  "category": {
    "_id": "string",
    "name": "string",
    "slug": "string"
  }
}
```

**Example Request**:
```bash
curl -X POST \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"name": "Programming", "description": "Coding tutorials and resources"}' \
     https://api.example.com/api/categories
```

**Example Response**:
```json
{
  "message": "Catégorie créée avec succès",
  "category": {
    "_id": "651234567890abcdef123457",
    "name": "Programming",
    "slug": "programming"
  }
}
```

### PUT /categories/:id

**Description**: Update an existing category

**Method**: PUT  
**URL**: `/api/categories/{id}`  
**Authentication**: Required  
**Roles**: ADMIN, EDITOR, AUTHOR  

**Parameters**:
- `id` (string): Category ID

**Request Body**:
```json
{
  "name": "string (optional, 2-50 chars)",
  "description": "string (optional, max 500 chars)",
  "image": "string (optional)",
  "parent": "string (optional, parent category ID)"
}
```

**Response Format**:
```json
{
  "message": "Catégorie mise à jour avec succès",
  "category": {
    "_id": "string",
    "name": "string",
    "slug": "string"
  }
}
```

**Example Request**:
```bash
curl -X PUT \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"name": "Updated Programming", "description": "Updated description"}' \
     https://api.example.com/api/categories/651234567890abcdef123457
```

### DELETE /categories/:id

**Description**: Delete a category

**Method**: DELETE  
**URL**: `/api/categories/{id}`  
**Authentication**: Required  
**Roles**: ADMIN, EDITOR, AUTHOR  

**Parameters**:
- `id` (string): Category ID

**Response Format**:
```json
{
  "message": "Catégorie supprimée avec succès"
}
```

**Example Request**:
```bash
curl -X DELETE \
     -H "Authorization: Bearer <token>" \
     https://api.example.com/api/categories/651234567890abcdef123457
```

**Section sources**
- [category.routes.ts](file://api-fastify/src/routes/category.routes.ts#L1-L75)
- [category.controller.ts](file://api-fastify/src/controllers/category.controller.ts#L1-L235)

## Request/Response Schemas

### Validation Rules

The API implements comprehensive validation rules for category data:

#### Category Creation Schema
```typescript
{
  name: { type: 'string', minLength: 2, maxLength: 50 },
  description: { type: 'string', maxLength: 500 },
  image: { type: 'string' },
  parent: { type: 'string' }
}
```

#### Category Update Schema
```typescript
{
  name: { type: 'string', minLength: 2, maxLength: 50 },
  description: { type: 'string', maxLength: 500 },
  image: { type: 'string' },
  parent: { type: 'string' }
}
```

### Response Structures

#### Category List Response
```typescript
interface CategoryResponse {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parent?: {
    _id: string;
    name: string;
    slug: string;
  } | null;
  postCount: number;
  createdAt: string;
  updatedAt: string;
}
```

#### Individual Category Response
```typescript
interface CategoryDetailResponse {
  category: CategoryResponse & {
    parent: {
      _id: string;
      name: string;
      slug: string;
    } | null;
  };
}
```

**Section sources**
- [category.schema.ts](file://api-fastify/src/schemas/category.schema.ts#L1-L202)
- [category.types.ts](file://api-fastify/src/types/category.types.ts#L1-L38)

## Error Handling

### HTTP Status Codes

The API uses standard HTTP status codes with specific error messages:

| Status Code | Error Type | Description |
|-------------|------------|-------------|
| 200 | Success | Operation completed successfully |
| 400 | Bad Request | Invalid input data or validation errors |
| 401 | Unauthorized | Missing or invalid JWT token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Category not found |
| 500 | Internal Server Error | Unexpected server error |

### Specific Error Messages

#### Category Creation Errors
- `"Une catégorie avec ce nom existe déjà"` - Duplicate category name
- `"ID de catégorie parent invalide"` - Invalid parent category ID
- `"Catégorie parent non trouvée"` - Parent category not found

#### Category Update Errors
- `"ID catégorie invalide"` - Invalid category ID
- `"Catégorie non trouvée"` - Category not found
- `"Une catégorie ne peut pas être son propre parent"` - Self-reference error
- `"Référence circulaire détectée dans la hiérarchie des catégories"` - Circular reference detected

#### Category Deletion Errors
- `"Impossible de supprimer une catégorie qui a des sous-catégories"` - Cannot delete category with children
- `"Impossible de supprimer une catégorie utilisée par des articles"` - Cannot delete category with posts

### Error Response Format
```json
{
  "message": "Specific error description"
}
```

**Section sources**
- [category.controller.ts](file://api-fastify/src/controllers/category.controller.ts#L60-L120)
- [category.controller.ts](file://api-fastify/src/controllers/category.controller.ts#L120-L180)
- [category.controller.ts](file://api-fastify/src/controllers/category.controller.ts#L180-L235)

## Category Model

### Database Schema

The category model implements a hierarchical structure with MongoDB:

```typescript
interface ICategory extends Document {
  name: string;           // Unique, required, 2-50 chars
  slug: string;          // Generated from name, unique, lowercase
  description?: string;  // Optional, max 500 chars
  image?: string;        // Optional image URL
  parent?: ICategory['_id']; // Reference to parent category
  createdAt: Date;
  updatedAt: Date;
}
```

### Validation Rules

The MongoDB schema enforces strict validation:

```typescript
const categorySchema = new Schema<ICategory>({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    minlength: 2,
    maxlength: 50,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500,
  },
  image: {
    type: String,
  },
  parent: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
  },
});
```

### Hierarchical Support

Categories support hierarchical organization through the parent field, enabling:
- Nested categories for better organization
- Tree-like structures for complex categorization
- Automatic slug generation and validation

**Section sources**
- [category.model.ts](file://api-fastify/src/models/category.model.ts#L1-L45)
- [category.types.ts](file://api-fastify/src/types/category.types.ts#L1-L38)

## Relationship with Posts

### Category-Post Association

Categories are linked to posts through a many-to-many relationship:

```typescript
// In Post model
categories: [
  {
    type: Schema.Types.ObjectId,
    ref: 'Category',
  },
],
```

### Validation Rules

The API enforces several validation rules for category-post relationships:

1. **Category Existence**: All referenced categories must exist
2. **Post Count Tracking**: Automatic counting of posts per category
3. **Deletion Protection**: Categories cannot be deleted if used by posts
4. **Hierarchical Integrity**: Prevents circular references in category hierarchy

### Service Implementation

```typescript
// Get categories with post counts
const categoriesWithPostCount = await Promise.all(
  categories.map(async (category) => {
    const postCount = await Post.countDocuments({
      categories: category._id,
      status: PostStatus.PUBLISHED,
    });
    
    return {
      ...category.toObject(),
      postCount,
    };
  })
);
```

**Section sources**
- [post.model.ts](file://api-fastify/src/models/post.model.ts#L40-L50)
- [category.service.ts](file://api-fastify/src/services/category.service.ts#L15-L40)

## Frontend Integration

### React Components

The frontend provides dedicated components for category management:

#### Create Category Component
```typescript
interface CategoryFormData {
  name: string;
  description: string;
}

// Form submission handler
const handleSubmit = async (e: React.FormEvent) => {
  const response = await fetch(API_ENDPOINTS.categories.list, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formData),
    credentials: "include",
  });
};
```

#### Delete Categories Component
```typescript
// Bulk deletion with confirmation
const handleDelete = async () => {
  const results = await Promise.all(
    selectedCategories.map(async (categoryId) => {
      const response = await fetch(
        `${API_ENDPOINTS.categories.list}/${categoryId}`,
        { method: "DELETE", credentials: "include" }
      );
      return response.json();
    })
  );
};
```

### API Configuration

The frontend uses centralized API configuration:

```typescript
export const API_ENDPOINTS = {
  categories: {
    list: `${API_BASE_URL}/categories`,
    detail: (idOrSlug: string) => `${API_BASE_URL}/categories/${idOrSlug}`,
  },
};
```

### User Permission Checking

Frontend components verify user permissions before rendering:

```typescript
const checkAuthorAdminStatus = async () => {
  const response = await fetch(API_ENDPOINTS.auth.checkAuthor, {
    credentials: "include",
  });
  
  if (!response.ok) {
    throw new Error("Failed to verify permissions");
  }
  
  const data = await response.json();
  setIsAuthorOrAdmin(data.isAuthorOrAdmin);
};
```

**Section sources**
- [createCategory.tsx](file://src/pages/createCategory.tsx#L1-L280)
- [DelCategory.tsx](file://src/pages/DelCategory.tsx#L1-L427)
- [api.config.ts](file://src/config/api.config.ts#L1-L199)

## Best Practices

### Category Naming Conventions

1. **Unique Names**: Each category name must be unique across the system
2. **Descriptive Names**: Use clear, descriptive names for better user experience
3. **Length Limits**: Maximum 50 characters for names, 500 for descriptions
4. **Slug Generation**: Automatic slug generation prevents URL conflicts

### Hierarchical Organization

1. **Logical Structure**: Organize categories in a logical hierarchy
2. **Avoid Deep Nesting**: Limit depth to prevent confusion
3. **Parent Validation**: Ensure parent categories exist before assignment
4. **Circular Reference Prevention**: Automatic detection and prevention

### Performance Optimization

1. **Index Usage**: Proper indexing on category fields
2. **Post Count Caching**: Efficient post count calculation
3. **Population Strategies**: Use selective population for related data
4. **Validation Early**: Perform validation before database operations

### Security Considerations

1. **Role Verification**: Strict role-based access control
2. **Input Sanitization**: Comprehensive input validation
3. **Permission Checks**: Verify permissions before operations
4. **Audit Trails**: Log category modification activities

## Troubleshooting

### Common Issues

#### Authentication Problems
- **Symptom**: 401 Unauthorized responses
- **Solution**: Verify JWT token is present and valid
- **Check**: Token expiration and signing key configuration

#### Permission Denied
- **Symptom**: 403 Forbidden responses
- **Solution**: Verify user role is AUTHOR, EDITOR, or ADMIN
- **Check**: User account permissions and role assignments

#### Category Not Found
- **Symptom**: 404 Not Found responses
- **Solution**: Verify category ID or slug exists
- **Check**: Case sensitivity and spelling errors

#### Duplicate Category Name
- **Symptom**: 400 Bad Request with duplicate message
- **Solution**: Use unique category names
- **Check**: Existing categories with similar names

#### Circular Reference Detected
- **Symptom**: 400 Bad Request with circular reference message
- **Solution**: Avoid setting categories as their own parents
- **Check**: Category hierarchy before updates

### Debugging Steps

1. **Verify Authentication**: Test with valid JWT token
2. **Check Permissions**: Confirm user role allows operation
3. **Validate Input**: Ensure data meets validation criteria
4. **Test Dependencies**: Verify parent categories exist
5. **Review Logs**: Check server logs for detailed error messages

### API Testing

#### Using cURL
```bash
# Test category creation
curl -X POST \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"name": "Test Category", "description": "Test description"}' \
     https://api.example.com/api/categories

# Test category retrieval
curl -H "Authorization: Bearer <token>" \
     https://api.example.com/api/categories
```

#### Using Postman
1. Set Authorization header with Bearer token
2. Configure appropriate HTTP method and endpoint
3. Add request body for POST/PUT operations
4. Review response status and body

**Section sources**
- [category.controller.ts](file://api-fastify/src/controllers/category.controller.ts#L60-L120)
- [category.controller.ts](file://api-fastify/src/controllers/category.controller.ts#L120-L180)
- [category.controller.ts](file://api-fastify/src/controllers/category.controller.ts#L180-L235)