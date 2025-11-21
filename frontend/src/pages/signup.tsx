// src/pages/signup.tsx
import { useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function SignupPage() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const formRef = useRef<HTMLFormElement | null>(null);

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const [emailErr, setEmailErr] = useState<string | null>(null);
  const [userErr, setUserErr] = useState<string | null>(null);
  const [passErr, setPassErr] = useState<string | null>(null);

  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string, ms = 2200) {
    setToast(msg);
    window.setTimeout(() => setToast(null), ms);
  }

  function validate(): boolean {
    setEmailErr(null);
    setUserErr(null);
    setPassErr(null);

    const emailValid = /\S+@\S+\.\S+/.test(email.trim());
    if (!emailValid) setEmailErr("Ingresa un correo electrónico válido.");

    const userValid =
      username.length >= 3 &&
      username.length <= 24 &&
      /^[a-zA-Z0-9_.]+$/.test(username);
    if (!userValid)
      setUserErr(
        'El nombre de usuario debe tener 3–24 caracteres y solo letras, números, "_" o "."'
      );

    const passValid = password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password);
    if (!passValid) setPassErr("Mínimo 8 caracteres, con al menos 1 letra y 1 número.");

    return emailValid && userValid && passValid;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);

    try {
      await signup(
        {
          email: email.trim().toLowerCase(),
          username: username.trim(),
          password,
        },
        true
      );

      showToast("Cuenta creada con éxito. Redirigiendo…");
      setTimeout(() => {
        navigate("/documents");
      }, 800);
    } catch (err: any) {
      console.error(err);
      if (err?.response?.status === 409) {
        showToast("Ese correo ya existe.");
      } else if (err?.response?.status === 400) {
        showToast("Datos inválidos. Revisa el formulario.");
      } else {
        showToast("No se pudo crear la cuenta. Intenta nuevamente.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-violet-600/10 via-transparent to-cyan-600/10"
        aria-hidden="true"
      />

      <main className="relative z-10 flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-xl">
          <section className="rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl p-6 sm:p-8 md:p-10">
            <header className="mb-8">
              <h1 className="text-4xl font-extrabold tracking-tight text-white">
                Crear cuenta
              </h1>
              <p className="mt-2 text-white/60">
                ¿Ya tienes cuenta?{" "}
                <Link
                  to="/login"
                  className="font-semibold text-violet-400 hover:text-violet-300 transition-colors"
                >
                  Inicia sesión
                </Link>
              </p>
            </header>

            <form ref={formRef} onSubmit={onSubmit} noValidate className="space-y-6">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-white">
                  Correo electrónico
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/40 shadow-sm outline-none ring-violet-400/30 transition focus:border-violet-400 focus:ring-4"
                  placeholder="you@example.com"
                  aria-invalid={!!emailErr}
                  aria-describedby="email-error"
                />
                {emailErr && (
                  <p id="email-error" className="mt-1 text-sm text-red-400">
                    {emailErr}
                  </p>
                )}
              </div>

              {/* Username (solo UI) */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-white">
                  Nombre de usuario (opcional)
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  minLength={3}
                  maxLength={24}
                  pattern="^[a-zA-Z0-9_\.]+$"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/40 shadow-sm outline-none ring-violet-400/30 transition focus:border-violet-400 focus:ring-4"
                  placeholder="studyforge_user"
                  aria-invalid={!!userErr}
                  aria-describedby="username-error"
                />
                <p className="mt-1 text-xs text-white/60">Opcional. 3–24 caracteres, letras, números, "_" y "."</p>
                {userErr && (
                  <p id="username-error" className="mt-1 text-sm text-red-400">
                    {userErr}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-white">
                  Contraseña
                </label>
                <div className="mt-2 relative">
                  <input
                    id="password"
                    name="password"
                    type={showPass ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 pr-12 text-white placeholder-white/40 shadow-sm outline-none ring-violet-400/30 transition focus:border-violet-400 focus:ring-4"
                    placeholder="••••••••"
                    aria-invalid={!!passErr}
                    aria-describedby="password-hint password-error"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((s) => !s)}
                    className="absolute inset-y-0 right-2 my-auto grid h-9 w-10 place-items-center rounded-lg text-white/60 hover:bg-white/10"
                    aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {!showPass ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 5c-5 0-9 4.5-10 7 1 2.5 5 7 10 7s9-4.5 10-7c-1-2.5-5-7-10-7Zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10Z" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3.3 2.3 2 3.6l2.6 2.6C3 8.2 1.9 10 2 12c1 2.5 5 7 10 7 2 0 3.9-.7 5.5-1.7l2.9 2.9 1.3-1.3L3.3 2.3ZM12 7c-1.1 0-2 .3-2.8.9l1.4 1.4c.4-.2.9-.3 1.4-.3a3 3 0 0 1 3 3c0 .5-.1 1-.3 1.4l1.4 1.4c.6-.8.9-1.7.9-2.8a5 5 0 0 0-5-5Z" />
                      </svg>
                    )}
                  </button>
                </div>
                <p id="password-hint" className="mt-1 text-xs text-white/60">
                  Mínimo 8 caracteres e incluye al menos 1 letra y 1 número.
                </p>
                {passErr && (
                  <p id="password-error" className="mt-1 text-sm text-red-400">
                    {passErr}
                  </p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-violet-600 hover:bg-violet-700 px-6 py-4 text-lg font-semibold text-white shadow-lg transition-colors focus:outline-none focus:ring-4 focus:ring-violet-400/40 disabled:opacity-70"
              >
                <span className="inline-flex items-center justify-center gap-2">
                  {loading && (
                    <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white/60 border-t-white" />
                  )}
                  {loading ? "Creando cuenta…" : "Registrarse"}
                </span>
              </button>
            </form>
          </section>
        </div>
      </main>

      {/* Toast */}
      {toast && (
        <div className="pointer-events-none fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xl px-4 py-3 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
