import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { apiClient, apiErrorMessage } from "../../api/client";
import { SubCategory } from "../../api/types";

interface SubCategoryFormState {
  name: string;
  total_questions_per_test: number;
  time_per_question_seconds: number;
  allow_back_navigation: boolean;
  available_from: string;
  available_until: string;
}

const EMPTY_FORM: SubCategoryFormState = {
  name: "",
  total_questions_per_test: 20,
  time_per_question_seconds: 150,
  allow_back_navigation: false,
  available_from: "",
  available_until: "",
};

function subCategoryToFormState(s: SubCategory): SubCategoryFormState {
  return {
    name: s.name,
    total_questions_per_test: s.total_questions_per_test,
    time_per_question_seconds: s.time_per_question_seconds,
    allow_back_navigation: s.allow_back_navigation,
    available_from: s.available_from ? s.available_from.slice(0, 16) : "",
    available_until: s.available_until ? s.available_until.slice(0, 16) : "",
  };
}

function SubCategoryFormFields({
  form,
  setForm,
  idPrefix,
}: {
  form: SubCategoryFormState;
  setForm: (f: SubCategoryFormState) => void;
  idPrefix: string;
}) {
  return (
    <>
      <input
        required
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        placeholder="Nomi (masalan: Oddiy arifmetika)"
        className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent transition-colors px-3 py-2 text-sm"
      />
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="text-sm">
          Testdagi savollar soni
          <input
            type="number"
            min={1}
            required
            value={form.total_questions_per_test}
            onChange={(e) => setForm({ ...form, total_questions_per_test: Number(e.target.value) })}
            className="w-full mt-1 rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent transition-colors px-3 py-2 text-sm"
          />
        </label>
        <label className="text-sm">
          Har bir savolga vaqt (soniya)
          <input
            type="number"
            min={5}
            required
            value={form.time_per_question_seconds}
            onChange={(e) => setForm({ ...form, time_per_question_seconds: Number(e.target.value) })}
            className="w-full mt-1 rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent transition-colors px-3 py-2 text-sm"
          />
        </label>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="text-sm">
          Boshlanish sanasi (ixtiyoriy)
          <input
            type="datetime-local"
            value={form.available_from}
            onChange={(e) => setForm({ ...form, available_from: e.target.value })}
            className="w-full mt-1 rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent transition-colors px-3 py-2 text-sm"
          />
        </label>
        <label className="text-sm">
          Tugash sanasi (ixtiyoriy)
          <input
            type="datetime-local"
            value={form.available_until}
            onChange={(e) => setForm({ ...form, available_until: e.target.value })}
            className="w-full mt-1 rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent transition-colors px-3 py-2 text-sm"
          />
        </label>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.allow_back_navigation}
          onChange={(e) => setForm({ ...form, allow_back_navigation: e.target.checked })}
        />
        Orqaga qaytishga ruxsat berilsin
      </label>
    </>
  );
}

