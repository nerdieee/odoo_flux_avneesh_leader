import React from 'react';
import type { Invoice } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Printer, Mail, X, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

interface InvoicePrintModalProps {
  invoice: Invoice | null;
  onClose: () => void;
  onSendEmail?: (id: number) => void;
}

export const InvoicePrintModal: React.FC<InvoicePrintModalProps> = ({
  invoice,
  onClose,
  onSendEmail
}) => {
  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const balanceDue = Math.max(0, invoice.total_amount - (invoice.amount_paid || 0));

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-stone-200">
        {/* Top Action Bar (hidden when printing) */}
        <div className="no-print flex items-center justify-between px-5 py-3 bg-stone-50/80 border-b border-stone-200/80">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-xs text-stone-700">Tax Invoice Document</span>
            <span className="font-mono text-xs px-2 py-0.5 bg-stone-200/60 rounded text-stone-900">
              {invoice.invoice_number}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {onSendEmail && (
              <button
                type="button"
                onClick={() => onSendEmail(invoice.id)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 text-xs font-semibold text-white hover:from-indigo-700 hover:to-violet-700 transition cursor-pointer shadow-sm"
              >
                <Mail className="h-3.5 w-3.5 text-white" />
                <span>Send to Customer (Email)</span>
              </button>
            )}
            <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-stone-900 text-xs font-medium text-white hover:bg-stone-700 transition cursor-pointer shadow-2xs"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print Invoice</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-200 hover:text-stone-700 transition cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Page */}
        <div className="p-8 sm:p-12 text-stone-800 bg-white print:p-0">
          {/* Header */}
          <div className="flex justify-between items-start border-b border-stone-200 pb-8">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <div className="h-8 w-8 rounded-xl bg-stone-900 flex items-center justify-center text-white font-bold text-xs">
                  BL
                </div>
                <h1 className="text-xl font-bold tracking-tight text-stone-900">Brightloop Software Inc.</h1>
              </div>
              <p className="text-xs text-stone-500">Cloud Infrastructure &amp; Enterprise Software Platforms</p>
              <p className="text-xs text-stone-500 mt-1">101 Innovation Boulevard, Tech Park, Bengaluru, KA - 560100</p>
              <p className="text-xs text-stone-500 font-mono">GSTIN: 29AABCB1234F1Z1 · CIN: U72200KA2026PTC099123</p>
            </div>

            <div className="text-right">
              <span className="text-xl font-bold uppercase tracking-wider text-stone-900 block">TAX INVOICE</span>
              <p className="font-mono text-sm font-bold text-stone-900 mt-1">{invoice.invoice_number}</p>

              <div className="mt-2.5 inline-flex items-center gap-1">
                {invoice.status === 'paid' ? (
                  <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" /> Paid in Full
                  </span>
                ) : invoice.is_overdue ? (
                  <span className="bg-rose-50 text-rose-800 border border-rose-200 px-3 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> Overdue
                  </span>
                ) : (
                  <span className="bg-stone-100 text-stone-800 border border-stone-200 px-3 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Confirmed / Due
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Metadata Section */}
          <div className="grid grid-cols-2 gap-8 py-6 border-b border-stone-200 text-xs">
            <div>
              <p className="font-semibold uppercase tracking-wider text-stone-400 text-[10px] mb-2">Billed To</p>
              <p className="font-bold text-sm text-stone-900">{invoice.customer_name}</p>
              {invoice.customer_company && <p className="font-medium text-stone-700 mt-0.5">{invoice.customer_company}</p>}
              {invoice.customer_address && <p className="text-stone-500 mt-1 leading-relaxed">{invoice.customer_address}</p>}
              <p className="text-stone-500 mt-1">Email: {invoice.customer_email}</p>
              {invoice.customer_gst && <p className="font-mono text-stone-600 mt-0.5">GSTIN: {invoice.customer_gst}</p>}
            </div>

            <div className="space-y-1.5 text-right font-mono">
              <div className="flex justify-between">
                <span className="text-stone-400 font-sans">Issue Date:</span>
                <span className="font-medium text-stone-900">{formatDate(invoice.issue_date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400 font-sans">Due Date:</span>
                <span className="font-medium text-stone-900">{formatDate(invoice.due_date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400 font-sans">Billing Cycle:</span>
                <span className="font-medium text-stone-900">
                  {formatDate(invoice.billing_cycle_start)} – {formatDate(invoice.billing_cycle_end)}
                </span>
              </div>
              {invoice.subscription_number && (
                <div className="flex justify-between">
                  <span className="text-stone-400 font-sans">Subscription Ref:</span>
                  <span className="font-medium text-stone-900">{invoice.subscription_number}</span>
                </div>
              )}
            </div>
          </div>

          {/* Line Items Table */}
          <div className="py-6 border-b border-stone-200">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-stone-200 text-stone-400 uppercase tracking-wider text-[10px] text-left">
                  <th className="py-2.5 font-semibold">Item &amp; Description</th>
                  <th className="py-2.5 text-center font-semibold">Qty</th>
                  <th className="py-2.5 text-right font-semibold">Unit Price</th>
                  <th className="py-2.5 text-right font-semibold">Tax (GST)</th>
                  <th className="py-2.5 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {invoice.items && invoice.items.length > 0 ? (
                  invoice.items.map((item, idx) => (
                    <tr key={idx} className="text-stone-700">
                      <td className="py-3">
                        <p className="font-semibold text-stone-900">{item.product_name}</p>
                        {item.variant_name && (
                          <p className="text-[11px] text-stone-500 font-medium">Variant: {item.variant_name}</p>
                        )}
                      </td>
                      <td className="py-3 text-center tabular-nums">{item.quantity}</td>
                      <td className="py-3 text-right font-mono tabular-nums">{formatCurrency(item.unit_price)}</td>
                      <td className="py-3 text-right font-mono tabular-nums">{item.tax_rate}%</td>
                      <td className="py-3 text-right font-mono font-medium text-stone-900 tabular-nums">
                        {formatCurrency(item.amount)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-stone-400">Standard Subscription Service</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Financial Summary */}
          <div className="flex justify-end pt-6">
            <div className="w-72 space-y-2 text-xs">
              <div className="flex justify-between text-stone-600">
                <span>Subtotal:</span>
                <span className="font-mono font-medium tabular-nums">{formatCurrency(invoice.subtotal)}</span>
              </div>

              {invoice.discount_amount > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Discount {invoice.discount_code ? `(${invoice.discount_code})` : ''}:</span>
                  <span className="font-mono tabular-nums">- {formatCurrency(invoice.discount_amount)}</span>
                </div>
              )}

              <div className="flex justify-between text-stone-600">
                <span>GST ({invoice.tax_rate}%):</span>
                <span className="font-mono font-medium tabular-nums">{formatCurrency(invoice.tax_amount)}</span>
              </div>

              <div className="flex justify-between pt-2 border-t border-stone-200 text-sm font-bold text-stone-900">
                <span>Total Amount:</span>
                <span className="font-mono tabular-nums">{formatCurrency(invoice.total_amount)}</span>
              </div>

              <div className="flex justify-between text-stone-600 text-xs">
                <span>Amount Paid:</span>
                <span className="font-mono text-emerald-700 font-medium tabular-nums">{formatCurrency(invoice.amount_paid)}</span>
              </div>

              <div className="flex justify-between pt-1 border-t border-dashed border-stone-200 text-xs font-bold">
                <span className={balanceDue > 0 ? 'text-rose-600' : 'text-stone-600'}>Balance Due:</span>
                <span className={`font-mono tabular-nums ${balanceDue > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                  {formatCurrency(balanceDue)}
                </span>
              </div>
            </div>
          </div>

          {/* Bank Instructions */}
          <div className="mt-8 pt-6 border-t border-stone-200 grid grid-cols-2 gap-6 text-[11px] text-stone-500">
            <div>
              <p className="font-semibold text-stone-900 uppercase tracking-wider text-[10px] mb-1">Payment Instructions</p>
              <p>Bank: HDFC Bank Ltd · Tech Park Branch</p>
              <p>Account Name: Brightloop Software Inc.</p>
              <p className="font-mono">A/C: 50200012345678 · IFSC: HDFC0001234</p>
              <p className="font-mono">UPI ID: brightloop@hdfcbank</p>
            </div>
            <div>
              <p className="font-semibold text-stone-900 uppercase tracking-wider text-[10px] mb-1">Terms &amp; Notes</p>
              <p>{invoice.notes || 'Payment is requested according to agreed billing schedule.'}</p>
              <p className="mt-1 text-stone-400">Inquiries: billing@brightloop.com</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoicePrintModal;
