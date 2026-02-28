/**
 * App module
 * Contains router and role configuration
 */

export { AppRouter } from './router';
export { 
  ROLE_CONFIG, 
  getRoleRoutePrefix, 
  getRoleDashboard,
  isPlatformRole,
  isCollegeRole,
  isAdminRole,
  isTeachingRole
} from './roleConfig';

export type { UserRole, RoleConfig } from './roleConfig';
