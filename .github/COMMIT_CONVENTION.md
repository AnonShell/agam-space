# Conventional Commits Configuration

This repository follows the
[Conventional Commits](https://www.conventionalcommits.org/) specification.

## Commit Message Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Type

Must be one of:

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style (formatting, missing semicolons, etc.)
- **refactor**: Code refactoring
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **chore**: Build process, auxiliary tools, dependencies
- **ci**: CI/CD configuration
- **security**: Security fixes

### Scope

The scope should be the area affected:

- **api** - Backend API server
- **web** - Frontend web app
- **docker** - Docker/deployment
- **github** - GitHub config (workflows, templates)
- **crypto** - Encryption/E2EE
- **storage** - File storage
- **database** - Database schema/migrations
- **deps** - Dependencies

### Subject

- Use imperative, present tense: "add" not "added" nor "adds"
- Don't capitalize first letter
- No period (.) at the end
- Maximum 72 characters

### Examples

```
feat(api): add file sharing between users
fix(docker): upgrade npm to 11.7.0 to resolve CVE-2025-64756
docs(readme): update installation instructions
chore(deps): upgrade NestJS to v11
security(api): patch session expiration vulnerability
refactor(web): simplify file upload component
perf(database): add index on file queries
ci(github): add issue templates and labels
```

## IDE Configuration

### For GitHub Copilot (JetBrains/VSCode)

1. Git commit template is configured in `.gitmessage`
2. Commitlint validates commit messages in CI
3. Use the template as a guide when writing commits

### Manual Configuration

```bash
# Apply the commit template
git config commit.template .gitmessage

# Verify configuration
git config commit.template
```

## Validation

Commits are validated by commitlint in the pre-commit hook and CI pipeline.

Invalid commits will be rejected:

```
❌ "Fixed bug"
❌ "Updated files"
❌ "WIP"
```

Valid commits:

```
✅ fix(api): correct session expiration logic
✅ feat(web): add dark mode support
✅ docs: update contributing guidelines
```
