'use client';

import React, { createContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import apiClient from '../lib/api-client';
import { API_ENDPOINTS } from '../lib/constants';
import { AuthContextType, User } from '../types/auth';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const queryClient = useQueryClient();

  const isAuthenticated = !!user;

  // On mount, try to fetch user (httpOnly cookies sent automatically)
  useEffect(() => {
    const initAuth = async () => {
      try {
        const response = await apiClient.get('/users/me');
        setUser(response.data);
      } catch (error) {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string, rememberMe: boolean = false) => {
    setIsLoading(true);
    try {
      // Login - backend sets httpOnly cookies
      await apiClient.post(API_ENDPOINTS.LOGIN, {
        email,
        password,
        remember_me: rememberMe
      });

      // Fetch user info
      const userResponse = await apiClient.get('/users/me');
      setUser(userResponse.data);

      toast.success('Successfully logged in!');
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Login failed. Please try again.';
      toast.error(errorMessage);
      throw error; // Re-throw so form can handle it
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, password: string, rememberMe: boolean = false) => {
    setIsLoading(true);
    try {
      // Signup - backend sets httpOnly cookies
      await apiClient.post(API_ENDPOINTS.SIGNUP, {
        email,
        password,
        remember_me: rememberMe
      });

      // Fetch user info
      const userResponse = await apiClient.get('/users/me');
      setUser(userResponse.data);

      toast.success('Account created successfully!');
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Signup failed. Please try again.';
      toast.error(errorMessage);
      throw error; // Re-throw so form can handle it
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Backend will clear httpOnly cookies
      await apiClient.post(API_ENDPOINTS.LOGOUT, {});
    } catch (error) {
      // Continue logout even if request fails
    } finally {
      setUser(null);

      // Invalidate all queries to prevent data leakage
      queryClient.clear();

      toast.success('Successfully logged out');
      router.replace('/');
    }
  };

  const requestPasswordReset = async (email: string) => {
    try {
      await apiClient.post(API_ENDPOINTS.PASSWORD_RESET_REQUEST, { email });
      toast.success('Password reset instructions sent to your email');
    } catch (error: any) {
      toast.error('Failed to send reset instructions');
    }
  };

  const confirmPasswordReset = async (token: string, newPassword: string) => {
    try {
      await apiClient.post(API_ENDPOINTS.PASSWORD_RESET_CONFIRM, {
        reset_token: token,
        new_password: newPassword,
      });
      toast.success('Password reset successful!');
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Password reset failed';
      toast.error(errorMessage);
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      await apiClient.post(API_ENDPOINTS.PASSWORD_CHANGE, {
        current_password: currentPassword,
        new_password: newPassword,
      });
      toast.success('Password changed successfully!');
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Password change failed';
      toast.error(errorMessage);
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
        requestPasswordReset,
        confirmPasswordReset,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
