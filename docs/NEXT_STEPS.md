# NEXT_STEPS — Próximos pasos inmediatos

**Última actualización:** 2025-11-19

**Estado actual:** Backend completamente funcional con todos los endpoints implementados y probados. Base de datos configurada, migraciones aplicadas, autenticación funcionando. Sistema de documentos y cuotas implementado, validaciones de ownership centralizadas. **Fases 0.1, 0.2, 0.3 COMPLETADAS**. Sistema multi-documento funcionando con logging estructurado integrado, rate limiting implementado, y validación de archivos con magic numbers para seguridad.

**Frontend MVP COMPLETO**: **Fases 2.1, 2.2, 2.4, 2.5, 2.6 y 2.7 COMPLETADAS AL 100%**. Sistema completo de autenticación, gestión de documentos con drag-and-drop, sistema de resúmenes (lista, creación desde documentos, vista detallada), sistema de quizzes completo (lista de quizzes, generación, toma con feedback inmediato, resultados detallados), y dashboard de estadísticas con progreso por tema y historial de intentos. Navbar actualizada con todos los enlaces. Diseño aurora gradient preservado en toda la aplicación. **Flujo end-to-end completamente funcional**: documento → resumen → quiz → resultados → estadísticas.

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

### 2.1 Configuración inicial ✅ COMPLETADO
- [x] Revisar y actualizar dependencias del frontend
- [x] Configurar cliente HTTP (axios) apuntando a `http://localhost:8000`
- [x] Configurar manejo de tokens JWT (localStorage/sessionStorage)
- [x] Implementar contexto de autenticación con React Context (`AuthContext`)
- [x] Implementar tipos TypeScript completos (`api.types.ts`)
- [x] Crear servicio API completo (`api.ts`) con interceptors JWT

### 2.2 Páginas de autenticación ✅ COMPLETADO
- [x] Página de registro (`/signup`)
  - [x] Formulario con email, username, password
  - [x] Validación client-side
  - [x] Manejo de errores (email duplicado, etc.)
  - [x] Diseño aurora gradient preservado
  - [x] Integración con AuthContext
  - [x] Redirección a /documents
- [x] Página de login (`/login`)
  - [x] Formulario de login
  - [x] Guardar token en localStorage/sessionStorage
  - [x] Redirección a /documents
  - [x] Diseño aurora gradient preservado
  - [x] Integración con AuthContext
- [x] ProtectedRoute component para rutas privadas
- [ ] Página de perfil (`/profile`) (pendiente)
  - [ ] Mostrar información del usuario
  - [ ] Botón de logout

### 2.3 Dashboard principal (OMITIDO - /documents es el dashboard)
- [x] Redirigir `/` → `/documents` directamente
- [x] Layout básico con header glass morphism
- [x] Botón de logout en header

### 2.4 Gestión de documentos ✅ PARCIALMENTE COMPLETADO
- [x] Página de lista de documentos (`/documents`)
  - [x] Cards con título, tipo de archivo, tamaño, fecha
  - [ ] **Indicador visual de uso de cuota** en header (pendiente)
  - [ ] Búsqueda por título (pendiente)
  - [ ] Filtros por tipo de archivo (pendiente)
  - [x] Botón para subir nuevo documento (integrado en mismo view)
- [x] Zona de upload de documento (inline en `/documents`)
  - [x] Drag & drop y selector de archivos
  - [x] **Validación client-side de tamaño contra cuota disponible**
  - [ ] Preview del archivo seleccionado (pendiente)
  - [ ] Campo de título (pendiente - usa filename por defecto)
  - [x] Loading state durante upload
  - [x] Manejo de errores (cuota excedida, archivo muy grande)
  - [x] Diseño aurora gradient preservado
- [ ] Vista detallada de documento (`/documents/:id`) (pendiente)
  - [ ] Información del documento (nombre, tipo, tamaño, fecha)
  - [ ] Botón para editar título
  - [ ] Botón para generar resumen desde este documento
  - [x] Botón eliminar con confirmación (implementado inline en lista)
  - [ ] **Mostrar texto extraído** (opcional, preview)
- [ ] **Widget de cuotas en sidebar/header** (pendiente)
  - [ ] Barra de progreso de almacenamiento usado
  - [ ] Texto: "X MB de Y GB usados"
  - [ ] Link a página de configuración/upgrade

### 2.5 Gestión de resúmenes ✅ COMPLETADO
- [x] Página de generación de resumen (modal integrado en `/summaries`)
  - [x] **Opción 2: Desde documentos existentes** (flujo principal implementado)
    - [x] Selector múltiple de documentos (hasta max_documents_per_summary)
    - [x] Validación de límite configurable
    - [x] Selector de nivel de expertise
    - [x] Preview de documentos seleccionados
    - [x] Loading state durante generación
  - [ ] **Opción 1: Upload nuevo documento** (pendiente, disponible en `/documents`)
    - [ ] Drag & drop o selector de archivos
    - [ ] Selector de nivel de expertise
    - [ ] Preview del archivo seleccionado
    - [ ] Loading state durante procesamiento
    - [ ] Manejo de errores (OpenAI quota, archivo inválido)
