// src/pages/SignupPage.tsx
import { useRef, useState } from "react";

type ApiResponse =
  | { token?: string; message?: string }
  | Record<string, unknown>;

const AUTH_URL =
  (import.meta.env?.VITE_AUTH_REGISTER_URL as string | undefined) ??
  "http://localhost:8000/auth/register";

// Si usas hash routing (#/upload) o una ruta SPA (/upload), ajústalo aquí:
const REDIRECT_URL =
  (import.meta.env?.VITE_UPLOAD_REDIRECT_PATH as string | undefined) ?? "/src/pages/uploaddocuments.tsx";

export default function SignupPage() {
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

    const passValid =
      password.length >= 8 &&
      /[A-Za-z]/.test(password) &&
      /\d/.test(password);
    if (!passValid)
      setPassErr(
        "Mínimo 8 caracteres, con al menos 1 letra y 1 número."
      );

    return emailValid && userValid && passValid;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);

    const payload = {
      email: email.trim(),
      username: username.trim(),
      password,
    };

    try {
      const res = await fetch(AUTH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const ok = res.status === 200 || res.status === 201;
      let data: ApiResponse | null = null;
      try {
        data = (await res.json()) as ApiResponse;
      } catch {
        // Si no hay JSON, no interrumpe
      }

      if (ok) {
        const token = (data as ApiResponse)?.token as string | undefined;
        if (token) localStorage.setItem("sf_token", token);

        showToast("Cuenta creada con éxito. Redirigiendo…");
        setTimeout(() => {
          window.location.href = REDIRECT_URL;
        }, 800);
      } else {
        if (res.status === 409) {
          showToast("Ese correo o usuario ya existe.");
        } else if (res.status === 400) {
          showToast("Datos inválidos. Revisa el formulario.");
        } else {
          showToast("No se pudo crear la cuenta. Intenta nuevamente.");
        }
      }
    } catch (err) {
      console.error(err);
      showToast("Error de red o servidor no disponible.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Fondos */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-fuchsia-500/40 blur-[120px]" />
        <div className="absolute top-10 right-[-6rem] h-[28rem] w-[28rem] rounded-full bg-violet-600/40 blur-[140px]" />
        <div className="absolute -bottom-24 left-1/3 h-96 w-96 rounded-full bg-sky-500/40 blur-[120px]" />
      </div>

      <main className="relative z-10 flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-xl">
          <section className="rounded-3xl bg-white/95 shadow-2xl ring-1 ring-black/5 backdrop-blur-md p-6 sm:p-8 md:p-10">
            <header className="mb-8">
              <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
                Crear cuenta
              </h1>
              <p className="mt-2 text-slate-600">
                ¿Ya tienes cuenta?{" "}
                <a
                  href="/#/login"
                  className="font-semibold text-violet-600 hover:text-violet-700"
                >
                  Inicia sesión
                </a>
              </p>
            </header>

            <form ref={formRef} onSubmit={onSubmit} noValidate className="space-y-6">
              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-slate-700"
                >
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
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 shadow-sm outline-none ring-violet-500/30 transition focus:border-violet-500 focus:ring-4"
                  placeholder="you@example.com"
                  aria-invalid={!!emailErr}
                  aria-describedby="email-error"
                />
                {emailErr && (
                  <p id="email-error" className="mt-1 text-sm text-rose-600">
                    {emailErr}
                  </p>
                )}
              </div>

              {/* Username */}
              <div>
                <label
                  htmlFor="username"
                  className="block text-sm font-medium text-slate-700"
                >
                  Nombre de usuario
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  minLength={3}
                  maxLength={24}
                  pattern="^[a-zA-Z0-9_\.]+$"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 shadow-sm outline-none ring-violet-500/30 transition focus:border-violet-500 focus:ring-4"
                  placeholder="studyforge_user"
                  aria-invalid={!!userErr}
                  aria-describedby="username-error"
                />
                <p className="mt-1 text-xs text-slate-500">
                  3–24 caracteres. Letras, números, “_” y “.”
                </p>
                {userErr && (
                  <p id="username-error" className="mt-1 text-sm text-rose-600">
                    {userErr}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-slate-700"
                >
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
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pr-12 text-slate-900 placeholder-slate-400 shadow-sm outline-none ring-violet-500/30 transition focus:border-violet-500 focus:ring-4"
                    placeholder="••••••••"
                    aria-invalid={!!passErr}
                    aria-describedby="password-hint password-error"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((s) => !s)}
                    className="absolute inset-y-0 right-2 my-auto grid h-9 w-10 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"
                    aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {/* eye / eye-off */}
                    {!showPass ? (
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
                <p id="password-hint" className="mt-1 text-xs text-slate-500">
                  Mínimo 8 caracteres e incluye al menos 1 letra y 1 número.
                </p>
                {passErr && (
                  <p id="password-error" className="mt-1 text-sm text-rose-600">
                    {passErr}
                  </p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-gradient-to-r from-fuchsia-600 to-violet-600 px-6 py-4 text-lg font-semibold text-white shadow-lg shadow-violet-600/30 transition hover:brightness-110 focus:outline-none focus:ring-4 focus:ring-violet-500/40 disabled:opacity-70"
              >
                <span className="inline-flex items-center justify-center gap-2">
                  {loading && (
                    <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white/60 border-t-white" />
                  )}
                  {loading ? "Creando cuenta…" : "Registrarse"}
                </span>
              </button>

              <p className="text-center text-xs text-slate-500">
                Al registrarte aceptas nuestros{" "}
                <a
                  href="#"
                  className="font-medium text-slate-600 underline decoration-slate-300 hover:text-slate-800"
                >
                  Términos de servicio
                </a>{" "}
                y{" "}
                <a
                  href="#"
                  className="font-medium text-slate-600 underline decoration-slate-300 hover:text-slate-800"
                >
                  Política de privacidad
                </a>
                .
              </p>
            </form>
          </section>
        </div>
      </main>

      {/* Toast */}
      {toast && (
        <div className="pointer-events-none fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-slate-900/90 px-4 py-3 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
