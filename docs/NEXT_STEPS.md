# NEXT_STEPS — Próximos pasos inmediatos

**Última actualización:** 2025-11-19

**Estado actual:** Backend completamente funcional con todos los endpoints implementados y probados. Base de datos configurada, migraciones aplicadas, autenticación funcionando. Sistema de documentos y cuotas implementado, validaciones de ownership centralizadas. **Fase 0.1, 0.2 y 0.3 COMPLETADAS**. Sistema multi-documento funcionando con logging estructurado integrado, rate limiting implementado, y validación de archivos con magic numbers para seguridad.

---

## Fase 0 — Tareas pendientes del backend (críticas antes de producción)

### 0.1 Migraciones de base de datos ✅ COMPLETADO
- [x] **Generar migración de Alembic** para nuevas tablas y campos
  - [x] Tabla `documents` (id, user_id, title, file_name, file_type, file_size_bytes, file_content, extracted_text, created_at, updated_at)
  - [x] Tabla `summary_documents` (summary_id, document_id) - relación many-to-many
  - [x] Campos en `users`: storage_quota_bytes, storage_used_bytes, max_documents_per_summary, max_file_size_bytes
  - [x] Actualizar campo `summaries`: eliminar original_file_name, original_file_type
- [x] **Aplicar migración** en base de datos de desarrollo (f4f083c1d0fc)
- [x] **Verificar constraints** y foreign keys
- [ ] **Probar rollback** de la migración (pendiente)

### 0.2 Actualización de servicios para multi-documento ✅ COMPLETADO
- [x] **Actualizar SummaryService.create_summary_from_file**
  - [x] Guardar documento en tabla documents primero
  - [x] Crear relación con summary en summary_documents
  - [x] Actualizar storage_used_bytes del usuario
  - [x] Manejar errores y rollback si falla
  - [x] Validar cuotas (max_file_size_bytes, storage_available_bytes)
  - [x] Logging de operaciones de cuotas y OpenAI
- [x] **Crear endpoint para generar summary desde documentos existentes**
  - [x] `POST /summaries/from-documents` con lista de document_ids
  - [x] Validar que no excedan max_documents_per_summary
  - [x] Validar ownership de todos los documentos
  - [x] Concatenar extracted_text de múltiples documentos
- [x] **Actualizar eliminación de summaries**
  - [x] NO eliminar documentos asociados (pueden estar en otros summaries)
  - [x] Solo eliminar relación en summary_documents (cascade automático)

### 0.3 Seguridad y logging ✅ COMPLETADO
- [x] **Implementar logging estructurado** ✅ COMPLETADO
  - [x] Logging de eventos de autenticación (login, register, failed attempts)
  - [x] Logging de operaciones de cuotas (upload, quota exceeded)
  - [x] Logging de errores de validación de ownership
  - [x] Configurar niveles de log (DEBUG, INFO, WARNING, ERROR, CRITICAL)
  - [x] Sistema centralizado en `app/core/logging.py`
  - [x] Funciones especializadas: `log_auth_event`, `log_quota_event`, `log_ownership_validation`, `log_openai_request`, `log_error`
- [x] **Implementar rate limiting** ✅ COMPLETADO
  - [x] Middleware personalizado basado en ventanas deslizantes
  - [x] Limitar requests por IP (100 requests / 60 segundos configurable)
  - [x] Rutas exentas configurables (/health, /docs, /redoc, /openapi.json)
  - [x] Headers informativos (X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset)
  - [x] Respuesta 429 con Retry-After header
  - [x] Implementado en `app/core/rate_limiter.py`
  - [x] Tests completos (7 tests pasando)
- [x] **Validación adicional de archivos** ✅ COMPLETADO
  - [x] Verificar magic numbers (file signatures) además de extensión
  - [x] Validación para PDF, Office (DOCX, PPTX), Office Legacy (DOC, PPT), y TXT
  - [x] Prevenir evasión con extensiones falsas
  - [x] Validación adicional para archivos ZIP-based Office (verifica estructura interna)
  - [x] Implementado en `app/core/file_validator.py`
  - [x] Integrado en `FileProcessor.validate_file_security()`
  - [x] Tests completos (17 tests pasando)

