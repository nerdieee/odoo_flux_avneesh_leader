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
  Clock,
  Send,
  Loader2,
  Eye,
  Check
} from 'lucide-react';

export const InvoicesView: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Selected invoice for Print Modal
  const [printInvoice, setPrintInvoice] = useState<Invoice | null>(null);

  // Email Invoice Modal
  const [emailModalInvoice, setEmailModalInvoice] = useState<Invoice | null>(null);
  const [emailRecipient, setEmailRecipient] = useState('yashchharra@gmail.com');
  const [emailSending, setEmailSending] = useState(false);
  const [showHtmlPreview, setShowHtmlPreview] = useState(false);
  const [emailConfig, setEmailConfig] = useState<{
    sender_email: string;
    receiver_email: string;
    source: string;
    is_configured: boolean;
  } | null>(null);
  const [emailResult, setEmailResult] = useState<{
    success: boolean;
    message: string;
    recipient?: string;
    sender?: string;
    messageId?: string;
    htmlPreview?: string;
  } | null>(null);

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
    fetch('/api/email-config')
      .then(res => res.json())
      .then(cfg => {
        setEmailConfig(cfg);
        if (cfg.receiver_email) {
          setEmailRecipient(cfg.receiver_email);
        }
      })
      .catch(() => {});
  }, []);

  const openEmailModal = (inv: Invoice) => {
    setEmailModalInvoice(inv);
    setEmailRecipient(emailConfig?.receiver_email || 'yashchharra@gmail.com');
    setEmailResult(null);
    setShowHtmlPreview(false);
  };

  const handleExecuteSendInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailModalInvoice) return;

    setEmailSending(true);
    setEmailResult(null);
    try {
      const res = await fetch(`/api/invoices/${emailModalInvoice.id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient_email: emailRecipient })
      });
      const data = await res.json();
      setEmailResult(data);
      if (data.success) {
        fetchInvoices();
      }
    } catch (err: any) {
      setEmailResult({
        success: false,
        message: 'Network request to server failed: ' + err.message
      });
    } finally {
      setEmailSending(false);
    }
  };

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
                            onClick={() => openEmailModal(inv)}
                            className="p-1 rounded-md text-stone-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                            title="Email Invoice to Customer"
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
          onClose={() => setPrintInvoice(null)}
          invoice={printInvoice}
          onSendEmail={(id) => {
            const inv = invoices.find(i => i.id === id) || printInvoice;
            if (inv) openEmailModal(inv);
          }}
        />
      )}

      {/* Send Invoice to Email Modal */}
      <Modal
        isOpen={!!emailModalInvoice}
        onClose={() => {
          setEmailModalInvoice(null);
          setEmailResult(null);
        }}
        title={`Send Invoice #${emailModalInvoice?.invoice_number} via Email`}
        subtitle={`Billing Statement for ${emailModalInvoice?.customer_name} · Total: ${formatCurrency(emailModalInvoice?.total_amount || 0)}`}
        maxWidth="lg"
      >
        <form onSubmit={handleExecuteSendInvoice} className="space-y-4">
          {/* SMTP Account Details */}
          <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 to-violet-50/40 p-3.5 text-xs text-indigo-950">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-semibold text-indigo-950 flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-indigo-600" />
                Sender Gmail SMTP Account
              </span>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-white/90 border border-indigo-200 text-indigo-700 font-medium">
                From {emailConfig?.source ? 'Desktop/appid' : 'Config'}
              </span>
            </div>
            <p className="text-[11.5px] text-indigo-900 leading-relaxed">
              Dispatched from: <strong className="font-mono text-indigo-950">{emailConfig?.sender_email || 'lolkumarold@gmail.com'}</strong>
            </p>
          </div>

          {/* Customer / Recipient Email */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Customer / Recipient Email Address *
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={emailRecipient}
                onChange={(e) => setEmailRecipient(e.target.value)}
                placeholder="yashchharra@gmail.com"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-mono font-medium text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              Default recipient is set to <strong className="font-mono text-indigo-600">yashchharra@gmail.com</strong>
            </p>
          </div>

          {/* Subject Preview */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Subject Line Preview
            </label>
            <input
              type="text"
              disabled
              value={`Invoice #${emailModalInvoice?.invoice_number} from Brightloop Software - ${formatCurrency(emailModalInvoice?.total_amount || 0)}`}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 select-none"
            />
          </div>

          {/* Execution Result Banner */}
          {emailResult && (
            <div className={cn(
              "rounded-xl p-3.5 text-xs border space-y-2",
              emailResult.success
                ? "bg-emerald-50 border-emerald-200 text-emerald-950"
                : "bg-amber-50/90 border-amber-200 text-amber-950"
            )}>
              <div className="flex items-start gap-2">
                {emailResult.success ? (
                  <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <p className="font-semibold text-xs">
                    {emailResult.success ? 'Invoice Email Sent Successfully!' : 'Email Delivery Diagnostic'}
                  </p>
                  <p className="text-[11.5px] leading-relaxed">
                    {emailResult.message}
                  </p>
                  {emailResult.messageId && (
                    <p className="text-[10.5px] font-mono text-emerald-700">
                      Message ID: {emailResult.messageId}
                    </p>
                  )}
                </div>
              </div>

              {emailResult.htmlPreview && (
                <div className="pt-2 border-t border-amber-200/60">
                  <button
                    type="button"
                    onClick={() => setShowHtmlPreview(!showHtmlPreview)}
                    className="text-[11px] font-medium text-indigo-700 hover:text-indigo-900 underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="h-3 w-3" />
                    {showHtmlPreview ? 'Hide Generated Email HTML Preview' : 'Show Generated Email HTML Preview'}
                  </button>
                  {showHtmlPreview && (
                    <div className="mt-2 p-2 bg-white rounded-lg border border-slate-200 max-h-60 overflow-y-auto">
                      <iframe
                        title="Invoice Email Preview"
                        srcDoc={emailResult.htmlPreview}
                        className="w-full h-56 border-0"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setEmailModalInvoice(null);
                setEmailResult(null);
              }}
              className="rounded-xl px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={emailSending}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-1.5 text-xs font-medium text-white shadow-sm hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50 transition-all cursor-pointer"
            >
              {emailSending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Connecting to Gmail SMTP...</span>
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  <span>Send Invoice via Email</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

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
