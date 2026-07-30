import api from './axios';

export const authApi = {
    login(email: string, password: string) {
        return api.post('/auth/login', { email, password });
    },
    register(email: string, password: string, fullName: string) {
        return api.post('/auth/register', { email, password, name: fullName });
    },
    logout() {
        return api.post('/auth/logout');
    },
    // BỔ SUNG HÀM NÀY:
    refreshToken() {
        // Tùy thuộc vào NestJS của bạn đang cấu hình endpoint này là GET hay POST
        // Thông thường dùng POST cho các action thay đổi trạng thái/cấp lại token
        return api.post('/auth/refresh'); 
    }
};