# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Comprehensive documentation in `.qoder/` directory
- Complete API reference documentation
- System architecture documentation
- Feature modules documentation
- UI components documentation

### Fixed
- Post view counter display on post cards
- Stats object structure for frontend compatibility

### Changed
- Updated CONTRIBUTING.md with comprehensive English guidelines
- Improved post service data normalization

## [1.0.0] - 2025-03-10

### Added
- **Core Features**
  - User authentication system with JWT
  - Role-based access control (User, Author, Editor, Admin)
  - Rich text blog post creation with Tiptap editor
  - AI-powered chatbot integration with Qwen models
  - Real-time notifications system
  - Admin dashboard with user management
  - Category and tag management
  - Comment system with hierarchical structure
  - File upload system with image optimization
  - Search functionality
  - Draft management system

- **Frontend**
  - React 18.3.1 with TypeScript
  - Vite build system
  - Tailwind CSS for styling
  - Radix UI components for accessibility
  - Responsive design with dark mode support
  - Mobile-optimized interface

- **Backend**
  - Fastify 5.3.2 web framework
  - MongoDB 8.14.0 with Mongoose ODM
  - Redis caching layer
  - JWT authentication
  - Email service with Nodemailer
  - AI service integration with Gradio client
  - Comprehensive API with OpenAPI documentation
  - Rate limiting and security middleware

- **AI Features**
  - Chatbot interface with conversation history
  - Multi-model fallback system
  - Session management
  - Context-aware responses

- **Admin Features**
  - User management dashboard
  - Site statistics and analytics
  - Content moderation tools
  - System health monitoring
  - Notification management

- **Developer Experience**
  - TypeScript throughout the stack
  - ESLint and Prettier configuration
  - Comprehensive testing setup
  - Docker support
  - Environment configuration
  - Seed data for development

### Technical Details
- **Database**: MongoDB with optimized indexes
- **Caching**: Redis for session and data caching
- **Authentication**: JWT with refresh token support
- **File Storage**: Local storage with optimization
- **Email**: SMTP integration for notifications
- **AI**: Hugging Face Spaces integration
- **Deployment**: Netlify (frontend) + backend hosting ready

### Security
- Password hashing with bcrypt
- JWT token security
- Input validation and sanitization
- CORS configuration
- Rate limiting
- SQL injection protection
- XSS protection

### Performance
- Optimized database queries
- Image optimization and lazy loading
- Code splitting and lazy loading
- Caching strategies
- Minified production builds

---

## Version Format

This project uses [Semantic Versioning](https://semver.org/):
- **MAJOR** version for incompatible API changes
- **MINOR** version for backwards-compatible functionality additions
- **PATCH** version for backwards-compatible bug fixes

## Types of Changes

- **Added** for new features
- **Changed** for changes in existing functionality
- **Deprecated** for soon-to-be removed features
- **Removed** for now removed features
- **Fixed** for any bug fixes
- **Security** for vulnerability fixes

## Links

- [Repository](https://github.com/yoricksenpai/MERN_chatai_blog)
- [Live Demo](https://iwomi-blog.netlify.app)
- [Documentation](./.qoder/README.md)
- [Contributing Guidelines](./CONTRIBUTING.md)