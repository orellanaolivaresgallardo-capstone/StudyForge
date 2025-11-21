# SECURITY — Consideraciones de Seguridad y Privacidad

**Última actualización:** 2025-11-19

Este documento describe las medidas de seguridad implementadas en StudyForge para proteger la privacidad y los datos de los usuarios.

---

## 1. Autenticación y Autorización

### 1.1 JWT (JSON Web Tokens)
- **Algoritmo**: HS256
- **Expiración**: 24 horas (configurable)
- **Secret Key**: Debe cambiarse en producción (almacenar en variable de entorno)

### 1.2 Hashing de Contraseñas
- **Algoritmo**: Argon2id (ganador de Password Hashing Competition)
- **Configuración**: Memory-hard por defecto
- **Ventaja**: Resistente a ataques GPU/ASIC, más seguro que bcrypt

### 1.3 Validación de Usuario Activo
Todos los endpoints protegidos verifican que `user.is_active == True` antes de permitir acceso.

---

## 2. Protección de Privacidad de Datos

### 2.1 Ownership Validation (Validación de Propiedad)

Todas las funciones están en [`app/core/dependencies.py`](../backend/app/core/dependencies.py):

#### **verify_document_ownership(document, user)**
Verifica que el documento pertenezca al usuario autenticado.

```python
from app.core.dependencies import verify_document_ownership, get_current_user

@router.get("/documents/{document_id}")
def get_document(
    document_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    document = DocumentRepository.get_by_id(db, document_id)
    # Verifica que el documento pertenezca al usuario
    document = verify_document_ownership(document, current_user)
    return document
```

#### **verify_summary_ownership(summary, user)**
Verifica que el resumen pertenezca al usuario autenticado.

```python
@router.delete("/summaries/{summary_id}")
def delete_summary(
    summary_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    summary = SummaryRepository.get_by_id(db, summary_id)
    verify_summary_ownership(summary, current_user)  # Lanza 403 si no es owner
    SummaryRepository.delete(db, summary_id)
    return {"message": "Resumen eliminado"}
```

#### **verify_quiz_ownership(quiz, user)**
Verifica que el quiz pertenezca al usuario autenticado.

#### **verify_quiz_attempt_ownership(attempt, user)**
Verifica que el intento de quiz pertenezca al usuario autenticado.

### 2.2 Aislamiento de Datos por Usuario

**Principio**: Un usuario NUNCA debe poder ver, modificar o eliminar recursos de otro usuario.

**Implementación**:
- Todos los modelos tienen `user_id` (FK a users)
- Todos los repositorios filtran por `user_id`
- Todos los routers validan ownership antes de operaciones

**Ejemplo** (Listar documentos):
```python
@router.get("/documents")
def list_documents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Solo retorna documentos del usuario autenticado
    documents = DocumentRepository.get_by_user(db, current_user.id)
    return documents
```

---

## 3. Cuotas y Límites Específicos para cada Usuario

### 3.1 Campos de Cuota en User

```python
class User:
    storage_quota_bytes: int = 5 GB          # Cuota total de almacenamiento
    storage_used_bytes: int = 0              # Espacio usado actualmente
    max_documents_per_summary: int = 2       # Máx documentos por resumen
    max_file_size_bytes: int = 50 MB         # Tamaño máximo por archivo
```

### 3.2 Validación de Cuotas en Uploads

**Antes de subir un archivo**, verificar:

```python
# Verificar tamaño del archivo
if file.size > current_user.max_file_size_bytes:
    raise HTTPException(
        status_code=413,
        detail=f"Archivo excede el límite de {current_user.max_file_size_bytes} bytes"
    )

# Verificar espacio disponible
if current_user.storage_available_bytes < file.size:
    raise HTTPException(
        status_code=507,  # Insufficient Storage
        detail="No tienes suficiente espacio de almacenamiento"
    )

# Después de subir exitosamente, actualizar storage_used_bytes
current_user.storage_used_bytes += file.size
db.commit()
```

