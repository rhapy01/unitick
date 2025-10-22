# Contributing to UniTick

Thank you for your interest in contributing to UniTick! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- pnpm (recommended) or npm
- Git
- Basic knowledge of React, TypeScript, and blockchain development

### Development Setup
1. Fork the repository
2. Clone your fork: `git clone https://github.com/yourusername/unitick.git`
3. Install dependencies: `pnpm install`
4. Set up environment variables (see README.md)
5. Start the development server: `pnpm dev`

## 📋 Development Guidelines

### Code Style
- Use TypeScript for all new code
- Follow the existing code style and patterns
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused

### Git Workflow
1. Create a feature branch from `main`
2. Make your changes
3. Write tests for new functionality
4. Ensure all tests pass
5. Commit with descriptive messages
6. Push to your fork
7. Create a Pull Request

### Commit Messages
Use conventional commit format:
```
type(scope): description

feat(auth): add OAuth login support
fix(wallet): resolve encryption key generation issue
docs(readme): update installation instructions
test(api): add unit tests for payment verification
```

## 🧪 Testing

### Running Tests
```bash
# Unit tests
pnpm test

# Contract tests
npx hardhat test

# Type checking
pnpm type-check

# Linting
pnpm lint
```

### Writing Tests
- Write tests for all new features
- Aim for high test coverage
- Test both success and error cases
- Use descriptive test names

## 📝 Documentation

### Code Documentation
- Add JSDoc comments for functions and classes
- Document complex algorithms
- Update README.md for new features
- Keep API documentation current

### Pull Request Documentation
- Provide a clear description of changes
- Include screenshots for UI changes
- Reference related issues
- Update documentation if needed

## 🐛 Bug Reports

### Before Reporting
1. Check existing issues
2. Try the latest version
3. Reproduce the issue
4. Gather relevant information

### Bug Report Template
```markdown
**Bug Description**
A clear description of the bug.

**Steps to Reproduce**
1. Go to '...'
2. Click on '...'
3. See error

**Expected Behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment**
- OS: [e.g., Windows 10]
- Browser: [e.g., Chrome 91]
- Node.js version: [e.g., 18.0.0]

**Additional Context**
Any other context about the problem.
```

## ✨ Feature Requests

### Before Requesting
1. Check existing feature requests
2. Consider if it aligns with project goals
3. Think about implementation complexity
4. Consider user impact

### Feature Request Template
```markdown
**Feature Description**
A clear description of the feature.

**Problem Statement**
What problem does this solve?

**Proposed Solution**
How should this be implemented?

**Alternatives Considered**
Other solutions you've considered.

**Additional Context**
Any other context about the feature request.
```

## 🔒 Security

### Reporting Security Issues
- **DO NOT** create public issues for security vulnerabilities
- Email security issues to: security@unitick.com
- Include detailed information about the vulnerability
- Allow reasonable time for response before public disclosure

### Security Guidelines
- Never commit secrets or API keys
- Use environment variables for sensitive data
- Follow secure coding practices
- Validate all user inputs
- Use HTTPS in production

## 📊 Code Review Process

### For Contributors
- Respond to review feedback promptly
- Make requested changes
- Ask questions if feedback is unclear
- Be open to suggestions

### For Reviewers
- Be constructive and helpful
- Focus on code quality and correctness
- Check for security issues
- Ensure tests are adequate
- Verify documentation is updated

## 🏷️ Labels and Milestones

### Issue Labels
- `bug`: Something isn't working
- `enhancement`: New feature or request
- `documentation`: Improvements to documentation
- `good first issue`: Good for newcomers
- `help wanted`: Extra attention is needed
- `priority: high`: High priority issue
- `priority: low`: Low priority issue

### Pull Request Labels
- `ready for review`: Ready for code review
- `needs changes`: Requires changes before merge
- `approved`: Approved for merge
- `breaking change`: Contains breaking changes

## 🤝 Community Guidelines

### Code of Conduct
- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Help others learn and grow

### Communication
- Use clear and concise language
- Be patient with questions
- Provide helpful responses
- Stay on topic

## 📚 Resources

### Learning Materials
- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Supabase Documentation](https://supabase.com/docs)
- [Hardhat Documentation](https://hardhat.org/docs)
- [React Documentation](https://react.dev/)

### Tools
- [VS Code](https://code.visualstudio.com/) - Recommended editor
- [GitHub Desktop](https://desktop.github.com/) - Git GUI
- [Postman](https://www.postman.com/) - API testing

## 🎯 Project Roadmap

### Current Focus
- Performance optimization
- Enhanced security features
- Mobile responsiveness
- Additional payment methods

### Future Plans
- Multi-chain support
- Advanced analytics
- Vendor marketplace features
- Mobile app development

## ❓ Questions?

- Check the [documentation](docs/)
- Search existing [issues](https://github.com/yourusername/unitick/issues)
- Join [discussions](https://github.com/yourusername/unitick/discussions)
- Contact maintainers

---

Thank you for contributing to UniTick! 🎉
