# Testing Guide - Quick Reference

**Purpose:** Quick reference for writing tests with correct syntax and patterns.

**IMPORTANT:** Follow syntax rules in `.claude/conventions/code-style.md`

**Full documentation:** `docs/TESTING.md` (2,143 lines - complete guide)

---

## 📋 Quick Reference

**Testing Stack:**
- **Backend:** pytest + pytest-asyncio + pytest-cov
- **Frontend:** Vitest + React Testing Library + MSW
- **Pattern:** AAA (Arrange-Act-Assert)
- **Coverage Target:** >90% for critical paths (auth, ownership, services)

---

## 🐍 Backend Testing (pytest)

### AAA Pattern (MANDATORY)

```python
# ✅ CORRECT: Clear AAA sections with comments
def test_create_summary_with_valid_data(fake_db: Session, fake_user: User) -> None:
    """Test summary creation with valid document IDs and expertise level."""
    # Arrange: Prepare test data
    document = DocumentRepository.create(
        db=fake_db,
        user_id=fake_user.id,
        file_name="test.pdf",
        file_content=b"content",
        extracted_text="Sample text"
    )
    data = SummaryCreate(
        document_ids=[document.id],
        expertise_level="medio",
        title="Test Summary"
    )

    # Act: Execute the operation being tested
    result = SummaryService.create_summary(
        db=fake_db,
        user_id=fake_user.id,
        data=data
    )

    # Assert: Verify expectations
    assert result is not None
    assert result.user_id == fake_user.id
    assert result.expertise_level == "medio"
    assert result.title == "Test Summary"
```

### Fixtures (from conftest.py)

```python
# Available fixtures:
# - fake_db: Mock database session
# - fake_user: User(id, email="test@example.com", username="testuser")
# - fake_document: Document with extracted_text
# - fake_summary: Summary with JSONB content
# - fake_quiz: Quiz with questions
# - fake_quiz_attempt: QuizAttempt with answers

def test_get_user_summaries(fake_db: Session, fake_user: User) -> None:
    """Test retrieving user's summaries."""
    summaries = SummaryRepository.get_by_user_id(fake_db, fake_user.id)
    assert isinstance(summaries, list)

# ❌ WRONG: Creating mock data manually when fixture exists
def test_get_user_summaries(fake_db: Session) -> None:
    user = User(id=uuid4(), email="test@example.com")  # Use fake_user instead
```

### Testing Exceptions

```python
import pytest
from fastapi import HTTPException

def test_create_summary_raises_404_when_document_not_found(
    fake_db: Session,
    fake_user: User
) -> None:
    """Test that creating summary with non-existent document raises 404."""
    # Arrange
    non_existent_id = uuid4()
    data = SummaryCreate(document_ids=[non_existent_id], expertise_level="medio")

    # Act & Assert
    with pytest.raises(HTTPException) as exc_info:
        SummaryService.create_summary(fake_db, fake_user.id, data)

    assert exc_info.value.status_code == 404
    assert "not found" in exc_info.value.detail.lower()
```

### Mocking OpenAI

```python
from unittest.mock import patch

def test_generate_summary_calls_openai(
    fake_db: Session,
    fake_user: User,
    fake_document: Document
) -> None:
    """Test that summary generation calls OpenAI API."""
    # Arrange
    mock_response = {
        "summary": "Test summary",
        "key_points": ["Point 1"],
        "detailed_sections": []
    }

    # Act & Assert
    with patch('app.services.openai_service.OpenAIService.generate_summary') as mock_openai:
        mock_openai.return_value = mock_response

        data = SummaryCreate(document_ids=[fake_document.id], expertise_level="medio")
        result = SummaryService.create_summary(fake_db, fake_user.id, data)

        mock_openai.assert_called_once()
        assert result.content == mock_response
```

---

## 📘 Frontend Testing (Vitest + React Testing Library)

### Component Test Structure

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Modal } from './Modal';

