// import React from "react"; // Removed unused import

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-[#1f1b3a] text-slate-100 grid-bg">
      {/* Header */}
      <header className="sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mt-6 mb-4 glass card rounded-2xl px-4 sm:px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-6 w-6 rounded-full bg-gradient-to-br from-fuchsia-500 to-violet-600 ring-2 ring-white/10" />
              <span className="font-bold tracking-tight">StudyForge</span>
              <span className="hidden sm:inline text-xs text-slate-300/80 ml-2 pill px-2 py-0.5 rounded-full bg-white/10">Características</span>
            </div>
            <nav className="hidden md:flex items-center gap-6 text-sm text-slate-300">
              <a href="index.html" className="hover:text-white">Inicio</a>
              <a href="aboutus.html" className="hover:text-white">Sobre nosotros</a>
              <a href="features.html" className="text-white font-semibold">Características</a>
            </nav>
            <div className="flex items-center gap-2">
              <a href="signup.html" className="hidden sm:inline rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 px-3 py-1.5 text-sm">Crear cuenta</a>
              <a href="login.html" className="rounded-xl btn px-3.5 py-1.5 text-sm font-medium">Ingresar</a>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 pt-10 pb-6">
        <div className="glass card rounded-[32px] p-8 md:p-12 relative overflow-hidden">
          <div
            className="absolute -top-24 -right-24 h-80 w-80 rounded-full blur-3xl opacity-40"
            style={{ background: "radial-gradient(circle at 30% 30%, #a855f7 0%, transparent 60%)" }}
          />
          <h1 className="text-4xl md:text-5xl font-black leading-tight">
            Todo lo que necesitas para estudiar <span className="text-fuchsia-300">mejor y más rápido</span>
          </h1>
          <p className="mt-4 text-slate-300 max-w-3xl">
            Herramientas impulsadas por IA para organizar materiales, generar resúmenes claros y evaluar tu progreso con quizzes adaptativos.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <span className="pill bg-white/10 text-slate-200 text-xs px-3 py-1.5 rounded-full">IA responsable</span>
            <span className="pill bg-white/10 text-slate-200 text-xs px-3 py-1.5 rounded-full">Privacidad primero</span>
            <span className="pill bg-white/10 text-slate-200 text-xs px-3 py-1.5 rounded-full">Progreso medible</span>
          </div>
        </div>
      </section>

      {/* Grid de características principales */}
      <section className="max-w-7xl mx-auto px-6 pt-6">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <article className="glass card rounded-2xl p-6">
            <div className="text-fuchsia-300 text-sm font-semibold">01</div>
            <h3 className="mt-1 text-xl font-bold">Ingesta de documentos</h3>
            <p className="mt-2 text-slate-300">Carga PDF, Word o texto. Normalizamos y preparamos el contenido para su análisis.</p>
          </article>

          <article className="glass card rounded-2xl p-6">
            <div className="text-fuchsia-300 text-sm font-semibold">02</div>
            <h3 className="mt-1 text-xl font-bold">Resúmenes claros</h3>
            <p className="mt-2 text-slate-300">Síntesis en distintos niveles de detalle (bullet, párrafo, TL;DR), listos para repasar.</p>
          </article>

          <article className="glass card rounded-2xl p-6">
            <div className="text-fuchsia-300 text-sm font-semibold">03</div>
            <h3 className="mt-1 text-xl font-bold">Mapas y conceptos clave</h3>
            <p className="mt-2 text-slate-300">Extracción de conceptos, glosarios y vínculos para entender mejor la materia.</p>
          </article>

          <article className="glass card rounded-2xl p-6">
            <div className="text-fuchsia-300 text-sm font-semibold">04</div>
            <h3 className="mt-1 text-xl font-bold">Quizzes adaptativos</h3>
            <p className="mt-2 text-slate-300">Preguntas que ajustan dificultad según tu rendimiento, con feedback inmediato.</p>
          </article>

          <article className="glass card rounded-2xl p-6">
            <div className="text-fuchsia-300 text-sm font-semibold">05</div>
            <h3 className="mt-1 text-xl font-bold">Panel de progreso</h3>
            <p className="mt-2 text-slate-300">Métricas de avance, brechas de conocimiento y recomendaciones de estudio.</p>
          </article>

          <article className="glass card rounded-2xl p-6">
            <div className="text-fuchsia-300 text-sm font-semibold">06</div>
            <h3 className="mt-1 text-xl font-bold">Seguridad y privacidad</h3>
            <p className="mt-2 text-slate-300">Datos cifrados en tránsito, controles de acceso y buenas prácticas de compliance.</p>
          </article>
        </div>
      </section>

      {/* Cómo funciona (pasos) */}
      <section className="max-w-7xl mx-auto px-6 pt-10">
        <div className="glass card rounded-2xl p-6 md:p-8">
          <h2 className="text-2xl font-extrabold">¿Cómo funciona?</h2>
          <ol className="mt-6 grid md:grid-cols-4 gap-6">
            <li className="rounded-xl bg-white/5 p-4">
              <div className="text-sm text-fuchsia-300 font-semibold">Paso 1</div>
              <div className="font-bold mt-1">Sube tus archivos</div>
              <p className="text-slate-300 text-sm mt-1">PDF, Word o texto plano.</p>
            </li>
            <li className="rounded-xl bg-white/5 p-4">
              <div className="text-sm text-fuchsia-300 font-semibold">Paso 2</div>
              <div className="font-bold mt-1">Analiza & extrae</div>
              <p className="text-slate-300 text-sm mt-1">Se segmenta y detectan conceptos.</p>
            </li>
            <li className="rounded-xl bg-white/5 p-4">
              <div className="text-sm text-fuchsia-300 font-semibold">Paso 3</div>
              <div className="font-bold mt-1">Genera materiales</div>
              <p className="text-slate-300 text-sm mt-1">Resúmenes y glosarios listos.</p>
            </li>
            <li className="rounded-xl bg-white/5 p-4">
              <div className="text-sm text-fuchsia-300 font-semibold">Paso 4</div>
              <div className="font-bold mt-1">Evalúa y mejora</div>
              <p className="text-slate-300 text-sm mt-1">Quizzes adaptativos + dashboard.</p>
            </li>
          </ol>
        </div>
      </section>

      {/* Comparativa */}
      <section className="max-w-7xl mx-auto px-6 pt-10">
        <h2 className="text-2xl font-extrabold mb-4">¿Por qué StudyForge?</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="glass card rounded-2xl p-6">
            <h3 className="font-bold">Herramientas tradicionales</h3>
            <ul className="mt-3 text-slate-300 space-y-2 text-sm">
              <li>• Resúmenes manuales y lentos</li>
              <li>• Evaluaciones genéricas</li>
              <li>• Sin trazabilidad del progreso</li>
            </ul>
          </div>
          <div className="glass card rounded-2xl p-6 border border-fuchsia-400/20">
            <h3 className="font-bold">StudyForge</h3>
            <ul className="mt-3 text-slate-2 00 space-y-2 text-sm">
              <li>• Resúmenes automáticos y claros</li>
              <li>• Quizzes que se adaptan a ti</li>
              <li>• Panel con métricas y recomendaciones</li>
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-7xl mx-auto px-6 pt-10">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="glass card rounded-2xl p-6">
            <h3 className="font-bold">¿Puedo usar mis propios materiales?</h3>
            <p className="mt-2 text-slate-300 text-sm">Sí. Sube PDFs, .docx o texto; la plataforma los procesa automáticamente.</p>
          </div>
          <div className="glass card rounded-2xl p-6">
            <h3 className="font-bold">¿Qué tan privados están mis datos?</h3>
            <p className="mt-2 text-slate-300 text-sm">Implementamos cifrado en tránsito y controles de acceso por rol.</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 pt-10 pb-16">
        <div className="glass card rounded-2xl p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h2 className="text-xl md:text-2xl font-extrabold">¿Listo para probar StudyForge?</h2>
            <p className="text-slate-300 mt-1">Únete a la beta y recibe noticias de lanzamiento.</p>
          </div>
          <a href="signup.html" className="btn rounded-xl px-5 py-3 font-semibold">Crear cuenta</a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-8 text-sm text-slate-400 flex items-center justify-between">
          <span>© 2025 StudyForge</span>
          <div className="flex gap-4">
            <a href="#" className="hover:text-slate-200">Privacidad</a>
            <a href="#" className="hover:text-slate-200">Términos</a>
          </div>
        </div>
      </footer>

      {/* Utilidades locales */}
      <style>{`
        :root { color-scheme: dark; }
        .grid-bg{
          background-image:
            radial-gradient(rgba(255,255,255,.06) 1px, transparent 1px),
            linear-gradient(180deg, rgba(255,255,255,.04), transparent 12%),
            linear-gradient(0deg, rgba(0,0,0,.25), rgba(0,0,0,.25));
          background-size:20px 20px,100% 100%,100% 100%;
          background-position:-10px -10px,0 0,0 0;
        }
        .glass{ background:linear-gradient(180deg, rgba(255,255,255,.09), rgba(255,255,255,.04)); }
        .card{ box-shadow:0 10px 30px rgba(0,0,0,.40), inset 0 1px 0 rgba(255,255,255,.06); }
        .btn{ background:linear-gradient(90deg,#7c3aed,#a855f7); }
        .btn:hover{ filter:brightness(1.06); }
        .pill{ box-shadow:inset 0 1px 0 rgba(255,255,255,.25); }
      `}</style>
    </div>
  );
}
