/**
 * Assessments Page
 * College Admin - Manage and monitor all assessments
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
  Calendar,
  BookOpen,
  ClipboardList
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

// Types
interface Assessment {
  id: string;
  title: string;
  description: string | null;
  assessment_type: string;
  status: string;
  due_at: string | null;
  total_marks: number | null;
  created_at: string;
  question_count: number;
}

interface AssessmentStats {
  total: number;
  draft: number;
  published: number;
  closed: number;
}

type TabType = 'all' | 'draft' | 'published' | 'closed';

export default function CollegeAssessmentsPage() {
  const { user } = useAuth();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [stats, setStats] = useState<AssessmentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);

  // Fetch assessments
  useEffect(() => {
    if (user) {
      fetchAssessments();
      fetchStats();
    }
  }, [page, activeTab, search, user]);

  const fetchAssessments = async () => {
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
        `/api/v1/college-admin/assessments?college_id=${collegeId}&${params}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch assessments');

      const data = await response.json();
      setAssessments(data.items || []);
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
        `/api/v1/college-admin/dashboard/assessment-stats?college_id=${collegeId}`,
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
      console.error('Failed to fetch assessment stats:', err);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-700',
      published: 'bg-blue-100 text-blue-700',
      closed: 'bg-red-100 text-red-700',
    };
    
    const labels: Record<string, string> = {
      draft: 'Draft',
      published: 'Published',
      closed: 'Closed',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.draft}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getTypeBadge = (type: string) => {
    const styles: Record<string, string> = {
      quiz: 'bg-indigo-100 text-indigo-700',
      assignment: 'bg-amber-100 text-amber-700',
      lab: 'bg-emerald-100 text-emerald-700',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[type] || 'bg-gray-100 text-gray-700'}`}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </span>
    );
  };

  const tabs = [
    { key: 'all', label: 'All', count: stats?.total || 0 },
    { key: 'draft', label: 'Draft', count: stats?.draft || 0 },
    { key: 'published', label: 'Published', count: stats?.published || 0 },
    { key: 'closed', label: 'Closed', count: stats?.closed || 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Assessments</h1>
        <p className="text-gray-600 mt-1">Manage and monitor all assessments</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-teal-700 flex items-center gap-2">
              <ClipboardList className="w-4 h-4" />
              Total Assessments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-teal-900">{stats?.total || 0}</div>
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
            <div className="text-3xl font-bold text-amber-900">{(stats?.draft || 0) + (stats?.published || 0)}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-900">{stats?.closed || 0}</div>
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
            <div className="text-3xl font-bold text-purple-900">0</div>
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
            placeholder="Search assessments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Assessment
        </Button>
      </div>

      {/* Assessment List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      ) : assessments.length === 0 ? (
        <div className="text-center py-12">
          <ClipboardList className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No assessments found</h3>
          <p className="text-gray-500">Get started by creating your first assessment</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assessments.map((assessment) => (
            <Card key={assessment.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{assessment.title}</h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {assessment.description || 'No description'}
                    </p>
                  </div>
                  {getStatusBadge(assessment.status)}
                </div>

                <div className="flex items-center gap-2 mb-3">
                  {getTypeBadge(assessment.assessment_type)}
                  {assessment.question_count > 0 && (
                    <span className="text-xs text-gray-500">
                      {assessment.question_count} questions
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                  {assessment.due_at && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Due: {new Date(assessment.due_at).toLocaleDateString()}
                    </div>
                  )}
                  {assessment.total_marks && (
                    <div className="flex items-center gap-1">
                      <BookOpen className="w-3 h-3" />
                      {assessment.total_marks} marks
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                  <Button variant="outline" size="sm" className="flex-1">
                    <FileText className="w-3 h-3 mr-1" />
                    View
                  </Button>
                  {assessment.status === 'draft' && (
                    <Button variant="outline" size="sm" className="flex-1">
                      <FileText className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                  )}
                  {assessment.status === 'published' && (
                    <Button variant="outline" size="sm" className="flex-1">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Submissions
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

      {/* Create Assessment Modal - Placeholder */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">Create New Assessment</h2>
            <p className="text-gray-600 mb-4">Assessment creation form will be implemented</p>
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setShowModal(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
