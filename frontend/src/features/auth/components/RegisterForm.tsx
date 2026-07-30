import React, { useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { AiOutlineLoading3Quarters } from 'react-icons/ai'; 
import { authApi } from '../api/auth.api';

export function RegisterForm() {
  const [step, setStep] = useState<'REGISTER' | 'OTP'>('REGISTER');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      await authApi.register(email, password, fullName);
      setSuccessMessage('Mã OTP đã được gửi tới email của bạn!');
      setStep('OTP');
    } catch (err: any) {
      const backendError = err.response?.data?.message;
      if (Array.isArray(backendError)) {
        setError(backendError[0]);
      } else if (typeof backendError === 'string') {
        setError(backendError);
      } else {
        setError('Đăng ký thất bại. Vui lòng thử lại!');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      await authApi.verifyOtp(email, otp);
      alert('Tạo tài khoản thành công! Bây giờ bạn có thể đăng nhập.');
      window.location.reload();
    } catch (err: any) {
      const backendError = err.response?.data?.message;
      if (Array.isArray(backendError)) {
        setError(backendError[0]);
      } else if (typeof backendError === 'string') {
        setError(backendError);
      } else {
        setError('Mã OTP không hợp lệ hoặc đã hết hạn.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`transition-all duration-300 ${isLoading ? 'opacity-80' : 'opacity-100'}`}>
      
      {error && (
        <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 rounded-xl border border-red-200">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-3 text-sm text-green-700 bg-green-50 rounded-xl border border-green-200">
          {successMessage}
        </div>
      )}

      {step === 'REGISTER' ? (
        <form className="space-y-4" onSubmit={handleRegisterSubmit}>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Họ và tên
            </label>
            <input 
              type="text" 
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              disabled={isLoading}
              placeholder="Nhập họ và tên" 
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brandRed transition-all disabled:bg-gray-100 disabled:cursor-not-allowed" 
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Email
            </label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              placeholder="Nhập địa chỉ email" 
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brandRed transition-all disabled:bg-gray-100 disabled:cursor-not-allowed" 
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
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
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brandRed transition-all disabled:bg-gray-100 disabled:cursor-not-allowed" 
              />
              <button 
                type="button" 
                disabled={isLoading}
                onClick={() => setShowPassword(!showPassword)} 
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full py-3 mt-2 text-white rounded-xl font-bold text-lg bg-brandRed hover:bg-red-700 transition-all shadow-md flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <AiOutlineLoading3Quarters className="animate-spin" size={22} />
                <span>Đang xử lý...</span>
              </>
            ) : (
              'Đăng ký tài khoản'
            )}
          </button>
        </form>
      ) : (
        <form className="space-y-4" onSubmit={handleOtpSubmit}>
          <div className="text-center mb-2">
            <p className="text-sm text-gray-600">
              Nhập mã OTP vừa được gửi tới: <br/>
              <span className="font-semibold text-gray-800">{email}</span>
            </p>
          </div>

          <div>
            <input 
              type="text" 
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              disabled={isLoading}
              placeholder="000000" 
              className="w-full px-4 py-3 text-center tracking-widest text-2xl font-bold border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brandRed transition-all disabled:bg-gray-100 disabled:cursor-not-allowed" 
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full py-3 text-white rounded-xl font-bold text-lg bg-brandRed hover:bg-red-700 transition-all shadow-md flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <AiOutlineLoading3Quarters className="animate-spin" size={22} />
                <span>Đang xác thực...</span>
              </>
            ) : (
              'Xác nhận OTP'
            )}
          </button>

          <div className="text-center mt-2">
            <button 
              type="button"
              disabled={isLoading}
              onClick={() => { setStep('REGISTER'); setError(''); }}
              className="text-sm text-blue-600 hover:underline font-medium disabled:opacity-50"
            >
              Quay lại bước đăng ký
            </button>
          </div>
        </form>
      )}
    </div>
  );
}