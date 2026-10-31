import React, { useState, useEffect } from 'react';
import type { Invoice } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { StatusBadge } from '../components/StatusBadge';
import { InvoicePrintModal } from '../components/InvoicePrintModal';
import { Modal } from '../components/Modal';
import DashboardCard from '../components/DashboardCard';
import { cn } from '../utils/cn';
import {
  FileText,
  Printer,
  Mail,
  CheckCircle,
  XCircle,
  CreditCard,
  Search,
  Filter,
  AlertTriangle,
  Clock
} from 'lucide-react';

export const InvoicesView: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Selected invoice for Print Modal
  const [printInvoice, setPrintInvoice] = useState<Invoice | null>(null);

  // Payment Recording Modal
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);
  const [payAmount, setPayAmount] = useState<number | ''>('');
  const [payMethod, setPayMethod] = useState<'UPI' | 'Bank Transfer' | 'Credit Card' | 'Cash' | 'Cheque'>('UPI');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payRef, setPayRef] = useState('');
  const [payNotes, setPayNotes] = useState('');

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/invoices');
      const data = await res.json();
      setInvoices(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleConfirmInvoice = async (id: number) => {
    try {
      await fetch(`/api/invoices/${id}/confirm`, { method: 'PATCH' });
      fetchInvoices();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancelInvoice = async (id: number) => {
    if (!confirm('Are you sure you want to cancel this invoice?')) return;
    try {
      await fetch(`/api/invoices/${id}/cancel`, { method: 'PATCH' });
      fetchInvoices();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendInvoice = async (id: number) => {
    try {
      const res = await fetch(`/api/invoices/${id}/send`, { method: 'POST' });
      const data = await res.json();
      alert(data.message || 'Invoice sent to customer email successfully!');
      fetchInvoices();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentInvoice || !payAmount) return;

    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoice_id: paymentInvoice.id,
          amount: Number(payAmount),
          payment_method: payMethod,
          payment_date: payDate,
          transaction_ref: payRef,
          notes: payNotes
        })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        setPaymentInvoice(null);
        fetchInvoices();
      } else {
        alert(data.error || 'Payment failed');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredInvoices = invoices.filter(inv => {
    if (statusFilter === 'overdue') {
      if (!inv.is_overdue) return false;
    } else if (statusFilter !== 'all') {
      if (inv.status !== statusFilter) return false;
    }

    const matchesSearch =
      inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.customer_company && inv.customer_company.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (inv.subscription_number && inv.subscription_number.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesSearch;
  });

  return (
    <div className="space-y-4">
      {/* View Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.12em] text-stone-400">Financial records</p>
          <h1 className="mt-1 text-lg font-semibold tracking-tight sm:text-xl text-stone-900">
            Invoices & Billing Statements
          </h1>
          <p className="mt-0.5 text-xs text-stone-500">
            {invoices.length} recurring billing records · tax calculations, status tracking & payment ledger
          </p>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <DashboardCard title="Filters & Search" subtitle="Filter by payment lifecycle or search by identifier">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-stone-200 px-3 py-1.5 focus-within:border-stone-900 bg-white">
            <Search className="h-3.5 w-3.5 shrink-0 text-stone-400" />
            <input
              type="text"
              placeholder="Search invoice #, customer name, subscription…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full min-w-0 bg-transparent text-xs text-stone-900 outline-none placeholder:text-stone-400"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: 'All Invoices' },
              { id: 'confirmed', label: 'Confirmed / Due' },
              { id: 'overdue', label: 'Overdue Only' },
              { id: 'paid', label: 'Paid' },
              { id: 'draft', label: 'Draft' },
              { id: 'cancelled', label: 'Cancelled' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={cn(
                  'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                  statusFilter === tab.id
                    ? 'bg-stone-900 text-white'
                    : 'border border-stone-200 bg-white text-stone-600 hover:border-stone-400'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </DashboardCard>

      {/* Invoices Table */}
      <DashboardCard
        title="Invoices"
        subtitle={`Showing ${filteredInvoices.length} of ${invoices.length} statements`}
      >
        <div className="overflow-x-auto rounded-xl border border-stone-100">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-stone-50/70 text-[10.5px] uppercase tracking-wide text-stone-400 border-b border-stone-100">
                <th className="whitespace-nowrap px-3 py-2 font-medium">Invoice #</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">Customer</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">Billing Period</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">Due Date</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">Status</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium text-right">Subtotal</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium text-right">Tax</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium text-right">Total</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium text-right">Balance Due</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredInvoices.length > 0 ? (
                filteredInvoices.map((inv) => {
                  const balanceDue = Math.max(0, inv.total_amount - (inv.amount_paid || 0));

                  return (
                    <tr
                      key={inv.id}
                      onClick={() => setPrintInvoice(inv)}
                      className="hover:bg-stone-50/70 transition-colors cursor-pointer"
                    >
                      <td className="whitespace-nowrap px-3 py-2.5 font-mono font-medium text-stone-900">
                        {inv.invoice_number}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5">
                        <p className="font-medium text-stone-900">{inv.customer_name}</p>
                        <p className="text-[11px] text-stone-500">{inv.customer_company}</p>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 font-mono text-[11px] text-stone-600">
                        {formatDate(inv.billing_cycle_start)} – {formatDate(inv.billing_cycle_end)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 font-mono text-stone-700">
                        <span className={inv.is_overdue ? 'text-rose-600 font-semibold' : ''}>
                          {formatDate(inv.due_date)}
                        </span>
                        {inv.is_overdue === 1 && (
                          <span className="block text-[9.5px] text-rose-500 font-medium uppercase tracking-wider">Overdue</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5">
                        <StatusBadge status={inv.status} size="sm" />
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-right font-mono tabular-nums text-stone-600">
                        {formatCurrency(inv.subtotal)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-right font-mono tabular-nums text-stone-600">
                        {formatCurrency(inv.tax_amount)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-right font-mono font-medium tabular-nums text-stone-900">
                        {formatCurrency(inv.total_amount)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-right font-mono font-medium tabular-nums">
                        <span className={balanceDue > 0 ? 'text-amber-700' : 'text-emerald-700'}>
                          {formatCurrency(balanceDue)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setPrintInvoice(inv)}
                            className="p-1 rounded-md text-stone-500 hover:text-stone-900 hover:bg-stone-100"
                            title="Print / View Invoice"
                          >
                            <Printer className="h-3.5 w-3.5" />
                          </button>

                          {inv.status === 'draft' && (
                            <button
                              onClick={() => handleConfirmInvoice(inv.id)}
                              className="p-1 rounded-md text-stone-500 hover:text-emerald-700 hover:bg-emerald-50"
                              title="Confirm Invoice"
                            >
                              <CheckCircle className="h-3.5 w-3.5" />
                            </button>
                          )}

                          {inv.status === 'confirmed' && (
                            <button
                              onClick={() => {
                                setPaymentInvoice(inv);
                                setPayAmount(balanceDue);
                              }}
                              className="p-1 rounded-md text-stone-500 hover:text-emerald-700 hover:bg-emerald-50"
                              title="Record Payment"
                            >
                              <CreditCard className="h-3.5 w-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => handleSendInvoice(inv.id)}
                            className="p-1 rounded-md text-stone-500 hover:text-stone-900 hover:bg-stone-100"
                            title="Email Invoice"
                          >
                            <Mail className="h-3.5 w-3.5" />
                          </button>

                          {inv.status !== 'paid' && inv.status !== 'cancelled' && (
                            <button
                              onClick={() => handleCancelInvoice(inv.id)}
                              className="p-1 rounded-md text-stone-500 hover:text-rose-700 hover:bg-rose-50"
                              title="Cancel Invoice"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="py-10 text-center text-xs text-stone-400">
                    No invoices matching the current filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </DashboardCard>

      {/* Print / View Modal */}
      {printInvoice && (
        <InvoicePrintModal
          isOpen={!!printInvoice}
          onClose={() => setPrintInvoice(null)}
          invoice={printInvoice}
        />
      )}

      {/* Record Payment Modal */}
      <Modal
        isOpen={!!paymentInvoice}
        onClose={() => setPaymentInvoice(null)}
        title={`Record Payment for ${paymentInvoice?.invoice_number}`}
        subtitle={`Total: ${formatCurrency(paymentInvoice?.total_amount || 0)} · Customer: ${paymentInvoice?.customer_name}`}
        maxWidth="md"
      >
        <form onSubmit={handleRecordPayment} className="space-y-3.5">
          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">
              Payment Amount (₹) *
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="0.00"
              className="w-full rounded-xl border border-stone-200 bg-white p-2 text-xs font-mono font-medium text-stone-900 focus:border-stone-900 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Payment Method *
              </label>
              <select
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value as any)}
                className="w-full rounded-xl border border-stone-200 bg-white p-2 text-xs text-stone-800 focus:border-stone-900 focus:outline-none"
              >
                <option value="UPI">UPI (Google Pay, PhonePe)</option>
                <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Cash">Cash</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Payment Date *
              </label>
              <input
                type="date"
                required
                value={payDate}
                onChange={(e) => setPayDate(e.target.value)}
                className="w-full rounded-xl border border-stone-200 bg-white p-2 text-xs text-stone-800 focus:border-stone-900 focus:outline-none"
              >
              </input>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">
              Transaction / Reference #
            </label>
            <input
              type="text"
              value={payRef}
              onChange={(e) => setPayRef(e.target.value)}
              placeholder="e.g. UPI-928172930219"
              className="w-full rounded-xl border border-stone-200 bg-white p-2 text-xs font-mono text-stone-800 focus:border-stone-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">
              Internal Notes
            </label>
            <textarea
              rows={2}
              value={payNotes}
              onChange={(e) => setPayNotes(e.target.value)}
              placeholder="e.g. Paid via corporate account"
              className="w-full rounded-xl border border-stone-200 bg-white p-2 text-xs text-stone-800 focus:border-stone-900 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
            <button
              type="button"
              onClick={() => setPaymentInvoice(null)}
              className="rounded-full border border-stone-200 bg-white px-3.5 py-1.5 text-xs font-medium text-stone-600 hover:border-stone-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-full bg-stone-900 px-4 py-1.5 text-xs font-medium text-white hover:bg-stone-800 shadow-2xs"
            >
              Record Payment
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
