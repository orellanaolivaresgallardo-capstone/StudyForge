// frontend/src/components/EmptyState.tsx
/**
 * Componente de estado vacío reutilizable.
 * Muestra un mensaje con icono cuando no hay contenido disponible.
 */
interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <div className="inline-flex h-16 w-16 rounded-full bg-white/10 items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-slate-100 mb-6 max-w-md mx-auto">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 font-semibold transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
