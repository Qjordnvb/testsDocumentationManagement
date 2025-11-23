/**
 * Authentication API
 * API functions for login, logout, and current user
 *
 * NOTE: Auth endpoints use separate axios instance to avoid circular dependency
 * (login/register endpoints don't need auth token injection)
 */

import axios from 'axios';
import type {
  LoginRequest,
  LoginResponse,
  User,
  CheckEmailRequest,
  CheckEmailResponse,
  RegisterRequest,
  RegisterResponse,
} from '../model/types';

// Internal API instance for auth endpoints (needs to be separate to avoid circular dependency with interceptors)
const authApiInstance = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

export const authApi = {
  /**
   * Check if email exists in whitelist and registration status
   * Used in multi-step login flow
   */
  checkEmail: async (request: CheckEmailRequest): Promise<CheckEmailResponse> => {
    const { data } = await authApiInstance.post<CheckEmailResponse>('/auth/check-email', request);
    return data;
  },

  /**
   * Complete user registration (invited user sets password)
   * Returns access token (auto-login after registration)
   */
  register: async (request: RegisterRequest): Promise<RegisterResponse> => {
    const { data } = await authApiInstance.post<RegisterResponse>('/auth/register', request);
    return data;
  },

  /**
   * Login with email and password (for registered users only)
   */
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const { data } = await authApiInstance.post<LoginResponse>('/auth/login', credentials);
    return data;
  },

  /**
   * Get current authenticated user (uses shared apiClient with auto-injected token)
   */
  getCurrentUser: async (token: string): Promise<User> => {
    const { data } = await authApiInstance.get<User>('/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  },

  /**
   * Logout current user (uses shared apiClient with auto-injected token)
   */
  logout: async (token: string): Promise<void> => {
    await authApiInstance.post('/auth/logout', {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
};
