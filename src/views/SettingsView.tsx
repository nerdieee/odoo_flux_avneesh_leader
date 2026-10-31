import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/formatters';
import DashboardCard from '../components/DashboardCard';
import {
  Settings,
  Receipt,
  Percent,
  ShieldCheck,
  Building2,
  Check,
  AlertCircle,
  Save,
  RotateCcw,
  Info,
  Calculator,
  Sliders,
  DollarSign,
  FileText
} from 'lucide-react';

interface TaxRule {
  id: number;
  name: string;
  rate: number;
  type: string;
  is_active: number;
  is_default: number;
  description: string;
}

export const SettingsView: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Tax Settings State
  const [taxRate, setTaxRate] = useState<number>(18);
  const [taxName, setTaxName] = useState<string>('GST');
  const [taxDescription, setTaxDescription] = useState<string>('Standard GST rate applied to software subscriptions');
  const [taxEnabled, setTaxEnabled] = useState<boolean>(true);
  const [defaultTaxId, setDefaultTaxId] = useState<number | null>(null);

  // Calculator preview amount
  const [previewBase, setPreviewBase] = useState<number>(10000);

  const fetchTaxSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings/tax');
      if (res.ok) {
        const data = await res.json();
        if (data.defaultTax) {
          setDefaultTaxId(data.defaultTax.id);
          setTaxRate(Number(data.defaultTax.rate));
          // Strip out "(18%)" from name if present to keep clean base name
          const cleanName = data.defaultTax.name.replace(/\s*\(\d+(\.\d+)?%\)/, '');
          setTaxName(cleanName || 'GST');
          setTaxDescription(data.defaultTax.description || '');
          setTaxEnabled(Boolean(data.defaultTax.is_active));
        }
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaxSettings();
  }, []);

  const handleSaveTax = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      setFeedback({ type: 'error', message: 'Only administrators can update tax settings.' });
      return;
    }

    setSaving(true);
    setFeedback(null);

    const formattedName = `${taxName.trim()} (${taxRate}%)`;

    try {
      const res = await fetch('/api/settings/tax', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': user?.role || '',
          'x-user-id': String(user?.id || '')
        },
        body: JSON.stringify({
          rate: Number(taxRate),
          name: formattedName,
          description: taxDescription,
          is_active: taxEnabled
        })
      });

      const data = await res.json();
      if (res.ok) {
        setFeedback({
          type: 'success',
          message: `Tax rate successfully updated to ${taxRate}% (${formattedName}). All future recurring invoices, quotes, and subscriptions will automatically use this rate.`
        });
        fetchTaxSettings();
      } else {
        setFeedback({
          type: 'error',
          message: data.error || 'Failed to update tax settings.'
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Network error while saving tax settings.'
      });
    } finally {
      setSaving(false);
    }
  };

  const calculatedTaxAmount = Math.round((previewBase * (taxRate / 100.0)) * 100) / 100;
  const calculatedTotal = Math.round((previewBase + (taxEnabled ? calculatedTaxAmount : 0)) * 100) / 100;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-stone-200/80 pb-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.12em] text-stone-400 font-semibold">
            System Administration
          </p>
          <div className="flex items-center gap-2.5 mt-1">
            <h1 className="text-xl font-bold tracking-tight text-stone-900 sm:text-2xl">
              Platform &amp; Tax Settings
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-0.5 text-[11px] font-semibold text-stone-700 border border-stone-200">
              <ShieldCheck className="h-3.5 w-3.5 text-stone-800" />
              Admin Configuration
            </span>
          </div>
          <p className="mt-1 text-xs text-stone-500">
            Configure global default tax rates, invoice parameters, company credentials, and billing policies.
          </p>
        </div>
      </div>

      {/* Action Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-center justify-between transition-all shadow-2xs ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === 'success' ? (
              <Check className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            )}
            <span className="font-medium leading-relaxed">{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-stone-400 hover:text-stone-700 text-xs font-semibold ml-3"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* PRIMARY SECTION: TAX CONFIGURATION */}
      <div className="bg-white rounded-2xl border border-stone-200/90 shadow-xs overflow-hidden">
        <div className="px-6 py-4 bg-stone-50/70 border-b border-stone-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-stone-900 text-white flex items-center justify-center shadow-xs">
              <Percent className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-stone-900">Default Tax Rate Configuration</h2>
              <p className="text-[11px] text-stone-500">
                Sets the global tax percentage applied across all subscriptions, recurring cycles, and customer invoices
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                taxEnabled
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-stone-100 text-stone-600 border-stone-200'
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${taxEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-stone-400'}`} />
              {taxEnabled ? `Active: ${taxRate}% (${taxName})` : 'Tax Disabled (0%)'}
            </span>
          </div>
        </div>

        <form onSubmit={handleSaveTax} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: Tax Inputs */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1.5">
                  Tax Percentage Rate (%) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    required
                    value={taxRate}
                    onChange={(e) => setTaxRate(Number(e.target.value))}
                    disabled={!isAdmin || saving}
                    placeholder="18"
                    className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm font-mono font-bold text-stone-900 focus:border-stone-900 focus:outline-none transition shadow-2xs pr-10"
                  />
                  <span className="absolute right-3.5 top-2.5 text-stone-400 font-bold text-sm pointer-events-none">
                    %
                  </span>
                </div>
                <p className="text-[11px] text-stone-400 mt-1">
                  Enter any valid percentage between 0% and 100%. Decimal values like 12.5% are supported.
                </p>

                {/* Quick Presets */}
                <div className="mt-3">
                  <span className="text-[10.5px] uppercase font-semibold text-stone-400 tracking-wider block mb-1.5">
                    Quick Tax Presets:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: '0% (Exempt)', value: 0 },
                      { label: '5% (Concessional)', value: 5 },
                      { label: '12% (Standard)', value: 12 },
                      { label: '18% (Standard GST)', value: 18 },
                      { label: '28% (Higher Rate)', value: 28 },
                    ].map((preset) => (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => setTaxRate(preset.value)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition cursor-pointer ${
                          taxRate === preset.value
                            ? 'bg-stone-900 text-white border-stone-900 shadow-2xs font-bold'
                            : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100 hover:border-stone-300'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1.5">
                  Tax Scheme Label (printed on tax receipts) *
                </label>
                <input
                  type="text"
                  required
                  value={taxName}
                  onChange={(e) => setTaxName(e.target.value)}
                  disabled={!isAdmin || saving}
                  placeholder="e.g. GST, VAT, Sales Tax"
                  className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-xs font-medium text-stone-800 focus:border-stone-900 focus:outline-none shadow-2xs"
                />
                <p className="text-[11px] text-stone-400 mt-1">
                  Used as the line-item title on Tax Invoices and customer receipts (e.g. "GST (18%)").
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1.5">
                  Tax Description &amp; Compliance Notes
                </label>
                <textarea
                  rows={2}
                  value={taxDescription}
                  onChange={(e) => setTaxDescription(e.target.value)}
                  disabled={!isAdmin || saving}
                  placeholder="e.g. Standard GST rate for cloud infrastructure and SaaS services in India"
                  className="w-full rounded-xl border border-stone-200 bg-white p-2.5 text-xs text-stone-700 focus:border-stone-900 focus:outline-none shadow-2xs"
                />
              </div>

              {/* Enable / Disable Tax Toggle */}
              <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-stone-800 block">Apply Tax on Invoices</span>
                  <span className="text-[11px] text-stone-500">
                    When disabled, all invoices will be generated with 0% tax (tax-exempt).
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setTaxEnabled(!taxEnabled)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    taxEnabled ? 'bg-stone-900' : 'bg-stone-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      taxEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Right Column: Live Tax Calculator Breakdown */}
            <div className="bg-stone-50/70 rounded-2xl border border-stone-200/80 p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Calculator className="h-4 w-4 text-stone-700" />
                  <span className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                    Live Calculation Preview
                  </span>
                </div>
                <p className="text-[11px] text-stone-500 mb-4">
                  Verify how your configured tax rate will apply to invoice subtotals in real-time.
                </p>

                <div className="mb-4">
                  <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                    Sample Subtotal Amount (₹):
                  </label>
                  <input
                    type="number"
                    step="100"
                    min="0"
                    value={previewBase}
                    onChange={(e) => setPreviewBase(Number(e.target.value))}
                    className="w-full rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs font-mono font-medium text-stone-800"
                  />
                </div>

                <div className="space-y-2.5 p-3.5 bg-white rounded-xl border border-stone-200/80 text-xs">
                  <div className="flex justify-between text-stone-600">
                    <span>Base Subscription Subtotal:</span>
                    <span className="font-mono font-medium text-stone-900 tabular-nums">
                      {formatCurrency(previewBase)}
                    </span>
                  </div>

                  <div className="flex justify-between text-stone-600">
                    <span>
                      {taxName} ({taxRate}%):
                    </span>
                    <span className="font-mono font-semibold text-stone-900 tabular-nums">
                      {taxEnabled ? `+ ${formatCurrency(calculatedTaxAmount)}` : '₹0.00 (Exempt)'}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-stone-200 flex justify-between text-sm font-bold text-stone-900">
                    <span>Total Invoice Payable:</span>
                    <span className="font-mono text-stone-900 tabular-nums">
                      {formatCurrency(calculatedTotal)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-stone-200/60 text-[11px] text-stone-500 flex items-center gap-2">
                <Info className="h-4 w-4 text-stone-400 shrink-0" />
                <span>
                  Updates apply immediately to all newly scheduled billing cycles and manual quotation conversions.
                </span>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-4 border-t border-stone-200 flex items-center justify-between">
            <span className="text-xs text-stone-400">
              Only authorized administrators can modify company tax percentage.
            </span>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={fetchTaxSettings}
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5 text-stone-400" />
                <span>Reset</span>
              </button>

              <button
                type="submit"
                disabled={saving || !isAdmin}
                className="inline-flex items-center gap-1.5 rounded-xl bg-stone-900 px-5 py-2 text-xs font-semibold text-white hover:bg-stone-800 transition cursor-pointer shadow-2xs disabled:opacity-50"
              >
                <Save className="h-3.5 w-3.5" />
                <span>{saving ? 'Saving Tax Settings...' : 'Save Tax Percentage'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* SECONDARY SECTION: COMPANY & INVOICE INFORMATION */}
      <div className="bg-white rounded-2xl border border-stone-200/90 shadow-xs p-6 space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-stone-100">
          <Building2 className="h-4 w-4 text-stone-700" />
          <h2 className="text-sm font-bold text-stone-900">Company &amp; Invoicing Details</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 bg-stone-50/70 rounded-xl border border-stone-100 space-y-1">
            <span className="text-[10.5px] uppercase font-bold text-stone-400 tracking-wider block">Company Name</span>
            <p className="font-semibold text-stone-900 text-sm">Brightloop Software Inc.</p>
            <p className="text-stone-500">Cloud Infrastructure &amp; Enterprise Software Platforms</p>
          </div>

          <div className="p-3.5 bg-stone-50/70 rounded-xl border border-stone-100 space-y-1">
            <span className="text-[10.5px] uppercase font-bold text-stone-400 tracking-wider block">Tax Identifier (GSTIN)</span>
            <p className="font-mono font-bold text-stone-900 text-sm">29AABCB1234F1Z1</p>
            <p className="text-stone-500">CIN: U72200KA2026PTC099123</p>
          </div>

          <div className="p-3.5 bg-stone-50/70 rounded-xl border border-stone-100 space-y-1">
            <span className="text-[10.5px] uppercase font-bold text-stone-400 tracking-wider block">Registered Address</span>
            <p className="text-stone-700 leading-relaxed">
              101 Innovation Boulevard, Tech Park, Bengaluru, Karnataka - 560100, India
            </p>
          </div>

          <div className="p-3.5 bg-stone-50/70 rounded-xl border border-stone-100 space-y-1">
            <span className="text-[10.5px] uppercase font-bold text-stone-400 tracking-wider block">Billing &amp; Support Email</span>
            <p className="font-mono text-stone-800">billing@brightloop.com</p>
            <p className="text-stone-500">Default Payment Terms: Net 15 days</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;

