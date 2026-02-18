import { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { 
  Play, 
  Pause, 
  Square, 
  Lock, 
  Unlock,
  ChevronLeft, 
  ChevronRight,
  Users,
  AlertTriangle,
  TrendingUp,
  Download,
  MessageSquare,
  FileText,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';
import { StudentAttendance, SlideInfo } from './types';

// Mock data
const mockStudents: StudentAttendance[] = [
  { id: '1', studentId: 's1', studentName: 'John Doe', studentEmail: 'john@edu.com', present: true, focusPercentage: 95, violations: 0, joinTime: '09:00' },
  { id: '2', studentId: 's2', studentName: 'Jane Smith', studentEmail: 'jane@edu.com', present: true, focusPercentage: 88, violations: 1, joinTime: '09:02' },
  { id: '3', studentId: 's3', studentName: 'Mike Johnson', studentEmail: 'mike@edu.com', present: true, focusPercentage: 72, violations: 2, joinTime: '09:05' },
  { id: '4', studentId: 's4', studentName: 'Sarah Williams', studentEmail: 'sarah@edu.com', present: true, focusPercentage: 91, violations: 0, joinTime: '09:00' },
  { id: '5', studentId: 's5', studentName: 'Tom Brown', studentEmail: 'tom@edu.com', present: false, focusPercentage: 0, violations: 0 },
  { id: '6', studentId: 's6', studentName: 'Emily Davis', studentEmail: 'emily@edu.com', present: true, focusPercentage: 85, violations: 1, joinTime: '09:03' },
  { id: '7', studentId: 's7', studentName: 'Chris Wilson', studentEmail: 'chris@edu.com', present: true, focusPercentage: 78, violations: 1, joinTime: '09:01' },
  { id: '8', studentId: 's8', studentName: 'Lisa Taylor', studentEmail: 'lisa@edu.com', present: true, focusPercentage: 92, violations: 0, joinTime: '09:00' },
];

export const FacultySessionPage = () => {
  const [slideInfo, setSlideInfo] = useState<SlideInfo>({
    currentSlide: 15,
    totalSlides: 45,
    slideLocked: true
  });
  const [sessionActive, setSessionActive] = useState(true);
  const [sessionPaused, setSessionPaused] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(45); // minutes

  useEffect(() => {
    const timer = setInterval(() => {
      if (sessionActive && !sessionPaused) {
        setElapsedTime(prev => prev + 1);
      }
    }, 60000);
    return () => clearInterval(timer);
  }, [sessionActive, sessionPaused]);

  const formatTime = (mins: number) => {
    const hours = Math.floor(mins / 60);
    const minutes = mins % 60;
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const presentStudents = mockStudents.filter(s => s.present);
  const syncedStudents = presentStudents.filter(s => s.focusPercentage > 70);
  const avgFocus = Math.round(presentStudents.reduce((acc, s) => acc + s.focusPercentage, 0) / presentStudents.length);

  return (
    <div className="space-y-6">
      {/* Session Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">CS101 - Introduction to Programming</h1>
          <p className="text-gray-500 mt-1">Live Session Control</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-gray-500">Session Duration</p>
            <p className="text-xl font-bold">{formatTime(elapsedTime)}</p>
          </div>
          <div className="flex gap-2">
            {!sessionActive ? (
              <Button className="flex items-center gap-2 bg-green-500 hover:bg-green-600" onClick={() => setSessionActive(true)}>
                <Play className="w-4 h-4" />
                Start
              </Button>
            ) : (
              <>
                {sessionPaused ? (
                  <Button className="flex items-center gap-2 bg-green-500 hover:bg-green-600" onClick={() => setSessionPaused(false)}>
                    <Play className="w-4 h-4" />
                    Resume
                  </Button>
                ) : (
                  <Button variant="outline" className="flex items-center gap-2" onClick={() => setSessionPaused(true)}>
                    <Pause className="w-4 h-4" />
                    Pause
                  </Button>
                )}
                <Button variant="outline" className="flex items-center gap-2 text-red-600 border-red-300 hover:bg-red-50">
                  <Square className="w-4 h-4" />
                  End
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500 rounded-lg">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Present</p>
              <p className="text-xl font-bold">{presentStudents.length}/{mockStudents.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500 rounded-lg">
              <Eye className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Synced</p>
              <p className="text-xl font-bold">{syncedStudents.length}/{presentStudents.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500 rounded-lg">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Avg Focus</p>
              <p className="text-xl font-bold">{avgFocus}%</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Violations</p>
              <p className="text-xl font-bold">5</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Slide Control */}
        <div className="lg:col-span-2 space-y-4">
          {/* Slide Display */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Slide Control</h3>
              <Button 
                variant={slideInfo.slideLocked ? 'primary' : 'outline'}
                size="sm"
                className="flex items-center gap-2"
                onClick={() => setSlideInfo({...slideInfo, slideLocked: !slideInfo.slideLocked})}
              >
                {slideInfo.slideLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                {slideInfo.slideLocked ? 'Locked' : 'Unlocked'}
              </Button>
            </div>
            
            {/* Slide Preview Area */}
            <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center mb-4">
              <div className="text-center">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Slide {slideInfo.currentSlide} of {slideInfo.totalSlides}</p>
                <p className="text-sm text-gray-400">PPT Preview Area</p>
              </div>
            </div>

            {/* Slide Navigation */}
            <div className="flex items-center justify-between">
              <Button 
                variant="outline" 
                disabled={slideInfo.currentSlide <= 1}
                onClick={() => setSlideInfo({...slideInfo, currentSlide: slideInfo.currentSlide - 1})}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Slide</span>
                <input 
                  type="number" 
                  value={slideInfo.currentSlide}
                  onChange={(e) => setSlideInfo({...slideInfo, currentSlide: parseInt(e.target.value) || 1})}
                  className="w-16 px-2 py-1 border rounded text-center"
                  min={1}
                  max={slideInfo.totalSlides}
                />
                <span className="text-sm text-gray-500">of {slideInfo.totalSlides}</span>
              </div>

              <Button 
                variant="outline"
                disabled={slideInfo.currentSlide >= slideInfo.totalSlides}
                onClick={() => setSlideInfo({...slideInfo, currentSlide: slideInfo.currentSlide + 1})}
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </Card>

          {/* AI Questions */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Student Questions (AI)</h3>
              <Button variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-700">"What is the time complexity of binary search?"</p>
                <p className="text-xs text-blue-600 mt-1">From slide 15 • 2 min ago</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 italic">No more questions</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Student List */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Students</h3>
            <Button variant="ghost" size="sm">
              <Download className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {mockStudents.map((student) => (
              <div 
                key={student.id} 
                className={`p-3 rounded-lg flex items-center justify-between ${
                  student.present ? 'bg-white border' : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    student.present ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                  <div>
                    <p className={`text-sm font-medium ${student.present ? 'text-gray-900' : 'text-gray-400'}`}>
                      {student.studentName}
                    </p>
                    {student.joinTime && (
                      <p className="text-xs text-gray-400">Joined: {student.joinTime}</p>
                    )}
                  </div>
                </div>
                {student.present && (
                  <div className="text-right">
                    <span className={`text-sm font-medium ${
                      student.focusPercentage >= 80 ? 'text-green-600' :
                      student.focusPercentage >= 60 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {student.focusPercentage}%
                    </span>
                    {student.violations > 0 && (
                      <div className="flex items-center gap-1 text-xs text-red-500">
                        <AlertTriangle className="w-3 h-3" />
                        {student.violations}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default FacultySessionPage;
