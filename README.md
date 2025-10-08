# MERN ChatAI Blog - Complete Documentation

> Comprehensive technical documentation for the MERN ChatAI Blog platform - an AI-powered blogging system built with modern web technologies.

## 📚 Documentation Overview

This repository contains extensive documentation covering all aspects of the MERN ChatAI Blog platform, from system architecture to API references, feature modules, and deployment strategies.

## 🗂️ Documentation Structure

### Core Documentation

- **[System Overview](./.qoder/repowiki/en/content/System%20Overview.md)** - High-level architecture and project structure
- **[Getting Started](./.qoder/repowiki/en/content/Getting%20Started.md)** - Installation, setup, and initial configuration
- **[Technology Stack](./.qoder/repowiki/en/content/Technology%20Stack.md)** - Detailed breakdown of all technologies used
- **[Environment Configuration](./.qoder/repowiki/en/content/Environment%20Configuration.md)** - Environment variables and configuration
- **[Deployment Architecture](./.qoder/repowiki/en/content/Deployment%20Architecture.md)** - Production deployment strategies
- **[Contributing Guide](./.qoder/repowiki/en/content/Contributing%20Guide.md)** - Guidelines for contributing to the project

### Frontend Architecture

- **[Frontend Architecture](./.qoder/repowiki/en/content/Frontend%20Architecture/Frontend%20Architecture.md)** - Overview of frontend design patterns
- **[Component Architecture](./.qoder/repowiki/en/content/Frontend%20Architecture/Component%20Architecture.md)** - React component structure and patterns
- **[State Management](./.qoder/repowiki/en/content/Frontend%20Architecture/State%20Management.md)** - Context API and state handling
- **[Routing & Navigation](./.qoder/repowiki/en/content/Frontend%20Architecture/Routing%20&%20Navigation.md)** - React Router implementation
- **[API Integration Layer](./.qoder/repowiki/en/content/Frontend%20Architecture/API%20Integration%20Layer.md)** - Frontend-backend communication
- **[Styling Strategy](./.qoder/repowiki/en/content/Frontend%20Architecture/Styling%20Strategy.md)** - Tailwind CSS and design system

### Backend Architecture

- **[Backend Architecture](./.qoder/repowiki/en/content/Backend%20Architecture/Backend%20Architecture.md)** - Fastify server architecture
- **[Middleware & Interceptors](./.qoder/repowiki/en/content/Backend%20Architecture/Middleware%20&%20Interceptors.md)** - Request/response processing
- **[Data Models & ORM Mapping](./.qoder/repowiki/en/content/Backend%20Architecture/Data%20Models%20&%20ORM%20Mapping.md)** - Mongoose schemas and relationships

#### Business Logic Layer

- **[Business Logic Layer](./.qoder/repowiki/en/content/Backend%20Architecture/Business%20Logic%20Layer/Business%20Logic%20Layer.md)** - Service layer overview
- **[Authentication Service](./.qoder/repowiki/en/content/Backend%20Architecture/Business%20Logic%20Layer/Authentication%20Service.md)** - User authentication logic
- **[Post Service](./.qoder/repowiki/en/content/Backend%20Architecture/Business%20Logic%20Layer/Post%20Service.md)** - Content management service
- **[Comment Service](./.qoder/repowiki/en/content/Backend%20Architecture/Business%20Logic%20Layer/Comment%20Service.md)** - Comment handling
- **[Category Service](./.qoder/repowiki/en/content/Backend%20Architecture/Business%20Logic%20Layer/Category%20Service.md)** - Category management
- **[User Service](./.qoder/repowiki/en/content/Backend%20Architecture/Business%20Logic%20Layer/User%20Service.md)** - User profile management
- **[AI Service](./.qoder/repowiki/en/content/Backend%20Architecture/Business%20Logic%20Layer/AI%20Service.md)** - AI integration service
- **[Notification Service](./.qoder/repowiki/en/content/Backend%20Architecture/Business%20Logic%20Layer/Notification%20Service.md)** - Real-time notifications
- **[Upload Service](./.qoder/repowiki/en/content/Backend%20Architecture/Business%20Logic%20Layer/Upload%20Service.md)** - File upload handling
- **[Content Service](./.qoder/repowiki/en/content/Backend%20Architecture/Business%20Logic%20Layer/Content%20Service.md)** - Content processing

#### External Integrations

