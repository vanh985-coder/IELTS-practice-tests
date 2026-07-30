import axios, { AxiosError } from 'axios';
let inMemoryToken: string | null = null;

export const setAccessToken = (token: string | null) => {
    inMemoryToken = token;
};

const api = axios.create({
    baseURL: 'http://localhost:3000',
    withCredentials: true, //cho Cookie
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    (config) => {
        // Sử dụng token từ RAM
        if (inMemoryToken && config.headers) {
            config.headers['Authorization'] = `Bearer ${inMemoryToken}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && originalRequest && !(originalRequest as any)._retry) {
            (originalRequest as any)._retry = true;
            
            try {
                const { data } = await axios.post(
                    'http://localhost:3000/auth/refresh', 
                    {}, 
                    { withCredentials: true }
                );
                localStorage.setItem('accessToken', data.accessToken);
                
                // Cập nhật token mới vào request cũ bị lỗi và gọi lại
                if (originalRequest.headers) {
                    originalRequest.headers['Authorization'] = `Bearer ${data.accessToken}`;
                }
                return api(originalRequest);
                } catch (refreshError) {
                localStorage.removeItem('accessToken');
                window.location.href = '/login'; 
                return Promise.reject(refreshError);
            }
        }
        
        return Promise.reject(error);
    }
);

export default api;
