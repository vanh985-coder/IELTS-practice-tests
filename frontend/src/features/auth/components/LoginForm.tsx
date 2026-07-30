import React, { useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { authApi } from '../api/auth.api';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await authApi.login(email, password);
      console.log('Đăng nhập thành công:', response.data);
      alert('Đăng nhập thành công!');
    } catch (err: any) {
      const backendError = err.response?.data?.message;
      if (Array.isArray(backendError)) {
        setError(backendError[0]);
      } else if (typeof backendError === 'string') {
        setError(backendError);
      } else {
        setError('Không thể kết nối đến máy chủ. Vui lòng thử lại!');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className={`space-y-5 transition-all duration-300 ${isLoading ? 'opacity-70 pointer-events-none' : 'opacity-100'}`} onSubmit={handleSubmit}>
      
      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 rounded-xl border border-red-200 animate-shake">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          Email
        </label>
        <input 
          type="email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading}
          placeholder="Nhập email của bạn" 
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brandRed focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed" 
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          Mật khẩu
        </label>
        <div className="relative">
          <input 
            type={showPassword ? "text" : "password"} 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
            placeholder="Nhập mật khẩu" 
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brandRed focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed" 
          />
          <button 
            type="button" 
            disabled={isLoading}
            onClick={() => setShowPassword(!showPassword)} 
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showPassword ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
          </button>
        </div>
      </div>

      <div className="flex justify-end pt-1">
        <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors">
          Quên mật khẩu?
        </a>
      </div>

      {/* 🌟 NÚT BẬM KÈM ICON SPINNER XOAY TRÒN CHUYÊN NGHIỆP */}
      <button 
        type="submit" 
        disabled={isLoading}
        className="w-full py-3 mt-4 text-white rounded-xl font-bold text-lg bg-brandRed hover:bg-red-700 active:transform active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <AiOutlineLoading3Quarters className="animate-spin" size={22} />
            <span>Đang xử lý...</span>
          </>
        ) : (
          'Đăng nhập'
        )}
      </button>
    </form>
  );
}