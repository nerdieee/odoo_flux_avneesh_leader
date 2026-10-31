import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import type { Subscription, Invoice } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { StatusBadge } from '../components/StatusBadge';
import { InvoicePrintModal } from '../components/InvoicePrintModal';
import DashboardCard from '../components/DashboardCard';
import {
  Building2,
  FileText,
  Printer,
  Calendar,
  CreditCard,
  CheckCircle2,
  Repeat,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';

export const CustomerPortalView: React.FC = () => {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [printInvoice, setPrintInvoice] = useState<Invoice | null>(null);

  const fetchCustomerData = async () => {
    setLoading(true);
    try {
      const custId = user?.customer_id || 1;
      const [sRes, iRes] = await Promise.all([
        fetch(`/api/subscriptions?customer_id=${custId}`),
        fetch(`/api/invoices?customer_id=${custId}`)
      ]);
      setSubscriptions(await sRes.json());
      setInvoices(await iRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerData();
  }, [user]);

  const totalOutstanding = invoices
    .filter(i => i.status !== 'paid' && i.status !== 'cancelled')
    .reduce((acc, i) => acc + (i.total_amount - i.amount_paid), 0);

  const nextBilling = subscriptions.find(s => s.status === 'active')?.next_billing_date;

  return (
    <div className="space-y-4">
      {/* Welcome Banner */}
      <DashboardCard>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.12em] text-stone-400">Customer self-service portal</p>
            <h1 className="mt-1 text-lg font-semibold tracking-tight sm:text-xl text-stone-900">
              Welcome, {user?.name}
            </h1>
            <p className="mt-0.5 text-xs text-stone-500">
              Account: <strong className="text-stone-800">{user?.company || 'Acme Technologies Ltd'}</strong> · GSTIN: <code className="font-mono text-stone-700">{user?.gst_number || '29ABCDE1234F1Z5'}</code>
            </p>
          </div>

          <div className="flex items-center gap-4 bg-stone-50 border border-stone-200/80 p-3 rounded-2xl">
            <div>
              <span className="text-[10px] uppercase font-medium text-stone-400 block tracking-wide">Balance Due</span>
              <span className={`text-base font-mono font-semibold tabular-nums ${totalOutstanding > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                {formatCurrency(totalOutstanding)}
              </span>
            </div>
            {nextBilling && (
              <div className="border-l border-stone-200 pl-4">
                <span className="text-[10px] uppercase font-medium text-stone-400 block tracking-wide">Next Renewal</span>
                <span className="text-xs font-mono font-medium text-stone-800">{formatDate(nextBilling)}</span>
              </div>
            )}
          </div>
        </div>
      </DashboardCard>

      {/* My Subscriptions List */}
      <div>
        <p className="text-[11px] uppercase tracking-[0.12em] text-stone-400 mb-2">My subscriptions</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {subscriptions.length > 0 ? (
            subscriptions.map(sub => (
              <DashboardCard
                key={sub.id}
                title={sub.plan_name}
                subtitle={sub.subscription_number}
                action={<StatusBadge status={sub.status} size="sm" />}
              >
                <div className="p-3 bg-stone-50/70 rounded-xl space-y-1 text-xs border border-stone-100">
                  <div className="flex justify-between">
                    <span className="text-stone-500">Recurring Price:</span>
                    <span className="font-mono font-medium tabular-nums text-stone-900">
                      {formatCurrency(sub.total_amount)} / {sub.billing_frequency}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Next Billing Date:</span>
                    <span className="font-mono text-stone-700">{formatDate(sub.next_billing_date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Contract Expiry:</span>
                    <span className="font-mono text-stone-700">{formatDate(sub.expiry_date)}</span>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-stone-100">
                  <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-stone-400 mb-1.5 block">
                    Products Included
                  </span>
                  <div className="space-y-1 text-xs text-stone-700">
                    {sub.items && sub.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span>{it.product_name} {it.variant_name ? `(${it.variant_name})` : ''} × {it.quantity}</span>
                        <span className="font-mono tabular-nums">{formatCurrency(it.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </DashboardCard>
            ))
          ) : (
            <p className="text-xs text-stone-400 py-6">No subscriptions found for this account.</p>
          )}
        </div>
      </div>

      {/* Invoices & Receipts for Download/Print */}
      <DashboardCard
        title="Invoices & Statements"
        subtitle="View and print official GST tax invoices"
      >
        <div className="overflow-x-auto rounded-xl border border-stone-100">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-stone-50/70 text-[10.5px] uppercase tracking-wide text-stone-400 border-b border-stone-100">
                <th className="px-3 py-2 font-medium">Invoice #</th>
                <th className="px-3 py-2 font-medium">Cycle Period</th>
                <th className="px-3 py-2 font-medium">Due Date</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium text-right">Total</th>
                <th className="px-3 py-2 font-medium text-right">Paid</th>
                <th className="px-3 py-2 font-medium text-center">Tax Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {invoices.length > 0 ? (
                invoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-stone-50/60 transition-colors">
                    <td className="px-3 py-2.5 font-mono font-medium text-stone-900">
                      {inv.invoice_number}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[11px] text-stone-600">
                      {formatDate(inv.billing_cycle_start)} – {formatDate(inv.billing_cycle_end)}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-stone-700">
                      {formatDate(inv.due_date)}
                    </td>
                    <td className="px-3 py-2.5">
                      <StatusBadge status={inv.status} size="sm" />
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono font-medium tabular-nums text-stone-900">
                      {formatCurrency(inv.total_amount)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-emerald-700 font-medium tabular-nums">
                      {formatCurrency(inv.amount_paid)}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <button
                        onClick={() => setPrintInvoice(inv)}
                        className="inline-flex items-center gap-1 rounded-full border border-stone-200 bg-white px-2.5 py-1 text-xs font-medium text-stone-600 hover:border-stone-400 transition-colors shadow-2xs"
                      >
                        <Printer className="h-3 w-3" />
                        <span>View / Print</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-stone-400">
                    No invoices generated yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </DashboardCard>

      {/* Invoice Print & Download Modal */}
      <InvoicePrintModal
        invoice={printInvoice}
        onClose={() => setPrintInvoice(null)}
      />
    </div>
  );
};
