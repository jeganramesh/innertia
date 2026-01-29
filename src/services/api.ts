import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { useAuthStore } from '@/features/auth/stores/auth';
import { useNotification } from '@/composables/useNotification';

// Create axios instance with base URL from environment variable
const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  timeout: 10000, // 10 seconds
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    const authStore = useAuthStore();
    const token = authStore.token;
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const notification = useNotification();
    const authStore = useAuthStore();
    
    if (!error.response) {
      // Network error
      notification.error('Network error. Please check your connection.');
      return Promise.reject(error);
    }
    
    const { status, data } = error.response;
    
    switch (status) {
      case 401:
        // Unauthorized - try to refresh token
        try {
          const refreshToken = localStorage.getItem('refresh_token');
          if (refreshToken) {
            const response = await axios.post(
              `${import.meta.env.VITE_API_BASE_URL}/auth/refresh/`,
              { refresh: refreshToken }
            );
            
            if (response.data.access) {
              authStore.setToken(response.data.access);
              localStorage.setItem('token', response.data.access);
              
              // Retry original request
              if (error.config) {
                error.config.headers.Authorization = `Bearer ${response.data.access}`;
                return axios.request(error.config);
              }
            }
          } else {
            authStore.logout();
            window.location.href = '/login';
          }
        } catch (refreshError) {
          authStore.logout();
          window.location.href = '/login';
        }
        break;
        
      case 403:
        notification.error('You do not have permission to perform this action.');
        break;
        
      case 404:
        notification.error('Resource not found.');
        break;
        
      case 422:
        // Validation errors from backend
        if (data.errors) {
          Object.values(data.errors).forEach((errorArray: any) => {
            errorArray.forEach((message: string) => {
              notification.error(message);
            });
          });
        } else {
          notification.error('Validation failed. Please check your input.');
        }
        break;
        
      case 500:
        notification.error('Server error. Please try again later.');
        break;
        
      default:
        notification.error(`Error: ${status} - ${data.message || 'Something went wrong'}`);
    }
    
    return Promise.reject(error);
  }
);

// Export commonly used methods
export const api = {
  get: <T>(url: string, config?: AxiosRequestConfig) => 
    apiClient.get<T>(url, config).then(response => response.data),
  
  post: <T>(url: string, data?: any, config?: AxiosRequestConfig) => 
    apiClient.post<T>(url, data, config).then(response => response.data),
  
  put: <T>(url: string, data?: any, config?: AxiosRequestConfig) => 
    apiClient.put<T>(url, data, config).then(response => response.data),
  
  patch: <T>(url: string, data?: any, config?: AxiosRequestConfig) => 
    apiClient.patch<T>(url, data, config).then(response => response.data),
  
  delete: <T>(url: string, config?: AxiosRequestConfig) => 
    apiClient.delete<T>(url, config).then(response => response.data),
};

export default apiClient;