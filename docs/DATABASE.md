# Base de Datos — StudyForge

**Última actualización:** 2025-11-20

Este documento describe la arquitectura de base de datos de StudyForge con PostgreSQL 18.

---

## Schema y Roles

### Schema Aislado

**Schema**: `studyforge` (no `public`)

**Beneficios**:
- Aislamiento de objetos de la aplicación
- Facilita permisos granulares
- Simplifica limpieza y mantenimiento
- Separación clara de datos del sistema vs aplicación

### Roles Separados (Principio de Menor Privilegio)

**`studyforge_owner`** - Rol de migración (DDL):
- Permisos: CREATE, ALTER, DROP, TRUNCATE
- Uso: Migraciones con Alembic
- Cadena de conexión: `ALEMBIC_URL`

**`studyforge_app`** - Rol de aplicación (DML):
- Permisos: SELECT, INSERT, UPDATE, DELETE
- Uso: Runtime de la aplicación FastAPI
- Cadena de conexión: `DATABASE_URL`

**Configuración** (ver `backend/setup_database.sql`):
```sql
CREATE SCHEMA studyforge;
CREATE ROLE studyforge_owner WITH LOGIN PASSWORD 'password_seguro';
CREATE ROLE studyforge_app WITH LOGIN PASSWORD 'password_seguro';

GRANT USAGE ON SCHEMA studyforge TO studyforge_owner;
GRANT CREATE ON SCHEMA studyforge TO studyforge_owner;
GRANT USAGE ON SCHEMA studyforge TO studyforge_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA studyforge TO studyforge_app;
```

---

## Modelo de Datos

### Users (Usuarios)

```python
id: UUID (PK)
email: str (unique)
username: str (unique)
hashed_password: str
is_active: bool
storage_quota_bytes: int       # Cuota total de almacenamiento (default: 5 GB)
storage_used_bytes: int        # Espacio usado actualmente (default: 0)
max_documents_per_summary: int # Máximo de documentos por resumen (default: 2)
max_file_size_bytes: int       # Tamaño máximo por archivo (default: 50 MB)
created_at: datetime
updated_at: datetime
```

**Índices**:
- `UNIQUE (email)`
- `UNIQUE (username)`

**Notas**:
- Contraseñas hasheadas con Argon2id
- Sistema de cuotas configurable por usuario
- `is_active` permite desactivar cuentas sin eliminarlas

---

### Documents (Documentos)

```python
id: UUID (PK)
user_id: UUID (FK -> Users)
title: str
file_name: str
file_type: str  # pdf, docx, pptx, txt
file_size_bytes: int
file_content: bytea  # Contenido binario del archivo
extracted_text: text  # Texto extraído para búsqueda
created_at: datetime
updated_at: datetime
```

**Índices**:
- `INDEX (user_id, created_at DESC)` - Para lista ordenada por usuario
- `INDEX (file_type)` - Para filtrado por tipo

**Notas**:
- Documentos SE almacenan para reutilización en múltiples resúmenes
- `extracted_text` se usa para generación de resúmenes y búsqueda
- Sistema de cuotas controla `file_size_bytes` total por usuario

---

### Summaries (Resúmenes)

```python
id: UUID (PK)
user_id: UUID (FK -> Users)
title: str
content: jsonb  # Contenido estructurado del resumen
expertise_level: enum('basico', 'medio', 'avanzado')
topics: jsonb  # Lista de temas identificados
key_concepts: jsonb  # Conceptos clave destacados
original_file_name: str  # Solo el nombre, NO el contenido
original_file_type: str  # pdf, pptx, docx, txt
created_at: datetime
updated_at: datetime
```

**Índices**:
- `INDEX (user_id)`
- `INDEX (created_at DESC)` - Para ordenar por fecha

**Estructura de `content` (JSONB)**:
```json
{
  "summary": "Texto del resumen...",
  "key_points": ["Punto 1", "Punto 2", ...],
  "detailed_sections": [
    {
      "title": "Sección 1",
      "content": "Contenido..."
    }
  ]
}
```

**Notas**:
- JSONB permite flexibilidad en estructura de contenido
- Soporta queries SQL sobre campos JSON
- `topics` y `key_concepts` generados por OpenAI

---

### Quizzes (Cuestionarios)

```python
id: UUID (PK)
user_id: UUID (FK -> Users)
summary_id: UUID (FK -> Summaries, nullable)  # Puede generarse de resumen o documento temporal
title: str
topic: str  # "general" o tema específico
difficulty_level: int  # 1-5, adaptativo según desempeño
questions: jsonb  # Array de preguntas con opciones en formato JSON
created_at: datetime
```

**Índices**:
- `INDEX (user_id)`
- `INDEX (summary_id) WHERE summary_id IS NOT NULL` - Índice parcial
- `INDEX (topic)` - Para filtrado por tema

