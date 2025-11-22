/**
 * Authentication Context
 * Provides authentication state and methods throughout the app
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '@/entities/user';
import type { User, LoginRequest, Role } from '@/entities/user';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  hasRole: (...roles: Role[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load authentication state from sessionStorage on mount
  useEffect(() => {
    const loadAuthState = () => {
      try {
        const storedToken = sessionStorage.getItem('auth_token');
        const storedUser = sessionStorage.getItem('auth_user');

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Failed to load auth state:', error);
        // Clear invalid data
        sessionStorage.removeItem('auth_token');
        sessionStorage.removeItem('auth_user');
      } finally {
        setIsLoading(false);
      }
    };

    loadAuthState();
  }, []);

  // Login function
  const login = async (credentials: LoginRequest) => {
    try {
      const response = await authApi.login(credentials);

      setToken(response.access_token);
      setUser(response.user);

      // Persist to sessionStorage
      sessionStorage.setItem('auth_token', response.access_token);
      sessionStorage.setItem('auth_user', JSON.stringify(response.user));
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  // Logout function
  const logout = () => {
    // Call logout endpoint if token exists (optional, JWT is stateless)
    if (token) {
      authApi.logout(token).catch(console.error);
    }

    // Clear state
    setToken(null);
    setUser(null);

    // Clear sessionStorage
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_user');
  };

  // Check if user has any of the specified roles
  const hasRole = (...roles: Role[]): boolean => {
    return user ? roles.includes(user.role) : false;
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    logout,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
