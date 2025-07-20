---
description: Repository Information Overview
alwaysApply: true
---

# MERN ChatAI Blog Information

## Summary
A blog application with AI chat features built with the MERN stack (MongoDB, Express, React, Node.js) and TypeScript. The chatbot uses a Qwen model hosted on Hugging Face Spaces. The project includes user authentication, blog post management, category system, integrated AI chat, and a responsive user interface.

## Structure
The project is organized into two main parts:
- `/src`: Frontend (React/TypeScript) with Vite as the build tool
- `/api-fastify`: Backend (Fastify/TypeScript) API server
- `/utils`: Utility functions shared across the application
- `/.zencoder`: Project documentation and rules
- `/.vscode`: VS Code configuration

## Language & Runtime
**Languages**: TypeScript, JavaScript
**Frontend Framework**: React 18
**Backend Framework**: Fastify 5
**Database**: MongoDB (with Mongoose 8)
**Build System**: Vite 5 (frontend), TypeScript compiler (backend)
**Package Manager**: npm/pnpm

## Dependencies

### Frontend Dependencies
**Main Dependencies**:
- React 18.3.1 with React Router 6.30.0
- Tailwind CSS 3.4.17
- Material UI components
- Radix UI components
- React Quill (rich text editor)
- Marked (markdown processing)
- Recharts (data visualization)

**Development Dependencies**:
- TypeScript 5.8.2
- Vite 5.4.19
- ESLint 8.57.1
- Vitest (testing framework)
- React Buddy (IDE toolbox)

### Backend Dependencies
**Main Dependencies**:
- Fastify 5.3.2
- Mongoose 8.14.0
- JWT authentication (@fastify/jwt)
- Bcrypt 6.0.0 (password hashing)
- Nodemailer 6.10.1 (email service)
- Gradio client (AI integration)

**Development Dependencies**:
- TypeScript 5.8.3
- ESLint 9.25.1
- TSX 4.19.4 (TypeScript execution)
- Pino Pretty (logging)

## Build & Installation

### Prerequisites
- Node.js (v14+)
- MongoDB
- npm or pnpm

### Frontend
```bash
npm install
npm run dev     # Development server
npm run build   # Production build
npm run preview # Preview production build
```

### Backend
```bash
cd api-fastify
npm install
npm run dev   # Development server
npm run build # Compile TypeScript
npm start     # Run production server
npm run seed  # Seed the database
```

## Testing
**Framework**: Vitest
**Test Location**: Individual test files next to implementation
**Naming Convention**: `*.test.ts`
**Run Command**:
```bash
npm test          # Run all tests
npm run test:watch # Run tests in watch mode
```

## Deployment
**Frontend**: Configured for Vercel deployment (vercel.json)
**Backend**: Supports deployment to various platforms
**Environment**: Configuration via .env files (examples provided)