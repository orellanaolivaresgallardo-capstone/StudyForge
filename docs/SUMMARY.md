# StudyForge — Resumen de contexto (conversaciones consolidadas)

**Fecha de corte:** 2025-10-07

Este documento resume lo esencial acordado y verificado en las conversaciones integradas.

---

## 1) Alcance actual (E2E)
- **Backend:** FastAPI (Python 3.11), SQLAlchemy, Alembic, Uvicorn.
- **DB:** PostgreSQL con **schema por defecto `studyforge`** (no `public`) y `search_path=studyforge,public`.
- **Frontend:** React + Vite + pnpm.
- **Validación:** Pydantic v2 (rechaza `title`/`content` vacíos).
- **Tablas:** `users`, `documents`, `summaries`, `quizzes`.
- **Endpoints expuestos:**
  - `GET /health` → `{"status":"ok"}`
  - `GET /documents` → `{"items":[...]}`
  - `POST /documents` → Crea documento (valida `title`/`content` no vacíos).

---

## 2) Conexión y configuración
- **Runtime (app):** `DATABASE_URL` con rol `studyforge_app` (DML).
- **Migraciones (Alembic):** `ALEMBIC_URL` con rol `studyforge_owner` (DDL).
- Alembic configurado para:
  - `include_schemas=True`
  - `version_table="alembic_version"` y `version_table_schema="studyforge"`
  - Forzado de `search_path` a `studyforge, public` al migrar.

---

## 3) Calidad e integridad de datos
- **Validación API:** Pydantic v2 impide strings vacíos/espacios para `title`/`content` en `POST /documents`.
- **Defensa en base:** CHECKs en `documents`:
  - `CHECK (char_length(btrim(title)) > 0)`
  - `CHECK (char_length(btrim(content)) > 0)`
- **Migración asociada:** normaliza filas antiguas y añade los CHECKs.

---

## 4) Flujo de ejecución local (orden lógico)
1) **DB** arriba (PostgreSQL 15.x en `localhost:5432`).  
2) **Backend**:
   - Activar venv → `.\.venv\Scripts\Activate.ps1`
   - `alembic upgrade head`
   - `uvicorn app.main:app --reload`
3) **Frontend**:
   - `pnpm install`
   - `pnpm dev` → http://localhost:5173

---

## 5) Repositorio y ramas
- Ramas de trabajo: `feat/walking-skeleton`, `feat/db-sqlalchemy`.
- `main` consolidada con README mejorado y alcance de la milestone.
- Convención de commits simple (`feat:`, `fix:`, `chore:`) y PRs hacia `main`.

---

## 6) Cosas por definir (se cubren en NEXT_STEPS.md)
- Autenticación (login, JWT, hashing).
- Asociar `documents.user_id` y políticas.
- Observabilidad (logging/errores) y RUNBOOK operativo.
- Reglas de CORS, seguridad y versión de release (tags).
