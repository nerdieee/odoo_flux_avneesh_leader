import React, { useState, useEffect } from 'react';
import type { QuotationTemplate, Plan, Product } from '../types';
import { formatCurrency } from '../utils/formatters';
import { Modal } from '../components/Modal';
import DashboardCard from '../components/DashboardCard';
import { FolderOpen, Plus, XCircle, Layers } from 'lucide-react';

export const QuotationTemplatesView: React.FC = () => {
  const [templates, setTemplates] = useState<QuotationTemplate[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [name, setName] = useState('');
  const [planId, setPlanId] = useState<number | ''>('');
  const [validityDays, setValidityDays] = useState(15);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<{ productId: number; variantId?: number; quantity: number; unitPrice: number }[]>([]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [tRes, pRes, prRes] = await Promise.all([
        fetch('/api/quotation-templates'),
        fetch('/api/plans'),
        fetch('/api/products')
      ]);
      setTemplates(await tRes.json());
      setPlans(await pRes.json());
      setProducts(await prRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const addItemRow = () => {
    if (products.length === 0) return;
    const p = products[0];
    setItems(prev => [
      ...prev,
      {
        productId: p.id,
        variantId: p.variants[0]?.id,
        quantity: 1,
        unitPrice: p.sales_price + (p.variants[0]?.price_adjustment || 0)
      }
    ]);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || items.length === 0) {
      alert('Please provide a name and add at least one product.');
      return;
    }

    const payload = {
      name,
      plan_id: planId || null,
      validity_days: validityDays,
      notes,
      items: items.map(it => ({
        product_id: it.productId,
        variant_id: it.variantId || null,
        quantity: it.quantity,
        unit_price: it.unitPrice
      }))
    };

    try {
      const res = await fetch('/api/quotation-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setShowModal(false);
        setName('');
        setNotes('');
        setItems([]);
        fetchAll();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.12em] text-stone-400">Reusable offers</p>
          <h1 className="mt-1 text-lg font-semibold tracking-tight sm:text-xl text-stone-900">
            Quotation Templates
          </h1>
          <p className="mt-0.5 text-xs text-stone-500">
            {templates.length} saved packages · predefined offers for sales reps to reuse and dispatch
          </p>
        </div>

        <button
          onClick={() => {
            if (items.length === 0 && products.length > 0) addItemRow();
            setShowModal(true);
          }}
          className="flex shrink-0 items-center gap-1.5 rounded-full bg-stone-900 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-stone-800 transition-colors shadow-2xs"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Template</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map(tpl => {
          const totalVal = tpl.items.reduce((acc, it) => acc + (it.unit_price * it.quantity), 0);

          return (
            <DashboardCard
              key={tpl.id}
              title={tpl.name}
              subtitle={tpl.plan_name ? `Target: ${tpl.plan_name} (${tpl.billing_frequency})` : 'Custom Package'}
              action={
                <span className="font-mono font-medium tabular-nums text-stone-900 text-sm">
                  {formatCurrency(totalVal)}
                </span>
              }
            >
              <div className="space-y-2 py-2 border-y border-stone-100 text-xs text-stone-700">
                {tpl.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <div>
                      <span className="font-medium text-stone-900">{it.product_name}</span>
                      {it.variant_name && <span className="ml-1 text-stone-500">({it.variant_name})</span>}
                      <span className="ml-2 text-stone-400">× {it.quantity}</span>
                    </div>
                    <span className="font-mono tabular-nums text-stone-800">{formatCurrency(it.unit_price * it.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex justify-between items-center text-[11px] text-stone-400">
                <span>Valid for: {tpl.validity_days} days</span>
                <span>{tpl.notes || 'Standard enterprise package'}</span>
              </div>
            </DashboardCard>
          );
        })}
      </div>

      {/* Modal: Create Template */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Create Reusable Quotation Template"
        subtitle="Define products, variants, quantities, and pricing presets"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">Template Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Enterprise ERP Pack (50 Seats)"
              className="w-full rounded-xl border border-stone-200 bg-white p-2 text-xs focus:border-stone-900 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">Target Plan</label>
              <select
                value={planId}
                onChange={(e) => setPlanId(e.target.value ? Number(e.target.value) : '')}
                className="w-full rounded-xl border border-stone-200 bg-white p-2 text-xs focus:border-stone-900 focus:outline-none"
              >
                <option value="">None / Custom</option>
                {plans.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.billing_frequency})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">Default Validity (Days)</label>
              <input
                type="number"
                min="1"
                value={validityDays}
                onChange={(e) => setValidityDays(Number(e.target.value))}
                className="w-full rounded-xl border border-stone-200 bg-white p-2 text-xs focus:border-stone-900 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-medium text-stone-800">Predefined Line Items</label>
              <button
                type="button"
                onClick={addItemRow}
                className="text-xs font-medium text-stone-800 hover:text-stone-950 underline underline-offset-2"
              >
                + Add Item
              </button>
            </div>

            <div className="space-y-2 border border-stone-200/80 rounded-xl p-3 bg-stone-50/50">
              {items.map((it, idx) => {
                const prod = products.find(p => p.id === it.productId);
                return (
                  <div key={idx} className="flex items-center gap-2 text-xs">
                    <select
                      value={it.productId}
                      onChange={(e) => {
                        const pid = Number(e.target.value);
                        const p = products.find(pr => pr.id === pid);
                        const v = p?.variants[0];
                        setItems(prev => prev.map((item, i) => i === idx ? {
                          ...item,
                          productId: pid,
                          variantId: v?.id,
                          unitPrice: (p?.sales_price || 0) + (v?.price_adjustment || 0)
                        } : item));
                      }}
                      className="flex-2 rounded-lg border border-stone-200 bg-white p-1.5 focus:border-stone-900 focus:outline-none"
                    >
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>

                    {prod && prod.variants.length > 0 ? (
                      <select
                        value={it.variantId}
                        onChange={(e) => {
                          const vid = Number(e.target.value);
                          const v = prod.variants.find(vr => vr.id === vid);
                          setItems(prev => prev.map((item, i) => i === idx ? {
                            ...item,
                            variantId: vid,
                            unitPrice: prod.sales_price + (v?.price_adjustment || 0)
                          } : item));
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
                      value={it.quantity}
                      onChange={(e) => {
                        const q = Math.max(1, Number(e.target.value));
                        setItems(prev => prev.map((item, i) => i === idx ? { ...item, quantity: q } : item));
                      }}
                      className="w-16 rounded-lg border border-stone-200 bg-white p-1.5 text-center focus:border-stone-900 focus:outline-none"
                    />

                    <span className="w-20 font-mono text-right tabular-nums text-stone-900 font-medium">
                      {formatCurrency(it.unitPrice * it.quantity)}
                    </span>

                    <button
                      type="button"
                      onClick={() => setItems(prev => prev.filter((_, i) => i !== idx))}
                      className="text-stone-400 hover:text-rose-600 p-1"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
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
              Save Template
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
