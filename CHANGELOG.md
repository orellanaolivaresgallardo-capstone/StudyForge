# Changelog

Todos los cambios notables de este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/),
y este proyecto adhiere a [Versionado Semántico](https://semver.org/lang/es/).

---

## [Unreleased]

### Added
- Agentes personalizados de Claude para automatización:
  - `test-runner`: Ejecuta tests automáticamente y propone fixes
  - `studyforge-assistant`: Experto en la arquitectura del proyecto
  - `security-reviewer`: Auditoría de seguridad automática
  - `docs-maintainer`: Sincronización de documentación
  - `commit-organizer`: Organiza commits siguiendo Conventional Commits
- Archivos de convenciones para consistencia de código:
  - `code-style.md`: Reglas de sintaxis y formato
  - `testing-guide.md`: Patrones de testing
  - `conventional-commits.md`: Formato de mensajes de commit
- Sistema de audit logging para operaciones críticas de seguridad
- Documentación de cumplimiento ISO 27001:
  - Checklist de controles implementados (A.9, A.10, A.12.4, A.14)
  - Análisis de riesgos y plan de tratamiento
  - Políticas de seguridad (control de acceso, desarrollo seguro)
  - Guía de implementación de controles
- Skill de diagnóstico de salud de base de datos
- Sistema de logging de errores SQL con endpoints de prueba
- Tests exhaustivos para frontend (hooks, componentes UI, contextos)
- Tests exhaustivos para backend (routers, services, repositories)
- Plan de análisis de cobertura de tests del frontend

### Changed
- Migración de `@app.on_event()` a `lifespan` context manager (patrón moderno de FastAPI)
- Refactorización del frontend para cumplir regla de <100 líneas por componente:
  - `StudySpaceDetailPage`: 910 → 325 líneas (-64%)
  - `SummariesPage`: 531 → 241 líneas (-55%)
  - `StudySpacesPage`: 418 → 175 líneas (-58%)
  - `SummaryCard`: 206 → 114 líneas (-45%)
  - Extracción de hooks reutilizables (useStudySpace, useSummariesData, useStudySpacesData)
  - Creación de modales modulares (AddSummaryModal, CreateQuizModal, EditSpaceModal)
  - Componentes UI compartidos (ConfirmModal, EmptyState, LoadingSpinner)
- Implementación de Navbar persistente con rutas anidadas
- Optimización de consultas de base de datos con carga selectiva de campos
- Mejora de visibilidad, contraste y manejo de overflow en componentes UI

### Fixed
- Errores en tests de integración (infraestructura y endpoints)
- Incompatibilidad JSONB/SQLite en tests de integración
- Comparación UUID string/object para compatibilidad con SQLite
- Test `test_setup_logging_default_level` configurando mocks correctamente
- Infinite render loop en páginas refactorizadas
- Errores TypeScript después de refactorización
- 3 bugs críticos del frontend y backend:
  - Tipo de datos en `SummaryDetailResponse` (documents → document)
  - Errores de navegación (páginas Profile y Settings faltantes)
  - Falta de `.unique()` en `document_repository.get_by_id()`

### Removed
- Tests de integración basados en SQLite (en favor de PostgreSQL)
- Código muerto: `app/repositories/models.py`
- Archivos `__init__.py` no utilizados y documento de prueba

### Documentation
- Actualización de `FRONTEND_TESTING_COVERAGE.md` con resultados de Fases 1, 2 y 3
- Actualización de `REFACTORING_ANALYSIS.md` con resultados de implementación
- Actualización de `FRONTEND_REFACTORING.md` con progreso de refactorización
- Análisis detallado de refactorización de componentes restantes
- Análisis completo de cobertura de testing del frontend
- Documentación completa de componentes UI en `docs/COMPONENTS.md`
- Actualización de schema de response de Summary en `API.md`
- Análisis de fallas de tests de integración

### Testing
- Cobertura de `QuizService`: 32% → 95%
- Cobertura de `security`: 59% → 100%
- Cobertura de `file_validator`: 50% → 100%
- Cobertura de `auth router`: 80% → 100%
- Cobertura de `documents router`: 33% → 99%
- Cobertura de `summaries router`: 56% → 100%
- Cobertura de `quizzes router`: 45% → 100%
- Cobertura de `study_spaces router`: 44% → 85%
- Cobertura de `stats router`: 0% → 100%
- Cobertura de `quiz_attempts router`: 0% → 100%
- Tests E2E exhaustivos para backend añadidos
- 50 tests para Badges (100% pasando)
- 38 tests para Cards (100% pasando)
- 26 tests para ConfirmModal (100% pasando)
- 27 tests para PerformanceChart (100% pasando)
- 21 tests para useStudySpace hook (100% pasando)
- 20 tests para useSummariesData hook (100% pasando)
- 16 tests para useStudySpacesData hook (100% pasando)
- 13 tests para StorageContext (100% pasando)
- 37 tests fallando del frontend corregidos (Fase 1 completada)

---

## [0.9.0] - 2025-11-26/28 - Espacios de Estudio y Denormalización

### Added
- **Feature completo de Espacios de Estudio** (Study Spaces):
  - Backend: Modelos, repositorios, servicios, routers
  - Frontend: Página de listado, página de detalle, modales de creación/edición
  - Organización jerárquica de contenido por tema/materia
  - Asociación de documentos, resúmenes y quizzes a espacios
- **Denormalización de datos** para mejorar performance y preservación histórica:
  - Refactorización de modelos Summary y Quiz para rastreo de fuente
  - Campos denormalizados: `source_document_title`, `source_document_filename`, `document_state`
  - Triggers de base de datos para mantener sincronización automática
  - Relación 1-N entre Summary y StudySpace (antes N-N)
  - Eliminación en cascada mejorada con preservación histórica
- Componentes UI reutilizables:
  - `LoadingSpinner`, `EmptyState` (estados compartidos)
  - `StudySpaceHeader` (encabezado de espacio de estudio)
  - Refactorización de componentes y páginas en carpetas basadas en features
- Modal de confirmación seguro para eliminación de espacios con advertencia de cascada
- Modal de confirmación reutilizable para reemplazar `confirm()` nativo
- Eliminación del botón "Agregar Resumen" y bloqueo de modales durante llamadas a OpenAI
- Contexto de Storage (`StorageContext`) para actualizaciones reactivas de QuotaWidget

### Changed
- Refactorización de relación summary-space de N-N a 1-N
- Refactorización de modelos usando estilo `SQLAlchemy Mapped[]` (patrón moderno)
- Actualización de repositorios y servicios para nueva estructura de BD
- Actualización de schemas para soporte de source tracking
- Refactorización de queries SQLAlchemy para usar `.unique()` con `joinedload`
- Mejora de logging configurable para archivos y SQL

### Fixed
- Eliminación de páginas Profile y Settings faltantes que causaban errores de navegación

### Documentation
- Actualización de `API.md` con schema de response de Summary
- Documentación completa de componentes UI en `docs/COMPONENTS.md`
- Adición de rastreo de fuente y denormalización a documentación
- Actualización de tests para nuevos campos de quiz y summary source
- Actualización de tests para campos denormalizados y eliminación en cascada
- Actualización de routers de espacios y tests de routers de espacios

### Testing
- Tests exhaustivos para routers de espacios
- Tests actualizados para reflejar nueva estructura de BD
- Tests de denormalización y preservación histórica

---

## [0.8.0] - 2025-11-20/25 - Rediseño del Sistema de Quizzes

### Added
- Sistema de quizzes completamente funcional en frontend:
  - Página de listado de quizzes
  - Página de intento de quiz (QuizAttemptPage)
  - Página de resultados (QuizResultsPage)
  - Generación de quizzes desde resúmenes
  - Validación de respuestas y puntuación
- Validación de rango 5-30 preguntas para generación de quizzes
- Chequeo de `None` para contenido de respuesta de OpenAI

### Changed
- **Rediseño completo del sistema de quizzes** para usar estructura JSON:
  - Eliminación de modelos `Question` y `Answer` (antes tablas separadas)
  - Almacenamiento de preguntas y respuestas en campo JSONB `questions`
  - Simplificación de queries y mejora de performance
  - Migración Alembic para nueva estructura
- Refinamiento de schema y permisos de base de datos
- Actualización de guía de setup con instrucciones de contraseñas de producción

### Fixed
- Path de import para página Home (case sensitivity)

### Documentation
- Actualización de docs para MVP de frontend completado
- Documentación de nueva estructura JSON de quizzes

---

## [0.7.0] - 2025-11-19 - Almacenamiento de Documentos y Sistema de Cuotas

### Added
- **Almacenamiento persistente de documentos** con reutilización:
  - Campo `file_content` (BYTEA) para almacenar archivo original
  - Campo `extracted_text` para texto extraído
  - Tabla junction `summary_documents` para soporte de multi-documento
  - Posibilidad de generar resúmenes desde múltiples documentos
- **Sistema de cuotas de almacenamiento**:
  - Campo `storage_quota_bytes` y `storage_used_bytes` en modelo User
  - Endpoints `/documents/storage-info` para verificar cuota
  - Validación de cuota antes de upload
  - QuotaWidget en frontend para mostrar uso de almacenamiento
- **Validación segura de archivos**:
  - Validación de magic numbers (no confiar en extensión)
  - Rate limiting para prevenir abuso
  - Logging estructurado de eventos de seguridad
- **Generación de resúmenes desde documentos almacenados**:
  - Endpoint `/summaries/from-documents` con `document_ids`
  - Soporte para 1-2 documentos por resumen
  - Reutilización de documentos para múltiples resúmenes
- Soporte completo para PDF y DOCX (eliminación de formatos legacy .doc, .xls)
- Endpoints de gestión de documentos:
  - GET `/documents` - Listar documentos del usuario
  - POST `/documents/upload` - Subir documento
  - GET `/documents/{id}` - Obtener detalles
  - DELETE `/documents/{id}` - Eliminar documento
- **Validación de ownership** refactorizada:
  - Funciones `verify_*_ownership()` en `core/dependencies.py`
  - Validación consistente en todos los endpoints protegidos

### Changed
- Refactorización de estructura de backend:
  - Migración de repositorios a capa de datos dedicada
  - Separación clara de concerns: Router → Service → Repository → Model
  - Type hints obligatorios en todas las funciones
  - Uso de SQLAlchemy 2.0 modern API (`select()` en lugar de `query()`)
- Refactorización de modelos Document y Summary:
  - Document ahora almacena contenido completo
  - Summary referencia documentos fuente
  - Relación N-N entre Summary y Document
- Actualización de `.gitignore` para excluir archivos de entorno Alembic
- Actualización de `CLAUDE.md` con guía completa para asistentes AI

### Fixed
- Type hints y comentarios `type: ignore` en chequeos de ownership

### Documentation
- Adición de `CLAUDE.md` - Guía exhaustiva para asistentes AI del proyecto
- Adición de `docs/SECURITY.md` - Documentación de modelo de seguridad
- Actualización de documentación y corrección de codificación
- Actualización de `NEXT_STEPS.md` con progreso

---

## [0.6.0] - 2025-11-01/18 - Frontend SPA Completo

### Added
- **Dashboard de estadísticas** (StatsPage):
  - Integración con endpoints `/stats/*`
  - Visualización de progreso con gráficos (Recharts)
  - Métricas de resúmenes, quizzes, documentos
  - Performance por nivel de expertise
- **Página de detalle de resumen** (SummaryDetailPage):
  - Visualización de contenido estructurado (JSONB)
  - Secciones: resumen, puntos clave, secciones detalladas
  - Botón para generar quiz desde resumen
- **Página de resúmenes** (SummariesPage):
  - Listado de resúmenes del usuario
  - Filtrado por nivel de expertise
  - Generación de nuevos resúmenes
- **Contexto de autenticación** (AuthContext):
  - Estado global de usuario autenticado
  - Funciones `login`, `logout`, `checkAuth`
  - Persistencia de token JWT en localStorage
  - ProtectedRoute para rutas privadas

### Changed
- **Refactorización completa a SPA pura con React Router v7**:
  - Eliminación de 8 archivos HTML estáticos
  - Creación de `LandingPage.tsx` y `HomePage.tsx`
  - Renderizado condicional basado en estado de autenticación
  - Navegación client-side sin recargas de página
  - Mejor UX y mantenibilidad

### Removed
- Archivos HTML estáticos (login.html, signup.html, home.html, etc.)
- Lógica de autenticación duplicada en múltiples páginas

### Documentation
- Actualización de README para milestone DB+API+Front
- Documentación de arquitectura SPA

---

## [0.5.0] - 2025-10-07/31 - APIs Core del Backend

### Added
- **Endpoints de resúmenes**:
  - POST `/summaries` - Generar resumen con OpenAI GPT-4o-mini
  - GET `/summaries` - Listar resúmenes del usuario
  - GET `/summaries/{id}` - Obtener detalle de resumen
  - DELETE `/summaries/{id}` - Eliminar resumen
  - Soporte para 3 niveles de expertise: básico, medio, avanzado
- **Endpoints de quizzes**:
  - POST `/quizzes` - Generar quiz adaptativo
  - GET `/quizzes` - Listar quizzes del usuario
  - GET `/quizzes/{id}` - Obtener detalle de quiz
  - DELETE `/quizzes/{id}` - Eliminar quiz
- **Endpoints de intentos de quiz**:
  - POST `/quiz-attempts` - Iniciar intento (randomiza opciones)
  - POST `/quiz-attempts/{id}/submit` - Enviar respuestas y obtener puntuación
  - GET `/quiz-attempts/{id}` - Obtener resultado de intento
- **Endpoints de estadísticas**:
  - GET `/stats/summary` - Resumen general de progreso
  - GET `/stats/quiz-performance` - Performance en quizzes
  - GET `/stats/expertise-distribution` - Distribución por nivel
- **Sistema de dificultad adaptativa**:
  - Cálculo basado en últimos 5 intentos
  - Ajuste automático de número de preguntas
  - Algoritmo en `QuizService.calculate_adaptive_difficulty()`
- **Protección de endpoints**:
  - Dependencia `get_current_user` en todos los endpoints
  - Validación de ownership de recursos
  - Aislamiento completo de datos por usuario

### Changed
- Organización de routers por dominio (auth, documents, summaries, quizzes, etc.)
- Validación de entrada con Pydantic v2 en todos los endpoints
- Manejo de errores con HTTPException y códigos apropiados

### Fixed
- Validación de ownership consistente en todos los endpoints

---

## [0.4.0] - 2025-10-06 - Schema de Base de Datos PostgreSQL

### Added
- **Tablas principales**:
  - `users` - Usuarios con quotas de almacenamiento
  - `documents` - Almacenamiento de documentos (PDF, DOCX, PPTX, TXT)
  - `summaries` - Resúmenes generados con contenido JSONB
  - `quizzes` - Quizzes con preguntas en JSONB
  - `quiz_attempts` - Intentos de quiz con respuestas randomizadas
  - `summary_documents` - Tabla junction N-N
- **Sistema de migraciones Alembic**:
  - Configuración para schema `studyforge`
  - Variables de entorno separadas (`.env` vs `.env.alembic`)
  - Migración idempotente de CHECKs
  - Script `setup_database.sql` para inicialización
- **Validaciones de integridad**:
  - CHECK constraints para campos not blank
  - Normalización de email (lowercase)
  - Validación de expertise_level ENUM
  - Foreign keys con ON DELETE CASCADE
- **Índices de performance**:
  - Índice en `users.email` (UNIQUE)
  - Índice en `documents.user_id`
  - Índice en `summaries.user_id`
  - Índice en `quizzes.user_id`

### Changed
- Uso de schema `studyforge` en lugar de `public`
- Roles separados de base de datos:
  - `studyforge_owner` para DDL (migraciones)
  - `studyforge_app` para DML (runtime)
- UUIDs como primary keys en todas las tablas
- Campos JSONB para contenido estructurado (summaries, quizzes)

### Documentation
- Adición de enlaces a documentación en README
- Adición de SUMMARY, DECISIONS, NEXT_STEPS y ROADMAP

---

## [0.3.0] - 2025-10-07 - Sistema de Autenticación

### Added
- **Endpoints de autenticación**:
  - POST `/auth/register` - Registro de usuarios
  - POST `/auth/login` - Login con JWT
  - GET `/auth/me` - Obtener usuario actual
- **Seguridad**:
  - Hashing de passwords con **Argon2id** (más seguro que bcrypt)
  - Tokens JWT con firma HS256
  - Expiración de tokens configurable (default 24h)
  - Secret key configurable vía `SECRET_KEY` env var
- **Dependencia `get_current_user`**:
  - Extracción y validación de JWT
  - Verificación de usuario en base de datos
  - Uso en todos los endpoints protegidos

### Changed
- Protección de endpoints de documentos con autenticación
- Ownership de documentos por `user_id`

### Fixed
- Validación de tokens expirados

---

## [0.2.0] - 2025-09-23/10-04 - Setup Inicial y Walking Skeleton

### Added
- **Estructura base del repositorio**:
  - Carpetas `backend/`, `frontend/`, `docs/`
  - `.gitkeep` para mantener estructura
- **Backend FastAPI**:
  - Endpoint `/health` para health check
  - Estructura de paquetes: `app/routers`, `app/schemas`, `app/services`, `app/repositories`
  - Scaffold de documentos con almacenamiento in-memory
  - Configuración CORS para desarrollo
- **Integración SQLAlchemy**:
  - Configuración de engine y Base
  - Session management con `get_db` dependency
  - Creación automática de tablas al iniciar
- **Frontend estático inicial**:
  - Páginas HTML para login, signup, home, upload
  - Navegación básica entre páginas
- **Documentación**:
  - README inicial con instrucciones de setup
  - Descripción del proyecto y arquitectura

### Changed
- Migración de `/health` de función a APIRouter
- Refactorización de API para usar routers modulares

---

## [0.1.0] - 2025-08-18/09-01 - Bootstrap del Proyecto

### Added
- Estructura inicial de carpetas para Fase 1
- Evidencias grupales:
  - Guía del estudiante Fase 1
  - Presentación del proyecto StudyForge
  - Planilla de evaluación
- Evidencias individuales:
  - Autoevaluación de competencias
  - Diario de reflexión
  - Autoevaluación de fase

### Changed
- Organización de evidencias en carpetas estructuradas
- Actualización iterativa de documentos de fase
- Cambio en roles del equipo

### Documentation
- Creación de repositorio GitHub
- Definición inicial del proyecto StudyForge

---

## Leyenda de Tipos de Cambios

- **Added**: Nuevas funcionalidades o features
- **Changed**: Cambios en funcionalidades existentes
- **Deprecated**: Funcionalidades que serán eliminadas en futuras versiones
- **Removed**: Funcionalidades eliminadas
- **Fixed**: Corrección de bugs
- **Security**: Cambios relacionados con seguridad
- **Documentation**: Cambios solo en documentación
- **Testing**: Adición o actualización de tests

---

## Enlaces

- [Repositorio GitHub](https://github.com/orellanaolivaresgallardo-capstone/StudyForge)
- [Documentación Técnica](docs/)
- [Guía para Asistentes AI](CLAUDE.md)
