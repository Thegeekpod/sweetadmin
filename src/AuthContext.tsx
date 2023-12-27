import React, { createContext, useState, useContext, useEffect, PropsWithChildren } from 'react';

interface AuthContextProps {
  isAuthenticated: boolean;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuthValidity: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextProps | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<PropsWithChildren<{}>> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const response = await fetch('http://localhost:8990/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        const authToken = data.token;
        setToken(authToken);
        localStorage.setItem('token', authToken);
      } else {
        throw new Error('Authentication failed');
      }
    } catch (error) {
      console.error('Authentication error:', error);
      // Handle authentication errors
    }
  };

  const logout = () => {
    setToken(null);
    localStorage.removeItem('token');
  };

  const checkAuthValidity = async () => {
    if (token) {
      try {
        const response = await fetch('http://localhost:8990/api/v1/auth/authcheck', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          return true; // Token is valid
        } else {
          return false; // Token is invalid/expired
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        return false;
      }
    } else {
      return false; // No token available
    }
  };

  const isAuthenticated = !!token;

  const authContextValue: AuthContextProps = {
    isAuthenticated,
    token,
    login,
    logout,
    checkAuthValidity,
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};