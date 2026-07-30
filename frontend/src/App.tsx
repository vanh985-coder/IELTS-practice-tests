import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { PublicRoute } from "./components/route/PublicRoute";
import { ProtectedRoute } from "./components/route/ProtectedRoute";
import AuthPage from "./pages/AuthPage";

// Một component Dashboard tạm thời để test chức năng Protected Route
const DashboardMock = () => {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Chào mừng đến với Dashboard!</h1>
      <p>Trang này đã được bảo vệ, chỉ người đăng nhập mới thấy.</p>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Luồng Public: Dành cho khách CHƯA đăng nhập */}
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<AuthPage />} />
            {/* Giữ tương thích URL cũ */}
            <Route path="/auth" element={<Navigate to="/login" replace />} />
            {/* Chuyển hướng trang chủ tạm về login nếu chưa có Landing Page */}
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Route>

          {/* Luồng Protected: Dành cho user ĐÃ đăng nhập */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardMock />} />
            {/* Sau này bạn sẽ thêm /test, /profile,... vào đây */}
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
