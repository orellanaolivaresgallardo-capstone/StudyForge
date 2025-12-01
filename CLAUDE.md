# CLAUDE.md - AI Assistant Guide for StudyForge

> **Last Updated**: 2025-12-01
> **Version**: 2.0.0
> **Purpose**: Comprehensive guide for AI assistants (Claude, etc.) working with the StudyForge codebase

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture & Code Organization](#architecture--code-organization)
4. [Development Environment](#development-environment)
5. [Coding Conventions & Patterns](#coding-conventions--patterns)
6. [Testing Guidelines](#testing-guidelines)
7. [Common Development Tasks](#common-development-tasks)
8. [File Structure Reference](#file-structure-reference)
9. [Key Files to Know](#key-files-to-know)
10. [Security Considerations](#security-considerations)
11. [Deployment Information](#deployment-information)
12. [Troubleshooting](#troubleshooting)

---

## Project Overview

**StudyForge** is an AI-powered learning assistance platform that helps students through:
- **Intelligent Summaries**: Multi-format document processing (PDF, DOCX, PPTX, TXT) with adaptive expertise levels (Basic, Medium, Advanced)
- **Adaptive Quizzes**: Auto-generated multiple-choice questions with difficulty adaptation based on performance
- **Study Spaces**: Organizational system for grouping documents, summaries, and quizzes by topic
- **Progress Tracking**: Statistics and analytics dashboard

### Language & Documentation
- **Primary Language**: Spanish (code comments, README, database content)
- **Code**: English (variable names, function names, technical terms)
- **User-Facing**: Spanish

### Project Status
- **Backend**: MVP complete ✅
- **Frontend**: MVP complete ✅
- **Testing**: In progress (unit and integration tests written but not complete)
- **CI/CD**: Not implemented
- **Deployment**: Planned for Render/GCP, not yet deployed

---

## Technology Stack

### Backend (`/backend`)
| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| **Runtime** | Python | 3.14 | Server runtime |
| **Framework** | FastAPI | 0.115.12 | Web framework |
| **Server** | Uvicorn | 0.37.0 | ASGI server |
| **Database** | PostgreSQL | 18 | Production database |
| **ORM** | SQLAlchemy | 2.0.36 | Database ORM |
| **Migrations** | Alembic | 1.17.2 | Schema migrations |
| **Validation** | Pydantic | 2.12.1 | Schema validation |
| **Authentication** | JWT + Argon2 | python-jose, argon2-cffi | Auth & password hashing |
| **AI** | OpenAI | 2.8.1 | GPT-4o-mini integration |
| **Testing** | Pytest | 8.3.4 | Test framework |

**File Processing**:
- PDF: `pypdf` (5.1.0), `pdfplumber` (0.11.4)
- Office: `python-docx` (1.1.2), `python-pptx` (1.0.2)
- Text: Native Python

### Frontend (`/frontend`)
| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| **Runtime** | Node.js | 24 | JavaScript runtime |
| **Framework** | React | 19.1.1 | UI framework |
| **Language** | TypeScript | 5.8.3 | Type safety |
| **Build Tool** | Vite | 6.0.3 | Bundler & dev server |
| **Routing** | React Router | 7.9.2 | Client-side routing |
| **HTTP Client** | Axios | 1.12.2 | API communication |
| **Styling** | Tailwind CSS | 3.4.13 | Utility-first CSS |
| **Charts** | Recharts | 3.5.0 | Data visualization |
| **Testing** | Vitest | 4.0.14 | Test framework |
| **Package Manager** | pnpm | 10+ | Package management |

### DevOps
- **Version Control**: Git
- **CI/CD**: Not configured (GitHub Actions planned)
- **Deployment**: Render/GCP (planned)
- **Containerization**: Not implemented (no Docker)

---

## Architecture & Code Organization

### Backend: Layered Architecture

The backend follows a strict **4-layer architecture** with clear separation of concerns:

```
Models → Repositories → Services → Routers
```

#### 1. **Models Layer** (`/app/models/`)
- SQLAlchemy ORM models
- Database schema: `studyforge`
- All tables prefixed with schema
- Foreign keys with appropriate cascades

**Example**: `/backend/app/models/user.py`
```python
class User(Base):
    __tablename__ = "users"
    __table_args__ = {"schema": "studyforge"}

    id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    hashed_password: Mapped[str]
    storage_quota_bytes: Mapped[int] = mapped_column(BigInteger, default=5_368_709_120)
    # ... relationships with cascade rules
```

#### 2. **Schemas Layer** (`/app/schemas/`)
- Pydantic models for request/response validation
- Naming pattern: `{Model}Create`, `{Model}Update`, `{Model}Response`, `{Model}DetailResponse`

**Example**: `/backend/app/schemas/user.py`
```python
class UserCreate(BaseModel):
    email: EmailStr
    username: str = Field(min_length=3, max_length=100)
    password: str = Field(min_length=8)

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    email: EmailStr
    # ...
```

#### 3. **Repositories Layer** (`/app/repositories/`)
- Data access abstraction
- Static methods for CRUD operations
- No business logic (only database operations)

**Example**: `/backend/app/repositories/user_repository.py`
```python
class UserRepository:
    @staticmethod
    def create(db: Session, email: str, username: str, hashed_password: str) -> User:
        user = User(email=email, username=username, hashed_password=hashed_password)
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def get_by_email(db: Session, email: str) -> Optional[User]:
        stmt = select(User).where(User.email == email)
        return db.execute(stmt).scalar_one_or_none()
```

#### 4. **Services Layer** (`/app/services/`)
- Business logic orchestration
- Coordinates repositories and external services
- Handles complex workflows

**Example**: `/backend/app/services/auth_service.py`
```python
class AuthService:
    @staticmethod
    def register(db: Session, email: str, username: str, password: str) -> User:
        # Validate uniqueness
        # Hash password
        # Create user via repository
        # Log audit event
        return user
```

#### 5. **Routers Layer** (`/app/routers/`)
- FastAPI endpoints
- Input validation via Pydantic schemas
- Dependency injection for auth/database

**Example**: `/backend/app/routers/auth.py`
```python
@router.post("/register", response_model=UserResponse, status_code=201)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    user = AuthService.register(db, user_data.email, user_data.username, user_data.password)
    log_audit_event(...)
    return user
```

#### 6. **Core Layer** (`/app/core/`)
Cross-cutting concerns:
- `dependencies.py`: FastAPI dependencies (`get_current_user`, ownership validators)
- `security.py`: JWT creation/validation, Argon2 password hashing
- `logging.py`: Structured logging (audit, auth, ownership, errors)
- `rate_limiter.py`: Custom middleware with sliding window algorithm
- `file_validator.py`: Magic number validation for uploads

### Frontend: Component-Based Architecture

```
Pages → Components → Services → Context
```

#### Directory Organization
- **`/pages/`**: Route-level components (one per URL)
- **`/components/`**: Reusable UI components
  - `/auth/`: Authentication components (`ProtectedRoute`)
  - `/layout/`: Layout components (`Navbar`, `AuthenticatedLayout`)
  - `/ui/`: Generic UI (`Modal`, `Toast`, `LoadingSpinner`, `Card`, `Badge`)
  - `/features/`: Feature-specific (`QuizCard`, `PerformanceChart`, `QuotaWidget`)
- **`/services/api/`**: API abstraction layer (organized by domain)
- **`/context/`**: Global state (`AuthContext`, `StorageContext`)
- **`/types/`**: TypeScript type definitions (mirror backend schemas)
- **`/hooks/`**: Custom React hooks (`useModal`, `useToast`, `useStudySpace`)
- **`/constants/`**: Configuration constants (`difficulty`, `expertise`, `routes`)
- **`/utils/`**: Utility functions (`errorHandler`)

#### Routing Structure
- **Public routes**: `/`, `/login`, `/signup`, `/forgot-password`, `/features`, `/aboutus`
- **Protected routes** (shared `AuthenticatedLayout`):
  - `/documents`
  - `/summaries`, `/summaries/:id`
  - `/study-spaces`, `/study-spaces/:id`
  - `/quizzes`, `/quizzes/:id/attempt`
  - `/quiz-attempts/:id/results`
  - `/stats`, `/profile`, `/settings`

### API Endpoints

| Prefix | Purpose | Key Endpoints |
|--------|---------|---------------|
| `/auth` | Authentication | `POST /register`, `POST /login`, `GET /me` |
| `/documents` | Document management | `POST /`, `GET /`, `DELETE /{id}` |
| `/summaries` | Summary CRUD | `POST /`, `GET /`, `GET /{id}`, `DELETE /{id}` |
| `/quizzes` | Quiz generation | `POST /`, `GET /`, `GET /{id}`, `DELETE /{id}` |
| `/quiz-attempts` | Taking quizzes | `POST /`, `GET /{id}`, `POST /{id}/submit` |
| `/study-spaces` | Study spaces | `POST /`, `GET /`, `GET /{id}`, `PATCH /{id}`, `DELETE /{id}` |
| `/stats` | Statistics | `GET /overview`, `GET /quiz-performance`, `GET /topics` |
| `/health` | Health check | `GET /` |

**API Documentation**: `http://localhost:8000/docs` (Swagger UI)

---

## Development Environment

### Prerequisites
- Python 3.14
- PostgreSQL 18 (service running)
- Node.js 24
- pnpm 10+
- OpenAI API Key

### Initial Setup

#### 1. Database Setup
```bash
# Execute SQL script as postgres superuser
psql -U postgres -f backend/setup_database.sql

# This creates:
# - Database: studyforge
# - Schema: studyforge
# - Role: studyforge_owner (for migrations) - password: "password"
# - Role: studyforge_app (for runtime) - password: "password"
```

**⚠️ PRODUCTION**: Change passwords in `setup_database.sql` before running!

#### 2. Backend Setup
```bash
cd backend

# Create and activate virtual environment
python -m venv .venv

# Windows
.\.venv\Scripts\Activate.ps1

# Linux/Mac
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
cp .env.alembic.example .env.alembic

# Edit .env and add:
# - SECRET_KEY (random string)
# - OPENAI_API_KEY (your OpenAI key)

# Run migrations
alembic upgrade head

# Start server
uvicorn app.main:app --reload
```

Server runs at: `http://localhost:8000`

#### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
pnpm install

# Start dev server
pnpm dev
```

App runs at: `http://localhost:5173`

### Environment Variables

**Backend `.env`** (runtime):
```env
DATABASE_URL=postgresql+psycopg://studyforge_app:password@localhost:5432/studyforge?options=-csearch_path=studyforge,public
SECRET_KEY=your-super-secret-key-change-this-in-production
OPENAI_API_KEY=sk-your-openai-api-key-here
OPENAI_MODEL=gpt-4o-mini
ENV=development
DEBUG=True
LOG_LEVEL=INFO
MAX_FILE_SIZE_MB=50
```

**Backend `.env.alembic`** (migrations):
```env
ALEMBIC_URL=postgresql+psycopg://studyforge_owner:password@localhost:5432/studyforge?options=-csearch_path=studyforge,public
```

**Frontend** (optional):
```env
VITE_API_BASE=http://localhost:8000
```

### Development Commands

**Backend**:
```bash
# Run server with auto-reload
uvicorn app.main:app --reload

# Run tests
pytest

# Run tests with coverage
pytest --cov=app --cov-report=html

# Create new migration
alembic revision --autogenerate -m "Description"

# Apply migrations
alembic upgrade head

# Rollback migration
alembic downgrade -1
```

**Frontend**:
```bash
# Development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Run tests
pnpm test

# Run tests with UI
pnpm test:ui

# Run tests with coverage
pnpm test:coverage

# Lint code
pnpm lint
```

---

## Coding Conventions & Patterns

### Naming Conventions

#### Backend (Python)
- **Files**: `snake_case.py`
- **Classes**: `PascalCase` (`UserRepository`, `AuthService`, `User`)
- **Functions/Methods**: `snake_case` (`get_current_user`, `create_access_token`)
- **Variables**: `snake_case`
- **Constants**: `UPPER_SNAKE_CASE` (`SCHEMA`, `VERSION_TABLE`)
- **Models**: Singular (`User`, `Document`, `Summary`)
- **Tables**: Plural (`users`, `documents`, `summaries`)

#### Frontend (TypeScript/React)
- **Files**:
  - Components: `PascalCase.tsx` (`LoginPage.tsx`, `QuizCard.tsx`)
  - Utilities: `camelCase.ts` (`errorHandler.ts`)
- **Components**: `PascalCase` (`AuthContext`, `LoadingSpinner`)
- **Functions**: `camelCase` (`getCurrentUser`, `handleSubmit`)
- **Hooks**: `use` prefix (`useAuth`, `useStudySpace`, `useModal`)
- **Types/Interfaces**: `PascalCase` (`UserResponse`, `AuthContextType`)
- **Constants**: `UPPER_SNAKE_CASE` or `camelCase`

### File Organization Patterns

#### Backend
- One class per file (repositories, services)
- Related models in separate files
- Schemas mirror model structure (Create, Update, Response variants)
- Centralized exports via `__init__.py`
- Test files mirror source: `tests/unit/test_<module>.py`

#### Frontend
- One component per file (for larger components)
- UI components in folders with `index.ts` export
- Pages have nested `components/` for page-specific components
- Centralized exports via `index.ts`
- Path alias: `@/` maps to `src/`

### Code Style

#### Backend (Python)
- **Docstrings**: Google-style, Spanish language
  ```python
  def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
      """
      Crea un JWT token de acceso.

      Args:
          data: Datos a codificar en el token (típicamente user_id)
          expires_delta: Tiempo de expiración (por defecto 24h)

      Returns:
          Token JWT codificado
      """
  ```
- **Type Hints**: Extensive use of Python 3.10+ syntax (`Mapped`, `Optional`, etc.)
- **Comments**: Spanish, descriptive
- **Imports**: Grouped (standard library, third-party, local)

#### Frontend (TypeScript)
- **JSDoc**: For complex utilities
  ```typescript
  /**
   * Cliente API base con configuración de axios, interceptors y gestión de tokens.
   */
  ```
- **Type Safety**: Strict TypeScript, no implicit `any`
- **Comments**: Spanish/English mix
- **ESLint**: Configured with TypeScript, React Hooks, React Refresh plugins

### Common Patterns

#### Backend: Repository Pattern
```python
# Always use repositories for data access
user = UserRepository.get_by_id(db, user_id)

# NOT direct model queries in services/routers
user = db.query(User).filter(User.id == user_id).first()  # ❌ DON'T
```

#### Backend: Service Layer for Business Logic
```python
# Complex operations in services
AuthService.register(db, email, username, password)

# NOT in routers
@router.post("/register")  # ❌ DON'T put business logic here
def register(...):
    # Hash password, validate, create user, log events... ❌
```

#### Backend: Dependency Injection
```python
# Use FastAPI dependencies
@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

# Ownership validation
document = verify_document_ownership(db, document_id, current_user.id)
```

#### Frontend: Custom Hooks for Data Fetching
```typescript
// Create custom hooks for reusable logic
const { summaries, loading, error, refresh } = useSummariesData();

// NOT direct API calls in components
useEffect(() => {
  api.summaries.getAll().then(...)  // ❌ DON'T
}, []);
```

#### Frontend: Context for Global State
```typescript
// Use context for auth and shared state
const { user, login, logout } = useAuth();

// NOT prop drilling or local storage directly in components
```

---

## Testing Guidelines

### Backend Testing (Pytest)

**Location**: `/backend/tests/`

**Structure**:
- `unit/`: Unit tests for isolated components
  - `test_core/`, `test_models/`, `test_repositories/`, `test_schemas/`
- `integration/`: Integration tests for API endpoints
  - `test_auth_integration.py`
  - `test_documents_summaries_integration.py`
  - `test_quizzes_integration.py`
  - `test_study_spaces_integration.py`
  - `test_complete_e2e_flow.py`
- `conftest.py`: Shared fixtures

**Key Fixtures**:
- `db`: In-memory SQLite database
- `client`: FastAPI test client
- `fake_user`, `fake_document`, `fake_summary`: Mock objects with real structure

**Running Tests**:
```bash
# All tests
pytest

# Specific test file
pytest tests/integration/test_auth_integration.py

# With coverage
pytest --cov=app --cov-report=html

# Specific test
pytest tests/unit/test_models/test_user.py::test_user_creation
```

**Test Naming**:
- Files: `test_*.py`
- Functions: `test_<what_it_tests>()`
- Fixtures: Descriptive names (`fake_user`, `authenticated_client`)

### Frontend Testing (Vitest)

**Location**: `/frontend/tests/`

**Structure**:
- `unit/`: Mirrors `src/` structure
- `test/setup.ts`: Global test setup

**Tools**:
- **Vitest**: Test runner
- **Testing Library**: Component testing
- **MSW**: API mocking
- **axios-mock-adapter**: HTTP mocking

**Coverage Thresholds**: 70% (lines, functions, branches, statements)

**Running Tests**:
```bash
# Run tests
pnpm test

# Run tests with UI
pnpm test:ui

# Run tests with coverage
pnpm test:coverage
```

### Testing Best Practices

1. **Test Isolation**: Each test should be independent
2. **Arrange-Act-Assert**: Structure tests clearly
3. **Meaningful Names**: Test names describe what is being tested
4. **Mock External Dependencies**: Mock OpenAI, file I/O, external APIs
5. **Test Edge Cases**: Empty inputs, invalid data, permission errors
6. **Use Fixtures**: Reuse common setup via fixtures

---

## Common Development Tasks

### Adding a New Feature

1. **Plan the layers** (if backend):
   - Model (if new entity)
   - Schema (request/response)
   - Repository (data access)
   - Service (business logic)
   - Router (HTTP endpoints)

2. **Create migration** (if database changes):
   ```bash
   cd backend
   alembic revision --autogenerate -m "Add feature X"
   alembic upgrade head
   ```

3. **Implement backend**:
   - Start with model/schema
   - Add repository methods
   - Implement service logic
   - Add router endpoints
   - Update `app/main.py` if new router

4. **Update frontend**:
   - Add TypeScript types in `/types/`
   - Create API methods in `/services/api/`
   - Build UI components
   - Add page if needed
   - Update routing in `main.tsx`

5. **Test**:
   - Write unit tests
   - Write integration tests
   - Manual testing in browser

### Modifying Existing Code

**When editing**:
1. Read the existing code first
2. Understand the layer you're working in
3. Follow established patterns
4. Update related tests
5. Update documentation if needed

**Backend**:
- Changing model → Create migration, update schema, update repository if needed
- Adding validation → Update Pydantic schema
- Adding business logic → Update service layer
- Changing API → Update router and OpenAPI docs

**Frontend**:
- Changing UI → Update component
- Changing API response → Update types, API methods, components
- Adding route → Update `main.tsx` routing

### Database Migrations

**Creating**:
```bash
cd backend

# Auto-generate from model changes
alembic revision --autogenerate -m "Description of changes"

# Manual migration
alembic revision -m "Custom migration"
```

**Reviewing**:
- Check generated SQL in `alembic/versions/*.py`
- Verify `upgrade()` and `downgrade()` functions
- Test migration on development database

**Applying**:
```bash
# Apply all pending
alembic upgrade head

# Apply one step
alembic upgrade +1

# Rollback one step
alembic downgrade -1

# Check current version
alembic current
```

**Important**:
- Always review auto-generated migrations
- Test rollback (`downgrade()`) function
- Use `studyforge_owner` role for migrations (via `.env.alembic`)
- Never edit applied migrations (create new one instead)

### Adding API Endpoints

1. **Define Pydantic schema** (`/app/schemas/`):
   ```python
   class FeatureCreate(BaseModel):
       field: str = Field(min_length=1, max_length=100)

   class FeatureResponse(BaseModel):
       model_config = ConfigDict(from_attributes=True)
       id: UUID
       field: str
   ```

2. **Add repository method** (`/app/repositories/`):
   ```python
   @staticmethod
   def create(db: Session, field: str) -> Feature:
       feature = Feature(field=field)
       db.add(feature)
       db.commit()
       db.refresh(feature)
       return feature
   ```

3. **Add service method** (`/app/services/`):
   ```python
   @staticmethod
   def create_feature(db: Session, field: str, user_id: UUID) -> Feature:
       # Business logic
       feature = FeatureRepository.create(db, field)
       log_audit_event(...)
       return feature
   ```

4. **Add router endpoint** (`/app/routers/`):
   ```python
   @router.post("/", response_model=FeatureResponse, status_code=201)
   def create(
       data: FeatureCreate,
       db: Session = Depends(get_db),
       current_user: User = Depends(get_current_user)
   ):
       feature = FeatureService.create_feature(db, data.field, current_user.id)
       return feature
   ```

5. **Include router** (`/app/main.py`):
   ```python
   app.include_router(features.router, prefix="/features", tags=["features"])
   ```

### Adding Frontend Components

1. **Create component file**:
   ```typescript
   // components/features/NewFeature.tsx
   import { useState } from 'react';

   interface NewFeatureProps {
     title: string;
     onAction: () => void;
   }

   export default function NewFeature({ title, onAction }: NewFeatureProps) {
     return <div>{title}</div>;
   }
   ```

2. **Add to index exports** (if in component library):
   ```typescript
   // components/index.ts
   export { default as NewFeature } from './features/NewFeature';
   ```

3. **Use in pages**:
   ```typescript
   import { NewFeature } from '@/components';

   export default function SomePage() {
     return <NewFeature title="Hello" onAction={() => {}} />;
   }
   ```

---

## File Structure Reference

### Backend Critical Files

| Path | Purpose |
|------|---------|
| `/backend/app/main.py` | FastAPI app, routers, middleware |
| `/backend/app/config.py` | Centralized configuration (Pydantic Settings) |
| `/backend/app/db.py` | Database setup, session management |
| `/backend/app/core/dependencies.py` | FastAPI dependencies (auth, ownership) |
| `/backend/app/core/security.py` | JWT, password hashing |
| `/backend/app/core/logging.py` | Logging configuration |
| `/backend/requirements.txt` | Python dependencies |
| `/backend/alembic.ini` | Alembic configuration |
| `/backend/alembic/env.py` | Migration environment |
| `/backend/setup_database.sql` | PostgreSQL initialization script |
| `/backend/pytest.ini` | Pytest configuration |

### Frontend Critical Files

| Path | Purpose |
|------|---------|
| `/frontend/src/main.tsx` | App entry point, routing |
| `/frontend/src/context/AuthContext.tsx` | Authentication state |
| `/frontend/src/services/api/client.ts` | Axios configuration, interceptors |
| `/frontend/package.json` | NPM dependencies, scripts |
| `/frontend/tsconfig.json` | TypeScript configuration |
| `/frontend/vite.config.ts` | Vite build configuration |
| `/frontend/vitest.config.ts` | Vitest test configuration |
| `/frontend/tailwind.config.cjs` | Tailwind CSS configuration |
| `/frontend/eslint.config.js` | ESLint configuration |

### Configuration Files

| Path | Purpose |
|------|---------|
| `/.editorconfig` | Editor configuration (indentation, line endings) |
| `/.gitignore` | Git ignore patterns |
| `/README.md` | Main project documentation (Spanish) |
| `/SETUP.md` | Setup instructions (Spanish) |

---

## Key Files to Know

### Backend Entry Point
**`/backend/app/main.py`**:
- FastAPI app initialization
- CORS configuration
- Rate limiting middleware
- Router registration
- Health check endpoint
- API version: 2.0.0

### Frontend Entry Point
**`/frontend/src/main.tsx`**:
- React Router configuration
- Public vs Protected routes
- Context providers (Auth, Storage)
- Route definitions

### Configuration
**`/backend/app/config.py`**:
- Pydantic Settings for environment variables
- Defaults: 5GB quota, 50MB max file size, 24h JWT expiration
- Rate limiting: 100 requests/60 seconds
- Quiz limits: 5-30 questions

### Authentication
**`/backend/app/core/security.py`**:
- JWT token creation/validation
- Argon2 password hashing (more secure than bcrypt)
- Token expiration: 24 hours

**`/backend/app/core/dependencies.py`**:
- `get_current_user()`: Extracts and validates JWT
- Ownership validators: `verify_document_ownership()`, `verify_summary_ownership()`, etc.

### API Client
**`/frontend/src/services/api/client.ts`**:
- Axios instance with base URL
- Request interceptor: Adds JWT to headers
- Response interceptor: Auto-redirect on 401
- Token storage: localStorage (`sf_token`) or sessionStorage

---

## Security Considerations

### Authentication & Authorization
- **JWT**: Stateless, 24-hour expiration
- **Password Hashing**: Argon2id (stronger than bcrypt)
- **Token Storage**: localStorage (remember me) or sessionStorage (session only)
- **Ownership Validation**: All protected endpoints verify resource ownership
- **Audit Logging**: All sensitive operations logged

### Input Validation
- **Backend**: Pydantic schemas for all requests
- **Frontend**: TypeScript types + form validation
- **File Uploads**: Magic number validation (not just extension check)
- **SQL Injection**: Protected via SQLAlchemy ORM (parameterized queries)

### Rate Limiting
- **Backend Middleware**: 100 requests per 60 seconds per IP
- **Algorithm**: Sliding window, in-memory storage
- **Exempt Paths**: `/health`, `/docs`, `/redoc`, `/openapi.json`

### File Upload Security
- **Max Size**: 50MB per file (configurable)
- **Storage Quota**: 5GB per user (configurable)
- **Allowed Formats**: PDF, DOCX, PPTX, TXT
- **Validation**: Magic number check (file signature)
- **Storage**: Files stored in database as binary

### Database Security
- **Roles**: Separate for migrations (`studyforge_owner`) vs runtime (`studyforge_app`)
- **Schema**: All tables in `studyforge` schema (not `public`)
- **Connections**: Different credentials for Alembic vs application
- **Search Path**: Explicitly set to `studyforge,public`

### CORS
- **Configuration**: Defined in `/backend/app/config.py`
- **Credentials**: Allowed
- **Methods**: All
- **Headers**: All

**⚠️ Production**: Restrict CORS origins to specific domains

### Secrets Management
- **Environment Variables**: Never commit `.env` files
- **Examples Provided**: `.env.example`, `.env.alembic.example`
- **Production**: Use secure secret management (AWS Secrets Manager, etc.)

**⚠️ Never**:
- Commit API keys, passwords, or secrets
- Log passwords or tokens
- Expose SECRET_KEY or OPENAI_API_KEY in errors

---

## Deployment Information

### Backend Deployment (Render)

**Service Type**: Web Service

**Configuration**:
- **Build Command**: `pip install -r requirements.txt && alembic upgrade head`
- **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Runtime**: Python 3.14

**Environment Variables**:
```env
DATABASE_URL=<PostgreSQL connection string>
SECRET_KEY=<random secret, min 32 characters>
OPENAI_API_KEY=<OpenAI API key>
ENV=production
DEBUG=False
LOG_LEVEL=INFO
```

**Database**:
- Provision PostgreSQL 18 instance
- Run `setup_database.sql` script (with production passwords)
- Set `DATABASE_URL` to use `studyforge_app` role

### Frontend Deployment (Render)

**Service Type**: Static Site

**Configuration**:
- **Build Command**: `pnpm install && pnpm build`
- **Publish Directory**: `dist`
- **Runtime**: Node.js 24

**Environment Variables**:
```env
VITE_API_BASE=<backend URL>
```

### Google Cloud Platform (GCP)

**Status**: Planned, documentation pending

**Resources**:
- Cloud Run (backend)
- Cloud Storage (static frontend)
- Cloud SQL (PostgreSQL 18)

### Pre-Deployment Checklist

- [ ] Change all default passwords in `setup_database.sql`
- [ ] Generate random `SECRET_KEY` (min 32 characters)
- [ ] Verify `CORS_ORIGINS` restricts to production domain
- [ ] Set `DEBUG=False` in backend
- [ ] Set `ENV=production` in backend
- [ ] Configure database backups
- [ ] Set up error monitoring (Sentry, etc.)
- [ ] Review rate limiting settings
- [ ] Test database migrations on staging
- [ ] Verify file upload limits

---

## Troubleshooting

### Common Backend Issues

#### "relation does not exist"
**Cause**: Database tables not created
**Solution**:
```bash
cd backend
alembic upgrade head
```

#### "password authentication failed"
**Cause**: Incorrect database credentials
**Solution**:
- Verify passwords in `.env` and `.env.alembic` match `setup_database.sql`
- Check `DATABASE_URL` and `ALEMBIC_URL` connection strings

#### "database studyforge does not exist"
**Cause**: Database not created
**Solution**:
```bash
psql -U postgres -f backend/setup_database.sql
```

#### "No module named 'app'"
**Cause**: Wrong directory or virtual environment not activated
**Solution**:
```bash
cd backend
source .venv/bin/activate  # or .\.venv\Scripts\Activate.ps1 on Windows
python -c "import app; print('OK')"
```

#### Migration Issues
**Cause**: Alembic can't import models
**Solution**:
- Check `alembic/env.py` imports all models correctly
- Verify `app/models/__init__.py` exports all models

#### JWT Token Errors
**Cause**: Invalid or expired token
**Solution**:
- Clear browser localStorage/sessionStorage
- Check `SECRET_KEY` is consistent
- Verify token hasn't expired (24h default)

### Common Frontend Issues

#### "Network Error" / CORS Issues
**Cause**: Backend not running or CORS misconfiguration
**Solution**:
- Verify backend is running at `http://localhost:8000`
- Check `VITE_API_BASE` environment variable
- Verify CORS configuration in backend

#### TypeScript Errors After API Changes
**Cause**: Types out of sync with backend
**Solution**:
- Update types in `/types/` to match backend schemas
- Update API methods in `/services/api/`

#### "Cannot find module '@/...'"
**Cause**: Path alias not configured
**Solution**:
- Verify `tsconfig.json` has `"@/*": ["./src/*"]`
- Verify `vite.config.ts` has `resolve.alias` configured

### Database Issues

#### Can't Connect to PostgreSQL
**Cause**: PostgreSQL service not running
**Solution**:
```bash
# Check status (Linux)
sudo systemctl status postgresql

# Start service (Linux)
sudo systemctl start postgresql

# Windows: Check Services app for "PostgreSQL" service
```

#### Permission Denied on Tables
**Cause**: Using wrong database role
**Solution**:
- Runtime queries: Use `studyforge_app` role (from `.env`)
- Migrations: Use `studyforge_owner` role (from `.env.alembic`)

### Development Workflow Issues

#### Changes Not Reflecting
**Backend**:
- Ensure `--reload` flag is used: `uvicorn app.main:app --reload`
- Check for syntax errors in terminal

**Frontend**:
- Vite should auto-reload on file changes
- Hard refresh browser (Ctrl+Shift+R)
- Clear browser cache

#### Tests Failing
**Backend**:
```bash
# Run with verbose output
pytest -v

# Run specific test
pytest tests/path/to/test.py::test_name -v
```

**Frontend**:
```bash
# Run with verbose output
pnpm test -- --reporter=verbose
```

---

## Best Practices for AI Assistants

### When Reading Code
1. **Start with architecture**: Understand layer boundaries
2. **Check imports**: Know what dependencies are used
3. **Read tests**: They document expected behavior
4. **Follow patterns**: Existing code shows conventions

### When Writing Code
1. **Match existing style**: Follow established patterns
2. **Respect layers**: Don't bypass architecture (e.g., no direct DB queries in routers)
3. **Add types**: Python type hints, TypeScript types
4. **Write tests**: Unit + integration tests for new features
5. **Update docs**: If changing APIs or adding features

### When Debugging
1. **Check logs**: Backend logs in `logs/studyforge.log`
2. **Use API docs**: `http://localhost:8000/docs` for testing endpoints
3. **Check browser console**: Frontend errors and network requests
4. **Verify database**: Use `psql` to inspect data
5. **Test in isolation**: Unit tests help isolate issues

### When Refactoring
1. **Read first**: Understand existing code thoroughly
2. **Small changes**: Incremental refactoring is safer
3. **Run tests**: After each change
4. **Update tests**: If behavior changes
5. **Document why**: Add comments explaining non-obvious changes

### Common Mistakes to Avoid
- ❌ Mixing business logic in routers (use services)
- ❌ Direct database queries in services (use repositories)
- ❌ Bypassing Pydantic validation
- ❌ Hardcoding configuration (use `settings` from `config.py`)
- ❌ Ignoring ownership validation (security risk)
- ❌ Committing secrets or `.env` files
- ❌ Creating migrations without reviewing them
- ❌ Skipping tests for new features

---

## Additional Resources

### Documentation
- **Main README**: `/README.md` (Spanish, project overview)
- **Setup Guide**: `/SETUP.md` (Spanish, step-by-step setup)
- **API Docs**: `http://localhost:8000/docs` (interactive Swagger UI)

### External Documentation
- **FastAPI**: https://fastapi.tiangolo.com/
- **SQLAlchemy 2.0**: https://docs.sqlalchemy.org/en/20/
- **Alembic**: https://alembic.sqlalchemy.org/
- **Pydantic**: https://docs.pydantic.dev/
- **React 19**: https://react.dev/
- **TypeScript**: https://www.typescriptlang.org/docs/
- **Vite**: https://vitejs.dev/
- **Tailwind CSS**: https://tailwindcss.com/docs

### Project-Specific Notes
- **Language**: Code is in English, documentation/comments in Spanish
- **Audience**: University project (limited contributors)
- **Status**: MVP complete, testing and deployment pending
- **Architecture**: Well-structured, production-ready foundation

---

## Changelog

### 2025-12-01 - Initial Version
- Created comprehensive CLAUDE.md
- Documented architecture, conventions, and workflows
- Added troubleshooting and best practices
- Covered backend and frontend thoroughly

---

**End of CLAUDE.md** - This guide should be updated as the project evolves. When making significant architectural changes, update this file accordingly.
