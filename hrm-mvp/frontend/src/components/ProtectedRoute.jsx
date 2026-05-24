import { Navigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext.jsx";


const fallbackForRole = (role) => {
  if (role === "hr_admin") return "/employees";
  if (role === "recruiter") return "/jobs";
  if (role === "org_admin") return "/users";
  if (role === "super_admin") return "/organizations";
  return "/login";
};

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { token, role } = useAuth();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to={fallbackForRole(role)} replace />;
  }

  return children;
};

export default ProtectedRoute;
