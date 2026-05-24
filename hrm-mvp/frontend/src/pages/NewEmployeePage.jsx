import { useState } from "react";
import { useNavigate } from "react-router-dom";

import client from "../api/client";
import { encryptEmployee } from "../crypto/encryption";
import { useAuth } from "../context/AuthContext.jsx";


const NewEmployeePage = () => {
  const navigate = useNavigate();
  const { cryptoKey } = useAuth();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    salary: "",
    skills: "",
    experience: "",
    departmentId: "1",
    status: "active",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setIsSaving(true);
    try {
      const encrypted = await encryptEmployee(cryptoKey, {
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        salary: form.salary,
        skills: form.skills,
        experience: form.experience,
      });
      await client.post("/employees", {
        department_id: Number(form.departmentId),
        status: form.status,
        encrypted_data: encrypted.encrypted_data,
        iv: encrypted.iv,
      });
      navigate("/employees");
    } catch (err) {
      setError("Не удалось сохранить сотрудника.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="flex min-h-[calc(100vh-96px)] items-start justify-center px-4 py-8 lg:px-10">
      <div className="w-full max-w-4xl">
        <div className="mb-6 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5">
          <p className="text-sm font-semibold text-emerald-700">AES-GCM Encryption</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Новый сотрудник</h1>
          <p className="mt-2 text-sm text-slate-600">Все поля ниже будут собраны в JSON и зашифрованы в браузере перед отправкой.</p>
        </div>

        <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          {error && <p className="mb-4 rounded-xl bg-rose-50 p-3 text-sm font-medium text-rose-700">{error}</p>}
          <form className="grid gap-5 sm:grid-cols-2" onSubmit={handleSubmit}>
            <label className="block text-sm font-semibold text-slate-700 sm:col-span-2">
              ФИО
              <input className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-50" name="fullName" value={form.fullName} onChange={handleChange} required />
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Email
              <input className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-50" type="email" name="email" value={form.email} onChange={handleChange} required />
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Телефон
              <input className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-50" name="phone" value={form.phone} onChange={handleChange} required />
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Базовый оклад
              <input className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-50" name="salary" value={form.salary} onChange={handleChange} required />
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Department ID
              <input className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-50" type="number" min="1" name="departmentId" value={form.departmentId} onChange={handleChange} required />
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Статус
              <select className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-50" name="status" value={form.status} onChange={handleChange}>
                <option value="active">active</option>
                <option value="inactive">inactive</option>
              </select>
            </label>
            <label className="block text-sm font-semibold text-slate-700 sm:col-span-2">
              Навыки
              <input className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-50" name="skills" placeholder="Python, FastAPI, PostgreSQL" value={form.skills} onChange={handleChange} />
            </label>
            <label className="block text-sm font-semibold text-slate-700 sm:col-span-2">
              Опыт работы
              <textarea className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-50" rows="5" name="experience" placeholder="Senior backend developer, 5 years of production experience..." value={form.experience} onChange={handleChange} />
            </label>
            <div className="flex justify-end gap-3 sm:col-span-2">
              <button type="button" className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50" onClick={() => navigate("/employees")}>
                Отмена
              </button>
              <button className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-500 disabled:opacity-50" disabled={isSaving}>
                {isSaving ? "Шифрование..." : "Сохранить"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
};

export default NewEmployeePage;
