import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';

const Navigation: React.FC = () => {
  const { authenticated, username, logout } = useAuthStore(state => ({
    authenticated: state.authenticated,
    username: state.username,
    logout: state.logout
  }));

  return (
    <nav className="navbar">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', margin: '0 auto', padding: '0.75rem 1rem'}}>
        <Link to="/" className="navbar-brand">
          Book List
        </Link>
        <div className="flex items-center space-x-4">
          {!authenticated && (
            <>
              <Link to="/register" className="nav-link">
                Sign Up
              </Link>
              <Link to="/login" className="nav-link">
                Sign In
              </Link>
            </>
          )}
          {authenticated && (
            <>
              <span className="text-gray-700 font-medium">Hi, {username}</span>
              <button 
                onClick={logout} 
                className="nav-link"
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  padding: '0.5rem 0.75rem',
                  color: '#495057',
                  cursor: 'pointer'
                }}
                onMouseEnter={e => e.target.style.color = '#dc3545'}
                onMouseLeave={e => e.target.style.color = '#495057'}
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;