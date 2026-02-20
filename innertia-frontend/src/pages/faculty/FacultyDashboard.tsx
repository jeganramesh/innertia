import { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { 
  BookOpen, 
  Users, 
  Play, 
  Clock, 
  TrendingUp,
  FileText,
  Calendar,
  ArrowRight,
  Plus
} from 'lucide-react';
import { facultyApiService, FacultyDashboard as FacultyDashboardType } from '../../services/facultyApi';
import { useNavigate } from 'react-router-dom';

// Transform API response to component format
const transformDashboard = (apiData: FacultyDashboardType) => ({
  stats: {
    totalClasses: apiData.total_classes,
    totalStudents: apiData.total_students,
    activeClasses: apiData.active_session ? 1 : 0,
    totalSessions: apiData.recent_sessions?.length || 0,
    averageAttendance: 0 // Would need calculation
  },
  activeSession: apiData.active_session ? {
    id: apiData.active_session.id,
    classId: apiData.active_session.class_id,
    className: `Class ${apiData.active_session.class_id}`,
    startTime: apiData.active_session.started_at,
    status: apiData.active_session.is_active ? 'active' : 'completed',
    attendeeCount: 0, // Would need calculation
    syncedCount: 0,
    focusPercentage: 0,
    violationCount: 0,
    currentSlide: 0,
    totalSlides: 0,
    slideLocked: false
  } : null,
  classes: [] // Would need separate API call
});

export const FacultyDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalClasses: 0,
    activeClasses: 0,
    totalSessions: 0,
    totalStudents: 0,
    averageAttendance: 0
  });
  const [activeSession, setActiveSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setIsLoading(true);
        const data = await facultyApiService.getDashboard();
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
    { title: 'Total Classes', value: stats.totalClasses, icon: BookOpen, color: 'bg-blue-500' },
    { title: 'Active Classes', value: stats.activeClasses, icon: Users, color: 'bg-green-500' },
    { title: 'Total Sessions', value: stats.totalSessions, icon: Play, color: 'bg-purple-500' },
    { title: 'Avg Attendance', value: `${stats.averageAttendance}%`, icon: TrendingUp, color: 'bg-orange-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Faculty Dashboard</h1>
          <p className="text-gray-500 mt-1">Manage your classes and sessions</p>
        </div>
        <div className="flex gap-3">
          <Button className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Class
          </Button>
        </div>
      </div>

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

      {/* Active Session Alert */}
      {activeSession && (
        <Card className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500 rounded-full">
                <Play className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-green-700 font-medium">Session In Progress</p>
                <h3 className="text-lg font-bold text-gray-900">{activeSession.className}</h3>
                <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {activeSession.attendeeCount} students
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Slide {activeSession.currentSlide}/{activeSession.totalSlides}
                  </span>
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    {activeSession.focusPercentage}% focus
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
                onClick={() => navigate('/faculty/session')}
              >
                Manage Session
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Classes Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Your Classes</h2>
          <Button variant="ghost" size="sm" onClick={() => navigate('/faculty/classes')}>
            View All <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.filter(c => c.status === 'active').slice(0, 3).map((cls) => (
            <Card key={cls.id} className="p-5 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/faculty/classes')}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{cls.name}</h3>
                  <p className="text-sm text-gray-500">{cls.code}</p>
                </div>
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                  Active
                </span>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>{cls.studentCount} students</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span>{cls.sessionCount} sessions</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Last: {cls.lastSession}</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t">
                <Button className="w-full" size="sm">
                  Start Session
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Sessions */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Sessions</h2>
          <Button variant="ghost" size="sm">
            View All <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
        <div className="space-y-3">
          {[
            { class: 'CS101 - Introduction to Programming', date: '2024-02-17', attendance: 95, duration: '90 min' },
            { class: 'CS201 - Data Structures', date: '2024-02-16', attendance: 92, duration: '75 min' },
            { class: 'CS301 - Web Development', date: '2024-02-15', attendance: 88, duration: '60 min' },
          ].map((session, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">{session.class}</p>
                <p className="text-sm text-gray-500">{session.date}</p>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-900">{session.attendance}% attendance</p>
                <p className="text-sm text-gray-500">{session.duration}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default FacultyDashboard;
