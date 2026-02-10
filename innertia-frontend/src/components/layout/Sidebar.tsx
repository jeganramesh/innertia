import { useState, useEffect, useCallback, memo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Upload,
  BarChart3,
  Settings,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Bell,
  Users,
  Calendar,
  Shield,
  Route,
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface NavItem {
  icon: React.ReactNode;
  label: string;
  path: string;
  badge?: string | number;
}

interface NavSectionProps {
  title?: string;
  items: NavItem[];
  isCollapsed: boolean;
}

// Memoized NavSection to prevent unnecessary re-renders
const NavSection = memo(({ title, items, isCollapsed }: NavSectionProps) => {
  const location = useLocation();

  return (
    <div className="space-y-1">
      {title && !isCollapsed && (
        <h3 className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          {title}
        </h3>
      )}
      <nav aria-label={title || 'Navigation'}>
        <ul className="space-y-1">
          {items.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={twMerge(
                    clsx(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ease-in-out',
                      'text-sm font-medium',
                      isActive
                        ? 'bg-blue-50 text-blue-700 border-l-2 border-blue-700'
                        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900',
                      isCollapsed && 'justify-center px-2'
                    )
                  )}
                  aria-current={isActive ? 'page' : undefined}
                  title={isCollapsed ? item.label : undefined}
                >
                  <span
                    className={clsx(
                      'flex-shrink-0',
                      isActive && 'text-blue-700',
                      isCollapsed && 'mx-auto'
                    )}
                  >
                    {item.icon}
                  </span>
                  {!isCollapsed && (
                    <>
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.badge && (
                        <span className="flex-shrink-0 bg-blue-100 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full min-w-[1.5rem] text-center">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
});

NavSection.displayName = 'NavSection';

interface SidebarProps {
  className?: string;
  onCollapseChange?: (isCollapsed: boolean) => void;
}

export const Sidebar = memo(({ className, onCollapseChange }: SidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Sync with localStorage for persistence
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved) {
      setIsCollapsed(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', JSON.stringify(isCollapsed));
    onCollapseChange?.(isCollapsed);
  }, [isCollapsed, onCollapseChange]);

  // Close mobile sidebar on route change
  const location = useLocation();
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location]);

  // Close mobile sidebar on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileOpen) {
        setIsMobileOpen(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isMobileOpen]);

  const navItems: NavItem[] = [
    { icon: <Home size={20} />, label: 'Classes', path: '/classes' },
    { icon: <Users size={20} />, label: 'Course Group', path: '/course-group' },
    { icon: <BarChart3 size={20} />, label: 'Analytics', path: '/analytics' },
    { icon: <Route size={20} />, label: 'Traffic Course', path: '/traffic' },
    { icon: <Calendar size={20} />, label: 'Project Meetings', path: '/meetings' },
    { icon: <Shield size={20} />, label: 'Privacy', path: '/privacy' },
    { icon: <Upload size={20} />, label: 'Upload Content', path: '/upload', badge: '3' },
    { icon: <Settings size={20} />, label: 'Settings', path: '/settings' },
  ];

  const dashboardItems = navItems.slice(0, 6); // First 6 items
  const systemItems = navItems.slice(6); // Last 2 items

  const toggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  const toggleMobile = useCallback(() => {
    setIsMobileOpen((prev) => !prev);
  }, []);

  return (
    <>
      {/* Mobile backdrop with smooth transition */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden animate-fade-in"
          onClick={toggleMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar with Apple-inspired design */}
      <aside
        className={twMerge(
          clsx(
            'left-0 top-0 z-50 h-screen bg-white border-r border-slate-200 transition-all duration-300 ease-in-out',
            'flex flex-col shadow-sm',
            isCollapsed ? 'w-16' : 'w-64',
            isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
            'select-none', // Apple-like non-selectable UI
            className
          )
        )}
        aria-label="Main navigation"
      >
        {/* Logo section - Apple minimal style */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200">
          {!isCollapsed ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-sm tracking-tight">I</span>
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-slate-900 tracking-tight">INNERTIA</span>
                <span className="text-xs text-slate-500">Faculty Portal</span>
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center mx-auto shadow-sm">
              <span className="text-white font-bold text-sm tracking-tight">I</span>
            </div>
          )}
          
          {/* Notification bell for expanded state */}
          {!isCollapsed && (
            <button
              className="relative p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Notifications"
            >
              <Bell size={18} className="text-slate-600" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </button>
          )}
        </div>

        {/* Navigation with scrollable area */}
        <div className="flex-1 overflow-y-auto py-4 px-3">
          <div className="space-y-6">
            <NavSection
              title="Dashboard"
              items={dashboardItems}
              isCollapsed={isCollapsed}
            />
            <div className="border-t border-slate-200 pt-6">
              <NavSection
                title="System"
                items={systemItems}
                isCollapsed={isCollapsed}
              />
            </div>
          </div>
        </div>

        {/* Collapse Toggle - Apple style */}
        <div className="p-3 border-t border-slate-200">
          <button
            onClick={toggleCollapse}
            className={twMerge(
              clsx(
                'w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg',
                'text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900',
                'transition-all duration-200 ease-in-out',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1'
              )
            )}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight size={20} />
            ) : (
              <>
                <ChevronLeft size={20} />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Mobile menu button - Floating Apple-style */}
      <button
        onClick={toggleMobile}
        className="lg:hidden fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg flex items-center justify-center hover:from-blue-700 hover:to-blue-800 transition-all duration-300 ease-in-out active:scale-95"
        aria-label={isMobileOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={isMobileOpen}
      >
        {isMobileOpen ? (
          <X size={24} className="animate-fade-in" />
        ) : (
          <Menu size={24} className="animate-fade-in" />
        )}
      </button>


    </>
  );
});

Sidebar.displayName = 'Sidebar';