import { useState, useEffect, useCallback } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { 
  Lock, 
  Unlock,
  ChevronLeft, 
  ChevronRight,
  FileText,
  Send,
  Clock,
  AlertTriangle,
  CheckCircle,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { studentApiService, StudentSession } from '../../services/studentApi';
import { useNavigate } from 'react-router-dom';

interface SlideState {
  current_slide: number;
  is_locked: boolean;
}

interface Question {
  id: string;
  question: string;
  answer?: string;
  status: 'pending' | 'answered';
  slideContext?: number;
  createdAt: string;
}

export const StudentSessionPage = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<StudentSession | null>(null);
  const [slideState, setSlideState] = useState<SlideState | null>(null);
  const [currentSlide, setCurrentSlide] = useState(1);
  const [totalSlides] = useState(45); // Would need backend for actual count
  const [slideLocked, setSlideLocked] = useState(true);
  const [aiQuestion, setAiQuestion] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch session data
  const fetchSessionData = useCallback(async () => {
    try {
      // Get current session
      const currentSession = await studentApiService.getCurrentSession();
      
      if (currentSession) {
        setSession(currentSession);
        
        // Calculate elapsed time
        const startTime = new Date(currentSession.started_at).getTime();
        const now = Date.now();
        const mins = Math.floor((now - startTime) / 60000);
        setElapsedTime(mins);
        
        // For slide state, we'd need to call a backend endpoint
        // For now, default to slide 1, unlocked
        setSlideState({
          current_slide: 1,
          is_locked: false
        });
        setCurrentSlide(1);
      } else {
        // No active session - redirect to dashboard
        navigate('/student');
      }
    } catch (err: any) {
      console.error('Failed to fetch session:', err);
      setError(err.response?.data?.detail || 'Failed to load session');
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchSessionData();
    
    // Poll for updates every 10 seconds
    const interval = setInterval(fetchSessionData, 10000);
    return () => clearInterval(interval);
  }, [fetchSessionData]);

  // Timer update
  useEffect(() => {
    if (session?.status === 'in_progress') {
      const startTime = new Date(session.started_at).getTime();
      const updateTimer = () => {
        const now = Date.now();
        const mins = Math.floor((now - startTime) / 60000);
        setElapsedTime(mins);
      };
      
      updateTimer();
      const interval = setInterval(updateTimer, 60000);
      return () => clearInterval(interval);
    }
  }, [session]);

  const formatTime = (mins: number) => {
    const hours = Math.floor(mins / 60);
    const minutes = mins % 60;
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  // Handle slide change (would call backend API in production)
  const handleSlideChange = (newSlide: number) => {
    if (newSlide >= 1 && newSlide <= totalSlides && !slideLocked) {
      setCurrentSlide(newSlide);
    }
  };

  // Ask question
  const askQuestion = () => {
    if (!aiQuestion.trim()) return;
    const newQuestion: Question = {
      id: `q-${Date.now()}`,
      question: aiQuestion,
      status: 'pending',
      slideContext: currentSlide,
      createdAt: new Date().toISOString()
    };
    setQuestions([...questions, newQuestion]);
    setAiQuestion('');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#0071e3]" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <AlertCircle className="w-12 h-12 text-[#86868b] mb-4" />
        <p className="text-lg text-[#86868b]">No active session</p>
        <Button 
          className="mt-4"
          onClick={() => navigate('/student')}
        >
          Go to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 text-red-600 rounded-xl">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Session Header - Apple Style */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl lg:text-4xl font-semibold text-[#1d1d1f] tracking-tight">
            Active Session
          </h1>
          <p className="text-base text-[#86868b] mt-2">
            {session.class_name} • In Progress
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Session Duration */}
          <div className="flex items-center gap-3 px-5 py-3 bg-[#f5f5f7] rounded-xl">
            <Clock className="w-5 h-5 text-[#86868b]" />
            <span className="text-lg font-semibold text-[#1d1d1f]">{formatTime(elapsedTime)}</span>
          </div>
          
          {/* Slide Lock Status */}
          <div className={`px-5 py-3 rounded-xl flex items-center gap-3 ${
            slideLocked ? 'bg-blue-100 text-blue-700' : 'bg-[#f5f5f7] text-[#1d1d1f]'
          }`}>
            {slideLocked ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
            <span className="font-medium">{slideLocked ? 'Slides Locked' : 'Slides Unlocked'}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Slide View */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-8 rounded-2xl border-0 shadow-sm">
            {/* Slide Display Area */}
            <div className="aspect-video bg-[#f5f5f7] rounded-2xl flex items-center justify-center mb-8">
              <div className="text-center">
                <FileText className="w-24 h-24 text-[#86868b] mx-auto mb-4" />
                <p className="text-2xl text-[#1d1d1f]">Slide {currentSlide} of {totalSlides}</p>
                <p className="text-lg text-[#86868b] mt-2">Binary Search Algorithm</p>
              </div>
            </div>

            {/* Slide Navigation */}
            <div className="flex items-center justify-between">
              <Button 
                variant="outline" 
                className="h-12 px-6 rounded-xl"
                disabled={currentSlide <= 1 || slideLocked}
                onClick={() => handleSlideChange(currentSlide - 1)}
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>
              
              <div className="flex items-center gap-3">
                <span className="text-base text-[#86868b]">Slide</span>
                <Input
                  type="number"
                  value={currentSlide}
                  onChange={(e) => handleSlideChange(parseInt(e.target.value) || 1)}
                  className="w-20 h-12 text-center text-lg rounded-xl"
                  disabled={slideLocked}
                  min={1}
                  max={totalSlides}
                />
                <span className="text-base text-[#86868b]">of {totalSlides}</span>
              </div>

              <Button 
                variant="outline"
                className="h-12 px-6 rounded-xl"
                disabled={currentSlide >= totalSlides || slideLocked}
                onClick={() => handleSlideChange(currentSlide + 1)}
              >
                <ChevronRight className="w-6 h-6" />
              </Button>
            </div>
          </Card>

          {/* AI Assistant - Constrained */}
          <Card className="p-6 rounded-2xl border-0 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#1d1d1f]">Ask About This Slide</h3>
            </div>
            
            {/* Question Input */}
            <div className="flex gap-3 mb-4">
              <Input
                placeholder="Ask a question about the current slide..."
                value={aiQuestion}
                onChange={(e) => setAiQuestion(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && askQuestion()}
                className="h-12 rounded-xl"
              />
              <Button className="h-12 px-6 rounded-xl" onClick={askQuestion}>
                <Send className="w-5 h-5" />
              </Button>
            </div>

            {/* Questions List */}
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {questions.length === 0 ? (
                <p className="text-center text-[#86868b] py-4">No questions yet. Ask your first question!</p>
              ) : (
                questions.map((q) => (
                  <div key={q.id} className={`p-4 rounded-xl ${
                    q.status === 'answered' ? 'bg-green-50 border border-green-100' : 'bg-[#f5f5f7]'
                  }`}>
                    <p className="text-base text-[#1d1d1f]">{q.question}</p>
                    {q.slideContext && (
                      <p className="text-sm text-[#86868b] mt-1">From slide {q.slideContext}</p>
                    )}
                    {q.answer && (
                      <div className="mt-3 pt-3 border-t border-green-200">
                        <p className="text-base text-[#1d1d1f]">{q.answer}</p>
                      </div>
                    )}
                    {q.status === 'pending' && (
                      <div className="mt-2 flex items-center gap-2 text-sm text-[#86868b]">
                        <Clock className="w-4 h-4" />
                        Waiting for response...
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Sidebar - Session Info */}
        <div className="space-y-6">
          {/* Session Status */}
          <Card className="p-6 rounded-2xl border-0 shadow-sm">
            <h3 className="text-lg font-semibold text-[#1d1d1f] mb-5">Session Status</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-base text-[#86868b]">Duration</span>
                <span className="font-medium text-[#1d1d1f]">{formatTime(elapsedTime)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-base text-[#86868b]">Slide</span>
                <span className="font-medium text-[#1d1d1f]">{currentSlide}/{totalSlides}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-base text-[#86868b]">Violations</span>
                <span className="font-medium text-[#1d1d1f]">0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-base text-[#86868b]">Status</span>
                <span className="font-medium text-green-600 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  Present
                </span>
              </div>
            </div>
          </Card>

          {/* Locked Warning */}
          {slideLocked && (
            <Card className="p-5 rounded-2xl border-0 shadow-sm bg-yellow-50">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-800">Slides Locked</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    The instructor has locked navigation. Wait for them to unlock.
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentSessionPage;
