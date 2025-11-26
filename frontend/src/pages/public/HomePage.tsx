// frontend/src/pages/public/HomePage.tsx
/**
 * Home page - Página de inicio.
 * Muestra la landing page para usuarios no autenticados.
 * Redirige a /documents para usuarios autenticados.
 */
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { LoadingSpinner } from "@/components";
import LandingPage from "@/components/LandingPage";

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <LoadingSpinner />
      </div>
    );
  }

  // Redirect authenticated users to documents page
  if (isAuthenticated) {
    return <Navigate to="/documents" replace />;
  }

  // Show landing page for non-authenticated users
  return <LandingPage />;
}
