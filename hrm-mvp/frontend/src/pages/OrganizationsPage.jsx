import { useEffect, useState } from "react";

import client from "../api/client";


const OrganizationsPage = () => {
  const [organizations, setOrganizations] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    client
      .get("/organizations")
      .then((response) => setOrganizations(response.data))
      .catch(() => setError("Не удалось загрузить организации."));
  }, []);

  return (
    <main className="px-4 py-8 lg:px-10">
      <div className="mx-auto w-full max-w-6xl space-y-8">
        <section className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-purple-600">Super Admin</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
            Организации платформы
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Глобальный администратор видит tenant-ы, но не расшифрованные HR-данные.
          </p>
        </section>
        {error && <p className="rounded-xl bg-rose-50 p-3 text-sm font-medium text-rose-700">{error}</p>}
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-6 py-4">Компания</th>
                <th className="px-6 py-4">Статус</th>
                <th className="px-6 py-4">Создана</th>
              </tr>
            </thead>
            <tbody>
              {organizations.map((organization) => (
                <tr key={organization.id} className="border-t border-slate-100 hover:bg-slate-50/70">
                  <td className="px-6 py-4 font-semibold text-slate-900">{organization.name}</td>
                  <td className="px-6 py-4">
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                      {organization.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {new Date(organization.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
};

export default OrganizationsPage;
