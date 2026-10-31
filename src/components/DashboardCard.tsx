import React, { type ReactNode } from 'react';
import { cn } from '../utils/cn';

interface DashboardCardProps {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}

export const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  subtitle,
  action,
  children,
  className,
  bodyClassName
}) => {
  return (
    <section className={cn('min-w-0 rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white/95 p-4 sm:p-6 shadow-[0_4px_20px_-4px_rgba(99,102,241,0.05),0_1px_3px_0_rgba(0,0,0,0.02)] hover:shadow-[0_8px_25px_-5px_rgba(99,102,241,0.08)] transition-all duration-200', className)}>
      {title && (
        <div className="mb-3.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 sm:mb-4.5">
          <div className="min-w-0">
            <h3 className="text-sm sm:text-[14px] font-bold tracking-tight text-slate-900">{title}</h3>
            {subtitle && <p className="mt-0.5 text-xs text-slate-500 leading-normal">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
};

export default DashboardCard;
