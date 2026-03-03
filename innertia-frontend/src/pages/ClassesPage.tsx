import { useState } from 'react';
import { MainLayout, DashboardGrid } from '../components/layout/MainLayout';
import { ClassTable } from '../components/faculty/ClassTable';
import { RecentSessions } from '../components/faculty/RecentSessions';
import { CreateClassButton } from '../components/faculty/CreateClassForm';
import { useFacultyData } from '../hooks/useFacultyData';
import { PageSkeleton } from '../components/ui/PageSkeleton';
import { ErrorState } from '../components/ui/ErrorState';
import type { Class } from '../types';

export const ClassesPage = () => {
  const { data: facultyData, isLoading, error, refetch } = useFacultyData();
  const [editingClass, setEditingClass] = useState<Class | null>(null);

  const handleCreateClass = (newClass: Class) => {
    console.log('Creating class:', newClass);
    setEditingClass(null);
    refetch(); // Refetch data after creating a class
  };

  const handleEditClass = (classData: Class) => {
    setEditingClass(classData);
  };

  const handleDeleteClass = (id: string) => {
    console.log('Deleting class:', id);
    refetch(); // Refetch data after deleting a class
  };

  const handleViewReport = (sessionId: string) => {
    console.log('View report for session:', sessionId);
  };

  const handleStartSession = (sessionId: string) => {
    console.log('Start session:', sessionId);
  };

  const renderContent = () => {
    if (isLoading) {
      return <PageSkeleton />;
    }

    if (error) {
      return <ErrorState message={error} onRetry={refetch} />;
    }

    if (facultyData) {
      return (
        <DashboardGrid columns={3}>
          <div className="lg:col-span-2">
            <ClassTable
              classes={facultyData.classes}
              onEdit={handleEditClass}
              onDelete={handleDeleteClass}
            />
          </div>
          <div className="lg:col-span-1">
            <RecentSessions
              sessions={facultyData.recentSessions}
              onViewReport={handleViewReport}
              onStartSession={handleStartSession}
            />
          </div>
        </DashboardGrid>
      );
    }

    return null; // Should not happen if data fetching is correct
  };

  return (
    <MainLayout
      headerTitle="Class Management"
      headerBreadcrumbs={[
        { label: 'Dashboard', path: '/' },
        { label: 'Classes' },
      ]}
      headerActions={
        <CreateClassButton
          onCreate={handleCreateClass}
          editClass={editingClass}
        />
      }
    >
      {renderContent()}
    </MainLayout>
  );
};
