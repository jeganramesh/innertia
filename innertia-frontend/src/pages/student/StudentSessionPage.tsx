import { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { 
  Lock, 
  Unlock,
  ChevronLeft, 
  ChevronRight,
  FileText,
  MessageSquare,
  Send,
  Download,
  Clock,
  Eye,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { AIQuestion } from './types';

// Mock data
const mockAIQuestions: AIQuestion[] = [
  { id: '1', question: 'What is the time complexity of binary search?', answer: 'O(log n) - Binary search has logarithmic time complexity because it divides the search space in half with each comparison.', slideContext: 15, status: 'answered', createdAt: '2024-02-18T09:30:00' },
  { id: '2', question: 'Can you explain recursion with an example?', status: 'pending', createdAt: '2024-02-18T09:35:00' },
];

export const StudentSessionPage = () => {
  const [currentSlide, setCurrentSlide] = useState(15);
  const [totalSlides] = useState(45);
  const [slideLocked, setSlideLocked] = useState(true);
  const [aiQuestion, setAiQuestion] = useState('');
  const [questions, setQuestions] = useState<AIQuestion[]>(mockAIQuestions);
  const [focusStatus] = useState({ percentage: 92, status: 'good' });

  const askQuestion = () => {
    if (!aiQuestion.trim()) return;
    const newQuestion: AIQuestion = {
      id: `q-${Date.now()}`,
      question: aiQuestion,
      status: 'pending',
      slideContext: currentSlide,
      createdAt: new Date().toISOString()
    };
    setQuestions([...questions, newQuestion]);
    setAiQuestion('');
  };

  return (
    <div className="space-y-6">
      {/* Session Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">CS101 - Introduction to Programming</h1>
          <p className="text-gray-500 mt-1">Dr. John Smith • Session in Progress</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Focus Status */}
          <div className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
            focusStatus.status === 'good' ? 'bg-green-100 text-green-700' :
            focusStatus.status === 'warning' ? 'bg-yellow-100 text-yellow-700' :
            'bg-red-100 text-red-700'
          }`}>
            <Eye className="w-5 h-5" />
            <span className="font-medium">{focusStatus.percentage}% Focus</span>
          </div>
          
          {/* Slide Lock Status */}
          <div className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
            slideLocked ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
          }`}>
            {slideLocked ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
            <span className="font-medium">{slideLocked ? 'Slides Locked' : 'Slides Unlocked'}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Slide View */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-6">
            {/* Slide Display Area */}
            <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center mb-4">
              <div className="text-center">
                <FileText className="w-20 h-20 text-gray-400 mx-auto mb-3" />
                <p className="text-lg text-gray-600">Slide {currentSlide} of {totalSlides}</p>
                <p className="text-sm text-gray-400">Binary Search Algorithm</p>
              </div>
            </div>

            {/* Slide Navigation */}
            <div className="flex items-center justify-between">
              <Button 
                variant="outline" 
                disabled={currentSlide <= 1 || slideLocked}
                onClick={() => setCurrentSlide(currentSlide - 1)}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Slide</span>
                <Input
                  type="number"
                  value={currentSlide}
                  onChange={(e) => setCurrentSlide(parseInt(e.target.value) || 1)}
                  className="w-16 text-center"
                  disabled={slideLocked}
                  min={1}
                  max={totalSlides}
                />
                <span className="text-sm text-gray-500">of {totalSlides}</span>
              </div>

              <Button 
                variant="outline"
                disabled={currentSlide >= totalSlides || slideLocked}
                onClick={() => setCurrentSlide(currentSlide + 1)}
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </Card>

          {/* AI Assistant */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                AI Assistant
              </h3>
              <span className="text-xs text-gray-500">Ask questions about the slides</span>
            </div>
            
            {/* Question Input */}
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="Ask a question about the current slide..."
                value={aiQuestion}
                onChange={(e) => setAiQuestion(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && askQuestion()}
                className="flex-1"
              />
              <Button onClick={askQuestion}>
                <Send className="w-4 h-4" />
              </Button>
            </div>

            {/* Questions List */}
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {questions.map((q) => (
                <div key={q.id} className={`p-3 rounded-lg ${
                  q.status === 'answered' ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                }`}>
                  <p className="text-sm font-medium text-gray-900">{q.question}</p>
                  {q.slideContext && (
                    <p className="text-xs text-gray-400 mt-1">From slide {q.slideContext}</p>
                  )}
                  {q.answer && (
                    <div className="mt-2 pt-2 border-t border-green-200">
                      <p className="text-sm text-gray-700">{q.answer}</p>
                    </div>
                  )}
                  {q.status === 'pending' && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-yellow-600">
                      <Clock className="w-3 h-3" />
                      Waiting for response...
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Sidebar - Session Info */}
        <div className="space-y-4">
          {/* Session Status */}
          <Card className="p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Session Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Duration</span>
                <span className="font-medium">45 min</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Your Focus</span>
                <span className="font-medium text-green-600">{focusStatus.percentage}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Violations</span>
                <span className="font-medium">0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Attendance</span>
                <span className="font-medium text-green-600 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  Present
                </span>
              </div>
            </div>
          </Card>

          {/* Warnings */}
          <Card className="p-5 bg-yellow-50 border-yellow-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-800">Important</p>
                <p className="text-sm text-yellow-700 mt-1">
                  Slides are locked by the instructor. Navigation is disabled.
                </p>
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <Download className="w-4 h-4 mr-2" />
                Download Slide
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <FileText className="w-4 h-4 mr-2" />
                Take Notes
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StudentSessionPage;
