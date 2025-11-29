# StudyForge

**Sistema de apoyo al aprendizaje con Inteligencia Artificial**

StudyForge es una aplicación web que utiliza IA para ayudar a estudiantes en su proceso de aprendizaje mediante la generación de resúmenes personalizados y cuestionarios adaptativos.

---

## 🎯 Características Principales

### 1. **Generación de Resúmenes Inteligentes**
- Carga y almacenamiento de documentos en múltiples formatos: **PDF, DOCX, PPTX, TXT**
- Resúmenes adaptados a 3 niveles de expertise:
  - **Básico**: Vocabulario simple y conceptos fundamentales
  - **Medio**: Balance entre detalle y claridad
  - **Avanzado**: Análisis técnico y profundo
- Identificación automática de temas y conceptos clave
- Sistema de cuotas de almacenamiento (5GB por defecto, configurable)
- Reutilización de documentos almacenados para múltiples resúmenes
- **Preservación histórica**: Información de origen disponible incluso después de eliminar documentos fuente

### 2. **Cuestionarios Adaptativos**
- Generación automática de preguntas de opción múltiple (almacenadas en JSON)
- Cantidad de preguntas adaptable (máximo 30 por cuestionario)
- Dificultad adaptativa basada en desempeño histórico (últimos 5 intentos)
- Randomización de opciones en cada intento para evitar memorización
- Opción de cuestionario completo o por tema específico
- **Feedback inmediato** con explicaciones detalladas

### 3. **Seguimiento de Progreso**
- Historial de cuestionarios realizados
- Estadísticas de desempeño por tema
- Adaptación automática de dificultad según resultados

### 4. **Espacios de Estudio (Study Spaces)**
- Organización de documentos, resúmenes y quizzes por tema o materia
- Gestión visual con códigos de color personalizables
- Vinculación many-to-many de recursos
- Generación de quizzes desde espacios completos
- Estadísticas por espacio de estudio

---

## 🛠️ Stack Tecnológico

### Backend
- **Python**: 3.14
- **Framework**: FastAPI
- **Base de datos**: PostgreSQL 18
- **ORM**: SQLAlchemy 2.0
- **Migraciones**: Alembic
- **Autenticación**: JWT (python-jose + Argon2)
- **IA**: OpenAI API (GPT-4o-mini)
- **Procesamiento de archivos**:
  - PDF: PyPDF2, pdfplumber
  - Office (DOCX, PPTX): python-docx, python-pptx
  - Texto: Nativo Python

### Frontend
- **Node**: 24
- **Bundler**: Vite
- **Framework**: React 19
- **Lenguaje**: TypeScript 5.8
- **Estilos**: Tailwind CSS
- **Gestor de paquetes**: pnpm
- **Visualización de datos**: Recharts

### Deployment
- **Hosting**: Render / Google Cloud Platform
- **CI/CD**: GitHub Actions (próximamente)

---

## 📋 Requisitos

- **Python 3.14**
- **PostgreSQL 18**
- **Node.js 24**
- **pnpm 10+**
- **OpenAI API Key**

---

## 🚀 Instalación y Configuración

### 1. Clonar el Repositorio

```bash
git clone https://github.com/tu-usuario/studyforge.git
cd studyforge
```

### 2. Configurar Base de Datos PostgreSQL

Ejecuta el script SQL como superusuario de PostgreSQL:

```bash
psql -U postgres -f backend/setup_database.sql
```

Esto creará:
- Base de datos `studyforge`
- Schema `studyforge`
- Roles `studyforge_owner` (migraciones) y `studyforge_app` (runtime)

**Importante**: Cambia las contraseñas en el script antes de ejecutarlo en producción.

### 3. Configurar Backend

#### 3.1. Crear entorno virtual e instalar dependencias

**IMPORTANTE**: El entorno virtual se crea en `backend/`.

```bash
cd backend
python -m venv .venv

# Windows
.\.venv\Scripts\Activate.ps1

# Linux/Mac
source .venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt
```

#### 3.2. Configurar variables de entorno

Crea dos archivos de configuración:

**`backend/.env`** (para la aplicación):
```env
DATABASE_URL=postgresql+psycopg://studyforge_app:password@localhost:5432/studyforge?options=-csearch_path=studyforge,public
SECRET_KEY=tu-clave-secreta-super-segura-cambiar-en-produccion
OPENAI_API_KEY=sk-tu-api-key-de-openai
ENV=development
DEBUG=True
```

