import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiErrorMessage } from "../api/client";
import { ThemeToggle } from "../components/ThemeToggle";

export default function Login() {
  const { loginUser } = useAuth();
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await loginUser(phone, password);
      navigate("/");
    } catch (err) {
      setError(apiErrorMessage(err, "Login xato"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-sm bg-white/80 dark:bg-navy-800/70 backdrop-blur-xl rounded-[22px] shadow-apple-lg dark:shadow-none dark:ring-1 dark:ring-white/[0.08] p-8">
        <h1 className="text-xl font-semibold mb-1">Kirish</h1>
        <p className="text-sm text-gray-500 mb-6">Telefon raqam va parolingiz bilan kiring</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Telefon raqam</label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+998901234567"
              className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent transition-colors px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Parol</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent transition-colors px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-primary-600 hover:bg-primary-700 text-white transition-colors py-2 font-medium disabled:opacity-60"
          >
            {loading ? "Kirilmoqda..." : "Kirish"}
          </button>
        </form>

        <p className="text-sm text-gray-500 mt-4 text-center">
          Hisobingiz yo'qmi?{" "}
          <Link to="/register" className="text-primary-600 dark:text-primary-400 font-medium">
            Ro'yxatdan o'tish
          </Link>
        </p>
        <p className="text-xs text-gray-400 mt-2 text-center">
          <Link to="/admin/login">Admin sifatida kirish</Link>
        </p>
      </div>
    </div>
  );
}
