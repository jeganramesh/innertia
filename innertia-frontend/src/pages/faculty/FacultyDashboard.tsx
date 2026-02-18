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
import { FacultyClass, FacultySession, FacultyStats } from './types';
import { useNavigate } from 'react-router-dom';

// Mock data
const mockStats: FacultyStats = {
  totalClasses: 5,
  activeClasses: 3,
  totalSessions: 42,
  totalStudents: 156,
  averageAttendance: 89
};

const mockClasses: FacultyClass[] = [
  { id: '1', name: 'Introduction to Programming', code: 'CS101', studentCount: 45, sessionCount: 15, lastSession: '2024-02-17', status: 'active' },
  { id: '2', name: 'Data Structures', code: 'CS201', studentCount: 38, sessionCount: 12, lastSession: '2024-02-16', status: 'active' },
  { id: '3', name: 'Web Development', code: 'CS301', studentCount: 32, sessionCount: 8, lastSession: '2024-02-15', status: 'active' },
  { id: '4', name: 'Algorithm Design', code: 'CS401', studentCount: 28, sessionCount: 5, lastSession: '2024-02-14', status: 'active' },
  { id: '5', name: 'Machine Learning', code: 'CS501', studentCount: 25, sessionCount: 2, lastSession: '2024-02-10', status: 'archived' },
];

const mockActiveSession: FacultySession | null = {
  id: 'sess-1',
  classId: '1',
  className: 'CS101 - Introduction to Programming',
  startTime: new Date().toISOString(),
  status: 'active',
  attendeeCount: 42,
  syncedCount: 40,
  focusPercentage: 87,
  violationCount: 3,
  currentSlide: 15,
  totalSlides: 45,
  slideLocked: true
};

export const FacultyDashboard = () => {
  const navigate = useNavigate();
  const [stats] = useState<FacultyStats>(mockStats);
  const [classes] = useState<FacultyClass[]>(mockClasses);
  const [activeSession, setActiveSession] = useState<FacultySession | null>(mockActiveSession);

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
