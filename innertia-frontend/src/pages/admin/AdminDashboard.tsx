import { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
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
import { AdminStats } from './types';

// Mock data for demonstration
const mockStats: AdminStats = {
  totalUsers: 1250,
  totalFaculties: 45,
  totalStudents: 1180,
  activeSessions: 8,
  totalClasses: 120,
  averageAttendance: 87.5,
  violationCount: 23
};

const recentActivity = [
  { id: 1, action: 'User Created', user: 'john.doe@edu.com', role: 'student', time: '2 min ago' },
  { id: 2, action: 'Session Started', class: 'CS101 - Introduction to Programming', faculty: 'Dr. Smith', time: '5 min ago' },
  { id: 3, action: 'Class Archived', class: 'ENG201 - Advanced Writing', admin: 'Admin User', time: '1 hour ago' },
  { id: 4, action: 'Violation Detected', class: 'MATH301', student: 'Jane Doe', time: '15 min ago' },
  { id: 5, action: 'Faculty Added', user: 'prof.johnson@edu.com', role: 'faculty', time: '3 hours ago' },
];

const attendanceTrend = [
  { day: 'Mon', rate: 85 },
  { day: 'Tue', rate: 88 },
  { day: 'Wed', rate: 82 },
  { day: 'Thu', rate: 91 },
  { day: 'Fri', rate: 87 },
];

export const AdminDashboard = () => {
  const [stats, setStats] = useState<AdminStats>(mockStats);
  const [isLoading, setIsLoading] = useState(false);

  const statCards = [
    { 
      title: 'Total Users', 
      value: stats.totalUsers, 
      icon: Users, 
      color: 'bg-blue-500',
      change: '+12%'
    },
    { 
      title: 'Faculties', 
      value: stats.totalFaculties, 
      icon: GraduationCap, 
      color: 'bg-purple-500',
      change: '+3%'
    },
    { 
      title: 'Students', 
      value: stats.totalStudents, 
      icon: BookOpen, 
      color: 'bg-green-500',
      change: '+15%'
    },
    { 
      title: 'Active Sessions', 
      value: stats.activeSessions, 
      icon: Activity, 
      color: 'bg-orange-500',
      change: 'Live'
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 mt-1">System overview and management</p>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-gray-400" />
          <span className="text-sm text-gray-500">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <Card key={index} className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.title}</p>
                <p className="text-2xl font-bold mt-1">{stat.value.toLocaleString()}</p>
                <span className="text-xs text-green-600 mt-2 inline-flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {stat.change}
                </span>
              </div>
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Total Classes</h3>
            <BookOpen className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-3xl font-bold">{stats.totalClasses}</p>
          <p className="text-sm text-gray-500 mt-1">Across all faculties</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Average Attendance</h3>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-3xl font-bold">{stats.averageAttendance}%</p>
          <p className="text-sm text-gray-500 mt-1">This week</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Violations</h3>
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-3xl font-bold text-red-600">{stats.violationCount}</p>
          <p className="text-sm text-gray-500 mt-1">This week</p>
        </Card>
      </div>

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Trend */}
        <Card className="p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Attendance Trend</h3>
          <div className="flex items-end justify-between h-40">
            {attendanceTrend.map((day, index) => (
              <div key={index} className="flex flex-col items-center flex-1">
                <div 
                  className="w-full bg-blue-500 rounded-t transition-all duration-300"
                  style={{ height: `${day.rate}%` }}
                />
                <span className="text-xs text-gray-500 mt-2">{day.day}</span>
                <span className="text-xs font-medium">{day.rate}%</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0">
                <div className="w-2 h-2 mt-2 rounded-full bg-blue-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                  <p className="text-xs text-gray-500">
                    {activity.user && `${activity.user} (${activity.role})`}
                    {activity.class && `${activity.class} - ${activity.faculty || activity.admin}`}
                    {activity.student && `Student: ${activity.student}`}
                  </p>
                </div>
                <span className="text-xs text-gray-400">{activity.time}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
