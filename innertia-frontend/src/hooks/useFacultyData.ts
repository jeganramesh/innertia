import { useEffect } from 'react';
import { useFacultyStore } from '../stores/facultyStore';

/**
 * Custom hook to fetch and manage faculty data
 * Automatically fetches classes and sessions on mount
 */
export const useFacultyData = () => {
  const {
    classes,
    recentSessions,
    facultyStats,
    isLoading,
    error,
    fetchClasses,
    fetchRecentSessions,
    fetchFacultyStats,
  } = useFacultyStore();

  useEffect(() => {
    // Fetch initial data
    fetchClasses();
    fetchRecentSessions();
    fetchFacultyStats();
  }, [fetchClasses, fetchRecentSessions, fetchFacultyStats]);

  return {
    classes,
    recentSessions,
    facultyStats,
    isLoading,
    error,
    refetch: () => {
      fetchClasses();
      fetchRecentSessions();
      fetchFacultyStats();
    },
  };
};

/**
 * Custom hook to manage class operations
 */
export const useClassOperations = () => {
  const {
    createClass,
    updateClass,
    deleteClass,
    isLoading,
    error,
  } = useFacultyStore();

  const handleCreateClass = async (data: any) => {
    try {
      await createClass(data);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create class' 
      };
    }
  };

  const handleUpdateClass = async (id: string, data: any) => {
    try {
      await updateClass(id, data);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update class' 
      };
    }
  };

  const handleDeleteClass = async (id: string) => {
    try {
      await deleteClass(id);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete class' 
      };
    }
  };

  return {
    createClass: handleCreateClass,
    updateClass: handleUpdateClass,
    deleteClass: handleDeleteClass,
    isLoading,
    error,
  };
};

/**
 * Custom hook to manage file uploads
 */
export const useFileUpload = () => {
  const { uploadFile, uploadProgress, isUploading } = useFacultyStore();

  const handleUpload = async (file: File, classId?: string) => {
    try {
      await uploadFile(file, classId);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to upload file' 
      };
    }
  };

  return {
    uploadFile: handleUpload,
    uploadProgress,
    isUploading,
  };
};

/**
 * Custom hook to debounce a value
 */
export const useDebounce = <T>(value: T, delay: number = 300): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Custom hook to manage local storage
 */
export const useLocalStorage = <T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
};

/**
 * Custom hook to detect window size
 */
export const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
};

/**
 * Custom hook to detect online status
 */
export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};

/**
 * Custom hook to copy text to clipboard
 */
export const useClipboard = () => {
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(text);
      setTimeout(() => setCopiedText(null), 2000);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to copy' 
      };
    }
  };

  return { copiedText, copy };
};

// Import useState from React
import { useState } from 'react';
