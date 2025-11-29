// frontend/src/pages/settings/components/ToggleSwitch.tsx
/**
 * Reusable toggle switch component
 */
interface ToggleSwitchProps {
  enabled: boolean;
  onToggle: () => void;
  label: string;
  description: string;
  disabled?: boolean;
}

export function ToggleSwitch({
  enabled,
  onToggle,
  label,
  description,
  disabled = false,
}: ToggleSwitchProps) {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
      <div>
        <h3 className="text-sm font-medium text-white mb-1">{label}</h3>
        <p className="text-xs text-slate-400">{description}</p>
      </div>
      <button
        onClick={onToggle}
        disabled={disabled}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          disabled
            ? "bg-fuchsia-500 cursor-not-allowed opacity-50"
            : enabled
            ? "bg-fuchsia-500"
            : "bg-slate-600"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            enabled ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}