### 3.3 Actualización de Cuotas (Solo Admins)

```python
@router.patch("/admin/users/{user_id}/quota")
def update_user_quota(
    user_id: UUID,
    quota_update: UserQuotaUpdate,
    current_user: User = Depends(get_current_admin)  # Solo admins
):
    # Actualizar cuotas del usuario
    ...
```

---

## 4. Seguridad en Transporte (HTTPS)

### 4.1 En Desarrollo
- HTTP en `localhost:8000` está OK
- CORS configurado solo para frontend local

### 4.2 En Producción
**OBLIGATORIO**:
- ✅ **HTTPS** en todos los endpoints (TLS 1.2+)
- ✅ **HSTS** (HTTP Strict Transport Security)
- ✅ **Secure Cookies** (si se usan)
- ✅ **CORS** restrictivo (solo dominios autorizados)

**Configuración recomendada** (Render, GCP, etc.):
```python
# app/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://tudominio.com"],  # Solo producción
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 5. Seguridad en Almacenamiento (Base de Datos)

### 5.1 Schema Aislado
- **Schema**: `studyforge` (no `public`)
- **Beneficio**: Aislamiento de otros datos del sistema

### 5.2 Roles Separados
- **`studyforge_owner`**: DDL (migraciones) - permisos elevados
- **`studyforge_app`**: DML (runtime) - solo SELECT, INSERT, UPDATE, DELETE
- **Beneficio**: Principio de menor privilegio

### 5.3 Encriptación de Datos Sensibles (Opcional, Futuro)

Para mayor seguridad, considerar encriptar:
- `documents.file_content` - Contenido de archivos
- `summaries.content` - Contenido de resúmenes

**Opciones**:
1. **Encriptación a nivel de aplicación** (Python):
   ```python
   from cryptography.fernet import Fernet

   # Encriptar antes de guardar
   encrypted_content = cipher.encrypt(content.encode())

   # Desencriptar al leer
   decrypted_content = cipher.decrypt(encrypted_content).decode()
   ```

2. **Encriptación a nivel de BD** (PostgreSQL):
   ```sql
   -- Usando pgcrypto
   CREATE EXTENSION IF NOT EXISTS pgcrypto;

   -- Columna encriptada
   file_content BYTEA,

   -- Insertar encriptado
   INSERT INTO documents (file_content)
   VALUES (pgp_sym_encrypt('data', 'secret_key'));

   -- Leer desencriptado
   SELECT pgp_sym_decrypt(file_content, 'secret_key') FROM documents;
   ```

**Recomendación**: Implementar si se maneja información muy sensible o regulada (HIPAA, GDPR).

---

## 6. Protección contra Ataques Comunes

### 6.1 SQL Injection
**Protección**: ✅ Uso de SQLAlchemy ORM (queries parametrizadas)

**Evitar**:
```python
# ❌ NUNCA hacer esto
db.execute(f"SELECT * FROM users WHERE email = '{email}'")

# ✅ Usar ORM
db.query(User).filter(User.email == email).first()
```

### 6.2 XSS (Cross-Site Scripting)
**Protección**:
- Frontend: Sanitización de inputs (React hace esto por defecto)
- Backend: Validación con Pydantic

### 6.3 CSRF (Cross-Site Request Forgery)
**Protección**: JWT stateless (no cookies de sesión)

### 6.4 Rate Limiting (Futuro)
**Implementar** para prevenir abuso:
```python
from slowapi import Limiter

limiter = Limiter(key_func=get_remote_address)

@app.post("/auth/login")
@limiter.limit("5/minute")  # Máximo 5 intentos por minuto
def login(...):
    ...
