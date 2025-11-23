/**
 * Authentication API
 * API functions for login, logout, and current user
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

const api = axios.create({
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
    const { data } = await api.post<CheckEmailResponse>('/auth/check-email', request);
    return data;
  },

  /**
   * Complete user registration (invited user sets password)
   * Returns access token (auto-login after registration)
   */
  register: async (request: RegisterRequest): Promise<RegisterResponse> => {
    const { data } = await api.post<RegisterResponse>('/auth/register', request);
    return data;
  },

  /**
   * Login with email and password (for registered users only)
   */
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const { data } = await api.post<LoginResponse>('/auth/login', credentials);
    return data;
  },

  /**
   * Get current authenticated user
   */
  getCurrentUser: async (token: string): Promise<User> => {
    const { data } = await api.get<User>('/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return data;
  },

  /**
   * Logout current user
   */
  logout: async (token: string): Promise<void> => {
    await api.post(
      '/auth/logout',
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
  },
};
