import { useState, useEffect, useCallback } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { 
  Play, 
  Square, 
  Lock, 
  Unlock,
  Upload,
  Clock,
  AlertTriangle,
  FileText,
  ChevronLeft,
  ChevronRight,
  Users,
  Loader2,
  RefreshCw,
  CheckCircle
} from 'lucide-react';
import { facultyApiService, SessionOut, SlideStateOut, StudentSyncStatus } from '../../services/facultyApi';

export const FacultySessionPage = () => {
  const [session, setSession] = useState<SessionOut | null>(null);
  const [slideState, setSlideState] = useState<SlideStateOut | null>(null);
  const [students, setStudents] = useState<StudentSyncStatus[]>([]);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'ready'>('idle');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch session data
  const fetchSessionData = useCallback(async () => {
    try {
      // Get active session
      const activeSession = await facultyApiService.getDashboard();
      
      if (activeSession.active_session) {
        setSession(activeSession.active_session);
        
        // Get slide states
        const slideStates = await facultyApiService.getSlideStates(activeSession.active_session.id);
        if (slideStates.length > 0) {
          setSlideState(slideStates[0]);
        }
        
        // Get student sync status
        const studentSync = await facultyApiService.getStudentSyncStatus(activeSession.active_session.id);
        setStudents(studentSync.students);
      }
    } catch (err: any) {
      console.error('Failed to fetch session:', err);
      setError(err.response?.data?.detail || 'Failed to load session');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessionData();
    
    // Poll for updates every 10 seconds
    const interval = setInterval(fetchSessionData, 10000);
    return () => clearInterval(interval);
  }, [fetchSessionData]);

  // Timer
  useEffect(() => {
    if (session?.is_active && session.started_at) {
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

  // Handle start session
  const handleStartSession = async () => {
    try {
      setIsLoading(true);
      // Get first class to start session
      const classes = await facultyApiService.getClasses();
      if (classes.length === 0) {
        alert('No classes available');
        return;
      }
      
      const newSession = await facultyApiService.startSession({ 
        class_id: classes[0].id 
      });
      setSession(newSession);
      setSlideState({
        slide_number: 0,
        locked: false
      } as SlideStateOut);
      fetchSessionData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to start session');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle end session
  const handleEndSession = async () => {
    if (!session) return;
    
    if (!confirm('Are you sure you want to end this session?')) return;
    
    try {
      await facultyApiService.endSession(session.id);
      setSession(null);
      setSlideState(null);
      setStudents([]);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to end session');
    }
  };

  // Handle slide lock toggle
  const handleToggleLock = async () => {
    if (!session || !slideState) return;
    
    try {
      const newLockState = !slideState.locked;
      await facultyApiService.toggleSlideLock({
        slide_number: slideState.slide_number,
        locked: newLockState
      });
      setSlideState({ ...slideState, locked: newLockState });
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to toggle lock');
    }
  };

  // Handle slide change
  const handleSlideChange = async (newSlide: number) => {
    if (!session || !slideState) return;
    
    try {
      await facultyApiService.toggleSlideLock({
        slide_number: newSlide,
        locked: slideState.locked
      });
      setSlideState({ ...slideState, slide_number: newSlide });
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to change slide');
    }
  };

  const presentStudents = students.filter(s => s.current_slide === (slideState?.slide_number || 0));
  const totalViolations = 0; // Would need backend support

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#0071e3]" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Session Header - Apple Style */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl lg:text-4xl font-semibold text-[#1d1d1f] tracking-tight">
            Session Control
          </h1>
          <p className="text-base text-[#86868b] mt-2">
            {session ? `Session ID: ${session.class_id}` : 'No active session'}
          </p>
        </div>
        <div className="flex items-center gap-6">
          {session?.is_active && (
            <div className="flex items-center gap-3 px-5 py-3 bg-[#f5f5f7] rounded-xl">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              <Clock className="w-5 h-5 text-[#86868b]" />
              <span className="text-xl font-semibold text-[#1d1d1f]">{formatTime(elapsedTime)}</span>
            </div>
          )}
          {!session ? (
            <Button 
              className="h-14 px-8 rounded-xl text-lg font-medium bg-green-500 hover:bg-green-600"
              onClick={handleStartSession}
            >
              <Play className="w-6 h-6 mr-2" />
              Start Session
            </Button>
          ) : (
            <Button 
              variant="outline" 
              className="h-14 px-6 rounded-xl text-lg font-medium text-red-600 border-red-300 hover:bg-red-50"
              onClick={handleEndSession}
            >
              <Square className="w-5 h-5 mr-2" />
              End Session
            </Button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 text-red-600 rounded-xl">
          <AlertTriangle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* A. Slide Upload Section - Apple Style */}
      <Card className="p-8 rounded-2xl border-0 shadow-sm">
        <h2 className="text-xl font-semibold text-[#1d1d1f] mb-6">Slide Upload</h2>
        
        {uploadStatus === 'idle' ? (
          <div className="border-2 border-dashed border-[#d2d2d7] rounded-2xl p-12 text-center hover:border-[#0071e3] transition-colors duration-200 cursor-pointer">
            <Upload className="w-12 h-12 text-[#86868b] mx-auto mb-4" />
            <p className="text-lg text-[#1d1d1f] mb-2">Drag and drop your slides here</p>
            <p className="text-base text-[#86868b]">or click to browse</p>
          </div>
        ) : uploadStatus === 'uploading' ? (
          <div className="border-2 border-dashed border-[#0071e3] bg-[#0071e3]/5 rounded-2xl p-12 text-center">
            <RefreshCw className="w-12 h-12 text-[#0071e3] mx-auto mb-4 animate-spin" />
            <p className="text-lg text-[#1d1d1f] mb-2">Uploading slides...</p>
          </div>
        ) : (
          <div className="flex items-center gap-4 p-5 bg-green-50 rounded-xl">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <span className="text-lg text-[#1d1d1f]">45 slides ready</span>
            <Button variant="ghost" size="sm" className="ml-auto">
              Change
            </Button>
          </div>
        )}
      </Card>

      {/* B. Live Control Section - Apple Style */}
      {session?.is_active && slideState && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Slide Control */}
          <div className="lg:col-span-2">
            <Card className="p-8 rounded-2xl border-0 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-semibold text-[#1d1d1f]">Slide Control</h2>
                <div className="flex items-center gap-3">
                  <span className="text-base text-[#86868b]">Slide Lock</span>
                  <button
                    onClick={handleToggleLock}
                    className={`w-16 h-8 rounded-full transition-colors duration-200 ${
                      slideState.locked ? 'bg-[#0071e3]' : 'bg-[#d2d2d7]'
                    }`}
                  >
                    <div className={`w-6 h-6 bg-white rounded-full shadow transition-transform duration-200 ${
                      slideState.locked ? 'translate-x-9' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              </div>

              {/* Slide Preview */}
              <div className="aspect-video bg-[#f5f5f7] rounded-2xl flex items-center justify-center mb-8">
                <div className="text-center">
                  <FileText className="w-20 h-20 text-[#86868b] mx-auto mb-4" />
                  <p className="text-2xl text-[#1d1d1f]">Slide {slideState.slide_number}</p>
                  <p className="text-base text-[#86868b] mt-2">Binary Search Algorithm</p>
                </div>
              </div>

              {/* Slide Navigation */}
              <div className="flex items-center justify-between">
                <Button 
                  variant="outline" 
                  size="lg"
                  className="h-12 px-6 rounded-xl"
                  disabled={slideState.slide_number <= 1 || slideState.locked}
                  onClick={() => handleSlideChange(slideState.slide_number - 1)}
                >
                  <ChevronLeft className="w-6 h-6" />
                </Button>
                
                <div className="flex items-center gap-3">
                  <span className="text-base text-[#86868b]">Slide</span>
                  <Input
                    type="number"
                    value={slideState.slide_number}
                    onChange={(e) => handleSlideChange(parseInt(e.target.value) || 1)}
                    className="w-20 h-12 text-center text-lg rounded-xl"
                    disabled={slideState.locked}
                    min={1}
                  />
                </div>

                <Button 
                  variant="outline"
                  size="lg"
                  className="h-12 px-6 rounded-xl"
                  disabled={slideState.locked}
                  onClick={() => handleSlideChange(slideState.slide_number + 1)}
                >
                  <ChevronRight className="w-6 h-6" />
                </Button>
              </div>
            </Card>
          </div>

          {/* Student List */}
          <div>
            <Card className="p-6 rounded-2xl border-0 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-[#1d1d1f]">Students</h2>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#86868b]" />
                  <span className="text-base text-[#86868b]">{presentStudents.length}/{students.length}</span>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 mb-6 p-4 bg-[#f5f5f7] rounded-xl">
                <div className="flex-1 text-center">
                  <p className="text-2xl font-semibold text-[#1d1d1f]">{presentStudents.length}</p>
                  <p className="text-sm text-[#86868b]">Synced</p>
                </div>
                <div className="w-px h-10 bg-[#d2d2d7]" />
                <div className="flex-1 text-center">
                  <p className="text-2xl font-semibold text-red-600">{totalViolations}</p>
                  <p className="text-sm text-[#86868b]">Violations</p>
                </div>
              </div>

              {/* Student List */}
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {students.length === 0 ? (
                  <p className="text-center text-[#86868b] py-4">No students in session</p>
                ) : (
                  students.map((student) => (
                    <div 
                      key={student.student_id} 
                      className="flex items-center justify-between p-4 rounded-xl bg-white border border-[#f5f5f7] gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-3 h-3 rounded-full ${
                          student.current_slide === slideState.slide_number ? 'bg-green-500' : 'bg-gray-300'
                        }`} />
                        <div>
                          <p className="font-medium text-[#1d1d1f]">
                            {student.student_name || student.student_id}
                          </p>
                          <p className="text-xs text-[#86868b]">Slide {student.current_slide}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* No Active Session */}
      {!session && (
        <Card className="p-12 rounded-2xl border-0 shadow-sm text-center">
          <FileText className="w-16 h-16 text-[#d2d2d7] mx-auto mb-4" />
          <p className="text-lg text-[#86868b]">No active session. Start a session to begin.</p>
        </Card>
      )}
    </div>
  );
};

export default FacultySessionPage;
