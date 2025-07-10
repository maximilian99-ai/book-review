import axios from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';

const baseURL = 'http://localhost:8080';

export const apiClient = axios.create({ // axios 인스턴스 생성
  baseURL,
  withCredentials: true, // 쿠키를 포함한 요청을 보낼지 여부
  headers: { // 기본 헤더 설정
    'Content-Type': 'application/json' // 요청시 JSON 형식으로 데이터를 전송
  }
});

apiClient.interceptors.request.use( // 요청 인터셉터 추가 → 등록한 리뷰가 초기에 사용자 인증과 토큰을 서버로 실어나르지 않은 이유로 화면 요소에 표시되지 않는 오류가 자꾸 생겨서 추가한 함수
  (config: InternalAxiosRequestConfig) => {
    const token = sessionStorage.getItem('token'); // 세션 스토리지에서 토큰 가져오기
    if (token) { // Authorization 헤더에 토큰 추가
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use( // 응답 인터셉터 추가 (선택사항)
  (response) => response,
  async (error) => {
    const originalRequest = error.config; // 에러가 발생한 요청의 config 정보

    if (error.response?.status === 401 && !originalRequest._retry) { // 401 에러이고 재시도하지 않았던 요청인 경우
      originalRequest._retry = true; // 재시도 플래그 설정

      try { // 토큰 갱신 로직 추가 (토큰 갱신 API가 있는 경우)
        const refreshToken = sessionStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${baseURL}/authenticate`, { refreshToken }); // 토큰 갱신 요청

          if (response.data.token) {
            sessionStorage.setItem('token', response.data.token);
            apiClient.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`; // 기본 헤더에 새로운 토큰 설정
            originalRequest.headers['Authorization'] = `Bearer ${response.data.token}`; // 재시도할 요청의 헤더에도 새로운 토큰 설정

            return apiClient(originalRequest); // 원래 요청 재시도
          }
        }
      } catch { // 토큰 갱신 실패시
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
); 