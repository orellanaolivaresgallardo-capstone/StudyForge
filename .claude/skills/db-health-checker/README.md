# 🔍 DB Health Checker - Skill de Diagnóstico

Skill para diagnosticar problemas de base de datos en StudyForge.

## 🎯 Propósito

Esta skill verifica el estado de la base de datos PostgreSQL:
- ✅ Conexión a la base de datos
- ✅ Existencia de tablas esperadas
- ✅ Estado de migraciones Alembic
- ✅ Cantidad de registros por tabla
- ✅ Índices y performance (opcional)

## 📋 Requisitos

- PostgreSQL 18 corriendo en `localhost:5432`
- Archivo `backend/.env` con `DATABASE_URL` configurado
- Credenciales válidas para el rol `studyforge_app`

## 🚀 Uso

### Invocación Automática

Claude detecta automáticamente cuando necesitas diagnosticar la base de datos:

```
> ¿La base de datos está funcionando?
> Verifica si PostgreSQL está bien configurado
> Revisa el estado de las tablas
```

### Invocación Explícita

Puedes invocar la skill directamente:

```
> Usa la skill db-health-checker
> Ejecuta db-health-checker para diagnosticar la DB
```

### Usando el Script Helper

También puedes ejecutar el script directamente:

**En Windows (PowerShell):**
```powershell
# Desde el directorio raíz del proyecto
.\.claude\skills\db-health-checker\check-db.ps1
```

**En Linux/Mac (Bash):**
```bash
# Desde el directorio raíz del proyecto
bash .claude/skills/db-health-checker/check-db.sh
```

## 📊 Qué Verifica

### 1. Credenciales
- Lee `backend/.env`
- Extrae `DATABASE_URL`
- Valida formato de la cadena de conexión

### 2. Conexión PostgreSQL
- Prueba conectividad con `SELECT NOW()`
- Verifica que PostgreSQL esté corriendo
- Valida credenciales

### 3. Schema `studyforge`
Verifica que existan las 7 tablas esperadas:
- `users`
- `documents`
- `summaries`
- `summary_documents`
- `quizzes`
- `quiz_attempts`
- `study_spaces`

### 4. Migraciones Alembic
- Ejecuta `alembic current`
- Verifica que esté al día
- Detecta migraciones pendientes

### 5. Datos
- Cuenta registros en cada tabla
- Muestra estadísticas de uso

## 🔐 Seguridad

Esta skill:
- ✅ Solo ejecuta consultas de lectura (`SELECT`)
- ✅ NO modifica datos
- ✅ NO muestra contraseñas en output
- ✅ Usa `PGPASSWORD` temporalmente (solo en memoria)

## 🛠️ Archivos

```
.claude/skills/db-health-checker/
├── SKILL.md           # Instrucciones de la skill (principal)
├── check-db.ps1       # Script helper para Windows (PowerShell)
├── check-db.sh        # Script helper para Linux/Mac (Bash)
└── README.md          # Esta documentación
```

## 📚 Referencias

- **Database Schema**: `docs/DATABASE.md`
- **Setup Script**: `backend/setup_database.sql`
- **Migrations**: `backend/alembic/versions/`

## ❓ Solución de Problemas

### "password authentication failed"
```bash
# Verificar credenciales en .env
grep DATABASE_URL backend/.env

# Comparar con setup_database.sql
grep "CREATE ROLE studyforge_app" backend/setup_database.sql
```

### "database does not exist"
```bash
# Ejecutar script de setup
psql -U postgres -f backend/setup_database.sql
```

### "relation does not exist"
```bash
# Aplicar migraciones
cd backend
alembic upgrade head
```

## 🔄 Actualización

Última actualización: 2025-11-29
