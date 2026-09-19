import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { apiClient, apiErrorMessage } from "../api/client";
import { CurrentQuestion } from "../api/types";
import { Navbar } from "../components/Navbar";
import { ProgressBar } from "../components/ProgressBar";
import { Timer } from "../components/Timer";

export default function TestPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [current, setCurrent] = useState<CurrentQuestion | null>(null);
  const [history, setHistory] = useState<Record<number, CurrentQuestion>>({});
  const [displayedPosition, setDisplayedPosition] = useState<number | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goToResult = useCallback(() => {
    navigate(`/result/${sessionId}`, { replace: true });
  }, [navigate, sessionId]);

  const loadResume = useCallback(async () => {
    try {
      const res = await apiClient.get(`/test/session/${sessionId}/resume`);
      const q: CurrentQuestion = res.data;
      setCurrent(q);
      setHistory((h) => ({ ...h, [q.position]: q }));
      setDisplayedPosition(q.position);
      setSelectedOption(null);
      setSecondsLeft(q.remaining_seconds);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        goToResult();
        return;
      }
      setError(apiErrorMessage(err, "Testni yuklab bo'lmadi"));
    } finally {
      setLoading(false);
    }
  }, [sessionId, goToResult]);

  useEffect(() => {
    loadResume();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  useEffect(() => {
    if (loading || !current) return;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          loadResume();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.session_id, current?.position]);

  async function handleSubmitLive() {
    if (!current || selectedOption == null) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await apiClient.post("/test/answer", {
        session_id: current.session_id,
        selected_answer_id: selectedOption,
        position: current.position,
      });
      if (res.data.finished) {
        goToResult();
        return;
      }
      const next: CurrentQuestion = res.data.next_question;
      setCurrent(next);
      setHistory((h) => ({ ...h, [next.position]: next }));
      setDisplayedPosition(next.position);
      setSelectedOption(null);
      setSecondsLeft(next.remaining_seconds);
    } catch (err) {
      setError(apiErrorMessage(err, "Javobni yuborib bo'lmadi"));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleBackAnswerSelect(position: number, answerId: number) {
    if (!current) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await apiClient.post("/test/answer", {
        session_id: current.session_id,
        selected_answer_id: answerId,
        position,
      });
      setHistory((h) => ({ ...h, [position]: { ...h[position], previous_selected_answer_id: answerId } }));
      if (res.data.next_question) {
        setCurrent(res.data.next_question);
      }
    } catch (err) {
      setError(apiErrorMessage(err, "Javobni yangilab bo'lmadi"));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleFinishEarly() {
    if (!current) return;
    if (!confirm("Testni hozir yakunlashni xohlaysizmi? Javob berilmagan savollar 'vaqt tugadi' deb hisoblanadi.")) return;
    try {
      await apiClient.post(`/test/finish?session_id=${current.session_id}`);
      goToResult();
    } catch (err) {
      setError(apiErrorMessage(err, "Testni yakunlab bo'lmadi"));
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center text-gray-500">Yuklanmoqda...</div>
      </div>
    );
  }

  if (!current) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center text-red-500">{error || "Xatolik"}</div>
      </div>
    );
  }

  const isViewingPast = displayedPosition !== null && displayedPosition !== current.position;
  const displayed = isViewingPast ? history[displayedPosition!] : current;

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-semibold text-lg">{current.subcategory_name}</h1>
          <Timer secondsLeft={secondsLeft} total={current.time_per_question_seconds} />
        </div>

        <div className="mb-6">
          <ProgressBar current={current.position} total={current.total_questions} />
        </div>

        {current.allow_back_navigation && current.position > 1 && (
          <div className="flex flex-wrap gap-1.5 mb-6">
            {Array.from({ length: current.position }, (_, i) => i + 1).map((pos) => (
              <button
                key={pos}
                onClick={() => setDisplayedPosition(pos)}
                className={`w-8 h-8 text-xs rounded-xl border flex items-center justify-center ${
                  pos === displayedPosition
                    ? "bg-primary-600 text-white border-primary-600"
                    : "border-gray-300 dark:border-gray-700 hover:bg-black/5 dark:hover:bg-white/10"
                }`}
              >
                {pos}
              </button>
            ))}
          </div>
        )}

        {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

        {displayed && (
          <div className="rounded-[20px] bg-white/80 dark:bg-navy-800/70 backdrop-blur-xl shadow-apple dark:shadow-none ring-1 ring-black/[0.04] dark:ring-white/[0.08] p-6">
            {isViewingPast && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mb-3">
                Bu oldingi savol — javobingizni o'zgartirishingiz mumkin.
              </p>
            )}
            <p className="text-base font-medium mb-5">{displayed.question_text}</p>

            <div className="space-y-2">
              {displayed.options.map((opt) => {
                const isSelected = isViewingPast
                  ? displayed.previous_selected_answer_id === opt.id
                  : selectedOption === opt.id;
                return (
                  <button
                    key={opt.id}
                    disabled={submitting}
                    onClick={() =>
                      isViewingPast
                        ? handleBackAnswerSelect(displayedPosition!, opt.id)
                        : setSelectedOption(opt.id)
                    }
                    className={`w-full text-left rounded-xl border px-4 py-3 transition-colors ${
                      isSelected
                        ? "border-primary-600 bg-primary-50 dark:bg-primary-900/30"
                        : "border-gray-300 dark:border-gray-700 hover:bg-black/5 dark:hover:bg-gray-700/50"
                    } disabled:opacity-60`}
                  >
                    {opt.text}
                  </button>
                );
              })}
            </div>

            {isViewingPast ? (
              <button
                onClick={() => setDisplayedPosition(current.position)}
                className="mt-6 text-sm text-primary-600 dark:text-primary-400"
              >
                ← Joriy savolga qaytish
              </button>
            ) : (
              <button
                onClick={handleSubmitLive}
                disabled={selectedOption == null || submitting}
                className="mt-6 w-full rounded-full bg-primary-600 hover:bg-primary-700 text-white transition-colors py-2.5 font-medium disabled:opacity-50"
              >
                {submitting ? "Yuborilmoqda..." : "Keyingi savol"}
              </button>
            )}
          </div>
        )}

        <button onClick={handleFinishEarly} className="mt-6 text-sm text-gray-400 hover:text-red-500">
          Testni yakunlash
        </button>
      </main>
    </div>
  );
}
