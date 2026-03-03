/**
 * College Feature Toggle Component
 * Switch component for toggling college-level features with optimistic UI
 */

import { useState } from 'react';
import { CollegeFeature } from '../types';
import { useToggleCollegeFeature } from '../hooks';
import { Loader2 } from 'lucide-react';

interface CollegeFeatureToggleProps {
  collegeId: string;
  feature: CollegeFeature;
}

const FEATURE_LABELS: Record<string, string> = {
  attendance_tracking: 'Attendance Tracking',
  ai_notes: 'AI Notes',
  placement_module: 'Placement Module',
  assessment_module: 'Assessment Module',
  advanced_reports: 'Advanced Reports',
  live_session_lock: 'Live Session Lock',
  student_portal: 'Student Portal',
  faculty_portal: 'Faculty Portal',
  staff_portal: 'Staff Portal',
  trainer_portal: 'Trainer Portal',
  college_analytics: 'College Analytics',
};

export const CollegeFeatureToggle = ({ collegeId, feature }: CollegeFeatureToggleProps) => {
  const [isOptimistic, setIsOptimistic] = useState(feature.is_enabled);
  const toggleMutation = useToggleCollegeFeature();

  const handleToggle = async () => {
    const newValue = !isOptimistic;
    setIsOptimistic(newValue);
    
    try {
      await toggleMutation.mutateAsync({
        collegeId,
        payload: {
          feature_key: feature.feature_key,
          is_enabled: newValue,
        },
      });
    } catch (error) {
      // Revert on error
      setIsOptimistic(!newValue);
    }
  };

  const isLoading = toggleMutation.isPending;

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg bg-white">
      <div className="flex-1">
        <p className="font-medium text-gray-900">
          {FEATURE_LABELS[feature.feature_key] || feature.feature_key}
        </p>
        <p className="text-sm text-gray-500">{feature.feature_key}</p>
      </div>
      
      <button
        onClick={handleToggle}
        disabled={isLoading}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          isOptimistic ? 'bg-blue-600' : 'bg-gray-200'
        } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        {isLoading && (
          <Loader2 className="absolute left-1 h-4 w-4 animate-spin text-white" />
        )}
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            isOptimistic ? 'translate-x-6' : 'translate-x-1'
          } ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        />
      </button>
    </div>
  );
};

export default CollegeFeatureToggle;