```

### 6.5 File Upload Vulnerabilities
**Validaciones implementadas**:
- ✅ Tamaño máximo por usuario
- ✅ Tipos de archivo permitidos (PDF, DOCX, PPTX, TXT)
- ⏳ **TODO**: Validación de magic numbers (no solo extensión)
- ⏳ **TODO**: Escaneo antivirus (opcional, ClamAV)

---

## 7. Auditoría y Logging

### 7.1 Logs de Seguridad (Futuro)

**Eventos a registrar**:
- ✅ Login exitoso / fallido
- ✅ Intentos de acceso no autorizado (403)
- ✅ Cambios de cuotas
- ✅ Uploads de archivos
- ✅ Eliminación de datos

**Ejemplo**:
```python
import logging

security_logger = logging.getLogger("security")

@router.post("/auth/login")
def login(credentials: UserLogin):
    try:
        token = AuthService.login(...)
        security_logger.info(f"Login exitoso: {credentials.email}")
        return token
    except HTTPException:
        security_logger.warning(f"Login fallido: {credentials.email}")
        raise
```

### 7.2 Retención de Logs
- **Desarrollo**: 7 días
- **Producción**: 90 días (o según regulaciones)

---

## 8. Cumplimiento y Regulaciones

### 8.1 GDPR (Reglamento General de Protección de Datos)

Si aplica (usuarios en UE):
- ✅ **Derecho al olvido**: Implementar endpoint de eliminación de cuenta
- ✅ **Portabilidad**: Exportar datos del usuario
- ✅ **Consentimiento**: Política de privacidad clara
- ✅ **Minimización de datos**: Solo almacenar lo necesario

**Implementación** (Futuro):
```python
@router.delete("/users/me")
def delete_my_account(current_user: User = Depends(get_current_user)):
    # Eliminar todos los datos del usuario (cascade)
    db.delete(current_user)
    db.commit()
    return {"message": "Cuenta eliminada permanentemente"}

@router.get("/users/me/export")
def export_my_data(current_user: User = Depends(get_current_user)):
    # Exportar todos los datos del usuario en JSON
    data = {
        "user": UserResponse.from_orm(current_user),
        "documents": [...],
        "summaries": [...],
        "quizzes": [...]
    }
    return JSONResponse(content=data)
```

### 8.2 Política de Privacidad

**Incluir**:
- Qué datos se recopilan
- Cómo se usan
- Cuánto tiempo se almacenan
- Con quién se comparten (nadie, en este caso)
- Derechos del usuario

---

## 9. Checklist de Seguridad Pre-Producción

### Infraestructura
- [ ] HTTPS configurado (TLS 1.2+)
- [ ] Certificado SSL válido
- [ ] HSTS activado
- [ ] CORS restrictivo
- [ ] Firewall configurado

### Aplicación
- [ ] SECRET_KEY cambiada (no usar la de desarrollo)
- [ ] OPENAI_API_KEY segura (no commitear en repo)
- [ ] DEBUG=False en producción
- [ ] Rate limiting configurado
- [ ] Logs de seguridad activados

### Base de Datos
- [ ] Contraseñas de BD seguras
- [ ] Backups automáticos configurados
- [ ] Restore probado
- [ ] Conexiones encriptadas (SSL)

### Código
- [ ] Todas las validaciones de ownership en routers
- [ ] Sanitización de inputs
- [ ] Manejo de errores sin exponer información sensible
- [ ] Dependencies actualizadas (sin vulnerabilidades conocidas)

### Pruebas
- [ ] Penetration testing básico (OWASP ZAP)
- [ ] Pruebas de acceso no autorizado
- [ ] Pruebas de escalada de privilegios

---

## 10. Contacto para Reportes de Seguridad

**Si encuentras una vulnerabilidad de seguridad**:
- NO crear un issue público
- Contactar a: [security@studyforge.com](mailto:security@studyforge.com) (pendiente configurar)
- Proporcionar detalles técnicos y pasos para reproducir
- Dar tiempo razonable para fix antes de divulgación pública

**Reconocimiento**: Mantendremos un hall of fame de investigadores de seguridad que reporten vulnerabilidades de forma responsable.

---

**Última revisión:** 2025-11-19
**Próxima revisión:** 2025-12-19 (mensual)
