import { Link } from "react-router-dom";

export default function ErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-brand-500 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-white mb-2">Página no encontrada</h2>
        <p className="text-slate-400 mb-6">La ruta que buscas no existe o hubo un error al cargar la página.</p>
        <Link
          to="/"
          className="inline-block px-6 py-3 bg-brand-500 text-white rounded-xl hover:bg-brand-600 transition-colors font-medium"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
