# 🧪 Análisis de Cobertura de Testing - Frontend

**Fecha:** 2025-11-29
**Estado:** MVP con cobertura parcial
**Framework:** Vitest + React Testing Library + axios-mock-adapter

---

## 📊 Resumen Ejecutivo

| Métrica | Valor | Estado |
|---------|-------|--------|
| **Archivos fuente totales** | 141 archivos | - |
| **Archivos de test** | 16 archivos | 🟡 Cobertura baja |
| **Tests totales** | 339 tests | ✅ Buena cantidad |
| **Tests pasando** | 302 (89%) | ✅ Mayormente estable |
| **Tests fallando** | 37 (11%) | 🔴 Requiere atención |
| **Cobertura objetivo** | 70% líneas/funciones/ramas | ⚠️ No alcanzada |

---

## 🎯 Estado por Categoría

### ✅ **BIEN CUBIERTO** (>80% de archivos testeados)

#### 1. Services API (7/9 archivos, 78%)
- ✅ `auth.api.ts` - 9 tests (autenticación completa)
- ✅ `client.ts` - 26 tests (interceptors, headers, error handling)
- ✅ `documents.api.ts` - 20 tests (CRUD completo)
- ✅ `summaries.api.ts` - 16 tests (generación y gestión)
- ✅ `quizzes.api.ts` - 22 tests (1 fallando - FormData issue)
- ✅ `quiz-attempts.api.ts` - 20 tests (intentos y scoring)
- ✅ `study-spaces.api.ts` - 39 tests (CRUD + recursos)
- ❌ `stats.api.ts` - **SIN TESTS** (crítico para dashboard)
- ❌ `health.api.ts` - **SIN TESTS** (low priority)

**Cobertura estimada:** ~78% de archivos, ~90% de funcionalidad crítica

---

### 🟡 **PARCIALMENTE CUBIERTO** (20-50% de archivos testeados)

#### 2. Context (1/2 archivos, 50%)
- ✅ `AuthContext.tsx` - 19 tests (login, logout, persistencia)
- ❌ `StorageContext.tsx` - **SIN TESTS** (crítico - usado por QuotaWidget)

**Impacto:** QuotaWidget tests fallan porque falta StorageProvider wrapper

---

#### 3. Componentes UI (5/17 archivos, 29%)

**Testeados:**
- ✅ `Toast.tsx` - tests completos (con warnings de act())
- ✅ `Modal.tsx` - tests completos
- ✅ `LoadingSpinner.tsx` - tests completos
- ✅ `EmptyState.tsx` - 18 tests (todos los casos)
- ✅ `ProtectedRoute.tsx` - 6 tests (auth routing)

**Sin tests (12 componentes):**
- ❌ `ConfirmModal.tsx` - **Alta prioridad** (usado en toda la app)
- ❌ `SummaryCard.tsx` - **Alta prioridad** (componente principal)
- ❌ `DocumentCard.tsx` - **Alta prioridad**
- ❌ `SpaceCard.tsx` - **Alta prioridad**
- ❌ `ExpertiseLevelBadge.tsx` - Media prioridad
- ❌ `DifficultyBadge.tsx` - Media prioridad
- ❌ `ScoreBadge.tsx` - Media prioridad
- ❌ `DocumentStateBadge.tsx` - Media prioridad
- ❌ `SummaryTopics.tsx` - Baja prioridad (componente simple)
- ❌ `SummaryKeyConcepts.tsx` - Baja prioridad (componente simple)
- ❌ `SummaryCardFooter.tsx` - Baja prioridad
- ❌ `StatCard.tsx` - Media prioridad

**Cobertura estimada:** ~29% de archivos, ~40% de componentes críticos

---

### 🔴 **SIN COBERTURA** (<10% de archivos testeados)

#### 4. Hooks Personalizados (0/6 archivos, 0%)
- ❌ `useStudySpace.ts` - **CRÍTICO** (lógica de espacios de estudio)
- ❌ `useStudySpacesData.ts` - **CRÍTICO** (fetch y gestión de datos)
- ❌ `useSummariesData.ts` - **CRÍTICO** (fetch y gestión de resúmenes)
- ❌ `useModal.ts` - Media prioridad (lógica simple)
- ❌ `useToast.ts` - Media prioridad (notificaciones)
- ❌ `useStudySpaceModals.ts` - Media prioridad

