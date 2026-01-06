'use client';

import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import apiClient from '../lib/api-client';
import { API_ENDPOINTS, ACCESS_TOKEN_EXPIRE_MINUTES, REFRESH_BEFORE_EXPIRY_MINUTES } from '../lib/constants';
import {
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
  clearTokens,
} from '../lib/token-storage';
import { AuthContextType, User, Token } from '../types/auth';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const isAuthenticated = !!user;

  // Setup auto token refresh
  const setupTokenRefresh = useCallback(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }

    const refreshInterval = (ACCESS_TOKEN_EXPIRE_MINUTES - REFRESH_BEFORE_EXPIRY_MINUTES) * 60 * 1000;

    refreshIntervalRef.current = setInterval(async () => {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        clearInterval(refreshIntervalRef.current!);
        return;
      }

      try {
        const response = await apiClient.post(API_ENDPOINTS.REFRESH, {
          refresh_token: refreshToken,
        });
        setAccessToken(response.data.access_token);
      } catch (error) {
        console.error('Token refresh failed:', error);
        clearTokens();
        setUser(null);
        router.push('/login');
        clearInterval(refreshIntervalRef.current!);
      }
    }, refreshInterval);
  }, [router]);

  // On mount, check if we have a valid token and fetch user
  useEffect(() => {
    const initAuth = async () => {
      const accessToken = getAccessToken();

      if (!accessToken) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await apiClient.get('/users/me');
        setUser(response.data);
      } catch (error) {
        console.error('Failed to fetch user on mount:', error);
        clearTokens();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // Setup token refresh when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      setupTokenRefresh();
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [isAuthenticated, setupTokenRefresh]);

  const login = async (email: string, rememberMe: boolean = false) => {
    try {
      setIsLoading(true);

      // Step 1: Login and get tokens
      const response = await apiClient.post<Token>(API_ENDPOINTS.LOGIN, { email });
      const { access_token, refresh_token } = response.data;

      // Step 2: Store tokens
      setAccessToken(access_token);
      setRefreshToken(refresh_token, rememberMe);

      // Step 3: Fetch user info
      try {
        const userResponse = await apiClient.get('/users/me');
        setUser(userResponse.data);
      } catch (error) {
        // If fetching user fails, set a temporary user object
        // This allows login to succeed and user can still access dashboard
        console.error('Failed to fetch user info:', error);
        setUser({
          id: 0,
          email: email,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      setIsLoading(false);
      toast.success('Successfully logged in!');
      router.push('/dashboard');
    } catch (error: any) {
      setIsLoading(false);
      const errorMessage = error.response?.data?.detail || 'Login failed. Please try again.';
      toast.error(errorMessage);
      throw error;
    }
  };

  const signup = async (email: string, rememberMe: boolean = false) => {
    try {
      setIsLoading(true);

      // Step 1: Signup and get tokens
      const response = await apiClient.post<Token>(API_ENDPOINTS.SIGNUP, { email });
      const { access_token, refresh_token } = response.data;

      // Step 2: Store tokens
      setAccessToken(access_token);
      setRefreshToken(refresh_token, rememberMe);

      // Step 3: Fetch user info
      try {
        const userResponse = await apiClient.get('/users/me');
        setUser(userResponse.data);
      } catch (error) {
        console.error('Failed to fetch user info:', error);
        setUser({
          id: 0,
          email: email,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      setIsLoading(false);
      toast.success('Account created successfully!');
      router.push('/dashboard');
    } catch (error: any) {
      setIsLoading(false);
      const errorMessage = error.response?.data?.detail || 'Signup failed. Please try again.';
      toast.error(errorMessage);
      throw error;
    }
  };

  const logout = async () => {
    try {
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        await apiClient.post(API_ENDPOINTS.LOGOUT, {
          refresh_token: refreshToken,
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearTokens();
      setUser(null);

      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }

      toast.success('Successfully logged out');
      router.push('/');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
