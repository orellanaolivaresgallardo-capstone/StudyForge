// frontend/src/components/PublicHeader.tsx
/**
 * Shared header component for public pages (landing, features, about us).
 * Provides consistent navigation with mobile menu support.
 */
import { Link } from "react-router-dom";
import { useState } from "react";

interface PublicHeaderProps {
  /** Current active page for highlighting navigation */
  currentPage: "home" | "features" | "aboutus";
  /** Optional subtitle to show next to logo */
  subtitle?: string;
}

export default function PublicHeader({ currentPage, subtitle }: PublicHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mt-0 mb-4 glass card rounded-2xl px-4 sm:px-6 py-3 flex items-center justify-between">
          {/* Logo and subtitle */}
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 rounded-full bg-gradient-to-br from-fuchsia-500 to-violet-600 ring-2 ring-white/10" />
            <span className="font-bold tracking-tight">StudyForge</span>
            {subtitle && (
              <span className="hidden sm:inline text-xs text-slate-300/80 ml-2 pill px-2 py-0.5 rounded-full bg-white/10">
                {subtitle}
              </span>
            )}
          </div>

          {/* Desktop navigation */}
          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-300">
            <Link
              to="/"
              className={currentPage === "home" ? "text-white font-semibold" : "hover:text-white"}
            >
              Inicio
            </Link>
            <Link
              to="/features"
              className={currentPage === "features" ? "text-white font-semibold" : "hover:text-white"}
            >
              Características
            </Link>
            <Link
              to="/aboutus"
              className={currentPage === "aboutus" ? "text-white font-semibold" : "hover:text-white"}
            >
              Sobre nosotros
            </Link>
          </nav>

          {/* Auth buttons + Mobile menu toggle */}
          <div className="flex items-center gap-2">
            <Link
              to="/signup"
              className="hidden sm:inline rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 px-3 py-1.5 text-sm transition-colors"
            >
              Crear cuenta
            </Link>
            <Link
              to="/login"
              className="rounded-xl bg-violet-600 hover:bg-violet-700 text-white px-3.5 py-1.5 text-sm font-medium transition-colors"
            >
              Ingresar
            </Link>
            <button
              type="button"
              className="md:hidden p-2 rounded-lg bg-white/10 hover:bg-white/15 text-white"
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden mb-2">
            <div className="glass card rounded-2xl px-4 py-3 space-y-2">
              <Link
                to="/"
                className="block px-3 py-2 rounded-lg text-sm hover:bg-white/10"
                onClick={() => setMobileMenuOpen(false)}
              >
                Inicio
              </Link>
              <Link
                to="/features"
                className="block px-3 py-2 rounded-lg text-sm hover:bg-white/10"
                onClick={() => setMobileMenuOpen(false)}
              >
                Características
              </Link>
              <Link
                to="/aboutus"
                className="block px-3 py-2 rounded-lg text-sm hover:bg-white/10"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sobre nosotros
              </Link>
              <div className="pt-2 border-t border-white/10 flex flex-col gap-2">
                <Link
                  to="/signup"
                  className="rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 px-3 py-2 text-center text-sm transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Crear cuenta
                </Link>
                <Link
                  to="/login"
                  className="rounded-xl bg-violet-600 hover:bg-violet-700 text-white px-3 py-2 text-center text-sm font-medium transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Ingresar
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
