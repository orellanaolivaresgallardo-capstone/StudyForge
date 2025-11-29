# Conventional Commits Convention

This document defines the commit message format used in StudyForge, following the [Conventional Commits 1.0.0](https://www.conventionalcommits.org/) specification.

## Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Components

#### Type (Required)

Describes the kind of change being made:

- **feat**: New feature for the user
- **fix**: Bug fix
- **refactor**: Code restructuring without behavior change
- **perf**: Performance improvements
- **docs**: Documentation only changes
- **test**: Adding or updating tests
- **style**: Formatting, missing semicolons, etc. (no code change)
- **build**: Build system or dependency changes
- **ci**: CI configuration changes
- **chore**: Maintenance tasks (no production code change)

#### Scope (Optional)

Indicates the area of the codebase affected:

- **backend**: Python/FastAPI/SQLAlchemy changes
- **frontend**: React/TypeScript changes
- **database**: Migrations, schema changes
- **api**: API endpoints or schemas
- **auth**: Authentication/authorization
- **docs**: Documentation files
- **config**: Configuration files
- **agents**: Claude Code agent changes
- **tests**: Test suite changes

Examples:
- `feat(backend): Add user authentication endpoints`
- `fix(frontend): Correct quiz option randomization display`
- `refactor(database): Optimize summary query with eager loading`

#### Subject (Required)

Short description of the change:
- Use imperative mood ("Add feature" not "Added feature")
- Don't capitalize first letter
- No period at the end
- Maximum 50 characters

#### Body (Optional)

Detailed explanation of the change:
- Use bullet points for multiple changes
- Explain **what** and **why**, not **how**
- Wrap at 72 characters per line

#### Footer (Optional)

Contains metadata:
- **Breaking changes**: `BREAKING CHANGE: description`
- **Issue references**: `Closes #123`, `Fixes #456`
- **Reviewers**: `Reviewed-by: @username`

## Examples

### Simple Feature Addition

```
feat(backend): Add quiz adaptive difficulty calculation

- Implement calculate_adaptive_difficulty() in QuizService
- Consider last 5 attempts per study space
- Adjust difficulty based on success rate (±1 level)
- Add unit tests for edge cases
```

### Bug Fix with Issue Reference

```
fix(frontend): Prevent quiz submission with unanswered questions

Users could submit quizzes without answering all questions,
leading to incorrect scoring and poor UX.

- Add validation before submit
- Show error message for incomplete quizzes
- Disable submit button until all answered

Fixes #234
```

### Breaking Change

```
feat(api): Change summary response format to include metadata

BREAKING CHANGE: Summary API response structure changed

Old format:
{
  "id": "...",
  "content": {...}
}

New format:
{
  "id": "...",
  "content": {...},
  "metadata": {
    "document_count": 2,
    "word_count": 450
  }
}

Migration: Update frontend to expect new structure
Impact: All API consumers must update
```

### Documentation Update

```
docs: Add ISO 27001 compliance documentation

- Create docs/security/COMPLIANCE_CHECKLIST.md
- Document implemented controls (A.9, A.10, A.12.4)
- Add risk assessment and treatment plan
- Include audit logging examples
```

### Refactoring

```
refactor(backend): Extract file validation to separate utility

- Move magic number validation from file_processor to file_validator
- Add comprehensive unit tests for validation logic
- Improve error messages for unsupported file types
```

### Performance Improvement

```
perf(database): Add indexes to frequently queried foreign keys

- Add index to summaries.user_id (~40% faster list queries)
- Add index to quiz_attempts.quiz_id (optimize statistics)
- Add GIN index to summaries.content for JSONB queries

Benchmark results show 30-50% improvement in list endpoints
```

### Multiple Scopes

When a change affects multiple scopes, choose the primary one or use comma-separated scopes:

```
feat(backend,frontend): Implement study space organization

Backend:
- Add StudySpace model and repository
- Create study space CRUD endpoints
- Add ownership validation

Frontend:
- Create StudySpacesPage component
- Add study space API service
- Implement space selection UI
```

## Commit Types Distribution (Recommended)

Based on StudyForge development patterns:

- **feat**: ~35% (new features)
- **fix**: ~20% (bug fixes)
- **refactor**: ~15% (code improvements)
- **test**: ~15% (test additions)
- **docs**: ~10% (documentation)
- **perf**: ~3% (performance)
- **build/ci/chore**: ~2% (infrastructure)

## Tools and Automation

### commit-organizer Agent

Use the `commit-organizer` agent to automatically:
- Analyze staged/unstaged changes
- Group related files into logical commits
- Generate Conventional Commits formatted messages
- Detect appropriate type and scope

Usage:
```
> Help me commit these changes
> Use commit-organizer to organize my commits
```

### Pre-commit Hooks

Consider adding pre-commit hooks to validate:
- Commit message format
- Type and scope validity
- Subject length (<50 chars)
- No trailing periods in subject

## Benefits

1. **Automated CHANGELOG**: Tools can parse commits to generate changelogs
2. **Semantic Versioning**: Types indicate version bumps (feat=minor, fix=patch, BREAKING=major)
3. **Clearer History**: Consistent format makes `git log` readable
4. **Code Review**: Reviewers quickly understand change scope
5. **Automated Tooling**: CI/CD can trigger based on commit types

## Common Mistakes to Avoid

❌ **Vague subjects**
```
fix: fix bug
docs: update docs
```

✅ **Specific subjects**
```
fix(auth): Prevent token expiration during active sessions
docs(api): Add authentication flow diagram to API.md
```

❌ **Missing scope when obvious**
```
feat: Add new endpoint
```

✅ **Include scope**
```
feat(backend): Add user preferences endpoint
```

❌ **Multiple unrelated changes in one commit**
```
feat: Add quiz feature and fix auth bug and update docs
```

✅ **Atomic commits**
```
feat(backend): Add adaptive quiz difficulty calculation
fix(auth): Prevent concurrent login sessions
docs: Update API documentation for quiz endpoints
```

❌ **Using past tense**
```
feat: Added user authentication
```

✅ **Imperative mood**
```
feat: Add user authentication
```

## References

- [Conventional Commits 1.0.0](https://www.conventionalcommits.org/)
- [Angular Commit Guidelines](https://github.com/angular/angular/blob/main/CONTRIBUTING.md#commit)
- [Semantic Versioning 2.0.0](https://semver.org/)
- [Keep a Changelog](https://keepachangelog.com/)

---

**Last Updated**: 2025-11-29
**Version**: 1.0.0
