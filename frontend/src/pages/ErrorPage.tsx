import { Link } from "react-router-dom";

export default function ErrorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div
        className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-violet-600/10 via-transparent to-cyan-600/10"
        aria-hidden="true"
      />

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-violet-600 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-white mb-2">Página no encontrada</h2>
          <p className="text-slate-300 mb-6">La ruta que buscas no existe o hubo un error al cargar la página.</p>
          <Link
            to="/"
            className="inline-block px-6 py-3 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors font-medium"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
