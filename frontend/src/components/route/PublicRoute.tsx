import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export const PublicRoute = () => {
  const { isAuthenticated } = useAuth();

  // Nếu đã đăng nhập mà cố tình vào trang Login/Register, tự động đẩy về trang chủ hoặc dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};
