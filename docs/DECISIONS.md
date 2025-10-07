# DECISIONS — Registro de decisiones técnicas

> Documento breve para consultar el “qué se decidió” y “por qué” con fechas.

## 2025-10-06 — Esquema por defecto: `studyforge`
- **Decisión**: Usar `studyforge` como schema por defecto en PostgreSQL (no `public`).
- **Motivo**: Aislar objetos, facilitar permisos y limpieza.
- **Implementación**: `search_path=studyforge,public` en las cadenas de conexión. Alembic configurado con `version_table_schema="studyforge"` e `include_schemas=True`.

## 2025-10-06 — Alembic con `ALEMBIC_URL` y separación de roles
- **Decisión**: `.env.alembic` usa `ALEMBIC_URL` (rol owner) y el backend `.env` usa `DATABASE_URL` (rol app).
- **Motivo**: Separar permisos (DDL vs DML), evitar errores y robustecer migraciones.
- **Implementación**: `alembic/env.py` carga `.env.alembic` y fuerza `search_path` a `studyforge, public`.

## 2025-10-06 — Validación Pydantic v2 en `POST /documents`
- **Decisión**: Rechazar `title` y `content` vacíos o solo espacios.
- **Motivo**: Integridad de datos desde la capa API.
- **Implementación**: `DocumentIn` con validadores y `Field(min_length=1)`.

## 2025-10-06 — CHECKs en base de datos para `documents`
- **Decisión**: Añadir `CHECK (char_length(btrim(title)) > 0)` y lo mismo para `content`.
- **Motivo**: Defensa en profundidad ante inserciones directas a la BD.
- **Implementación**: Migración Alembic que primero normaliza filas viejas y luego agrega los CHECKs.
