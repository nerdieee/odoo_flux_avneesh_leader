import React, { useState, useEffect } from 'react';
import type { Discount, Product } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import DashboardCard from '../components/DashboardCard';
import { Percent, Plus, Tag, AlertCircle } from 'lucide-react';

export const DiscountsView: React.FC = () => {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [value, setValue] = useState<number | ''>('');
  const [minAmount, setMinAmount] = useState<number>(0);
  const [minQuantity, setMinQuantity] = useState<number>(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [maxUses, setMaxUses] = useState<number>(100);
  const [applicableProductId, setApplicableProductId] = useState<number | ''>('');

  const fetchDiscounts = async () => {
    setLoading(true);
    try {
      const [dRes, pRes] = await Promise.all([
        fetch('/api/discounts'),
        fetch('/api/products')
      ]);
      setDiscounts(await dRes.json());
      setProducts(await pRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || value === '') return;

    try {
      const res = await fetch('/api/discounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          description,
          discount_type: discountType,
          value: Number(value),
          min_amount: Number(minAmount || 0),
          min_quantity: Number(minQuantity || 0),
          start_date: startDate || null,
          end_date: endDate || null,
          max_uses: Number(maxUses || 100),
          applicable_product_id: applicableProductId || null
        })
      });
      if (res.ok) {
        setShowModal(false);
        setCode('');
        setDescription('');
        setValue('');
        fetchDiscounts();
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
          <p className="text-[11px] uppercase tracking-[0.12em] text-stone-400">Promotions & Coupons</p>
          <h1 className="mt-1 text-lg font-semibold tracking-tight sm:text-xl text-stone-900">
            Discount & Promotion Rules
          </h1>
          <p className="mt-0.5 text-xs text-stone-500">
            {discounts.length} discount rules · volume seat thresholds, coupon limits and validity checks
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex shrink-0 items-center gap-1.5 rounded-full bg-stone-900 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-stone-800 transition-colors shadow-2xs"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Discount Rule</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {discounts.map(d => {
          const isExhausted = d.max_uses > 0 && d.current_uses >= d.max_uses;
          const usagePercent = d.max_uses > 0 ? Math.round((d.current_uses / d.max_uses) * 100) : 0;

          return (
            <DashboardCard
              key={d.id}
              title={d.code}
              subtitle={d.discount_type === 'percentage' ? `${d.value}% OFF` : `₹${d.value} Flat OFF`}
              action={<StatusBadge status={isExhausted ? 'expired' : d.status} size="sm" />}
            >
              <p className="text-xs text-stone-600 mb-2">{d.description || 'General promotion discount'}</p>

              <div className="my-2 p-3 bg-stone-50/70 rounded-xl border border-stone-100 space-y-1.5 text-xs text-stone-600">
                <div className="flex justify-between">
                  <span>Min Purchase:</span>
                  <span className="font-mono text-stone-900 tabular-nums">{d.min_amount > 0 ? formatCurrency(d.min_amount) : 'None'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Min Quantity:</span>
                  <span className="font-mono text-stone-900 tabular-nums">{d.min_quantity > 0 ? `${d.min_quantity} seats` : 'None'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Validity Window:</span>
                  <span className="font-mono text-[11px] text-stone-700">
                    {d.start_date ? formatDate(d.start_date) : 'Open'} – {d.end_date ? formatDate(d.end_date) : 'Open'}
                  </span>
                </div>
              </div>

              {/* Quota Progress */}
              <div className="space-y-1 mt-3">
                <div className="flex justify-between text-[11px] text-stone-500">
                  <span>Usage Quota:</span>
                  <span className="font-mono font-medium text-stone-900 tabular-nums">
                    {d.current_uses} / {d.max_uses} used
                  </span>
                </div>
                <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${isExhausted ? 'bg-rose-500' : 'bg-stone-900'}`}
                    style={{ width: `${Math.min(100, usagePercent)}%` }}
                  />
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-stone-100 text-[11px] text-stone-400">
                Applicable: {d.applicable_product_name ? `Product: ${d.applicable_product_name}` : 'Entire Subscription / Cart'}
              </div>
            </DashboardCard>
          );
        })}
      </div>

      {/* Modal: Create Discount Rule */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Create Discount Rule"
        subtitle="Specify coupon code, discount percentage or fixed amount, and eligibility conditions"
        maxWidth="xl"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">Coupon Code *</label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. BULK10"
                className="w-full rounded-xl border border-stone-200 bg-white p-2 text-xs font-mono font-medium focus:border-stone-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">Discount Type *</label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as any)}
                className="w-full rounded-xl border border-stone-200 bg-white p-2 text-xs focus:border-stone-900 focus:outline-none"
              >
                <option value="percentage">Percentage (% off)</option>
                <option value="fixed">Fixed Amount (₹ off)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Value ({discountType === 'percentage' ? '%' : '₹'}) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={value}
                onChange={(e) => setValue(Number(e.target.value))}
                placeholder={discountType === 'percentage' ? '10' : '500'}
                className="w-full rounded-xl border border-stone-200 bg-white p-2 text-xs font-mono font-medium focus:border-stone-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">Min Quantity (Seats)</label>
              <input
                type="number"
                min="0"
                value={minQuantity}
                onChange={(e) => setMinQuantity(Number(e.target.value))}
                placeholder="10"
                className="w-full rounded-xl border border-stone-200 bg-white p-2 text-xs focus:border-stone-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">Min Order Amount (₹)</label>
              <input
                type="number"
                min="0"
                value={minAmount}
                onChange={(e) => setMinAmount(Number(e.target.value))}
                placeholder="5000"
                className="w-full rounded-xl border border-stone-200 bg-white p-2 text-xs focus:border-stone-900 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">Valid From</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-xl border border-stone-200 bg-white p-2 text-xs focus:border-stone-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">Valid Until</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-xl border border-stone-200 bg-white p-2 text-xs focus:border-stone-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">Max Uses Quota</label>
              <input
                type="number"
                min="1"
                value={maxUses}
                onChange={(e) => setMaxUses(Number(e.target.value))}
                className="w-full rounded-xl border border-stone-200 bg-white p-2 text-xs focus:border-stone-900 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. 10% OFF on 10 or more seats volume purchase"
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
              Save Discount Rule
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
