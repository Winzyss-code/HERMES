import { useEffect, useMemo, useState } from "react";

import client from "../api/client";


const CloudIcon = () => (
  <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M7.5 18.25h9.25a4 4 0 0 0 .47-7.98 5.75 5.75 0 0 0-11.1 1.55A3.25 3.25 0 0 0 7.5 18.25Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    <path d="M12 15.5V8.75m0 0-2.5 2.5m2.5-2.5 2.5 2.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const matchStatus = (score) => {
  if (score >= 8) return { label: "Strong Match", className: "bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium" };
  if (score >= 5) return { label: "Moderate Match", className: "bg-amber-50 text-amber-700 border border-amber-200 font-medium" };
  return { label: "Partial Match", className: "bg-rose-50 text-rose-700 border border-rose-200 font-medium" };
};

const parseSkills = (value) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const parseExplanation = (text = "") => {
  const found = text.match(/Found required skills: ([^.]+)/)?.[1] || "";
  const missing = text.match(/Missing required skills: ([^.]+)/)?.[1] || "";
  return {
    found: found === "none" ? [] : found.split(",").map((item) => item.trim()).filter(Boolean),
    missing: missing === "none" ? [] : missing.split(",").map((item) => item.trim()).filter(Boolean),
  };
};

const SkeletonRows = () => (
  <div className="space-y-3 p-4">
    {[0, 1, 2].map((row) => (
      <div key={row} className="grid animate-pulse grid-cols-[1.5fr_0.7fr_0.8fr_0.7fr] gap-4 rounded-2xl bg-slate-50 p-4">
        <div className="h-5 rounded-full bg-slate-200" />
        <div className="h-5 rounded-full bg-slate-200" />
        <div className="h-5 rounded-full bg-slate-200" />
        <div className="h-5 rounded-full bg-slate-200" />
      </div>
    ))}
  </div>
);

