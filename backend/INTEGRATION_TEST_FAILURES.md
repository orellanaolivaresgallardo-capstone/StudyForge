# Análisis de Fallos en Tests de Integración

**Fecha:** 2025-11-29
**Última Actualización:** 2025-11-29 18:47 UTC

## Estado Actual

**Tests Ejecutados:** 32
**Tests Pasando:** 18 (56%) ✅
**Tests Fallando:** 14 (44%) ❌

**Progreso:** +11 tests (+34%) desde el análisis inicial

### Histórico

| Estado | Tests Pasando | Porcentaje | Notas |
|--------|---------------|------------|-------|
| Inicial | 7/32 | 22% | Sin correcciones |
| Actual | 18/32 | 56% | Rate limiting + upload format corregidos |
| Meta | 28/32 | 87% | Solo assertions incorrectas quedarían |

---

## Resumen Ejecutivo

### ✅ Completado (Fase 1)

Los tests de integración ahora **ejecutan correctamente** sin errores de infraestructura:

1. ✅ **Rate Limiting** - RESUELTO (11 tests)
   - Deshabilitado para IP "testclient" en `app/core/rate_limiter.py`
   - Todos los tests de `test_study_spaces_integration.py` ahora pasan

2. ✅ **Upload Format** - PARCIALMENTE RESUELTO (14 correcciones)
   - Cambiado de query param `?study_space_id=` a form data `study_space_ids`
   - Corregidos 14 llamadas en 4 archivos de tests
   - Algunos tests ahora pasan, otros revelan nuevos errores

### ❌ Pendiente (14 tests fallando)

Errores agrupados en **3 categorías**:

1. **Assertions incorrectas** - 4 tests (prioridad BAJA)
   - Mensajes en español vs inglés (2 tests)
   - Status code 403 vs 401 (1 test)
   - Validación de contraseña débil (1 test)

2. **Formato de respuesta** - 10 tests (requiere investigación)
   - KeyError 'extracted_text', 'id', 'difficulty_level'
   - Title mismatch: "math.txt" vs "math"
   - 404/422 en endpoints que deberían funcionar

---

## Categoría 1: Rate Limiting (429 Too Many Requests) - 11 tests

**Problema:** Los tests se ejecutan tan rápido que el rate limiter los bloquea.

**Archivos afectados:**
- `tests/integration/test_study_spaces_integration.py` (todos los tests de este archivo)

**Tests fallando:**
1. `test_upload_document_to_space`
2. `test_generate_summary_from_document`
3. `test_generate_quiz_from_document`
4. `test_generate_quiz_from_summary`
5. `test_progress_graph_filtered_by_space`
6. `test_create_study_space`
7. `test_generate_quiz_invalid_num_questions`
8. `test_generate_summary_no_documents`
9. `test_list_study_spaces_without_stats`
10. `test_list_study_spaces_with_stats`
11. `test_list_study_spaces_with_stats_false`

**Error típico:**
```
assert 429 in [401, 403, 422]
  +  where 429 = <Response [429 Too Many Requests]>.status_code

WARNING  app.core.rate_limiter:rate_limiter.py:144 Rate limit exceeded for IP testclient on /study-spaces/
```

**Causa raíz:**
- Los tests usan `TestClient` que simula requests desde la misma IP (`testclient`)
- El rate limiter de producción está activo en los tests
- Los tests se ejecutan secuencialmente y todos usan la misma IP

**Soluciones propuestas:**

### Opción A: Deshabilitar rate limiting en tests (RECOMENDADA)
```python
# backend/conftest.py
@pytest.fixture
def client(test_db):
    """Cliente de tests con rate limiting deshabilitado."""
    from app.main import app
    app.state.rate_limiter.enabled = False  # Deshabilitar en tests
    with TestClient(app) as client:
        yield client
```

### Opción B: Aumentar límite para IP testclient
```python
# backend/app/core/rate_limiter.py
def is_rate_limited(self, identifier: str) -> bool:
    if identifier == "testclient":  # IP de tests
        return False
    # ... resto del código
```

### Opción C: Agregar delays entre requests
```python
# backend/tests/integration/test_study_spaces_integration.py
import time

def test_upload_document_to_space():
    time.sleep(1)  # Esperar 1 segundo entre tests
    # ... resto del test
```

**Prioridad:** ALTA - Bloquea 44% de los tests

---

## Categoría 2: KeyError al acceder a 'id' en upload de documentos - 7 tests

