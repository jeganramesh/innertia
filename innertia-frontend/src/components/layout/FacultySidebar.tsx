import { useState, useEffect, useCallback, memo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  BookOpen,
  Play,
  BarChart3,
  Users,
  FileText,
  Settings,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Bell,
  GraduationCap,
  Upload,
  Sparkles
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

const NavSection = memo(({ title, items, isCollapsed }: NavSectionProps) => {
  const location = useLocation();

  return (
    <div className="space-y-0.5">
      {title && !isCollapsed && (
        <h3 className="px-3 text-[11px] font-semibold text-[#86868b] uppercase tracking-[0.5px] mb-3">
          {title}
        </h3>
      )}
      <nav aria-label={title || 'Navigation'}>
        <ul className="space-y-0.5">
          {items.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={twMerge(
                    clsx(
                      'flex items-center gap-3 px-3 py-2.5 rounded-[10px] transition-all duration-200 ease-out',
                      'text-[13px] font-normal',
                      isActive
                        ? 'bg-[#f5f5f7] text-black'
                        : 'text-[#1d1d1f] hover:bg-[#f5f5f7]',
                      isCollapsed && 'justify-center px-2'
                    )
                  )}
                  aria-current={isActive ? 'page' : undefined}
                  title={isCollapsed ? item.label : undefined}
                >
                  <span
                    className={clsx(
                      'flex-shrink-0',
                      isActive && 'text-black',
                      isCollapsed && 'mx-auto'
                    )}
                  >
                    {item.icon}
                  </span>
                  {!isCollapsed && (
                    <>
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.badge && (
                        <span className="flex-shrink-0 bg-purple-500 text-white text-[11px] font-medium px-2 py-0.5 rounded-full min-w-[1.5rem] text-center">
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

interface FacultySidebarProps {
  className?: string;
  onCollapseChange?: (isCollapsed: boolean) => void;
}

export const FacultySidebar = memo(({ className, onCollapseChange }: FacultySidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('faculty-sidebar-collapsed');
    if (saved) {
      setIsCollapsed(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('faculty-sidebar-collapsed', JSON.stringify(isCollapsed));
    onCollapseChange?.(isCollapsed);
  }, [isCollapsed, onCollapseChange]);

  const location = useLocation();
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location]);

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
    { icon: <Home size={20} />, label: 'Dashboard', path: '/faculty/dashboard' },
    { icon: <BookOpen size={20} />, label: 'My Classes', path: '/faculty/classes' },
    { icon: <Play size={20} />, label: 'Sessions', path: '/faculty/session' },
    { icon: <Upload size={20} />, label: 'Student Upload', path: '/faculty/upload' },
    { icon: <Sparkles size={20} />, label: 'AI Notes', path: '/faculty/ai-notes' },
    { icon: <BarChart3 size={20} />, label: 'Analytics', path: '/faculty/analytics' },
    { icon: <Users size={20} />, label: 'Students', path: '/faculty/students' },
    { icon: <FileText size={20} />, label: 'Notes', path: '/faculty/notes' },
    { icon: <Settings size={20} />, label: 'Settings', path: '/faculty/settings' },
  ];

  const dashboardItems = navItems.slice(0, 3);
  const managementItems = navItems.slice(3, 5);
  const systemItems = navItems.slice(5);

  const toggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  const toggleMobile = useCallback(() => {
    setIsMobileOpen((prev) => !prev);
  }, []);

  return (
    <>
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden animate-fade-in"
          onClick={toggleMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={twMerge(
          clsx(
            'left-0 top-0 z-50 h-screen bg-white transition-all duration-300 ease-out',
            'flex flex-col',
            isCollapsed ? 'w-[72px]' : 'w-[272px]',
            isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
            'select-none',
            className
          )
        )}
        aria-label="Faculty navigation"
      >
        <div className="flex items-center h-16 px-4">
          {!isCollapsed ? (
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-[8px] bg-purple-500 flex items-center justify-center">
                <GraduationCap size={16} className="text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-[#1d1d1f] text-[15px] tracking[-0.02em]">INNERTIA</span>
                <span className="text-[11px] text-purple-600 font-medium">Faculty</span>
              </div>
            </div>
          ) : (
            <div className="w-7 h-7 rounded-[8px] bg-purple-500 flex items-center justify-center mx-auto">
              <GraduationCap size={16} className="text-white" />
            </div>
          )}
          
          {!isCollapsed && (
            <button
              className="relative p-1.5 rounded-[8px] hover:bg-[#f5f5f7] transition-colors ml-auto"
              aria-label="Notifications"
            >
              <Bell size={18} className="text-[#86868b]" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3">
          <div className="space-y-8">
            <NavSection
              title="Main"
              items={dashboardItems}
              isCollapsed={isCollapsed}
            />
            <div className="border-t border-[#d2d2d7] pt-8">
              <NavSection
                title="Management"
                items={managementItems}
                isCollapsed={isCollapsed}
              />
            </div>
            <div className="border-t border-[#d2d2d7] pt-8">
              <NavSection
                title="System"
                items={systemItems}
                isCollapsed={isCollapsed}
              />
            </div>
          </div>
        </div>

        <div className="p-3 border-t border-[#d2d2d7]">
          <button
            onClick={toggleCollapse}
            className={twMerge(
              clsx(
                'w-full flex items-center justify-center gap-2 px-3 py-2 rounded-[10px]',
                'text-[13px] font-normal text-[#1d1d1f] hover:bg-[#f5f5f7]',
                'transition-all duration-200 ease-out',
                'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1'
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

      <button
        onClick={toggleMobile}
        className="lg:hidden fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-purple-500 text-white shadow-[0_4px_12px_rgba(0,0,0,0.15)] flex items-center justify-center hover:bg-purple-600 transition-all duration-200 ease-out active:scale-95"
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

FacultySidebar.displayName = 'FacultySidebar';
