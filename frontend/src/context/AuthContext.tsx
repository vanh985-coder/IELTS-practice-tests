// 1. Import thêm useEffect
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { type User } from '../types/auth.type'; 
import { setAccessToken } from '../api/axios';
import { authApi } from '../api/auth.api';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    loginContext: (user: User, token: string) => void;
    logoutContext: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    
    // 2. Thêm state để chặn UI hiển thị chớp nháy trước khi check xong token
    const [isInitializing, setIsInitializing] = useState(true);

    // 3. Thêm useEffect để tự động xin lại Access Token mỗi khi load trang
    useEffect(() => {
        const initAuth = async () => {
            try {
                // Gọi API để lấy token mới (yêu cầu authApi phải có hàm refreshToken)
                const response = await authApi.refreshToken(); 
                const { accessToken, user } = response.data;
                setUser(user);
                setAccessToken(accessToken); // Lưu token mới vào RAM (Axios)
            } catch (error) {
                // Nếu refresh token hết hạn hoặc chưa đăng nhập thì dọn dẹp state
                setUser(null);
                setAccessToken(null); 
            } finally {
                // Bất kể thành công hay thất bại, đều đánh dấu là đã khởi tạo xong
                setIsInitializing(false); 
            }
        };

        initAuth();
    }, []); // Mảng rỗng đảm bảo chỉ chạy 1 lần khi mở app/F5

    const loginContext = (userData: User, token: string) => {
        setUser(userData);
        setAccessToken(token); 
    };

    const logoutContext = async () => {
        try {
            await authApi.logout(); 
        } catch (error) {
            console.error("Lỗi khi logout", error);
        } finally {
            setUser(null);
            setAccessToken(null); 
        }
    };

    // 4. Nếu đang kiểm tra token, hiển thị một màn hình loading chờ
    if (isInitializing) {
        return <div className="flex h-screen items-center justify-center">Đang tải dữ liệu phiên...</div>;
    }

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, loginContext, logoutContext }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth phải được sử dụng trong AuthProvider');
    }
    return context;
};