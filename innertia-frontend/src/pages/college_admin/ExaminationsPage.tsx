/**
 * Examinations Page
 * Manage and view all examinations for the college
 */

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { PageHeader } from '../../components/ui/PageHeader';
import { useAuth } from '../../hooks/useAuth';
import { 
  FileText, 
  Calendar,
  CheckCircle,
  Clock,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

interface Exam {
  id: string;
  title: string;
  subject: string;
  date: string;
  duration: number;
  total_marks: number;
  status: 'pending' | 'scheduled' | 'ongoing' | 'completed';
  enrolled_students: number;
  submitted_count: number;
}

export const ExaminationsPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'scheduled' | 'pending' | 'completed'>('scheduled');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Placeholder data - to be replaced with API call
  const [pendingExams, setPendingExams] = useState<Exam[]>([
    {
      id: '1',
      title: 'Draft - Mid-term Examination',
      subject: 'Mathematics',
      date: '2026-03-15T10:00:00',
      duration: 120,
      total_marks: 100,
      status: 'pending',
      enrolled_students: 0,
      submitted_count: 0
    }
  ]);

  const [scheduledExams, setScheduledExams] = useState<Exam[]>([
    {
      id: '2',
      title: 'Mid-term Examination',
      subject: 'Mathematics',
      date: '2026-03-15T10:00:00',
      duration: 120,
      total_marks: 100,
      status: 'scheduled',
      enrolled_students: 45,
      submitted_count: 0
    },
    {
      id: '3',
      title: 'Quiz 1',
      subject: 'Physics',
      date: '2026-03-10T14:00:00',
      duration: 60,
      total_marks: 50,
      status: 'scheduled',
      enrolled_students: 38,
      submitted_count: 0
    }
  ]);

  const [completedExams, setCompletedExams] = useState<Exam[]>([
    {
      id: '4',
      title: 'Final Examination',
      subject: 'Chemistry',
      date: '2026-02-28T09:00:00',
      duration: 180,
      total_marks: 100,
      status: 'completed',
      enrolled_students: 42,
      submitted_count: 40
    }
  ]);

  const filteredPending = pendingExams.filter(exam =>
    exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exam.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredScheduled = scheduledExams.filter(exam =>
    exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exam.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCompleted = completedExams.filter(exam =>
    exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exam.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Examinations"
        subtitle="Manage and monitor all examinations"
      />

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-indigo-700 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Total Exams
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-indigo-900">
              {pendingExams.length + scheduledExams.length + completedExams.length}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-700 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-900">{pendingExams.length}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Scheduled
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900">{scheduledExams.length}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-emerald-700 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-900">{completedExams.length}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-700 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-900">
              {scheduledExams.filter(e => new Date(e.date).getMonth() === new Date().getMonth()).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex gap-2">
          <Button
            variant={activeTab === 'pending' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('pending')}
            className="flex items-center gap-2"
          >
            <Clock className="w-4 h-4" />
            Pending ({pendingExams.length})
          </Button>
          <Button
            variant={activeTab === 'scheduled' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('scheduled')}
            className="flex items-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            Scheduled ({scheduledExams.length})
          </Button>
          <Button
            variant={activeTab === 'completed' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('completed')}
            className="flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Completed ({completedExams.length})
          </Button>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search exams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Exam
          </Button>
        </div>
      </div>

      {/* Exams List */}
      <div className="space-y-4">
        {activeTab === 'pending' ? (
          filteredPending.length > 0 ? (
            filteredPending.map((exam) => (
              <Card key={exam.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{exam.title}</h3>
                        <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full">
                          Pending
                        </span>
                      </div>
                      <p className="text-gray-600 mb-4">{exam.subject}</p>
                      
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(exam.date)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {exam.duration} mins
                        </div>
                        <div className="flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          {exam.total_marks} marks
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <Button variant="outline" size="sm">
                        Edit Draft
                      </Button>
                      <Button variant="outline" size="sm">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No Pending Exams</h3>
              <p className="text-gray-500">Draft examinations will appear here</p>
            </div>
          )
        ) : activeTab === 'scheduled' ? (
          filteredScheduled.length > 0 ? (
            filteredScheduled.map((exam) => (
              <Card key={exam.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{exam.title}</h3>
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                          Scheduled
                        </span>
                      </div>
                      <p className="text-gray-600 mb-4">{exam.subject}</p>
                      
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(exam.date)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {exam.duration} mins
                        </div>
                        <div className="flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          {exam.total_marks} marks
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{exam.enrolled_students}</div>
                        <div className="text-xs text-gray-500">Enrolled</div>
                      </div>
                      <Button variant="outline" size="sm">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No Scheduled Exams</h3>
              <p className="text-gray-500">Create your first examination to get started</p>
            </div>
          )
        ) : (
          filteredCompleted.length > 0 ? (
            filteredCompleted.map((exam) => (
              <Card key={exam.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{exam.title}</h3>
                        <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full">
                          Completed
                        </span>
                      </div>
                      <p className="text-gray-600 mb-4">{exam.subject}</p>
                      
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(exam.date)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {exam.duration} mins
                        </div>
                        <div className="flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          {exam.total_marks} marks
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-emerald-600">{exam.submitted_count}</div>
                        <div className="text-xs text-gray-500">Submitted</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{exam.enrolled_students}</div>
                        <div className="text-xs text-gray-500">Total</div>
                      </div>
                      <Button variant="outline" size="sm">
                        View Results
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No Completed Exams</h3>
              <p className="text-gray-500">Completed examinations will appear here</p>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default ExaminationsPage;
