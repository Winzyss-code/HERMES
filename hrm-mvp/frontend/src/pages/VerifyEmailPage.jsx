import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import ThemeToggle from "../components/ThemeToggle.jsx";
import client from "../api/client";


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


const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("Подтверждаем email...");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      setMessage("Ссылка подтверждения некорректна: token отсутствует.");
      return;
    }

    client
      .get(`/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then((response) => {
        setStatus("success");
        setMessage(response.data.message || "Email подтвержден. Теперь можно войти.");
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err.response?.data?.detail || "Не удалось подтвердить email.");
      });
  }, [searchParams]);

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4">
      <ThemeToggle className="fixed right-5 top-5 z-50" />
      <section className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-6 text-center shadow-xl shadow-slate-200/60">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/25">
          <ShieldLogo />
        </div>
        <p className="text-sm font-semibold text-indigo-600">HERMES Verification</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
          Подтверждение email
        </h1>
        <p className={`mt-4 rounded-xl p-3 text-sm font-medium ${
          status === "success"
            ? "bg-emerald-50 text-emerald-700"
            : status === "error"
              ? "bg-rose-50 text-rose-700"
              : "bg-slate-50 text-slate-600"
        }`}>
          {message}
        </p>
        <Link className="mt-6 inline-flex rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:-translate-y-0.5 hover:bg-indigo-500" to="/login">
          Перейти ко входу
        </Link>
      </section>
    </main>
  );
};

export default VerifyEmailPage;