describe('Modal Component', () => {
  it('renders with title and children', () => {
    // Arrange
    const title = 'Test Modal';
    const content = 'Modal content';

    // Act
    render(
      <Modal isOpen={true} onClose={vi.fn()} title={title}>
        <p>{content}</p>
      </Modal>
    );

    // Assert
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(title)).toBeInTheDocument();
    expect(screen.getByText(content)).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    // Arrange
    const user = userEvent.setup();
    const onClose = vi.fn();

    // Act
    render(
      <Modal isOpen={true} onClose={onClose} title="Test">
        <p>Content</p>
      </Modal>
    );

    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);

    // Assert
    expect(onClose).toHaveBeenCalledOnce();
  });
});
```

### API Mocking with MSW

```typescript
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { listSummaries } from './summaries.api';

const server = setupServer(
  http.get('/api/summaries', () => {
    return HttpResponse.json([
      { id: '123', title: 'Test Summary', expertise_level: 'medio' },
    ]);
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('summaries.api', () => {
  it('fetches summaries successfully', async () => {
    const summaries = await listSummaries();
    expect(summaries).toHaveLength(1);
    expect(summaries[0].title).toBe('Test Summary');
  });
});
```

---

## 🚫 Anti-Patterns (AVOID)

### ❌ Vague Tests
```python
# ❌ WRONG: Unclear what is being tested
def test_summary():
    summary = create_summary()
    assert summary

# ✅ CORRECT: Specific test with clear intent
def test_create_summary_with_default_expertise_level_returns_medio():
    """Test that creating summary without expertise level defaults to 'medio'."""
    ...
```

### ❌ Testing Implementation Instead of Behavior
```python
# ❌ WRONG: Testing internal implementation
def test_summary_service_calls_repository_create():
    with patch('app.repositories.summary_repository.SummaryRepository.create') as mock:
        SummaryService.create_summary(...)
        mock.assert_called_once()  # Testing internals

# ✅ CORRECT: Testing observable behavior
def test_create_summary_returns_summary_with_user_id():
    """Test that created summary belongs to the correct user."""
    result = SummaryService.create_summary(fake_db, fake_user.id, data)
    assert result.user_id == fake_user.id  # Testing outcome
```

### ❌ Tests with Sleeps
```python
# ❌ WRONG: Arbitrary sleep
import time

def test_async_operation():
    start_operation()
    time.sleep(5)  # Slow and unreliable
    assert operation_completed()

# ✅ CORRECT: Proper async patterns
async def test_async_operation():
    await async_operation()
    assert operation_completed()
```

---

## 🏃 Running Tests

### Backend Commands
```bash
# All tests
cd backend
.venv/Scripts/python.exe -m pytest tests/ -v

# Specific file
.venv/Scripts/python.exe -m pytest tests/test_auth_me.py -v

# With coverage
.venv/Scripts/python.exe -m pytest tests/ --cov=app --cov-report=html

# Last failed
.venv/Scripts/python.exe -m pytest --lf -v
```

### Frontend Commands
```bash
# All tests
cd frontend
pnpm test

# Watch mode
pnpm test --watch

# With coverage
pnpm test --coverage

# Specific file
pnpm test src/components/ui/Modal.test.tsx
```

---

## 📊 Coverage Guidelines

**Backend (pytest-cov):**
- Critical paths (auth, ownership): 100%
- Services: >90%
- Repositories: >85%
- Overall: >85%

**Frontend (Vitest):**
- Critical components (AuthContext, ProtectedRoute): 100%
- UI components: >80%
- API services: >90%
- Overall: >80%

---

## ✅ Pre-Test Checklist

- [ ] Test file named correctly (`test_*.py` or `*.test.tsx`)
- [ ] Test function descriptive (`test_what_when_expected`)
- [ ] AAA pattern clearly visible
- [ ] Type hints included (Python/TypeScript)
- [ ] Using fixtures instead of manual setup
- [ ] Specific assertions (not just `assert result`)
- [ ] Mocking external APIs (OpenAI, HTTP requests)
- [ ] Test is isolated (doesn't depend on other tests)
- [ ] Clear docstring explaining test purpose

---

**Code Style:** `.claude/conventions/code-style.md`
**Full Guide:** `docs/TESTING.md`
**Last Updated:** 2025-11-29