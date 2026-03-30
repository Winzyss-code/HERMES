import { useEffect, useState } from "react";

import client from "../api/client";


const scoreColor = (score) => {
  if (score >= 80) return "text-green-600";
  if (score >= 50) return "text-yellow-600";
  return "text-red-600";
};

const ScreeningPage = () => {
  const [jobs, setJobs] = useState([]);
  const [jobForm, setJobForm] = useState({ title: "", description: "" });
  const [selectedJob, setSelectedJob] = useState("");
  const [uploadJob, setUploadJob] = useState("");
  const [uploadFile, setUploadFile] = useState(null);
  const [results, setResults] = useState([]);
  const [message, setMessage] = useState(null);

  const fetchJobs = async () => {
    const response = await client.get("/jobs");
    setJobs(response.data);
  };

  const fetchResults = async (jobId) => {
    const response = await client.get(`/screening/results/${jobId}`);
    setResults(response.data);
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleJobSubmit = async (event) => {
    event.preventDefault();
    await client.post("/jobs", jobForm);
    setJobForm({ title: "", description: "" });
    await fetchJobs();
  };

  const handleUpload = async (event) => {
    event.preventDefault();
    setMessage(null);
    if (!uploadFile || !uploadJob) {
      setMessage("Select a job and a PDF file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", uploadFile);
    const response = await client.post(
      `/screening/upload?job_id=${uploadJob}`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    setMessage(
      `${response.data.candidate_name} scored ${response.data.score} for ${response.data.job_title}`
    );
    if (selectedJob === uploadJob) {
      await fetchResults(selectedJob);
    }
  };

  const handleResultsSelect = async (event) => {
    const jobId = event.target.value;
    setSelectedJob(jobId);
    if (jobId) {
      await fetchResults(jobId);
    } else {
      setResults([]);
    }
  };

  return (
    <div className="mx-auto mt-8 max-w-6xl space-y-8 px-6">
      <section className="rounded bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold">Job Postings</h2>
        <form className="space-y-4" onSubmit={handleJobSubmit}>
          <input
            className="w-full rounded border px-3 py-2"
            placeholder="Job title"
            value={jobForm.title}
            onChange={(event) =>
              setJobForm((prev) => ({ ...prev, title: event.target.value }))
            }
            required
          />
          <textarea
            className="w-full rounded border px-3 py-2"
            rows="4"
            placeholder="Job description"
            value={jobForm.description}
            onChange={(event) =>
              setJobForm((prev) => ({
                ...prev,
                description: event.target.value,
              }))
            }
            required
          />
          <button className="rounded bg-gray-900 px-4 py-2 text-white">
            Create Job
          </button>
        </form>
      </section>

      <section className="rounded bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold">Upload Resume</h2>
        {message && <p className="mb-4 text-sm text-gray-700">{message}</p>}
        <form className="flex flex-col gap-4" onSubmit={handleUpload}>
          <select
            className="rounded border px-3 py-2"
            value={uploadJob}
            onChange={(event) => setUploadJob(event.target.value)}
            required
          >
            <option value="">Select job</option>
            {jobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.title}
              </option>
            ))}
          </select>
          <input
            type="file"
            accept="application/pdf"
            onChange={(event) => setUploadFile(event.target.files[0])}
            required
          />
          <button className="rounded bg-gray-900 px-4 py-2 text-white">
            Upload
          </button>
        </form>
      </section>

      <section className="rounded bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold">Results</h2>
        <select
          className="mb-4 rounded border px-3 py-2"
          value={selectedJob}
          onChange={handleResultsSelect}
        >
          <option value="">Select job</option>
          {jobs.map((job) => (
            <option key={job.id} value={job.id}>
              {job.title}
            </option>
          ))}
        </select>
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 text-left text-gray-600">
            <tr>
              <th className="px-4 py-2">Candidate</th>
              <th className="px-4 py-2">Score</th>
            </tr>
          </thead>
          <tbody>
            {results.map((row) => (
              <tr key={row.id} className="border-t">
                <td className="px-4 py-2">{row.candidate_name}</td>
                <td className={`px-4 py-2 font-medium ${scoreColor(row.score)}`}>
                  {row.score}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default ScreeningPage;
