import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';

type LocationState = { registeredUsername?: string };

const Login: React.FC = () => {
  const [username, setUsername] = useState('in28minutes'); // 사용자명
  const [password, setPassword] = useState(''); // 비밀번호
  const [showErrorMessage, setShowErrorMessage] = useState(false); // 에러 메시지 표시 여부
  const navigate = useNavigate();
  const location = useLocation(); // 현재 라우트 정보
  const { login } = useAuthStore(); // 로그인 상태 관리 훅

  useEffect(() => {
    const state = location.state as LocationState | null; // 라우트 상태 정보
    if (state?.registeredUsername) { // 라우트 상태에 등록된 사용자명이 있는 경우
      setUsername(state.registeredUsername); // 사용자명 필드에 설정
    }
  }, [location.state]);

  const handleSubmit = async (e: React.FormEvent) => { // 로그인 버튼 클릭시 호출되는 함수
    e.preventDefault();
    setShowErrorMessage(false);
    try {
      if (await login(username, password)) { // 로그인 API 호출
        navigate('/');
      } else {
        setShowErrorMessage(true);
      }
    } catch {
      setShowErrorMessage(true);
    }
  };

  return (
    <div className="container mx-auto mt-5 px-4">
      <div className="flex justify-center">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="border-b border-gray-200 px-6 py-4">
              <h3 className="text-center text-xl font-bold">Please sign in~</h3>
            </div>
            <div className="p-6">
              {showErrorMessage && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                  Authentication is falied. Check your credentials!
                </div>
              )}
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                    Username:
                  </label>
                  <input type="text" id="username" value={username} onChange={e => setUsername(e.target.value)}
                    autoComplete="username"
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password:
                  </label>
                  <input type="password" id="password" value={password} onChange={e => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="space-y-2">
                  <button type="submit" 
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded transition-colors"
                  >
                    Sign in
                  </button>
                  <Link to="/register" 
                    className="block w-full text-center text-blue-600 hover:text-blue-800 no-underline hover:underline py-2"
                  >
                    Sign up
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;