import React, { useState, useEffect } from 'react';
import type { Discount, Product } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import DashboardCard from '../components/DashboardCard';
import {
  Percent,
  Plus,
  Tag,
  AlertCircle,
  PauseCircle,
  PlayCircle,
  Trash2,
  Check,
  X,
  PowerOff,
  Power
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const DiscountsView: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [activeTabFilter, setActiveTabFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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

  const handleToggleDiscount = async (discount: Discount) => {
    setTogglingId(discount.id);
    setActionFeedback(null);
    try {
      const res = await fetch(`/api/discounts/${discount.id}/toggle`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': user?.role || '',
          'x-user-id': String(user?.id || '')
        }
      });
      const data = await res.json();
      if (res.ok) {
        setActionFeedback({
          type: 'success',
          message: `Discount code "${discount.code}" has been ${data.status === 'active' ? 'enabled' : 'disabled'}.`
        });
        fetchDiscounts();
      } else {
        setActionFeedback({
          type: 'error',
          message: data.error || 'Failed to update discount status.'
        });
      }
    } catch (err: any) {
      setActionFeedback({
        type: 'error',
        message: err.message || 'Network error updating discount status.'
      });
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeleteDiscount = async (discount: Discount) => {
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete discount rule "${discount.code}"?`
    );
    if (!confirmed) return;

    setActionFeedback(null);
    try {
      const res = await fetch(`/api/discounts/${discount.id}`, {
        method: 'DELETE',
        headers: {
          'x-user-role': user?.role || '',
          'x-user-id': String(user?.id || '')
        }
      });
      const data = await res.json();
      if (res.ok) {
        setActionFeedback({
          type: 'success',
          message: data.message || `Discount "${discount.code}" has been deleted.`
        });
        fetchDiscounts();
      } else {
        setActionFeedback({
          type: 'error',
          message: data.error || 'Failed to delete discount rule.'
        });
      }
    } catch (err: any) {
      setActionFeedback({
        type: 'error',
        message: err.message || 'Network error while deleting discount.'
      });
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || value === '') return;

    try {
      const res = await fetch('/api/discounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': user?.role || '',
          'x-user-id': String(user?.id || '')
        },
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
        setActionFeedback({
          type: 'success',
          message: `Discount rule "${code.toUpperCase()}" created successfully.`
        });
        fetchDiscounts();
      } else {
        const data = await res.json();
        setActionFeedback({
          type: 'error',
          message: data.error || 'Failed to create discount rule.'
        });
      }
    } catch (err: any) {
      setActionFeedback({
        type: 'error',
        message: err.message || 'Network error'
      });
    }
  };

  const activeCount = discounts.filter(d => d.status === 'active').length;
  const inactiveCount = discounts.filter(d => d.status === 'inactive').length;

  const filteredDiscounts = discounts.filter(d => {
    if (activeTabFilter === 'active') return d.status === 'active';
    if (activeTabFilter === 'inactive') return d.status === 'inactive';
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Action Feedback Banner */}
      {actionFeedback && (
        <div
          className={`p-3 rounded-2xl border text-xs flex items-center justify-between transition-all shadow-2xs ${
            actionFeedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionFeedback.type === 'success' ? (
              <Check className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            )}
            <span className="font-medium">{actionFeedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionFeedback(null)}
            className="text-stone-400 hover:text-stone-700 transition cursor-pointer p-1"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.12em] text-stone-400">Promotions & Coupons</p>
          <h1 className="mt-1 text-lg font-semibold tracking-tight sm:text-xl text-stone-900">
            Discount &amp; Promotion Rules
          </h1>
          <p className="mt-0.5 text-xs text-stone-500">
            {discounts.length} discount rules · {activeCount} active · {inactiveCount} disabled
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex shrink-0 items-center gap-1.5 rounded-full bg-stone-900 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-stone-800 transition-colors shadow-2xs cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Discount Rule</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTabFilter('all')}
          className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
            activeTabFilter === 'all'
              ? 'bg-stone-900 text-white shadow-2xs'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <Tag className="h-3.5 w-3.5" />
          <span>All Rules ({discounts.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTabFilter('active')}
          className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
            activeTabFilter === 'active'
              ? 'bg-stone-900 text-white shadow-2xs'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <PlayCircle className="h-3.5 w-3.5 text-emerald-500" />
          <span>Active ({activeCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTabFilter('inactive')}
          className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
            activeTabFilter === 'inactive'
              ? 'bg-stone-900 text-white shadow-2xs'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <PauseCircle className="h-3.5 w-3.5 text-amber-500" />
          <span>Disabled ({inactiveCount})</span>
        </button>
      </div>

      {/* Discount Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDiscounts.map(d => {
          const isExhausted = d.max_uses > 0 && d.current_uses >= d.max_uses;
          const usagePercent = d.max_uses > 0 ? Math.round((d.current_uses / d.max_uses) * 100) : 0;
          const isDisabled = d.status === 'inactive';

          return (
            <DashboardCard
              key={d.id}
              title={d.code}
              subtitle={d.discount_type === 'percentage' ? `${d.value}% OFF` : `₹${d.value} Flat OFF`}
              action={
                <div className="flex items-center gap-1.5">
                  <StatusBadge
                    status={isDisabled ? 'disabled' : isExhausted ? 'expired' : d.status}
                    size="sm"
                  />
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => handleToggleDiscount(d)}
                      disabled={togglingId === d.id}
                      className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[11px] font-semibold transition cursor-pointer disabled:opacity-50 ${
                        isDisabled
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                          : 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
                      }`}
                      title={isDisabled ? 'Enable this discount rule' : 'Disable this discount rule'}
                    >
                      {isDisabled ? (
                        <>
                          <PlayCircle className="h-3 w-3 text-emerald-600" />
                          <span>{togglingId === d.id ? 'Enabling...' : 'Enable'}</span>
                        </>
                      ) : (
                        <>
                          <PauseCircle className="h-3 w-3 text-amber-600" />
                          <span>{togglingId === d.id ? 'Disabling...' : 'Disable'}</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              }
            >
              <div className={isDisabled ? 'opacity-70' : ''}>
                <p className="text-xs text-stone-600 mb-2">{d.description || 'General promotion discount'}</p>

                <div className="my-2 p-3 bg-stone-50/70 rounded-xl border border-stone-100 space-y-1.5 text-xs text-stone-600">
                  <div className="flex justify-between">
                    <span>Min Purchase:</span>
                    <span className="font-mono text-stone-900 tabular-nums">
                      {d.min_amount > 0 ? formatCurrency(d.min_amount) : 'None'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Min Quantity:</span>
                    <span className="font-mono text-stone-900 tabular-nums">
                      {d.min_quantity > 0 ? `${d.min_quantity} seats` : 'None'}
                    </span>
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
                      className={`h-full rounded-full ${
                        isDisabled ? 'bg-stone-400' : isExhausted ? 'bg-rose-500' : 'bg-stone-900'
                      }`}
                      style={{ width: `${Math.min(100, usagePercent)}%` }}
                    />
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-stone-100 text-[11px] text-stone-400">
                  Applicable: {d.applicable_product_name ? `Product: ${d.applicable_product_name}` : 'Entire Subscription / Cart'}
                </div>
              </div>

              {/* Admin Actions Footer */}
              {isAdmin && (
                <div className="mt-3 pt-2.5 border-t border-dashed border-stone-200 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-stone-500">
                    Status:{' '}
                    <strong className={isDisabled ? 'text-amber-700 font-semibold' : 'text-emerald-700 font-semibold'}>
                      {isDisabled ? 'Disabled' : 'Active & Usable'}
                    </strong>
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleToggleDiscount(d)}
                      disabled={togglingId === d.id}
                      className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition cursor-pointer disabled:opacity-50 ${
                        isDisabled
                          ? 'border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                          : 'border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100'
                      }`}
                    >
                      {isDisabled ? (
                        <>
                          <PlayCircle className="h-3.5 w-3.5 text-emerald-600" />
                          <span>Enable Rule</span>
                        </>
                      ) : (
                        <>
                          <PauseCircle className="h-3.5 w-3.5 text-amber-600" />
                          <span>Disable Rule</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteDiscount(d)}
                      className="p-1 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                      title="Delete discount rule"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </DashboardCard>
          );
        })}

        {filteredDiscounts.length === 0 && !loading && (
          <div className="col-span-full py-12 text-center text-xs text-stone-400">
            {activeTabFilter === 'inactive'
              ? 'No disabled discounts. All discount rules are currently active.'
              : activeTabFilter === 'active'
              ? 'No active discounts found.'
              : 'No discount rules found. Click "New Discount Rule" to create one.'}
          </div>
        )}
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
              className="rounded-full border border-stone-200 bg-white px-3.5 py-1.5 text-xs font-medium text-stone-600 hover:border-stone-400 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-full bg-stone-900 px-4 py-1.5 text-xs font-medium text-white hover:bg-stone-800 shadow-2xs cursor-pointer"
            >
              Save Discount Rule
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default DiscountsView;
