# Database Health Checker - Skill de Diagnóstico

**IMPORTANT: Always respond to the user in Spanish.**

## Propósito

Esta skill ayuda a **diagnosticar problemas de base de datos** en StudyForge. Verifica conexiones, esquemas, migraciones y datos.

**NO modifica datos** (solo lectura).
**SÍ diagnostica** problemas y sugiere soluciones.

---

## Cuándo Usar Esta Skill

### ✅ Usa esta skill cuando:
- Usuario pregunta: "¿La base de datos está funcionando?"
- Usuario pide: "Verifica las conexiones a PostgreSQL"
- Usuario necesita: "¿Las migraciones están aplicadas?"
- Usuario quiere: "Revisa si las tablas existen"
- Usuario dice: "Diagnóstico de base de datos"

### ❌ NO uses esta skill cuando:
- Usuario quiere: "Crea una migración" → Usa flujo normal de desarrollo
- Usuario pide: "Modifica datos" → Requiere confirmación explícita
- Usuario solicita: "Borra registros" → Operación peligrosa

---

## Manejo de Credenciales

**IMPORTANTE:** Esta skill necesita credenciales para conectarse a PostgreSQL.

### Método 1: Leer desde backend/.env (RECOMENDADO)

La skill debe leer las credenciales desde `backend/.env`:

```bash
# Extraer DATABASE_URL del .env
grep "^DATABASE_URL=" backend/.env
```

El formato es:
```
DATABASE_URL=postgresql://studyforge_app:PASSWORD@localhost:5432/studyforge?options=-c%20search_path=studyforge,public
```

### Método 2: Usar PGPASSWORD environment variable

Para evitar que psql pida contraseña interactivamente:

```bash
# Extraer password del .env
PASSWORD=$(grep "^DATABASE_URL=" backend/.env | sed -E 's/.*:\/\/[^:]+:([^@]+)@.*/\1/')

# Ejecutar psql con PGPASSWORD
PGPASSWORD="$PASSWORD" psql -U studyforge_app -d studyforge -c "SELECT NOW();"
```

### Método 3: Usar script helper (más seguro)

La skill incluye un script helper que maneja credenciales automáticamente.

---

## Modo de Operación

### 1. Leer Credenciales

Primero, lee `backend/.env` para obtener la cadena de conexión:

```bash
# Verificar que existe el archivo
if [ -f "backend/.env" ]; then
  echo "✅ Archivo .env encontrado"
else
  echo "❌ No se encontró backend/.env"
  exit 1
fi
```

### 2. Verificar Conexión

Ejecuta una consulta simple para verificar conectividad:

```bash
# Extraer password
PASSWORD=$(grep "^DATABASE_URL=" backend/.env | sed -E 's/.*:\/\/[^:]+:([^@]+)@.*/\1/')

# Test de conexión
PGPASSWORD="$PASSWORD" psql -U studyforge_app -d studyforge -c "SELECT NOW();" 2>&1
```

**Interpretación de resultados:**
- ✅ Si muestra timestamp → Conexión exitosa
- ❌ Si muestra "password authentication failed" → Credenciales incorrectas
- ❌ Si muestra "could not connect" → PostgreSQL no está corriendo
- ❌ Si muestra "database does not exist" → Base de datos no creada

### 3. Listar Tablas del Schema

Verifica que todas las tablas esperadas existen:

```bash
PGPASSWORD="$PASSWORD" psql -U studyforge_app -d studyforge -c "\dt studyforge.*" 2>&1
```

**Tablas esperadas en `studyforge` schema:**
- `users` - Usuarios del sistema
- `documents` - Documentos subidos
- `summaries` - Resúmenes generados
- `summary_documents` - Relación muchos-a-muchos
- `quizzes` - Quizzes generados
- `quiz_attempts` - Intentos de quiz
- `study_spaces` - Espacios de estudio

### 4. Verificar Estado de Migraciones

Compara el estado actual con las migraciones disponibles:

```bash
cd backend && alembic current --verbose
```

**Interpretación:**
- Si muestra revisión → Migraciones aplicadas
- Si muestra "None" → Base de datos sin inicializar
- Si muestra error → Verificar ALEMBIC_URL en backend/.env.alembic

### 5. Revisar Integridad de Datos

Cuenta registros por tabla:

