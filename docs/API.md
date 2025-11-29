# API REST - StudyForge

**Documentación completa de endpoints de la API REST de StudyForge**

Esta documentación está siempre disponible, a diferencia de Swagger que requiere que el servidor esté corriendo.

---

## 📋 Información General

- **Base URL**: `http://localhost:8000` (desarrollo) o `https://api.studyforge.com` (producción)
- **Autenticación**: JWT Bearer Token (excepto `/auth/register` y `/auth/login`)
- **Formato**: JSON para requests y responses
- **Documentación interactiva (runtime)**: [http://localhost:8000/docs](http://localhost:8000/docs)

### Autenticación

Todos los endpoints excepto `/auth/register` y `/auth/login` requieren autenticación mediante JWT.

**Header requerido:**
```http
Authorization: Bearer <access_token>
```

### Códigos de Estado Comunes

- `200` - OK (operación exitosa)
- `201` - Created (recurso creado)
- `204` - No Content (eliminación exitosa)
- `400` - Bad Request (datos inválidos)
- `401` - Unauthorized (no autenticado)
- `403` - Forbidden (sin permisos)
- `404` - Not Found (recurso no encontrado)
- `413` - Payload Too Large (archivo demasiado grande)
- `422` - Unprocessable Entity (validación fallida)
- `500` - Internal Server Error (error del servidor)
- `507` - Insufficient Storage (cuota de almacenamiento excedida)

---

## 🔐 Autenticación (`/auth`)

### `POST /auth/register`

Registra un nuevo usuario en el sistema.

**Request Body:**
```json
{
  "email": "usuario@example.com",
  "username": "usuario123",
  "password": "contraseña_segura"
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid-del-usuario",
  "email": "usuario@example.com",
  "username": "usuario123",
  "created_at": "2025-01-15T10:30:00Z",
  "is_active": true
}
```

**Errores:**
- `400` - Email o username ya existen
- `422` - Datos de validación inválidos

---

### `POST /auth/login`

Autentica un usuario y retorna un token JWT.

**Request Body:**
```json
{
  "email": "usuario@example.com",
  "password": "contraseña_segura"
}
```

**Response:** `200 OK`
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**Errores:**
- `401` - Credenciales inválidas

**Nota:** El token expira en 24 horas.

---

### `GET /auth/me`

Obtiene información del usuario autenticado incluyendo cuotas de almacenamiento.

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response:** `200 OK`
```json
{
  "id": "uuid-del-usuario",
  "email": "usuario@example.com",
  "username": "usuario123",
  "created_at": "2025-01-15T10:30:00Z",
  "is_active": true,
  "max_file_size_mb": 50,
  "storage_quota_mb": 5120,
  "current_storage_mb": 1024.5
}
```

**Errores:**
- `401` - Token inválido o expirado

---

## 📄 Resúmenes (`/summaries`)

### `POST /summaries/upload`

Sube un documento, lo almacena y genera un resumen con IA.

El documento se guarda en la base de datos y se asocia con el resumen generado. Consume espacio de la cuota de almacenamiento del usuario.

**Headers:**
```http
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Form Data:**
- `file` (File, required): Archivo a procesar (PDF, PPTX, DOCX, TXT)
- `expertise_level` (string, required): Nivel de expertise: `"basico"`, `"medio"`, `"avanzado"`

**Response:** `201 Created`
```json
{
  "id": "uuid-del-resumen",
  "user_id": "uuid-del-usuario",
  "title": "Introducción a Machine Learning",
  "content": "Contenido del resumen generado por IA...",
  "expertise_level": "medio",
  "topics": ["machine learning", "redes neuronales", "aprendizaje supervisado"],
  "key_concepts": ["gradiente descendente", "función de pérdida", "overfitting"],
  "created_at": "2025-01-15T10:30:00Z",
  "updated_at": "2025-01-15T10:30:00Z"
}
```

**Errores:**
- `413` - Archivo excede el tamaño máximo permitido
- `507` - Cuota de almacenamiento insuficiente
- `500` - Error al generar resumen con OpenAI

---

### `POST /summaries/from-documents`

Genera un resumen a partir de documentos ya almacenados.

Permite combinar múltiples documentos previamente subidos en un solo resumen. No consume espacio adicional de almacenamiento.

**Headers:**
```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "document_ids": ["uuid-doc-1", "uuid-doc-2"],
  "expertise_level": "avanzado"
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid-del-resumen",
  "user_id": "uuid-del-usuario",
  "title": "Resumen combinado",
  "content": "Contenido del resumen...",
  "expertise_level": "avanzado",
  "topics": ["tema1", "tema2"],
  "key_concepts": ["concepto1", "concepto2"],
  "created_at": "2025-01-15T10:30:00Z",
  "updated_at": "2025-01-15T10:30:00Z"
}
```

**Errores:**
- `400` - Excede el número máximo de documentos
- `403` - Algún documento no pertenece al usuario
- `404` - Algún documento no existe

---

### `GET /summaries`

Lista todos los resúmenes del usuario autenticado (con paginación).

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `skip` (int, optional): Número de registros a saltar (default: 0)
- `limit` (int, optional): Número máximo de registros (default: 100)

**Response:** `200 OK`
```json
{
  "items": [
    {
      "id": "uuid-del-resumen",
      "user_id": "uuid-del-usuario",
      "title": "Título del resumen",
      "content": "Contenido...",
      "expertise_level": "medio",
      "topics": ["tema1", "tema2"],
      "key_concepts": ["concepto1", "concepto2"],
      "created_at": "2025-01-15T10:30:00Z",
      "updated_at": "2025-01-15T10:30:00Z"
    }
  ],
  "total": 42
}
```

---

### `GET /summaries/{summary_id}`

Obtiene un resumen específico con documentos asociados.

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Path Parameters:**
- `summary_id` (UUID, required): ID del resumen

**Response:** `200 OK`
```json
{
  "id": "uuid-del-resumen",
  "user_id": "uuid-del-usuario",
  "document_id": "uuid-documento-o-null",
  "study_space_id": "uuid-espacio",
  "title": "Título del resumen",
  "content": "Contenido completo del resumen...",
  "expertise_level": "medio",
  "topics": ["tema1", "tema2"],
  "key_concepts": ["concepto1", "concepto2"],
  "source_document_title": "documento.pdf",
  "source_document_filename": "documento.pdf",
  "document_state": "active_in_space",
  "created_at": "2025-01-15T10:30:00Z",
  "updated_at": "2025-01-15T10:30:00Z",
  "documents": [
    {
      "id": "uuid-doc-1",
      "filename": "documento.pdf",
      "file_type": "application/pdf",
      "file_size": 1024000,
      "uploaded_at": "2025-01-15T10:25:00Z"
    }
  ]
}
```

**Notas sobre campos**:
- `document_id`: Puede ser `null` si el documento fuente fue eliminado
- `study_space_id`: Siempre presente (NOT NULL, CASCADE on delete)
- `source_document_title`, `source_document_filename`: Campos denormalizados que preservan información histórica
- `document_state`: Estado del documento fuente ('active_in_space' | 'removed_from_space' | 'permanently_deleted')

**Errores:**
- `403` - Resumen no pertenece al usuario
- `404` - Resumen no encontrado

---

### `DELETE /summaries/{summary_id}`

Elimina un resumen.

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Path Parameters:**
- `summary_id` (UUID, required): ID del resumen

**Response:** `204 No Content`

**Errores:**
- `403` - Resumen no pertenece al usuario
- `404` - Resumen no encontrado

---

## 📝 Cuestionarios (`/quizzes`)

### `POST /quizzes/generate-from-file`

Genera un cuestionario a partir de un archivo temporal.

La dificultad se adapta automáticamente según el desempeño histórico del usuario (últimos 5 intentos).

**Headers:**
```http
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Form Data:**
- `file` (File, required): Archivo a procesar
- `topic` (string, optional): Tema específico o `"general"` (default: `"general"`)
- `max_questions` (int, optional): Número de preguntas, máximo 30 (si no se especifica, se calcula automáticamente)

