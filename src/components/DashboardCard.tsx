import React, { type ReactNode } from 'react';
import { cn } from '../utils/cn';

interface DashboardCardProps {
  title: string;
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
    <section className={cn('min-w-0 rounded-2xl border border-stone-200/80 bg-white p-4 sm:p-5 shadow-2xs', className)}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 sm:mb-4">
        <div className="min-w-0">
          <h3 className="text-[13px] font-semibold tracking-tight text-stone-900">{title}</h3>
          {subtitle && <p className="mt-0.5 text-[11.5px] leading-5 text-stone-500 sm:text-xs">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div className={bodyClassName}>{children}</div>
    </section>
  );
};

export default DashboardCard;
