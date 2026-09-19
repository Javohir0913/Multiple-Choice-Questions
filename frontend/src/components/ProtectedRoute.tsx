import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function ProtectedRoute() {
  const { token, role } = useAuth();
  if (!token || role !== "user") return <Navigate to="/login" replace />;
  return <Outlet />;
}

export function AdminRoute() {
  const { token, role } = useAuth();
  if (!token || role !== "admin") return <Navigate to="/admin/login" replace />;
  return <Outlet />;
}