**Response:** `201 Created`
```json
{
  "id": "uuid-del-quiz",
  "user_id": "uuid-del-usuario",
  "summary_id": null,
  "title": "Cuestionario de Machine Learning",
  "topic": "machine learning",
  "difficulty_level": "medio",
  "questions": [
    {
      "question": "¿Qué es el gradiente descendente?",
      "options": {
        "correct": "Un algoritmo de optimización",
        "semi-correct": "Una función de activación",
        "incorrect1": "Un tipo de red neuronal",
        "incorrect2": "Una métrica de evaluación"
      },
      "explanation": "El gradiente descendente es un algoritmo de optimización..."
    }
  ],
  "created_at": "2025-01-15T10:30:00Z"
}
```

**Nota:** Las respuestas correctas NO se incluyen en el response. Las opciones no están randomizadas hasta crear un intento.

---

### `POST /quizzes/generate-from-summary/{summary_id}`

Genera un cuestionario a partir de un resumen existente.

**Headers:**
```http
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Path Parameters:**
- `summary_id` (UUID, required): ID del resumen

**Form Data:**
- `topic` (string, optional): Tema específico o `"general"` (default: `"general"`)
- `max_questions` (int, optional): Número de preguntas, máximo 30

**Response:** `201 Created` (mismo formato que `generate-from-file`)

**Errores:**
- `403` - Resumen no pertenece al usuario
- `404` - Resumen no encontrado

---

### `GET /quizzes`

Lista todos los cuestionarios del usuario (con paginación).

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `skip` (int, optional): Número de registros a saltar (default: 0)
- `limit` (int, optional): Número máximo de registros (default: 100)

**Response:** `200 OK`
```json
{
  "items": [
    {
      "id": "uuid-del-quiz",
      "user_id": "uuid-del-usuario",
      "summary_id": "uuid-del-resumen",
      "title": "Cuestionario de...",
      "topic": "machine learning",
      "difficulty_level": "medio",
      "questions": [...],
      "created_at": "2025-01-15T10:30:00Z"
    }
  ],
  "total": 15
}
```

---

### `GET /quizzes/{quiz_id}`

Obtiene un cuestionario específico con sus preguntas.

**IMPORTANTE:** Las respuestas correctas NO se incluyen en este endpoint. Para obtener respuestas correctas, crear un intento y usar `/quiz-attempts/{id}/answer` o `/quiz-attempts/{id}/results`.

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Path Parameters:**
- `quiz_id` (UUID, required): ID del cuestionario

**Response:** `200 OK` (mismo formato que al generar)

**Errores:**
- `403` - Cuestionario no pertenece al usuario
- `404` - Cuestionario no encontrado

---

## ✅ Intentos de Cuestionarios (`/quiz-attempts`)

### `POST /quiz-attempts`

Inicia un nuevo intento de cuestionario con opciones aleatorizadas.

**Headers:**
```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "quiz_id": "uuid-del-quiz"
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid-del-intento",
  "quiz_id": "uuid-del-quiz",
  "user_id": "uuid-del-usuario",
  "started_at": "2025-01-15T10:30:00Z",
  "completed_at": null,
  "score": null,
  "correct_answers": ["B", "A", "D", "C"],
  "user_answers": [],
  "randomized_questions": [
    {
      "question": "¿Qué es el gradiente descendente?",
      "options": {
        "A": "Una función de activación",
        "B": "Un algoritmo de optimización",
        "C": "Una métrica de evaluación",
        "D": "Un tipo de red neuronal"
      }
    }
  ]
}
```

**Nota:** Las opciones están randomizadas. El campo `correct_answers` contiene las respuestas correctas según la randomización de este intento específico.

**Errores:**
- `403` - Cuestionario no pertenece al usuario
- `404` - Cuestionario no encontrado

---

### `POST /quiz-attempts/{attempt_id}/answer`

Responde una pregunta y obtiene feedback inmediato.

**Headers:**
```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Path Parameters:**
- `attempt_id` (UUID, required): ID del intento

