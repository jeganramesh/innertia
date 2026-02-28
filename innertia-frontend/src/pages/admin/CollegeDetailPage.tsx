/**
 * Platform Admin - College Detail Page
 * Manage college features and view college users
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  fetchCollege, 
  fetchCollegeFeatures, 
  toggleCollegeFeature,
  fetchCollegeUsers,
  fetchRoleFeatures,
  toggleRoleFeature,
  College,
  CollegeFeature,
  RoleFeaturePermission
} from '../../modules/admin/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../../components/ui/Table';
import { PageHeader } from '../../components/ui/PageHeader';
import { toast } from 'react-hot-toast';

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

export const CollegeDetailPage = () => {
  const { collegeId } = useParams<{ collegeId: string }>();
  const navigate = useNavigate();
  const [college, setCollege] = useState<College | null>(null);
  const [features, setFeatures] = useState<CollegeFeature[]>([]);
  const [roleFeatures, setRoleFeatures] = useState<RoleFeaturePermission[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'features' | 'role-features' | 'users'>('features');
  const [userPage, setUserPage] = useState(1);

  useEffect(() => {
    if (collegeId) {
      loadCollegeData();
    }
  }, [collegeId]);

  useEffect(() => {
    if (activeTab === 'users' && collegeId) {
      loadUsers();
    }
  }, [activeTab, userPage, collegeId]);

  const loadCollegeData = async () => {
    try {
      setLoading(true);
      const [collegeData, featuresData, roleFeaturesData] = await Promise.all([
        fetchCollege(collegeId!),
        fetchCollegeFeatures(collegeId!),
        fetchRoleFeatures(collegeId!)
      ]);
      setCollege(collegeData);
      setFeatures(featuresData.items || []);
      setRoleFeatures(roleFeaturesData.items || []);
    } catch (error) {
      console.error('Failed to load college:', error);
      toast.error('Failed to load college data');
      navigate('/platform-admin/colleges');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      setUsersLoading(true);
      const response = await fetchCollegeUsers(collegeId!, userPage, 20);
      setUsers(response.items || []);
    } catch (error) {
      console.error('Failed to load users:', error);
      toast.error('Failed to load users');
    } finally {
      setUsersLoading(false);
    }
  };

  const handleToggleFeature = async (featureKey: string, currentEnabled: boolean) => {
    try {
      await toggleCollegeFeature(collegeId!, featureKey, !currentEnabled);
      toast.success(`${featureKey} ${!currentEnabled ? 'enabled' : 'disabled'} successfully`);
      loadCollegeData();
    } catch (error: any) {
      console.error('Failed to toggle feature:', error);
      toast.error(error.response?.data?.detail || 'Failed to toggle feature');
    }
  };

  const handleToggleRoleFeature = async (role: string, featureKey: string, currentEnabled: boolean) => {
    try {
      await toggleRoleFeature(collegeId!, role, featureKey, !currentEnabled);
      toast.success(`${featureKey} ${!currentEnabled ? 'enabled' : 'disabled'} for ${role}`);
      loadCollegeData();
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

  if (!college) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate('/platform-admin/colleges')}>
          ← Back to Colleges
        </Button>
      </div>

      <PageHeader
        title={college.name}
        description={`College Code: ${college.code} | Domain: ${college.domain || 'Not set'}`}
      />

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('features')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'features'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            College Features
          </button>
          <button
            onClick={() => setActiveTab('role-features')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'role-features'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Role Permissions
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'users'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            College Users
          </button>
        </nav>
      </div>

      {/* Features Tab */}
      {activeTab === 'features' && (
        <Card>
          <CardHeader>
            <CardTitle>Feature Toggles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {features.map((feature) => (
                <div
                  key={feature.feature_key}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">
                      {FEATURE_LABELS[feature.feature_key] || feature.feature_key}
                    </p>
                    <p className="text-sm text-gray-500">{feature.feature_key}</p>
                  </div>
                  <button
                    onClick={() => handleToggleFeature(feature.feature_key, feature.is_enabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      feature.is_enabled ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        feature.is_enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Role Features Tab */}
      {activeTab === 'role-features' && (
        <Card>
          <CardHeader>
            <CardTitle>Role Feature Permissions</CardTitle>
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
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <Card>
          <CardHeader>
            <CardTitle>College Users</CardTitle>
          </CardHeader>
          <CardContent>
            {usersLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : users.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No users found</p>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.full_name || '-'}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{user.role}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.is_active ? 'success' : 'secondary'}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(user.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {/* Pagination */}
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-gray-500">
                    Page {userPage}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setUserPage(userPage - 1)}
                      disabled={userPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setUserPage(userPage + 1)}
                      disabled={users.length < 20}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CollegeDetailPage;
