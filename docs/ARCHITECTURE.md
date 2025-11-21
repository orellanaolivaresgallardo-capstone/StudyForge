# Arquitectura StudyForge

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
  - DOCX: python-docx
  - PPTX: python-pptx
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
│   │   ├── quiz.py         # Cuestionario (con preguntas en JSON)
│   │   ├── quiz_attempt.py # Intento de cuestionario (con respuestas en JSON)
│   │   └── document.py     # Documento almacenado
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

---

## Arquitectura del Frontend

### Estructura de Carpetas

```
frontend/
├── public/              # Archivos estáticos
├── src/
│   ├── main.tsx         # Punto de entrada, configuración de React Router
│   ├── App.tsx          # Componente raíz (simple health check)
│   ├── index.css        # Estilos globales (Tailwind)
│   │
│   ├── components/      # Componentes reutilizables
│   │   ├── Navbar.tsx       # Barra de navegación con menú responsive
│   │   ├── ProtectedRoute.tsx  # HOC para rutas protegidas
│   │   └── QuotaWidget.tsx     # Widget de cuota de almacenamiento
│   │
│   ├── pages/           # Páginas/vistas de la aplicación
│   │   ├── Home.tsx             # Landing page
│   │   ├── login.tsx            # Página de login
│   │   ├── signup.tsx           # Página de registro
│   │   ├── documents.tsx        # Gestión de documentos
│   │   ├── summaries.tsx        # Lista de resúmenes
│   │   ├── SummaryDetail.tsx    # Detalle de resumen
│   │   ├── Quizzes.tsx          # Lista de quizzes
│   │   ├── QuizAttempt.tsx      # Realizar quiz
│   │   ├── QuizResults.tsx      # Resultados de quiz
│   │   ├── Stats.tsx            # Estadísticas del usuario
│   │   └── ErrorPage.tsx        # Página de error
│   │
│   ├── context/         # Context API para estado global
│   │   └── AuthContext.tsx  # Estado de autenticación (user, login, logout)
│   │
│   ├── services/        # Capa de servicios HTTP
│   │   └── api.ts       # Cliente Axios con interceptors JWT
│   │
│   ├── types/           # Definiciones TypeScript
│   │   └── api.types.ts # Tipos para requests/responses de API
│   │
│   └── assets/          # Imágenes, íconos, etc.
│
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

### Arquitectura de Componentes

#### 1. Routing (React Router v6)

```typescript
// main.tsx
const router = createBrowserRouter([
  // Rutas públicas
  { path: "/", element: <Home /> },
  { path: "/login", element: <Login /> },
  { path: "/signup", element: <SignUp /> },

  // Rutas protegidas (requieren autenticación)
  {
    path: "/documents",
    element: <ProtectedRoute><DocumentsPage /></ProtectedRoute>,
  },
  {
    path: "/summaries",
    element: <ProtectedRoute><SummariesPage /></ProtectedRoute>,
  },
  {
    path: "/summaries/:id",
    element: <ProtectedRoute><SummaryDetailPage /></ProtectedRoute>,
  },
  {
    path: "/quizzes",
    element: <ProtectedRoute><QuizzesPage /></ProtectedRoute>,
  },
  {
    path: "/quizzes/:id/attempt",
    element: <ProtectedRoute><QuizAttemptPage /></ProtectedRoute>,
  },
  {
    path: "/quiz-attempts/:id/results",
    element: <ProtectedRoute><QuizResultsPage /></ProtectedRoute>,
  },
  {
    path: "/stats",
    element: <ProtectedRoute><StatsPage /></ProtectedRoute>,
  },
]);
```

#### 2. Estado Global (Context API)

**AuthContext** - Gestión de autenticación:
```typescript
interface AuthContextType {
  user: UserDetailResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials, remember?) => Promise<void>;
  signup: (data, remember?) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}
