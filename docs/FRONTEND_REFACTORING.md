# Recomendaciones de Refactorización del Frontend

**Fecha**: 2025-11-29
**Propósito**: Mejorar la mantenibilidad de páginas grandes para facilitar el trabajo de agentes de IA

---

## 📊 Análisis de Archivos Problemáticos

### Archivos que Requieren Refactorización Urgente

| Archivo | Líneas | Hooks | Funciones Async | Modales | Prioridad |
|---------|--------|-------|-----------------|---------|-----------|
| `StudySpaceDetailPage.tsx` | 910 | 22 | 10 | 60 refs | 🔴 ALTA |
| `SummariesPage.tsx` | 531 | ~15 | 8 | ~30 refs | 🟡 MEDIA |
| `SummaryDetailPage.tsx` | 484 | ~12 | 6 | ~25 refs | 🟡 MEDIA |
| `StudySpacesPage.tsx` | 418 | ~10 | 5 | ~20 refs | 🟡 MEDIA |
| `StatsPage.tsx` | 411 | ~8 | 4 | ~15 refs | 🟢 BAJA |

**Objetivo**: Reducir archivos a **< 300 líneas** cada uno.

---

## 🎯 Principios de Refactorización

### 1. **Regla del Single Responsibility Principle (SRP)**
- Cada componente debe tener **una sola responsabilidad**
- Separar lógica de negocio de presentación
- Extraer modales a componentes independientes

### 2. **Regla de los 300**
- Ningún archivo `.tsx` debe superar **300 líneas**
- Si un archivo tiene > 5 hooks `useState`, considerar custom hooks
- Si un componente tiene > 3 modales, extraer a componentes

### 3. **Composición sobre Monolitos**
- Preferir múltiples componentes pequeños sobre uno grande
- Usar custom hooks para lógica reutilizable
- Crear componentes de presentación puros

---

## 🔧 Estrategias de Refactorización

### A. Extraer Custom Hooks

**Problema**: Muchos hooks `useState` y lógica de estado mezclada.

**Solución**: Crear custom hooks por dominio.

#### Ejemplo: StudySpaceDetailPage.tsx

**ANTES** (910 líneas):
```tsx
export default function StudySpaceDetailPage() {
  const [space, setSpace] = useState<StudySpaceDetailResponse | null>(null);
  const [stats, setStats] = useState<StudySpaceStatsResponse | null>(null);
  const [quizzes, setQuizzes] = useState<QuizResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCreateSummaryModal, setShowCreateSummaryModal] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  // ... 14 más useState

  async function loadSpace(spaceId: string) { /* ... */ }
  async function loadStats(spaceId: string) { /* ... */ }
  async function handleUpdate() { /* ... */ }
  // ... 7 más funciones async

  return (
    <>
      {/* 500+ líneas de JSX */}
      <Modal>{/* Edit modal */}</Modal>
      <Modal>{/* Add modal */}</Modal>
      <Modal>{/* Create summary modal */}</Modal>
      <Modal>{/* Quiz config modal */}</Modal>
    </>
  );
}
```

**DESPUÉS** (refactorizado):

