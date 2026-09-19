import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiClient } from "../api/client";
import { HistoryItem } from "../api/types";
import { Navbar } from "../components/Navbar";

const STATUS_LABEL: Record<string, string> = {
  completed: "Tugallangan",
  timed_out: "Vaqt tugadi",
  cancelled: "Bekor qilingan",
};

export default function HistoryPage() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get("/test/history")
      .then((res) => setItems(res.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold mb-6">Test tarixi</h1>

        {loading && <p className="text-gray-500">Yuklanmoqda...</p>}
        {!loading && items.length === 0 && <p className="text-gray-500">Siz hali test ishlamagansiz.</p>}

        <div className="space-y-3">
          {items.map((item) => (
            <Link
              key={item.session_id}
              to={`/result/${item.session_id}`}
              className="flex items-center justify-between rounded-[18px] bg-white/80 dark:bg-navy-800/70 backdrop-blur-xl shadow-apple dark:shadow-none ring-1 ring-black/[0.04] dark:ring-white/[0.08] p-4 hover:ring-primary-400/60 hover:shadow-apple-lg transition-colors"
            >
              <div>
                <p className="font-medium">{item.subcategory_name}</p>
                <p className="text-sm text-gray-500">
                  {new Date(item.started_at).toLocaleString("uz-UZ")} · {STATUS_LABEL[item.status] || item.status}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-primary-600 dark:text-primary-400">{item.percent}%</p>
                <p className="text-xs text-gray-500">
                  {item.correct_count}/{item.total_questions}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
