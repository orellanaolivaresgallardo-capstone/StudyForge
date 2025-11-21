import { Link } from "react-router-dom";
import PublicHeader from "../components/PublicHeader";

export default function AboutUsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-violet-600/10 via-transparent to-cyan-600/10"
        aria-hidden="true"
      />
      <PublicHeader currentPage="aboutus" subtitle="Asistente de estudio con IA" />

      {/* Hero */}
      <section className="relative max-w-7xl mx-auto px-6 pt-10 pb-6">
        <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-[32px] p-8 md:p-12 relative overflow-hidden">
          <div
            className="absolute -top-24 -right-24 h-80 w-80 rounded-full blur-3xl opacity-40"
            style={{ background: "radial-gradient(circle at 30% 30%, #a855f7 0%, transparent 60%)" }}
          />
          <h1 className="text-4xl md:text-5xl font-black leading-tight text-white">
            Conoce al equipo detrás de la <span className="text-violet-400">nueva experiencia</span> de estudio con IA
          </h1>
          <p className="mt-4 text-white/60 max-w-3xl">
            Combinamos ingeniería, diseño y pedagogía para crear herramientas que convierten información compleja
            en aprendizaje claro y medible.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <span className="bg-white/10 text-white/80 text-xs px-3 py-1.5 rounded-full">IA responsable</span>
            <span className="bg-white/10 text-white/80 text-xs px-3 py-1.5 rounded-full">Diseño centrado en el estudiante</span>
            <span className="bg-white/10 text-white/80 text-xs px-3 py-1.5 rounded-full">Evidencia y métricas</span>
          </div>
        </div>
      </section>

      {/* Misión / Visión / Principios */}
      <section className="relative max-w-7xl mx-auto px-6 pt-4">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white">Nuestra misión</h3>
            <p className="mt-2 text-white/60">
              Democratizar el aprendizaje con tecnología que resuma, explique y evalúe de forma adaptativa, cuidando la privacidad.
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white">Nuestra visión</h3>
            <p className="mt-2 text-white/60">
              Ser la plataforma que convierte materiales dispersos en rutas de estudio personalizadas y medibles en todo LATAM.
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white">Nuestros principios</h3>
            <ul className="mt-2 space-y-2 text-white/60">
              <li>• Claridad por sobre complejidad</li>
              <li>• Seguridad y transparencia</li>
              <li>• Iteración continua guiada por datos</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Hitos */}
      <section className="relative max-w-7xl mx-auto px-6 pt-10">
        <h2 className="text-2xl font-extrabold text-white mb-4">Nuestro camino</h2>
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6">
            <div className="text-violet-400 text-sm font-semibold">2025 — Q1</div>
            <h4 className="mt-1 font-bold text-white">Prototipo y walking skeleton</h4>
            <p className="mt-2 text-white/60">Carga de documentos, resúmenes base y demo funcional.</p>
          </div>
          <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6">
            <div className="text-violet-400 text-sm font-semibold">2025 — Q2</div>
            <h4 className="mt-1 font-bold text-white">Quizzes adaptativos</h4>
            <p className="mt-2 text-white/60">Banco dinámico de preguntas y métricas de progreso.</p>
          </div>
          <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6">
            <div className="text-violet-400 text-sm font-semibold">2025 — Q3</div>
            <h4 className="mt-1 font-bold text-white">Escalamiento y seguridad</h4>
            <p className="mt-2 text-white/60">Roles, cifrado en tránsito y despliegue en la nube.</p>
          </div>
        </div>
      </section>

      {/* Equipo */}
      <section className="relative max-w-7xl mx-auto px-6 pt-10">
        <h2 className="text-2xl font-extrabold text-white mb-6">Equipo</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <article className="relative overflow-hidden rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl p-6">
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
                <h3 className="font-semibold text-white">Martín Orellana</h3>
                <p className="text-white/60 text-sm">Backend Developer & Product Owner</p>
              </div>
            </div>
            <ul className="mt-4 text-sm text-white/60 space-y-1">
              <li>• API segura y trazabilidad</li>
              <li>• Integración con BD y storage</li>
            </ul>
          </article>

          <article className="relative overflow-hidden rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl p-6">
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
                <h3 className="font-semibold text-white">Luis Olivarez</h3>
                <p className="text-white/60 text-sm">Frontend Developer</p>
              </div>
            </div>
            <ul className="mt-4 text-sm text-white/60 space-y-1">
              <li>• UI accesible y responsiva</li>
              <li>• Performance y DX</li>
            </ul>
          </article>

          <article className="relative overflow-hidden rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl p-6">
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
                <h3 className="font-semibold text-white">Sebastián Gallardo</h3>
                <p className="text-white/60 text-sm">IA Developer & Scrum Master</p>
              </div>
            </div>
            <ul className="mt-4 text-sm text-white/60 space-y-1">
              <li>• Resúmenes y generación</li>
              <li>• Evaluaciones adaptativas</li>
            </ul>
          </article>
        </div>
      </section>

      {/* Stats + CTA */}
      <section className="relative max-w-7xl mx-auto px-6 pt-10 pb-16">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white">Impacto</h3>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-3xl font-black text-violet-400">3x</div>
                <div className="text-xs text-white/60">Velocidad de estudio</div>
              </div>
              <div>
                <div className="text-3xl font-black text-violet-400">90%</div>
                <div className="text-xs text-white/60">Comprensión promedio</div>
              </div>
              <div>
                <div className="text-3xl font-black text-violet-400">24/7</div>
                <div className="text-xs text-white/60">Disponibilidad</div>
              </div>
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-bold text-white">¿Te sumas?</h3>
              <p className="mt-2 text-white/60">Buscamos testers de la beta y alianzas con instituciones.</p>
            </div>
            <div className="mt-4">
              <Link to="/signup" className="inline-block bg-violet-600 hover:bg-violet-700 text-white rounded-xl px-5 py-3 font-semibold transition-colors">
                Crear cuenta
              </Link>
            </div>
          </div>
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
