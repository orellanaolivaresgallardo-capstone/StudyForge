// frontend/src/pages/profile/ProfilePage.tsx
/**
 * Página de perfil de usuario
 * Muestra información del usuario y permite editar datos básicos
 */
import { useState, useEffect } from "react";
import { Toast, LoadingSpinner } from "@/components";
import type { ToastType } from "@/components";
import { useAuth } from "@/context/AuthContext";

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  // Format storage values
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const storagePercentage = user?.storage_quota_bytes
    ? Math.round((user.storage_used_bytes / user.storage_quota_bytes) * 100)
    : 0;

  return (
    <>
      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Mi Perfil
          </h1>
          <p className="text-slate-300">
            Administra tu información personal y configuración de cuenta
          </p>
        </div>

        {loading ? (
          <LoadingSpinner message="Cargando perfil..." />
        ) : (
          <div className="space-y-6">
            {/* User Info Card */}
            <div className="card">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-fuchsia-500 to-violet-600 flex items-center justify-center">
                  <span className="text-white font-bold text-2xl">
                    {user?.username?.charAt(0).toUpperCase() || "U"}
                  </span>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">
                    {user?.username || "Usuario"}
                  </h2>
                  <p className="text-sm text-slate-300">{user?.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <p className="text-sm text-slate-400 mb-1">Nombre de usuario</p>
                  <p className="text-base font-medium text-white">
                    {user?.username || "N/A"}
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <p className="text-sm text-slate-400 mb-1">Correo electrónico</p>
                  <p className="text-base font-medium text-white">
                    {user?.email || "N/A"}
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <p className="text-sm text-slate-400 mb-1">Cuenta creada</p>
                  <p className="text-base font-medium text-white">
                    {user?.created_at ? formatDate(user.created_at) : "N/A"}
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <p className="text-sm text-slate-400 mb-1">Estado</p>
                  <p className="text-base font-medium text-emerald-400">
                    {user?.is_active ? "Activo" : "Inactivo"}
                  </p>
                </div>
              </div>
            </div>

            {/* Storage Info Card */}
            <div className="card">
              <h3 className="text-lg font-semibold text-white mb-4">
                Almacenamiento
              </h3>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-300">
                      Usado: {formatBytes(user?.storage_used_bytes || 0)}
                    </span>
                    <span className="text-slate-300">
                      Total: {formatBytes(user?.storage_quota_bytes || 0)}
                    </span>
                  </div>
                  <div className="h-3 bg-slate-700/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-fuchsia-500 to-violet-600 transition-all duration-300"
                      style={{ width: `${Math.min(storagePercentage, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {storagePercentage}% utilizado
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-xs text-slate-400 mb-1">
                      Tamaño máximo por archivo
                    </p>
                    <p className="text-sm font-medium text-white">
                      {formatBytes(user?.max_file_size_bytes || 0)}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-xs text-slate-400 mb-1">
                      Documentos por resumen
                    </p>
                    <p className="text-sm font-medium text-white">
                      Máximo {user?.max_documents_per_summary || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Placeholder for future features */}
            <div className="card border-dashed border-2 border-white/20">
              <div className="text-center py-8">
                <svg
                  className="w-12 h-12 text-slate-500 mx-auto mb-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <h4 className="text-lg font-semibold text-white mb-2">
                  Más funciones próximamente
                </h4>
                <p className="text-sm text-slate-400 max-w-md mx-auto">
                  Pronto podrás editar tu perfil, cambiar tu contraseña y personalizar tu experiencia
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
