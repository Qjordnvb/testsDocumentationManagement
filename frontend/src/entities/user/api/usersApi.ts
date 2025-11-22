/**
 * Users Management API
 * API functions for user CRUD operations (ADMIN only)
 */

import axios from 'axios';
import type { User, CreateUserDTO, UpdateUserDTO } from '../model/types';

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

/**
 * Get authorization header with token
 */
const getAuthHeader = (token: string) => ({
  Authorization: `Bearer ${token}`,
});

export const usersApi = {
  /**
   * Get all users (ADMIN, MANAGER)
   */
  getAll: async (token: string): Promise<User[]> => {
    const { data } = await api.get<User[]>('/users', {
      headers: getAuthHeader(token),
    });
    return data;
  },

  /**
   * Get a single user by ID (ADMIN, MANAGER)
   */
  getById: async (id: string, token: string): Promise<User> => {
    const { data } = await api.get<User>(`/users/${id}`, {
      headers: getAuthHeader(token),
    });
    return data;
  },

  /**
   * Create a new user (ADMIN only)
   */
  create: async (user: CreateUserDTO, token: string): Promise<User> => {
    const { data } = await api.post<User>('/users', user, {
      headers: getAuthHeader(token),
    });
    return data;
  },

  /**
   * Update a user (ADMIN only)
   */
  update: async (id: string, updates: UpdateUserDTO, token: string): Promise<User> => {
    const { data } = await api.put<User>(`/users/${id}`, updates, {
      headers: getAuthHeader(token),
    });
    return data;
  },

  /**
   * Delete a user (ADMIN only)
   */
  delete: async (id: string, token: string): Promise<void> => {
    await api.delete(`/users/${id}`, {
      headers: getAuthHeader(token),
    });
  },
};
