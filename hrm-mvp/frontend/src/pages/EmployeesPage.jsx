import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import client from "../api/client";
import { decryptField } from "../crypto/encryption";
import { useAuth } from "../context/AuthContext.jsx";


const EmployeesPage = () => {
  const { cryptoKey } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await client.get("/employees");
        const decrypted = await Promise.all(
          response.data.map(async (item) => {
            const ivPayload = JSON.parse(atob(item.iv));
            const name = await decryptField(
              cryptoKey,
              item.name_enc,
              ivPayload.name_iv
            );
            const email = await decryptField(
              cryptoKey,
              item.email_enc,
              ivPayload.email_iv
            );
            const position = await decryptField(
              cryptoKey,
              item.position_enc,
              ivPayload.position_iv
            );
            return { id: item.id, name, email, position };
          })
        );
        setEmployees(decrypted);
      } catch (err) {
        setError("Failed to load employees.");
      }
    };

    if (cryptoKey) {
      fetchEmployees();
    }
  }, [cryptoKey]);

  return (
    <div className="mx-auto mt-8 max-w-5xl px-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Employees</h1>
        <Link
          to="/employees/new"
          className="rounded bg-gray-900 px-4 py-2 text-white"
        >
          Add Employee
        </Link>
      </div>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      <div className="overflow-hidden rounded bg-white shadow">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 text-left text-gray-600">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Position</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <tr key={emp.id} className="border-t">
                <td className="px-4 py-2">{emp.name}</td>
                <td className="px-4 py-2">{emp.email}</td>
                <td className="px-4 py-2">{emp.position}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EmployeesPage;
