import { useState } from 'react';
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
  FileText
} from 'lucide-react';
import { SessionOverviewItem } from './types';

// Mock data
const mockSessions: SessionOverviewItem[] = [
  { id: '1', className: 'CS101 - Introduction to Programming', facultyName: 'Dr. John Smith', startTime: '2024-02-18T09:00:00', status: 'active', attendeeCount: 42, attendanceRate: 93 },
  { id: '2', className: 'MATH301 - Advanced Mathematics', facultyName: 'Dr. Jane Doe', startTime: '2024-02-18T10:00:00', status: 'active', attendeeCount: 30, attendanceRate: 94 },
  { id: '3', className: 'ENG201 - English Composition', facultyName: 'Prof. Mary Johnson', startTime: '2024-02-18T11:00:00', status: 'completed', endTime: '2024-02-18T12:00:00', attendeeCount: 25, attendanceRate: 89 },
  { id: '4', className: 'PHYS101 - Physics I', facultyName: 'Dr. John Smith', startTime: '2024-02-17T14:00:00', status: 'completed', endTime: '2024-02-17T15:30:00', attendeeCount: 48, attendanceRate: 96 },
  { id: '5', className: 'CHEM201 - Organic Chemistry', facultyName: 'Dr. Sarah Lee', startTime: '2024-02-17T09:00:00', status: 'terminated', endTime: '2024-02-17T09:45:00', attendeeCount: 20, attendanceRate: 75 },
];

export const AdminSessionsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'terminated'>('all');

  const filteredSessions = mockSessions.filter(session => {
    const matchesSearch = session.className.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          session.facultyName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || session.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-100 text-green-700',
      completed: 'bg-blue-100 text-blue-700',
      terminated: 'bg-red-100 text-red-700'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDuration = (start: string, end?: string) => {
    if (!end) return 'In Progress';
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffMs = endDate.getTime() - startDate.getTime();
    const mins = Math.floor(diffMs / 60000);
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Session Oversight</h1>
          <p className="text-gray-500 mt-1">Monitor and manage all sessions across the platform</p>
        </div>
        <Button variant="outline" className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export Report
        </Button>
      </div>

      {/* Active Sessions Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500 rounded-lg">
              <Play className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-green-700">Active Sessions</p>
              <p className="text-2xl font-bold text-green-800">2</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500 rounded-lg">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Completed Today</p>
              <p className="text-2xl font-bold">1</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Terminated</p>
              <p className="text-2xl font-bold">1</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500 rounded-lg">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Attendees</p>
              <p className="text-2xl font-bold">165</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by class or faculty..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            {(['all', 'active', 'completed', 'terminated'] as const).map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(status)}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Sessions Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Faculty</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attendees</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attendance</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredSessions.map((session) => (
                <tr key={session.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{session.className}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {session.facultyName}
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(session.status)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      <div>
                        <p>{new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        <p className="text-xs text-gray-400">{formatDuration(session.startTime, session.endTime)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {session.attendeeCount}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`font-medium ${
                      session.attendanceRate >= 90 ? 'text-green-600' :
                      session.attendanceRate >= 75 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {session.attendanceRate}%
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" className="p-2">
                        <Eye className="w-4 h-4" />
                      </Button>
                      {session.status === 'active' && (
                        <Button variant="ghost" size="sm" className="p-2 text-red-600 hover:text-red-700">
                          <Square className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default AdminSessionsPage;
