/**
 * Main Layout Component
 * Wraps all pages with Sidebar and Header
 */

import type { ReactNode } from 'react';
import { Sidebar } from '@/widgets/sidebar/Sidebar';
import { Header } from './Header';
import { useAppStore } from '@/app/providers/appStore';
import { colors } from '@/shared/design-system/tokens';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const { sidebarCollapsed } = useAppStore();

  return (
    <div className={`flex h-screen ${colors.gray[50]}`}>
      {/* Sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          sidebarCollapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        {/* Header */}
        <Header />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};
