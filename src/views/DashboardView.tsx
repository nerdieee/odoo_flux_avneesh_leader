import React, { useState, useEffect } from 'react';
import type { DashboardData } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Dashboard } from '../components/dashboard';
import { DashboardCard } from '../components/DashboardCard';
import {
  RefreshCw,
  Sparkles,
  Calendar,
  CheckCircle2,
  ShieldCheck,
  TrendingUp,
  CreditCard,
  Building2,
  Activity,
  ArrowRight
} from 'lucide-react';

interface DashboardViewProps {
  onOpenScheduler: () => void;
  onSelectInvoice: (invoice: any) => void;
  onNavigateTab?: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenScheduler,
  onSelectInvoice,
  onNavigateTab
}) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [spin, setSpin] = useState(false);

  const fetchDashboard = async () => {
    setSpin(true);
    try {
      const res = await fetch('/api/dashboard');
      const text = await res.text();
      const json = text ? JSON.parse(text) : null;
      if (json) {
        setData(json);
      }
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
      <div className="flex h-80 items-center justify-center">
        <div className="flex items-center gap-2.5 text-primary text-sm font-medium">
          <RefreshCw className="h-5 w-5 animate-spin text-primary" />
          <span>Synchronizing BrightLoop financial telemetry…</span>
        </div>
      </div>
    );
  }

  const { kpis, monthlyRevenue, subscriptionStatus, paymentMethods, recentPayments, overdueInvoices, performance } = data;

  return (
    <div className="space-y-6">
      {/* Main Brightloop Dashboard Block with Live Telemetry */}
      <Dashboard
        data={data}
        onOpenScheduler={onOpenScheduler}
        onSelectInvoice={onSelectInvoice}
        onNavigateTab={onNavigateTab}
        onViewReport={() => onNavigateTab?.('invoices')}
      />
    </div>
  );
};