export default function AdminSubCategories() {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const [subs, setSubs] = useState<SubCategory[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<SubCategoryFormState>(EMPTY_FORM);
  const [savingEdit, setSavingEdit] = useState(false);

  function loadSubs() {
    apiClient.get(`/admin/categories/${categoryId}/subcategories`).then((res) => setSubs(res.data));
  }

  useEffect(() => {
    loadSubs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await apiClient.post("/admin/subcategories", {
        name: form.name,
        category_id: Number(categoryId),
        total_questions_per_test: form.total_questions_per_test,
        time_per_question_seconds: form.time_per_question_seconds,
        allow_back_navigation: form.allow_back_navigation,
        available_from: form.available_from || null,
        available_until: form.available_until || null,
      });
      setForm(EMPTY_FORM);
      loadSubs();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  async function handleToggle(s: SubCategory) {
    await apiClient.patch(`/admin/subcategories/${s.id}/toggle`);
    loadSubs();
  }

  async function handleDelete(s: SubCategory, hard: boolean) {
    const msg = hard
      ? `"${s.name}" ni BUTUNLAY o'chirasizmi? Bu qaytarib bo'lmaydi.`
      : `"${s.name}" ni arxivga o'tkazasizmi?`;
    if (!confirm(msg)) return;
    await apiClient.delete(`/admin/subcategories/${s.id}${hard ? "?hard=true" : ""}`);
    loadSubs();
  }

  function handleStartEdit(s: SubCategory) {
    setEditingId(s.id);
    setEditForm(subCategoryToFormState(s));
    setError(null);
  }

  function handleCancelEdit() {
    setEditingId(null);
  }

  async function handleSaveEdit(e: FormEvent, subcategoryId: number) {
    e.preventDefault();
    setSavingEdit(true);
    setError(null);
    try {
      await apiClient.put(`/admin/subcategories/${subcategoryId}`, {
        name: editForm.name,
        total_questions_per_test: editForm.total_questions_per_test,
        time_per_question_seconds: editForm.time_per_question_seconds,
        allow_back_navigation: editForm.allow_back_navigation,
        available_from: editForm.available_from || null,
        available_until: editForm.available_until || null,
      });
      setEditingId(null);
      loadSubs();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSavingEdit(false);
    }
  }

  return (
    <div>
      <button onClick={() => navigate("/admin/categories")} className="text-sm text-primary-600 dark:text-primary-400 mb-4">
        ← Bo'limlarga qaytish
      </button>
      <h1 className="text-2xl font-semibold mb-6">Sub-bo'limlar</h1>

      <section className="rounded-[20px] bg-white/80 dark:bg-navy-800/70 backdrop-blur-xl shadow-apple dark:shadow-none ring-1 ring-black/[0.04] dark:ring-white/[0.08] p-5 mb-6">
        <h2 className="font-medium mb-3">Yangi sub-bo'lim</h2>
        <form onSubmit={handleCreate} className="space-y-3">
          <SubCategoryFormFields form={form} setForm={setForm} idPrefix="create" />
          {error && !editingId && <p className="text-sm text-red-500">{error}</p>}
          <button className="rounded-full bg-primary-600 hover:bg-primary-700 text-white transition-colors px-4 py-2 text-sm">
            Yaratish
          </button>
        </form>
      </section>

      <div className="space-y-3">
        {subs.map((s) =>
          editingId === s.id ? (
            <form
              key={s.id}
              onSubmit={(e) => handleSaveEdit(e, s.id)}
              className="rounded-[20px] bg-white/80 dark:bg-navy-800/70 backdrop-blur-xl shadow-apple dark:shadow-none ring-1 ring-primary-400 p-4 space-y-3"
            >
              <SubCategoryFormFields form={editForm} setForm={setEditForm} idPrefix={`edit-${s.id}`} />
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
            <div
              key={s.id}
              className="rounded-[20px] bg-white/80 dark:bg-navy-800/70 backdrop-blur-xl shadow-apple dark:shadow-none ring-1 ring-black/[0.04] dark:ring-white/[0.08] p-4 flex items-center justify-between"
            >
              <div>
                <Link
                  to={`/admin/subcategories/${s.id}/questions`}
                  className="font-medium hover:text-primary-600 dark:hover:text-primary-400"
                >
                  {s.name}
                </Link>
                <p className="text-xs text-gray-500 mt-1">
                  {s.is_archived ? "Arxivda" : s.is_active ? "Faol" : "Nofaol"} · {s.total_questions_per_test} savol ·{" "}
                  {s.time_per_question_seconds}s/savol
                  {s.available_from && ` · dan: ${new Date(s.available_from).toLocaleString("uz-UZ")}`}
                  {s.available_until && ` · gacha: ${new Date(s.available_until).toLocaleString("uz-UZ")}`}
                </p>
              </div>
              <div className="flex gap-2 text-xs">
                <button onClick={() => handleStartEdit(s)} className="text-gray-500 hover:text-primary-600">
                  Tahrirlash
                </button>
                <button onClick={() => handleToggle(s)} className="text-gray-500 hover:text-primary-600">
                  {s.is_active ? "Deactivate" : "Activate"}
                </button>
                <button onClick={() => handleDelete(s, false)} className="text-amber-600">
                  Arxivlash
                </button>
                <button onClick={() => handleDelete(s, true)} className="text-red-500">
                  Butunlay o'chirish
                </button>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
