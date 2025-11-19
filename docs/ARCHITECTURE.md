# Arquitectura StudyForge v2.0

## Visión General

StudyForge es una aplicación web de acompañamiento y apoyo para el aprendizaje de estudiantes mediante IA.

## Stack Tecnológico

### Backend
- **Python**: 3.14
- **Framework**: FastAPI
- **Base de datos**: PostgreSQL 18
- **ORM**: SQLAlchemy 2.x
- **Migraciones**: Alembic
- **Autenticación**: JWT (python-jose)
- **IA**: OpenAI API (GPT-4)
- **Procesamiento de archivos**:
  - PDF: PyPDF2, pdfplumber
  - PPTX: python-pptx
  - DOCX: python-docx
  - TXT: nativo Python

### Frontend
- **Node**: 24
- **Bundler**: Vite
- **Framework**: React 19
- **Lenguaje**: TypeScript 5.8
- **Estilos**: Tailwind CSS
- **Gestor de paquetes**: pnpm
- **HTTP Client**: Axios

### Deployment
- **Hosting**: Render / GCP
- **CI/CD**: GitHub Actions

## Arquitectura del Backend

### Estructura de Carpetas

```
backend/
├── alembic/                 # Migraciones de base de datos
├── app/
│   ├── __init__.py
│   ├── main.py             # Punto de entrada de FastAPI
│   ├── config.py           # Configuración y variables de entorno
│   ├── db.py               # Configuración de base de datos
│   │
│   ├── core/               # Lógica central
│   │   ├── __init__.py
│   │   ├── security.py     # Hash de contraseñas, JWT
│   │   └── dependencies.py # Dependencias comunes
│   │
│   ├── models/             # Modelos SQLAlchemy
│   │   ├── __init__.py
│   │   ├── user.py         # Usuario
│   │   ├── summary.py      # Resumen
│   │   ├── quiz.py         # Cuestionario
│   │   ├── question.py     # Pregunta de cuestionario
│   │   ├── quiz_attempt.py # Intento de cuestionario
│   │   └── answer.py       # Respuesta del usuario
│   │
│   ├── schemas/            # Pydantic schemas (validación)
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── auth.py
│   │   ├── summary.py
│   │   ├── quiz.py
│   │   └── document.py     # Para carga temporal
│   │
│   ├── routers/            # Endpoints de API
│   │   ├── __init__.py
│   │   ├── auth.py         # Login, registro
│   │   ├── summaries.py    # CRUD de resúmenes
│   │   ├── quizzes.py      # Generación y gestión de cuestionarios
│   │   ├── quiz_attempts.py# Realizar cuestionarios
│   │   └── health.py       # Health check
│   │
│   ├── services/           # Lógica de negocio
│   │   ├── __init__.py
│   │   ├── auth_service.py
│   │   ├── file_processor.py    # Procesamiento de archivos
│   │   ├── summary_service.py   # Generación de resúmenes
│   │   ├── quiz_service.py      # Generación de cuestionarios
│   │   └── openai_service.py    # Cliente de OpenAI
│   │
│   ├── repositories/       # Acceso a datos
│   │   ├── __init__.py
│   │   ├── user_repository.py
│   │   ├── summary_repository.py
│   │   ├── quiz_repository.py
│   │   └── quiz_attempt_repository.py
│   │
│   └── utils/              # Utilidades
│       ├── __init__.py
│       └── file_utils.py   # Helpers para archivos
│
├── tests/                  # Tests
├── requirements.txt
└── .env.example
```

## Modelo de Datos

### Users (Usuarios)
```python
id: UUID (PK)
email: str (unique)
username: str (unique)
hashed_password: str
created_at: datetime
updated_at: datetime
is_active: bool
```

### Summaries (Resúmenes)
```python
id: UUID (PK)
user_id: UUID (FK -> Users)
title: str
content: jsonb  # Contenido estructurado del resumen
expertise_level: enum('basico', 'medio', 'avanzado')
topics: jsonb  # Lista de temas identificados
key_concepts: jsonb  # Conceptos clave destacados
original_file_name: str  # Solo el nombre, NO el contenido
original_file_type: str  # pdf, pptx, docx, txt
created_at: datetime
updated_at: datetime
```

### Quizzes (Cuestionarios)
```python
id: UUID (PK)
user_id: UUID (FK -> Users)
summary_id: UUID (FK -> Summaries, nullable)  # Puede generarse de resumen o documento temporal
title: str
topic: str  # "general" o tema específico
difficulty_level: int  # 1-5, adaptativo según desempeño
max_questions: int  # Máximo 30
created_at: datetime
```

### Questions (Preguntas)
```python
id: UUID (PK)
quiz_id: UUID (FK -> Quizzes)
question_text: str
option_a: str
option_b: str
option_c: str
option_d: str
correct_option: enum('A', 'B', 'C', 'D')
explanation: str  # Explicación detallada
order: int
```

### QuizAttempts (Intentos de Cuestionario)
```python
id: UUID (PK)
quiz_id: UUID (FK -> Quizzes)
user_id: UUID (FK -> Users)
started_at: datetime
completed_at: datetime (nullable)
score: float (nullable)  # Porcentaje 0-100
```

