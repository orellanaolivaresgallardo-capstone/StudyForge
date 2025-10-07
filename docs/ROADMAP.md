# ROADMAP — StudyForge

**Estado actual (punto de partida):** Backend FastAPI + PostgreSQL (schema `studyforge`) + Alembic + Frontend Vite/React funcionando de punta a punta. Validación Pydantic v2, constraints CHECK en BD, endpoints `/health` y `/documents` (GET/POST), y README actualizado.

---

## Fase 1 — Autenticación y control de acceso
**Objetivo:** multiusuario real y datos aislados.

**Backend**
- Sign-up / Login con Argon2 (hash) y JWT (expiración, `HS256`).
- Endpoints: `POST /auth/signup`, `POST /auth/login`, `GET /auth/me`.
- Dependencia `get_current_user` para proteger rutas.

**Base de datos (migraciones)**
- Índice único para `lower(email)` en `users`.
- `users.password_hash` NOT NULL.
- `documents.user_id` FK a `users` y, posteriormente, NOT NULL.
- `summaries/quizzes` con ON DELETE CASCADE desde `documents`.

**Frontend**
- Pantalla de login (email/contraseña), almacenamiento del token, logout.
- Enviar `Authorization: Bearer <token>` en las peticiones.

**Criterios de aceptación**
- Sin token → `401` en `/documents`.
- Con token válido → listar únicamente los documentos del usuario y poder crear.
- Sin documentos huérfanos (todas las filas con `user_id`).

---

## Fase 2 — Documentos: CRUD sólido y UX básica
**Objetivo:** flujo completo, usable y robusto.

**Backend**
- `GET /documents` con paginación (`limit`, `offset`) y orden.
- `POST /documents` (existente).
- Nuevos: `GET /documents/{id}`, `PUT/PATCH /documents/{id}`, `DELETE /documents/{id}` (solo dueño).
- Búsqueda simple: `?q=` por `title/description`.

**Base de datos**
- Índices: `(user_id, created_at DESC)`; opcional GIN por `title` para búsqueda parcial.
- Límites: longitudes en `title/description`, tamaño Máx. de `content`.

**Frontend**
- Lista paginada, estados de carga/vacío.
- Vista detalle y edición.
- Confirmación de borrado.

**Criterios de aceptación**
- CRUD completo con permisos correctos.
- Paginación estable tras crear/borrar.
- Validaciones de UI alineadas con 422 del backend.

---

## Fase 3 — Summaries y Quizzes (pipeline asíncrono)
**Objetivo:** valor central del producto.

**Backend**
- Modelos/estados: `pending|running|done|failed`, `error`, `created_at/updated_at`.
- Workers: cola con Redis + RQ/Celery (o `BackgroundTasks` si se parte simple).
- Endpoints:
  - `POST /documents/{id}/summaries` → encola trabajo.
  - `GET /summaries?document_id=…` → lista/estado.
  - `POST /documents/{id}/quizzes`, `GET /quizzes?...`.
- Idempotencia (no duplicar trabajos en curso).

**Base de datos**
- FKs a `documents` (ON DELETE CASCADE).
- Índices por `document_id` y `status`.

**Frontend**
- Botón “Generar resumen/quiz”.
- Indicadores de progreso/estado y refresco automático.
- Vistas de resumen y quiz.

**Criterios de aceptación**
- Trabajo encolado → `running → done/failed`.
- Reintentos controlados y errores visibles.
- Datos persistidos y visibles solo para el dueño.

---

## Fase 4 — Ingesta de contenidos (archivos)
**Objetivo:** subir PDF/DOCX/TXT y extraer texto.

**Backend**
- Carga a S3/MinIO (o disco local en dev).
- Extracción de texto (pdfminer, python-docx, etc.).
- Límite de tamaño, tipos permitidos, antivirus (opcional).

**Base de datos**
- Tabla `files` (metadatos) y vínculo con `documents`.

**Frontend**
- Form de upload con barra de progreso.
- Asociar archivo ⇄ documento.

**Criterios de aceptación**
- Subida controlada (errores claros, tamaños/tipos).
- Texto extraído disponible para summary/quiz.

---

## Fase 5 — Observabilidad y manejo de errores
**Objetivo:** saber qué pasa y por qué.

**Backend**
- Logging estructurado (JSON) y trazas de errores homogéneas.
- Health extendido: versión, RTT, estado de DB/cola.
- Métricas (Prometheus/OpenTelemetry) si es viable.

**Frontend**
- Captura y despliegue de errores comprensibles para el usuario.

**Criterios de aceptación**
- Logs útiles para reproducir fallos.
- `/health` y métricas reflejan estado real (no “siempre verde”).

---

## Fase 6 — Testing y calidad
**Objetivo:** evitar regresiones.

**Backend**
- Tests unitarios (servicios/validaciones) y de integración (DB).
- Tests de contrato de API (401/403/422, schemata).
- Cobertura mínima acordada.

**Frontend**
- E2E básicos (Playwright/Cypress): login, CRUD doc, generar summary/quiz.

**CI (mínimo)**
- GitHub Actions: `pytest` + build del frontend.

**Criterios de aceptación**
- Pipeline en verde en cada PR.
- Suite cubre los flujos críticos.

---

## Fase 7 — Seguridad y cumplimiento básico
**Objetivo:** cerrar puertas obvias.

**Backend**
- CORS restrictivo en producción.
- Rate limiting (reverse proxy o librería).
- Headers de seguridad (HSTS, CSP básica).
- Reset de contraseña y verificación de email (si aplica).
- Gestión de secretos por entorno (no en repo).

**Base de datos**
- Backups automáticos y restore probado.

**Criterios de aceptación**
- Escaneo mínimo OWASP sin hallazgos críticos.
- Restore de backup verificado.

---

## Fase 8 — Despliegue y operación
**Objetivo:** correr 24/7 de forma estable.

**Infra/DevOps**
- Docker para backend, worker, frontend, DB y Redis (compose).
- Entornos: dev / staging / prod con variables separadas.
- CD: despliegue a proveedor (VPS/Cloud) con HTTPS.
- Runbook: arranque/parada, logs, migraciones, rollback.

**Criterios de aceptación**
- Deploy reproducible, con Alembic ejecutado automáticamente.
- Rollback documentado y probado.

---

## Fase 9 — Pulido de producto
**Objetivo:** experiencia fluida.

**Frontend**
- Estados vacíos, loaders, toasts, accesibilidad básica (a11y).
- i18n (si corresponde), feedback in-app.

**Producto**
- Analítica “privacy-aware” (eventos mínimos).
- Onboarding de primer uso.

**Criterios de aceptación**
- Flujos principales sin fricción y medidos.

---

## Orden recomendado
1) Fase 1 + 2 (Auth + CRUD sólido) → convierte el esqueleto en app real.  
2) Fase 3 (Summaries/Quizzes) → núcleo de StudyForge.  
3) Fase 4 + 5 (Ingesta + Observabilidad) → entrada de contenido y visibilidad.  
4) Fase 6 + 7 (Testing + Seguridad) → listo para escalar.  
5) Fase 8 + 9 (Deploy + Pulido) → producto estable y presentable.
