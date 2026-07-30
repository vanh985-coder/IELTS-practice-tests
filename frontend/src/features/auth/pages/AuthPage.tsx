import { useState } from 'react';
import { LoginForm } from '../components/LoginForm';
import { RegisterForm } from '../components/RegisterForm';
import { SocialAuth } from '../components/SocialAuth';

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="flex min-h-screen bg-gray-50">
      
      {/* Cột trái: Khu vực Banner / Artwork */}
      <div className="hidden md:flex md:w-1/2 bg-blue-50 flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute top-8 left-8 font-black text-3xl text-brandRed tracking-tighter">
          IELTS ARENA
        </div>
        <div className="w-3/4 h-3/4 bg-gray-200 rounded-3xl flex items-center justify-center text-gray-400 font-bold text-xl shadow-inner">
          [Khu vực chèn Ảnh minh họa]
        </div>
      </div>

      {/* Cột phải: Khu vực chức năng (Form) */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-8">
          
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">
            {isLogin ? 'Đăng nhập' : 'Đăng ký'}
          </h2>
          <div className="flex mb-8 bg-gray-100 rounded-xl p-1.5">
            <button
              className={`w-1/2 py-2.5 rounded-lg font-semibold transition-all duration-300 ${isLogin ? 'bg-white shadow-sm text-brandRed' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setIsLogin(true)}
            >
              Đăng nhập
            </button>
            <button
              className={`w-1/2 py-2.5 rounded-lg font-semibold transition-all duration-300 ${!isLogin ? 'bg-white shadow-sm text-brandRed' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setIsLogin(false)}
            >
              Đăng ký
            </button>
          </div>
          {isLogin ? <LoginForm /> : <RegisterForm />}
          <SocialAuth />

        </div>
      </div>
    </div>
  );
}