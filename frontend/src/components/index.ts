// frontend/src/components/index.ts
/**
 * Punto de entrada centralizado para todos los componentes reutilizables.
 * Permite importaciones limpias como: import { LoadingSpinner, EmptyState } from '@/components'
 */

// Layout components
export { Navbar, PublicHeader, AuthenticatedLayout } from './layout';

// UI components
export { Modal, Toast, LoadingSpinner, EmptyState, ConfirmModal } from './ui';
export type { ToastType } from './ui';

// Feature components
export { QuizCard, PerformanceChart, QuotaWidget, SpaceBadge, TopicBadge, QuizConfigModal } from './features';

// Auth components
export { ProtectedRoute } from './auth';

// Special components (stay at root level)
export { default as LandingPage } from './LandingPage';
export { UploadDocumentModal } from './UploadDocumentModal';
