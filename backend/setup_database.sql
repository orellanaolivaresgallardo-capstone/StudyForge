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
-- 4. CREAR SCHEMA Y PERMISOS
-- =====================================================
CREATE SCHEMA IF NOT EXISTS studyforge AUTHORIZATION studyforge_owner;

-- Permitir al rol app usar el schema
GRANT USAGE ON SCHEMA studyforge TO studyforge_app;

-- Permisos DML en tablas existentes
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA studyforge TO studyforge_app;

-- Permisos DML en tablas futuras (importante para migraciones)
ALTER DEFAULT PRIVILEGES IN SCHEMA studyforge
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO studyforge_app;

-- Permisos en secuencias (para IDs autoincrementales)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA studyforge TO studyforge_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA studyforge
  GRANT USAGE, SELECT ON SEQUENCES TO studyforge_app;

-- =====================================================
-- RESUMEN DE CONFIGURACIÓN
-- =====================================================

-- Roles creados:
--   • studyforge_owner: para migraciones (DDL)
--   • studyforge_app: para aplicación (DML)
--
-- Base de datos: studyforge
-- Schema: studyforge
--
-- Cadenas de conexión:
--   • ALEMBIC_URL (migraciones):
--     postgresql+psycopg://studyforge_owner:password@localhost:5432/studyforge?options=-csearch_path=studyforge,public
--
--   • DATABASE_URL (aplicación):
--     postgresql+psycopg://studyforge_app:password@localhost:5432/studyforge?options=-csearch_path=studyforge,public
