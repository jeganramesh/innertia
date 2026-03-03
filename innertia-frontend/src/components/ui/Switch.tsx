import { forwardRef } from 'react';
import { twMerge } from 'tailwind-merge';
import clsx from 'clsx';

export interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  description?: string;
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, label, description, ...props }, ref) => {
    return (
      <label className={twMerge(clsx('flex items-center justify-between cursor-pointer', className))}>
        <div className="flex flex-col">
          {label && (
            <span className="text-sm font-medium text-gray-900">{label}</span>
          )}
          {description && (
            <span className="text-sm text-gray-500">{description}</span>
          )}
        </div>
        <div className="relative inline-flex h-6 w-11 items-center">
          <input
            type="checkbox"
            className="peer sr-only"
            ref={ref}
            {...props}
          />
          <span className="absolute inset-0 rounded-full bg-gray-200 transition-colors peer-checked:bg-blue-600 peer-focus:ring-2 peer-focus:ring-blue-500 peer-focus:ring-offset-2" />
          <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform peer-checked:translate-x-5" />
        </div>
      </label>
    );
  }
);

Switch.displayName = 'Switch';
