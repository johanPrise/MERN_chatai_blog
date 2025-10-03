# Contributing Guide

<cite>
**Referenced Files in This Document**   
- [CONTRIBUTING.md](file://CONTRIBUTING.md)
- [README.md](file://README.md)
- [package.json](file://package.json)
- [api-fastify/package.json](file://api-fastify/package.json)
- [api-fastify/tsconfig.json](file://api-fastify/tsconfig.json)
- [src/types/__tests__/AdminNotification.test.ts](file://src/types/__tests__/AdminNotification.test.ts)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Development Environment Setup](#development-environment-setup)
3. [Contribution Workflow](#contribution-workflow)
4. [Coding Standards](#coding-standards)
5. [Commit Message Conventions](#commit-message-conventions)
6. [Pull Request Guidelines](#pull-request-guidelines)
7. [Testing Requirements](#testing-requirements)
8. [Documentation and File Updates](#documentation-and-file-updates)
9. [Code Review Process](#code-review-process)
10. [Bug Reporting and Feature Requests](#bug-reporting-and-feature-requests)

## Introduction
This guide provides comprehensive instructions for contributing to the MERN_chatai_blog project. The project is a full-stack blog application built with the MERN stack (MongoDB, Express/Node.js, React, TypeScript) featuring an integrated AI chatbot. The repository contains both frontend and backend components, with a focus on modern development practices including TypeScript, ESLint, Prettier, and automated workflows.

The contribution process follows standard open-source practices with additional tooling for code quality assurance. This document expands on the existing CONTRIBUTING.md by providing practical examples from the codebase and detailed guidance for both first-time and experienced contributors.

**Section sources**
- [CONTRIBUTING.md](file://CONTRIBUTING.md#L1-L62)
- [README.md](file://README.md#L1-L115)

## Development Environment Setup

To set up the development environment for MERN_chatai_blog, follow these steps:

1. **Prerequisites**: Install Node.js (v14+), MongoDB, and either npm or pnpm package manager.

2. **Clone the repository**:
```bash
git clone <repository-url>
cd MERN_chatai_blog
```

3. **Install dependencies**:
- For the frontend: `pnpm install` or `npm install`
- For the backend: `cd api-fastify && pnpm install` or `npm install`

4. **Configure environment variables**:
Create a `.env` file in the `/api-fastify` directory based on the `.env.example` template, configuring necessary variables for database connection, JWT authentication, and other services.

5. **Start the development servers**:
The project provides multiple scripts for development:
- Start both frontend and backend: `npm run start` or `pnpm run start`
- Start backend only: `npm run start:backend` or `cd api-fastify && npm run dev`
- Start frontend only: `npm run start:frontend` or `npm run dev`

The backend uses Fastify with TypeScript, configured with `tsconfig.json` to target ES2022 with strict type checking and module resolution set to "NodeNext". The frontend uses Vite as the build tool with React 18 and TypeScript.

**Section sources**
- [README.md](file://README.md#L20-L80)
- [package.json](file://package.json#L5-L25)
- [api-fastify/package.json](file://api-fastify/package.json#L1-L20)
- [api-fastify/tsconfig.json](file://api-fastify/tsconfig.json#L1-L34)

## Contribution Workflow

The contribution workflow for MERN_chatai_blog follows a standard Git branching model with quality assurance checks:

1. **Create a feature branch**: Always create a new branch from the `main` branch for your work:
```bash
git checkout main
git pull origin main
git checkout -b feature/your-feature-name
```
Branch names should be descriptive and follow the pattern `feature/[description]` for new features or `fix/[description]` for bug fixes.

2. **Develop your changes**: Implement your feature or fix while adhering to the project's coding standards. The project uses TypeScript for both frontend and backend, with specific type definitions in `/src/types` for frontend and `/api-fastify/src/types` for backend.

3. **Run quality checks**: Before committing, ensure your code passes all quality checks:
- Run `npm run lint` or `pnpm run lint` to check code style
- Run `npm run type-check` or `pnpm run type-check` to verify TypeScript types
- Run `npm run test` or `pnpm run test` to execute tests

4. **Commit your changes**: Follow the commit message conventions outlined in this guide.

5. **Push and create a Pull Request**: Push your branch to the remote repository and create a Pull Request to the `main` branch.

The project uses Husky and lint-staged to enforce code quality on pre-commit, automatically running ESLint and Prettier on staged files to ensure consistent code style.

**Section sources**
- [CONTRIBUTING.md](file://CONTRIBUTING.md#L8-L15)
- [package.json](file://package.json#L10-L25)
- [README.md](file://README.md#L100-L110)

## Coding Standards

The MERN_chatai_blog project enforces strict coding standards to maintain code quality and consistency across the codebase:

### TypeScript Standards
- All new code must be written in TypeScript
- The project uses strict type checking as configured in `tsconfig.json`
- Type definitions should be placed in appropriate locations:
  - Frontend types: `/src/types/`
  - Backend types: `/api-fastify/src/types/`

### Code Style
- The project uses ESLint and Prettier for code formatting
- ESLint configuration enforces best practices and code quality
- Prettier ensures consistent code formatting across the codebase
- Frontend components follow React best practices with proper TypeScript typing

### Project Structure
The project maintains a clear separation between frontend and backend:

**Backend (`/api-fastify/src`)**:
- `/config`: Application configuration
- `/controllers`: Request handlers
- `/middlewares`: Fastify middleware functions
- `/models`: Mongoose models
- `/routes`: API route definitions
- `/services`: Business logic
- `/schemas`: Validation schemas
- `/types`: TypeScript type definitions
- `/utils`: Utility functions

**Frontend (`/src`)**:
- `/components`: Reusable React components
- `/contexts`: React context providers
- `/hooks`: Custom React hooks
- `/lib`: Utility functions and helpers
- `/pages`: Page-level components
- `/services`: API service clients
- `/types`: TypeScript type definitions
- `/utils`: Utility functions

New files should be placed in the appropriate directory according to this structure.

**Section sources**
- [CONTRIBUTING.md](file://CONTRIBUTING.md#L18-L50)
- [api-fastify/tsconfig.json](file://api-fastify/tsconfig.json#L1-L34)
- [src/types/__tests__/AdminNotification.test.ts](file://src/types/__tests__/AdminNotification.test.ts#L1-L85)

## Commit Message Conventions

The project follows conventional commit message formatting to ensure clear and consistent commit history:

### Commit Message Format
Commits should follow the pattern: `type(scope): description`

**Types**:
- `feat`: New features
- `fix`: Bug fixes
- `docs`: Documentation changes
- `style`: Code formatting changes (white-space, formatting, etc.)
- `refactor`: Code changes that neither fix bugs nor add features
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools

**Scopes**:
- For frontend changes: component name or feature area (e.g., `ui`, `auth`, `posts`)
- For backend changes: controller or service name (e.g., `user`, `post`, `auth`)

### Examples
- `feat(auth): add login page with form validation`
- `fix(post): resolve image upload issue in post editor`
- `refactor(ui): simplify button component structure`
- `docs(readme): update installation instructions`
- `test(auth): add unit tests for login service`

The scope should be as specific as possible to help reviewers understand the context of the change. The description should be a concise summary of the change in the imperative mood (e.g., "add" not "added" or "adds").

**Section sources**
- [CONTRIBUTING.md](file://CONTRIBUTING.md#L53-L62)

## Pull Request Guidelines

When submitting a pull request to MERN_chatai_blog, follow these guidelines to ensure a smooth review process:

### PR Requirements
1. **Clear description**: Provide a detailed description of the changes, including:
   - The problem being solved
   - The approach taken
   - Any alternative solutions considered
   - Screenshots for UI changes (if applicable)

2. **Reference issues**: If the PR addresses a specific issue, reference it using GitHub's syntax (e.g., `Fixes #123` or `Closes #123`).

3. **Pass all checks**: Ensure all automated tests pass and code quality checks are satisfied.

4. **Request review**: Assign appropriate reviewers based on the areas of code changed.

### Good PR Examples
A well-structured PR might include:
- **Title**: `feat(post-editor): add image upload capability`
- **Description**:
```
This PR adds image upload functionality to the post editor component.

Changes:
- Added UploadService to handle image uploads
- Integrated upload button in TiptapBlockEditor
- Added loading states and error handling
- Updated post schema to store image metadata

Fixes #45 - Image upload in post editor

Screenshots:
[Before and after images showing the new upload button]
```

### Common Pitfalls to Avoid
- Submitting PRs with multiple unrelated changes
- Not testing the changes thoroughly
- Ignoring linting or type errors
- Making changes without updating relevant documentation
- Large PRs that are difficult to review (consider breaking into smaller, focused PRs)

**Section sources**
- [CONTRIBUTING.md](file://CONTRIBUTING.md#L58-L62)
- [README.md](file://README.md#L105-L110)

## Testing Requirements

The MERN_chatai_blog project emphasizes test-driven development and requires appropriate test coverage for all contributions:

### Test Structure
- Frontend tests: Located in `/src/types/__tests__` and other component-specific test files
- Backend tests: To be created in appropriate service or controller test directories

### Test Coverage
- All new features must include unit tests
- Bug fixes should include tests that reproduce the issue
- Critical functionality should have high test coverage

### Running Tests
The project provides several test scripts:
- `npm run test` or `pnpm run test`: Run all tests once
- `npm run test:watch` or `pnpm run test:watch`: Run tests in watch mode
- `npm run test:coverage` or `pnpm run test:coverage`: Run tests with coverage reporting

The example test file `/src/types/__tests__/AdminNotification.test.ts` demonstrates how type definitions are tested by creating instances of types and verifying their structure. This approach ensures type safety and helps catch breaking changes early.

When writing tests, follow the existing patterns in the codebase and ensure tests are:
- Isolated (each test should be independent)
- Repeatable (produce the same results every time)
- Fast (avoid unnecessary delays)
- Clear (easy to understand what is being tested)

**Section sources**
- [package.json](file://package.json#L20-L24)
- [src/types/__tests__/AdminNotification.test.ts](file://src/types/__tests__/AdminNotification.test.ts#L1-L85)

## Documentation and File Updates

Contributors are expected to maintain documentation and update relevant files when making changes:

### Required Updates
When submitting changes, ensure the following files are updated as needed:

1. **README.md**: Update installation instructions, features list, or usage examples if your changes affect them.

2. **CONTRIBUTING.md**: If you identify improvements to the contribution process, update this document accordingly.

3. **Type definitions**: When adding new features, create or update appropriate TypeScript type definitions in the relevant `/types` directory.

4. **API documentation**: For backend changes, ensure route documentation is updated, particularly in the schema files (`/api-fastify/src/schemas/`).

### Documentation Standards
- Use clear, concise language
- Include code examples where helpful
- Keep documentation up to date with the current codebase
- Use consistent terminology throughout

### Example: Adding a New Feature
When adding a new feature like a notification system:
1. Update `README.md` to include the new feature in the features list
2. Add type definitions in `/src/types/NotificationTypes.ts`
3. Document API endpoints in `/api-fastify/src/schemas/notification.schema.ts`
4. Update `CONTRIBUTING.md` if new patterns or practices are introduced

**Section sources**
- [CONTRIBUTING.md](file://CONTRIBUTING.md#L20-L21)
- [README.md](file://README.md#L1-L115)

## Code Review Process

The code review process for MERN_chatai_blog ensures code quality and knowledge sharing among contributors:

### Review Expectations
1. **Timeliness**: Reviews should be conducted promptly, typically within 2-3 business days.
2. **Constructiveness**: Feedback should be specific, actionable, and respectful.
3. **Thoroughness**: Reviewers should check for:
   - Code quality and adherence to standards
   - Correctness of implementation
   - Test coverage
   - Performance implications
   - Security considerations
   - Documentation completeness

### Reviewer Responsibilities
- Verify that the code works as intended
- Check for edge cases and error handling
- Ensure tests are adequate and passing
- Confirm that documentation is updated
- Look for opportunities to simplify or improve the code
- Verify that the change aligns with the project's architecture and goals

### Author Responsibilities
- Respond promptly to review comments
- Make requested changes or provide justification for alternative approaches
- Update the PR description if the implementation changes significantly
- Re-request review after addressing feedback

The automated CI/CD pipeline runs linting, type checking, and tests on every PR, providing immediate feedback on code quality. Only PRs that pass all checks can be merged.

**Section sources**
- [CONTRIBUTING.md](file://CONTRIBUTING.md#L58-L62)

## Bug Reporting and Feature Requests

The project welcomes bug reports and feature suggestions from the community:

### Reporting Bugs
To report a bug, follow these steps:
1. Check if the issue has already been reported by searching existing issues.
2. Create a new issue with the "Bug" label.
3. Include the following information:
   - Clear description of the problem
   - Steps to reproduce
   - Expected behavior vs. actual behavior
   - Environment information (OS, browser, app version)
   - Screenshots or screen recordings if applicable
   - Console error messages

### Suggesting New Features
To suggest a new feature:
1. Search existing issues to avoid duplicates.
2. Create a new issue with the "Feature Request" label.
3. Provide:
   - Detailed description of the proposed feature
   - Use cases and benefits
   - Any design ideas or mockups
   - Potential implementation approaches
   - Links to similar features in other applications (if applicable)

### Issue Template
While the project doesn't currently have formal issue templates, following this structure is recommended:

```
**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected behavior**
A clear and concise description of what you expected to happen.

**Screenshots**
If applicable, add screenshots to help explain your problem.

**Environment:**
 - OS: [e.g. iOS]
 - Browser [e.g. chrome, safari]
 - Version [e.g. 22]

**Additional context**
Add any other context about the problem here.
```

For feature requests, use a similar structure with sections for description, use cases, and proposed implementation.

**Section sources**
- [CONTRIBUTING.md](file://CONTRIBUTING.md#L64-L67)
- [README.md](file://README.md#L100-L110)