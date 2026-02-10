import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={twMerge(clsx('animate-pulse rounded-md bg-slate-200', className))}
      {...props}
    />
  );
}

export { Skeleton };
