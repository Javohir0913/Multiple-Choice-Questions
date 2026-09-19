import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiClient, apiErrorMessage } from "../../api/client";
import { Category, Faculty } from "../../api/types";

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [name, setName] = useState("");
  const [visibleToAll, setVisibleToAll] = useState(true);
  const [selectedFacultyIds, setSelectedFacultyIds] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editVisibleToAll, setEditVisibleToAll] = useState(true);
  const [editFacultyIds, setEditFacultyIds] = useState<number[]>([]);
  const [savingEdit, setSavingEdit] = useState(false);

  function loadCategories() {
    apiClient.get("/admin/categories").then((res) => setCategories(res.data));
  }

  useEffect(() => {
    loadCategories();
    apiClient.get("/faculties").then((res) => setFaculties(res.data));
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await apiClient.post("/admin/categories", {
        name,
        visible_to_all_faculties: visibleToAll,
        faculty_ids: visibleToAll ? [] : selectedFacultyIds,
      });
      setName("");
      setVisibleToAll(true);
      setSelectedFacultyIds([]);
      loadCategories();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  async function handleToggle(c: Category) {
    await apiClient.patch(`/admin/categories/${c.id}/toggle`);
    loadCategories();
  }

  async function handleDelete(c: Category, hard: boolean) {
    const msg = hard
      ? `"${c.name}" ni BUTUNLAY o'chirasizmi? Bu qaytarib bo'lmaydi (analitikada iz qoladi).`
      : `"${c.name}" ni arxivga o'tkazasizmi? Keyin tiklash mumkin.`;
    if (!confirm(msg)) return;
    await apiClient.delete(`/admin/categories/${c.id}${hard ? "?hard=true" : ""}`);
    loadCategories();
  }

  async function handleRestore(c: Category) {
    await apiClient.post(`/admin/categories/${c.id}/restore`);
    loadCategories();
  }

  function toggleFacultySelection(id: number) {
    setSelectedFacultyIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function handleStartEdit(c: Category) {
    setEditingId(c.id);
    setEditName(c.name);
    setEditVisibleToAll(c.visible_to_all_faculties);
    setEditFacultyIds(c.faculty_ids);
    setError(null);
  }

  function handleCancelEdit() {
    setEditingId(null);
  }

  function toggleEditFacultySelection(id: number) {
    setEditFacultyIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function handleSaveEdit(e: FormEvent, categoryId: number) {
    e.preventDefault();
    setSavingEdit(true);
    setError(null);
    try {
      await apiClient.put(`/admin/categories/${categoryId}`, {
        name: editName,
        visible_to_all_faculties: editVisibleToAll,
        faculty_ids: editVisibleToAll ? [] : editFacultyIds,
      });
      setEditingId(null);
      loadCategories();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSavingEdit(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Bo'limlar</h1>

      <section className="rounded-[20px] bg-white/80 dark:bg-navy-800/70 backdrop-blur-xl shadow-apple dark:shadow-none ring-1 ring-black/[0.04] dark:ring-white/[0.08] p-5 mb-6">
        <h2 className="font-medium mb-3">Yangi bo'lim yaratish</h2>
        <form onSubmit={handleCreate} className="space-y-3">
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Bo'lim nomi (masalan: Matematika)"
            className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent transition-colors px-3 py-2 text-sm"
          />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={visibleToAll} onChange={(e) => setVisibleToAll(e.target.checked)} />
            Barcha fakultetlarga ko'rinsin
          </label>

          {!visibleToAll && (
            <div className="flex flex-wrap gap-2">
              {faculties.map((f) => (
                <label
                  key={f.id}
                  className={`text-xs rounded-full px-3 py-1 border cursor-pointer ${
                    selectedFacultyIds.includes(f.id)
                      ? "bg-primary-600 text-white border-primary-600"
                      : "border-gray-300 dark:border-gray-700"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={selectedFacultyIds.includes(f.id)}
                    onChange={() => toggleFacultySelection(f.id)}
                  />
                  {f.name}
                </label>
              ))}
            </div>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}
          <button className="rounded-full bg-primary-600 hover:bg-primary-700 text-white transition-colors px-4 py-2 text-sm">
            Yaratish
          </button>
        </form>
      </section>

      <div className="space-y-3">
        {categories.map((c) =>
          editingId === c.id ? (
            <form
              key={c.id}
              onSubmit={(e) => handleSaveEdit(e, c.id)}
              className="rounded-[20px] bg-white/80 dark:bg-navy-800/70 backdrop-blur-xl shadow-apple dark:shadow-none ring-1 ring-primary-400 p-4 space-y-3"
            >
              <input
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent transition-colors px-3 py-2 text-sm"
              />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={editVisibleToAll} onChange={(e) => setEditVisibleToAll(e.target.checked)} />
                Barcha fakultetlarga ko'rinsin
              </label>
              {!editVisibleToAll && (
                <div className="flex flex-wrap gap-2">
                  {faculties.map((f) => (
                    <label
                      key={f.id}
                      className={`text-xs rounded-full px-3 py-1 border cursor-pointer ${
                        editFacultyIds.includes(f.id)
                          ? "bg-primary-600 text-white border-primary-600"
                          : "border-gray-300 dark:border-gray-700"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={editFacultyIds.includes(f.id)}
                        onChange={() => toggleEditFacultySelection(f.id)}
                      />
                      {f.name}
                    </label>
                  ))}
                </div>
              )}
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
              key={c.id}
              className="rounded-[20px] bg-white/80 dark:bg-navy-800/70 backdrop-blur-xl shadow-apple dark:shadow-none ring-1 ring-black/[0.04] dark:ring-white/[0.08] p-4 flex items-center justify-between"
            >
              <div>
                <Link
                  to={`/admin/categories/${c.id}/subcategories`}
                  className="font-medium hover:text-primary-600 dark:hover:text-primary-400"
                >
                  {c.name}
                </Link>
                <p className="text-xs text-gray-500 mt-1">
                  {c.is_archived ? "Arxivda" : c.is_active ? "Faol" : "Nofaol"} ·{" "}
                  {c.visible_to_all_faculties ? "Barcha fakultetlarga" : `${c.faculty_ids.length} ta fakultetga`}
                </p>
              </div>
              <div className="flex gap-2 text-xs">
                {c.is_archived ? (
                  <button onClick={() => handleRestore(c)} className="text-primary-600">
                    Tiklash
                  </button>
                ) : (
                  <>
                    <button onClick={() => handleStartEdit(c)} className="text-gray-500 hover:text-primary-600">
                      Tahrirlash
                    </button>
                    <button onClick={() => handleToggle(c)} className="text-gray-500 hover:text-primary-600">
                      {c.is_active ? "Deactivate" : "Activate"}
                    </button>
                    <button onClick={() => handleDelete(c, false)} className="text-amber-600">
                      Arxivlash
                    </button>
                    <button onClick={() => handleDelete(c, true)} className="text-red-500">
                      Butunlay o'chirish
                    </button>
                  </>
                )}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
