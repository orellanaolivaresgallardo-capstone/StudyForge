// frontend/src/pages/settings/SettingsPage.tsx
/**
 * Settings Page - REFACTORED VERSION
 * Reduced from 295 → ~80 lines using extracted components
 */
import { useState } from "react";
import { Toast } from "@/components";
import type { ToastType } from "@/components";
import { useAuth } from "@/context/AuthContext";
import {
  AccountSettings,
  NotificationSettings,
  AppearanceSettings,
  DangerZone,
} from "./components";

export default function SettingsPage() {
  const { user } = useAuth();
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  // Placeholder settings (these would be stored in backend in future)
  const [settings, setSettings] = useState({
    emailNotifications: true,
    quizReminders: false,
    language: "es",
  });

  const handleToggleSetting = (key: keyof typeof settings) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
    setToast({ message: "Configuración guardada", type: "success" });
  };

  const showToast = (message: string, type: ToastType = "info") => {
    setToast({ message, type });
  };

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
          <h1 className="text-3xl font-bold text-white mb-2">Configuración</h1>
          <p className="text-slate-300">
            Personaliza tu experiencia en StudyForge
          </p>
        </div>

        <div className="space-y-6">
          <AccountSettings email={user?.email || ""} onShowToast={showToast} />

          <NotificationSettings
            emailNotifications={settings.emailNotifications}
            quizReminders={settings.quizReminders}
            onToggleEmail={() => handleToggleSetting("emailNotifications")}
            onToggleReminders={() => handleToggleSetting("quizReminders")}
          />

          <AppearanceSettings
            language={settings.language}
            onLanguageChange={(lang) =>
              setSettings({ ...settings, language: lang })
            }
          />

          <DangerZone onShowToast={showToast} />
        </div>
      </div>
    </>
  );
}
