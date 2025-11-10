# StudyForge — Milestone: DB · API · Front

**Resumen:** Implementación operativa de extremo a extremo con **Backend FastAPI**, **PostgreSQL** (schema `studyforge`), **Alembic** para migraciones y **Frontend Vite/React**.

---

## 1. Arquitectura y stack

- **Backend:** Python 3.11 · FastAPI · SQLAlchemy · Alembic · Uvicorn  
- **Base de datos:** PostgreSQL (schema por defecto `studyforge`, no `public`)  
- **Frontend:** React · Vite · pnpm  
- **Validación:** Pydantic v2 (rechazo de `title` y `content` vacíos)

---

## 2. Alcance funcional (milestone)

- `GET /health` → estado del backend.  
- `GET /documents` → listado de documentos (`{ "items": [...] }`).  
- `POST /documents` → creación de documento (valida `title` y `content` no vacíos).  
- Migraciones con Alembic (historial reproducible).  
- Tablas creadas: `users`, `documents`, `summaries`, `quizzes`.  
- Frontend (Home):
  - Lectura de `/health`.
  - Formulario para crear documento.
  - Listado con persistencia real.

---

## 3. Requisitos

- **Python** 3.11  
- **PostgreSQL** 14 o superior (servicio activo)  
- **Node.js** 18 o superior y **pnpm** 10 o superior

---

## 4. Configuración de entorno

### 4.1. Variables de entorno

> No se deben versionar. Incluya en el repositorio únicamente sus variantes `.example`.

**`backend/.env`** (runtime — usado por la aplicación):
```ini
DATABASE_URL=postgresql+psycopg://<user_app>:<pass_app>@localhost:5432/studyforge?options=-csearch_path=studyforge,public
ENV=dev
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
DATABASE_SCHEMA=studyforge
```

**`backend/.env.alembic`** (migraciones — usado por Alembic):
```ini
ALEMBIC_URL=postgresql+psycopg://<user_owner>:<pass_owner>@localhost:5432/studyforge?options=-csearch_path=studyforge,public
```

**Ejemplos de referencia:**
- `backend/.env.example`
- `backend/.env.alembic.example` (añadir si no existe)
- `frontend/.env.example`

### 4.2. Preparación de base de datos (una vez por entorno)

Crear dos roles: **owner** (DDL/migraciones) y **app** (DML).

```sql
-- Conectado como superusuario (p. ej., postgres)
CREATE ROLE studyforge_owner LOGIN PASSWORD '...';
CREATE ROLE studyforge_app   LOGIN PASSWORD '...';

CREATE DATABASE studyforge OWNER studyforge_owner;

-- Schema y permisos
CREATE SCHEMA IF NOT EXISTS studyforge AUTHORIZATION studyforge_owner;

GRANT USAGE ON SCHEMA studyforge TO studyforge_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA studyforge TO studyforge_app;

ALTER DEFAULT PRIVILEGES IN SCHEMA studyforge
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO studyforge_app;
```

---

## 5. Migraciones (Alembic)

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Estado de migraciones
alembic current

# Subir a la última versión disponible
alembic upgrade head
```

**Notas:**  
- Alembic utiliza la variable `ALEMBIC_URL` (rol **owner**).  
- El archivo `alembic/env.py` está preparado para leer `.env.alembic` y `.env`, fijar `search_path` y evitar problemas de interpolación con `%`.

---

## 6. Puesta en marcha

### 6.1. Backend
```powershell
cd backend
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload
```
- Documentación interactiva (Swagger): <http://127.0.0.1:8000/docs>

### 6.2. Frontend
```powershell
cd frontend
pnpm install
pnpm dev
```
- Aplicación: <http://localhost:5173/>

---

## 7. API de referencia (ejemplos)

**Health**
```http
GET http://127.0.0.1:8000/health
```
Respuesta:
```json
{ "status": "ok" }
```

**Lista de documentos**
```http
GET http://127.0.0.1:8000/documents
```
Respuesta (ejemplo):
```json
{
  "items": [
    { "id": 1, "title": "Ejemplo", "description": "..." }
  ]
}
```

**Crear documento (válido)**
```http
POST http://127.0.0.1:8000/documents
Content-Type: application/json

