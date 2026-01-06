import Cookies from 'js-cookie';
import { TOKEN_KEYS, ACCESS_TOKEN_EXPIRE_MINUTES, REFRESH_TOKEN_EXPIRE_DAYS } from './constants';

export const getAccessToken = (): string | undefined => {
  return Cookies.get(TOKEN_KEYS.ACCESS_TOKEN);
};

export const setAccessToken = (token: string): void => {
  Cookies.set(TOKEN_KEYS.ACCESS_TOKEN, token, {
    expires: ACCESS_TOKEN_EXPIRE_MINUTES / (24 * 60), // Convert minutes to days
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
};

export const getRefreshToken = (): string | undefined => {
  return Cookies.get(TOKEN_KEYS.REFRESH_TOKEN);
};

export const setRefreshToken = (token: string, rememberMe: boolean = false): void => {
  const options = {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    ...(rememberMe && { expires: REFRESH_TOKEN_EXPIRE_DAYS }),
  };

  Cookies.set(TOKEN_KEYS.REFRESH_TOKEN, token, options);
};

export const clearTokens = (): void => {
  Cookies.remove(TOKEN_KEYS.ACCESS_TOKEN);
  Cookies.remove(TOKEN_KEYS.REFRESH_TOKEN);
};

export const hasValidToken = (): boolean => {
  const accessToken = getAccessToken();
  return !!accessToken;
};
