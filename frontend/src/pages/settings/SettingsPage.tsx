// frontend/src/pages/settings/SettingsPage.tsx
/**
 * Página de configuración de la aplicación
 * Permite al usuario personalizar preferencias y configuraciones
 */
import { useState } from "react";
import { Navbar, Toast } from "@/components";
import type { ToastType } from "@/components";
import { useAuth } from "@/context/AuthContext";

export default function SettingsPage() {
  const { user } = useAuth();
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  // Placeholder settings (these would be stored in backend in future)
  const [settings, setSettings] = useState({
    emailNotifications: true,
    quizReminders: false,
    darkMode: true,
    language: "es",
  });

  const handleToggleSetting = (key: keyof typeof settings) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
    setToast({ message: "Configuración guardada", type: "success" });
  };

  return (
    <div className="min-h-screen">
      <Navbar />

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
            Configuración
          </h1>
          <p className="text-slate-300">
            Personaliza tu experiencia en StudyForge
          </p>
        </div>

        <div className="space-y-6">
          {/* Account Settings */}
          <div className="card">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              Cuenta
            </h2>

            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-medium text-white mb-1">
                      Correo electrónico
                    </h3>
                    <p className="text-xs text-slate-400">
                      {user?.email || "No disponible"}
                    </p>
                  </div>
                  <button
                    className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 border border-white/10 transition-colors"
                    onClick={() =>
                      setToast({
                        message: "Función próximamente disponible",
                        type: "info",
                      })
                    }
                  >
                    Cambiar
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-medium text-white mb-1">
                      Contraseña
                    </h3>
                    <p className="text-xs text-slate-400">
                      Última actualización: Hace 30 días
                    </p>
                  </div>
                  <button
                    className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 border border-white/10 transition-colors"
                    onClick={() =>
                      setToast({
                        message: "Función próximamente disponible",
                        type: "info",
                      })
                    }
                  >
                    Cambiar
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="card">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              Notificaciones
            </h2>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
                <div>
                  <h3 className="text-sm font-medium text-white mb-1">
                    Notificaciones por email
                  </h3>
                  <p className="text-xs text-slate-400">
                    Recibe actualizaciones sobre tus cuestionarios y resúmenes
                  </p>
                </div>
                <button
                  onClick={() => handleToggleSetting("emailNotifications")}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.emailNotifications ? "bg-fuchsia-500" : "bg-slate-600"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.emailNotifications ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
                <div>
                  <h3 className="text-sm font-medium text-white mb-1">
                    Recordatorios de cuestionarios
                  </h3>
                  <p className="text-xs text-slate-400">
                    Te recordaremos practicar con tus cuestionarios
                  </p>
                </div>
                <button
                  onClick={() => handleToggleSetting("quizReminders")}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.quizReminders ? "bg-fuchsia-500" : "bg-slate-600"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.quizReminders ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Appearance Settings */}
          <div className="card">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                />
              </svg>
              Apariencia
            </h2>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
                <div>
                  <h3 className="text-sm font-medium text-white mb-1">
                    Modo oscuro
                  </h3>
                  <p className="text-xs text-slate-400">
                    Actualmente solo está disponible el modo oscuro
                  </p>
                </div>
                <button
                  className="relative inline-flex h-6 w-11 items-center rounded-full bg-fuchsia-500 cursor-not-allowed opacity-50"
                  disabled
                >
                  <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
                </button>
              </div>

              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <h3 className="text-sm font-medium text-white mb-1">Idioma</h3>
                <p className="text-xs text-slate-400 mb-3">
                  Selecciona tu idioma preferido
                </p>
                <select
                  value={settings.language}
                  onChange={(e) =>
                    setSettings({ ...settings, language: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                >
                  <option value="es">Español</option>
                  <option value="en">English (Próximamente)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="card border-red-500/30">
            <h2 className="text-xl font-semibold text-red-400 mb-4 flex items-center gap-2">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              Zona de peligro
            </h2>

            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="text-sm font-medium text-red-400 mb-1">
                    Eliminar cuenta
                  </h3>
                  <p className="text-xs text-slate-400">
                    Esta acción eliminará permanentemente tu cuenta y todos tus datos
                  </p>
                </div>
                <button
                  className="px-4 py-2 rounded-lg text-sm font-medium text-red-400 hover:text-white hover:bg-red-500/20 border border-red-500/30 transition-colors whitespace-nowrap"
                  onClick={() =>
                    setToast({
                      message: "Función próximamente disponible",
                      type: "info",
                    })
                  }
                >
                  Eliminar cuenta
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
