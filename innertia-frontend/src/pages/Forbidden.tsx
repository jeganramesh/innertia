/**
 * Forbidden Page (403)
 * Displayed when user doesn't have permission to access a resource
 */

import { useNavigate } from 'react-router-dom';
import { ShieldX, Home, LogOut } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const ForbiddenPage = () => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    // Get user role from localStorage and redirect to appropriate dashboard
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        switch (user.role) {
          case 'admin':
            navigate('/admin/dashboard');
            return;
          case 'faculty':
            navigate('/faculty/dashboard');
            return;
          case 'student':
            navigate('/student/dashboard');
            return;
        }
      } catch {
        // Invalid user data
      }
    }
    navigate('/login');
  };

  const handleLogout = async () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('token_type');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-red-100 mb-6">
            <ShieldX className="w-12 h-12 text-red-600" />
          </div>
          <h1 className="text-6xl font-bold text-slate-900 mb-2">403</h1>
          <h2 className="text-xl font-semibold text-slate-700 mb-2">Access Forbidden</h2>
          <p className="text-slate-500">
            You don't have permission to access this page. Please contact your administrator if you believe this is an error.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={handleGoHome}
            className="inline-flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            Go to Dashboard
          </Button>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="inline-flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>

        {/* Help Text */}
        <div className="mt-8 p-4 bg-slate-100 rounded-lg">
          <p className="text-sm text-slate-600">
            <strong>Need help?</strong> Contact your system administrator or check your user role permissions.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForbiddenPage;