**Request Body:**
```json
{
  "question_index": 0,
  "selected_option": "B"
}
```

**Response:** `200 OK`
```json
{
  "is_correct": true,
  "correct_option": "B",
  "explanation": "El gradiente descendente es un algoritmo de optimización que minimiza...",
  "selected_option": "B",
  "score_so_far": 25.0
}
```

**Errores:**
- `400` - Intento ya completado, índice inválido, o pregunta ya respondida
- `403` - Intento no pertenece al usuario
- `404` - Intento no encontrado

---

### `POST /quiz-attempts/{attempt_id}/complete`

Completa un intento de cuestionario y calcula el score final.

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Path Parameters:**
- `attempt_id` (UUID, required): ID del intento

**Response:** `200 OK`
```json
{
  "id": "uuid-del-intento",
  "quiz_id": "uuid-del-quiz",
  "user_id": "uuid-del-usuario",
  "started_at": "2025-01-15T10:30:00Z",
  "completed_at": "2025-01-15T10:45:00Z",
  "score": 75.0,
  "correct_answers": ["B", "A", "D", "C"],
  "user_answers": ["B", "A", "D", "A"]
}
```

**Errores:**
- `400` - Intento ya completado o no se respondieron preguntas
- `403` - Intento no pertenece al usuario
- `404` - Intento no encontrado

---

### `GET /quiz-attempts/{attempt_id}/results`

