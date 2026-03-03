import { useEffect } from 'react';
import { MainLayout, DashboardGrid } from '../components/layout/MainLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { useFacultyStore } from '../stores/facultyStore';
import { formatPercentage } from '../utils/formatters';

export const AnalyticsPage = () => {
  const { facultyStats, isLoading, error, fetchFacultyStats } = useFacultyStore();

  useEffect(() => {
    fetchFacultyStats();
  }, [fetchFacultyStats]);

  const StatCard = ({
    title,
    value,
    description,
    icon,
  }: {
    title: string;
    value: string | number;
    description?: string;
    icon: React.ReactNode;
  }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-600 mb-1">{title}</p>
            {isLoading ? (
              <div className="h-8 w-24 bg-slate-200 rounded animate-pulse" />
            ) : (
              <p className="text-3xl font-semibold text-slate-900">{value}</p>
            )}
            {description && !isLoading && (
              <p className="text-sm text-slate-500 mt-1">{description}</p>
            )}
          </div>
          <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <MainLayout
      headerTitle="Analytics"
      headerBreadcrumbs={[
        { label: 'Dashboard', path: '/' },
        { label: 'Analytics' },
      ]}
    >
      {error && (
        <Card className="mb-6">
          <CardContent className="py-6">
            <p className="text-danger-600 text-center">{error}</p>
          </CardContent>
        </Card>
      )}

      <DashboardGrid columns={4}>
        <StatCard
          title="Total Classes"
          value={facultyStats?.totalClasses ?? 0}
          description="Active and archived"
          icon={<span className="text-blue-600 text-xl">📚</span>}
        />
        <StatCard
          title="Active Classes"
          value={facultyStats?.activeClasses ?? 0}
          description="Currently running"
          icon={<span className="text-success-600 text-xl">✓</span>}
        />
        <StatCard
          title="Total Sessions"
          value={facultyStats?.totalSessions ?? 0}
          description="All time"
          icon={<span className="text-warning-600 text-xl">📊</span>}
        />
        <StatCard
          title="Total Students"
          value={facultyStats?.totalStudents ?? 0}
          description="Enrolled across all classes"
          icon={<span className="text-purple-600 text-xl">👥</span>}
        />
      </DashboardGrid>

      <DashboardGrid columns={2} className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Attendance Overview</CardTitle>
            <CardDescription>Average attendance rate across all sessions</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-48 bg-slate-200 rounded animate-pulse" />
            ) : (
              <div className="text-center py-8">
                <p className="text-5xl font-bold text-slate-900 mb-2">
                  {facultyStats ? formatPercentage(facultyStats.averageAttendance) : '0%'}
                </p>
                <p className="text-sm text-slate-600">Average Attendance Rate</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest teaching sessions</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-slate-200 rounded animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-slate-500 text-sm">
                  Activity chart will be displayed here
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </DashboardGrid>
    </MainLayout>
  );
};
