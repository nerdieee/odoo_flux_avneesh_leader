import React, { useState, useEffect } from 'react';
import type { DashboardData } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { StatusBadge } from '../components/StatusBadge';
import { DashboardCard } from '../components/DashboardCard';
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
  Sparkles
} from 'lucide-react';

interface DashboardViewProps {
  onOpenScheduler: () => void;
  onSelectInvoice: (invoice: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onOpenScheduler, onSelectInvoice }) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [spin, setSpin] = useState(false);

  const fetchDashboard = async () => {
    setSpin(true);
    try {
      const res = await fetch('/api/dashboard');
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
  }, []);

  if (loading || !data) {
    return (
      <div className="flex h-72 items-center justify-center">
        <div className="flex items-center gap-2 text-stone-400 text-xs font-mono">
          <RefreshCw className="h-4 w-4 animate-spin text-stone-900" />
          <span>Loading financial telemetry…</span>
        </div>
      </div>
    );
  }

  const { kpis, monthlyRevenue, paymentMethods, subscriptionStatus, recentPayments, overdueInvoices, performance } = data;

  const statCards = [
    {
      label: 'Active Subscriptions',
      value: kpis.activeSubscriptions.toLocaleString('en-IN'),
      sub: 'Recurring agreements · live',
      status: 'healthy'
    },
    {
      label: 'Revenue Received',
      value: formatCurrency(kpis.revenueReceived),
      sub: 'Settled receipts · completed',
      status: 'revenue'
    },
    {
      label: 'Outstanding Balance',
      value: formatCurrency(kpis.outstandingAmount),
      sub: 'Awaiting customer settlement',
      status: 'pending'
    },
    {
      label: 'Overdue Invoices',
      value: `${kpis.overdueInvoicesCount} (${formatCurrency(kpis.overdueAmount)})`,
      sub: kpis.overdueInvoicesCount > 0 ? 'Requires collection follow-up' : 'Zero overdue payments',
      status: kpis.overdueInvoicesCount > 0 ? 'alert' : 'healthy'
    }
  ];

  return (
    <div className="space-y-4">
      {/* Top Header / Eyebrow Banner (nwis-style) */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.12em] text-stone-400 font-semibold">
            Brightloop Software · Finance &amp; Revenue Intelligence
          </p>
          <h1 className="mt-1 text-lg font-semibold tracking-tight text-stone-900 sm:text-xl">
            Revenue &amp; Subscription Performance
          </h1>
          <p className="mt-0.5 text-xs text-stone-500">
            Real-time MRR telemetry, automated recurring billing scheduler, and accounts receivable.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={fetchDashboard}
            className="flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-600 hover:border-stone-400 transition cursor-pointer"
            aria-label="Refresh metrics"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${spin ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={onOpenScheduler}
            className="rounded-full bg-stone-900 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-stone-700 transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>Run Billing Engine</span>
          </button>
        </div>
      </div>

      {/* 4 Core Stat Cards (nwis 4-grid tile cards) */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 xl:grid-cols-4">
        {statCards.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-stone-200/80 bg-white p-3.5 text-left transition hover:border-stone-400 sm:p-4 shadow-2xs"
          >
            <div className="text-[10.5px] uppercase tracking-wide text-stone-400 sm:text-[11px] font-medium">
              {s.label}
            </div>
            <div className="mt-1 text-lg font-semibold tracking-tight tabular-nums text-stone-900 sm:text-xl">
              {s.value}
            </div>
            <div className="mt-0.5 truncate text-[11px] text-stone-500 sm:text-xs">
              {s.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Active Agreement Breakdown & Metric Tiles */}
      <DashboardCard
        title="Subscription Fleet Intelligence"
        subtitle="Agreement distribution across contract lifecycle states"
        action={
          <span className="text-[11px] font-mono text-stone-400 bg-stone-50 border border-stone-200 px-2 py-0.5 rounded-full">
            Idempotency Guard Active
          </span>
        }
      >
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="rounded-xl bg-stone-50 px-2.5 py-3 text-center border border-stone-100">
            <div className="text-[13px] font-semibold tabular-nums text-stone-900 sm:text-[14px]">
              {kpis.activeSubscriptions}
            </div>
            <div className="text-[10.5px] uppercase tracking-wide text-stone-400 mt-0.5">
              Active Contracts
            </div>
          </div>

          <div className="rounded-xl bg-stone-50 px-2.5 py-3 text-center border border-stone-100">
            <div className="text-[13px] font-semibold tabular-nums text-stone-900 sm:text-[14px]">
              {subscriptionStatus.find((st) => st.status === 'confirmed')?.count || 0}
            </div>
            <div className="text-[10.5px] uppercase tracking-wide text-stone-400 mt-0.5">
              Confirmed (Pending)
            </div>
          </div>

          <div className="rounded-xl bg-stone-50 px-2.5 py-3 text-center border border-stone-100">
            <div className="text-[13px] font-semibold tabular-nums text-stone-900 sm:text-[14px]">
              {subscriptionStatus.find((st) => st.status === 'closed')?.count || 0}
            </div>
            <div className="text-[10.5px] uppercase tracking-wide text-stone-400 mt-0.5">
              Closed / Ended
            </div>
          </div>

          <div className="rounded-xl bg-stone-50 px-2.5 py-3 text-center border border-stone-100">
            <div className="text-[13px] font-semibold tabular-nums text-stone-900 sm:text-[14px]">
              {performance.queryTimeMs} ms
            </div>
            <div className="text-[10.5px] uppercase tracking-wide text-stone-400 mt-0.5">
              Engine Latency (&lt;2s)
            </div>
          </div>
        </div>
      </DashboardCard>

      {/* Main Grid: Revenue Bar Chart & Payment Channel Distribution */}
      <div className="grid gap-4 xl:grid-cols-3">
        {/* Left 2 Cols: Monthly Collections Trend */}
        <div className="min-w-0 space-y-4 xl:col-span-2">
          <DashboardCard
            title="Monthly Cash Collection Trend"
            subtitle="Realized revenue settlements grouped by calendar month"
            action={
              <span className="text-xs font-mono text-stone-900 font-semibold bg-stone-100 border border-stone-200 px-2.5 py-0.5 rounded-full">
                MRR Track
              </span>
            }
          >
            <div className="h-48 flex items-end gap-6 pt-4 px-2 border-b border-stone-100">
              {monthlyRevenue && monthlyRevenue.length > 0 ? (
                monthlyRevenue.map((item, idx) => {
                  const maxRev = Math.max(...monthlyRevenue.map((m) => m.revenue), 10000);
                  const heightPercent = Math.max(18, Math.round((item.revenue / maxRev) * 100));

                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                      <span className="text-[10.5px] font-mono font-medium text-stone-500 group-hover:text-stone-900 transition tabular-nums">
                        {formatCurrency(item.revenue)}
                      </span>
                      <div className="w-full max-w-[48px] bg-stone-100 rounded-t-xl group-hover:bg-stone-200 transition flex items-end justify-center p-1">
                        <div
                          className="w-full bg-stone-900 rounded-t-lg transition-all duration-300"
                          style={{ height: `${heightPercent}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-medium text-stone-600 mt-0.5">
                        {item.month}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="w-full text-center text-xs text-stone-400 py-12">
                  No monthly receipts recorded.
                </div>
              )}
            </div>

            <div className="mt-3 flex items-center justify-between text-[11px] text-stone-400 font-mono">
              <span>Settlements source: Bank RTGS &amp; UPI</span>
              <span>Total: {formatCurrency(kpis.revenueReceived)}</span>
            </div>
          </DashboardCard>

          {/* Overdue Accounts Table */}
          <DashboardCard
            title="Overdue Accounts &amp; Follow-up Queue"
            subtitle={`${overdueInvoices.length} invoices past due date · operational action required`}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-stone-100 text-stone-400 text-left font-medium text-[10.5px] uppercase tracking-wider">
                    <th className="pb-2">Invoice #</th>
                    <th className="pb-2">Customer</th>
                    <th className="pb-2">Due Date</th>
                    <th className="pb-2 text-right">Balance Due</th>
                    <th className="pb-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {overdueInvoices && overdueInvoices.length > 0 ? (
                    overdueInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-stone-50/80 transition">
                        <td className="py-2.5 font-mono font-medium text-stone-900">
                          {inv.invoice_number}
                        </td>
                        <td className="py-2.5 text-stone-800 font-medium">
                          {inv.customer_name}
                        </td>
                        <td className="py-2.5 text-rose-600 font-medium tabular-nums">
                          {formatDate(inv.due_date)}
                        </td>
                        <td className="py-2.5 text-right font-mono font-bold text-stone-900 tabular-nums">
                          {formatCurrency(inv.total_amount - inv.amount_paid)}
                        </td>
                        <td className="py-2.5 text-right">
                          <button
                            onClick={() => onSelectInvoice(inv)}
                            className="rounded-full bg-stone-900 px-3 py-1 text-[11px] font-medium text-white hover:bg-stone-700 transition cursor-pointer"
                          >
                            Open &amp; Pay →
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-stone-400">
                        <CheckCircle2 className="h-5 w-5 text-emerald-500 mx-auto mb-1" />
                        Zero overdue accounts. All customer invoices are up to date!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </DashboardCard>
        </div>

        {/* Right 1 Col: Payment Methods & Recent Transactions */}
        <div className="min-w-0 space-y-4">
          <DashboardCard
            title="Payment Rails Breakdown"
            subtitle="Distribution of collections by method"
          >
            <div className="space-y-2">
              {paymentMethods && paymentMethods.length > 0 ? (
                paymentMethods.map((pm, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center p-2.5 rounded-xl bg-stone-50 border border-stone-100 text-xs"
                  >
                    <span className="font-medium text-stone-800">{pm.payment_method}</span>
                    <span className="font-mono font-semibold text-stone-900 tabular-nums">
                      {formatCurrency(pm.total)}{' '}
                      <span className="text-stone-400 font-normal">({pm.count})</span>
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-stone-400 py-3 text-center">No payment methods recorded</p>
              )}
            </div>
          </DashboardCard>

          <DashboardCard
            title="Recent Settlements"
            subtitle="Latest completed customer transactions"
          >
            <div className="divide-y divide-stone-100 text-xs">
              {recentPayments && recentPayments.length > 0 ? (
                recentPayments.map((p) => (
                  <div key={p.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-stone-900">{p.customer_name}</p>
                      <p className="text-stone-400 text-[10.5px]">
                        {p.invoice_number} · {p.payment_method}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-bold text-stone-900 tabular-nums">
                        {formatCurrency(p.amount)}
                      </p>
                      <p className="text-[10px] text-stone-400">{formatDate(p.payment_date)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="py-6 text-center text-stone-400">No recent transactions</p>
              )}
            </div>
          </DashboardCard>
        </div>
      </div>
    </div>
  );
};
