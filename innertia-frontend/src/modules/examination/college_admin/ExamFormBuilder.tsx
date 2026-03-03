/**
 * Exam Form Builder - Google Form-like Interface
 * 
 * A drag-and-drop exam creation interface similar to Google Forms.
 * Allows college admins to create exams with various question types.
 */

import { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  TrashIcon, 
  ChevronDownIcon,
  ChevronUpIcon,
  EyeIcon,
  DocumentArrowDownIcon,
  ClipboardDocumentListIcon,
  QuestionMarkCircleIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XMarkIcon,
  DocumentDuplicateIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { examApiService, Exam, ExamQuestion, ProctoringConfig } from '../api/examApi';

export type QuestionType = 'mcq' | 'true_false' | 'short_answer' | 'essay';

export interface QuestionOption {
  id: string;
  text: string;
  is_correct: boolean;
}

export interface FormQuestion {
  id: string;
  question_text: string;
  question_type: QuestionType;
  options: QuestionOption[];
  correct_answer: string;
  marks: number;
  negative_marks: number;
  section: string;
  is_required: boolean;
}

export interface ExamFormData {
  title: string;
  description: string;
  exam_type: 'quiz' | 'midterm' | 'final' | 'practical';
  duration_minutes: number;
  total_marks: number;
  passing_marks: number;
  max_attempts: number;
  scheduled_at: string;
  is_immediate: boolean;
  instructions: string;
  shuffle_questions: boolean;
  shuffle_options: boolean;
  allow_navigation: boolean;
  allow_review: boolean;
  show_result_immediately: boolean;
  proctoring_enabled: boolean;
  proctoring_config: ProctoringConfig;
}

interface ExamFormBuilderProps {
  examId?: string;
  onSave?: (examId: string) => void;
  onCancel?: () => void;
}

const defaultProctoringConfig: ProctoringConfig = {
  fullscreen_mandatory: false,
  face_detection_required: true,
  tab_switch_limit: 5,
  violation_threshold: 3,
  allow_copy_paste: false,
  allow_screenshots: false,
  idle_timeout_seconds: 60,
  record_snapshots: true,
  snapshot_interval_seconds: 30,
  multiple_face_detection: true,
  phone_detection: true,
};

const defaultExamFormData: ExamFormData = {
  title: '',
  description: '',
  exam_type: 'quiz',
  duration_minutes: 30,
  total_marks: 100,
  passing_marks: 35,
  max_attempts: 1,
  scheduled_at: '',
  is_immediate: true,
  instructions: '',
  shuffle_questions: false,
  shuffle_options: false,
  allow_navigation: true,
  allow_review: false,
  show_result_immediately: false,
  proctoring_enabled: false,
  proctoring_config: defaultProctoringConfig,
};

const questionTypeLabels: Record<QuestionType, string> = {
  mcq: 'Multiple Choice (MCQ)',
  true_false: 'True / False',
  short_answer: 'Short Answer',
  essay: 'Essay / Long Answer',
};

const questionTypeIcons: Record<QuestionType, string> = {
  mcq: '☑️',
  true_false: '✓✗',
  short_answer: '📝',
  essay: '📄',
};

export const ExamFormBuilder: React.FC<ExamFormBuilderProps> = ({ 
  examId, 
  onSave, 
  onCancel 
}) => {
  const [formData, setFormData] = useState<ExamFormData>(defaultExamFormData);
  const [questions, setQuestions] = useState<FormQuestion[]>([]);
  const [activeSection, setActiveSection] = useState<'details' | 'questions' | 'settings' | 'preview'>('details');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentExamId, setCurrentExamId] = useState<string | examId>(examId || '');
  const [showQuestionTypeMenu, setShowQuestionTypeMenu] = useState<string | null>(null);
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);

  // Load existing exam if editing
  useEffect(() => {
    if (examId) {
      loadExam(examId);
    }
  }, [examId]);

  const loadExam = async (id: string) => {
    try {
      setLoading(true);
      const exam = await examApiService.getExam(id);
      setFormData({
        title: exam.title || '',
        description: exam.description || '',
        exam_type: exam.exam_type || 'quiz',
        duration_minutes: exam.duration_minutes || 30,
        total_marks: exam.total_marks || 100,
        passing_marks: exam.passing_marks || 35,
        max_attempts: exam.max_attempts || 1,
        scheduled_at: exam.scheduled_at ? exam.scheduled_at.split('T')[0] : '',
        is_immediate: exam.is_immediate,
        instructions: exam.instructions || '',
        shuffle_questions: false,
        shuffle_options: false,
        allow_navigation: true,
        allow_review: false,
        show_result_immediately: false,
        proctoring_enabled: !!exam.proctoring_config,
        proctoring_config: exam.proctoring_config || defaultProctoringConfig,
      });
      
      // Load questions would go here if we have a getQuestions endpoint
    } catch (error) {
      console.error('Failed to load exam:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const addQuestion = (type: QuestionType) => {
    const newQuestion: FormQuestion = {
      id: generateId(),
      question_text: '',
      question_type: type,
      options: type === 'mcq' ? [
        { id: generateId(), text: '', is_correct: false },
        { id: generateId(), text: '', is_correct: false },
        { id: generateId(), text: '', is_correct: false },
        { id: generateId(), text: '', is_correct: false },
      ] : [],
      correct_answer: '',
      marks: 1,
      negative_marks: 0,
      section: '',
      is_required: true,
    };
    
    setQuestions([...questions, newQuestion]);
    setExpandedQuestion(newQuestion.id);
    setShowQuestionTypeMenu(null);
  };

  const updateQuestion = (questionId: string, updates: Partial<FormQuestion>) => {
    setQuestions(questions.map(q => 
      q.id === questionId ? { ...q, ...updates } : q
    ));
  };

  const deleteQuestion = (questionId: string) => {
    setQuestions(questions.filter(q => q.id !== questionId));
  };

  const duplicateQuestion = (questionId: string) => {
    const question = questions.find(q => q.id === questionId);
    if (question) {
      const newQuestion: FormQuestion = {
        ...question,
        id: generateId(),
        question_text: question.question_text + ' (Copy)',
      };
      const index = questions.findIndex(q => q.id === questionId);
      const newQuestions = [...questions];
      newQuestions.splice(index + 1, 0, newQuestion);
      setQuestions(newQuestions);
    }
  };

  const addOption = (questionId: string) => {
    const question = questions.find(q => q.id === questionId);
    if (question && question.question_type === 'mcq') {
      const newOptions = [...question.options, { id: generateId(), text: '', is_correct: false }];
      updateQuestion(questionId, { options: newOptions });
    }
  };

  const removeOption = (questionId: string, optionId: string) => {
    const question = questions.find(q => q.id === questionId);
    if (question && question.question_type === 'mcq' && question.options.length > 2) {
      const newOptions = question.options.filter(o => o.id !== optionId);
      updateQuestion(questionId, { options: newOptions });
    }
  };

  const updateOption = (questionId: string, optionId: string, updates: Partial<QuestionOption>) => {
    const question = questions.find(q => q.id === questionId);
    if (question && question.question_type === 'mcq') {
      const newOptions = question.options.map(o => 
        o.id === optionId ? { ...o, ...updates } : o
      );
      updateQuestion(questionId, { options: newOptions });
    }
  };

  const moveQuestion = (questionId: string, direction: 'up' | 'down') => {
    const index = questions.findIndex(q => q.id === questionId);
    if (
      (direction === 'up' && index > 0) ||
      (direction === 'down' && index < questions.length - 1)
    ) {
      const newQuestions = [...questions];
      const swapIndex = direction === 'up' ? index - 1 : index + 1;
      [newQuestions[index], newQuestions[swapIndex]] = [newQuestions[swapIndex], newQuestions[index]];
      setQuestions(newQuestions);
    }
  };

  const calculateTotalMarks = () => {
    return questions.reduce((sum, q) => sum + q.marks, 0);
  };

  const validateForm = (): string[] => {
    const errors: string[] = [];
    
    if (!formData.title.trim()) {
      errors.push('Exam title is required');
    }
    
    if (questions.length === 0) {
      errors.push('At least one question is required');
    }
    
    questions.forEach((q, index) => {
      if (!q.question_text.trim()) {
        errors.push(`Question ${index + 1}: Question text is required`);
      }
      
      if (q.question_type === 'mcq') {
        const hasEmptyOption = q.options.some(o => !o.text.trim());
        if (hasEmptyOption) {
          errors.push(`Question ${index + 1}: All options must have text`);
        }
        const hasCorrectOption = q.options.some(o => o.is_correct);
        if (!hasCorrectOption) {
          errors.push(`Question ${index + 1}: At least one correct answer must be marked`);
        }
      }
    });
    
    return errors;
  };

  const handleSave = async (publish: boolean = false) => {
    const errors = validateForm();
    if (errors.length > 0) {
      alert(errors.join('\n'));
      return;
    }

    try {
      setSaving(true);
      
      // Create or update exam
      let examData: Partial<Exam> = {
        title: formData.title,
        description: formData.description,
        exam_type: formData.exam_type,
        duration_minutes: formData.duration_minutes,
        total_marks: formData.total_marks || calculateTotalMarks(),
        passing_marks: formData.passing_marks,
        max_attempts: formData.max_attempts,
        is_immediate: formData.is_immediate,
        instructions: formData.instructions,
        scheduled_at: formData.scheduled_at ? new Date(formData.scheduled_at).toISOString() : undefined,
        proctoring_config: formData.proctoring_enabled ? formData.proctoring_config : undefined,
      };

      let examId = currentExamId;
      
      if (!examId) {
        const newExam = await examApiService.createExam(examData);
        examId = newExam.id;
        setCurrentExamId(examId);
      } else {
        await examApiService.updateExam(examId, examData);
      }

      // Create questions (would need to add question creation API)
      // For now, we'll just save the exam
      
      if (publish) {
        await examApiService.publishExam(examId);
      }
      
      if (onSave) {
        onSave(examId);
      }
    } catch (error) {
      console.error('Failed to save exam:', error);
      alert('Failed to save exam. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onCancel}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-gray-500" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {examId ? 'Edit Exam' : 'Create New Exam'}
                </h1>
                <p className="text-sm text-gray-500">
                  {questions.length} question{questions.length !== 1 ? 's' : ''} • {calculateTotalMarks()} total marks
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                onClick={() => setActiveSection('preview')}
                className="flex items-center gap-2"
              >
                <EyeIcon className="w-4 h-4" />
                Preview
              </Button>
              <Button
                variant="secondary"
                onClick={() => handleSave(false)}
                disabled={saving}
                className="flex items-center gap-2"
              >
                <DocumentArrowDownIcon className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Draft'}
              </Button>
              <Button
                variant="primary"
                onClick={() => handleSave(true)}
                disabled={saving}
                className="flex items-center gap-2"
              >
                <CheckCircleIcon className="w-4 h-4" />
                {saving ? 'Publishing...' : 'Publish'}
              </Button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-1 mt-4 -mb-px">
            {[
              { id: 'details', label: 'Details', icon: DocumentDuplicateIcon },
              { id: 'questions', label: 'Questions', icon: QuestionMarkCircleIcon },
              { id: 'settings', label: 'Settings', icon: ClipboardDocumentListIcon },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id as 'details' | 'questions' | 'settings')}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeSection === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Details Section */}
        {activeSection === 'details' && (
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Exam Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Exam Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter exam title"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter exam description"
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Exam Type
                    </label>
                    <select
                      value={formData.exam_type}
                      onChange={(e) => setFormData({ ...formData, exam_type: e.target.value as any })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="quiz">Quiz</option>
                      <option value="midterm">Midterm</option>
                      <option value="final">Final</option>
                      <option value="practical">Practical</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Duration (minutes)
                    </label>
                    <input
                      type="number"
                      value={formData.duration_minutes}
                      onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 0 })}
                      min={1}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total Marks
                    </label>
                    <input
                      type="number"
                      value={formData.total_marks}
                      onChange={(e) => setFormData({ ...formData, total_marks: parseInt(e.target.value) || 0 })}
                      min={1}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Passing Marks
                    </label>
                    <input
                      type="number"
                      value={formData.passing_marks}
                      onChange={(e) => setFormData({ ...formData, passing_marks: parseInt(e.target.value) || 0 })}
                      min={0}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Attempts
                    </label>
                    <input
                      type="number"
                      value={formData.max_attempts}
                      onChange={(e) => setFormData({ ...formData, max_attempts: parseInt(e.target.value) || 1 })}
                      min={1}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Schedule Date (optional)
                  </label>
                  <input
                    type="date"
                    value={formData.scheduled_at}
                    onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_immediate}
                      onChange={(e) => setFormData({ ...formData, is_immediate: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Available immediately</span>
                  </label>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Instructions</h2>
              <textarea
                value={formData.instructions}
                onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                placeholder="Enter exam instructions for students..."
                rows={5}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </Card>
          </div>
        )}

        {/* Questions Section - Google Form-like */}
        {activeSection === 'questions' && (
          <div className="space-y-4">
            {questions.length === 0 ? (
              <Card className="p-12 text-center">
                <QuestionMarkCircleIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No questions yet</h3>
                <p className="text-gray-500 mb-6">Add your first question to get started</p>
                <div className="flex justify-center gap-3">
                  <Button variant="primary" onClick={() => addQuestion('mcq')}>
                    Add Question
                  </Button>
                </div>
              </Card>
            ) : (
              <>
                {questions.map((question, index) => (
                  <Card 
                    key={question.id} 
                    className={`p-6 transition-all ${
                      expandedQuestion === question.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Question Number */}
                      <div className="flex flex-col items-center gap-1">
                        <button
                          onClick={() => moveQuestion(question.id, 'up')}
                          disabled={index === 0}
                          className="p-1 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ChevronUpIcon className="w-4 h-4 text-gray-400" />
                        </button>
                        <span className="w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                          {index + 1}
                        </span>
                        <button
                          onClick={() => moveQuestion(question.id, 'down')}
                          disabled={index === questions.length - 1}
                          className="p-1 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>

                      {/* Question Content */}
                      <div className="flex-1">
                        {/* Question Type Badge */}
                        <div className="flex items-center gap-2 mb-3">
                          <Badge className="bg-blue-100 text-blue-700">
                            {questionTypeIcons[question.question_type]} {questionTypeLabels[question.question_type]}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {question.marks} mark{question.marks !== 1 ? 's' : ''}
                            {question.negative_marks > 0 && ` • -${question.negative_marks} for wrong`}
                          </span>
                        </div>

                        {/* Question Text Input */}
                        <div className="mb-4">
                          <input
                            type="text"
                            value={question.question_text}
                            onChange={(e) => updateQuestion(question.id, { question_text: e.target.value })}
                            placeholder="Enter your question"
                            className="w-full px-4 py-2 text-lg border-0 border-b-2 border-gray-200 focus:border-blue-500 focus:outline-none bg-transparent"
                          />
                        </div>

                        {/* Question Type Options */}
                        {expandedQuestion === question.id && (
                          <div className="space-y-4">
                            {/* MCQ Options */}
                            {question.question_type === 'mcq' && (
                              <div className="space-y-2 ml-4">
                                {question.options.map((option, optIndex) => (
                                  <div key={option.id} className="flex items-center gap-3">
                                    <button
                                      onClick={() => {
                                        const newOptions = question.options.map((o, i) => ({
                                          ...o,
                                          is_correct: i === optIndex,
                                        }));
                                        updateQuestion(question.id, { options: newOptions });
                                      }}
                                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        option.is_correct 
                                          ? 'border-green-500 bg-green-500' 
                                          : 'border-gray-300 hover:border-gray-400'
                                      }`}
                                    >
                                      {option.is_correct && (
                                        <div className="w-2 h-2 bg-white rounded-full" />
                                      )}
                                    </button>
                                    <input
                                      type="text"
                                      value={option.text}
                                      onChange={(e) => updateOption(question.id, option.id, { text: e.target.value })}
                                      placeholder={`Option ${optIndex + 1}`}
                                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    <button
                                      onClick={() => removeOption(question.id, option.id)}
                                      disabled={question.options.length <= 2}
                                      className="p-1 text-gray-400 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                      <XMarkIcon className="w-4 h-4" />
                                    </button>
                                  </div>
                                ))}
                                <button
                                  onClick={() => addOption(question.id)}
                                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 ml-8"
                                >
                                  <PlusIcon className="w-4 h-4" />
                                  Add option
                                </button>
                              </div>
                            )}

                            {/* True/False */}
                            {question.question_type === 'true_false' && (
                              <div className="flex gap-4 ml-4">
                                {['True', 'False'].map((option) => (
                                  <button
                                    key={option}
                                    onClick={() => updateQuestion(question.id, { correct_answer: option })}
                                    className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                                      question.correct_answer === option
                                        ? 'border-green-500 bg-green-50 text-green-700'
                                        : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                  >
                                    {option}
                                  </button>
                                ))}
                              </div>
                            )}

                            {/* Short Answer */}
                            {(question.question_type === 'short_answer' || question.question_type === 'essay') && (
                              <div className="ml-4">
                                <input
                                  type="text"
                                  value={question.correct_answer}
                                  onChange={(e) => updateQuestion(question.id, { correct_answer: e.target.value })}
                                  placeholder="Model answer (for grading)"
                                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                  This will be used as a reference for manual grading
                                </p>
                              </div>
                            )}

                            {/* Marks and Settings */}
                            <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
                              <div className="flex items-center gap-2">
                                <label className="text-sm text-gray-600">Marks:</label>
                                <input
                                  type="number"
                                  value={question.marks}
                                  onChange={(e) => updateQuestion(question.id, { marks: parseInt(e.target.value) || 1 })}
                                  min={1}
                                  className="w-16 px-2 py-1 border border-gray-200 rounded text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <label className="text-sm text-gray-600">Negative:</label>
                                <input
                                  type="number"
                                  value={question.negative_marks}
                                  onChange={(e) => updateQuestion(question.id, { negative_marks: parseInt(e.target.value) || 0 })}
                                  min={0}
                                  max={question.marks}
                                  className="w-16 px-2 py-1 border border-gray-200 rounded text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                              <label className="flex items-center gap-2 ml-auto cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={question.is_required}
                                  onChange={(e) => updateQuestion(question.id, { is_required: e.target.checked })}
                                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-600">Required</span>
                              </label>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setExpandedQuestion(expandedQuestion === question.id ? null : question.id)}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                        >
                          {expandedQuestion === question.id ? (
                            <ChevronUpIcon className="w-5 h-5" />
                          ) : (
                            <ChevronDownIcon className="w-5 h-5" />
                          )}
                        </button>
                        <button
                          onClick={() => duplicateQuestion(question.id)}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                        >
                          <DocumentDuplicateIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => deleteQuestion(question.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}

                {/* Add Question Button */}
                <div className="relative">
                  <button
                    onClick={() => setShowQuestionTypeMenu(showQuestionTypeMenu === 'add' ? null : 'add')}
                    className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <PlusIcon className="w-5 h-5" />
                    Add Question
                  </button>
                  
                  {/* Question Type Dropdown */}
                  {showQuestionTypeMenu === 'add' && (
                    <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10">
                      {Object.entries(questionTypeLabels).map(([type, label]) => (
                        <button
                          key={type}
                          onClick={() => addQuestion(type as QuestionType)}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors"
                        >
                          <span className="text-xl">{questionTypeIcons[type as QuestionType]}</span>
                          <span className="text-sm font-medium text-gray-700">{label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Settings Section */}
        {activeSection === 'settings' && (
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Exam Settings</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div>
                    <p className="font-medium text-gray-900">Shuffle Questions</p>
                    <p className="text-sm text-gray-500">Randomize question order for each student</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.shuffle_questions}
                      onChange={(e) => setFormData({ ...formData, shuffle_questions: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div>
                    <p className="font-medium text-gray-900">Shuffle Options</p>
                    <p className="text-sm text-gray-500">Randomize answer options for MCQ questions</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.shuffle_options}
                      onChange={(e) => setFormData({ ...formData, shuffle_options: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div>
                    <p className="font-medium text-gray-900">Allow Navigation</p>
                    <p className="text-sm text-gray-500">Students can move between questions</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.allow_navigation}
                      onChange={(e) => setFormData({ ...formData, allow_navigation: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div>
                    <p className="font-medium text-gray-900">Allow Review</p>
                    <p className="text-sm text-gray-500">Students can review answers before submitting</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.allow_review}
                      onChange={(e) => setFormData({ ...formData, allow_review: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-gray-900">Show Result Immediately</p>
                    <p className="text-sm text-gray-500">Display score after exam submission</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.show_result_immediately}
                      onChange={(e) => setFormData({ ...formData, show_result_immediately: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </Card>

            {/* Proctoring Settings */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Proctoring Settings</h2>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.proctoring_enabled}
                    onChange={(e) => setFormData({ ...formData, proctoring_enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {formData.proctoring_enabled && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-gray-600">Face Detection</span>
                      <input
                        type="checkbox"
                        checked={formData.proctoring_config.face_detection_required}
                        onChange={(e) => setFormData({
                          ...formData,
                          proctoring_config: { ...formData.proctoring_config, face_detection_required: e.target.checked }
                        })}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-gray-600">Fullscreen Required</span>
                      <input
                        type="checkbox"
                        checked={formData.proctoring_config.fullscreen_mandatory}
                        onChange={(e) => setFormData({
                          ...formData,
                          proctoring_config: { ...formData.proctoring_config, fullscreen_mandatory: e.target.checked }
                        })}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-gray-600">Record Snapshots</span>
                      <input
                        type="checkbox"
                        checked={formData.proctoring_config.record_snapshots}
                        onChange={(e) => setFormData({
                          ...formData,
                          proctoring_config: { ...formData.proctoring_config, record_snapshots: e.target.checked }
                        })}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-gray-600">Phone Detection</span>
                      <input
                        type="checkbox"
                        checked={formData.proctoring_config.phone_detection}
                        onChange={(e) => setFormData({
                          ...formData,
                          proctoring_config: { ...formData.proctoring_config, phone_detection: e.target.checked }
                        })}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Tab Switch Limit</label>
                      <input
                        type="number"
                        value={formData.proctoring_config.tab_switch_limit}
                        onChange={(e) => setFormData({
                          ...formData,
                          proctoring_config: { ...formData.proctoring_config, tab_switch_limit: parseInt(e.target.value) || 5 }
                        })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Violation Threshold</label>
                      <input
                        type="number"
                        value={formData.proctoring_config.violation_threshold}
                        onChange={(e) => setFormData({
                          ...formData,
                          proctoring_config: { ...formData.proctoring_config, violation_threshold: parseInt(e.target.value) || 3 }
                        })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Preview Section */}
        {activeSection === 'preview' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Exam Preview</h2>
              <Badge className="bg-yellow-100 text-yellow-700">
                Student View
              </Badge>
            </div>

            <Card className="p-8">
              {/* Exam Header */}
              <div className="text-center mb-8 pb-6 border-b border-gray-200">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {formData.title || 'Untitled Exam'}
                </h1>
                {formData.description && (
                  <p className="text-gray-600">{formData.description}</p>
                )}
                <div className="flex items-center justify-center gap-4 mt-4 text-sm text-gray-500">
                  <span>{questions.length} Questions</span>
                  <span>•</span>
                  <span>{calculateTotalMarks()} Marks</span>
                  <span>•</span>
                  <span>{formData.duration_minutes} Minutes</span>
                </div>
              </div>

              {/* Instructions */}
              {formData.instructions && (
                <div className="bg-blue-50 p-4 rounded-lg mb-6">
                  <h3 className="font-medium text-blue-900 mb-2">Instructions</h3>
                  <p className="text-sm text-blue-800">{formData.instructions}</p>
                </div>
              )}

              {/* Questions Preview */}
              <div className="space-y-6">
                {questions.map((question, index) => (
                  <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <span className="w-6 h-6 flex items-center justify-center bg-gray-100 text-gray-700 rounded text-sm font-medium">
                        {index + 1}
                      </span>
                      <p className="font-medium text-gray-900 flex-1">
                        {question.question_text || 'Untitled Question'}
                        {question.is_required && <span className="text-red-500 ml-1">*</span>}
                      </p>
                      <span className="text-xs text-gray-500">{question.marks} mark{question.marks !== 1 ? 's' : ''}</span>
                    </div>

                    {question.question_type === 'mcq' && (
                      <div className="ml-9 space-y-2">
                        {question.options.map((option) => (
                          <label key={option.id} className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer">
                            <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />
                            <span className="text-sm text-gray-700">{option.text || 'Option'}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {question.question_type === 'true_false' && (
                      <div className="ml-9 flex gap-4">
                        {['True', 'False'].map((option) => (
                          <label key={option} className="flex items-center gap-2 cursor-pointer">
                            <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />
                            <span className="text-sm text-gray-700">{option}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {(question.question_type === 'short_answer' || question.question_type === 'essay') && (
                      <div className="ml-9">
                        <textarea
                          disabled
                          placeholder="Enter your answer..."
                          rows={question.question_type === 'essay' ? 5 : 2}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
                        />
                      </div>
                    )}
                  </div>
                ))}

                {questions.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>No questions added yet</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExamFormBuilder;
