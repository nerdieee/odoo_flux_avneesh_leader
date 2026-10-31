import React, { useState, useEffect } from 'react';
import type { TaxRule } from '../types';
import { Modal } from '../components/Modal';
import DashboardCard from '../components/DashboardCard';
import { Receipt, Plus, CheckCircle2 } from 'lucide-react';

export const TaxesView: React.FC = () => {
  const [taxes, setTaxes] = useState<TaxRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [rate, setRate] = useState<number | ''>('');
  const [type, setType] = useState('percentage');
  const [isDefault, setIsDefault] = useState(false);
  const [description, setDescription] = useState('');

  const fetchTaxes = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/taxes');
      const data = await res.json();
      setTaxes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setTaxes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaxes();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || rate === '') return;

    try {
      const res = await fetch('/api/taxes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          rate: Number(rate),
          type,
          is_default: isDefault,
          is_active: 1,
          description
        })
      });
      if (res.ok) {
        setShowModal(false);
        setName('');
        setRate('');
        setDescription('');
        fetchTaxes();
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
          <p className="text-[11px] uppercase tracking-[0.12em] text-stone-400">Statutory compliance</p>
          <h1 className="mt-1 text-lg font-semibold tracking-tight sm:text-xl text-stone-900">
            Tax Rules & Compliance
          </h1>
          <p className="mt-0.5 text-xs text-stone-500">
            {taxes.length} tax rules · configure GST, VAT and regional sales taxes applied to invoices
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex shrink-0 items-center gap-1.5 rounded-full bg-stone-900 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-stone-800 transition-colors shadow-2xs"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Tax Rule</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {taxes.map(t => (
          <DashboardCard
            key={t.id}
            title={t.name}
            subtitle={`Rate: ${t.rate}%`}
            action={
              t.is_default === 1 ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="h-3 w-3" />
                  Default
                </span>
              ) : null
            }
          >
            <p className="text-xs text-stone-600 my-2 leading-relaxed">
              {t.description || 'Configured sales tax rate'}
            </p>

            <div className="mt-3 pt-2.5 border-t border-stone-100 flex justify-between items-center text-[11px] text-stone-400">
              <span>Status: {t.is_active ? 'Active & Enforced' : 'Disabled'}</span>
              <span>Type: {t.type}</span>
            </div>
          </DashboardCard>
        ))}
      </div>

      {/* Modal: Create Tax */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Add New Tax Rule"
        subtitle="Tax percentage is automatically evaluated on taxable invoice amounts"
        maxWidth="md"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">Tax Rule Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. GST (18%) or VAT (5%)"
              className="w-full rounded-xl border border-stone-200 bg-white p-2 text-xs focus:border-stone-900 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">Percentage Rate (%) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
                placeholder="18"
                className="w-full rounded-xl border border-stone-200 bg-white p-2 text-xs font-mono font-medium focus:border-stone-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">Tax Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full rounded-xl border border-stone-200 bg-white p-2 text-xs focus:border-stone-900 focus:outline-none"
              >
                <option value="percentage">Percentage</option>
                <option value="flat">Fixed / Flat</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isDefault"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="rounded border-stone-300 text-stone-900 focus:ring-stone-900 h-4 w-4"
            />
            <label htmlFor="isDefault" className="text-xs font-medium text-stone-700">
              Set as system default tax rule for new subscriptions
            </label>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">Description / Statutory Reference</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Standard Indian GST rate for SaaS IT services"
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
              Save Tax Rule
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
