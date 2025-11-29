// frontend/src/pages/settings/components/AppearanceSettings.tsx
/**
 * Appearance settings section
 */
import { SettingCard } from "./SettingCard";
import { ToggleSwitch } from "./ToggleSwitch";

interface AppearanceSettingsProps {
  language: string;
  onLanguageChange: (language: string) => void;
}

export function AppearanceSettings({
  language,
  onLanguageChange,
}: AppearanceSettingsProps) {
  return (
    <SettingCard
      title="Apariencia"
      icon={
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
          />
        </svg>
      }
    >
      <div className="space-y-3">
        <ToggleSwitch
          enabled={true}
          onToggle={() => {}}
          label="Modo oscuro"
          description="Actualmente solo está disponible el modo oscuro"
          disabled
        />

        <div className="p-4 rounded-lg bg-white/5 border border-white/10">
          <h3 className="text-sm font-medium text-white mb-1">Idioma</h3>
          <p className="text-xs text-slate-400 mb-3">
            Selecciona tu idioma preferido
          </p>
          <select
            value={language}
            onChange={(e) => onLanguageChange(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
          >
            <option value="es">Español</option>
            <option value="en">English (Próximamente)</option>
          </select>
        </div>
      </div>
    </SettingCard>
  );
}
