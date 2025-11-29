# Audit Logging - StudyForge

**Control ISO 27001:** A.12.4 - Logging y Monitoreo
**Objetivo:** Registrar eventos de seguridad críticos para detección y análisis de incidentes
**Última actualización:** 2025-11-29

---

## Eventos de Auditoría

Los siguientes eventos DEBEN ser registrados:

### 1. Autenticación
- Login attempts (success/failure)
- Logout
- Token refresh
- Password changes
- Account activation/deactivation

### 2. Autorización
- Access denied (403 Forbidden)
- Resource ownership violations
- Invalid permissions attempts

### 3. Operaciones Críticas
- Document upload/delete
- Summary creation/delete
- Quiz creation/delete
- Study space creation/delete/modify

### 4. Administración
- User creation/modification
- Database schema changes (migrations)
- Configuration changes

---

## Implementación

### Función de Audit Logging

**Ubicación:** [backend/app/core/logging.py](../../backend/app/core/logging.py)

```python
from datetime import datetime
from app.core.logging import get_logger

logger = get_logger(__name__)

def log_audit_event(
    event: str,
    user_id: str | None = None,
    resource_type: str | None = None,
    resource_id: str | None = None,
    action: str | None = None,
    result: str = "success",
    ip_address: str | None = None,
    extra: dict | None = None
) -> None:
    """Log security audit events.

    Args:
        event: Event type (login_attempt, access_resource, modify_resource, delete_resource)
        user_id: UUID of user performing action
        resource_type: Type of resource (document, summary, quiz, etc.)
        resource_id: UUID of resource
        action: Action performed (read, create, update, delete)
        result: Result of action (success, failure, forbidden)
        ip_address: IP address of request
        extra: Additional context
    """
    logger.info(
        "AUDIT",
        extra={
            "event": event,
            "user_id": user_id,
            "resource_type": resource_type,
            "resource_id": resource_id,
            "action": action,
            "result": result,
            "ip_address": ip_address,
            "timestamp": datetime.utcnow().isoformat(),
            **(extra or {})
        }
    )
```

---

## Uso en Endpoints

### 1. Login/Logout

**Archivo:** [backend/app/routers/auth.py](../../backend/app/routers/auth.py)

```python
from app.core.logging import log_audit_event

@router.post("/login")
def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    try:
        user = authenticate_user(db, credentials.email, credentials.password)
        if not user:
            log_audit_event(
                event="login_attempt",
                user_id=None,
                action="login",
                result="failure",
                extra={"email": credentials.email}
            )
            raise HTTPException(status_code=401, detail="Invalid credentials")

        log_audit_event(
            event="login_attempt",
            user_id=str(user.id),
            action="login",
            result="success"
        )

        # Generate token and return
        access_token = create_access_token({"sub": user.email})
        return {"access_token": access_token, "token_type": "bearer"}
    except Exception as e:
        logger.error(f"Login error: {e}", exc_info=True)
        raise
```

---

### 2. Operaciones CRUD

**Archivo:** [backend/app/routers/documents.py](../../backend/app/routers/documents.py)

```python
@router.delete("/documents/{document_id}")
def delete_document(
    document_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    document = document_repository.get_by_id(db, document_id)
    verify_document_ownership(document, current_user)

    log_audit_event(
        event="resource_deleted",
        user_id=str(current_user.id),
        resource_type="document",
        resource_id=str(document_id),
        action="delete",
        result="success"
    )

    deletion_service.delete_document(db, document_id, current_user.id)
    return {"message": "Document deleted successfully"}
```

---

### 3. Acceso Denegado

**Archivo:** [backend/app/core/dependencies.py](../../backend/app/core/dependencies.py)

```python
from app.core.logging import log_audit_event

def verify_document_ownership(document: Document, current_user: User) -> None:
    """Verify that the document belongs to the current user."""
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    if document.user_id != current_user.id:
        log_audit_event(
            event="access_denied",
            user_id=str(current_user.id),
            resource_type="document",
            resource_id=str(document.id),
            action="read",
            result="forbidden"
        )
        raise HTTPException(
            status_code=403,
            detail="You don't have permission to access this document"
        )
```

---

## Formato de Log

### Estructura JSON

