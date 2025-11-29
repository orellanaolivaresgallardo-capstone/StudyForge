#!/bin/bash
# Script helper para db-health-checker skill
# Lee credenciales de backend/.env y ejecuta diagnóstico completo

set -e  # Exit on error

echo "🔍 Diagnóstico de Base de Datos StudyForge"
echo "=========================================="
echo ""

# 1. Verificar que existe backend/.env
if [ ! -f "backend/.env" ]; then
  echo "❌ ERROR: No se encontró backend/.env"
  echo ""
  echo "Solución:"
  echo "  1. Navega al directorio raíz del proyecto"
  echo "  2. Verifica que backend/.env existe"
  echo "  3. Si no existe, copia de backend/.env.example"
  exit 1
fi

echo "✅ Archivo backend/.env encontrado"
echo ""

# 2. Extraer credenciales de DATABASE_URL
# Formato: postgresql://USER:PASSWORD@HOST:PORT/DATABASE?options=...
DATABASE_URL=$(grep "^DATABASE_URL=" backend/.env | cut -d '=' -f 2-)

if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL no encontrado en backend/.env"
  exit 1
fi

# Extraer componentes (URL decode %20 -> espacio)
DB_USER=$(echo "$DATABASE_URL" | sed -E 's|.*://([^:]+):.*|\1|')
DB_PASS=$(echo "$DATABASE_URL" | sed -E 's|.*://[^:]+:([^@]+)@.*|\1|')
DB_HOST=$(echo "$DATABASE_URL" | sed -E 's|.*@([^:]+):.*|\1|')
DB_PORT=$(echo "$DATABASE_URL" | sed -E 's|.*:([0-9]+)/.*|\1|')
DB_NAME=$(echo "$DATABASE_URL" | sed -E 's|.*/([^?]+).*|\1|')

echo "📊 Configuración de Conexión:"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo "  Password: [HIDDEN]"
echo ""

# 3. Test de conexión
echo "🔌 Probando conexión..."
if PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT NOW() as timestamp;" 2>&1; then
  echo "✅ Conexión exitosa"
else
  echo "❌ Error de conexión"
  echo ""
  echo "Posibles causas:"
  echo "  1. PostgreSQL no está corriendo"
  echo "  2. Credenciales incorrectas"
  echo "  3. Base de datos no existe"
  exit 1
fi
echo ""

# 4. Listar tablas del schema studyforge
echo "📋 Tablas en schema 'studyforge':"
PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
  SELECT
    tablename,
    CASE
      WHEN tablename IN ('users', 'documents', 'summaries', 'summary_documents', 'quizzes', 'quiz_attempts', 'study_spaces')
      THEN '✅'
      ELSE '⚠️'
    END as status
  FROM pg_tables
  WHERE schemaname = 'studyforge'
  ORDER BY tablename;
" 2>&1
echo ""

# 5. Contar registros por tabla
echo "📈 Registros por tabla:"
PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
  SELECT
    schemaname || '.' || relname as tabla,
    n_live_tup as registros
  FROM pg_stat_user_tables
  WHERE schemaname = 'studyforge'
  ORDER BY n_live_tup DESC;
" 2>&1
echo ""

# 6. Estado de migraciones Alembic
echo "🔄 Estado de Migraciones:"
if [ -d "backend" ]; then
  cd backend

  # Buscar alembic en el virtual environment
  ALEMBIC_CMD=""

  if [ -f ".venv/Scripts/alembic.exe" ]; then
    # Windows (Git Bash/WSL con path Windows)
    ALEMBIC_CMD=".venv/Scripts/alembic.exe"
    echo "Usando alembic del virtual environment (Windows)"
  elif [ -f ".venv/bin/alembic" ]; then
    # Linux/Mac
    ALEMBIC_CMD=".venv/bin/alembic"
    echo "Usando alembic del virtual environment (Linux/Mac)"
  elif command -v alembic &> /dev/null; then
    # Alembic global
    ALEMBIC_CMD="alembic"
    echo "Usando alembic global"
  fi

  if [ -n "$ALEMBIC_CMD" ]; then
    $ALEMBIC_CMD current --verbose 2>&1 || echo "⚠️ No se pudo verificar estado de migraciones"
  else
    echo "⚠️ Alembic no está instalado"
    echo "  Ejecuta: cd backend && pip install alembic"
  fi

  cd ..
else
  echo "⚠️ Directorio backend/ no encontrado"
fi
echo ""

echo "=========================================="
echo "✅ Diagnóstico completado"
echo ""
echo "Para más información, consulta docs/DATABASE.md"
