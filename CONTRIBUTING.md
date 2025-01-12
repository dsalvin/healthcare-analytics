# Contributing to Healthcare Analytics Platform

## Getting Started

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Development Process

### Branch Naming

- `feature/*` for new features
- `fix/*` for bug fixes
- `docs/*` for documentation
- `refactor/*` for code refactoring
- `test/*` for test additions or modifications

### Commit Messages

Follow conventional commits:
- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation
- `test:` for adding tests
- `refactor:` for refactoring code

### Code Style

- Use ESLint and Prettier configurations provided
- Write meaningful variable and function names
- Add comments for complex logic
- Include TypeScript types
- Write unit tests for new features

### Pull Request Process

1. Update documentation if required
2. Add tests for new features
3. Ensure CI/CD pipeline passes
4. Get review from at least one team member
5. Update PR based on review feedback

## Project Structure

Maintain the established project structure:
```
project-name/
├── .github/
├── docs/
├── server/
│   ├── auth-service/
│   ├── api-gateway/
│   ├── ml-service/
│   └── analytics-service/
├── client/
└── k8s/
```