import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="space-y-3 mb-16">
      <h1 className="text-4xl font-semibold tracking-tight text-[#1d1d1f]">
        {title}
      </h1>
      {subtitle && (
        <p className="text-lg text-[#86868b]">
          {subtitle}
        </p>
      )}
    </div>
  );
}

export default PageHeader;