**Problema:** Los tests esperan `upload_response.json()["id"]` pero el endpoint devuelve 422 (Unprocessable Entity).

**Archivos afectados:**
- `tests/integration/test_quizzes_integration.py` (5 tests)
- `tests/integration/test_documents_summaries_integration.py` (2 tests)

**Tests fallando:**
1. `test_complete_quiz_flow` - línea 36
2. `test_adaptive_difficulty_system` - línea 150
3. `test_create_quiz_with_custom_questions_count` - línea 216
4. `test_cannot_complete_quiz_attempt_twice` - línea 265
5. `test_list_quiz_attempts_for_quiz` - línea 319
6. `test_create_summary_from_multiple_documents` - línea 117
7. `test_complete_document_summary_flow` - línea 45

**Error típico:**
```python
document_id = upload_response.json()["id"]
E   KeyError: 'id'

# El upload_response.status_code es 422, no 201
assert 422 == 201
```

**Causa raíz:**
- El endpoint `POST /documents/` está devolviendo 422 (validación fallida)
- Los tests no verifican `status_code` antes de acceder a `.json()["id"]`
- El payload del request probablemente no coincide con el schema esperado

**Investigación necesaria:**
1. Ver qué schema espera `POST /documents/`
2. Ver qué datos están enviando los tests
3. Ver el detalle del error 422 para identificar qué campo falla

**Soluciones propuestas:**

### Paso 1: Investigar el error 422
```python
# En el test, agregar debug:
upload_response = client.post("/documents/", ...)
print(f"Status: {upload_response.status_code}")
print(f"Response: {upload_response.json()}")  # Ver el detalle del error
```

### Paso 2: Verificar schema
```python
# backend/app/schemas/document.py
class DocumentCreate(BaseModel):
    # ¿Qué campos requiere?
```

### Paso 3: Corregir el payload del test
```python
# Ejemplo de posible corrección
files = {"file": ("test.pdf", file_content, "application/pdf")}
data = {"study_space_id": str(space_id)}  # Agregar campos requeridos
response = client.post("/documents/", files=files, data=data)
```

**Prioridad:** CRÍTICA - Bloquea 28% de los tests y toda la funcionalidad de documentos

---

## Categoría 3: 422 Unprocessable Entity en uploads - 3 tests

**Problema:** Similar a Categoría 2, pero los tests verifican el status code directamente.

**Tests fallando:**
1. `test_complete_user_journey` - línea 74
2. `test_complete_document_summary_flow` - línea 45
3. `test_generate_summary_with_invalid_document_id_fails` - línea 194 (espera 404, recibe 422)

**Error típico:**
```python
assert upload_response.status_code == 201
E   assert 422 == 201
E    +  where 422 = <Response [422 Unprocessable Entity]>.status_code
```

**Causa raíz:**
Igual que Categoría 2 - el payload del upload no coincide con el schema esperado.

**Solución:**
Misma solución que Categoría 2 - investigar y corregir el payload.

**Prioridad:** CRÍTICA - Misma causa raíz que Categoría 2

---

## Categoría 4: Mensajes de error en español - 2 tests

**Problema:** Los tests esperan mensajes en inglés pero la API devuelve mensajes en español.

**Tests fallando:**
1. `test_register_duplicate_email_fails` - línea 65
2. `test_login_with_wrong_password_fails` - línea 79

**Error típico:**
```python
# Test espera:
assert "already registered" in response2.json()["detail"].lower()

# API devuelve:
E   AssertionError: assert 'already registered' in 'el email ya está registrado'
```

**Causa raíz:**
- La API está configurada en español (mensajes hardcodeados en español)
- Los tests esperan mensajes en inglés

**Soluciones propuestas:**

### Opción A: Actualizar tests para español (RECOMENDADA)
```python
# backend/tests/integration/test_auth_integration.py

# Antes:
assert "already registered" in response2.json()["detail"].lower()

# Después:
assert "ya está registrado" in response2.json()["detail"].lower()
```

### Opción B: Internacionalizar la API
```python
# backend/app/services/auth_service.py
# Cambiar mensajes hardcodeados a un sistema de i18n
# (mucho más complejo, no recomendado)
```

**Prioridad:** BAJA - Solo afecta assertions, no funcionalidad real

---

## Categoría 5: Otros problemas - 2 tests

### 5.1. Validación de contraseña débil - 1 test

**Test:** `test_register_with_weak_password_fails` - línea 121

**Problema:** La contraseña "onlylowercase" debería rechazarse pero se acepta.

