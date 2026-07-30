import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../features/auth/context/AuthContext';

export const ProtectedRoute = () => {
    const { isAuthenticated } = useAuth();

    // Nếu chưa đăng nhập, lập tức điều hướng về trang Login
    // Dùng replace để ghi đè lịch sử duyệt web, tránh việc user bấm nút Back quay lại được màn hình cấm
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Nếu hợp lệ, cho phép render các component con bên trong
    return <Outlet />;
};