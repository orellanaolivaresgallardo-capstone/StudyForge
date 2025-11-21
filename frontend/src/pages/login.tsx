// src/pages/login.tsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

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
      await login(
        { email: email.trim().toLowerCase(), password },
        remember
      );

      showToast("Inicio de sesión exitoso. Redirigiendo…");
      setTimeout(() => {
        navigate("/documents");
      }, 700);
    } catch (err: unknown) {
      console.error(err);
      if (err && typeof err === 'object' && 'response' in err && 
          err.response && typeof err.response === 'object' && 'status' in err.response && 
          err.response.status === 401) {
        showToast("Correo o contraseña incorrectos.");
      } else {
        showToast("No se pudo iniciar sesión. Intenta nuevamente.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center relative overflow-hidden font-[Inter,sans-serif]">
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-violet-600/10 via-transparent to-cyan-600/10"
        aria-hidden="true"
      />

      {/* Card */}
      <div className="relative w-full max-w-md bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-extrabold text-white">Iniciar sesión</h1>
        <p className="mt-2 text-white/60">
          Accede a tu cuenta o{" "}
          <Link to="/signup" className="text-violet-400 hover:text-violet-300 transition-colors">
            crea una nueva
          </Link>
          .
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-5" noValidate>
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-white">
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              required
              placeholder="ejemplo@mail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 shadow-sm focus:border-violet-400 focus:ring-4 focus:ring-violet-400/20"
              aria-invalid={!!emailErr}
              aria-describedby="email-error"
            />
            {emailErr && (
              <p id="email-error" className="mt-1 text-sm text-red-400">
                {emailErr}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-white">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 shadow-sm focus:border-violet-400 focus:ring-4 focus:ring-violet-400/20"
              aria-invalid={!!passErr}
              aria-describedby="pass-error"
            />
            {passErr && (
              <p id="pass-error" className="mt-1 text-sm text-red-400">
                {passErr}
              </p>
            )}
          </div>

          {/* Opciones */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-white">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 rounded border-white/10 bg-white/5 text-violet-600 focus:ring-violet-400"
              />
              Recordarme
            </label>
            <Link to="/forgot-password" className="text-sm font-medium text-violet-400 hover:text-violet-300 transition-colors">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          {/* Botón */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-violet-600 hover:bg-violet-700 px-6 py-3.5 text-base font-semibold text-white shadow-lg transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-violet-400/30 disabled:opacity-70"
          >
            <span className="inline-flex items-center justify-center gap-2">
              {loading && (
                <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white/60 border-t-white" />
              )}
              {loading ? "Iniciando..." : "Iniciar sesión"}
            </span>
          </button>

          <p className="text-center text-xs text-white/60">
            Al iniciar sesión aceptas nuestros términos de servicio y política de privacidad.
          </p>
        </form>
      </div>

      {/* Toast */}
      {toast && (
        <div className="pointer-events-none fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xl px-4 py-3 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