```

- Almacena token JWT en localStorage (remember=true) o sessionStorage (remember=false)
- Auto-carga usuario al iniciar sesión si hay token válido
- Intercepta 401 para redirección automática a login

#### 3. Capa de Servicios (api.ts)

**Cliente Axios configurado con:**
- Base URL configurable via `VITE_API_BASE`
- Interceptor de request: añade header `Authorization: Bearer <token>` automáticamente
- Interceptor de response: maneja 401 (token expirado) redirigiendo a login
- Token management: `getToken()`, `setToken()`, `clearToken()`

**Funciones organizadas por recurso:**
- **Auth**: `register()`, `login()`, `getCurrentUser()`
- **Documents**: `uploadDocument()`, `listDocuments()`, `deleteDocument()`, `getStorageInfo()`
- **Summaries**: `createSummaryFromDocuments()`, `listSummaries()`, `getSummary()`, `deleteSummary()`
- **Quizzes**: `createQuizFromFile()`, `createQuizFromSummary()`, `listQuizzes()`
- **Quiz Attempts**: `createQuizAttempt()`, `answerQuestion()`, `completeQuizAttempt()`, `getQuizAttemptResults()`
- **Stats**: `getUserProgress()`, `getUserPerformance()`, `getStatsSummary()`

#### 4. Componentes Principales

- **Navbar**: Navegación responsive con links a secciones, botón logout, avatar de usuario
- **ProtectedRoute**: HOC que verifica autenticación antes de renderizar, redirige a /login si no autenticado
- **QuotaWidget**: Muestra uso de almacenamiento (barra de progreso), alerta si supera 80%

### Diseño y Estilos

- **Tailwind CSS**: Utility-first CSS framework
- **Tema Aurora Gradient**: Degradados morados/azules con efectos glass morphism
- **Responsive**: Mobile-first con breakpoints `sm`, `md`, `lg`, `xl`
- **Accesibilidad**: Hover states, focus rings, aria-labels en elementos interactivos

### Variables de Entorno Frontend

```env
VITE_API_BASE=http://localhost:8000  # URL del backend
```

---

## Base de Datos

**Schema**: `studyforge` con roles separados (`studyforge_owner` para migraciones, `studyforge_app` para runtime)

**Tablas principales**:
- **Users**: Usuarios con sistema de cuotas de almacenamiento
- **Documents**: Archivos almacenados (PDF, DOCX, PPTX, TXT) con contenido binario
- **Summaries**: Resúmenes generados con IA (contenido en JSONB)
- **Quizzes**: Cuestionarios con preguntas en JSONB (no tablas relacionales)
- **QuizAttempts**: Intentos de quiz con respuestas randomizadas por intento

**Ver detalles completos** (modelo de datos, índices, migraciones): **[DATABASE.md](DATABASE.md)**

## Flujo de Datos

### 1. Generación de Resumen (Multi-documento)

```
Usuario → Upload File(s) o selecciona documentos existentes
    ↓
FileProcessor → Extrae y almacena texto
    ↓
Document Repository → Guarda documento (file_content + extracted_text)
    ↓
OpenAI Service → Genera resumen según nivel de expertise
    ↓
Summary Repository → Guarda resumen y relación con documentos
    ↓
Usuario ← Resumen estructurado
```

### 2. Generación de Cuestionario (con randomización)

```
Usuario → Solicita cuestionario (de resumen existente)
    ↓
Quiz Service → Analiza contenido y calcula dificultad adaptativa
    ↓
OpenAI Service → Genera preguntas en formato JSON semántico
    ↓
Quiz Repository → Guarda cuestionario con questions (JSONB)
    ↓
Usuario ← Cuestionario generado
```

### 3. Realización de Cuestionario

```
Usuario → Inicia cuestionario
    ↓
QuizAttempt Repository → Crea attempt + randomiza opciones
    ↓
Usuario responde preguntas → Por índice (0, 1, 2...)
    ↓
Feedback inmediato (correcto/incorrecto + explicación)
    ↓
Al finalizar → Calcula score comparando arrays
    ↓
Algoritmo adaptativo → Ajusta nivel de dificultad futuro
```

**Para flujos end-to-end detallados** (debugging, diagramas de secuencia): **[INTEGRATION.md](INTEGRATION.md)**

---

## Características Clave

### 1. Sistema de Almacenamiento con Cuotas
- Los documentos SE almacenan para reutilización
- Sistema de cuotas configurable por usuario
- Tracking de uso de almacenamiento en tiempo real
- Múltiples documentos pueden asociarse a un resumen

### 2. Niveles de Expertise Adaptativos
- **Básico**: Vocabulario simple, conceptos fundamentales
- **Medio**: Balance entre detalle y claridad
- **Avanzado**: Análisis técnico y profundo

### 3. Quizzes con Randomización
- Preguntas almacenadas en JSON (no tablas relacionales)
- Randomización de opciones por intento
- Dificultad adaptativa basada en últimos 5 intentos
- Máximo 30 preguntas por cuestionario

### 4. Feedback Inmediato
- Evaluación por comparación de arrays
- Explicación detallada de cada pregunta
- Progreso visible en tiempo real

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

- **Autenticación**: JWT + Argon2 para contraseñas
- **Privacidad**: Aislamiento de datos por usuario (ownership validation)
- **Rate Limiting**: Middleware de límites de peticiones
- **Validación**: Pydantic + magic numbers para archivos

**Ver detalles completos**: [SECURITY.md](SECURITY.md)

---

## Referencias

**Documentación técnica**:
- **Base de datos**: [DATABASE.md](DATABASE.md) - Modelo de datos, índices, migraciones, queries
- **Integración E2E**: [INTEGRATION.md](INTEGRATION.md) - Flujos detallados para debugging y diagramas
- **Seguridad**: [SECURITY.md](SECURITY.md) - Consideraciones de seguridad y privacidad
- **Decisiones**: [DECISIONS.md](DECISIONS.md) - Registro de decisiones técnicas con justificación

**Estado del proyecto**:
- **Implementación**: [IMPLEMENTATION.md](IMPLEMENTATION.md) - Checklist de lo implementado
- **Próximos pasos**: [NEXT_STEPS.md](NEXT_STEPS.md) - Tareas pendientes inmediatas
- **Roadmap**: [ROADMAP.md](ROADMAP.md) - Plan de desarrollo a largo plazo (fases)

