import { forwardRef, type HTMLAttributes } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface ProgressBarProps extends HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'error';
  showLabel?: boolean;
  label?: string;
  animated?: boolean;
}

const sizeConfig = {
  sm: 'h-1',
  md: 'h-1.5',
  lg: 'h-2',
};

const variantConfig = {
  default: 'bg-blue-500',
  success: 'bg-green-500',
  warning: 'bg-yellow-500',
  error: 'bg-red-500',
};

export const ProgressBar = forwardRef<HTMLDivElement, ProgressBarProps>(
  (
    {
      className,
      value,
      max = 100,
      size = 'md',
      variant = 'default',
      showLabel = false,
      label,
      animated = true,
      ...props
    },
    ref
  ) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    return (
      <div ref={ref} className={twMerge(clsx('w-full', className))} {...props}>
        {(showLabel || label) && (
          <div className="flex items-center justify-between mb-1.5">
            {label && (
              <span className="text-sm font-medium text-gray-700">{label}</span>
            )}
            {showLabel && (
              <span className="text-sm font-medium text-gray-700">{Math.round(percentage)}%</span>
            )}
          </div>
        )}
        <div
          className={twMerge(
            clsx(
              'w-full bg-gray-100 rounded-full overflow-hidden',
              sizeConfig[size]
            )
          )}
        >
          <div
            className={twMerge(
              clsx(
                'h-full rounded-full transition-all duration-500 ease-out',
                variantConfig[variant],
                animated && 'animate-pulse',
                percentage === 100 && variant === 'success' && 'animate-pulse'
              )
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  }
);

ProgressBar.displayName = 'ProgressBar';

// Multi-step Progress Bar for AI Processing
interface ProcessingStep {
  id: string;
  label: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
}

interface MultiStepProgressProps extends HTMLAttributes<HTMLDivElement> {
  steps: ProcessingStep[];
  currentStep?: string;
  progress?: number;
}

export const MultiStepProgress = forwardRef<HTMLDivElement, MultiStepProgressProps>(
  ({ className, steps, currentStep, progress, ...props }, ref) => {
    const completedSteps = steps.filter((s) => s.status === 'completed').length;
    const overallProgress = Math.round((completedSteps / steps.length) * 100);

    return (
      <div ref={ref} className={twMerge(clsx('space-y-4', className))} {...props}>
        {/* Overall Progress */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">
            {currentStep || 'Processing slides for AI...'}
          </span>
          <span className="text-sm font-medium text-blue-600">{overallProgress}%</span>
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={twMerge(
              clsx(
                'h-full bg-blue-500 rounded-full transition-all duration-500 ease-out',
                progress !== undefined && 'animate-pulse'
              )
            )}
            style={{ width: `${progress !== undefined ? progress : overallProgress}%` }}
          />
        </div>

        {/* Steps Indicator */}
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex flex-col items-center">
              <div
                className={twMerge(
                  clsx(
                    'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300',
                    step.status === 'completed' && 'bg-green-500 text-white',
                    step.status === 'in_progress' && 'bg-blue-500 text-white animate-pulse',
                    step.status === 'pending' && 'bg-gray-200 text-gray-500',
                    step.status === 'error' && 'bg-red-500 text-white'
                  )
                )}
              >
                {step.status === 'completed' ? (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              <span className="text-xs text-gray-500 mt-1 hidden sm:block">{step.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
);

MultiStepProgress.displayName = 'MultiStepProgress';

// Circular Progress for file operations
interface CircularProgressProps extends HTMLAttributes<HTMLDivElement> {
  value: number;
  size?: number;
  strokeWidth?: number;
  variant?: 'default' | 'success' | 'warning' | 'error';
  showValue?: boolean;
}

export const CircularProgress = forwardRef<HTMLDivElement, CircularProgressProps>(
  (
    {
      className,
      value,
      size = 48,
      strokeWidth = 4,
      variant = 'default',
      showValue = true,
      ...props
    },
    ref
  ) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (value / 100) * circumference;

    const colorMap = {
      default: '#3b82f6',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
    };

    return (
      <div ref={ref} className={twMerge(clsx('relative inline-flex items-center justify-center', className))} {...props}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={colorMap[variant]}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-500 ease-out"
          />
        </svg>
        {showValue && (
          <span className="absolute text-xs font-medium text-gray-700">
            {Math.round(value)}%
          </span>
        )}
      </div>
    );
  }
);

CircularProgress.displayName = 'CircularProgress';
