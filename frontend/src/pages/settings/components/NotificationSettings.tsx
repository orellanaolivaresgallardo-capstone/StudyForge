// frontend/src/pages/settings/components/NotificationSettings.tsx
/**
 * Notification settings section
 */
import { SettingCard } from "./SettingCard";
import { ToggleSwitch } from "./ToggleSwitch";

interface NotificationSettingsProps {
  emailNotifications: boolean;
  quizReminders: boolean;
  onToggleEmail: () => void;
  onToggleReminders: () => void;
}

export function NotificationSettings({
  emailNotifications,
  quizReminders,
  onToggleEmail,
  onToggleReminders,
}: NotificationSettingsProps) {
  return (
    <SettingCard
      title="Notificaciones"
      icon={
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
      }
    >
      <div className="space-y-3">
        <ToggleSwitch
          enabled={emailNotifications}
          onToggle={onToggleEmail}
          label="Notificaciones por email"
          description="Recibe actualizaciones sobre tus cuestionarios y resúmenes"
        />
        <ToggleSwitch
          enabled={quizReminders}
          onToggle={onToggleReminders}
          label="Recordatorios de cuestionarios"
          description="Te recordaremos practicar con tus cuestionarios"
        />
      </div>
    </SettingCard>
  );
}