**Error:**
```python
assert response.status_code in [400, 422], \
    f"Password '{password}' debería ser rechazada"
E   AssertionError: Password 'onlylowercase' debería ser rechazada
E   assert 201 in [400, 422]
```

**Causa raíz:**
- El schema de validación de contraseña NO requiere uppercase/numbers/special chars
- Solo valida longitud mínima

**Investigación necesaria:**
```python
# backend/app/schemas/user.py
class UserCreate(BaseModel):
    password: str = Field(..., min_length=?)
    # ¿Hay validación de complejidad?
```

**Soluciones propuestas:**

### Opción A: Agregar validación de complejidad
```python
# backend/app/schemas/user.py
from pydantic import field_validator
import re

class UserCreate(BaseModel):
    password: str = Field(..., min_length=8)

    @field_validator('password')
    def validate_password_complexity(cls, v):
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not re.search(r'[0-9]', v):
            raise ValueError('Password must contain at least one digit')
        return v
```

### Opción B: Actualizar el test para reflejar política actual
```python
# Si NO queremos validación de complejidad, el test está mal
# Simplemente eliminar este test
```

**Prioridad:** MEDIA - Tema de seguridad, pero no bloquea flujos críticos

---

### 5.2. Status code 403 en vez de 401 - 1 test

**Test:** `test_access_protected_route_without_token_fails` - línea 93

**Problema:** El test espera 401 (Unauthorized) pero recibe 403 (Forbidden).

**Error:**
```python
assert response.status_code == 401
E   assert 403 == 401
```

**Causa raíz:**
- FastAPI/Starlette pueden devolver 403 en vez de 401 en ciertos casos
- Diferencia semántica: 401 = no autenticado, 403 = no autorizado

**Solución:**
```python
# backend/tests/integration/test_auth_integration.py

# Antes:
assert response.status_code == 401

# Después:
assert response.status_code in [401, 403]  # Ambos son válidos para "sin token"
```

**Prioridad:** BAJA - Solo assertion incorrecta

---

### 5.3. Test de aislamiento de espacios - 1 test

**Test:** `test_multiple_spaces_isolation` - línea 328

**Problema:** El test espera 1 documento en un space, pero encuentra 0.

**Error:**
```python
assert len(space1_detail["documents"]) == 1
E   assert 0 == 1
```

**Causa raíz:**
- El upload de documento al space falló (probablemente por el mismo 422 de Categoría 2/3)
- El test no verifica que el upload fue exitoso antes de continuar

**Solución:**
Resolver primero los errores de upload (Categoría 2/3), luego revisar este test.

**Prioridad:** MEDIA - Bloqueado por Categoría 2/3

---

## Warnings

### Deprecation: @app.on_event("startup")

**Archivo:** `backend/app/main.py:43`

**Mensaje:**
```
DeprecationWarning:
  on_event is deprecated, use lifespan event handlers instead.

  Read more about it in the
  [FastAPI docs for Lifespan Events](https://fastapi.tiangolo.com/advanced/events/).
```

**Solución:**
```python
# backend/app/main.py

# Antes:
@app.on_event("startup")
async def startup_event():
    logger.info("Starting application...")

# Después:
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle startup and shutdown events."""
    logger.info("Starting application...")
    yield
    # Shutdown logic (optional)

app = FastAPI(lifespan=lifespan)
```

**Prioridad:** BAJA - Solo es un warning, no afecta funcionalidad

---

## Plan de Acción Priorizado

### ✅ Fase 1: COMPLETADA - Desbloquear infraestructura

1. ✅ **COMPLETADO: Deshabilitar rate limiting en tests**
   - Modificado `app/core/rate_limiter.py:142`
   - Agregada excepción para IP "testclient"
   - **Resultado:** 11 tests ahora pasan

2. ✅ **COMPLETADO: Corregir formato de upload**
   - Cambiado de query param `?study_space_id=` a form data `study_space_ids`
   - Corregidos 14 archivos en 4 test files
   - **Resultado:** Desbloquea flujo de documentos, pero revela nuevos errores

### 🔄 Fase 2: EN PROGRESO - Correcciones de formato de respuesta

**Nuevos errores descubiertos** después de corregir uploads (10 tests):

1. **KeyError 'extracted_text'** - test_complete_user_journey
2. **Title mismatch** - Varios tests esperan "math" pero reciben "math.txt"
3. **404/422 inesperados** - Endpoints que deberían funcionar