```tsx
// hooks/useStudySpaceData.ts
export function useStudySpaceData(spaceId: string) {
  const [space, setSpace] = useState<StudySpaceDetailResponse | null>(null);
  const [stats, setStats] = useState<StudySpaceStatsResponse | null>(null);
  const [quizzes, setQuizzes] = useState<QuizResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (spaceId) {
      loadData(spaceId);
    }
  }, [spaceId]);

  async function loadData(id: string) {
    setIsLoading(true);
    try {
      const [spaceData, statsData, quizzesData] = await Promise.all([
        getStudySpace(id),
        getStudySpaceStats(id),
        getStudySpaceQuizzes(id),
      ]);
      setSpace(spaceData);
      setStats(statsData);
      setQuizzes(quizzesData);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  return { space, stats, quizzes, isLoading, refreshData: () => loadData(spaceId) };
}

// hooks/useStudySpaceModals.ts
export function useStudySpaceModals() {
  const [editModal, setEditModal] = useState(false);
  const [addModal, setAddModal] = useState(false);
  const [summaryModal, setSummaryModal] = useState(false);
  const [quizModal, setQuizModal] = useState(false);

  return {
    editModal: { isOpen: editModal, open: () => setEditModal(true), close: () => setEditModal(false) },
    addModal: { isOpen: addModal, open: () => setAddModal(true), close: () => setAddModal(false) },
    summaryModal: { isOpen: summaryModal, open: () => setSummaryModal(true), close: () => setSummaryModal(false) },
    quizModal: { isOpen: quizModal, open: () => setQuizModal(true), close: () => setQuizModal(false) },
  };
}

// pages/study-spaces/StudySpaceDetailPage.tsx (reducido a ~150 líneas)
export default function StudySpaceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { space, stats, quizzes, isLoading, refreshData } = useStudySpaceData(id!);
  const modals = useStudySpaceModals();

  if (isLoading) return <LoadingSpinner />;
  if (!space) return <EmptyState message="Espacio no encontrado" />;

  return (
    <>
      <Navbar />
      <SpaceHeader space={space} onEdit={modals.editModal.open} />
      <SpaceContent space={space} stats={stats} quizzes={quizzes} modals={modals} />
      <EditSpaceModal isOpen={modals.editModal.isOpen} onClose={modals.editModal.close} space={space} />
      <AddResourceModal isOpen={modals.addModal.isOpen} onClose={modals.addModal.close} spaceId={space.id} />
      <CreateSummaryModal isOpen={modals.summaryModal.isOpen} onClose={modals.summaryModal.close} spaceId={space.id} />
      <QuizConfigModal isOpen={modals.quizModal.isOpen} onClose={modals.quizModal.close} spaceId={space.id} />
    </>
  );
}
```

**Beneficios**:
- ✅ Archivo principal reducido de 910 → ~150 líneas
- ✅ Lógica de estado encapsulada en hooks
- ✅ Modales extraídos a componentes independientes
- ✅ Más fácil de testear y mantener

---

### B. Extraer Modales a Componentes

**Problema**: Modales definidos inline ocupan 200-400 líneas dentro de la página.

**Solución**: Crear componentes de modal independientes.

#### Estructura Recomendada

```
src/
├── pages/
│   └── study-spaces/
│       ├── StudySpaceDetailPage.tsx       # 150 líneas (antes: 910)
│       ├── StudySpacesPage.tsx            # 200 líneas (antes: 418)
│       └── components/
│           ├── SpaceHeader.tsx            # 74 líneas ✅ (ya existe)
│           ├── SpaceContent.tsx           # 100 líneas (nuevo)
│           ├── SpaceDocumentsTab.tsx      # 80 líneas (nuevo)
│           ├── SpaceSummariesTab.tsx      # 80 líneas (nuevo)
│           ├── SpaceQuizzesTab.tsx        # 80 líneas (nuevo)
│           └── modals/
│               ├── EditSpaceModal.tsx     # 100 líneas (nuevo)
│               ├── AddResourceModal.tsx   # 120 líneas (nuevo)
│               ├── CreateSummaryModal.tsx # 150 líneas (nuevo)
│               └── QuizConfigModal.tsx    # Ya existe globalmente ✅
└── hooks/
    ├── useStudySpaceData.ts               # 60 líneas (nuevo)
    ├── useStudySpaceModals.ts             # 40 líneas (nuevo)
    └── useToast.ts                        # 30 líneas (nuevo - reutilizable)
```

---

### C. Crear Componentes de Presentación

**Problema**: JSX mezclado con lógica de negocio.

**Solución**: Separar componentes de presentación puros.

#### Ejemplo: Resource Cards

**ANTES** (inline en la página):
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {documents.map((doc) => (
    <div key={doc.id} className="bg-gradient-to-br from-violet-500/20 to-purple-600/20 backdrop-blur-sm rounded-lg p-4 border border-white/10 hover:border-violet-500/50 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">📄</span>
          <h3 className="font-semibold text-white">{doc.title}</h3>
        </div>
        <button onClick={() => handleRemove(doc.id)} className="text-red-400 hover:text-red-300">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
      <p className="text-sm text-white/60">{doc.file_name}</p>
      {/* ... más JSX */}
    </div>
  ))}