```json
{
  "level": "INFO",
  "logger": "app.routers.auth",
  "message": "AUDIT",
  "timestamp": "2025-11-29T10:30:45.123456Z",
  "extra": {
    "event": "login_attempt",
    "user_id": "123e4567-e89b-12d3-a456-426614174000",
    "action": "login",
    "result": "success",
    "ip_address": "192.168.1.100"
  }
}
```

### Campos Estándar

| Campo | Tipo | Descripción | Requerido |
|-------|------|-------------|-----------|
| `event` | string | Tipo de evento (login_attempt, resource_deleted, etc.) | ✅ Sí |
| `user_id` | UUID | ID del usuario que realiza la acción | ⚠️ Opcional (null para eventos anónimos) |
| `resource_type` | string | Tipo de recurso (document, summary, quiz, etc.) | ⚠️ Opcional |
| `resource_id` | UUID | ID del recurso afectado | ⚠️ Opcional |
| `action` | string | Acción realizada (read, create, update, delete, login) | ✅ Sí |
| `result` | string | Resultado (success, failure, forbidden) | ✅ Sí |
| `ip_address` | string | IP del cliente | ⚠️ Opcional |
| `timestamp` | ISO 8601 | Timestamp UTC del evento | ✅ Sí (auto) |

---

## Consulta de Logs

### Ver Logs de Auditoría

```bash
# Ver todos los logs de auditoría
cd backend
grep "AUDIT" logs/app.log

# Ver logs de login
grep "login_attempt" logs/app.log

# Ver accesos denegados
grep "access_denied" logs/app.log

# Ver logs de un usuario específico
grep "123e4567-e89b-12d3-a456-426614174000" logs/app.log | grep "AUDIT"
```

### Análisis de Logs

```bash
# Contar login attempts fallidos
grep "login_attempt" logs/app.log | grep "failure" | wc -l

# Ver últimos 10 eventos de auditoría
grep "AUDIT" logs/app.log | tail -10

# Filtrar por tipo de recurso
grep "resource_type.*document" logs/app.log | grep "AUDIT"
```

---

## Retención de Logs

### Política de Retención

- **Logs de Auditoría:** Retener por **90 días**
- **Logs Generales:** Retener por **30 días**
- **Logs de Errores:** Retener por **180 días**

### Rotación de Logs

**Recomendación para Producción:**
```bash
# Configurar logrotate
# /etc/logrotate.d/studyforge

/var/log/studyforge/app.log {
    daily
    rotate 90
    compress
    delaycompress
    notifempty
    create 0644 studyforge studyforge
    sharedscripts
    postrotate
        systemctl reload studyforge-backend
    endscript
}
```

---

## Testing

### Test de Audit Logging

**Archivo:** `backend/tests/test_audit_logging.py`

```python
def test_login_logs_audit_event(fake_db: Session) -> None:
    """Test que login genera log de auditoría."""
    # Arrange
    user = UserRepository.create(fake_db, "test@example.com", "password123")

    # Act
    with patch('app.core.logging.log_audit_event') as mock_log:
        # Simulate login
        login(LoginRequest(email="test@example.com", password="password123"), fake_db)

        # Assert
        mock_log.assert_called_once()
        args = mock_log.call_args[1]
        assert args["event"] == "login_attempt"
        assert args["user_id"] == str(user.id)
        assert args["action"] == "login"
        assert args["result"] == "success"
```

---

## Compliance

### ISO 27001 A.12.4

**Controles Implementados:**
- ✅ A.12.4.1 - Registro de eventos (audit logging implementado)
- ⚠️ A.12.4.2 - Protección de logs (logs no centralizados aún)
- ⚠️ A.12.4.3 - Logs de administrador (parcialmente implementado)

**Ver:** [docs/security/COMPLIANCE_CHECKLIST.md](COMPLIANCE_CHECKLIST.md#a124---logging-y-monitoreo)

---

## Próximos Pasos

1. ✅ Implementar `log_audit_event()` en [backend/app/core/logging.py](../../backend/app/core/logging.py)
2. ⏳ Agregar audit logs en [backend/app/routers/auth.py](../../backend/app/routers/auth.py)
3. ⏳ Agregar audit logs en operaciones CRUD críticas
4. ⏳ Implementar tests de audit logging
5. ⏳ Configurar rotación de logs (producción)
6. ⏳ Centralizar logs (opcional - ELK Stack, CloudWatch, etc.)

---

**Última actualización:** 2025-11-29
**Próxima revisión:** Trimestral
