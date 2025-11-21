// frontend/src/components/LandingPage.tsx
/**
 * Landing page component for non-authenticated users.
 * Uses shared PublicHeader and consistent styling with features/aboutus pages.
 */
import { Link } from "react-router-dom";
import PublicHeader from "./PublicHeader";

export default function LandingPage() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-violet-600/10 via-transparent to-cyan-600/10"
        aria-hidden="true"
      />
      <PublicHeader currentPage="home" subtitle="Asistente de estudio con IA" />

      {/* Hero section */}
      <section className="relative max-w-7xl mx-auto px-6 pt-10 pb-6">
        <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-[32px] p-8 md:p-12 relative overflow-hidden">
          <div
            className="absolute -top-24 -right-24 h-80 w-80 rounded-full blur-3xl opacity-40"
            style={{ background: "radial-gradient(circle at 30% 30%, #a855f7 0%, transparent 60%)" }}
          />
          <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-10 items-center">
            {/* Copy */}
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight">
                Prepárate para una{" "}
                <span className="text-fuchsia-300">nueva era</span>{" "}
                de estudio con IA
              </h1>

              <p className="mt-4 sm:mt-5 text-slate-300 text-sm sm:text-base max-w-xl">
                Sube tus documentos, obtén <span className="text-white">resúmenes claros</span> y genera{" "}
                <span className="text-white">quizzes adaptativos</span> según tu progreso. Feedback inmediato
                y tu avance siempre guardado.
              </p>

              {/* Feature bullets */}
              <ul className="mt-5 sm:mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm text-slate-300">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-fuchsia-400 flex-shrink-0"></span>
                  <span>Carga PDF, Word y texto</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-fuchsia-400 flex-shrink-0"></span>
                  <span>Resúmenes automáticos</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-fuchsia-400 flex-shrink-0"></span>
                  <span>Evaluaciones adaptativas</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-fuchsia-400 flex-shrink-0"></span>
                  <span>Estadísticas y progreso</span>
                </li>
              </ul>

              {/* CTA buttons */}
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to="/signup"
                  className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl px-5 py-3 text-sm font-semibold inline-block transition-colors"
                >
                  Crear cuenta gratis
                </Link>
                <Link
                  to="/features"
                  className="rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 px-5 py-3 text-sm font-semibold inline-block transition-colors"
                >
                  Ver características
                </Link>
              </div>
            </div>

            {/* Robot image */}
            <div className="relative mt-6 lg:mt-0">
              <div className="absolute -inset-4 sm:-inset-6 md:-inset-10 -z-10 rounded-[2rem] bg-gradient-to-tr from-fuchsia-500/20 via-transparent to-violet-400/20 blur-2xl"></div>
              <img
                src="/img/robot.png"
                alt="Asistente StudyForge"
                className="w-full max-w-sm sm:max-w-md lg:max-w-lg mx-auto rounded-2xl sm:rounded-3xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Mini features section */}
      <section className="relative max-w-7xl mx-auto px-6 pt-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
          <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-xl sm:rounded-2xl p-5 sm:p-6">
            <h3 className="font-semibold mb-1 text-sm sm:text-base text-white">Sube y organiza</h3>
            <p className="text-xs sm:text-sm text-white/60">Procesa archivos y centraliza tu material de estudio.</p>
          </div>
          <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-xl sm:rounded-2xl p-5 sm:p-6">
            <h3 className="font-semibold mb-1 text-sm sm:text-base text-white">Resúmenes precisos</h3>
            <p className="text-xs sm:text-sm text-white/60">Explicaciones claras y sintetizadas por IA.</p>
          </div>
          <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-xl sm:rounded-2xl p-5 sm:p-6 sm:col-span-2 md:col-span-1">
            <h3 className="font-semibold mb-1 text-sm sm:text-base text-white">Quizzes adaptativos</h3>
            <p className="text-xs sm:text-sm text-white/60">La dificultad se ajusta a tu rendimiento.</p>
          </div>
        </div>
      </section>

      {/* Testimonial / social proof section */}
      <section className="relative max-w-7xl mx-auto px-6 pt-10">
        <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6 md:p-8">
          <h2 className="text-2xl font-extrabold text-white mb-4">¿Por qué StudyForge?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="rounded-xl bg-white/5 p-5">
              <div className="text-3xl font-black text-violet-400">3x</div>
              <div className="text-sm text-white/60 mt-1">Velocidad de estudio</div>
            </div>
            <div className="rounded-xl bg-white/5 p-5">
              <div className="text-3xl font-black text-violet-400">90%</div>
              <div className="text-sm text-white/60 mt-1">Comprensión promedio</div>
            </div>
            <div className="rounded-xl bg-white/5 p-5">
              <div className="text-3xl font-black text-violet-400">24/7</div>
              <div className="text-sm text-white/60 mt-1">Disponibilidad</div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative max-w-7xl mx-auto px-6 pt-10 pb-16">
        <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h2 className="text-xl md:text-2xl font-extrabold text-white">¿Listo para transformar tu estudio?</h2>
            <p className="text-white/60 mt-1">Únete a StudyForge y lleva tu aprendizaje al siguiente nivel.</p>
          </div>
          <Link to="/signup" className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl px-5 py-3 font-semibold inline-block text-center transition-colors">
            Empezar ahora
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-8 text-sm text-white/60 text-center">
          © {currentYear} StudyForge. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
}