### 0.4 Mejoras opcionales de seguridad
- [ ] **Encriptación de datos sensibles** (opcional)
  - [ ] Encriptar file_content en documents
  - [ ] Encriptar content en summaries
  - [ ] Usar cryptography library (Fernet o AES)
  - [ ] Gestión segura de encryption keys
- [ ] **Sanitización de inputs**
  - [ ] Validar y sanitizar títulos de documentos
  - [ ] Prevenir inyección en campos de texto
- [ ] **HTTPS/TLS enforcement**
  - [ ] Configurar redirect HTTP → HTTPS en producción
  - [ ] Headers de seguridad (HSTS, CSP, etc.)

---

## Fase 1 — Testing y validación del backend (alta prioridad)

### 1.1 Tests unitarios
- [ ] Escribir tests para repositories (CRUD operations)
- [ ] Escribir tests para services (lógica de negocio)
  - [ ] `AuthService` (registro, login, validaciones)
  - [ ] `FileProcessor` (extracción de texto de diferentes formatos)
  - [ ] `QuizService` (dificultad adaptativa)
- [ ] Configurar pytest con fixtures para database
- [ ] Añadir coverage reporting

### 1.2 Tests de integración
- [ ] Flujo completo: registro → login → upload → summary
- [ ] Flujo completo: summary → quiz → attempt → results
- [ ] Test de sistema adaptativo con múltiples intentos
- [ ] Test de permisos y autenticación
- [ ] Test de límites (max file size, max questions)

### 1.3 Mocking de OpenAI
- [ ] Crear fixtures con respuestas simuladas de OpenAI
- [ ] Tests sin consumir API real (para CI/CD)
- [ ] Tests con diferentes tipos de contenido

---

## Fase 2 — Frontend básico (MVP)

### 2.1 Configuración inicial
- [ ] Revisar y actualizar dependencias del frontend
- [ ] Configurar cliente HTTP (axios/fetch) apuntando a `http://localhost:8000`
- [ ] Configurar manejo de tokens JWT (localStorage/sessionStorage)
- [ ] Implementar contexto de autenticación con React Context

### 2.2 Páginas de autenticación
- [ ] Página de registro (`/register`)
  - [ ] Formulario con email, username, password
  - [ ] Validación client-side
  - [ ] Manejo de errores (email duplicado, etc.)
- [ ] Página de login (`/login`)
  - [ ] Formulario de login
  - [ ] Guardar token en localStorage
  - [ ] Redirección a dashboard
- [ ] Página de perfil (`/profile`)
  - [ ] Mostrar información del usuario
  - [ ] Botón de logout

### 2.3 Dashboard principal
- [ ] Layout con navegación
- [ ] Resumen de estadísticas del usuario
  - [ ] Total de documentos almacenados
  - [ ] Total de resúmenes creados
  - [ ] Total de quizzes realizados
  - [ ] Score promedio
  - [ ] **Indicador de uso de almacenamiento** (barra de progreso)
- [ ] Acceso rápido a funcionalidades principales

### 2.4 Gestión de documentos
- [ ] Página de lista de documentos (`/documents`)
  - [ ] Cards con título, tipo de archivo, tamaño, fecha
  - [ ] **Indicador visual de uso de cuota** en header
  - [ ] Búsqueda por título
  - [ ] Filtros por tipo de archivo
  - [ ] Botón para subir nuevo documento
- [ ] Modal/Página de upload de documento (`/documents/upload`)
  - [ ] Drag & drop o selector de archivos
  - [ ] **Validación client-side de tamaño contra cuota disponible**
  - [ ] Preview del archivo seleccionado
  - [ ] Campo de título (opcional)
  - [ ] Loading state durante upload
  - [ ] Manejo de errores (cuota excedida, archivo muy grande)
- [ ] Vista detallada de documento (`/documents/:id`)
  - [ ] Información del documento (nombre, tipo, tamaño, fecha)
  - [ ] Botón para editar título
  - [ ] Botón para generar resumen desde este documento
  - [ ] Botón eliminar con confirmación
  - [ ] **Mostrar texto extraído** (opcional, preview)
