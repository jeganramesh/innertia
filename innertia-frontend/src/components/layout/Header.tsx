import { Bell, Search, LogOut } from 'lucide-react';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Badge';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { BreadcrumbItem } from '../types';
import { useAuth } from '../../hooks/useAuth';

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
  const { user, logout } = useAuth();
  return (
    <header
      className={twMerge(
        clsx(
          'sticky top-0 z-30 bg-white/70 backdrop-blur-md border-b border-[#d2d2d7]/50',
          'h-14 lg:h-16 flex items-center justify-between px-4 lg:px-6',
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
                  <span className="text-gray-400">/</span>
                )}
                {item.path ? (
                  <a
                    href={item.path}
                    className="text-gray-500 hover:text-gray-900 transition-colors"
                  >
                    {item.label}
                  </a>
                ) : (
                  <span className="text-gray-900 font-medium">{item.label}</span>
                )}
              </div>
            ))}
          </nav>
        )}
        {title && !breadcrumbs && (
          <h1 className="text-lg font-semibold text-gray-900 tracking-tight">{title}</h1>
        )}
      </div>

      {/* Center - Search */}
      {showSearch && (
        <div className="flex-1 max-w-md mx-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search..."
              onChange={(e) => onSearch?.(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-apple bg-gray-50 focus:bg-white focus:outline-none focus:border-system-blue focus:ring-2 focus:ring-system-blue/20 transition-all duration-200"
            />
          </div>
        </div>
      )}

      {/* Right side - Actions and User Menu */}
      <div className="flex items-center gap-2">
        {actions && <div className="flex items-center gap-2">{actions}</div>}

        {/* Notifications */}
        <Button variant="ghost" size="sm" className="relative">
          <Bell size={20} className="text-gray-600" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-system-red rounded-full" />
        </Button>

        {/* User Menu */}
        <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-gray-900">{user?.full_name || user?.email || 'User'}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role || 'User'}</p>
          </div>
          <Avatar initials={user?.full_name ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'} size="md" />
          <Button variant="ghost" size="sm" className="hidden sm:flex" onClick={logout} title="Logout">
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
    <div className={twMerge(clsx('mb-8', className))}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-2 text-sm mb-3">
          {breadcrumbs.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              {index > 0 && (
                <span className="text-gray-400">/</span>
              )}
              {item.path ? (
                <a
                  href={item.path}
                  className="text-gray-500 hover:text-gray-900 transition-colors"
                >
                  {item.label}
                </a>
              ) : (
                <span className="text-gray-900 font-medium">{item.label}</span>
              )}
            </div>
          ))}
        </nav>
      )}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">{title}</h1>
          {description && (
            <p className="text-base text-gray-500 mt-2 leading-relaxed max-w-2xl">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
};

export default Header;
