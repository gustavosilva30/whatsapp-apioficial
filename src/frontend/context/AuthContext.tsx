import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'AGENT';
  tenantId: string;
  tenantName: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface AuthContextType {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load tokens from localStorage on mount
  useEffect(() => {
    const storedTokens = localStorage.getItem('auth_tokens');
    const storedUser = localStorage.getItem('auth_user');
    
    if (storedTokens && storedUser) {
      try {
        setTokens(JSON.parse(storedTokens));
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse stored auth data:', error);
        localStorage.removeItem('auth_tokens');
        localStorage.removeItem('auth_user');
      }
    }
    setIsLoading(false);
  }, []);

  // Save to localStorage whenever tokens or user changes
  useEffect(() => {
    if (tokens && user) {
      localStorage.setItem('auth_tokens', JSON.stringify(tokens));
      localStorage.setItem('auth_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('auth_tokens');
      localStorage.removeItem('auth_user');
    }
  }, [tokens, user]);

  const login = useCallback(async (email: string, password: string) => {
    const response = await fetch(`${API_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Login failed');
    }

    setUser(data.data.user);
    setTokens(data.data.tokens);
  }, []);

  const logout = useCallback(async () => {
    // Call logout endpoint if we have tokens
    if (tokens?.accessToken) {
      try {
        await fetch(`${API_URL}/api/v1/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${tokens.accessToken}`,
          },
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }

    setUser(null);
    setTokens(null);
  }, [tokens]);

  const refreshToken = useCallback(async (): Promise<boolean> => {
    if (!tokens?.refreshToken) {
      return false;
    }

    try {
      const response = await fetch(`${API_URL}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: tokens.refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      
      if (data.success && data.data.tokens) {
        setTokens(data.data.tokens);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Token refresh error:', error);
      // If refresh fails, log out the user
      setUser(null);
      setTokens(null);
      return false;
    }
  }, [tokens]);

  // Auto-refresh token before it expires
  useEffect(() => {
    if (!tokens?.expiresIn) return;

    // Refresh 5 minutes before expiration
    const refreshTime = tokens.expiresIn - 5 * 60 * 1000;
    if (refreshTime <= 0) return;

    const timer = setTimeout(() => {
      refreshToken();
    }, refreshTime);

    return () => clearTimeout(timer);
  }, [tokens, refreshToken]);

  // API helper with automatic token refresh
  const apiCall = useCallback(async (endpoint: string, options: RequestInit = {}) => {
    if (!tokens?.accessToken) {
      throw new Error('Not authenticated');
    }

    const headers = {
      'Authorization': `Bearer ${tokens.accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    let response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // If token expired, try to refresh
    if (response.status === 401) {
      const refreshed = await refreshToken();
      if (refreshed) {
        // Retry with new token
        response = await fetch(`${API_URL}${endpoint}`, {
          ...options,
          headers: {
            ...headers,
            'Authorization': `Bearer ${tokens.accessToken}`,
          },
        });
      } else {
        throw new Error('Session expired');
      }
    }

    return response;
  }, [tokens, refreshToken]);

  // Make apiCall available globally for convenience
  useEffect(() => {
    (window as any).apiCall = apiCall;
  }, [apiCall]);

  const value: AuthContextType = {
    user,
    tokens,
    isAuthenticated: !!user && !!tokens,
    isLoading,
    login,
    logout,
    refreshToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
