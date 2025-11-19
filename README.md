# StudyForge 2.0

**Sistema de apoyo al aprendizaje con Inteligencia Artificial**

StudyForge es una aplicación web que utiliza IA para ayudar a estudiantes en su proceso de aprendizaje mediante la generación de resúmenes personalizados y cuestionarios adaptativos.

---

## 🎯 Características Principales

### 1. **Generación de Resúmenes Inteligentes**
- Carga de documentos en múltiples formatos: **PDF, DOCX, PPTX, TXT**
- Resúmenes adaptados a 3 niveles de expertise:
  - **Básico**: Vocabulario simple y conceptos fundamentales
  - **Medio**: Balance entre detalle y claridad
  - **Avanzado**: Análisis técnico y profundo
- Identificación automática de temas y conceptos clave
- **Los documentos NO se almacenan** (solo los resúmenes generados)

### 2. **Cuestionarios Adaptativos**
- Generación automática de preguntas de opción múltiple
- Cantidad de preguntas adaptable (máximo 30 por cuestionario)
- Dificultad adaptativa basada en desempeño histórico
- Opción de cuestionario completo o por tema específico
- **Feedback inmediato** con explicaciones detalladas

### 3. **Seguimiento de Progreso**
- Historial de cuestionarios realizados
- Estadísticas de desempeño por tema
- Adaptación automática de dificultad según resultados

---

## 🛠️ Stack Tecnológico

### Backend
- **Python**: 3.14
- **Framework**: FastAPI
- **Base de datos**: PostgreSQL 18
- **ORM**: SQLAlchemy 2.0
- **Migraciones**: Alembic
- **Autenticación**: JWT (python-jose + Argon2)
- **IA**: OpenAI API (GPT-4)
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

```bash
cd backend
python -m venv .venv

# Windows
.\.venv\Scripts\Activate.ps1

# Linux/Mac
source .venv/bin/activate

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
├── backend/
│   ├── alembic/              # Migraciones de base de datos
│   ├── app/
│   │   ├── core/             # Seguridad, dependencias
│   │   ├── models/           # Modelos SQLAlchemy
│   │   ├── schemas/          # Schemas Pydantic
│   │   ├── routers/          # Endpoints API
│   │   ├── services/         # Lógica de negocio
│   │   ├── repositories/     # Acceso a datos
│   │   ├── utils/            # Utilidades
│   │   ├── config.py         # Configuración
│   │   ├── db.py             # Configuración BD
│   │   └── main.py           # App FastAPI
│   ├── tests/                # Tests
│   ├── requirements.txt
│   ├── setup_database.sql    # Script de configuración BD
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/       # Componentes React
│   │   ├── pages/            # Páginas
│   │   ├── services/         # Servicios API
│   │   ├── hooks/            # Custom hooks
│   │   ├── utils/            # Utilidades
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
│
└── docs/
    ├── ARCHITECTURE.md       # Arquitectura detallada
    ├── DECISIONS.md          # Decisiones técnicas
    └── ROADMAP.md            # Plan de desarrollo
```

---

## 🔐 Seguridad

- **Contraseñas**: Hash con Argon2 (más seguro que bcrypt)
- **Autenticación**: JWT con expiración de 24 horas
- **Privacidad**: Los documentos NO se almacenan en la base de datos
- **Validación**: Pydantic para todos los datos de entrada
- **Rate Limiting**: Control de llamadas a OpenAI por usuario
- **Límites de archivo**: Máximo 10MB por documento

---

## 📖 API Endpoints

### Autenticación
- `POST /auth/register` - Registrar nuevo usuario
- `POST /auth/login` - Iniciar sesión
- `GET /auth/me` - Obtener usuario actual

### Resúmenes
- `POST /summaries/upload` - Subir documento y generar resumen
- `GET /summaries` - Listar resúmenes del usuario
- `GET /summaries/{id}` - Obtener resumen específico
- `DELETE /summaries/{id}` - Eliminar resumen

### Cuestionarios
- `POST /quizzes/generate` - Generar cuestionario
- `GET /quizzes` - Listar cuestionarios
- `GET /quizzes/{id}` - Obtener cuestionario
- `POST /quiz-attempts` - Iniciar intento
- `POST /quiz-attempts/{id}/answer` - Responder pregunta
- `POST /quiz-attempts/{id}/complete` - Finalizar cuestionario
- `GET /quiz-attempts/{id}/results` - Ver resultados

### Estadísticas
- `GET /stats/progress` - Progreso por tema
- `GET /stats/performance` - Desempeño histórico

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

- [x] Arquitectura y diseño del sistema
- [x] Modelos de base de datos
- [x] Configuración de migraciones
- [ ] Sistema de autenticación
- [ ] Procesamiento de archivos
- [ ] Integración con OpenAI
- [ ] Generación de resúmenes
- [ ] Generación de cuestionarios
- [ ] Sistema adaptativo
- [ ] Frontend completo
- [ ] Tests unitarios
- [ ] Tests de integración
- [ ] Documentación API
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
