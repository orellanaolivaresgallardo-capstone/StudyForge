# Guía Rápida de Configuración - StudyForge

Esta guía te ayudará a configurar el proyecto desde cero.

## 📋 Prerrequisitos

- Python 3.14
- PostgreSQL 18 (servicio activo)
- Node.js 24
- pnpm 10+
- OpenAI API Key

---

## 🗄️ Paso 1: Configurar Base de Datos

### 1.1. Ejecutar el script SQL

Desde la raíz del proyecto:

```bash
# Windows (PowerShell)
psql -U postgres -f backend/setup_database.sql

# Linux/Mac
psql -U postgres -f backend/setup_database.sql
```

Esto creará:
- Base de datos `studyforge`
- Schema `studyforge`
- Rol `studyforge_owner` (para migraciones) con password: `password`
- Rol `studyforge_app` (para la aplicación) con password: `password`

**⚠️ IMPORTANTE**: En producción, cambia las contraseñas en el archivo [setup_database.sql](backend/setup_database.sql) antes de ejecutarlo.

### 1.2. Verificar la base de datos

```bash
psql -U postgres -d studyforge

# Dentro de psql:
\dn                          # Ver schemas
\du                          # Ver roles
SELECT current_schema();     # Verificar schema actual
```

---

## 🐍 Paso 2: Configurar Backend

### 2.1. Activar entorno virtual

Desde la raíz del proyecto:

```bash
# Windows (PowerShell)
.\.venv\Scripts\Activate.ps1

# Linux/Mac
source .venv/bin/activate
```

### 2.2. Instalar dependencias

```bash
pip install -r backend/requirements.txt
```

### 2.3. Configurar variables de entorno

Crear **`backend/.env`** (para la aplicación):

```env
DATABASE_URL=postgresql+psycopg://studyforge_app:password@localhost:5432/studyforge?options=-csearch_path=studyforge,public
SECRET_KEY=change-this-to-a-random-secret-key-in-production
OPENAI_API_KEY=sk-your-openai-api-key-here
OPENAI_MODEL=gpt-4o-mini
ENV=development
DEBUG=True
ACCESS_TOKEN_EXPIRE_MINUTES=1440
MAX_FILE_SIZE_MB=10
```

Crear **`backend/.env.alembic`** (para migraciones):

```env
ALEMBIC_URL=postgresql+psycopg://studyforge_owner:password@localhost:5432/studyforge?options=-csearch_path=studyforge,public
```

### 2.4. Generar y aplicar migraciones

```bash
cd backend

# Generar migración inicial
alembic revision --autogenerate -m "Crear tablas iniciales"

# Aplicar migraciones
alembic upgrade head

# Verificar estado
alembic current --verbose
```

### 2.5. Verificar tablas creadas

```bash
psql -U postgres -d studyforge

# Dentro de psql:
\dt studyforge.*

# Deberías ver:
# - studyforge.users
# - studyforge.summaries
# - studyforge.quizzes
# - studyforge.questions
# - studyforge.quiz_attempts
# - studyforge.answers
# - studyforge.alembic_version
```

---

## 🚀 Paso 3: Ejecutar Backend

```bash
# Desde la raíz del proyecto (con venv activado)
cd backend
uvicorn app.main:app --reload
```

Abrir en el navegador:
- API Docs: http://localhost:8000/docs
- Health Check: http://localhost:8000/health

---

## 🎨 Paso 4: Configurar Frontend

```bash
cd frontend
pnpm install
pnpm dev
```

Abrir en el navegador: http://localhost:5173

---

## 🧪 Verificación Rápida

### Backend

```bash
# Test de conexión a BD
curl http://localhost:8000/health

# Respuesta esperada:
# {"status":"ok","service":"StudyForge API","version":"2.0.0"}
```

### Base de Datos

```bash
psql -U studyforge_app -d studyforge

# Dentro de psql:
SELECT current_user;         # Debe mostrar: studyforge_app
SELECT current_schema();     # Debe mostrar: studyforge
\dt                          # Debe listar todas las tablas
```

---

## ❌ Solución de Problemas

### Error: "relation does not exist"
```bash
cd backend
alembic upgrade head
```

### Error: "password authentication failed"
- Verifica las contraseñas en `.env` y `.env.alembic`
- Verifica que coincidan con las del script SQL

### Error: "database studyforge does not exist"
```bash
psql -U postgres -f backend/setup_database.sql
```

### Error: "No module named 'app'"
```bash
# Asegúrate de estar en el directorio backend
cd backend
python -c "import app; print('OK')"
```

### Error al importar modelos en Alembic
- Verifica que `alembic/env.py` importe correctamente los modelos
- Verifica que `app/models/__init__.py` exporte todos los modelos

---

## 📝 Siguientes Pasos

Una vez configurado el entorno:

1. ✅ Base de datos configurada
2. ✅ Migraciones aplicadas
3. ✅ Backend corriendo
4. ✅ Endpoints de API implementados
5. ✅ Frontend MVP completado
6. ⏳ Escribir tests
7. ⏳ Deployment a staging/producción

Ver [README.md](README.md) para más detalles sobre el proyecto.
Ver [docs/NEXT_STEPS.md](docs/NEXT_STEPS.md) para el roadmap completo.
