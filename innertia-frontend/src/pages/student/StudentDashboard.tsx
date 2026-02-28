import { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/ui/PageHeader';
import { Section } from '../../components/ui/Section';
import { 
  Play, 
  Clock, 
  Calendar,
  ArrowRight,
  FileText,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { studentApiService, StudentSession } from '../../services/studentApi';
import { useNavigate } from 'react-router-dom';

export const StudentDashboard = () => {
  const navigate = useNavigate();
  const [activeSession, setActiveSession] = useState<StudentSession | null>(null);
  const [recentSessions, setRecentSessions] = useState<StudentSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch dashboard for active session
        const dashboardData = await studentApiService.getDashboard();
        setActiveSession(dashboardData.active_session);
        
        // Fetch all sessions for recent list
        const sessionsData = await studentApiService.getSessions();
        setRecentSessions(sessionsData.slice(0, 5)); // Limit to 5 most recent
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

  // Handle join session
  const handleJoinSession = async (sessionId: string) => {
    try {
      await studentApiService.joinSession(sessionId);
      navigate('/student/session');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to join session');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#0071e3]" />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Your Learning Environment"
        subtitle="Join sessions and access your learning materials."
      />

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 text-red-600 rounded-xl mb-12">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Active Session */}
      {activeSession && (
        <Card className="p-6 lg:p-8 bg-white rounded-2xl border-0 shadow-sm hover:shadow-md transition-shadow duration-200 mb-12">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-full bg-green-500 flex items-center justify-center">
                <Play className="w-6 h-6 text-white ml-1" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-600 mb-1">Session In Progress</p>
                <h2 className="text-xl font-semibold text-[#1d1d1f]">{activeSession.class_name}</h2>
                <p className="text-sm text-[#86868b] mt-1">
                  Started at {new Date(activeSession.started_at).toLocaleTimeString()}
                </p>
              </div>
            </div>
            <Button 
              className="h-12 px-6 rounded-xl text-base font-medium bg-green-500 hover:bg-green-600"
              onClick={() => navigate('/student/session')}
            >
              Join Session
            </Button>
          </div>
        </Card>
      )}

      {/* Recent Sessions */}
      <Section title="Recent Sessions">
        {recentSessions.length === 0 ? (
          <Card className="p-12 rounded-2xl text-center">
            <Calendar className="w-16 h-16 text-[#d2d2d7] mx-auto mb-4" />
            <p className="text-lg text-[#86868b]">No recent sessions found.</p>
          </Card>
        ) : (
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
            <div className="divide-y divide-[#f5f5f7]">
              {recentSessions.map((session) => (
                <div 
                  key={session.id} 
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-5 hover:bg-[#f5f5f7]/50 transition-colors duration-200 gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#f5f5f7] flex items-center justify-center">
                      {session.status === 'completed' ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : session.status === 'in_progress' ? (
                        <Clock className="w-5 h-5 text-yellow-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-[#1d1d1f]">{session.class_name}</p>
                      <p className="text-sm text-[#86868b]">{formatDate(session.started_at)}</p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4 sm:gap-6">
                    <div className="text-right">
                      <p className={`font-medium ${
                        session.status === 'completed' 
                          ? 'text-green-600' 
                          : session.status === 'in_progress'
                          ? 'text-yellow-600'
                          : 'text-gray-600'
                      }`}>
                        {session.status === 'completed' 
                          ? 'Completed' 
                          : session.status === 'in_progress'
                          ? 'In Progress'
                          : 'Scheduled'}
                      </p>
                      <p className="text-sm text-[#86868b]">status</p>
                    </div>
                    {session.status === 'in_progress' && (
                      <Button 
                        size="sm" 
                        className="h-10 px-4 rounded-lg"
                        onClick={() => handleJoinSession(session.id)}
                      >
                        Join
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="p-2">
                      <ArrowRight className="w-4 h-4 text-[#86868b]" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Section>
    </>
  );
};

export default StudentDashboard;
