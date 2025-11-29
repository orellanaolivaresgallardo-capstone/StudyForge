// frontend/src/pages/settings/components/DangerZone.tsx
/**
 * Danger zone settings section
 */
import { SettingCard } from "./SettingCard";

interface DangerZoneProps {
  onShowToast: (message: string, type: "info" | "success" | "error") => void;
}

export function DangerZone({ onShowToast }: DangerZoneProps) {
  return (
    <SettingCard
      title="Zona de peligro"
      variant="danger"
      icon={
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      }
    >
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
              onShowToast("Función próximamente disponible", "info")
            }
          >
            Eliminar cuenta
          </button>
        </div>
      </div>
    </SettingCard>
  );
}
