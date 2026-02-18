import { ReactNode, useState } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { FacultySidebar } from './FacultySidebar';
import { StudentSidebar } from './StudentSidebar';
import { Header } from './Header';

interface RoleLayoutProps {
  children: ReactNode;
  role: 'admin' | 'faculty' | 'student';
}

export const RoleBasedLayout = ({ children, role }: RoleLayoutProps) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

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
    <div className="flex min-h-screen bg-slate-50">
      {getSidebar()}
      
      <div className="flex-1 flex flex-col w-full">
        <Header />
        
        <main className="flex-1 p-6">
          {children}
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
