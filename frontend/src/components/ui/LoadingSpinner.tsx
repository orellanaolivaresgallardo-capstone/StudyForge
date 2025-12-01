// frontend/src/components/LoadingSpinner.tsx
/**
 * Componente de spinner de carga reutilizable.
 * Proporciona un spinner animado con diferentes tamaños y mensaje opcional.
 */
export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
}

export default function LoadingSpinner({ size = 'md', message }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  };

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className={`${sizeClasses[size]} animate-spin rounded-full border-4 border-violet-400 border-t-transparent`}></div>
      {message && <p className="text-slate-100 mt-4">{message}</p>}
    </div>
  );
}
