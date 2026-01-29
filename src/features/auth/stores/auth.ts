import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { authService, type LoginCredentials, type RegisterData } from '@/features/auth/services/authService';
import { useNotification } from '@/composables/useNotification';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<any>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const token = ref<string | null>(localStorage.getItem('token'));
  
  const notification = useNotification();
  
  const isAuthenticated = computed(() => {
    return !!token.value && !!user.value;
  });
  
  const setUser = (userData: any) => {
    user.value = userData;
  };
  
  const setToken = (newToken: string) => {
    token.value = newToken;
    localStorage.setItem('token', newToken);
  };
  
  const login = async (email: string, password: string) => {
    isLoading.value = true;
    error.value = null;
    
    try {
      const credentials: LoginCredentials = { email, password };
      const response = await authService.login(credentials);
      
      setUser(response.user);
      setToken(response.access_token);
      localStorage.setItem('refresh_token', response.refresh_token);
      
      notification.success('Login successful!');
      return { success: true };
    } catch (err: any) {
      error.value = err.message || 'Invalid credentials';
      notification.error(error.value);
      return { success: false, error: error.value };
    } finally {
      isLoading.value = false;
    }
  };
  
  const logout = async () => {
    try {
      await authService.logout();
      user.value = null;
      token.value = null;
      localStorage.removeItem('token');
      localStorage.removeItem('refresh_token');
      notification.info('Logged out successfully');
    } catch (err: any) {
      notification.error('Logout failed: ' + err.message);
    }
  };
  
  const register = async (userData: RegisterData) => {
    isLoading.value = true;
    error.value = null;
    
    try {
      const response = await authService.register(userData);
      
      setUser(response.user);
      setToken(response.access_token);
      localStorage.setItem('refresh_token', response.refresh_token);
      
      notification.success('Registration successful!');
      return { success: true };
    } catch (err: any) {
      error.value = err.message || 'Registration failed';
      notification.error(error.value);
      return { success: false, error: error.value };
    } finally {
      isLoading.value = false;
    }
  };
  
  const fetchProfile = async () => {
    isLoading.value = true;
    
    try {
      const profile = await authService.getProfile();
      user.value = { ...user.value, ...profile };
      return profile;
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch profile';
      notification.error(error.value);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };
  
  const refreshToken = async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) throw new Error('No refresh token');
      
      const response = await authService.refreshToken(refreshToken);
      setToken(response.access_token);
      return true;
    } catch (err) {
      logout();
      return false;
    }
  };
  
  // Initialize user from localStorage or fetch profile
  const init = async () => {
    if (token.value && !user.value) {
      try {
        await fetchProfile();
      } catch (err) {
        // Token might be expired, try to refresh
        const refreshed = await refreshToken();
        if (refreshed) {
          await fetchProfile();
        }
      }
    }
  };
  
  return {
    user,
    isLoading,
    error,
    token,
    isAuthenticated,
    setUser,
    setToken,
    login,
    logout,
    register,
    fetchProfile,
    refreshToken,
    init,
  };
});