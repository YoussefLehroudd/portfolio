import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if admin is logged in on page load
    const token = localStorage.getItem('adminToken');
    const storedAdmin = localStorage.getItem('adminData');

    if (token && storedAdmin) {
      try {
        setAdmin(JSON.parse(storedAdmin));
      } catch (e) {
        localStorage.removeItem('adminData');
      }
    }

    if (token) {
      verifyToken(token);
    } else {
      setLoading(false);
    }
  }, []);

  const verifyToken = async (token) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/verify`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAdmin(data);
        localStorage.setItem('adminData', JSON.stringify(data));
      } else if (response.status === 401) {
        // Token is invalid or expired, logout
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminData');
        setAdmin(null);
      } else {
        // Other server errors, keep the user logged in with cached data
        console.warn('Token verification failed with status:', response.status);
      }
    } catch (error) {
      console.error('Error verifying token:', error);
      // Network or other error: keep token and any cached admin data
    }
    setLoading(false);
  };

  const login = async (username, password) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();
      
      if (response.ok) {
        localStorage.setItem('adminToken', data.token);
        localStorage.setItem('adminData', JSON.stringify(data.admin));
        setAdmin(data.admin);
        return { success: true };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'An error occurred during login' };
    }
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    setAdmin(null);
  };

  const value = {
    admin,
    loading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
