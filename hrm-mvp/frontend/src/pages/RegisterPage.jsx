import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";


const RegisterPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    password: "",
    role: "hr_admin",
  });
  const [error, setError] = useState(null);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    try {
      await axios.post("http://localhost:8000/auth/register", form);
      navigate("/login");
    } catch (err) {
      setError("Registration failed. Try another email.");
    }
  };

  return (
    <div className="mx-auto mt-12 max-w-md rounded bg-white p-6 shadow">
      <h1 className="mb-4 text-xl font-semibold">Register</h1>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="mb-1 block text-sm text-gray-600">Email</label>
          <input
            className="w-full rounded border px-3 py-2"
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-gray-600">Password</label>
          <input
            className="w-full rounded border px-3 py-2"
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-gray-600">Role</label>
          <select
            className="w-full rounded border px-3 py-2"
            name="role"
            value={form.role}
            onChange={handleChange}
          >
            <option value="hr_admin">HR Admin</option>
            <option value="recruiter">Recruiter</option>
          </select>
        </div>
        <button className="w-full rounded bg-gray-900 py-2 text-white">
          Register
        </button>
      </form>
    </div>
  );
};

export default RegisterPage;
