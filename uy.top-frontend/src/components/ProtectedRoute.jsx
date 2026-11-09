import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Forbidden, Spinner } from "./ui";

// Token yo'q -> /login; adminOnly va user ADMIN emas -> «Ruxsat yo'q»
function ProtectedRoute({ adminOnly = false }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }

  if (loading) return <Spinner label="Opening the door..." />;

  if (adminOnly && !isAdmin) return <Forbidden />;

  return <Outlet />;
}

export default ProtectedRoute;
