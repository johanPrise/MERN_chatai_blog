# Contributing to MERN ChatAI Blog

> Complete guide for contributing to MERN ChatAI Blog - an AI-powered blogging platform

Thank you for your interest in contributing to MERN ChatAI Blog! This guide will help you understand our development process, code standards, and how to submit quality contributions.

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Development Process](#development-process)
3. [Code Standards](#code-standards)
4. [Project Architecture](#project-architecture)
5. [Commit Conventions](#commit-conventions)
6. [Testing and Quality](#testing-and-quality)
7. [Pull Requests](#pull-requests)
8. [Debugging and Troubleshooting](#debugging-and-troubleshooting)
9. [Resources and Support](#resources-and-support)

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ (recommended: v20+)
- **pnpm** (recommended package manager)
- **MongoDB** 6.0+ (local or Atlas)
- **Redis** (optional, for caching)
- **Git** for version control

### Installation

```bash
# 1. Fork and clone the repository
git clone https://github.com/your-username/MERN_chatai_blog.git
cd MERN_chatai_blog

# 2. Install dependencies
pnpm install
cd api-fastify && pnpm install && cd ..

# 3. Environment configuration
cp api-fastify/.env.example api-fastify/.env
# Edit .env with your configurations

# 4. Start development servers
pnpm run start
```

### Installation Verification

- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:4200/api/v1](http://localhost:4200/api/v1)
- **Health Check**: [http://localhost:4200/api/v1/health](http://localhost:4200/api/v1/health)

## 🔄 Development Process

### 1. Git Workflow

```bash
# 1. Create a branch from main
git checkout main
git pull origin main
git checkout -b feature/your-feature-name

# 2. Develop your feature
# ... make your changes

# 3. Commit with conventional messages
git add .
git commit -m "feat(posts): add view counter to post cards"

# 4. Push and create a PR
git push origin feature/your-feature-name
```

### 2. Branch Naming

| Type | Format | Example |
|------|--------|---------|
| **New Feature** | `feature/description` | `feature/ai-chatbot-integration` |
| **Bug Fix** | `fix/description` | `fix/view-counter-display` |
| **Refactoring** | `refactor/description` | `refactor/post-service-cleanup` |
| **Documentation** | `docs/description` | `docs/api-reference-update` |
| **Tests** | `test/description` | `test/auth-service-coverage` |

### 3. Development Cycle

1. **Planning**: Create or assign an issue
2. **Development**: Code following our standards
3. **Testing**: Write and run tests
4. **Review**: Submit a PR for review
5. **Merge**: Integration after approval

## 📝 Code Standards

### TypeScript

```typescript
// ✅ Good: Explicit types and clear interfaces
interface PostData {
  id: string;
  title: string;
  stats: {
    viewCount: number;
    likeCount: number;
  };
}

// ❌ Avoid: Any types and untyped variables
const post: any = getData();
```

### React Components

```tsx
// ✅ Good: Functional component with types
interface PostCardProps {
  post: PostData;
  onEdit?: (id: string) => void;
  className?: string;
}

export function PostCard({ post, onEdit, className }: PostCardProps) {
  // Implementation
}

// ❌ Avoid: Untyped props
export function PostCard(props) {
  // Implementation
}
```

### Backend Services

```typescript
// ✅ Good: Service with error handling
export const getPostById = async (id: string): Promise<PostData> => {
  try {
    if (!isValidObjectId(id)) {
      throw new Error('Invalid post ID');
    }
    
    const post = await Post.findById(id);
    if (!post) {
      throw new Error('Post not found');
    }
    
    return normalizePostForFrontend(post);
  } catch (error) {
    logger.error('Error fetching post:', error);
    throw error;
  }
};
```

### ESLint and Prettier Rules

The project uses strict configurations:

```bash
# Check linting
pnpm run lint

# Auto-fix issues
pnpm run lint:fix

# Format code
pnpm run format
```

## 🏗️ Project Architecture

### General Structure

```
MERN_chatai_blog/
├── src/                    # Frontend React + TypeScript
│   ├── components/         # Reusable components
│   ├── features/          # Feature modules
│   │   ├── posts/         # Post management
│   │   ├── auth/          # Authentication
│   │   └── admin/         # Administration
│   ├── pages/             # Application pages
│   ├── services/          # API clients
│   ├── hooks/             # Custom hooks
│   ├── lib/               # Utilities
│   └── types/             # TypeScript types
├── api-fastify/           # Backend Fastify + TypeScript
│   ├── src/
│   │   ├── controllers/   # API controllers
│   │   ├── services/      # Business logic
│   │   ├── models/        # Mongoose models
│   │   ├── routes/        # API routes
│   │   ├── middlewares/   # Middlewares
│   │   ├── types/         # Backend types
│   │   └── utils/         # Utilities
│   └── uploads/           # Uploaded files
└── .qoder/                # Complete documentation
```

### Architectural Patterns

#### Frontend: Feature-based Architecture

```
src/features/posts/
├── components/            # Post-specific components
│   ├── PostCard.tsx
│   ├── PostForm/
│   └── PostList/
├── pages/                 # Post pages
│   ├── CreatePost.tsx
│   └── EditPost.tsx
├── services/              # API client for posts
│   └── postApi.ts
├── hooks/                 # Post hooks
│   └── usePosts.ts
└── types/                 # Post types
    └── post.types.ts
```

#### Backend: Layered Architecture

```
api-fastify/src/
├── routes/                # Routing layer
├── controllers/           # Control layer
├── services/              # Business logic layer
├── models/                # Data layer
└── middlewares/           # Middleware layer
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| **React Components** | PascalCase | `PostCard`, `UserProfile` |
| **Hooks** | camelCase with `use` | `usePosts`, `useAuth` |
| **Services** | camelCase with suffix | `postService`, `authService` |
| **Types/Interfaces** | PascalCase | `PostData`, `UserInfo` |
| **Constants** | UPPER_SNAKE_CASE | `API_ENDPOINTS`, `DEFAULT_LIMIT` |
| **Files** | kebab-case or camelCase | `post-card.tsx`, `postService.ts` |

## 📝 Commit Conventions

### Message Format

```
type(scope): short description

[optional body]

[optional footer]
```

### Commit Types

| Type | Description | Example |
|------|-------------|---------|
| `feat` | New feature | `feat(posts): add view counter display` |
| `fix` | Bug fix | `fix(auth): resolve login token expiration` |
| `docs` | Documentation | `docs(api): update authentication endpoints` |
| `style` | Formatting, styling | `style(components): fix indentation` |
| `refactor` | Refactoring | `refactor(services): simplify post normalization` |
| `test` | Tests | `test(auth): add login service unit tests` |
| `chore` | Maintenance | `chore(deps): update dependencies` |
| `perf` | Performance | `perf(api): optimize post queries` |
| `ci` | CI/CD | `ci(github): add automated testing workflow` |

### Recommended Scopes

- **Frontend**: `ui`, `components`, `pages`, `hooks`, `services`
- **Backend**: `api`, `auth`, `posts`, `users`, `admin`, `db`
- **Features**: `chatbot`, `notifications`, `upload`, `search`
- **Infrastructure**: `config`, `deploy`, `docker`, `env`

### Good Commit Examples

```bash
# New feature
feat(posts): add stats object for view count compatibility

# Bug fix
fix(auth): handle expired JWT tokens gracefully

# Documentation
docs(readme): update installation instructions

# Refactoring
refactor(api): extract post normalization logic

# Tests
test(services): add comprehensive post service tests
```

## 🧪 Testing and Quality

### Test Types

#### Unit Tests

```typescript
// tests/services/post.service.test.ts
import { normalizePostForFrontend } from '../src/services/post.service';

describe('Post Service', () => {
  describe('normalizePostForFrontend', () => {
    it('should add stats object with correct view count', () => {
      const mockPost = {
        viewCount: 42,
        likedBy: ['user1', 'user2'],
        commentCount: 5
      };
      
      const result = normalizePostForFrontend(mockPost);
      
      expect(result.stats).toEqual({
        viewCount: 42,
        likeCount: 2,
        commentCount: 5,
        shareCount: 0
      });
    });
  });
});
```

#### Integration Tests

```typescript
// tests/api/posts.integration.test.ts
describe('Posts API', () => {
  it('should return posts with stats object', async () => {
    const response = await request(app)
      .get('/api/v1/posts')
      .expect(200);
      
    expect(response.body.posts[0]).toHaveProperty('stats');
    expect(response.body.posts[0].stats).toHaveProperty('viewCount');
  });
});
```

### Test Commands

```bash
# Run all tests
pnpm run test

# Tests with coverage
pnpm run test:coverage

# Tests in watch mode
pnpm run test:watch

# Test specific file
pnpm run test -- post.service.test.ts
```

### Code Coverage

Coverage targets:
- **Services**: 90%+
- **Utilities**: 95%+
- **Critical Components**: 80%+
- **Overall**: 80%+

## 🔍 Pull Requests

### PR Template

```markdown
## Description
Brief description of the changes made.

## Type of Change
- [ ] Bug fix (change that fixes an issue)
- [ ] New feature (change that adds functionality)
- [ ] Breaking change (fix or feature that would break existing functionality)
- [ ] Documentation (documentation-only change)

## How to Test
1. Steps to reproduce the behavior
2. Steps to test the fix/feature

## Checklist
- [ ] My code follows the project guidelines
- [ ] I have performed a self-review of my code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes

## Screenshots (if applicable)
Add screenshots to help explain your problem/solution.
```

### Review Process

1. **Self-review**: Review your own code before submission
2. **Automated checks**: CI/CD must pass (linting, tests, build)
3. **Peer review**: At least one approval required
4. **Maintainer review**: Final review by a maintainer

### Acceptance Criteria

- ✅ Code follows project standards
- ✅ Tests pass and coverage maintained
- ✅ Documentation updated if necessary
- ✅ No regression introduced
- ✅ Acceptable performance
- ✅ Security respected

## 🐛 Debugging and Troubleshooting

### Common Issues

#### 1. Build Errors

```bash
# Clean dependencies
rm -rf node_modules package-lock.json
pnpm install

# Clean cache
pnpm store prune
```

#### 2. Database Issues

```bash
# Check MongoDB connection
mongosh "mongodb://localhost:27017/mern_blog"

# Reset test data
cd api-fastify
npm run seed
```

#### 3. Port Issues

```bash
# Find processes using ports
lsof -i :4200  # Backend
lsof -i :5173  # Frontend

# Kill a process
kill -9 <PID>
```

### Logging and Debugging

#### Backend

```typescript
// Use configured logger
import { logger } from '../utils/logger';

logger.info('Processing post creation', { userId, postId });
logger.error('Failed to create post', { error: error.message });
```

#### Frontend

```typescript
// Use development tools
if (process.env.NODE_ENV === 'development') {
  console.log('Post data:', post);
}

// Use React DevTools and Redux DevTools
```

### Development Tools

- **Backend**: Fastify logger, MongoDB Compass
- **Frontend**: React DevTools, Browser DevTools
- **API**: Postman, Insomnia, curl
- **Database**: MongoDB Compass, Studio 3T

## 📚 Resources and Support

### Documentation

- **Complete**: [.qoder Documentation](./.qoder/README.md)
- **API**: [API Reference](./.qoder/repowiki/en/content/API%20Reference/)
- **Architecture**: [System Overview](./.qoder/repowiki/en/content/System%20Overview.md)
- **Deployment**: [Deployment Guide](./.qoder/repowiki/en/content/Deployment%20Architecture.md)

### Technologies Used

#### Frontend
- **React** 18.3.1 - UI Framework
- **TypeScript** 5.8.2 - Static typing
- **Vite** - Build tool
- **Tailwind CSS** 3.4.1 - CSS Framework
- **Tiptap** 3.2.0 - Rich text editor
- **Radix UI** - Accessible components

#### Backend
- **Fastify** 5.3.2 - Web framework
- **MongoDB** 8.14.0 - Database
- **Mongoose** 8.14.0 - ODM
- **Redis** 5.8.1 - Cache
- **JWT** 9.0.2 - Authentication

### Useful Links

- **Repository**: [GitHub](https://github.com/yoricksenpai/MERN_chatai_blog)
- **Demo**: [iwomi-blog.netlify.app](https://iwomi-blog.netlify.app)
- **Issues**: [GitHub Issues](https://github.com/yoricksenpai/MERN_chatai_blog/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yoricksenpai/MERN_chatai_blog/discussions)

### Support

#### For Contributors

1. **Documentation**: Check the complete documentation first
2. **Existing Issues**: Verify if the problem is already reported
3. **Discussions**: Use GitHub Discussions for questions
4. **Contact**: Contact maintainers for urgent questions

#### For Maintainers

- **Code Review**: Reviews within 48h
- **Issues**: Weekly triage
- **Releases**: Monthly release cycle
- **Security**: Priority security patches

## 🎯 Roadmap and Contributions

### Current Priorities

- 🔄 **Performance**: Query and cache optimization
- 🌐 **Internationalization**: Multi-language support
- 📱 **Mobile**: Mobile experience improvements
- 🔒 **Security**: Security audit and hardening
- 🤖 **AI**: AI feature enhancements

### How to Contribute

1. **Issues**: Report bugs or propose features
2. **Code**: Submit PRs for fixes or new features
3. **Documentation**: Improve documentation
4. **Tests**: Add tests to improve coverage
5. **Review**: Participate in code reviews

### Recognition

All contributors are recognized in:
- **README.md**: Contributors list
- **CHANGELOG.md**: Credits per release
- **GitHub**: Contributors graph

---

**Thank you for contributing to MERN ChatAI Blog!** 🚀

Your contribution, whether small or large, helps improve this platform for the entire community. Don't hesitate to ask questions and share your ideas!

---

*Last updated: October 2025*  
*Guide version: 2.0.0*
