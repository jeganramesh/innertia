/**
 * Application Router
 * Handles role-based routing for the multi-tenant SaaS platform.
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  UserRole, 
  getRoleRoutePrefix, 
  getRoleDashboard,
  ROLE_CONFIG 
} from './roleConfig';

// Helper function to map role to dashboard route
const getRoleBasedRoute = (role: string): string => {
  return getRoleDashboard(role);
};

// Layouts
import { AdminLayout, FacultyLayout, StudentLayout } from '../components/layout/RoleBasedLayout';
import { MainLayout } from '../components/layout/MainLayout';

// Public Pages
import { LoginPage } from '../pages/Login';
import { ForbiddenPage } from '../pages/Forbidden';

// Platform Admin Pages
import { 
  AdminDashboard, 
  UsersPage, 
  AdminClassesPage, 
  AdminSessionsPage, 
  AdminAnalyticsPage, 
  AdminSettingsPage,
  AuditLogsPage,
  UserBulkUpload,
  CollegesPage,
  CollegeDetailPage
} from '../pages/admin';

// College Admin Pages
import { CollegeAdminDashboard } from '../pages/college_admin/CollegeAdminDashboard';
import { CollegeUsersPage } from '../pages/college_admin/CollegeUsersPage';
import { CollegeClassesPage } from '../pages/college_admin/CollegeClassesPage';
import { CollegeSessionsPage } from '../pages/college_admin/CollegeSessionsPage';
import { CollegeReportsPage } from '../pages/college_admin/CollegeReportsPage';
import { CollegeSettingsPage } from '../pages/college_admin/CollegeSettingsPage';
import { RoleFeaturesPage } from '../pages/college_admin/RoleFeaturesPage';
import { CollegeAuditLogsPage } from '../pages/college_admin/CollegeAuditLogsPage';
import { CollegeUserBulkUpload } from '../pages/college_admin/CollegeUserBulkUpload';

// Staff Pages
import { StaffDashboard } from '../pages/staff/StaffDashboard';

// Faculty Pages
import { 
  FacultyDashboard, 
  FacultyClassesPage, 
  FacultySessionPage,
  StudentBulkUpload as FacultyStudentBulkUpload,
  AINotesPage
} from '../pages/faculty';

// Trainer Pages
import { TrainerDashboard } from '../pages/trainer/TrainerDashboard';

// Student Pages
import { 
  StudentDashboard, 
  StudentSessionPage, 
  StudentNotesPage 
} from '../pages/student';

// Loading Component
const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-500">Loading...</p>
    </div>
  </div>
);

// Protected Route Component
interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <LoadingScreen />;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // If allowedRoles is specified, check user's role
  if (allowedRoles && user) {
    if (!allowedRoles.includes(user.role as UserRole)) {
      // Redirect to their proper dashboard based on role
      return <Navigate to={getRoleDashboard(user.role)} replace />;
    }
  }
  
  return <>{children}</>;
};

// Platform Admin Routes
const PlatformAdminRoutes = () => (
  <AdminLayout>
    <Routes>
      <Route index element={<Navigate to="/platform-admin/dashboard" replace />} />
      <Route path="dashboard" element={<AdminDashboard />} />
      <Route path="users" element={<UsersPage />} />
      <Route path="users/bulk-upload" element={<UserBulkUpload />} />
      <Route path="upload" element={<UserBulkUpload />} />
      <Route path="classes" element={<AdminClassesPage />} />
      <Route path="sessions" element={<AdminSessionsPage />} />
      <Route path="analytics" element={<AdminAnalyticsPage />} />
      <Route path="settings" element={<AdminSettingsPage />} />
      <Route path="audit-logs" element={<AuditLogsPage />} />
      <Route path="colleges" element={<CollegesPage />} />
      <Route path="colleges/:collegeId" element={<CollegeDetailPage />} />
    </Routes>
  </AdminLayout>
);

// College Admin Routes
const CollegeAdminRoutes = () => (
  <AdminLayout>
    <Routes>
      <Route index element={<Navigate to="/college-admin/dashboard" replace />} />
      <Route path="dashboard" element={<CollegeAdminDashboard />} />
      <Route path="users" element={<CollegeUsersPage />} />
      <Route path="classes" element={<CollegeClassesPage />} />
      <Route path="sessions" element={<CollegeSessionsPage />} />
      <Route path="reports" element={<CollegeReportsPage />} />
      <Route path="settings" element={<CollegeSettingsPage />} />
      <Route path="role-features" element={<RoleFeaturesPage />} />
      <Route path="audit-logs" element={<CollegeAuditLogsPage />} />
      <Route path="users/bulk-upload" element={<CollegeUserBulkUpload />} />
    </Routes>
  </AdminLayout>
);

// Staff Routes
const StaffRoutes = () => (
  <MainLayout>
    <Routes>
      <Route index element={<Navigate to="/staff/dashboard" replace />} />
      <Route path="dashboard" element={<StaffDashboard />} />
      <Route path="classes" element={<CollegeClassesPage />} />
    </Routes>
  </MainLayout>
);

// Faculty Routes
const FacultyRoutes = () => (
  <FacultyLayout>
    <Routes>
      <Route index element={<Navigate to="/faculty/dashboard" replace />} />
      <Route path="dashboard" element={<FacultyDashboard />} />
      <Route path="classes" element={<FacultyClassesPage />} />
      <Route path="session" element={<FacultySessionPage />} />
      <Route path="upload" element={<FacultyStudentBulkUpload />} />
      <Route path="ai-notes" element={<AINotesPage />} />
    </Routes>
  </FacultyLayout>
);

// Trainer Routes
const TrainerRoutes = () => (
  <MainLayout>
    <Routes>
      <Route index element={<Navigate to="/trainer/dashboard" replace />} />
      <Route path="dashboard" element={<TrainerDashboard />} />
    </Routes>
  </MainLayout>
);

// Student Routes
const StudentRoutes = () => (
  <StudentLayout>
    <Routes>
      <Route index element={<Navigate to="/student/dashboard" replace />} />
      <Route path="dashboard" element={<StudentDashboard />} />
      <Route path="session" element={<StudentSessionPage />} />
      <Route path="notes" element={<StudentNotesPage />} />
    </Routes>
  </StudentLayout>
);

// Route mapping based on role
const getRoleRoutes = (role: string) => {
  switch (role) {
    case 'admin':
      return <PlatformAdminRoutes />;
    case 'college_admin':
      return <CollegeAdminRoutes />;
    case 'staff':
      return <StaffRoutes />;
    case 'faculty':
      return <FacultyRoutes />;
    case 'trainer':
      return <TrainerRoutes />;
    case 'student':
      return <StudentRoutes />;
    default:
      return <Navigate to="/login" replace />;
  }
};

// Main Router Component
export const AppRouter = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forbidden" element={<ForbiddenPage />} />
      
      {/* Admin Routes */}
      <Route 
        path="/admin/*" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <PlatformAdminRoutes />
          </ProtectedRoute>
        } 
      />
      
      {/* College Admin Routes */}
      <Route 
        path="/college-admin/*" 
        element={
          <ProtectedRoute allowedRoles={['college_admin']}>
            <CollegeAdminRoutes />
          </ProtectedRoute>
        } 
      />
      
      {/* Staff Routes */}
      <Route 
        path="/staff/*" 
        element={
          <ProtectedRoute allowedRoles={['staff']}>
            <StaffRoutes />
          </ProtectedRoute>
        } 
      />
      
      {/* Faculty Routes */}
      <Route 
        path="/faculty/*" 
        element={
          <ProtectedRoute allowedRoles={['faculty']}>
            <FacultyRoutes />
          </ProtectedRoute>
        } 
      />
      
      {/* Trainer Routes */}
      <Route 
        path="/trainer/*" 
        element={
          <ProtectedRoute allowedRoles={['trainer']}>
            <TrainerRoutes />
          </ProtectedRoute>
        } 
      />
      
      {/* Student Routes */}
      <Route 
        path="/student/*" 
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentRoutes />
          </ProtectedRoute>
        } 
      />
      
      {/* Legacy route redirect - to be removed after migration */}
      <Route 
        path="/platform-admin/*" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <PlatformAdminRoutes />
          </ProtectedRoute>
        } 
      />
      
      {/* Redirect root to login if not authenticated */}
      <Route 
        path="/" 
        element={
          isAuthenticated && user 
            ? <Navigate to={getRoleDashboard(getRoleBasedRoute(user.role))} replace />
            : <Navigate to="/login" replace />
        } 
      />
      
      {/* Catch all - redirect to login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AppRouter;
