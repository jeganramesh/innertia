import { forwardRef, type HTMLAttributes } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { CheckCircle, AlertCircle, Clock, Loader2, FileText } from 'lucide-react';

export type StatusType = 'processing' | 'completed' | 'error' | 'queued' | 'uploading';

interface StatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  status: StatusType;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  animate?: boolean;
}

const statusConfig: Record<StatusType, { colors: string; icon: React.ReactNode; label: string }> = {
  processing: {
    colors: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: <Loader2 className="w-3 h-3 animate-spin" />,
    label: 'Processing',
  },
  completed: {
    colors: 'bg-green-50 text-green-700 border-green-200',
    icon: <CheckCircle className="w-3 h-3" />,
    label: 'Completed',
  },
  error: {
    colors: 'bg-red-50 text-red-700 border-red-200',
    icon: <AlertCircle className="w-3 h-3" />,
    label: 'Error',
  },
  queued: {
    colors: 'bg-gray-50 text-gray-700 border-gray-200',
    icon: <Clock className="w-3 h-3" />,
    label: 'Queued',
  },
  uploading: {
    colors: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: <FileText className="w-3 h-3 animate-pulse" />,
    label: 'Uploading',
  },
};

const sizeConfig = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm',
};

const iconSizeConfig = {
  sm: 'w-3 h-3',
  md: 'w-3.5 h-3.5',
  lg: 'w-4 h-4',
};

export const StatusBadge = forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ className, status, size = 'md', showIcon = true, animate = false, children, ...props }, ref) => {
    const config = statusConfig[status];
    const isAnimating = animate && (status === 'processing' || status === 'uploading');

    return (
      <span
        ref={ref}
        className={twMerge(
          clsx(
            'inline-flex items-center gap-1.5 rounded-full font-medium border transition-all duration-200',
            config.colors,
            sizeConfig[size],
            isAnimating && 'animate-pulse',
            className
          )
        )}
        {...props}
      >
        {showIcon && (
          <span className={clsx('flex-shrink-0', iconSizeConfig[size])}>
            {config.icon}
          </span>
        )}
        <span className="truncate">{children || config.label}</span>
      </span>
    );
  }
);

StatusBadge.displayName = 'StatusBadge';

// Progress Badge with percentage
interface ProgressBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  progress: number;
  size?: 'sm' | 'md' | 'lg';
}

export const ProgressBadge = forwardRef<HTMLSpanElement, ProgressBadgeProps>(
  ({ className, progress, size = 'md', ...props }, ref) => {
    const percentage = Math.round(progress);
    
    return (
      <span
        ref={ref}
        className={twMerge(
          clsx(
            'inline-flex items-center gap-2 rounded-full font-medium border bg-white text-gray-700 transition-all duration-300',
            sizeConfig[size],
            className
          )
        )}
        {...props}
      >
        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={clsx(
              'h-full rounded-full transition-all duration-500 ease-out',
              percentage >= 100 ? 'bg-green-500' : 'bg-blue-500'
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-xs font-medium">{percentage}%</span>
      </span>
    );
  }
);

ProgressBadge.displayName = 'ProgressBadge';
