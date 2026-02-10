import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { UploadProgress, UploadedFile, AIFeatures, UploadStatus } from '../types';
import { apiService } from '../services/api';
import { generateId } from '../utils/formatters';

interface UploadState {
  // Upload queue and progress
  uploadQueue: UploadProgress[];
  uploadedFiles: UploadedFile[];
  activeUploads: Map<string, { progress: number; status: UploadStatus }>;
  
  // UI State
  isUploading: boolean;
  isProcessing: boolean;
  error: string | null;
  selectedFiles: string[];
  
  // Actions - Queue Management
  addToQueue: (files: File[], classId?: string) => void;
  removeFromQueue: (fileId: string) => void;
  clearQueue: () => void;
  
  // Actions - Upload
  uploadFile: (file: File, classId?: string) => Promise<void>;
  retryUpload: (fileId: string) => Promise<void>;
  cancelUpload: (fileId: string) => void;
  pauseUpload: (fileId: string) => void;
  resumeUpload: (fileId: string) => void;
  
  // Actions - Progress
  updateProgress: (fileId: string, progress: number, status?: UploadStatus) => void;
  setProcessingStatus: (fileId: string, status: UploadStatus, details?: any) => void;
  
  // Actions - Files
  fetchUploadedFiles: (classId?: string) => Promise<void>;
  deleteFile: (fileId: string) => Promise<void>;
  
  // Actions - AI Features
  updateAIFeatures: (fileId: string, features: Partial<AIFeatures>) => void;
  
  // Actions - Selection
  toggleFileSelection: (fileId: string) => void;
  selectAllFiles: () => void;
  clearSelection: () => void;
  
  // Actions - Error
  setError: (error: string | null) => void;
  clearError: () => void;
}

const initialState = {
  uploadQueue: [],
  uploadedFiles: [],
  activeUploads: new Map<string, { progress: number; status: UploadStatus }>(),
  isUploading: false,
  isProcessing: false,
  error: null,
  selectedFiles: [],
};

