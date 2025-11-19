# NEXT_STEPS — Próximos pasos inmediatos

**Última actualización:** 2025-01-19

**Estado actual:** Backend completamente funcional con todos los endpoints implementados y probados. Base de datos configurada, migraciones aplicadas, autenticación funcionando. Sistema de documentos y cuotas implementado, validaciones de ownership centralizadas.

---

## Fase 0 — Tareas pendientes del backend (críticas antes de producción)

### 0.1 Migraciones de base de datos
- [ ] **Generar migración de Alembic** para nuevas tablas y campos
  - [ ] Tabla `documents` (id, user_id, title, file_name, file_type, file_size_bytes, file_content, extracted_text, created_at, updated_at)
  - [ ] Tabla `summary_documents` (summary_id, document_id) - relación many-to-many
  - [ ] Campos en `users`: storage_quota_bytes, storage_used_bytes, max_documents_per_summary, max_file_size_bytes
  - [ ] Actualizar campo `summaries`: eliminar original_file_name, original_file_type si existen
- [ ] **Aplicar migración** en base de datos de desarrollo
- [ ] **Verificar constraints** y foreign keys
- [ ] **Probar rollback** de la migración

### 0.2 Actualización de servicios para multi-documento
- [ ] **Actualizar SummaryService.create_summary_from_file**
  - [ ] Guardar documento en tabla documents primero
  - [ ] Crear relación con summary en summary_documents
  - [ ] Actualizar storage_used_bytes del usuario
  - [ ] Manejar errores y rollback si falla
- [ ] **Crear endpoint para generar summary desde documentos existentes**
  - [ ] `POST /summaries/from-documents` con lista de document_ids
  - [ ] Validar que no excedan max_documents_per_summary
  - [ ] Validar ownership de todos los documentos
  - [ ] Concatenar extracted_text de múltiples documentos
- [ ] **Actualizar eliminación de summaries**
  - [ ] NO eliminar documentos asociados (pueden estar en otros summaries)
  - [ ] Solo eliminar relación en summary_documents

### 0.3 Seguridad y logging
- [ ] **Implementar logging estructurado**
  - [ ] Logging de eventos de autenticación (login, logout, failed attempts)
  - [ ] Logging de operaciones de cuotas (upload, delete, quota exceeded)
  - [ ] Logging de errores de validación de ownership
  - [ ] Configurar niveles de log (INFO, WARNING, ERROR)
  - [ ] Integrar con sistema de logging (ej: loguru, structlog)
- [ ] **Implementar rate limiting**
  - [ ] Limitar requests por IP/usuario
  - [ ] Diferentes límites por endpoint (más restrictivo en uploads)
  - [ ] Usar slowapi o similar
  - [ ] Headers informativos (X-RateLimit-*)
- [ ] **Validación adicional de archivos**
  - [ ] Verificar magic numbers además de extensión
  - [ ] Usar python-magic o similar
  - [ ] Prevenir evasión con extensiones falsas

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

### Críticas (Fase 0 - antes de continuar):
1. **Generar y aplicar migración de Alembic** - Nuevas tablas documents, summary_documents y campos de cuotas
2. **Actualizar SummaryService** - Integrar con sistema de documentos almacenados
3. **Implementar logging básico** - Al menos eventos de autenticación y cuotas

### Siguientes pasos (Fase 1):
4. **Tests básicos del backend** - Asegurar que la lógica core funciona correctamente
5. **Frontend: Auth + Upload** - Flujo básico funcionando end-to-end
6. **Frontend: Gestión de documentos** - Listar, ver detalles, eliminar documentos
7. **Frontend: Lista y vista de resúmenes** - Poder visualizar lo generado
8. **Deployment en Render (staging)** - Tener ambiente de pruebas accesible

---

## Notas

- El backend está **100% funcional** con endpoints implementados
- **Falta migración de BD** para tablas documents y summary_documents
- La API está documentada en `/docs` (Swagger UI)
- Se requiere **créditos en OpenAI** para funciones de IA (summaries y quizzes)
- El proyecto está configurado para Windows con encoding UTF-8 CRLF
- **Type hints corregidos** para compatibilidad con SQLAlchemy type checkers

---

## Referencias

- Arquitectura completa: **[docs/ARCHITECTURE.md](ARCHITECTURE.md)**
- Implementación detallada: **[docs/IMPLEMENTATION.md](IMPLEMENTATION.md)**
- Decisiones técnicas: **[docs/DECISIONS.md](DECISIONS.md)**
- Roadmap a largo plazo: **[docs/ROADMAP.md](ROADMAP.md)**
