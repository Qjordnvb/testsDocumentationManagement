/**
 * Header Component
 */

import { useProject } from '@/app/providers/ProjectContext';
import { Link } from 'react-router-dom';
import { colors, borderRadius, getTypographyPreset } from '@/shared/design-system/tokens';

export const Header = () => {
  const { currentProject } = useProject();

  const bodySmall = getTypographyPreset('bodySmall');
  const body = getTypographyPreset('body');
  const headingMedium = getTypographyPreset('headingMedium');

  return (
    <header className={`${colors.white} shadow-sm border-b ${colors.gray.border200} px-6 py-4`}>
      <div className="flex items-center justify-between">
        {/* Project name with breadcrumb */}
        <div>
          {currentProject ? (
            // When inside a project - show breadcrumb
            <>
              <div className={`flex items-center gap-2 ${bodySmall.className} ${colors.gray.text500} mb-1`}>
                <Link to="/" className={`hover:text-blue-600 transition-colors`}>
                  📁 Todos los Proyectos
                </Link>
                <span>›</span>
                <span className={`${colors.gray.text900} font-medium`}>{currentProject.name}</span>
              </div>
              <h2 className={`${headingMedium.className} font-bold ${colors.gray.text900}`}>
                {currentProject.name}
              </h2>
              <p className={`${bodySmall.className} ${colors.gray.text600}`}>
                {currentProject.id} • QA Documentation Management
              </p>
            </>
          ) : (
            // When in projects list - clear title
            <>
              <h2 className={`${headingMedium.className} font-bold ${colors.gray.text900} flex items-center gap-2`}>
                <span>📁</span>
                <span>Mis Proyectos QA</span>
              </h2>
              <p className={`${bodySmall.className} ${colors.gray.text600}`}>
                Gestiona todos tus proyectos de testing
              </p>
            </>
          )}
        </div>

        {/* User menu */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <button
            className={`p-2 ${borderRadius.lg} hover:bg-gray-100 transition-colors relative`}
            aria-label="Notifications"
          >
            <span className="text-xl">🔔</span>
            {/* Notification badge */}
            <span className={`absolute top-1 right-1 w-2 h-2 ${colors.status.error[500]} ${borderRadius.full}`}></span>
          </button>

          {/* User avatar */}
          <div className={`flex items-center gap-3 p-2 ${borderRadius.lg} hover:bg-gray-100 transition-colors cursor-pointer`}>
            <div className={`w-10 h-10 bg-gradient-to-r from-primary-blue to-primary-purple ${borderRadius.full} flex items-center justify-center ${colors.white} font-bold`}>
              JD
            </div>
            <div className={bodySmall.className}>
              <p className={`font-medium ${colors.gray.text900}`}>Jordan</p>
              <p className={colors.gray.text600}>QA Engineer</p>
            </div>
            <span className={colors.gray.text400}>▼</span>
          </div>
        </div>
      </div>
    </header>
  );
};