</div>
```

**DESPUÉS** (componente reutilizable):
```tsx
// components/cards/DocumentCard.tsx (50 líneas)
interface DocumentCardProps {
  document: DocumentResponse;
  onRemove?: (id: string) => void;
  onCreateSummary?: (doc: DocumentResponse) => void;
  onCreateQuiz?: (doc: DocumentResponse) => void;
}

export function DocumentCard({ document, onRemove, onCreateSummary, onCreateQuiz }: DocumentCardProps) {
  return (
    <div className="bg-gradient-to-br from-violet-500/20 to-purple-600/20 backdrop-blur-sm rounded-lg p-4 border border-white/10 hover:border-violet-500/50 transition-all">
      <DocumentCardHeader title={document.title} onRemove={() => onRemove?.(document.id)} />
      <DocumentCardBody fileName={document.file_name} fileType={document.file_type} />
      <DocumentCardActions
        onCreateSummary={() => onCreateSummary?.(document)}
        onCreateQuiz={() => onCreateQuiz?.(document)}
      />
    </div>
  );
}

// En la página (reducido a 3 líneas):
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {documents.map((doc) => (
    <DocumentCard
      key={doc.id}
      document={doc}
      onRemove={handleRemoveDocument}
      onCreateSummary={handleCreateSummary}
      onCreateQuiz={handleCreateQuiz}
    />
  ))}
</div>
```

**Beneficios**:
- ✅ Reducción de 30+ líneas a 3 líneas por uso
- ✅ Componente reutilizable en otras páginas
- ✅ Más fácil de testear aisladamente
- ✅ Props tipados con TypeScript

---

### D. Centralizar Lógica de Toast

**Problema**: Cada página duplica lógica de toast.

**Solución**: Custom hook `useToast`.

```tsx
// hooks/useToast.ts
import { useState } from "react";
import type { ToastType } from "@/components";

export function useToast() {
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const showToast = (message: string, type: ToastType = "info") => {
    setToast({ message, type });
  };

  const hideToast = () => setToast(null);

  return { toast, showToast, hideToast };
}

// Uso en páginas (reduce 5-10 líneas):
const { toast, showToast, hideToast } = useToast();

// Antes:
// const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
// function showToast(msg: string, type: ToastType = "info") {
//   setToast({ message: msg, type });
// }
```

---

## 📋 Plan de Refactorización por Prioridad

### Fase 1: Alta Prioridad (StudySpaceDetailPage.tsx - 910 líneas)

**Objetivo**: Reducir a < 300 líneas

**Tareas**:
1. ✅ Crear `hooks/useStudySpaceData.ts` (60 líneas)
2. ✅ Crear `hooks/useStudySpaceModals.ts` (40 líneas)
3. ✅ Extraer `EditSpaceModal.tsx` (100 líneas)
4. ✅ Extraer `AddResourceModal.tsx` (120 líneas)
5. ✅ Extraer `CreateSummaryModal.tsx` (150 líneas)
6. ✅ Crear `SpaceContent.tsx` (100 líneas)
7. ✅ Crear tabs: `SpaceDocumentsTab.tsx`, `SpaceSummariesTab.tsx`, `SpaceQuizzesTab.tsx` (80 líneas c/u)

**Resultado esperado**:
```
StudySpaceDetailPage.tsx: 910 → 150 líneas (-84%)
+ 7 archivos nuevos (650 líneas total)
= Mejor mantenibilidad y testabilidad
```

---

### Fase 2: Media Prioridad

#### SummariesPage.tsx (531 líneas)

**Tareas**:
1. Crear `hooks/useSummaries.ts`
2. Extraer `CreateSummaryModal.tsx` (si no existe aún)
3. Crear `SummaryCard.tsx`
4. Crear `SummaryFilters.tsx`

**Resultado esperado**: 531 → 200 líneas

#### SummaryDetailPage.tsx (484 líneas)

**Tareas**:
1. Crear `hooks/useSummaryDetail.ts`
2. Crear `SummaryContent.tsx`
3. Crear `SummaryKeyPoints.tsx`
4. Crear `SummaryTopics.tsx`

**Resultado esperado**: 484 → 180 líneas

#### StudySpacesPage.tsx (418 líneas)

**Tareas**:
1. Crear `hooks/useStudySpaces.ts`
2. Extraer `CreateSpaceModal.tsx`
3. Crear `SpaceCard.tsx` (componente reutilizable)

**Resultado esperado**: 418 → 200 líneas

---

### Fase 3: Baja Prioridad

#### StatsPage.tsx (411 líneas)

**Tareas**:
1. Crear `hooks/useUserStats.ts`
2. Separar charts en componentes individuales
3. Crear `StatsOverview.tsx`
4. Crear `RecentActivityList.tsx`

**Resultado esperado**: 411 → 250 líneas

---

## 🔍 Patrones Específicos para Agentes de IA

### 1. **Estructura de Archivos Consistente**

Todos los archivos de página deben seguir esta estructura:

```tsx
// 1. Imports (agrupados por categoría)
import { useState, useEffect } from "react";           // React
import { useParams } from "react-router-dom";          // Router
import { Navbar, Toast } from "@/components";          // Componentes
import { getResource } from "@/services/api";          // API
import type { ResourceType } from "@/types";           // Types

