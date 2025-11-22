/**
 * Authentication API
 * API functions for login, logout, and current user
 */

import axios from 'axios';
import type { LoginRequest, LoginResponse, User } from '../model/types';

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

export const authApi = {
  /**
   * Login with email and password
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
