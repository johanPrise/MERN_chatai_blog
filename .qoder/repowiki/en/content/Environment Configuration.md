# Environment Configuration

<cite>
**Referenced Files in This Document**   
- [api.config.ts](file://src/config/api.config.ts)
- [database.ts](file://api-fastify/src/config/database.ts)
- [index.ts](file://api-fastify/src/index.ts)
- [.env.example](file://.env.example)
- [api-fastify/.env.example](file://api-fastify/.env.example)
- [vite.config.js](file://vite.config.js)
- [server.ts](file://api-fastify/src/server.ts)
- [cache.service.ts](file://api-fastify/src/services/cache.service.ts)
- [email.service.ts](file://api-fastify/src/services/email.service.ts)
- [ai.service.ts](file://api-fastify/src/services/ai.service.ts)
</cite>

## Table of Contents
1. [Configuration System Overview](#configuration-system-overview)
2. [Frontend Configuration](#frontend-configuration)
3. [Backend Configuration](#backend-configuration)
4. [Environment Variables](#environment-variables)
5. [Database Configuration](#database-configuration)
6. [Service-Specific Configurations](#service-specific-configurations)
7. [Configuration Loading and Access](#configuration-loading-and-access)
8. [Security Considerations](#security-considerations)
9. [Configuration Best Practices](#configuration-best-practices)
10. [Troubleshooting Common Issues](#troubleshooting-common-issues)

## Configuration System Overview

The MERN_chatai_blog application implements a comprehensive configuration system that manages environment-specific settings for both frontend and backend components. The configuration system is designed to support multiple environments (development, staging, production) while maintaining security and flexibility. The architecture separates frontend and backend configuration concerns, with the frontend using Vite's environment variable system and the backend utilizing dotenv for configuration management.

The configuration system enables the application to adapt to different deployment environments without code changes, supporting local development, staging, and production deployments. It handles critical aspects such as API endpoint routing, database connections, authentication secrets, and third-party service integrations.

**Section sources**
- [api.config.ts](file://src/config/api.config.ts)
- [index.ts](file://api-fastify/src/index.ts)
- [vite.config.js](file://vite.config.js)

## Frontend Configuration

The frontend configuration is managed through Vite's environment variable system, with configuration values defined in environment files and accessed via the `import.meta.env` object. The primary configuration file for the frontend is `src/config/api.config.ts`, which defines API endpoints and base URLs for various services.

The frontend uses two key environment variables:
- `VITE_API_URL`: Specifies the base URL for API requests
- `VITE_IMAGE_BASE_URL`: Defines the base URL for serving static assets like images

When not explicitly set, these variables default to appropriate values for local development. The configuration system includes a proxy setup in `vite.config.js` that redirects API requests from `/api` to `http://localhost:4200`, enabling seamless development without CORS issues.

The API configuration exports a comprehensive set of endpoints organized by functionality (authentication, users, posts, comments, categories, uploads, AI, and content), making it easy for components to access the appropriate endpoints without hardcoding URLs.

```mermaid
flowchart TD
A["Frontend Application"] --> B["import.meta.env"]
B --> C["VITE_API_URL"]
B --> D["VITE_IMAGE_BASE_URL"]
C --> E["API Endpoint Configuration"]
D --> F["Image URL Generation"]
E --> G["HTTP Requests to Backend"]
F --> H["Image Display and Validation"]
I["vite.config.js"] --> J["Proxy Configuration"]
J --> K["/api → http://localhost:4200"]
```

**Diagram sources**
- [api.config.ts](file://src/config/api.config.ts)
- [vite.config.js](file://vite.config.js)

**Section sources**
- [api.config.ts](file://src/config/api.config.ts)
- [vite.config.js](file://vite.config.js)
- [vite-env.d.ts](file://vite-env.d.ts)

## Backend Configuration

The backend configuration system is implemented in the `api-fastify` directory and follows Node.js best practices for environment management. The backend uses the `dotenv` package to load environment variables from `.env` files, with configuration values accessed through `process.env`.

The main entry point `src/index.ts` loads environment variables and configures the server port, while `src/server.ts` uses environment variables to configure various aspects of the application including CORS, JWT authentication, and logging. The backend configuration supports different behavior based on the `NODE_ENV` environment variable, enabling different settings for development, staging, and production environments.

Key configuration aspects include:
- Server port configuration via the `PORT` environment variable
- API prefix customization through `API_PREFIX`
- Application URL specification with `APP_URL`
- Environment-specific behavior based on `NODE_ENV`

The configuration system is initialized in `src/index.ts` where the `config()` function from the `dotenv` package loads environment variables before the server is built and started.

```mermaid
flowchart TD
A["Backend Application"] --> B["dotenv.config()"]
B --> C["Load .env Variables"]
C --> D["process.env"]
D --> E["Server Configuration"]
D --> F["Database Connection"]
D --> G["JWT Settings"]
D --> H["Email Configuration"]
D --> I["AI Service Settings"]
D --> J["Redis Configuration"]
E --> K["Fastify Server"]
F --> L["MongoDB Connection"]
G --> M["Authentication"]
H --> N["Email Service"]
I --> O["AI Integration"]
J --> P["Caching"]
```

**Diagram sources**
- [index.ts](file://api-fastify/src/index.ts)
- [server.ts](file://api-fastify/src/server.ts)
- [database.ts](file://api-fastify/src/config/database.ts)

**Section sources**
- [index.ts](file://api-fastify/src/index.ts)
- [server.ts](file://api-fastify/src/server.ts)
- [package.json](file://api-fastify/package.json)

## Environment Variables

The MERN_chatai_blog application uses a comprehensive set of environment variables to configure behavior across different environments. These variables are defined in `.env.example` files for both frontend and backend, providing a template for setting up the application.

### Frontend Environment Variables

The frontend application uses Vite's environment variable system, where variables prefixed with `VITE_` are exposed to the client-side code:

- `VITE_API_URL`: Base URL for API requests (default: `http://localhost:4200/api`)
- `VITE_APP_NAME`: Application name (default: `MERN Blog`)
- `VITE_APP_DESCRIPTION`: Application description (default: `Blog avec fonctionnalités de chat IA`)

### Backend Environment Variables

The backend application uses a more extensive set of environment variables:

#### Database Configuration
- `MONGODB_URI`: MongoDB connection string (default: `mongodb://localhost:27017/mern_blog`)
- `DB_NAME`: Database name (default: `mern_blog`)

#### Server Configuration
- `PORT`: Server port (default: `4200`)
- `NODE_ENV`: Node environment (default: `development`)
- `API_PREFIX`: API URL prefix (default: `/api/v1`)
- `APP_URL`: Frontend application URL (default: `http://localhost:5173`)

#### Authentication Configuration
- `JWT_SECRET`: Secret key for JWT token signing (default: `your_jwt_secret_key`)
- `JWT_EXPIRES_IN`: JWT token expiration time (default: `30d`)

#### Email Configuration
- `EMAIL_HOST`: SMTP server host
- `EMAIL_PORT`: SMTP server port (default: `587`)
- `EMAIL_USER`: SMTP username
- `EMAIL_PASS`: SMTP password
- `EMAIL_FROM`: Sender email address
- `EMAIL_SECURE`: Whether to use secure connection (default: `false`)

#### AI Service Configuration
- `AI_API_KEY`: API key for AI service
- `AI_API_URL`: Base URL for AI API
- `QWEN_PROMPT`: System prompt for Qwen AI model (default: `Tu es un assistant utile et amical pour un blog sur la technologie et l'IA.`)

#### Caching Configuration
- `REDIS_URL`: Redis connection URL (default: `redis://localhost:6379`)

**Section sources**
- [.env.example](file://.env.example)
- [api-fastify/.env.example](file://api-fastify/.env.example)
- [vite.config.js](file://vite.config.js)
- [server.ts](file://api-fastify/src/server.ts)

## Database Configuration

The database configuration for MERN_chatai_blog is centered around MongoDB, with connection management handled through Mongoose. The primary configuration file is `api-fastify/src/config/database.ts`, which exports a `connectDB` function responsible for establishing the database connection.

The connection string is configured through the `MONGODB_URI` environment variable, with a default value of `mongodb://localhost:27017/mern_blog` for local development. This design allows easy switching between different MongoDB instances for various environments (development, staging, production) without code changes.

The database connection is established when the server starts, with proper error handling that logs connection errors and exits the process if the connection fails. This ensures that the application doesn't run in an inconsistent state with a failed database connection.

```mermaid
flowchart TD
A["Application Start"] --> B["Read MONGODB_URI from process.env"]
B --> C{"MONGODB_URI Exists?"}
C --> |Yes| D["Connect to MongoDB"]
C --> |No| E["Use Default: mongodb://localhost:27017/mern_blog"]
E --> D
D --> F{"Connection Successful?"}
F --> |Yes| G["MongoDB connected successfully"]
F --> |No| H["Log Error and Exit Process"]
G --> I["Application Ready"]
H --> J["Process Exit"]
```

**Diagram sources**
- [database.ts](file://api-fastify/src/config/database.ts)
- [index.ts](file://api-fastify/src/index.ts)

**Section sources**
- [database.ts](file://api-fastify/src/config/database.ts)
- [migrate-reactions.ts](file://api-fastify/src/scripts/migrate-reactions.ts)
- [seed.ts](file://api-fastify/src/scripts/seed.ts)

## Service-Specific Configurations

### AI Service Configuration

The AI service configuration enables the blog's chat functionality, allowing users to interact with an AI assistant. The configuration is managed in `api-fastify/src/services/ai.service.ts` and relies on several environment variables:

- `AI_API_KEY`: Authentication key for the AI service
- `AI_API_URL`: Endpoint for AI API requests
- `QWEN_PROMPT`: System prompt that defines the AI's behavior and personality

The AI service uses the Gradio client to connect to Qwen models, with fallback logic that attempts multiple models if one fails. The system maintains chat sessions in memory with a 24-hour TTL, automatically cleaning expired sessions hourly.

### Email Service Configuration

The email service configuration enables password reset functionality and other email notifications. The configuration is defined in `api-fastify/src/services/email.service.ts` and uses standard SMTP settings:

- `EMAIL_HOST`: Mail server hostname
- `EMAIL_PORT`: Mail server port
- `EMAIL_USER`: Authentication username
- `EMAIL_PASS`: Authentication password
- `EMAIL_FROM`: Sender email address
- `EMAIL_SECURE`: Whether to use TLS/SSL

The email service includes a dedicated function for sending password reset emails with properly formatted HTML content and time-limited reset links.

### Caching Configuration

The caching system uses Redis for performance optimization and is configured in `api-fastify/src/services/cache.service.ts`. The primary configuration parameter is `REDIS_URL`, which specifies the Redis server connection string with a default of `redis://localhost:6379`.

The cache service implements a simple key-value store with TTL (time-to-live) functionality, automatically handling connection errors and continuing gracefully if Redis is unavailable. This ensures that the application remains functional even if the caching layer fails.

```mermaid
classDiagram
class AIService {
+sendMessage(input : string, sessionId : string) : Promise~string~
-generateResponse(messages : IMessage[]) : Promise~string~
-getOrCreateSession(sessionId : string) : ChatSession
-cleanupSessions() : void
}
class EmailService {
+initEmailTransporter() : void
+sendEmail(to : string, subject : string, html : string) : Promise~boolean~
+sendPasswordResetEmail(to : string, token : string) : Promise~boolean~
}
class CacheService {
-client : RedisClientType
-isConnected : boolean
+connect() : Promise~void~
+get~T~(key : string) : Promise~T | null~
+set(key : string, value : any, ttl : number) : Promise~void~
+del(pattern : string) : Promise~void~
}
class NotificationService {
+sendNotification(userId : string, type : string, data : any) : Promise~void~
+getNotifications(userId : string) : Promise~Notification[]~
+markAsRead(notificationId : string) : Promise~void~
}
AIService --> "uses" CacheService : "Session storage"
EmailService --> "uses" NotificationService : "Error notifications"
CacheService --> "connects to" Redis : "redis : //localhost : 6379"
NotificationService --> "persists to" MongoDB : "notifications collection"
```

**Diagram sources**
- [ai.service.ts](file://api-fastify/src/services/ai.service.ts)
- [email.service.ts](file://api-fastify/src/services/email.service.ts)
- [cache.service.ts](file://api-fastify/src/services/cache.service.ts)

**Section sources**
- [ai.service.ts](file://api-fastify/src/services/ai.service.ts)
- [email.service.ts](file://api-fastify/src/services/email.service.ts)
- [cache.service.ts](file://api-fastify/src/services/cache.service.ts)

## Configuration Loading and Access

### Frontend Configuration Loading

The frontend configuration is loaded through Vite's environment variable system. During the build process, Vite automatically exposes environment variables prefixed with `VITE_` to the client-side code through the `import.meta.env` object.

The configuration flow is as follows:
1. Vite loads environment variables from `.env` files based on the current mode
2. Variables are made available via `import.meta.env`
3. The `api.config.ts` file uses these variables to construct API endpoints
4. Components import and use the configured endpoints

This approach ensures that configuration is resolved at build time, improving performance and security by avoiding runtime environment variable lookups.

### Backend Configuration Loading

The backend configuration loading process begins in `api-fastify/src/index.ts` with the `config()` function from the `dotenv` package. This function loads environment variables from `.env` files into `process.env`.

The configuration loading sequence:
1. Import and execute `dotenv.config()` to load environment variables
2. Read configuration values from `process.env` with defaults
3. Use configuration values when building the Fastify server
4. Pass configuration to various services and middleware

The backend uses a fail-safe approach with default values for most configuration options, ensuring the application can run even if some environment variables are missing.

```mermaid
sequenceDiagram
participant Frontend as Frontend App
participant Vite as Vite Build System
participant Backend as Backend Server
participant Dotenv as dotenv
Frontend->>Vite : Request page
Vite->>Vite : Load .env files
Vite->>Vite : Expose VITE_* variables
Vite->>Frontend : Serve application with config
Frontend->>Frontend : Use import.meta.env.VITE_API_URL
Frontend->>Backend : API request
Backend->>Dotenv : dotenv.config()
Dotenv->>Backend : Load environment variables
Backend->>Backend : Read process.env.MONGODB_URI
Backend->>Backend : Connect to MongoDB
Backend->>Frontend : API response
```

**Diagram sources**
- [index.ts](file://api-fastify/src/index.ts)
- [api.config.ts](file://src/config/api.config.ts)
- [vite.config.js](file://vite.config.js)

**Section sources**
- [index.ts](file://api-fastify/src/index.ts)
- [api.config.ts](file://src/config/api.config.ts)
- [vite.config.js](file://vite.config.js)

## Security Considerations

The configuration system implements several security best practices to protect sensitive information and prevent common vulnerabilities.

### Environment Variable Security

Critical security practices include:
- Never committing `.env` files to version control (included in `.gitignore`)
- Using `.env.example` files with placeholder values for documentation
- Setting strong default values for development that must be changed in production
- Validating required environment variables at startup

### JWT Security

The JWT configuration includes security measures:
- Using a strong, randomly generated secret key (not the default)
- Setting appropriate token expiration (30 days by default)
- Configuring secure cookies in production environments
- Proper error messages that don't expose sensitive information

### Database Security

Database configuration security considerations:
- Using environment variables for connection strings instead of hardcoding
- Supporting connection string options for SSL/TLS
- Implementing proper error handling that doesn't expose database details

### AI Service Security

AI service configuration security:
- Storing API keys in environment variables, not in code
- Using system prompts to constrain AI behavior
- Implementing session management to prevent abuse

### Email Security

Email configuration security:
- Using environment variables for SMTP credentials
- Supporting secure connections (TLS/SSL)
- Validating email configuration at startup
- Implementing proper error handling for failed email delivery

**Section sources**
- [.env.example](file://.env.example)
- [api-fastify/.env.example](file://api-fastify/.env.example)
- [server.ts](file://api-fastify/src/server.ts)
- [email.service.ts](file://api-fastify/src/services/email.service.ts)

## Configuration Best Practices

### Environment-Specific Configuration Files

Create separate environment files for different deployment environments:

**Development (.env.development)**
```
# Frontend
VITE_API_URL=http://localhost:4200/api
VITE_IMAGE_BASE_URL=http://localhost:4200

# Backend
MONGODB_URI=mongodb://localhost:27017/mern_blog_dev
PORT=4200
NODE_ENV=development
JWT_SECRET=dev_secret_change_in_production
EMAIL_HOST=localhost
EMAIL_PORT=1025
EMAIL_SECURE=false
```

**Staging (.env.staging)**
```
# Frontend
VITE_API_URL=https://api-staging.yourdomain.com
VITE_IMAGE_BASE_URL=https://api-staging.yourdomain.com

# Backend
MONGODB_URI=mongodb://staging-db.yourdomain.com:27017/mern_blog_staging
PORT=4200
NODE_ENV=staging
JWT_SECRET=strong_generated_secret_for_staging
EMAIL_HOST=smtp.provider.com
EMAIL_PORT=587
EMAIL_SECURE=true
```

**Production (.env.production)**
```
# Frontend
VITE_API_URL=https://api.yourdomain.com
VITE_IMAGE_BASE_URL=https://api.yourdomain.com

# Backend
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/mern_blog_prod
PORT=4200
NODE_ENV=production
JWT_SECRET=very_strong_production_secret
EMAIL_HOST=smtp.provider.com
EMAIL_PORT=587
EMAIL_SECURE=true
REDIS_URL=redis://prod-redis.yourdomain.com:6379
```

### Configuration Validation

Implement configuration validation to ensure all required variables are set:

```typescript
// Example validation function
function validateConfig() {
  const requiredVars = ['MONGODB_URI', 'JWT_SECRET', 'EMAIL_HOST', 'EMAIL_USER', 'EMAIL_PASS'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
  
  // Additional validation for specific formats
  if (process.env.EMAIL_PORT && isNaN(parseInt(process.env.EMAIL_PORT))) {
    throw new Error('EMAIL_PORT must be a number');
  }
}
```

### Secure Secret Management

For production deployments, use secure secret management practices:
- Use environment variables provided by your hosting platform
- Consider using secret management services (AWS Secrets Manager, Hashicorp Vault)
- Rotate secrets regularly
- Never commit secrets to version control

**Section sources**
- [.env.example](file://.env.example)
- [api-fastify/.env.example](file://api-fastify/.env.example)
- [server.ts](file://api-fastify/src/server.ts)

## Troubleshooting Common Issues

### Database Connection Issues

**Symptoms:**
- Application fails to start with "MongoDB connection error"
- "URI MongoDB non définie" error message

**Solutions:**
1. Verify that `MONGODB_URI` is set in the environment
2. Check that the MongoDB server is running
3. Validate the connection string format
4. Ensure network connectivity between application and database
5. Check firewall settings if connecting to a remote database

### JWT Authentication Issues

**Symptoms:**
- Users cannot log in
- "Token invalide" or "Token expiré" errors
- Authentication redirects failing

**Solutions:**
1. Verify that `JWT_SECRET` is set and consistent across deployments
2. Check that `JWT_EXPIRES_IN` has a valid format (e.g., "30d", "2h")
3. Ensure the secret is the same across all instances in a clustered environment
4. Clear browser cookies if using JWT cookies

### Email Configuration Issues

**Symptoms:**
- Password reset emails not being sent
- "Configuration email incomplète" warnings
- SMTP connection errors

**Solutions:**
1. Verify all email environment variables are set
2. Test SMTP credentials with a mail client
3. Check that `EMAIL_SECURE` matches the port (usually true for 465, false for 587)
4. Verify that the email provider allows connections from your server IP
5. Check spam folders for test emails

### AI Service Issues

**Symptoms:**
- Chatbot not responding
- "Tous les modèles ont échoué" errors
- Slow AI responses

**Solutions:**
1. Verify `AI_API_KEY` is set and valid
2. Check that the AI service endpoint is accessible
3. Verify network connectivity to the AI service
4. Check rate limits on the AI service
5. Test with different models if multiple are configured

### Environment Variable Loading Issues

**Symptoms:**
- Default values being used instead of environment variables
- "undefined" values in configuration
- Variables not available in the expected scope

**Solutions:**
1. Verify that `.env` files are in the correct directory
2. Check that variable names match exactly (case-sensitive)
3. Ensure variables are prefixed with `VITE_` for frontend access
4. Restart the development server after changing environment variables
5. Verify that `dotenv.config()` is called before accessing variables

**Section sources**
- [database.ts](file://api-fastify/src/config/database.ts)
- [server.ts](file://api-fastify/src/server.ts)
- [email.service.ts](file://api-fastify/src/services/email.service.ts)
- [ai.service.ts](file://api-fastify/src/services/ai.service.ts)
- [index.ts](file://api-fastify/src/index.ts)