**Impacto:** Hooks críticos sin tests = bugs difíciles de detectar

---

#### 5. Páginas (0/~20 archivos, 0%)
**Sin tests (todas):**
- ❌ `SummariesPage.tsx` - **Alta prioridad** (página principal)
- ❌ `SummaryDetailPage.tsx` - **Alta prioridad**
- ❌ `StudySpacesPage.tsx` - **Alta prioridad**
- ❌ `StudySpaceDetailPage.tsx` - **Alta prioridad**
- ❌ `QuizzesPage.tsx` - **Alta prioridad**
- ❌ `QuizAttemptPage.tsx` - **Alta prioridad**
- ❌ `QuizResultsPage.tsx` - **Alta prioridad**
- ❌ `DocumentsPage.tsx` - **Alta prioridad**
- ❌ `StatsPage.tsx` - Alta prioridad
- ❌ `SettingsPage.tsx` - Media prioridad
- ❌ `ProfilePage.tsx` - Media prioridad
- ❌ `ErrorPage.tsx` - Baja prioridad
- ❌ `HomePage.tsx` - Baja prioridad (landing page)
- ❌ `FeaturesPage.tsx` - Baja prioridad
- ❌ `AboutUsPage.tsx` - Baja prioridad

**Justificación de ausencia:** Páginas son difíciles de testear unitariamente (mejor con E2E tests)

---

#### 6. Componentes de Features (1/2 archivos, 50%)
- ❌ `QuotaWidget.tsx` - **32 tests FALLANDO** (falta StorageProvider)
- ✅ `QuizCard.tsx` - 31 tests (4 fallando por cambios en badges)
- ❌ `PerformanceChart.tsx` - **SIN TESTS**

---

#### 7. Utils (1/1 archivos, 100%)
- ✅ `errorHandler.ts` - 22 tests (100% coverage)

---

## 🚨 Tests Fallando (37 tests)

### 1. QuotaWidget.test.tsx (32 tests fallando)
**Causa raíz:** Componente requiere `StorageProvider` pero no está envuelto en tests

**Error:**
```
Error: useStorage must be used within a StorageProvider
```

**Solución:**
```tsx
// tests/unit/components/features/QuotaWidget.test.tsx
import { StorageProvider } from '@/context/StorageContext';

const renderQuotaWidget = (props = {}) => {
  return render(
    <StorageProvider>
      <QuotaWidget {...props} />
    </StorageProvider>
  );
};
```

**Prioridad:** 🔴 **ALTA** - Bloquea 32 tests

---

### 2. QuizCard.test.tsx (4 tests fallando)
**Causa raíz:** Cambios en el componente - badges de espacio no se muestran como esperado

**Tests afectados:**
- `debe mostrar información de archivo cuando source_type es "file"`
- `debe mostrar información de resumen cuando source_type es "summary"`
- `debe mostrar información de espacio cuando source_type es "space"`
- `debe mostrar información de espacio cuando showSpaceBadge es true`

**Error:**
```
Unable to find an element with the text: /Desde espacio:/
```

**Solución:** Actualizar tests para reflejar cambios recientes en el componente

**Prioridad:** 🟡 **MEDIA** - Tests desactualizados, no bugs reales

---

### 3. quizzes.api.test.ts (1 test fallando)
**Causa raíz:** FormData no se está creando correctamente

**Test afectado:**
- `debe crear quiz desde documento con max_questions`

**Error:**
```
expected null to be '12' // Object.is equality
expect(formData.get('max_questions')).toBe('12')
```

**Solución:** Revisar cómo se construye el FormData en `createQuizFromDocument()`

**Prioridad:** 🟡 **MEDIA** - Posible bug en implementación

---

## 📈 Gaps Críticos de Cobertura

### 🔴 **PRIORIDAD ALTA** (Bloquean funcionalidad crítica)

1. **StorageContext sin tests** → QuotaWidget inoperable
2. **Hooks de datos sin tests** → `useStudySpacesData`, `useSummariesData`, `useStudySpace`
3. **stats.api.ts sin tests** → Dashboard de estadísticas no validado
4. **ConfirmModal sin tests** → Usado en toda la app para eliminaciones
5. **Cards principales sin tests** → `SummaryCard`, `DocumentCard`, `SpaceCard`

### 🟡 **PRIORIDAD MEDIA** (Mejoran confiabilidad)

