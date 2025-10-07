# NEXT_STEPS — Próximos pasos inmediatos

**Contexto:** estos pasos derivan del plan por fases descrito en `docs/ROADMAP.md`. Este archivo funciona como una **lista de control corta** para las próximas 1–2 iteraciones. Cuando se complete, vuelva a priorizar en el ROADMAP.

## Iteración 1 — Autenticación básica (backend + front)
- [ ] Backend: `POST /auth/signup`, `POST /auth/login`, `GET /auth/me` con Argon2 y JWT (`HS256`, expiración configurable).
- [ ] DB: índice único `lower(email)` en `users`; campo `password_hash` obligatorio.
- [ ] Backend: dependencia `get_current_user` y protección de `/documents`.
- [ ] Frontend: pantalla **Login**, persistencia de token y logout.
- [ ] Verificación: sin token → `401`; con token → CRUD de mis documentos.

## Iteración 2 — CRUD sólido de documentos
- [ ] Backend: `GET /documents` con paginación y orden; `GET/PUT/DELETE /documents/{id}` (solo dueño).
- [ ] DB: índices por `(user_id, created_at desc)`; límites de longitud de `title/description`.
- [ ] Frontend: lista paginada, edición y confirmación de borrado.
- [ ] Verificación: flujo completo sin errores; validaciones 422 consistentes.

## Iteración 3 — Summaries y Quizzes (asíncrono mínimo)
- [ ] Backend: encolado con Redis/RQ (o `BackgroundTasks` inicial), estados `pending|running|done|failed`.
- [ ] Endpoints: `POST /documents/{id}/summaries` y `GET /summaries?document_id=...` (análogos para quizzes).
- [ ] Frontend: botones de generar y visualización de estado.
- [ ] Verificación: trabajo avanza de `pending` a `done` o `failed` y se refleja en UI.

---

### Referencias
- Guía completa por fases: **`docs/ROADMAP.md`**
- Resumen de estado actual: **`docs/SUMMARY.md`**
- Decisiones tomadas: **`docs/DECISIONS.md`**

**Fecha de actualización:** 2025-10-07
