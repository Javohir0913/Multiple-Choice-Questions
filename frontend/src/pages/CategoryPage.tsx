import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiClient, apiErrorMessage } from "../api/client";
import { SubCategory } from "../api/types";
import { Navbar } from "../components/Navbar";

export default function CategoryPage() {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const [subs, setSubs] = useState<SubCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [startingId, setStartingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .get(`/categories/${categoryId}/subcategories`)
      .then((res) => setSubs(res.data))
      .finally(() => setLoading(false));
  }, [categoryId]);

  async function handleStart(sub: SubCategory) {
    setError(null);
    setStartingId(sub.id);
    try {
      const res = await apiClient.post("/test/start", { subcategory_id: sub.id });
      navigate(`/test/${res.data.session_id}`);
    } catch (err) {
      setError(apiErrorMessage(err, "Testni boshlab bo'lmadi"));
    } finally {
      setStartingId(null);
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <button onClick={() => navigate(-1)} className="text-sm text-primary-600 dark:text-primary-400 mb-4">
          ← Orqaga
        </button>
        <h1 className="text-2xl font-semibold mb-6">Sub-bo'limlar</h1>

        {loading && <p className="text-gray-500">Yuklanmoqda...</p>}
        {!loading && subs.length === 0 && <p className="text-gray-500">Bu bo'limda hozircha sub-bo'lim yo'q.</p>}
        {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

        <div className="grid sm:grid-cols-2 gap-4">
          {subs.map((s) => {
            const minutes = Math.floor(s.time_per_question_seconds / 60);
            const seconds = s.time_per_question_seconds % 60;
            return (
              <div
                key={s.id}
                className="rounded-[20px] bg-white/80 dark:bg-navy-800/70 backdrop-blur-xl shadow-apple dark:shadow-none ring-1 ring-black/[0.04] dark:ring-white/[0.08] p-5"
              >
                <h2 className="font-medium text-lg">{s.name}</h2>
                <ul className="text-sm text-gray-500 mt-2 space-y-1">
                  <li>Jami savollar: {s.total_questions_per_test} ta</li>
                  <li>
                    Har bir savolga: {minutes > 0 ? `${minutes} daqiqa ` : ""}
                    {seconds} soniya
                  </li>
                  <li>Orqaga qaytish: {s.allow_back_navigation ? "mumkin" : "mumkin emas"}</li>
                </ul>
                <button
                  onClick={() => handleStart(s)}
                  disabled={startingId === s.id}
                  className="mt-4 w-full rounded-full bg-primary-600 hover:bg-primary-700 text-white transition-colors py-2 font-medium disabled:opacity-60"
                >
                  {startingId === s.id ? "Boshlanmoqda..." : "Boshlash"}
                </button>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