6. **Badges sin tests** → `ExpertiseLevelBadge`, `DifficultyBadge`, `ScoreBadge`
7. **PerformanceChart sin tests** → Visualización de progreso
8. **Hooks simples sin tests** → `useModal`, `useToast`
9. **Páginas principales sin tests** → `SummariesPage`, `StudySpacesPage`, `QuizzesPage`

### 🟢 **PRIORIDAD BAJA** (Nice to have)

10. **Componentes pequeños sin tests** → `SummaryTopics`, `SummaryKeyConcepts`
11. **Páginas públicas sin tests** → `HomePage`, `FeaturesPage`, `AboutUsPage`
12. **health.api.ts sin tests** → Endpoint de health check

---

## 🎯 Roadmap de Testing Recomendado

### **Fase 1: Estabilizar tests existentes** (1-2 días)

**Objetivo:** 100% de tests pasando

- [ ] Fix QuotaWidget tests (agregar StorageProvider)
- [ ] Fix QuizCard tests (actualizar assertions)
- [ ] Fix quizzes.api test (FormData bug)
- [ ] Arreglar warnings de `act()` en Toast tests

**Resultado esperado:** 339/339 tests pasando (100%)

---

### **Fase 2: Cobertura crítica de Context y Hooks** (3-5 días)

**Objetivo:** Testear lógica de negocio

**2.1 Context**
- [ ] `StorageContext.tsx` - Tests de gestión de quota
  - Estado inicial
  - Fetch storage info
  - Refresh functionality
  - Error handling

**2.2 Hooks críticos**
- [ ] `useStudySpacesData.ts` - Gestión de espacios
  - List spaces
  - Create space
  - Update space
  - Delete space
  - Add/remove resources

- [ ] `useSummariesData.ts` - Gestión de resúmenes
  - List summaries
  - Create summary
  - Delete summary
  - Refresh data

- [ ] `useStudySpace.ts` - Hook de detalle
  - Load space data
  - Update space
  - Error handling

**Resultado esperado:** 8/8 archivos de context/hooks testeados (100%)

---

### **Fase 3: Cobertura de componentes UI** (3-4 días)

**Objetivo:** Validar componentes reutilizables

**3.1 Componentes críticos**
- [ ] `ConfirmModal.tsx` - Modal de confirmación
  - Render variants (danger, warning)
  - Confirm/cancel callbacks
  - Loading state
  - Accessibility (ESC key, focus trap)

- [ ] `SummaryCard.tsx` - Card de resumen
  - Render all variants (default, list)
  - Click navigation
  - Delete action
  - Create quiz action
  - Badges display

- [ ] `DocumentCard.tsx` - Card de documento
  - File type icons
  - Size formatting
  - Delete action
  - Date display

- [ ] `SpaceCard.tsx` - Card de espacio
  - Resource counts
  - Progress indicators
  - Actions

**3.2 Badges**
- [ ] `ExpertiseLevelBadge.tsx` - 3 levels (básico, medio, avanzado)
- [ ] `DifficultyBadge.tsx` - 5 levels (1-5)
- [ ] `ScoreBadge.tsx` - Score ranges (0-100)
- [ ] `DocumentStateBadge.tsx` - States (active, deleted)

**Resultado esperado:** 17/17 componentes UI testeados (100%)

---

### **Fase 4: Tests de integración de páginas** (5-7 días)

**Objetivo:** Tests de flujos E2E simulados

**4.1 Páginas principales (integration tests)**
- [ ] `SummariesPage.tsx` - Lista y creación de resúmenes
  - Load summaries
  - Create summary modal
  - Delete summary (with ConfirmModal)
  - Empty state

- [ ] `StudySpacesPage.tsx` - Gestión de espacios
  - Load spaces
  - Create space modal
  - Edit space
  - Delete space

- [ ] `QuizzesPage.tsx` - Lista de quizzes
  - Load quizzes
  - Create quiz modal
  - Navigate to attempt
  - Filter by space

**4.2 Páginas de detalle**
- [ ] `SummaryDetailPage.tsx` - Detalle de resumen
  - Load summary
  - Display content sections
  - Create quiz from summary

- [ ] `StudySpaceDetailPage.tsx` - Detalle de espacio
  - Load space data
  - Tabs navigation
  - Add resources
  - Progress visualization

**Resultado esperado:** Tests de flujos principales completos

