/**
 * College Admin - Role Features Page
 * Manage role-based feature access within their college
 */

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { PageHeader } from '../../components/ui/PageHeader';
import { toast } from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const API_V1_PREFIX = '/api/v1';

const FEATURE_LABELS: Record<string, string> = {
  'attendance_tracking': 'Attendance Tracking',
  'ai_notes': 'AI Notes',
  'placement_module': 'Placement Module',
  'assessment_module': 'Assessment Module',
  'advanced_reports': 'Advanced Reports',
  'live_session_lock': 'Live Session Lock',
  'student_portal': 'Student Portal',
  'faculty_portal': 'Faculty Portal',
  'staff_portal': 'Staff Portal',
  'trainer_portal': 'Trainer Portal',
  'college_analytics': 'College Analytics',
};

const ROLES = ['staff', 'faculty', 'trainer', 'student'];

interface RoleFeature {
  role: string;
  feature_key: string;
  is_enabled: boolean;
  college_feature_enabled?: boolean;
}

const collegeAdminApi = axios.create({
  baseURL: `${API_BASE_URL}${API_V1_PREFIX}`,
  headers: { 'Content-Type': 'application/json' },
});

collegeAdminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const RoleFeaturesPage = () => {
  const [roleFeatures, setRoleFeatures] = useState<RoleFeature[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRoleFeatures();
  }, []);

  const loadRoleFeatures = async () => {
    try {
      setLoading(true);
      const response = await collegeAdminApi.get<{ items: RoleFeature[] }>('/college-admin/features/roles');
      setRoleFeatures(response.data.items || []);
    } catch (error) {
      console.error('Failed to load role features:', error);
      toast.error('Failed to load role features');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRoleFeature = async (role: string, featureKey: string, currentEnabled: boolean) => {
    try {
      await collegeAdminApi.patch('/college-admin/features/roles', null, {
        params: { role, feature_key: featureKey, is_enabled: !currentEnabled }
      });
      toast.success(`${featureKey} ${!currentEnabled ? 'enabled' : 'disabled'} for ${role}`);
      loadRoleFeatures();
    } catch (error: any) {
      console.error('Failed to toggle role feature:', error);
      toast.error(error.response?.data?.detail || 'Failed to toggle role feature');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Role Feature Permissions"
        description="Configure which features each role can access within your college"
      />

      <Card>
        <CardHeader>
          <CardTitle>Feature Access by Role</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Feature</TableHead>
                  {ROLES.map((role) => (
                    <TableHead key={role} className="text-center">
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.keys(FEATURE_LABELS).map((featureKey) => {
                  const featureRoles = roleFeatures.filter(f => f.feature_key === featureKey);
                  return (
                    <TableRow key={featureKey}>
                      <TableCell className="font-medium">
                        {FEATURE_LABELS[featureKey]}
                      </TableCell>
                      {ROLES.map((role) => {
                        const rolePerm = featureRoles.find(f => f.role === role);
                        const isEnabled = rolePerm?.is_enabled || false;
                        const collegeEnabled = rolePerm?.college_feature_enabled !== false;
                        
                        return (
                          <TableCell key={role} className="text-center">
                            <button
                              onClick={() => collegeEnabled && handleToggleRoleFeature(role, featureKey, isEnabled)}
                              disabled={!collegeEnabled}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                isEnabled 
                                  ? 'bg-blue-600' 
                                  : collegeEnabled 
                                    ? 'bg-gray-200' 
                                    : 'bg-gray-100 cursor-not-allowed'
                              }`}
                              title={!collegeEnabled ? 'Feature disabled at college level' : ''}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  isEnabled ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RoleFeaturesPage;
