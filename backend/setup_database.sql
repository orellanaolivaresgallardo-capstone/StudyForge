-- setup_database.sql
-- Script para configurar la base de datos PostgreSQL para StudyForge
-- Ejecutar como superusuario (postgres)

-- =====================================================
-- 1. CREAR ROLES
-- =====================================================

-- Rol owner: tiene permisos DDL (crear/modificar tablas)
-- Se usa para migraciones de Alembic
CREATE ROLE studyforge_owner LOGIN PASSWORD 'password';

-- Rol app: solo permisos DML (SELECT, INSERT, UPDATE, DELETE)
-- Se usa para la aplicación en runtime
CREATE ROLE studyforge_app LOGIN PASSWORD 'password';

-- =====================================================
-- 2. CREAR BASE DE DATOS
-- =====================================================

CREATE DATABASE studyforge OWNER studyforge_owner;

-- =====================================================
-- 3. CONECTARSE A LA BASE DE DATOS
-- =====================================================
\c studyforge

-- =====================================================
-- 4. CREAR SCHEMA
-- =====================================================
CREATE SCHEMA IF NOT EXISTS studyforge AUTHORIZATION studyforge_owner;

-- =====================================================
-- 5. PERMISOS PARA STUDYFORGE_OWNER
-- =====================================================

-- Dar todos los permisos al owner sobre el schema
GRANT ALL PRIVILEGES ON SCHEMA studyforge TO studyforge_owner;

-- Permisos sobre tablas y secuencias existentes
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA studyforge TO studyforge_owner;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA studyforge TO studyforge_owner;

-- Permisos por defecto para objetos futuros creados por studyforge_owner
ALTER DEFAULT PRIVILEGES FOR ROLE studyforge_owner IN SCHEMA studyforge
  GRANT ALL PRIVILEGES ON TABLES TO studyforge_owner;

ALTER DEFAULT PRIVILEGES FOR ROLE studyforge_owner IN SCHEMA studyforge
  GRANT ALL PRIVILEGES ON SEQUENCES TO studyforge_owner;

-- =====================================================
-- 6. PERMISOS PARA STUDYFORGE_APP (solo DML)
-- =====================================================

-- Permitir al rol app usar el schema
GRANT USAGE ON SCHEMA studyforge TO studyforge_app;

-- Permisos DML en tablas existentes
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA studyforge TO studyforge_app;

-- Permisos DML en tablas futuras creadas por studyforge_owner (CRÍTICO para migraciones)
ALTER DEFAULT PRIVILEGES FOR ROLE studyforge_owner IN SCHEMA studyforge
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO studyforge_app;

-- Permisos en secuencias existentes (para IDs autoincrementales)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA studyforge TO studyforge_app;

-- Permisos en secuencias futuras creadas por studyforge_owner
ALTER DEFAULT PRIVILEGES FOR ROLE studyforge_owner IN SCHEMA studyforge
  GRANT USAGE, SELECT ON SEQUENCES TO studyforge_app;

-- =====================================================
-- RESUMEN DE CONFIGURACIÓN
-- =====================================================

-- Roles creados:
--   • studyforge_owner: para migraciones (DDL) - permisos completos
--   • studyforge_app: para aplicación (DML) - solo SELECT, INSERT, UPDATE, DELETE
--
-- Base de datos: studyforge
-- Schema: studyforge
--
-- Permisos configurados:
--   • studyforge_owner: ALL PRIVILEGES sobre schema, tablas y secuencias
--   • studyforge_app: USAGE en schema, SELECT/INSERT/UPDATE/DELETE en tablas, USAGE/SELECT en secuencias
--   • ALTER DEFAULT PRIVILEGES configurado para objetos futuros creados por studyforge_owner
--
-- Cadenas de conexión:
--   • ALEMBIC_URL (migraciones):
--     postgresql+psycopg://studyforge_owner:password@localhost:5432/studyforge?options=-csearch_path=studyforge,public
--
--   • DATABASE_URL (aplicación):
--     postgresql+psycopg://studyforge_app:password@localhost:5432/studyforge?options=-csearch_path=studyforge,public
--
-- IMPORTANTE: Después de ejecutar este script, las migraciones de Alembic deben usar studyforge_owner
-- para que los permisos por defecto se apliquen correctamente a las tablas creadas.
