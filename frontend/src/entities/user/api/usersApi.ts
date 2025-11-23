/**
 * Users Management API
 * API functions for user CRUD operations (ADMIN only)
 *
 * NOTE: All methods now use shared apiClient with auto-injected auth token
 * No need to pass token manually anymore
 */

import { api } from '@/shared/api/apiClient';
import type { User, CreateUserDTO, UpdateUserDTO, CreateUserInvitationDTO } from '../model/types';

export const usersApi = {
  /**
   * Get all users (ADMIN, MANAGER)
   * Auth token is automatically injected by apiClient interceptor
   */
  getAll: async (): Promise<User[]> => {
    const { data } = await api.get<User[]>('/users');
    return data;
  },

  /**
   * Get a single user by ID (ADMIN, MANAGER)
   */
  getById: async (id: string): Promise<User> => {
    const { data } = await api.get<User>(`/users/${id}`);
    return data;
  },

  /**
   * Create a user invitation (ADMIN only)
   * Creates invitation without password - user will register later
   */
  createInvitation: async (invitation: CreateUserInvitationDTO): Promise<any> => {
    const { data } = await api.post('/users/invite', invitation);
    return data;
  },

  /**
   * Create a new user (ADMIN only - LEGACY)
   * Prefer using createInvitation for new implementations
   */
  create: async (user: CreateUserDTO): Promise<User> => {
    const { data } = await api.post<User>('/users', user);
    return data;
  },

  /**
   * Update a user (ADMIN only)
   */
  update: async (id: string, updates: UpdateUserDTO): Promise<User> => {
    const { data } = await api.put<User>(`/users/${id}`, updates);
    return data;
  },

  /**
   * Delete a user (ADMIN only)
   */
  delete: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`);
  },
};
