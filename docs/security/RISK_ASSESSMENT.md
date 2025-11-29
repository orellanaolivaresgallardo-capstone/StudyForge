# Risk Assessment - StudyForge

**Metodología:** Análisis cualitativo de riesgos ISO 27001
**Fecha:** 2025-11-29
**Alcance:** Plataforma completa StudyForge

---

## Identificación de Activos

### Activos Críticos

| Activo | Descripción | Criticidad | CIA |
|--------|-------------|------------|-----|
| Base de Datos | PostgreSQL con datos usuarios | ALTA | C: Alta, I: Alta, A: Media |
| Credenciales | Passwords, JWT tokens | CRÍTICA | C: Crítica, I: Alta, A: Media |
| Documentos Personales | PDFs, DOCX de usuarios | ALTA | C: Alta, I: Media, A: Baja |
| Código Fuente | Repositorio GitHub | MEDIA | C: Baja, I: Alta, A: Baja |
| API Keys | `SECRET_KEY`, `OPENAI_API_KEY` | ALTA | C: Alta, I: Media, A: Media |

**CIA Triad:**
- **C (Confidentiality):** Privacidad de datos
- **I (Integrity):** Precisión de datos
- **A (Availability):** Disponibilidad del servicio

---

## Amenazas Identificadas

### T1: Acceso No Autorizado a Datos de Usuario

**Descripción:** Atacante accede a documentos/summaries de otros usuarios

**Vector de Ataque:**
- Manipulación de IDs en requests (IDOR - Insecure Direct Object Reference)
- Falta de ownership validation

**Probabilidad:** BAJA (mitigado)
**Impacto:** ALTO (privacidad)
**Riesgo Inherente:** MEDIO

**Controles Existentes:**
- ✅ Ownership validation en todos los endpoints (`verify_*_ownership()`)
- ✅ JWT authentication obligatorio
- ✅ Tests de ownership en suite de tests

**Riesgo Residual:** BAJO

---

### T2: Robo de Credenciales

**Descripción:** Atacante obtiene passwords de usuarios

**Vector de Ataque:**
- Password sniffing (sin HTTPS)
- Brute force attacks
- Database breach

**Probabilidad:** MEDIA
**Impacto:** ALTO
**Riesgo Inherente:** ALTO

**Controles Existentes:**
- ✅ Argon2id hashing (memory-hard, GPU-resistant)
- ⚠️ HTTPS solo en producción (no en dev)
- ❌ Sin rate limiting en login

**Controles Recomendados:**
- Implementar rate limiting (`backend/app/core/rate_limiter.py` ya existe pero no aplicado a auth)
- HTTPS obligatorio en producción
- 2FA opcional (fuera de alcance capstone)

**Riesgo Residual:** MEDIO

---

### T3: Pérdida de Datos

**Descripción:** Pérdida total de base de datos por fallo de hardware/software

**Vector de Ataque:**
- Fallo de disco duro
- Corrupción de base de datos
- Error humano (DROP TABLE accidental)

**Probabilidad:** BAJA (desarrollo), MEDIA (producción)
**Impacto:** CRÍTICO
**Riesgo Inherente:** ALTO

**Controles Existentes:**
- ❌ Sin backups automatizados

**Controles Recomendados:**
- PostgreSQL dump diario (producción)
- Git para código fuente (ya implementado)
- Cloud storage para backups (AWS S3, Azure Blob)

**Riesgo Residual (sin backups):** ALTO
**Riesgo Residual (con backups):** BAJO

---

### T4: Inyección SQL

**Descripción:** Atacante ejecuta SQL malicioso

**Vector de Ataque:**
- Input no validado en queries SQL
- Concatenación de strings en SQL

**Probabilidad:** MUY BAJA (mitigado)
**Impacto:** CRÍTICO
**Riesgo Inherente:** ALTO

