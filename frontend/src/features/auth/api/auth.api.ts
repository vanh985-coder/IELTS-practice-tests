import api from '../../../api/axios';

export const authApi = {
    login(email: string, password: string) {
        return api.post('/auth/login', { email, password });
    },
    register(email: string, password: string, fullName: string) {
        return api.post('/auth/register', { email, password, name: fullName });
    },
    verifyOtp(email: string, otp: string) {
        return api.post('/auth/verify-otp', { email, otp });
    },
    logout() {
        return api.post('/auth/logout');
    },
    refreshToken() {
        return api.post('/auth/refresh'); 
    }
};