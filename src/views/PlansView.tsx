import React, { useState, useEffect } from 'react';
import type { Plan, BillingFrequency } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import DashboardCard from '../components/DashboardCard';
import {
  Layers,
  Plus,
  Pause,
  Play,
  XCircle,
  RotateCw,
  Pencil,
  Trash2,
  Check,
  AlertCircle,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const PlansView: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [billingFrequency, setBillingFrequency] = useState<BillingFrequency>('monthly');
  const [price, setPrice] = useState<number | ''>('');
  const [minQuantity, setMinQuantity] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'active' | 'paused' | 'closed'>('active');

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/plans');
      if (res.ok) {
        setPlans(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const openCreateModal = () => {
    setEditingPlan(null);
    setName('');
    setCode('');
    setBillingFrequency('monthly');
    setPrice('');
    setMinQuantity(1);
    setStartDate('');
    setEndDate('');
    setDescription('');
    setStatus('active');
    setFeedback(null);
    setShowModal(true);
  };

  const openEditModal = (p: Plan) => {
    setEditingPlan(p);
    setName(p.name);
    setCode(p.code);
    setBillingFrequency(p.billing_frequency);
    setPrice(p.price);
    setMinQuantity(p.min_quantity || 1);
    setStartDate(p.start_date || '');
    setEndDate(p.end_date || '');
    setDescription(p.description || '');
    setStatus(p.status);
    setFeedback(null);
    setShowModal(true);
  };

  const handleStatusChange = async (planId: number, newStatus: string) => {
    try {
      const res = await fetch(`/api/plans/${planId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': user?.role || '',
          'x-user-id': String(user?.id || '')
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchPlans();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePlan = async (p: Plan) => {
    if (!window.confirm(`Are you sure you want to delete plan "${p.name}"?`)) return;
    try {
      const res = await fetch(`/api/plans/${p.id}`, {
        method: 'DELETE',
        headers: {
          'x-user-role': user?.role || '',
          'x-user-id': String(user?.id || '')
        }
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback({ type: 'success', message: data.message || `Plan "${p.name}" deleted.` });
        fetchPlans();
      } else {
        setFeedback({ type: 'error', message: data.error || 'Failed to delete plan.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Network error while deleting plan.' });
    }
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code || price === '') return;

    setSubmitting(true);
    setFeedback(null);

    const isEdit = !!editingPlan;
    const url = isEdit ? `/api/plans/${editingPlan.id}` : '/api/plans';
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': user?.role || '',
          'x-user-id': String(user?.id || '')
        },
        body: JSON.stringify({
          name: name.trim(),
          code: code.trim().toUpperCase(),
          billing_frequency: billingFrequency,
          price: Number(price),
          min_quantity: Number(minQuantity || 1),
          start_date: startDate || null,
          end_date: endDate || null,
          description: description.trim(),
          status
        })
      });

      const data = await res.json();
      setSubmitting(false);

      if (res.ok) {
        setShowModal(false);
        setFeedback({
          type: 'success',
          message: isEdit
            ? `Plan "${name}" has been updated successfully.`
            : `Plan "${name}" has been created successfully.`
        });
        fetchPlans();
      } else {
        setFeedback({
          type: 'error',
          message: data.error || `Failed to ${isEdit ? 'update' : 'create'} plan.`
        });
      }
    } catch (err: any) {
      setSubmitting(false);
      setFeedback({
        type: 'error',
        message: err.message || 'Network error saving plan.'
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Action Feedback Banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between transition-all shadow-2xs ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <Check className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            )}
            <span className="font-medium">{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-stone-400 hover:text-stone-700 transition cursor-pointer p-1"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

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
          onClick={openCreateModal}
          className="flex shrink-0 items-center gap-1.5 rounded-full bg-stone-900 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-stone-800 transition-colors shadow-2xs cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Create Plan</span>
        </button>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.map(p => (
          <DashboardCard
            key={p.id}
            title={p.name}
            subtitle={p.code}
            action={
              <div className="flex items-center gap-1.5">
                <StatusBadge status={p.status} size="sm" />
                <button
                  type="button"
                  onClick={() => openEditModal(p)}
                  className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 hover:border-stone-300 px-2 py-0.5 text-[11px] font-semibold text-stone-700 transition cursor-pointer shadow-2xs"
                  title="Edit plan details"
                >
                  <Pencil className="h-3 w-3 text-stone-500" />
                  <span>Edit</span>
                </button>
              </div>
            }
          >
            <div className="my-2 p-3 bg-stone-50/70 rounded-xl border border-stone-100 flex items-baseline justify-between">
              <div>
                <span className="text-lg font-semibold font-mono tabular-nums text-stone-900">
                  {formatCurrency(p.price)}
                </span>
                <span className="text-xs text-stone-500 ml-1">/ {p.billing_frequency}</span>
              </div>
              <span className="text-[11px] text-stone-600 font-medium">Min: {p.min_quantity} seat(s)</span>
            </div>

            <p className="text-xs text-stone-600 mb-3">{p.description || 'Standard plan tier'}</p>

            <div className="space-y-1 text-[11px] text-stone-500 border-t border-stone-100 pt-2.5">
              <div className="flex justify-between">
                <span>Active Subscribers:</span>
                <span className="font-medium text-stone-900 tabular-nums">
                  {p.active_subscribers_count || 0}
                </span>
              </div>
              {p.end_date && (
                <div className="flex justify-between">
                  <span>Plan Availability End:</span>
                  <span className="font-mono text-stone-700">{formatDate(p.end_date)}</span>
                </div>
              )}
            </div>

            {/* Lifecycle Controls: Edit, Pause, Close Early, Renew/Activate */}
            <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => openEditModal(p)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-stone-700 hover:text-stone-900 hover:underline cursor-pointer"
              >
                <Pencil className="h-3.5 w-3.5 text-stone-400" />
                <span>Edit Plan</span>
              </button>

              <div className="flex items-center gap-1">
                {p.status === 'active' && (
                  <button
                    onClick={() => handleStatusChange(p.id, 'paused')}
                    className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition cursor-pointer"
                    title="Pause Plan"
                  >
                    <Pause className="h-3.5 w-3.5" />
                  </button>
                )}
                {p.status === 'paused' && (
                  <button
                    onClick={() => handleStatusChange(p.id, 'active')}
                    className="p-1.5 rounded-lg text-stone-500 hover:text-emerald-700 hover:bg-emerald-50 transition cursor-pointer"
                    title="Activate / Resume Plan"
                  >
                    <Play className="h-3.5 w-3.5" />
                  </button>
                )}
                {p.status !== 'closed' && (
                  <button
                    onClick={() => handleStatusChange(p.id, 'closed')}
                    className="p-1.5 rounded-lg text-stone-500 hover:text-rose-700 hover:bg-rose-50 transition cursor-pointer"
                    title="Close Plan Early"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                  </button>
                )}
                {p.status === 'closed' && (
                  <button
                    onClick={() => handleStatusChange(p.id, 'active')}
                    className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition cursor-pointer"
                    title="Renew / Reopen Plan"
                  >
                    <RotateCw className="h-3.5 w-3.5" />
                  </button>
                )}

                {isAdmin && (!p.active_subscribers_count || p.active_subscribers_count === 0) && (
                  <button
                    type="button"
                    onClick={() => handleDeletePlan(p)}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer ml-1"
                    title="Delete unused plan"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          </DashboardCard>
        ))}
      </div>

      {/* Modal: Create or Edit Plan */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingPlan ? `Edit Plan: ${editingPlan.name}` : 'Create Subscription Plan'}
        subtitle={
          editingPlan
            ? `Modify pricing, billing terms, minimum seats, and validity schedule for ${editingPlan.code}`
            : 'Define recurring billing frequency, pricing, minimum quantities, and validity dates'
        }
        maxWidth="xl"
      >
        <form onSubmit={handleSavePlan} className="space-y-4">
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

          <div className="grid grid-cols-3 gap-3">
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
              <label className="block text-xs font-medium text-stone-700 mb-1">End / Expiry Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-xl border border-stone-200 bg-white p-2 text-xs focus:border-stone-900 focus:outline-none"
              />
            </div>

            {editingPlan && (
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Plan Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full rounded-xl border border-stone-200 bg-white p-2 text-xs focus:border-stone-900 focus:outline-none"
                >
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            )}
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
              className="rounded-full border border-stone-200 bg-white px-3.5 py-1.5 text-xs font-medium text-stone-600 hover:border-stone-400 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-stone-900 px-4 py-1.5 text-xs font-medium text-white hover:bg-stone-800 shadow-2xs cursor-pointer disabled:opacity-50"
            >
              {submitting
                ? editingPlan
                  ? 'Saving Changes...'
                  : 'Creating Plan...'
                : editingPlan
                ? 'Update Plan'
                : 'Save Plan'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PlansView;
