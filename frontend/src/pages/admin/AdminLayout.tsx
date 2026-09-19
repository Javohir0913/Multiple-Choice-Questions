import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ThemeToggle } from "../../components/ThemeToggle";

const NAV_ITEMS = [
  { to: "/admin", label: "Bosh sahifa", end: true },
  { to: "/admin/faculties", label: "Fakultet / Guruh" },
  { to: "/admin/categories", label: "Bo'limlar" },
  { to: "/admin/users", label: "Foydalanuvchilar" },
  { to: "/admin/analytics", label: "Analitika" },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/admin/login");
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <aside className="md:w-56 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-navy-950/80 backdrop-blur-xl">
        <div className="p-4 flex items-center justify-between md:block">
          <h1 className="font-semibold text-primary-600 dark:text-primary-400">Admin panel</h1>
          <div className="md:hidden">
            <ThemeToggle />
          </div>
        </div>
        <nav className="flex md:flex-col gap-1 px-2 pb-2 md:pb-4 overflow-x-auto">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-xl px-3 py-2 text-sm ${
                  isActive
                    ? "bg-primary-600 text-white"
                    : "hover:bg-black/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="hidden md:block px-4 py-4 border-t border-gray-200 dark:border-gray-800">
          <ThemeToggle />
          {user && <p className="text-xs text-gray-500 mt-2">{user.phone}</p>}
          <button onClick={handleLogout} className="text-sm text-red-500 mt-2">
            Chiqish
          </button>
        </div>
      </aside>
      <main className="flex-1 px-4 py-6 max-w-6xl">
        <Outlet />
      </main>
    </div>
  );
}
