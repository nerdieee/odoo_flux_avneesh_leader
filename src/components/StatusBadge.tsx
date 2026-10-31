import React from 'react';

interface StatusBadgeProps {
  status: string;
  className?: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '', size = 'md' }) => {
  const s = (status || '').toLowerCase();

  let styles = 'bg-stone-100 text-stone-700 border-stone-200';
  let dotColor = 'bg-stone-400';

  if (['active', 'paid', 'completed', 'accepted'].includes(s)) {
    styles = 'bg-emerald-50 text-emerald-800 border-emerald-200/80';
    dotColor = 'bg-emerald-600';
  } else if (['confirmed', 'sent'].includes(s)) {
    styles = 'bg-stone-100 text-stone-800 border-stone-300';
    dotColor = 'bg-stone-700';
  } else if (['draft', 'quotation'].includes(s)) {
    styles = 'bg-amber-50 text-amber-800 border-amber-200/80';
    dotColor = 'bg-amber-500';
  } else if (['paused'].includes(s)) {
    styles = 'bg-purple-50 text-purple-800 border-purple-200/80';
    dotColor = 'bg-purple-500';
  } else if (['closed', 'cancelled', 'rejected', 'expired', 'overdue'].includes(s)) {
    styles = 'bg-rose-50 text-rose-700 border-rose-200/80';
    dotColor = 'bg-rose-600';
  }

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10.5px]' : 'px-2.5 py-0.5 text-[11px] font-medium';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${styles} ${sizeClasses} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      <span className="capitalize">{status}</span>
    </span>
  );
};

export default StatusBadge;
