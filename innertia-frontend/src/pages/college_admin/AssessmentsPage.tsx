/**
 * Assessments Page
 * Manage and view all assessments for the college
 */

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { PageHeader } from '../../components/ui/PageHeader';
import { useAuth } from '../../hooks/useAuth';
import { 
  Clipboard, 
  CheckCircle,
  Clock,
  Plus,
  Search,
  MoreVertical,
  Loader2,
  FileText,
  TrendingUp,
  Users
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

interface Assessment {
  id: string;
  title: string;
  type: 'quiz' | 'assignment' | 'project';
  subject: string;
  due_date: string;
  total_marks: number;
  status: 'pending' | 'submitted' | 'completed' | 'graded';
  assigned_students: number;
  submitted_count: number;
  graded_count: number;
}

export const AssessmentsPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'completed'>('all');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Placeholder data - to be replaced with API call
  const [assessments, setAssessments] = useState<Assessment[]>([
    {
      id: '1',
      title: 'Mathematics Quiz 1',
      type: 'quiz',
      subject: 'Mathematics',
      due_date: '2026-03-15T23:59:59',
      total_marks: 50,
      status: 'pending',
      assigned_students: 45,
      submitted_count: 0,
      graded_count: 0
    },
    {
      id: '2',
      title: 'Physics Lab Report',
      type: 'assignment',
      subject: 'Physics',
      due_date: '2026-03-10T23:59:59',
      total_marks: 100,
      status: 'submitted',
      assigned_students: 38,
      submitted_count: 35,
      graded_count: 0
    },
    {
      id: '3',
      title: 'Chemistry Project',
      type: 'project',
      subject: 'Chemistry',
      due_date: '2026-02-28T23:59:59',
      total_marks: 150,
      status: 'completed',
      assigned_students: 42,
      submitted_count: 40,
      graded_count: 40
    },
    {
      id: '4',
      title: 'Biology Assignment',
      type: 'assignment',
      subject: 'Biology',
      due_date: '2026-03-20T23:59:59',
      total_marks: 75,
      status: 'pending',
      assigned_students: 50,
      submitted_count: 0,
      graded_count: 0
    }
  ]);

  const filteredAssessments = assessments.filter(assessment => {
    const matchesSearch = assessment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         assessment.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' || assessment.status === activeTab;
    return matchesSearch && matchesTab;
  });

  const stats = {
    total: assessments.length,
    pending: assessments.filter(a => a.status === 'pending').length,
    completed: assessments.filter(a => a.status === 'completed' || a.status === 'graded').length
  };

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full">Pending</span>;
      case 'submitted':
        return <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">Submitted</span>;
      case 'completed':
        return <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full">Completed</span>;
      case 'graded':
        return <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">Graded</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">{status}</span>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'quiz':
        return <FileText className="w-4 h-4 text-blue-500" />;
      case 'assignment':
        return <Clipboard className="w-4 h-4 text-teal-500" />;
      case 'project':
        return <TrendingUp className="w-4 h-4 text-purple-500" />;
      default:
        return <Clipboard className="w-4 h-4 text-gray-500" />;
    }
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
        title="Assessments"
        subtitle="Manage and track all assessments"
      />

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-teal-700 flex items-center gap-2">
              <Clipboard className="w-4 h-4" />
              Total Assessments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-teal-900">{stats.total}</div>
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
            <div className="text-3xl font-bold text-amber-900">{stats.pending}</div>
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
            <div className="text-3xl font-bold text-emerald-900">{stats.completed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={activeTab === 'all' ? 'primary' : 'outline'}
          onClick={() => setActiveTab('all')}
          size="sm"
        >
          All ({stats.total})
        </Button>
        <Button
          variant={activeTab === 'pending' ? 'primary' : 'outline'}
          onClick={() => setActiveTab('pending')}
          size="sm"
        >
          Pending ({stats.pending})
        </Button>
        <Button
          variant={activeTab === 'completed' ? 'primary' : 'outline'}
          onClick={() => setActiveTab('completed')}
          size="sm"
        >
          Completed ({stats.completed})
        </Button>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative flex-1 sm:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search assessments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Assessment
        </Button>
      </div>

      {/* Assessments List */}
      <div className="space-y-4">
        {filteredAssessments.length > 0 ? (
          filteredAssessments.map((assessment) => (
            <Card key={assessment.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getTypeIcon(assessment.type)}
                      <h3 className="text-lg font-semibold text-gray-900">{assessment.title}</h3>
                      {getStatusBadge(assessment.status)}
                    </div>
                    <p className="text-gray-600 mb-4 capitalize">{assessment.subject} • {assessment.type}</p>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Due: {formatDate(assessment.due_date)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clipboard className="w-4 h-4" />
                        {assessment.total_marks} marks
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{assessment.assigned_students}</div>
                      <div className="text-xs text-gray-500">Assigned</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{assessment.submitted_count}</div>
                      <div className="text-xs text-gray-500">Submitted</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-emerald-600">{assessment.graded_count}</div>
                      <div className="text-xs text-gray-500">Graded</div>
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
            <Clipboard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No Assessments Found</h3>
            <p className="text-gray-500">Create your first assessment to get started</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssessmentsPage;