- [ ] **Widget de cuotas en sidebar/header**
  - [ ] Barra de progreso de almacenamiento usado
  - [ ] Texto: "X MB de Y GB usados"
  - [ ] Link a página de configuración/upgrade

### 2.5 Gestión de resúmenes
- [ ] Página de generación de resumen (`/summaries/new`)
  - [ ] **Opción 1: Upload nuevo documento** (legacy, genera y almacena)
    - [ ] Drag & drop o selector de archivos
    - [ ] Selector de nivel de expertise
    - [ ] Preview del archivo seleccionado
    - [ ] Loading state durante procesamiento
    - [ ] Manejo de errores (OpenAI quota, archivo inválido)
  - [ ] **Opción 2: Desde documentos existentes** (nuevo flujo)
    - [ ] Selector múltiple de documentos (hasta max_documents_per_summary)
    - [ ] Validación de límite configurable
    - [ ] Selector de nivel de expertise
    - [ ] Preview de documentos seleccionados
    - [ ] Loading state durante generación
- [ ] Lista de resúmenes (`/summaries`)
  - [ ] Cards con título, nivel, fecha
  - [ ] **Mostrar documentos asociados** (íconos o badges)
  - [ ] Filtros por nivel de expertise
  - [ ] Búsqueda por título/tema
- [ ] Vista detallada de resumen (`/summaries/:id`)
  - [ ] Título y metadatos
  - [ ] **Lista de documentos fuente** (links clickeables)
  - [ ] Contenido del resumen formateado
  - [ ] Lista de temas y conceptos clave
  - [ ] Botón "Generar quiz desde este resumen"
  - [ ] Botón eliminar (NO elimina documentos asociados)

### 2.6 Sistema de quizzes
- [ ] Generación de quiz
  - [ ] Desde archivo nuevo
  - [ ] Desde resumen existente
  - [ ] Selector de tema
  - [ ] Selector de número de preguntas
- [ ] Tomar quiz (`/quiz/:id/attempt`)
  - [ ] Mostrar pregunta actual
  - [ ] Opciones A, B, C, D
  - [ ] Feedback inmediato al responder
    - [ ] Mostrar si es correcta
    - [ ] Mostrar respuesta correcta si falla
    - [ ] Mostrar explicación
  - [ ] Navegación entre preguntas
  - [ ] Progreso visual (X de Y preguntas)
- [ ] Resultados de quiz (`/quiz/attempts/:id/results`)
  - [ ] Score final
  - [ ] Desglose por pregunta
  - [ ] Recomendaciones basadas en resultados

### 2.7 Estadísticas y progreso
- [ ] Página de estadísticas (`/stats`)
  - [ ] Gráfica de progreso por tema
  - [ ] Historial de intentos recientes
  - [ ] Evolución de dificultad adaptativa
  - [ ] Temas que requieren más práctica

---

## Fase 3 — Mejoras y optimización

### 3.1 UX/UI
- [ ] Implementar diseño responsive completo
- [ ] Añadir animaciones y transiciones
- [ ] Dark mode
- [ ] Toast notifications para feedback
- [ ] Loading skeletons
- [ ] Manejo de estados vacíos (empty states)

### 3.2 Features adicionales
- [ ] Modo de estudio espaciado (spaced repetition)
- [ ] Exportar resúmenes a PDF
- [ ] Compartir quizzes con otros usuarios
- [ ] Sistema de badges/logros
- [ ] Streaks de estudio diario

### 3.3 Performance
- [ ] Caché de resúmenes en frontend
- [ ] Paginación de listas
- [ ] Lazy loading de imágenes
- [ ] Code splitting por rutas
- [ ] Service Worker para offline support

### 3.4 Backend optimizations
- [ ] Implementar rate limiting
- [ ] Caché de respuestas de OpenAI (mismo contenido)
- [ ] Background jobs para procesamiento de archivos grandes
- [ ] Compresión de respuestas HTTP
- [ ] CDN para assets estáticos

