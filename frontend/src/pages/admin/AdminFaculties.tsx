import { FormEvent, useEffect, useState } from "react";
import { apiClient, apiErrorMessage } from "../../api/client";
import { Faculty, Group } from "../../api/types";

export default function AdminFaculties() {
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [selectedFaculty, setSelectedFaculty] = useState<number | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);

  const [newFacultyName, setNewFacultyName] = useState("");
  const [newGroupName, setNewGroupName] = useState("");
  const [error, setError] = useState<string | null>(null);

  function loadFaculties() {
    apiClient.get("/admin/faculties").then((res) => setFaculties(res.data));
  }

  useEffect(() => {
    loadFaculties();
  }, []);

  useEffect(() => {
    if (selectedFaculty == null) {
      setGroups([]);
      return;
    }
    apiClient.get(`/admin/faculties/${selectedFaculty}/groups`).then((res) => setGroups(res.data));
  }, [selectedFaculty]);

  async function handleCreateFaculty(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await apiClient.post("/admin/faculties", { name: newFacultyName });
      setNewFacultyName("");
      loadFaculties();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  async function handleToggleFaculty(f: Faculty) {
    await apiClient.put(`/admin/faculties/${f.id}`, { is_active: !f.is_active });
    loadFaculties();
  }

  async function handleEditFaculty(f: Faculty) {
    const newName = prompt("Fakultet nomini tahrirlash:", f.name);
    if (!newName || newName === f.name) return;
    setError(null);
    try {
      await apiClient.put(`/admin/faculties/${f.id}`, { name: newName });
      loadFaculties();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  async function handleDeleteFaculty(f: Faculty) {
    if (!confirm(`"${f.name}" fakultetini o'chirasizmi?`)) return;
    await apiClient.delete(`/admin/faculties/${f.id}`);
    if (selectedFaculty === f.id) setSelectedFaculty(null);
    loadFaculties();
  }

  async function handleCreateGroup(e: FormEvent) {
    e.preventDefault();
    if (!selectedFaculty) return;
    setError(null);
    try {
      await apiClient.post("/admin/groups", { name: newGroupName, faculty_id: selectedFaculty });
      setNewGroupName("");
      const res = await apiClient.get(`/admin/faculties/${selectedFaculty}/groups`);
      setGroups(res.data);
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  async function handleToggleGroup(g: Group) {
    await apiClient.put(`/admin/groups/${g.id}`, { is_active: !g.is_active });
    const res = await apiClient.get(`/admin/faculties/${selectedFaculty}/groups`);
    setGroups(res.data);
  }

  async function handleEditGroup(g: Group) {
    const newName = prompt("Guruh nomini tahrirlash:", g.name);
    if (!newName || newName === g.name) return;
    setError(null);
    try {
      await apiClient.put(`/admin/groups/${g.id}`, { name: newName });
      const res = await apiClient.get(`/admin/faculties/${selectedFaculty}/groups`);
      setGroups(res.data);
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  async function handleDeleteGroup(g: Group) {
    if (!confirm(`"${g.name}" guruhini o'chirasizmi?`)) return;
    await apiClient.delete(`/admin/groups/${g.id}`);
    const res = await apiClient.get(`/admin/faculties/${selectedFaculty}/groups`);
    setGroups(res.data);
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Fakultet / Guruh</h1>
      {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

      <div className="grid md:grid-cols-2 gap-6">
        <section className="rounded-[20px] bg-white/80 dark:bg-navy-800/70 backdrop-blur-xl shadow-apple dark:shadow-none ring-1 ring-black/[0.04] dark:ring-white/[0.08] p-5">
          <h2 className="font-medium mb-3">Fakultetlar</h2>
          <form onSubmit={handleCreateFaculty} className="flex gap-2 mb-4">
            <input
              required
              value={newFacultyName}
              onChange={(e) => setNewFacultyName(e.target.value)}
              placeholder="Yangi fakultet nomi"
              className="flex-1 rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent transition-colors px-3 py-1.5 text-sm"
            />
            <button className="rounded-full bg-primary-600 hover:bg-primary-700 text-white transition-colors px-3 py-1.5 text-sm">
              Qo'shish
            </button>
          </form>
          <ul className="space-y-1.5">
            {faculties.map((f) => (
              <li
                key={f.id}
                onClick={() => setSelectedFaculty(f.id)}
                className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm cursor-pointer ${
                  selectedFaculty === f.id
                    ? "bg-primary-50 dark:bg-primary-900/30 border border-primary-400"
                    : "border border-transparent hover:bg-black/5 dark:hover:bg-gray-700/50"
                }`}
              >
                <span className={f.is_active ? "" : "text-gray-400 line-through"}>{f.name}</span>
                <span className="flex gap-2 text-xs">
                  <button onClick={(e) => { e.stopPropagation(); handleEditFaculty(f); }} className="text-gray-500 hover:text-primary-600">
                    Tahrirlash
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleToggleFaculty(f); }} className="text-gray-500 hover:text-primary-600">
                    {f.is_active ? "O'chirish (vaqtincha)" : "Yoqish"}
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteFaculty(f); }} className="text-red-500">
                    O'chirish
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-[20px] bg-white/80 dark:bg-navy-800/70 backdrop-blur-xl shadow-apple dark:shadow-none ring-1 ring-black/[0.04] dark:ring-white/[0.08] p-5">
          <h2 className="font-medium mb-3">
            Guruhlar {selectedFaculty && <span className="text-gray-400 text-sm">— {faculties.find((f) => f.id === selectedFaculty)?.name}</span>}
          </h2>
          {!selectedFaculty && <p className="text-sm text-gray-500">Guruhlarni ko'rish uchun chapdan fakultet tanlang.</p>}
          {selectedFaculty && (
            <>
              <form onSubmit={handleCreateGroup} className="flex gap-2 mb-4">
                <input
                  required
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Yangi guruh nomi"
                  className="flex-1 rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent transition-colors px-3 py-1.5 text-sm"
                />
                <button className="rounded-full bg-primary-600 hover:bg-primary-700 text-white transition-colors px-3 py-1.5 text-sm">
                  Qo'shish
                </button>
              </form>
              <ul className="space-y-1.5">
                {groups.map((g) => (
                  <li key={g.id} className="flex items-center justify-between rounded-xl px-3 py-2 text-sm border border-transparent hover:bg-black/5 dark:hover:bg-gray-700/50">
                    <span className={g.is_active ? "" : "text-gray-400 line-through"}>{g.name}</span>
                    <span className="flex gap-2 text-xs">
                      <button onClick={() => handleEditGroup(g)} className="text-gray-500 hover:text-primary-600">
                        Tahrirlash
                      </button>
                      <button onClick={() => handleToggleGroup(g)} className="text-gray-500 hover:text-primary-600">
                        {g.is_active ? "O'chirish (vaqtincha)" : "Yoqish"}
                      </button>
                      <button onClick={() => handleDeleteGroup(g)} className="text-red-500">
                        O'chirish
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
