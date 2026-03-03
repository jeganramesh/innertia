import { useState, useEffect } from 'react';
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  Activity, 
  AlertTriangle, 
  Clock,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { adminApiService, DashboardStats } from '../../services/adminApi';

const transformStats = (apiStats: DashboardStats) => ({
  totalUsers: apiStats.total_users,
  totalFaculties: apiStats.total_faculty,
  totalStudents: apiStats.total_students,
  activeSessions: apiStats.active_sessions,
  totalClasses: apiStats.total_classes,
  totalSessions: apiStats.total_sessions,
  last30DaySessions: apiStats.last_30_day_sessions,
  averageAttendance: apiStats.average_attendance_rate || 0,
  violationCount: apiStats.total_violations_7_days || 0
});

export const AdminDashboard = () => {
  const [stats, setStats] = useState(transformStats({
    total_users: 0,
    total_students: 0,
    total_faculty: 0,
    total_admins: 0,
    total_classes: 0,
    total_sessions: 0,
    active_sessions: 0,
    last_30_day_sessions: 0,
    users_by_role: { admin: 0, faculty: 0, student: 0 },
    average_attendance_rate: 0,
    total_violations_7_days: 0
  }));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        const data = await adminApiService.getDashboardStats();
        setStats(transformStats(data));
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    { 
      title: 'Total Users', 
      value: stats.totalUsers, 
      icon: Users
    },
    { 
      title: 'Total Faculty', 
      value: stats.totalFaculties, 
      icon: GraduationCap
    },
    { 
      title: 'Total Students', 
      value: stats.totalStudents, 
      icon: BookOpen
    },
    { 
      title: 'Active Sessions', 
      value: stats.activeSessions, 
      icon: Activity
    },
  ];

  return (
    <div className="space-y-8 lg:space-y-12">
      {/* Page Header - Apple Style */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-semibold text-[#1d1d1f] tracking-tight">
            Institution Overview
          </h1>
          <p className="text-base text-[#86868b] mt-2 max-w-xl">
            Monitor your institution's performance, track attendance metrics, and manage users across all departments.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-[#86868b]">
          <Clock className="w-4 h-4" />
          <span>
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </span>
        </div>
      </div>

      {/* Primary Metrics Grid - Apple Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
        {statCards.map((stat, index) => (
          <div 
            key={index}
            className="group bg-white rounded-2xl p-6 lg:p-8 transition-all duration-300 ease-out hover:scale-[1.02] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] cursor-default"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-[13px] font-medium text-[#86868b] uppercase tracking-[0.5px]">
                  {stat.title}
                </p>
                <p className="text-5xl lg:text-6xl font-semibold text-[#1d1d1f] mt-3 tracking-tight">
                  {isLoading ? '-' : stat.value.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#f5f5f7] flex items-center justify-center group-hover:bg-[#0071e3] group-hover:text-white transition-all duration-300">
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Secondary Metrics - Apple Style */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
        <div className="bg-white rounded-2xl p-6 lg:p-8 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[13px] font-medium text-[#86868b] uppercase tracking-[0.5px]">Total Classes</h3>
            <BookOpen className="w-5 h-5 text-[#86868b]" />
          </div>
          <p className="text-4xl font-semibold text-[#1d1d1f]">{isLoading ? '-' : stats.totalClasses}</p>
          <p className="text-sm text-[#86868b] mt-2">Across all faculties</p>
        </div>

        <div className="bg-white rounded-2xl p-6 lg:p-8 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[13px] font-medium text-[#86868b] uppercase tracking-[0.5px]">Average Attendance</h3>
            <BarChart3 className="w-5 h-5 text-[#86868b]" />
          </div>
          <p className="text-4xl font-semibold text-[#1d1d1f]">{isLoading ? '-' : `${stats.averageAttendance}%`}</p>
          <p className="text-sm text-[#86868b] mt-2">Last 7 days</p>
        </div>

        <div className="bg-white rounded-2xl p-6 lg:p-8 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[13px] font-medium text-[#86868b] uppercase tracking-[0.5px]">Violations</h3>
            <AlertTriangle className="w-5 h-5 text-[#86868b]" />
          </div>
          <p className="text-4xl font-semibold text-[#1d1d1f]">{isLoading ? '-' : stats.violationCount}</p>
          <p className="text-sm text-[#86868b] mt-2">Last 7 days</p>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="bg-[#f5f5f7] rounded-2xl p-6 lg:p-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-[13px] font-medium text-[#86868b] uppercase tracking-[0.5px]">Total Sessions</p>
            <p className="text-2xl font-semibold text-[#1d1d1f] mt-1">{isLoading ? '-' : stats.totalSessions}</p>
          </div>
          <div>
            <p className="text-[13px] font-medium text-[#86868b] uppercase tracking-[0.5px]">Sessions (30d)</p>
            <p className="text-2xl font-semibold text-[#1d1d1f] mt-1">{isLoading ? '-' : stats.last30DaySessions}</p>
          </div>
          <div>
            <p className="text-[13px] font-medium text-[#86868b] uppercase tracking-[0.5px]">Total Admins</p>
            <p className="text-2xl font-semibold text-[#1d1d1f] mt-1">{isLoading ? '-' : (stats.totalUsers - stats.totalFaculties - stats.totalStudents)}</p>
          </div>
          <div>
            <p className="text-[13px] font-medium text-[#86868b] uppercase tracking-[0.5px]">System Status</p>
            <p className="text-2xl font-semibold text-green-600 mt-1 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Active
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
