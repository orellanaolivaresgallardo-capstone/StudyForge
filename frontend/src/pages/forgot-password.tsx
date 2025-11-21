import { useState } from "react";
import { Link } from "react-router-dom";

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center relative overflow-hidden">
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-violet-600/10 via-transparent to-cyan-600/10"
        aria-hidden="true"
      />

      {/* Card */}
      <div className="relative w-full max-w-md rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-xl p-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
          Recuperar contraseña
        </h1>
        <p className="mt-2 text-white/60">
          Ingresa tu correo electrónico y te enviaremos un enlace para
          restablecer tu contraseña.
        </p>

        {sent ? (
          <div className="mt-6 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-green-300 text-sm">
            ✅ Si el correo está registrado, recibirás un email con instrucciones.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-white"
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
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 shadow-sm focus:border-violet-400 focus:ring-4 focus:ring-violet-400/20"
              />
            </div>

            {/* Botón */}
            <button
              type="submit"
              className="w-full rounded-xl bg-violet-600 hover:bg-violet-700 px-6 py-3.5 text-base font-semibold text-white shadow-lg transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-violet-400/30"
            >
              Enviar enlace
            </button>
          </form>
        )}

        {/* Links secundarios */}
        <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm text-white/60 gap-3">
          <Link to="/login" className="text-violet-400 hover:text-violet-300 transition-colors">
            Volver al login
          </Link>
          <Link to="/signup" className="hover:text-white transition-colors">
            ¿No tienes cuenta? Crear una nueva
          </Link>
        </div>

        <p className="mt-6 text-xs text-white/60">
          Revisa también tu carpeta de spam si no encuentras el email.
        </p>
      </div>
    </div>
  );
}
