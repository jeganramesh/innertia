import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProviderWithManager } from './components/ui/Toast';
import { ClassesPage } from './pages/ClassesPage';
import { UploadPage } from './pages/UploadPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';
import { LoginPage } from './pages/Login';
import { useAuth } from './hooks/useAuth';

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <ToastProviderWithManager>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<Navigate to="/classes" replace />} />
          <Route path="/classes" element={
            <ProtectedRoute>
              <ClassesPage />
            </ProtectedRoute>
          } />
          <Route path="/upload" element={
            <ProtectedRoute>
              <UploadPage />
            </ProtectedRoute>
          } />
          <Route path="/analytics" element={
            <ProtectedRoute>
              <AnalyticsPage />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/classes" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProviderWithManager>
  );
}

export default App;
