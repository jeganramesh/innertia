import { ReactNode, useState, useEffect } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { FacultySidebar } from './FacultySidebar';
import { StudentSidebar } from './StudentSidebar';
import { Header } from './Header';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useAuth } from '../../hooks/useAuth';

interface RoleLayoutProps {
  children: ReactNode;
  role: 'admin' | 'faculty' | 'student';
}

const getStorageKey = (role: string) => `${role}-sidebar-collapsed`;

export const RoleBasedLayout = ({ children, role }: RoleLayoutProps) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(getStorageKey(role));
      return saved ? JSON.parse(saved) : false;
    }
    return false;
  });

  useEffect(() => {
    localStorage.setItem(getStorageKey(role), JSON.stringify(isSidebarCollapsed));
  }, [isSidebarCollapsed, role]);

  const getSidebar = () => {
    switch (role) {
      case 'admin':
        return <AdminSidebar onCollapseChange={setIsSidebarCollapsed} />;
      case 'faculty':
        return <FacultySidebar onCollapseChange={setIsSidebarCollapsed} />;
      case 'student':
        return <StudentSidebar onCollapseChange={setIsSidebarCollapsed} />;
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#1d1d1f]">
      <div className="flex">
        {/* Fixed Sidebar */}
        <div className="fixed left-0 top-0 h-screen z-50">
          {getSidebar()}
        </div>
        
        {/* Main Content with offset */}
        <main 
          className={twMerge(
            clsx(
              'w-full min-h-screen bg-[#f5f5f7] transition-all duration-300 ease-out',
              isSidebarCollapsed ? 'ml-[72px]' : 'ml-[272px]'
            )
          )}
        >
          {/* Header - Full width with centered content */}
          <Header />
          
          {/* Page Content - Centered */}
          <div className="mx-auto max-w-6xl px-8 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

// Admin Layout
export const AdminLayout = ({ children }: { children: ReactNode }) => (
  <RoleBasedLayout role="admin">{children}</RoleBasedLayout>
);

// Faculty Layout
export const FacultyLayout = ({ children }: { children: ReactNode }) => (
  <RoleBasedLayout role="faculty">{children}</RoleBasedLayout>
);

// Student Layout
export const StudentLayout = ({ children }: { children: ReactNode }) => (
  <RoleBasedLayout role="student">{children}</RoleBasedLayout>
);
