// frontend/src/components/Navbar.tsx
/**
 * Barra de navegación con estado autenticado y quota widget.
 * Muestra diferentes opciones según el estado de autenticación del usuario.
 */
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import QuotaWidget from "./QuotaWidget";

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    navigate("/");
  };

  return (
    <nav className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            to={isAuthenticated ? "/documents" : "/"}
            className="flex items-center gap-2 group"
          >
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg group-hover:shadow-purple-500/50 transition-shadow">
              <span className="text-white font-bold text-sm">SF</span>
            </div>
            <span className="text-xl font-extrabold text-white tracking-tight">
              StudyForge
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {isAuthenticated ? (
              <>
                {/* Authenticated Navigation */}
                <Link
                  to="/documents"
                  className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
                >
                  Documentos
                </Link>
                <Link
                  to="/summaries"
                  className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
                >
                  Resúmenes
                </Link>

                {/* Quota Widget (compact mode) */}
                <QuotaWidget compact className="min-w-[200px]" />

                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 transition-colors"
                  >
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {user?.username?.charAt(0).toUpperCase() || "U"}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-white max-w-[100px] truncate">
                      {user?.username || "Usuario"}
                    </span>
                    <svg
                      className={`w-4 h-4 text-slate-400 transition-transform ${showUserMenu ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {showUserMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowUserMenu(false)}
                      ></div>
                      <div className="absolute right-0 mt-2 w-56 bg-slate-800/95 backdrop-blur-md rounded-xl border border-slate-700/50 shadow-2xl shadow-black/50 z-20">
                        <div className="p-3 border-b border-slate-700/50">
                          <p className="text-sm font-semibold text-white truncate">
                            {user?.username}
                          </p>
                          <p className="text-xs text-slate-400 truncate">
                            {user?.email}
                          </p>
                        </div>
                        <div className="p-2">
                          <Link
                            to="/profile"
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-700/50 hover:text-white transition-colors"
                            onClick={() => setShowUserMenu(false)}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            Mi perfil
                          </Link>
                          <Link
                            to="/settings"
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-700/50 hover:text-white transition-colors"
                            onClick={() => setShowUserMenu(false)}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Configuración
                          </Link>
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Cerrar sesión
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Unauthenticated Navigation */}
                <Link
                  to="/"
                  className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
                >
                  Inicio
                </Link>
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/50 border border-slate-700/50 transition-colors"
                >
                  Iniciar sesión
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40"
                >
                  Crear cuenta
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="md:hidden p-2 rounded-lg text-slate-300 hover:bg-slate-800/50 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {showMobileMenu ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden py-4 border-t border-slate-700/50">
            {isAuthenticated ? (
              <div className="space-y-3">
                <QuotaWidget compact={false} className="mb-4" />
                <Link
                  to="/documents"
                  className="block px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800/50 hover:text-white transition-colors"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Documentos
                </Link>
                <Link
                  to="/summaries"
                  className="block px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800/50 hover:text-white transition-colors"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Resúmenes
                </Link>
                <Link
                  to="/profile"
                  className="block px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800/50 hover:text-white transition-colors"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Mi perfil
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setShowMobileMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-colors"
                >
                  Cerrar sesión
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <Link
                  to="/"
                  className="block px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800/50 hover:text-white transition-colors"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Inicio
                </Link>
                <Link
                  to="/login"
                  className="block px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800/50 hover:text-white transition-colors"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Iniciar sesión
                </Link>
                <Link
                  to="/signup"
                  className="block px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transition-all text-center"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Crear cuenta
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
