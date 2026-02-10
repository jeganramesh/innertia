import { forwardRef, type HTMLAttributes } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

const badgeVariants = {
  default: 'bg-slate-100 text-slate-700 border-slate-200',
  primary: 'bg-blue-100 text-blue-700 border-blue-200',
  success: 'bg-success-100 text-success-700 border-success-200',
  warning: 'bg-warning-100 text-warning-700 border-warning-200',
  danger: 'bg-danger-100 text-danger-700 border-danger-200',
  outline: 'bg-transparent text-slate-700 border-slate-300',
};

const badgeSizes = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm',
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={twMerge(
          clsx(
            'inline-flex items-center justify-center rounded-full border font-medium transition-colors duration-200',
            badgeVariants[variant],
            badgeSizes[size],
            className
          )
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

// Status badge component for class/session status
interface StatusBadgeProps extends Omit<BadgeProps, 'variant'> {
  status: 'active' | 'archived' | 'completed' | 'in_progress' | 'scheduled';
}

const statusVariantMap: Record<StatusBadgeProps['status'], BadgeProps['variant']> = {
  active: 'success',
  archived: 'default',
  completed: 'success',
  in_progress: 'primary',
  scheduled: 'warning',
};

const statusLabels: Record<StatusBadgeProps['status'], string> = {
  active: 'Active',
  archived: 'Archived',
  completed: 'Completed',
  in_progress: 'In Progress',
  scheduled: 'Scheduled',
};

export const StatusBadge = ({ status, ...props }: StatusBadgeProps) => {
  return (
    <Badge variant={statusVariantMap[status]} {...props}>
      {statusLabels[status]}
    </Badge>
  );
};

// Avatar component
interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  initials?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const avatarSizes = {
  sm: 'w-6 h-6 text-xs',
  md: 'w-8 h-8 text-sm',
  lg: 'w-10 h-10 text-base',
  xl: 'w-12 h-12 text-lg',
};

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt, initials, size = 'md', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={twMerge(
          clsx(
            'rounded-full bg-slate-200 flex items-center justify-center font-medium text-slate-600 overflow-hidden',
            avatarSizes[size],
            className
          )
        )}
        {...props}
      >
        {src ? (
          <img src={src} alt={alt || 'Avatar'} className="w-full h-full object-cover" />
        ) : (
          <span>{initials || '?'}</span>
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

// Skeleton component for loading states
interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

const skeletonVariants = {
  text: 'h-4 rounded',
  circular: 'rounded-full',
  rectangular: 'rounded',
};

export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant = 'text', width, height, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={twMerge(
          clsx(
            'bg-slate-200 animate-pulse',
            skeletonVariants[variant],
            className
          )
        )}
        style={{ width, height }}
        {...props}
      />
    );
  }
);

Skeleton.displayName = 'Skeleton';

// Progress bar component
interface ProgressBarProps extends HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'success' | 'warning' | 'danger';
  showLabel?: boolean;
}

const progressSizes = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
};

const progressColors = {
  primary: 'bg-blue-700',
  success: 'bg-success-700',
  warning: 'bg-warning-700',
  danger: 'bg-danger-700',
};

export const ProgressBar = forwardRef<HTMLDivElement, ProgressBarProps>(
  (
    {
      className,
      value,
      max = 100,
      size = 'md',
      color = 'primary',
      showLabel = false,
      ...props
    },
    ref
  ) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    return (
      <div ref={ref} className="w-full">
        {showLabel && (
          <div className="flex justify-between text-sm text-slate-600 mb-1">
            <span>Progress</span>
            <span>{Math.round(percentage)}%</span>
          </div>
        )}
        <div
          className={twMerge(
            clsx(
              'w-full bg-slate-200 rounded-full overflow-hidden',
              progressSizes[size],
              className
            )
          )}
          {...props}
        >
          <div
            className={twMerge(
              clsx(
                'h-full transition-all duration-300 ease-out',
                progressColors[color]
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
