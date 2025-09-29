// src/pages/AboutUsPage.tsx
// Requiere Tailwind configurado. No es necesario importar React con JSX moderno.
export default function AboutUsPage() {
  return (
    <div className="min-h-screen bg-[#1f1b3a] text-slate-100 grid-bg">
      {/* Header */}
      <header className="sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mt-6 mb-4 glass card rounded-2xl px-4 sm:px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-6 w-6 rounded-full bg-gradient-to-br from-fuchsia-500 to-violet-600 ring-2 ring-white/10" />
              <span className="font-bold tracking-tight">StudyForge</span>
              <span className="hidden sm:inline text-xs text-slate-300/80 ml-2 pill px-2 py-0.5 rounded-full bg-white/10">
                Asistente de estudio con IA
              </span>
            </div>
            <nav className="hidden md:flex items-center gap-6 text-sm text-slate-300">
              <a href="index.html" className="hover:text-white">Inicio</a>
              <a href="aboutus.html" className="text-white font-semibold">Sobre nosotros</a>
              <a href="features.html" className="hover:text-white">Características</a>
            </nav>
            <div className="flex items-center gap-2">
              <a
                href="signup.html"
                className="hidden sm:inline rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 px-3 py-1.5 text-sm"
              >
                Crear cuenta
              </a>
              <a
                href="login.html"
                className="rounded-xl btn-primary px-3.5 py-1.5 text-sm font-medium"
              >
                Ingresar
              </a>
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
            Conoce al equipo detrás de la <span className="text-fuchsia-300">nueva experiencia</span> de estudio con IA
          </h1>
          <p className="mt-4 text-slate-300 max-w-3xl">
            Combinamos ingeniería, diseño y pedagogía para crear herramientas que convierten información compleja
            en aprendizaje claro y medible.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <span className="pill bg-white/10 text-slate-200 text-xs px-3 py-1.5 rounded-full">IA responsable</span>
            <span className="pill bg-white/10 text-slate-200 text-xs px-3 py-1.5 rounded-full">Diseño centrado en el estudiante</span>
            <span className="pill bg-white/10 text-slate-200 text-xs px-3 py-1.5 rounded-full">Evidencia y métricas</span>
          </div>
        </div>
      </section>

      {/* Misión / Visión / Principios */}
      <section className="max-w-7xl mx-auto px-6 pt-4">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="glass card rounded-2xl p-6">
            <h3 className="text-xl font-bold">Nuestra misión</h3>
            <p className="mt-2 text-slate-300">
              Democratizar el aprendizaje con tecnología que resuma, explique y evalúe de forma adaptativa, cuidando la privacidad.
            </p>
          </div>
          <div className="glass card rounded-2xl p-6">
            <h3 className="text-xl font-bold">Nuestra visión</h3>
            <p className="mt-2 text-slate-300">
              Ser la plataforma que convierte materiales dispersos en rutas de estudio personalizadas y medibles en todo LATAM.
            </p>
          </div>
          <div className="glass card rounded-2xl p-6">
            <h3 className="text-xl font-bold">Nuestros principios</h3>
            <ul className="mt-2 space-y-2 text-slate-300">
              <li>• Claridad por sobre complejidad</li>
              <li>• Seguridad y transparencia</li>
              <li>• Iteración continua guiada por datos</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Hitos */}
      <section className="max-w-7xl mx-auto px-6 pt-10">
        <h2 className="text-2xl font-extrabold mb-4">Nuestro camino</h2>
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="glass card rounded-2xl p-6">
            <div className="text-fuchsia-300 text-sm font-semibold">2025 — Q1</div>
            <h4 className="mt-1 font-bold">Prototipo y walking skeleton</h4>
            <p className="mt-2 text-slate-300">Carga de documentos, resúmenes base y demo funcional.</p>
          </div>
          <div className="glass card rounded-2xl p-6">
            <div className="text-fuchsia-300 text-sm font-semibold">2025 — Q2</div>
            <h4 className="mt-1 font-bold">Quizzes adaptativos</h4>
            <p className="mt-2 text-slate-300">Banco dinámico de preguntas y métricas de progreso.</p>
          </div>
          <div className="glass card rounded-2xl p-6">
            <div className="text-fuchsia-300 text-sm font-semibold">2025 — Q3</div>
            <h4 className="mt-1 font-bold">Escalamiento y seguridad</h4>
            <p className="mt-2 text-slate-300">Roles, cifrado en tránsito y despliegue en la nube.</p>
          </div>
        </div>
      </section>

      {/* Equipo */}
      <section className="max-w-7xl mx-auto px-6 pt-10">
        <h2 className="text-2xl font-extrabold mb-6">Equipo</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <article className="relative overflow-hidden rounded-2xl glass card p-6">
            <div
              className="absolute -right-10 -top-10 h-40 w-40 rounded-full blur-2xl opacity-40"
              style={{ background: "radial-gradient(circle, #8b5cf6 0%, transparent 60%)" }}
            />
            <div className="flex items-center gap-4">
              <img
                src="/img/Captura de pantalla (107).png"
                alt=""
                className="h-16 w-16 rounded-xl ring-2 ring-white/10 object-cover"
              />
              <div>
                <h3 className="font-semibold">Martín Orellana</h3>
                <p className="text-slate-300 text-sm">Backend Developer & Product Owner</p>
              </div>
            </div>
            <ul className="mt-4 text-sm text-slate-300 space-y-1">
              <li>• API segura y trazabilidad</li>
              <li>• Integración con BD y storage</li>
            </ul>
          </article>

          <article className="relative overflow-hidden rounded-2xl glass card p-6">
            <div
              className="absolute -right-10 -top-10 h-40 w-40 rounded-full blur-2xl opacity-40"
              style={{ background: "radial-gradient(circle, #22d3ee 0%, transparent 60%)" }}
            />
            <div className="flex items-center gap-4">
              <img
                src="/img/Captura de pantalla (109).png"
                alt=""
                className="h-16 w-16 rounded-xl ring-2 ring-white/10 object-cover"
              />
              <div>
                <h3 className="font-semibold">Luis Olivarez</h3>
                <p className="text-slate-300 text-sm">Frontend Developer</p>
              </div>
            </div>
            <ul className="mt-4 text-sm text-slate-300 space-y-1">
              <li>• UI accesible y responsiva</li>
              <li>• Performance y DX</li>
            </ul>
          </article>

          <article className="relative overflow-hidden rounded-2xl glass card p-6">
            <div
              className="absolute -right-10 -top-10 h-40 w-40 rounded-full blur-2xl opacity-40"
              style={{ background: "radial-gradient(circle, #34d399 0%, transparent 60%)" }}
            />
            <div className="flex items-center gap-4">
              <img
                src="/img/Captura de pantalla (108).png"
                alt=""
                className="h-16 w-16 rounded-xl ring-2 ring-white/10 object-cover"
              />
              <div>
                <h3 className="font-semibold">Sebastián Gallardo</h3>
                <p className="text-slate-300 text-sm">IA Developer & Scrum Master</p>
              </div>
            </div>
            <ul className="mt-4 text-sm text-slate-300 space-y-1">
              <li>• Resúmenes y generación</li>
              <li>• Evaluaciones adaptativas</li>
            </ul>
          </article>
        </div>
      </section>

      {/* Stats + CTA */}
      <section className="max-w-7xl mx-auto px-6 pt-10 pb-16">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="glass card rounded-2xl p-6">
            <h3 className="text-xl font-bold">Impacto</h3>
            <div className="mt-4 grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-3xl font-black text-fuchsia-300">3x</div>
                <div className="text-xs text-slate-300">Velocidad de estudio</div>
              </div>
              <div>
                <div className="text-3xl font-black text-fuchsia-300">90%</div>
                <div className="text-xs text-slate-300">Comprensión promedio</div>
              </div>
              <div>
                <div className="text-3xl font-black text-fuchsia-300">24/7</div>
                <div className="text-xs text-slate-300">Disponibilidad</div>
              </div>
            </div>
          </div>
          <div className="glass card rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-bold">¿Te sumas?</h3>
              <p className="mt-2 text-slate-300">Buscamos testers de la beta y alianzas con instituciones.</p>
            </div>
            <div className="mt-4">
              <a href="mailto:contacto@studyforge.dev" className="inline-block btn-primary rounded-xl px-5 py-3 font-semibold">
                Escríbenos
              </a>
            </div>
          </div>
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

      {/* Utilidades locales (mismas que tu HTML) */}
      <style>{`
        :root { color-scheme: dark; }
        .grid-bg {
          background-image:
            radial-gradient( rgba(255,255,255,.06) 1px, transparent 1px ),
            linear-gradient(180deg, rgba(255,255,255,.04), transparent 12%),
            linear-gradient(0deg, rgba(0,0,0,.25), rgba(0,0,0,.25));
          background-size: 20px 20px, 100% 100%, 100% 100%;
          background-position: -10px -10px, 0 0, 0 0;
        }
        .glass { background: linear-gradient(180deg, rgba(255,255,255,.09), rgba(255,255,255,.04)); }
        .card { box-shadow: 0 10px 30px rgba(0,0,0,.40), inset 0 1px 0 rgba(255,255,255,.06); }
        .btn-primary { background: linear-gradient(90deg, #7c3aed, #a855f7); }
        .btn-primary:hover { filter: brightness(1.05); }
        .pill { box-shadow: inset 0 1px 0 rgba(255,255,255,.25); }
      `}</style>
    </div>
  );
}
