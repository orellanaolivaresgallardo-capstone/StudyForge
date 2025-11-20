// frontend/src/components/QuotaWidget.tsx
/**
 * Widget de cuota de almacenamiento con diseño aurora.
 * Muestra el uso de almacenamiento del usuario con una barra de progreso estilizada.
 */
import { useEffect, useState } from "react";
import { getStorageInfo } from "../services/api";
import type { StorageInfo } from "../types/api.types";

interface QuotaWidgetProps {
  className?: string;
  compact?: boolean; // Modo compacto para navbar
}

export default function QuotaWidget({ className = "", compact = false }: QuotaWidgetProps) {
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStorageInfo();
  }, []);

  const loadStorageInfo = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getStorageInfo();
      setStorageInfo(data);
    } catch (err) {
      console.error("Error loading storage info:", err);
      setError("Error al cargar información de almacenamiento");
    } finally {
      setIsLoading(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const getProgressColor = (percentage: number): string => {
    if (percentage >= 90) return "from-red-500 to-pink-500";
    if (percentage >= 75) return "from-orange-500 to-yellow-500";
    if (percentage >= 50) return "from-yellow-500 to-green-500";
    return "from-purple-500 to-pink-500"; // Aurora default
  };

  if (isLoading) {
    return (
      <div className={`${className} ${compact ? "px-3 py-2" : "p-4"} bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50`}>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-violet-500 border-t-transparent"></div>
          <span className="text-sm text-slate-400">Cargando...</span>
        </div>
      </div>
    );
  }

  if (error || !storageInfo) {
    return (
      <div className={`${className} ${compact ? "px-3 py-2" : "p-4"} bg-red-900/20 backdrop-blur-sm rounded-xl border border-red-500/30`}>
        <p className="text-sm text-red-400">{error || "Error desconocido"}</p>
      </div>
    );
  }

  const percentage = Math.min(storageInfo.storage_usage_percentage, 100);
  const progressColor = getProgressColor(percentage);

  if (compact) {
    return (
      <div className={`${className} px-3 py-2 bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50`}>
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-300 font-medium">
                {formatBytes(storageInfo.storage_used_bytes)}
              </span>
              <span className="text-slate-500">
                / {formatBytes(storageInfo.storage_quota_bytes)}
              </span>
            </div>
            <div className="relative h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
              <div
                className={`absolute inset-y-0 left-0 bg-gradient-to-r ${progressColor} rounded-full transition-all duration-500 shadow-lg`}
                style={{ width: `${percentage}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} p-4 bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
          <h3 className="text-sm font-semibold text-white">Almacenamiento</h3>
        </div>
        <button
          onClick={loadStorageInfo}
          className="text-slate-400 hover:text-white transition-colors"
          title="Actualizar"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-bold text-white">
            {formatBytes(storageInfo.storage_used_bytes)}
          </span>
          <span className="text-sm text-slate-400">
            de {formatBytes(storageInfo.storage_quota_bytes)}
          </span>
        </div>

        {/* Barra de progreso con efecto aurora */}
        <div className="relative h-3 bg-slate-700/50 rounded-full overflow-hidden">
          <div
            className={`absolute inset-y-0 left-0 bg-gradient-to-r ${progressColor} rounded-full transition-all duration-500 shadow-lg`}
            style={{ width: `${percentage}%` }}
          >
            {/* Efecto de brillo animado */}
            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
            {/* Efecto de destello */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">
            {percentage.toFixed(1)}% usado
          </span>
          <span className="text-slate-400">
            {storageInfo.total_documents} {storageInfo.total_documents === 1 ? "documento" : "documentos"}
          </span>
        </div>

        {percentage >= 90 && (
          <div className="mt-2 p-2 bg-red-900/20 border border-red-500/30 rounded-lg">
            <p className="text-xs text-red-400">
              ⚠️ Almacenamiento casi lleno. Considera eliminar documentos antiguos.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
