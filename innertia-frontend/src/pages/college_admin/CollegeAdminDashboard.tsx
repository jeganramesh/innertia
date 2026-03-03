/**
 * College Admin Dashboard
 * Provides overview of college-level operations with analytics
 */

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { useAuth } from '../../hooks/useAuth';
import { 
  Users, 
  GraduationCap, 
  Briefcase, 
  UserCog, 
  BookOpen, 
  Video,
  Activity,
  TrendingUp,
  Loader2,
  FileText,
  Clipboard,
  CheckCircle,
  Clock
} from 'lucide-react';

interface CollegeStats {
  staff: number;
  faculty: number;
  trainer: number;
  student: number;
  total_users: number;
  classes: number;
  sessions_today: number;
  sessions_last_7_days: number;
  participation_rate: number;
  assessment_module_enabled: boolean;
  exam_module_enabled: boolean;
  total_exams: number;
  total_assessments: number;
  completed_assessments: number;
  pending_assessments: number;
}

interface DailyTrend {
  date: string;
  sessions: number;
  active_students: number;
}

interface DashboardData {
  college: {
    id: string;
    name: string;
    code: string;
  };
  stats: CollegeStats;
  analytics?: {
    daily_trends: DailyTrend[];
    period: string;
  };
}

export const CollegeAdminDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getErrorMessage = (err: unknown): string => {
    if (err instanceof Error) return err.message;
    return 'Failed to load dashboard';
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const token = localStorage.getItem('access_token');
        const response = await fetch('/api/v1/college-admin/dashboard', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        });
        
        // Try to parse response as JSON
        let data;
        const contentType = response.headers.get('content-type');
        try {
          if (contentType && contentType.includes('application/json')) {
            data = await response.json();
          } else {
            // Try to parse anyway - some servers don't set content-type correctly
            const text = await response.text();
            try {
              data = JSON.parse(text);
            } catch {
              console.error('Non-JSON response:', text);
              throw new Error('Server returned an invalid response. Please try again later.');
            }
          }
        } catch (parseError) {
          if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
          }
          throw parseError;
        }
        
        if (!response.ok) {
          throw new Error(data?.detail || `Failed to fetch dashboard data (${response.status})`);
        }
        
        setData(data);
      } catch (err) {
        console.error('Error fetching dashboard:', err);
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  const stats = data?.stats;
  const hasAnalytics = !!data?.analytics;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          College Dashboard
        </h1>
        <p className="text-gray-600 mt-1">
          Welcome back, {user?.full_name || user?.email}
          {data?.college && <span className="ml-2 text-sm"> • {data.college.name}</span>}
        </p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Students */}
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900">{stats?.student || 0}</div>
            <p className="text-xs text-blue-600 mt-1">Active enrollments</p>
          </CardContent>
        </Card>

        {/* Faculty */}
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700 flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Faculty
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-900">{stats?.faculty || 0}</div>
            <p className="text-xs text-green-600 mt-1">Teaching staff</p>
          </CardContent>
        </Card>

        {/* Staff */}
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-700 flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Staff
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-900">{stats?.staff || 0}</div>
            <p className="text-xs text-purple-600 mt-1">Administrative</p>
          </CardContent>
        </Card>

        {/* Trainers */}
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-700 flex items-center gap-2">
              <UserCog className="w-4 h-4" />
              Trainers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-900">{stats?.trainer || 0}</div>
            <p className="text-xs text-orange-600 mt-1">Placement & training</p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Classes */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Active Classes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.classes || 0}</div>
          </CardContent>
        </Card>

        {/* Sessions Today */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Video className="w-4 h-4" />
              Sessions Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.sessions_today || 0}</div>
          </CardContent>
        </Card>

        {/* Participation Rate */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Participation Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.participation_rate || 0}%</div>
            <p className="text-xs text-gray-500 mt-1">Last 7 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Chart - Only show if available */}
      {hasAnalytics && data?.analytics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Activity Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-end gap-2">
              {data.analytics!.daily_trends.map((day, index) => {
                const maxSessions = Math.max(...data.analytics!.daily_trends.map(d => d.sessions), 1);
                const height = (day.sessions / maxSessions) * 100;
                
                return (
                  <div key={index} className="flex-1 flex flex-col items-center gap-1">
                    <div 
                      className="w-full bg-blue-500 rounded-t transition-all hover:bg-blue-600"
                      style={{ height: `${Math.max(height, 4)}%` }}
                      title={`${day.sessions} sessions`}
                    />
                    <span className="text-xs text-gray-500">
                      {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex justify-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded" />
                <span>Sessions: {stats?.sessions_last_7_days || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
            <a
              href="/college-admin/role-features"
              className="block p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <span className="font-medium">Feature Permissions</span>
              <p className="text-sm text-gray-500">Configure role-based access</p>
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Users</span>
                <span className="font-semibold">{stats?.total_users || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Classes</span>
                <span className="font-semibold">{stats?.classes || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Sessions (7 days)</span>
                <span className="font-semibold">{stats?.sessions_last_7_days || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Student Engagement</span>
                <span className="font-semibold">{stats?.participation_rate || 0}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Exam/Assessment Stats - Show when exam module is enabled - MOVED TO BOTTOM */}
      {(stats?.exam_module_enabled || stats?.assessment_module_enabled) && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">Examinations & Assessments</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Exams */}
            <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-indigo-700 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Total Exams
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-indigo-900">{stats?.total_exams || 0}</div>
                <p className="text-xs text-indigo-600 mt-1">Scheduled exams</p>
              </CardContent>
            </Card>

            {/* Total Assessments */}
            <Card className="bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-teal-700 flex items-center gap-2">
                  <Clipboard className="w-4 h-4" />
                  Assessments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-teal-900">{stats?.total_assessments || 0}</div>
                <p className="text-xs text-teal-600 mt-1">Total assessments</p>
              </CardContent>
            </Card>

            {/* Completed Assessments */}
            <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-emerald-700 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Completed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-emerald-900">{stats?.completed_assessments || 0}</div>
                <p className="text-xs text-emerald-600 mt-1">Submitted</p>
              </CardContent>
            </Card>

            {/* Pending Assessments */}
            <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-amber-700 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Pending
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-amber-900">{stats?.pending_assessments || 0}</div>
                <p className="text-xs text-amber-600 mt-1">Awaiting submission</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollegeAdminDashboard;
