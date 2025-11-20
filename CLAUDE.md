# Guía para Asistentes de IA - StudyForge

Este documento proporciona una visión completa del proyecto StudyForge para asistentes de inteligencia artificial. Contiene toda la información necesaria para comprender la arquitectura, las convenciones de código y los flujos de trabajo de desarrollo.

## Tabla de Contenidos

1. [Visión General del Proyecto](#visión-general-del-proyecto)
2. [Estructura del Repositorio](#estructura-del-repositorio)
3. [Stack Tecnológico](#stack-tecnológico)
4. [Arquitectura del Backend](#arquitectura-del-backend)
5. [Arquitectura del Frontend](#arquitectura-del-frontend)
6. [Base de Datos](#base-de-datos)
7. [API Endpoints](#api-endpoints)
8. [Autenticación y Autorización](#autenticación-y-autorización)
9. [Convenciones de Código](#convenciones-de-código)
10. [Flujos de Trabajo](#flujos-de-trabajo)
11. [Comandos Útiles](#comandos-útiles)
12. [Decisiones Técnicas](#decisiones-técnicas)
13. [Guías de Desarrollo](#guías-de-desarrollo)

---

## Visión General del Proyecto

**StudyForge** es una plataforma de apoyo al aprendizaje potenciada por IA que permite a los usuarios:

- **Subir documentos** (PDF, PPTX, DOCX, TXT) para su análisis
- **Generar resúmenes** adaptativos según nivel de experiencia (básico, medio, avanzado)
- **Crear cuestionarios** personalizados con dificultad adaptativa (1-5)
- **Realizar evaluaciones** con feedback inmediato y explicaciones detalladas
- **Monitorear progreso** mediante estadísticas y análisis de desempeño

### Características Clave

- Sistema de cuotas por usuario (almacenamiento, tamaño de archivos)
- Integración con OpenAI GPT-4o-mini para generación de contenido
- Dificultad adaptativa basada en desempeño histórico
- Validación de ownership para todos los recursos
- Soporte multiidioma (español)

---

## Estructura del Repositorio

```
StudyForge/
├── backend/                           # API FastAPI (Python)
│   ├── alembic/                      # Migraciones de base de datos
│   │   ├── versions/                 # Scripts de migración
│   │   └── env.py                    # Configuración de Alembic
│   ├── app/                          # Código de la aplicación
│   │   ├── core/                     # Componentes centrales
│   │   │   ├── security.py          # JWT, hashing Argon2
│   │   │   └── dependencies.py      # Autenticación y ownership
│   │   ├── models/                   # Modelos SQLAlchemy (ORM)
│   │   │   ├── user.py
│   │   │   ├── document.py
│   │   │   ├── summary.py
│   │   │   ├── quiz.py
│   │   │   ├── question.py
│   │   │   ├── quiz_attempt.py
│   │   │   ├── answer.py
│   │   │   └── summary_document.py
│   │   ├── schemas/                  # Validación Pydantic
│   │   │   ├── user.py
│   │   │   ├── auth.py
│   │   │   ├── document.py
│   │   │   ├── summary.py
│   │   │   ├── quiz.py
│   │   │   └── quiz_attempt.py
│   │   ├── repositories/             # Capa de acceso a datos
│   │   │   ├── user_repository.py
│   │   │   ├── document_repository.py
│   │   │   ├── summary_repository.py
│   │   │   ├── quiz_repository.py
│   │   │   └── quiz_attempt_repository.py
│   │   ├── services/                 # Lógica de negocio
│   │   │   ├── auth_service.py
│   │   │   ├── file_processor.py
│   │   │   ├── openai_service.py
│   │   │   ├── summary_service.py
│   │   │   └── quiz_service.py
│   │   ├── routers/                  # Endpoints HTTP
│   │   │   ├── auth.py
│   │   │   ├── documents.py
│   │   │   ├── summaries.py
│   │   │   ├── quizzes.py
│   │   │   ├── quiz_attempts.py
│   │   │   └── stats.py
│   │   ├── config.py                 # Configuración con Pydantic
│   │   ├── db.py                     # Conexión a PostgreSQL
│   │   └── main.py                   # Punto de entrada FastAPI
│   ├── tests/                        # Tests pytest
│   ├── requirements.txt              # Dependencias Python
│   ├── setup_database.sql            # Script inicial de BD
│   ├── .env.example                  # Template de variables
│   ├── .env.alembic.example          # Template para migraciones
│   ├── alembic.ini                   # Configuración de Alembic
│   └── pytest.ini                    # Configuración de pytest
│
├── frontend/                          # Interfaz React
│   ├── src/
│   │   ├── components/               # Componentes reutilizables
│   │   │   ├── Navbar.tsx           # Barra de navegación
│   │   │   ├── ProtectedRoute.tsx   # Guard de autenticación
│   │   │   └── QuotaWidget.tsx      # Widget de cuotas
│   │   ├── context/                  # Context API
│   │   │   └── AuthContext.tsx      # Estado de autenticación
│   │   ├── pages/                    # Páginas de la app
│   │   │   ├── login.tsx            # Login
│   │   │   ├── signup.tsx           # Registro
│   │   │   ├── documents.tsx        # Gestión de documentos
│   │   │   ├── summaries.tsx        # Lista de resúmenes
│   │   │   ├── SummaryDetail.tsx    # Detalle de resumen
│   │   │   ├── Quizzes.tsx          # Lista de quizzes
│   │   │   ├── QuizAttempt.tsx      # Tomar quiz
│   │   │   ├── QuizResults.tsx      # Resultados de quiz
│   │   │   └── Stats.tsx            # Dashboard estadísticas
│   │   ├── services/                 # Servicios de API
│   │   │   └── api.ts               # Cliente Axios
│   │   ├── types/                    # TypeScript types
│   │   │   └── api.types.ts         # Tipos de API
│   │   └── main.tsx                 # Entry point
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.cjs
│
├── docs/                              # Documentación
│   ├── ARCHITECTURE.md               # Arquitectura detallada
│   ├── SECURITY.md                   # Seguridad
│   ├── DECISIONS.md                  # Decisiones técnicas
│   ├── ROADMAP.md                    # Plan de desarrollo
│   ├── SUMMARY.md                    # Resumen del proyecto
│   ├── NEXT_STEPS.md                 # Próximos pasos
│   └── IMPLEMENTATION.md             # Guía de implementación
│
├── .claude/                           # Configuración de Claude
│   └── settings.local.json           # Permisos y configuración
│
├── README.md                          # Documentación principal
├── SETUP.md                           # Guía de instalación
└── CLAUDE.md                          # Este archivo
```

---

## Stack Tecnológico

### Backend

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **Python** | 3.14 | Lenguaje principal |
| **FastAPI** | 0.115.12 | Framework web asíncrono |
| **PostgreSQL** | 18 | Base de datos relacional |
| **SQLAlchemy** | 2.0.36 | ORM para mapeo objeto-relacional |
| **Alembic** | 1.17.2 | Migraciones de base de datos |
| **Pydantic** | 2.12.1 | Validación de datos |
| **python-jose** | 3.3.0 | Manejo de JWT |
| **argon2-cffi** | 23.1.0 | Hashing de contraseñas |
| **OpenAI** | 1.59.9 | Integración con GPT-4o-mini |
| **PyPDF2** | 3.0.1 | Lectura de PDFs |
| **pdfplumber** | 0.11.4 | Extracción de texto de PDFs |
| **python-pptx** | 1.0.2 | Lectura de PPTX |
| **python-docx** | 1.1.2 | Lectura de DOCX |
| **pytest** | 8.3.4 | Framework de testing |
| **psycopg** | 3.2.3 | Driver PostgreSQL |

### Frontend

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **Node.js** | 24+ | Entorno de ejecución |
| **React** | 19.1.1 | Framework UI |
| **TypeScript** | 5.8 | Lenguaje tipado |
| **Vite** | 6.0.3 | Bundler y dev server |
| **Tailwind CSS** | 3.4.13 | Framework de estilos |
| **Axios** | 1.12.2 | Cliente HTTP |
| **React Router DOM** | 7.9.2 | Enrutamiento SPA |
| **pnpm** | 10+ | Gestor de paquetes |

### Infraestructura

- **Hosting**: Render / Google Cloud Platform
- **Control de versiones**: Git + GitHub
- **CI/CD**: GitHub Actions (pendiente)

---

## Arquitectura del Backend

El backend sigue una **arquitectura en capas (4-tier)** que separa responsabilidades:

```
┌─────────────────────────────────────────────────┐
│              Routers (HTTP Layer)               │
│  Endpoints, validación de entrada, respuestas   │
└────────────────┬────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────┐
│         Services (Business Logic Layer)         │
│  Orquestación, validaciones de negocio, IA      │
└────────────────┬────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────┐
│       Repositories (Data Access Layer)          │
│         Operaciones CRUD, queries SQL           │
└────────────────┬────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────┐
│          Models (ORM/Database Layer)            │
│     Definición de tablas y relaciones           │
└─────────────────────────────────────────────────┘
```

### Flujo de una Petición Típica

```python
# 1. Router recibe petición HTTP
@router.post("/summaries/upload")
async def upload_summary(
    file: UploadFile,
    expertise_level: str,
    current_user: User = Depends(get_current_user),  # Autenticación
    db: Session = Depends(get_db)
):
    # 2. Validación básica de entrada
    if expertise_level not in ["basico", "medio", "avanzado"]:
        raise HTTPException(400, "Nivel inválido")

    # 3. Delegar a Service
    summary = SummaryService.create_summary(
        db, current_user.id, file, expertise_level
    )

    # 4. Retornar respuesta
    return summary


# En app/services/summary_service.py
class SummaryService:
    @staticmethod
    def create_summary(db, user_id, file, level):
        # 1. Procesar archivo
        filename, text = FileProcessor.validate_and_extract(file)

        # 2. Generar resumen con IA
        summary_data = OpenAIService.generate_summary(text, level)

        # 3. Guardar en BD via Repository
        summary = SummaryRepository.create(db, user_id, summary_data)

        return summary


# En app/repositories/summary_repository.py
class SummaryRepository:
    @staticmethod
    def create(db, user_id, data):
        summary = Summary(
            user_id=user_id,
            title=data["title"],
            content=data,
            expertise_level=data["expertise_level"]
        )
        db.add(summary)
        db.commit()
        db.refresh(summary)
        return summary
```

### Módulos Clave

#### app/core/security.py

Maneja autenticación y seguridad:

```python
from argon2 import PasswordHasher
from jose import JWTError, jwt
from datetime import datetime, timedelta

# Hash de contraseñas con Argon2
ph = PasswordHasher()
def hash_password(password: str) -> str:
    return ph.hash(password)

def verify_password(hashed_password: str, plain_password: str) -> bool:
    try:
        ph.verify(hashed_password, plain_password)
        return True
    except:
        return False

# JWT tokens
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=1440))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def decode_access_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None
```

#### app/core/dependencies.py

Inyección de dependencias para autenticación y autorización:

```python
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthCredentials
from sqlalchemy.orm import Session

security = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Obtiene el usuario autenticado desde el token JWT"""
    token = credentials.credentials
    payload = decode_access_token(token)

    if payload is None:
        raise HTTPException(401, "Token inválido")

    user_id = payload.get("sub")
    user = UserRepository.get_by_id(db, user_id)

    if user is None or not user.is_active:
        raise HTTPException(401, "Usuario no encontrado")

    return user

def verify_document_ownership(document: Document | None, user: User) -> Document:
    """Verifica que el documento pertenezca al usuario"""
    if document is None:
        raise HTTPException(404, "Documento no encontrado")
    if document.user_id != user.id:
        raise HTTPException(403, "No tienes permiso para acceder a este documento")
    return document

# Similar: verify_summary_ownership, verify_quiz_ownership, verify_attempt_ownership
```

#### app/services/openai_service.py

Integración con OpenAI para generación de contenido:

```python
from openai import OpenAI
import json

class OpenAIService:
    def __init__(self):
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = settings.OPENAI_MODEL  # "gpt-4o-mini"

    def generate_summary(self, text: str, expertise_level: str) -> dict:
        """Genera un resumen adaptado al nivel de experiencia"""
        system_prompts = {
            "basico": "Genera un resumen simple y claro para principiantes...",
            "medio": "Genera un resumen técnico moderado...",
            "avanzado": "Genera un resumen técnico avanzado..."
        }

        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system_prompts[expertise_level]},
                {"role": "user", "content": f"Resumir: {text[:8000]}"}
            ],
            temperature=0.7,
            response_format={"type": "json_object"}
        )

        return json.loads(response.choices[0].message.content)

    def generate_quiz(self, text: str, difficulty: int, num_questions: int, topic: str) -> dict:
        """Genera cuestionario con dificultad adaptativa"""
        prompt = f"""Genera {num_questions} preguntas de opción múltiple
        sobre el tema '{topic}' con dificultad {difficulty}/5.
        Formato JSON: {{"questions": [...]}}"""

        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": "Eres un generador de cuestionarios..."},
                {"role": "user", "content": f"{prompt}\n\nTexto:\n{text[:8000]}"}
            ],
            temperature=0.8,
            response_format={"type": "json_object"}
        )

        return json.loads(response.choices[0].message.content)
```

#### app/services/quiz_service.py

Lógica de dificultad adaptativa:

```python
class QuizService:
    @staticmethod
    def calculate_adaptive_difficulty(db: Session, user_id: UUID, topic: str) -> int:
        """Calcula dificultad basada en últimos 5 intentos del usuario"""
        recent_attempts = QuizAttemptRepository.get_recent_attempts_by_topic(
            db, user_id, topic, limit=5
        )

        if not recent_attempts:
            return 2  # Nivel medio por defecto

        scores = [a.score for a in recent_attempts if a.score is not None]
        if not scores:
            return 2

        avg_score = sum(scores) / len(scores)

        # Mapeo de promedio a dificultad (1-5)
        if avg_score >= 90:
            return 5    # Excelente → muy difícil
        elif avg_score >= 75:
            return 4    # Bueno → difícil
        elif avg_score >= 60:
            return 3    # Aceptable → medio
        elif avg_score >= 40:
            return 2    # Regular → fácil
        else:
            return 1    # Bajo → muy fácil
```

---

## Arquitectura del Frontend

El frontend es una **Single Page Application (SPA)** construida con React 19:

```
┌─────────────────────────────────────────────────┐
│                   Pages                         │
│         (Componentes de vista completa)         │
│  login, signup, documents, summaries,           │
│  SummaryDetail, Quizzes, QuizAttempt,          │
│  QuizResults, Stats                             │
└────────────────┬────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────┐
│               Components                        │
│          (Componentes reutilizables)            │
│  Navbar, ProtectedRoute, QuotaWidget            │
└────────────────┬────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────┐
│             Context API                         │
│      AuthContext (estado global de auth)        │
└────────────────┬────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────┐
│               Services                          │
│         (Cliente API con Axios)                 │
│  Interceptores JWT, tipos TypeScript            │
└─────────────────────────────────────────────────┘
```

### Páginas Implementadas (MVP Completo)

1. **Autenticación**:
   - `/login` - Login con validación de formulario
   - `/signup` - Registro de nuevos usuarios

2. **Documentos** (`/documents`):
   - Upload con drag-and-drop
   - Validación de cuotas (tamaño, almacenamiento)
   - Lista de documentos con cards
   - Edición de título y eliminación

3. **Resúmenes**:
   - `/summaries` - Lista con topics y conceptos clave
   - Modal para crear desde documentos existentes
   - `/summaries/:id` - Vista detallada con documentos fuente
   - Generación de quiz desde resumen

4. **Quizzes**:
   - `/quizzes` - Lista con badges de dificultad (1-5)
   - `/quizzes/:id/attempt` - Tomar quiz con feedback inmediato
   - `/quiz-attempts/:id/results` - Resultados con score y revisión

5. **Estadísticas** (`/stats`):
   - Cards de resumen (totales, promedios, mejor score)
   - Progreso por tema con barras animadas
   - Historial de intentos recientes

### Características del Frontend

- **Diseño**: Aurora gradient background en todas las páginas
- **Navbar**: Glass morphism con links y QuotaWidget
- **Routing**: React Router v7 con ProtectedRoute
- **Estado**: AuthContext para autenticación global
- **API**: Axios con interceptores JWT automáticos
- **Validación**: Feedback inmediato en formularios
- **Responsive**: Tailwind CSS con mobile-first

### Estructura de Servicios

```typescript
// src/services/api.ts
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Interceptor para agregar token JWT
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
```

---

## Base de Datos

### Schema PostgreSQL

- **Nombre de la BD**: `studyforge`
- **Schema**: `studyforge` (no `public`)
- **Encoding**: UTF-8 con CRLF
- **Primary Keys**: UUID v4 en todas las tablas

### Roles y Permisos

```sql
-- Rol para migraciones (DDL)
CREATE ROLE studyforge_owner WITH LOGIN PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON SCHEMA studyforge TO studyforge_owner;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA studyforge TO studyforge_owner;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA studyforge TO studyforge_owner;
ALTER DEFAULT PRIVILEGES IN SCHEMA studyforge GRANT ALL ON TABLES TO studyforge_owner;
ALTER DEFAULT PRIVILEGES IN SCHEMA studyforge GRANT ALL ON SEQUENCES TO studyforge_owner;

-- Rol para la aplicación (DML)
CREATE ROLE studyforge_app WITH LOGIN PASSWORD 'app_password';
GRANT USAGE ON SCHEMA studyforge TO studyforge_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA studyforge TO studyforge_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA studyforge TO studyforge_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA studyforge GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO studyforge_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA studyforge GRANT USAGE, SELECT ON SEQUENCES TO studyforge_app;
```

### Modelos de Datos

#### User (users)

```python
class User(Base):
    __tablename__ = "users"
    __table_args__ = {"schema": "studyforge"}

    id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    username: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Cuotas de usuario
    storage_quota_bytes: Mapped[int] = mapped_column(BigInteger, default=5368709120)  # 5 GB
    storage_used_bytes: Mapped[int] = mapped_column(BigInteger, default=0)
    max_documents_per_summary: Mapped[int] = mapped_column(Integer, default=2)
    max_file_size_bytes: Mapped[int] = mapped_column(BigInteger, default=52428800)  # 50 MB

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relaciones
    documents: Mapped[List["Document"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    summaries: Mapped[List["Summary"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    quizzes: Mapped[List["Quiz"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    quiz_attempts: Mapped[List["QuizAttempt"]] = relationship(back_populates="user", cascade="all, delete-orphan")

    # Propiedades calculadas
    @property
    def storage_available_bytes(self) -> int:
        return self.storage_quota_bytes - self.storage_used_bytes

    @property
    def storage_usage_percentage(self) -> float:
        if self.storage_quota_bytes == 0:
            return 0.0
        return (self.storage_used_bytes / self.storage_quota_bytes) * 100
```

#### Document (documents)

```python
class Document(Base):
    __tablename__ = "documents"
    __table_args__ = {"schema": "studyforge"}

    id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("studyforge.users.id"), nullable=False, index=True)

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_type: Mapped[str] = mapped_column(String(10), nullable=False)  # pdf, pptx, docx, txt
    file_size_bytes: Mapped[int] = mapped_column(Integer, nullable=False)
    file_content: Mapped[bytes] = mapped_column(LargeBinary, nullable=False)
    extracted_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relaciones
    user: Mapped["User"] = relationship(back_populates="documents")
    summaries: Mapped[List["Summary"]] = relationship(
        secondary="studyforge.summary_documents",
        back_populates="documents"
    )
```

#### Summary (summaries)

```python
class ExpertiseLevel(str, Enum):
    BASICO = "basico"
    MEDIO = "medio"
    AVANZADO = "avanzado"

class Summary(Base):
    __tablename__ = "summaries"
    __table_args__ = {"schema": "studyforge"}

    id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("studyforge.users.id"), nullable=False, index=True)

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    content: Mapped[dict] = mapped_column(JSONB, nullable=False)  # Resumen completo de OpenAI
    expertise_level: Mapped[ExpertiseLevel] = mapped_column(Enum(ExpertiseLevel), nullable=False)
    topics: Mapped[list] = mapped_column(JSONB, default=list)
    key_concepts: Mapped[list] = mapped_column(JSONB, default=list)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relaciones
    user: Mapped["User"] = relationship(back_populates="summaries")
    documents: Mapped[List["Document"]] = relationship(
        secondary="studyforge.summary_documents",
        back_populates="summaries"
    )
    quizzes: Mapped[List["Quiz"]] = relationship(back_populates="summary", cascade="all, delete-orphan")
```

#### Quiz (quizzes)

```python
class Quiz(Base):
    __tablename__ = "quizzes"
    __table_args__ = {"schema": "studyforge"}

    id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("studyforge.users.id"), nullable=False, index=True)
    summary_id: Mapped[Optional[UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("studyforge.summaries.id"), nullable=True)

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    topic: Mapped[str] = mapped_column(String(255), nullable=False, default="general")
    difficulty_level: Mapped[int] = mapped_column(Integer, nullable=False)  # 1-5
    max_questions: Mapped[int] = mapped_column(Integer, default=10)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relaciones
    user: Mapped["User"] = relationship(back_populates="quizzes")
    summary: Mapped[Optional["Summary"]] = relationship(back_populates="quizzes")
    questions: Mapped[List["Question"]] = relationship(back_populates="quiz", cascade="all, delete-orphan")
    attempts: Mapped[List["QuizAttempt"]] = relationship(back_populates="quiz", cascade="all, delete-orphan")
```

#### Question (questions)

```python
class CorrectOption(str, Enum):
    A = "A"
    B = "B"
    C = "C"
    D = "D"

class Question(Base):
    __tablename__ = "questions"
    __table_args__ = {"schema": "studyforge"}

    id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    quiz_id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("studyforge.quizzes.id"), nullable=False)

    question_text: Mapped[str] = mapped_column(Text, nullable=False)
    option_a: Mapped[str] = mapped_column(String(500), nullable=False)
    option_b: Mapped[str] = mapped_column(String(500), nullable=False)
    option_c: Mapped[str] = mapped_column(String(500), nullable=False)
    option_d: Mapped[str] = mapped_column(String(500), nullable=False)
    correct_option: Mapped[CorrectOption] = mapped_column(Enum(CorrectOption), nullable=False)
    explanation: Mapped[str] = mapped_column(Text, nullable=False)
    order: Mapped[int] = mapped_column(Integer, nullable=False)

    # Relaciones
    quiz: Mapped["Quiz"] = relationship(back_populates="questions")
    answers: Mapped[List["Answer"]] = relationship(back_populates="question", cascade="all, delete-orphan")
```

#### QuizAttempt (quiz_attempts)

```python
class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"
    __table_args__ = {"schema": "studyforge"}

    id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    quiz_id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("studyforge.quizzes.id"), nullable=False)
    user_id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("studyforge.users.id"), nullable=False, index=True)

    started_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Relaciones
    quiz: Mapped["Quiz"] = relationship(back_populates="attempts")
    user: Mapped["User"] = relationship(back_populates="quiz_attempts")
    answers: Mapped[List["Answer"]] = relationship(back_populates="attempt", cascade="all, delete-orphan")
```

#### Answer (answers)

```python
class Answer(Base):
    __tablename__ = "answers"
    __table_args__ = {"schema": "studyforge"}

    id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    attempt_id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("studyforge.quiz_attempts.id"), nullable=False)
    question_id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("studyforge.questions.id"), nullable=False)

    selected_option: Mapped[CorrectOption] = mapped_column(Enum(CorrectOption), nullable=False)
    is_correct: Mapped[bool] = mapped_column(Boolean, nullable=False)
    answered_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relaciones
    attempt: Mapped["QuizAttempt"] = relationship(back_populates="answers")
    question: Mapped["Question"] = relationship(back_populates="answers")
```

### Relación Many-to-Many: Summary ↔ Document

```python
summary_documents = Table(
    "summary_documents",
    Base.metadata,
    Column("summary_id", UUID(as_uuid=True), ForeignKey("studyforge.summaries.id"), primary_key=True),
    Column("document_id", UUID(as_uuid=True), ForeignKey("studyforge.documents.id"), primary_key=True),
    schema="studyforge"
)
```

---

## API Endpoints

### Autenticación (`/auth`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/auth/register` | Registrar nuevo usuario | No |
| POST | `/auth/login` | Iniciar sesión (devuelve JWT) | No |
| GET | `/auth/me` | Obtener usuario autenticado | Sí |

**Ejemplo de registro:**
```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "username": "usuario",
    "password": "securepassword123"
  }'
```

**Respuesta:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "username": "usuario",
  "is_active": true,
  "created_at": "2025-11-19T12:00:00"
}
```

**Ejemplo de login:**
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword123"
  }'
```

**Respuesta:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

### Documentos (`/documents`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/documents` | Subir documento | Sí |
| GET | `/documents` | Listar documentos del usuario | Sí |
| GET | `/documents/{document_id}` | Obtener documento | Sí |
| PATCH | `/documents/{document_id}` | Actualizar título | Sí |
| DELETE | `/documents/{document_id}` | Eliminar documento | Sí |
| GET | `/documents/storage` | Info de almacenamiento | Sí |

**Ejemplo de subida:**
```bash
curl -X POST http://localhost:8000/documents \
  -H "Authorization: Bearer <token>" \
  -F "file=@documento.pdf" \
  -F "title=Mi Documento"
```

### Resúmenes (`/summaries`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/summaries/upload` | Generar resumen desde archivo | Sí |
| GET | `/summaries` | Listar resúmenes | Sí |
| GET | `/summaries/{summary_id}` | Obtener resumen | Sí |
| DELETE | `/summaries/{summary_id}` | Eliminar resumen | Sí |

**Ejemplo de generación de resumen:**
```bash
curl -X POST http://localhost:8000/summaries/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@texto.pdf" \
  -F "expertise_level=medio"
```

**Respuesta:**
```json
{
  "id": "uuid",
  "title": "Resumen de texto.pdf",
  "content": {
    "summary": "Este documento trata sobre...",
    "full_data": {...}
  },
  "expertise_level": "medio",
  "topics": ["tema1", "tema2"],
  "key_concepts": ["concepto1", "concepto2"],
  "created_at": "2025-11-19T12:00:00"
}
```

### Cuestionarios (`/quizzes`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/quizzes/generate-from-file` | Generar quiz desde archivo | Sí |
| POST | `/quizzes/generate-from-summary/{summary_id}` | Generar quiz desde resumen | Sí |
| GET | `/quizzes` | Listar quizzes | Sí |
| GET | `/quizzes/{quiz_id}` | Obtener quiz | Sí |

**Ejemplo de generación:**
```bash
curl -X POST http://localhost:8000/quizzes/generate-from-file \
  -H "Authorization: Bearer <token>" \
  -F "file=@contenido.pdf" \
  -F "topic=Historia de España" \
  -F "max_questions=10"
```

### Intentos de Quiz (`/quiz-attempts`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/quiz-attempts` | Crear intento | Sí |
| POST | `/quiz-attempts/{attempt_id}/answer` | Responder pregunta | Sí |
| POST | `/quiz-attempts/{attempt_id}/complete` | Completar quiz | Sí |
| GET | `/quiz-attempts/{attempt_id}/results` | Ver resultados | Sí |

**Flujo de uso:**
```bash
# 1. Crear intento
curl -X POST http://localhost:8000/quiz-attempts \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"quiz_id": "uuid"}'

# 2. Responder preguntas
curl -X POST http://localhost:8000/quiz-attempts/<attempt_id>/answer \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "question_id": "uuid",
    "selected_option": "A"
  }'

# Respuesta inmediata:
{
  "is_correct": true,
  "correct_option": "A",
  "explanation": "La opción A es correcta porque...",
  "score_so_far": 100.0
}

# 3. Completar quiz
curl -X POST http://localhost:8000/quiz-attempts/<attempt_id>/complete \
  -H "Authorization: Bearer <token>"

# 4. Ver resultados
curl -X GET http://localhost:8000/quiz-attempts/<attempt_id>/results \
  -H "Authorization: Bearer <token>"
```

### Estadísticas (`/stats`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/stats/progress` | Progreso por tema | Sí |
| GET | `/stats/performance` | Historial de desempeño | Sí |

---

## Autenticación y Autorización

### Sistema de Autenticación

**Tecnología**: JWT (JSON Web Tokens) con Argon2id para hashing de contraseñas

**Flujo completo:**

1. **Registro**:
   - Usuario envía email, username, password
   - Backend valida unicidad de email/username
   - Password hasheado con Argon2id
   - Usuario creado en BD

2. **Login**:
   - Usuario envía email + password
   - Backend verifica con Argon2
   - Si válido, genera JWT con claims: `{"sub": user_id, "exp": timestamp}`
   - Token devuelto al cliente

3. **Autenticación en requests**:
   - Cliente envía: `Authorization: Bearer <token>`
   - Backend valida token con `get_current_user()`
   - Extrae `user_id` y carga usuario desde BD

### Sistema de Autorización

**Principio**: Ownership-based authorization

Cada recurso pertenece a un usuario. Las funciones de verificación garantizan que solo el propietario pueda acceder:

```python
# En app/core/dependencies.py

def verify_document_ownership(document: Document | None, user: User) -> Document:
    """Valida que el documento pertenezca al usuario"""
    if document is None:
        raise HTTPException(status_code=404, detail="Documento no encontrado")
    if document.user_id != user.id:
        raise HTTPException(status_code=403, detail="No autorizado para acceder a este documento")
    return document

# Uso en routers
@router.delete("/documents/{document_id}")
def delete_document(
    document_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    document = DocumentRepository.get_by_id(db, document_id)
    document = verify_document_ownership(document, current_user)  # ✅ Validación
    DocumentRepository.delete(db, document_id)
    return {"message": "Documento eliminado"}
```

### Cuotas de Usuario

Cada usuario tiene límites configurables:

```python
storage_quota_bytes: int = 5368709120       # 5 GB
storage_used_bytes: int = 0                 # Usado actualmente
max_file_size_bytes: int = 52428800         # 50 MB por archivo
max_documents_per_summary: int = 2          # Máx docs por resumen
```

**Validación en subida de archivos:**

```python
# En app/routers/documents.py
@router.post("/documents")
async def upload_document(...):
    file_size_bytes = len(await file.read())
    await file.seek(0)

    # Validar tamaño de archivo
    if file_size_bytes > current_user.max_file_size_bytes:
        raise HTTPException(413, "Archivo excede tamaño máximo permitido")

    # Validar espacio disponible
    if current_user.storage_available_bytes < file_size_bytes:
        raise HTTPException(507, "Espacio de almacenamiento insuficiente")

    # Guardar archivo...

    # Actualizar cuota
    current_user.storage_used_bytes += file_size_bytes
    db.commit()
```

---

## Convenciones de Código

### Python (Backend)

#### Naming Conventions

```python
# Variables y funciones: snake_case
user_id = "123"
def calculate_score():
    pass

# Clases: PascalCase
class UserRepository:
    pass

# Constantes: UPPER_CASE
MAX_FILE_SIZE = 52428800
DATABASE_URL = "postgresql://..."

# Métodos privados: prefijo _
def _internal_method():
    pass
```

#### Type Hints

**Obligatorio en todas las funciones:**

```python
from typing import Optional, List, Dict
from uuid import UUID

def get_user(db: Session, user_id: UUID) -> Optional[User]:
    return db.query(User).filter(User.id == user_id).first()

def get_users(db: Session, skip: int = 0, limit: int = 100) -> List[User]:
    return db.query(User).offset(skip).limit(limit).all()

def process_data(data: Dict[str, any]) -> Dict[str, any]:
    # ...
    return result
```

#### Docstrings

**Google style:**

```python
def create_summary(db: Session, user_id: UUID, file: UploadFile, level: str) -> Summary:
    """Genera un resumen a partir de un archivo.

    Procesa el archivo, extrae el texto, genera un resumen con OpenAI
    según el nivel de experiencia y lo guarda en la base de datos.

    Args:
        db: Sesión de base de datos SQLAlchemy
        user_id: UUID del usuario propietario
        file: Archivo subido por el usuario
        level: Nivel de experiencia ("basico", "medio", "avanzado")

    Returns:
        Summary: El resumen generado y guardado

    Raises:
        HTTPException: Si el archivo es inválido o falla OpenAI
    """
    # Implementación...
```

#### Imports

**Orden estándar:**

```python
# 1. Biblioteca estándar
from datetime import datetime
from typing import Optional
from uuid import UUID, uuid4

# 2. Librerías de terceros
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

# 3. Imports locales
from app.core.dependencies import get_current_user
from app.models.user import User
from app.repositories.user_repository import UserRepository
```

#### Formato de Código

```python
# Máximo 88 caracteres por línea (Black formatter)
# 2 líneas en blanco entre clases
# 1 línea en blanco entre métodos

class UserService:
    """Servicio para operaciones de usuario"""

    @staticmethod
    def create_user(db: Session, email: str, username: str, password: str) -> User:
        """Crea un nuevo usuario"""
        # ...
        pass

    @staticmethod
    def update_user(db: Session, user_id: UUID, **kwargs) -> User:
        """Actualiza un usuario"""
        # ...
        pass


class DocumentService:
    """Servicio para operaciones de documento"""
    # ...
```

### TypeScript (Frontend)

#### Naming Conventions

```typescript
// Variables y funciones: camelCase
const userId = "123";
function calculateScore() {}

// Interfaces y tipos: PascalCase
interface UserResponse {
    id: string;
    email: string;
}

// Componentes React: PascalCase
const LoginPage: React.FC = () => {
    return <div>Login</div>;
};

// Constantes: UPPER_CASE o camelCase
const API_URL = "http://localhost:8000";
const maxFileSize = 50 * 1024 * 1024;
```

#### Type Annotations

**Siempre especificar tipos:**

```typescript
// Funciones
function getUser(userId: string): Promise<UserResponse> {
    return api.get(`/users/${userId}`);
}

// Variables
const users: UserResponse[] = [];
const isLoading: boolean = false;

// Props de componentes
interface LoginPageProps {
    onSuccess: (token: string) => void;
    redirectTo?: string;
}

const LoginPage: React.FC<LoginPageProps> = ({ onSuccess, redirectTo }) => {
    // ...
};
```

### Encoding

**Todos los archivos deben usar UTF-8 con CRLF (Windows)**

Para verificar y corregir:

```bash
# Backend
python verify_encoding.py

# Frontend (automático con EditorConfig)
```

### Mensajes de Error

**Siempre en español para el usuario:**

```python
# ✅ Correcto
raise HTTPException(404, detail="Usuario no encontrado")
raise HTTPException(403, detail="No tienes permiso para acceder a este recurso")

# ❌ Incorrecto
raise HTTPException(404, detail="User not found")
```

---

## Flujos de Trabajo

### Git Workflow

**Ramas principales:**
- `main` - Producción estable
- `remake` - Desarrollo activo (rama actual)

**Crear una nueva feature:**

```bash
# 1. Partir desde remake
git checkout remake
git pull origin remake

# 2. Crear rama de feature
git checkout -b feature/nombre-descriptivo

# 3. Hacer cambios y commits
git add .
git commit -m "feat: descripción del cambio"

# 4. Push a GitHub
git push origin feature/nombre-descriptivo

# 5. Crear Pull Request en GitHub hacia 'remake'
```

**Convenciones de commits:**

```bash
feat: nueva funcionalidad
fix: corrección de bug
docs: actualización de documentación
refactor: refactorización sin cambio de funcionalidad
test: agregar o modificar tests
chore: tareas de mantenimiento
```

### Migraciones de Base de Datos

**Herramienta**: Alembic

**Flujo completo:**

```bash
# 1. Modificar modelos
# Editar app/models/user.py, por ejemplo

# 2. Generar migración automática
cd backend
alembic revision --autogenerate -m "Add new field to users"

# 3. Revisar migración generada
# Verificar en alembic/versions/xxxxx_add_new_field.py

# 4. Aplicar migración
alembic upgrade head

# 5. Verificar estado
alembic current
alembic history
```

**Comandos útiles:**

```bash
# Ver estado actual
alembic current --verbose

# Ver historial
alembic history

# Revertir última migración
alembic downgrade -1

# Revertir a versión específica
alembic downgrade <revision_id>

# Aplicar migración específica
alembic upgrade <revision_id>
```

**Configuración:**

- `.env.alembic` → URL con rol `studyforge_owner` (permisos DDL)
- `alembic.ini` → Configuración general
- `alembic/env.py` → Configurado para schema "studyforge"

### Testing

**Framework**: pytest

**Ejecutar tests:**

```bash
cd backend

# Todos los tests
pytest

# Con output detallado
pytest -v

# Con coverage
pytest --cov=app

# Test específico
pytest tests/test_auth.py

# Test específica función
pytest tests/test_auth.py::test_register

# Con markers (si se usan)
pytest -m "unit"
pytest -m "integration"
```

**Estructura de tests:**

```
backend/tests/
├── __init__.py
├── conftest.py              # Fixtures compartidos
├── test_auth.py             # Tests de autenticación
├── test_documents.py        # Tests de documentos
├── test_summaries.py        # Tests de resúmenes
├── test_quizzes.py          # Tests de quizzes
└── test_quiz_attempts.py    # Tests de intentos
```

**Ejemplo de fixture:**

```python
# tests/conftest.py
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db import Base
from app.main import app

@pytest.fixture(scope="function")
def db_session():
    """Crea una sesión de BD temporal para tests"""
    engine = create_engine("postgresql://test_user:pass@localhost/test_db")
    Base.metadata.create_all(engine)

    SessionLocal = sessionmaker(bind=engine)
    session = SessionLocal()

    yield session

    session.close()
    Base.metadata.drop_all(engine)

@pytest.fixture
def client(db_session):
    """Cliente de prueba FastAPI"""
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as c:
        yield c
```

### Desarrollo Local

#### Backend

**IMPORTANTE**: El entorno virtual de Python está en la **raíz del proyecto** (`.venv`), no dentro de `backend/`.

```bash
# 1. Configurar entorno virtual (desde la raíz del proyecto)
python -m venv .venv

# 2. Activar entorno virtual (Windows)
.venv\Scripts\activate

# 3. Instalar dependencias del backend
pip install -r backend/requirements.txt

# 4. Configurar variables de entorno
cd backend
cp .env.example .env
# Editar .env con valores reales

# 5. Configurar base de datos
psql -U postgres -f setup_database.sql

# 6. Aplicar migraciones
alembic upgrade head

# 7. Ejecutar servidor (desde backend/)
uvicorn app.main:app --reload

# Servidor corriendo en http://localhost:8000
# Swagger docs en http://localhost:8000/docs
```

**Estructura del entorno virtual:**
```
StudyForge/
├── .venv/                    # ← Entorno virtual (raíz del proyecto)
│   ├── Scripts/
│   │   ├── activate.bat     # Activar en Windows
│   │   ├── python.exe       # Python del venv
│   │   └── pip.exe          # pip del venv
│   └── Lib/
├── backend/
│   ├── app/
│   ├── requirements.txt     # ← Dependencias Python
│   └── ...
└── frontend/
```

#### Frontend

```bash
# 1. Instalar dependencias
cd frontend
pnpm install

# 2. Configurar variables de entorno
cp .env.example .env
# Editar si es necesario

# 3. Ejecutar servidor de desarrollo
pnpm dev

# Servidor corriendo en http://localhost:5173
```

### Deployment

#### Backend (Render)

**Build Command:**
```bash
pip install -r requirements.txt && alembic upgrade head
```

**Start Command:**
```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

**Environment Variables:**
- `DATABASE_URL` - URL de PostgreSQL
- `SECRET_KEY` - Clave secreta para JWT
- `OPENAI_API_KEY` - API key de OpenAI
- `ENV=production`
- `DEBUG=False`

#### Frontend (Render / Vercel)

**Build Command:**
```bash
pnpm install && pnpm build
```

**Publish Directory:**
```
dist/
```

**Environment Variables:**
- `VITE_API_URL` - URL del backend desplegado

---

## Comandos Útiles

### Backend (Python)

**NOTA**: El entorno virtual está en la raíz del proyecto (`.venv`).

```bash
# ============================================
# Entorno virtual (ejecutar desde la RAÍZ)
# ============================================
python -m venv .venv                # Crear venv en raíz
.venv\Scripts\activate              # Activar (Windows)
deactivate                          # Salir del venv

# Usar Python del venv directamente (sin activar)
.venv\Scripts\python.exe --version
.venv\Scripts\pip.exe list

# ============================================
# Dependencias
# ============================================
pip install -r backend/requirements.txt    # Desde raíz con venv activado
.venv\Scripts\pip.exe install -r backend/requirements.txt  # Sin activar

pip freeze > backend/requirements.txt
pip install <package>

# ============================================
# Servidor de desarrollo (desde backend/)
# ============================================
cd backend
uvicorn app.main:app --reload
uvicorn app.main:app --host 0.0.0.0 --port 8000

# O desde raíz:
.venv\Scripts\python.exe -m uvicorn backend.app.main:app --reload

# ============================================
# Migraciones (desde backend/)
# ============================================
cd backend
alembic revision --autogenerate -m "mensaje"
alembic upgrade head
alembic downgrade -1
alembic current
alembic history

# ============================================
# Testing (desde backend/)
# ============================================
cd backend
pytest
pytest -v
pytest --cov=app
pytest tests/test_auth.py

# O desde raíz:
.venv\Scripts\pytest.exe backend/tests/

# ============================================
# Base de datos
# ============================================
psql -U postgres -f backend/setup_database.sql
psql -U studyforge_app -d studyforge
```

### Frontend (Node)

```bash
# Dependencias
pnpm install
pnpm add <package>
pnpm remove <package>

# Desarrollo
pnpm dev                # Dev server
pnpm build              # Build producción
pnpm preview            # Preview build

# Linting
pnpm lint
```

### Git

```bash
# Branches
git checkout remake
git checkout -b feature/nombre
git branch -d feature/nombre

# Commits
git add .
git commit -m "feat: mensaje"
git push origin <branch>

# Merge
git merge feature/nombre

# Status
git status
git log --oneline
git diff
```

### PostgreSQL

```bash
# Conectar a BD
psql -U postgres
psql -U studyforge_app -d studyforge

# Comandos útiles en psql
\l                      # Listar bases de datos
\c studyforge           # Conectar a BD
\dt studyforge.*        # Listar tablas del schema
\d studyforge.users     # Describir tabla
\q                      # Salir

# Queries útiles
SELECT * FROM studyforge.users;
SELECT COUNT(*) FROM studyforge.documents;
SELECT pg_size_pretty(pg_database_size('studyforge'));
```

---

## Decisiones Técnicas

### UUID vs Sequential IDs

**Decisión**: UUID v4 como primary key

**Razones**:
- **Seguridad**: Previene enumeración de recursos
- **Sistemas distribuidos**: No requiere coordinación para generación
- **Privacidad**: No revela orden de creación
- **Escalabilidad**: Facilita sharding futuro

### Argon2 vs bcrypt

**Decisión**: Argon2id para hashing de contraseñas

**Razones**:
- **Ganador de PHC 2015**: Password Hashing Competition
- **Memory-hard**: Resistente a ataques GPU/ASIC
- **Configurable**: time_cost, memory_cost, parallelism
- **Futuro-proof**: Diseño moderno y estándar

### JWT vs Sessions

**Decisión**: JWT stateless

**Razones**:
- **Escalabilidad**: No requiere estado en servidor
- **Microservicios**: Fácil de compartir entre servicios
- **Mobile-friendly**: Ideal para apps móviles futuras
- **Performance**: Sin lookups en BD en cada request

### Schema "studyforge" vs "public"

**Decisión**: Schema separado "studyforge"

**Razones**:
- **Aislamiento**: Separación lógica de datos
- **Seguridad**: Mejor control de permisos
- **Organización**: Más limpio que "public"
- **Multi-tenancy**: Facilita futuro multi-tenant

### Roles separados (owner/app)

**Decisión**: `studyforge_owner` para migraciones, `studyforge_app` para runtime

**Razones**:
- **Principio de menor privilegio**: App solo tiene DML, no DDL
- **Seguridad**: SQL injection no puede hacer DROP TABLE
- **Auditoría**: Claridad en quién hace qué
- **Best practice**: Estándar de la industria

### JSONB para content

**Decisión**: Campo `content` en `summaries` como JSONB

**Razones**:
- **Queryeable**: PostgreSQL permite queries en JSONB
- **Flexible**: Estructura puede evolucionar
- **Performance**: Indexable con GIN indexes
- **Tipado**: Mejor que TEXT plano

### OpenAI gpt-4o-mini

**Decisión**: Usar `gpt-4o-mini` en vez de `gpt-4`

**Razones**:
- **Costo**: ~10x más barato que gpt-4
- **Velocidad**: Respuestas más rápidas
- **Calidad suficiente**: Para resúmenes y quizzes educativos
- **Escalabilidad**: Permite más usuarios

### Dificultad Adaptativa

**Decisión**: Sistema de dificultad 1-5 basado en últimos 5 intentos

**Razones**:
- **Personalización**: Se adapta al nivel del estudiante
- **Engagement**: Mantiene desafío apropiado
- **Aprendizaje**: Zona de desarrollo próximo (Vygotsky)
- **Data-driven**: Basado en desempeño real

### 3 Niveles de Expertise

**Decisión**: Básico, Medio, Avanzado para resúmenes

**Razones**:
- **Granularidad apropiada**: Balance entre opciones y simplicidad
- **UX**: Fácil de entender para usuarios
- **Prompting**: Fácil de traducir a prompts de OpenAI
- **Común**: Estándar en educación

---

## Guías de Desarrollo

### Agregar un Nuevo Endpoint

**Ejemplo: Agregar endpoint para actualizar perfil de usuario**

#### 1. Definir Schema (Pydantic)

```python
# app/schemas/user.py
class UserProfileUpdate(BaseModel):
    username: Optional[str] = None
    bio: Optional[str] = None

    class Config:
        from_attributes = True
```

#### 2. Actualizar Repository

```python
# app/repositories/user_repository.py
class UserRepository:
    @staticmethod
    def update_profile(db: Session, user: User, **kwargs) -> User:
        for key, value in kwargs.items():
            if hasattr(user, key) and value is not None:
                setattr(user, key, value)

        user.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(user)
        return user
```

#### 3. Crear Service (si lógica compleja)

```python
# app/services/user_service.py
class UserService:
    @staticmethod
    def update_profile(db: Session, user: User, data: UserProfileUpdate) -> User:
        # Validaciones de negocio
        if data.username and UserRepository.get_by_username(db, data.username):
            raise HTTPException(409, "Username ya existe")

        # Actualizar
        return UserRepository.update_profile(
            db, user, **data.model_dump(exclude_unset=True)
        )
```

#### 4. Agregar Router

```python
# app/routers/users.py (nuevo archivo o agregar a auth.py)
from fastapi import APIRouter, Depends
from app.core.dependencies import get_current_user

router = APIRouter()

@router.patch("/users/me")
def update_my_profile(
    data: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Actualiza el perfil del usuario autenticado"""
    updated_user = UserService.update_profile(db, current_user, data)
    return UserResponse.model_validate(updated_user)
```

#### 5. Registrar en main.py

```python
# app/main.py
from app.routers import users

app.include_router(users.router, prefix="/users", tags=["Users"])
```

### Agregar una Nueva Migración

**Ejemplo: Agregar campo `bio` a tabla `users`**

#### 1. Modificar Model

```python
# app/models/user.py
class User(Base):
    # ... campos existentes ...
    bio: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
```

#### 2. Generar Migración

```bash
cd backend
alembic revision --autogenerate -m "Add bio field to users"
```

#### 3. Revisar Migración Generada

```python
# alembic/versions/xxxxx_add_bio_field_to_users.py
def upgrade() -> None:
    op.add_column('users', sa.Column('bio', sa.Text(), nullable=True), schema='studyforge')

def downgrade() -> None:
    op.drop_column('users', 'bio', schema='studyforge')
```

#### 4. Aplicar Migración

```bash
alembic upgrade head
```

### Integrar Nuevo Procesador de Archivos

**Ejemplo: Agregar soporte para archivos Excel (.xlsx)**

#### 1. Instalar Dependencia

```bash
pip install openpyxl
pip freeze > requirements.txt
```

#### 2. Actualizar FileProcessor

```python
# app/services/file_processor.py
import openpyxl

class FileProcessor:
    ALLOWED_EXTENSIONS = ["pdf", "pptx", "docx", "txt", "xlsx"]  # Agregar xlsx

    @staticmethod
    def extract_text_from_xlsx(file_content: bytes) -> str:
        """Extrae texto de archivo Excel"""
        import io
        workbook = openpyxl.load_workbook(io.BytesIO(file_content))

        text_parts = []
        for sheet in workbook.worksheets:
            for row in sheet.iter_rows(values_only=True):
                row_text = " ".join(str(cell) for cell in row if cell is not None)
                if row_text.strip():
                    text_parts.append(row_text)

        return "\n".join(text_parts)

    @staticmethod
    def validate_and_extract(file: UploadFile) -> Tuple[str, str]:
        # ... código existente ...

        elif file_type == "xlsx":
            extracted_text = FileProcessor.extract_text_from_xlsx(content)

        # ... resto del código ...
```

#### 3. Actualizar Config

```python
# app/config.py
class Settings(BaseSettings):
    ALLOWED_EXTENSIONS: str = "pdf,pptx,docx,txt,xlsx"
```

### Agregar Nueva Estadística

**Ejemplo: Agregar endpoint para temas más difíciles**

#### 1. Agregar Query en Repository

```python
# app/repositories/quiz_attempt_repository.py
class QuizAttemptRepository:
    @staticmethod
    def get_hardest_topics(db: Session, user_id: UUID, limit: int = 5) -> List[Dict]:
        """Retorna los temas con peor desempeño"""
        from sqlalchemy import func

        results = db.query(
            Quiz.topic,
            func.avg(QuizAttempt.score).label("avg_score"),
            func.count(QuizAttempt.id).label("attempts")
        ).join(
            Quiz, QuizAttempt.quiz_id == Quiz.id
        ).filter(
            QuizAttempt.user_id == user_id,
            QuizAttempt.completed_at.isnot(None)
        ).group_by(
            Quiz.topic
        ).order_by(
            func.avg(QuizAttempt.score).asc()
        ).limit(limit).all()

        return [
            {
                "topic": r.topic,
                "avg_score": float(r.avg_score),
                "attempts": r.attempts
            }
            for r in results
        ]
```

#### 2. Agregar Endpoint

```python
# app/routers/stats.py
@router.get("/stats/hardest-topics")
def get_hardest_topics(
    limit: int = 5,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtiene los temas más difíciles para el usuario"""
    topics = QuizAttemptRepository.get_hardest_topics(db, current_user.id, limit)
    return {"hardest_topics": topics}
```

---

## Solución de Problemas Comunes

### Error de Conexión a BD

**Síntoma**: `FATAL: password authentication failed for user`

**Solución**:
1. Verificar que PostgreSQL esté corriendo
2. Revisar credenciales en `.env`
3. Verificar que el usuario exista:
   ```bash
   psql -U postgres -c "\du"
   ```
4. Recrear usuario si es necesario:
   ```bash
   psql -U postgres -f setup_database.sql
   ```

### Error de Migración de Alembic

**Síntoma**: `Can't locate revision identified by 'xxxxx'`

**Solución**:
1. Ver estado actual:
   ```bash
   alembic current
   alembic history
   ```
2. Si está desincronizado, borrar y recrear:
   ```bash
   alembic downgrade base
   alembic upgrade head
   ```

### OpenAI API Error

**Síntoma**: `AuthenticationError: Incorrect API key`

**Solución**:
1. Verificar `OPENAI_API_KEY` en `.env`
2. Verificar que la key sea válida en https://platform.openai.com/api-keys
3. Verificar balance de cuenta OpenAI

### Error de CORS

**Síntoma**: `Access-Control-Allow-Origin` error en browser

**Solución**:
```python
# app/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Agregar frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## Recursos Adicionales

### Documentación del Proyecto

- [README.md](./README.md) - Introducción general
- [SETUP.md](./SETUP.md) - Guía de instalación
- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) - Arquitectura detallada
- [docs/SECURITY.md](./docs/SECURITY.md) - Consideraciones de seguridad
- [docs/DECISIONS.md](./docs/DECISIONS.md) - Decisiones técnicas
- [docs/ROADMAP.md](./docs/ROADMAP.md) - Plan de desarrollo
- [docs/NEXT_STEPS.md](./docs/NEXT_STEPS.md) - Próximos pasos

### Documentación de Tecnologías

- [FastAPI](https://fastapi.tiangolo.com/)
- [SQLAlchemy 2.0](https://docs.sqlalchemy.org/en/20/)
- [Alembic](https://alembic.sqlalchemy.org/)
- [Pydantic](https://docs.pydantic.dev/)
- [PostgreSQL](https://www.postgresql.org/docs/)
- [OpenAI API](https://platform.openai.com/docs/)
- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/docs/)
- [Vite](https://vite.dev/)

### Endpoints de Desarrollo

- **Backend Dev**: http://localhost:8000
- **Frontend Dev**: http://localhost:5173
- **API Docs (Swagger)**: http://localhost:8000/docs
- **API Docs (ReDoc)**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

---

## Notas para Asistentes de IA

### Principios Generales

1. **Seguridad primero**: Siempre validar ownership antes de modificar recursos
2. **Type safety**: Usar type hints en Python y TypeScript
3. **Documentación**: Mantener docstrings y comentarios actualizados
4. **Testing**: Escribir tests para nueva funcionalidad
5. **Encoding**: UTF-8 CRLF en todos los archivos
6. **Mensajes en español**: Para usuarios finales

### Al Modificar Código

1. **Leer primero**: Entender código existente antes de modificar
2. **Seguir patrones**: Mantener consistencia con arquitectura en capas
3. **Validar entrada**: Siempre validar datos de usuario
4. **Manejo de errores**: HTTPException con códigos apropiados
5. **Actualizar migraciones**: Si cambias modelos, genera migración

### Al Agregar Features

1. **Planificar**: Diseñar antes de implementar
2. **Seguridad**: Considerar autenticación y autorización
3. **Cuotas**: Verificar límites de usuario si aplica
4. **Testing**: Agregar tests para nueva funcionalidad
5. **Documentación**: Actualizar este archivo y docs/

### Códigos HTTP Comunes

- `200 OK` - Éxito general
- `201 Created` - Recurso creado
- `400 Bad Request` - Entrada inválida
- `401 Unauthorized` - Sin autenticación
- `403 Forbidden` - Sin autorización
- `404 Not Found` - Recurso no existe
- `409 Conflict` - Conflicto (email duplicado, etc.)
- `413 Payload Too Large` - Archivo muy grande
- `507 Insufficient Storage` - Sin espacio
- `500 Internal Server Error` - Error del servidor

### Puntos de Entrada Clave

- **Backend**: `app/main.py` - FastAPI app instance
- **Frontend**: `src/main.tsx` - React root
- **Config**: `app/config.py` - Settings
- **BD**: `app/db.py` - Database session
- **Auth**: `app/core/dependencies.py` - get_current_user

### Uso del Entorno Virtual (CRÍTICO)

**IMPORTANTE**: El entorno virtual de Python está en `.venv` en la **raíz del proyecto**, NO en `backend/.venv`.

#### Forma recomendada de ejecutar comandos Python:

```bash
# 1. Activar el entorno virtual primero (desde la raíz)
.venv\Scripts\activate

# 2. Ejecutar comandos normalmente
cd backend
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
pytest

# 3. Desactivar cuando termines
deactivate
```

#### Alternativa sin activar (rutas explícitas):

```bash
# Desde la raíz del proyecto
.venv\Scripts\python.exe -m pip install -r backend/requirements.txt
.venv\Scripts\alembic.exe upgrade head
.venv\Scripts\python.exe -m uvicorn backend.app.main:app --reload
.venv\Scripts\pytest.exe backend/tests/
```

#### ❌ NO hacer:

```bash
# NO crear entorno virtual en backend/
cd backend
python -m venv .venv  # ¡INCORRECTO!

# NO asumir que el venv está en backend/
backend\.venv\Scripts\activate  # ¡INCORRECTO!
```

#### ✅ SÍ hacer:

```bash
# Activar desde la raíz
.venv\Scripts\activate

# O usar rutas explícitas desde cualquier ubicación
.venv\Scripts\python.exe --version
.venv\Scripts\pip.exe list
```

---

## Contacto y Soporte

Para preguntas, problemas o sugerencias sobre el proyecto:

1. Revisar documentación en `/docs`
2. Consultar este archivo CLAUDE.md
3. Revisar issues en GitHub (si aplica)

---

**Última actualización**: 2025-11-19
**Versión del proyecto**: 2.0.0
**Mantenido por**: Equipo StudyForge