**Controles Existentes:**
- ✅ SQLAlchemy ORM (parameterized queries automáticas)
- ✅ Pydantic validation en todos los inputs
- ✅ No hay raw SQL concatenation

**Riesgo Residual:** MUY BAJO

---

### T5: XSS (Cross-Site Scripting)

**Descripción:** Atacante inyecta JavaScript malicioso

**Vector de Ataque:**
- Input HTML no sanitizado
- Rendering de datos sin escape

**Probabilidad:** BAJA
**Impacto:** MEDIO
**Riesgo Inherente:** MEDIO

**Controles Existentes:**
- ✅ React auto-escapes JSX por defecto
- ⚠️ Uso de `dangerouslySetInnerHTML` debe evitarse

**Controles Recomendados:**
- Code review para buscar `dangerouslySetInnerHTML`
- Sanitize HTML si es absolutamente necesario

**Riesgo Residual:** BAJO

---

### T6: Exposición de Secrets

**Descripción:** API keys/secrets expuestos en código/logs

**Vector de Ataque:**
- Commit de `.env` a Git
- Logs con secrets
- Error messages con info sensible

**Probabilidad:** MEDIA
**Impacto:** ALTO
**Riesgo Inherente:** ALTO

**Controles Existentes:**
- ✅ `.env` en `.gitignore`
- ✅ Pydantic Settings para env vars
- ⚠️ Sin escaneo de secrets automatizado

**Controles Recomendados:**
- Pre-commit hook para detectar secrets
- Usar herramienta como `gitleaks` o `trufflehog`
- Rotar keys si se exponen

**Riesgo Residual:** MEDIO

---

## Matriz de Riesgos

| Riesgo | Probabilidad | Impacto | Riesgo Inherente | Riesgo Residual | Prioridad |
|--------|--------------|---------|------------------|-----------------|-----------|
| T1: Acceso No Autorizado | Baja | Alto | Medio | Bajo | ✅ Bajo |
| T2: Robo Credenciales | Media | Alto | Alto | Medio | 🟡 Medio |
| T3: Pérdida de Datos | Baja | Crítico | Alto | Alto | 🔴 Alto |
| T4: SQL Injection | Muy Baja | Crítico | Alto | Muy Bajo | ✅ Bajo |
| T5: XSS | Baja | Medio | Medio | Bajo | ✅ Bajo |
| T6: Exposición Secrets | Media | Alto | Alto | Medio | 🟡 Medio |

---

## Plan de Tratamiento

### Prioridad 1 (Crítico) - Implementar AHORA

**T3: Pérdida de Datos**
- **Acción:** Documentar estrategia de backups
- **Responsable:** Desarrollador
- **Plazo:** Antes de entrega capstone
- **Costo:** 30 minutos

### Prioridad 2 (Alto) - Implementar ANTES DE PRODUCCIÓN

**T2: Robo Credenciales**
- **Acción:** Implementar rate limiting en endpoints de auth
- **Archivo:** `backend/app/routers/auth.py`
- **Usar:** `backend/app/core/rate_limiter.py` (ya existe)
- **Plazo:** Antes de deployment producción

**T6: Exposición Secrets**
- **Acción:** Configurar pre-commit hook con gitleaks
- **Plazo:** Antes de deployment producción

### Prioridad 3 (Medio) - Documentar para Mejoras Futuras

- Logging de auditoría completo
- 2FA para usuarios
- Encriptación de datos en reposo

---

## Aceptación de Riesgos Residuales

**Para proyecto capstone académico:**

**Riesgos ACEPTADOS (no requieren remediación inmediata):**
- **T3:** Pérdida de datos (sin backups) - Aceptado para desarrollo
- **T2:** Robo credenciales (sin rate limiting) - Aceptado para demo
- **T6:** Exposición secrets (sin escaneo automático) - Mitigado con `.gitignore`

**Justificación:** Proyecto académico sin usuarios reales en producción.

**Para producción real:** Todos los riesgos DEBEN ser tratados.
