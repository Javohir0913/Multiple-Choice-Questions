import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiClient, apiErrorMessage } from "../api/client";
import { TestResult } from "../api/types";
import { Navbar } from "../components/Navbar";

export default function ResultPage() {
  const { sessionId } = useParams();
  const [result, setResult] = useState<TestResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get(`/test/session/${sessionId}/result`)
      .then((res) => setResult(res.data))
      .catch((err) => setError(apiErrorMessage(err, "Natijani yuklab bo'lmadi")))
      .finally(() => setLoading(false));
  }, [sessionId]);

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8">
        {loading && <p className="text-gray-500">Yuklanmoqda...</p>}
        {error && <p className="text-red-500">{error}</p>}

        {result && (
          <>
            <div className="rounded-[20px] bg-white/80 dark:bg-navy-800/70 backdrop-blur-xl shadow-apple dark:shadow-none ring-1 ring-black/[0.04] dark:ring-white/[0.08] p-6 mb-6 text-center">
              <h1 className="text-lg text-gray-500 mb-1">{result.subcategory_name}</h1>
              <p className="text-4xl font-bold text-primary-600 dark:text-primary-400 mb-2">{result.percent}%</p>
              <p className="text-gray-500">
                {result.correct_count} / {result.total_questions} to'g'ri javob
              </p>
              <div className="flex justify-center gap-3 mt-6">
                <Link
                  to="/history"
                  className="rounded-xl border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/10"
                >
                  Tarixni ko'rish
                </Link>
                <Link
                  to="/"
                  className="rounded-full bg-primary-600 hover:bg-primary-700 text-white transition-colors px-4 py-2 text-sm font-medium"
                >
                  Bosh sahifa
                </Link>
              </div>
            </div>

            <h2 className="font-semibold mb-3">Javoblar tafsiloti</h2>
            <div className="space-y-3">
              {result.answers.map((a, idx) => (
                <div
                  key={a.question_id}
                  className={`rounded-xl border p-4 ${
                    a.is_timed_out
                      ? "border-amber-300 dark:border-amber-700"
                      : a.is_correct
                      ? "border-green-300 dark:border-green-700"
                      : "border-red-300 dark:border-red-700"
                  } bg-white/80 dark:bg-navy-800/70 backdrop-blur-xl`}
                >
                  <p className="text-sm text-gray-400 mb-1">Savol {idx + 1}</p>
                  <p className="font-medium mb-3">{a.question_text}</p>
                  <div className="space-y-1.5">
                    {a.options.map((opt) => {
                      const isSelected = opt.id === a.selected_answer_id;
                      return (
                        <div
                          key={opt.id}
                          className={`text-sm rounded-xl px-3 py-2 border ${
                            opt.is_correct
                              ? "border-green-400 bg-green-50 dark:bg-green-950/30"
                              : isSelected
                              ? "border-red-400 bg-red-50 dark:bg-red-950/30"
                              : "border-gray-200 dark:border-gray-700"
                          }`}
                        >
                          {opt.text}
                          {opt.is_correct && <span className="ml-2 text-green-600 dark:text-green-400">✓ to'g'ri</span>}
                          {isSelected && !opt.is_correct && <span className="ml-2 text-red-500">✗ sizning javobingiz</span>}
                        </div>
                      );
                    })}
                  </div>
                  {a.is_timed_out && <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">Vaqt tugadi</p>}
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
