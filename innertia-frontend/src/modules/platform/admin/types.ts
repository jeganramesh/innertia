/**
 * Platform Admin Module Types
 * TypeScript definitions for college management and feature toggles
 */

// College Types
export interface College {
  id: string;
  name: string;
  code: string;
  domain?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  active_features_count?: number;
}

export interface CollegeCreatePayload {
  name: string;
  code: string;
  domain?: string;
}

export interface CollegeUpdatePayload {
  name?: string;
  code?: string;
  domain?: string;
  is_active?: boolean;
}

export interface PaginatedColleges {
  items: College[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

// Feature Types
export interface CollegeFeature {
  feature_key: string;
  is_enabled: boolean;
}

export interface CollegeFeaturePayload {
  feature_key: string;
  is_enabled: boolean;
}

export interface CollegeFeaturesResponse {
  items: CollegeFeature[];
  total: number;
}

// Role Feature Permission Types
export interface RoleFeaturePermission {
  role: string;
  feature_key: string;
  is_enabled: boolean;
  college_feature_enabled?: boolean;
}

export interface RoleFeaturePayload {
  role: string;
  feature_key: string;
  is_enabled: boolean;
}

export interface RoleFeaturesResponse {
  items: RoleFeaturePermission[];
  total: number;
}

// User Types (scoped to college)
export interface CollegeUser {
  id: string;
  email: string;
  full_name?: string;
  role: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface PaginatedUsers {
  items: CollegeUser[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

// Feature Definitions
export interface FeatureDefinition {
  key: string;
  name: string;
  description?: string;
}

// Platform Features List
export const PLATFORM_FEATURES: FeatureDefinition[] = [
  { key: 'attendance_tracking', name: 'Attendance Tracking', description: 'Track student attendance in classes' },
  { key: 'ai_notes', name: 'AI Notes', description: 'AI-powered note generation' },
  { key: 'placement_module', name: 'Placement Module', description: 'Placement and recruitment management' },
  { key: 'report_export', name: 'Report Export', description: 'Export various reports' },
  { key: 'attendance_tracking', name: 'Attendance Tracking', description: 'Track student attendance' },
];

// Role Constants
export const COLLEGE_ROLES = ['staff', 'faculty', 'trainer', 'student'] as const;
export type CollegeRole = typeof COLLEGE_ROLES[number];
