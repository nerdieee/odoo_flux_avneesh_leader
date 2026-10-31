import React, { useState, useEffect } from 'react';
import type { Plan, BillingFrequency } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import DashboardCard from '../components/DashboardCard';
import { Layers, Plus, Pause, Play, XCircle, RotateCw } from 'lucide-react';

export const PlansView: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [billingFrequency, setBillingFrequency] = useState<BillingFrequency>('monthly');
  const [price, setPrice] = useState<number | ''>('');
  const [minQuantity, setMinQuantity] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/plans');
      setPlans(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleStatusChange = async (planId: number, status: string) => {
    try {
      await fetch(`/api/plans/${planId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      fetchPlans();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code || price === '') return;

    try {
      const res = await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          code,
          billing_frequency: billingFrequency,
          price: Number(price),
          min_quantity: minQuantity,
          start_date: startDate || null,
          end_date: endDate || null,
          description
        })
      });
      if (res.ok) {
        setShowModal(false);
        setName('');
        setCode('');
        setPrice('');
        setDescription('');
        fetchPlans();
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
          <p className="text-[11px] uppercase tracking-[0.12em] text-stone-400">Subscription models</p>
          <h1 className="mt-1 text-lg font-semibold tracking-tight sm:text-xl text-stone-900">
            Subscription Plans
          </h1>
          <p className="mt-0.5 text-xs text-stone-500">
            {plans.length} tiers · configure Daily, Weekly, Monthly or Yearly charging terms with min seats
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex shrink-0 items-center gap-1.5 rounded-full bg-stone-900 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-stone-800 transition-colors shadow-2xs"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Create Plan</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.map(p => (
          <DashboardCard
            key={p.id}
            title={p.name}
            subtitle={p.code}
            action={<StatusBadge status={p.status} size="sm" />}
          >
            <div className="my-2 p-3 bg-stone-50/70 rounded-xl border border-stone-100 flex items-baseline justify-between">
              <div>
                <span className="text-lg font-semibold font-mono tabular-nums text-stone-900">{formatCurrency(p.price)}</span>
                <span className="text-xs text-stone-500 ml-1">/ {p.billing_frequency}</span>
              </div>
              <span className="text-[11px] text-stone-600 font-medium">Min: {p.min_quantity} seat(s)</span>
            </div>

            <p className="text-xs text-stone-600 mb-3">{p.description || 'Standard plan tier'}</p>

            <div className="space-y-1 text-[11px] text-stone-500 border-t border-stone-100 pt-2.5">
              <div className="flex justify-between">
                <span>Active Subscribers:</span>
                <span className="font-medium text-stone-900 tabular-nums">{p.active_subscribers_count || 0}</span>
              </div>
              {p.end_date && (
                <div className="flex justify-between">
                  <span>Plan Availability End:</span>
                  <span className="font-mono text-stone-700">{formatDate(p.end_date)}</span>
                </div>
              )}
            </div>

            {/* Lifecycle Controls: Pause, Close Early, Renew/Activate */}
            <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between">
              <span className="text-[10.5px] uppercase tracking-wide text-stone-400">Actions</span>
              <div className="flex items-center gap-1">
                {p.status === 'active' && (
                  <button
                    onClick={() => handleStatusChange(p.id, 'paused')}
                    className="p-1.5 rounded-md text-stone-500 hover:text-stone-900 hover:bg-stone-100"
                    title="Pause Plan"
                  >
                    <Pause className="h-3.5 w-3.5" />
                  </button>
                )}
                {p.status === 'paused' && (
                  <button
                    onClick={() => handleStatusChange(p.id, 'active')}
                    className="p-1.5 rounded-md text-stone-500 hover:text-emerald-700 hover:bg-emerald-50"
                    title="Activate / Resume Plan"
                  >
                    <Play className="h-3.5 w-3.5" />
                  </button>
                )}
                {p.status !== 'closed' && (
                  <button
                    onClick={() => handleStatusChange(p.id, 'closed')}
                    className="p-1.5 rounded-md text-stone-500 hover:text-rose-700 hover:bg-rose-50"
                    title="Close Plan Early"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                  </button>
                )}
                {p.status === 'closed' && (
                  <button
                    onClick={() => handleStatusChange(p.id, 'active')}
                    className="p-1.5 rounded-md text-stone-500 hover:text-stone-900 hover:bg-stone-100"
                    title="Renew / Reopen Plan"
                  >
                    <RotateCw className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          </DashboardCard>
        ))}
      </div>

      {/* Modal: Create Plan */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Create Subscription Plan"
        subtitle="Define recurring billing frequency, pricing, minimum quantities, and validity dates"
        maxWidth="xl"
      >
        <form onSubmit={handleCreatePlan} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">Plan Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Pro Plan"
                className="w-full rounded-xl border border-stone-200 bg-white p-2 text-xs focus:border-stone-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">Plan Code *</label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="PLAN-PRO"
                className="w-full rounded-xl border border-stone-200 bg-white p-2 text-xs font-mono focus:border-stone-900 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">Billing Frequency *</label>
              <select
                value={billingFrequency}
                onChange={(e) => setBillingFrequency(e.target.value as any)}
                className="w-full rounded-xl border border-stone-200 bg-white p-2 text-xs focus:border-stone-900 focus:outline-none"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">Price (₹) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                placeholder="999"
                className="w-full rounded-xl border border-stone-200 bg-white p-2 text-xs font-mono font-medium focus:border-stone-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">Min Quantity *</label>
              <input
                type="number"
                min="1"
                value={minQuantity}
                onChange={(e) => setMinQuantity(Number(e.target.value))}
                className="w-full rounded-xl border border-stone-200 bg-white p-2 text-xs focus:border-stone-900 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-xl border border-stone-200 bg-white p-2 text-xs focus:border-stone-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">End / Expiry Date (Auto-close)</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
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
              placeholder="Full suite with premium integrations and analytics"
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
              Save Plan
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
