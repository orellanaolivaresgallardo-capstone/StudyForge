import { Link } from "react-router-dom";
import PublicHeader from "../components/PublicHeader";

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-violet-600/10 via-transparent to-cyan-600/10"
        aria-hidden="true"
      />
      <PublicHeader currentPage="features" subtitle="Características" />

      {/* Hero */}
      <section className="relative max-w-7xl mx-auto px-6 pt-10 pb-6">
        <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-[32px] p-8 md:p-12 relative overflow-hidden">
          <div
            className="absolute -top-24 -right-24 h-80 w-80 rounded-full blur-3xl opacity-40"
            style={{ background: "radial-gradient(circle at 30% 30%, #a855f7 0%, transparent 60%)" }}
          />
          <h1 className="text-4xl md:text-5xl font-black leading-tight text-white">
            Todo lo que necesitas para estudiar <span className="text-violet-400">mejor y más rápido</span>
          </h1>
          <p className="mt-4 text-white/60 max-w-3xl">
            Herramientas impulsadas por IA para organizar materiales, generar resúmenes claros y evaluar tu progreso con quizzes adaptativos.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <span className="bg-white/10 text-white/80 text-xs px-3 py-1.5 rounded-full">IA responsable</span>
            <span className="bg-white/10 text-white/80 text-xs px-3 py-1.5 rounded-full">Privacidad primero</span>
            <span className="bg-white/10 text-white/80 text-xs px-3 py-1.5 rounded-full">Progreso medible</span>
          </div>
        </div>
      </section>

      {/* Grid de características principales */}
      <section className="relative max-w-7xl mx-auto px-6 pt-6">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <article className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6">
            <div className="text-violet-400 text-sm font-semibold">01</div>
            <h3 className="mt-1 text-xl font-bold text-white">Ingesta de documentos</h3>
            <p className="mt-2 text-white/60">Carga PDF, Word o texto. Normalizamos y preparamos el contenido para su análisis.</p>
          </article>

          <article className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6">
            <div className="text-violet-400 text-sm font-semibold">02</div>
            <h3 className="mt-1 text-xl font-bold text-white">Resúmenes claros</h3>
            <p className="mt-2 text-white/60">Síntesis en distintos niveles de detalle (bullet, párrafo, TL;DR), listos para repasar.</p>
          </article>

          <article className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6">
            <div className="text-violet-400 text-sm font-semibold">03</div>
            <h3 className="mt-1 text-xl font-bold text-white">Mapas y conceptos clave</h3>
            <p className="mt-2 text-white/60">Extracción de conceptos, glosarios y vínculos para entender mejor la materia.</p>
          </article>

          <article className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6">
            <div className="text-violet-400 text-sm font-semibold">04</div>
            <h3 className="mt-1 text-xl font-bold text-white">Quizzes adaptativos</h3>
            <p className="mt-2 text-white/60">Preguntas que ajustan dificultad según tu rendimiento, con feedback inmediato.</p>
          </article>

          <article className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6">
            <div className="text-violet-400 text-sm font-semibold">05</div>
            <h3 className="mt-1 text-xl font-bold text-white">Panel de progreso</h3>
            <p className="mt-2 text-white/60">Métricas de avance, brechas de conocimiento y recomendaciones de estudio.</p>
          </article>

          <article className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6">
            <div className="text-violet-400 text-sm font-semibold">06</div>
            <h3 className="mt-1 text-xl font-bold text-white">Seguridad y privacidad</h3>
            <p className="mt-2 text-white/60">Datos cifrados en tránsito, controles de acceso y buenas prácticas de compliance.</p>
          </article>
        </div>
      </section>

      {/* Cómo funciona (pasos) */}
      <section className="relative max-w-7xl mx-auto px-6 pt-10">
        <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6 md:p-8">
          <h2 className="text-2xl font-extrabold text-white">¿Cómo funciona?</h2>
          <ol className="mt-6 grid md:grid-cols-4 gap-6">
            <li className="rounded-xl bg-white/5 p-4">
              <div className="text-sm text-violet-400 font-semibold">Paso 1</div>
              <div className="font-bold mt-1 text-white">Sube tus archivos</div>
              <p className="text-white/60 text-sm mt-1">PDF, Word o texto plano.</p>
            </li>
            <li className="rounded-xl bg-white/5 p-4">
              <div className="text-sm text-violet-400 font-semibold">Paso 2</div>
              <div className="font-bold mt-1 text-white">Analiza & extrae</div>
              <p className="text-white/60 text-sm mt-1">Se segmenta y detectan conceptos.</p>
            </li>
            <li className="rounded-xl bg-white/5 p-4">
              <div className="text-sm text-violet-400 font-semibold">Paso 3</div>
              <div className="font-bold mt-1 text-white">Genera materiales</div>
              <p className="text-white/60 text-sm mt-1">Resúmenes y glosarios listos.</p>
            </li>
            <li className="rounded-xl bg-white/5 p-4">
              <div className="text-sm text-violet-400 font-semibold">Paso 4</div>
              <div className="font-bold mt-1 text-white">Evalúa y mejora</div>
              <p className="text-white/60 text-sm mt-1">Quizzes adaptativos + dashboard.</p>
            </li>
          </ol>
        </div>
      </section>

      {/* Comparativa */}
      <section className="relative max-w-7xl mx-auto px-6 pt-10">
        <h2 className="text-2xl font-extrabold text-white mb-4">¿Por qué StudyForge?</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6">
            <h3 className="font-bold text-white">Herramientas tradicionales</h3>
            <ul className="mt-3 text-white/60 space-y-2 text-sm">
              <li>• Resúmenes manuales y lentos</li>
              <li>• Evaluaciones genéricas</li>
              <li>• Sin trazabilidad del progreso</li>
            </ul>
          </div>
          <div className="bg-white/5 border border-violet-400/30 backdrop-blur-xl rounded-2xl p-6">
            <h3 className="font-bold text-white">StudyForge</h3>
            <ul className="mt-3 text-white/60 space-y-2 text-sm">
              <li>• Resúmenes automáticos y claros</li>
              <li>• Quizzes que se adaptan a ti</li>
              <li>• Panel con métricas y recomendaciones</li>
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="relative max-w-7xl mx-auto px-6 pt-10">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6">
            <h3 className="font-bold text-white">¿Puedo usar mis propios materiales?</h3>
            <p className="mt-2 text-white/60 text-sm">Sí. Sube PDFs, .docx o texto; la plataforma los procesa automáticamente.</p>
          </div>
          <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6">
            <h3 className="font-bold text-white">¿Qué tan privados están mis datos?</h3>
            <p className="mt-2 text-white/60 text-sm">Implementamos cifrado en tránsito y controles de acceso por rol.</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative max-w-7xl mx-auto px-6 pt-10 pb-16">
        <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h2 className="text-xl md:text-2xl font-extrabold text-white">¿Listo para probar StudyForge?</h2>
            <p className="text-white/60 mt-1">Únete a la beta y recibe noticias de lanzamiento.</p>
          </div>
          <Link to="/signup" className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl px-5 py-3 font-semibold transition-colors">Crear cuenta</Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-8 text-sm text-white/60 text-center">
          <span>© {new Date().getFullYear()} StudyForge. Todos los derechos reservados.</span>
        </div>
      </footer>
    </div>
  );
}