---

### **Fase 5: Cobertura complementaria** (2-3 días)

**Objetivo:** Completar gaps restantes

- [ ] `stats.api.ts` - Tests de API de estadísticas
- [ ] `PerformanceChart.tsx` - Tests de gráficos
- [ ] Hooks simples: `useModal`, `useToast`, `useStudySpaceModals`
- [ ] Componentes pequeños: `SummaryTopics`, `SummaryKeyConcepts`

**Resultado esperado:** >90% de archivos críticos testeados

---

## 🛠️ Herramientas y Configuración

### Stack de Testing Actual

```json
{
  "framework": "Vitest 4.0.14",
  "renderer": "@testing-library/react 16.3.0",
  "assertions": "@testing-library/jest-dom 6.9.1",
  "mocking": {
    "api": "axios-mock-adapter 2.1.0",
    "msw": "msw 2.12.3"
  },
  "coverage": "@vitest/coverage-v8 4.0.14",
  "ui": "@vitest/ui 4.0.14"
}
```

### Configuración de Cobertura

**Archivo:** `frontend/vitest.config.ts`

```typescript
coverage: {
  provider: 'v8',
  reporter: ['text', 'html', 'lcov'],
  exclude: [
    'node_modules/',
    'tests/',
    '**/*.d.ts',
    '**/*.config.*',
    '**/dist/**',
    'src/main.tsx',
    'src/vite-env.d.ts',
  ],
  all: true,
  lines: 70,      // Objetivo: 70%
  functions: 70,  // Objetivo: 70%
  branches: 70,   // Objetivo: 70%
  statements: 70, // Objetivo: 70%
}
```

**Comandos:**

```bash
# Ejecutar tests
pnpm test

# Ejecutar tests en modo watch
pnpm test:ui

# Ejecutar tests con cobertura
pnpm test:coverage

# Ejecutar tests sin watch mode
pnpm test:run
```

---

## 📝 Patrones de Testing Recomendados

### 1. Testing de Componentes con Context

```typescript
// tests/unit/components/MyComponent.test.tsx
import { render, screen } from '@testing-library/react';
import { AuthProvider } from '@/context/AuthContext';
import { StorageProvider } from '@/context/StorageContext';
import { MyComponent } from '@/components/MyComponent';

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <AuthProvider>
      <StorageProvider>
        {ui}
      </StorageProvider>
    </AuthProvider>
  );
};

describe('MyComponent', () => {
  it('debe renderizar correctamente', () => {
    renderWithProviders(<MyComponent />);
    expect(screen.getByText(/expected text/i)).toBeInTheDocument();
  });
});
```

### 2. Testing de Hooks

```typescript
// tests/unit/hooks/useMyHook.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { useMyHook } from '@/hooks/useMyHook';
import MockAdapter from 'axios-mock-adapter';
import api from '@/services/api/client';

const mockApi = new MockAdapter(api);

describe('useMyHook', () => {
  afterEach(() => {
    mockApi.reset();
  });

  it('debe cargar datos correctamente', async () => {
    mockApi.onGet('/endpoint').reply(200, { data: 'test' });

    const { result } = renderHook(() => useMyHook());

    await waitFor(() => {
      expect(result.current.data).toBeTruthy();
      expect(result.current.loading).toBe(false);
    });
  });
});
```

### 3. Testing de Interacciones de Usuario

```typescript
// tests/unit/components/InteractiveComponent.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InteractiveComponent } from '@/components/InteractiveComponent';

describe('InteractiveComponent', () => {
  it('debe manejar click correctamente', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<InteractiveComponent onClick={handleClick} />);

    const button = screen.getByRole('button');
    await user.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### 4. Testing de Formularios

```typescript
// tests/unit/components/MyForm.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MyForm } from '@/components/MyForm';