```bash
PGPASSWORD="$PASSWORD" psql -U studyforge_app -d studyforge -c "
  SELECT
    schemaname,
    tablename,
    n_live_tup as registros
  FROM pg_stat_user_tables
  WHERE schemaname = 'studyforge'
  ORDER BY n_live_tup DESC;
" 2>&1
```

### 6. Verificar Índices y Performance

Opcional - revisar índices existentes:

```bash
PGPASSWORD="$PASSWORD" psql -U studyforge_app -d studyforge -c "
  SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
  FROM pg_indexes
  WHERE schemaname = 'studyforge'
  ORDER BY tablename, indexname;
" 2>&1
```

---

## Estructura de Respuesta

Cuando se invoca la skill, sigue este formato:

```markdown
## 🔍 Diagnóstico de Base de Datos StudyForge

### 🔐 Credenciales
[Estado: ✅ Encontradas en backend/.env / ❌ No encontradas]

### ✅ Conexión PostgreSQL
**Estado:** [✅ OK / ❌ ERROR]
- Base de datos: `studyforge`
- Usuario: `studyforge_app`
- Host: `localhost:5432`
- Timestamp: [resultado de SELECT NOW()]

[Si hay error, mostrar mensaje detallado]

### 📊 Schema `studyforge`
**Tablas encontradas:** X/7

| Tabla | Estado | Descripción |
|-------|--------|-------------|
| users | [✅/❌] | Usuarios del sistema |
| documents | [✅/❌] | Documentos subidos |
| summaries | [✅/❌] | Resúmenes generados |
| summary_documents | [✅/❌] | Relación summary-document |
| quizzes | [✅/❌] | Quizzes generados |
| quiz_attempts | [✅/❌] | Intentos de quiz |
| study_spaces | [✅/❌] | Espacios de estudio |

[Si faltan tablas, listar cuáles]

### 🔄 Migraciones Alembic
**Estado:** [✅ Al día / ⚠️ Pendientes / ❌ Error]
- Revisión actual: `[hash]` ([descripción])
- Migraciones pendientes: [0 / N]

[Si hay pendientes, listar cuáles]

### 📈 Datos Actuales
| Tabla | Registros |
|-------|-----------|
| users | X |
| documents | Y |
| summaries | Z |
| ... | ... |

### 🔍 Índices
[Opcional: mostrar índices clave si se solicita]

### 💡 Diagnóstico Final
[Resumen del estado general]

**Estado general:** [✅ Saludable / ⚠️ Advertencias / ❌ Errores críticos]

[Lista de problemas encontrados]
[Recomendaciones de solución]

### 🛠️ Acciones Recomendadas
[Si hay problemas, sugerir pasos específicos]
```

---

## Ejemplo de Interacción Exitosa

**Usuario:** "Verifica si la base de datos está bien configurada"

**Respuesta:**

```markdown
## 🔍 Diagnóstico de Base de Datos StudyForge

### 🔐 Credenciales
✅ Credenciales encontradas en `backend/.env`

### ✅ Conexión PostgreSQL
**Estado:** ✅ OK
- Base de datos: `studyforge`
- Usuario: `studyforge_app`
- Host: `localhost:5432`
- Timestamp: `2025-11-29 10:30:45.123456-03`

### 📊 Schema `studyforge`
**Tablas encontradas:** 7/7 ✅

| Tabla | Estado | Descripción |
|-------|--------|-------------|
| users | ✅ Existe | Usuarios del sistema |
| documents | ✅ Existe | Documentos subidos |
| summaries | ✅ Existe | Resúmenes generados |
| summary_documents | ✅ Existe | Relación summary-document |
| quizzes | ✅ Existe | Quizzes generados |
| quiz_attempts | ✅ Existe | Intentos de quiz |
| study_spaces | ✅ Existe | Espacios de estudio |

### 🔄 Migraciones Alembic
**Estado:** ✅ Al día
- Revisión actual: `fbdf6cca3f23` (remove topic tracking)
- Migraciones pendientes: 0

### 📈 Datos Actuales
| Tabla | Registros |
|-------|-----------|
| study_spaces | 3 |
| users | 2 |
| documents | 5 |
| summaries | 4 |
| quizzes | 2 |
| quiz_attempts | 8 |
| summary_documents | 6 |

### 💡 Diagnóstico Final
**Estado general:** ✅ Saludable

Tu base de datos está:
- ✅ Conectada y accesible
- ✅ Con todas las tablas esperadas en schema `studyforge`
- ✅ Migraciones aplicadas correctamente
- ✅ Con datos válidos (7 tablas con registros)

**No se encontraron problemas.** El sistema está listo para usar.

---

¿Necesitas verificar algo específico de la base de datos?
```