export const useUploadStore = create<UploadState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // Queue Management
        addToQueue: (files: File[], classId?: string) => {
          const newUploads = files.map((file) => ({
            id: generateId(),
            file,
            progress: 0,
            status: 'queued' as UploadStatus,
          }));

          set((state) => ({
            uploadQueue: [...state.uploadQueue, ...newUploads],
          }));

          // Start uploading files
          newUploads.forEach((upload) => {
            get().uploadFile(upload.file, classId);
          });
        },

        removeFromQueue: (fileId: string) => {
          set((state) => ({
            uploadQueue: state.uploadQueue.filter((u) => u.id !== fileId),
          }));
        },

        clearQueue: () => {
          set({ uploadQueue: [], isUploading: false });
        },

        // Upload Actions
        uploadFile: async (file: File, classId?: string) => {
          const fileId = generateId();
          
          // Add to queue with uploading status
          set((state) => ({
            uploadQueue: [
              ...state.uploadQueue,
              {
                id: fileId,
                file,
                progress: 0,
                status: 'uploading' as UploadStatus,
              },
            ],
            isUploading: true,
          }));

          try {
            await apiService.uploadFile(
              file,
              classId,
              (progress) => {
                get().updateProgress(fileId, progress, 'uploading');
              }
            );

            // Update to processing status
            get().updateProgress(fileId, 100, 'processing');
            get().setProcessingStatus(fileId, 'processing', {
              currentStep: 'Initializing AI processing...',
            });

            // Simulate AI processing steps
            const processingSteps = [
              { step: 'Extracting text...', progress: 20 },
              { step: 'Generating embeddings...', progress: 40 },
              { step: 'Creating summary...', progress: 60 },
              { step: 'Generating questions...', progress: 80 },
              { step: 'Extracting keywords...', progress: 90 },
            ];

            for (const { step, progress } of processingSteps) {
              await new Promise((resolve) => setTimeout(resolve, 500));
              get().setProcessingStatus(fileId, 'processing', {
                currentStep: step,
                slidesProcessed: Math.floor(Math.random() * 30) + 1,
                totalSlides: 30,
                estimatedTimeRemaining: Math.floor(Math.random() * 30) + 10,
              });
            }

            // Mark as completed
            get().updateProgress(fileId, 100, 'completed');

            // Add to uploaded files
            const uploadedFile: UploadedFile = {
              id: fileId,
              name: file.name,
              type: file.name.split('.').pop() as any || 'pdf',
              size: file.size,
              url: '#',
              uploadedAt: new Date(),
              classId,
              status: 'completed',
              progress: 100,
              aiFeatures: {
                textExtracted: true,
                embeddingsGenerated: true,
                questionsGenerated: true,
                summaryGenerated: true,
                keywordsExtracted: true,
              },
              processingDetails: {
                slidesProcessed: 30,
                totalSlides: 30,
                currentStep: 'Complete',
              },
            };

            set((state) => ({
              uploadedFiles: [uploadedFile, ...state.uploadedFiles],
              uploadQueue: state.uploadQueue.filter((u) => u.id !== fileId),
              isUploading: state.uploadQueue.length > 0,
            }));
          } catch (error) {
            get().updateProgress(fileId, 0, 'error');
            set((state) => ({
              error: error instanceof Error ? error.message : 'Upload failed',
              isUploading: state.uploadQueue.length > 0,
            }));
          }
        },

        retryUpload: async (fileId: string) => {
          const upload = get().uploadQueue.find((u) => u.id === fileId);
          if (upload) {
            await get().uploadFile(upload.file);
          }
        },

        cancelUpload: (fileId: string) => {
          set((state) => ({
            uploadQueue: state.uploadQueue.filter((u) => u.id !== fileId),
            activeUploads: new Map(state.activeUploads),
          }));
        },

        pauseUpload: (fileId: string) => {
          set((state) => {
            const newActiveUploads = new Map(state.activeUploads);
            const current = newActiveUploads.get(fileId);
            if (current) {
              newActiveUploads.set(fileId, { ...current, status: 'queued' });
            }
            return { activeUploads: newActiveUploads };
          });
        },

        resumeUpload: (fileId: string) => {
          set((state) => {
            const newActiveUploads = new Map(state.activeUploads);
            const current = newActiveUploads.get(fileId);
            if (current) {
              newActiveUploads.set(fileId, { ...current, status: 'uploading' });
            }
            return { activeUploads: newActiveUploads };
          });
        },

        // Progress Actions
        updateProgress: (fileId: string, progress: number, status?: UploadStatus) => {
          set((state) => {
            const newActiveUploads = new Map(state.activeUploads);
            newActiveUploads.set(fileId, {
              progress,
              status: status || state.activeUploads.get(fileId)?.status || 'uploading',
            });
            return { activeUploads: newActiveUploads };
          });
        },

        setProcessingStatus: (fileId: string, status: UploadStatus, details?: any) => {
          set((state) => ({
            isProcessing: status === 'processing',
          }));
        },

        // Files Actions
        fetchUploadedFiles: async (classId?: string) => {
          try {
            const response = await apiService.getFilesByClass(classId || '');
            set({ uploadedFiles: response.data });
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Failed to fetch files',
            });
          }
        },

        deleteFile: async (fileId: string) => {
          try {
            await apiService.deleteFile(fileId);
            set((state) => ({
              uploadedFiles: state.uploadedFiles.filter((f) => f.id !== fileId),
            }));
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Failed to delete file',
            });
          }
        },

        // AI Features Actions
        updateAIFeatures: (fileId: string, features: Partial<AIFeatures>) => {
          set((state) => ({
            uploadedFiles: state.uploadedFiles.map((f) =>
              f.id === fileId
                ? {
                    ...f,
                    aiFeatures: { ...f.aiFeatures, ...features },
                  }
                : f
            ),
          }));
        },

        // Selection Actions
        toggleFileSelection: (fileId: string) => {
          set((state) => ({
            selectedFiles: state.selectedFiles.includes(fileId)
              ? state.selectedFiles.filter((id) => id !== fileId)
              : [...state.selectedFiles, fileId],
          }));
        },

        selectAllFiles: () => {
          set((state) => ({
            selectedFiles: state.uploadedFiles.map((f) => f.id),
          }));
        },

        clearSelection: () => {
          set({ selectedFiles: [] });
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
        name: 'upload-storage',
        partialize: (state) => ({
          uploadedFiles: state.uploadedFiles,
        }),
      }
    ),
    { name: 'UploadStore' }
  )
);

// Selectors for optimized re-renders
export const selectUploadQueue = (state: UploadState) => state.uploadQueue;
export const selectUploadedFiles = (state: UploadState) => state.uploadedFiles;
export const selectIsUploading = (state: UploadState) => state.isUploading;
export const selectActiveUploads = (state: UploadState) => state.activeUploads;
export const selectSelectedFiles = (state: UploadState) => state.selectedFiles;
