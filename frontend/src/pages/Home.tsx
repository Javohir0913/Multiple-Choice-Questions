import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiClient } from "../api/client";
import { Category } from "../api/types";
import { Navbar } from "../components/Navbar";

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get("/categories")
      .then((res) => setCategories(res.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold mb-6">Test yo'nalishlari</h1>

        {loading && <p className="text-gray-500">Yuklanmoqda...</p>}
        {!loading && categories.length === 0 && (
          <p className="text-gray-500">Hozircha faol bo'limlar mavjud emas.</p>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((c) => (
            <Link
              key={c.id}
              to={`/categories/${c.id}`}
              className="rounded-[20px] bg-white/80 dark:bg-navy-800/70 backdrop-blur-xl shadow-apple dark:shadow-none ring-1 ring-black/[0.04] dark:ring-white/[0.08] p-5 hover:shadow-md hover:ring-primary-400/60 hover:shadow-apple-lg transition-all"
            >
              <h2 className="font-medium text-lg">{c.name}</h2>
              <p className="text-sm text-gray-500 mt-1">Sub-bo'limlarni ko'rish uchun bosing</p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
