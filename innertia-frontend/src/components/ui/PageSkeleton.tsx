import { Skeleton } from './Skeleton'; // Assuming Skeleton is in the same directory

export const PageSkeleton = () => (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <Skeleton className="h-8 w-1/4" />
      <Skeleton className="h-10 w-24" />
    </div>
    <Skeleton className="h-96 w-full" />
  </div>
);
