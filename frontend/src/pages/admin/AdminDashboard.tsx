import { Link } from "react-router-dom";

const CARDS = [
  { to: "/admin/faculties", title: "Fakultet / Guruh", desc: "Fakultet va guruhlarni boshqarish" },
  { to: "/admin/categories", title: "Bo'limlar", desc: "Bo'lim, sub-bo'lim va savollarni boshqarish" },
  { to: "/admin/users", title: "Foydalanuvchilar", desc: "Ro'yxatdan o'tganlar va ularning natijalari" },
  { to: "/admin/analytics", title: "Analitika", desc: "Statistika va grafiklar" },
];

export default function AdminDashboard() {
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Boshqaruv paneli</h1>
      <div className="grid sm:grid-cols-2 gap-4">
        {CARDS.map((c) => (
          <Link
            key={c.to}
            to={c.to}
            className="rounded-[20px] bg-white/80 dark:bg-navy-800/70 backdrop-blur-xl shadow-apple dark:shadow-none ring-1 ring-black/[0.04] dark:ring-white/[0.08] p-5 hover:ring-primary-400/60 hover:shadow-apple-lg transition-colors"
          >
            <h2 className="font-medium">{c.title}</h2>
            <p className="text-sm text-gray-500 mt-1">{c.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
