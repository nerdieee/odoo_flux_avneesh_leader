import React, { useState, useEffect } from 'react';
import type { DashboardData } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { StatusBadge } from '../components/StatusBadge';
import { DashboardCard } from '../components/DashboardCard';
import { useAuth } from '../context/AuthContext';
import {
  TrendingUp,
  CreditCard,
  AlertTriangle,
  Repeat,
  RefreshCw,
  Clock,
  ArrowRight,
  CheckCircle2,
  Calendar,
  Sparkles,
  Zap,
  ShieldCheck,
  Building2,
  Activity
} from 'lucide-react';

interface DashboardViewProps {
  onOpenScheduler: () => void;
  onSelectInvoice: (invoice: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onOpenScheduler, onSelectInvoice }) => {
  const { user, hasPermission, hasAnyPermission } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [spin, setSpin] = useState(false);

  const fetchDashboard = async () => {
    setSpin(true);
    try {
      const res = await fetch('/api/dashboard', {
        headers: {
          'x-user-id': String(user?.id || 0),
          'x-user-role': user?.role || ''
        }
      });
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
      setTimeout(() => setSpin(false), 500);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [user]);

  if (loading || !data) {
    return (
      <div className="flex h-72 items-center justify-center">
        <div className="flex items-center gap-2 text-indigo-600 text-xs font-mono">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Loading financial telemetry…</span>
        </div>
      </div>
    );
  }

  const { kpis, monthlyRevenue, paymentMethods, subscriptionStatus, recentPayments, overdueInvoices, performance } = data;

  const rawStatCards = [
    {
      id: 'subscriptions',
      label: 'Active Subscriptions',
      value: kpis.activeSubscriptions.toLocaleString('en-IN'),
      sub: 'Recurring agreements · live',
      icon: Repeat,
      iconBg: 'bg-gradient-to-tr from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/20',
      borderColor: 'border-indigo-100 hover:border-indigo-300',
      valueColor: 'text-indigo-950',
      badge: '+14% MoM',
      badgeColor: 'bg-indigo-50 text-indigo-700',
      visible: isAdmin || hasPermission('subscriptions.view')
    },
    {
      id: 'revenue',
      label: 'Revenue Received',
      value: formatCurrency(kpis.revenueReceived),
      sub: 'Settled receipts · completed',
      icon: TrendingUp,
      iconBg: 'bg-gradient-to-tr from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20',
      borderColor: 'border-emerald-100 hover:border-emerald-300',
      valueColor: 'text-emerald-950',
      badge: 'Healthy',
      badgeColor: 'bg-emerald-50 text-emerald-700',
      visible: isAdmin || hasPermission('payments.view')
    },
    {
      id: 'outstanding',
      label: 'Outstanding Balance',
      value: formatCurrency(kpis.outstandingAmount),
      sub: 'Awaiting customer settlement',
      icon: CreditCard,
      iconBg: 'bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/20',
      borderColor: 'border-amber-100 hover:border-amber-300',
      valueColor: 'text-amber-950',
      badge: 'Net 15 Days',
      badgeColor: 'bg-amber-50 text-amber-700',
      visible: isAdmin || hasPermission('invoices.view')
    },
    {
      id: 'overdue',
      label: 'Overdue Invoices',
      value: `${kpis.overdueInvoicesCount} (${formatCurrency(kpis.overdueAmount)})`,
      sub: kpis.overdueInvoicesCount > 0 ? 'Requires collection follow-up' : 'Zero overdue payments',
      icon: AlertTriangle,
      iconBg: 'bg-gradient-to-tr from-rose-500 to-pink-600 text-white shadow-md shadow-rose-500/20',
      borderColor: 'border-rose-100 hover:border-rose-300',
      valueColor: 'text-rose-950',
      badge: kpis.overdueInvoicesCount > 0 ? 'Action Needed' : 'All Clear',
      badgeColor: kpis.overdueInvoicesCount > 0 ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700',
      visible: isAdmin || hasPermission('invoices.view')
    }
  ];

  const statCards = rawStatCards.filter(c => c.visible);

  const canViewReportsOrPayments = isAdmin || hasAnyPermission(['reports.view', 'payments.view']);
  const canViewInvoices = isAdmin || hasPermission('invoices.view');
  const canViewPayments = isAdmin || hasPermission('payments.view');
  const canViewSubs = isAdmin || hasPermission('subscriptions.view');

  return (
    <div className="space-y-4">
      {/* Top Header / Eyebrow Banner */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-[11px] font-bold text-indigo-700 mb-1">
            <Sparkles className="h-3 w-3 text-indigo-600" />
            <span>Brightloop Software · Revenue Intelligence</span>
          </div>
          <h1 className="mt-1 text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
            Financial Dashboard &amp; Analytics
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Real-time MRR telemetry, automated recurring billing scheduler, and accounts receivable.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={fetchDashboard}
            className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:border-slate-300 transition shadow-2xs cursor-pointer"
            aria-label="Refresh metrics"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${spin ? 'animate-spin text-indigo-600' : 'text-slate-400'}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={onOpenScheduler}
            className="rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 px-4 py-1.5 text-xs font-bold text-white transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-indigo-500/25"
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>Run Billing Engine</span>
          </button>
        </div>
      </div>

      {/* 4 Core Colorful Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
        {statCards.map((s) => {
          const Icon = s.icon;

          return (
            <div
              key={s.label}
              className={`rounded-2xl sm:rounded-3xl border bg-white p-4 sm:p-5 text-left transition shadow-sm hover:shadow-md ${s.borderColor}`}
            >
              <div className="flex items-start justify-between">
                <div className={`h-10 w-10 rounded-2xl flex items-center justify-center ${s.iconBg}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.badgeColor}`}>
                  {s.badge}
                </span>
              </div>

              <div className="mt-3.5">
                <span className="text-[11px] uppercase tracking-wide font-bold text-slate-400 block">
                  {s.label}
                </span>
                <div className={`mt-0.5 text-2xl font-extrabold tracking-tight tabular-nums font-mono ${s.valueColor}`}>
                  {s.value}
                </div>
                <p className="mt-1 text-xs text-slate-500 truncate">
                  {s.sub}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Agreement Breakdown & Metric Tiles */}
      {canViewSubs && (
        <DashboardCard
          title="Subscription Fleet Intelligence"
          subtitle="Agreement distribution across contract lifecycle states"
          action={
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              Idempotency Guard Active
            </span>
          }
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-2xl bg-indigo-50/60 p-3.5 text-center border border-indigo-100/80">
              <div className="text-xl font-extrabold tabular-nums font-mono text-indigo-900">
                {kpis.activeSubscriptions}
              </div>
              <div className="text-[10.5px] uppercase font-bold tracking-wide text-indigo-600 mt-0.5">
                Active Contracts
              </div>
            </div>

            <div className="rounded-2xl bg-blue-50/60 p-3.5 text-center border border-blue-100/80">
              <div className="text-xl font-extrabold tabular-nums font-mono text-blue-900">
                {subscriptionStatus.find((st) => st.status === 'confirmed')?.count || 0}
              </div>
              <div className="text-[10.5px] uppercase font-bold tracking-wide text-blue-600 mt-0.5">
                Confirmed (Pending)
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-3.5 text-center border border-slate-200/80">
              <div className="text-xl font-extrabold tabular-nums font-mono text-slate-800">
                {subscriptionStatus.find((st) => st.status === 'closed')?.count || 0}
              </div>
              <div className="text-[10.5px] uppercase font-bold tracking-wide text-slate-500 mt-0.5">
                Closed / Ended
              </div>
            </div>

            <div className="rounded-2xl bg-emerald-50/60 p-3.5 text-center border border-emerald-100/80">
              <div className="text-xl font-extrabold tabular-nums font-mono text-emerald-900">
                {performance.queryTimeMs} ms
              </div>
              <div className="text-[10.5px] uppercase font-bold tracking-wide text-emerald-700 mt-0.5">
                Query SLA (&lt;2s target)
              </div>
            </div>
          </div>
        </DashboardCard>
      )}

      {/* Main Grid: Revenue Bar Chart & Payment Channel Distribution */}
      <div className="grid gap-4 xl:grid-cols-3">
        {/* Left 2 Cols: Monthly Collections Trend & Overdue */}
        <div className="min-w-0 space-y-4 xl:col-span-2">
          {canViewReportsOrPayments && (
            <DashboardCard
              title="Monthly Cash Collection Trend"
              subtitle="Realized revenue settlements grouped by calendar month"
              action={
                <span className="text-xs font-mono text-indigo-700 font-bold bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
                  MRR Growth
                </span>
              }
            >
              <div className="h-52 flex items-end gap-6 pt-6 px-4 border-b border-slate-100">
                {monthlyRevenue && monthlyRevenue.length > 0 ? (
                  monthlyRevenue.map((item, idx) => {
                    const maxRev = Math.max(...monthlyRevenue.map((m) => m.revenue), 10000);
                    const heightPercent = Math.max(22, Math.round((item.revenue / maxRev) * 100));

                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                        <span className="text-[11px] font-mono font-bold text-slate-600 group-hover:text-indigo-600 transition tabular-nums">
                          {formatCurrency(item.revenue)}
                        </span>
                        <div className="w-full max-w-[56px] bg-slate-100 rounded-t-2xl group-hover:bg-indigo-50 transition flex items-end justify-center p-1">
                          <div
                            className="w-full bg-gradient-to-t from-indigo-600 via-violet-600 to-pink-500 rounded-t-xl transition-all duration-500 shadow-sm"
                            style={{ height: `${heightPercent}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-slate-700 mt-1">
                          {item.month}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="w-full text-center text-xs text-slate-400 py-12">
                    No monthly receipts recorded.
                  </div>
                )}
              </div>

              <div className="mt-3.5 flex items-center justify-between text-xs text-slate-500">
                <span>Settlement Rails: Corporate RTGS, NEFT &amp; Instant UPI</span>
                <span className="font-mono font-bold text-slate-900">Total: {formatCurrency(kpis.revenueReceived)}</span>
              </div>
            </DashboardCard>
          )}

          {/* Overdue Accounts Table */}
          {canViewInvoices && (
            <DashboardCard
              title="Overdue Accounts &amp; Follow-up Queue"
              subtitle={`${overdueInvoices.length} invoices past due date · operational action required`}
            >
              <div className="overflow-x-auto rounded-xl border border-slate-100">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-400 text-left font-bold text-[10.5px] uppercase tracking-wider">
                      <th className="px-3 py-2.5">Invoice #</th>
                      <th className="px-3 py-2.5">Customer</th>
                      <th className="px-3 py-2.5">Due Date</th>
                      <th className="px-3 py-2.5 text-right">Balance Due</th>
                      <th className="px-3 py-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {overdueInvoices && overdueInvoices.length > 0 ? (
                      overdueInvoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-slate-50 transition">
                          <td className="px-3 py-2.5 font-mono font-bold text-indigo-700">
                            {inv.invoice_number}
                          </td>
                          <td className="px-3 py-2.5 text-slate-900 font-semibold">
                            {inv.customer_name}
                          </td>
                          <td className="px-3 py-2.5 text-rose-600 font-semibold tabular-nums">
                            {formatDate(inv.due_date)}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-900 tabular-nums">
                            {formatCurrency(inv.total_amount - inv.amount_paid)}
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            <button
                              onClick={() => onSelectInvoice(inv)}
                              className="rounded-full bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 px-3.5 py-1 text-[11px] font-bold text-white transition shadow-2xs cursor-pointer"
                            >
                              Open &amp; Pay →
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">
                          <CheckCircle2 className="h-6 w-6 text-emerald-500 mx-auto mb-1.5" />
                          <span className="font-medium text-slate-600">Zero overdue accounts. All customer invoices are settled or within terms!</span>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </DashboardCard>
          )}
        </div>

        {/* Right 1 Col: Payment Methods & Recent Transactions */}
        <div className="min-w-0 space-y-4">
          {canViewReportsOrPayments && (
            <DashboardCard
              title="Payment Rails Breakdown"
              subtitle="Distribution of collections by method"
            >
              <div className="space-y-2">
                {paymentMethods && paymentMethods.length > 0 ? (
                  paymentMethods.map((pm, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center p-3 rounded-2xl bg-slate-50/80 border border-slate-100 text-xs"
                    >
                      <span className="font-semibold text-slate-800">{pm.payment_method}</span>
                      <span className="font-mono font-bold text-slate-900 tabular-nums">
                        {formatCurrency(pm.total)}{' '}
                        <span className="text-slate-400 font-normal">({pm.count} txns)</span>
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 py-3 text-center">No payment methods recorded</p>
                )}
              </div>
            </DashboardCard>
          )}

          {canViewPayments && (
            <DashboardCard
              title="Recent Settlements"
              subtitle="Latest completed customer transactions"
            >
              <div className="divide-y divide-slate-100 text-xs">
                {recentPayments && recentPayments.length > 0 ? (
                  recentPayments.map((p) => (
                    <div key={p.id} className="py-2.5 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-900">{p.customer_name}</p>
                        <p className="text-slate-400 text-[10.5px]">
                          {p.invoice_number} · <span className="text-indigo-600 font-medium">{p.payment_method}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-bold text-emerald-700 tabular-nums">
                          {formatCurrency(p.amount)}
                        </p>
                        <p className="text-[10px] text-slate-400">{formatDate(p.payment_date)}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="py-6 text-center text-slate-400">No recent transactions</p>
                )}
              </div>
            </DashboardCard>
          )}
        </div>
      </div>
    </div>
  );
};
