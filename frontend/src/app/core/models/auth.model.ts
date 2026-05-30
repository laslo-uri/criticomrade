import { User } from './user.model';

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginRequest {
  username: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  fullName?: string;
}

export interface MessageResponse {
  message: string;
}