**`backend/.env.alembic`** (para migraciones):
```env
ALEMBIC_URL=postgresql+psycopg://studyforge_owner:password@localhost:5432/studyforge?options=-csearch_path=studyforge,public
```

#### 3.3. Ejecutar migraciones

```bash
# Verificar estado actual
alembic current

# Crear migración inicial (si no existe)
alembic revision --autogenerate -m "Crear tablas iniciales"

# Aplicar migraciones
alembic upgrade head
```

### 4. Configurar Frontend

```bash
cd frontend
pnpm install
```

---

## 🎮 Ejecución

### Backend (puerto 8000)

```bash
cd backend
.\.venv\Scripts\Activate.ps1  # Windows
# source .venv/bin/activate   # Linux/Mac

uvicorn app.main:app --reload
```

Documentación API: [http://localhost:8000/docs](http://localhost:8000/docs)

### Frontend (puerto 5173)

```bash
cd frontend
pnpm dev
```

Aplicación: [http://localhost:5173](http://localhost:5173)

---

## 📚 Estructura del Proyecto

```
StudyForge/
├── backend/                  # API REST con FastAPI
│   ├── .venv/                # Entorno virtual de Python (no versionado)
│   ├── app/
│   │   ├── core/             # Seguridad, dependencias
│   │   ├── models/           # Modelos SQLAlchemy
│   │   ├── schemas/          # Schemas Pydantic (validación)
│   │   ├── routers/          # Endpoints HTTP (FastAPI routers)
│   │   ├── services/         # Lógica de negocio
│   │   ├── repositories/     # Acceso a datos (CRUD)
│   │   ├── config.py         # Configuración central de la aplicación
│   │   ├── db.py             # Configuración BD
│   │   └── main.py           # App FastAPI
│   ├── tests/
│   ├── requirements.txt      # Dependencias Python
│   ├── setup_database.sql    # Script de configuración BD (schema + roles)
│   ├── .env.example          # Ejemplo de variables de entorno
│   └── alembic.ini           # Configuración de Alembic
│
├── frontend/                 # SPA con React 19
│   ├── public/               # Archivos estáticos
│   ├── src/
│   │   ├── components/       # Componentes reutilizables
│   │   │   ├── auth/         # Componentes de autenticación
│   │   │   ├── features/     # Componentes de features
│   │   │   ├── layout/       # Navbar, headers, etc.
│   │   │   └── ui/           # Componentes UI reutilizables
│   │   ├── pages/            # Páginas principales (React Router)
│   │   │   ├── auth/         # Login, signup, forgot password
│   │   │   ├── documents/    # Gestión de documentos
│   │   │   ├── summaries/    # Resúmenes
│   │   │   ├── quizzes/      # Cuestionarios
│   │   │   ├── study-spaces/ # Espacios de estudio
│   │   │   ├── stats/        # Estadísticas
│   │   │   └── public/       # Páginas públicas (features, about)
│   │   ├── context/          # Estado global (Context API)
│   │   ├── services/         # Capa de servicios HTTP
│   │   │   └── api/          # Módulos de API por dominio
│   │   ├── types/            # Definiciones TypeScript
│   │   ├── assets/           # Imágenes, íconos
│   │   ├── main.tsx          # Entry point + configuración de rutas
│   │   └── index.css         # Estilos globales (Tailwind)
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
└── docs/                     # Documentación técnica
    ├── ARCHITECTURE.md       # Arquitectura de alto nivel (optimizado para diagramas 4+1)
    ├── DATABASE.md           # Modelo de datos, índices, migraciones
    ├── INTEGRATION.md        # Flujos end-to-end detallados (para diagramas de secuencia)
    ├── API.md                # Documentación completa de endpoints REST
    ├── SECURITY.md           # Consideraciones de seguridad y privacidad
    ├── DECISIONS.md          # Registro de decisiones técnicas con justificación
    ├── IMPLEMENTATION.md     # Estado de implementación (checklist)
    ├── NEXT_STEPS.md         # Próximos pasos y tareas pendientes
    ├── ROADMAP.md            # Plan de desarrollo a largo plazo (fases)
    └── updates/              # Actualizaciones técnicas archivadas
```

**Arquitectura en capas** (Backend):
- **Models** → **Repositories** → **Services** → **Routers**
- Separación clara de responsabilidades
- Testabilidad y mantenibilidad

**Documentación detallada**:
- Vista general: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- Base de datos: [docs/DATABASE.md](docs/DATABASE.md)
- Flujos de integración: [docs/INTEGRATION.md](docs/INTEGRATION.md)
- API REST: [docs/API.md](docs/API.md)

---

## 🔐 Seguridad

- **Contraseñas**: Hash con Argon2id (más seguro que bcrypt)
- **Autenticación**: JWT stateless con expiración de 24 horas
- **Privacidad**: Aislamiento total de datos por usuario (ownership validation)
- **Cuotas**: Sistema de cuotas de almacenamiento por usuario (5GB por defecto)
- **Validación**: Pydantic para todos los datos de entrada + magic numbers para archivos
- **Rate Limiting**: Middleware de límites de peticiones
- **Límites de archivo**: Configurable por usuario (máximo 50MB por defecto)
- **Base de datos**: Roles separados para migraciones (owner) y runtime (app)

Ver detalles completos en [docs/SECURITY.md](docs/SECURITY.md)

---

## 📖 API Endpoints

La API REST de StudyForge ofrece endpoints para autenticación, gestión de resúmenes, cuestionarios y estadísticas.

**Recursos principales:**
- **Autenticación** (`/auth`): Registro, login, perfil de usuario
- **Documentos** (`/documents`): Upload, gestión y almacenamiento de archivos
- **Resúmenes** (`/summaries`): Crear, listar, obtener, eliminar resúmenes
- **Cuestionarios** (`/quizzes`): Generar y gestionar cuestionarios
- **Intentos** (`/quiz-attempts`): Realizar cuestionarios y obtener resultados
- **Espacios de Estudio** (`/study-spaces`): Organizar recursos por tema/materia
- **Estadísticas** (`/stats`): Progreso, desempeño y resumen de actividad

**Documentación completa**: Ver [docs/API.md](docs/API.md) para detalles de todos los endpoints, parámetros, respuestas y ejemplos.

**Documentación interactiva**: [http://localhost:8000/docs](http://localhost:8000/docs) (disponible cuando el servidor está corriendo)

---

## 🧪 Testing

```bash
cd backend
pytest
```

---

## 🚢 Deployment

### Render

#### Backend
1. Crear Web Service en Render
2. Conectar repositorio
3. Build Command: `pip install -r requirements.txt && alembic upgrade head`
4. Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Agregar base de datos PostgreSQL
6. Configurar variables de entorno

#### Frontend
1. Crear Static Site en Render
2. Build Command: `pnpm install && pnpm build`
3. Publish Directory: `dist`

### Google Cloud Platform
Ver documentación en `docs/deployment/gcp.md` (próximamente)

---

## 🗺️ Roadmap

### Backend ✅
- [x] Arquitectura y diseño del sistema
- [x] Modelos de base de datos
- [x] Configuración de migraciones
- [x] Sistema de autenticación JWT
- [x] Procesamiento de archivos (PDF/DOCX/PPTX/TXT)
- [x] Integración con OpenAI GPT-4o-mini
- [x] Generación de resúmenes adaptativos
- [x] Generación de cuestionarios
- [x] Sistema adaptativo de dificultad
- [x] Sistema de cuotas por usuario
- [x] API documentada con Swagger/OpenAPI

### Frontend MVP ✅
- [x] Sistema de autenticación (login/signup/forgot password)
- [x] Gestión de documentos con drag-and-drop
- [x] Sistema de resúmenes (lista, creación, detalle)
- [x] Sistema de quizzes (lista, generación, toma, resultados)
- [x] Espacios de estudio (organización de recursos)
- [x] Dashboard de estadísticas con gráficos
- [x] Diseño responsivo con Tailwind CSS
- [x] Integración completa con API backend
- [x] Landing page para usuarios no autenticados

### Pendiente 📋
- [ ] Página de perfil de usuario editable
- [ ] Tests unitarios
- [ ] Tests de integración
- [ ] Tests E2E
- [ ] CI/CD pipeline
- [ ] Deployment a producción

---

## 📄 Licencia

WIP

---

## 🤝 Contribución

Este es un proyecto universitario. Las contribuciones están limitadas al equipo de desarrollo.

---

## 📞 Soporte

Para reportar problemas o sugerencias, crear un issue en el repositorio.

---

**Desarrollado con ❤️ para mejorar el aprendizaje estudiantil**
