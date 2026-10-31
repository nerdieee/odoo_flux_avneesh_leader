import React, { useState, useEffect } from 'react';
import type { SchedulerLog } from '../types';
import { formatDate, formatCurrency } from '../utils/formatters';
import DashboardCard from '../components/DashboardCard';
import { CalendarClock, Play, RefreshCw, ShieldCheck, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

export const BillingSchedulerView: React.FC = () => {
  const [logs, setLogs] = useState<SchedulerLog[]>([]);
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [targetDate, setTargetDate] = useState(new Date().toISOString().split('T')[0]);
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<any | null>(null);

  const fetchSchedulerData = async () => {
    try {
      const [lRes, uRes] = await Promise.all([
        fetch('/api/scheduler/logs'),
        fetch('/api/scheduler/upcoming')
      ]);
      setLogs(await lRes.json());
      setUpcoming(await uRes.json());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSchedulerData();
  }, []);

  const handleRunBilling = async () => {
    setRunning(true);
    setRunResult(null);
    try {
      const res = await fetch('/api/scheduler/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetDate })
      });
      const data = await res.json();
      setRunResult(data);
      fetchSchedulerData();
    } catch (err) {
      console.error(err);
    } finally {
      setRunning(false);
    }
  };

  const handleFastForwardMonth = () => {
    const d = new Date(targetDate);
    d.setMonth(d.getMonth() + 1);
    setTargetDate(d.toISOString().split('T')[0]);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.12em] text-stone-400">Recurring billing engine</p>
          <div className="flex items-center gap-2 mt-1">
            <h1 className="text-lg font-semibold tracking-tight sm:text-xl text-stone-900">
              Billing Scheduler & Simulator
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5 text-[10.5px] font-medium text-stone-700 border border-stone-200">
              <ShieldCheck className="h-3 w-3 text-stone-800" />
              Idempotency Guard
            </span>
          </div>
          <p className="mt-0.5 text-xs text-stone-500">
            Automated billing scheduler that generates invoices repeatedly without missing or duplicating cycles
          </p>
        </div>

        <button
          onClick={fetchSchedulerData}
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs text-stone-600 hover:border-stone-400 transition-colors shadow-2xs"
          title="Refresh Queue"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Simulator Control Panel */}
      <DashboardCard
        title="Engine Simulation Controls"
        subtitle="In production this job runs daily at 00:00 UTC. Test upcoming renewals and verify duplicate prevention."
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5 text-xs">
              <span className="text-stone-400 font-medium">Target Date:</span>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="font-mono font-medium text-stone-900 bg-transparent outline-none"
              />
            </div>

            <button
              onClick={handleFastForwardMonth}
              className="px-3 py-1.5 rounded-full border border-stone-200 bg-white hover:border-stone-400 text-xs font-medium text-stone-600 transition-colors shadow-2xs"
            >
              +30 Days
            </button>
          </div>

          <button
            onClick={handleRunBilling}
            disabled={running}
            className="flex items-center justify-center gap-1.5 rounded-full bg-stone-900 px-4 py-2 text-xs font-medium text-white hover:bg-stone-800 transition-colors shadow-2xs disabled:opacity-50"
          >
            {running ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Processing Subscriptions…</span>
              </>
            ) : (
              <>
                <Play className="h-3 w-3 fill-white" />
                <span>Execute Billing Run</span>
              </>
            )}
          </button>
        </div>

        {/* Real-time Run Output */}
        {runResult && (
          <div className="mt-5 pt-4 border-t border-stone-100">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-semibold text-stone-900 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Run Completed for {formatDate(runResult.runDate)}
              </span>
              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="text-stone-600">Checked: <strong>{runResult.subscriptionsChecked}</strong></span>
                <span className="text-emerald-700 font-semibold">Generated: <strong>{runResult.invoicesGenerated}</strong></span>
                <span className="text-stone-500">Skipped (Idempotent): <strong>{runResult.invoicesSkipped}</strong></span>
              </div>
            </div>

            <div className="bg-stone-900 text-stone-200 rounded-xl p-3.5 font-mono text-[11px] space-y-1 max-h-48 overflow-y-auto">
              {runResult.details && runResult.details.length > 0 ? (
                runResult.details.map((line: string, i: number) => (
                  <p key={i} className="text-emerald-400">✓ {line}</p>
                ))
              ) : (
                <p className="text-stone-400">No subscriptions required billing on this date.</p>
              )}
            </div>
          </div>
        )}
      </DashboardCard>

      {/* Grid: Upcoming Billing Queue & Execution History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Upcoming Billing Queue */}
        <DashboardCard
          title="Upcoming Subscriptions Due"
          subtitle="Next scheduled recurring invoice generations"
        >
          <div className="overflow-x-auto rounded-xl border border-stone-100">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-stone-50/70 text-[10.5px] uppercase tracking-wide text-stone-400 border-b border-stone-100">
                  <th className="px-3 py-2 font-medium">Subscription</th>
                  <th className="px-3 py-2 font-medium">Customer</th>
                  <th className="px-3 py-2 font-medium">Next Billing</th>
                  <th className="px-3 py-2 font-medium text-right">Cycle Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {upcoming.length > 0 ? (
                  upcoming.map((sub) => (
                    <tr key={sub.id} className="hover:bg-stone-50/60 transition-colors">
                      <td className="px-3 py-2.5 font-mono font-medium text-stone-900">{sub.subscription_number}</td>
                      <td className="px-3 py-2.5 text-stone-800">{sub.customer_name}</td>
                      <td className="px-3 py-2.5 font-mono text-stone-600">{formatDate(sub.next_billing_date)}</td>
                      <td className="px-3 py-2.5 text-right font-mono font-medium tabular-nums text-stone-900">{formatCurrency(sub.total_amount)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-xs text-stone-400">
                      No upcoming subscriptions due.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </DashboardCard>

        {/* Scheduler Logs History */}
        <DashboardCard
          title="Scheduler Audit Trail"
          subtitle="Historical automated billing executions"
        >
          <div className="divide-y divide-stone-100 text-xs">
            {logs.length > 0 ? (
              logs.map((log) => (
                <div key={log.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-stone-900">
                      Run for Date: <span className="font-mono text-stone-800">{formatDate(log.run_date)}</span>
                    </p>
                    <p className="text-[10.5px] text-stone-400">
                      Executed: {formatDate(log.created_at)} · Status: {log.status}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-xs font-semibold tabular-nums text-emerald-700">
                      +{log.invoices_generated} invoices
                    </span>
                    <p className="text-[10px] text-stone-400">{log.subscriptions_checked} checked</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="py-6 text-center text-xs text-stone-400">No scheduler runs recorded yet.</p>
            )}
          </div>
        </DashboardCard>
      </div>
    </div>
  );
};
