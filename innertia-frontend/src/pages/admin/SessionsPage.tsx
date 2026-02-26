import { useState, useEffect, useCallback } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { 
  Search, 
  Play, 
  Square, 
  Eye,
  Download,
  AlertTriangle,
  Clock,
  Users,
  FileText,
  Loader2,
  X
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/Dialog';
import { adminApiService, SessionMonitorOut } from '../../services/adminApi';

export const AdminSessionsPage = () => {
  const [sessions, setSessions] = useState<SessionMonitorOut[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [selectedSession, setSelectedSession] = useState<SessionMonitorOut | null>(null);
  
  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page,
        page_size: pageSize,
        is_active: statusFilter === 'active' ? true : statusFilter === 'completed' ? false : undefined
      };
      const response = await adminApiService.getSessions(params);
      setSessions(response.sessions);
      setTotal(response.total);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, statusFilter]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Calculate summary stats
  const activeCount = sessions.filter(s => s.is_active).length;
  const completedCount = sessions.filter(s => !s.is_active).length;
  const totalAttendees = sessions.reduce((sum, s) => sum + s.student_count, 0);

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
        <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
        Active
      </span>
    ) : (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#f5f5f7] text-[#86868b]">
        Completed
      </span>
    );
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return 'In Progress';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Page Header - Apple Style */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-semibold text-[#1d1d1f] tracking-tight">
            Session Oversight
          </h1>
          <p className="text-base text-[#86868b] mt-2 max-w-xl">
            Monitor and track all sessions across the institution in real-time.
          </p>
        </div>
        <Button variant="outline" className="flex items-center gap-2 h-11 px-5 rounded-xl">
          <Download className="w-4 h-4" />
          Export Report
        </Button>
      </div>

      {/* Active Sessions Summary - Apple Style */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 lg:p-6 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <Play className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-[13px] font-medium text-[#86868b] uppercase tracking-[0.5px]">Active Sessions</p>
              <p className="text-3xl font-semibold text-[#1d1d1f]">{activeCount}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-5 lg:p-6 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#f5f5f7] flex items-center justify-center">
              <FileText className="w-5 h-5 text-[#86868b]" />
            </div>
            <div>
              <p className="text-[13px] font-medium text-[#86868b] uppercase tracking-[0.5px]">Completed</p>
              <p className="text-3xl font-semibold text-[#1d1d1f]">{completedCount}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-5 lg:p-6 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#f5f5f7] flex items-center justify-center">
              <Users className="w-5 h-5 text-[#86868b]" />
            </div>
            <div>
              <p className="text-[13px] font-medium text-[#86868b] uppercase tracking-[0.5px]">Total Attendees</p>
              <p className="text-3xl font-semibold text-[#1d1d1f]">{totalAttendees}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 lg:p-6 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#f5f5f7] flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-[#86868b]" />
            </div>
            <div>
              <p className="text-[13px] font-medium text-[#86868b] uppercase tracking-[0.5px]">Total Sessions</p>
              <p className="text-3xl font-semibold text-[#1d1d1f]">{total}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 lg:p-5">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#86868b]" />
              <Input
                placeholder="Search by class or faculty..."
                className="pl-12 h-12 rounded-xl bg-[#f5f5f7] border-0 focus:bg-white"
              />
            </div>
          </div>
          <div className="flex gap-2">
            {(['all', 'active', 'completed'] as const).map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? 'primary' : 'outline'}
                size="sm"
                className="h-11 px-5 rounded-xl"
                onClick={() => setStatusFilter(status)}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Sessions List - Apple Style Card Layout */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white rounded-2xl p-12 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#86868b]" />
            <p className="text-[#86868b] mt-3">Loading sessions...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 flex flex-col items-center justify-center">
            <FileText className="w-12 h-12 text-[#d2d2d7]" />
            <p className="text-[#86868b] mt-3">No sessions found</p>
          </div>
        ) : (
          sessions.map((session) => (
            <div 
              key={session.id}
              className="bg-white rounded-2xl p-5 lg:p-6 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] cursor-pointer"
              onClick={() => setSelectedSession(session)}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getStatusBadge(session.is_active)}
                    {session.is_active && (
                      <span className="text-xs text-green-600 flex items-center gap-1">
                        <span className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></span>
                        Live
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-[#1d1d1f]">{session.class_name}</h3>
                  <p className="text-[#86868b] mt-1">{session.faculty_name}</p>
                </div>
                
                <div className="flex items-center gap-6 lg:gap-8">
                  <div className="flex items-center gap-2 text-[#86868b]">
                    <Clock className="w-4 h-4" />
                    <div>
                      <p className="text-sm font-medium text-[#1d1d1f]">{formatTime(session.started_at)}</p>
                      <p className="text-xs">{formatDate(session.started_at)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-[#86868b]">
                    <Users className="w-4 h-4" />
                    <span className="text-sm font-medium text-[#1d1d1f]">{session.student_count}</span>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-sm font-medium text-[#1d1d1f]">
                      {session.duration_minutes ? formatDuration(session.duration_minutes) : 'In Progress'}
                    </p>
                  </div>
                  
                  <Button variant="ghost" size="sm" className="w-10 h-10 rounded-xl">
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-10 rounded-xl"
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-[#86868b] px-4">
            Page {page} of {totalPages}
          </span>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-10 rounded-xl"
            disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {/* Session Detail Modal */}
      <Dialog open={!!selectedSession} onOpenChange={() => setSelectedSession(null)}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Session Details</DialogTitle>
          </DialogHeader>
          {selectedSession && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3 mb-4">
                {getStatusBadge(selectedSession.is_active)}
              </div>
              <h3 className="text-lg font-semibold">{selectedSession.class_name}</h3>
              <p className="text-[#86868b]">{selectedSession.faculty_name}</p>
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="bg-[#f5f5f7] rounded-xl p-4">
                  <p className="text-[13px] font-medium text-[#86868b] uppercase">Start Time</p>
                  <p className="text-lg font-semibold mt-1">{formatTime(selectedSession.started_at)}</p>
                  <p className="text-sm text-[#86868b]">{formatDate(selectedSession.started_at)}</p>
                </div>
                <div className="bg-[#f5f5f7] rounded-xl p-4">
                  <p className="text-[13px] font-medium text-[#86868b] uppercase">Duration</p>
                  <p className="text-lg font-semibold mt-1">
                    {selectedSession.duration_minutes ? formatDuration(selectedSession.duration_minutes) : 'In Progress'}
                  </p>
                </div>
                <div className="bg-[#f5f5f7] rounded-xl p-4">
                  <p className="text-[13px] font-medium text-[#86868b] uppercase">Enrolled</p>
                  <p className="text-lg font-semibold mt-1">{selectedSession.student_count}</p>
                </div>
                <div className="bg-[#f5f5f7] rounded-xl p-4">
                  <p className="text-[13px] font-medium text-[#86868b] uppercase">Status</p>
                  <p className="text-lg font-semibold mt-1">{selectedSession.is_active ? 'Active' : 'Completed'}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSessionsPage;
