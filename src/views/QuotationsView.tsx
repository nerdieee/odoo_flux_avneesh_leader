import React, { useState, useEffect } from 'react';
import type { Quotation, QuotationTemplate, Customer, Plan, Product, Discount, TaxRule } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import DashboardCard from '../components/DashboardCard';
import { cn } from '../utils/cn';
import {
  Plus,
  CheckCircle,
  FileSpreadsheet,
  Send,
  Search,
  Sparkles,
  ArrowRight,
  Layers,
  XCircle,
  FolderOpen
} from 'lucide-react';

export const QuotationsView: React.FC = () => {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [templates, setTemplates] = useState<QuotationTemplate[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [taxes, setTaxes] = useState<TaxRule[]>([]);

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quotation | null>(null);

  // Form State
  const [formCustomerId, setFormCustomerId] = useState<number | ''>('');
  const [formPlanId, setFormPlanId] = useState<number | ''>('');
  const [formDiscountId, setFormDiscountId] = useState<number | ''>('');
  const [formTaxRuleId, setFormTaxRuleId] = useState<number | ''>('');
  const [formValidDays, setFormValidDays] = useState(15);
  const [formNotes, setFormNotes] = useState('');
  const [formItems, setFormItems] = useState<{ productId: number; variantId?: number; quantity: number; unitPrice: number }[]>([]);

  const fetchQuotations = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/quotations');
      const data = await res.json();
      setQuotations(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDependencies = async () => {
    try {
      const [tRes, cRes, pRes, prRes, dRes, txRes] = await Promise.all([
        fetch('/api/quotation-templates'),
        fetch('/api/customers'),
        fetch('/api/plans'),
        fetch('/api/products'),
        fetch('/api/discounts'),
        fetch('/api/taxes')
      ]);
      setTemplates(await tRes.json());
      setCustomers(await cRes.json());
      setPlans(await pRes.json());
      setProducts(await prRes.json());
      setDiscounts(await dRes.json());
      setTaxes(await txRes.json());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchQuotations();
    fetchDependencies();
  }, []);

  const handleApplyTemplate = (templateId: number) => {
    const tpl = templates.find(t => t.id === templateId);
    if (!tpl) return;
    if (tpl.plan_id) setFormPlanId(tpl.plan_id);
    if (tpl.validity_days) setFormValidDays(tpl.validity_days);
    if (tpl.notes) setFormNotes(tpl.notes);

    const mappedItems = tpl.items.map(it => ({
      productId: it.product_id,
      variantId: it.variant_id,
      quantity: it.quantity,
      unitPrice: it.unit_price
    }));
    setFormItems(mappedItems);
  };

  const addItemRow = () => {
    if (products.length === 0) return;
    const firstProd = products[0];
    setFormItems(prev => [
      ...prev,
      {
        productId: firstProd.id,
        variantId: firstProd.variants[0]?.id,
        quantity: 1,
        unitPrice: firstProd.sales_price + (firstProd.variants[0]?.price_adjustment || 0)
      }
    ]);
  };

  const removeItemRow = (index: number) => {
    setFormItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreateQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCustomerId || formItems.length === 0) {
      alert('Please select customer and add items.');
      return;
    }

    const payload = {
      customer_id: formCustomerId,
      plan_id: formPlanId || null,
      discount_id: formDiscountId || null,
      tax_rule_id: formTaxRuleId || null,
      valid_days: formValidDays,
      notes: formNotes,
      items: formItems.map(it => ({
        product_id: it.productId,
        variant_id: it.variantId || null,
        quantity: it.quantity,
        unit_price: it.unitPrice
      }))
    };

    try {
      const res = await fetch('/api/quotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setShowCreateModal(false);
        fetchQuotations();
        setFormCustomerId('');
        setFormItems([]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAcceptQuotation = async (quoteId: number) => {
    try {
      const res = await fetch(`/api/quotations/${quoteId}/accept`, {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        fetchQuotations();
        setSelectedQuote(null);
      } else {
        alert(data.error || 'Failed to accept quotation');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredQuotes = quotations.filter(q => {
    return (
      q.quotation_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (q.customer_name && q.customer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (q.customer_company && q.customer_company.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  return (
    <div className="space-y-4">
      {/* View Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.12em] text-stone-400">Sales offers</p>
          <h1 className="mt-1 text-lg font-semibold tracking-tight sm:text-xl text-stone-900">
            Sales Quotations
          </h1>
          <p className="mt-0.5 text-xs text-stone-500">
            {quotations.length} total quotations · prepare proposals and convert directly to subscriptions
          </p>
        </div>

        <button
          onClick={() => {
            if (formItems.length === 0 && products.length > 0) addItemRow();
            setShowCreateModal(true);
          }}
          className="flex shrink-0 items-center gap-1.5 rounded-full bg-stone-900 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-stone-800 transition-colors shadow-2xs"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Create Quotation</span>
        </button>
      </div>

      {/* Filter and Search */}
      <DashboardCard title="Search Quotations" subtitle="Find proposals by number or client name">
        <div className="flex min-w-0 items-center gap-2 rounded-xl border border-stone-200 px-3 py-1.5 focus-within:border-stone-900 bg-white">
          <Search className="h-3.5 w-3.5 shrink-0 text-stone-400" />
          <input
            type="text"
            placeholder="Search quotation #, customer, organization…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full min-w-0 bg-transparent text-xs text-stone-900 outline-none placeholder:text-stone-400"
          />
        </div>
      </DashboardCard>

      {/* Quotations Table */}
      <DashboardCard
        title="Proposals"
        subtitle={`Showing ${filteredQuotes.length} of ${quotations.length} records`}
      >
        <div className="overflow-x-auto rounded-xl border border-stone-100">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-stone-50/70 text-[10.5px] uppercase tracking-wide text-stone-400 border-b border-stone-100">
                <th className="whitespace-nowrap px-3 py-2 font-medium">Quotation #</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">Customer</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">Package Ref</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">Valid Until</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">Status</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium text-right">Subtotal</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium text-right">Discount</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium text-right">Total Offer</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium text-center">Conversion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredQuotes.length > 0 ? (
                filteredQuotes.map((q) => {
                  const isSelected = selectedQuote?.id === q.id;

                  return (
                    <tr
                      key={q.id}
                      onClick={() => setSelectedQuote(q)}
                      className={cn(
                        'hover:bg-stone-50/70 transition-colors cursor-pointer',
                        isSelected && 'bg-stone-100/60'
                      )}
                    >
                      <td className="whitespace-nowrap px-3 py-2.5 font-mono font-medium text-stone-900">
                        {q.quotation_number}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5">
                        <p className="font-medium text-stone-900">{q.customer_name}</p>
                        <p className="text-[11px] text-stone-500">{q.customer_company}</p>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-stone-700">
                        {q.plan_name || 'Custom Package'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 font-mono text-stone-600">
                        {formatDate(q.valid_until)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5">
                        <StatusBadge status={q.status} size="sm" />
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-right font-mono tabular-nums text-stone-600">
                        {formatCurrency(q.subtotal)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-right font-mono tabular-nums text-emerald-700">
                        {q.discount_amount > 0 ? `-${formatCurrency(q.discount_amount)}` : '—'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-right font-mono font-medium tabular-nums text-stone-900">
                        {formatCurrency(q.total_amount)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                        {q.status !== 'accepted' ? (
                          <button
                            onClick={() => handleAcceptQuotation(q.id)}
                            className="inline-flex items-center gap-1 rounded-full bg-stone-900 px-3 py-1 text-xs font-medium text-white hover:bg-stone-800 transition-colors shadow-2xs"
                          >
                            <CheckCircle className="h-3 w-3" />
                            <span>Accept</span>
                          </button>
                        ) : (
                          <span className="text-emerald-700 text-[11px] font-medium flex items-center justify-center gap-1">
                            <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                            Converted
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-xs text-stone-400">
                    No quotations found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </DashboardCard>

      {/* Quotation Detail View */}
      {selectedQuote && (
        <DashboardCard
          title={`Quotation: ${selectedQuote.quotation_number}`}
          subtitle={`Issued for ${selectedQuote.customer_name} (${selectedQuote.customer_company}) · Valid until ${formatDate(selectedQuote.valid_until)}`}
          action={
            <div className="flex items-center gap-2">
              {selectedQuote.status !== 'accepted' && (
                <button
                  onClick={() => handleAcceptQuotation(selectedQuote.id)}
                  className="inline-flex items-center gap-1 rounded-full bg-stone-900 px-3 py-1 text-xs font-medium text-white hover:bg-stone-800 transition-colors shadow-2xs"
                >
                  <CheckCircle className="h-3 w-3" />
                  <span>Accept Offer & Create Subscription</span>
                </button>
              )}
              <button
                onClick={() => setSelectedQuote(null)}
                className="text-xs text-stone-400 hover:text-stone-700"
              >
                Close ✕
              </button>
            </div>
          }
        >
          {/* Line items in Quotation */}
          <div className="overflow-x-auto rounded-xl border border-stone-100">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-stone-50/70 text-[10.5px] uppercase tracking-wide text-stone-400 border-b border-stone-100">
                  <th className="px-3 py-2 font-medium">Product & Variant</th>
                  <th className="px-3 py-2 font-medium text-center">Qty</th>
                  <th className="px-3 py-2 font-medium text-right">Unit Price</th>
                  <th className="px-3 py-2 font-medium text-right">Line Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {selectedQuote.items && selectedQuote.items.map((it, i) => (
                  <tr key={i} className="hover:bg-stone-50/50">
                    <td className="px-3 py-2.5">
                      <span className="font-medium text-stone-900">{it.product_name}</span>
                      {it.variant_name && (
                        <span className="ml-2 text-[10.5px] px-2 py-0.5 bg-stone-100 text-stone-700 rounded-md">
                          {it.variant_name}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-center font-mono">{it.quantity}</td>
                    <td className="px-3 py-2.5 text-right font-mono tabular-nums text-stone-600">{formatCurrency(it.unit_price)}</td>
                    <td className="px-3 py-2.5 text-right font-mono font-medium tabular-nums text-stone-900">{formatCurrency(it.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-100 flex justify-between items-end text-xs">
            <span className="text-stone-500">Validity: Valid until {formatDate(selectedQuote.valid_until)}</span>
            <div className="text-right space-y-1">
              <p className="text-stone-500">Subtotal: <span className="font-mono text-stone-800 tabular-nums">{formatCurrency(selectedQuote.subtotal)}</span></p>
              {selectedQuote.discount_amount > 0 && (
                <p className="text-emerald-700 font-medium">Discount: <span className="font-mono tabular-nums">-{formatCurrency(selectedQuote.discount_amount)}</span></p>
              )}
              <p className="text-stone-500">GST: <span className="font-mono text-stone-800 tabular-nums">{formatCurrency(selectedQuote.tax_amount)}</span></p>
              <p className="text-sm font-semibold text-stone-900">Total: <span className="font-mono tabular-nums">{formatCurrency(selectedQuote.total_amount)}</span></p>
            </div>
          </div>
        </DashboardCard>
      )}

      {/* Modal: Create Quotation */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Prepare New Quotation"
        subtitle="Select customer, optionally load from predefined template, and customize line items"
        maxWidth="3xl"
      >
        <form onSubmit={handleCreateQuotation} className="space-y-4">
          {/* Template Quick Loader */}
          <div className="p-3 bg-stone-50/80 rounded-xl border border-stone-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-stone-600" />
              <span className="text-xs font-medium text-stone-800">Apply Predefined Template:</span>
            </div>
            <select
              onChange={(e) => {
                if (e.target.value) handleApplyTemplate(Number(e.target.value));
              }}
              className="rounded-lg border border-stone-200 bg-white px-2.5 py-1 text-xs text-stone-900 font-medium focus:border-stone-900 focus:outline-none"
            >
              <option value="">Choose template (e.g. ERP Pack 50 Seats)…</option>
              {templates.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">Customer *</label>
              <select
                required
                value={formCustomerId}
                onChange={(e) => setFormCustomerId(Number(e.target.value))}
                className="w-full rounded-xl border border-stone-200 bg-white p-2 text-xs text-stone-800 focus:border-stone-900 focus:outline-none"
              >
                <option value="">Select customer…</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.company})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">Target Plan</label>
              <select
                value={formPlanId}
                onChange={(e) => setFormPlanId(e.target.value ? Number(e.target.value) : '')}
                className="w-full rounded-xl border border-stone-200 bg-white p-2 text-xs text-stone-800 focus:border-stone-900 focus:outline-none"
              >
                <option value="">Custom Package</option>
                {plans.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({formatCurrency(p.price)} / {p.billing_frequency})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Line items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-medium text-stone-800">Products & Quantities</label>
              <button
                type="button"
                onClick={addItemRow}
                className="text-xs font-medium text-stone-800 hover:text-stone-950 inline-flex items-center gap-1 underline underline-offset-2"
              >
                <Plus className="h-3 w-3" /> Add Product
              </button>
            </div>

            <div className="space-y-2 border border-stone-200/80 rounded-xl p-3 bg-stone-50/50">
              {formItems.map((item, idx) => {
                const prod = products.find(p => p.id === item.productId);
                return (
                  <div key={idx} className="flex items-center gap-2 text-xs">
                    <select
                      value={item.productId}
                      onChange={(e) => {
                        const pid = Number(e.target.value);
                        const p = products.find(pr => pr.id === pid);
                        const v = p?.variants[0];
                        setFormItems(prev => prev.map((it, i) => i === idx ? {
                          ...it,
                          productId: pid,
                          variantId: v?.id,
                          unitPrice: (p?.sales_price || 0) + (v?.price_adjustment || 0)
                        } : it));
                      }}
                      className="flex-2 rounded-lg border border-stone-200 bg-white p-1.5 focus:border-stone-900 focus:outline-none"
                    >
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name} (Base ₹{p.sales_price})</option>
                      ))}
                    </select>

                    {prod && prod.variants.length > 0 ? (
                      <select
                        value={item.variantId}
                        onChange={(e) => {
                          const vid = Number(e.target.value);
                          const v = prod.variants.find(vr => vr.id === vid);
                          setFormItems(prev => prev.map((it, i) => i === idx ? {
                            ...it,
                            variantId: vid,
                            unitPrice: prod.sales_price + (v?.price_adjustment || 0)
                          } : it));
                        }}
                        className="flex-2 rounded-lg border border-stone-200 bg-white p-1.5 font-medium text-stone-800 focus:border-stone-900 focus:outline-none"
                      >
                        {prod.variants.map(v => (
                          <option key={v.id} value={v.id}>{v.variant_name} (+₹{v.price_adjustment})</option>
                        ))}
                      </select>
                    ) : (
                      <span className="flex-2 text-stone-400 text-xs italic px-2">No variants</span>
                    )}

                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => {
                        const qty = Math.max(1, Number(e.target.value));
                        setFormItems(prev => prev.map((it, i) => i === idx ? { ...it, quantity: qty } : it));
                      }}
                      className="w-16 rounded-lg border border-stone-200 bg-white p-1.5 text-center focus:border-stone-900 focus:outline-none"
                    />

                    <span className="w-24 font-mono font-medium text-right tabular-nums text-stone-900">
                      {formatCurrency(item.unitPrice * item.quantity)}
                    </span>

                    <button
                      type="button"
                      onClick={() => removeItemRow(idx)}
                      className="text-stone-400 hover:text-rose-600 p-1"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">Discount Code</label>
              <select
                value={formDiscountId}
                onChange={(e) => setFormDiscountId(e.target.value ? Number(e.target.value) : '')}
                className="w-full rounded-xl border border-stone-200 bg-white p-2 text-xs text-stone-800 focus:border-stone-900 focus:outline-none"
              >
                <option value="">None</option>
                {discounts.map(d => (
                  <option key={d.id} value={d.id}>{d.code} ({d.value}{d.discount_type === 'percentage' ? '%' : '₹'} off)</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">Tax Rule</label>
              <select
                value={formTaxRuleId}
                onChange={(e) => setFormTaxRuleId(e.target.value ? Number(e.target.value) : '')}
                className="w-full rounded-xl border border-stone-200 bg-white p-2 text-xs text-stone-800 focus:border-stone-900 focus:outline-none"
              >
                <option value="">Default (GST 18%)</option>
                {taxes.map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({t.rate}%)</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">Validity (Days)</label>
              <input
                type="number"
                min="1"
                value={formValidDays}
                onChange={(e) => setFormValidDays(Number(e.target.value))}
                className="w-full rounded-xl border border-stone-200 bg-white p-2 text-xs text-stone-800 focus:border-stone-900 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="rounded-full border border-stone-200 bg-white px-3.5 py-1.5 text-xs font-medium text-stone-600 hover:border-stone-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-full bg-stone-900 px-4 py-1.5 text-xs font-medium text-white hover:bg-stone-800 shadow-2xs"
            >
              Generate Quotation
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
