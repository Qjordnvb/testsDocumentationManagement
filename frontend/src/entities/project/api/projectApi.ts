/**
 * Project Entity - API
 * API functions for Project CRUD operations
 */

import axios from 'axios';
import type { Project, CreateProjectDTO, UpdateProjectDTO, ProjectStats } from '../model/types';

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// API Response Types
interface GetProjectsResponse {
  projects: Project[];
}

export const projectApi = {
  /**
   * Get all projects
   */
  getAll: async (): Promise<Project[]> => {
    const { data } = await api.get<GetProjectsResponse>('/projects');
    return data.projects;
  },

  /**
   * Get a single project by ID
   */
  getById: async (id: string): Promise<Project> => {
    const { data } = await api.get<Project>(`/projects/${id}`);
    return data;
  },

  /**
   * Create a new project
   */
  create: async (project: CreateProjectDTO): Promise<Project> => {
    const { data } = await api.post<Project>('/projects', project);
    return data;
  },

  /**
   * Update an existing project
   */
  update: async (id: string, updates: UpdateProjectDTO): Promise<Project> => {
    const { data } = await api.put<Project>(`/projects/${id}`, updates);
    return data;
  },

  /**
   * Delete a project (cascades to all related data)
   */
  delete: async (id: string): Promise<void> => {
    await api.delete(`/projects/${id}`);
  },

  /**
   * Get project statistics
   */
  getStats: async (id: string): Promise<ProjectStats> => {
    const { data} = await api.get<ProjectStats>(`/projects/${id}/stats`);
    return data;
  },
};
