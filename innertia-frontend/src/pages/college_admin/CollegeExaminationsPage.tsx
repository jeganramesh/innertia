/**
 * Examinations Page
 * College Admin - Manage and monitor all examinations
 * 
 * Features a Google Form-like exam builder for creating exams
 * with multiple question types, proctoring settings, and preview.
 */

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { 
  Search, 
  Plus, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle,
  MoreVertical,
  Edit,
  Eye,
  Trash2,
  Calendar,
  Timer,
  BookOpen,
  Play,
  GraduationCap
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { ExamFormBuilder } from '../../modules/examination';

// Types
interface Exam {
  id: string;
  title: string;
  description: string | null;
  exam_type: string;
  status: string;
  scheduled_at: string | null;
  duration_minutes: number | null;
  total_marks: number | null;
  passing_marks: number | null;
  created_at: string;
  question_count: number;
  max_attempts?: number;
  proctoring_config?: {
    fullscreen_mandatory?: boolean;
    face_detection_required?: boolean;
    tab_switch_limit?: number;
    phone_detection?: boolean;
  };
}

interface ExamStats {
  total: number;
  draft: number;
  scheduled: number;
  ongoing: number;
  completed: number;
  cancelled: number;
}

type TabType = 'all' | 'draft' | 'scheduled' | 'ongoing' | 'completed';

export default function CollegeExaminationsPage() {
  const { user } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [stats, setStats] = useState<ExamStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Form Builder States
  const [showFormBuilder, setShowFormBuilder] = useState(false);
  const [editingExamId, setEditingExamId] = useState<string | null>(null);
  const [viewingExam, setViewingExam] = useState<Exam | null>(null);

  // Fetch exams
  useEffect(() => {
    if (user) {
      fetchExams();
      fetchStats();
    }
  }, [page, activeTab, search, user]);

  const fetchExams = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const collegeId = (user as any)?.college_id;
      
      if (!collegeId) {
        setError('College ID not found');
        setLoading(false);
        return;
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });
      
      if (search) params.append('search', search);
      if (activeTab !== 'all') params.append('status', activeTab);

      const response = await fetch(
        `/api/v1/college-admin/exams?college_id=${collegeId}&${params}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch exams');

      const data = await response.json();
      setExams(data.items || []);
      setTotalPages(data.pages || 1);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const collegeId = (user as any)?.college_id;

      if (!collegeId) return;

      const response = await fetch(
        `/api/v1/college-admin/dashboard/exam-stats?college_id=${collegeId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch stats');

      const data = await response.json();
      setStats(data);
    } catch (err: any) {
      console.error('Failed to fetch exam stats:', err);
    }
  };

  const handlePublish = async (examId: string) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`/api/v1/college-admin/exams/${examId}/publish`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to publish exam');
      
      fetchExams();
      fetchStats();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCancel = async (examId: string) => {
    if (!confirm('Are you sure you want to cancel this exam?')) return;
    
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`/api/v1/college-admin/exams/${examId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to cancel exam');
      
      fetchExams();
      fetchStats();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (examId: string) => {
    if (!confirm('Are you sure you want to delete this exam? This action cannot be undone.')) return;
    
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`/api/v1/college-admin/exams/${examId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete exam');
      
      fetchExams();
      fetchStats();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleFormBuilderSave = (examId: string) => {
    setShowFormBuilder(false);
    setEditingExamId(null);
    fetchExams();
    fetchStats();
  };

  const handleFormBuilderCancel = () => {
    setShowFormBuilder(false);
    setEditingExamId(null);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-700',
      scheduled: 'bg-blue-100 text-blue-700',
      ongoing: 'bg-green-100 text-green-700',
      completed: 'bg-purple-100 text-purple-700',
      cancelled: 'bg-red-100 text-red-700',
    };
    
    const labels: Record<string, string> = {
      draft: 'Draft',
      scheduled: 'Scheduled',
      ongoing: 'Ongoing',
      completed: 'Completed',
      cancelled: 'Cancelled',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.draft}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getExamTypeBadge = (type: string) => {
    const styles: Record<string, string> = {
      quiz: 'bg-indigo-100 text-indigo-700',
      midterm: 'bg-amber-100 text-amber-700',
      final: 'bg-red-100 text-red-700',
      practical: 'bg-green-100 text-green-700',
      mcq: 'bg-indigo-100 text-indigo-700',
      coding: 'bg-amber-100 text-amber-700',
    };

    const labels: Record<string, string> = {
      quiz: 'Quiz',
      midterm: 'Midterm',
      final: 'Final',
      practical: 'Practical',
      mcq: 'MCQ',
      coding: 'Coding',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[type] || 'bg-gray-100 text-gray-700'}`}>
        {labels[type] || type}
      </span>
    );
  };

  const tabs = [
    { key: 'all', label: 'All', count: stats?.total || 0 },
    { key: 'draft', label: 'Draft', count: stats?.draft || 0 },
    { key: 'scheduled', label: 'Scheduled', count: stats?.scheduled || 0 },
    { key: 'ongoing', label: 'Ongoing', count: stats?.ongoing || 0 },
    { key: 'completed', label: 'Completed', count: stats?.completed || 0 },
  ];

  // Show Form Builder for create/edit
  if (showFormBuilder || editingExamId) {
    return (
      <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
        <ExamFormBuilder
          examId={editingExamId || undefined}
          onSave={handleFormBuilderSave}
          onCancel={handleFormBuilderCancel}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Examinations</h1>
        <p className="text-gray-600 mt-1">Create and manage exams with Google Form-like builder</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Total Exams
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900">{stats?.total || 0}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Draft
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats?.draft || 0}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-700 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Scheduled
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-900">{stats?.scheduled || 0}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700 flex items-center gap-2">
              <Play className="w-4 h-4" />
              Ongoing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-900">{stats?.ongoing || 0}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-700 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-900">{stats?.completed || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key as TabType);
                setPage(1);
              }}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                {tab.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Search and Actions */}
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search exams..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => setShowFormBuilder(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Exam
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
          <p className="text-red-700">{error}</p>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
            <XCircle className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Exam List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : exams.length === 0 ? (
        <Card className="p-12 text-center">
          <GraduationCap className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No exams found</h3>
          <p className="text-gray-500 mb-6">Create your first exam using our Google Form-like builder</p>
          <Button onClick={() => setShowFormBuilder(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Exam
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {exams.map((exam) => (
            <Card key={exam.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{exam.title}</h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {exam.description || 'No description'}
                    </p>
                  </div>
                  <div className="ml-2">
                    {getStatusBadge(exam.status)}
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  {getExamTypeBadge(exam.exam_type)}
                  {exam.question_count > 0 && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {exam.question_count} questions
                    </span>
                  )}
                  {exam.max_attempts && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {exam.max_attempts} attempt{exam.max_attempts > 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4 flex-wrap">
                  {exam.scheduled_at && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(exam.scheduled_at).toLocaleDateString()}
                    </div>
                  )}
                  {exam.duration_minutes && (
                    <div className="flex items-center gap-1">
                      <Timer className="w-3 h-3" />
                      {exam.duration_minutes} min
                    </div>
                  )}
                  {exam.total_marks && (
                    <div className="flex items-center gap-1">
                      <BookOpen className="w-3 h-3" />
                      {exam.total_marks} marks
                    </div>
                  )}
                </div>

                {/* Proctoring indicators */}
                {exam.proctoring_config && (
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    {exam.proctoring_config.face_detection_required && (
                      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                        Face Detection
                      </span>
                    )}
                    {exam.proctoring_config.fullscreen_mandatory && (
                      <span className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded">
                        Fullscreen
                      </span>
                    )}
                    {exam.proctoring_config.phone_detection && (
                      <span className="text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded">
                        Phone Detection
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => setViewingExam(exam)}
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    View
                  </Button>
                  
                  {exam.status === 'draft' && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => setEditingExamId(exam.id)}
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                  )}
                  
                  {exam.status === 'draft' && (
                    <Button 
                      variant="primary" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handlePublish(exam.id)}
                    >
                      <Play className="w-3 h-3 mr-1" />
                      Publish
                    </Button>
                  )}
                  
                  {(exam.status === 'scheduled' || exam.status === 'draft') && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleCancel(exam.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <XCircle className="w-4 h-4" />
                    </Button>
                  )}
                  
                  {exam.status === 'draft' && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDelete(exam.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* View Exam Modal */}
      {viewingExam && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">{viewingExam.title}</h2>
                  <p className="text-gray-500 mt-1">{viewingExam.description || 'No description'}</p>
                </div>
                <Button variant="ghost" onClick={() => setViewingExam(null)}>
                  <XCircle className="w-6 h-6" />
                </Button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-500 text-sm">Type</span>
                  <p className="font-medium">{viewingExam.exam_type}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-500 text-sm">Status</span>
                  <p className="font-medium">{viewingExam.status}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-500 text-sm">Duration</span>
                  <p className="font-medium">{viewingExam.duration_minutes || 'N/A'} min</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-500 text-sm">Total Marks</span>
                  <p className="font-medium">{viewingExam.total_marks || 'N/A'}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-500 text-sm">Passing Marks</span>
                  <p className="font-medium">{viewingExam.passing_marks || 'N/A'}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-500 text-sm">Questions</span>
                  <p className="font-medium">{viewingExam.question_count}</p>
                </div>
              </div>
              
              {viewingExam.scheduled_at && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <span className="text-blue-600 text-sm">Scheduled for</span>
                  <p className="font-medium text-blue-900">
                    {new Date(viewingExam.scheduled_at).toLocaleString()}
                  </p>
                </div>
              )}
              
              {viewingExam.proctoring_config && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Proctoring Settings</h4>
                  <div className="flex flex-wrap gap-2">
                    {viewingExam.proctoring_config.face_detection_required && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                        Face Detection
                      </span>
                    )}
                    {viewingExam.proctoring_config.fullscreen_mandatory && (
                      <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                        Fullscreen Required
                      </span>
                    )}
                    {viewingExam.proctoring_config.phone_detection && (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                        Phone Detection
                      </span>
                    )}
                    {viewingExam.proctoring_config.tab_switch_limit && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                        Tab Switch: {viewingExam.proctoring_config.tab_switch_limit}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setViewingExam(null)}>
                Close
              </Button>
              {viewingExam.status === 'draft' && (
                <Button onClick={() => {
                  setViewingExam(null);
                  setEditingExamId(viewingExam.id);
                }}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Exam
                </Button>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
