import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-16">
      <div className="space-y-3">
        <h1 className="text-4xl font-semibold tracking-tight text-[#1d1d1f]">
          {title}
        </h1>
        {subtitle && (
          <p className="text-lg text-[#86868b]">
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}

export default PageHeader;
