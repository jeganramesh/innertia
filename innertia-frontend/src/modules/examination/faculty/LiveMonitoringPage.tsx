/**
 * Live Monitoring Page
 * 
 * Faculty interface for monitoring ongoing exams in real-time.
 * Shows active students, violation alerts, and allows intervention.
 * Follows Apple-style aesthetic.
 */

import { useState, useEffect, useRef } from 'react';
import { examApiService, Exam, Violation } from '../api/examApi';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';
import { 
  UsersIcon, 
  ExclamationTriangleIcon,
  StopIcon,
  EyeIcon,
  BellIcon,
  SignalIcon,
  ShieldExclamationIcon
} from '@heroicons/react/24/outline';

interface ActiveStudent {
  attempt_id: string;
  student_id: string;
  student_name?: string;
  started_at: string;
  violation_count: number;
  status: string;
  ip_address?: string;
}

interface MonitoringEvent {
  type: string;
  student_id?: string;
  student_name?: string;
  violation_type?: string;
  severity?: string;
  count?: number;
  timestamp: string;
}

const LiveMonitoringPage = ({ examId }: { examId: string }) => {
  const [exam, setExam] = useState<Exam | null>(null);
  const [activeStudents, setActiveStudents] = useState<ActiveStudent[]>([]);
  const [events, setEvents] = useState<MonitoringEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    loadExam();
    connectWebSocket();
    const pollInterval = setInterval(loadActiveStudents, 5000);
    
    return () => {
      clearInterval(pollInterval);
      wsRef.current?.close();
    };
  }, [examId]);

  const loadExam = async () => {
    try {
      const data = await examApiService.getExam(examId);
      setExam(data);
    } catch (error) {
      console.error('Failed to load exam:', error);
    }
  };

  const loadActiveStudents = async () => {
    try {
      const students = await examApiService.getActiveStudents(examId);
      setActiveStudents(students);
    } catch (error) {
      console.error('Failed to load active students:', error);
    }
  };

  const connectWebSocket = () => {
    const wsUrl = `${import.meta.env.VITE_WS_URL || 'ws://localhost:8000'}/ws/monitor/${examId}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleWebSocketMessage(data);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };

    wsRef.current = ws;
  };

  const handleWebSocketMessage = (data: MonitoringEvent) => {
    switch (data.type) {
      case 'init':
        setActiveStudents(data.active_students || []);
        break;
      case 'violation':
        setEvents((prev) => [{
          type: 'violation',
          student_id: data.student_id,
          violation_type: data.violation_type,
          severity: data.severity,
          count: data.count,
          timestamp: data.timestamp,
        }, ...prev].slice(0, 50));
        loadActiveStudents();
        break;
      case 'student_start':
        setEvents((prev) => [{
          type: 'start',
          student_id: data.student_id,
          student_name: data.student_name,
          timestamp: data.timestamp,
        }, ...prev].slice(0, 50));
        loadActiveStudents();
        break;
      case 'student_submit':
        setEvents((prev) => [{
          type: 'submit',
          student_id: data.student_id,
          student_name: data.student_name,
          timestamp: data.timestamp,
        }, ...prev].slice(0, 50));
        loadActiveStudents();
        break;
      case 'terminated':
        loadActiveStudents();
        break;
    }
  };

  const handleTerminate = async (studentId: string) => {
    if (!confirm('Are you sure you want to terminate this student\'s exam?')) {
      return;
    }
    
    try {
      await examApiService.terminateStudent(examId, studentId);
      loadActiveStudents();
    } catch (error) {
      console.error('Failed to terminate student:', error);
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'violation':
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />;
      case 'start':
        return <UsersIcon className="w-5 h-5 text-green-500" />;
      case 'submit':
        return <ShieldExclamationIcon className="w-5 h-5 text-blue-500" />;
      default:
        return <BellIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'medium':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'low':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Live Monitoring"
        subtitle={exam?.title || 'Monitoring ongoing exam'}
      >
        <div className="flex items-center gap-2">
          <SignalIcon className="w-5 h-5 text-green-500" />
          <span className="text-sm text-gray-600">Live</span>
        </div>
      </PageHeader>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-3 gap-6">
          {/* Active Students Panel */}
          <div className="col-span-2">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <UsersIcon className="w-5 h-5" />
                  Active Students ({activeStudents.length})
                </h2>
              </div>

              {activeStudents.length === 0 ? (
                <div className="text-center py-12">
                  <UsersIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">No students currently taking the exam</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {activeStudents.map((student) => (
                    <div
                      key={student.attempt_id}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        selectedStudent === student.student_id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedStudent(student.student_id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-600 font-medium">
                              {student.student_name?.charAt(0) || 'S'}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {student.student_name || 'Student'}
                            </h3>
                            <p className="text-sm text-gray-500">
                              Started: {new Date(student.started_at).toLocaleTimeString()}
                              {student.ip_address && ` • IP: ${student.ip_address}`}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          {student.violation_count > 0 && (
                            <Badge className="bg-red-100 text-red-700">
                              <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                              {student.violation_count} violations
                            </Badge>
                          )}
                          
                          <Badge className="bg-green-100 text-green-700">
                            In Progress
                          </Badge>

                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleTerminate(student.student_id)}
                          >
                            <StopIcon className="w-4 h-4 mr-1" />
                            Terminate
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Events Panel */}
          <div>
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <BellIcon className="w-5 h-5" />
                Live Events
              </h2>

              <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
                {events.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No events yet</p>
                ) : (
                  events.map((event, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg border ${getSeverityColor(event.severity)} ${
                        event.type === 'violation' ? 'bg-red-50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {getEventIcon(event.type)}
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {event.type === 'violation' && (
                              <>Violation: {event.violation_type}</>
                            )}
                            {event.type === 'start' && 'Student started exam'}
                            {event.type === 'submit' && 'Student submitted exam'}
                          </p>
                          {event.count && (
                            <p className="text-xs text-gray-500 mt-1">
                              Total violations: {event.count}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(event.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveMonitoringPage;
