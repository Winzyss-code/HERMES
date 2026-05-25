import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import client from "../api/client";
import { decryptEmployee, encryptEmployee } from "../crypto/encryption";
import { useAuth } from "../context/AuthContext.jsx";


const LockIcon = () => (
  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M7.75 10.5V8.25a4.25 4.25 0 0 1 8.5 0v2.25" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M6.75 10.5h10.5a1.5 1.5 0 0 1 1.5 1.5v6.25a1.5 1.5 0 0 1-1.5 1.5H6.75a1.5 1.5 0 0 1-1.5-1.5V12a1.5 1.5 0 0 1 1.5-1.5Z" className="fill-emerald-100 stroke-emerald-600" strokeWidth="1.5" />
    <path d="M12 14.25v2.25" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const EyeIcon = ({ active }) => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M3.75 12s2.8-5.25 8.25-5.25S20.25 12 20.25 12s-2.8 5.25-8.25 5.25S3.75 12 3.75 12Z" stroke="currentColor" strokeWidth="1.7" />
    <path d="M12 14.75A2.75 2.75 0 1 0 12 9.25a2.75 2.75 0 0 0 0 5.5Z" className={active ? "fill-indigo-100" : ""} stroke="currentColor" strokeWidth="1.7" />
  </svg>
);

const buildProfileText = (employee) =>
  [
    `Skills: ${employee.skills || ""}`,
    `Experience: ${employee.experience || ""}`,
  ]
    .filter((line) => line.split(":").slice(1).join(":").trim())
    .join("\n");

const maskedCipher = (value = "") => `${value.slice(0, 8)}...${value.slice(-8)}`;

const SecretCell = ({ label, value, encrypted, visible, onToggle }) => (
  <div className="flex items-center gap-2">
    <span className={`max-w-[180px] truncate rounded-xl px-2.5 py-1.5 text-xs transition-all duration-300 ${visible ? "bg-slate-100 font-mono text-slate-500" : "bg-white text-slate-700"}`}>
      {visible ? maskedCipher(encrypted) : value || "Не указано"}
    </span>
    <button
      className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-100 bg-white text-slate-400 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:text-indigo-600 hover:shadow-md"
      onClick={onToggle}
      type="button"
      title={label}
    >
      <EyeIcon active={visible} />
    </button>
  </div>
);

const SkeletonTable = () => (
  <div className="space-y-3 p-5">
    {[0, 1, 2].map((row) => (
      <div key={row} className="grid animate-pulse grid-cols-5 gap-4 rounded-2xl bg-slate-50 p-4">
        <div className="h-5 rounded-full bg-slate-200" />
        <div className="h-5 rounded-full bg-slate-200" />
        <div className="h-5 rounded-full bg-slate-200" />
        <div className="h-5 rounded-full bg-slate-200" />
        <div className="h-5 rounded-full bg-slate-200" />
      </div>
    ))}
  </div>
);