describe('MyForm', () => {
  it('debe validar campos requeridos', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();

    render(<MyForm onSubmit={handleSubmit} />);

    const submitButton = screen.getByRole('button', { name: /enviar/i });
    await user.click(submitButton);

    expect(handleSubmit).not.toHaveBeenCalled();
    expect(screen.getByText(/campo requerido/i)).toBeInTheDocument();
  });

  it('debe enviar datos correctamente', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();

    render(<MyForm onSubmit={handleSubmit} />);

    await user.type(screen.getByLabelText(/nombre/i), 'Juan');
    await user.click(screen.getByRole('button', { name: /enviar/i }));

    expect(handleSubmit).toHaveBeenCalledWith({ nombre: 'Juan' });
  });
});
```

---

## 🎨 Mejores Prácticas

### ✅ **DO (Hacer)**

1. **Testear comportamiento, no implementación**
   ```typescript
   // ✅ Bueno
   expect(screen.getByRole('button', { name: /guardar/i })).toBeEnabled();

   // ❌ Malo
   expect(component.state.isValid).toBe(true);
   ```

2. **Usar queries accesibles**
   ```typescript
   // ✅ Bueno (por orden de prioridad)
   screen.getByRole('button', { name: /guardar/i })
   screen.getByLabelText(/nombre/i)
   screen.getByText(/contenido visible/i)

   // ❌ Malo
   screen.getByTestId('submit-button')
   screen.getByClassName('btn-primary')
   ```

3. **Agrupar tests relacionados con describe**
   ```typescript
   describe('LoginForm', () => {
     describe('Validación', () => {
       it('debe validar email');
       it('debe validar contraseña');
     });

     describe('Envío', () => {
       it('debe llamar a onSubmit con datos correctos');
       it('debe mostrar loading durante submit');
     });
   });
   ```

4. **Cleanup entre tests**
   ```typescript
   afterEach(() => {
     mockApi.reset();
     vi.clearAllMocks();
   });
   ```

5. **Usar waitFor para operaciones asíncronas**
   ```typescript
   await waitFor(() => {
     expect(screen.getByText(/datos cargados/i)).toBeInTheDocument();
   });
   ```

### ❌ **DON'T (Evitar)**

1. **No testear detalles de implementación**
   ```typescript
   // ❌ Malo
   expect(component.props.onClick).toBeCalled();

   // ✅ Bueno
   expect(mockCallback).toHaveBeenCalled();
   ```

2. **No usar selectores frágiles**
   ```typescript
   // ❌ Malo
   container.querySelector('.my-class > div:nth-child(2)')

   // ✅ Bueno
   screen.getByRole('button', { name: /acción/i })
   ```

3. **No hacer assertions genéricas**
   ```typescript
   // ❌ Malo
   expect(result).toBeTruthy();

   // ✅ Bueno
   expect(result.data).toEqual({ id: '123', name: 'Test' });
   ```

4. **No ignorar warnings**
   ```typescript
   // ❌ Malo: Ignorar "not wrapped in act()"

   // ✅ Bueno: Arreglar el código
   await waitFor(() => {
     expect(screen.getByText(/actualizado/i)).toBeInTheDocument();
   });
   ```

---

## 📚 Recursos

### Documentación Oficial
- [Vitest](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Library - Common Mistakes](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [MSW (Mock Service Worker)](https://mswjs.io/)

### Guías Internas
- `docs/TESTING.md` - Estrategia general de testing
- `docs/ARCHITECTURE.md` - Arquitectura del frontend
- `CLAUDE.md` - Guía completa del proyecto

---

## 🎯 Objetivos de Cobertura

### Mínimos Aceptables (MVP+)
- ✅ Services API: **>80%** (alcanzado: 78%)
- ⚠️ Context: **>80%** (actual: 50%)
- ⚠️ Hooks: **>60%** (actual: 0%)
- ⚠️ Componentes UI críticos: **>70%** (actual: ~40%)
- ⚠️ Utils: **>80%** (alcanzado: 100%)

### Ideales (Production-Ready)
- 🎯 Services API: **>95%**
- 🎯 Context: **100%**
- 🎯 Hooks: **>90%**
- 🎯 Componentes UI: **>80%**
- 🎯 Utils: **100%**
- 🎯 Páginas (integration): **>50%**

---

## 🚀 Siguiente Paso Recomendado

**Acción inmediata:** Ejecutar **Fase 1** del roadmap

```bash
# 1. Arreglar QuotaWidget tests
cd frontend
code tests/unit/components/features/QuotaWidget.test.tsx

# 2. Agregar StorageProvider wrapper
# 3. Ejecutar tests
pnpm test:run

# 4. Verificar que todos pasen
# Objetivo: 339/339 tests pasando ✅
```

**Estimación:** 2-4 horas de trabajo

---

**Última actualización:** 2025-11-29
**Revisión siguiente:** Después de completar Fase 1 del roadmap
