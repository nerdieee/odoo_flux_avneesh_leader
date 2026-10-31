import React from 'react';

interface StatusBadgeProps {
  status: string;
  className?: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '', size = 'md' }) => {
  const s = (status || '').toLowerCase();

  let styles = 'bg-slate-100 text-slate-700 border-slate-200';
  let dotColor = 'bg-slate-400';

  if (['active', 'paid', 'completed', 'accepted'].includes(s)) {
    styles = 'bg-emerald-50 text-emerald-700 border-emerald-200/90 font-semibold shadow-2xs';
    dotColor = 'bg-emerald-500';
  } else if (['confirmed', 'sent'].includes(s)) {
    styles = 'bg-blue-50 text-blue-700 border-blue-200/90 font-semibold shadow-2xs';
    dotColor = 'bg-blue-500';
  } else if (['draft', 'quotation'].includes(s)) {
    styles = 'bg-amber-50 text-amber-700 border-amber-200/90 font-semibold shadow-2xs';
    dotColor = 'bg-amber-500';
  } else if (['paused'].includes(s)) {
    styles = 'bg-violet-50 text-violet-700 border-violet-200/90 font-semibold shadow-2xs';
    dotColor = 'bg-violet-500';
  } else if (['closed', 'cancelled', 'rejected', 'expired', 'overdue'].includes(s)) {
    styles = 'bg-rose-50 text-rose-700 border-rose-200/90 font-semibold shadow-2xs';
    dotColor = 'bg-rose-500';
  }

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10.5px]' : 'px-2.5 py-0.5 text-[11px]';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${styles} ${sizeClasses} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor} shrink-0 animate-pulse`} />
      <span className="capitalize">{status}</span>
    </span>
  );
};

export default StatusBadge;
