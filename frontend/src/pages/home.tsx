import { Link } from "react-router-dom";

const heroImg = "/img/robot.png";

export default function Home() {
  const year = new Date().getFullYear();

  return (
    <div className="hero-bg text-white/90 antialiased min-h-screen flex flex-col relative overflow-hidden">
      <div aria-hidden className="absolute inset-0 grid-overlay" />
      <div className="flex-1 flex flex-col" id="landing">
        <header className="max-w-7xl mx-auto px-6 pt-8 w-full">
          <nav className="glass rounded-2xl shadow-glass px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-8 w-8 rounded-full bg-brand-500/90 ring-8 ring-brand-500/20" />
              <span className="font-extrabold tracking-tight text-white">StudyForge</span>
              <span className="hidden sm:inline text-white/40 text-sm ml-2">Asistente de estudio con IA</span>
            </div>
            <ul className="hidden md:flex items-center gap-6 text-sm text-white">
              <li>
                <Link className="hover:text-white/90" to="/">
                  Inicio
                </Link>
              </li>
              <li>
                <Link className="hover:text-white/90" to="/features">
                  Características
                </Link>
              </li>
              <li>
                <Link className="hover:text-white/90" to="/about">
                  Sobre nosotros
                </Link>
              </li>
            </ul>
            <div className="flex items-center gap-2">
              <Link to="/signup" className="hidden sm:inline px-4 py-2 rounded-xl glass text-white">
                Crear cuenta
              </Link>
              <Link to="/login" className="px-4 py-2 rounded-xl bg-brand-500 btn-glow text-white">
                Ingresar
              </Link>
            </div>
          </nav>
        </header>

        <main className="flex-1 w-full">
          <div className="max-w-7xl mx-auto px-6 mt-10 md:mt-16">
            <section className="frame p-6 md:p-10 lg:p-14">
              <div className="grid lg:grid-cols-2 gap-10 items-center">
                <div>
                  <h1 className="text-4xl md:text-6xl font-extrabold leading-tight tracking-tight text-center md:text-left">
                    Prepárate para una <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-white">nueva era</span> de estudio con IA
                  </h1>
                  <p className="mt-5 text-white/70 max-w-xl mx-auto md:mx-0 text-center md:text-left">
                    Sube tus documentos, obtén <span className="text-white">resúmenes claros</span> y genera <span className="text-white">quizzes adaptativos</span> según tu progreso. Feedback inmediato y tu avance siempre guardado.
                  </p>
                  <ul className="mt-6 grid sm:grid-cols-2 gap-3 text-sm text-white/70 max-w-xl mx-auto md:mx-0">
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-brand-400" /> Carga PDF, Word y texto
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-brand-400" /> Resúmenes automáticos
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-brand-400" /> Evaluaciones adaptativas
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-brand-400" /> Estadísticas y progreso
                    </li>
                  </ul>
                </div>
                <div className="relative">
                  <div className="absolute -inset-6 md:-inset-10 -z-10 rounded-[2rem] bg-gradient-to-tr from-brand-500/20 via-transparent to-sky-400/20 blur-2xl" />
                  <img src={heroImg} alt="Asistente StudyForge" className="w-full max-w-lg mx-auto rounded-3xl shadow-2xl" />
                </div>
              </div>
            </section>

            <section id="features" className="mt-12 grid md:grid-cols-3 gap-6">
              <div className="glass rounded-2xl p-6">
                <h3 className="font-semibold mb-1">Sube y organiza</h3>
                <p className="text-sm text-white/70">Procesa archivos y centraliza tu material de estudio.</p>
              </div>
              <div className="glass rounded-2xl p-6">
                <h3 className="font-semibold mb-1">Resúmenes precisos</h3>
                <p className="text-sm text-white/70">Explicaciones claras y sintetizadas por IA.</p>
              </div>
              <div className="glass rounded-2xl p-6">
                <h3 className="font-semibold mb-1">Quizzes adaptativos</h3>
                <p className="text-sm text-white/70">La dificultad se ajusta a tu rendimiento.</p>
              </div>
            </section>
          </div>
        </main>

        <footer className="max-w-7xl mx-auto px-6 py-10 text-sm text-white/50">
          © {year} StudyForge. Todos los derechos reservados.
        </footer>
      </div>
    </div>
  );
}
