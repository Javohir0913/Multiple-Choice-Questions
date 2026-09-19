import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiClient, apiErrorMessage } from "../api/client";
import { Faculty, Group } from "../api/types";
import { ThemeToggle } from "../components/ThemeToggle";
import { Select } from "../components/Select";

export default function Register() {
  const navigate = useNavigate();
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [facultyId, setFacultyId] = useState<number | "">("");
  const [groupId, setGroupId] = useState<number | "">("");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiClient.get("/faculties").then((res) => setFaculties(res.data));
  }, []);

  useEffect(() => {
    setGroupId("");
    if (facultyId === "") {
      setGroups([]);
      return;
    }
    apiClient.get(`/faculties/${facultyId}/groups`).then((res) => setGroups(res.data));
  }, [facultyId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!facultyId || !groupId) {
      setError("Fakultet va guruhni tanlang");
      return;
    }
    setLoading(true);
    try {
      await apiClient.post("/auth/register", {
        first_name: firstName,
        last_name: lastName,
        phone,
        password,
        faculty_id: facultyId,
        group_id: groupId,
      });
      navigate("/login");
    } catch (err) {
      setError(apiErrorMessage(err, "Ro'yxatdan o'tishda xatolik"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md bg-white/80 dark:bg-navy-800/70 backdrop-blur-xl rounded-[22px] shadow-apple-lg dark:shadow-none dark:ring-1 dark:ring-white/[0.08] p-8">
        <h1 className="text-xl font-semibold mb-1">Ro'yxatdan o'tish</h1>
        <p className="text-sm text-gray-500 mb-6">Test platformasidan foydalanish uchun ro'yxatdan o'ting</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1">Ism</label>
              <input
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent transition-colors px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Familiya</label>
              <input
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent transition-colors px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm mb-1">Telefon raqam</label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+998901234567"
              className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent transition-colors px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Parol</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent transition-colors px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1">Fakultet</label>
              <Select
                value={facultyId}
                onChange={(v) => setFacultyId(v)}
                options={faculties.map((f) => ({ value: f.id, label: f.name }))}
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Guruh</label>
              <Select
                value={groupId}
                onChange={(v) => setGroupId(v)}
                disabled={!facultyId}
                options={groups.map((g) => ({ value: g.id, label: g.name }))}
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-primary-600 hover:bg-primary-700 text-white transition-colors py-2 font-medium disabled:opacity-60"
          >
            {loading ? "Yuborilmoqda..." : "Ro'yxatdan o'tish"}
          </button>
        </form>

        <p className="text-sm text-gray-500 mt-4 text-center">
          Hisobingiz bormi?{" "}
          <Link to="/login" className="text-primary-600 dark:text-primary-400 font-medium">
            Kirish
          </Link>
        </p>
      </div>
    </div>
  );
}
