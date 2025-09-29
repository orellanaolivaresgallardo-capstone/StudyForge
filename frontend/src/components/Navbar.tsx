import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="flex items-center justify-between bg-violet-700 px-6 py-4 text-white">
      <Link to="/" className="text-lg font-bold tracking-tight">
        StudyForge
      </Link>
      <ul className="flex gap-6 text-sm font-medium">
        <li>
          <Link to="/" className="hover:underline">
            Home
          </Link>
        </li>
        <li>
          <Link to="/login" className="hover:underline">
            Login
          </Link>
        </li>
        <li>
          <Link to="/signup" className="hover:underline">
            Sign Up
          </Link>
        </li>
      </ul>
    </nav>
  );
}
