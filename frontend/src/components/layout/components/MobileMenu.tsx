// frontend/src/components/layout/components/MobileMenu.tsx
/**
 * Mobile menu dropdown
 */
import { Link } from "react-router-dom";
import { QuotaWidget } from "@/components";
import { NavLinks } from "./NavLinks";

interface MobileMenuProps {
  isAuthenticated: boolean;
  onLogout: () => void;
  onClose: () => void;
}

export function MobileMenu({
  isAuthenticated,
  onLogout,
  onClose,
}: MobileMenuProps) {
  return (
    <div className="md:hidden py-4 border-t border-white/10">
      {isAuthenticated ? (
        <div className="space-y-3">
          <QuotaWidget compact={false} className="mb-4" />
          <NavLinks variant="mobile" onLinkClick={onClose} />
          {/* Temporalmente oculto - en desarrollo */}
          {/* <Link
            to="/profile"
            className="block px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
            onClick={onClose}
          >
            Mi perfil
          </Link> */}
          <button
            onClick={() => {
              onLogout();
              onClose();
            }}
            className="w-full text-left px-4 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <Link
            to="/"
            className="block px-4 py-2 rounded-lg text-sm font-semibold text-slate-100 hover:bg-white/10 hover:text-white transition-colors"
            onClick={onClose}
          >
            Inicio
          </Link>
          <Link
            to="/login"
            className="block px-4 py-2 rounded-lg text-sm font-semibold text-slate-100 hover:bg-white/10 hover:text-white transition-colors"
            onClick={onClose}
          >
            Iniciar sesión
          </Link>
          <Link
            to="/signup"
            className="block px-4 py-2 rounded-xl text-sm font-semibold text-white btn text-center"
            onClick={onClose}
          >
            Crear cuenta
          </Link>
        </div>
      )}
    </div>
  );
}
