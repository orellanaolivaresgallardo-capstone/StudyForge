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
├── .venv/                   # Entorno virtual de Python (no versionado)
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
│   ├── index.css        # Estilos globales (Tailwind + custom CSS)
│   │
│   ├── components/      # Componentes reutilizables
│   │   ├── Navbar.tsx          # Barra de navegación con menú responsive
│   │   ├── LandingPage.tsx     # ✨ Landing page para usuarios no autenticados
│   │   ├── ProtectedRoute.tsx  # HOC para rutas protegidas
│   │   └── QuotaWidget.tsx     # Widget de cuota de almacenamiento
│   │
│   ├── pages/           # Páginas/vistas de la aplicación
│   │   ├── Home.tsx             # ♻️ Maneja landing/redirect según autenticación
│   │   ├── login.tsx            # Página de login
│   │   ├── signup.tsx           # Página de registro
│   │   ├── forgot-password.tsx  # ✨ Recuperación de contraseña
│   │   ├── features.tsx         # ✨ Página de características (marketing)
│   │   ├── aboutus.tsx          # ✨ Página sobre nosotros (marketing)
│   │   ├── documents.tsx        # Gestión de documentos
│   │   ├── summaries.tsx        # Lista de resúmenes
│   │   ├── SummaryDetail.tsx    # Detalle de resumen
│   │   ├── Quizzes.tsx          # Lista de quizzes
│   │   ├── QuizAttempt.tsx      # Realizar quiz
│   │   ├── QuizResults.tsx      # Resultados de quiz
│   │   ├── Stats.tsx            # Estadísticas del usuario
│   │   └── ErrorPage.tsx        # ♻️ Página 404 styled con Link de React Router
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
├── index.html           # ♻️ Simplificado (19 líneas, solo <div id="root">)
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.cjs  # ♻️ Con paleta de colores 'brand' (50-900)
```

**Nota sobre refactorización a SPA pura:**
En la transformación a arquitectura SPA moderna se eliminaron:
- **8 archivos HTML estáticos**: `login.html`, `signup.html`, `features.html`, `aboutus.html`, `forgot-password.html`, `results.html`, `uploaddocuments.html`, `uploaddocuments2.html`
- **3 componentes obsoletos**: `App.tsx` (reemplazado por Home.tsx), `results.tsx`, `uploaddocuments.tsx`
- **index.html**: Simplificado de 180 líneas a 19 líneas (solo `<div id="root">` y script)
- Toda la navegación ahora usa React Router Links (sin recargas de página)
```

### Arquitectura de Componentes

#### 1. Routing (React Router v7)

```typescript
// main.tsx
const router = createBrowserRouter([
  // Rutas públicas
  { path: "/", element: <Home /> },              // Landing o redirect según auth
  { path: "/login", element: <Login /> },
  { path: "/signup", element: <SignUp /> },
  { path: "/forgot-password", element: <ForgotPasswordPage /> },  // ✨ Nueva
  { path: "/features", element: <FeaturesPage /> },               // ✨ Nueva
  { path: "/aboutus", element: <AboutUsPage /> },                 // ✨ Nueva

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

  // Catch-all: redirige a home
  { path: "*", element: <Navigate to="/" replace /> },
]);
```

**Flujo de Home.tsx (ruta `/`):**
- **Si no autenticado**: Muestra `<LandingPage />` (navegación a features, aboutus, login, signup)
- **Si autenticado**: `<Navigate to="/documents" replace />` (redirect automático al dashboard)
- **Mientras verifica**: Muestra spinner de carga

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

- **Navbar**: Navegación responsive con links a secciones principales
  - Muestra diferentes menús según estado de autenticación
  - Menú hamburguesa móvil con animaciones
  - QuotaWidget integrado (solo para usuarios autenticados)
  - Avatar de usuario con dropdown (logout)

- **LandingPage**: Landing page para usuarios no autenticados (✨ Nuevo componente)
  - **Hero section** con gradientes glassmorphism (`.hero-bg`, `.frame`)
  - **Menú hamburguesa móvil** funcional con estado local
  - **Navegación React Router** a: `/`, `/features`, `/aboutus`, `/login`, `/signup`
  - **Diseño responsive mobile-first**: 320px (móvil) → 768px (tablet) → 1024px+ (desktop)
  - **Efectos visuales**: Grid overlay animado, bordes con gradientes, botones con glow
  - **Clases CSS personalizadas**: `.glass`, `.btn-glow`, `.shadow-glass`, `.grid-overlay`

- **ProtectedRoute**: HOC que verifica autenticación antes de renderizar
  - Redirige a `/login` si no autenticado
  - Muestra spinner mientras verifica token
  - Renderiza children si autenticación exitosa

- **QuotaWidget**: Muestra uso de almacenamiento del usuario
  - Barra de progreso con animación shimmer
  - Alerta visual si supera 80%
  - Modos: compact (navbar) y full (páginas)

### Diseño y Estilos

#### Tailwind CSS
- **Framework**: Tailwind CSS utility-first
- **Paleta personalizada `brand`**: Escala completa 50-900 (violeta/púrpura)
  ```js
  // tailwind.config.cjs
  brand: {
    50: "#F2E9FF",   // Muy claro
    500: "#7C3AED",  // Principal (usado en botones, logos)
    900: "#300A66"   // Muy oscuro
  }
  ```
- **Dark mode**: Automático según sistema operativo (`darkMode: 'media'`)

#### Estilos CSS Personalizados (index.css)

**Landing Page:**
- **`.hero-bg`**: Gradientes radiales múltiples (fondo hero section)
  - 4 capas de gradientes superpuestos
  - Colores: violeta, azul, blanco/transparente

- **`.grid-overlay`**: Cuadrícula animada con máscara radial
  - Grid de 40x40px con transparencia
  - Máscara radial para efecto fade-out

- **`.frame`**: Marco glassmorphism con borde animado
  - Fondo semi-transparente con blur
  - Borde gradiente usando pseudo-elemento `::before`
  - Sombras profundas para elevación visual

**Efectos Interactivos:**
- **`.glass`**: Efecto vidrio esmerilado
  - `backdrop-filter: blur(18px)`
  - Fondo semi-transparente + bordes sutiles

- **`.btn-glow`**: Botones con efecto glow al hover
  - Transiciones suaves de sombra y transform
  - Sombra violeta al hover + translateY(-1px)

- **`.shadow-glass`**: Sombras para elementos glass

**Animaciones:**
- **`.animate-shimmer`**: Shimmer effect para QuotaWidget
  - Keyframes: translateX(-100%) → translateX(100%)
  - Duración: 3s infinite

#### Responsive Design
- **Mobile-first**: Base 320px+ (smartphones)
- **Breakpoints Tailwind**:
  - `sm`: 640px+ (tablets pequeñas)
  - `md`: 768px+ (tablets)
  - `lg`: 1024px+ (laptops)
  - `xl`: 1280px+ (desktops)
- **Componentes adaptativos**: Menús hamburguesa en móvil, navegación horizontal en desktop

#### Accesibilidad
- **Navegación por teclado**: Focus rings visibles
- **ARIA labels**: Botones y elementos interactivos etiquetados
- **Contraste**: WCAG AA compliant
- **Hover states**: Feedback visual en todos los elementos interactivos

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

