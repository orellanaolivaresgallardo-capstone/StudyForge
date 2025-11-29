# CLAUDE.md — AI Assistant Guide for StudyForge

**Last Updated:** 2025-11-28
**Version:** 2.3.0
 
This document provides comprehensive guidance for AI assistants working on the StudyForge codebase. It explains the project structure, development workflows, conventions, and key patterns to follow.
 
---
 
## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Technology Stack](#technology-stack)
- [Repository Structure](#repository-structure)
- [Development Workflow](#development-workflow)
- [Code Conventions and Patterns](#code-conventions-and-patterns)
- [Key Architectural Decisions](#key-architectural-decisions)
- [Testing Strategy](#testing-strategy)
- [Common Tasks](#common-tasks)
- [Custom Agents](#custom-agents)
- [Important Files](#important-files)
- [Best Practices for AI Assistants](#best-practices-for-ai-assistants)
 
---
 
## 🎯 Project Overview
 
**StudyForge** is an AI-powered learning support application that helps students through:
- **Smart Summaries**: Generate summaries from PDF, DOCX, PPTX, and TXT files with 3 expertise levels (básico, medio, avanzado)
- **Adaptive Quizzes**: Generate multiple-choice quizzes with adaptive difficulty based on performance
- **Study Spaces**: Organize documents, summaries, and quizzes by topic/subject
- **Progress Tracking**: Monitor learning progress with detailed statistics
 
**Architecture**: Monorepo with separate backend (Python/FastAPI) and frontend (React/TypeScript) applications.
 
**Current Status**:
- Backend: 100% functional with all endpoints implemented
- Frontend: MVP complete with full end-to-end flow
- Database: PostgreSQL 18 with isolated schema and role-based access
- AI Integration: OpenAI GPT-4o-mini for content generation
 
---
 
## 🛠️ Technology Stack
 
### Backend
- **Language**: Python 3.14
- **Framework**: FastAPI (async web framework)
- **Database**: PostgreSQL 18 with custom schema (`studyforge`)
- **ORM**: SQLAlchemy 2.0 (modern query API with `select()`)
- **Migrations**: Alembic
- **Authentication**: JWT (python-jose) + Argon2id password hashing
- **AI**: OpenAI API (GPT-4o-mini)
- **File Processing**:
  - PDF: pypdf, pdfplumber
  - Office: python-docx, python-pptx
  - Text: native Python
- **Testing**: pytest, pytest-asyncio, pytest-cov
 
### Frontend
- **Language**: TypeScript 5.8
- **Framework**: React 19 (SPA architecture)
- **Bundler**: Vite
- **Package Manager**: pnpm 10+
- **Routing**: React Router v7
- **Styling**: Tailwind CSS with custom brand palette
- **HTTP Client**: Axios with interceptors
- **Charts**: Recharts (for statistics)
- **State Management**: React Context API
 
### Development
- **Node**: 24
- **Python**: 3.14
- **PostgreSQL**: 18
- **Environment**: Windows-optimized (UTF-8, CRLF)
 
---
 
## 📁 Repository Structure
 
```
StudyForge/
├── backend/                      # FastAPI REST API
│   ├── .venv/                    # Python virtual environment (not versioned)
│   ├── alembic/                  # Database migrations
│   │   ├── versions/             # Migration files (timestamped)
│   │   └── env.py                # Alembic configuration
│   ├── app/
│   │   ├── core/                 # Core utilities
│   │   │   ├── dependencies.py   # FastAPI dependencies (auth, ownership validation)
│   │   │   ├── security.py       # JWT, Argon2, token handling
│   │   │   ├── logging.py        # Structured logging system
│   │   │   ├── rate_limiter.py   # Rate limiting middleware
│   │   │   └── file_validator.py # Magic number validation for security
│   │   ├── models/               # SQLAlchemy ORM models
│   │   │   ├── user.py           # User model with storage quotas
│   │   │   ├── document.py       # Document storage (file_content + extracted_text)
│   │   │   ├── summary.py        # Summary with JSONB content
│   │   │   ├── quiz.py           # Quiz with questions in JSONB
│   │   │   ├── quiz_attempt.py   # Quiz attempts with randomized options
│   │   │   ├── study_space.py    # Study space organization
│   │   │   └── summary_document.py # Many-to-many junction table
│   │   ├── repositories/         # Data access layer (CRUD operations)
│   │   │   ├── user_repository.py
│   │   │   ├── document_repository.py
│   │   │   ├── summary_repository.py
│   │   │   ├── quiz_repository.py
│   │   │   ├── quiz_attempt_repository.py
│   │   │   └── study_space_repository.py
│   │   ├── services/             # Business logic layer
│   │   │   ├── auth_service.py   # Authentication logic
│   │   │   ├── file_processor.py # File extraction and validation
│   │   │   ├── summary_service.py # Summary generation orchestration
│   │   │   ├── quiz_service.py   # Quiz generation and adaptive difficulty
│   │   │   ├── openai_service.py # OpenAI API client
│   │   │   ├── deletion_service.py # Cascade deletion logic
│   │   │   └── study_space_service.py # Study space operations
│   │   ├── routers/              # HTTP endpoints (FastAPI routers)
│   │   │   ├── auth.py           # POST /auth/register, /auth/login, GET /auth/me
│   │   │   ├── documents.py      # Document CRUD and storage info
│   │   │   ├── summaries.py      # Summary CRUD and generation
│   │   │   ├── quizzes.py        # Quiz generation and listing
│   │   │   ├── quiz_attempts.py  # Quiz taking and scoring
│   │   │   ├── study_spaces.py   # Study space management
│   │   │   └── stats.py          # Statistics endpoints
│   │   ├── schemas/              # Pydantic validation schemas
│   │   │   ├── user.py           # UserCreate, UserResponse, etc.
│   │   │   ├── auth.py           # LoginRequest, TokenResponse
│   │   │   ├── summary.py        # SummaryCreate, SummaryResponse
│   │   │   ├── quiz.py           # QuizCreate, QuizResponse
│   │   │   └── document.py       # DocumentResponse, UploadResponse
│   │   ├── config.py             # Pydantic Settings (env vars)
│   │   ├── db.py                 # Database session management
│   │   └── main.py               # FastAPI app initialization
│   ├── tests/                    # Test suite
│   │   ├── conftest.py           # Shared fixtures
│   │   ├── unit/                 # Unit tests for services/repositories
│   │   └── test_*.py             # Integration tests
│   ├── requirements.txt          # Python dependencies
│   ├── setup_database.sql        # PostgreSQL initialization script
│   ├── .env.example              # Example environment variables
│   └── alembic.ini               # Alembic configuration
│
├── frontend/                     # React SPA
│   ├── src/
│   │   ├── components/           # Reusable React components
│   │   │   ├── auth/             # ProtectedRoute
│   │   │   ├── features/         # QuotaWidget, QuizCard, PerformanceChart
│   │   │   ├── layout/           # Navbar, PublicHeader
│   │   │   ├── ui/               # LoadingSpinner, Modal, Toast, EmptyState
│   │   │   ├── LandingPage.tsx   # Landing page for unauthenticated users
│   │   │   └── UploadDocumentModal.tsx
│   │   ├── pages/                # Route pages
│   │   │   ├── auth/             # LoginPage, SignupPage, ForgotPasswordPage
│   │   │   ├── documents/        # DocumentsPage
│   │   │   ├── summaries/        # SummariesPage, SummaryDetailPage
│   │   │   ├── quizzes/          # QuizzesPage, QuizAttemptPage, QuizResultsPage
│   │   │   ├── study-spaces/     # StudySpacesPage, StudySpaceDetailPage
│   │   │   ├── stats/            # StatsPage
│   │   │   ├── public/           # FeaturesPage, AboutUsPage, HomePage
│   │   │   └── ErrorPage.tsx
│   │   ├── context/              # React Context
│   │   │   └── AuthContext.tsx   # Global authentication state
│   │   ├── services/             # API layer
│   │   │   └── api/              # API modules (auth, documents, summaries, etc.)
│   │   ├── types/                # TypeScript definitions
│   │   │   └── api.types.ts      # API request/response types
│   │   ├── assets/               # Static assets
│   │   ├── main.tsx              # Entry point + React Router setup
│   │   └── index.css             # Global styles (Tailwind + custom CSS)
│   ├── public/                   # Static files
│   ├── package.json              # npm dependencies and scripts
│   ├── tsconfig.json             # TypeScript configuration
│   ├── vite.config.ts            # Vite bundler config
│   └── tailwind.config.cjs       # Tailwind CSS config with brand palette
│
└── docs/                         # Technical documentation
    ├── ARCHITECTURE.md           # High-level architecture overview
    ├── DATABASE.md               # Database schema, indexes, migrations
    ├── INTEGRATION.md            # End-to-end flows for debugging
    ├── API.md                    # Complete API endpoint documentation
    ├── SECURITY.md               # Security considerations
    ├── TESTING.md                # Testing strategy, setup, and best practices
    ├── DECISIONS.md              # Technical decision log (ADR)
    ├── IMPLEMENTATION.md         # Implementation checklist
    ├── NEXT_STEPS.md             # Immediate tasks and roadmap
    └── ROADMAP.md                # Long-term development plan
```
 
---
 
## 🔄 Development Workflow
 
### Initial Setup
 
#### 1. Database Setup
```bash
# Run PostgreSQL setup script as superuser
psql -U postgres -f backend/setup_database.sql
 
# This creates:
# - Database: studyforge
# - Schema: studyforge
# - Role: studyforge_owner (DDL - for migrations)
# - Role: studyforge_app (DML - for runtime)
```
 
#### 2. Backend Setup
```bash
cd backend
 
# Create virtual environment (IMPORTANT: inside backend/)
python -m venv .venv
 
# Activate virtual environment
# Windows PowerShell:
.\.venv\Scripts\Activate.ps1
# Linux/Mac:
source .venv/bin/activate
 
# Install dependencies
pip install -r requirements.txt
 
# Create environment files
cp .env.example .env
cp .env.alembic.example .env.alembic
 
# Edit .env files with your credentials
# DATABASE_URL uses studyforge_app
# ALEMBIC_URL uses studyforge_owner
 
# Run migrations
alembic upgrade head
 
# Verify
alembic current --verbose
```
 
#### 3. Frontend Setup
```bash
cd frontend
 
# Install dependencies (using pnpm)
pnpm install
 
# Configure environment
# Create .env.local if needed:
echo "VITE_API_BASE=http://localhost:8000" > .env.local
```
 
### Running the Application
 
#### Backend (Port 8000)
```bash
cd backend
source .venv/bin/activate  # or .\.venv\Scripts\Activate.ps1 on Windows
uvicorn app.main:app --reload
 
# API Docs: http://localhost:8000/docs
# Health Check: http://localhost:8000/health
```
 
#### Frontend (Port 5173)
```bash
cd frontend
pnpm dev
 
# Application: http://localhost:5173
```
 
### Database Migrations
 
#### Creating Migrations
```bash
cd backend
 
# Auto-generate migration from model changes
alembic revision --autogenerate -m "Description of changes"
 
# Review the generated migration in alembic/versions/
# Edit if necessary (Alembic doesn't catch everything)
 
# Apply migration
alembic upgrade head
 
# Verify
alembic current
```
 
#### Migration Best Practices
- **Always review** autogenerated migrations before applying
- **Never edit** applied migrations (create a new one instead)
- **Test rollback**: `alembic downgrade -1` then `alembic upgrade head`
- **Include in commits**: Migration files must be versioned
- **Sequential naming**: Alembic uses timestamps, don't rename
 
### Testing
 
#### Backend Tests
```bash
cd backend
source .venv/bin/activate
 
# Run all tests
pytest
 
# Run with coverage
pytest --cov=app --cov-report=html
 
# Run specific test file
pytest tests/unit/test_services/test_summary_service.py
 
# Run tests matching pattern
pytest -k "test_auth"
```
 
#### Frontend Tests
```bash
cd frontend
 
# Type checking
npx tsc --noEmit
 
# Linting
pnpm lint
```
 
---
 
## 📐 Code Conventions and Patterns
 
### Backend Conventions
 
#### 1. Layered Architecture (Strict Separation)
**Flow**: `Router → Service → Repository → Model`
 
```python
# ❌ WRONG: Router directly accessing database
@router.get("/summaries")
def get_summaries(db: Session = Depends(get_db)):
    return db.query(Summary).all()  # Don't do this!
 
# ✅ CORRECT: Router → Service → Repository
@router.get("/summaries")
def get_summaries(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return summary_service.list_user_summaries(db, current_user.id)
```
 
#### 2. SQLAlchemy 2.0 Query API
**Always use** `select()` instead of legacy `db.query()`:
 
```python
# ❌ WRONG: Legacy query API
db.query(Summary).filter(Summary.user_id == user_id).all()
 
# ✅ CORRECT: SQLAlchemy 2.0 style
from sqlalchemy import select
stmt = select(Summary).where(Summary.user_id == user_id)
db.execute(stmt).scalars().all()
```
 
#### 3. UUID Primary Keys
All models use UUID v4 as primary key:
 
```python
from uuid import uuid4
from sqlalchemy.dialects.postgresql import UUID
 
id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
```
 
#### 4. Ownership Validation (Critical for Privacy)
**Always validate** resource ownership before operations:
 
```python
from app.core.dependencies import verify_summary_ownership
 
@router.get("/summaries/{summary_id}")
def get_summary(
    summary_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    summary = summary_repository.get_by_id(db, summary_id)
    verify_summary_ownership(summary, current_user)  # ← ESSENTIAL
    return summary
```
 
**Available validators**:
- `verify_document_ownership()`
- `verify_summary_ownership()`
- `verify_quiz_ownership()`
- `verify_quiz_attempt_ownership()`
- `verify_space_ownership()`
 
#### 5. Structured Logging
Use the centralized logging system:
 
```python
from app.core.logging import get_logger, log_auth_event, log_quota_event
 
logger = get_logger(__name__)
 
# Authentication events
log_auth_event(event="login_success", user_id=str(user.id), email=user.email)
 
# Quota events
log_quota_event(
    user_id=str(user.id),
    event="file_upload",
    file_size=file_size_bytes,
    quota_remaining=remaining_bytes
)
 
# General logging
logger.info(f"Processing file: {filename}")
logger.error(f"Failed to process file: {error}", exc_info=True)
```
 
#### 6. JSONB for Structured Data
PostgreSQL JSONB is used for flexible schemas:
 
```python
# Summary content
content = Column(JSONB, nullable=False)
# Structure: {"summary": "...", "key_points": [...], "detailed_sections": [...]}
 
# Quiz questions
questions = Column(JSONB, nullable=False)
# Structure: [{"question": "...", "options": {"correct": "...", ...}, "explanation": "..."}]
```
 
#### 7. Pydantic Schemas for Validation
All API input/output uses Pydantic v2:
 
```python
from pydantic import BaseModel, Field, EmailStr
 
class SummaryCreate(BaseModel):
    document_ids: list[UUID] = Field(..., min_length=1, max_length=2)
    expertise_level: ExpertiseLevel
    title: str | None = None
 
    model_config = ConfigDict(from_attributes=True)
```
 
#### 8. Async Not Required
FastAPI runs on ASGI, but **synchronous** route handlers are preferred:

```python
# ✅ CORRECT: Synchronous (SQLAlchemy sync engine)
@router.get("/summaries")
def get_summaries(db: Session = Depends(get_db)):
    return summary_service.list_summaries(db)

# ❌ WRONG: Don't use async unless truly needed
async def get_summaries(...):  # Avoid unless calling async I/O
```

#### 9. Lifespan Events (Modern Pattern)
Use `lifespan` context manager instead of deprecated `@app.on_event()`:

```python
from contextlib import asynccontextmanager

# ✅ CORRECT: Lifespan context manager
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle startup and shutdown events."""
    # Startup logic
    logger.info("Starting application...")
    yield
    # Shutdown logic (optional)
    logger.info("Shutting down...")

app = FastAPI(lifespan=lifespan)

# ❌ WRONG: Deprecated on_event
@app.on_event("startup")  # Deprecated in FastAPI
async def startup_event():
    logger.info("Starting...")
```

**Benefits**:
- Modern FastAPI best practice
- Handles both startup and shutdown in one place
- Proper resource cleanup with context manager
- Future-proof (on_event will be removed)

#### 10. Type Hints Required
All functions must have complete type hints:
 
```python
# ✅ CORRECT
def create_summary(
    db: Session,
    user_id: UUID,
    content: dict
) -> Summary:
    ...
 
# ❌ WRONG
def create_summary(db, user_id, content):  # Missing types
    ...
```
 
### Frontend Conventions
 
#### 1. TypeScript Strict Mode
Always use explicit types:
 
```typescript
// ✅ CORRECT
interface SummaryResponse {
  id: string;
  title: string;
  content: Record<string, any>;
  expertise_level: 'basico' | 'medio' | 'avanzado';
}
 
const fetchSummary = async (id: string): Promise<SummaryResponse> => {
  // ...
}
 
// ❌ WRONG
const fetchSummary = async (id) => {  // Implicit any
  // ...
}
```
 
#### 2. React Router v7 Navigation
Use `<Link>` and `useNavigate()` for SPA navigation:
 
```typescript
import { Link, useNavigate } from 'react-router-dom';
 
// ✅ CORRECT: Client-side navigation
<Link to="/summaries">View Summaries</Link>
 
const navigate = useNavigate();
navigate('/summaries');
 
// ❌ WRONG: Causes full page reload
<a href="/summaries">View Summaries</a>
window.location.href = '/summaries';
```
 
#### 3. AuthContext for Authentication
Access current user via context:
 
```typescript
import { useAuth } from '@/context/AuthContext';
 
function MyComponent() {
  const { user, isAuthenticated, isLoading, login, logout } = useAuth();
 
  if (isLoading) return <LoadingSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" />;
 
  return <div>Welcome, {user?.username}!</div>;
}
```
 
#### 4. API Service Layer
Centralized API calls in `services/api/`:
 
```typescript
// services/api/summaries.api.ts
import api from '../api';
 
export const listSummaries = async (): Promise<SummaryResponse[]> => {
  const response = await api.get('/summaries');
  return response.data;
};
 
// Component
import { listSummaries } from '@/services/api/summaries.api';
 
const summaries = await listSummaries();
```
 
#### 5. Tailwind CSS Utilities
Use Tailwind classes, avoid inline styles:
 
```tsx
// ✅ CORRECT
<div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
  Content
</div>
 
// ❌ WRONG
<div style={{ background: 'white', borderRadius: '8px', padding: '24px' }}>
  Content
</div>
```
 
#### 6. Component Organization
```typescript
// 1. Imports
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
 
// 2. Types/Interfaces
interface Props {
  title: string;
  onSubmit: (data: FormData) => void;
}
 
// 3. Component
export function MyComponent({ title, onSubmit }: Props) {
  // 3a. Hooks
  const navigate = useNavigate();
  const [data, setData] = useState<string>('');
 
  // 3b. Effects
  useEffect(() => {
    // ...
  }, []);
 
  // 3c. Handlers
  const handleSubmit = () => {
    // ...
  };
 
  // 3d. Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```
 
#### 7. Error Handling
Always handle errors gracefully:
 
```typescript
const [error, setError] = useState<string | null>(null);
const [loading, setLoading] = useState(false);
 
try {
  setLoading(true);
  const result = await apiCall();
  // Success handling
} catch (err) {
  setError(err instanceof Error ? err.message : 'An error occurred');
  console.error('Operation failed:', err);
} finally {
  setLoading(false);
}
```
 
---
 
## 🔑 Key Architectural Decisions
 
### 1. PostgreSQL Schema Isolation
**Decision**: Use `studyforge` schema instead of `public`
**Rationale**: Easier permission management, cleaner separation, simplified maintenance
**Implementation**: `search_path=studyforge,public` in connection strings
 
### 2. Separate Database Roles
**Decision**: `studyforge_owner` (DDL) and `studyforge_app` (DML)
**Rationale**: Principle of least privilege, security in production
**Files**: `backend/setup_database.sql`, `backend/.env`, `backend/.env.alembic`
 
### 3. Document Storage Model
**Decision**: Store documents for reuse across multiple summaries
**Rationale**: User efficiency, storage optimization, multi-document summaries
**Implementation**: `documents` table + `summary_documents` junction table
 
### 4. JSONB for Dynamic Content
**Decision**: Use JSONB for summary content and quiz questions
**Rationale**: Flexibility, queryability, avoids excessive table joins
**Trade-off**: Can't do complex relational queries on nested data
 
### 5. Quiz Question Randomization
**Decision**: Randomize quiz options per attempt (stored in `quiz_attempts.correct_answers`)
**Rationale**: Prevent memorization, fair scoring
**Implementation**: `QuizAttemptRepository.create_attempt()` shuffles options
 
### 6. Adaptive Difficulty System
**Decision**: Calculate difficulty based on last 5 attempts per study space
**Rationale**: Personalized learning, keep users in optimal challenge zone
**Implementation**: `QuizService.calculate_adaptive_difficulty()`
 
### 7. Space-Based Organization (Not Topic)
**Decision**: Removed `topic` field in favor of `study_space_id`
**Rationale**: Simplify, avoid duplication, richer context for AI
**Migration**: `fbdf6cca3f23_remove_topic_tracking.py`
 
### 8. SPA Architecture (No Static HTML)
**Decision**: Pure React SPA with React Router (eliminated 8 static HTML files)
**Rationale**: Better UX (no page reloads), maintainability, consistency
**Implementation**: `LandingPage.tsx`, `HomePage.tsx` with conditional rendering
 
### 9. Argon2 Over bcrypt
**Decision**: Use Argon2id for password hashing
**Rationale**: Winner of Password Hashing Competition, more secure
**Library**: `argon2-cffi`
 
### 10. OpenAI GPT-4o-mini
**Decision**: Use `gpt-4o-mini` as default model
**Rationale**: Cost-effective, sufficient quality for educational content
**Configurable**: Via `OPENAI_MODEL` environment variable
 
**Full decision log**: See `docs/DECISIONS.md`
 
---
 
## 🧪 Testing Strategy
 
### Backend Testing
 
#### Unit Tests
Located in `backend/tests/unit/`:
- **Services**: Business logic (summary generation, quiz creation, adaptive difficulty)
- **Repositories**: Database operations (CRUD, queries)
- **Utilities**: File processing, validators
 
#### Integration Tests
Located in `backend/tests/`:
- **End-to-end flows**: Document upload → summary → quiz → attempt → results
- **Authentication**: Register, login, token validation
- **Ownership validation**: Privacy checks across all resources
 
#### Test Fixtures
Located in `backend/tests/conftest.py`:
- `fake_user`: Mock user with storage quotas
- `fake_document`: Mock document with extracted text
- `fake_summary`: Mock summary with JSONB content
- `fake_quiz`: Mock quiz with questions
- `fake_db`: Mock database session
 
#### Running Tests
```bash
cd backend
 
# All tests
pytest
 
# With coverage
pytest --cov=app --cov-report=html
 
# Specific test
pytest tests/unit/test_services/test_summary_service.py -v
 
# Pattern matching
pytest -k "adaptive_difficulty"
```
 
### Frontend Testing
Currently minimal:
- **Type checking**: `npx tsc --noEmit`
- **Linting**: `pnpm lint`
 
**Pending**: Unit tests (Vitest), integration tests (React Testing Library), E2E tests (Playwright)
 
---
 
## 🔧 Common Tasks
 
### Adding a New Endpoint
 
#### 1. Define Pydantic Schema
```python
# backend/app/schemas/resource.py
from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime

class ResourceCreate(BaseModel):
    """Schema para creación de recurso."""
    name: str
    description: str | None = None
    parent_id: UUID | None = None  # Ejemplo de FK opcional

class ResourceResponse(BaseModel):
    """Schema para respuesta de recurso.

    Nota: Incluye campos denormalizados si es necesario para performance.
    """
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    user_id: UUID
    parent_id: UUID | None = None  # FK opcional (puede ser NULL si parent fue eliminado)

    # Ejemplo de campos denormalizados (si aplica)
    parent_name: str | None = None  # Cache del nombre del parent

    created_at: datetime
    updated_at: datetime
```
 
#### 2. Create Repository Method
```python
# backend/app/repositories/resource_repository.py
from sqlalchemy import select
 
class ResourceRepository:
    @staticmethod
    def create(db: Session, user_id: UUID, name: str) -> Resource:
        resource = Resource(user_id=user_id, name=name)
        db.add(resource)
        db.commit()
        db.refresh(resource)
        return resource
 
    @staticmethod
    def get_by_id(db: Session, resource_id: UUID) -> Resource | None:
        stmt = select(Resource).where(Resource.id == resource_id)
        return db.execute(stmt).scalar_one_or_none()
```
 
#### 3. Create Service Method
```python
# backend/app/services/resource_service.py
class ResourceService:
    @staticmethod
    def create_resource(db: Session, user_id: UUID, data: ResourceCreate) -> Resource:
        # Business logic here
        return resource_repository.create(db, user_id, data.name)
```
 
#### 4. Create Router Endpoint
```python
# backend/app/routers/resources.py
from fastapi import APIRouter, Depends
from app.core.dependencies import get_current_user
 
router = APIRouter()
 
@router.post("/", response_model=ResourceResponse)
def create_resource(
    data: ResourceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return resource_service.create_resource(db, current_user.id, data)
```
 
#### 5. Register Router
```python
# backend/app/main.py
from app.routers import resources
 
app.include_router(resources.router, prefix="/resources", tags=["resources"])
```
 
### Adding a Database Migration
 
#### 1. Modify Model
```python
# backend/app/models/user.py
class User(Base):
    __tablename__ = "users"
 
    # Add new field
    new_field = Column(String, nullable=True)  # Start nullable for existing rows
```
 
#### 2. Generate Migration
```bash
cd backend
alembic revision --autogenerate -m "Add new_field to users table"
```
 
#### 3. Review Generated Migration
```python
# backend/alembic/versions/xxxxx_add_new_field.py
def upgrade():
    op.add_column('users', sa.Column('new_field', sa.String(), nullable=True))
 
    # If you need to set default values:
    # op.execute("UPDATE studyforge.users SET new_field = 'default_value'")
 
    # If making NOT NULL:
    # op.alter_column('users', 'new_field', nullable=False)
 
def downgrade():
    op.drop_column('users', 'new_field')
```
 
#### 4. Apply Migration
```bash
alembic upgrade head
```
 
#### 5. Verify
```bash
alembic current --verbose
psql -U studyforge_app -d studyforge -c "\d studyforge.users"
```
 
### Adding a Frontend Page
 
#### 1. Create Page Component
```typescript
// frontend/src/pages/resources/ResourcesPage.tsx
import { useState, useEffect } from 'react';
import { listResources } from '@/services/api/resources.api';
 
export function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
 
  useEffect(() => {
    loadResources();
  }, []);
 
  const loadResources = async () => {
    try {
      const data = await listResources();
      setResources(data);
    } catch (err) {
      console.error('Failed to load resources:', err);
    } finally {
      setLoading(false);
    }
  };
 
  if (loading) return <LoadingSpinner />;
 
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Resources</h1>
      {/* Content */}
    </div>
  );
}
```
 
#### 2. Create API Service
```typescript
// frontend/src/services/api/resources.api.ts
import api from '../api';
 
export const listResources = async (): Promise<Resource[]> => {
  const response = await api.get('/resources');
  return response.data;
};
 
export const createResource = async (data: ResourceCreate): Promise<Resource> => {
  const response = await api.post('/resources', data);
  return response.data;
};
```
 
#### 3. Add Route
```typescript
// frontend/src/main.tsx
import { ResourcesPage } from './pages/resources/ResourcesPage';
 
const router = createBrowserRouter([
  // ... existing routes
  {
    path: "/resources",
    element: <ProtectedRoute><ResourcesPage /></ProtectedRoute>,
  },
]);
```
 
#### 4. Add Navigation Link
```typescript
// frontend/src/components/layout/Navbar.tsx
<Link to="/resources" className="nav-link">
  Resources
</Link>
```
 
### Debugging Common Issues
 
#### "relation does not exist"
```bash
# Apply migrations
cd backend
alembic upgrade head
```
 
#### "password authentication failed"
```bash
# Check .env files match setup_database.sql passwords
# Verify DATABASE_URL uses studyforge_app
# Verify ALEMBIC_URL uses studyforge_owner
```
 
#### "No module named 'app'"
```bash
# Ensure you're in backend directory
cd backend
# Activate virtual environment
source .venv/bin/activate  # Linux/Mac
.\.venv\Scripts\Activate.ps1  # Windows
```
 
#### OpenAI API errors
```bash
# Check API key in .env
echo $OPENAI_API_KEY  # Linux/Mac
$env:OPENAI_API_KEY  # Windows PowerShell
 
# Test API key
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```
 
#### CORS errors in frontend
```python
# backend/app/config.py
CORS_ORIGINS: list[str] = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
```

---

## 🤖 Custom Agents

StudyForge includes specialized Claude Code agents to automate common development tasks. These agents are located in [`.claude/agents/`](.claude/agents/) and can be invoked automatically or explicitly.

### Available Agents

#### 1. **test-runner** - Automated Testing Agent

**Purpose**: Automatically runs backend pytest tests, frontend TypeScript checks, frontend unit tests, linting, and build verification. Analyzes failures, proposes fixes, and re-runs tests to verify solutions.

**Location**: [`.claude/agents/test-runner.md`](.claude/agents/test-runner.md)

**When to use**:
- After making code changes
- Before committing code
- When investigating test failures
- For continuous testing during development
- Before creating pull requests

**Capabilities**:
- ✅ Executes backend tests (`pytest`) with coverage
- ✅ Runs frontend type checks (`npx tsc --noEmit`)
- ✅ Executes frontend unit tests (`pnpm test`)
- ✅ Runs frontend linting (`pnpm lint`)
- ✅ Validates production build (`pnpm build`)
- ✅ Analyzes test failures and identifies root causes
- ✅ Proposes and applies fixes
- ✅ Re-runs tests to verify fixes
- ✅ Provides detailed test execution reports

**Usage**:
```
> Run all tests
> Use test-runner to check if tests pass
> Have the test-runner fix the failing tests
```

**Example workflow**:
1. Agent runs: `cd backend && .venv/Scripts/python.exe -m pytest tests/ -v`
2. Detects failures and analyzes each one
3. Reads failing test and implementation code
4. Proposes fixes with explanations
5. Applies fixes (if permitted)
6. Re-runs tests to verify
7. Reports final status

#### 2. **studyforge-assistant** - Project Expert

**Purpose**: Expert assistant that deeply understands the StudyForge codebase architecture, conventions, and technical decisions. Use for general development questions, code reviews, and guidance.

**Location**: [`.claude/agents/studyforge-assistant.md`](.claude/agents/studyforge-assistant.md)

**When to use**:
- Questions about project architecture
- Understanding existing code patterns
- Guidance on implementing new features
- Code review and best practices
- Debugging architectural issues

**Capabilities**:
- ✅ Deep knowledge of StudyForge architecture
- ✅ Explains technical decisions from CLAUDE.md
- ✅ Guides on layered architecture (Router → Service → Repository → Model)
- ✅ Ensures SQLAlchemy 2.0 patterns
- ✅ Validates ownership checks and security
- ✅ Provides context-aware code examples

**Usage**:
```
> How should I implement [feature]?
> Explain why we use the studyforge schema
> What's the correct way to add a new endpoint?
> Review this code for compliance with conventions
```

**Example workflow**:
1. User asks architectural question
2. Agent searches codebase for relevant patterns
3. Reads existing implementations
4. Explains conventions and decisions
5. Provides code examples
6. Links to relevant documentation

#### 3. **security-reviewer** - Security Analysis Agent

**Purpose**: Performs comprehensive security reviews of StudyForge code. Checks for vulnerabilities, validates authentication/authorization, reviews input validation, and ensures secure coding practices.

**Location**: [`.claude/agents/security-reviewer.md`](.claude/agents/security-reviewer.md)

**When to use**:
- Before merging security-sensitive code
- When implementing authentication/authorization
- Reviewing user input handling
- Auditing API endpoints
- Before production deployments

**Capabilities**:
- ✅ Authentication & authorization review (JWT, ownership validation)
- ✅ Input validation analysis (Pydantic schemas, file uploads)
- ✅ SQL injection prevention checks
- ✅ XSS prevention validation
- ✅ Command injection detection
- ✅ Secrets management audit
- ✅ Error message sanitization review
- ✅ CORS configuration validation
- ✅ Rate limiting verification

**Usage**:
```
> Review this endpoint for security issues
> Use security-reviewer to audit authentication flow
> Check this file upload handler for vulnerabilities
> Perform a security review of the API
```

**Example workflow**:
1. Agent analyzes authentication flow
2. Checks all endpoints for ownership validation
3. Reviews Pydantic schemas for weak validation
4. Scans for SQL/XSS/Command injection risks
5. Audits secrets management
6. Generates comprehensive security report
7. Provides specific fixes with code examples

#### 4. **docs-maintainer** - Documentation Synchronization Agent

**Purpose**: Maintains documentation with Single Source of Truth principle. Keeps CLAUDE.md, docs/, and README.md synchronized with current codebase. Detects outdated patterns, validates code examples, and ensures consistency.

**Location**: [`.claude/agents/docs-maintainer.md`](.claude/agents/docs-maintainer.md)

**When to use**:
- After adding new features or endpoints
- When architectural changes occur
- Periodic documentation audits
- Before releases or major milestones
- When code examples need validation

**Capabilities**:
- ✅ Detects outdated documentation and code examples
- ✅ Validates code snippets match current codebase
- ✅ Maintains documentation hierarchy (docs/ → CLAUDE.md → README.md)
- ✅ Ensures Single Source of Truth principle
- ✅ Synchronizes changes across documentation files
- ✅ Checks link integrity and terminology consistency
- ✅ Identifies missing documentation for new features

**Usage**:
```
> Update documentation for new endpoint
> Run a full documentation audit
> Validate all code examples in CLAUDE.md
> Check if docs match current architecture
```

**Example workflow**:
1. Agent reads all documentation files
2. Compares documented patterns with actual code
3. Identifies discrepancies and outdated examples
4. Validates that docs/ is authoritative source
5. Ensures CLAUDE.md references docs/ correctly
6. Verifies README.md is brief overview with links
7. Generates audit report with proposed fixes
8. Applies updates (with permission)

**Documentation Hierarchy**:
```
docs/ (Detailed Source of Truth)
  ├── ARCHITECTURE.md    # System design (authoritative)
  ├── DATABASE.md        # Schema details (authoritative)
  ├── API.md             # Endpoint reference (authoritative)
  ├── DECISIONS.md       # Technical decisions (authoritative)
  ├── SECURITY.md        # Security guide (authoritative)
  └── TESTING.md         # Testing strategy (authoritative)

CLAUDE.md (Comprehensive AI Assistant Guide)
  └── References and summarizes docs/ with AI-specific guidance

README.md (High-level Project Overview)
  └── Brief overview that links to detailed docs/
```

#### 5. **commit-organizer** - Smart Git Commit Assistant

**Purpose**: Automatically organizes file changes into logical atomic commits following Conventional Commits specification. Intelligently groups related files and generates properly formatted commit messages with type classification (feat, fix, refactor, etc.) and scope detection (backend, frontend, database, etc.).

**Location**: [`.claude/agents/commit-organizer.md`](.claude/agents/commit-organizer.md)

**When to use**:
- Before committing code changes
- When you have multiple unrelated changes
- To ensure clean git history
- Before creating pull requests
- When unsure how to organize commits

**Capabilities**:
- ✅ Analyzes working directory changes (`git status`, `git diff`)
- ✅ Automatically classifies changes by type (feat/fix/refactor/perf/docs/etc.)
- ✅ Detects appropriate scope (backend/frontend/database/api/etc.)
- ✅ Groups related files into atomic commits
- ✅ Generates Conventional Commits formatted messages
- ✅ Validates commit safety (no secrets, proper file sizes)
- ✅ Prevents dangerous operations (checks before amending)
- ✅ Creates descriptive commit bodies with bullet points

**Usage**:
```
> Help me commit these changes
> Use commit-organizer to organize my commits
> Create commits following conventional commits
> Organize these changes into logical commits
```

**Example workflow**:
1. Agent runs `git status` and `git diff` to analyze changes
2. Classifies each file by type (feat/fix/refactor/etc.)
3. Detects scope (backend/frontend/database/etc.)
4. Groups related files into logical commits
5. Proposes commit plan with formatted messages
6. Waits for user approval
7. Creates commits with proper format
8. Verifies commits were created successfully

**Commit Message Format**:
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Supported Types**:
- `feat`: New feature for the user
- `fix`: Bug fix
- `refactor`: Code restructuring without behavior change
- `perf`: Performance improvements
- `docs`: Documentation only changes
- `test`: Adding or updating tests
- `style`: Formatting, missing semicolons, etc.
- `build`: Build system or dependency changes
- `ci`: CI configuration changes
- `chore`: Maintenance tasks

**Supported Scopes**:
- `backend`: Python/FastAPI/SQLAlchemy changes
- `frontend`: React/TypeScript changes
- `database`: Migrations, schema changes
- `api`: API endpoints or schemas
- `auth`: Authentication/authorization
- `docs`: Documentation files
- `config`: Configuration files

**Example Output**:
```markdown
## Análisis de Cambios

**Archivos modificados:** 5
**Archivos sin seguimiento:** 2

### Agrupación Propuesta

He identificado **2 grupos lógicos** para commits atómicos:

---

### 📦 Commit 1: `feat(backend): Add user authentication endpoints`

**Tipo:** feat
**Alcance:** backend
**Archivos incluidos:**
- backend/app/routers/auth.py
- backend/app/services/auth_service.py
- backend/app/schemas/auth.py

**Razón del agrupamiento:**
Estos archivos implementan juntos la funcionalidad de autenticación JWT.

**Mensaje completo:**
```
feat(backend): Add user authentication endpoints

- Implement /auth/login and /auth/register endpoints
- Add AuthService with Argon2 password hashing
- Create Pydantic schemas for auth requests/responses
- Add JWT token generation and validation
```

**Verificación de seguridad:** ✅ Sin secretos, ✅ Tamaño < 1MB

---

### 📦 Commit 2: `docs: Update API documentation for auth endpoints`

**Tipo:** docs
**Alcance:** docs
**Archivos incluidos:**
- docs/API.md
- CLAUDE.md

**Razón del agrupamiento:**
Actualización de documentación para reflejar nuevos endpoints de autenticación.

**Mensaje completo:**
```
docs: Update API documentation for auth endpoints

- Document /auth/login and /auth/register
- Add authentication section to API reference
- Update CLAUDE.md with auth examples
```

**Verificación de seguridad:** ✅ Sin secretos, ✅ Tamaño < 1MB

---

## Siguiente Paso

¿Deseas que proceda a crear estos commits?
```

**Safety Features**:
- 🔒 Checks for secrets before committing (.env, API keys)
- 🔒 Validates file sizes (warns on large files >1MB)
- 🔒 Verifies authorship before amending
- 🔒 Never skips git hooks without permission
- 🔒 Detects if commits are already pushed before amending

---

#### 6. **git-historian** - Git History Analysis Agent

**Purpose**: Analyzes git commit history to identify patterns, generate change reports, track component evolution, audit commit quality, and analyze branch lifecycles. Provides deep insights into project development over time.

**Location**: [`.claude/agents/git-historian.md`](.claude/agents/git-historian.md)

**When to use**:
- Analyzing commits in a time range (last week, month, between dates)
- Comparing versions or tags (what changed between v1.0 and v1.1)
- Tracking component evolution (who worked on what)
- Auditing commit message quality
- Analyzing branch lifecycles
- Preparing for releases or retrospectives

**Capabilities**:
- ✅ Analyzes commit history by time range, author, type, or scope
- ✅ Generates change reports between versions/tags
- ✅ Tracks component evolution and code ownership
- ✅ Audits commit quality (Conventional Commits compliance)
- ✅ Analyzes branch divergence and merge patterns
- ✅ Identifies patterns, trends, and anomalies
- ✅ Calculates development velocity and code churn
- ✅ Detects breaking changes and highlights significant commits

**Usage**:
```
> Analyze commits from last month
> What changed between v1.0 and v1.1?
> Who worked on authentication?
> Audit commit message quality
> Analyze the feature-auth branch
> Show me the evolution of summary_service.py
```

**Example workflow**:
1. Agent runs `git log` with appropriate filters
2. Parses Conventional Commits format
3. Groups commits by type, scope, or author
4. Calculates statistics (lines changed, file churn)
5. Identifies patterns and trends
6. Generates formatted report with insights
7. Provides actionable recommendations

**Example Output**:
```markdown
## Análisis de Commits: Últimos 30 días

**Período:** 2025-01-01 - 2025-01-30
**Total de commits:** 45

### Distribución por Tipo
- **feat**: 15 commits (33%)
- **fix**: 12 commits (27%)
- **test**: 8 commits (18%)
- **refactor**: 6 commits (13%)
- **docs**: 4 commits (9%)

### Distribución por Alcance
- **backend**: 20 commits
- **frontend**: 15 commits
- **docs**: 7 commits
- **database**: 3 commits

### Commits Destacados
- 6bd614d test(backend): Improve quiz_service coverage from 32% to 80%
- 4445f87 feat(backend): Add audit logging for security-critical operations
- 77a9710 docs: Add ISO 27001 compliance documentation

### Tendencias Observadas
- Alto enfoque en testing (18% de commits)
- Mejora significativa en documentación de seguridad
- Actividad balanceada entre backend y frontend
```

---

#### 7. **changelog-manager** - CHANGELOG.md Generator

**Purpose**: Generates and maintains CHANGELOG.md following Keep a Changelog format. Automatically parses Conventional Commits, organizes changes by version, detects breaking changes, and creates professional release notes.

**Location**: [`.claude/agents/changelog-manager.md`](.claude/agents/changelog-manager.md)

**When to use**:
- Creating initial CHANGELOG.md
- Updating changelog with unreleased changes
- Preparing new version releases
- Generating release notes
- Validating changelog quality
- Before creating tags or releases

**Capabilities**:
- ✅ Generates CHANGELOG.md from git history
- ✅ Follows Keep a Changelog 1.1.0 format
- ✅ Parses Conventional Commits automatically
- ✅ Maps commit types to changelog categories (Added/Fixed/Changed)
- ✅ Organizes changes by version (from git tags)
- ✅ Detects breaking changes (! or BREAKING CHANGE)
- ✅ Updates [Unreleased] section with new commits
- ✅ Prepares version releases with proper dates
- ✅ Generates release notes for GitHub/announcements
- ✅ Validates changelog quality and format

**Usage**:
```
> Generate CHANGELOG.md
> Update changelog with unreleased changes
> Prepare version v1.2.0 for release
> Generate release notes for v1.2.0
> Validate CHANGELOG.md format
> What should the next version be?
```

**Example workflow**:
1. Agent reads git tags and commit history
2. Parses Conventional Commits format
3. Maps types to changelog categories:
   - `feat` → **Added**
   - `fix` → **Fixed**
   - `refactor`, `perf` → **Changed**
4. Organizes by version (newest first)
5. Detects breaking changes
6. Generates or updates CHANGELOG.md
7. Validates format compliance

**Changelog Format**:
```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- New features not yet released

## [1.2.0] - 2025-01-20

### Added
- JWT authentication system
- Adaptive quiz difficulty

### Fixed
- Password validation error messages
- Quota calculation for large files

[Unreleased]: https://github.com/username/repo/compare/v1.2.0...HEAD
[1.2.0]: https://github.com/username/repo/compare/v1.1.0...v1.2.0
```

**Commit Type Mapping**:
- `feat` → **Added** (new features)
- `fix` → **Fixed** (bug fixes)
- `refactor`, `perf` → **Changed** (improvements)
- `docs`, `test` → Optional sections
- `build`, `ci`, `chore` → Omitted (internal)

**Breaking Changes Handling**:
```markdown
### Changed
- ⚠️ **BREAKING**: API response format changed
  - **Migration**: Update client code to use new field names
  - **Impact**: All API consumers must update
```

**Semantic Versioning Guidance**:
- **MAJOR** (X.0.0): Breaking changes
- **MINOR** (0.X.0): New features (backward-compatible)
- **PATCH** (0.0.X): Bug fixes (backward-compatible)

---

#### 8. **Conventions Reference Files**

StudyForge utiliza archivos de convenciones para mantener consistencia en código generado por agentes AI.

**Location:** `.claude/conventions/`

**Available Conventions:**

##### `code-style.md` - Syntax and Formatting Rules
- Exact syntax for Python, TypeScript, SQL
- Indentation, quotes, naming conventions
- React component rules (<100 lines, reuse over create)
- SQLAlchemy 2.0 patterns (mapped_column preferred)

##### `testing-guide.md` - Testing Patterns
- AAA pattern (Arrange-Act-Assert)
- Available fixtures (fake_db, fake_user, etc.)
- Commands for running tests
- Anti-patterns to avoid

##### `conventional-commits.md` - Commit Message Format
- Types (feat, fix, refactor, docs, etc.)
- Scopes (backend, frontend, database, etc.)
- Examples and best practices

**Usage by Agents:**
- test-runner → reads testing-guide.md
- commit-organizer → reads conventional-commits.md
- All agents → follow code-style.md when generating code

---

#### 7. **ISO 27001 Security Compliance**

StudyForge implementa controles de ISO/IEC 27001 para demostrar buenas prácticas de seguridad de la información en el contexto de un proyecto capstone académico.

**Documentation Location:** `docs/security/`

**Key Documents:**
- `ISO27001_OVERVIEW.md` - What is ISO 27001, scope for capstone project
- `COMPLIANCE_CHECKLIST.md` - Current state vs ISO controls (detailed mapping)
- `RISK_ASSESSMENT.md` - Risk analysis and treatment plan
- `SECURE_DEVELOPMENT.md` - Secure SDLC (A.14 control)
- `ACCESS_CONTROL_POLICY.md` - Access control implementation (A.9 control)
- `AUDIT_LOGGING.md` - Audit logging implementation (A.12.4 control)

**Implemented Controls:**

✅ **A.9 - Access Control (IMPLEMENTED)**
- Ownership validation en todos los endpoints protegidos
- JWT authentication con expiración (24 horas)
- Roles separados de base de datos (DDL vs DML)
- Evidence: `backend/app/core/dependencies.py:28-78`

✅ **A.10 - Cryptography (IMPLEMENTED)**
- Argon2id para password hashing (memory-hard, GPU-resistant)
- JWT signing con HS256
- Evidence: `backend/app/core/security.py:15-50`
- Pending: Encryption at rest para `documents.file_content`

⚠️ **A.12.4 - Logging and Monitoring (PARTIAL)**
- Structured logging system (`backend/app/core/logging.py`)
- Audit logging para eventos críticos (authentication, CRUD operations)
- Function `log_audit_event()` aplicada en:
  - `backend/app/routers/auth.py` - login, register
  - `backend/app/routers/documents.py` - upload, delete
  - `backend/app/routers/summaries.py` - create, delete
  - `backend/app/routers/quizzes.py` - create, delete
- Pending: Log centralization, automated retention

⚠️ **A.14 - Secure Development (PARTIAL)**
- Pydantic validation en todos los endpoints
- Type hints obligatorios (Python/TypeScript)
- SSDLC documentado en `docs/security/SECURE_DEVELOPMENT.md`
- Evidence: `.claude/conventions/code-style.md`, `CLAUDE.md`
- Pending: Mandatory code review en producción

⚠️ **A.13 - Communications Security (DEVELOPMENT)**
- JWT implemented
- CORS configured correctly
- Pending: HTTPS en producción, TLS 1.3

**Critical for Capstone:**
- ✅ Access control y ownership validation (A.9)
- ✅ Password hashing con Argon2 (A.10)
- ✅ Input validation con Pydantic (A.14)
- ✅ Basic audit logging (A.12.4)

**Identified Gaps:**
- ❌ Automated backups no configurados (A.12.3)
- ⚠️ Rate limiting no aplicado a auth endpoints (A.9)
- ⚠️ HTTPS not configured en desarrollo (A.13)
- ⚠️ Encryption at rest no implementada (A.10)

**Audit Events Logged:**
- `user_registration` - Usuario registrado (success/failure)
- `login_attempt` - Intento de login (success/failure)
- `document_upload` - Documento subido
- `document_deletion` - Documento eliminado
- `summary_creation` - Resumen generado
- `summary_deletion` - Resumen eliminado
- `quiz_creation` - Quiz generado
- `quiz_deletion` - Quiz eliminado

**Log Format:**
```json
{
  "event": "login_attempt",
  "user_id": "uuid",
  "action": "login",
  "result": "success",
  "timestamp": "2025-11-29T10:30:00Z",
  "extra": {"email": "user@example.com"}
}
```

**Log Location:** `backend/logs/app.log` (rotating file handler)

**Query Logs:** `grep "AUDIT" backend/logs/app.log`

**See:** `docs/security/COMPLIANCE_CHECKLIST.md` para estado completo de controles

---

### How Agents Work

#### Automatic Invocation
Claude Code automatically detects when to use an agent based on the task description:

```
User: "Run the tests"
→ Claude invokes test-runner agent automatically

User: "How do I add a new endpoint?"
→ Claude invokes studyforge-assistant agent automatically

User: "Check this code for security issues"
→ Claude invokes security-reviewer agent automatically

User: "Update documentation for my changes"
→ Claude invokes docs-maintainer agent automatically

User: "Help me commit these changes"
→ Claude invokes commit-organizer agent automatically

User: "Analyze commits from last month"
→ Claude invokes git-historian agent automatically

User: "Generate CHANGELOG.md"
→ Claude invokes changelog-manager agent automatically
```

#### Explicit Invocation
You can explicitly request a specific agent:

```
> Use the test-runner agent to run all tests
> Ask the studyforge-assistant how to implement [feature]
> Have the security-reviewer audit this endpoint
> Use docs-maintainer to validate all documentation
> Use commit-organizer to organize my commits
> Use git-historian to analyze commits from last quarter
> Use changelog-manager to generate CHANGELOG.md
```

#### Agent Context
Each agent:
- Has access to the full codebase via Read, Grep, Glob tools
- Can execute bash commands (respecting permissions)
- Understands StudyForge conventions from CLAUDE.md
- Operates independently with focused expertise
- Returns detailed reports with actionable recommendations

### Creating Custom Agents

To create a new agent for your workflow:

1. **Create agent file**:
   ```bash
   # Create new agent in .claude/agents/
   touch .claude/agents/my-agent.md
   ```

2. **Define agent structure**:
   ```markdown
   ---
   name: my-agent
   description: Clear description of when to use this agent
   tools: Read, Edit, Bash, Grep, Glob
   model: sonnet
   permissionMode: default
   ---

   # Your agent's system prompt
   Detailed instructions about what the agent should do...
   ```

3. **Use the agent**:
   ```
   > Use my-agent to perform [task]
   ```

See the existing agents in [`.claude/agents/`](.claude/agents/) for complete examples.

### Agent Best Practices

**When using agents**:
- ✅ Let Claude automatically select the right agent for the task
- ✅ Be specific about what you want the agent to do
- ✅ Review agent reports and apply fixes manually if needed
- ✅ Use agents iteratively for complex tasks

**When creating agents**:
- ✅ Give agents a single, clear responsibility
- ✅ Provide detailed instructions in the system prompt
- ✅ Specify only the tools the agent needs
- ✅ Set appropriate permission modes
- ✅ Test agents with realistic scenarios

**Agent language conventions**:
- ✅ **All agent instructions must be written in English** for consistency and maintainability
- ✅ Add a single line at the top: `**IMPORTANT: Always respond to the user in Spanish.**`
- ✅ This ensures agents communicate in Spanish while keeping instructions clear and technical
- ✅ Code examples, technical terms, and commands stay in their native language (English/code)
- ✅ Never mix languages within instruction text (choose English for instructions)

**Security considerations**:
- 🔒 Agents respect `.claude/settings.local.json` permissions
- 🔒 `permissionMode: default` requires user approval for edits
- 🔒 `permissionMode: acceptEdits` allows autonomous edits (use carefully)
- 🔒 Review agent changes before committing

---

## 📄 Important Files
 
### Configuration Files
 
#### Backend Configuration
- **`backend/.env`**: Runtime environment variables (DATABASE_URL, SECRET_KEY, OPENAI_API_KEY)
- **`backend/.env.alembic`**: Migration environment variables (ALEMBIC_URL)
- **`backend/app/config.py`**: Pydantic Settings class (centralized config)
- **`backend/alembic.ini`**: Alembic configuration
- **`backend/requirements.txt`**: Python dependencies
- **`backend/setup_database.sql`**: PostgreSQL initialization script
 
#### Frontend Configuration
- **`frontend/package.json`**: npm dependencies and scripts
- **`frontend/tsconfig.json`**: TypeScript compiler options
- **`frontend/vite.config.ts`**: Vite bundler configuration
- **`frontend/tailwind.config.cjs`**: Tailwind CSS customization (brand colors)
 
### Key Source Files
 
#### Backend Core
- **`backend/app/main.py`**: FastAPI app entry point
- **`backend/app/db.py`**: Database session management
- **`backend/app/core/dependencies.py`**: Authentication and ownership validation
- **`backend/app/core/security.py`**: JWT and Argon2 utilities
- **`backend/app/core/logging.py`**: Structured logging system
 
#### Frontend Core
- **`frontend/src/main.tsx`**: React entry point + router configuration
- **`frontend/src/context/AuthContext.tsx`**: Global authentication state
- **`frontend/src/services/api.ts`**: Axios client with JWT interceptors
- **`frontend/src/index.css`**: Global styles (Tailwind + custom CSS)
 
### Documentation
- **`README.md`**: Project overview and setup instructions
- **`SETUP.md`**: Detailed setup guide
- **`docs/ARCHITECTURE.md`**: System architecture
- **`docs/DATABASE.md`**: Database schema and migrations
- **`docs/DECISIONS.md`**: Technical decision log
- **`docs/API.md`**: Complete API reference
- **`docs/SECURITY.md`**: Security considerations
- **`docs/TESTING.md`**: Testing strategy, setup, and best practices
- **`docs/NEXT_STEPS.md`**: Current tasks and roadmap
 
---

## 🎯 Task Complexity Evaluation (for AI Assistants)

Before starting implementation, evaluate task complexity to determine if you need to gather context from documentation:

### 🟢 Simple Task (proceed directly)

**Characteristics**:
- Modifying existing code you've already read
- Small bug fixes, typos, formatting
- Adding simple validation or logging
- Tasks confined to 1-2 files
- You're already familiar with the code

**Examples**:
- "fix typo in README"
- "add email validation to schema"
- "update error message"
- "format code with black"

**Action**: Proceed directly with implementation

---

### 🟡 Moderate Task (read relevant code first)

**Characteristics**:
- Feature enhancements in familiar area
- Refactoring within single module
- Tasks spanning 2-3 files
- You need to understand existing patterns

**Examples**:
- "improve error messages in auth service"
- "extract helper function from repository"
- "add new field to existing model"

**Action**: Use Read tool to understand context, then proceed

---

### 🔴 Complex Task (use context-gatherer)

**Characteristics**:
- Creating new endpoints/features
- Multi-layer changes (Model → Repository → Service → Router)
- Security-sensitive operations (auth, ownership)
- Database schema changes
- Tasks spanning 3+ architectural layers
- Unfamiliar area without prior context

**Examples**:
- "implement user preferences endpoint"
- "add OAuth authentication"
- "implement user preferences endpoint with proper security"
- "optimize summary listing query"
- "add new quiz type with adaptive difficulty"

**Action**: Invoke `context-gatherer` agent to gather relevant context in parallel

---

### Decision Keywords

**✅ Use context-gatherer when task includes**:
- "new endpoint"
- "implement feature"
- "add authentication"
- "with proper security"
- "update database"
- "create new [resource type]"
- Multiple concerns mentioned (e.g., "with security and database changes")

**❌ Proceed directly when task is**:
- "fix [simple issue]"
- "typo"
- "update comment"
- "add log statement"
- "format code"

---

### Decision Flow

```
User Request
    ↓
Have I read the relevant code?
    ↓ No
Is this multi-layer/security-sensitive/database change?
    ↓ Yes
🔴 Use context-gatherer
    ↓ (gathers context in parallel)
Receive consolidated context
    ↓
Proceed with implementation
```

**Important**: When in doubt, prefer using context-gatherer. It's better to have too much context than too little, especially for critical features.

---

## 🤖 Best Practices for AI Assistants
 
### When Making Changes
 
#### 1. Always Read Before Editing
```markdown
❌ WRONG: Assume file structure and make changes
✅ CORRECT: Use Read tool to understand current code, then Edit
```
 
#### 2. Maintain Architectural Layers
- **Never** bypass layers (e.g., Router → Repository directly)
- **Always** follow: Router → Service → Repository → Model
- **Keep** business logic in Services, data access in Repositories
 
#### 3. Preserve Ownership Validation
- **Never** remove `verify_*_ownership()` calls
- **Always** add ownership checks when creating new endpoints
- **Critical** for user privacy and data isolation
 
#### 4. Follow SQLAlchemy 2.0 Patterns
```python
# ❌ Don't use legacy API
db.query(Model).filter(...)
 
# ✅ Use modern select()
from sqlalchemy import select
stmt = select(Model).where(...)
db.execute(stmt).scalars().all()
```
 
#### 5. Database Changes Require Migrations
- **Never** modify models without creating a migration
- **Always** review autogenerated migrations
- **Test** both upgrade and downgrade
 
#### 6. Type Hints Are Mandatory
- **Backend**: All function signatures must have complete type hints
- **Frontend**: Use TypeScript interfaces, avoid `any`
 
#### 7. Logging for Debugging
- **Add** structured logging for new features
- **Use** appropriate log levels (DEBUG, INFO, WARNING, ERROR)
- **Include** context (user_id, resource_id, operation)
 
#### 8. Error Handling
- **Backend**: Raise appropriate HTTPException with correct status codes
- **Frontend**: Handle errors gracefully with user-friendly messages
- **Always** log errors with context
 
#### 9. Security Considerations
- **Validate** all user input with Pydantic schemas
- **Check** ownership before operations
- **Never** expose internal errors to users
- **Use** parameterized queries (SQLAlchemy handles this)
 
#### 10. Testing
- **Write** tests for new features
- **Run** existing tests before committing
- **Update** fixtures if models change

#### 11. Working with Denormalized Fields
StudyForge uses denormalization for performance and historical preservation.

**When to denormalize**:
- ✅ Data that rarely changes (document titles, filenames)
- ✅ Frequent read queries (listings, summaries)
- ✅ Need for historical preservation (show source even after deletion)
- ❌ Data that changes frequently
- ❌ Large data (>1KB per field)

**Pattern to follow**:
```python
# ❌ WRONG: Rely only on FK, breaks when source is deleted
class Summary(Base):
    document_id: Mapped[UUID] = mapped_column(ForeignKey("documents.id"))
    # Si document es eliminado → document_id = NULL → pérdida de información

# ✅ CORRECT: FK + denormalized cache
class Summary(Base):
    document_id: Mapped[UUID] = mapped_column(
        ForeignKey("documents.id", ondelete="SET NULL"),
        nullable=True
    )
    # Campos denormalizados (cache)
    source_document_title: str (nullable)
    source_document_filename: str (nullable)
    document_state: str (default='active_in_space')  # Estado del source
```

**When reading**:
```python
# ✅ CORRECT: Use cached fields for display
summary.source_document_title  # "documento.pdf"
summary.document_state          # "active_in_space" | "permanently_deleted"

# ❌ WRONG: JOIN just to get document title
db.execute(
    select(Summary, Document.title)
    .join(Document, Summary.document_id == Document.id)
).all()  # Costoso y falla si document fue eliminado
```

**When creating/updating**:
```python
# ✅ CORRECT: Populate cache when creating
summary = Summary(
    document_id=document.id,
    source_document_title=document.title,      # Cache
    source_document_filename=document.file_name,  # Cache
    document_state="active_in_space"
)

# ✅ CORRECT: Update cache when source changes (rare)
if document.title != summary.source_document_title:
    summary.source_document_title = document.title
```

**When deleting source**:
```python
# FK con ondelete="SET NULL" maneja esto automáticamente:
# 1. document_id → NULL
# 2. Cache fields permanecen intactos (preservación histórica)
# 3. UI puede mostrar: "Generado de: documento.pdf (eliminado)"
```

**Benefits**:
- ~40% fewer JOINs in list queries
- Historical preservation (show source even after deletion)
- Simpler queries, better performance

**Trade-offs**:
- ~10% more table space
- Cache can desync if source is renamed (acceptable edge case)

### When Explaining Code
 
#### 1. Reference File Locations
Use format: `file_path:line_number`
 
Example:
```
The ownership validation occurs in backend/app/core/dependencies.py:78
```
 
#### 2. Provide Context
- Explain **why** the code is structured this way
- Reference relevant decisions in `docs/DECISIONS.md`
- Link to related documentation
 
#### 3. Show Examples
- Provide correct usage examples
- Show common pitfalls to avoid
- Include both backend and frontend when relevant
 
### When Debugging
 
#### 1. Check Logs First
```bash
# Backend logs show structured events
tail -f backend/logs/app.log
 
# Look for ERROR level or ownership validation denials
```
 
#### 2. Verify Database State
```bash
# Check if tables exist
psql -U studyforge_app -d studyforge -c "\dt studyforge.*"
 
# Check migration status
cd backend && alembic current
```
 
#### 3. Test API Directly
```bash
# Use httpie or curl to test endpoints
http GET localhost:8000/health
 
# Test with authentication
http GET localhost:8000/summaries "Authorization: Bearer <token>"
```
 
#### 4. Check Frontend Console
- Network tab for API errors
- Console for JavaScript errors
- Application tab for localStorage/sessionStorage
 
### When Adding Features
 
#### 1. Follow Existing Patterns
- Study similar existing features
- Maintain consistency with current code style
- Reuse existing components and utilities
 
#### 2. Update Documentation
- Add new endpoints to `docs/API.md`
- Update `docs/ARCHITECTURE.md` if structure changes
- Document decisions in `docs/DECISIONS.md`
 
#### 3. Consider All Layers
- **Backend**: Model → Repository → Service → Router → Schema
- **Frontend**: API Service → Page Component → UI Components
- **Database**: Migration if model changes
 
#### 4. Think About Security
- Ownership validation for new resources
- Input validation with Pydantic
- Rate limiting for expensive operations
 
#### 5. Plan for Errors
- What happens if API call fails?
- What if user has no data?
- How to handle quota exceeded?
 
### Code Review Checklist
 
Before considering changes complete:
 
- [ ] Type hints on all new functions
- [ ] Ownership validation on protected endpoints
- [ ] SQLAlchemy 2.0 syntax (select, not query)
- [ ] Pydantic schemas for API input/output
- [ ] Migration created for model changes
- [ ] Tests pass (`pytest` for backend)
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] Logging added for new operations
- [ ] Error handling for edge cases
- [ ] Documentation updated if needed
- [ ] Git commit messages are descriptive
 
---
 
## 📚 Additional Resources
 
### Internal Documentation
- **Architecture**: `docs/ARCHITECTURE.md` - System design and component overview
- **Components**: `docs/COMPONENTS.md` - Frontend UI components reference (modals, confirmations, configs)
- **Database**: `docs/DATABASE.md` - Schema, indexes, migration guide
- **API**: `docs/API.md` - Complete endpoint reference
- **Security**: `docs/SECURITY.md` - Security model and best practices
- **Decisions**: `docs/DECISIONS.md` - Why technical choices were made
- **Roadmap**: `docs/ROADMAP.md` - Long-term development plan
 
### External References
- **FastAPI**: https://fastapi.tiangolo.com/
- **SQLAlchemy 2.0**: https://docs.sqlalchemy.org/en/20/
- **Pydantic v2**: https://docs.pydantic.dev/latest/
- **React 19**: https://react.dev/
- **React Router v7**: https://reactrouter.com/
- **Tailwind CSS**: https://tailwindcss.com/
- **PostgreSQL**: https://www.postgresql.org/docs/
 
### Quick Links
- **API Docs**: http://localhost:8000/docs (when backend running)
- **Frontend**: http://localhost:5173 (when frontend running)
- **GitHub Issues**: Report bugs and feature requests
 
---
 
## 🔄 Keeping This Document Updated
 
This document should be updated when:
- Major architectural changes occur
- New conventions are established
- Common issues are discovered
- New tools or dependencies are added
- Development workflow changes
 
**Last reviewed**: 2025-11-27
**Next review**: After major feature additions or architectural changes
 
---
