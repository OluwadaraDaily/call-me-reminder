export interface User {
  id: number;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface Token {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, rememberMe?: boolean) => Promise<void>;
  signup: (email: string, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
}

export interface LoginPayload {
  email: string;
}

export interface SignupPayload {
  email: string;
}

export interface RefreshPayload {
  refresh_token: string;
}

export interface LogoutPayload {
  refresh_token: string;
}
