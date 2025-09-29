import { useState } from "react";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await new Promise((r) => setTimeout(r, 800));
      alert(`¡Bienvenido! Has iniciado sesión como ${email}`);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Ocurrió un error al iniciar sesión");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-900 relative overflow-hidden">
      {/* Gradient background */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-20 h-[42rem] w-[42rem] rounded-full bg-gradient-to-br from-pink-400 via-fuchsia-500 to-purple-600 opacity-70 blur-3xl" />
        <div className="absolute -bottom-32 -right-24 h-[36rem] w-[36rem] rounded-full bg-gradient-to-br from-indigo-500 to-blue-400 opacity-70 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 h-[24rem] w-[24rem] rounded-full bg-gradient-to-br from-orange-300 to-rose-400 opacity-60 blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative mx-auto max-w-6xl px-6 py-20 grid place-items-center">
        <div className="w-full max-w-xl rounded-2xl bg-white/95 shadow-xl ring-1 ring-black/5 backdrop-blur">
          <div className="p-8 sm:p-10">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">Sign in</h1>
            <p className="mt-2 text-slate-600">Accede a tu cuenta o <a href="#/sign-up" className="text-fuchsia-600 hover:underline">crea una nueva</a>.</p>

            <form onSubmit={onSubmit} className="mt-8 space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700">Email address</label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-fuchsia-500 focus:ring-4 focus:ring-fuchsia-500/20"
                  placeholder="tu@mail.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700">Password</label>
                <div className="mt-2 relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-11 text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-fuchsia-500 focus:ring-4 focus:ring-fuchsia-500/20"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                  >
                    {/* Eye icon */}
                    {showPassword ? (
                      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
                        <path fill="currentColor" d="M12 5c-5 0-9 4.5-10 7 1 2.5 5 7 10 7s9-4.5 10-7c-1-2.5-5-7-10-7Zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10Z"/>
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
                        <path fill="currentColor" d="M3.3 2.3 2 3.6l3 3C3.2 8 1.9 9.7 1 12c1 2.5 5 7 11 7 2.1 0 3.9-.5 5.4-1.3l3.3 3.3 1.3-1.3-20-17.4Zm8.7 14.7c-3.1 0-5.5-2.4-5.5-5.5 0-.6.1-1.2.3-1.8l2 1.8c-.1.3-.1.6-.1.9 0 1.8 1.5 3.3 3.3 3.3.3 0 .6-.1.9-.1l2 1.8c-.6.2-1.2.3-1.9.3Zm7.7-3.7c-.5.7-1.1 1.4-1.8 2l-1.5-1.3c.5-.6.9-1.4.9-2.3 0-2.7-2.2-4.9-4.9-4.9-.9 0-1.7.3-2.3.7l-1.6-1.4C10.2 6.3 11.1 6 12 6c6 0 10 4.6 11 7- .2.5-.6 1.1-1.3 1.9Z"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-3 select-none">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-fuchsia-600 focus:ring-fuchsia-500"
                  />
                  <span className="text-sm text-slate-700">Recordarme</span>
                </label>
                <a href="#/forgot-password" className="text-sm font-medium text-fuchsia-600 hover:underline">¿Olvidaste tu contraseña?</a>
              </div>

              {error && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-full bg-gradient-to-r from-fuchsia-600 to-violet-600 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-fuchsia-600/20 transition hover:opacity-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-fuchsia-500/30 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Ingresando…" : "Sign in"}
              </button>

              <p className="text-center text-xs text-slate-500">Al iniciar sesión aceptas nuestros términos de servicio y política de privacidad.</p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

