import { useState } from "react";

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5 opacity-70">
      <path fill="currentColor" d="M12 5c-5 0-9 4.5-10 7 1 2.5 5 7 10 7s9-4.5 10-7c-1-2.5-5-7-10-7Zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10Z"/>
    </svg>
  ) : (
    <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5 opacity-70">
      <path fill="currentColor" d="M3.3 2.3 2 3.6l3 3C3.2 8 1.9 9.7 2 12c1 2.5 5 7 10 7 2.2 0 4.3-.7 6-1.9l2.7 2.7 1.3-1.3-18.7-18Z"/>
      <path fill="currentColor" d="M8.5 7.1 10 8.6a4.9 4.9 0 0 1 6.8 6.8l1.5 1.5c1.3-1 2.4-2.2 3.2-3.5-1-2.5-5-7-10-7-1.1 0-2.2.2-3.2.6Zm1.4 5.6a2.1 2.1 0 0 0 2.4 2.4l-2.4-2.4Z"/>
    </svg>
  );
}

export default function SignUp() {
  const [showPwd, setShowPwd] = useState(false);
  const [email, setEmail] = useState("");
  const [user, setUser] = useState("");
  const [pwd, setPwd] = useState("");
  const [promo, setPromo] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [errors, setErrors] = useState<{email?: string; user?: string; pwd?: string}>({});

  const validate = () => {
    const e: typeof errors = {};
    if (!/^\S+@\S+\.\S+$/.test(email)) e.email = "Ingresa un correo válido";
    if (user.trim().length < 3) e.user = "Mínimo 3 caracteres";
    if (pwd.length < 8) e.pwd = "Mínimo 8 caracteres";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setMsg(null);
    if (!validate()) return;

    try {
      setSubmitting(true);
      // TODO: ajusta la URL a tu backend Django
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/signup/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, username: user, password: pwd, marketing_optout: promo }),
      });
      if (!res.ok) throw new Error(await res.text());
      setMsg("¡Cuenta creada! Revisa tu correo para confirmar.");
      setEmail(""); setUser(""); setPwd(""); setPromo(false);
    } catch (err: unknown) {
      setMsg("No pudimos crear tu cuenta. Intenta de nuevo.");
      if (err instanceof Error) {
        console.error(err.message);
      } else {
        console.error(err);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const isValid = email && user && pwd && validate();

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 py-10 text-slate-900">
      {/* Fondo degradado tipo “waves” */}
      <BackgroundWaves />

      <div className="relative w-full max-w-xl">
        <div className="rounded-3xl bg-white/95 shadow-2xl ring-1 ring-black/5 p-8 md:p-10 backdrop-blur">
          <h1 className="text-4xl font-extrabold tracking-tight">Sign up</h1>
          <p className="mt-2 text-slate-500">
            Create an account or{" "}
            <a href="#" className="text-violet-600 hover:underline">Sign in</a>
          </p>

          <form className="mt-8 space-y-5" onSubmit={onSubmit} noValidate>
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">Email address</label>
              <input
                id="email" type="email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`mt-2 w-full rounded-xl border px-4 py-3 outline-none transition
                ${errors.email ? "border-rose-400 ring-2 ring-rose-100" : "border-slate-200 focus:ring-2 focus:ring-violet-200"}`}
                placeholder="you@example.com"
              />
              {errors.email && <p className="mt-1 text-xs text-rose-500">{errors.email}</p>}
            </div>

            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-slate-700">Username</label>
              <input
                id="username" value={user}
                onChange={(e) => setUser(e.target.value)}
                className={`mt-2 w-full rounded-xl border px-4 py-3 outline-none transition
                ${errors.user ? "border-rose-400 ring-2 ring-rose-100" : "border-slate-200 focus:ring-2 focus:ring-violet-200"}`}
                placeholder="martin_o"
              />
              {errors.user && <p className="mt-1 text-xs text-rose-500">{errors.user}</p>}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">Password</label>
              <div className={`mt-2 flex items-center rounded-xl border pr-3
                ${errors.pwd ? "border-rose-400 ring-2 ring-rose-100" : "border-slate-200 focus-within:ring-2 focus-within:ring-violet-200"}`}>
                <input
                  id="password"
                  type={showPwd ? "text" : "password"}
                  value={pwd}
                  onChange={(e) => setPwd(e.target.value)}
                  className="w-full rounded-l-xl bg-transparent px-4 py-3 outline-none"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  aria-label={showPwd ? "Ocultar contraseña" : "Mostrar contraseña"}
                  onClick={() => setShowPwd((s) => !s)}
                  className="grid place-items-center"
                >
                  <EyeIcon open={showPwd} />
                </button>
              </div>
              <p className="mt-1 text-xs text-slate-500">Mínimo 8 caracteres.</p>
              {errors.pwd && <p className="mt-1 text-xs text-rose-500">{errors.pwd}</p>}
            </div>

            {/* Marketing */}
            <label className="flex items-start gap-3 text-sm text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={promo}
                onChange={(e) => setPromo(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
              />
              <span>No quiero recibir correos con noticias o promociones.</span>
            </label>

            {/* Submit */}
            <button
              type="submit"
              disabled={!isValid || submitting}
              className="mt-2 w-full rounded-full bg-violet-600 px-6 py-3 font-semibold text-white shadow-lg
                         enabled:hover:bg-violet-700 enabled:shadow-violet-300/50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {submitting ? "Creando…" : "Sign up"}
            </button>

            <p className="text-center text-xs text-slate-400">
              By signing up you accept our terms of service and privacy policy.
            </p>

            {msg && (
              <div className="rounded-xl bg-slate-50 text-slate-700 px-4 py-3 text-sm ring-1 ring-slate-200">
                {msg}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

function BackgroundWaves() {
  // fondo suave estilo imagen: blobs + gradientes
  return (
    <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute -top-40 -left-20 h-[32rem] w-[32rem] rounded-full blur-3xl opacity-60"
           style={{ background: "radial-gradient(closest-side, #f8c8ff, transparent)" }} />
      <div className="absolute -top-20 right-0 h-[36rem] w-[36rem] rounded-full blur-3xl opacity-70"
           style={{ background: "radial-gradient(closest-side, #b388ff, transparent)" }} />
      <div className="absolute bottom-0 -left-10 h-[30rem] w-[30rem] rounded-full blur-3xl opacity-80"
           style={{ background: "radial-gradient(closest-side, #5ee1ff, transparent)" }} />
      <div className="absolute -bottom-24 right-[-6rem] h-[34rem] w-[34rem] rounded-full blur-3xl opacity-80"
           style={{ background: "radial-gradient(closest-side, #7c3aed, transparent)" }} />
      <div className="absolute inset-0 bg-white/40 backdrop-blur-3xl" />
    </div>
  );
}
