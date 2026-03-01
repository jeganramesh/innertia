/**
 * College Sessions Page
 * View and monitor sessions across all classes in the college
 */

import { useEffect, useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/Dialog';
import { 
  Loader2,
  Search,
  Video,
  Calendar,
  User,
  Users,
  Activity,
  Clock,
  BookOpen
} from 'lucide-react';

interface SessionItem {
  id: string;
  class_id: string;
  class_name: string;
  faculty_id: string | null;
  faculty_name: string;
  start_time: string | null;
  end_time: string | null;
  is_active: boolean;
  created_at: string;
  attendance_count: number;
  total_enrolled: number;
  attendance_rate: number;
}

interface SessionDetail {
  id: string;
  class_id: string;
  class_name: string;
  faculty_id: string | null;
  faculty_name: string;
  faculty_email: string | null;
  start_time: string | null;
  end_time: string | null;
  is_active: boolean;
  created_at: string;
  metrics: {
    total_enrolled: number;
    active_students: number;
    total_activities: number;
    attendance_rate: number;
  };
}

export const CollegeSessionsPage = () => {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<SessionDetail | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  
  // Filters
  const [classFilter, setClassFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [page, setPage] = useState(1);

  // Fetch sessions
  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      });
      if (classFilter !== 'all') params.append('class_id', classFilter);
      if (dateFilter) params.append('start_date', dateFilter);
      
      const response = await fetch(`/api/v1/college-admin/sessions?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSessions(data.items || []);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  }, [page, classFilter, dateFilter]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const openSessionDetail = async (sessionId: string) => {
    try {
      setDetailLoading(true);
      const token = localStorage.getItem('access_token');
      const response = await fetch(`/api/v1/college-admin/sessions/${sessionId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data: SessionDetail = await response.json();
        setSelectedSession(data);
        setShowDetailModal(true);
      }
    } catch (error) {
      console.error('Error fetching session detail:', error);
    } finally {
      setDetailLoading(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString();
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleTimeString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sessions</h1>
          <p className="text-gray-600">Monitor all sessions in your college</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}
                  className="pl-10"
                  placeholder="Filter by date"
                />
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={() => { setClassFilter('all'); setDateFilter(''); setPage(1); }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sessions List - Card Layout */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : sessions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Video className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No sessions found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {sessions.map((session) => (
            <Card 
              key={session.id} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => openSessionDetail(session.id)}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${session.is_active ? 'bg-green-100' : 'bg-gray-100'}`}>
                      <Video className={`w-6 h-6 ${session.is_active ? 'text-green-600' : 'text-gray-500'}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{session.class_name}</h3>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {session.faculty_name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatTime(session.start_time)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                      session.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {session.is_active ? 'Live' : 'Ended'}
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {session.attendance_count}/{session.total_enrolled}
                    </span>
                    </div>
                  </div>
                </div>
                
                {/* Attendance Bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Attendance</span>
                    <span className="font-medium">{session.attendance_rate}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${session.attendance_rate}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {sessions.length > 0 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600">Page {page}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => p + 1)}
            disabled={sessions.length < 20}
          >
            Next
          </Button>
        </div>
      )}

      {/* Session Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Session Details</DialogTitle>
          </DialogHeader>
          
          {detailLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : selectedSession && (
            <div className="space-y-4">
              {/* Class & Faculty */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <BookOpen className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="font-medium">{selectedSession.class_name}</p>
                    <p className="text-sm text-gray-500">{selectedSession.faculty_name}</p>
                    <p className="text-xs text-gray-400">{selectedSession.faculty_email}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-sm">
                  <span className={`px-2 py-1 rounded-full ${
                    selectedSession.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedSession.is_active ? 'Live' : 'Ended'}
                  </span>
                  <span className="text-gray-600">
                    {formatDate(selectedSession.start_time)}
                  </span>
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <Users className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-blue-900">
                    {selectedSession.metrics.active_students}
                  </p>
                  <p className="text-sm text-blue-600">Active Students</p>
                </div>
                
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <Activity className="w-6 h-6 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-900">
                    {selectedSession.metrics.attendance_rate}%
                  </p>
                  <p className="text-sm text-green-600">Attendance Rate</p>
                </div>
              </div>

              {/* Additional Stats */}
              <div className="grid grid-cols-3 gap-2 text-center text-sm">
                <div className="bg-gray-50 rounded p-2">
                  <p className="font-medium">{selectedSession.metrics.total_enrolled}</p>
                  <p className="text-gray-500">Enrolled</p>
                </div>
                <div className="bg-gray-50 rounded p-2">
                  <p className="font-medium">{selectedSession.metrics.total_activities}</p>
                  <p className="text-gray-500">Activities</p>
                </div>
                <div className="bg-gray-50 rounded p-2">
                  <p className="font-medium">{selectedSession.metrics.active_students || 0}</p>
                  <p className="text-gray-500">Participated</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CollegeSessionsPage;
