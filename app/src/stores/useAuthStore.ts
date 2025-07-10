import { create } from 'zustand';
import { executeJwtAuthenticationService } from '../apis/AuthenticationApiService';
import { apiClient } from '../apis/ApiClient';

interface AuthState {
  authenticated: boolean;
  token: string | null;
  username: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  restore: () => void;
}

const setupAxiosInterceptor = (jwt:string) => {
  apiClient.interceptors.request.clear(); // 기존 인터셉터 제거

  apiClient.interceptors.request.use(config => { // 요청 인터셉터로 모든 요청에
    if (jwt) {
      config.headers.Authorization = jwt; // jwt를 포함시켜
    }
    return config; // 나중의 모든 api 요청에 인증 토큰을 자동으로 추가
  });
}

export const useAuthStore = create<AuthState>((set) => ({
  authenticated: false,
  token: null,
  username: null,

  login: async (inputUsername: string, password: string) => {
    try {
      const response = await executeJwtAuthenticationService(inputUsername, password); // jwt 인증을 시도
      if (response.status === 200) { // 인증이 성공하면(상태코드 200)
        const jwt = 'Bearer ' + response.data.token; // 서버에서 전달받은 jwt를 Bearer 형식으로 저장
        set({ authenticated: true, token: jwt, username: inputUsername });

        sessionStorage.setItem('authenticated', 'true'); // 세션 스토리지에 인증 정보 저장
        sessionStorage.setItem('token', jwt);
        sessionStorage.setItem('username', inputUsername);

        setupAxiosInterceptor(jwt);

        return true;
      } else {
        useAuthStore.getState().logout();
        return false;
      }
    } catch {
      useAuthStore.getState().logout();
      return false;
    }
  },

  logout: () => {
    set({ authenticated: false, token: null, username: null });

    sessionStorage.removeItem('authenticated'); // 세션 스토리지에서 인증 정보 제거
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('username');
  }, 

  restore: () => { // 페이지 새로고침시 세션 스토리지에서 인증 정보 복원
    const storedToken = sessionStorage.getItem('token');
    const storedUsername = sessionStorage.getItem('username');
    if (storedToken && storedUsername) {
      set({ authenticated: true, token: storedToken, username: storedUsername });
    }
  }
})); 