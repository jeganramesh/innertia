import { Bell, Search, User, LogOut } from 'lucide-react';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Badge';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { BreadcrumbItem } from '../types';

interface HeaderProps {
  className?: string;
  title?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  showSearch?: boolean;
  onSearch?: (query: string) => void;
}

export const Header = ({
  className,
  title,
  breadcrumbs,
  actions,
  showSearch = false,
  onSearch,
}: HeaderProps) => {
  return (
    <header
      className={twMerge(
        clsx(
          'sticky top-0 z-30 bg-white border-b border-slate-200',
          'h-16 flex items-center justify-between px-6',
          className
        )
      )}
    >
      {/* Left side - Breadcrumbs and Title */}
      <div className="flex items-center gap-4 flex-1">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-2 text-sm">
            {breadcrumbs.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                {index > 0 && (
                  <span className="text-slate-400">/</span>
                )}
                {item.path ? (
                  <a
                    href={item.path}
                    className="text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    {item.label}
                  </a>
                ) : (
                  <span className="text-slate-900 font-medium">{item.label}</span>
                )}
              </div>
            ))}
          </nav>
        )}
        {title && !breadcrumbs && (
          <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
        )}
      </div>

      {/* Center - Search */}
      {showSearch && (
        <div className="flex-1 max-w-md mx-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search..."
              onChange={(e) => onSearch?.(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      )}

      {/* Right side - Actions and User Menu */}
      <div className="flex items-center gap-3">
        {actions && <div className="flex items-center gap-2">{actions}</div>}

        {/* Notifications */}
        <Button variant="ghost" size="sm" className="relative">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-danger-600 rounded-full" />
        </Button>

        {/* User Menu */}
        <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-slate-900">Dr. Sarah Johnson</p>
            <p className="text-xs text-slate-500">Faculty</p>
          </div>
          <Avatar initials="SJ" size="md" />
          <Button variant="ghost" size="sm" className="hidden sm:flex">
            <LogOut size={18} />
          </Button>
        </div>
      </div>
    </header>
  );
};

// Page header component for page-level headers
interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  className?: string;
}

export const PageHeader = ({
  title,
  description,
  breadcrumbs,
  actions,
  className,
}: PageHeaderProps) => {
  return (
    <div className={twMerge(clsx('mb-6', className))}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-2 text-sm mb-2">
          {breadcrumbs.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              {index > 0 && (
                <span className="text-slate-400">/</span>
              )}
              {item.path ? (
                <a
                  href={item.path}
                  className="text-slate-600 hover:text-slate-900 transition-colors"
                >
                  {item.label}
                </a>
              ) : (
                <span className="text-slate-900 font-medium">{item.label}</span>
              )}
            </div>
          ))}
        </nav>
      )}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
          {description && (
            <p className="text-slate-600 mt-1">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
};
