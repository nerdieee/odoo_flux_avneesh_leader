import React, { useState, useEffect } from 'react';
import type { Payment, Invoice } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Modal } from '../components/Modal';
import DashboardCard from '../components/DashboardCard';
import { CreditCard, Plus, Search, CheckCircle2 } from 'lucide-react';

export const PaymentsView: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [invoiceId, setInvoiceId] = useState<number | ''>('');
  const [amount, setAmount] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Bank Transfer' | 'Credit Card' | 'Cash' | 'Cheque'>('UPI');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [transactionRef, setTransactionRef] = useState('');
  const [notes, setNotes] = useState('');

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const [pRes, iRes] = await Promise.all([
        fetch('/api/payments'),
        fetch('/api/invoices')
      ]);
      setPayments(await pRes.json());
      setInvoices(await iRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleInvoiceSelect = (id: number) => {
    setInvoiceId(id);
    const inv = invoices.find(i => i.id === id);
    if (inv) {
      const remaining = Math.max(0, inv.total_amount - inv.amount_paid);
      setAmount(remaining);
    }
  };

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceId || !amount) {
      alert('Please select an invoice and enter amount');
      return;
    }

    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoice_id: invoiceId,
          amount: Number(amount),
          payment_method: paymentMethod,
          payment_date: paymentDate,
          transaction_ref: transactionRef,
          notes
        })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        setShowModal(false);
        setInvoiceId('');
        setAmount('');
        setTransactionRef('');
        setNotes('');
        fetchPayments();
      } else {
        alert(data.error || 'Failed to record payment');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredPayments = payments.filter(p => {
    return (
      p.payment_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.customer_name && p.customer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.invoice_number && p.invoice_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.payment_method && p.payment_method.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.12em] text-stone-400">Payment settlements</p>
          <h1 className="mt-1 text-lg font-semibold tracking-tight sm:text-xl text-stone-900">
            Payment Settlements
          </h1>
          <p className="mt-0.5 text-xs text-stone-500">
            {payments.length} transactions recorded · link payments to open invoices and track collections
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex shrink-0 items-center gap-1.5 rounded-full bg-stone-900 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-stone-800 transition-colors shadow-2xs"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Record New Payment</span>
        </button>
      </div>

      {/* Filter and Search */}
      <DashboardCard title="Search Payments" subtitle="Search by payment reference, customer or invoice number">
        <div className="flex min-w-0 items-center gap-2 rounded-xl border border-stone-200 px-3 py-1.5 focus-within:border-stone-900 bg-white">
          <Search className="h-3.5 w-3.5 shrink-0 text-stone-400" />
          <input
            type="text"
            placeholder="Search payment #, invoice, customer, reference UTR…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full min-w-0 bg-transparent text-xs text-stone-900 outline-none placeholder:text-stone-400"
          />
        </div>
      </DashboardCard>

      {/* Payments Table */}
      <DashboardCard
        title="Payment Records"
        subtitle={`Showing ${filteredPayments.length} of ${payments.length} settled payments`}
      >
        <div className="overflow-x-auto rounded-xl border border-stone-100">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-stone-50/70 text-[10.5px] uppercase tracking-wide text-stone-400 border-b border-stone-100">
                <th className="whitespace-nowrap px-3 py-2 font-medium">Payment #</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">Invoice #</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">Customer</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">Method</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">Date</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">Reference / UTR</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium text-right">Amount</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredPayments.length > 0 ? (
                filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-stone-50/60 transition-colors">
                    <td className="whitespace-nowrap px-3 py-2.5 font-mono font-medium text-stone-900">
                      {p.payment_number}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 font-mono text-stone-600">
                      {p.invoice_number}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5">
                      <p className="font-medium text-stone-900">{p.customer_name}</p>
                      <p className="text-[11px] text-stone-500">{p.customer_company}</p>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-stone-700">
                      {p.payment_method}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 font-mono text-stone-600">
                      {formatDate(p.payment_date)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 font-mono text-stone-500 text-[11px]">
                      {p.transaction_ref || '—'}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-right font-mono font-medium tabular-nums text-emerald-700">
                      {formatCurrency(p.amount)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="h-3 w-3" />
                        Completed
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-xs text-stone-400">
                    No payment records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </DashboardCard>

      {/* Modal: Record Payment */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Record Customer Payment"
        subtitle="Select open invoice, enter payment amount, and update settlement status"
        maxWidth="md"
      >
        <form onSubmit={handleCreatePayment} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">Invoice *</label>
            <select
              required
              value={invoiceId}
              onChange={(e) => handleInvoiceSelect(Number(e.target.value))}
              className="w-full rounded-xl border border-stone-200 bg-white p-2 text-xs text-stone-900 focus:border-stone-900 focus:outline-none"
            >
              <option value="">Select an invoice to pay…</option>
              {invoices
                .filter(i => i.status !== 'cancelled' && i.status !== 'paid')
                .map(inv => (
                  <option key={inv.id} value={inv.id}>
                    {inv.invoice_number} — {inv.customer_name} (Balance: {formatCurrency(inv.total_amount - inv.amount_paid)})
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">Amount (₹) *</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full rounded-xl border border-stone-200 bg-white p-2 text-xs font-mono font-medium text-stone-900 focus:border-stone-900 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">Payment Method *</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full rounded-xl border border-stone-200 bg-white p-2 text-xs text-stone-900 focus:border-stone-900 focus:outline-none"
              >
                <option value="UPI">UPI</option>
                <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Cash">Cash</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">Payment Date *</label>
              <input
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full rounded-xl border border-stone-200 bg-white p-2 text-xs focus:border-stone-900 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">Transaction Ref / UTR</label>
            <input
              type="text"
              placeholder="e.g. UTR-98214431"
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
              className="w-full rounded-xl border border-stone-200 bg-white p-2 text-xs font-mono focus:border-stone-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">Notes</label>
            <textarea
              rows={2}
              placeholder="Additional payment details…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-stone-200 bg-white p-2 text-xs focus:border-stone-900 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="rounded-full border border-stone-200 bg-white px-3.5 py-1.5 text-xs font-medium text-stone-600 hover:border-stone-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-full bg-stone-900 px-4 py-1.5 text-xs font-medium text-white hover:bg-stone-800 shadow-2xs"
            >
              Save Payment
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
