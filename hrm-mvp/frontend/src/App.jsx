import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import Navbar from "./components/Navbar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import EmployeesPage from "./pages/EmployeesPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import NewEmployeePage from "./pages/NewEmployeePage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import ScreeningPage from "./pages/ScreeningPage.jsx";
import UsersPage from "./pages/UsersPage.jsx";
import OrganizationsPage from "./pages/OrganizationsPage.jsx";
import VerifyEmailPage from "./pages/VerifyEmailPage.jsx";


const App = () => {
  const location = useLocation();
  const isAuthPage = location.pathname === "/login" || location.pathname === "/register" || location.pathname === "/verify-email";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      {isAuthPage ? (
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      ) : (
        <div className="min-h-screen">
          <Navbar />
          <div className="min-w-0 pt-24 lg:pl-72">
            <Routes>
              <Route
                path="/users"
                element={
                  <ProtectedRoute allowedRoles={["org_admin"]}>
                    <UsersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/organizations"
                element={
                  <ProtectedRoute allowedRoles={["super_admin"]}>
                    <OrganizationsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/employees"
                element={
                  <ProtectedRoute allowedRoles={["hr_admin"]}>
                    <EmployeesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/employees/new"
                element={
                  <ProtectedRoute allowedRoles={["hr_admin"]}>
                    <NewEmployeePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/jobs"
                element={
                  <ProtectedRoute allowedRoles={["recruiter"]}>
                    <ScreeningPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/" element={<Navigate to="/login" replace />} />
            </Routes>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
