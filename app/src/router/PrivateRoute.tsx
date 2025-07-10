import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { authenticated } = useAuthStore();
  const storedToken = sessionStorage.getItem('token');

  const isAuthenticated = authenticated || storedToken;
  return isAuthenticated ? <>{children}</> : <Navigate to="/" />;
};

export default PrivateRoute;