import { AlertTriangle } from 'lucide-react';
import { Button } from './Button';

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

export const ErrorState = ({ message, onRetry }: ErrorStateProps) => (
  <div className="flex flex-col items-center justify-center text-center py-12">
    <AlertTriangle className="h-12 w-12 text-red-500" />
    <h3 className="mt-4 text-lg font-medium text-slate-900">Something went wrong</h3>
    <p className="mt-2 text-sm text-slate-600">{message}</p>
    <Button onClick={onRetry} className="mt-6">
      Try Again
    </Button>
  </div>
);
