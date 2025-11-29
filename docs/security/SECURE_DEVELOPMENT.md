# Secure Software Development Lifecycle (SSDLC) - StudyForge

**Control ISO 27001:** A.14.2 - Seguridad en Procesos de Desarrollo
**Objetivo:** Garantizar que la seguridad se integra en todas las fases del desarrollo
**Última actualización:** 2025-11-29

---

## Fases del SSDLC

### 1. Planificación y Requisitos

**Actividades:**
- Identificar requisitos de seguridad
- Threat modeling básico
- Definir controles necesarios

**Herramientas:**
- [docs/security/RISK_ASSESSMENT.md](RISK_ASSESSMENT.md) - Análisis de riesgos
- GitHub Issues para tracking de requisitos

**Responsable:** Product Owner / Tech Lead

---

### 2. Diseño

**Actividades:**
- Diseñar arquitectura segura
- Definir modelo de autenticación/autorización
- Planear manejo de datos sensibles

**Documentos:**
- [docs/ARCHITECTURE.md](../ARCHITECTURE.md) - Arquitectura del sistema
- [docs/SECURITY.md](../SECURITY.md) - Consideraciones de seguridad

**Responsable:** Arquitecto / Developer Lead

---

### 3. Implementación

**Actividades de Seguridad:**
- Seguir conventions de código ([CLAUDE.md](../../CLAUDE.md), [.claude/conventions/](../../.claude/conventions/))
- Type hints obligatorios (Python/TypeScript)
- Input validation con Pydantic
- Ownership validation en todos los endpoints

**Code Review (Recomendado para Producción):**
1. Todo código debe ser revisado por al menos 1 desarrollador
2. Usar agente `security-reviewer` antes de merge
3. Verificar compliance con conventions

**Herramientas:**
- [.claude/agents/security-reviewer.md](../../.claude/agents/security-reviewer.md) - Agente de revisión
- [.claude/conventions/code-style.md](../../.claude/conventions/code-style.md) - Estándares de código
- Pre-commit hooks (formateo, linting)

**Checklist de Implementación:**
- [ ] Type hints completos
- [ ] Input validation (Pydantic)
- [ ] Ownership validation (si aplica)
- [ ] Error handling apropiado
- [ ] Logs de auditoría (eventos críticos)
- [ ] Tests unitarios con coverage >80%

---

### 4. Testing

**Tipos de Tests:**
- Unit tests (pytest, vitest)
- Integration tests (flujos end-to-end)
- Security tests (ownership, auth)

**Security-Specific Tests:**
```python
# Test ownership validation
def test_access_document_forbidden_if_not_owner():
    """Test que usuarios no pueden acceder a documentos de otros usuarios."""
    # ...

# Test authentication
def test_endpoint_requires_authentication():
    """Test que endpoint protegido requiere JWT válido."""
    # ...
```

**Coverage Targets:**
- Critical paths (auth, ownership): 100%
- Services: >90%
- Overall: >85%

**Herramientas:**
- [.claude/agents/test-runner.md](../../.claude/agents/test-runner.md) - Agente de testing
- [.claude/conventions/testing-guide.md](../../.claude/conventions/testing-guide.md) - Guía de testing

---

### 5. Deployment

**Security Checklist Pre-Deployment:**
- [ ] Secrets en variables de entorno (no en código)
- [ ] HTTPS configurado (TLS 1.3)
- [ ] CORS configurado correctamente
- [ ] Rate limiting activado
- [ ] Logs de auditoría funcionando
- [ ] Backups configurados (producción)

**Production vs Development:**
- **Development:** `DEBUG=True`, HTTP, sin rate limiting
- **Production:** `DEBUG=False`, HTTPS, rate limiting, backups

---

### 6. Mantenimiento

**Actividades:**
- Monitoreo de logs de auditoría
- Review de incidentes de seguridad
- Actualización de dependencias
- Patch management

**Periodicidad:**
- **Logs:** Diario (revisión automática)
- **Dependencies:** Mensual (`npm audit`, `pip check`)
- **Security review:** Trimestral

---

## Herramientas de Seguridad

### Análisis Estático (SAST)

**Backend (Python):**
```bash
# Instalar
pip install bandit safety

# Ejecutar
bandit -r backend/app/
safety check
```

**Frontend (TypeScript):**
```bash
# Ejecutar
cd frontend
npm audit
pnpm lint
```

### Gestión de Secrets

**Pre-commit Hook (Recomendado):**
```bash
# Instalar gitleaks
# https://github.com/gitleaks/gitleaks

# Pre-commit hook
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/sh
gitleaks detect --source . --verbose --no-git
EOF

chmod +x .git/hooks/pre-commit
```

---

## Compliance con ISO 27001

### A.14.2.1 - Política de Desarrollo Seguro

**Estado:** ✅ DOCUMENTADO

**Evidencias:**
- Este documento (`SECURE_DEVELOPMENT.md`)
- [CLAUDE.md](../../CLAUDE.md) - Convenciones de desarrollo
- [.claude/conventions/](../../.claude/conventions/) - Guías técnicas

### A.14.2.2 - Control de Cambios

**Estado:** ✅ IMPLEMENTADO

**Evidencias:**
- Git con commits controlados (Conventional Commits)
- [.claude/agents/commit-organizer.md](../../.claude/agents/commit-organizer.md) - Agente de commits
- Historial completo en GitHub

### A.14.2.3 - Revisión Técnica

**Estado:** ⚠️ PARCIAL

**Evidencias:**
- [.claude/agents/security-reviewer.md](../../.claude/agents/security-reviewer.md) - Agente de revisión
- Tests automatizados (pytest, vitest)

**Gap:** Code review no es obligatorio (recomendado para producción)

---

## Formación de Desarrolladores

**Recursos:**
- [CLAUDE.md](../../CLAUDE.md) - Guía completa para developers
- [docs/SECURITY.md](../SECURITY.md) - Consideraciones de seguridad
- [.claude/conventions/](../../.claude/conventions/) - Conventions técnicas
- [.claude/agents/studyforge-assistant.md](../../.claude/agents/studyforge-assistant.md) - Asistente para dudas

**Onboarding de Nuevos Developers:**
1. Leer `CLAUDE.md` completo
2. Review de `docs/SECURITY.md`
3. Ejecutar test suite (verificar que pasa)
4. Hacer primer commit con `commit-organizer`

---

## Respuesta a Incidentes de Seguridad

**Plan Básico:**
1. **Detección:** Revisar logs de auditoría
2. **Contención:** Desactivar usuario comprometido (`is_active = False`)
3. **Erradicación:** Investigar causa raíz, aplicar fix
4. **Recuperación:** Restaurar desde backup si necesario
5. **Post-mortem:** Documentar lecciones aprendidas

**Contacto de Emergencia:**
- Desarrollador principal: [email]
- GitHub Issues: Para reportar vulnerabilidades

---

**Última actualización:** 2025-11-29
**Próxima revisión:** Trimestral
