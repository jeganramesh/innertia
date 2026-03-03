import { useEffect } from 'react';
import { Clock, Users, TrendingUp, Play } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { StatusBadge } from '../ui/Badge';
import { useFacultyStore } from '../../stores/facultyStore';
import { formatRelativeTime, formatPercentage, formatDuration } from '../../utils/formatters';
import type { Session } from '../../types';

interface RecentSessionsProps {
  onViewReport?: (sessionId: string) => void;
  onStartSession?: (sessionId: string) => void;
}

export const RecentSessions = ({ onViewReport, onStartSession }: RecentSessionsProps) => {
  const { recentSessions, isLoading, error, fetchRecentSessions } = useFacultyStore();

  useEffect(() => {
    fetchRecentSessions();
  }, [fetchRecentSessions]);

  const displaySessions = recentSessions.slice(0, 4);

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Sessions</CardTitle>
          <CardDescription>Last 4 conducted classes</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-danger-600 text-sm">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Sessions</CardTitle>
        <CardDescription>Last 4 conducted classes</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-slate-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : displaySessions.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 text-sm">No recent sessions</p>
            <p className="text-slate-400 text-xs mt-1">
              Start a class to see it here
            </p>
          </div>
        ) : (
          <ul className="space-y-4">
            {displaySessions.map((session) => (
              <SessionItem
                key={session.id}
                session={session}
                onViewReport={onViewReport}
                onStartSession={onStartSession}
              />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

interface SessionItemProps {
  session: Session;
  onViewReport?: (sessionId: string) => void;
  onStartSession?: (sessionId: string) => void;
}

const SessionItem = ({ session, onViewReport, onStartSession }: SessionItemProps) => {
  const isCompleted = session.status === 'completed';
  const isInProgress = session.status === 'in_progress';

  return (
    <li className="group">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-medium text-slate-900 truncate">
              {session.className}
            </h4>
            <StatusBadge status={session.status} size="sm" />
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-1">
              <Clock size={12} />
              <span>{formatRelativeTime(session.startTime)}</span>
            </div>
            {isCompleted && (
              <div className="flex items-center gap-1">
                <Users size={12} />
                <span>{formatPercentage(session.attendanceRate)} attendance</span>
              </div>
            )}
          </div>
          {session.topic && (
            <p className="text-xs text-slate-600 mt-1 truncate">{session.topic}</p>
          )}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {isInProgress && onStartSession && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onStartSession(session.id)}
              className="text-blue-600 hover:text-blue-700"
              aria-label="Continue session"
            >
              <Play size={16} />
            </Button>
          )}
          {isCompleted && onViewReport && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewReport(session.id)}
              className="text-slate-600 hover:text-slate-700"
              aria-label="View report"
            >
              <TrendingUp size={16} />
            </Button>
          )}
        </div>
      </div>
    </li>
  );
};