{
  "title": "Doc E2E",
  "content": "Contenido de prueba",
  "description": "via API"
}
```

**Crear documento (inválido) → 422 Unprocessable Entity**
```json
{ "title": "   ", "content": "" }
```

---

## 8. Solución de problemas

- **CORS en frontend:** añadir `CORSMiddleware` en `app.main` con orígenes `http://localhost:5173` y `http://127.0.0.1:5173`.
- **`relation ... does not exist`:** ejecutar `alembic upgrade head` (con rol owner).
- **Conexión fallida:** verificar `DATABASE_URL` y que PostgreSQL esté en ejecución.
- **Caché de Vite:** la carpeta `frontend/.vite/` debe estar en `.gitignore`; si causa problemas, eliminarla y reiniciar `pnpm dev`.

---

## 8 bis. Despliegue en Render.com (servicios gratuitos)

1. **Conectar el repositorio** a Render y seleccionar el archivo `render.yaml` (auto-detección por defecto).
2. Render creará:
   - Un servicio **Web (Python)** para la API (`studyforge-api`).
   - Un **Static Site** para el frontend (`studyforge-frontend`).
   - Una base de datos **PostgreSQL** gratuita (`studyforge-db`).
3. Durante el build:
   - La API instala `backend/requirements.txt` y levanta Uvicorn en `0.0.0.0:10000`.
   - El frontend usa `pnpm` (via `corepack`) para compilar `frontend/dist`.
4. Las variables se propagan automáticamente:
   - `DATABASE_URL` toma la cadena gestionada por Render y se normaliza a `postgresql+psycopg://` automáticamente.
   - `DATABASE_SCHEMA` fija el `search_path` a `studyforge` sin tener que modificar la URL.
   - `ALLOWED_ORIGINS` obtiene la URL pública del frontend para que CORS funcione.
   - `VITE_API_BASE` y derivados apuntan al backend publicado.
5. Tras el primer despliegue, ejecutar las migraciones desde el dashboard de Render (`Shell` → `alembic upgrade head`) o añadiendo un job manual.

> **Nota:** Si necesitas dominios adicionales en CORS, agrega la URL a `ALLOWED_ORIGINS` separándola con comas en el panel de variables de Render.

---

## 9. Checklist E2E (rápido)

1. `\dt studyforge.*` y `SELECT * FROM studyforge.alembic_version;`
2. `GET /health`
3. `GET /documents`  
4. `POST /documents` válido → aparece en la lista  
5. `POST /documents` inválido → **422**  
6. Frontend crea y lista → persiste tras F5

---

## 10. Seguridad de datos

- Validación en API (Pydantic v2) para `title` y `content` no vacíos.  
- Restricciones **CHECK** en BD: `documents_title_not_blank` y `documents_content_not_blank`.  
- El rol `studyforge_app` no posee permisos DDL.

---

## 11. Flujo de trabajo (Git)

- Rama `main` protegida → PRs desde ramas `feat/...`.  
- Convenciones de commit (`feat:`, `fix:`, `chore:`, etc.).  
- Versionado con tags, p. ej.: `v0.1.0-milestone-db-api-front`.

---

## 12. Nota sobre el schema

Se utiliza `studyforge` como **schema por defecto** (no `public`) para aislar objetos.  
La cadena de conexión fija `search_path=studyforge,public`.

---

## 13. Licencia

WIP

## 14. Documentación

- [Resumen del estado actual](docs/SUMMARY.md)
- [Decisiones técnicas](docs/DECISIONS.md)
- [Próximos pasos (corto plazo)](docs/NEXT_STEPS.md)
- [Roadmap por fases](docs/ROADMAP.md)