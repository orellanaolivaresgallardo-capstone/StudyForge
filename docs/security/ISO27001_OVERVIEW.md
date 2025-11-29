# ISO/IEC 27001 - Overview para StudyForge

**Última actualización:** 2025-11-29
**Alcance:** Proyecto capstone académico
**Objetivo:** Demostrar buenas prácticas de seguridad de la información

---

## ¿Qué es ISO/IEC 27001?

Estándar internacional para gestión de seguridad de la información (ISMS - Information Security Management System).

**Para StudyForge (capstone):**
- NO requiere certificación formal
- SÍ demuestra conocimiento profesional de seguridad
- Aplicación selectiva de controles relevantes

---

## Alcance del Proyecto

**Activos Protegidos:**
- Base de datos PostgreSQL con datos de usuarios
- Documentos personales almacenados
- Credenciales de autenticación
- Historial de aprendizaje

**Usuarios:**
- Estudiantes registrados (datos personales limitados)
- NO incluye menores de edad (>18 años asumido)
- NO incluye datos sensibles (salud, financieros)

---

## Dominios ISO 27001 Aplicables

### ✅ Implementados (Parcial o Completo)

**A.9 - Control de Acceso**
- **Estado:** ✅ IMPLEMENTADO
- Ownership validation en todos los endpoints
- JWT con expiración (24h)
- Roles separados database (DDL vs DML)

**A.10 - Criptografía**
- **Estado:** ✅ IMPLEMENTADO
- Argon2id para passwords (memory-hard)
- JWT firmado con HS256
- **Pendiente:** Datos en reposo encriptados

**A.14 - Desarrollo Seguro**
- **Estado:** ⚠️ PARCIAL
- **Implementado:** Pydantic validation, type hints
- **Pendiente:** Formalizar SSDLC, code review process

### ⚠️ Parcialmente Implementados

**A.12.4 - Logging y Monitoreo**
- **Estado:** ⚠️ BÁSICO
- **Implementado:** Logs estructurados (`app/core/logging.py`)
- **Pendiente:** Logs de auditoría (login, accesos, modificaciones)

**A.13 - Seguridad en Comunicaciones**
- **Estado:** ⚠️ DESARROLLO
- **Implementado:** JWT, CORS configurado
- **Pendiente:** HTTPS en producción, TLS 1.3

### ❌ No Implementados (Documentar Estrategia)

**A.12.3 - Backups**
- **Estado:** ❌ NO IMPLEMENTADO
- **Estrategia:** Documentar plan (no ejecutar en capstone)
- PostgreSQL dump diario recomendado en producción

**A.16 - Gestión de Incidentes**
- **Estado:** ❌ NO IMPLEMENTADO
- **Estrategia:** Crear plan de respuesta (no probar en capstone)

**A.17 - Continuidad del Negocio**
- **Estado:** ❌ NO APLICABLE (capstone)
- **Nota:** No requerido para proyecto académico

---

## Compliance para Proyecto Capstone

### Criterios de Éxito

**MÍNIMO REQUERIDO (para aprobar):**
1. ✅ Control de acceso implementado (A.9)
2. ✅ Passwords hasheados correctamente (A.10)
3. ✅ Validación de entrada (A.14)
4. ✅ Logs básicos (A.12.4)

**DESEABLE (para destacar):**
5. ⭐ Documentación completa de ISO 27001
6. ⭐ Risk assessment profesional
7. ⭐ Plan de respuesta a incidentes
8. ⭐ Logs de auditoría implementados

**OPCIONAL (bonus):**
9. 💎 Encriptación de datos en reposo
10. 💎 Backups automatizados configurados
11. 💎 HTTPS con TLS 1.3 en producción

---

## Referencias

- **ISO/IEC 27001:2022** - Information security management systems
- **Documentación del proyecto:** `docs/SECURITY.md`
- **Compliance checklist:** `docs/security/COMPLIANCE_CHECKLIST.md`
- **Risk assessment:** `docs/security/RISK_ASSESSMENT.md`