---

## Fase 4 — Deployment

### 4.1 Preparación
- [ ] Dockerfile para backend
- [ ] Dockerfile para frontend
- [ ] docker-compose.yml para desarrollo local
- [ ] Variables de entorno para producción
- [ ] Script de inicialización de BD

### 4.2 Deploy en Render o GCP
- [ ] Configurar PostgreSQL en cloud
- [ ] Deploy del backend
- [ ] Deploy del frontend
- [ ] Configurar dominio y HTTPS
- [ ] Configurar CORS correctamente
- [ ] Configurar secrets y API keys
- [ ] Health checks y monitoring

### 4.3 CI/CD
- [ ] GitHub Actions para tests
- [ ] Auto-deploy en merge a main
- [ ] Linting y formateo automático
- [ ] Notificaciones de deploy

---

## Fase 5 — Documentación y mantenimiento

### 5.1 Documentación
- [ ] README actualizado con screenshots
- [ ] Guía de instalación local
- [ ] Guía de contribución
- [ ] API documentation (mejorar Swagger)
- [ ] User guide/tutorial
- [ ] Video demo

### 5.2 Monitoring y analytics
- [ ] Logging estructurado
- [ ] Error tracking (Sentry)
- [ ] Analytics de uso
- [ ] Dashboards de métricas

---

## Prioridades inmediatas (esta semana)

### ✅ COMPLETADAS (Fase 0.1, 0.2, 0.3 parcial):
1. ✅ **Generar y aplicar migración de Alembic** - Tablas documents, summary_documents y campos de cuotas
2. ✅ **Actualizar SummaryService** - Sistema multi-documento completamente integrado
3. ✅ **Implementar logging estructurado** - Eventos de autenticación, cuotas, ownership y OpenAI
4. ✅ **Endpoint nuevo** - `POST /summaries/from-documents` para reutilizar documentos almacenados

### ⏳ PENDIENTES (Fase 0.3 - críticas antes de producción):
5. **Rate limiting** - Protección contra abuso de API
6. **Validación de magic numbers** - Seguridad adicional en uploads
7. **Tests básicos del backend** - Asegurar que la lógica core funciona correctamente

### Siguientes pasos (Fase 1 y 2):
8. **Frontend: Auth + Upload** - Flujo básico funcionando end-to-end
9. **Frontend: Gestión de documentos** - Listar, ver detalles, eliminar documentos
10. **Frontend: Lista y vista de resúmenes** - Poder visualizar lo generado
11. **Deployment en Render (staging)** - Tener ambiente de pruebas accesible

---

## Notas

### Sistema Actualizado (2025-11-19)
- El backend está **100% funcional** con endpoints implementados
- ✅ **Migración de BD aplicada** - Tablas documents, summary_documents y campos de cuotas funcionando
- ✅ **Sistema multi-documento** - Documentos almacenados pueden reutilizarse para múltiples resúmenes
- ✅ **Logging estructurado** - Sistema completo de auditoría y debugging
- ✅ **Validación de cuotas** - storage_quota_bytes, storage_used_bytes, max_file_size_bytes
- La API está documentada en `/docs` (Swagger UI)
- Se requiere **créditos en OpenAI** para funciones de IA (summaries y quizzes)
- El proyecto está configurado para Windows con encoding UTF-8 CRLF
- **Type hints corregidos** para compatibilidad con SQLAlchemy type checkers

### Nuevos Endpoints
- `POST /summaries/upload` - Ahora almacena el documento y lo asocia con el resumen
- `POST /summaries/from-documents` - Genera resumen desde documentos ya almacenados (no consume storage adicional)

---

## Referencias

- Arquitectura completa: **[docs/ARCHITECTURE.md](ARCHITECTURE.md)**
- Implementación detallada: **[docs/IMPLEMENTATION.md](IMPLEMENTATION.md)**
- Decisiones técnicas: **[docs/DECISIONS.md](DECISIONS.md)**
- Roadmap a largo plazo: **[docs/ROADMAP.md](ROADMAP.md)**
