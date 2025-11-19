# DECISIONS — Registro de decisiones técnicas

> Documento breve para consultar el "qué se decidió" y "por qué" con fechas.

## 2025-11-18 — Reimplementación completa del backend

- **Decisión**: Rehacer el backend desde cero manteniendo el concepto de la aplicación.
- **Motivo**: Implementar nueva arquitectura más robusta y escalable con funcionalidades de IA completas.
- **Implementación**: Nueva estructura en capas (models → repositories → services → routers).

## 2025-11-18 — UUID como clave primaria

- **Decisión**: Usar UUID (v4) como clave primaria en todas las tablas.
- **Motivo**: Mejor para sistemas distribuidos, previene enumeración, más seguro.
- **Implementación**: `id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)` en todos los modelos.

## 2025-11-18 — Schema `studyforge` en PostgreSQL

- **Decisión**: Usar `studyforge` como schema por defecto en PostgreSQL (no `public`).
- **Motivo**: Aislar objetos, facilitar permisos y limpieza, separar aplicación de datos del sistema.
- **Implementación**: `search_path=studyforge,public` en las cadenas de conexión. Alembic configurado con `version_table_schema="studyforge"`.

## 2025-11-18 — Separación de roles de base de datos

- **Decisión**: `studyforge_owner` para migraciones (DDL) y `studyforge_app` para aplicación (DML).
- **Motivo**: Principio de menor privilegio, seguridad en producción.
- **Implementación**:
  - `ALEMBIC_URL` usa `studyforge_owner`
  - `DATABASE_URL` usa `studyforge_app`
  - Permisos DML (SELECT, INSERT, UPDATE, DELETE) otorgados explícitamente

## 2025-11-18 — No almacenar documentos originales

- **Decisión**: Procesar archivos solo para generar resúmenes, no almacenar el contenido original.
- **Motivo**: Privacidad del usuario, optimización de almacenamiento.
- **Implementación**:
  - Extracción temporal del texto con `FileProcessor`
  - Generación de resumen con OpenAI
  - Solo guardar: título, resumen, temas, conceptos clave, y metadatos del archivo original

## 2025-11-18 — OpenAI GPT-4o-mini para generación de contenido

- **Decisión**: Usar `gpt-4o-mini` como modelo por defecto.
- **Motivo**: Balance entre costo y calidad, suficiente para resúmenes y quizzes educativos.
- **Implementación**: Configurable vía `OPENAI_MODEL` en `.env`.

## 2025-11-18 — Tres niveles de expertise para resúmenes

- **Decisión**: Soportar tres niveles de expertise: básico, medio, avanzado.
- **Motivo**: Adaptabilidad a diferentes niveles de conocimiento del usuario.
- **Implementación**:
  - Enum `ExpertiseLevel` en modelo `Summary`
  - Prompts diferenciados en `OpenAIService.generate_summary()`

## 2025-11-18 — Sistema de dificultad adaptativa para quizzes

- **Decisión**: Ajustar dificultad basándose en los últimos 5 intentos del usuario.
- **Motivo**: Personalización del aprendizaje, mantener al usuario en zona de desarrollo próximo.
- **Implementación**:
  - `QuizService.calculate_adaptive_difficulty()`
  - Escala 1-5 basada en promedio de scores
  - Por tema (topic-specific)

## 2025-11-18 — Máximo 30 preguntas por cuestionario

- **Decisión**: Limitar cuestionarios a máximo 30 preguntas.
- **Motivo**: Evitar fatiga del usuario, optimizar costos de API de OpenAI.
- **Implementación**: Validación en schemas con `max_questions: int = Field(le=30)`.

## 2025-11-18 — Argon2 para hashing de contraseñas

- **Decisión**: Usar Argon2id en lugar de bcrypt.
- **Motivo**: Ganador de la Password Hashing Competition, más resistente a ataques GPU/ASIC.
- **Implementación**: `argon2-cffi` con configuración por defecto (memory-hard).

## 2025-11-18 — JWT para autenticación stateless

- **Decisión**: Tokens JWT con expiración de 24 horas.
- **Motivo**: Stateless, escalable, estándar de la industria.
- **Implementación**: `python-jose` con algoritmo HS256, secret key configurable.

## 2025-11-18 — Feedback inmediato en quizzes

- **Decisión**: Proporcionar respuesta correcta y explicación al responder cada pregunta.
- **Motivo**: Refuerzo inmediato mejora el aprendizaje.
- **Implementación**: Endpoint `POST /quiz-attempts/{id}/answer` retorna `AnswerFeedback`.

## 2025-11-18 — JSONB para contenido estructurado

- **Decisión**: Usar columnas JSONB para `content` en `summaries` y datos estructurados.
- **Motivo**: Flexibilidad en estructura de datos, soporte nativo de PostgreSQL para queries.
- **Implementación**: `content = Column(JSONB, nullable=False)` con estructura validada por Pydantic.

## 2025-11-19 — Encoding UTF-8 con CRLF para Windows

- **Decisión**: Todos los archivos del proyecto en UTF-8 con line endings CRLF.
- **Motivo**: Compatibilidad con Windows, evitar problemas de decodificación.
- **Implementación**:
  - Conversión con `unix2dos`
  - Script de verificación `verify_encoding.py` (modo binario)
  - Archivos corregidos: `requirements.txt` (UTF-16 → UTF-8), `__init__.py` files (ISO-8859-1 → UTF-8)

## 2025-11-19 — Arquitectura en capas

- **Decisión**: Separación estricta en 4 capas: Models → Repositories → Services → Routers.
- **Motivo**: Separación de responsabilidades, testabilidad, mantenibilidad.
- **Implementación**:
  - **Models**: Definición de tablas SQLAlchemy
  - **Repositories**: Acceso a datos (CRUD)
  - **Services**: Lógica de negocio (validaciones, cálculos, integración con OpenAI)
  - **Routers**: Endpoints HTTP (validación de entrada, autenticación)

## 2025-11-19 — Pydantic v2 para validación

- **Decisión**: Usar Pydantic v2 con `pydantic-settings` para configuración.
- **Motivo**: Validación robusta de tipos, generación automática de OpenAPI schemas.
- **Implementación**: Schemas en `app/schemas/`, Settings en `app/config.py`.