- **[External Integrations](./.qoder/repowiki/en/content/Backend%20Architecture/External%20Integrations/External%20Integrations.md)** - Third-party services overview
- **[Database Integration](./.qoder/repowiki/en/content/Backend%20Architecture/External%20Integrations/Database%20Integration.md)** - MongoDB connection and management
- **[Caching Layer](./.qoder/repowiki/en/content/Backend%20Architecture/External%20Integrations/Caching%20Layer.md)** - Redis caching strategy
- **[Email Service](./.qoder/repowiki/en/content/Backend%20Architecture/External%20Integrations/Email%20Service.md)** - Nodemailer email integration
- **[AI Service Integration](./.qoder/repowiki/en/content/Backend%20Architecture/External%20Integrations/AI%20Service%20Integration.md)** - Hugging Face Spaces integration
- **[Notification Hooks](./.qoder/repowiki/en/content/Backend%20Architecture/External%20Integrations/Notification%20Hooks.md)** - Webhook system

### API Reference

Complete API documentation for all endpoints:

- **[API Reference](./.qoder/repowiki/en/content/API%20Reference/API%20Reference.md)** - API overview and conventions
- **[Authentication API](./.qoder/repowiki/en/content/API%20Reference/Authentication%20API.md)** - Login, register, password reset
- **[Users API](./.qoder/repowiki/en/content/API%20Reference/Users%20API.md)** - User management endpoints
- **[Posts API](./.qoder/repowiki/en/content/API%20Reference/Posts%20API.md)** - Blog post CRUD operations
- **[Comments API](./.qoder/repowiki/en/content/API%20Reference/Comments%20API.md)** - Comment management
- **[Categories API](./.qoder/repowiki/en/content/API%20Reference/Categories%20API.md)** - Category hierarchy
- **[Content API](./.qoder/repowiki/en/content/API%20Reference/Content%20API.md)** - Content retrieval
- **[AI API](./.qoder/repowiki/en/content/API%20Reference/AI%20API.md)** - AI chatbot endpoints
- **[Upload API](./.qoder/repowiki/en/content/API%20Reference/Upload%20API.md)** - File upload endpoints
- **[Notifications API](./.qoder/repowiki/en/content/API%20Reference/Notifications%20API.md)** - Notification management
- **[Health API](./.qoder/repowiki/en/content/API%20Reference/Health%20API.md)** - System health checks

### Data Models

Detailed documentation of all database schemas:

- **[Data Models](./.qoder/repowiki/en/content/Data%20Models/Data%20Models.md)** - Overview of data architecture
- **[User Model](./.qoder/repowiki/en/content/Data%20Models/User%20Model.md)** - User schema and authentication
- **[Post Model](./.qoder/repowiki/en/content/Data%20Models/Post%20Model.md)** - Blog post structure
- **[Comment Model](./.qoder/repowiki/en/content/Data%20Models/Comment%20Model.md)** - Hierarchical comments
- **[Category Model](./.qoder/repowiki/en/content/Data%20Models/Category%20Model.md)** - Category taxonomy
- **[Notification Model](./.qoder/repowiki/en/content/Data%20Models/Notification%20Model.md)** - Notification schema

### UI Components

Component library documentation:

- **[UI Components](./repowiki/en/content/UI%20Components/UI%20Components.md)** - Component library overview
- **[UI Primitives](./repowiki/en/content/UI%20Components/UI%20Primitives.md)** - Base components (buttons, inputs, etc.)
- **[Layout and Navigation Components](./repowiki/en/content/UI%20Components/Layout%20and%20Navigation%20Components.md)** - Headers, footers, navigation
- **[Blog-Specific Components](./repowiki/en/content/UI%20Components/Blog-Specific%20Components.md)** - Post cards, comment threads
- **[Admin Components](./repowiki/en/content/UI%20Components/Admin%20Components.md)** - Admin dashboard components
- **[Utility and Feedback Components](./repowiki/en/content/UI%20Components/Utility%20and%20Feedback%20Components.md)** - Toasts, modals, loaders

### Feature Modules

In-depth feature documentation:

- **[Feature Modules](./.qoder/repowiki/en/content/Feature%20Modules/Feature%20Modules.md)** - Feature architecture overview

