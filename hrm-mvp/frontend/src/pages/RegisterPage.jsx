import { useState } from "react";
import { Link } from "react-router-dom";

import ThemeToggle from "../components/ThemeToggle.jsx";
import { useAuth } from "../context/AuthContext.jsx";


const ShieldLogo = () => (
  <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M12 3.25 19 6v5.2c0 4.45-2.83 8.4-7 9.83-4.17-1.43-7-5.38-7-9.83V6l7-2.75Z"
      className="fill-white"
    />
    <path
      d="m9.35 12.1 1.78 1.78 3.72-4.08"
      stroke="#4f46e5"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
    />
  </svg>
);


const RegisterPage = () => {
  const { registerOrganization } = useAuth();
  const [form, setForm] = useState({
    organizationName: "",
    username: "",
    email: "",
    password: "",
    masterSecret: "",
  });
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    try {
      const response = await registerOrganization(
        form.organizationName,
        form.username,
        form.email,
        form.password
      );
      setMessage(response.message || "Письмо подтверждения отправлено. Проверьте почту.");
    } catch (err) {
      setError(err.response?.data?.detail || "Не удалось зарегистрировать организацию.");
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4">
      <ThemeToggle className="fixed right-5 top-5 z-50" />
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-xl font-bold text-white shadow-lg shadow-indigo-600/25">
            <ShieldLogo />
          </div>
          <p className="text-sm font-semibold text-indigo-600">Secure Hiring OS</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Регистрация организации</h1>
          <p className="mt-2 text-sm text-slate-500">
            Первый пользователь станет администратором компании после подтверждения email.
          </p>
        </div>
        <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/60">
          {error && <p className="mb-4 rounded-xl bg-rose-50 p-3 text-sm font-medium text-rose-700">{error}</p>}
          {message && <p className="mb-4 rounded-xl bg-emerald-50 p-3 text-sm font-medium text-emerald-700">{message}</p>}
          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block text-sm font-semibold text-slate-700">
              Название организации
              <input
                autoComplete="organization"
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                name="organizationName"
                value={form.organizationName}
                onChange={handleChange}
                required
              />
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Логин администратора
              <input
                autoComplete="username"
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                name="username"
                value={form.username}
                onChange={handleChange}
                required
              />
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Email администратора
              <input
                autoComplete="email"
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
              />
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Пароль
              <input
                autoComplete="new-password"
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
              Мастер-строка организации
              <input
                autoComplete="off"
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                type="password"
                name="masterSecret"
                value={form.masterSecret}
                onChange={handleChange}
                required
              />
            </label>
            <button className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-500">
              Создать организацию
            </button>
          </form>
          <p className="mt-5 text-center text-sm text-slate-500">
            Уже есть аккаунт?{" "}
            <Link className="font-semibold text-indigo-600 hover:text-indigo-500" to="/login">
              Войти
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
};

export default RegisterPage;
