import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { apiClient } from "../../api/client";

interface PopularCategory {
  category_id: number;
  category_name: string;
  session_count: number;
}
interface QuestionStat {
  question_id: number;
  question_text: string;
  subcategory_name: string;
  total_answers: number;
  correct_answers: number;
  correct_rate_percent: number;
}
interface GroupScore {
  id: number;
  name: string;
  total_answers: number;
  correct_answers: number;
  average_score_percent: number;
}
interface ActivityPoint {
  period: string;
  sessions: number;
}
interface TopUser {
  user_id: number;
  first_name: string;
  last_name: string;
  phone: string;
  session_count: number;
}

export default function AdminAnalytics() {
  const [popular, setPopular] = useState<PopularCategory[]>([]);
  const [easy, setEasy] = useState<QuestionStat[]>([]);
  const [hard, setHard] = useState<QuestionStat[]>([]);
  const [facultyStats, setFacultyStats] = useState<GroupScore[]>([]);
  const [groupStats, setGroupStats] = useState<GroupScore[]>([]);
  const [activity, setActivity] = useState<ActivityPoint[]>([]);
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);

  useEffect(() => {
    apiClient.get("/admin/analytics/popular-categories").then((r) => setPopular(r.data));
    apiClient.get("/admin/analytics/easy-questions?limit=10").then((r) => setEasy(r.data));
    apiClient.get("/admin/analytics/hard-questions?limit=10").then((r) => setHard(r.data));
    apiClient.get("/admin/analytics/faculty-stats").then((r) => setFacultyStats(r.data));
    apiClient.get("/admin/analytics/group-stats").then((r) => setGroupStats(r.data));
    apiClient.get("/admin/analytics/activity?period=daily&days=30").then((r) => setActivity(r.data));
    apiClient.get("/admin/analytics/top-users?limit=10").then((r) => setTopUsers(r.data));
  }, []);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Analitika</h1>

      <ChartCard title="Eng ko'p tanlangan yo'nalishlar">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={popular}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="category_name" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="session_count" fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Faollik grafigi (so'nggi 30 kun)">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={activity}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="period" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5, 10)} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Line type="monotone" dataKey="sessions" stroke="#6366f1" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid md:grid-cols-2 gap-6">
        <ChartCard title="Fakultet bo'yicha o'rtacha natija">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={facultyStats}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis unit="%" />
              <Tooltip />
              <Bar dataKey="average_score_percent" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Guruh bo'yicha o'rtacha natija">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={groupStats}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis unit="%" />
              <Tooltip />
              <Bar dataKey="average_score_percent" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <QuestionTable title="Eng oson savollar (ko'p to'g'ri javob)" items={easy} />
        <QuestionTable title="Eng qiyin savollar (ko'p noto'g'ri javob)" items={hard} />
      </div>

      <ChartCard title="Eng faol userlar">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-gray-500 border-b border-gray-200 dark:border-gray-800">
              <tr>
                <th className="py-2 pr-4">Ism familiya</th>
                <th className="py-2 pr-4">Telefon</th>
                <th className="py-2">Testlar soni</th>
              </tr>
            </thead>
            <tbody>
              {topUsers.map((u) => (
                <tr key={u.user_id} className="border-b border-gray-100 dark:border-gray-800/50">
                  <td className="py-2 pr-4">{u.first_name} {u.last_name}</td>
                  <td className="py-2 pr-4">{u.phone}</td>
                  <td className="py-2">{u.session_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[20px] bg-white/80 dark:bg-navy-800/70 backdrop-blur-xl shadow-apple dark:shadow-none ring-1 ring-black/[0.04] dark:ring-white/[0.08] p-5">
      <h2 className="font-medium mb-3">{title}</h2>
      {children}
    </section>
  );
}

function QuestionTable({ title, items }: { title: string; items: QuestionStat[] }) {
  return (
    <ChartCard title={title}>
      <ul className="space-y-2 text-sm">
        {items.map((q) => (
          <li key={q.question_id} className="flex justify-between gap-3 border-b border-gray-100 dark:border-gray-800/50 pb-2">
            <span className="truncate">{q.question_text}</span>
            <span className="text-gray-500 shrink-0">{q.correct_rate_percent}%</span>
          </li>
        ))}
        {items.length === 0 && <p className="text-gray-500">Ma'lumot yo'q</p>}
      </ul>
    </ChartCard>
  );
}
