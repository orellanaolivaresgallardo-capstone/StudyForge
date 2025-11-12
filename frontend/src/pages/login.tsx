// src/pages/login.tsx
import { useState } from "react";

type LoginResp = { access_token?: string; token?: string; message?: string } | Record<string, unknown>;

const API_BASE =
  (import.meta as ImportMeta).env?.VITE_API_BASE ?? "http://localhost:8000";
const AUTH_URL = `${API_BASE}/auth/login`;

// Para páginas sueltas (no router SPA), redirigimos a la HTML real:
const REDIRECT_URL =
  (import.meta as ImportMeta).env?.VITE_UPLOAD_REDIRECT_PATH ?? "/src/pages/uploaddocuments.html";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [emailErr, setEmailErr] = useState<string | null>(null);
  const [passErr, setPassErr] = useState<string | null>(null);

  function showToast(msg: string, ms = 2400) {
    setToast(msg);
    window.setTimeout(() => setToast(null), ms);
  }

  function validate(): boolean {
    setEmailErr(null);
    setPassErr(null);

    const okEmail = /\S+@\S+\.\S+/.test(email.trim());
    if (!okEmail) setEmailErr("Ingresa un correo válido.");

    const okPass = password.trim().length >= 6;
    if (!okPass) setPassErr("La contraseña debe tener al menos 6 caracteres.");

    return okEmail && okPass;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await fetch(AUTH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });

      const ok = res.status === 200;
      let data: LoginResp | null = null;
      try {
        data = (await res.json()) as LoginResp;
      } catch {
        /* ignore parse errors on non-JSON responses */
      }

      if (ok) {
        const token =
          (data as any)?.access_token ??
          (data as any)?.token ??
          undefined;

        if (typeof token === "string" && token.length) {
          // remember = true -> localStorage; false -> sessionStorage
          (remember ? localStorage : sessionStorage).setItem("sf_token", token);
          // limpia el otro storage para evitar conflictos
          (remember ? sessionStorage : localStorage).removeItem("sf_token");
        }

        showToast("Inicio de sesión exitoso. Redirigiendo…");
        setTimeout(() => {
          window.location.href = REDIRECT_URL;
        }, 700);
      } else if (res.status === 401) {
        showToast("Correo o contraseña incorrectos.");
      } else {
        showToast("No se pudo iniciar sesión. Intenta nuevamente.");
      }
    } catch (err) {
      console.error(err);
      showToast("No se pudo conectar al servidor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center relative overflow-hidden font-[Inter,sans-serif]">
      {/* Fondos degradados */}
      <div aria-hidden className="absolute inset-0">
        <div className="absolute -top-32 -left-20 h-[42rem] w-[42rem] rounded-full bg-gradient-to-br from-pink-400 via-fuchsia-500 to-purple-600 opacity-70 blur-3xl" />
        <div className="absolute -bottom-32 -right-24 h-[36rem] w-[36rem] rounded-full bg-gradient-to-br from-indigo-500 to-blue-400 opacity-70 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 h-[24rem] w-[24rem] rounded-full bg-gradient-to-br from-orange-300 to-rose-400 opacity-60 blur-3xl" />
      </div>

      {/* Card */}
      <div className="relative w-full max-w-md bg-white/95 backdrop-blur rounded-2xl shadow-xl ring-1 ring-black/5 p-8">
        <h1 className="text-3xl font-extrabold text-slate-900">Iniciar sesión</h1>
        <p className="mt-2 text-slate-600">
          Accede a tu cuenta o{" "}
          <a href="./signup.html" className="text-fuchsia-600 hover:underline">
            crea una nueva
          </a>
          .
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-5" noValidate>
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              required
              placeholder="ejemplo@mail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-fuchsia-500 focus:ring-4 focus:ring-fuchsia-500/20"
              aria-invalid={!!emailErr}
              aria-describedby="email-error"
            />
            {emailErr && (
              <p id="email-error" className="mt-1 text-sm text-rose-600">
                {emailErr}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-fuchsia-500 focus:ring-4 focus:ring-fuchsia-500/20"
              aria-invalid={!!passErr}
              aria-describedby="pass-error"
            />
            {passErr && (
              <p id="pass-error" className="mt-1 text-sm text-rose-600">
                {passErr}
              </p>
            )}
          </div>

          {/* Opciones */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-fuchsia-600 focus:ring-fuchsia-500"
              />
              Recordarme
            </label>
            <a href="#" className="text-sm font-medium text-fuchsia-600 hover:underline">
              ¿Olvidaste tu contraseña?
            </a>
          </div>

          {/* Botón */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-gradient-to-r from-fuchsia-600 to-violet-600 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-fuchsia-600/20 transition hover:opacity-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-fuchsia-500/30 disabled:opacity-70"
          >
            <span className="inline-flex items-center justify-center gap-2">
              {loading && (
                <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white/60 border-t-white" />
              )}
              {loading ? "Iniciando..." : "Iniciar sesión"}
            </span>
          </button>

          <p className="text-center text-xs text-slate-500">
            Al iniciar sesión aceptas nuestros términos de servicio y política de privacidad.
          </p>
        </form>
      </div>

      {/* Toast */}
      {toast && (
        <div className="pointer-events-none fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-slate-900/90 px-4 py-3 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
