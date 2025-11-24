/**
 * Generic filter utilities
 */

import type { Project } from '@/entities/project';

/**
 * Filter projects by search query (searches in name and description)
 */
export const filterProjectsByQuery = (
  projects: Project[],
  query: string
): Project[] => {
  if (!query.trim()) return projects;

  const lowerQuery = query.toLowerCase();
  return projects.filter(
    (project) =>
      project.name.toLowerCase().includes(lowerQuery) ||
      (project.description?.toLowerCase().includes(lowerQuery) ?? false)
  );
};

/**
 * Generic search filter for objects
 */
export const searchInObject = <T extends Record<string, any>>(
  item: T,
  query: string,
  searchKeys: (keyof T)[]
): boolean => {
  if (!query.trim()) return true;

  const lowerQuery = query.toLowerCase();
  return searchKeys.some((key) => {
    const value = item[key];
    if (typeof value === 'string') {
      return value.toLowerCase().includes(lowerQuery);
    }
    if (typeof value === 'number') {
      return value.toString().includes(lowerQuery);
    }
    return false;
  });
};
