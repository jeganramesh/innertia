import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProviderWithManager } from './components/ui/Toast';
import { LoginPage } from './pages/Login';
import { useAuth } from './hooks/useAuth';
import { AdminLayout, FacultyLayout, StudentLayout } from './components/layout/RoleBasedLayout';

// Admin Pages
import { 
  AdminDashboard, 
  UsersPage, 
  AdminClassesPage, 
  AdminSessionsPage, 
  AdminAnalyticsPage, 
  AdminSettingsPage 
} from './pages/admin';

// Faculty Pages
import { 
  FacultyDashboard, 
  FacultyClassesPage, 
  FacultySessionPage 
} from './pages/faculty';

// Student Pages
import { 
  StudentDashboard, 
  StudentSessionPage, 
  StudentNotesPage 
} from './pages/student';

// Protected Route Component with Role Guard
interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('admin' | 'faculty' | 'student')[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // If allowedRoles is specified, check user's role
  if (allowedRoles && user) {
    const userRole = user.role as 'admin' | 'faculty' | 'student';
    if (!allowedRoles.includes(userRole)) {
      // Redirect to their proper dashboard based on role
      switch (userRole) {
        case 'admin':
          return <Navigate to="/admin" replace />;
        case 'faculty':
          return <Navigate to="/faculty" replace />;
        case 'student':
          return <Navigate to="/student" replace />;
        default:
          return <Navigate to="/login" replace />;
      }
    }
  }
  
  return <>{children}</>;
};

// Admin Routes Wrapper
const AdminRoutes = () => {
  const { user } = useAuth();
  
  return (
    <AdminLayout>
      <Routes>
        <Route index element={<Navigate to="/admin" replace />} />
        <Route path="/" element={<AdminDashboard />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="classes" element={<AdminClassesPage />} />
        <Route path="sessions" element={<AdminSessionsPage />} />
        <Route path="analytics" element={<AdminAnalyticsPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
      </Routes>
    </AdminLayout>
  );
};

// Faculty Routes Wrapper
const FacultyRoutes = () => {
  return (
    <FacultyLayout>
      <Routes>
        <Route index element={<Navigate to="/faculty" replace />} />
        <Route path="/" element={<FacultyDashboard />} />
        <Route path="classes" element={<FacultyClassesPage />} />
        <Route path="session" element={<FacultySessionPage />} />
      </Routes>
    </FacultyLayout>
  );
};

// Student Routes Wrapper
const StudentRoutes = () => {
  return (
    <StudentLayout>
      <Routes>
        <Route index element={<Navigate to="/student" replace />} />
        <Route path="/" element={<StudentDashboard />} />
        <Route path="session" element={<StudentSessionPage />} />
        <Route path="notes" element={<StudentNotesPage />} />
      </Routes>
    </StudentLayout>
  );
};

function App() {
  return (
    <ToastProviderWithManager>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          
          {/* Admin Routes - Full System Control */}
          <Route 
            path="/admin/*" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminRoutes />
              </ProtectedRoute>
            } 
          />
          
          {/* Faculty Routes - Classroom Control */}
          <Route 
            path="/faculty/*" 
            element={
              <ProtectedRoute allowedRoles={['faculty']}>
                <FacultyRoutes />
              </ProtectedRoute>
            } 
          />
          
          {/* Student Routes - Controlled Participation */}
          <Route 
            path="/student/*" 
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentRoutes />
              </ProtectedRoute>
            } 
          />
          
          {/* Legacy route redirect */}
          <Route 
            path="/dashboard" 
            element={<Navigate to="/admin" replace />} 
          />
          
          {/* Redirect root to login if not authenticated, otherwise to role-based dashboard */}
          <Route 
            path="/" 
            element={<Navigate to="/login" replace />} 
          />
          
          {/* Catch all - redirect to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProviderWithManager>
  );
}

export default App;
