/**
 * College Feature Hooks
 * React Query hooks for college feature management with optimistic updates
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collegeFeaturesApi, roleFeaturesApi } from '../api';
import { CollegeFeaturePayload, RoleFeaturePayload } from '../types';
import { toast } from 'react-hot-toast';

// Query Keys
export const featureKeys = {
  all: ['features'] as const,
  lists: () => [...featureKeys.all, 'list'] as const,
  list: (collegeId: string) => [...featureKeys.lists(), collegeId] as const,
  roleLists: () => [...featureKeys.all, 'roleList'] as const,
  roleList: (collegeId: string, role?: string) => 
    [...featureKeys.roleLists(), collegeId, role] as const,
};

// Hook to fetch college features
export const useCollegeFeatures = (collegeId: string) => {
  return useQuery({
    queryKey: featureKeys.list(collegeId),
    queryFn: () => collegeFeaturesApi.getFeatures(collegeId),
    staleTime: 30 * 1000, // 30 seconds
    retry: 1,
    enabled: !!collegeId,
  });
};

// Hook to toggle college feature with optimistic update
export const useToggleCollegeFeature = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ collegeId, payload }: { collegeId: string; payload: CollegeFeaturePayload }) =>
      collegeFeaturesApi.toggleFeature(collegeId, payload),
    onMutate: async ({ collegeId, payload }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: featureKeys.list(collegeId) });

      // Snapshot previous value
      const previousFeatures = queryClient.getQueryData(featureKeys.list(collegeId));

      // Optimistically update
      queryClient.setQueryData(featureKeys.list(collegeId), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          items: old.items.map((item: any) =>
            item.feature_key === payload.feature_key
              ? { ...item, is_enabled: payload.is_enabled }
              : item
          ),
        };
      });

      return { previousFeatures };
    },
    onError: (err, { collegeId }, context) => {
      // Rollback on error
      if (context?.previousFeatures) {
        queryClient.setQueryData(featureKeys.list(collegeId), context.previousFeatures);
      }
      toast.error('Failed to update feature');
    },
    onSettled: (_, __, { collegeId }) => {
      queryClient.invalidateQueries({ queryKey: featureKeys.list(collegeId) });
    },
  });
};

// Hook to fetch role features
export const useRoleFeatures = (collegeId: string, role?: string) => {
  return useQuery({
    queryKey: featureKeys.roleList(collegeId, role),
    queryFn: () => roleFeaturesApi.getRoleFeatures(collegeId, role),
    staleTime: 30 * 1000,
    retry: 1,
    enabled: !!collegeId,
  });
};

// Hook to toggle role feature with optimistic update
export const useToggleRoleFeature = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ collegeId, payload }: { collegeId: string; payload: RoleFeaturePayload }) =>
      roleFeaturesApi.toggleRoleFeature(collegeId, payload),
    onMutate: async ({ collegeId, payload }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: featureKeys.roleList(collegeId) });

      // Snapshot previous value
      const previousRoleFeatures = queryClient.getQueryData(featureKeys.roleList(collegeId));

      // Optimistically update
      queryClient.setQueryData(featureKeys.roleList(collegeId), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          items: old.items.map((item: any) =>
            item.role === payload.role && item.feature_key === payload.feature_key
              ? { ...item, is_enabled: payload.is_enabled }
              : item
          ),
        };
      });

      return { previousRoleFeatures };
    },
    onError: (err, { collegeId }, context) => {
      // Rollback on error
      if (context?.previousRoleFeatures) {
        queryClient.setQueryData(featureKeys.roleList(collegeId), context.previousRoleFeatures);
      }
      toast.error('Failed to update role feature');
    },
    onSettled: (_, __, { collegeId }) => {
      queryClient.invalidateQueries({ queryKey: featureKeys.roleList(collegeId) });
    },
  });
};
