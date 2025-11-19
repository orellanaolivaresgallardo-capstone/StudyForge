# StudyForge — Resumen de contexto

**Última actualización:** 2025-01-19

**Branch actual:** `remake`

Este documento resume el estado actual del proyecto StudyForge, una aplicación web de apoyo al aprendizaje con IA que genera resúmenes adaptativos y quizzes inteligentes a partir de documentos.

---

## 1) Visión del producto

StudyForge es una plataforma educativa que utiliza inteligencia artificial para:
- Generar resúmenes personalizados de documentos en 3 niveles de expertise (básico, medio, avanzado)
- Identificar automáticamente temas y conceptos clave
- Crear quizzes adaptativos con feedback inmediato
- Ajustar dificultad basándose en el desempeño del usuario
- Proteger la privacidad (no almacena documentos originales)

---

## 2) Stack tecnológico

### Backend
- **Framework:** FastAPI 0.115.12 (Python 3.14)
- **Base de datos:** PostgreSQL 18 con schema `studyforge`
- **ORM:** SQLAlchemy 2.0.36
- **Migraciones:** Alembic 1.17.2
- **Autenticación:** JWT (python-jose) + Argon2 hashing
- **IA:** OpenAI API (GPT-4o-mini)
- **Procesamiento:** PyPDF2, pdfplumber, python-pptx, python-docx

### Frontend
- **Framework:** React 19 + TypeScript 5.8
- **Build:** Vite
- **Estilos:** Tailwind CSS
- **Package manager:** pnpm

### Infraestructura
- **Target:** Render o GCP
- **SO:** Windows (encoding UTF-8 CRLF)

---

## 3) Arquitectura del backend

### Capas (Layered Architecture)
1. **Models** (`app/models/`) - Definición de tablas SQLAlchemy
2. **Repositories** (`app/repositories/`) - Acceso a datos (CRUD)
3. **Services** (`app/services/`) - Lógica de negocio
4. **Routers** (`app/routers/`) - Endpoints HTTP

### Modelos de datos
- **users** - Información de usuarios (UUID PK, email único, password hash, cuotas configurables)
- **documents** - Documentos almacenados por usuario (file_content, extracted_text)
- **summaries** - Resúmenes generados por IA (JSONB content)
- **summary_documents** - Relación many-to-many entre summaries y documents
- **quizzes** - Cuestionarios generados
- **questions** - Preguntas de opción múltiple (A/B/C/D)
- **quiz_attempts** - Intentos de usuario
- **answers** - Respuestas individuales con feedback

### Roles de base de datos
- **studyforge_owner** - Para migraciones (DDL permissions)
- **studyforge_app** - Para aplicación (DML permissions)

---

## 4) Funcionalidades implementadas

### ✅ Autenticación y usuarios
- Registro de usuarios con validación
- Login con JWT (expiración 24h)
- Hashing con Argon2id
- Protección de endpoints con dependencias

### ✅ Gestión de documentos
- Upload y almacenamiento de archivos (PDF, DOCX, PPTX, TXT)
- Sistema de cuotas por usuario (5GB por defecto, configurable)
- Validación de tamaño máximo por archivo (50MB por defecto, configurable)
- Extracción y cache de texto para búsqueda
- CRUD completo de documentos con validación de ownership
- Tracking de uso de almacenamiento en tiempo real

### ✅ Gestión de resúmenes
- Generación de resúmenes con OpenAI desde documentos almacenados
- Soporte para múltiples documentos por resumen (hasta 2 por defecto, configurable)
- 3 niveles de expertise (básico, medio, avanzado)
- Identificación automática de temas y conceptos clave
- CRUD completo de resúmenes con validación de ownership
- Relación many-to-many con documentos

### ✅ Sistema de quizzes
- Generación desde archivo o resumen existente
- Dificultad adaptativa (1-5) basada en últimos 5 intentos
- Máximo 30 preguntas por quiz
- Feedback inmediato por pregunta
  - Indica si es correcta/incorrecta
  - Muestra respuesta correcta
  - Proporciona explicación
- Resultados detallados con score y desglose
- Historial de intentos por usuario

### ✅ Estadísticas y progreso
- Progreso por tema
- Historial de desempeño
- Métricas de usuario (total summaries, quizzes, scores)

---

## 5) API Endpoints

### Autenticación (`/auth`)
- `POST /auth/register` - Registrar nuevo usuario
- `POST /auth/login` - Autenticar y obtener token
- `GET /auth/me` - Información del usuario actual (incluye cuotas)

### Documentos (`/documents`)
- `POST /documents` - Subir y almacenar documento (validación de cuota)
- `GET /documents` - Listar documentos del usuario
- `GET /documents/storage` - Información de uso de almacenamiento
- `GET /documents/{id}` - Obtener documento específico
- `PATCH /documents/{id}` - Actualizar título del documento
- `DELETE /documents/{id}` - Eliminar documento (libera espacio)

### Resúmenes (`/summaries`)
- `POST /summaries/upload` - Subir archivo y generar resumen
- `GET /summaries` - Listar resúmenes del usuario
- `GET /summaries/{id}` - Obtener resumen específico
- `DELETE /summaries/{id}` - Eliminar resumen

### Quizzes (`/quizzes`)
- `POST /quizzes/generate-from-file` - Generar desde archivo
- `POST /quizzes/generate-from-summary/{id}` - Generar desde resumen
- `GET /quizzes` - Listar quizzes del usuario
- `GET /quizzes/{id}` - Obtener quiz (sin respuestas correctas)

