import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { 
  Class, 
  Session, 
  CreateClassDto, 
  UpdateClassDto, 
  FacultyStats,
  FilterOptions,
  UploadProgress
} from '../types';
import { apiService } from '../services/api';

interface FacultyState {
  // Data
  classes: Class[];
  recentSessions: Session[];
  facultyStats: FacultyStats | null;
  uploadProgress: UploadProgress[];
  
  // UI State
  isLoading: boolean;
  isUploading: boolean;
  error: string | null;
  selectedClassId: string | null;
  filters: FilterOptions;
  
  // Actions - Classes
  fetchClasses: () => Promise<void>;
  createClass: (data: CreateClassDto) => Promise<Class>;
  updateClass: (id: string, data: UpdateClassDto) => Promise<Class>;
  deleteClass: (id: string) => Promise<void>;
  setSelectedClass: (id: string | null) => void;
  
  // Actions - Sessions
  fetchRecentSessions: () => Promise<void>;
  
  // Actions - Stats
  fetchFacultyStats: () => Promise<void>;
  
  // Actions - Filters
  setFilters: (filters: FilterOptions) => void;
  clearFilters: () => void;
  
  // Actions - Upload
  uploadFile: (file: File, classId?: string) => Promise<void>;
  clearUploadProgress: () => void;
  
  // Actions - Error
  setError: (error: string | null) => void;
  clearError: () => void;
}

const initialState = {
  classes: [],
  recentSessions: [],
  facultyStats: null,
  uploadProgress: [],
  isLoading: false,
  isUploading: false,
  error: null,
  selectedClassId: null,
  filters: {},
};

export const useFacultyStore = create<FacultyState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // Classes Actions
        fetchClasses: async () => {
          set({ isLoading: true, error: null });
          try {
            const response = await apiService.getClasses(get().filters);
            set({ classes: response.data, isLoading: false });
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to fetch classes',
              isLoading: false 
            });
          }
        },

        createClass: async (data: CreateClassDto) => {
          set({ isLoading: true, error: null });
          try {
            const response = await apiService.createClass(data);
            set((state) => ({
              classes: [...state.classes, response.data],
              isLoading: false,
            }));
            return response.data;
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to create class',
              isLoading: false 
            });
            throw error;
          }
        },

        updateClass: async (id: string, data: UpdateClassDto) => {
          set({ isLoading: true, error: null });
          try {
            const response = await apiService.updateClass(id, data);
            set((state) => ({
              classes: state.classes.map((cls) =>
                cls.id === id ? response.data : cls
              ),
              isLoading: false,
            }));
            return response.data;
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to update class',
              isLoading: false 
            });
            throw error;
          }
        },

        deleteClass: async (id: string) => {
          set({ isLoading: true, error: null });
          try {
            await apiService.deleteClass(id);
            set((state) => ({
              classes: state.classes.filter((cls) => cls.id !== id),
              isLoading: false,
            }));
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to delete class',
              isLoading: false 
            });
            throw error;
          }
        },

        setSelectedClass: (id: string | null) => {
          set({ selectedClassId: id });
        },

        // Sessions Actions
        fetchRecentSessions: async () => {
          set({ isLoading: true, error: null });
          try {
            const response = await apiService.getRecentSessions(10);
            set({ recentSessions: response.data, isLoading: false });
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to fetch sessions',
              isLoading: false 
            });
          }
        },

        // Stats Actions
        fetchFacultyStats: async () => {
          set({ isLoading: true, error: null });
          try {
            const response = await apiService.getFacultyStats();
            set({ facultyStats: response.data, isLoading: false });
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to fetch stats',
              isLoading: false 
            });
          }
        },

        // Filters Actions
        setFilters: (filters: FilterOptions) => {
          set({ filters });
          // Refetch classes with new filters
          get().fetchClasses();
        },

        clearFilters: () => {
          set({ filters: {} });
          get().fetchClasses();
        },

        // Upload Actions
        uploadFile: async (file: File, classId?: string) => {
          const uploadId = `${Date.now()}-${file.name}`;
          
          // Add initial upload progress
          set((state) => ({
            uploadProgress: [
              ...state.uploadProgress,
              {
                file,
                progress: 0,
                status: 'uploading',
              },
            ],
            isUploading: true,
          }));

          try {
            await apiService.uploadFile(
              file,
              classId,
              (progress) => {
                set((state) => ({
                  uploadProgress: state.uploadProgress.map((up) =>
                    up.file.name === file.name ? { ...up, progress } : up
                  ),
                }));
              }
            );

            // Update to completed
            set((state) => ({
              uploadProgress: state.uploadProgress.map((up) =>
                up.file.name === file.name
                  ? { ...up, progress: 100, status: 'completed' }
                  : up
              ),
              isUploading: false,
            }));

            // Remove completed upload after a delay
            setTimeout(() => {
              set((state) => ({
                uploadProgress: state.uploadProgress.filter(
                  (up) => up.file.name !== file.name
                ),
              }));
            }, 3000);
          } catch (error) {
            set((state) => ({
              uploadProgress: state.uploadProgress.map((up) =>
                up.file.name === file.name
                  ? {
                      ...up,
                      status: 'error',
                      error: error instanceof Error ? error.message : 'Upload failed',
                    }
                  : up
              ),
              isUploading: false,
            }));
            throw error;
          }
        },

        clearUploadProgress: () => {
          set({ uploadProgress: [], isUploading: false });
        },

        // Error Actions
        setError: (error: string | null) => {
          set({ error });
        },

        clearError: () => {
          set({ error: null });
        },
      }),
      {
        name: 'faculty-storage',
        partialize: (state) => ({
          filters: state.filters,
          selectedClassId: state.selectedClassId,
        }),
      }
    ),
    { name: 'FacultyStore' }
  )
);

// Selectors for optimized re-renders
export const selectClasses = (state: FacultyState) => state.classes;
export const selectRecentSessions = (state: FacultyState) => state.recentSessions;
export const selectFacultyStats = (state: FacultyState) => state.facultyStats;
export const selectIsLoading = (state: FacultyState) => state.isLoading;
export const selectError = (state: FacultyState) => state.error;
export const selectFilters = (state: FacultyState) => state.filters;
