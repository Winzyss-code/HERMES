import { useEffect, useMemo, useState } from "react";

import client from "../api/client";
import { useAuth } from "../context/AuthContext";


const MetricCard = ({ label, value, tone = "indigo" }) => {
  const colors = {
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-200 dark:border-indigo-500/30",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-200 dark:border-emerald-500/30",
    rose: "bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-500/10 dark:text-rose-200 dark:border-rose-500/30",
    purple: "bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-500/10 dark:text-purple-200 dark:border-purple-500/30",
  };

  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${colors[tone]}`}>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-75">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
    </div>
  );
};

const RoleBadge = ({ role }) => {
  const tone =
    role === "super_admin"
      ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200"
      : role === "org_admin"
        ? "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-500/30 dark:bg-purple-500/10 dark:text-purple-200"
        : role === "hr_admin"
          ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200"
          : "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-200";

  return (
    <span className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${tone}`}>
      {role}
    </span>
  );
};

const OrganizationsPage = () => {
  const { username } = useAuth();
  const [organizations, setOrganizations] = useState([]);
  const [users, setUsers] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [selectedOrganization, setSelectedOrganization] = useState(null);
  const [organizationUsers, setOrganizationUsers] = useState([]);
  const [resetTarget, setResetTarget] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  const organizationNameById = useMemo(() => {
    return organizations.reduce((acc, organization) => {
      acc[organization.id] = organization.name;
      return acc;
    }, {});
  }, [organizations]);

  const fetchOrganizations = async () => {
    const response = await client.get("/organizations");
    setOrganizations(response.data);
  };

  const fetchMetrics = async () => {
    const response = await client.get("/platform/metrics");
    setMetrics(response.data);
  };

  const fetchUsers = async () => {
    const response = await client.get("/platform/users");
    setUsers(response.data);
  };

  const loadPage = async () => {
    try {
      await Promise.all([fetchOrganizations(), fetchMetrics(), fetchUsers()]);
    } catch (err) {
      setError("Не удалось загрузить данные платформы.");
    }
  };

  useEffect(() => {
    loadPage();
  }, []);

  const updateStatus = async (organization, nextStatus) => {
    setError(null);
    setSuccess(null);
    try {
      await client.patch(`/organizations/${organization.id}/status`, {
        status: nextStatus,
      });
      await loadPage();
      setSuccess(`Организация ${organization.name} переведена в статус ${nextStatus}.`);
    } catch (err) {
      setError("Не удалось изменить статус организации.");
    }
  };

  const openUsers = async (organization) => {
    setSelectedOrganization(organization);
    setOrganizationUsers([]);
    setIsLoadingUsers(true);
    setError(null);
    try {
      const response = await client.get(`/organizations/${organization.id}/users`);
      setOrganizationUsers(response.data);
    } catch (err) {
      setError("Не удалось загрузить пользователей организации.");
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const resetPassword = async (event) => {
    event.preventDefault();
    if (!resetTarget) return;
    setError(null);
    setSuccess(null);
    try {
      await client.patch(`/platform/users/${resetTarget.id}/password`, {
        password: newPassword,
      });
      setSuccess(`Пароль пользователя ${resetTarget.username} сброшен.`);
      setResetTarget(null);
      setNewPassword("");
      await fetchUsers();
    } catch (err) {
      setError(err.response?.data?.detail || "Не удалось сбросить пароль.");
    }
  };

  const deleteUser = async (user) => {
    if (!window.confirm(`Удалить учетную запись ${user.username}?`)) {
      return;
    }
    setError(null);
    setSuccess(null);
    try {
      await client.delete(`/platform/users/${user.id}`);
      setSuccess(`Учетная запись ${user.username} удалена.`);
      await Promise.all([fetchUsers(), fetchMetrics()]);
      if (selectedOrganization?.id === user.organization_id) {
        const response = await client.get(`/organizations/${selectedOrganization.id}/users`);
        setOrganizationUsers(response.data);
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Не удалось удалить учетную запись.");
    }
  };

  return (
    <main className="px-4 py-8 lg:px-10">
      <div className="mx-auto w-full max-w-7xl space-y-8">
        <section className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm dark:border-purple-500/30 dark:bg-slate-900">
          <p className="text-sm font-semibold text-purple-600 dark:text-purple-300">Super Admin</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
            Security Dashboard платформы
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            Глобальный администратор управляет организациями и учетными записями. HR-данные остаются зашифрованными и недоступными в plaintext.
          </p>
        </section>

        {metrics && (
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Организации" value={metrics.organizations_total} tone="indigo" />
            <MetricCard label="Активные" value={metrics.organizations_active} tone="emerald" />
            <MetricCard label="Заблокированы" value={metrics.organizations_suspended} tone="rose" />
            <MetricCard label="Пользователи" value={metrics.users_total} tone="purple" />
            <MetricCard label="Вакансии" value={metrics.jobs_total} tone="indigo" />
            <MetricCard label="Кандидаты" value={metrics.candidates_total} tone="purple" />
            <MetricCard label="Сотрудники" value={metrics.employees_total} tone="emerald" />
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Zero-Knowledge</p>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Super admin видит аккаунты и метаданные, но не расшифрованные карточки сотрудников.
              </p>
            </div>
          </section>
        )}

        {error && <p className="rounded-xl bg-rose-50 p-3 text-sm font-medium text-rose-700 dark:bg-rose-500/10 dark:text-rose-200">{error}</p>}
        {success && <p className="rounded-xl bg-emerald-50 p-3 text-sm font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200">{success}</p>}

        <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="border-b border-slate-100 p-6 dark:border-slate-700">
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">Все пользователи платформы</h2>
            <p className="mt-1 text-sm text-slate-500">Сброс пароля и удаление учетных записей доступны только super admin.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-6 py-4">Логин</th>
                  <th className="px-6 py-4">Роль</th>
                  <th className="px-6 py-4">Организация</th>
                  <th className="px-6 py-4">Создан</th>
                  <th className="px-6 py-4">Действия</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const isCurrentUser = user.username === username;
                  return (
                    <tr key={user.id} className="border-t border-slate-100 hover:bg-slate-50/70 dark:border-slate-700 dark:hover:bg-slate-800/60">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900">{user.username}</p>
                        {isCurrentUser && <p className="mt-1 text-xs text-slate-400">текущая сессия</p>}
                      </td>
                      <td className="px-6 py-4"><RoleBadge role={user.role} /></td>
                      <td className="px-6 py-4 text-slate-500">
                        {user.organization_id ? organizationNameById[user.organization_id] || user.organization_id : "Platform"}
                      </td>
                      <td className="px-6 py-4 text-slate-500">{new Date(user.created_at).toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-indigo-200 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-200"
                            disabled={isCurrentUser}
                            onClick={() => {
                              setResetTarget(user);
                              setNewPassword("");
                            }}
                          >
                            Сбросить пароль
                          </button>
                          <button
                            className="rounded-xl bg-rose-600 px-3 py-2 text-xs font-semibold text-white transition hover:-translate-y-0.5 hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-40"
                            disabled={isCurrentUser}
                            onClick={() => deleteUser(user)}
                          >
                            Удалить
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="border-b border-slate-100 p-6 dark:border-slate-700">
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">Организации</h2>
            <p className="mt-1 text-sm text-slate-500">Suspend отключает вход пользователей tenant-а.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-6 py-4">Компания</th>
                  <th className="px-6 py-4">Статус</th>
                  <th className="px-6 py-4">Создана</th>
                  <th className="px-6 py-4">Действия</th>
                </tr>
              </thead>
              <tbody>
                {organizations.map((organization) => (
                  <tr key={organization.id} className="border-t border-slate-100 hover:bg-slate-50/70 dark:border-slate-700 dark:hover:bg-slate-800/60">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900">{organization.name}</p>
                      <p className="mt-1 font-mono text-xs text-slate-400">{organization.id}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                        organization.status === "active"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200"
                          : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200"
                      }`}>
                        {organization.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(organization.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-indigo-200 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-200"
                          onClick={() => openUsers(organization)}
                        >
                          Пользователи
                        </button>
                        <button
                          className={`rounded-xl px-3 py-2 text-xs font-semibold text-white transition hover:-translate-y-0.5 ${
                            organization.status === "active"
                              ? "bg-rose-600 hover:bg-rose-500"
                              : "bg-emerald-600 hover:bg-emerald-500"
                          }`}
                          onClick={() => updateStatus(organization, organization.status === "active" ? "suspended" : "active")}
                        >
                          {organization.status === "active" ? "Suspend" : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {selectedOrganization && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/35 backdrop-blur-sm" onClick={() => setSelectedOrganization(null)}>
          <aside className="h-full w-full max-w-xl overflow-y-auto border-l border-slate-100 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-950" onClick={(event) => event.stopPropagation()}>
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-purple-600 dark:text-purple-300">Tenant Users</p>
                <h3 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{selectedOrganization.name}</h3>
                <p className="mt-2 text-sm text-slate-500">Super admin видит аккаунты, но не HR plaintext.</p>
              </div>
              <button className="rounded-xl border border-slate-100 px-3 py-2 text-sm text-slate-500 transition hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900" onClick={() => setSelectedOrganization(null)}>
                Закрыть
              </button>
            </div>
            {isLoadingUsers ? (
              <div className="space-y-3">
                {[0, 1, 2].map((row) => (
                  <div key={row} className="h-16 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {organizationUsers.map((user) => (
                  <div key={user.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{user.username}</p>
                        <p className="mt-1 text-xs text-slate-500">{new Date(user.created_at).toLocaleString()}</p>
                      </div>
                      <RoleBadge role={user.role} />
                    </div>
                  </div>
                ))}
                {organizationUsers.length === 0 && (
                  <p className="rounded-2xl border border-slate-100 p-5 text-sm text-slate-500 dark:border-slate-700">
                    Пользователей нет.
                  </p>
                )}
              </div>
            )}
          </aside>
        </div>
      )}

      {resetTarget && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 px-4 backdrop-blur-sm" onClick={() => setResetTarget(null)}>
          <form className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-950" onSubmit={resetPassword} onClick={(event) => event.stopPropagation()}>
            <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-300">Password Reset</p>
            <h3 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
              Новый пароль для {resetTarget.username}
            </h3>
            <label className="mt-5 block text-sm font-semibold text-slate-700 dark:text-slate-200">
              Новый пароль
              <input
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-indigo-500/20"
                minLength={6}
                required
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
              />
            </label>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
                onClick={() => setResetTarget(null)}
              >
                Отмена
              </button>
              <button
                type="submit"
                className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:-translate-y-0.5 hover:bg-indigo-500"
              >
                Сбросить пароль
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
};

export default OrganizationsPage;
