import { useEffect, useState } from "react";

import client from "../api/client";
import { useAuth } from "../context/AuthContext.jsx";


const roleBadge = (role) =>
  role === "hr_admin"
    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : role === "recruiter"
      ? "bg-purple-50 text-purple-700 border-purple-200"
      : "bg-indigo-50 text-indigo-700 border-indigo-200";

const UsersPage = () => {
  const { organizationName } = useAuth();
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({
    username: "",
    password: "",
    role: "recruiter",
  });
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchUsers = async () => {
    const response = await client.get("/users");
    setUsers(response.data);
  };

  useEffect(() => {
    fetchUsers().catch(() => setError("Не удалось загрузить пользователей."));
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    setMessage(null);
    try {
      await client.post("/users", form);
      setForm({ username: "", password: "", role: "recruiter" });
      setMessage("Пользователь создан внутри организации.");
      await fetchUsers();
    } catch (err) {
      setError("Не удалось создать пользователя. Возможно, логин уже занят.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="px-4 py-8 lg:px-10">
      <div className="mx-auto w-full max-w-6xl space-y-8">
        <section className="rounded-2xl border border-indigo-100 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-indigo-600">Organization Admin</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
            Пользователи организации
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {organizationName || "Ваша компания"} управляет ролями HR и recruiter централизованно.
          </p>
        </section>

        <section className="grid gap-6 lg:grid-cols-[380px_1fr]">
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">
              Создать пользователя
            </h2>
            {error && <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm font-medium text-rose-700">{error}</p>}
            {message && <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm font-medium text-emerald-700">{message}</p>}
            <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
              <label className="block text-sm font-semibold text-slate-700">
                Логин
                <input
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  required
                />
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Пароль
                <input
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  minLength="6"
                  required
                />
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Роль
                <select
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                >
                  <option value="recruiter">Recruiter</option>
                  <option value="hr_admin">HR Admin</option>
                </select>
              </label>
              <button
                className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-500 disabled:opacity-50"
                disabled={isSaving}
              >
                {isSaving ? "Создание..." : "Выдать доступ"}
              </button>
            </form>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-6">
              <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                Аккаунты компании
              </h2>
            </div>
            <table className="min-w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-6 py-4">Логин</th>
                  <th className="px-6 py-4">Роль</th>
                  <th className="px-6 py-4">Создан</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-t border-slate-100 hover:bg-slate-50/70">
                    <td className="px-6 py-4 font-semibold text-slate-900">{user.username}</td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${roleBadge(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(user.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
};

export default UsersPage;
