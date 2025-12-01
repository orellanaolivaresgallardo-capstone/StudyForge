// frontend/src/pages/auth/components/PasswordInput.tsx
/**
 * Password input with show/hide toggle
 */
import { useState } from "react";

interface PasswordInputProps {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  error?: string | null;
  hint?: string;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
}

export function PasswordInput({
  id,
  name,
  label,
  value,
  onChange,
  placeholder,
  error,
  hint,
  autoComplete,
  required,
  minLength,
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-white">
        {label}
      </label>
      <div className="mt-2 relative">
        <input
          id={id}
          name={name}
          type={showPassword ? "text" : "password"}
          autoComplete={autoComplete}
          required={required}
          minLength={minLength}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 pr-12 text-white placeholder-slate-400 shadow-sm outline-none ring-violet-400/30 transition focus:border-violet-400 focus:ring-4"
          placeholder={placeholder}
          aria-invalid={!!error}
          aria-describedby={
            error ? `${id}-error` : hint ? `${id}-hint` : undefined
          }
        />
        <button
          type="button"
          onClick={() => setShowPassword((s) => !s)}
          className="absolute inset-y-0 right-2 my-auto grid h-9 w-10 place-items-center rounded-lg text-slate-300 hover:bg-white/10"
          aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
        >
          {!showPassword ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 5c-5 0-9 4.5-10 7 1 2.5 5 7 10 7s9-4.5 10-7c-1-2.5-5-7-10-7Zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10Z" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M3.3 2.3 2 3.6l2.6 2.6C3 8.2 1.9 10 2 12c1 2.5 5 7 10 7 2 0 3.9-.7 5.5-1.7l2.9 2.9 1.3-1.3L3.3 2.3ZM12 7c-1.1 0-2 .3-2.8.9l1.4 1.4c.4-.2.9-.3 1.4-.3a3 3 0 0 1 3 3c0 .5-.1 1-.3 1.4l1.4 1.4c.6-.8.9-1.7.9-2.8a5 5 0 0 0-5-5Z" />
            </svg>
          )}
        </button>
      </div>
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1 text-xs text-slate-300">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1 text-sm text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
