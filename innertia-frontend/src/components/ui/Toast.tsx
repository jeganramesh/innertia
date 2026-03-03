import * as React from 'react';
import * as ToastPrimitives from '@radix-ui/react-toast';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

const ToastProvider = ToastPrimitives.Provider;

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={twMerge(
      clsx(
        'fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]',
        className
      )
    )}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;

const toastVariants = {
  success: 'border-success-200 bg-success-50 text-success-900',
  error: 'border-danger-200 bg-danger-50 text-danger-900',
  warning: 'border-warning-200 bg-warning-50 text-warning-900',
  info: 'border-blue-200 bg-blue-50 text-blue-900',
};

const toastIcons = {
  success: <CheckCircle className="h-5 w-5 text-success-700" />,
  error: <AlertCircle className="h-5 w-5 text-danger-700" />,
  warning: <AlertTriangle className="h-5 w-5 text-warning-700" />,
  info: <Info className="h-5 w-5 text-blue-700" />,
};

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> & {
    variant?: 'success' | 'error' | 'warning' | 'info';
  }
>(({ className, variant = 'info', children, ...props }, ref) => {
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={twMerge(
        clsx(
          'group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-lg border p-4 pr-8 shadow-md transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full',
          toastVariants[variant],
          className
        )
      )}
      {...props}
    >
      <div className="flex items-start gap-3">
        {toastIcons[variant]}
        <div className="flex-1">{children}</div>
      </div>
    </ToastPrimitives.Root>
  );
});
Toast.displayName = ToastPrimitives.Root.displayName;

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={twMerge(
      clsx(
        'inline-flex h-8 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-transparent px-3 text-sm font-medium ring-offset-white transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        className
      )
    )}
    {...props}
  />
));
ToastAction.displayName = ToastPrimitives.Action.displayName;

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={twMerge(
      clsx(
        'absolute right-2 top-2 rounded-md p-1 text-slate-950/50 opacity-0 transition-opacity hover:text-slate-950 focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100',
        className
      )
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
));
ToastClose.displayName = ToastPrimitives.Close.displayName;

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={twMerge(clsx('text-sm font-semibold', className))}
    {...props}
  />
));
ToastTitle.displayName = ToastPrimitives.Title.displayName;

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={twMerge(clsx('text-sm opacity-90', className))}
    {...props}
  />
));
ToastDescription.displayName = ToastPrimitives.Description.displayName;

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>;

type ToastActionElement = React.ReactElement<typeof ToastAction>;

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
};

// Toast context for managing toasts
interface ToastContextValue {
  toasts: Array<{
    id: string;
    title: string;
    description?: string;
    variant?: 'success' | 'error' | 'warning' | 'info';
    duration?: number;
  }>;
  addToast: (toast: Omit<ToastContextValue['toasts'][0], 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined);

export const ToastProviderWithManager = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = React.useState<ToastContextValue['toasts']>([]);

  const addToast = React.useCallback(
    (toast: Omit<ToastContextValue['toasts'][0], 'id'>) => {
      const id = Math.random().toString(36).substr(2, 9);
      setToasts((prev) => [...prev, { ...toast, id }]);
      
      if (toast.duration !== 0) {
        setTimeout(() => {
          removeToast(id);
        }, toast.duration || 5000);
      }
    },
    []
  );

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      <ToastProvider>
        {children}
        <ToastViewport>
          {toasts.map((toast) => (
            <Toast key={toast.id} variant={toast.variant}>
              <div className="grid gap-1">
                {toast.title && <ToastTitle>{toast.title}</ToastTitle>}
                {toast.description && (
                  <ToastDescription>{toast.description}</ToastDescription>
                )}
              </div>
              <ToastClose />
            </Toast>
          ))}
        </ToastViewport>
      </ToastProvider>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProviderWithManager');
  }
  return context;
};
