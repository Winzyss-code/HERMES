import { useState } from "react";
import { useNavigate } from "react-router-dom";

import client from "../api/client";
import { encryptEmployee } from "../crypto/encryption";
import { useAuth } from "../context/AuthContext.jsx";


const NewEmployeePage = () => {
  const navigate = useNavigate();
  const { cryptoKey } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", position: "" });
  const [message, setMessage] = useState(null);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage(null);

    const encrypted = await encryptEmployee(cryptoKey, form);
    const ivPayload = btoa(
      JSON.stringify({
        name_iv: encrypted.name_iv,
        email_iv: encrypted.email_iv,
        position_iv: encrypted.position_iv,
      })
    );

    await client.post("/employees", {
      name_enc: encrypted.name_enc,
      email_enc: encrypted.email_enc,
      position_enc: encrypted.position_enc,
      iv: ivPayload,
    });
    setMessage("Employee saved.");
    navigate("/employees");
  };

  return (
    <div className="mx-auto mt-8 max-w-xl rounded bg-white p-6 shadow">
      <h1 className="mb-4 text-2xl font-semibold">Add Employee</h1>
      {message && <p className="mb-4 text-sm text-green-600">{message}</p>}
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="mb-1 block text-sm text-gray-600">Name</label>
          <input
            className="w-full rounded border px-3 py-2"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
          />
        </div>
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
          <label className="mb-1 block text-sm text-gray-600">Position</label>
          <input
            className="w-full rounded border px-3 py-2"
            name="position"
            value={form.position}
            onChange={handleChange}
            required
          />
        </div>
        <button className="w-full rounded bg-gray-900 py-2 text-white">
          Save
        </button>
      </form>
    </div>
  );
};

export default NewEmployeePage;