**Estructura de `questions` (JSONB)**:
```json
[
  {
    "question": "¿Cuál es...?",
    "correct": "Opción correcta",
    "semi_correct": "Opción parcialmente correcta",
    "incorrect1": "Opción incorrecta 1",
    "incorrect2": "Opción incorrecta 2",
    "explanation": "Explicación detallada..."
  }
]
```

**Notas**:
- Formato semántico (no posiciones A/B/C/D fijas)
- Máximo 30 preguntas por cuestionario
- Randomización se hace al crear el attempt, no aquí

---

### QuizAttempts (Intentos de Cuestionario)

```python
id: UUID (PK)
quiz_id: UUID (FK -> Quizzes)
user_id: UUID (FK -> Users)
started_at: datetime
completed_at: datetime (nullable)
score: float (nullable)  # Porcentaje 0-100
correct_answers: jsonb  # Array de letras correctas randomizadas ["A", "B", "C"...]
user_answers: jsonb  # Array de respuestas del usuario ["A", "C", "B"...]
```

**Índices**:
- `INDEX (user_id, started_at DESC)` - Para historial del usuario
- `INDEX (quiz_id)` - Para estadísticas del quiz

**Estructura de arrays (JSONB)**:
```json
{
  "correct_answers": ["B", "A", "D", "C", ...],  // Posiciones aleatorias
  "user_answers": ["B", "A", "C", "C", ...]      // Respuestas del usuario
}
```

**Notas**:
- `correct_answers` se genera al crear el attempt (randomización)
- `user_answers` se llena progresivamente
- Evaluación por comparación de arrays (correctas vs user)
- Sistema adaptativo usa últimos 5 intentos por tema

---

## Relaciones y Cascadas

### Diagrama de Relaciones

```
Users (1) ──< (N) Documents      [CASCADE DELETE]
Users (1) ──< (N) Summaries      [CASCADE DELETE]
Users (1) ──< (N) Quizzes        [CASCADE DELETE]
Users (1) ──< (N) QuizAttempts   [CASCADE DELETE]

Summaries (1) ──< (N) Quizzes    [SET NULL on delete]
Quizzes (1) ──< (N) QuizAttempts [CASCADE DELETE]
```

### Implicaciones

**Eliminar un usuario**:
- ✅ Elimina todos sus documentos
- ✅ Elimina todos sus resúmenes
- ✅ Elimina todos sus quizzes
- ✅ Elimina todos sus intentos de quiz
- **Implementación**: `ondelete="CASCADE"` en SQLAlchemy

**Eliminar un resumen**:
- ❌ NO elimina quizzes asociados
- ✅ Los quizzes quedan con `summary_id = NULL`
- **Implementación**: `ondelete="SET NULL"`

**Eliminar un quiz**:
- ✅ Elimina todos los intentos asociados
- **Implementación**: `ondelete="CASCADE"`

---

## Migraciones con Alembic

### Comandos Comunes

```bash
# Generar nueva migración automática
alembic revision --autogenerate -m "Descripción del cambio"

# Aplicar todas las migraciones pendientes
alembic upgrade head

# Aplicar hasta una revisión específica
alembic upgrade <revision_id>

# Rollback última migración
alembic downgrade -1

# Rollback a revisión específica
alembic downgrade <revision_id>

# Ver historial de migraciones
alembic history

# Ver migración actual
alembic current

# Ver SQL generado sin aplicar
alembic upgrade head --sql
```

### Configuración de Conexiones

**Archivo: `alembic.ini`**
```ini
[alembic]
script_location = alembic
sqlalchemy.url = postgresql+psycopg://studyforge_owner:password@localhost:5432/studyforge?options=-csearch_path=studyforge,public
```

**Archivo: `backend/.env.alembic`**
```env
ALEMBIC_URL=postgresql+psycopg://studyforge_owner:password@localhost:5432/studyforge?options=-csearch_path=studyforge,public
```

**Archivo: `backend/.env`** (aplicación)
```env
DATABASE_URL=postgresql+psycopg://studyforge_app:password@localhost:5432/studyforge?options=-csearch_path=studyforge,public
```

**Importante**: `search_path=studyforge,public` asegura que las tablas se busquen primero en `studyforge`.

---

## Queries Útiles

### Consultas de Mantenimiento

```sql
-- Ver espacio usado por tabla
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'studyforge'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Ver índices por tabla
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'studyforge';

-- Ver uso de almacenamiento por usuario
SELECT
  u.username,
  u.email,
  pg_size_pretty(u.storage_used_bytes) AS used,
  pg_size_pretty(u.storage_quota_bytes) AS quota,
  ROUND((u.storage_used_bytes::numeric / u.storage_quota_bytes * 100), 2) AS percentage
FROM studyforge.users u
ORDER BY percentage DESC;
```

