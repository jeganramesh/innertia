/**
 * College Admin Dashboard
 * Provides overview of college-level operations
 */

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { useAuth } from '../../hooks/useAuth';

interface CollegeStats {
  staff: number;
  faculty: number;
  trainer: number;
  student: number;
  total_users: number;
  classes: number;
  sessions: number;
}

export const CollegeAdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<CollegeStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch college stats from API
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch('/api/v1/colleges/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          // For now, set placeholder data
          setStats({
            staff: 0,
            faculty: 0,
            trainer: 0,
            student: 0,
            total_users: 0,
            classes: 0,
            sessions: 0,
          });
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          College Admin Dashboard
        </h1>
        <p className="text-gray-600 mt-1">
          Welcome back, {user?.full_name || user?.email}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Staff
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.staff || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Faculty
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.faculty || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Trainers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.trainer || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.student || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <a
              href="/college-admin/users"
              className="block p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <span className="font-medium">Manage Users</span>
              <p className="text-sm text-gray-500">Add, edit, or remove users</p>
            </a>
            <a
              href="/college-admin/classes"
              className="block p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <span className="font-medium">Manage Classes</span>
              <p className="text-sm text-gray-500">Create and manage classes</p>
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500 text-sm">No recent activity</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CollegeAdminDashboard;
