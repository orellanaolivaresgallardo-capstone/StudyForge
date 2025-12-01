// frontend/src/pages/auth/SignupPage.tsx
/**
 * Signup Page - REFACTORED VERSION
 * Reduced from 242 → ~140 lines using extracted components
 */
import { useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { FormInput, PasswordInput } from "./components";

export default function SignupPage() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const formRef = useRef<HTMLFormElement | null>(null);

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

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

      // Priorizar mensaje del backend
      const backendMessage = err?.response?.data?.detail;

      if (backendMessage) {
        showToast(backendMessage);
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
        className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-violet-600/10 via-transparent to-cyan-600/10"
        aria-hidden="true"
      />

      <main className="relative z-10 flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-xl">
          <section className="rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl p-6 sm:p-8 md:p-10">
            <header className="mb-8">
              <h1 className="text-4xl font-extrabold tracking-tight text-white">
                Crear cuenta
              </h1>
              <p className="mt-2 text-slate-300">
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
              <FormInput
                id="email"
                name="email"
                type="email"
                label="Correo electrónico"
                value={email}
                onChange={setEmail}
                placeholder="you@example.com"
                error={emailErr}
                autoComplete="email"
                required
              />

              <FormInput
                id="username"
                name="username"
                type="text"
                label="Nombre de usuario"
                value={username}
                onChange={setUsername}
                placeholder="studyforge_user"
                error={userErr}
                hint='Opcional. 3–24 caracteres, letras, números, "_" y "."'
                autoComplete="username"
                minLength={3}
                maxLength={24}
                pattern="^[a-zA-Z0-9_\.]+$"
              />

              <PasswordInput
                id="password"
                name="password"
                label="Contraseña"
                value={password}
                onChange={setPassword}
                placeholder="••••••••"
                error={passErr}
                hint="Mínimo 8 caracteres e incluye al menos 1 letra y 1 número."
                autoComplete="new-password"
                required
                minLength={8}
              />

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