const EmployeesPage = () => {
  const { cryptoKey } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [approvedCandidates, setApprovedCandidates] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hireCandidateDraft, setHireCandidateDraft] = useState(null);
  const [hireForm, setHireForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    salary: "",
    department_id: "1",
    status: "active",
    skills: "",
    experience: "",
  });
  const [editEmployee, setEditEmployee] = useState(null);
  const [editForm, setEditForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    salary: "",
    departmentId: "1",
    status: "active",
    skills: "",
    experience: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [secretCells, setSecretCells] = useState({});
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const selectedJob = useMemo(
    () => jobs.find((job) => job.id === selectedJobId),
    [jobs, selectedJobId]
  );

  const fetchEmployees = async () => {
    try {
      const response = await client.get("/employees");
      const decrypted = await Promise.all(
        response.data.map(async (item) => {
          try {
            const data = await decryptEmployee(cryptoKey, item.encrypted_data, item.iv);
            return { ...item, data, readable: true };
          } catch (err) {
            return { ...item, data: null, readable: false };
          }
        })
      );
      setEmployees(decrypted);
    } catch (err) {
      setError("Не удалось загрузить сотрудников.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchApprovedCandidates = async () => {
    try {
      const response = await client.get("/candidates/approved");
      setApprovedCandidates(response.data);
    } catch (err) {
      setError("Не удалось загрузить одобренных кандидатов.");
    }
  };

  useEffect(() => {
    if (cryptoKey) {
      fetchEmployees();
      fetchApprovedCandidates();
    }
  }, [cryptoKey]);

  const openScreeningModal = async (employee) => {
    setError(null);
    setMessage(null);
    setSelectedEmployee(employee);
    setIsModalOpen(true);

    try {
      const response = await client.get("/jobs");
      setJobs(response.data);
      setSelectedJobId(response.data[0]?.id || "");
    } catch (err) {
      setError("Не удалось загрузить список вакансий.");
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedEmployee(null);
    setSelectedJobId("");
  };

  const submitEmployeeForScreening = async (event) => {
    event.preventDefault();
    if (!selectedEmployee || !selectedJobId) {
      setError("Выберите вакансию.");
      return;
    }

    const profileText = buildProfileText(selectedEmployee.data);
    if (!profileText.trim()) {
      setError("Профиль сотрудника пустой или не расшифрован.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const response = await client.post(`/jobs/${selectedJobId}/screen-employee`, {
        employee_id: selectedEmployee.id,
        profile_text: profileText,
        candidate_name: selectedEmployee.data.fullName || "Внутренний сотрудник",
        candidate_email: selectedEmployee.data.email || "",
        candidate_phone: selectedEmployee.data.phone || "",
      });
      setMessage(
        `${selectedEmployee.data.fullName || "Сотрудник"} рассмотрен на вакансию "${selectedJob?.title || "выбранная вакансия"}": ${response.data.final_score.toFixed(1)}`
      );
      closeModal();
    } catch (err) {
      setError("Не удалось отправить сотрудника на рассмотрение.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openHireCandidateModal = (candidate) => {
    setError(null);
    setMessage(null);
    setHireCandidateDraft(candidate);
    setHireForm({
      fullName: candidate.candidate_name || candidate.resume_filename,
      email: candidate.candidate_email || "",
      phone: candidate.candidate_phone || "",
      salary: "",
      department_id: "1",
      status: "active",
      skills: "",
      experience: `Converted from approved candidate. AI score: ${candidate.final_score.toFixed(1)} of 10. ${candidate.explanation}`,
    });
  };

  const closeHireCandidateModal = () => {
    setHireCandidateDraft(null);
    setHireForm({
      fullName: "",
      email: "",
      phone: "",
      salary: "",
      department_id: "1",
      status: "active",
      skills: "",
      experience: "",
    });
  };

  const updateHireField = (field, value) => {
    setHireForm((prev) => ({ ...prev, [field]: value }));
  };

  const submitHireCandidate = async (event) => {
    event.preventDefault();
    if (!hireCandidateDraft) {
      return;
    }

    setError(null);
    setMessage(null);
    setIsSubmitting(true);
    try {
      const encrypted = await encryptEmployee(cryptoKey, {
        fullName: hireForm.fullName.trim(),
        email: hireForm.email.trim(),
        phone: hireForm.phone.trim(),
        salary: hireForm.salary.trim(),
        skills: hireForm.skills.trim(),
        experience: hireForm.experience.trim(),
      });

      await client.post("/employees", {
        department_id: Number(hireForm.department_id) || 1,
        status: hireForm.status,
        encrypted_data: encrypted.encrypted_data,
        iv: encrypted.iv,
        candidate_id: hireCandidateDraft.id,
      });

      setMessage(`${hireForm.fullName || hireCandidateDraft.resume_filename} переведен в штат. Вакансия закрыта.`);
      closeHireCandidateModal();
      await fetchEmployees();
      await fetchApprovedCandidates();
    } catch (err) {
      setError("Не удалось перевести кандидата в штат.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditEmployeeModal = (employee) => {
    setError(null);
    setMessage(null);
    setEditEmployee(employee);
    setEditForm({
      fullName: employee.data.fullName || "",
      email: employee.data.email || "",
      phone: employee.data.phone || "",
      salary: employee.data.salary || "",
      departmentId: String(employee.department_id || 1),
      status: employee.status || "active",
      skills: employee.data.skills || "",
      experience: employee.data.experience || "",
    });
  };

  const closeEditEmployeeModal = () => {
    setEditEmployee(null);
    setEditForm({
      fullName: "",
      email: "",
      phone: "",
      salary: "",
      departmentId: "1",
      status: "active",
      skills: "",
      experience: "",
    });
  };

  const updateEditField = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const submitEditEmployee = async (event) => {
    event.preventDefault();
    if (!editEmployee) {
      return;
    }

    setError(null);
    setMessage(null);
    setIsSubmitting(true);
    try {
      const encrypted = await encryptEmployee(cryptoKey, {
        fullName: editForm.fullName.trim(),
        email: editForm.email.trim(),
        phone: editForm.phone.trim(),
        salary: editForm.salary.trim(),
        skills: editForm.skills.trim(),
        experience: editForm.experience.trim(),
      });

      await client.put(`/employees/${editEmployee.id}`, {
        department_id: Number(editForm.departmentId) || 1,
        status: editForm.status,
        encrypted_data: encrypted.encrypted_data,
        iv: encrypted.iv,
      });

      setMessage(`${editForm.fullName || "Сотрудник"} обновлен.`);
      closeEditEmployeeModal();
      await fetchEmployees();
    } catch (err) {
      setError("Не удалось обновить сотрудника.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteEmployee = async (employee) => {
    if (!window.confirm(`Удалить сотрудника ${employee.data?.fullName || employee.id}?`)) {
      return;
    }

    setError(null);
    setMessage(null);
    setIsSubmitting(true);
    try {
      await client.delete(`/employees/${employee.id}`);
      setMessage(`${employee.data?.fullName || "Сотрудник"} удален.`);
      await fetchEmployees();
    } catch (err) {
      setError("Не удалось удалить сотрудника.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleSecret = (employeeId, field) => {
    setSecretCells((prev) => ({ ...prev, [`${employeeId}-${field}`]: !prev[`${employeeId}-${field}`] }));
  };

  return (
    <main className="px-4 py-8 lg:px-10">
      <div className="mx-auto w-full max-w-6xl space-y-8">
        <section className="relative overflow-hidden rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm dark:border-emerald-500/30 dark:bg-slate-900">
          <div className="absolute right-6 top-6 h-20 w-20 rounded-full bg-emerald-100/60 blur-2xl" />
          <div className="relative flex items-start gap-4">
            <div className="flex h-12 w-12 animate-pulse items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30">
              <LockIcon />
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-600">Security Module</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Защита Zero-Knowledge активна</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                Данные шифруются алгоритмом AES-GCM на вашем устройстве перед отправкой в базу данных.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-6">
            <div>
              <p className="text-sm font-semibold text-emerald-600">Encrypted Directory</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Сотрудники</h2>
            </div>
            <Link className="rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-500" to="/employees/new">
              Добавить сотрудника
            </Link>
          </div>
          {message && <p className="mx-6 mt-5 rounded-xl bg-emerald-50 p-3 text-sm font-medium text-emerald-700">{message}</p>}
          {error && <p className="mx-6 mt-5 rounded-xl bg-rose-50 p-3 text-sm font-medium text-rose-700">{error}</p>}
          {isLoading ? (
            <SkeletonTable />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-6 py-4">ФИО</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Телефон</th>
                    <th className="px-6 py-4">Зарплата</th>
                    <th className="px-6 py-4">Навыки</th>
                    <th className="px-6 py-4">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((employee) => (
                    <tr key={employee.id} className="border-t border-slate-100 transition-colors hover:bg-slate-50/70">
                      {employee.readable ? (
                        <>
                          <td className="px-6 py-4 font-semibold text-slate-900">{employee.data.fullName}</td>
                          <td className="px-6 py-4 text-slate-600">{employee.data.email}</td>
                          <td className="px-6 py-4">
                            <SecretCell
                              label="Телефон"
                              value={employee.data.phone}
                              encrypted={employee.encrypted_data}
                              visible={Boolean(secretCells[`${employee.id}-phone`])}
                              onToggle={() => toggleSecret(employee.id, "phone")}
                            />
                          </td>
                          <td className="px-6 py-4">
                            <SecretCell
                              label="Зарплата"
                              value={employee.data.salary}
                              encrypted={employee.encrypted_data}
                              visible={Boolean(secretCells[`${employee.id}-salary`])}
                              onToggle={() => toggleSecret(employee.id, "salary")}
                            />
                          </td>
                          <td className="max-w-xs px-6 py-4 text-slate-600">{employee.data.skills || "Не указаны"}</td>
                        </>
                      ) : (
                        <td className="px-6 py-4 text-rose-700" colSpan="5">
                          Данные невозможно расшифровать текущим мастер-ключом
                        </td>
                      )}
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-purple-200 hover:text-purple-600 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={!employee.readable}
                            onClick={() => openScreeningModal(employee)}
                          >
                            Рассмотреть
                          </button>
                          <button
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-indigo-200 hover:text-indigo-600 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={!employee.readable || isSubmitting}
                            onClick={() => openEditEmployeeModal(employee)}
                          >
                            Редактировать
                          </button>
                          <button
                            className="rounded-xl bg-rose-600 px-3 py-2 text-xs font-semibold text-white transition hover:-translate-y-0.5 hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={!employee.readable || isSubmitting}
                            onClick={() => deleteEmployee(employee)}
                          >
                            Удалить
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {employees.length === 0 && (
                    <tr>
                      <td className="px-6 py-12 text-center text-slate-500" colSpan="6">
                        Пока нет сотрудников.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <p className="text-sm font-semibold text-indigo-600">Hiring Conversion</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Одобренные кандидаты</h2>
            <p className="mt-2 text-sm text-slate-500">HR переводит approved-кандидата в зашифрованную карточку сотрудника.</p>
          </div>
          <div className="overflow-hidden rounded-2xl border border-slate-100">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-6 py-4">Кандидат</th>
                  <th className="px-6 py-4">Контакты</th>
                  <th className="px-6 py-4">Балл</th>
                  <th className="px-6 py-4">Действие</th>
                </tr>
              </thead>
              <tbody>
                {approvedCandidates.map((candidate) => (
                  <tr key={candidate.id} className="border-t border-slate-100 transition-colors hover:bg-slate-50/70">
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {candidate.candidate_name || candidate.resume_filename}
                      {candidate.employee_id && (
                        <span className="ml-2 rounded-full border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
                          внутренний
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {[candidate.candidate_email, candidate.candidate_phone].filter(Boolean).join(" · ") || "Не указаны"}
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 px-3.5 py-2 text-sm font-bold text-white">
                        {candidate.final_score.toFixed(1)}/10
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-600 hover:shadow-lg hover:shadow-indigo-600/20 disabled:opacity-50"
                        disabled={isSubmitting}
                        onClick={() => openHireCandidateModal(candidate)}
                      >
                        Перевести в штат
                      </button>
                    </td>
                  </tr>
                ))}
                {approvedCandidates.length === 0 && (
                  <tr>
                    <td className="px-6 py-12 text-center text-slate-500" colSpan="4">
                      Одобренных кандидатов пока нет.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {editEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm">
          <form className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-100 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-950" onSubmit={submitEditEmployee}>
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-300">Zero-Knowledge Update</p>
                <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">Редактировать сотрудника</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Изменения шифруются в браузере новым IV. Backend сохранит только обновленный ciphertext и открытые метаданные.
                </p>
              </div>
              <button className="rounded-xl border border-slate-100 px-3 py-2 text-sm text-slate-500 transition hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900" onClick={closeEditEmployeeModal} type="button">
                Закрыть
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                ФИО
                <input className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-indigo-500/20" required value={editForm.fullName} onChange={(event) => updateEditField("fullName", event.target.value)} />
              </label>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                Email
                <input className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-indigo-500/20" type="email" value={editForm.email} onChange={(event) => updateEditField("email", event.target.value)} />
              </label>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                Телефон
                <input className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-indigo-500/20" value={editForm.phone} onChange={(event) => updateEditField("phone", event.target.value)} />
              </label>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                Базовый оклад
                <input className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-indigo-500/20" value={editForm.salary} onChange={(event) => updateEditField("salary", event.target.value)} />
              </label>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                Department ID
                <input className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-indigo-500/20" min="1" type="number" value={editForm.departmentId} onChange={(event) => updateEditField("departmentId", event.target.value)} />
              </label>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                Статус
                <select className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-indigo-500/20" value={editForm.status} onChange={(event) => updateEditField("status", event.target.value)}>
                  <option value="active">active</option>
                  <option value="inactive">inactive</option>
                  <option value="probation">probation</option>
                  <option value="onboarding">onboarding</option>
                </select>
              </label>
            </div>

            <label className="mt-4 block text-sm font-semibold text-slate-700 dark:text-slate-200">
              Навыки
              <input className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-indigo-500/20" value={editForm.skills} onChange={(event) => updateEditField("skills", event.target.value)} />
            </label>

            <label className="mt-4 block text-sm font-semibold text-slate-700 dark:text-slate-200">
              Опыт работы
              <textarea className="mt-2 min-h-36 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-indigo-500/20" value={editForm.experience} onChange={(event) => updateEditField("experience", event.target.value)} />
            </label>

            <div className="mt-6 flex justify-end gap-3">
              <button type="button" className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900" onClick={closeEditEmployeeModal}>
                Отмена
              </button>
              <button className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:-translate-y-0.5 hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50" disabled={isSubmitting}>
                {isSubmitting ? "Шифрование..." : "Сохранить изменения"}
              </button>
            </div>
          </form>
        </div>
      )}

      {hireCandidateDraft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm">
          <form className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-100 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-950" onSubmit={submitHireCandidate}>
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-300">Hiring Conversion</p>
                <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">Редактировать карточку перед переводом в штат</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  HR проверяет данные кандидата, дополняет зарплату, навыки и опыт. После подтверждения карточка шифруется в браузере и сохраняется как сотрудник.
                </p>
              </div>
              <button className="rounded-xl border border-slate-100 px-3 py-2 text-sm text-slate-500 transition hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900" onClick={closeHireCandidateModal} type="button">
                Закрыть
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                ФИО
                <input
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-indigo-500/20"
                  required
                  value={hireForm.fullName}
                  onChange={(event) => updateHireField("fullName", event.target.value)}
                />
              </label>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                Email
                <input
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-indigo-500/20"
                  type="email"
                  value={hireForm.email}
                  onChange={(event) => updateHireField("email", event.target.value)}
                />
              </label>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                Телефон
                <input
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-indigo-500/20"
                  value={hireForm.phone}
                  onChange={(event) => updateHireField("phone", event.target.value)}
                />
              </label>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                Базовый оклад
                <input
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-indigo-500/20"
                  value={hireForm.salary}
                  onChange={(event) => updateHireField("salary", event.target.value)}
                />
              </label>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                Department ID
                <input
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-indigo-500/20"
                  min="1"
                  type="number"
                  value={hireForm.department_id}
                  onChange={(event) => updateHireField("department_id", event.target.value)}
                />
              </label>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                Статус
                <select
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-indigo-500/20"
                  value={hireForm.status}
                  onChange={(event) => updateHireField("status", event.target.value)}
                >
                  <option value="active">active</option>
                  <option value="probation">probation</option>
                  <option value="onboarding">onboarding</option>
                </select>
              </label>
            </div>

            <label className="mt-4 block text-sm font-semibold text-slate-700 dark:text-slate-200">
              Навыки
              <input
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-indigo-500/20"
                placeholder="Python, FastAPI, PostgreSQL"
                value={hireForm.skills}
                onChange={(event) => updateHireField("skills", event.target.value)}
              />
            </label>

            <label className="mt-4 block text-sm font-semibold text-slate-700 dark:text-slate-200">
              Опыт и заметки HR
              <textarea
                className="mt-2 min-h-36 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-indigo-500/20"
                value={hireForm.experience}
                onChange={(event) => updateHireField("experience", event.target.value)}
              />
            </label>

            <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm leading-6 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
              В базу сотрудников уйдут только encrypted_data и IV. Открытые данные из формы используются локально в браузере для шифрования.
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button type="button" className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900" onClick={closeHireCandidateModal}>
                Отмена
              </button>
              <button
                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:-translate-y-0.5 hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Шифрование..." : "Зашифровать и перевести в штат"}
              </button>
            </div>
          </form>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl border border-slate-100 bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-purple-600">Internal Mobility</p>
                <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">Рассмотреть на вакансию</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {selectedEmployee?.data?.fullName || "Сотрудник"} будет отправлен на ИИ-скрининг как внутренний кандидат.
                </p>
              </div>
              <button className="rounded-xl border border-slate-100 px-3 py-2 text-sm text-slate-500 transition hover:bg-slate-50" onClick={closeModal} type="button">
                Закрыть
              </button>
            </div>
            <form className="space-y-4" onSubmit={submitEmployeeForScreening}>
              <label className="block text-sm font-semibold text-slate-700">
                Вакансия
                <select
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                  value={selectedJobId}
                  onChange={(event) => setSelectedJobId(event.target.value)}
                  required
                >
                  <option value="">Выберите вакансию</option>
                  {jobs.map((job) => (
                    <option key={job.id} value={job.id}>
                      {job.title}
                    </option>
                  ))}
                </select>
              </label>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
                <p className="font-semibold text-slate-800">Профиль для анализа</p>
                <pre className="mt-3 max-h-40 overflow-auto whitespace-pre-wrap font-sans text-xs leading-5">
                  {selectedEmployee?.data ? buildProfileText(selectedEmployee.data) : ""}
                </pre>
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50" onClick={closeModal}>
                  Отмена
                </button>
                <button
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:-translate-y-0.5 hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isSubmitting || jobs.length === 0}
                >
                  {isSubmitting ? "Отправка..." : "Отправить"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default EmployeesPage;
