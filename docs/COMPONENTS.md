# Componentes UI de StudyForge

**Última actualización**: 2025-11-29
**Versión**: 1.0.0

Este documento detalla los componentes UI reutilizables del frontend de StudyForge, incluyendo sus props, casos de uso y patrones de implementación.

---

## 📋 Tabla de Contenidos

- [Componentes Base](#componentes-base)
  - [Modal](#modal)
  - [Toast](#toast)
  - [LoadingSpinner](#loadingspinner)
  - [EmptyState](#emptystate)
- [Componentes de Confirmación](#componentes-de-confirmación)
  - [ConfirmModal](#confirmmodal)
  - [DeleteSpaceModal](#deletespacemodal)
- [Componentes de Configuración](#componentes-de-configuración)
  - [QuizConfigModal](#quizconfigmodal)
  - [CreateSummaryModal](#createsummarymodal)
- [Patrones de Uso](#patrones-de-uso)
- [Mejores Prácticas](#mejores-prácticas)

---

## Componentes Base

### Modal

**Ubicación**: `frontend/src/components/ui/Modal.tsx`

Modal base reutilizable con soporte para prevenir cierre durante operaciones asíncronas.

#### Props

```typescript
interface ModalProps {
  isOpen: boolean;              // Controla visibilidad del modal
  onClose: () => void;          // Callback al cerrar
  title?: string;               // Título opcional del modal
  children: React.ReactNode;    // Contenido del modal
  size?: 'sm' | 'md' | 'lg' | 'xl'; // Tamaño del modal (default: 'md')
  showCloseButton?: boolean;    // Mostrar botón X para cerrar (default: true)
  allowClose?: boolean;         // Permitir cerrar con ESC o click fuera (default: true)
}
```

#### Características

- **Animaciones suaves**: Transiciones de entrada/salida con fade y scale
- **Bloqueo de scroll**: Previene scroll del body cuando está abierto
- **Cierre múltiple**:
  - Click en botón X (si `showCloseButton={true}`)
  - Presionar tecla ESC (si `allowClose={true}`)
  - Click fuera del modal (si `allowClose={true}`)
- **Responsive**: Tamaños adaptativos según viewport

#### Tamaños Disponibles

| Size | Max Width | Uso Recomendado |
|------|-----------|-----------------|
| `sm` | 28rem (448px) | Confirmaciones, alertas |
| `md` | 32rem (512px) | Formularios simples |
| `lg` | 42rem (672px) | Formularios complejos |
| `xl` | 48rem (768px) | Contenido extenso |

#### Ejemplo de Uso

```typescript
import { Modal } from '@/components';

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      title="Mi Modal"
      size="md"
      showCloseButton={!isLoading}  // Ocultar botón X durante carga
      allowClose={!isLoading}        // Prevenir cerrar con ESC/click durante carga
    >
      <p>Contenido del modal</p>
    </Modal>
  );
}
```

#### Caso de Uso: Prevenir Cierre Durante Operaciones Asíncronas

```typescript
const [isProcessing, setIsProcessing] = useState(false);

const handleSubmit = async () => {
  setIsProcessing(true);
  try {
    await api.expensiveOperation();
  } finally {
    setIsProcessing(false);
  }
};

return (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title="Procesando..."
    showCloseButton={!isProcessing}  // ✓ Oculta X
    allowClose={!isProcessing}        // ✓ Bloquea ESC y click-outside
  >
    <button onClick={handleSubmit} disabled={isProcessing}>
      {isProcessing ? 'Procesando...' : 'Enviar'}
    </button>
  </Modal>
);
```

---

### Toast

**Ubicación**: `frontend/src/components/ui/Toast.tsx`

Sistema de notificaciones temporales para feedback al usuario.

#### Tipos

```typescript
type ToastType = 'success' | 'error' | 'warning' | 'info';
```

#### Características

- Auto-cierre después de 3 segundos
- Animaciones suaves de entrada/salida
- Colores semánticos según tipo
- Cierre manual con botón X

---

### LoadingSpinner

**Ubicación**: `frontend/src/components/ui/LoadingSpinner.tsx`

Spinner animado para estados de carga.

#### Uso

```typescript
import { LoadingSpinner } from '@/components';

<LoadingSpinner />
```

---

### EmptyState

**Ubicación**: `frontend/src/components/ui/EmptyState.tsx`

Componente para mostrar estados vacíos con icono y mensaje.

#### Props

```typescript
interface EmptyStateProps {
  icon: React.ReactNode;    // Ícono SVG
  title: string;             // Título principal
  description: string;       // Descripción/ayuda
}
```

#### Ejemplo

```typescript
<EmptyState
  icon={<DocumentIcon />}
  title="No hay documentos"
  description="Sube tu primer documento para comenzar"
/>
```

---

## Componentes de Confirmación

### ConfirmModal

**Ubicación**: `frontend/src/components/ui/ConfirmModal.tsx`

Modal de confirmación reutilizable que reemplaza `window.confirm()` con un modal profesional.

#### Props

```typescript
interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmText?: string;      // Default: 'Confirmar'
  cancelText?: string;       // Default: 'Cancelar'
  variant?: 'danger' | 'warning' | 'info';  // Default: 'danger'
  isLoading?: boolean;       // Default: false
}
```

#### Variantes

| Variante | Color | Ícono | Uso |
|----------|-------|-------|-----|
| `danger` | Rojo | ⚠️ Triángulo | Eliminaciones permanentes |
| `warning` | Amarillo | ⚠️ Triángulo | Acciones con consecuencias |
| `info` | Azul | ℹ️ Círculo | Confirmaciones informativas |

#### Ejemplo de Uso

```typescript
import { ConfirmModal } from '@/components';

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await api.deleteResource(resourceId);
      setIsOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)}>
        Eliminar
      </button>

      <ConfirmModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onConfirm={handleDelete}
        title="Eliminar Recurso"
        message="¿Estás seguro de que deseas eliminar este recurso? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        isLoading={isDeleting}
      />
    </>
  );
}
```

#### Características

- **Loading state**: Muestra spinner y deshabilita botones durante async operations
- **Colores semánticos**: Variantes visuales según gravedad de la acción
- **Íconos contextuales**: SVG integrados por variante
- **Accesibilidad**: Previene cierre accidental durante operaciones

#### Reemplazo de window.confirm()

❌ **Antes (nativo)**:
```typescript
const confirmed = window.confirm('¿Eliminar este elemento?');
if (confirmed) {
  await deleteItem();
}
```

✅ **Después (ConfirmModal)**:
```typescript
const [showConfirm, setShowConfirm] = useState(false);

// En el render:
<ConfirmModal
  isOpen={showConfirm}
  onClose={() => setShowConfirm(false)}
  onConfirm={deleteItem}
  title="Eliminar Elemento"
  message="¿Estás seguro de que deseas eliminar este elemento?"
  variant="danger"
/>
```

**Beneficios**:
- ✅ Diseño consistente con la aplicación
- ✅ Soporte para operaciones asíncronas
- ✅ Mejor UX con loading states
- ✅ No bloquea el hilo principal

---

### DeleteSpaceModal

**Ubicación**: `frontend/src/pages/study-spaces/components/DeleteSpaceModal.tsx`

Modal especializado para eliminación segura de espacios de estudio con validación de contraseña.

#### Props

```typescript
interface DeleteSpaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (password: string) => Promise<void>;
  spaceName: string;
  summaryCount: number;
  quizCount: number;
  isDeleting?: boolean;
}
```

#### Características

- **Validación de contraseña**: Campo seguro con type="password"
- **Toggle show/hide password**: Botón de ojo para visualizar contraseña
- **Advertencia de cascada**: Lista clara de todas las consecuencias
  - Número de resúmenes que se eliminarán
  - Número de quizzes que se eliminarán
  - Progreso de quizzes que se perderá
- **Seguridad**: Requiere contraseña para confirmación
- **Loading state**: Bloquea UI durante eliminación

#### Ejemplo de Uso

```typescript
import { DeleteSpaceModal } from './components/DeleteSpaceModal';

function StudySpacesPage() {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [spaceToDelete, setSpaceToDelete] = useState<StudySpace | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteSpace = async (password: string) => {
    if (!spaceToDelete) return;

    setIsDeleting(true);
    try {
      await api.deleteSpace(spaceToDelete.id, password);
      setShowDeleteModal(false);
      // Actualizar lista
    } catch (err) {
      console.error('Error al eliminar espacio:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      {/* Botón de eliminar */}
      <button onClick={() => {
        setSpaceToDelete(space);
        setShowDeleteModal(true);
      }}>
        Eliminar Espacio
      </button>

      {/* Modal */}
      {spaceToDelete && (
        <DeleteSpaceModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteSpace}
          spaceName={spaceToDelete.name}
          summaryCount={spaceToDelete.summary_count}
          quizCount={spaceToDelete.quiz_count}
          isDeleting={isDeleting}
        />
      )}
    </>
  );
}
```

#### Estructura Visual

```
┌─────────────────────────────────────────┐
│  Eliminar Espacio de Estudio      [X]   │
├─────────────────────────────────────────┤
│                                         │
│  ⚠️ ADVERTENCIA                         │
│  Al eliminar "Matemáticas" también se  │
│  eliminarán:                            │
│  • 5 resúmenes                          │
│  • 3 cuestionarios                      │
│  • Progreso de cuestionarios           │
│                                         │
│  Esta acción no se puede deshacer.     │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Contraseña                      │   │
│  │ ••••••••                    👁  │   │
│  └─────────────────────────────────┘   │
│                                         │
│  [Cancelar]      [Eliminar Espacio]    │
└─────────────────────────────────────────┘
```

#### Seguridad

- Campo de contraseña usa `type="password"` por defecto
- Atributo `autoComplete="current-password"` para gestores de contraseñas
- Validación de contraseña vacía antes de enviar
- Modal no se puede cerrar durante eliminación (`allowClose={!isDeleting}`)

---

## Componentes de Configuración

### QuizConfigModal

**Ubicación**: `frontend/src/components/features/QuizConfigModal.tsx`

Modal reutilizable para configurar la generación de quizzes con validación de número de preguntas.

#### Props

```typescript
interface QuizConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (numQuestions: number) => Promise<void>;
  isGenerating: boolean;
  title?: string;                    // Default: "Generar cuestionario"
  description: string | React.ReactNode;
}
```

#### Características

- **Validación client-side**: Rango 5-30 preguntas
- **Auto-ajuste**: Clamp automático en blur (min 5, max 30)
- **Reset automático**: Vuelve a 10 preguntas al abrir
- **Protección OpenAI**:
  - Bloquea cierre del modal durante generación
  - Oculta botón X durante generación
  - Deshabilita inputs durante generación
  - Previene múltiples requests simultáneos

#### Ejemplo de Uso

```typescript
import { QuizConfigModal } from '@/components';

function SummaryDetailPage() {
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateQuiz = async (numQuestions: number) => {
    setIsGenerating(true);
    try {
      const quiz = await api.generateQuiz({
        summary_id: summaryId,
        num_questions: numQuestions,
      });
      navigate(`/quizzes/${quiz.id}/attempt`);
    } catch (err) {
      console.error('Error al generar quiz:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <button onClick={() => setShowQuizModal(true)}>
        Generar Quiz
      </button>

      <QuizConfigModal
        isOpen={showQuizModal}
        onClose={() => setShowQuizModal(false)}
        onGenerate={handleGenerateQuiz}
        isGenerating={isGenerating}
        description={
          <>
            Generando quiz para: <strong>{summary.title}</strong>
          </>
        }
      />
    </>
  );
}
```

#### Validación

```typescript
// Validación en onChange
if (!isNaN(num)) {
  setQuizQuestions(Math.min(30, Math.max(5, num))); // Clamp 5-30
}

// Validación en onBlur
if (value < 5) setQuizQuestions(5);
if (value > 30) setQuizQuestions(30);

// Validación en submit
if (quizQuestions < 5 || quizQuestions > 30) {
  setValidationError("El número de preguntas debe estar entre 5 y 30");
  return;
}
```

---

### CreateSummaryModal

**Ubicación**: `frontend/src/pages/study-spaces/components/modals/CreateSummaryModal.tsx`

Modal para generar resúmenes desde documentos con selección de nivel de expertise.

#### Props

```typescript
interface CreateSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentResponse | null;
  expertiseLevel: ExpertiseLevel;
  onExpertiseLevelChange: (level: ExpertiseLevel) => void;
  onSubmit: () => Promise<void>;
  isCreating: boolean;
}
```

#### Niveles de Expertise

```typescript
type ExpertiseLevel = 'basico' | 'medio' | 'avanzado';

const EXPERTISE_LEVELS = {
  basico: {
    label: 'Básico',
    description: 'Conceptos fundamentales y explicaciones sencillas',
  },
  medio: {
    label: 'Medio',
    description: 'Balance entre teoría y práctica',
  },
  avanzado: {
    label: 'Avanzado',
    description: 'Detalles técnicos y análisis profundo',
  },
};
```

#### Características

- **Selección de nivel**: Radio buttons con descripciones detalladas
- **Visual feedback**: Highlight del nivel seleccionado
- **Protección OpenAI**:
  - Bloquea cierre durante generación
  - Oculta botón X durante generación
  - Deshabilita botones durante generación

#### Ejemplo de Uso

```typescript
import { CreateSummaryModal } from './components/modals/CreateSummaryModal';

function StudySpaceDetailPage() {
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<DocumentResponse | null>(null);
  const [expertiseLevel, setExpertiseLevel] = useState<ExpertiseLevel>('basico');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateSummary = async () => {
    if (!selectedDocument) return;

    setIsCreating(true);
    try {
      await api.createSummary({
        document_id: selectedDocument.id,
        study_space_id: spaceId,
        expertise_level: expertiseLevel,
      });
      setShowSummaryModal(false);
      // Recargar resúmenes
    } catch (err) {
      console.error('Error al crear resumen:', err);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      <button onClick={() => {
        setSelectedDocument(document);
        setShowSummaryModal(true);
      }}>
        Generar Resumen
      </button>

      <CreateSummaryModal
        isOpen={showSummaryModal}
        onClose={() => setShowSummaryModal(false)}
        document={selectedDocument}
        expertiseLevel={expertiseLevel}
        onExpertiseLevelChange={setExpertiseLevel}
        onSubmit={handleCreateSummary}
        isCreating={isCreating}
      />
    </>
  );
}
```

---

## Patrones de Uso

### 1. Patrón: Modal con Operación Asíncrona

```typescript
function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      await api.operation();
      setIsOpen(false); // Cerrar solo si éxito
    } catch (err) {
      // Manejar error, mantener modal abierto
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      showCloseButton={!isLoading}  // ✓ Ocultar durante loading
      allowClose={!isLoading}        // ✓ Prevenir cierre durante loading
    >
      <button onClick={handleSubmit} disabled={isLoading}>
        {isLoading ? 'Procesando...' : 'Enviar'}
      </button>
    </Modal>
  );
}
```

### 2. Patrón: Confirmación de Eliminación

```typescript
function MyComponent() {
  const [showConfirm, setShowConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Item | null>(null);

  const handleDelete = async () => {
    if (!itemToDelete) return;
    await api.delete(itemToDelete.id);
    setShowConfirm(false);
  };

  return (
    <>
      <button onClick={() => {
        setItemToDelete(item);
        setShowConfirm(true);
      }}>
        Eliminar
      </button>

      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleDelete}
        title="Eliminar Elemento"
        message={`¿Eliminar "${itemToDelete?.name}"?`}
        variant="danger"
      />
    </>
  );
}
```

### 3. Patrón: Protección de Llamadas OpenAI

```typescript
function AIModal() {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await openai.generate(); // Operación costosa
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      showCloseButton={!isGenerating}  // ✓ Usuario no puede cerrar
      allowClose={!isGenerating}        // ✓ ESC/click bloqueados
    >
      <button onClick={handleGenerate} disabled={isGenerating}>
        {isGenerating ? 'Generando...' : 'Generar'}
      </button>
    </Modal>
  );
}
```

---

## Mejores Prácticas

### ✅ Hacer

1. **Usar `allowClose={false}` durante operaciones críticas**
   ```typescript
   <Modal allowClose={!isProcessing} />
   ```

2. **Mostrar loading states claros**
   ```typescript
   {isLoading ? 'Procesando...' : 'Enviar'}
   ```

3. **Cerrar modal solo después de operación exitosa**
   ```typescript
   try {
     await api.operation();
     setIsOpen(false); // ✓ Solo si éxito
   } catch (err) {
     // Modal permanece abierto para mostrar error
   }
   ```

4. **Usar variantes semánticas en ConfirmModal**
   ```typescript
   variant="danger"  // Para eliminaciones
   variant="warning" // Para cambios importantes
   variant="info"    // Para confirmaciones simples
   ```

5. **Validar inputs antes de operaciones costosas**
   ```typescript
   if (value < MIN || value > MAX) {
     setError("Valor inválido");
     return; // No llamar a API
   }
   ```

### ❌ Evitar

1. **No usar window.confirm() o window.prompt()**
   ```typescript
   // ❌ NUNCA
   const ok = window.confirm('¿Eliminar?');

   // ✓ USAR ConfirmModal
   <ConfirmModal onConfirm={handleDelete} />
   ```

2. **No permitir cerrar durante operaciones críticas**
   ```typescript
   // ❌ MALO
   <Modal allowClose={true} /> // Usuario puede interrumpir OpenAI

   // ✓ BUENO
   <Modal allowClose={!isGenerating} />
   ```

3. **No hacer múltiples requests simultáneos**
   ```typescript
   // ❌ MALO
   <button onClick={expensiveOperation} />

   // ✓ BUENO
   <button onClick={expensiveOperation} disabled={isLoading} />
   ```

4. **No mostrar contraseñas en texto plano**
   ```typescript
   // ❌ MALO
   <input type="text" /> // Contraseña visible

   // ✓ BUENO
   <input type="password" /> // Enmascarada por defecto
   ```

5. **No cerrar modal antes de completar operación**
   ```typescript
   // ❌ MALO
   setIsOpen(false);
   await api.operation(); // Puede fallar después de cerrar

   // ✓ BUENO
   await api.operation();
   setIsOpen(false); // Cerrar solo si éxito
   ```

---

## Migración desde Diálogos Nativos

### window.confirm() → ConfirmModal

**Antes**:
```typescript
if (window.confirm('¿Continuar?')) {
  doSomething();
}
```

**Después**:
```typescript
const [showConfirm, setShowConfirm] = useState(false);

<ConfirmModal
  isOpen={showConfirm}
  onClose={() => setShowConfirm(false)}
  onConfirm={doSomething}
  title="Confirmar Acción"
  message="¿Deseas continuar?"
/>
```

### window.prompt() → Modal con Input

**Antes**:
```typescript
const password = window.prompt('Ingresa contraseña:');
if (password) {
  deleteSpace(password);
}
```

**Después**:
```typescript
<DeleteSpaceModal
  isOpen={isOpen}
  onConfirm={(password) => deleteSpace(password)}
  // ... props
/>
```

---

## Changelog

### v1.0.0 (2025-11-29)

**Nuevos Componentes**:
- ✨ **ConfirmModal**: Modal de confirmación reutilizable con 3 variantes
- ✨ **DeleteSpaceModal**: Modal especializado para eliminación segura de espacios

**Mejoras a Componentes Existentes**:
- ✨ **Modal**: Agregado prop `allowClose` para bloquear cierre durante async ops
- ✨ **QuizConfigModal**: Soporte para `showCloseButton` y `allowClose`
- ✨ **CreateSummaryModal**: Soporte para `showCloseButton` y `allowClose`

**Eliminaciones**:
- 🗑️ Removidos todos los usos de `window.confirm()`
- 🗑️ Removidos todos los usos de `window.prompt()`

**Mejoras de Seguridad**:
- 🔒 Contraseñas ahora usan `type="password"` en lugar de prompt()
- 🔒 Prevención de múltiples llamadas OpenAI simultáneas
- 🔒 Advertencias claras sobre eliminación en cascada

---

## Referencias

- **Código fuente**: `frontend/src/components/`
- **Tipos**: `frontend/src/types/`
- **Documentación de arquitectura**: `docs/ARCHITECTURE.md`
- **Refactoring log**: `docs/FRONTEND_REFACTORING.md`
