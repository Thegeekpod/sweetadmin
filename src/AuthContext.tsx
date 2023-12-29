import React, { createContext, useState, useContext, useEffect, PropsWithChildren } from 'react';
import apiconfig from './apiconfig.json';

interface UserData {
  // Define the structure of your user data here
  // For example:
  id: number;
  username: string;
  // ... other fields
}

interface AuthContextProps {
  isAuthenticated: boolean;
  token: string | null;
  userData: UserData | null;
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
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const response = await fetch(`${apiconfig.apiroot}${apiconfig.apiendpoint.login}`, {
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
        await fetchUserData(); // Fetch user data after successful login
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
    setUserData(null); // Clear user data on logout
  };

  const fetchUserData = async () => {
    if (token) {
      try {
        const response = await fetch('http://localhost:8990/api/v1/auth/profile', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const userData = await response.json() as UserData;
          setUserData(userData); // Store fetched user data
        } else {
          throw new Error('Failed to fetch user data');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        // Handle errors while fetching user data
      }
    } else {
      // Handle case when no token is available
    }
  };

  useEffect(() => {
    fetchUserData(); // Fetch user data when component mounts or token changes
  }, [token]);

  const isAuthenticated = !!token;

  const checkAuthValidity = async () => {
    if (token) {
      try {
        const response = await fetch(`${apiconfig.apiroot}${apiconfig.apiendpoint.authcheck}`, {
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

  const authContextValue: AuthContextProps = {
    isAuthenticated,
    token,
    userData,
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
