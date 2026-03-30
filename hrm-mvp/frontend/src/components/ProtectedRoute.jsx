import { Navigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext.jsx";


const ProtectedRoute = ({ children, allowedRoles }) => {
  const { token, cryptoKey, role } = useAuth();

  if (!token || !cryptoKey) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/screening" replace />;
  }

  return children;
};

export default ProtectedRoute;
