import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext.jsx";


const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState(null);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    try {
      const userInfo = await login(form.email, form.password);
      navigate(userInfo.role === "hr_admin" ? "/employees" : "/screening");
    } catch (err) {
      setError("Login failed. Check your credentials.");
    }
  };

  return (
    <div className="mx-auto mt-12 max-w-md rounded bg-white p-6 shadow">
      <h1 className="mb-4 text-xl font-semibold">Login</h1>
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
        <button className="w-full rounded bg-gray-900 py-2 text-white">
          Login
        </button>
      </form>
    </div>
  );
};

export default LoginPage;
