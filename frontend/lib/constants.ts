export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';
export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'Call Me Reminder';

export const API_ENDPOINTS = {
  LOGIN: '/auth/login',
  SIGNUP: '/auth/signup',
  REFRESH: '/auth/refresh',
  LOGOUT: '/auth/logout',
  PASSWORD_RESET_REQUEST: '/auth/password-reset/request',
  PASSWORD_RESET_CONFIRM: '/auth/password-reset/confirm',
  PASSWORD_CHANGE: '/auth/password/change',
  REMINDERS: '/reminders',
} as const;

// Token timing constants (kept for reference)
// Tokens are now managed via httpOnly cookies on the backend
export const ACCESS_TOKEN_EXPIRE_MINUTES = 30;
export const REFRESH_TOKEN_EXPIRE_DAYS = 7;
