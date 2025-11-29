// frontend/src/pages/settings/components/SettingCard.tsx
/**
 * Card wrapper for settings sections
 */
import { ReactNode } from "react";

interface SettingCardProps {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  variant?: "default" | "danger";
}

export function SettingCard({
  title,
  icon,
  children,
  variant = "default",
}: SettingCardProps) {
  return (
    <div
      className={`card ${
        variant === "danger" ? "border-red-500/30" : ""
      }`}
    >
      <h2
        className={`text-xl font-semibold mb-4 flex items-center gap-2 ${
          variant === "danger" ? "text-red-400" : "text-white"
        }`}
      >
        {icon}
        {title}
      </h2>
      {children}
    </div>
  );
}