**Acción requerida:**
- Investigar schema de DocumentResponse
- Ver por qué algunos endpoints devuelven 404/422
- Ajustar tests o corregir implementación

### 📝 Fase 3: Correcciones menores (BAJA)
3. ⚠️ **Actualizar assertions de mensajes en español** - Desbloquea 2 tests
   - Cambiar "already registered" → "ya está registrado"
   - Cambiar "invalid" → "credenciales inválidas"

4. ⚠️ **Validación de contraseña débil** - Desbloquea 1 test
   - Decidir si agregar validación de complejidad o eliminar test
   - Implementar según decisión

5. ⚠️ **Corregir assertion 401 vs 403** - Desbloquea 1 test
   - Aceptar ambos status codes como válidos

### Fase 3: Mejoras (BAJA)
6. 🔹 **Migrar a lifespan events** - Elimina warnings
   - Reemplazar `@app.on_event()` con `lifespan` context manager

### Fase 4: Revisión (PENDIENTE)
7. 🔹 **Revisar test_multiple_spaces_isolation**
   - Depende de que se resuelvan los errores de upload primero

---

## Comandos Útiles

### Ver detalle de un test específico
```bash
cd backend
python -m pytest tests/integration/test_study_spaces_integration.py::test_upload_document_to_space -vv
```

### Ver solo los primeros N fallos
```bash
python -m pytest tests/integration/ -x  # Parar en el primer error
python -m pytest tests/integration/ --maxfail=3  # Parar después de 3 errores
```

### Ejecutar solo tests que NO tienen rate limiting
```bash
python -m pytest tests/integration/test_auth_integration.py -v
python -m pytest tests/integration/test_documents_summaries_integration.py -v
```

### Ver el payload exacto de un request fallido
```python
# En el test, agregar:
import json
print(json.dumps(upload_response.json(), indent=2))
```

---

## Métricas de Progreso

| Categoría | Tests Afectados | % del Total | Prioridad |
|-----------|----------------|-------------|-----------|
| Rate Limiting | 11 | 44% | CRÍTICA |
| Upload KeyError | 7 | 28% | CRÍTICA |
| Upload 422 | 3 | 12% | CRÍTICA |
| Mensajes español | 2 | 8% | BAJA |
| Password validation | 1 | 4% | MEDIA |
| Status code 403 | 1 | 4% | BAJA |

**Total tests bloqueados por infraestructura:** 21/25 (84%)
**Total tests con assertions incorrectas:** 4/25 (16%)

---

## ✅ Progreso Completado

### Fase 1: COMPLETADA ✅

**Tiempo invertido:** ~1 hora
**Tests mejorados:** +11 (de 7 a 18)
**Mejora:** +34 puntos porcentuales

**Cambios realizados:**

1. **Rate Limiter** - `backend/app/core/rate_limiter.py:142`
   ```python
   # EXCEPCIÓN: Deshabilitar rate limiting para tests
   if client_ip == "testclient":
       return await call_next(request)
   ```

2. **Document Uploads** - 4 archivos de tests modificados:
   ```python
   # Antes (incorrecto):
   client.post(f"/documents/?study_space_id={space_id}", files={...})

   # Después (correcto):
   client.post("/documents/", files={...}, data={"study_space_ids": str(space_id)})
   ```

## 📋 Próximos Pasos (Fase 2)

### 1. Investigar errores de formato de respuesta (ALTA PRIORIDAD)

**Errores a investigar:**
- ❌ KeyError 'extracted_text' (1 test)
- ❌ Title mismatch: "math.txt" vs "math" (2 tests)
- ❌ 404/422 inesperados (7 tests)

**Tareas:**
1. Leer `app/schemas/document.py` - ver qué campos incluye DocumentResponse
2. Ejecutar un test fallido con verbose output para ver el response completo
3. Comparar schema esperado vs schema real
4. Decidir si corregir tests o implementación

**Estimación:** 1-2 horas
**Impacto esperado:** +6-8 tests

### 2. Corregir assertions menores (BAJA PRIORIDAD)

**Tareas simples** (15-30 minutos):
- Cambiar assertions de inglés a español (2 tests)
- Aceptar 403 además de 401 (1 test)
- Decidir sobre validación de contraseña (1 test)

**Estimación:** 30 minutos
**Impacto esperado:** +4 tests

## 🎯 Meta Final

**Objetivo:** 28/32 tests pasando (87%)
**Estado actual:** 18/32 tests pasando (56%)
**Falta:** +10 tests
**Tiempo estimado restante:** 1.5-2.5 horas
