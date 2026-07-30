import { FaGoogle, FaFacebookF } from 'react-icons/fa';

export function SocialAuth() {
  return (
    <>
      <div className="mt-8 relative flex items-center justify-center">
        <div className="border-t border-gray-200 w-full absolute"></div>
        <span className="bg-white px-4 text-sm text-gray-500 relative font-medium">
          Hoặc tiếp tục với
        </span>
      </div>

      <div className="mt-6 flex gap-4">
        <button className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium text-gray-700">
          <FaGoogle className="text-red-500" size={18} /> Google
        </button>
        <button className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium text-gray-700">
          <FaFacebookF className="text-blue-600" size={18} /> Facebook
        </button>
      </div>
    </>
  );
}