### Intentos de quiz (`/quiz-attempts`)
- `POST /quiz-attempts` - Iniciar nuevo intento
- `POST /quiz-attempts/{id}/answer` - Responder pregunta (feedback inmediato)
- `POST /quiz-attempts/{id}/complete` - Completar intento y calcular score
- `GET /quiz-attempts/{id}/results` - Ver resultados detallados

### Estadísticas (`/stats`)
- `GET /stats/progress` - Progreso por tema
- `GET /stats/performance` - Historial de desempeño
- `GET /stats/summary` - Resumen general de estadísticas

### Sistema
- `GET /health` - Health check

**Documentación interactiva:** [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 6) Estado actual

### ✅ Completado
- [x] Backend 100% funcional
- [x] Base de datos configurada con migraciones
- [x] Todos los endpoints implementados y probados
- [x] Autenticación JWT funcionando
- [x] Sistema de almacenamiento de documentos
- [x] Sistema de cuotas por usuario (storage, file size, documents per summary)
- [x] Validaciones de ownership centralizadas para seguridad
- [x] Integración con OpenAI configurada
- [x] Procesamiento de archivos múltiples formatos
- [x] Sistema adaptativo de dificultad
- [x] API documentada con Swagger/OpenAPI
- [x] Encoding UTF-8 CRLF para Windows
- [x] Permisos de base de datos configurados
- [x] Type hints corregidos para SQLAlchemy

### ⏳ En progreso
- [ ] Frontend React (pendiente)
- [ ] Tests unitarios y de integración
- [ ] Deployment en staging

### 📋 Pendiente
- [ ] Frontend completo
- [ ] Testing comprehensivo
- [ ] CI/CD pipeline
- [ ] Deployment en producción
- [ ] Optimizaciones de performance
- [ ] Features avanzadas (spaced repetition, gamification, etc.)

---

## 7) Configuración local

### Prerrequisitos
- Python 3.14
- PostgreSQL 18
- Node.js + pnpm
- Cuenta de OpenAI con créditos

### Backend
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

### Variables de entorno (`.env`)
```env
# Database
DATABASE_URL=postgresql+psycopg://studyforge_app:password@localhost:5432/studyforge?options=-csearch_path=studyforge,public

# JWT
SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini

# Uploads
MAX_FILE_SIZE_MB=50
```

### Inicializar base de datos
```bash
# Como usuario postgres
psql -U postgres -f setup_database.sql

# Aplicar migraciones (como studyforge_owner)
alembic upgrade head

# Otorgar permisos a studyforge_app
python -c "from sqlalchemy import create_engine, text; ..."
```

### Ejecutar backend
```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### Frontend (cuando esté implementado)
```bash
cd frontend
pnpm install
pnpm dev
```

---

## 8) Decisiones técnicas clave

Consultar [docs/DECISIONS.md](DECISIONS.md) para detalles completos:

- UUID v4 como primary keys (seguridad, escalabilidad)
- Arquitectura en capas para separación de responsabilidades
- **Almacenamiento de documentos** con sistema de cuotas (cambio de política)
- Sistema de cuotas configurable por usuario (storage, file size, documents per summary)
- Validaciones de ownership centralizadas en dependencies.py
- Type ignore comments para compatibilidad SQLAlchemy con type checkers
- Argon2 sobre bcrypt (seguridad)
- OpenAI GPT-4o-mini (costo/calidad)
- Dificultad adaptativa basada en últimos 5 intentos
- JSONB para contenido flexible
- UTF-8 CRLF para compatibilidad Windows

---

## 9) Próximos pasos

### Inmediatos (1-2 semanas)
1. Implementar frontend MVP (auth + summaries + quizzes)
2. Escribir tests básicos del backend
3. Deploy en ambiente de staging

### Corto plazo (1 mes)
1. Testing completo (unit + integration + E2E)
2. CI/CD pipeline (GitHub Actions)
3. Optimizaciones de performance
4. Deployment en producción

### Mediano plazo (3 meses)
1. Features avanzadas (spaced repetition, exportación PDF)
2. Gamification (badges, streaks, leaderboards)
3. Compartir resúmenes y quizzes
4. Mobile responsiveness

Ver [docs/ROADMAP.md](ROADMAP.md) para plan completo.

---

## 10) Recursos y documentación

- **Arquitectura detallada:** [docs/ARCHITECTURE.md](ARCHITECTURE.md)
- **Plan de implementación:** [docs/IMPLEMENTATION.md](IMPLEMENTATION.md)
- **Próximos pasos:** [docs/NEXT_STEPS.md](NEXT_STEPS.md)
- **Decisiones técnicas:** [docs/DECISIONS.md](DECISIONS.md)
- **Roadmap completo:** [docs/ROADMAP.md](ROADMAP.md)
- **API docs (Swagger):** http://localhost:8000/docs
- **OpenAPI schema:** http://localhost:8000/openapi.json

---

## 11) Contacto y contribución

**Estado del proyecto:** Activo, en desarrollo
**Licencia:** (Pendiente definir)
**Contribuciones:** (Pendiente guía de contribución)

---

**Última compilación:** 2025-01-19
**Branch:** remake
**Versión:** 2.0.0 (reimplementación completa)
