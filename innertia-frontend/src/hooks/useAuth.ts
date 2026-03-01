/**
 * useAuth Hook
 * Manages authentication state and provides login/logout functionality
 * Uses the centralized authService
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import authService, { User, LoginInput, AuthResponse } from '../services/authService';

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
  
  // Check if user's college is inactive and handle it
  const checkCollegeActive = useCallback((user: User) => {
    // Platform admin (role=admin) doesn't have a college
    if (user.role === 'admin') {
      return true;
    }
    
    // If user has no college, allow access
    if (!user.college_id) {
      return true;
    }
    
    // Check if college is active
    if (user.college_is_active === false) {
      return false;
    }
    
    return true;
  }, []);

  // Initialize auth state from storage
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (authService.isAuthenticated()) {
          // Try to get user from storage first
          const storedUser = authService.getStoredUser();
          if (storedUser) {
            // Check if college is inactive
            if (!checkCollegeActive(storedUser)) {
              // Clear auth state and redirect to login with message
              await authService.logout();
              navigate('/login', { 
                replace: true,
                state: { 
                  from: location,
                  message: 'Your college is inactive. Contact platform admin.' 
                } 
              });
              return;
            }
            setUser(storedUser);
          } else {
            // Fetch user from API
            const currentUser = await authService.getCurrentUser();
            // Check if college is inactive
            if (!checkCollegeActive(currentUser)) {
              await authService.logout();
              navigate('/login', { 
                replace: true,
                state: { 
                  from: location,
                  message: 'Your college is inactive. Contact platform admin.' 
                } 
              });
              return;
            }
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
  }, [navigate, location, checkCollegeActive]);
  
  // Login
  const login = useCallback(async (credentials: LoginInput) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response: AuthResponse = await authService.login(credentials);
      console.log('Login response:', response);
      
      // Check if user's college is inactive
      if (response.user.role !== 'admin' && 
          response.user.college_id && 
          response.user.college_is_active === false) {
        // Clear tokens but don't set user - redirect to login with message
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('token_type');
        const message = 'Your college is inactive. Contact platform admin.';
        setError(message);
        throw new Error(message);
      }
      
      setUser(response.user);
      authService.storeUser(response.user);
      
      // Redirect to role-based dashboard
      const redirectTo = authService.getRoleBasedRoute(response.user.role);
      console.log('Redirecting to:', redirectTo);
      const from = location.state?.from?.pathname || redirectTo;
      navigate(from, { replace: true });
    } catch (err: any) {
      console.error('Login catch error:', err);
      // Try to get message from the error thrown by authService, or from response
      const message = err.message || err.response?.data?.detail || 'Login failed. Please try again.';
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  }, [navigate, location, checkCollegeActive]);
  
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

export default useAuth;
