import { Link } from "react-router-dom";

import { useAuth } from "../context/AuthContext.jsx";


const Navbar = () => {
  const { user, role, logout } = useAuth();

  return (
    <nav className="flex items-center justify-between bg-white px-6 py-4 shadow">
      <div className="flex items-center gap-4">
        <Link className="font-semibold text-gray-800" to="/screening">
          Secure HRM
        </Link>
        {role === "hr_admin" && (
          <Link className="text-gray-600 hover:text-gray-900" to="/employees">
            Employees
          </Link>
        )}
        {user && (
          <Link className="text-gray-600 hover:text-gray-900" to="/screening">
            Screening
          </Link>
        )}
      </div>
      <div className="flex items-center gap-4 text-sm text-gray-600">
        {user ? (
          <>
            <span>
              {user.email} ({role})
            </span>
            <button
              className="rounded bg-gray-900 px-3 py-1 text-white"
              onClick={logout}
            >
              Logout
            </button>
          </>
        ) : (
          <div className="flex gap-3">
            <Link className="text-gray-600 hover:text-gray-900" to="/login">
              Login
            </Link>
            <Link className="text-gray-600 hover:text-gray-900" to="/register">
              Register
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
