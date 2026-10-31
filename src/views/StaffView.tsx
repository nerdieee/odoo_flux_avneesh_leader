import React, { useState, useEffect } from 'react';
import type { StaffMember } from '../types';
import { formatDate } from '../utils/formatters';
import { Modal } from '../components/Modal';
import DashboardCard from '../components/DashboardCard';
import { UserCheck, Plus, ShieldCheck, Mail, Phone } from 'lucide-react';

export const StaffView: React.FC = () => {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Brightloop@2026');
  const [department, setDepartment] = useState('Sales Operations');
  const [title, setTitle] = useState('Account Executive');
  const [phone, setPhone] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/staff');
      setStaff(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/invite-staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, department, title, phone })
      });
      const data = await res.json();
      if (res.ok) {
        setShowModal(false);
        setName('');
        setEmail('');
        setPassword('Brightloop@2026');
        fetchStaff();
      } else {
        setErrorMsg(data.error || 'Failed to add staff member');
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.12em] text-stone-400">Team administration</p>
          <div className="flex items-center gap-2 mt-1">
            <h1 className="text-lg font-semibold tracking-tight sm:text-xl text-stone-900">
              Internal Staff Management
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5 text-[10.5px] font-medium text-stone-700 border border-stone-200">
              <ShieldCheck className="h-3 w-3 text-stone-800" />
              Admin Only
            </span>
          </div>
          <p className="mt-0.5 text-xs text-stone-500">
            {staff.length} staff members · authorized operational staff handling quotations, agreements & invoices
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex shrink-0 items-center gap-1.5 rounded-full bg-stone-900 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-stone-800 transition-colors shadow-2xs"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Staff Member</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {staff.map(s => (
          <DashboardCard
            key={s.id}
            title={s.name}
            subtitle={s.title}
            action={
              <span className="rounded-full bg-stone-100 border border-stone-200 px-2 py-0.5 text-[10.5px] font-medium text-stone-700">
                Staff
              </span>
            }
          >
            <div className="my-2 p-3 bg-stone-50/70 rounded-xl border border-stone-100 space-y-1.5 text-xs text-stone-600">
              <div className="flex justify-between">
                <span className="text-stone-400">Department:</span>
                <span className="font-medium text-stone-900">{s.department}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Email:</span>
                <span className="font-mono text-stone-800">{s.email}</span>
              </div>
              {s.phone && (
                <div className="flex justify-between">
                  <span className="text-stone-400">Phone:</span>
                  <span>{s.phone}</span>
                </div>
              )}
            </div>

            <div className="mt-3 pt-2.5 border-t border-stone-100 flex justify-between items-center text-[11px] text-stone-400">
              <span>Access: Operations</span>
              <span>Joined: {formatDate(s.created_at)}</span>
            </div>
          </DashboardCard>
        ))}
      </div>

      {/* Modal: Add Staff Member */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Invite New Staff Member"
        subtitle="Enforces RBAC and security requirements: password >8 chars, upper, lower, and special char"
        maxWidth="md"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex Morgan"
              className="w-full rounded-xl border border-stone-200 bg-white p-2 text-xs focus:border-stone-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">Corporate Email Address *</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="staff.name@brightloop.com"
              className="w-full rounded-xl border border-stone-200 bg-white p-2 text-xs focus:border-stone-900 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">Department *</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full rounded-xl border border-stone-200 bg-white p-2 text-xs focus:border-stone-900 focus:outline-none"
              >
                <option value="Sales Operations">Sales Operations</option>
                <option value="Billing & Finance">Billing & Finance</option>
                <option value="Customer Success">Customer Success</option>
                <option value="Engineering">Engineering</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">Role Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Senior Account Exec"
                className="w-full rounded-xl border border-stone-200 bg-white p-2 text-xs focus:border-stone-900 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">Temporary Initial Password *</label>
            <input
              type="text"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Compliant password (> 8 chars, Aa1@)"
              className="w-full rounded-xl border border-stone-200 bg-white p-2 text-xs font-mono focus:border-stone-900 focus:outline-none"
            />
            <p className="mt-1 text-[10.5px] text-stone-400">
              Must contain &gt;8 chars with uppercase, lowercase, and special characters. Default: <code className="text-stone-800 font-mono">Brightloop@2026</code>
            </p>
          </div>

          {errorMsg && (
            <p className="p-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
              {errorMsg}
            </p>
          )}

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
              Create Staff Account
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