#### Authentication System
- **[Authentication System](./.qoder/repowiki/en/content/Feature%20Modules/Authentication%20System/Authentication%20System.md)** - Auth system overview
- **[User Registration](./.qoder/repowiki/en/content/Feature%20Modules/Authentication%20System/User%20Registration.md)** - Registration flow
- **[User Login](./.qoder/repowiki/en/content/Feature%20Modules/Authentication%20System/User%20Login.md)** - Login implementation
- **[Role-Based Access Control](./.qoder/repowiki/en/content/Feature%20Modules/Authentication%20System/Role-Based%20Access%20Control.md)** - RBAC system
- **[Password Management](./.qoder/repowiki/en/content/Feature%20Modules/Authentication%20System/Password%20Management/Password%20Management.md)** - Password features
  - **[Password Reset](./.qoder/repowiki/en/content/Feature%20Modules/Authentication%20System/Password%20Management/Password%20Reset.md)**
  - **[Password Change](./.qoder/repowiki/en/content/Feature%20Modules/Authentication%20System/Password%20Management/Password%20Change.md)**

#### Content Management
- **[Content Management](./.qoder/repowiki/en/content/Feature%20Modules/Content%20Management/Content%20Management.md)** - CMS overview
- **[Post Creation](./.qoder/repowiki/en/content/Feature%20Modules/Content%20Management/Post%20Creation.md)** - Creating blog posts
- **[Post Editing](./.qoder/repowiki/en/content/Feature%20Modules/Content%20Management/Post%20Editing.md)** - Editing workflow
- **[Draft Management](./.qoder/repowiki/en/content/Feature%20Modules/Content%20Management/Draft%20Management.md)** - Draft system
- **[Publishing Workflow](./.qoder/repowiki/en/content/Feature%20Modules/Content%20Management/Publishing%20Workflow.md)** - Publication process

#### AI Features
- **[AI Features](./.qoder/repowiki/en/content/Feature%20Modules/AI%20Features/AI%20Features.md)** - AI capabilities overview
- **[Chatbot Interface](./.qoder/repowiki/en/content/Feature%20Modules/AI%20Features/Chatbot%20Interface.md)** - Chat UI implementation
- **[AI Content Processing](./.qoder/repowiki/en/content/Feature%20Modules/AI%20Features/AI%20Content%20Processing.md)** - AI processing pipeline

#### Notification System
- **[Notification System](./.qoder/repowiki/en/content/Feature%20Modules/Notification%20System/Notification%20System.md)** - Notification architecture
- **[Real-Time Notifications](./.qoder/repowiki/en/content/Feature%20Modules/Notification%20System/Real-Time%20Notifications.md)** - Live updates
- **[Notification Management](./.qoder/repowiki/en/content/Feature%20Modules/Notification%20System/Notification%20Management.md)** - Managing notifications
- **[Error Handling and Display](./.qoder/repowiki/en/content/Feature%20Modules/Notification%20System/Error%20Handling%20and%20Display.md)** - Error notifications

#### Admin Dashboard
- **[Admin Dashboard](./.qoder/repowiki/en/content/Feature%20Modules/Admin%20Dashboard/Admin%20Dashboard.md)** - Dashboard overview
- **[User Management](./.qoder/repowiki/en/content/Feature%20Modules/Admin%20Dashboard/User%20Management.md)** - Managing users
- **[Site Statistics](./.qoder/repowiki/en/content/Feature%20Modules/Admin%20Dashboard/Site%20Statistics.md)** - Analytics and stats
- **[Content Filtering](./.qoder/repowiki/en/content/Feature%20Modules/Admin%20Dashboard/Content%20Filtering.md)** - Content moderation

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- MongoDB 6.0+
- Redis (optional, for caching)
- pnpm (recommended) or npm

### Installation

```bash
# Clone the repository
git clone https://github.com/yoricksenpai/MERN_chatai_blog.git
cd MERN_chatai_blog

# Install dependencies
pnpm install
cd api-fastify && pnpm install

# Configure environment
cp api-fastify/.env.example api-fastify/.env
# Edit .env with your configuration

# Start development servers
pnpm run start
```

Visit [Getting Started](./.qoder/repowiki/en/content/Getting%20Started.md) for detailed setup instructions.

## 🏗️ Architecture Highlights

### Frontend Stack
- **React 18.3.1** - Modern UI framework with hooks and concurrent features
- **TypeScript 5.8.2** - Type-safe development
- **Vite** - Lightning-fast build tool
- **Tailwind CSS 3.4.1** - Utility-first styling
- **Tiptap 3.2.0** - Rich text editor
- **Radix UI** - Accessible component primitives

### Backend Stack
- **Fastify 5.3.2** - High-performance web framework
- **MongoDB 8.14.0** - NoSQL database
- **Mongoose 8.14.0** - ODM for MongoDB
- **Redis 5.8.1** - Caching layer
- **JWT 9.0.2** - Authentication
- **@gradio/client** - AI model integration