### Queries de Análisis

```sql
-- Top 10 usuarios con más documentos
SELECT
  u.username,
  COUNT(d.id) AS doc_count,
  pg_size_pretty(SUM(d.file_size_bytes)) AS total_size
FROM studyforge.users u
LEFT JOIN studyforge.documents d ON u.id = d.user_id
GROUP BY u.id, u.username
ORDER BY doc_count DESC
LIMIT 10;

-- Progreso de usuario en quizzes por tema
SELECT
  topic,
  COUNT(*) AS total_attempts,
  ROUND(AVG(score), 2) AS avg_score,
  MAX(score) AS best_score
FROM studyforge.quiz_attempts qa
JOIN studyforge.quizzes q ON qa.quiz_id = q.id
WHERE qa.user_id = '<uuid>' AND qa.completed_at IS NOT NULL
GROUP BY topic
ORDER BY avg_score DESC;

-- Quizzes más difíciles (menor score promedio)
SELECT
  q.title,
  q.topic,
  q.difficulty_level,
  COUNT(qa.id) AS attempts,
  ROUND(AVG(qa.score), 2) AS avg_score
FROM studyforge.quizzes q
JOIN studyforge.quiz_attempts qa ON q.id = qa.quiz_id
WHERE qa.completed_at IS NOT NULL
GROUP BY q.id, q.title, q.topic, q.difficulty_level
HAVING COUNT(qa.id) >= 5
ORDER BY avg_score ASC
LIMIT 10;
```

---

## Consideraciones de Performance

### Índices

**Cuándo agregar índices**:
- Columnas en WHERE frecuente
- Columnas en JOIN
- Columnas en ORDER BY
- Foreign keys (automático en PostgreSQL)

**Índices actuales** (ver sección de cada tabla arriba):
- ✅ Índices únicos en `users.email` y `users.username`
- ✅ Índices compuestos para queries comunes (user_id + created_at)
- ✅ Índice parcial en `quizzes.summary_id` (solo NOT NULL)
- ✅ Índice en `quizzes.topic` para filtrado

### JSONB Performance

**Índices GIN para JSONB** (opcional, futuro):
```sql
-- Para búsqueda en summaries.content
CREATE INDEX idx_summaries_content_gin ON studyforge.summaries USING GIN (content);

-- Para búsqueda en quizzes.questions
CREATE INDEX idx_quizzes_questions_gin ON studyforge.quizzes USING GIN (questions);
```

**Queries JSONB**:
```sql
-- Buscar en content
SELECT * FROM studyforge.summaries
WHERE content @> '{"key_points": ["búsqueda"]}';

-- Extraer campo específico
SELECT
  title,
  content->>'summary' AS summary_text
FROM studyforge.summaries;
```

### Connection Pooling

**Configuración recomendada** (PostgreSQL):
```
max_connections = 100
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB
```

**SQLAlchemy pooling** (`backend/app/db.py`):
```python
engine = create_engine(
    DATABASE_URL,
    pool_size=5,          # Conexiones base
    max_overflow=10,      # Conexiones extra bajo carga
    pool_timeout=30,      # Timeout para obtener conexión
    pool_recycle=1800     # Reciclar conexiones cada 30 min
)
```

---

## Backups y Recuperación

### Backup Manual

```bash
# Backup completo de la base de datos
pg_dump -U studyforge_owner -d studyforge -F c -f studyforge_backup.dump

# Backup solo del schema studyforge
pg_dump -U studyforge_owner -d studyforge -n studyforge -F c -f studyforge_schema_backup.dump

# Backup en SQL plano
pg_dump -U studyforge_owner -d studyforge -F p -f studyforge_backup.sql
```

### Restauración

```bash
# Restaurar desde dump custom format
pg_restore -U studyforge_owner -d studyforge -c studyforge_backup.dump

# Restaurar desde SQL plano
psql -U studyforge_owner -d studyforge -f studyforge_backup.sql
```

### Automatización (Recomendado)

**Cron job** (Linux):
```bash
# /etc/cron.d/studyforge-backup
0 2 * * * postgres pg_dump -U studyforge_owner -d studyforge -F c -f /backups/studyforge_$(date +\%Y\%m\%d).dump
```

**Retención**: Mantener últimos 30 días, semanales de último año.

---

## Referencias

- Modelo de datos completo: Ver arriba
- Setup inicial: [backend/setup_database.sql](../backend/setup_database.sql)
- Configuración de aplicación: [backend/.env.example](../backend/.env.example)
- Migraciones: `backend/alembic/versions/`
- Para flujos de integración: [INTEGRATION.md](INTEGRATION.md)
- Para arquitectura general: [ARCHITECTURE.md](ARCHITECTURE.md)
