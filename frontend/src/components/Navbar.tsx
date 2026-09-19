import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ThemeToggle } from "./ThemeToggle";

export function Navbar() {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate(role === "admin" ? "/admin/login" : "/login");
  }

  return (
    <header className="sticky top-0 z-10 bg-white/70 dark:bg-navy-950/70 backdrop-blur border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to={role === "admin" ? "/admin" : "/"} className="font-semibold text-lg text-primary-600 dark:text-primary-400">
          MCQ Platform
        </Link>
        <div className="flex items-center gap-3">
          {role === "user" && (
            <>
              <Link to="/history" className="text-sm hover:text-primary-600 dark:hover:text-primary-400">
                Tarix
              </Link>
              {user && <span className="text-sm text-gray-500 hidden sm:inline">{user.first_name} {user.last_name}</span>}
            </>
          )}
          <ThemeToggle />
          {user && (
            <button
              onClick={handleLogout}
              className="text-sm rounded-xl px-3 py-1.5 border border-gray-300 dark:border-gray-700 hover:bg-black/5 dark:hover:bg-white/10"
            >
              Chiqish
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
