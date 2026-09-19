import { useEffect, useState } from "react";
import { apiClient, apiErrorMessage } from "../../api/client";
import { UserOut } from "../../api/types";

interface UserStats {
  total_sessions: number;
  completed_sessions: number;
  total_answers: number;
  correct_answers: number;
  accuracy_percent: number;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserOut[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [statsFor, setStatsFor] = useState<number | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);

  function loadUsers() {
    apiClient.get("/admin/users").then((res) => setUsers(res.data));
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function handleToggleActive(u: UserOut) {
    setError(null);
    try {
      await apiClient.patch(`/admin/users/${u.id}/active`, { is_active: !u.is_active });
      loadUsers();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  async function handleChangePassword(u: UserOut) {
    const newPassword = prompt(`${u.first_name} ${u.last_name} uchun yangi parol kiriting (kamida 6 belgi):`);
    if (!newPassword) return;
    setError(null);
    try {
      await apiClient.patch(`/admin/users/${u.id}/password`, { new_password: newPassword });
      alert("Parol muvaffaqiyatli o'zgartirildi");
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  async function handleShowStats(u: UserOut) {
    setStatsFor(u.id);
    setStats(null);
    const res = await apiClient.get(`/admin/users/${u.id}/stats`);
    setStats(res.data);
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Foydalanuvchilar</h1>
      {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

      <div className="overflow-x-auto rounded-[20px] bg-white/80 dark:bg-navy-800/70 backdrop-blur-xl shadow-apple dark:shadow-none ring-1 ring-black/[0.04] dark:ring-white/[0.08]">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200 dark:border-gray-800 text-left text-gray-500">
            <tr>
              <th className="px-4 py-3">Ism familiya</th>
              <th className="px-4 py-3">Telefon</th>
              <th className="px-4 py-3">Holat</th>
              <th className="px-4 py-3">Amallar</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-gray-100 dark:border-gray-800/50">
                <td className="px-4 py-3">{u.first_name} {u.last_name}</td>
                <td className="px-4 py-3">{u.phone}</td>
                <td className="px-4 py-3">
                  <span className={u.is_active ? "text-green-600 dark:text-green-400" : "text-red-500"}>
                    {u.is_active ? "Faol" : "Deactivate qilingan"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-3 text-xs">
                    <button onClick={() => handleShowStats(u)} className="text-primary-600 dark:text-primary-400">
                      Statistika
                    </button>
                    <button onClick={() => handleChangePassword(u)} className="text-gray-500 hover:text-primary-600">
                      Parol o'zgartirish
                    </button>
                    <button onClick={() => handleToggleActive(u)} className={u.is_active ? "text-red-500" : "text-green-600"}>
                      {u.is_active ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {statsFor && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center px-4" onClick={() => setStatsFor(null)}>
          <div
            className="w-full max-w-sm bg-white/80 dark:bg-navy-800/70 backdrop-blur-xl rounded-[22px] shadow-[0_20px_60px_rgba(0,0,0,0.25)] dark:ring-1 dark:ring-white/[0.08] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-medium mb-4">Foydalanuvchi statistikasi</h2>
            {!stats && <p className="text-sm text-gray-500">Yuklanmoqda...</p>}
            {stats && (
              <ul className="text-sm space-y-2">
                <li>Jami testlar: {stats.total_sessions}</li>
                <li>Tugallangan testlar: {stats.completed_sessions}</li>
                <li>Jami javoblar: {stats.total_answers}</li>
                <li>To'g'ri javoblar: {stats.correct_answers}</li>
                <li className="font-medium">Aniqlik: {stats.accuracy_percent}%</li>
              </ul>
            )}
            <button onClick={() => setStatsFor(null)} className="mt-4 text-sm text-primary-600 dark:text-primary-400">
              Yopish
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
