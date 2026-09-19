import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiClient, apiErrorMessage } from "../../api/client";
import { Question } from "../../api/types";
import { Select } from "../../components/Select";

const DIFFICULTY_OPTIONS = [
  { value: "easy" as const, label: "Oson" },
  { value: "medium" as const, label: "O'rta" },
  { value: "hard" as const, label: "Qiyin" },
];

const EMPTY_ANSWERS = ["", "", "", ""];

export default function AdminQuestions() {
  const { subcategoryId } = useParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [text, setText] = useState("");
  const [answers, setAnswers] = useState<string[]>(EMPTY_ANSWERS);
  const [correctIndex, setCorrectIndex] = useState(0);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [error, setError] = useState<string | null>(null);

  const [importFile, setImportFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<{ imported: number; errors: string[] } | null>(null);
  const [importing, setImporting] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [editAnswers, setEditAnswers] = useState<string[]>(EMPTY_ANSWERS);
  const [editCorrectIndex, setEditCorrectIndex] = useState(0);
  const [editDifficulty, setEditDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [savingEdit, setSavingEdit] = useState(false);

  function loadQuestions() {
    apiClient.get(`/admin/questions/subcategory/${subcategoryId}`).then((res) => setQuestions(res.data));
  }

  useEffect(() => {
    loadQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subcategoryId]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await apiClient.post("/admin/questions", {
        subcategory_id: Number(subcategoryId),
        text,
        difficulty,
        answers: answers.map((a, i) => ({ text: a, is_correct: i === correctIndex })),
      });
      setText("");
      setAnswers(EMPTY_ANSWERS);
      setCorrectIndex(0);
      setDifficulty("medium");
      loadQuestions();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  async function handleToggle(q: Question) {
    await apiClient.patch(`/admin/questions/${q.id}/toggle`);
    loadQuestions();
  }

  async function handleDelete(q: Question) {
    if (!confirm("Savolni butunlay o'chirasizmi? (Analitikada iz qoladi)")) return;
    await apiClient.delete(`/admin/questions/${q.id}`);
    loadQuestions();
  }

  function handleStartEdit(q: Question) {
    setEditingId(q.id);
    setEditText(q.text);
    setEditAnswers(q.answers.map((a) => a.text));
    setEditCorrectIndex(Math.max(0, q.answers.findIndex((a) => a.is_correct)));
    setEditDifficulty(q.difficulty);
    setError(null);
  }

  function handleCancelEdit() {
    setEditingId(null);
  }

  async function handleSaveEdit(e: FormEvent, questionId: number) {
    e.preventDefault();
    setSavingEdit(true);
    setError(null);
    try {
      await apiClient.put(`/admin/questions/${questionId}`, {
        text: editText,
        difficulty: editDifficulty,
        answers: editAnswers.map((a, i) => ({ text: a, is_correct: i === editCorrectIndex })),
      });
      setEditingId(null);
      loadQuestions();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSavingEdit(false);
    }
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    setImportFile(e.target.files?.[0] || null);
    setImportResult(null);
  }

  async function handleImport(e: FormEvent) {
    e.preventDefault();
    if (!importFile) return;
    setImporting(true);
    setImportResult(null);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", importFile);
      const res = await apiClient.post(
        `/admin/questions/import?subcategory_id=${subcategoryId}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setImportResult(res.data);
      loadQuestions();
    } catch (err) {
      setError(apiErrorMessage(err, "Import muvaffaqiyatsiz"));
    } finally {
      setImporting(false);
    }
  }

  return (
    <div>
      <button onClick={() => navigate(-1)} className="text-sm text-primary-600 dark:text-primary-400 mb-4">
        ← Orqaga
      </button>
      <h1 className="text-2xl font-semibold mb-6">Savollar</h1>

      <section className="rounded-[20px] bg-white/80 dark:bg-navy-800/70 backdrop-blur-xl shadow-apple dark:shadow-none ring-1 ring-black/[0.04] dark:ring-white/[0.08] p-5 mb-6">
        <h2 className="font-medium mb-3">Excel/CSV orqali import</h2>
        <p className="text-xs text-gray-500 mb-3">
          Ustunlar: question, option_a, option_b, option_c, option_d, correct_answer (A/B/C/D), difficulty (ixtiyoriy: easy/medium/hard)
        </p>
        <form onSubmit={handleImport} className="flex flex-wrap items-center gap-3">
          <input type="file" accept=".csv,.xlsx,.xls" onChange={handleFileChange} className="text-sm" />
          <button disabled={!importFile || importing} className="rounded-full bg-primary-600 hover:bg-primary-700 text-white transition-colors px-4 py-2 text-sm disabled:opacity-50">
            {importing ? "Yuklanmoqda..." : "Import qilish"}
          </button>
        </form>
        {importResult && (
          <div className="mt-3 text-sm">
            <p className="text-green-600 dark:text-green-400">{importResult.imported} ta savol import qilindi.</p>
            {importResult.errors.length > 0 && (
              <ul className="text-red-500 list-disc list-inside mt-1">
                {importResult.errors.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>

      <section className="rounded-[20px] bg-white/80 dark:bg-navy-800/70 backdrop-blur-xl shadow-apple dark:shadow-none ring-1 ring-black/[0.04] dark:ring-white/[0.08] p-5 mb-6">
        <h2 className="font-medium mb-3">Qo'lda savol qo'shish</h2>
        <form onSubmit={handleCreate} className="space-y-3">
          <textarea
            required
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Savol matni"
            rows={2}
            className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent transition-colors px-3 py-2 text-sm"
          />
          <div className="space-y-2">
            {answers.map((a, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="correct"
                  checked={correctIndex === i}
                  onChange={() => setCorrectIndex(i)}
                  title="To'g'ri javob"
                />
                <input
                  required
                  value={a}
                  onChange={(e) => {
                    const next = [...answers];
                    next[i] = e.target.value;
                    setAnswers(next);
                  }}
                  placeholder={`Variant ${String.fromCharCode(65 + i)}`}
                  className="flex-1 rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent transition-colors px-3 py-1.5 text-sm"
                />
              </div>
            ))}
          </div>
          <div className="text-sm">
            <label className="block mb-1">Qiyinlik darajasi</label>
            <Select value={difficulty} onChange={setDifficulty} options={DIFFICULTY_OPTIONS} />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
          <button className="rounded-full bg-primary-600 hover:bg-primary-700 text-white transition-colors px-4 py-2 text-sm">
            Qo'shish
          </button>
        </form>
      </section>

      <div className="space-y-3">
        {questions.map((q) =>
          editingId === q.id ? (
            <form
              key={q.id}
              onSubmit={(e) => handleSaveEdit(e, q.id)}
              className="rounded-[20px] bg-white/80 dark:bg-navy-800/70 backdrop-blur-xl shadow-apple dark:shadow-none ring-1 ring-primary-400 p-4 space-y-3"
            >
              <textarea
                required
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={2}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent transition-colors px-3 py-2 text-sm"
              />
              <div className="space-y-2">
                {editAnswers.map((a, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`edit-correct-${q.id}`}
                      checked={editCorrectIndex === i}
                      onChange={() => setEditCorrectIndex(i)}
                      title="To'g'ri javob"
                    />
                    <input
                      required
                      value={a}
                      onChange={(e) => {
                        const next = [...editAnswers];
                        next[i] = e.target.value;
                        setEditAnswers(next);
                      }}
                      placeholder={`Variant ${String.fromCharCode(65 + i)}`}
                      className="flex-1 rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent transition-colors px-3 py-1.5 text-sm"
                    />
                  </div>
                ))}
              </div>
              <Select value={editDifficulty} onChange={setEditDifficulty} options={DIFFICULTY_OPTIONS} />
              {error && <p className="text-sm text-red-500">{error}</p>}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="rounded-full bg-primary-600 hover:bg-primary-700 text-white transition-colors px-4 py-2 text-sm disabled:opacity-50"
                >
                  {savingEdit ? "Saqlanmoqda..." : "Saqlash"}
                </button>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="rounded-full border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/10"
                >
                  Bekor qilish
                </button>
              </div>
            </form>
          ) : (
            <div key={q.id} className="rounded-[20px] bg-white/80 dark:bg-navy-800/70 backdrop-blur-xl shadow-apple dark:shadow-none ring-1 ring-black/[0.04] dark:ring-white/[0.08] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{q.text}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {q.difficulty === "easy" ? "Oson" : q.difficulty === "medium" ? "O'rta" : "Qiyin"} ·{" "}
                    {q.is_active ? "Faol" : "Nofaol"}
                  </p>
                </div>
                <div className="flex gap-2 text-xs shrink-0">
                  <button onClick={() => handleStartEdit(q)} className="text-gray-500 hover:text-primary-600">
                    Tahrirlash
                  </button>
                  <button onClick={() => handleToggle(q)} className="text-gray-500 hover:text-primary-600">
                    {q.is_active ? "Deactivate" : "Activate"}
                  </button>
                  <button onClick={() => handleDelete(q)} className="text-red-500">
                    O'chirish
                  </button>
                </div>
              </div>
              <ul className="mt-3 space-y-1 text-sm">
                {q.answers.map((a) => (
                  <li key={a.id} className={a.is_correct ? "text-green-600 dark:text-green-400" : "text-gray-500"}>
                    {a.is_correct ? "✓ " : "· "}
                    {a.text}
                  </li>
                ))}
              </ul>
            </div>
          )
        )}
      </div>
    </div>
  );
}
