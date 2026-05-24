import { Link, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext.jsx";


const ShieldIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M12 3.25 19 6v5.2c0 4.45-2.83 8.4-7 9.83-4.17-1.43-7-5.38-7-9.83V6l7-2.75Z"
      className="fill-indigo-600"
    />
    <path
      d="m9.35 12.1 1.78 1.78 3.72-4.08"
      stroke="white"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const SunIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 7.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9Z" stroke="currentColor" strokeWidth="1.8" />
    <path d="M12 2.75v2.1M12 19.15v2.1M21.25 12h-2.1M4.85 12h-2.1M18.54 5.46l-1.49 1.49M6.95 17.05l-1.49 1.49M18.54 18.54l-1.49-1.49M6.95 6.95 5.46 5.46" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const navItems = {
  super_admin: [{ to: "/organizations", label: "Организации", accent: "purple" }],
  org_admin: [{ to: "/users", label: "Пользователи", accent: "indigo" }],
  hr_admin: [{ to: "/employees", label: "Сотрудники", accent: "emerald" }],
  recruiter: [{ to: "/jobs", label: "Вакансии и ИИ", accent: "purple" }],
};

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { username, role, organizationName, logout } = useAuth();
  const roleLabels = {
    super_admin: "SUPER ADMIN",
    org_admin: "ORG ADMIN",
    hr_admin: "HR ADMIN",
    recruiter: "RECRUITER",
  };
  const roleLabel = roleLabels[role] || "USER";
  const items = navItems[role] || [];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-white/70 bg-white/80 p-5 shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl lg:block">
        <div className="flex h-full flex-col">
          <Link className="group flex items-center gap-3" to={role === "hr_admin" ? "/employees" : role === "recruiter" ? "/jobs" : role === "org_admin" ? "/users" : "/organizations"}>
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100 transition-transform duration-200 group-hover:scale-105">
              <ShieldIcon />
            </span>
            <div>
              <p className="text-lg font-semibold tracking-tight text-slate-950">HERMES</p>
              <p className="text-xs font-medium text-slate-500">Secure Hiring OS</p>
            </div>
          </Link>

          <div className="mt-8 rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Текущая роль</p>
            <span className={`mt-3 inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${role === "hr_admin" ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-purple-50 text-purple-700 ring-purple-200"}`}>
              {roleLabel}
            </span>
            {organizationName && (
              <p className="mt-3 text-xs font-medium text-slate-500">{organizationName}</p>
            )}
          </div>

          <nav className="mt-6 space-y-2">
            {items.map((item) => {
              const active = location.pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  className={`group flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                    active
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                      : "text-slate-600 hover:bg-white hover:text-slate-950 hover:shadow-sm"
                  }`}
                  to={item.to}
                >
                  <span>{item.label}</span>
                  <span className={`h-2 w-2 rounded-full ${active ? "bg-white" : item.accent === "emerald" ? "bg-emerald-400" : item.accent === "indigo" ? "bg-indigo-400" : "bg-purple-400"}`} />
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">Zero-Knowledge Ready</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              HR-данные шифруются на устройстве и не раскрываются серверу.
            </p>
          </div>
        </div>
      </aside>

      <header className="fixed left-0 right-0 top-0 z-30 border-b border-slate-100 bg-white/80 px-4 py-3 backdrop-blur-xl lg:left-72 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">HERMES Dashboard</p>
            <h1 className="text-lg font-semibold tracking-tight text-slate-900">
              {role === "hr_admin"
                ? "Защищенный HR-модуль"
                : role === "recruiter"
                  ? "ИИ-скрининг кандидатов"
                  : role === "org_admin"
                    ? "Управление организацией"
                    : "Платформа HERMES"}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-100 bg-white text-slate-500 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:text-indigo-600 hover:shadow-md" type="button" title="Theme">
              <SunIcon />
            </button>
            <div className="hidden items-center gap-3 rounded-2xl border border-slate-100 bg-white py-1.5 pl-2 pr-4 shadow-sm sm:flex">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 text-sm font-semibold text-white">
                {(username || "H").slice(0, 1).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{username}</p>
                <p className="text-xs text-slate-500">{roleLabel}</p>
              </div>
            </div>
            <button
              className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-600 hover:shadow-lg hover:shadow-indigo-600/20"
              onClick={handleLogout}
            >
              Выйти
            </button>
          </div>
        </div>
      </header>
    </>
  );
};

export default Navbar;
