/**
 * Role Configuration
 * Defines all roles and their route prefixes for the multi-tenant SaaS platform.
 */

export type UserRole = 
  | 'admin'
  | 'college_admin'
  | 'staff'
  | 'faculty'
  | 'trainer'
  | 'student';

export interface RoleConfig {
  role: UserRole;
  label: string;
  routePrefix: string;
  description: string;
}

export const ROLE_CONFIG: Record<UserRole, RoleConfig> = {
  admin: {
    role: 'admin',
    label: 'Admin',
    routePrefix: '/admin',
    description: 'Full system control'
  },
  college_admin: {
    role: 'college_admin',
    label: 'College Admin',
    routePrefix: '/college-admin',
    description: 'College-level administration'
  },
  staff: {
    role: 'staff',
    label: 'Staff',
    routePrefix: '/staff',
    description: 'Non-teaching staff'
  },
  faculty: {
    role: 'faculty',
    label: 'Faculty',
    routePrefix: '/faculty',
    description: 'Teaching staff'
  },
  trainer: {
    role: 'trainer',
    label: 'Trainer',
    routePrefix: '/trainer',
    description: 'Placement/assessment trainer'
  },
  student: {
    role: 'student',
    label: 'Student',
    routePrefix: '/student',
    description: 'Enrolled student'
  }
};

// Platform roles (can manage multiple colleges)
export const PLATFORM_ROLES: UserRole[] = ['admin'];

// College-level roles (belong to a single college)
export const COLLEGE_ROLES: UserRole[] = [
  'college_admin', 
  'staff', 
  'faculty', 
  'trainer', 
  'student'
];

// Admin roles (can manage users)
export const ADMIN_ROLES: UserRole[] = ['admin', 'college_admin'];

// Teaching roles
export const TEACHING_ROLES: UserRole[] = ['faculty', 'trainer'];

// Role hierarchy (higher index = more permissions)
export const ROLE_HIERARCHY: UserRole[] = [
  'student',
  'trainer',
  'faculty',
  'staff',
  'staff',
  'college_admin',
  'admin'
];

/**
 * Get the route prefix for a role
 */
export const getRoleRoutePrefix = (role: UserRole | string): string => {
  const config = ROLE_CONFIG[role as UserRole];
  return config?.routePrefix || '/';
};

/**
 * Get the dashboard route for a role
 */
export const getRoleDashboard = (role: UserRole | string): string => {
  const prefix = getRoleRoutePrefix(role);
  return `${prefix}/dashboard`;
};

/**
 * Check if a role is a platform-level role
 */
export const isPlatformRole = (role: string): boolean => {
  return PLATFORM_ROLES.includes(role as UserRole);
};

/**
 * Check if a role is a college-level role
 */
export const isCollegeRole = (role: string): boolean => {
  return COLLEGE_ROLES.includes(role as UserRole);
};

/**
 * Check if user has admin privileges
 */
export const isAdminRole = (role: string): boolean => {
  return ADMIN_ROLES.includes(role as UserRole);
};

/**
 * Check if user has teaching privileges
 */
export const isTeachingRole = (role: string): boolean => {
  return TEACHING_ROLES.includes(role as UserRole);
};
