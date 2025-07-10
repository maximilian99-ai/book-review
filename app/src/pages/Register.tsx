import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { executeRegistrationService } from '../apis/AuthenticationApiService';

const Register: React.FC = () => {
  const [username, setUsername] = useState(''); // 사용자명
  const [password, setPassword] = useState(''); // 비밀번호
  const [confirmPassword, setConfirmPassword] = useState(''); // 비밀번호 확인
  const [errorMessage, setErrorMessage] = useState(''); // 에러 메시지
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => { // 등록 버튼 클릭시 호출되는 함수
    e.preventDefault();
    setErrorMessage('');
    if (password !== confirmPassword) {
      setErrorMessage('Password doesn\'t match');
      return;
    }
    try {
      const response = await executeRegistrationService(username, password); // 사용자 등록 API 호출
      if (response.status === 200) {
        navigate('/login', { state: { registeredUsername: username } });
      }
    } catch (error: any) {
      if (error.response && error.response.data === 'Username already exists') {
        setErrorMessage('The username already exists');
      } else {
        setErrorMessage('Sign up is failed. Please try again.');
      }
    }
  };

  return (
    <div className="container mx-auto mt-5 px-4">
      <div className="flex justify-center">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="border-b border-gray-200 px-6 py-4">
              <h3 className="text-center text-xl font-bold">Sign Up</h3>
            </div>
            <div className="p-6">
              {errorMessage && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                  {errorMessage}
                </div>
              )}
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                    Username:
                  </label>
                  <input type="text" id="username" value={username} onChange={e => setUsername(e.target.value)}
                    autoComplete="username" required
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password:
                  </label>
                  <input type="password" id="password" value={password} onChange={e => setPassword(e.target.value)}
                    autoComplete="new-password" required
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="mb-6">
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm password:
                  </label>
                  <input type="password" id="confirmPassword" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                    autoComplete="new-password" required
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="space-y-2">
                  <button type="submit" 
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded transition-colors"
                  >
                    Register
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;