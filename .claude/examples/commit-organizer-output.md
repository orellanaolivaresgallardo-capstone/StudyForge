# Commit Organizer - Example Output

This example demonstrates how the `commit-organizer` agent analyzes working directory changes and organizes them into logical atomic commits.

---

## Análisis de Cambios

**Archivos modificados:** 5
**Archivos sin seguimiento:** 2

### Agrupación Propuesta

He identificado **2 grupos lógicos** para commits atómicos:

---

### 📦 Commit 1: `feat(backend): Add user authentication endpoints`

**Tipo:** feat
**Alcance:** backend
**Archivos incluidos:**
- backend/app/routers/auth.py
- backend/app/services/auth_service.py
- backend/app/schemas/auth.py

**Razón del agrupamiento:**
Estos archivos implementan juntos la funcionalidad de autenticación JWT.

**Mensaje completo:**
```
feat(backend): Add user authentication endpoints

- Implement /auth/login and /auth/register endpoints
- Add AuthService with Argon2 password hashing
- Create Pydantic schemas for auth requests/responses
- Add JWT token generation and validation
```

**Verificación de seguridad:** ✅ Sin secretos, ✅ Tamaño < 1MB

---

### 📦 Commit 2: `docs: Update API documentation for auth endpoints`

**Tipo:** docs
**Alcance:** docs
**Archivos incluidos:**
- docs/API.md
- CLAUDE.md

**Razón del agrupamiento:**
Actualización de documentación para reflejar nuevos endpoints de autenticación.

**Mensaje completo:**
```
docs: Update API documentation for auth endpoints

- Document /auth/login and /auth/register
- Add authentication section to API reference
- Update CLAUDE.md with auth examples
```

**Verificación de seguridad:** ✅ Sin secretos, ✅ Tamaño < 1MB

---

## Siguiente Paso

¿Deseas que proceda a crear estos commits?

---

**Note**: This is an example output showing the agent's analysis and proposed commit organization. Actual output will vary based on the specific changes in your working directory.