---

## Ejemplo de Interacción con Problemas

**Usuario:** "La base de datos no funciona"

**Respuesta:**

```markdown
## 🔍 Diagnóstico de Base de Datos StudyForge

### 🔐 Credenciales
✅ Credenciales encontradas en `backend/.env`

### ❌ Conexión PostgreSQL
**Estado:** ❌ ERROR

```
psql: error: connection to server at "localhost" (::1), port 5432 failed:
Connection refused. Is the server running on that host and accepting TCP/IP connections?
```

**Causa probable:** PostgreSQL no está corriendo

### 💡 Diagnóstico Final
**Estado general:** ❌ Error crítico

### 🛠️ Acciones Recomendadas

1. **Verificar que PostgreSQL esté corriendo:**
   ```bash
   # Windows
   Get-Service -Name postgresql*

   # Linux/Mac
   sudo systemctl status postgresql
   ```

2. **Iniciar PostgreSQL si está detenido:**
   ```bash
   # Windows
   Start-Service -Name postgresql-x64-18

   # Linux/Mac
   sudo systemctl start postgresql
   ```

3. **Verificar el puerto 5432:**
   ```bash
   netstat -an | findstr :5432
   ```

4. **Revisar logs de PostgreSQL:**
   - Windows: `C:\Program Files\PostgreSQL\18\data\log\`
   - Linux: `/var/log/postgresql/`

Una vez que PostgreSQL esté corriendo, ejecuta el diagnóstico nuevamente.
```

---

## Limitaciones

### ❌ NO puede hacer:
- Modificar datos (INSERT, UPDATE, DELETE)
- Crear o modificar esquemas (CREATE, ALTER, DROP)
- Ejecutar migraciones (debe hacerse con `alembic upgrade`)
- Cambiar contraseñas o roles
- Modificar configuración de PostgreSQL

### ✅ SÍ puede hacer:
- Verificar conexiones (SELECT queries)
- Listar tablas, schemas, índices
- Contar registros
- Revisar estado de migraciones (solo lectura)
- Diagnosticar problemas comunes
- Sugerir soluciones detalladas
- Leer credenciales de forma segura desde .env

---

## Manejo de Errores Comunes

### Error: "password authentication failed"
**Causa:** Credenciales incorrectas en `.env`
**Solución:**
1. Verificar `backend/.env` tiene `DATABASE_URL` correcto
2. Comparar con contraseña en `backend/setup_database.sql`
3. Regenerar contraseña si es necesario

### Error: "database does not exist"
**Causa:** Base de datos no creada
**Solución:**
```bash
psql -U postgres -f backend/setup_database.sql
```

### Error: "relation does not exist"
**Causa:** Migraciones no aplicadas
**Solución:**
```bash
cd backend
alembic upgrade head
```

### Error: "could not connect"
**Causa:** PostgreSQL no está corriendo
**Solución:** Iniciar servicio PostgreSQL

---

## Seguridad

**IMPORTANTE:** Esta skill lee credenciales de `backend/.env`, pero:
- ✅ **NO** muestra contraseñas en la salida
- ✅ **NO** guarda credenciales en logs
- ✅ Usa `PGPASSWORD` temporalmente (solo en memoria)
- ✅ Solo ejecuta consultas de lectura (SELECT)

**Nunca muestres credenciales completas al usuario.** Si necesitas referenciar credenciales, usa:
```
✅ "Credenciales encontradas en backend/.env"
❌ "Password: mi_password_secreta123"
```

---

## Referencias

**Archivos clave:**
- `backend/.env` - Credenciales de runtime (DATABASE_URL)
- `backend/.env.alembic` - Credenciales para migraciones (ALEMBIC_URL)
- `backend/setup_database.sql` - Script de inicialización completo
- `backend/alembic/versions/` - Migraciones aplicadas
- `docs/DATABASE.md` - Documentación completa del schema

**Comandos útiles:**
- `psql -U studyforge_app -d studyforge` - Shell interactivo
- `alembic current` - Revisión actual de migraciones
- `alembic history` - Historial completo de migraciones
- `alembic upgrade head` - Aplicar migraciones pendientes

**Tablas del sistema PostgreSQL:**
- `pg_stat_user_tables` - Estadísticas de tablas
- `pg_indexes` - Índices existentes
- `pg_stat_activity` - Conexiones activas
