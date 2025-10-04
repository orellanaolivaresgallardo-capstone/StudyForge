import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí iría la lógica real (fetch a tu API de reset password)
    setTimeout(() => {
      setSent(true);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center relative overflow-hidden">
      {/* Fondos degradados */}
      <div aria-hidden className="absolute inset-0">
        <div className="absolute -top-32 -left-32 h-[32rem] w-[32rem] rounded-full bg-fuchsia-600/40 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-[28rem] w-[28rem] rounded-full bg-indigo-600/40 blur-3xl" />
        <div className="absolute -bottom-10 -left-20 h-[20rem] w-[20rem] rounded-full bg-rose-500/30 blur-3xl" />
      </div>

      {/* Card */}
      <div className="relative w-full max-w-md rounded-2xl bg-white/95 shadow-xl ring-1 ring-black/5 backdrop-blur p-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          Recuperar contraseña
        </h1>
        <p className="mt-2 text-slate-600">
          Ingresa tu correo electrónico y te enviaremos un enlace para
          restablecer tu contraseña.
        </p>

        {sent ? (
          <div className="mt-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-green-700 text-sm">
            ✅ Si el correo está registrado, recibirás un email con instrucciones.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                placeholder="tu@mail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-fuchsia-500 focus:ring-4 focus:ring-fuchsia-500/20"
              />
            </div>

            {/* Botón */}
            <button
              type="submit"
              className="w-full rounded-full bg-gradient-to-r from-fuchsia-600 to-violet-600 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-fuchsia-600/20 transition hover:opacity-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-fuchsia-500/30"
            >
              Enviar enlace
            </button>
          </form>
        )}

        {/* Links secundarios */}
        <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm text-slate-600 gap-3">
          <a href="/src/pages/login.html" className="text-fuchsia-600 hover:underline">
            Volver al login
          </a>
          <a href="/src/pages/signup.html" className="hover:underline">
            ¿No tienes cuenta? Crear una nueva
          </a>
        </div>

        <p className="mt-6 text-xs text-slate-500">
          Revisa también tu carpeta de spam si no encuentras el email.
        </p>
      </div>
    </div>
  );
}
