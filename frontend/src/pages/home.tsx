// frontend/src/pages/Home.tsx
/**
 * Home page - Página de inicio.
 * Muestra la landing page para usuarios no autenticados.
 * Redirige a /documents para usuarios autenticados.
 */
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LandingPage from "../components/LandingPage";

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
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