// 2. Component Definition (máx 150 líneas)
export default function PageName() {
  // 2a. Hooks (máx 5 useState)
  const customHook = useCustomHook();

  // 2b. Event Handlers (máx 5 funciones)
  function handleAction() { /* ... */ }

  // 2c. JSX Return (máx 100 líneas)
  return (
    <>
      <Navbar />
      <MainContent />
      <Modals />
    </>
  );
}
```

### 2. **Nomenclatura Clara para IA**

- **Hooks**: `use[Domain][Action]` → `useStudySpaceData`, `useQuizCreation`
- **Modales**: `[Action][Resource]Modal` → `CreateSummaryModal`, `EditSpaceModal`
- **Componentes**: `[Resource][Type]` → `DocumentCard`, `QuizCard`
- **Handlers**: `handle[Action]` → `handleDelete`, `handleCreate`

### 3. **Comentarios Descriptivos**

```tsx
/**
 * Hook personalizado para gestionar datos de espacio de estudio.
 *
 * @param spaceId - ID del espacio
 * @returns {object} - space, stats, quizzes, isLoading, refreshData
 *
 * @example
 * const { space, stats, refreshData } = useStudySpaceData(id);
 */
export function useStudySpaceData(spaceId: string) {
  // ...
}
```

### 4. **Separación de Concerns**

```
✅ CORRECTO:
pages/         → Orquestación y routing
hooks/         → Lógica de estado y efectos
components/    → Presentación pura (reciben props, renderizan JSX)
services/      → Llamadas API
utils/         → Utilidades puras (sin side effects)

❌ INCORRECTO:
pages/ con todo mezclado (lógica + JSX + API + utils)
```

---

## 🎯 Métricas de Éxito

### Antes de Refactorización
- 📈 Promedio de líneas por página: **450 líneas**
- 📊 Archivos > 400 líneas: **5 archivos**
- 🔧 Hooks por página: **10-22 hooks**
- 🧪 Testabilidad: **Baja** (componentes muy acoplados)

### Después de Refactorización (Objetivo)
- 📉 Promedio de líneas por página: **< 200 líneas**
- 📊 Archivos > 300 líneas: **0 archivos**
- 🔧 Hooks por página: **< 5 hooks** (resto en custom hooks)
- 🧪 Testabilidad: **Alta** (componentes aislados)

---

## 🚀 Quick Wins (Implementación Inmediata)

### 1. Extraer `useToast` Hook (30 min)
Elimina 5-10 líneas de código duplicado en **todas** las páginas.

### 2. Crear `DocumentCard`, `SummaryCard`, `QuizCard` (2 horas)
Componentes reutilizables que reducen código en 4-5 páginas.

### 3. Extraer Modales de StudySpaceDetailPage (4 horas)
Impacto inmediato: 910 → 300 líneas (-67%)

---

## 📚 Referencias

- [React Hooks Best Practices](https://react.dev/learn/reusing-logic-with-custom-hooks)
- [Component Composition](https://react.dev/learn/passing-props-to-a-component)
- [Single Responsibility Principle](https://en.wikipedia.org/wiki/Single-responsibility_principle)
- [Atomic Design](https://bradfrost.com/blog/post/atomic-web-design/)

---

**Última actualización**: 2025-11-29
**Mantenido por**: Claude Agent
**Estado**: 🟡 Pendiente de implementación
