/**
 * Live Monitoring Panel
 * 
 * Real-time exam monitoring dashboard for faculty/admin.
 * Shows student progress, connection status, and allows proctor actions.
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { examDesktopApiService, LiveMonitoringSnapshot, StudentLiveStatus } from '../api/examDesktopApi';
import {
  Users,
  Clock,
  AlertTriangle,
  Wifi,
  WifiOff,
  CheckCircle,
  MessageSquare,
  Pause,
  Play,
  LogOut,
  Timer,
  Shield,
  MoreVertical,
  RefreshCw,
  Send
} from 'lucide-react';

interface LiveMonitoringPanelProps {
  examId: string;
  examTitle: string;
}

export const LiveMonitoringPanel: React.FC<LiveMonitoringPanelProps> = ({ examId, examTitle }) => {
  const [monitoringData, setMonitoringData] = useState<LiveMonitoringSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<StudentLiveStatus | null>(null);
  const [warningMessage, setWarningMessage] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [extendMinutes, setExtendMinutes] = useState(10);
  const [isPaused, setIsPaused] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(false);

  // Fetch monitoring data
  const fetchData = useCallback(async () => {
    try {
      const data = await examDesktopApiService.getLiveMonitoring(examId);
      setMonitoringData(data);
      setIsPaused(data.current_settings.is_paused);
    } catch (error) {
      console.error('Failed to fetch monitoring data:', error);
    } finally {
      setLoading(false);
    }
  }, [examId]);

  // Poll for updates
  useEffect(() => {
    fetchData();
    const stopPolling = examDesktopApiService.startMonitoringPolling(examId, (data) => {
      setMonitoringData(data);
      setIsPaused(data.current_settings.is_paused);
    }, 5000);

    return () => stopPolling();
  }, [examId, fetchData]);

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress': return 'bg-green-500';
      case 'submitted': return 'bg-blue-500';
      case 'disconnected': return 'bg-red-500';
      case 'paused': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'in_progress': return 'Active';
      case 'submitted': return 'Submitted';
      case 'disconnected': return 'Disconnected';
      case 'paused': return 'Paused';
      default: return status;
    }
  };

  // Proctor actions
  const handleSendWarning = async () => {
    if (!selectedStudent || !warningMessage) return;
    setActionInProgress(true);
    try {
      await examDesktopApiService.sendWarning(examId, selectedStudent.student_id, warningMessage);
      setWarningMessage('');
      alert(`Warning sent to ${selectedStudent.student_name}`);
    } catch (error) {
      alert('Failed to send warning');
    } finally {
      setActionInProgress(false);
    }
  };

  const handleExtendTime = async () => {
    if (!selectedStudent) return;
    setActionInProgress(true);
    try {
      await examDesktopApiService.extendTime(examId, selectedStudent.student_id, extendMinutes, 'Proctor time extension');
      alert(`Extended time by ${extendMinutes} minutes for ${selectedStudent.student_name}`);
    } catch (error) {
      alert('Failed to extend time');
    } finally {
      setActionInProgress(false);
    }
  };

  const handleForceSubmit = async () => {
    if (!selectedStudent) return;
    if (!confirm(`Force submit exam for ${selectedStudent.student_name}?`)) return;
    
    setActionInProgress(true);
    try {
      await examDesktopApiService.forceSubmit(examId, selectedStudent.student_id, 'Force submitted by proctor');
      alert(`Exam force submitted for ${selectedStudent.student_name}`);
    } catch (error) {
      alert('Failed to force submit');
    } finally {
      setActionInProgress(false);
    }
  };

  const handleKickStudent = async () => {
    if (!selectedStudent) return;
    if (!confirm(`Remove ${selectedStudent.student_name} from exam?`)) return;
    
    setActionInProgress(true);
    try {
      await examDesktopApiService.kickStudent(examId, selectedStudent.student_id, 'Removed by proctor');
      alert(`${selectedStudent.student_name} removed from exam`);
      setSelectedStudent(null);
    } catch (error) {
      alert('Failed to remove student');
    } finally {
      setActionInProgress(false);
    }
  };

  const handleBroadcast = async () => {
    if (!broadcastMessage) return;
    setActionInProgress(true);
    try {
      await examDesktopApiService.broadcastMessage(examId, broadcastMessage);
      alert('Message broadcast to all students');
      setBroadcastMessage('');
    } catch (error) {
      alert('Failed to broadcast message');
    } finally {
      setActionInProgress(false);
    }
  };

  const handlePauseResume = async () => {
    setActionInProgress(true);
    try {
      if (isPaused) {
        await examDesktopApiService.resumeExam(examId);
        setIsPaused(false);
      } else {
        await examDesktopApiService.pauseExam(examId, 'Exam paused by proctor');
        setIsPaused(true);
      }
    } catch (error) {
      alert('Failed to pause/resume exam');
    } finally {
      setActionInProgress(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!monitoringData) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 mx-auto text-yellow-500 mb-4" />
        <p className="text-gray-600">Failed to load monitoring data</p>
        <Button onClick={fetchData} variant="secondary" className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-blue-600">{monitoringData.total_students}</p>
              </div>
              <Users className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">{monitoringData.active_students}</p>
              </div>
              <Wifi className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Submitted</p>
                <p className="text-2xl font-bold text-purple-600">{monitoringData.submitted_students}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Disconnected</p>
                <p className="text-2xl font-bold text-red-600">{monitoringData.disconnected_students}</p>
              </div>
              <WifiOff className="w-8 h-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Global Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Global Controls
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button
              variant={isPaused ? "default" : "destructive"}
              onClick={handlePauseResume}
              disabled={actionInProgress}
              className="flex items-center gap-2"
            >
              {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              {isPaused ? 'Resume Exam' : 'Pause Exam'}
            </Button>

            <div className="flex gap-2 flex-1 max-w-md">
              <Input
                placeholder="Broadcast message to all students..."
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
              />
              <Button
                onClick={handleBroadcast}
                disabled={!broadcastMessage || actionInProgress}
                className="flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                Send
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Student List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Students ({monitoringData.students.length})
              </span>
              <Button variant="ghost" size="sm" onClick={fetchData}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Student</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Status</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Progress</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Time Left</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Warnings</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {monitoringData.students.map((student) => (
                    <tr
                      key={student.student_id}
                      className={`hover:bg-gray-50 cursor-pointer ${selectedStudent?.student_id === student.student_id ? 'bg-blue-50' : ''}`}
                      onClick={() => setSelectedStudent(student)}
                    >
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900">{student.student_name}</p>
                          <p className="text-sm text-gray-500">{student.student_email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${getStatusColor(student.status)}`} />
                          <span className="text-sm">{getStatusText(student.status)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-600 rounded-full"
                              style={{ width: `${student.progress_percentage}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600">{student.progress_percentage.toFixed(0)}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-sm">
                          <Clock className="w-4 h-4 text-gray-400" />
                          {Math.round(student.time_remaining_minutes)}m
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {student.warning_count > 0 ? (
                          <Badge variant="destructive">{student.warning_count}</Badge>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Student Actions Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Student Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedStudent ? (
              <div className="space-y-4">
                <div className="pb-4 border-b">
                  <h3 className="font-semibold text-lg">{selectedStudent.student_name}</h3>
                  <p className="text-sm text-gray-500">{selectedStudent.student_email}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    <span className="flex items-center gap-1">
                      <span className={`w-2 h-2 rounded-full ${getStatusColor(selectedStudent.status)}`} />
                      {getStatusText(selectedStudent.status)}
                    </span>
                    <span>Progress: {selectedStudent.progress_percentage.toFixed(1)}%</span>
                  </div>
                </div>

                {/* Send Warning */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Send Warning</label>
                  <textarea
                    className="w-full px-3 py-2 border rounded-md text-sm"
                    rows={2}
                    placeholder="Warning message..."
                    value={warningMessage}
                    onChange={(e) => setWarningMessage(e.target.value)}
                  />
                  <Button
                    onClick={handleSendWarning}
                    disabled={!warningMessage || actionInProgress}
                    variant="secondary"
                    size="sm"
                    className="w-full"
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Send Warning
                  </Button>
                </div>

                {/* Extend Time */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Extend Time</label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min={1}
                      max={60}
                      value={extendMinutes}
                      onChange={(e) => setExtendMinutes(parseInt(e.target.value))}
                      className="w-20"
                    />
                    <span className="flex items-center text-sm text-gray-600">minutes</span>
                    <Button
                      onClick={handleExtendTime}
                      disabled={actionInProgress}
                      variant="secondary"
                      size="sm"
                    >
                      <Timer className="w-4 h-4 mr-2" />
                      Extend
                    </Button>
                  </div>
                </div>

                {/* Danger Actions */}
                <div className="pt-4 border-t space-y-2">
                  <Button
                    onClick={handleForceSubmit}
                    disabled={actionInProgress}
                    variant="destructive"
                    size="sm"
                    className="w-full"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Force Submit
                  </Button>
                  <Button
                    onClick={handleKickStudent}
                    disabled={actionInProgress}
                    variant="outline"
                    size="sm"
                    className="w-full text-red-600 border-red-600 hover:bg-red-50"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Remove Student
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Select a student to view actions</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Exam Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Exam Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Avg Time Remaining</p>
              <p className="text-lg font-semibold">{Math.round(monitoringData.avg_time_remaining_minutes)} min</p>
            </div>
            <div>
              <p className="text-gray-600">Min Time Remaining</p>
              <p className="text-lg font-semibold">{Math.round(monitoringData.min_time_remaining_minutes)} min</p>
            </div>
            <div>
              <p className="text-gray-600">Total Tab Switches</p>
              <p className="text-lg font-semibold">{monitoringData.total_tab_switches}</p>
            </div>
            <div>
              <p className="text-gray-600">Total Warnings</p>
              <p className="text-lg font-semibold">{monitoringData.total_warnings_issued}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LiveMonitoringPanel;
