/**
 * Exams Management Page
 * 
 * College Admin page for managing exams.
 * Follows Apple-style aesthetic: clean, minimalist, generous whitespace.
 */

import { useState, useEffect } from 'react';
import { examApiService, examTemplateApi, Exam, ExamTemplate } from '../api/examApi';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';
import ExamFormBuilder from './ExamFormBuilder';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  EyeIcon,
  PlayIcon,
  XCircleIcon,
  ClockIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';

const ExamsPage = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [templates, setTemplates] = useState<ExamTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [editingExamId, setEditingExamId] = useState<string | null>(null);

  useEffect(() => {
    loadExams();
    loadTemplates();
  }, []);

  const loadExams = async () => {
    try {
      setLoading(true);
      const params = filterStatus ? { status: filterStatus } : {};
      const response = await examApiService.listExams(params);
      setExams(response.items || []);
    } catch (error) {
      console.error('Failed to load exams:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const response = await examTemplateApi.listTemplates();
      setTemplates(response || []);
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  const handlePublish = async (examId: string) => {
    try {
      await examApiService.publishExam(examId);
      loadExams();
    } catch (error) {
      console.error('Failed to publish exam:', error);
    }
  };

  const handleCancel = async (examId: string) => {
    try {
      await examApiService.cancelExam(examId);
      loadExams();
    } catch (error) {
      console.error('Failed to cancel exam:', error);
    }
  };

  const handleDelete = async (examId: string) => {
    if (!confirm('Are you sure you want to delete this exam? This action cannot be undone.')) {
      return;
    }
    try {
      await examApiService.deleteExam(examId);
      loadExams();
    } catch (error) {
      console.error('Failed to delete exam:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-700';
      case 'scheduled':
        return 'bg-blue-100 text-blue-700';
      case 'ongoing':
        return 'bg-green-100 text-green-700';
      case 'completed':
        return 'bg-purple-100 text-purple-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Examinations"
        subtitle="Manage exams, assessments, and proctoring settings"
      >
        <Button
          variant="primary"
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          Create Exam
        </Button>
      </PageHeader>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Filters */}
        <div className="mb-6 flex gap-3">
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              loadExams();
            }}
            className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Exam List */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : exams.length === 0 ? (
          <Card className="p-12 text-center">
            <AcademicCapIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No exams found</h3>
            <p className="text-gray-500 mb-6">Create your first exam to get started</p>
            <Button variant="primary" onClick={() => setShowCreateModal(true)}>
              Create Exam
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4">
            {exams.map((exam) => (
              <Card key={exam.id} className="p-6 hover:shadow-lg transition-shadow duration-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {exam.title}
                      </h3>
                      <Badge className={getStatusColor(exam.status)}>
                        {exam.status.charAt(0).toUpperCase() + exam.status.slice(1)}
                      </Badge>
                      <Badge className="bg-gray-100 text-gray-700">
                        {exam.exam_type.charAt(0).toUpperCase() + exam.exam_type.slice(1)}
                      </Badge>
                    </div>
                    
                    {exam.description && (
                      <p className="text-gray-600 mb-4 line-clamp-2">
                        {exam.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-6 text-sm text-gray-500">
                      {exam.duration_minutes && (
                        <span className="flex items-center gap-1">
                          <ClockIcon className="w-4 h-4" />
                          {exam.duration_minutes} min
                        </span>
                      )}
                      {exam.total_marks && (
                        <span>Total: {exam.total_marks} marks</span>
                      )}
                      {exam.passing_marks && (
                        <span>Pass: {exam.passing_marks} marks</span>
                      )}
                      {exam.scheduled_at && (
                        <span className="flex items-center gap-1">
                          <ClockIcon className="w-4 h-4" />
                          {new Date(exam.scheduled_at).toLocaleString()}
                        </span>
                      )}
                      <span>{exam.question_count} questions</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedExam(exam)}
                      className="p-2"
                    >
                      <EyeIcon className="w-5 h-5 text-gray-500" />
                    </Button>
                    
                    {exam.status === 'draft' && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-2"
                          onClick={() => setEditingExamId(exam.id)}
                        >
                          <PencilIcon className="w-5 h-5 text-gray-500" />
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handlePublish(exam.id)}
                          className="flex items-center gap-1"
                        >
                          <PlayIcon className="w-4 h-4" />
                          Publish
                        </Button>
                      </>
                    )}
                    
                    {(exam.status === 'draft' || exam.status === 'scheduled') && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCancel(exam.id)}
                        className="p-2"
                      >
                        <XCircleIcon className="w-5 h-5 text-red-500" />
                      </Button>
                    )}

                    {exam.status === 'draft' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(exam.id)}
                        className="p-2"
                      >
                        <TrashIcon className="w-5 h-5 text-red-500" />
                      </Button>
                    )}
                  </div>
                </div>
                
                {exam.proctoring_config && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-500">Proctoring:</span>
                      {exam.proctoring_config.fullscreen_mandatory && (
                        <Badge className="bg-orange-100 text-orange-700">Fullscreen</Badge>
                      )}
                      {exam.proctoring_config.face_detection_required && (
                        <Badge className="bg-blue-100 text-blue-700">Face Detection</Badge>
                      )}
                      {exam.proctoring_config.tab_switch_limit > 0 && (
                        <Badge className="bg-purple-100 text-purple-700">
                          Tab Switch: {exam.proctoring_config.tab_switch_limit}
                        </Badge>
                      )}
                      {exam.proctoring_config.phone_detection && (
                        <Badge className="bg-red-100 text-red-700">Phone Detection</Badge>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Exam Modal with Form Builder */}
      {(showCreateModal || editingExamId) && (
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
          <ExamFormBuilder
            examId={editingExamId || undefined}
            onSave={(examId) => {
              setShowCreateModal(false);
              setEditingExamId(null);
              loadExams();
            }}
            onCancel={() => {
              setShowCreateModal(false);
              setEditingExamId(null);
            }}
          />
        </div>
      )}

      {/* View Exam Modal */}
      {selectedExam && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-gray-900">{selectedExam.title}</h2>
                <Button variant="ghost" onClick={() => setSelectedExam(null)}>
                  <XCircleIcon className="w-6 h-6" />
                </Button>
              </div>
            </div>
            <div className="p-6">
              <p className="text-gray-500 mb-4">{selectedExam.description || 'No description'}</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Type:</span> {selectedExam.exam_type}
                </div>
                <div>
                  <span className="text-gray-500">Status:</span> {selectedExam.status}
                </div>
                <div>
                  <span className="text-gray-500">Duration:</span> {selectedExam.duration_minutes} min
                </div>
                <div>
                  <span className="text-gray-500">Total Marks:</span> {selectedExam.total_marks}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ExamsPage;
