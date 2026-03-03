/**
 * College Management Hooks
 * React Query hooks for college CRUD operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collegeApi } from '../api';
import { CollegeCreatePayload, CollegeUpdatePayload } from '../types';
import { toast } from 'react-hot-toast';

// Query Keys
export const collegeKeys = {
  all: ['colleges'] as const,
  lists: () => [...collegeKeys.all, 'list'] as const,
  list: (page: number, pageSize: number, isActive?: boolean) => 
    [...collegeKeys.lists(), { page, pageSize, isActive }] as const,
  details: () => [...collegeKeys.all, 'detail'] as const,
  detail: (id: string) => [...collegeKeys.details(), id] as const,
};

// Hook to fetch colleges list
export const useColleges = (page = 1, pageSize = 20, isActive?: boolean) => {
  return useQuery({
    queryKey: collegeKeys.list(page, pageSize, isActive),
    queryFn: () => collegeApi.getColleges(page, pageSize, isActive),
    staleTime: 60 * 1000, // 1 minute
    retry: 1,
  });
};

// Hook to fetch single college
export const useCollege = (collegeId: string) => {
  return useQuery({
    queryKey: collegeKeys.detail(collegeId),
    queryFn: () => collegeApi.getCollege(collegeId),
    staleTime: 60 * 1000,
    retry: 1,
    enabled: !!collegeId,
  });
};

// Hook to create college
export const useCreateCollege = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CollegeCreatePayload) => collegeApi.createCollege(data),
    onSuccess: (data) => {
      // Invalidate colleges list
      queryClient.invalidateQueries({ queryKey: collegeKeys.lists() });
      
      // Show success message with users added count if applicable
      if (data.users_added_count && data.users_added_count > 0) {
        toast.success(`College created successfully! ${data.users_added_count} user(s) have been added to the college.`);
      } else {
        toast.success('College created successfully');
      }
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Failed to create college';
      toast.error(message);
      throw error;
    },
  });
};

// Hook to update college
export const useUpdateCollege = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ collegeId, data }: { collegeId: string; data: CollegeUpdatePayload }) =>
      collegeApi.updateCollege(collegeId, data),
    onMutate: async ({ collegeId, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: collegeKeys.detail(collegeId) });

      // Snapshot previous value
      const previousCollege = queryClient.getQueryData(collegeKeys.detail(collegeId));

      // Optimistically update
      queryClient.setQueryData(collegeKeys.detail(collegeId), (old: any) => ({
        ...old,
        ...data,
      }));

      return { previousCollege };
    },
    onError: (err, { collegeId }, context) => {
      // Rollback on error
      if (context?.previousCollege) {
        queryClient.setQueryData(collegeKeys.detail(collegeId), context.previousCollege);
      }
      toast.error('Failed to update college');
    },
    onSettled: (_, __, { collegeId }) => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: collegeKeys.detail(collegeId) });
      queryClient.invalidateQueries({ queryKey: collegeKeys.lists() });
    },
  });
};

// Hook to delete college
export const useDeleteCollege = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (collegeId: string) => collegeApi.deleteCollege(collegeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: collegeKeys.lists() });
      toast.success('College deactivated successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Failed to deactivate college';
      toast.error(message);
      throw error;
    },
  });
};

// Hook to toggle college status
export const useToggleCollegeStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ collegeId, isActive }: { collegeId: string; isActive: boolean }) =>
      collegeApi.toggleCollegeStatus(collegeId, isActive),
    onMutate: async ({ collegeId, isActive }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: collegeKeys.detail(collegeId) });

      // Snapshot previous value
      const previousCollege = queryClient.getQueryData(collegeKeys.detail(collegeId));

      // Optimistically update
      queryClient.setQueryData(collegeKeys.detail(collegeId), (old: any) => ({
        ...old,
        is_active: isActive,
      }));

      return { previousCollege };
    },
    onError: (err, { collegeId }, context) => {
      // Rollback on error
      if (context?.previousCollege) {
        queryClient.setQueryData(collegeKeys.detail(collegeId), context.previousCollege);
      }
      toast.error('Failed to toggle college status');
    },
    onSettled: (_, __, { collegeId }) => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: collegeKeys.detail(collegeId) });
      queryClient.invalidateQueries({ queryKey: collegeKeys.lists() });
    },
  });
};
