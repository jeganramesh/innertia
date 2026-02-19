import { forwardRef, type HTMLAttributes } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'bordered' | 'glass';
}

const cardVariants = {
  default: 'bg-white border border-gray-200',
  elevated: 'bg-white shadow-apple-md',
  bordered: 'bg-white border-2 border-gray-300',
  glass: 'bg-white/80 backdrop-blur-xl border border-white/20',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    const baseStyles = 'rounded-apple overflow-hidden transition-all duration-200 ease-out';
    const variantStyles = cardVariants[variant];

    return (
      <div
        ref={ref}
        className={twMerge(clsx(baseStyles, variantStyles, className))}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={twMerge(clsx('px-6 py-4 border-b border-gray-200', className))}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardHeader.displayName = 'CardHeader';

interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, as = 'h3', children, ...props }, ref) => {
    const Tag = as;
    const headingStyles = {
      h1: 'text-2xl font-semibold tracking-tight',
      h2: 'text-xl font-semibold tracking-tight',
      h3: 'text-lg font-semibold tracking-tight',
      h4: 'text-base font-semibold',
      h5: 'text-sm font-semibold',
      h6: 'text-xs font-semibold',
    };

    return (
      <Tag
        ref={ref}
        className={twMerge(clsx('text-gray-900', headingStyles[as], className))}
        {...props}
      >
        {children}
      </Tag>
    );
  }
);

CardTitle.displayName = 'CardTitle';

interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {}

export const CardDescription = forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={twMerge(clsx('text-sm text-gray-500 mt-1', className))}
        {...props}
      >
        {children}
      </p>
    );
  }
);

CardDescription.displayName = 'CardDescription';

interface CardContentProps extends HTMLAttributes<HTMLDivElement> {}

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={twMerge(clsx('px-6 py-4', className))}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardContent.displayName = 'CardContent';

interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {}

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={twMerge(clsx('px-6 py-4 border-t border-gray-200', className))}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardFooter.displayName = 'CardFooter';