Obtiene los resultados detallados de un intento completado.

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Path Parameters:**
- `attempt_id` (UUID, required): ID del intento

**Response:** `200 OK`
```json
{
  "attempt_id": "uuid-del-intento",
  "quiz_id": "uuid-del-quiz",
  "score": 75.0,
  "total_questions": 4,
  "correct_answers": 3,
  "incorrect_answers": 1,
  "completed_at": "2025-01-15T10:45:00Z",
  "questions": [
    {
      "question_text": "¿Qué es el gradiente descendente?",
      "options": {
        "A": "Una función de activación",
        "B": "Un algoritmo de optimización",
        "C": "Una métrica de evaluación",
        "D": "Un tipo de red neuronal"
      },
      "correct_option": "B",
      "selected_option": "B",
      "is_correct": true,
      "explanation": "El gradiente descendente es un algoritmo de optimización..."
    }
  ]
}
```

**Errores:**
- `400` - Intento no ha sido completado
- `403` - Intento no pertenece al usuario
- `404` - Intento no encontrado

---

## 📊 Estadísticas (`/stats`)

### `GET /stats/progress`

Obtiene estadísticas de progreso del usuario por tema.

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response:** `200 OK`
```json
{
  "total_attempts": 42,
  "avg_score_overall": 78.5,
  "progress_by_topic": [
    {
      "topic": "machine learning",
      "total_attempts": 15,
      "avg_score": 82.3,
      "max_score": 95.0,
      "min_score": 60.0
    },
    {
      "topic": "python",
      "total_attempts": 10,
      "avg_score": 75.5,
      "max_score": 90.0,
      "min_score": 55.0
    }
  ]
}
```

---

### `GET /stats/performance`

Obtiene el historial de desempeño del usuario.

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `limit` (int, optional): Número de intentos recientes a retornar (default: 10)

**Response:** `200 OK`
```json
{
  "recent_attempts": [
    {
      "attempt_id": "uuid-del-intento",
      "quiz_id": "uuid-del-quiz",
      "quiz_title": "Cuestionario de Machine Learning",
      "topic": "machine learning",
      "difficulty_level": "medio",
      "score": 85.0,
      "completed_at": "2025-01-15T10:45:00Z"
    }
  ]
}
```

---

### `GET /stats/summary`

Obtiene un resumen completo de estadísticas del usuario.

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response:** `200 OK`
```json
{
  "total_summaries": 12,
  "total_quizzes": 18,
  "total_completed_attempts": 42,
  "avg_score": 78.5,
  "best_score": 95.0,
  "unique_topics_studied": 5
}
```

---

## 📚 Schemas de Datos

### ExpertiseLevelEnum
- `"basico"` - Vocabulario simple y conceptos fundamentales
- `"medio"` - Balance entre detalle y claridad
- `"avanzado"` - Análisis técnico y profundo

### DifficultyLevelEnum
- `"facil"` - Preguntas básicas
- `"medio"` - Preguntas moderadas
- `"dificil"` - Preguntas avanzadas

### Límites y Cuotas
- **Tamaño máximo de archivo**: 50 MB por defecto (configurable por usuario)
- **Cuota de almacenamiento**: 5 GB por defecto (configurable por usuario)
- **Máximo de preguntas por quiz**: 30
- **Documentos por resumen combinado**: Variable (límite en servicio)
- **Token JWT expiración**: 24 horas

---

## 🔒 Seguridad

- **Contraseñas**: Hash con Argon2id
- **Autenticación**: JWT stateless con expiración de 24 horas
- **Autorización**: Validación de ownership en todos los recursos
- **Validación**: Pydantic para todos los datos de entrada
- **Rate Limiting**: Middleware de límites de peticiones
- **Tipo de archivo**: Validación con magic numbers

Ver detalles completos en [SECURITY.md](SECURITY.md)

---

## 🐛 Manejo de Errores

Todos los errores siguen el formato estándar de FastAPI:

```json
{
  "detail": "Descripción del error"
}
```

Para errores de validación (`422`):

```json
{
  "detail": [
    {
      "loc": ["body", "email"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

---

## 📖 Recursos Adicionales

- **Documentación interactiva**: [http://localhost:8000/docs](http://localhost:8000/docs) (requiere servidor corriendo)
- **Arquitectura**: [ARCHITECTURE.md](ARCHITECTURE.md)
- **Flujos de integración**: [INTEGRATION.md](INTEGRATION.md)
- **Base de datos**: [DATABASE.md](DATABASE.md)
