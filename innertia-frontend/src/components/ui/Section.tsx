import { ReactNode } from 'react';

interface SectionProps {
  children: ReactNode;
  className?: string;
  title?: string;
  action?: ReactNode;
}

export function Section({ children, className = '', title, action }: SectionProps) {
  return (
    <section className={`mb-20 ${className}`}>
      {title && (
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-[#1d1d1f]">{title}</h2>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

export default Section;
