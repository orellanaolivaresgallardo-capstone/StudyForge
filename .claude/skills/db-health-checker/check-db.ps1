# Script PowerShell para db-health-checker skill
# Diagnostico de base de datos StudyForge en Windows
# Uso: .\check-db.ps1

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "Diagnostico de Base de Datos StudyForge" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar que existe backend/.env
if (-not (Test-Path "backend\.env")) {
    Write-Host "ERROR: No se encontro backend\.env" -ForegroundColor Red
    Write-Host ""
    Write-Host "Solucion:" -ForegroundColor Yellow
    Write-Host "  1. Navega al directorio raiz del proyecto"
    Write-Host "  2. Verifica que backend\.env existe"
    Write-Host "  3. Si no existe, copia de backend\.env.example"
    exit 1
}

Write-Host "OK: Archivo backend\.env encontrado" -ForegroundColor Green
Write-Host ""

# 2. Leer DATABASE_URL
$envContent = Get-Content "backend\.env" -Raw
$databaseUrlLine = $envContent -split "`n" | Where-Object { $_ -match "^DATABASE_URL=" } | Select-Object -First 1

if (-not $databaseUrlLine) {
    Write-Host "ERROR: DATABASE_URL no encontrado en backend\.env" -ForegroundColor Red
    exit 1
}

$databaseUrl = $databaseUrlLine -replace "^DATABASE_URL=", ""
$databaseUrl = $databaseUrl.Trim()

# 3. Parsear DATABASE_URL usando regex simple
# Formato: postgresql+psycopg://USER:PASSWORD@HOST:PORT/DATABASE?options=...
$pattern = 'postgresql[+\w]*://([^:]+):([^@]+)@([^:]+):(\d+)/([^\?]+)'
if ($databaseUrl -match $pattern) {
    $dbUser = $matches[1]
    $dbPass = $matches[2]
    $dbHost = $matches[3]
    $dbPort = $matches[4]
    $dbName = $matches[5]
} else {
    Write-Host "ERROR: No se pudo parsear DATABASE_URL" -ForegroundColor Red
    Write-Host "URL: $databaseUrl" -ForegroundColor Yellow
    exit 1
}

Write-Host "Configuracion de Conexion:" -ForegroundColor Cyan
Write-Host "  Host: $dbHost"
Write-Host "  Port: $dbPort"
Write-Host "  Database: $dbName"
Write-Host "  User: $dbUser"
Write-Host "  Password: [HIDDEN]"
Write-Host ""

# 4. Verificar que psql esta instalado
$psqlCommand = Get-Command psql -ErrorAction SilentlyContinue
if (-not $psqlCommand) {
    Write-Host "ERROR: psql no esta instalado o no esta en PATH" -ForegroundColor Red
    Write-Host ""
    Write-Host "Solucion:" -ForegroundColor Yellow
    Write-Host "  1. Instala PostgreSQL desde https://www.postgresql.org/download/windows/"
    Write-Host "  2. Agrega PostgreSQL\bin a tu PATH"
    Write-Host "  3. Ejemplo: C:\Program Files\PostgreSQL\18\bin"
    exit 1
}

Write-Host "OK: psql encontrado: $($psqlCommand.Source)" -ForegroundColor Green
Write-Host ""

# 5. Test de conexion
Write-Host "Probando conexion..." -ForegroundColor Cyan

# Configurar PGPASSWORD como variable de entorno temporal
$env:PGPASSWORD = $dbPass

try {
    # Test simple con SELECT NOW()
    Write-Host "Ejecutando: SELECT NOW()" -ForegroundColor Gray
    $queryCmd = "SELECT NOW() as timestamp;"
    $result = & psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -c $queryCmd 2>&1

    if ($LASTEXITCODE -eq 0) {
        Write-Host "OK: Conexion exitosa" -ForegroundColor Green
        Write-Host $result
    } else {
        Write-Host "ERROR: Error de conexion" -ForegroundColor Red
        Write-Host $result -ForegroundColor Red
        Write-Host ""
        Write-Host "Posibles causas:" -ForegroundColor Yellow
        Write-Host "  1. PostgreSQL no esta corriendo"
        Write-Host "  2. Credenciales incorrectas"
        Write-Host "  3. Base de datos no existe"
        Write-Host "  4. Firewall bloqueando puerto 5432"
        Write-Host ""
        Write-Host "Verificar servicio PostgreSQL:" -ForegroundColor Yellow
        Write-Host "  Get-Service -Name postgresql*" -ForegroundColor Gray
        $env:PGPASSWORD = $null
        exit 1
    }
} catch {
    Write-Host "ERROR: Error al ejecutar psql: $_" -ForegroundColor Red
    $env:PGPASSWORD = $null
    exit 1
}

Write-Host ""

# 6. Listar tablas del schema studyforge
Write-Host "Tablas en schema 'studyforge':" -ForegroundColor Cyan
$tablesQuery = @"
SELECT tablename,
       CASE WHEN tablename IN ('users', 'documents', 'summaries', 'summary_documents', 'quizzes', 'quiz_attempts', 'study_spaces')
            THEN 'OK'
            ELSE 'WARN'
       END as status
FROM pg_tables
WHERE schemaname = 'studyforge'
ORDER BY tablename;
"@

$tablesResult = & psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -c $tablesQuery 2>&1
Write-Host $tablesResult
Write-Host ""

# 7. Contar registros por tabla
Write-Host "Registros por tabla:" -ForegroundColor Cyan
$statsQuery = @"
SELECT schemaname || '.' || relname as tabla, n_live_tup as registros
FROM pg_stat_user_tables
WHERE schemaname = 'studyforge'
ORDER BY n_live_tup DESC;
"@

$statsResult = & psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -c $statsQuery 2>&1
Write-Host $statsResult
Write-Host ""

# 8. Estado de migraciones Alembic
Write-Host "Estado de Migraciones:" -ForegroundColor Cyan
if (Test-Path "backend") {
    Push-Location backend

    # Intentar encontrar alembic en el virtual environment
    $alembicExe = $null

    if (Test-Path ".venv\Scripts\alembic.exe") {
        $alembicExe = ".venv\Scripts\alembic.exe"
        Write-Host "Usando alembic del virtual environment" -ForegroundColor Gray
    } elseif (Get-Command alembic -ErrorAction SilentlyContinue) {
        $alembicExe = "alembic"
        Write-Host "Usando alembic global" -ForegroundColor Gray
    }

    if ($alembicExe) {
        $alembicResult = & $alembicExe current --verbose 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host $alembicResult -ForegroundColor Green
        } else {
            Write-Host "WARN: Error al verificar migraciones:" -ForegroundColor Yellow
            Write-Host $alembicResult -ForegroundColor Yellow
        }
    } else {
        Write-Host "WARN: Alembic no esta instalado" -ForegroundColor Yellow
        Write-Host "  Ejecuta: cd backend && pip install alembic" -ForegroundColor Gray
    }

    Pop-Location
} else {
    Write-Host "WARN: Directorio backend/ no encontrado" -ForegroundColor Yellow
}

Write-Host ""

# 9. Limpieza
$env:PGPASSWORD = $null

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Diagnostico completado" -ForegroundColor Green
Write-Host ""
Write-Host "Para mas informacion, consulta docs/DATABASE.md" -ForegroundColor Cyan
Write-Host ""
