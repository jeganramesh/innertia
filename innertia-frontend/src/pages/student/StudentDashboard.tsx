import { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { 
  BookOpen, 
  Users, 
  Play, 
  Clock, 
  TrendingUp,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Download,
  ChevronRight
} from 'lucide-react';
import { studentApiService, StudentDashboard as StudentDashboardType } from '../../services/studentApi';
import { useNavigate } from 'react-router-dom';

// Transform API response to component format
const transformDashboard = (apiData: StudentDashboardType) => ({
  stats: {
    totalClasses: apiData.total_classes,
    sessionsAttended: 0, // Would need separate calculation
    sessionsMissed: 0,
    averageAttendance: 0
  },
  activeSession: apiData.active_session ? {
    id: apiData.active_session.id,
    classId: apiData.active_session.class_id,
    className: apiData.active_session.class_name,
    facultyName: '',
    startTime: apiData.active_session.started_at,
    status: apiData.active_session.is_active ? 'active' : 'completed'
  } : null,
  classes: [], // Would need separate API call for enrolled classes
  recentNotes: apiData.recent_notes || []
});

export const StudentDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalClasses: 0,
    sessionsAttended: 0,
    sessionsMissed: 0,
    averageAttendance: 0
  });
  const [activeSession, setActiveSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setIsLoading(true);
        const data = await studentApiService.getDashboard();
        const transformed = transformDashboard(data);
        setStats(transformed.stats);
        setActiveSession(transformed.activeSession);
      } catch (error) {
        console.error('Failed to fetch dashboard:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const statCards = [
    { title: 'Enrolled Classes', value: stats.totalClasses, icon: BookOpen, color: 'bg-blue-500' },
    { title: 'Sessions Attended', value: stats.sessionsAttended, icon: CheckCircle, color: 'bg-green-500' },
    { title: 'Sessions Missed', value: stats.sessionsMissed, icon: XCircle, color: 'bg-red-500' },
    { title: 'Avg Attendance', value: `${stats.averageAttendance}%`, icon: TrendingUp, color: 'bg-purple-500' },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'absent':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'late':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Student Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back! Here's your learning overview</p>
        </div>
      </div>

      {/* Active Session Alert */}
      {activeSession && (
        <Card className="p-5 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500 rounded-full animate-pulse">
                <Play className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-green-700 font-medium">Session In Progress</p>
                <h3 className="text-lg font-bold text-gray-900">{activeSession.className}</h3>
                <p className="text-sm text-gray-600">{activeSession.facultyName}</p>
              </div>
            </div>
            <Button 
              className="bg-green-500 hover:bg-green-600"
              onClick={() => navigate('/student/session')}
            >
              Join Session
            </Button>
          </div>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <Card key={index} className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.title}</p>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* My Classes */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">My Classes</h2>
          <Button variant="ghost" size="sm" onClick={() => navigate('/student/classes')}>
            View All <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {classes.slice(0, 4).map((cls) => (
            <Card key={cls.id} className="p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{cls.name}</h3>
                  <p className="text-sm text-gray-500">{cls.code}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>{cls.facultyName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{cls.schedule}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Attendance History */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Attendance</h2>
          <Button variant="ghost" size="sm">
            View All <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
        <div className="space-y-3">
          {mockAttendanceHistory.map((record) => (
            <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon(record.status)}
                <div>
                  <p className="font-medium text-gray-900">{record.className}</p>
                  <p className="text-sm text-gray-500">{new Date(record.date).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="text-right">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  record.status === 'present' ? 'bg-green-100 text-green-700' :
                  record.status === 'absent' ? 'bg-red-100 text-red-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                </span>
                <p className="text-xs text-gray-500 mt-1">{record.percentage}% focus</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default StudentDashboard;
