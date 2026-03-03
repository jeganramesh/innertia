import { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/ui/PageHeader';
import { Section } from '../../components/ui/Section';
import { 
  Play, 
  Clock,
  Users,
  Calendar,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { facultyApiService, FacultyDashboard as FacultyDashboardType, ClassWithEnrollment } from '../../services/facultyApi';
import { useNavigate } from 'react-router-dom';

export const FacultyDashboard = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<FacultyDashboardType | null>(null);
  const [classes, setClasses] = useState<ClassWithEnrollment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch dashboard data
        const dashboard = await facultyApiService.getDashboard();
        setDashboardData(dashboard);
        
        // Fetch classes
        const classesData = await facultyApiService.getClasses();
        setClasses(classesData);
      } catch (err: any) {
        console.error('Failed to fetch dashboard:', err);
        setError(err.response?.data?.detail || 'Failed to load dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Format session time
  const formatSessionTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#0071e3]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 rounded-xl text-red-600">
        {error}
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Teaching Control Center"
        subtitle="Manage your classes and live sessions."
      />

      {/* Active Session */}
      {dashboardData?.active_session && (
        <Card className="p-6 lg:p-8 bg-white rounded-2xl border-0 shadow-sm mb-12">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-full bg-green-500 flex items-center justify-center">
                <Play className="w-6 h-6 text-white ml-1" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-600 mb-1">Session In Progress</p>
                <h2 className="text-xl font-semibold text-[#1d1d1f]">
                  Class ID: {dashboardData.active_session.class_id}
                </h2>
                <p className="text-sm text-[#86868b] mt-1">
                  Started at {formatSessionTime(dashboardData.active_session.started_at)}
                </p>
              </div>
            </div>
            <Button 
              className="h-12 px-6 rounded-xl text-base font-medium"
              onClick={() => navigate('/faculty/session')}
            >
              Manage Session
            </Button>
          </div>
        </Card>
      )}

      {/* Stats Summary */}
      <Section>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-[#f5f5f7] rounded-2xl p-5">
            <p className="text-3xl font-semibold text-[#1d1d1f]">{dashboardData?.stats?.total_classes || 0}</p>
            <p className="text-sm text-[#86868b] mt-1">Total Classes</p>
          </div>
          <div className="bg-[#f5f5f7] rounded-2xl p-5">
            <p className="text-3xl font-semibold text-[#1d1d1f]">{dashboardData?.stats?.total_students || 0}</p>
            <p className="text-sm text-[#86868b] mt-1">Total Students</p>
          </div>
          <div className="bg-[#f5f5f7] rounded-2xl p-5">
            <p className="text-3xl font-semibold text-[#1d1d1f]">{dashboardData?.recent_sessions?.length || 0}</p>
            <p className="text-sm text-[#86868b] mt-1">Recent Sessions</p>
          </div>
        </div>
      </Section>

      {/* Classes Section */}
      <Section 
        title="Your Classes" 
        action={
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/faculty/classes')}
            className="text-[#0071e3] hover:text-[#0077ed]"
          >
            View All <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        }
      >
        {classes.length === 0 ? (
          <Card className="p-8 rounded-2xl text-center">
            <p className="text-[#86868b]">No classes assigned yet.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {classes.slice(0, 6).map((cls) => (
              <Card 
                key={cls.id} 
                className="p-6 rounded-2xl border-0 shadow-sm hover:shadow-md transition-all duration-200"
              >
                <div className="mb-4">
                  <h3 className="font-semibold text-[#1d1d1f] text-lg line-clamp-1">{cls.name}</h3>
                  <p className="text-sm text-[#86868b]">{cls.description || 'No description'}</p>
                </div>
                <div className="flex items-center gap-4 text-sm text-[#86868b] mb-5">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-4 h-4" />
                    {cls.enrollment_count || 0}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    {formatDate(cls.created_at)}
                  </span>
                </div>
                <Button 
                  className="w-full h-11 rounded-xl" 
                  size="sm"
                  onClick={() => navigate('/faculty/session')}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start Session
                </Button>
              </Card>
            ))}
          </div>
        )}
      </Section>

      {/* Recent Sessions */}
      {dashboardData?.recent_sessions && dashboardData.recent_sessions.length > 0 && (
        <Section title="Recent Sessions">
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
            <div className="divide-y divide-[#f5f5f7]">
              {dashboardData.recent_sessions.slice(0, 5).map((session) => (
                <div 
                  key={session.id} 
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-5 hover:bg-[#f5f5f7]/50 transition-colors duration-200 gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#f5f5f7] flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-[#86868b]" />
                    </div>
                    <div>
                      <p className="font-medium text-[#1d1d1f]">Class: {session.class_id}</p>
                      <p className="text-sm text-[#86868b]">{formatDate(session.started_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 mt-4 sm:mt-0">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      session.is_active 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {session.is_active ? 'Active' : 'Completed'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Section>
      )}
    </>
  );
};

export default FacultyDashboard;
