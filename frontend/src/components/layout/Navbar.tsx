// frontend/src/components/layout/Navbar.tsx
/**
 * Navbar - REFACTORED VERSION
 * Reduced from 284 → ~110 lines using extracted components
 */
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { QuotaWidget } from "@/components";
import { NavLinks, UserMenu, MobileMenu } from "./components";

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
    <nav className="sticky top-0 z-50 glass card border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo - Left */}
          <Link
            to={isAuthenticated ? "/documents" : "/"}
            className="flex items-center gap-2 group"
          >
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-fuchsia-500 to-violet-600 ring-2 ring-white/10">
              <span className="text-white font-bold text-sm flex items-center justify-center h-full">
                SF
              </span>
            </div>
            <span className="text-xl font-extrabold text-white tracking-tight">
              StudyForge
            </span>
          </Link>

          {/* Desktop Navigation - Center */}
          {isAuthenticated ? (
            <div className="hidden md:flex items-center gap-6 flex-1 justify-center">
              <NavLinks variant="desktop" />
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-6 flex-1 justify-center">
              <Link
                to="/"
                className="text-sm font-semibold text-slate-100 hover:text-white hover:bg-white/10 px-3 py-2 rounded-lg transition-all"
              >
                Inicio
              </Link>
            </div>
          )}

          {/* Right Section */}
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <div className="hidden md:flex items-center gap-4">
                <QuotaWidget compact className="min-w-[200px]" />
                <UserMenu
                  username={user?.username || "Usuario"}
                  email={user?.email || ""}
                  isOpen={showUserMenu}
                  onToggle={() => setShowUserMenu(!showUserMenu)}
                  onClose={() => setShowUserMenu(false)}
                  onLogout={handleLogout}
                />
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-4">
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-100 hover:text-white hover:bg-white/10 border border-white/10 transition-colors"
                >
                  Iniciar sesión
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-white btn"
                >
                  Crear cuenta
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 rounded-lg text-slate-300 hover:bg-white/10 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {showMobileMenu ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <MobileMenu
            isAuthenticated={isAuthenticated}
            onLogout={handleLogout}
            onClose={() => setShowMobileMenu(false)}
          />
        )}
      </div>
    </nav>
  );
}
