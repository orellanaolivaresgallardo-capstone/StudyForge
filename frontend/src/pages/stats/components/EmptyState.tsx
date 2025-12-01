// frontend/src/pages/stats/components/EmptyState.tsx
import { useNavigate } from "react-router-dom";

export function EmptyState() {
  const navigate = useNavigate();

  return (
    <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-12 text-center">
      <div className="text-6xl mb-4">📈</div>
      <h2 className="text-2xl font-bold text-white mb-3">Aún no hay estadísticas</h2>
      <p className="text-slate-300 mb-6 max-w-md mx-auto">
        Comienza subiendo documentos y generando resúmenes para ver tu progreso aquí.
      </p>
      <button
        onClick={() => navigate("/documents")}
        className="bg-violet-600 hover:bg-violet-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
      >
        Ir a Documentos
      </button>
    </div>
  );
}
