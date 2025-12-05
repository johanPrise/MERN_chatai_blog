# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Which versions are eligible for receiving such patches depends on the CVSS v3.0 Rating:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of MERN ChatAI Blog seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### Please do NOT:

- Open a public GitHub issue for a security vulnerability
- Share the vulnerability publicly before it has been addressed

### Please DO:

1. **Email**: Send details to the project maintainers at [security@example.com]
   - Replace with actual contact if available, or use GitHub private security advisories

2. **Include in your report**:
   - Description of the vulnerability
   - Steps to reproduce the issue
   - Potential impact
   - Suggested fix (if any)
   - Your contact information for follow-up

3. **Expected Response Timeline**:
   - **Initial Response**: Within 48 hours
   - **Status Update**: Within 7 days
   - **Fix Timeline**: Depends on severity
     - Critical: 1-7 days
     - High: 7-30 days
     - Medium: 30-90 days
     - Low: Best effort

## Security Best Practices

When contributing to this project, please follow these security guidelines:

### Authentication & Authorization
- Never commit credentials, API keys, or secrets to the repository
- Use environment variables for all sensitive data
- Implement proper JWT token validation
- Follow the principle of least privilege for user roles

### Input Validation
- Always validate and sanitize user inputs
- Use parameterized queries to prevent SQL/NoSQL injection
- Implement rate limiting on API endpoints
- Validate file uploads (type, size, content)

### Dependencies
- Regularly update dependencies to patch known vulnerabilities
- Use `npm audit` or `pnpm audit` to check for vulnerabilities
- Review security advisories for dependencies

### Data Protection
- Hash passwords using bcrypt with appropriate cost factor
- Use HTTPS in production
- Implement CORS properly
- Protect against XSS, CSRF, and other common attacks

### Code Review
- All security-related changes must be reviewed by at least two maintainers
- Security patches should be tested in a staging environment before production

## Security Updates

Security updates will be announced through:
1. GitHub Security Advisories
2. Release notes in CHANGELOG.md
3. Project README.md

## Recognition

We appreciate responsible disclosure and will acknowledge security researchers who report vulnerabilities to us (unless they prefer to remain anonymous).

## Additional Resources

- [OWASP Top Ten](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [MongoDB Security Checklist](https://docs.mongodb.com/manual/administration/security-checklist/)
- [Fastify Security Considerations](https://www.fastify.io/docs/latest/Guides/Security/)

---

**Last Updated**: December 2025