- [x] Lista de resúmenes (`/summaries`)
  - [x] Cards con título, nivel, fecha
  - [x] Mostrar temas y conceptos clave (badges)
  - [x] Botón para crear nuevo resumen
  - [x] Botón ver y eliminar por resumen
  - [x] Diseño aurora gradient preservado
  - [ ] Filtros por nivel de expertise (pendiente)
  - [ ] Búsqueda por título/tema (pendiente)
  - [ ] Indicador de documentos asociados en cards (pendiente)
- [x] Vista detallada de resumen (`/summaries/:id`)
  - [x] Título y metadatos (nivel, fecha, cantidad de documentos)
  - [x] **Lista de documentos fuente** (cards clickeables)
  - [x] Contenido del resumen formateado
  - [x] Lista de temas y conceptos clave (badges visuales)
  - [x] Botón "Generar cuestionario" (placeholder)
  - [x] Botón eliminar con confirmación (NO elimina documentos asociados)
  - [x] Navegación de regreso a lista
  - [x] Loading states y manejo de errores
  - [x] Diseño aurora gradient preservado

### 2.6 Sistema de quizzes ✅ COMPLETADO AL 100%
- [x] **Lista de quizzes** (`/quizzes`)
  - [x] Cards con título, tema, dificultad y número de preguntas
  - [x] Badge de dificultad con código de colores (1-5)
  - [x] Botón de inicio para cada quiz
  - [x] Empty state con redirección a resúmenes
  - [x] Card informativo sobre sistema adaptativo
  - [x] Enlace en Navbar (desktop y mobile)
  - [x] Diseño aurora gradient preservado
- [x] Generación de quiz
  - [x] Desde resumen existente (modal en `/summaries/:id`)
  - [x] Selector de número de preguntas (5-30)
  - [x] Integración con endpoint de OpenAI
  - [ ] Desde archivo nuevo (pendiente - se puede agregar desde `/documents`)
  - [ ] Selector de tema específico (usa tema del resumen por ahora)
- [x] Tomar quiz (`/quizzes/:id/attempt`)
  - [x] Mostrar pregunta actual con opciones A, B, C, D
  - [x] Feedback inmediato al responder
    - [x] Indicador visual si es correcta o incorrecta
    - [x] Mostrar respuesta correcta si falla
    - [x] Mostrar explicación detallada
    - [x] Puntaje acumulado en tiempo real
  - [x] Navegación entre preguntas
  - [x] Progreso visual con barra y contador (X de Y preguntas)
  - [x] Auto-inicio de intento al cargar quiz
  - [x] Botón de siguiente pregunta después de responder
  - [x] Redirección automática a resultados al terminar
  - [x] Diseño aurora gradient preservado
- [x] Resultados de quiz (`/quiz-attempts/:id/results`)
  - [x] Score final con badge visual y código de colores
  - [x] Estadísticas: correctas, incorrectas, total
  - [x] Mensaje personalizado según puntuación
  - [x] Desglose detallado por pregunta
    - [x] Pregunta, opciones, respuesta seleccionada
    - [x] Indicadores visuales de correcto/incorrecto
    - [x] Explicación de cada pregunta
  - [x] Botón para volver a resúmenes
  - [x] Botón para intentar de nuevo
  - [x] Diseño aurora gradient preservado
  - [ ] Recomendaciones basadas en resultados (pendiente - puede agregar IA)

### 2.7 Estadísticas y progreso ✅ COMPLETADO AL 100%
- [x] **Página de estadísticas** (`/stats`)
  - [x] Cards de resumen con totales (resúmenes, quizzes, intentos)
  - [x] Promedio general y mejor score con código de colores
  - [x] Temas únicos estudiados
  - [x] Gráfica/sección de progreso por tema
    - [x] Visualización de promedio, máximo y mínimo por tema
    - [x] Barra de progreso por tema con colores
    - [x] Contador de intentos por tema
  - [x] Historial de intentos recientes (configurable con limit)
    - [x] Últimos 10 intentos con score, dificultad y fecha
    - [x] Click para ver detalles de intento
    - [x] Badges de dificultad con código de colores
  - [x] Empty state cuando no hay datos
  - [x] Enlace en Navbar (desktop y mobile)
  - [x] Diseño aurora gradient preservado
  - [x] Integración con endpoints /stats/summary, /stats/progress, /stats/performance
  - [ ] Gráficas avanzadas con librería (Chart.js/Recharts) - opcional
  - [ ] Exportar datos a CSV/PDF - pendiente
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
