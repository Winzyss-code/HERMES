import { Navigate, Route, Routes } from "react-router-dom";

import Navbar from "./components/Navbar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import EmployeesPage from "./pages/EmployeesPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import NewEmployeePage from "./pages/NewEmployeePage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import ScreeningPage from "./pages/ScreeningPage.jsx";


const App = () => (
  <div className="min-h-screen bg-gray-50">
    <Navbar />
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
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
        path="/screening"
        element={
          <ProtectedRoute allowedRoles={["hr_admin", "recruiter"]}>
            <ScreeningPage />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/screening" replace />} />
    </Routes>
  </div>
);

export default App;
