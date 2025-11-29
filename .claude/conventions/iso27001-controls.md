# ISO 27001 Controls Reference - StudyForge

This document contains detailed knowledge about ISO/IEC 27001:2022 security controls implementation in StudyForge. Used by the `iso27001-auditor` agent via `doc-retriever` skill.

**Last Updated**: 2025-11-29
**Version**: 1.0.0

---

## Table of Contents

- [A.9 - Access Control](#a9-access-control)
- [A.10 - Cryptography](#a10-cryptography)
- [A.12.4 - Logging and Monitoring](#a124-logging-and-monitoring)
- [A.13 - Communications Security](#a13-communications-security)
- [A.14 - Secure Development](#a14-secure-development)
- [Audit Procedures](#audit-procedures)
- [Report Templates](#report-templates)

---

## <a id="a9-access-control"></a>A.9 - Access Control

**Objective**: Limit access to information and resources only to authorized users.

### A.9.1 - Business Requirements for Access Control

**What to verify**:
- ✅ All protected endpoints use `get_current_user` dependency
- ✅ Ownership validation with `verify_*_ownership()` functions
- ✅ No hardcoded credentials in code

**Evidence locations**:
```python
# backend/app/routers/*.py
@router.get("/summaries/{summary_id}")
def get_summary(
    summary_id: UUID,
    current_user: User = Depends(get_current_user),  # ← A.9.1.1
    db: Session = Depends(get_db)
):
    summary = summary_repository.get_by_id(db, summary_id)
    verify_summary_ownership(summary, current_user)  # ← A.9.4.1
    return summary
```

**Verification commands**:
```bash
# Verify ALL protected endpoints have ownership validation
grep -r "verify_.*_ownership" backend/app/routers/

# Verify ALL endpoints use get_current_user
grep -r "Depends(get_current_user)" backend/app/routers/

# Check for hardcoded credentials
grep -ri "password.*=.*['\"]" backend/
```

### A.9.2 - User Access Management

**What to verify**:
- ✅ JWT expiration configured (24 hours maximum)
- ✅ Tokens include user_id and email (no sensitive data)
- ⚠️ No token revocation (acceptable limitation for MVP)

**Evidence**:
```python
# backend/app/core/security.py:35-45
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours
```

**Verification commands**:
```bash
# Check JWT expiration
grep "ACCESS_TOKEN_EXPIRE" backend/app/core/security.py

# Verify token payload structure
grep -A10 "create_access_token" backend/app/core/security.py
```

### A.9.4 - System and Application Access Control

**What to verify**:
- ✅ Ownership validation on ALL resources (summaries, quizzes, documents, etc.)
- ✅ Database with separated roles (DDL vs DML)

**Evidence**:
```python
# backend/app/core/dependencies.py:28-78
def verify_summary_ownership(summary: Summary | None, current_user: User) -> None:
    if not summary:
        raise HTTPException(status_code=404, detail="Summary not found")
    if summary.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
```

**Database roles**:
```sql
-- setup_database.sql
CREATE ROLE studyforge_owner;  -- DDL operations (migrations)
CREATE ROLE studyforge_app;    -- DML operations (runtime)
```

**Verification commands**:
```bash
# Count ownership validations
grep -r "verify_.*_ownership" backend/app/routers/ | wc -l

# Verify database roles
psql -U postgres -d studyforge -c "\du"
```

**Expected state**:
- All endpoints: `get_current_user` ✅
- All resource operations: `verify_*_ownership()` ✅
- No hardcoded passwords ✅

---

## <a id="a10-cryptography"></a>A.10 - Cryptography

**Objective**: Proper use of cryptography to protect confidentiality, authenticity, and integrity.

### A.10.1 - Cryptographic Controls

**What to verify**:
- ✅ **Argon2id** for password hashing (not bcrypt - more secure)
- ✅ JWT signing with **HS256** (HMAC-SHA256)
- ⚠️ **Encryption at rest** NOT implemented for `documents.file_content`

**Evidence - Argon2 implementation**:
```python
# backend/app/core/security.py:15-25
from argon2 import PasswordHasher

ph = PasswordHasher(
    time_cost=2,        # Number of iterations
    memory_cost=65536,  # 64 MB of memory
    parallelism=1       # Threads
)

# Hash password
hashed = ph.hash(password)

# Verify password
ph.verify(hashed, password)
```

**Evidence - JWT signing**:
```python
# backend/app/core/security.py:50-60
jwt.encode(
    payload,
    settings.SECRET_KEY,
    algorithm="HS256"  # ← HMAC-SHA256
)
```

**Gap identified - Encryption at rest**:
```python
# backend/app/models/document.py:25
file_content: Mapped[bytes] = mapped_column(LargeBinary)
# ⚠️ Stored unencrypted - Gap in A.10.1.1
```

**Recommendation for encryption at rest**:
```python
# Install dependency
pip install cryptography

# Implementation
from cryptography.fernet import Fernet

# In config
ENCRYPTION_KEY = settings.ENCRYPTION_KEY  # From .env

# When saving
cipher = Fernet(ENCRYPTION_KEY)
encrypted_content = cipher.encrypt(file_content)
document.file_content = encrypted_content

# When reading
decrypted_content = cipher.decrypt(document.file_content)
```

**Verification commands**:
```bash
# Verify Argon2 is used (not bcrypt)
grep -r "argon2\|bcrypt" backend/app/core/security.py

# Verify JWT algorithm
grep "algorithm" backend/app/core/security.py

# Check if encryption at rest is implemented
grep -r "Fernet\|encrypt" backend/app/
```

**Expected state**:
- Argon2id for passwords ✅
- JWT with HS256 ✅
- Encryption at rest ❌ (gap)

---

## <a id="a124-logging-and-monitoring"></a>A.12.4 - Logging and Monitoring

**Objective**: Record security events for detection, investigation, and audit.

### A.12.4.1 - Event Logging

**What to verify**:
- ✅ Structured logging system implemented (`backend/app/core/logging.py`)
- ✅ `log_audit_event()` function for critical events
- ✅ Events logged: login, registration, CRUD operations

**Evidence - Logging implementation**:
```python
# backend/app/routers/auth.py
log_audit_event(
    event="login_attempt",
    user_id=str(user.id),
    action="login",
    result="success",
    extra={"email": user.email}
)

# backend/app/routers/documents.py
log_audit_event(
    event="document_upload",
    user_id=str(current_user.id),
    action="upload",
    resource_id=str(document.id),
    extra={"filename": document.file_name, "size": file_size}
)
```

**Critical events that MUST be logged**:
- ✅ `user_registration` (success/failure)
- ✅ `login_attempt` (success/failure)
- ✅ `document_upload` (success)
- ✅ `document_deletion` (success)
- ✅ `summary_creation` (success)
- ✅ `summary_deletion` (success)
- ✅ `quiz_creation` (success)
- ✅ `quiz_deletion` (success)
- ⚠️ `ownership_violation` (access denied) - NOT implemented

**Gap identified - Ownership violation logging**:
```python
# backend/app/core/dependencies.py:74
def verify_summary_ownership(summary: Summary | None, current_user: User) -> None:
    if summary.user_id != current_user.id:
        # ⚠️ Should log AUDIT event here
        raise HTTPException(status_code=403, detail="Not authorized")
```

**Recommendation**:
```python
def verify_summary_ownership(summary: Summary | None, current_user: User) -> None:
    if summary.user_id != current_user.id:
        # ✅ Log ownership violation
        log_audit_event(
            event="ownership_violation",
            user_id=str(current_user.id),
            action="access_denied",
            resource_type="summary",
            resource_id=str(summary.id),
            extra={"owner_id": str(summary.user_id)}
        )
        raise HTTPException(status_code=403, detail="Not authorized")
```

### A.12.4.4 - Clock Synchronization

**What to verify**:
- ✅ Timestamps in UTC (`datetime.datetime.now(datetime.UTC)`)

**Evidence**:
```python
# All timestamps use UTC
from datetime import datetime, UTC
timestamp = datetime.now(UTC)
```

**Verification commands**:
```bash
# Check log_audit_event usage
grep -r "log_audit_event" backend/app/routers/

# View audit logs
grep "AUDIT" backend/logs/app.log | tail -20

# Verify UTC usage
grep -r "datetime.UTC\|timezone.utc" backend/app/
```

**Expected state**:
- Structured logging system ✅
- Critical events logged ✅
- Ownership violations NOT logged ⚠️
- UTC timestamps ✅

---

## <a id="a13-communications-security"></a>A.13 - Communications Security

**Objective**: Protect information in networks.

### A.13.1 - Network Security Management

**What to verify**:
- ✅ JWT authentication implemented
- ✅ CORS configured correctly (only allowed origins)
- ⚠️ HTTPS NOT enforced in development (acceptable)
- ❌ HTTPS NOT configured in production (pending deployment)
- ⚠️ TLS minimum version NOT specified

**Evidence - CORS configuration**:
```python
# backend/app/config.py
CORS_ORIGINS: list[str] = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

# backend/app/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Gap identified - No HTTPS redirect middleware**:

**Recommendation for production**:
```python
# backend/app/main.py
if settings.ENVIRONMENT == "production":
    from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware
    app.add_middleware(HTTPSRedirectMiddleware)
```

**Verification commands**:
```bash
# Verify CORS config
grep -A5 "CORSMiddleware" backend/app/main.py

# Check if HTTPS redirect exists
grep "HTTPSRedirect" backend/app/main.py
```

**Expected state**:
- CORS configured ✅
- HTTPS in development ❌ (acceptable)
- HTTPS in production ❌ (gap for deployment)

---

## <a id="a14-secure-development"></a>A.14 - Secure Development

**Objective**: Ensure security is integral part of development.

### A.14.1 - Security Requirements

**What to verify**:
- ✅ Pydantic validation on ALL endpoints
- ✅ Type hints mandatory (Python and TypeScript)
- ✅ File validation with magic numbers (not just extension)

**Evidence - File validation**:
```python
# backend/app/core/file_validator.py:15-45
ALLOWED_MIME_TYPES = {
    "application/pdf": b"%PDF",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": b"PK",
    # ...
}

def validate_file_type(content: bytes, declared_type: str) -> bool:
    magic_number = ALLOWED_MIME_TYPES.get(declared_type)
    if not magic_number:
        return False
    return content.startswith(magic_number)
```

**Evidence - Pydantic validation**:
```python
# backend/app/schemas/summary.py
class SummaryCreate(BaseModel):
    document_ids: list[UUID] = Field(..., min_length=1, max_length=2)
    expertise_level: ExpertiseLevel  # Enum validation
    title: str | None = Field(None, max_length=200)
```

### A.14.2 - Security in Development Processes

**What to verify**:
- ✅ SDLC documented in `docs/security/SECURE_DEVELOPMENT.md`
- ✅ Code conventions documented (`.claude/conventions/code-style.md`)
- ⚠️ Code review NOT mandatory in development (only Claude suggestions)
- ⚠️ SAST tools NOT integrated (future: bandit, semgrep)

**Verification commands**:
```bash
# Verify all schemas use Pydantic
grep -r "class.*BaseModel" backend/app/schemas/

# Verify type hints (manual review needed)
# Look for: def func(...): without types

# Verify file validation
grep -r "validate_file_type" backend/app/
```

**Expected state**:
- Pydantic validation ✅
- Type hints ✅
- File magic number validation ✅
- SAST tools ❌ (future improvement)

---

## <a id="audit-procedures"></a>Audit Procedures

### Quick Compliance Check (5 minutes)

**Objective**: Verify existing controls remain in place

**Procedure**:
```bash
# 1. Access Control (A.9)
echo "=== A.9 - Access Control ==="
grep -r "verify_.*_ownership" backend/app/routers/ | wc -l
# Expected: 45+ matches

# 2. Cryptography (A.10)
echo "=== A.10 - Cryptography ==="
grep "argon2" backend/app/core/security.py
# Expected: import argon2

# 3. Logging (A.12.4)
echo "=== A.12.4 - Logging ==="
grep -r "log_audit_event" backend/app/routers/ | wc -l
# Expected: 8+ matches

# 4. Secure Development (A.14)
echo "=== A.14 - Secure Development ==="
grep -r "class.*BaseModel" backend/app/schemas/ | wc -l
# Expected: 28+ schemas

# 5. Communications Security (A.13)
echo "=== A.13 - Communications Security ==="
grep "CORS_ORIGINS" backend/app/config.py
# Expected: CORS_ORIGINS defined
```

**Output format**: ✅/⚠️/❌ per control with count

### Deep Audit (20-30 minutes)

**Objective**: Complete compliance audit

**Procedure**:
1. Read `docs/security/COMPLIANCE_CHECKLIST.md` for current state
2. Validate each control against current code
3. Identify gaps since last audit
4. Analyze recent changes (git diff) for control impact
5. Generate detailed report with evidence

**Key files to review**:
- `backend/app/routers/*.py` (endpoint protection)
- `backend/app/core/security.py` (cryptography)
- `backend/app/core/dependencies.py` (ownership)
- `backend/app/core/logging.py` (audit events)
- `backend/app/schemas/*.py` (input validation)
- `backend/app/config.py` (security config)

### Change Impact Analysis

**Objective**: Evaluate if recent changes affected controls

**Procedure**:
```bash
# View changes since last commit
git diff HEAD~1

# Check if changes affect security files
git diff HEAD~1 --name-only | grep -E "security.py|dependencies.py|logging.py"

# Analyze new endpoints
git diff HEAD~1 backend/app/routers/

# Verify new endpoints have ownership validation
```

**Questions to answer**:
- Are new endpoints protected with `get_current_user`?
- Do new endpoints have ownership validation?
- Are new operations logged with `log_audit_event`?
- Do new schemas have Pydantic validation?
- Did changes introduce new risks?

---

## <a id="report-templates"></a>Report Templates

### Executive Summary Template

```markdown
## 🔒 ISO 27001 Audit Report

**Date**: YYYY-MM-DD HH:MM UTC
**Mode**: [Quick Check | Deep Audit | Change Impact]
**Scope**: [Full | Specific Control]
**Auditor**: iso27001-auditor

---

### 📊 Executive Summary

| Control | Status | Implementation | Critical Gap |
|---------|--------|----------------|--------------|
| **A.9** Access Control | ✅ COMPLIANT | 45/45 endpoints | No |
| **A.10** Cryptography | ⚠️ PARTIAL | Argon2 ✅, Encryption at rest ❌ | Yes |
| **A.12.4** Logging | ✅ COMPLIANT | All critical events logged | No |
| **A.14** Secure Dev | ✅ COMPLIANT | Pydantic ✅, File validation ✅ | No |
| **A.13** Comms Security | ⚠️ DEVELOPMENT | HTTPS not enforced | No (dev only) |

**Overall Status**: ⚠️ **COMPLIANCE WITH GAPS** (acceptable for capstone)

**Critical Gaps**: 1 (encryption at rest)
**Non-Critical Gaps**: 2 (HTTPS in prod, ownership violation logging)
```

### Critical Finding Template

```markdown
### 🔴 Critical Finding: [Title]

**Control**: [A.X.Y - Control name]
**Severity**: 🔴 HIGH / 🟡 MEDIUM / 🟢 LOW

**Finding**:
[Description of the issue]

**Evidence**:
```python
[Code snippet showing the issue]
```

**Risk**:
[What could happen if this isn't fixed]

**Impact**:
- [Impact area 1]
- [Impact area 2]

**Recommendation**:
```python
[Code snippet showing the fix]
```

**Priority**: 🔴 HIGH / 🟡 MEDIUM / 🟢 LOW
```

### Verified Control Template

```markdown
### ✅ Verified: [Control Name]

**Control**: [A.X.Y - Control name]
**Status**: ✅ COMPLIANT

**Verification**:
```bash
[Command used to verify]
[Output showing compliance]
```

**Evidence**:
[Description of implementation]

**Example**:
```python
[Code snippet showing correct implementation]
```
```

### Metrics Template

```markdown
### 📈 Compliance Metrics

**Endpoints protected**: X/X (100%)
**Critical events logged**: X/Y (Z%)
**Schemas with validation**: X/X (100%)
**Cryptographic controls**: X/Y (Z%)

**Compliance Score**: XX/100 (🟢 EXCELLENT / 🟡 GOOD / 🔴 NEEDS IMPROVEMENT)
```

### Action Plan Template

```markdown
### 🎯 Recommended Action Plan

**Priority HIGH** (before production deployment):
1. ⚠️ [Action item 1]
2. ⚠️ [Action item 2]

**Priority MEDIUM** (security improvements):
3. 🟡 [Action item 3]
4. 🟡 [Action item 4]

**Priority LOW** (future improvements):
5. 🟢 [Action item 5]
6. 🟢 [Action item 6]
```

---

## Documentation References

**ISO 27001 Documentation**:
- `docs/security/ISO27001_OVERVIEW.md` - What is ISO 27001, project scope
- `docs/security/COMPLIANCE_CHECKLIST.md` - Current control state (detailed checklist)
- `docs/security/RISK_ASSESSMENT.md` - Risk analysis and treatment plan
- `docs/security/AUDIT_LOGGING.md` - Audit logging implementation
- `docs/security/ACCESS_CONTROL_POLICY.md` - Access control policy
- `docs/security/SECURE_DEVELOPMENT.md` - Secure SDLC (A.14)

**Code References**:
- `backend/app/core/security.py` - Cryptography, JWT
- `backend/app/core/dependencies.py` - Ownership validation
- `backend/app/core/logging.py` - Audit logging
- `backend/app/routers/*.py` - Endpoint protection

---

**Last Updated**: 2025-11-29
**Version**: 1.0.0