const ScreeningPage = () => {
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [jobForm, setJobForm] = useState({
    title: "Backend Developer",
    description: "Python FastAPI PostgreSQL Docker REST API production experience",
    skills: "Python, FastAPI, PostgreSQL, REST API",
  });
  const [file, setFile] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [activeCandidate, setActiveCandidate] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(false);
  const [message, setMessage] = useState(null);

  const selectedJob = useMemo(
    () => jobs.find((job) => job.id === selectedJobId),
    [jobs, selectedJobId]
  );

  const fetchCandidates = async (jobId) => {
    if (!jobId) {
      setCandidates([]);
      return;
    }
    setIsLoadingCandidates(true);
    try {
      const response = await client.get(`/jobs/${jobId}/candidates`);
      setCandidates(response.data);
    } finally {
      setIsLoadingCandidates(false);
    }
  };

  const fetchJobs = async () => {
    const response = await client.get("/jobs");
    setJobs(response.data);
    if (!selectedJobId && response.data.length > 0) {
      setSelectedJobId(response.data[0].id);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    fetchCandidates(selectedJobId);
    setActiveCandidate(null);
  }, [selectedJobId]);

  const handleCreateJob = async (event) => {
    event.preventDefault();
    const response = await client.post("/jobs", {
      title: jobForm.title,
      description: jobForm.description,
      required_skills: parseSkills(jobForm.skills),
    });
    await fetchJobs();
    setSelectedJobId(response.data.id);
    setMessage("Вакансия создана.");
  };

  const handleUpload = async (event) => {
    event.preventDefault();
    setMessage(null);
    if (!selectedJobId || !file) {
      setMessage("Выберите вакансию и файл PDF/TXT.");
      return;
    }

    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await client.post(`/jobs/${selectedJobId}/screen`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await fetchCandidates(selectedJobId);
      setActiveCandidate(response.data);
      setFile(null);
      setMessage("Резюме обработано.");
    } catch (err) {
      setMessage("Не удалось обработать резюме.");
    } finally {
      setIsProcessing(false);
    }
  };

  const approveCandidate = async (candidate, event) => {
    event.stopPropagation();
    const response = await client.patch(`/candidates/${candidate.id}/status`, {
      status: "approved",
    });
    setCandidates((prev) =>
      prev.map((item) => (item.id === candidate.id ? response.data : item))
    );
    setActiveCandidate(response.data);
  };

  const explanationSkills = parseExplanation(activeCandidate?.explanation);

  return (
    <main className="px-4 py-8 lg:px-10">
      <div className="mx-auto w-full max-w-7xl space-y-8">
        <section className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-purple-600">AI Recruiting</p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Вакансии</h2>
              </div>
              <span className="rounded-full bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700 ring-1 ring-purple-100">
                {jobs.length} active boards
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {jobs.map((job) => {
                const selected = selectedJobId === job.id;
                const count = candidates.filter((candidate) => candidate.job_id === job.id).length;
                return (
                  <button
                    key={job.id}
                    className={`rounded-2xl border p-4 text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${
                      selected ? "border-indigo-200 bg-indigo-50/50 shadow-sm" : "border-slate-100 bg-white"
                    }`}
                    onClick={() => setSelectedJobId(job.id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-base font-semibold tracking-tight text-slate-900">{job.title}</h3>
                      {job.status === "open" && (
                        <span className="relative flex h-3 w-3">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
                        </span>
                      )}
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{job.description}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-400">{count} кандидатов</span>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${job.status === "open" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                        {job.status}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-indigo-600">Новая вакансия</p>
            <form className="mt-4 space-y-4" onSubmit={handleCreateJob}>
              <input className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-50" placeholder="Название" value={jobForm.title} onChange={(event) => setJobForm((prev) => ({ ...prev, title: event.target.value }))} required />
              <textarea className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-50" rows="4" placeholder="Описание требований" value={jobForm.description} onChange={(event) => setJobForm((prev) => ({ ...prev, description: event.target.value }))} required />
              <input className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-50" placeholder="Навыки через запятую" value={jobForm.skills} onChange={(event) => setJobForm((prev) => ({ ...prev, skills: event.target.value }))} />
              <button className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-500">
                Создать вакансию
              </button>
            </form>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[420px_1fr]">
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <p className="text-sm font-semibold text-purple-600">Resume Intake</p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">{selectedJob?.title || "Выберите вакансию"}</h2>
            </div>
            {message && <p className="mb-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">{message}</p>}
            <form className="space-y-4" onSubmit={handleUpload}>
              <label className="group flex min-h-56 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/30 p-6 text-center text-indigo-600 transition-all duration-200 hover:-translate-y-1 hover:border-indigo-300 hover:bg-indigo-50/60 hover:shadow-lg hover:shadow-indigo-600/10">
                <CloudIcon />
                <span className="mt-4 text-sm font-semibold text-slate-900">
                  {file ? file.name : "Перетащите резюме или выберите файл"}
                </span>
                <span className="mt-1 text-xs text-slate-500">PDF или TXT, обработка через AI screening</span>
                <input
                  className="hidden"
                  type="file"
                  accept=".pdf,.txt,application/pdf,text/plain"
                  onChange={(event) => setFile(event.target.files?.[0] || null)}
                />
              </label>
              <button className="w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-purple-600 hover:shadow-lg hover:shadow-purple-600/20" disabled={isProcessing}>
                {isProcessing ? "ИИ анализирует..." : "Запустить скрининг"}
              </button>
            </form>
            {isProcessing && (
              <div className="mt-5 space-y-3">
                <div className="h-3 animate-pulse rounded-full bg-slate-200" />
                <div className="h-3 w-4/5 animate-pulse rounded-full bg-slate-200" />
                <div className="h-3 w-2/3 animate-pulse rounded-full bg-slate-200" />
              </div>
            )}
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <p className="text-sm font-semibold text-purple-600">AI Ranked Table</p>
                <h2 className="text-xl font-semibold tracking-tight text-slate-900">Рейтинг кандидатов</h2>
              </div>
            </div>
            {isLoadingCandidates ? (
              <SkeletonRows />
            ) : (
              <table className="min-w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-6 py-4">Кандидат</th>
                    <th className="px-6 py-4">Score</th>
                    <th className="px-6 py-4">Match</th>
                    <th className="px-6 py-4">Решение</th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.map((candidate) => {
                    const status = matchStatus(candidate.final_score);
                    return (
                      <tr key={candidate.id} className="cursor-pointer border-t border-slate-100 transition-colors hover:bg-slate-50/70" onClick={() => setActiveCandidate(candidate)}>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-slate-900">{candidate.candidate_name || candidate.resume_filename}</span>
                            {candidate.employee_id && (
                              <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 shadow-[0_0_16px_rgba(59,130,246,0.18)]">
                                Штат / Внутренний
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-slate-400">{candidate.resume_filename}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 px-3.5 py-2 text-sm font-bold text-white shadow-lg shadow-indigo-600/20">
                            {candidate.final_score.toFixed(1)}/10
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`rounded-full px-3 py-1.5 text-xs ${status.className}`}>{status.label}</span>
                        </td>
                        <td className="px-6 py-4">
                          {candidate.status === "approved" ? (
                            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                              approved
                            </span>
                          ) : (
                            <button
                              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-indigo-200 hover:text-indigo-600 hover:shadow-sm"
                              onClick={(event) => approveCandidate(candidate, event)}
                            >
                              Approve
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {candidates.length === 0 && (
                    <tr>
                      <td className="px-6 py-12 text-center text-slate-500" colSpan="4">
                        Кандидаты по этой вакансии пока не загружены.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>

      {activeCandidate && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/30 backdrop-blur-sm" onClick={() => setActiveCandidate(null)}>
          <aside className="h-full w-full max-w-xl translate-x-0 overflow-y-auto border-l border-slate-100 bg-white p-6 shadow-2xl transition-transform duration-300" onClick={(event) => event.stopPropagation()}>
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-purple-600">AI Explanation</p>
                <h3 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{activeCandidate.candidate_name || activeCandidate.resume_filename}</h3>
              </div>
              <button className="rounded-xl border border-slate-100 px-3 py-2 text-sm text-slate-500 transition hover:bg-slate-50" onClick={() => setActiveCandidate(null)}>
                Закрыть
              </button>
            </div>

            {activeCandidate.employee_id && (
              <p className="mb-5 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm font-semibold text-blue-900">
                Внутренний сотрудник компании оценен ИИ-системой на {activeCandidate.final_score.toFixed(1)} из 10
              </p>
            )}

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-900">Cosine similarity</span>
                <span className="text-sm font-bold text-indigo-600">{activeCandidate.cosine_sim.toFixed(3)}</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-white ring-1 ring-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-700"
                  style={{ width: `${Math.max(4, Math.min(100, activeCandidate.cosine_sim * 100))}%` }}
                />
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <h4 className="text-sm font-semibold text-slate-900">Ключевые навыки</h4>
              <div className="mt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-600">Совпали</p>
                <div className="flex flex-wrap gap-2">
                  {explanationSkills.found.length ? explanationSkills.found.map((skill) => (
                    <span key={skill} className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
                      + {skill}
                    </span>
                  )) : <span className="text-sm text-slate-400">Нет совпадений</span>}
                </div>
              </div>
              <div className="mt-5">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-rose-600">Пропущены</p>
                <div className="flex flex-wrap gap-2">
                  {explanationSkills.missing.length ? explanationSkills.missing.map((skill) => (
                    <span key={skill} className="rounded-full bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 line-through ring-1 ring-rose-100">
                      {skill}
                    </span>
                  )) : <span className="text-sm text-slate-400">Обязательные навыки закрыты</span>}
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <h4 className="text-sm font-semibold text-slate-900">Детерминированное объяснение</h4>
              <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">{activeCandidate.explanation}</p>
            </div>
          </aside>
        </div>
      )}
    </main>
  );
};

export default ScreeningPage;
