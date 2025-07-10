import { apiClient } from './ApiClient';

export const executeJwtAuthenticationService = (username: string, password: string) => {
  return apiClient.post('/authenticate', { username, password });
};

export const executeRegistrationService = (username: string, password: string) => {
  return apiClient.post('/register', { username, password });
}; 