## 📖 Key Features

### Content Management
- Rich text editing with Tiptap
- Draft and publish workflow
- Category hierarchy
- Image upload and management
- SEO optimization

### AI Integration
- Chatbot powered by Qwen models
- Conversation history
- Multi-model fallback
- Session management

### User Management
- JWT-based authentication
- Role-based access control (User, Author, Editor, Admin)
- Email verification
- Password reset flow
- Profile management

### Admin Dashboard
- User management
- Content moderation
- Site statistics
- Real-time notifications
- System health monitoring

## 🔧 Development

### Project Structure

```
MERN_chatai_blog/
├── src/                    # Frontend React application
│   ├── components/         # Reusable UI components
│   ├── features/          # Feature-specific modules
│   ├── pages/             # Page components
│   ├── services/          # API clients
│   └── config/            # Configuration files
├── api-fastify/           # Backend Fastify API
│   ├── src/
│   │   ├── controllers/   # Request handlers
│   │   ├── services/      # Business logic
│   │   ├── models/        # Mongoose schemas
│   │   ├── routes/        # API routes
│   │   ├── middlewares/   # Custom middleware
│   │   └── config/        # Server configuration
│   └── uploads/           # File uploads directory
└── .qoder/                # Documentation (this directory)
```

### Available Scripts

```bash
# Frontend
pnpm run dev          # Start development server
pnpm run build        # Build for production
pnpm run preview      # Preview production build
pnpm run lint         # Run ESLint
pnpm run type-check   # TypeScript type checking

# Backend
cd api-fastify
pnpm run dev          # Start development server
pnpm run build        # Build for production
pnpm run start        # Start production server
pnpm run seed         # Seed database with sample data
```

## 📝 API Documentation

All API endpoints are documented with:
- Request/response schemas
- Authentication requirements
- Error handling
- Code examples
- Rate limiting information

See the [API Reference](./.qoder/repowiki/en/content/API%20Reference/API%20Reference.md) section for complete documentation.

## 🧪 Testing

```bash
# Run tests
pnpm run test

# Run tests with coverage
pnpm run test:coverage

# Run tests in watch mode
pnpm run test:watch
```

## 🚢 Deployment

The application supports multiple deployment strategies:

- **Frontend**: Vercel, Netlify, or any static hosting
- **Backend**: Heroku, AWS, DigitalOcean, or any Node.js hosting
- **Database**: MongoDB Atlas or self-hosted MongoDB
- **Caching**: Redis Cloud or self-hosted Redis

See [Deployment Architecture](./.qoder/repowiki/en/content/Deployment%20Architecture.md) for detailed deployment guides.

## 🤝 Contributing

We welcome contributions! Please read our [Contributing Guide](./.qoder/repowiki/en/content/Contributing%20Guide.md) for:

- Code style guidelines
- Commit message conventions
- Pull request process
- Development workflow
- Testing requirements

## 📄 License

This project is licensed under the MIT License.

## 🔗 Links

- **GitHub Repository**: [yoricksenpai/MERN_chatai_blog](https://github.com/yoricksenpai/MERN_chatai_blog)
- **Live Demo**: [iwomi-blog.netlify.app](https://iwomi-blog.netlify.app)
- **API Documentation**: Available at `/api/docs` when running locally

## 📞 Support

For questions, issues, or feature requests:

- Open an issue on GitHub
- Check existing documentation
- Review troubleshooting guides in [Getting Started](./.qoder/repowiki/en/content/Getting%20Started.md)

## 🗺️ Roadmap

### Current Features
- ✅ User authentication and authorization
- ✅ Rich text blog post creation
- ✅ AI-powered chatbot
- ✅ Admin dashboard
- ✅ Real-time notifications
- ✅ Comment system
- ✅ Category management

### Planned Features
- 🔄 Multi-language support
- 🔄 Advanced analytics
- 🔄 Social media integration
- 🔄 Email newsletters
- 🔄 Advanced search
- 🔄 Content scheduling

## 📚 Additional Resources

### Learning Materials
- [React Documentation](https://react.dev)
- [Fastify Documentation](https://fastify.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [MongoDB Manual](https://docs.mongodb.com)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

### Related Projects
- [Tiptap Editor](https://tiptap.dev)
- [Radix UI](https://www.radix-ui.com)
- [Gradio](https://gradio.app)

---

**Last Updated**: September 2025  
**Documentation Version**: 1.0.0  
**Project Version**: See [package.json](../package.json)
