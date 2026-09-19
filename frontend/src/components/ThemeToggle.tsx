import { useTheme } from "../context/ThemeContext";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      aria-label="Mavzuni almashtirish"
      className="rounded-xl px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
    >
      {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
    </button>
  );
}