### Answers (Respuestas)
```python
id: UUID (PK)
attempt_id: UUID (FK -> QuizAttempts)
question_id: UUID (FK -> Questions)
selected_option: enum('A', 'B', 'C', 'D')
is_correct: bool
answered_at: datetime
```

## Flujo de Datos

### 1. Generación de Resumen

```
Usuario → Upload File (no se guarda en BD)
    ↓
FileProcessor → Extrae texto según tipo de archivo
    ↓
OpenAI Service → Genera resumen según nivel de expertise
    ↓
Summary Repository → Guarda solo el resumen (NO el archivo)
    ↓
Usuario ← Resumen estructurado
```

### 2. Generación de Cuestionario

```
Usuario → Solicita cuestionario (de resumen o documento nuevo)
    ↓
Quiz Service → Analiza contenido
    ↓
OpenAI Service → Genera preguntas según:
    - Nivel de dificultad (basado en historial)
    - Cantidad (automática o especificada por usuario)
    - Tema (general o específico)
    ↓
Quiz Repository → Guarda cuestionario y preguntas
    ↓
Usuario ← Cuestionario generado
```

### 3. Realización de Cuestionario

```
Usuario → Inicia cuestionario
    ↓
Quiz Attempt creado
    ↓
Usuario responde preguntas → Una por una
    ↓
Feedback inmediato (correcto/incorrecto + explicación)
    ↓
Al finalizar → Calcula score, actualiza estadísticas
    ↓
Algoritmo adaptativo → Ajusta nivel de dificultad futuro
```

## Características Clave

### 1. Privacidad de Documentos
- Los documentos originales NO se almacenan en la base de datos
- Solo se procesa el contenido en memoria
- Se guarda únicamente:
  - El resumen generado
  - Nombre del archivo original
  - Tipo de archivo

### 2. Niveles de Expertise
- **Básico**: Resumen simple, vocabulario accesible
- **Medio**: Balance entre detalle y claridad
- **Avanzado**: Resumen técnico y detallado

### 3. Sistema Adaptativo de Cuestionarios
- Tracking de desempeño por tema
- Ajuste automático de dificultad basado en últimos 5 intentos
- Máximo 30 preguntas por cuestionario
- Opción de cuestionario completo o por tema específico

### 4. Feedback Inmediato
- Respuesta correcta/incorrecta al instante
- Explicación detallada de cada pregunta
- No se bloquea hasta finalizar el cuestionario

## API Endpoints

### Autenticación
- `POST /auth/register` - Registro de usuario
- `POST /auth/login` - Login (retorna JWT)
- `GET /auth/me` - Información del usuario actual

### Resúmenes
- `POST /summaries/upload` - Subir documento y generar resumen
- `GET /summaries` - Listar resúmenes del usuario
- `GET /summaries/{id}` - Obtener resumen específico
- `DELETE /summaries/{id}` - Eliminar resumen

### Cuestionarios
- `POST /quizzes/generate` - Generar cuestionario
- `GET /quizzes` - Listar cuestionarios del usuario
- `GET /quizzes/{id}` - Obtener cuestionario específico
- `POST /quiz-attempts` - Iniciar intento de cuestionario
- `POST /quiz-attempts/{id}/answer` - Responder pregunta
- `POST /quiz-attempts/{id}/complete` - Finalizar cuestionario
- `GET /quiz-attempts/{id}/results` - Ver resultados

### Estadísticas
- `GET /stats/progress` - Progreso del usuario por tema
- `GET /stats/performance` - Desempeño histórico

## Seguridad

### Autenticación
- JWT con expiración de 24 horas
- Refresh tokens (opcional)
- Contraseñas hasheadas con Argon2

### Validación
- Pydantic para validación de datos de entrada
- Límite de tamaño de archivo: 10MB
- Tipos de archivo permitidos: PDF, PPTX, PPT, DOCX, DOC, TXT

### Rate Limiting
- Límite de llamadas a OpenAI por usuario
- Límite de uploads por día

## Variables de Entorno

```env
# Database
DATABASE_URL=postgresql+psycopg://user:pass@localhost:5432/studyforge

# JWT
SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# OpenAI
OPENAI_API_KEY=sk-...

# File Upload
MAX_FILE_SIZE_MB=10
ALLOWED_EXTENSIONS=pdf,pptx,ppt,docx,doc,txt

# Environment
ENV=development
```

## Deployment

### Render
1. Crear servicio Web para backend (Python 3.14)
2. Crear servicio PostgreSQL 18
3. Configurar variables de entorno
4. Build command: `pip install -r requirements.txt && alembic upgrade head`
5. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### Frontend (Render Static Site o Vercel)
1. Build command: `pnpm install && pnpm build`
2. Publish directory: `dist`

## Próximos Pasos

1. ✅ Definir arquitectura
2. ⏳ Implementar backend base
3. ⏳ Implementar autenticación
4. ⏳ Implementar procesamiento de archivos
5. ⏳ Integrar OpenAI
6. ⏳ Implementar frontend
7. ⏳ Testing
8. ⏳ Deployment

