import React, { useState, useEffect } from 'react';
import type { Subscription, Customer, Plan, Product, Discount, TaxRule } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import DashboardCard from '../components/DashboardCard';
import { cn } from '../utils/cn';
import {
  Plus,
  Play,
  Pause,
  XCircle,
  RotateCw,
  Search,
  CheckCircle2,
  Calendar,
  Layers,
  FileText,
  ChevronRight,
  Info,
  ArrowRight
} from 'lucide-react';

export const SubscriptionsView: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals & Details
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closeReason, setCloseReason] = useState('');

  // Form State for New Subscription
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [taxes, setTaxes] = useState<TaxRule[]>([]);

  const [formCustomerId, setFormCustomerId] = useState<number | ''>('');
  const [formPlanId, setFormPlanId] = useState<number | ''>('');
  const [formDiscountId, setFormDiscountId] = useState<number | ''>('');
  const [formTaxRuleId, setFormTaxRuleId] = useState<number | ''>('');
  const [formPaymentTerms, setFormPaymentTerms] = useState('Net 15');
  const [formNotes, setFormNotes] = useState('');
  const [formItems, setFormItems] = useState<{ productId: number; variantId?: number; quantity: number; unitPrice: number }[]>([]);

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/subscriptions');
      const data = await res.json();
      setSubscriptions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setSubscriptions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDependencies = async () => {
    try {
      const [cRes, pRes, prRes, dRes, tRes] = await Promise.all([
        fetch('/api/customers'),
        fetch('/api/plans'),
        fetch('/api/products'),
        fetch('/api/discounts'),
        fetch('/api/taxes')
      ]);
      const [cData, pData, prData, dData, tData] = await Promise.all([
        cRes.json().catch(() => []),
        pRes.json().catch(() => []),
        prRes.json().catch(() => []),
        dRes.json().catch(() => []),
        tRes.json().catch(() => [])
      ]);
      setCustomers(Array.isArray(cData) ? cData : []);
      setPlans(Array.isArray(pData) ? pData : []);
      setProducts(Array.isArray(prData) ? prData : []);
      setDiscounts(Array.isArray(dData) ? dData : []);
      setTaxes(Array.isArray(tData) ? tData : []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
    fetchDependencies();
  }, []);

  const handleStatusChange = async (subId: number, status: string, reason?: string) => {
    try {
      const res = await fetch(`/api/subscriptions/${subId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reason })
      });
      if (res.ok) {
        fetchSubscriptions();
        if (selectedSub && selectedSub.id === subId) {
          setSelectedSub(prev => prev ? { ...prev, status: status as any } : null);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRenew = async () => {
    if (!selectedSub) return;
    try {
      const res = await fetch(`/api/subscriptions/${selectedSub.id}/renew`, {
        method: 'POST'
      });
      if (res.ok) {
        setShowRenewModal(false);
        fetchSubscriptions();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCloseEarly = async () => {
    if (!selectedSub) return;
    await handleStatusChange(selectedSub.id, 'closed', closeReason);
    setShowCloseModal(false);
    setCloseReason('');
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

  const handleProductChange = (index: number, prodId: number) => {
    const prod = products.find(p => p.id === prodId);
    if (!prod) return;
    const variant = prod.variants[0];
    const unitPrice = prod.sales_price + (variant ? variant.price_adjustment : 0);
    setFormItems(prev => prev.map((item, i) => i === index ? {
      ...item,
      productId: prodId,
      variantId: variant?.id,
      unitPrice
    } : item));
  };

  const handleVariantChange = (index: number, variantId: number) => {
    setFormItems(prev => prev.map((item, i) => {
      if (i !== index) return item;
      const prod = products.find(p => p.id === item.productId);
      const variant = prod?.variants.find(v => v.id === variantId);
      const unitPrice = (prod?.sales_price || 0) + (variant?.price_adjustment || 0);
      return { ...item, variantId, unitPrice };
    }));
  };

  const handleCreateSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCustomerId || !formPlanId || formItems.length === 0) {
      alert('Please select customer, plan, and add at least one line item.');
      return;
    }

    const payload = {
      customer_id: formCustomerId,
      plan_id: formPlanId,
      payment_terms: formPaymentTerms,
      discount_id: formDiscountId || null,
      tax_rule_id: formTaxRuleId || null,
      notes: formNotes,
      items: formItems.map(it => ({
        product_id: it.productId,
        variant_id: it.variantId || null,
        quantity: it.quantity,
        unit_price: it.unitPrice
      }))
    };

    try {
      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setShowCreateModal(false);
        fetchSubscriptions();
        // Reset form
        setFormCustomerId('');
        setFormPlanId('');
        setFormItems([]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredSubs = subscriptions.filter(sub => {
    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
    const matchesSearch =
      sub.subscription_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sub.customer_name && sub.customer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (sub.customer_company && sub.customer_company.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (sub.plan_name && sub.plan_name.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  // Lifecycle steps defined in the PDF
  const lifecycleSteps = ['draft', 'quotation', 'confirmed', 'active', 'closed'];

  return (
    <div className="space-y-4">
      {/* View Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.12em] text-stone-400">Recurring contracts</p>
          <h1 className="mt-1 text-lg font-semibold tracking-tight sm:text-xl text-stone-900">
            Subscription Agreements
          </h1>
          <p className="mt-0.5 text-xs text-stone-500">
            {subscriptions.length} total agreements · lifecycle management, renewals & terms
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
          <span>New Subscription</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <DashboardCard title="Filters & Search" subtitle="Filter by agreement status or customer name">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-stone-200 px-3 py-1.5 focus-within:border-stone-900 bg-white">
            <Search className="h-3.5 w-3.5 shrink-0 text-stone-400" />
            <input
              type="text"
              placeholder="Search subscription #, customer, company, plan…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full min-w-0 bg-transparent text-xs text-stone-900 outline-none placeholder:text-stone-400"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {['all', 'active', 'confirmed', 'paused', 'closed'].map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={cn(
                  'rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-colors',
                  statusFilter === st
                    ? 'bg-stone-900 text-white'
                    : 'border border-stone-200 bg-white text-stone-600 hover:border-stone-400'
                )}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </DashboardCard>

      {/* Subscriptions Table */}
      <DashboardCard
        title="Agreements"
        subtitle={`Showing ${filteredSubs.length} of ${subscriptions.length} subscriptions`}
      >
        <div className="overflow-x-auto rounded-xl border border-stone-100">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-stone-50/70 text-[10.5px] uppercase tracking-wide text-stone-400 border-b border-stone-100">
                <th className="whitespace-nowrap px-3 py-2 font-medium">Subscription #</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">Customer</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">Plan & Frequency</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">Status</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">Next Billing</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">Expiry Date</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium text-right">Cycle Total</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredSubs.length > 0 ? (
                filteredSubs.map((sub) => {
                  const isSelected = selectedSub?.id === sub.id;

                  return (
                    <tr
                      key={sub.id}
                      onClick={() => setSelectedSub(sub)}
                      className={cn(
                        'hover:bg-stone-50/70 transition-colors cursor-pointer',
                        isSelected && 'bg-stone-100/60'
                      )}
                    >
                      <td className="whitespace-nowrap px-3 py-2.5 font-mono font-medium text-stone-900">
                        {sub.subscription_number}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5">
                        <p className="font-medium text-stone-900">{sub.customer_name}</p>
                        <p className="text-[11px] text-stone-500">{sub.customer_company}</p>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5">
                        <p className="text-stone-800">{sub.plan_name}</p>
                        <span className="capitalize text-[10px] text-stone-500 font-mono">
                          {sub.billing_frequency}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5">
                        <StatusBadge status={sub.status} size="sm" />
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 font-mono text-stone-700">
                        {formatDate(sub.next_billing_date)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 font-mono text-stone-500">
                        {formatDate(sub.expiry_date)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-right font-mono font-medium tabular-nums text-stone-900">
                        {formatCurrency(sub.total_amount)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          {sub.status === 'active' && (
                            <button
                              onClick={() => handleStatusChange(sub.id, 'paused')}
                              className="p-1 rounded-md text-stone-500 hover:text-stone-900 hover:bg-stone-100"
                              title="Pause Subscription"
                            >
                              <Pause className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {sub.status === 'paused' && (
                            <button
                              onClick={() => handleStatusChange(sub.id, 'active')}
                              className="p-1 rounded-md text-stone-500 hover:text-emerald-700 hover:bg-emerald-50"
                              title="Resume Subscription"
                            >
                              <Play className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {sub.status !== 'closed' && (
                            <button
                              onClick={() => {
                                setSelectedSub(sub);
                                setShowCloseModal(true);
                              }}
                              className="p-1 rounded-md text-stone-500 hover:text-rose-700 hover:bg-rose-50"
                              title="Close Early"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setSelectedSub(sub);
                              setShowRenewModal(true);
                            }}
                            className="p-1 rounded-md text-stone-500 hover:text-stone-900 hover:bg-stone-100"
                            title="Renew Term"
                          >
                            <RotateCw className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-xs text-stone-400">
                    No subscriptions matching the filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </DashboardCard>

      {/* Subscription Lifecycle Drawer / Detail View */}
      {selectedSub && (
        <DashboardCard
          title={`Contract Details: ${selectedSub.subscription_number}`}
          subtitle={`${selectedSub.customer_name} · ${selectedSub.customer_company || 'Individual'}`}
          action={
            <button
              onClick={() => setSelectedSub(null)}
              className="text-xs text-stone-400 hover:text-stone-700"
            >
              Close Details ✕
            </button>
          }
        >
          <div className="space-y-5">
            {/* Lifecycle Stepper (as required by the PDF: Draft -> Quotation -> Confirmed -> Active -> Closed) */}
            <div className="rounded-xl border border-stone-200/80 bg-stone-50/50 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-stone-400 mb-3">
                Official Subscription Lifecycle
              </p>
              <div className="flex items-center justify-between relative max-w-2xl mx-auto">
                {lifecycleSteps.map((step, idx) => {
                  const isCurrent = selectedSub.status === step;
                  const isPast =
                    lifecycleSteps.indexOf(selectedSub.status) >= idx ||
                    (selectedSub.status === 'paused' && idx <= 3);

                  return (
                    <div key={step} className="flex-1 flex flex-col items-center relative z-10">
                      <div
                        className={cn(
                          'flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-all',
                          isCurrent
                            ? 'bg-stone-900 text-white ring-4 ring-stone-200'
                            : isPast
                            ? 'bg-emerald-600 text-white'
                            : 'border border-stone-200 bg-white text-stone-400'
                        )}
                      >
                        {idx + 1}
                      </div>
                      <span className="mt-1 text-[11px] font-medium capitalize text-stone-700">
                        {step}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Line Items Attached */}
            <div className="rounded-xl border border-stone-200/80 p-4 bg-white">
              <h4 className="text-xs font-semibold text-stone-900 mb-2">Subscription Line Items & Variants</h4>
              <div className="divide-y divide-stone-100 text-xs">
                {selectedSub.items && selectedSub.items.map((item, idx) => (
                  <div key={idx} className="py-2 flex justify-between items-center">
                    <div>
                      <span className="font-medium text-stone-900">{item.product_name}</span>
                      {item.variant_name && (
                        <span className="ml-2 text-[10.5px] px-2 py-0.5 bg-stone-100 text-stone-700 rounded-md">
                          {item.variant_name}
                        </span>
                      )}
                      <span className="ml-2 text-stone-400">× {item.quantity}</span>
                    </div>
                    <div className="font-mono text-stone-900 font-medium tabular-nums">
                      {formatCurrency(item.amount)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 pt-3 border-t border-stone-100 flex justify-between items-center text-xs">
                <span className="text-stone-500">Payment Terms: {selectedSub.payment_terms}</span>
                <span className="font-mono font-semibold text-stone-900 text-sm tabular-nums">
                  Total: {formatCurrency(selectedSub.total_amount)}
                </span>
              </div>
            </div>
          </div>
        </DashboardCard>
      )}

      {/* Modal: Create Subscription */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Subscription Agreement"
        subtitle="Configure recurring agreement, select plan, line items, variants, and payment terms"
        maxWidth="3xl"
      >
        <form onSubmit={handleCreateSubscription} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">Customer *</label>
              <select
                required
                value={formCustomerId}
                onChange={(e) => setFormCustomerId(Number(e.target.value))}
                className="w-full rounded-xl border border-stone-200 bg-white p-2 text-xs text-stone-800 focus:border-stone-900 focus:outline-none"
              >
                <option value="">Select a customer…</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.company || c.email})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">Plan & Billing Cycle *</label>
              <select
                required
                value={formPlanId}
                onChange={(e) => setFormPlanId(Number(e.target.value))}
                className="w-full rounded-xl border border-stone-200 bg-white p-2 text-xs text-stone-800 focus:border-stone-900 focus:outline-none"
              >
                <option value="">Select a subscription plan…</option>
                {plans.map(p => (
                  <option key={p.id} value={p.id}>{p.name} — {formatCurrency(p.price)} / {p.billing_frequency}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Line Items & Variants */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-medium text-stone-800">
                Line Items & Product Variants
              </label>
              <button
                type="button"
                onClick={addItemRow}
                className="text-xs font-medium text-stone-800 hover:text-stone-950 inline-flex items-center gap-1 underline underline-offset-2"
              >
                <Plus className="h-3 w-3" /> Add Item
              </button>
            </div>

            <div className="space-y-2 border border-stone-200/80 rounded-xl p-3 bg-stone-50/50">
              {formItems.map((item, idx) => {
                const prod = products.find(p => p.id === item.productId);

                return (
                  <div key={idx} className="flex items-center gap-2 text-xs">
                    <select
                      value={item.productId}
                      onChange={(e) => handleProductChange(idx, Number(e.target.value))}
                      className="flex-2 rounded-lg border border-stone-200 bg-white p-1.5 focus:border-stone-900 focus:outline-none"
                    >
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name} (Base ₹{p.sales_price})</option>
                      ))}
                    </select>

                    {prod && prod.variants.length > 0 ? (
                      <select
                        value={item.variantId}
                        onChange={(e) => handleVariantChange(idx, Number(e.target.value))}
                        className="flex-2 rounded-lg border border-stone-200 bg-white p-1.5 font-medium text-stone-800 focus:border-stone-900 focus:outline-none"
                      >
                        {prod.variants.map(v => (
                          <option key={v.id} value={v.id}>
                            {v.variant_name} (+₹{v.price_adjustment})
                          </option>
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
                      placeholder="Qty"
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
              <label className="block text-xs font-medium text-stone-700 mb-1">Discount Rule</label>
              <select
                value={formDiscountId}
                onChange={(e) => setFormDiscountId(e.target.value ? Number(e.target.value) : '')}
                className="w-full rounded-xl border border-stone-200 bg-white p-2 text-xs text-stone-800 focus:border-stone-900 focus:outline-none"
              >
                <option value="">None (Standard)</option>
                {discounts.map(d => (
                  <option key={d.id} value={d.id} disabled={d.status !== 'active'}>
                    {d.code} ({d.value}{d.discount_type === 'percentage' ? '%' : '₹'} off){d.status !== 'active' ? ' — [Disabled]' : ''}
                  </option>
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
              <label className="block text-xs font-medium text-stone-700 mb-1">Payment Terms</label>
              <select
                value={formPaymentTerms}
                onChange={(e) => setFormPaymentTerms(e.target.value)}
                className="w-full rounded-xl border border-stone-200 bg-white p-2 text-xs text-stone-800 focus:border-stone-900 focus:outline-none"
              >
                <option value="Net 15">Net 15 (15 days)</option>
                <option value="Net 30">Net 30 (30 days)</option>
                <option value="Due on receipt">Due on receipt</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">Internal Notes</label>
            <textarea
              rows={2}
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder="e.g. Approved by Sales Director with enterprise SLAs"
              className="w-full rounded-xl border border-stone-200 bg-white p-2 text-xs text-stone-800 focus:border-stone-900 focus:outline-none"
            />
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
              Confirm & Activate Subscription
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Close Early */}
      <Modal
        isOpen={showCloseModal}
        onClose={() => setShowCloseModal(false)}
        title="Close Subscription Early"
        subtitle="Terminates recurring billing cycle. Subscription status becomes 'closed'."
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <p className="text-stone-600">
            Are you sure you want to end subscription <span className="font-mono font-semibold text-stone-900">{selectedSub?.subscription_number}</span>?
          </p>
          <div>
            <label className="block font-medium text-stone-700 mb-1">Reason for early closure</label>
            <input
              type="text"
              value={closeReason}
              onChange={(e) => setCloseReason(e.target.value)}
              placeholder="e.g. Customer migrated to on-premise license"
              className="w-full rounded-xl border border-stone-200 bg-stone-50/50 p-2 text-xs focus:border-stone-900 focus:bg-white focus:outline-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setShowCloseModal(false)}
              className="rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-600 hover:border-stone-400"
            >
              Keep Active
            </button>
            <button
              onClick={handleCloseEarly}
              className="rounded-full bg-rose-700 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-rose-800"
            >
              Close Subscription
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal: Renew */}
      <Modal
        isOpen={showRenewModal}
        onClose={() => setShowRenewModal(false)}
        title="Renew Subscription Agreement"
        subtitle="Extends expiry date by 1 year and ensures active state."
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <p className="text-stone-600">
            Extend subscription <span className="font-mono font-semibold text-stone-900">{selectedSub?.subscription_number}</span> for another contract period?
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setShowRenewModal(false)}
              className="rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-600 hover:border-stone-400"
            >
              Cancel
            </button>
            <button
              onClick={handleRenew}
              className="rounded-full bg-stone-900 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-stone-800"
            >
              Confirm Renewal
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
