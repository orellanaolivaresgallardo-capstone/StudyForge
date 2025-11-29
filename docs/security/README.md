# Security Documentation - StudyForge

This directory contains ISO/IEC 27001 compliance documentation for StudyForge.

---

## Files

- **[ISO27001_OVERVIEW.md](ISO27001_OVERVIEW.md)** - Introduction to ISO 27001 and project scope
- **[COMPLIANCE_CHECKLIST.md](COMPLIANCE_CHECKLIST.md)** - Detailed checklist of ISO controls
- **[RISK_ASSESSMENT.md](RISK_ASSESSMENT.md)** - Risk analysis and treatment plan
- **[ACCESS_CONTROL_POLICY.md](ACCESS_CONTROL_POLICY.md)** - Access control implementation (A.9)
- **[SECURE_DEVELOPMENT.md](SECURE_DEVELOPMENT.md)** - Secure SDLC process (A.14)
- **[AUDIT_LOGGING.md](AUDIT_LOGGING.md)** - Audit logging guidelines (A.12.4)

---

## Quick Links

- **Main security doc:** [../SECURITY.md](../SECURITY.md)
- **Architecture:** [../ARCHITECTURE.md](../ARCHITECTURE.md)
- **Testing guide:** [../TESTING.md](../TESTING.md)
- **Project guide:** [../../CLAUDE.md](../../CLAUDE.md)

---

## For Developers

### Before Starting Development
1. Read [../SECURITY.md](../SECURITY.md) for security considerations
2. Review [SECURE_DEVELOPMENT.md](SECURE_DEVELOPMENT.md) for SSDLC process
3. Understand [RISK_ASSESSMENT.md](RISK_ASSESSMENT.md) for threat landscape

### During Development
- Follow conventions in [../../.claude/conventions/code-style.md](../../.claude/conventions/code-style.md)
- Use `security-reviewer` agent before committing security-sensitive code
- Add audit logging for critical operations (see [AUDIT_LOGGING.md](AUDIT_LOGGING.md))

### Before Deployment
- Review [COMPLIANCE_CHECKLIST.md](COMPLIANCE_CHECKLIST.md) for deployment requirements
- Ensure all critical controls (A.9, A.10) are enabled
- Configure HTTPS and rate limiting

---

## Status

**Last Updated:** 2025-11-29
**Overall Compliance:** ~60% implemented, 25% partial, 15% documented

**Critical Gaps:**
- Automated backups not configured
- Audit logging partial (function implemented in `backend/app/core/logging.py:log_audit_event()`)
- Rate limiting not applied to auth endpoints

**Next Steps:**
See [../NEXT_STEPS.md](../NEXT_STEPS.md) for planned security improvements.

---

## Audit Logging Implementation

The `log_audit_event()` function has been implemented in [backend/app/core/logging.py](../../backend/app/core/logging.py#L419-L468) and is ready to use in critical endpoints.

**Usage Example:**
```python
from app.core.logging import log_audit_event

# Log successful login
log_audit_event(
    event="login_attempt",
    user_id=str(user.id),
    action="login",
    result="success"
)

# Log failed access
log_audit_event(
    event="access_denied",
    user_id=str(current_user.id),
    resource_type="document",
    resource_id=str(document_id),
    action="read",
    result="forbidden"
)
```

**For detailed implementation guide:** [AUDIT_LOGGING.md](AUDIT_LOGGING.md)

---

## Contact

For security-related questions or to report vulnerabilities:
- Review [../SECURITY.md#10-contacto-para-reportes-de-seguridad](../SECURITY.md#10-contacto-para-reportes-de-seguridad)
