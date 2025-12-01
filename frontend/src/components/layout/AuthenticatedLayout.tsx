// frontend/src/components/layout/AuthenticatedLayout.tsx
/**
 * Layout para páginas autenticadas.
 * Renderiza el Navbar y estructura común una sola vez y persiste entre navegaciones.
 *
 * IMPORTANTE: Evita re-renders innecesarios del Navbar y QuotaWidget al cambiar de página.
 */
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

export default function AuthenticatedLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Background gradient effect */}
      <div
        className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-violet-600/10 via-transparent to-cyan-600/10"
        aria-hidden="true"
      />

      {/* Navbar - persiste entre navegaciones (NO se re-renderiza) */}
      <Navbar />

      {/* Main content area - solo el contenido cambia según la ruta */}
      <main className="relative z-10 mx-auto max-w-5xl px-4 py-10 space-y-10">
        <Outlet />
      </main>
    </div>
  );
}
