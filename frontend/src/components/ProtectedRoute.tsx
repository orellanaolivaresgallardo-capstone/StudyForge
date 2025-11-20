// frontend/src/components/ProtectedRoute.tsx
/**
 * Componente para proteger rutas que requieren autenticación.
 * Redirige a /login si el usuario no está autenticado.
 */
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    // Mostrar loading mientras se verifica la autenticación
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-violet-500 border-t-transparent"></div>
          <p className="mt-4 text-slate-300">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirigir a login si no está autenticado
    return <Navigate to="/login" replace />;
  }

  // Renderizar children si está autenticado
  return <>{children}</>;
}
