import { computed } from 'vue';
import { useAuthStore } from '@/features/auth/stores/auth';

export const useAuth = () => {
  const authStore = useAuthStore();
  
  const user = computed(() => authStore.user);
  const isAuthenticated = computed(() => authStore.isAuthenticated);
  const isLoading = computed(() => authStore.isLoading);
  
  const login = async (email: string, password: string) => {
    return await authStore.login(email, password);
  };
  
  const logout = () => {
    authStore.logout();
  };
  
  const register = async (userData: any) => {
    return await authStore.register(userData);
  };
  
  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    register,
  };
};