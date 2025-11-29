// frontend/src/pages/settings/components/AccountSettings.tsx
/**
 * Account settings section
 */
import { SettingCard } from "./SettingCard";

interface AccountSettingsProps {
  email: string;
  onShowToast: (message: string, type: "info" | "success" | "error") => void;
}

export function AccountSettings({ email, onShowToast }: AccountSettingsProps) {
  return (
    <SettingCard
      title="Cuenta"
      icon={
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      }
    >
      <div className="space-y-4">
        <div className="p-4 rounded-lg bg-white/5 border border-white/10">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-medium text-white mb-1">
                Correo electrónico
              </h3>
              <p className="text-xs text-slate-400">{email || "No disponible"}</p>
            </div>
            <button
              className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 border border-white/10 transition-colors"
              onClick={() =>
                onShowToast("Función próximamente disponible", "info")
              }
            >
              Cambiar
            </button>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-white/5 border border-white/10">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-medium text-white mb-1">Contraseña</h3>
              <p className="text-xs text-slate-400">
                Última actualización: Hace 30 días
              </p>
            </div>
            <button
              className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 border border-white/10 transition-colors"
              onClick={() =>
                onShowToast("Función próximamente disponible", "info")
              }
            >
              Cambiar
            </button>
          </div>
        </div>
      </div>
    </SettingCard>
  );
}
