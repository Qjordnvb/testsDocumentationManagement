/**
 * User entity types for authentication and authorization
 */

export type Role = 'admin' | 'qa' | 'dev' | 'manager';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  is_active: boolean;
  created_at?: string;
  last_login?: string | null;
}

export interface CreateUserDTO {
  email: string;
  password: string;
  full_name: string;
  role: Role;
}

export interface UpdateUserDTO {
  email?: string;
  password?: string;
  full_name?: string;
  role?: Role;
  is_active?: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

// ============================================================================
// Invitation-Based Registration DTOs
// ============================================================================

export interface CheckEmailRequest {
  email: string;
}

export interface CheckEmailResponse {
  exists: boolean;
  is_registered: boolean;
  full_name: string | null;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
}

export interface RegisterResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface CreateUserInvitationDTO {
  email: string;
  full_name: string;
  role: Role;
}
