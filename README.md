StudyForge — Milestone DB + API + Front

Backend FastAPI + PostgreSQL (schema studyforge) + Alembic + Frontend Vite/React funcionando de punta a punta.

🧱 Stack

Backend: Python 3.11, FastAPI, SQLAlchemy, Alembic, Uvicorn

DB: PostgreSQL (schema por defecto studyforge, no public)

Frontend: React + Vite + pnpm

Validación: Pydantic v2 (rechaza title/content vacíos)

✅ Funcionalidad actual (alcance)

GET /health → estado del backend

GET /documents → lista documentos: { "items": [...] }

POST /documents → crea documento (valida title y content no vacíos)

Migraciones Alembic versionadas (historial reproducible)

Tablas: users, documents, summaries, quizzes

Frontend Home:

Lee /health

Form para crear documento

Lista documentos (persistencia real)

⚙️ Requisitos

Python 3.11

PostgreSQL 14+ (servicio levantado)

Node 18+ y pnpm 10+

🔐 Variables de entorno
backend/.env (runtime — no commitear)
DATABASE_URL=postgresql+psycopg://<user_app>:<pass_app>@localhost:5432/studyforge?options=-csearch_path=studyforge,public
ENV=dev

backend/.env.alembic (migraciones — no commitear)
ALEMBIC_URL=postgresql+psycopg://<user_owner>:<pass_owner>@localhost:5432/studyforge?options=-csearch_path=studyforge,public


Hay ejemplos en backend/.env.example y backend/.env.alembic.example (añádelos si no existen).

🛢️ Setup de base de datos (una vez por entorno)

Nota: crea dos roles: uno “owner” (DDL/migraciones) y otro “app” (DML).

-- Conectado como superusuario (ej: postgres)
CREATE ROLE studyforge_owner LOGIN PASSWORD '...';
CREATE ROLE studyforge_app   LOGIN PASSWORD '...';

CREATE DATABASE studyforge OWNER studyforge_owner;

-- Schema y permisos
CREATE SCHEMA IF NOT EXISTS studyforge AUTHORIZATION studyforge_owner;
GRANT USAGE ON SCHEMA studyforge TO studyforge_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA studyforge TO studyforge_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA studyforge
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO studyforge_app;

🧬 Migraciones (Alembic)
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Ver estado
alembic current

# Subir a la última versión
alembic upgrade head


Alembic usa ALEMBIC_URL (owner). En nuestro env.py está configurado para leer .env.alembic y evitar el bug del %.

🚀 Levantar la app
Backend
cd backend
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload


Swagger: http://127.0.0.1:8000/docs

Frontend
cd frontend
pnpm install
pnpm dev


App: http://localhost:5173/

🔌 Ejemplos de uso (API)
Health
GET http://127.0.0.1:8000/health
→ {"status":"ok"}

Lista documentos
GET http://127.0.0.1:8000/documents
→ { "items": [ { "id": 1, "title": "...", "description": "..." }, ... ] }

Crear documento (válido)
POST http://127.0.0.1:8000/documents
Content-Type: application/json

{
  "title": "Doc E2E",
  "content": "Contenido de prueba",
  "description": "via API"
}

Crear documento (inválido) → 422
{ "title": "   ", "content": "" }

🧯 Troubleshooting exprés

CORS en front: en app.main está CORSMiddleware para http://localhost:5173 y http://127.0.0.1:5173.

relation ... does not exist: correr alembic upgrade head (con owner).

Conexión fallida: validar DATABASE_URL y que PostgreSQL esté arriba.

Front cacheado: frontend/.vite/ está ignorado; si molesta, borrar la carpeta y relanzar pnpm dev.

🧪 Checklist E2E (3 minutos)

\dt studyforge.* y SELECT * FROM studyforge.alembic_version;

GET /health

GET /documents

POST /documents válido → aparece en lista

POST /documents inválido → 422

Front crea y lista → persiste tras F5

🔒 Seguridad de datos

Validación en API (Pydantic v2) para title/content no vacíos.

CHECK en DB: documents_title_not_blank, documents_content_not_blank.

Rol studyforge_app no tiene DDL.

🌿 Flujo de trabajo (git)

Ramas: main protegida → PRs desde feat/...

Commits: convenciones simples (feat:, fix:, chore:…)

Releases: tags tipo v0.1.0-milestone-db-api-front

📝 Notas sobre schema

Usamos studyforge como schema por defecto (no public) para aislar objetos.
La cadena de conexión fija search_path=studyforge,public.

📄 Licencia

WIP
