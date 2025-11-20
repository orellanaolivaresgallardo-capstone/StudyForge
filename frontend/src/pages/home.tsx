// frontend/src/pages/Home.tsx
/**
 * Landing page - Página de inicio.
 * Oculta el contenido HTML estático y muestra la landing en React.
 */
import { useEffect } from "react";
import { Link } from "react-router-dom";

export default function Home() {
  useEffect(() => {
    // Ocultar el landing HTML estático cuando React se monta
    const landingEl = document.getElementById("landing");
    if (landingEl) {
      landingEl.style.display = "none";
    }

    return () => {
      // Restaurar cuando se desmonta (opcional)
      if (landingEl) {
        landingEl.style.display = "";
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center relative overflow-hidden">
      {/* Aurora background similar al diseño */}
      <div className="absolute inset-0 opacity-50">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
        <div className="absolute top-0 -right-4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse animation-delay-4000"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <h1 className="text-6xl md:text-7xl font-extrabold text-white mb-6 tracking-tight">
          Bienvenido a{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
            StudyForge
          </span>
        </h1>

        <p className="text-xl md:text-2xl text-slate-300 mb-12 max-w-2xl mx-auto">
          Tu asistente de estudio potenciado por IA. Sube documentos, genera resúmenes adaptativos y evalúa tu progreso con quizzes inteligentes.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/signup"
            className="px-8 py-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold text-lg hover:from-purple-600 hover:to-pink-600 transition shadow-lg shadow-purple-500/50"
          >
            Crear cuenta gratis
          </Link>
          <Link
            to="/login"
            className="px-8 py-4 rounded-full bg-white/10 backdrop-blur-sm text-white font-semibold text-lg hover:bg-white/20 transition border border-white/20"
          >
            Iniciar sesión
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <div className="text-purple-400 text-4xl mb-3">📄</div>
            <h3 className="text-white font-semibold text-lg mb-2">Sube y organiza</h3>
            <p className="text-slate-400 text-sm">
              Procesa archivos PDF, DOCX, PPTX y centraliza tu material de estudio.
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <div className="text-pink-400 text-4xl mb-3">✨</div>
            <h3 className="text-white font-semibold text-lg mb-2">Resúmenes precisos</h3>
            <p className="text-slate-400 text-sm">
              Explicaciones claras y sintetizadas por IA según tu nivel de experiencia.
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <div className="text-blue-400 text-4xl mb-3">🎯</div>
            <h3 className="text-white font-semibold text-lg mb-2">Quizzes adaptativos</h3>
            <p className="text-slate-400 text-sm">
              La dificultad se ajusta automáticamente a tu rendimiento.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
