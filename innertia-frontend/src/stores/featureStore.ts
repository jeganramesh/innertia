/**
 * Feature Context
 * Provides feature-based access control for the frontend
 * Dynamically shows/hides navigation items based on enabled features
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, UserFeatures } from '../services/authService';

// Define available features
export const FEATURES = {
  ATTENDANCE_TRACKING: 'attendance_tracking',
  AI_NOTES: 'ai_notes',
  PLACEMENT_MODULE: 'placement_module',
  ASSESSMENT_MODULE: 'assessment_module',
  ADVANCED_REPORTS: 'advanced_reports',
  LIVE_SESSION_LOCK: 'live_session_lock',
  STUDENT_PORTAL: 'student_portal',
  FACULTY_PORTAL: 'faculty_portal',
  STAFF_PORTAL: 'staff_portal',
  TRAINER_PORTAL: 'trainer_portal',
  COLLEGE_ANALYTICS: 'college_analytics',
} as const;

export type FeatureKey = typeof FEATURES[keyof typeof FEATURES];

interface FeatureContextType {
  features: UserFeatures | null;
  isLoading: boolean;
  hasFeature: (feature: string) => boolean;
  refreshFeatures: () => Promise<void>;
}

const FeatureContext = createContext<FeatureContextType | undefined>(undefined);

interface FeatureProviderProps {
  children: ReactNode;
}

export const FeatureProvider: React.FC<FeatureProviderProps> = ({ children }) => {
  const [features, setFeatures] = useState<UserFeatures | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshFeatures = async () => {
    try {
      const userFeatures = await authService.getUserFeatures();
      setFeatures(userFeatures);
    } catch (error) {
      console.error('Failed to fetch user features:', error);
      // If we can't get features, assume user has no features
      setFeatures(null);
    } finally {
      setIsLoading(false);
    }
  };

  const hasFeature = (feature: string): boolean => {
    if (!features) return false;
    // Admin has all features
    if (features.role === 'admin') return true;
    // Check if feature is in enabled list
    return features.features.includes(feature);
  };

  useEffect(() => {
    refreshFeatures();
  }, []);

  return (
    <FeatureContext.Provider value={{ features, isLoading, hasFeature, refreshFeatures }}>
      {children}
    </FeatureContext.Provider>
  );
};

export const useFeatures = (): FeatureContextType => {
  const context = useContext(FeatureContext);
  if (context === undefined) {
    throw new Error('useFeatures must be used within a FeatureProvider');
  }
  return context;
};

/**
 * Hook to check if user has specific feature
 * Returns true if feature is enabled for user's role and college
 */
export const useFeature = (feature: string): boolean => {
  const { hasFeature, isLoading } = useFeatures();
  
  if (isLoading) return false;
  return hasFeature(feature);
};

/**
 * Navigation items configuration based on features
 */
export const getNavigationItems = (features: UserFeatures | null, role: string) => {
  if (!features) return [];

  const { hasFeature } = {
    hasFeature: (f: string) => {
      if (role === 'admin') return true;
      return features.features.includes(f);
    }
  };

  const navigation: { path: string; label: string; icon: string; features: string[] }[] = [];

  // Common items for all authenticated users
  navigation.push(
    { path: '/dashboard', label: 'Dashboard', icon: 'home', features: [] }
  );

  // Role-specific navigation
  switch (role) {
    case 'admin':
    case 'college_admin':
      if (hasFeature(FEATURES.COLLEGE_ANALYTICS)) {
        navigation.push(
          { path: '/admin/analytics', label: 'Analytics', icon: 'chart', features: [FEATURES.COLLEGE_ANALYTICS] }
        );
      }
      navigation.push(
        { path: '/admin/users', label: 'Users', icon: 'users', features: [] },
        { path: '/admin/classes', label: 'Classes', icon: 'book', features: [] },
        { path: '/admin/sessions', label: 'Sessions', icon: 'video', features: [] }
      );
      if (hasFeature(FEATURES.ADVANCED_REPORTS)) {
        navigation.push(
          { path: '/admin/reports', label: 'Reports', icon: 'file-text', features: [FEATURES.ADVANCED_REPORTS] }
        );
      }
      break;

    case 'faculty':
      navigation.push(
        { path: '/faculty/classes', label: 'My Classes', icon: 'book', features: [] },
        { path: '/faculty/sessions', label: 'Sessions', icon: 'video', features: [] }
      );
      if (hasFeature(FEATURES.AI_NOTES)) {
        navigation.push(
          { path: '/faculty/ai-notes', label: 'AI Notes', icon: 'cpu', features: [FEATURES.AI_NOTES] }
        );
      }
      if (hasFeature(FEATURES.ATTENDANCE_TRACKING)) {
        navigation.push(
          { path: '/faculty/attendance', label: 'Attendance', icon: 'check-circle', features: [FEATURES.ATTENDANCE_TRACKING] }
        );
      }
      break;

    case 'student':
      navigation.push(
        { path: '/student/classes', label: 'My Classes', icon: 'book', features: [] },
        { path: '/student/sessions', label: 'Live Sessions', icon: 'video', features: [] }
      );
      if (hasFeature(FEATURES.AI_NOTES)) {
        navigation.push(
          { path: '/student/notes', label: 'Notes', icon: 'file-text', features: [FEATURES.AI_NOTES] }
        );
      }
      if (hasFeature(FEATURES.ASSESSMENT_MODULE)) {
        navigation.push(
          { path: '/student/assessments', label: 'Assessments', icon: 'clipboard', features: [FEATURES.ASSESSMENT_MODULE] }
        );
      }
      break;

    case 'staff':
      if (hasFeature(FEATURES.ATTENDANCE_TRACKING)) {
        navigation.push(
          { path: '/staff/attendance', label: 'Attendance Reports', icon: 'check-circle', features: [FEATURES.ATTENDANCE_TRACKING] }
        );
      }
      if (hasFeature(FEATURES.PLACEMENT_MODULE)) {
        navigation.push(
          { path: '/staff/placement', label: 'Placement Stats', icon: 'briefcase', features: [FEATURES.PLACEMENT_MODULE] }
        );
      }
      if (hasFeature(FEATURES.ADVANCED_REPORTS)) {
        navigation.push(
          { path: '/staff/reports', label: 'Reports', icon: 'file-text', features: [FEATURES.ADVANCED_REPORTS] }
        );
      }
      break;

    case 'trainer':
      if (hasFeature(FEATURES.ASSESSMENT_MODULE)) {
        navigation.push(
          { path: '/trainer/assessments', label: 'Assessments', icon: 'clipboard', features: [FEATURES.ASSESSMENT_MODULE] },
          { path: '/trainer/tests', label: 'Placement Tests', icon: 'file-text', features: [FEATURES.ASSESSMENT_MODULE] }
        );
      }
      if (hasFeature(FEATURES.PLACEMENT_MODULE)) {
        navigation.push(
          { path: '/trainer/placement', label: 'Placement', icon: 'briefcase', features: [FEATURES.PLACEMENT_MODULE] }
        );
      }
      break;
  }

  return navigation;
};

export default FeatureContext;
