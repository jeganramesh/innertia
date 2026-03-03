import { ReactNode, useState } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface MainLayoutProps {
  children: ReactNode;
  className?: string;
  showHeader?: boolean;
  showSidebar?: boolean;
  headerTitle?: string;
  headerBreadcrumbs?: Array<{ label: string; path?: string }>;
  headerActions?: ReactNode;
  showSearch?: boolean;
  onSearch?: (query: string) => void;
}

export const MainLayout = ({
  children,
  className,
  showHeader = true,
  showSidebar = true,
  headerTitle,
  headerBreadcrumbs,
  headerActions,
  showSearch = false,
  onSearch,
}: MainLayoutProps) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50">
      {showSidebar && (
        <Sidebar onCollapseChange={setIsSidebarCollapsed} />
      )}

      <div className="flex-1 flex flex-col w-full">
        {showHeader && (
          <Header
            title={headerTitle}
            breadcrumbs={headerBreadcrumbs}
            actions={headerActions}
            showSearch={showSearch}
            onSearch={onSearch}
          />
        )}

        <main
          className={twMerge(
            clsx('flex-1 p-6 max-w-7xl mx-auto w-full', className)
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
};

// Content wrapper for consistent padding and spacing
interface ContentWrapperProps {
  children: ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

const maxWidthClasses = {
  sm: 'max-w-2xl',
  md: 'max-w-4xl',
  lg: 'max-w-5xl',
  xl: 'max-w-6xl',
  '2xl': 'max-w-7xl',
  full: 'max-w-full',
};

export const ContentWrapper = ({
  children,
  className,
  maxWidth = 'full',
}: ContentWrapperProps) => {
  return (
    <div
      className={twMerge(
        clsx('mx-auto', maxWidthClasses[maxWidth], className)
      )}
    >
      {children}
    </div>
  );
};

// Grid layout for dashboard pages
interface DashboardGridProps {
  children: ReactNode;
  className?: string;
  columns?: 1 | 2 | 3 | 4;
}

const gridColumns = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 lg:grid-cols-2',
  3: 'grid-cols-1 lg:grid-cols-3',
  4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
};

export const DashboardGrid = ({
  children,
  className,
  columns = 3,
}: DashboardGridProps) => {
  return (
    <div
      className={twMerge(
        clsx('grid gap-6', gridColumns[columns], className)
      )}
    >
      {children}
    </div>
  );
};

// Page container for consistent page structure
interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

export const PageContainer = ({ children, className }: PageContainerProps) => {
  return (
    <div className={twMerge(clsx('animate-fade-in', className))}>
      {children}
    </div>
  );
};
