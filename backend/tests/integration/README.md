# Tests de Integración E2E - StudyForge

Este directorio contiene tests de integración end-to-end que verifican flujos completos del sistema con autenticación real y base de datos.

## 📋 Tests Implementados

### 1. **test_auth_integration.py** - Flujo de Autenticación
Tests completos del sistema de autenticación:
- ✅ Registro → Login → Obtener perfil
- ✅ Validación de emails duplicados
- ✅ Validación de contraseñas débiles
- ✅ Validación de tokens JWT
- ✅ Protección de rutas autenticadas
- ✅ Manejo de credenciales inválidas

**Cobertura**: 8 tests

###  2. **test_documents_summaries_integration.py** - Flujo de Documentos y Resúmenes
Tests del flujo completo de documentos y generación de resúmenes:
- ✅ Crear espacio → Subir documento → Generar resumen
- ✅ Resúmenes desde múltiples documentos
- ✅ Validación de permisos (aislamiento por usuario)
- ✅ Manejo de errores (documentos inexistentes, listas vacías)

**Cobertura**: 6 tests

### 3. **test_quizzes_integration.py** - Flujo de Quizzes
Tests del sistema completo de quizzes y dificultad adaptativa:
- ✅ Crear quiz → Iniciar intento → Responder → Completar
- ✅ Sistema de dificultad adaptativa (basado en scores previos)
- ✅ Randomización de opciones de quiz
- ✅ Validación de número de preguntas (configuración personalizada)
- ✅ Protección contra completar intento múltiples veces
- ✅ Listado de intentos por quiz

**Cobertura**: 5 tests

### 4. **test_complete_e2e_flow.py** - Flujo E2E Completo (Happy Path)
Test del recorrido completo de un usuario desde registro hasta estadísticas:
- ✅ Registro de usuario
- ✅ Login y autenticación
- ✅ Creación de espacio de estudio
- ✅ Subida de documento al espacio
- ✅ Generación de resumen desde documento
- ✅ Creación de quiz desde resumen
- ✅ Tomar quiz (iniciar, responder, completar)
- ✅ Visualización de estadísticas del espacio
- ✅ Visualización de estadísticas globales del usuario
- ✅ Aislamiento de datos entre espacios

**Cobertura**: 2 tests (muy completos)

## 🏗️ Requisitos

⚠️ **IMPORTANTE**: Estos tests requieren **PostgreSQL** debido al uso de tipos de datos específicos (JSONB, UUID).

### Opción 1: PostgreSQL Local

```bash
# 1. Crear base de datos de test
createdb studyforge_test

# 2. Configurar variable de entorno
export TEST_DATABASE_URL="postgresql+psycopg://user:password@localhost/studyforge_test"
```

### Opción 2: PostgreSQL con Docker

```bash
# 1. Iniciar PostgreSQL en container
docker run --name postgres-test -e POSTGRES_PASSWORD=testpass -e POSTGRES_DB=studyforge_test -p 5433:5432 -d postgres:18

# 2. Configurar variable de entorno
export TEST_DATABASE_URL="postgresql+psycopg://postgres:testpass@localhost:5433/studyforge_test"
```

### Opción 3: CI/CD (GitHub Actions)

Los tests E2E están configurados para ejecutarse automáticamente en CI/CD con PostgreSQL como servicio.

## 🚀 Ejecutar Tests

```bash
# Todos los tests de integración
cd backend
pytest tests/integration/ -v

# Test específico
pytest tests/integration/test_auth_integration.py -v

# Con cobertura
pytest tests/integration/ --cov=app --cov-report=term-missing

# Solo un flujo específico
pytest tests/integration/test_complete_e2e_flow.py::TestCompleteE2EFlow::test_complete_user_journey -v
```

## 📊 Estadísticas

- **Total de tests E2E**: 21 tests
- **Flujos cubiertos**: 4 flujos principales
- **Endpoints testeados**: ~15+ endpoints
- **Cobertura de casos**: Happy path + edge cases + error handling

## 🔧 Configuración (conftest.py)

El archivo `conftest.py` proporciona fixtures compartidas:

### Fixtures Principales

- `db_session`: Sesión de base de datos limpia por test
- `client`: Cliente HTTP de FastAPI con DB de test
- `test_user_data`: Datos de usuario de prueba
- `authenticated_client`: Cliente con token JWT válido
- `sample_text_file`: Archivo de texto de prueba
- `sample_pdf_content`: Contenido PDF de prueba

### Características

- ✅ Limpieza automática de base de datos entre tests
- ✅ Aislamiento completo entre tests
- ✅ Autenticación real con JWT
- ✅ Mocking de servicios externos (OpenAI)

## 🎯 Ventajas de estos Tests

1. **Verificación E2E Real**: Prueban el sistema completo con autenticación y base de datos
2. **Detección de Regresiones**: Capturan errores que los tests unitarios no detectan
3. **Documentación Viva**: Los tests documentan cómo usar el sistema
4. **Confianza en Deployments**: Validación completa antes de producción

## 📝 Notas Técnicas

### Mocking de OpenAI

Los tests mockean las llamadas a OpenAI para:
- Evitar costos de API en tests
- Hacer tests deterministas y rápidos
- Permitir tests sin API key

```python
with patch('app.services.openai_service.OpenAIService.generate_summary') as mock_openai:
    mock_openai.return_value = mock_content
    # ... test code
```

### Limitación Actual: SQLite

Los tests están diseñados para PostgreSQL. SQLite **NO** es compatible debido a:
- Tipo JSONB (PostgreSQL específico)
- Tipo UUID nativo
- Schemas (`studyforge.tablename`)

## 🔮 Futuras Mejoras

- [ ] Tests de performance (tiempos de respuesta)
- [ ] Tests de carga concurrente
- [ ] Tests de límites de cuotas
- [ ] Tests de cleanup automático (eliminación en cascada)
- [ ] Tests frontend E2E con Playwright

## 📚 Referencias

- [TESTING.md](/docs/TESTING.md) - Guía completa de testing
- [API.md](/docs/API.md) - Documentación de endpoints
- [ARCHITECTURE.md](/docs/ARCHITECTURE.md) - Arquitectura del sistema
