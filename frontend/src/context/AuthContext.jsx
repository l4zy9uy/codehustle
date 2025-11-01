import React, { createContext, useContext, useState, useEffect } from 'react';
import { getMe } from '../lib/api/auth';

// Create authentication context
const AuthContext = createContext(null);

// Provider component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      // Fetch current user profile
      getMe()
        .then((data) => {
          setUser(data?.user || null);
        })
        .catch(() => {
          localStorage.removeItem('authToken');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
            // Mock: default admin when no token to demo edit flows
      setUser({ id: 'mock-admin', name: 'Admin User', role: 'admin', email: 'admin@example.com' });
      setLoading(false);
    }
  }, []);

  const login = (token, userData) => {
    localStorage.setItem('authToken', token);
    setUser(userData || null);
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 
