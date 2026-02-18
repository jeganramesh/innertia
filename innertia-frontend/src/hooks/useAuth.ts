/**
 * useAuth Hook
 * Manages authentication state and provides login/logout functionality
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import authService, { User, LoginInput, AuthResponse } from '../services/auth';

interface UseAuthReturn {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginInput) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const location = useLocation();
  
  // Initialize auth state from storage
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (authService.isAuthenticated()) {
          // Try to get user from storage first
          const storedUser = authService.getStoredUser();
          if (storedUser) {
            setUser(storedUser);
          } else {
            // Fetch user from API
            const currentUser = await authService.getCurrentUser();
            setUser(currentUser);
            authService.storeUser(currentUser);
          }
        }
      } catch (err) {
        // Clear invalid auth state
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('token_type');
        localStorage.removeItem('user');
      } finally {
        setIsLoading(false);
      }
    };
    
    initAuth();
  }, []);
  
  // Login
  const login = useCallback(async (credentials: LoginInput) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await authService.login(credentials);
      console.log('Login response:', response);
      setUser(response.user);
      authService.storeUser(response.user);
      
      // Redirect to role-based dashboard
      const redirectTo = getRoleBasedRoute(response.user.role);
      console.log('Redirecting to:', redirectTo);
      const from = location.state?.from?.pathname || redirectTo;
      navigate(from, { replace: true });
    } catch (err: any) {
      console.error('Login catch error:', err);
      const message = err.response?.data?.detail || 'Login failed. Please try again.';
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  }, [navigate, location]);
  
  // Logout
  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await authService.logout();
      setUser(null);
      navigate('/login', { replace: true });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);
  
  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    logout,
    clearError,
  };
};

// Helper function to get role-based redirect route
const getRoleBasedRoute = (role: string): string => {
  switch (role) {
    case 'admin':
      return '/admin';
    case 'faculty':
      return '/faculty';
    case 'student':
    default:
      return '/student';
  }
};

export default useAuth;
