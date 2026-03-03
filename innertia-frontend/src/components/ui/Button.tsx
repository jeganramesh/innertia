import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'tinted';
  size?: 'sm' | 'md' | 'lg';
  asChild?: boolean;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

// Apple-style button variants
const buttonVariants = {
  primary: 'bg-system-blue text-white hover:bg-blue-600 active:bg-blue-700 shadow-sm hover:shadow-md',
  secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 active:bg-gray-300',
  ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 active:bg-gray-200',
  danger: 'bg-system-red text-white hover:bg-red-600 active:bg-red-700 shadow-sm hover:shadow-md',
  outline: 'border border-gray-200 bg-transparent text-gray-700 hover:bg-gray-50 active:bg-gray-100',
  tinted: 'bg-system-blue/10 text-system-blue hover:bg-system-blue/20 active:bg-system-blue/30',
};

const buttonSizes = {
  sm: 'px-3.5 py-1.5 text-sm rounded-apple-sm',
  md: 'px-5 py-2.5 text-base rounded-apple',
  lg: 'px-6 py-3 text-lg rounded-apple-lg',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      asChild = false,
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';
    const baseStyles = 'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-system-blue focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none';
    const variantStyles = buttonVariants[variant];
    const sizeStyles = buttonSizes[size];

    return (
      <Comp
        ref={ref}
        className={twMerge(clsx(baseStyles, variantStyles, sizeStyles, className))}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Loading...</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
          </>
        )}
      </Comp>
    );
  }
);

Button.displayName = 'Button';
