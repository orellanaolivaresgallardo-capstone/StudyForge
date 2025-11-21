# CLAUDE.md - AI Assistant Guide for StudyForge

> **Purpose**: This document provides AI assistants with comprehensive context about the StudyForge codebase, including architecture, conventions, workflows, and critical patterns to follow when making changes.

**Last Updated**: 2025-11-21
**Project**: StudyForge - AI-Powered Study Assistant
**Tech Stack**: FastAPI + PostgreSQL + React + OpenAI

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture & Design Patterns](#architecture--design-patterns)
3. [Directory Structure](#directory-structure)
4. [Backend Architecture](#backend-architecture)
5. [Frontend Architecture](#frontend-architecture)
6. [Database Schema & Migrations](#database-schema--migrations)
7. [Authentication & Authorization](#authentication--authorization)
8. [AI/ML Integration](#aiml-integration)
9. [Development Workflows](#development-workflows)
10. [Testing Conventions](#testing-conventions)
11. [Code Conventions & Style](#code-conventions--style)
12. [Common Tasks & Patterns](#common-tasks--patterns)
13. [Troubleshooting Guide](#troubleshooting-guide)
14. [Critical Rules for AI Assistants](#critical-rules-for-ai-assistants)

---

## Project Overview

### What is StudyForge?

StudyForge is a web application that helps students study more effectively by:
- **Document Management**: Upload and manage study materials (PDF, DOCX, TXT)
- **AI Summaries**: Generate concise summaries from documents
- **AI Quizzes**: Create practice quizzes with automatic grading
- **Secure Authentication**: User accounts with JWT-based auth

### Current State

- **Functional E2E**: Backend API, PostgreSQL database, and React frontend fully connected
- **Recent Features**: PDF/DOCX upload support, AI summaries & quizzes working
- **Latest Commit**: `54f9514` - "feat: soporte PDF y DOCX para carga de documentos"
- **Branch**: `claude/claude-md-mi84fwvpfds22bh0-01HYn6UCs5LZGawg7oxVDKE4`

---

## Architecture & Design Patterns

### Layered Architecture

```
┌─────────────────────────────────────────────┐
│          React Frontend (Vite)              │
│      TypeScript + React 19 + TailwindCSS    │
└─────────────────────────────────────────────┘
                     ↓ HTTP/REST
┌─────────────────────────────────────────────┐
│            API Layer (FastAPI)              │
│         Routers (auth, documents, etc.)     │
└─────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────┐
│         Service Layer (Business Logic)      │
│   DocumentService, SummaryService, etc.     │
└─────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────┐
│      Repository Layer (Data Access)         │
│         SQLAlchemy ORM Models               │
└─────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────┐
│         PostgreSQL Database                 │
│         Schema: studyforge (not public!)    │
└─────────────────────────────────────────────┘
```

### Key Patterns Used

1. **Repository Pattern**: Data access abstracted in `repositories/models.py`
2. **Service Layer**: Business logic in `services/` (e.g., `document_service.py`)
3. **Provider Pattern**: LLM abstraction (`LlmProvider` → `OpenAiAdapter`)
4. **Dependency Injection**: FastAPI's `Depends()` for auth and DB sessions
5. **Schema Validation**: Pydantic v2 models in `schemas/` for request/response validation
6. **Migration Management**: Alembic for database versioning

---

## Directory Structure

### Backend (`/backend/`)

```
backend/
├── alembic/                    # Database migrations (7 versions)
│   ├── versions/               # Migration scripts
│   └── env.py                  # Alembic config (reads .env.alembic)
├── app/
│   ├── routers/                # API endpoints (17 routes total)
│   │   ├── auth.py             # /auth/signup, /auth/login, /auth/me
│   │   ├── documents.py        # CRUD + /extract-text
│   │   ├── summaries.py        # Summary CRUD + /auto
│   │   ├── quizz.py            # Quiz generation + /check grading
│   │   └── health.py           # /health
│   ├── services/               # Business logic
│   │   ├── document_service.py # File processing (PDF/DOCX/TXT)
│   │   ├── summary_service.py  # AI summarization with chunking
│   │   ├── quiz_service.py     # AI quiz generation & grading
│   │   ├── llm_provider.py     # Abstract LLM interface
│   │   └── openai_adapter.py   # OpenAI implementation
│   ├── repositories/
│   │   └── models.py           # SQLAlchemy ORM (5 models)
│   ├── schemas/                # Pydantic models
│   │   ├── auth_schemas.py
│   │   ├── document_schemas.py
│   │   ├── summary_schemas.py
│   │   └── quizz_schemas.py
│   ├── core/
│   │   ├── security.py         # JWT + Argon2 password hashing
│   │   └── deps.py             # get_current_user() dependency
│   ├── db.py                   # Database session management
│   └── main.py                 # FastAPI app + CORS + router registration
├── tests/
│   ├── test_auth_me.py         # Auth endpoint tests
│   └── test_documents_guard.py # Authorization tests
├── requirements.txt            # Python dependencies
├── alembic.ini                 # Alembic configuration
├── pytest.ini                  # Pytest configuration
├── .env.example                # Environment template
└── .env.alembic.example        # Migration env template
```

### Frontend (`/frontend/`)

```
frontend/
├── src/
│   ├── pages/                  # Page components
│   │   ├── home.tsx            # Main dashboard
│   │   ├── login.tsx           # Authentication
│   │   ├── signup.tsx          # Registration
│   │   ├── uploaddocuments.tsx # File upload (drag-and-drop)
│   │   ├── quiz.tsx            # Quiz interface
│   │   ├── QuizRunner.tsx      # Quiz component
│   │   └── results.tsx         # Results display
│   ├── components/
│   │   └── Navbar.tsx          # Navigation bar
│   ├── services/
│   │   └── api.ts              # API client (Axios/Fetch)
│   ├── App.tsx                 # App component
│   ├── main.tsx                # Entry point + React Router v7
│   ├── index.css               # Global styles (Tailwind)
│   └── App.css                 # App-specific styles
├── public/
│   └── img/                    # Static images
├── package.json                # Dependencies (React 19, Vite 6)
├── vite.config.ts              # Vite configuration
├── tsconfig.json               # TypeScript config
├── eslint.config.js            # ESLint config
└── pnpm-lock.yaml              # pnpm lockfile
```

---

## Backend Architecture

### Database Models (`app/repositories/models.py`)

**CRITICAL**: All tables use the `studyforge` schema, NOT `public`.

#### 1. User Model
```python
class User(Base):
    __tablename__ = "users"
    __table_args__ = {"schema": "studyforge"}

    id: int (PK)
    name: str
    email: str (unique, indexed)
    password_hash: str
    created_at: datetime

    # Relationships
    documents: List[Document]
```

#### 2. Document Model
```python
class Document(Base):
    __tablename__ = "documents"
    __table_args__ = (
        CheckConstraint("title IS NOT NULL AND title ~ '\\S'"),
        CheckConstraint("content IS NOT NULL AND content ~ '\\S'"),
        {"schema": "studyforge"}
    )

    id: int (PK)
    user_id: int (FK → users.id)
    title: str (not null, not blank)
    description: str (nullable)
    content: str (not null, not blank)
    created_at: datetime
    updated_at: datetime

    # Relationships
    owner: User
    summaries: List[Summary] (cascade delete)
    quizzes: List[Quiz] (cascade delete)
```

#### 3. Summary Model
```python
class Summary(Base):
    __tablename__ = "summaries"
    __table_args__ = {"schema": "studyforge"}

    id: int (PK)
    title: str
    content: str
    document_id: int (FK → documents.id)
    user_id: int (FK → users.id)
    created_at: datetime
```

#### 4. Quiz Model
```python
class Quiz(Base):
    __tablename__ = "quizzes"
    __table_args__ = {"schema": "studyforge"}

    id: int (PK)
    title: str
    user_id: int (FK → users.id)
    document_id: int (FK → documents.id, cascade delete)
    size: int
    created_at: datetime

    # Relationships
    questions: List[QuizQuestion] (cascade delete)
```

#### 5. QuizQuestion Model
```python
class QuizQuestion(Base):
    __tablename__ = "quiz_questions"
    __table_args__ = {"schema": "studyforge"}

    id: int (PK)
    quiz_id: int (FK → quizzes.id, cascade delete)
    question: str
    options_json: str (JSON array of 4 options)
    answer_index: int (0-3)
    explanation: str
```

### API Endpoints Reference

#### Authentication (`/auth`)
- **POST** `/auth/signup` - Create user account
  - Body: `{ name, email, password }`
  - Returns: `{ id, name, email, created_at }`
  - Validates: email format, password strength
  - Hashes: Argon2 password hashing

- **POST** `/auth/login` - User login
  - Body: `{ email, password }`
  - Returns: `{ access_token, token_type: "bearer" }`
  - Validates: credentials with Argon2 verification

- **GET** `/auth/me` - Get current user (protected)
  - Headers: `Authorization: Bearer <token>`
  - Returns: `{ id, name, email, created_at }`

#### Documents (`/documents`)
- **GET** `/documents` - List user's documents (protected)
  - Filters by current user automatically
  - Returns: `{ items: [Document] }`

- **POST** `/documents` - Create document (protected)
  - Body: `{ title, content, description? }`
  - Auto-assigns to current user
  - Validates: non-empty title and content

- **DELETE** `/documents/{doc_id}` - Delete document (protected)
  - Validates: ownership
  - Cascades: deletes summaries and quizzes

- **POST** `/documents/extract-text` - Extract text from file
  - Body: `multipart/form-data { file: File }`
  - Supports: PDF, DOCX, TXT (max 25MB)
  - Returns: `{ text: str }`

#### Summaries (`/summaries`)
- **GET** `/summaries?document_id=X` - List summaries (protected)
  - Optional: filter by document_id
  - Filters by current user

- **POST** `/summaries` - Create manual summary (protected)
  - Body: `{ title, content, document_id }`

- **DELETE** `/summaries/{id}` - Delete summary (protected)

- **POST** `/summaries/auto?document_id=X&max_sentences=5` - AI summary (protected)
  - Params: document_id (required), max_sentences (1-12, default 5)
  - Uses: OpenAI with chunking strategy
  - Returns: `{ id, title, content, ... }`

#### Quizzes (`/quizzes`)
- **POST** `/quizzes/auto?document_id=X&size=6` - Generate AI quiz (protected)
  - Params: document_id (required), size (3-10, default 5)
  - Returns: `Quiz` with `questions: [QuizQuestion]`

- **GET** `/quizzes?document_id=X` - List quizzes (protected)
  - Required: document_id

- **GET** `/quizzes/{quiz_id}` - Get quiz with questions (protected)

- **POST** `/quizzes/{quiz_id}/check` - Grade quiz (protected)
  - Body: `{ answers: [int] }` (indices 0-3)
  - Returns: `{ correct, total, percentage, details: [...] }`

- **DELETE** `/quizzes/{quiz_id}` - Delete quiz (protected)

#### Health (`/health`)
- **GET** `/health` - Health check (public)
  - Returns: `{ status: "ok" }`

### Service Layer Details

#### DocumentService (`services/document_service.py`)
**Purpose**: Document CRUD and file processing

**Key Methods**:
- `list_documents(user_id)` - Get all user's documents
- `create_document(user_id, title, content, description)` - Create document
- `delete_document(doc_id, user_id)` - Delete with ownership check
- `extract_text_from_file(file_bytes, filename)` - Extract from PDF/DOCX/TXT

**File Processing**:
- **PDF**: Uses `pypdf.PdfReader`
- **DOCX**: Uses `python-docx`
- **TXT**: Direct UTF-8 decode
- **Validation**: Max 25MB, supported types only
- **Normalization**: Unicode NFKC normalization

#### SummaryService (`services/summary_service.py`)
**Purpose**: AI-powered summarization

**Key Methods**:
- `summarize_strict(user_id, document_id, max_sentences)` - AI summarization
- `list_summaries(user_id, document_id?)` - List with optional filter
- `create_manual_summary(...)` - Manual summary creation
- `delete_summary(summary_id, user_id)` - Delete with ownership

**AI Strategy**:
- **Chunking**: Max 2400 chars per chunk
- **Two-stage**: Long documents → chunk summaries → final summary
- **Model**: OpenAI gpt-4o-mini (configurable)
- **Timeout**: 12 seconds
- **Error Handling**: 503 on AI failure

#### QuizService (`services/quiz_service.py`)
**Purpose**: AI quiz generation and grading

**Key Methods**:
- `generate_quiz(user_id, document_id, size)` - AI quiz generation
- `grade_quiz(quiz_id, answers)` - Grade with detailed feedback
- `list_quizzes(user_id, document_id)` - List quizzes
- `get_quiz_with_questions(quiz_id, user_id)` - Retrieve quiz
- `delete_quiz(quiz_id, user_id)` - Delete with ownership

**AI Quiz Format**:
```json
{
  "questions": [
    {
      "question": "Question text?",
      "options": ["A", "B", "C", "D"],
      "answer": 0,
      "explanation": "Why this is correct"
    }
  ]
}
```

**Validation**:
- Exactly 4 options per question
- Answer index must be 0-3
- Robust JSON parsing with fence stripping (````json ... ```)

---

## Frontend Architecture

### Routing Setup (`src/main.tsx`)

**Router**: React Router v7 (`createBrowserRouter`)

**Routes**:
- `/` → `home.tsx` (Main dashboard)
- `/login` → `login.tsx` (Authentication)
- `/signup` → `signup.tsx` (Registration)
- `*` → Redirect to home

**Hybrid Approach**: Some pages are React SPA routes, others are standalone HTML files (marketing pages).

### State Management

**Pattern**: Local state only (no Redux/Context)
- React hooks: `useState`, `useEffect`
- Component-level state
- Props for parent-child communication
- Token storage: `localStorage` (remember me) or `sessionStorage`

### API Integration (`src/services/api.ts`)

**Base URL**: `VITE_API_BASE` environment variable

**Common Pattern**:
```typescript
async function apiCall() {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const response = await fetch(`${BASE_URL}/endpoint`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    if (response.status === 401) {
      // Redirect to login
    }
    throw new Error('API error');
  }

  return response.json();
}
```

**Functions Available**:
- `health()` - Health check
- `listDocuments()` - Get documents
- `createDocument(title, content, description)` - Create document
- (Add more as needed in `api.ts`)

### File Upload Pattern

**Location**: `src/pages/uploaddocuments.tsx`

**Features**:
- Drag-and-drop support
- File type validation (PDF, DOCX, TXT)
- Size validation (max 25MB)
- FormData multipart upload
- Progress feedback

**Flow**:
1. User selects/drops file
2. Validate type and size client-side
3. Create FormData with file
4. POST to `/documents/extract-text`
5. Use extracted text to create document

---

## Database Schema & Migrations

### Schema Configuration

**CRITICAL**: This project uses the `studyforge` schema, NOT the default `public` schema.

**Connection String**:
```
postgresql+psycopg://user:pass@localhost:5432/studyforge?options=-csearch_path=studyforge,public
```

**Why?**: Namespace isolation for multi-tenant future support.

### Migration System (Alembic)

**Configuration**:
- File: `backend/alembic.ini`
- Env: `backend/alembic/env.py`
- Versions: `backend/alembic/versions/` (7 migrations)

**Environment Variables**:
- Runtime: `DATABASE_URL` in `.env` (uses app role)
- Migrations: `ALEMBIC_URL` in `.env.alembic` (uses owner role)

**Two-Role System**:
1. **Owner** (`studyforge_owner`): DDL operations, migrations
2. **App** (`studyforge_app`): DML operations, runtime queries

**Common Commands**:
```bash
cd backend
source .venv/bin/activate  # or .\.venv\Scripts\Activate.ps1 on Windows

# Check current version
alembic current

# Apply all migrations
alembic upgrade head

# Create new migration
alembic revision --autogenerate -m "description"

# Downgrade one version
alembic downgrade -1
```

**Migration History** (7 versions):
1. Initial schema creation
2. Users and documents tables
3. Summaries table
4. Quizzes table
5. Quiz questions table
6. Constraints and indexes
7. Recent schema updates

### Adding New Migrations

**When to create**:
- New tables or columns
- Index changes
- Constraint modifications
- NOT for data-only changes (use scripts)

**Steps**:
1. Modify `app/repositories/models.py`
2. Run `alembic revision --autogenerate -m "add feature X"`
3. Review generated file in `alembic/versions/`
4. Edit if needed (Alembic isn't perfect)
5. Test: `alembic upgrade head`
6. Commit migration file with code changes

---

## Authentication & Authorization

### Security Stack

- **Password Hashing**: Argon2 via `argon2-cffi`
- **JWT**: PyJWT with HS256 algorithm
- **Token Format**: `Bearer <token>`
- **Token Expiration**: 60 minutes (configurable via `JWT_EXPIRE_MIN`)
- **Secret Key**: `JWT_SECRET` in `.env` (MUST be random in production)

### Implementation (`app/core/security.py`)

```python
# Password hashing
from argon2 import PasswordHasher
ph = PasswordHasher()

hashed = ph.hash(plain_password)
ph.verify(hashed, plain_password)  # Raises exception if wrong

# JWT tokens
import jwt
from datetime import datetime, timedelta

token = jwt.encode(
    {"sub": str(user_id), "exp": datetime.utcnow() + timedelta(minutes=60)},
    JWT_SECRET,
    algorithm="HS256"
)

payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
```

### Protected Routes (`app/core/deps.py`)

**Dependency**: `get_current_user()`

```python
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user_id = int(payload["sub"])
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return user
```

**Usage in Routes**:
```python
@router.get("/documents")
def list_documents(current_user: User = Depends(get_current_user)):
    return document_service.list_documents(current_user.id)
```

### Owner-Based Filtering

**CRITICAL RULE**: All data access MUST be filtered by `user_id`.

**Examples**:
- Documents: Only return documents where `user_id == current_user.id`
- Summaries: Filter by user_id when listing
- Quizzes: Validate ownership before delete/update

**Bad**:
```python
# DON'T: Allows accessing other users' data
document = db.query(Document).filter(Document.id == doc_id).first()
```

**Good**:
```python
# DO: Enforces ownership
document = db.query(Document).filter(
    Document.id == doc_id,
    Document.user_id == current_user.id
).first()
```

---

## AI/ML Integration

### Provider Architecture

**Abstraction**: `LlmProvider` interface (`services/llm_provider.py`)

```python
class LlmProvider(ABC):
    @abstractmethod
    def summarize_text(self, text: str, max_sentences: int) -> str:
        pass

    @abstractmethod
    def generate_quiz(self, text: str, size: int) -> dict:
        pass
```

**Current Implementation**: OpenAI (`services/openai_adapter.py`)

**Configuration**:
```ini
# .env
OPENAI_API_KEY=sk-...
OPENAI_SUMMARY_MODEL=gpt-4o-mini
OPENAI_QUIZ_MODEL=gpt-4o-mini
SUMMARIZER_PROVIDER=openai
```

### OpenAI Integration

**Client Setup**:
```python
from openai import OpenAI
client = OpenAI(api_key=OPENAI_API_KEY)
```

**Summarization**:
```python
response = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[
        {"role": "system", "content": "You are a summarization assistant..."},
        {"role": "user", "content": f"Summarize in {max_sentences} sentences: {text}"}
    ],
    timeout=12.0
)
summary = response.choices[0].message.content
```

**Quiz Generation**:
```python
response = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[
        {"role": "system", "content": "Generate quiz in JSON format..."},
        {"role": "user", "content": f"Create {size} questions from: {text}"}
    ],
    timeout=20.0
)
quiz_json = response.choices[0].message.content
# Strip ```json fences and parse
```

### Chunking Strategy

**Problem**: OpenAI has token limits, long documents fail

**Solution**: Multi-stage summarization

```python
CHUNK_SIZE = 2400  # characters

if len(text) <= CHUNK_SIZE:
    # Single-stage
    summary = llm.summarize_text(text, max_sentences)
else:
    # Two-stage
    chunks = [text[i:i+CHUNK_SIZE] for i in range(0, len(text), CHUNK_SIZE)]
    chunk_summaries = [llm.summarize_text(chunk, 3) for chunk in chunks]
    combined = "\n".join(chunk_summaries)
    final_summary = llm.summarize_text(combined, max_sentences)
```

### Error Handling

**AI Provider Failures**:
- Timeout errors
- API rate limits
- Invalid API keys
- Malformed responses

**Pattern**:
```python
try:
    result = llm_provider.summarize_text(text, max_sentences)
except Exception as e:
    logger.error(f"AI error: {e}")
    raise HTTPException(status_code=503, detail="AI service unavailable")
```

**Frontend Handling**:
- Show "AI service unavailable" message
- Retry button
- Fallback to manual creation

---

## Development Workflows

### Environment Setup

#### Backend

1. **Prerequisites**:
   - Python 3.11
   - PostgreSQL 14+ (running)
   - Virtual environment tool

2. **Initial Setup**:
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

3. **Database Setup** (one-time):
```sql
-- As postgres superuser
CREATE ROLE studyforge_owner LOGIN PASSWORD 'owner_pass';
CREATE ROLE studyforge_app LOGIN PASSWORD 'app_pass';
CREATE DATABASE studyforge OWNER studyforge_owner;

\c studyforge
CREATE SCHEMA studyforge AUTHORIZATION studyforge_owner;

GRANT USAGE ON SCHEMA studyforge TO studyforge_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA studyforge TO studyforge_app;

ALTER DEFAULT PRIVILEGES IN SCHEMA studyforge
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO studyforge_app;
```

4. **Environment Files**:

`.env`:
```ini
DATABASE_URL=postgresql+psycopg://studyforge_app:app_pass@localhost:5432/studyforge?options=-csearch_path=studyforge,public
ENV=dev
JWT_SECRET=your-secret-key-min-32-chars
JWT_ALG=HS256
JWT_EXPIRE_MIN=60
OPENAI_API_KEY=sk-...
OPENAI_SUMMARY_MODEL=gpt-4o-mini
OPENAI_QUIZ_MODEL=gpt-4o-mini
SUMMARIZER_PROVIDER=openai
```

`.env.alembic`:
```ini
ALEMBIC_URL=postgresql+psycopg://studyforge_owner:owner_pass@localhost:5432/studyforge?options=-csearch_path=studyforge,public
```

5. **Run Migrations**:
```bash
alembic upgrade head
```

6. **Start Server**:
```bash
uvicorn app.main:app --reload
# Open http://127.0.0.1:8000/docs for Swagger UI
```

#### Frontend

1. **Prerequisites**:
   - Node.js 18+
   - pnpm 10+

2. **Initial Setup**:
```bash
cd frontend
pnpm install
```

3. **Environment** (create `.env` if needed):
```ini
VITE_API_BASE=http://127.0.0.1:8000
```

4. **Start Dev Server**:
```bash
pnpm dev
# Open http://localhost:5173
```

### Git Workflow

**Branch Strategy**:
- `main` - Protected, production-ready code
- `claude/...` - AI assistant feature branches
- `feat/...` - Human developer feature branches

**Current Branch**: `claude/claude-md-mi84fwvpfds22bh0-01HYn6UCs5LZGawg7oxVDKE4`

**Commit Conventions**:
```
feat: add new feature
fix: bug fix
chore: maintenance (deps, config)
docs: documentation only
test: add/update tests
refactor: code restructuring
```

**Workflow**:
1. Make changes on feature branch
2. Test locally (backend + frontend)
3. Commit with conventional message
4. Push to remote: `git push -u origin <branch-name>`
5. Create PR to `main` when ready

### Testing Workflow

**Backend Tests**:
```bash
cd backend
source .venv/bin/activate
pytest                      # Run all tests
pytest -v                   # Verbose
pytest tests/test_auth_me.py  # Single file
pytest --cov=app            # With coverage
```

**Frontend Tests**:
- Not yet implemented
- TODO: Add Vitest or Jest

### Running the Full Stack

**Terminal 1** - Backend:
```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload
```

**Terminal 2** - Frontend:
```bash
cd frontend
pnpm dev
```

**Verification**:
1. Backend health: http://127.0.0.1:8000/health
2. Backend docs: http://127.0.0.1:8000/docs
3. Frontend app: http://localhost:5173

---

## Testing Conventions

### Current State

**Coverage**: Limited (2 test files)
- `tests/test_auth_me.py` - Auth endpoint tests
- `tests/test_documents_guard.py` - Authorization tests

### Testing Patterns

**Framework**: pytest with pytest-cov

**Test Structure**:
```python
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_endpoint():
    response = client.get("/endpoint")
    assert response.status_code == 200
    assert response.json() == {"expected": "value"}
```

**Mocking Auth**:
```python
from app.core.deps import get_current_user
from app.repositories.models import User

def override_get_current_user():
    return User(id=1, name="Test", email="test@test.com")

app.dependency_overrides[get_current_user] = override_get_current_user
```

**Mocking Services** (avoid DB dependency):
```python
def test_with_mock_service(monkeypatch):
    def mock_list_documents(user_id):
        return [{"id": 1, "title": "Test"}]

    monkeypatch.setattr(
        "app.routers.documents.document_service.list_documents",
        mock_list_documents
    )

    response = client.get("/documents")
    assert response.status_code == 200
```

### Testing Guidelines for AI Assistants

1. **Always run tests** before committing changes
2. **Add tests** for new features (at minimum, happy path)
3. **Mock external services** (OpenAI, file system)
4. **Test auth scenarios**: 401 for missing auth, ownership checks
5. **Don't skip tests** - if they fail, fix the code or the test

---

## Code Conventions & Style

### Python (Backend)

**Style**: PEP 8 compliant

**Imports Order**:
```python
# 1. Standard library
import os
from datetime import datetime

# 2. Third-party
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

# 3. Local
from app.core.deps import get_current_user
from app.repositories.models import Document
from app.schemas.document_schemas import DocumentCreate
```

**Type Hints**: Always use type hints
```python
def create_document(user_id: int, title: str, content: str) -> Document:
    ...
```

**Docstrings**: Use for complex functions
```python
def extract_text_from_file(file_bytes: bytes, filename: str) -> str:
    """
    Extract text from PDF, DOCX, or TXT file.

    Args:
        file_bytes: Raw file bytes
        filename: Original filename (for extension detection)

    Returns:
        Extracted text content

    Raises:
        ValueError: If file type unsupported or extraction fails
    """
```

**Error Handling**:
```python
# Use HTTPException for API errors
if not document:
    raise HTTPException(status_code=404, detail="Document not found")

# Log exceptions before raising
except Exception as e:
    logger.error(f"Failed to process file: {e}")
    raise HTTPException(status_code=500, detail="Processing failed")
```

### TypeScript (Frontend)

**Style**: ESLint configured (see `eslint.config.js`)

**Component Structure**:
```typescript
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Props {
  title: string;
}

export const MyComponent: React.FC<Props> = ({ title }) => {
  const [data, setData] = useState<string[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Effect logic
  }, []);

  return <div>{title}</div>;
};
```

**API Calls**:
```typescript
async function fetchData() {
  try {
    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API error:', error);
    throw error;
  }
}
```

### Naming Conventions

**Python**:
- Functions/methods: `snake_case`
- Classes: `PascalCase`
- Constants: `UPPER_SNAKE_CASE`
- Private: `_leading_underscore`

**TypeScript**:
- Functions: `camelCase`
- Components: `PascalCase`
- Constants: `UPPER_SNAKE_CASE`
- Interfaces: `PascalCase`

**Database**:
- Tables: `plural_snake_case` (e.g., `users`, `quiz_questions`)
- Columns: `snake_case`
- Foreign keys: `{table}_id` (e.g., `user_id`)

---

## Common Tasks & Patterns

### Adding a New API Endpoint

1. **Define Pydantic Schema** (`app/schemas/`):
```python
# my_schemas.py
from pydantic import BaseModel

class MyCreate(BaseModel):
    field: str

class MyResponse(BaseModel):
    id: int
    field: str
    created_at: datetime
```

2. **Add Service Method** (`app/services/`):
```python
# my_service.py
def create_my_thing(user_id: int, field: str) -> MyThing:
    thing = MyThing(user_id=user_id, field=field)
    db.add(thing)
    db.commit()
    db.refresh(thing)
    return thing
```

3. **Create Router** (`app/routers/`):
```python
# my_router.py
from fastapi import APIRouter, Depends
from app.core.deps import get_current_user

router = APIRouter(prefix="/my-things", tags=["my-things"])

@router.post("", response_model=MyResponse)
def create(
    data: MyCreate,
    current_user: User = Depends(get_current_user)
):
    return my_service.create_my_thing(current_user.id, data.field)
```

4. **Register Router** (`app/main.py`):
```python
from app.routers import my_router

app.include_router(my_router.router)
```

5. **Add Tests** (`tests/`):
```python
def test_create_my_thing():
    response = client.post("/my-things", json={"field": "value"})
    assert response.status_code == 200
```

### Adding a Database Migration

1. **Modify Model** (`app/repositories/models.py`):
```python
class NewTable(Base):
    __tablename__ = "new_table"
    __table_args__ = {"schema": "studyforge"}

    id = Column(Integer, primary_key=True)
    # ... other columns
```

2. **Generate Migration**:
```bash
alembic revision --autogenerate -m "add new_table"
```

3. **Review & Edit** (`alembic/versions/xxxxx_add_new_table.py`):
```python
def upgrade():
    op.create_table(
        'new_table',
        sa.Column('id', sa.Integer(), nullable=False),
        # ...
        schema='studyforge'  # ENSURE schema is set!
    )
```

4. **Apply Migration**:
```bash
alembic upgrade head
```

5. **Commit** migration file with model changes

### Adding AI Functionality

1. **Define Method in LlmProvider** (`services/llm_provider.py`):
```python
@abstractmethod
def my_ai_function(self, text: str) -> str:
    pass
```

2. **Implement in OpenAiAdapter** (`services/openai_adapter.py`):
```python
def my_ai_function(self, text: str) -> str:
    response = self.client.chat.completions.create(
        model=self.model,
        messages=[
            {"role": "system", "content": "System prompt..."},
            {"role": "user", "content": text}
        ],
        timeout=15.0
    )
    return response.choices[0].message.content
```

3. **Use in Service** (`services/my_service.py`):
```python
llm = get_llm_provider()
result = llm.my_ai_function(text)
```

4. **Handle Errors**:
```python
try:
    result = llm.my_ai_function(text)
except Exception as e:
    logger.error(f"AI error: {e}")
    raise HTTPException(status_code=503, detail="AI service unavailable")
```

### Adding a Frontend Page

1. **Create Component** (`src/pages/mypage.tsx`):
```typescript
import React from 'react';

export const MyPage: React.FC = () => {
  return <div>My Page</div>;
};
```

2. **Add Route** (`src/main.tsx`):
```typescript
import { MyPage } from './pages/mypage';

const router = createBrowserRouter([
  // ... existing routes
  {
    path: "/mypage",
    element: <MyPage />,
  },
]);
```

3. **Add Navigation** (`src/components/Navbar.tsx`):
```typescript
<Link to="/mypage">My Page</Link>
```

---

## Troubleshooting Guide

### Backend Issues

#### "relation does not exist" Error
```
sqlalchemy.exc.ProgrammingError: relation "studyforge.users" does not exist
```
**Solution**: Run migrations with owner role
```bash
alembic upgrade head
```

#### "could not connect to server" Error
**Solution**: Ensure PostgreSQL is running
```bash
# Linux/Mac
sudo systemctl status postgresql

# Windows
# Check Services app for PostgreSQL service
```

#### "Invalid authentication" on Protected Route
**Solution**: Check token in request
```bash
# Test with curl
curl -H "Authorization: Bearer YOUR_TOKEN" http://127.0.0.1:8000/auth/me
```

#### AI Service Unavailable (503)
**Causes**:
- Invalid `OPENAI_API_KEY`
- Rate limit exceeded
- Network timeout

**Solution**:
1. Verify API key in `.env`
2. Check OpenAI dashboard for rate limits
3. Increase timeout in `openai_adapter.py`

### Frontend Issues

#### CORS Errors
```
Access to fetch at 'http://127.0.0.1:8000' has been blocked by CORS policy
```
**Solution**: Ensure CORS is configured in `backend/app/main.py`
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

#### "Failed to fetch" Errors
**Causes**:
- Backend not running
- Wrong `VITE_API_BASE` URL
- Network issues

**Solution**:
1. Check backend is running: `curl http://127.0.0.1:8000/health`
2. Verify `.env` has correct `VITE_API_BASE`
3. Check browser console for actual error

#### Build Errors
```bash
pnpm build
# If errors occur
```
**Solution**: Clear cache and reinstall
```bash
rm -rf node_modules .vite dist
pnpm install
pnpm build
```

### Database Issues

#### Migration Conflicts
```
alembic.util.exc.CommandError: Target database is not up to date
```
**Solution**: Check current version and upgrade
```bash
alembic current
alembic history
alembic upgrade head
```

#### Schema Not Found
```
schema "studyforge" does not exist
```
**Solution**: Create schema manually
```sql
CREATE SCHEMA IF NOT EXISTS studyforge;
```

---

## Critical Rules for AI Assistants

### Security & Authorization

1. **NEVER** skip authentication checks on protected routes
2. **ALWAYS** filter data by `user_id` to prevent unauthorized access
3. **NEVER** commit `.env` files with real credentials
4. **ALWAYS** use Argon2 for password hashing (not bcrypt, not plain SHA)
5. **NEVER** log sensitive data (passwords, tokens, API keys)

### Database Operations

6. **ALWAYS** use the `studyforge` schema, NEVER `public`
7. **ALWAYS** create migrations for schema changes (don't modify DB directly)
8. **NEVER** use raw SQL without parameterization (SQLAlchemy prevents injection)
9. **ALWAYS** test migrations on a copy before applying to production
10. **NEVER** delete migration files that have been deployed

### Code Quality

11. **ALWAYS** run tests before committing (`pytest` in backend)
12. **ALWAYS** add type hints to Python functions
13. **ALWAYS** handle exceptions gracefully (don't let them bubble to users)
14. **NEVER** commit commented-out code (use git history instead)
15. **ALWAYS** use meaningful variable names (not `x`, `data`, `temp`)

### AI/LLM Integration

16. **ALWAYS** set timeouts on AI API calls (prevent hanging)
17. **ALWAYS** handle AI failures gracefully (503 with user-friendly message)
18. **NEVER** trust AI output without validation (JSON structure, data types)
19. **ALWAYS** chunk large documents before sending to AI (respect token limits)
20. **NEVER** expose raw AI errors to users (log them, show generic message)

### Frontend Best Practices

21. **ALWAYS** validate user input client-side (but also server-side!)
22. **NEVER** store sensitive data in localStorage without encryption
23. **ALWAYS** check response.ok before parsing JSON
24. **ALWAYS** handle loading states (show spinners, disable buttons)
25. **NEVER** assume API calls succeed (always have error handling)

### Git & Workflow

26. **ALWAYS** commit with conventional commit messages
27. **NEVER** force push to `main` branch
28. **ALWAYS** test locally before pushing
29. **NEVER** commit large files (>1MB) - use .gitignore
30. **ALWAYS** push to the designated Claude branch

### Documentation

31. **ALWAYS** update this CLAUDE.md when adding major features
32. **ALWAYS** document complex functions with docstrings
33. **NEVER** assume future developers know context (write it down)
34. **ALWAYS** update API documentation when changing endpoints

### Performance

35. **ALWAYS** use database indexes for frequently queried columns
36. **NEVER** perform N+1 queries (use joins or eager loading)
37. **ALWAYS** paginate large result sets
38. **NEVER** load entire tables into memory

### File Operations

39. **ALWAYS** validate file types and sizes before processing
40. **NEVER** trust file extensions (check magic bytes if needed)
41. **ALWAYS** handle file encoding errors (UTF-8 with error handling)
42. **NEVER** process files larger than 25MB without streaming

---

## Quick Reference

### Essential Commands

```bash
# Backend
cd backend
source .venv/bin/activate
alembic upgrade head
uvicorn app.main:app --reload
pytest

# Frontend
cd frontend
pnpm install
pnpm dev
pnpm build

# Database
psql -U postgres -d studyforge
\dt studyforge.*
\d studyforge.users
```

### Environment Variables Checklist

**Backend** (`.env`):
- [ ] `DATABASE_URL` - App role connection string
- [ ] `JWT_SECRET` - Random 32+ char secret
- [ ] `OPENAI_API_KEY` - OpenAI API key
- [ ] `OPENAI_SUMMARY_MODEL` - Model name
- [ ] `OPENAI_QUIZ_MODEL` - Model name

**Backend** (`.env.alembic`):
- [ ] `ALEMBIC_URL` - Owner role connection string

**Frontend** (`.env` optional):
- [ ] `VITE_API_BASE` - Backend URL

### Key File Locations

| Purpose | Path |
|---------|------|
| API Entry Point | `backend/app/main.py` |
| Database Models | `backend/app/repositories/models.py` |
| Auth Logic | `backend/app/core/security.py`, `backend/app/core/deps.py` |
| API Schemas | `backend/app/schemas/*.py` |
| Services | `backend/app/services/*.py` |
| Routers | `backend/app/routers/*.py` |
| Migrations | `backend/alembic/versions/*.py` |
| Frontend Entry | `frontend/src/main.tsx` |
| Frontend Router | `frontend/src/main.tsx` |
| API Client | `frontend/src/services/api.ts` |
| Components | `frontend/src/components/*.tsx` |
| Pages | `frontend/src/pages/*.tsx` |

---

## Conclusion

This guide should provide AI assistants with all the context needed to effectively work with the StudyForge codebase. When in doubt:

1. **Read the code** - The source is the source of truth
2. **Run the tests** - They document expected behavior
3. **Check git history** - See how similar changes were made
4. **Ask clarifying questions** - Better to ask than assume
5. **Update this document** - Keep it current for the next assistant

**Remember**: Code quality, security, and user experience are the top priorities. Take time to do things right the first time.

---

**Document Version**: 1.0
**Last Updated**: 2025-11-21
**Maintained By**: AI Assistants working on StudyForge
**Repository**: orellanaolivaresgallardo-capstone/StudyForge
