import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute, AdminRoute } from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminLogin from "./pages/AdminLogin";
import Home from "./pages/Home";
import CategoryPage from "./pages/CategoryPage";
import TestPage from "./pages/TestPage";
import ResultPage from "./pages/ResultPage";
import HistoryPage from "./pages/HistoryPage";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminFaculties from "./pages/admin/AdminFaculties";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminSubCategories from "./pages/admin/AdminSubCategories";
import AdminQuestions from "./pages/admin/AdminQuestions";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminAnalytics from "./pages/admin/AdminAnalytics";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/admin/login" element={<AdminLogin />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Home />} />
        <Route path="/categories/:categoryId" element={<CategoryPage />} />
        <Route path="/test/:sessionId" element={<TestPage />} />
        <Route path="/result/:sessionId" element={<ResultPage />} />
        <Route path="/history" element={<HistoryPage />} />
      </Route>

      <Route element={<AdminRoute />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="faculties" element={<AdminFaculties />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="categories/:categoryId/subcategories" element={<AdminSubCategories />} />
          <Route path="subcategories/:subcategoryId/questions" element={<AdminQuestions />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="analytics" element={<AdminAnalytics />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
