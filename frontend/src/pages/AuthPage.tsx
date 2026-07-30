import React, { useState } from 'react';

export default function AuthPage() {
  // Quản lý trạng thái màn hình: 'login' | 'register' | 'otp'
  const [view, setView] = useState<'login' | 'register' | 'otp'>('login');
  
  // Quản lý dữ liệu form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  
  // Trạng thái loading và lỗi
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Đổi baseUrl thành port backend của bạn (thường NestJS là 3000)
  const API_URL = 'http://localhost:3000/auth';

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, password }),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.message || 'Đăng ký thất bại');
      
      setMessage('Đăng ký thành công! Vui lòng kiểm tra email để lấy mã OTP.');
      setView('otp'); // Chuyển sang màn nhập OTP
    } catch (error: any) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch(`${API_URL}/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.message || 'Mã OTP không hợp lệ');
      
      setMessage('Xác thực thành công! Bạn có thể đăng nhập ngay bây giờ.');
      setView('login'); // Chuyển về màn đăng nhập
    } catch (error: any) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.message || 'Đăng nhập thất bại');
      
      setMessage('Đăng nhập thành công!');
      console.log('User Data:', data);
      // TODO: Lưu Token vào localStorage hoặc Context ở đây sau
      
    } catch (error: any) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
          {view === 'login' && 'Đăng Nhập'}
          {view === 'register' && 'Đăng Ký Tài Khoản'}
          {view === 'otp' && 'Xác Thực OTP'}
        </h2>

        {message && (
          <div className={`p-3 mb-4 text-sm rounded ${message.includes('thành công') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message}
          </div>
        )}

        <form onSubmit={
          view === 'login' ? handleLogin : 
          view === 'register' ? handleRegister : 
          handleVerifyOtp
        } className="space-y-4">
          
          {/* Các trường dùng chung (Email) */}
          {(view === 'login' || view === 'register' || view === 'otp') && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input 
                type="email" required
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={email} onChange={(e) => setEmail(e.target.value)}
                disabled={view === 'otp'} // Khi nhập OTP thì không cho sửa email nữa
              />
            </div>
          )}

          {/* Trường dành riêng cho Đăng ký */}
          {view === 'register' && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Họ và Tên</label>
              <input 
                type="text" required
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={name} onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}

          {/* Trường Mật khẩu (Dùng cho Đăng nhập và Đăng ký) */}
          {(view === 'login' || view === 'register') && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Mật khẩu</label>
              <input 
                type="password" required minLength={6}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={password} onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          )}

          {/* Trường OTP */}
          {view === 'otp' && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Mã OTP (Gửi qua email)</label>
              <input 
                type="text" required maxLength={6}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 tracking-widest text-center text-lg font-mono"
                value={otp} onChange={(e) => setOtp(e.target.value)}
              />
            </div>
          )}

          <button 
            type="submit" disabled={loading}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md transition-colors disabled:bg-blue-300"
          >
            {loading ? 'Đang xử lý...' : 
             view === 'login' ? 'Đăng Nhập' : 
             view === 'register' ? 'Đăng Ký' : 
             'Xác Nhận OTP'}
          </button>
        </form>

        {/* Nút chuyển đổi qua lại giữa Đăng nhập / Đăng ký */}
        <div className="mt-4 text-center text-sm text-gray-600">
          {view === 'login' ? (
            <p>Chưa có tài khoản? <button type="button" onClick={() => { setView('register'); setMessage(''); }} className="text-blue-600 hover:underline">Đăng ký ngay</button></p>
          ) : view === 'register' ? (
            <p>Đã có tài khoản? <button type="button" onClick={() => { setView('login'); setMessage(''); }} className="text-blue-600 hover:underline">Đăng nhập</button></p>
          ) : (
            <button type="button" onClick={() => { setView('register'); setMessage(''); }} className="text-blue-600 hover:underline">Quay lại đăng ký</button>
          )}
        </div>

      </div>
    </div>
  );
}