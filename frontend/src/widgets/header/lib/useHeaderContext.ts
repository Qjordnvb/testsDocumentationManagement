/**
 * useHeaderContext Hook
 * Determines header content based on current route and user role
 */

import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/app/providers';
import { useProject } from '@/app/providers/ProjectContext';

export interface BreadcrumbItem {
  label: string;
  link?: string;
  icon?: string;
}

export interface HeaderContextData {
  title: string;
  subtitle: string;
  breadcrumbs: BreadcrumbItem[];
  showBreadcrumbs: boolean;
  icon?: string;
}

export const useHeaderContext = (): HeaderContextData => {
  const location = useLocation();
  const { user } = useAuth();
  const { currentProject } = useProject();

  return useMemo(() => {
    const pathname = location.pathname;
    const role = user?.role || 'qa';

    // ========================
    // ADMIN ROUTES
    // ========================
    if (pathname === '/admin/dashboard') {
      return {
        title: 'Panel de Administración',
        subtitle: 'Gestión del Sistema • Vista Corporativa',
        breadcrumbs: [],
        showBreadcrumbs: false,
        icon: '🏢',
      };
    }

    if (pathname === '/admin/users') {
      return {
        title: 'Gestión de Usuarios',
        subtitle: 'Administración de Accesos e Invitaciones',
        breadcrumbs: [],
        showBreadcrumbs: false,
        icon: '👥',
      };
    }

    // ========================
    // MANAGER ROUTES
    // ========================
    if (pathname === '/manager/dashboard') {
      return {
        title: 'Project Manager Dashboard',
        subtitle: 'Vista Global de Calidad • Health Scores',
        breadcrumbs: [],
        showBreadcrumbs: false,
        icon: '📊',
      };
    }

    // ========================
    // PROJECTS LIST (QA/DEV/ADMIN/MANAGER)
    // ========================
    if (pathname === '/' || pathname === '/projects') {
      if (role === 'admin') {
        return {
          title: user?.organization_name || 'Mi Organización',
          subtitle: `Gestión Corporativa • ${user?.email || ''}`,
          breadcrumbs: [],
          showBreadcrumbs: false,
          icon: '🏢',
        };
      }

      if (role === 'manager') {
        return {
          title: 'Mis Proyectos',
          subtitle: 'Gestión de Proyectos • Vista de Manager',
          breadcrumbs: [],
          showBreadcrumbs: false,
          icon: '📊',
        };
      }

      return {
        title: 'Mis Proyectos',
        subtitle: 'Vista de Trabajo • Gestión de Testing',
        breadcrumbs: [],
        showBreadcrumbs: false,
        icon: '📁',
      };
    }

    // ========================
    // PROJECT-SPECIFIC ROUTES (QA/DEV/MANAGER)
    // ========================
    if (currentProject && pathname.startsWith('/projects/')) {
      const projectName = currentProject.name;
      const projectId = currentProject.id;

      // Base breadcrumb (siempre incluye "Proyectos > Nombre del Proyecto")
      const baseBreadcrumbs: BreadcrumbItem[] = [
        { label: '📁 Proyectos', link: '/' },
        { label: projectName, link: `/projects/${projectId}/dashboard` },
      ];

      // Project Dashboard
      if (pathname.endsWith('/dashboard')) {
        return {
          title: projectName,
          subtitle: `${projectId} • Dashboard del Proyecto`,
          breadcrumbs: baseBreadcrumbs,
          showBreadcrumbs: true,
        };
      }

      // User Stories
      if (pathname.includes('/stories')) {
        return {
          title: '📝 User Stories',
          subtitle: `Historias de Usuario • Gestión de Requisitos`,
          breadcrumbs: [...baseBreadcrumbs, { label: '📝 Stories' }],
          showBreadcrumbs: true,
        };
      }

      // Test Cases
      if (pathname.includes('/tests')) {
        return {
          title: '🧪 Test Cases',
          subtitle: `Casos de Prueba • Automatización Gherkin`,
          breadcrumbs: [...baseBreadcrumbs, { label: '🧪 Tests' }],
          showBreadcrumbs: true,
        };
      }

      // Bug Details Page (e.g., /projects/PROJ-001/bugs/BUG-001)
      const bugDetailMatch = pathname.match(/\/bugs\/([A-Z]+-\d+)$/);
      if (bugDetailMatch) {
        const bugId = bugDetailMatch[1];
        return {
          title: `🐛 ${bugId}`,
          subtitle: 'Detalles del Bug Report',
          breadcrumbs: [
            ...baseBreadcrumbs,
            { label: '🐛 Bugs', link: `/projects/${projectId}/bugs` },
            { label: bugId },
          ],
          showBreadcrumbs: true,
        };
      }

      // Bugs List
      if (pathname.includes('/bugs')) {
        return {
          title: '🐛 Bug Reports',
          subtitle: `Gestión de Defectos • Seguimiento de Calidad`,
          breadcrumbs: [...baseBreadcrumbs, { label: '🐛 Bugs' }],
          showBreadcrumbs: true,
        };
      }

      // Reports
      if (pathname.includes('/reports')) {
        return {
          title: '📄 Reports',
          subtitle: `Generación de Documentos • Test Plans`,
          breadcrumbs: [...baseBreadcrumbs, { label: '📄 Reports' }],
          showBreadcrumbs: true,
        };
      }

      // Settings
      if (pathname.includes('/settings')) {
        return {
          title: '⚙️ Settings',
          subtitle: `Configuración del Proyecto`,
          breadcrumbs: [...baseBreadcrumbs, { label: '⚙️ Settings' }],
          showBreadcrumbs: true,
        };
      }

      // Default project view (shouldn't reach here, but fallback)
      return {
        title: projectName,
        subtitle: `${projectId} • Proyecto de Testing`,
        breadcrumbs: baseBreadcrumbs,
        showBreadcrumbs: true,
      };
    }

    // ========================
    // FALLBACK (Unknown route)
    // ========================
    return {
      title: 'QA Documentation System',
      subtitle: 'Sistema de Gestión de Testing',
      breadcrumbs: [],
      showBreadcrumbs: false,
      icon: '📋',
    };
  }, [location.pathname, user, currentProject]);
};
