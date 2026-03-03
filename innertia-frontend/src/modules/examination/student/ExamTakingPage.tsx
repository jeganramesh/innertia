/**
 * Exam Taking Page
 * 
 * Student interface for taking exams with proctoring.
 * Fullscreen enforced, timer, question navigation.
 * Follows Apple-style aesthetic.
 */

import { useState, useEffect, useCallback } from 'react';
import { examApiService, ExamStartResponse, ExamQuestion } from '../api/examApi';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  ClockIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  FlagIcon,
  DevicePhoneMobileIcon,
  UserIcon
} from '@heroicons/react/24/outline';

interface ExamTakingPageProps {
  examId: string;
  onComplete?: () => void;
}

const ExamTakingPage = ({ examId, onComplete }: ExamTakingPageProps) => {
  const [examData, setExamData] = useState<ExamStartResponse | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [remainingTime, setRemainingTime] = useState<number>(0);
  const [violationCount, setViolationCount] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [faceDetected, setFaceDetected] = useState(true);

  useEffect(() => {
    startExam();
    setupProctoring();
    return () => {
      document.exitFullscreen?.();
    };
  }, [examId]);

  // Timer countdown
  useEffect(() => {
    if (!examData || remainingTime <= 0) return;
    
    const timer = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 1) {
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [examData, remainingTime]);

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!examData || submitting) return;
    
    const autoSave = setInterval(() => {
      if (Object.keys(answers).length > 0) {
        examApiService.saveExamAnswers(examData.attempt_id, answers).catch(console.error);
      }
    }, 30000);

    return () => clearInterval(autoSave);
  }, [examData, answers, submitting]);

  const startExam = async () => {
    try {
      setLoading(true);
      const data = await examApiService.startExam(examId);
      setExamData(data);
      setRemainingTime(data.duration_minutes * 60);
    } catch (error: any) {
      console.error('Failed to start exam:', error);
      alert(error.response?.data?.detail || 'Failed to start exam');
    } finally {
      setLoading(false);
    }
  };

  const setupProctoring = () => {
    // Detect tab switch
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('blur', handleWindowBlur);
    
    // Request fullscreen
    document.documentElement.requestFullscreen?.().catch(console.error);
    
    // Setup beforeunload warning
    window.onbeforeunload = (e) => {
      e.preventDefault();
      return 'Are you sure you want to leave? Your answers may be lost.';
    };

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('blur', handleWindowBlur);
    };
  };

  const handleVisibilityChange = () => {
    if (document.hidden && examData?.proctoring_config?.tab_switch_limit) {
      reportViolation('tab_switch', { timestamp: new Date().toISOString() });
      showViolationWarning('Tab switch detected! This has been recorded.');
    }
  };

  const handleWindowBlur = () => {
    if (examData?.proctoring_config?.fullscreen_mandatory && document.fullscreenElement) {
      reportViolation('fullscreen_exit', { timestamp: new Date().toISOString() });
      showViolationWarning('Please return to fullscreen mode!');
    }
  };

  const reportViolation = async (type: string, details: any) => {
    if (!examData) return;
    
    try {
      const response = await examApiService.reportViolation(examData.attempt_id, {
        violation_type: type,
        severity: 'medium',
        details,
      });
      setViolationCount(response.violation_count);
      
      if (response.auto_submit) {
        handleAutoSubmit();
      }
    } catch (error) {
      console.error('Failed to report violation:', error);
    }
  };

  const showViolationWarning = (message: string) => {
    setWarningMessage(message);
    setShowWarning(true);
    setTimeout(() => setShowWarning(false), 5000);
  };

  const handleAutoSubmit = async () => {
    if (!examData) return;
    setSubmitting(true);
    try {
      await examApiService.submitExam(examData.attempt_id, answers);
      onComplete?.();
    } catch (error) {
      console.error('Auto-submit failed:', error);
    }
  };

  const handleSubmit = async () => {
    if (!examData) return;
    
    const unanswered = examData.questions.filter(
      (q) => !answers[q.id]
    ).length;
    
    if (unanswered > 0) {
      if (!confirm(`You have ${unanswered} unanswered questions. Submit anyway?`)) {
        return;
      }
    }

    setSubmitting(true);
    try {
      await examApiService.submitExam(examData.attempt_id, answers);
      document.exitFullscreen?.();
      onComplete?.();
    } catch (error) {
      console.error('Submit failed:', error);
      alert('Failed to submit exam. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleFlag = (questionId: string) => {
    setFlaggedQuestions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading exam...</p>
        </div>
      </div>
    );
  }

  if (!examData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <XCircleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Exam Not Available</h2>
          <p className="text-gray-500">Unable to load exam. Please try again.</p>
        </Card>
      </div>
    );
  }

  const currentQuestion = examData.questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Warning Toast */}
      {showWarning && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <div className="bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
            <ExclamationTriangleIcon className="w-5 h-5" />
            {warningMessage}
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-gray-900">
              {examData.exam_id}
            </h1>
            <Badge className="bg-blue-100 text-blue-700">
              Question {currentQuestionIndex + 1} of {examData.questions.length}
            </Badge>
          </div>

          <div className="flex items-center gap-6">
            {/* Face Detection Status */}
            <div className="flex items-center gap-2">
              <UserIcon className={`w-5 h-5 ${faceDetected ? 'text-green-500' : 'text-red-500'}`} />
              <span className="text-sm text-gray-600">
                {faceDetected ? 'Face detected' : 'Face not visible!'}
              </span>
            </div>

            {/* Fullscreen Status */}
            <div className="flex items-center gap-2">
              <DevicePhoneMobileIcon className={`w-5 h-5 ${isFullscreen ? 'text-green-500' : 'text-orange-500'}`} />
              <span className="text-sm text-gray-600">
                {isFullscreen ? 'Fullscreen' : 'Not fullscreen'}
              </span>
            </div>

            {/* Violations */}
            {violationCount > 0 && (
              <Badge className="bg-red-100 text-red-700">
                {violationCount} violation{violationCount > 1 ? 's' : ''}
              </Badge>
            )}

            {/* Timer */}
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              remainingTime < 300 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
            }`}>
              <ClockIcon className="w-5 h-5" />
              <span className="font-mono text-lg font-semibold">
                {formatTime(remainingTime)}
              </span>
            </div>

            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="w-5 h-5" />
                  Submit
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
        {/* Question Panel */}
        <div className="w-72 flex-shrink-0">
          <Card className="p-4 sticky top-24">
            <h3 className="font-semibold text-gray-900 mb-4">Questions</h3>
            <div className="grid grid-cols-5 gap-2">
              {examData.questions.map((q, idx) => (
                <button
                  key={q.id}
                  onClick={() => setCurrentQuestionIndex(idx)}
                  className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                    idx === currentQuestionIndex
                      ? 'bg-blue-600 text-white'
                      : answers[q.id]
                      ? flaggedQuestions.has(q.id)
                        ? 'bg-orange-100 text-orange-700 border-2 border-orange-300'
                        : 'bg-green-100 text-green-700'
                      : flaggedQuestions.has(q.id)
                      ? 'bg-orange-50 text-orange-700 border border-orange-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-green-100 border border-green-300"></div>
                  <span className="text-gray-600">Answered</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-orange-100 border border-orange-300"></div>
                  <span className="text-gray-600">Flagged</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Question Content */}
        <div className="flex-1">
          <Card className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <Badge className="bg-gray-100 text-gray-700 mb-2">
                  {currentQuestion.question_type.toUpperCase()}
                </Badge>
                <h2 className="text-xl font-medium text-gray-900">
                  {currentQuestion.question_text}
                </h2>
              </div>
              <Button
                variant="ghost"
                onClick={() => toggleFlag(currentQuestion.id)}
                className={`p-2 ${flaggedQuestions.has(currentQuestion.id) ? 'text-orange-500' : 'text-gray-400'}`}
              >
                <FlagIcon className={`w-6 h-6 ${flaggedQuestions.has(currentQuestion.id) ? 'fill-current' : ''}`} />
              </Button>
            </div>

            {/* Question Options */}
            <div className="space-y-3">
              {currentQuestion.question_type === 'mcq' && currentQuestion.options?.map((option, idx) => (
                <label
                  key={idx}
                  className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    answers[currentQuestion.id] === option.text
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${currentQuestion.id}`}
                    value={option.text}
                    checked={answers[currentQuestion.id] === option.text}
                    onChange={(e) => setAnswers({ ...answers, [currentQuestion.id]: e.target.value })}
                    className="w-5 h-5 text-blue-600"
                  />
                  <span className="ml-3 text-gray-700">{option.text}</span>
                </label>
              ))}

              {currentQuestion.question_type === 'true_false' && (
                <>
                  <label className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    answers[currentQuestion.id] === 'true'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name={`question-${currentQuestion.id}`}
                      value="true"
                      checked={answers[currentQuestion.id] === 'true'}
                      onChange={(e) => setAnswers({ ...answers, [currentQuestion.id]: e.target.value })}
                      className="w-5 h-5 text-blue-600"
                    />
                    <span className="ml-3 text-gray-700">True</span>
                  </label>
                  <label className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    answers[currentQuestion.id] === 'false'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name={`question-${currentQuestion.id}`}
                      value="false"
                      checked={answers[currentQuestion.id] === 'false'}
                      onChange={(e) => setAnswers({ ...answers, [currentQuestion.id]: e.target.value })}
                      className="w-5 h-5 text-blue-600"
                    />
                    <span className="ml-3 text-gray-700">False</span>
                  </label>
                </>
              )}

              {(currentQuestion.question_type === 'short_answer' || currentQuestion.question_type === 'essay') && (
                <textarea
                  value={answers[currentQuestion.id] || ''}
                  onChange={(e) => setAnswers({ ...answers, [currentQuestion.id]: e.target.value })}
                  placeholder="Enter your answer..."
                  className="w-full h-40 p-4 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:outline-none resize-none"
                />
              )}
            </div>

            {/* Marks Info */}
            <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
              <span className="text-sm text-gray-500">
                {currentQuestion.marks} mark{currentQuestion.marks > 1 ? 's' : ''}
                {currentQuestion.negative_marks > 0 && (
                  <span className="text-red-500 ml-2">
                    ({currentQuestion.negative_marks} negative)
                  </span>
                )}
              </span>

              <div className="flex items-center gap-3">
                <Button
                  variant="secondary"
                  disabled={currentQuestionIndex === 0}
                  onClick={() => setCurrentQuestionIndex(currentQuestionIndex - 1)}
                  className="flex items-center gap-1"
                >
                  <ArrowLeftIcon className="w-4 h-4" />
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  disabled={currentQuestionIndex === examData.questions.length - 1}
                  onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
                  className="flex items-center gap-1"
                >
                  Next
                  <ArrowRightIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ExamTakingPage;
