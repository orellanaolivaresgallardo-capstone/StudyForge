// frontend/src/components/layout/components/NavLinks.tsx
/**
 * Navigation links component (reusable for desktop and mobile)
 */
import { Link } from "react-router-dom";

interface NavLinksProps {
  variant?: "desktop" | "mobile";
  onLinkClick?: () => void;
}

const links = [
  { to: "/documents", label: "Documentos" },
  { to: "/study-spaces", label: "Espacios" },
  { to: "/stats", label: "Estadísticas" },
];

export function NavLinks({ variant = "desktop", onLinkClick }: NavLinksProps) {
  const baseClass =
    variant === "desktop"
      ? "text-sm font-semibold text-slate-100 hover:text-white hover:bg-white/10 px-3 py-2 rounded-lg transition-all"
      : "block px-4 py-2 rounded-lg text-sm font-semibold text-slate-100 hover:bg-white/10 hover:text-white transition-colors";

  return (
    <>
      {links.map((link) => (
        <Link
          key={link.to}
          to={link.to}
          className={baseClass}
          onClick={onLinkClick}
        >
          {link.label}
        </Link>
      ))}
    </>
  );
}
