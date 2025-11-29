# Access Control Policy - StudyForge

**Control ISO 27001:** A.9 - Access Control
**Objetivo:** Limitar el acceso a información y recursos a usuarios autorizados
**Última actualización:** 2025-11-29

---

## Objetivo

Garantizar que solo usuarios autenticados y autorizados puedan acceder a recursos que les pertenecen, protegiendo la privacidad y seguridad de los datos en StudyForge.

---

## Alcance

Esta política aplica a:
- Todos los usuarios registrados de StudyForge
- Todos los endpoints de la API backend
- Todos los recursos almacenados (documentos, resúmenes, quizzes, espacios de estudio)
- Acceso a la base de datos PostgreSQL

---

## Principios de Control de Acceso

### 1. Autenticación Obligatoria

**Regla:** Todos los endpoints protegidos requieren autenticación via JWT.

**Implementación:**
```python
from app.core.dependencies import get_current_user

@router.get("/summaries")
def list_summaries(
    current_user: User = Depends(get_current_user),  # ← Autenticación obligatoria
    db: Session = Depends(get_db)
):
    return summary_service.list_user_summaries(db, current_user.id)
```

**Referencia:** [backend/app/core/dependencies.py:15-25](../../backend/app/core/dependencies.py#L15-L25)

---

### 2. Ownership Validation

**Regla:** Los usuarios solo pueden acceder a recursos que les pertenecen.

**Funciones de Validación:**
- `verify_document_ownership(document, current_user)` - Valida propiedad de documentos
- `verify_summary_ownership(summary, current_user)` - Valida propiedad de resúmenes
- `verify_quiz_ownership(quiz, current_user)` - Valida propiedad de quizzes
- `verify_quiz_attempt_ownership(attempt, current_user)` - Valida propiedad de intentos
- `verify_space_ownership(space, current_user)` - Valida propiedad de espacios

**Implementación:**
```python
from app.core.dependencies import verify_summary_ownership

@router.get("/summaries/{summary_id}")
def get_summary(
    summary_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    summary = summary_repository.get_by_id(db, summary_id)
    verify_summary_ownership(summary, current_user)  # ← Validación de ownership
    return summary
```

**Referencia:** [backend/app/core/dependencies.py:28-78](../../backend/app/core/dependencies.py#L28-L78)

---

### 3. Active User Check

**Regla:** Solo usuarios activos (`is_active=True`) pueden acceder al sistema.

**Implementación:**
```python
def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    # ... validate token ...
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Inactive user")
    return user
```

---

### 4. Expiración de Tokens JWT

**Regla:** Los tokens JWT expiran después de 24 horas.

**Configuración:**
```python
# backend/app/core/security.py
ACCESS_TOKEN_EXPIRE_HOURS = 24

def create_access_token(data: dict) -> str:
    expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    to_encode = {"exp": expire, **data}
    return jwt.encode(to_encode, SECRET_KEY, algorithm="HS256")
```

**Referencia:** [backend/app/core/security.py:30-50](../../backend/app/core/security.py#L30-L50)

---

## Roles de Base de Datos

### Separación de Privilegios

**Roles:**
1. **`studyforge_owner`** (DDL - Data Definition Language)
   - Puede crear, modificar y eliminar tablas
   - Usado SOLO para migraciones (Alembic)
   - **NO** usado en runtime de la aplicación

2. **`studyforge_app`** (DML - Data Manipulation Language)
   - Puede SELECT, INSERT, UPDATE, DELETE en tablas
   - **NO** puede modificar schema
   - Usado por la aplicación en runtime

**Justificación:** Principio de least privilege (menor privilegio)

**Referencia:** [backend/setup_database.sql:15-30](../../backend/setup_database.sql#L15-L30)

---

## Gestión de Contraseñas

### Hashing con Argon2id

**Algoritmo:** Argon2id (ganador del Password Hashing Competition)

**Características:**
- Memory-hard (requiere mucha RAM → resistente a GPUs/ASICs)
- Configuración: `time_cost=2`, `memory_cost=102400` (100MB), `parallelism=8`

**Implementación:**
```python
from argon2 import PasswordHasher

ph = PasswordHasher()

# Hashear password
hashed_password = ph.hash(plain_password)

# Verificar password
try:
    ph.verify(hashed_password, plain_password)
    # Password correcta
except:
    # Password incorrecta
```

**Referencia:** [backend/app/core/security.py:15-25](../../backend/app/core/security.py#L15-L25)

---

## Endpoints Públicos vs Protegidos

### Endpoints Públicos (Sin Autenticación)
- `POST /auth/register` - Registro de nuevos usuarios
- `POST /auth/login` - Login y obtención de token JWT
- `GET /health` - Health check

### Endpoints Protegidos (Con Autenticación)
- `GET /auth/me` - Información del usuario actual
- `GET /documents` - Listar documentos del usuario
- `POST /documents` - Subir nuevo documento
- `GET /summaries` - Listar resúmenes del usuario
- `POST /summaries` - Crear nuevo resumen
- `GET /quizzes` - Listar quizzes del usuario
- `GET /quiz-attempts` - Listar intentos de quizzes
- `GET /study-spaces` - Listar espacios de estudio
- `GET /stats/*` - Estadísticas del usuario

---

## Testing de Control de Acceso

### Tests de Ownership

**Objetivo:** Verificar que usuarios NO pueden acceder a recursos de otros usuarios.

**Ejemplo:**
```python
def test_access_document_forbidden_if_not_owner(fake_db: Session) -> None:
    """Test que usuarios no pueden acceder a documentos de otros usuarios."""
    # Arrange: Crear dos usuarios
    user1 = UserRepository.create(fake_db, "user1@example.com", "password1")
    user2 = UserRepository.create(fake_db, "user2@example.com", "password2")

    # User1 crea un documento
    document = DocumentRepository.create(fake_db, user1.id, "doc.pdf", b"content", "text")

    # Act & Assert: User2 intenta acceder
    with pytest.raises(HTTPException) as exc_info:
        verify_document_ownership(document, user2)

    assert exc_info.value.status_code == 403
```

**Referencia:** `backend/tests/test_ownership.py`

---

## Cumplimiento

### ISO 27001 A.9

**Controles Implementados:**
- ✅ A.9.1.1 - Política de control de acceso (este documento)
- ✅ A.9.2.1 - Registro de usuarios (endpoints de auth)
- ✅ A.9.2.2 - Provisión de acceso (JWT con expiración)
- ✅ A.9.2.3 - Gestión de privilegios (roles DB separados)
- ✅ A.9.3.1 - Uso de información secreta (Argon2id)
- ✅ A.9.4.1 - Restricción de acceso (ownership validation)
- ✅ A.9.4.2 - Procedimientos seguros de log-on (JWT + active check)
- ✅ A.9.4.3 - Sistema de gestión de passwords (Argon2id)

**Ver:** [docs/security/COMPLIANCE_CHECKLIST.md](COMPLIANCE_CHECKLIST.md) para detalles completos

---

## Excepciones

**No hay excepciones a esta política.** Todos los endpoints protegidos DEBEN validar autenticación y ownership.

---

## Revisión

Esta política debe revisarse:
- Trimestralmente
- Después de incidentes de seguridad
- Cuando se agregan nuevos endpoints o recursos
