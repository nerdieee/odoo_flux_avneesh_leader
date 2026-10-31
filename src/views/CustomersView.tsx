import React, { useState, useEffect } from 'react';
import type { Customer } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import DashboardCard from '../components/DashboardCard';
import { Users, Plus, Search, Mail, Phone, Building2 } from 'lucide-react';

export const CustomersView: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [gstNumber, setGstNumber] = useState('');

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/customers');
      setCustomers(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, company, phone, address, gst_number: gstNumber })
      });
      if (res.ok) {
        setShowModal(false);
        setName('');
        setEmail('');
        setCompany('');
        setPhone('');
        setAddress('');
        setGstNumber('');
        fetchCustomers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = customers.filter(c => {
    return (
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.company && c.company.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.12em] text-stone-400">Account records</p>
          <h1 className="mt-1 text-lg font-semibold tracking-tight sm:text-xl text-stone-900">
            Customer Directory
          </h1>
          <p className="mt-0.5 text-xs text-stone-500">
            {customers.length} registered accounts · corporate accounts, tax identification, active subscriptions & balance
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex shrink-0 items-center gap-1.5 rounded-full bg-stone-900 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-stone-800 transition-colors shadow-2xs"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Customer</span>
        </button>
      </div>

      {/* Filter and Search */}
      <DashboardCard title="Search Customers" subtitle="Find client accounts by contact name, company or email">
        <div className="flex min-w-0 items-center gap-2 rounded-xl border border-stone-200 px-3 py-1.5 focus-within:border-stone-900 bg-white">
          <Search className="h-3.5 w-3.5 shrink-0 text-stone-400" />
          <input
            type="text"
            placeholder="Search customers by name, organization, email…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full min-w-0 bg-transparent text-xs text-stone-900 outline-none placeholder:text-stone-400"
          />
        </div>
      </DashboardCard>

      {/* Customers Table */}
      <DashboardCard
        title="Accounts"
        subtitle={`Showing ${filtered.length} of ${customers.length} accounts`}
      >
        <div className="overflow-x-auto rounded-xl border border-stone-100">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-stone-50/70 text-[10.5px] uppercase tracking-wide text-stone-400 border-b border-stone-100">
                <th className="whitespace-nowrap px-3 py-2 font-medium">Customer Name</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">Company & Tax ID</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">Contact</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">Active Subs</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium text-right">Total Spent</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium text-right">Outstanding</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filtered.length > 0 ? (
                filtered.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => setSelectedCustomer(c)}
                    className="hover:bg-stone-50/60 transition-colors cursor-pointer"
                  >
                    <td className="whitespace-nowrap px-3 py-2.5 font-medium text-stone-900">
                      {c.name}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5">
                      <p className="text-stone-900">{c.company || 'Individual'}</p>
                      {c.gst_number && (
                        <span className="font-mono text-[10px] text-stone-500">GST: {c.gst_number}</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5">
                      <p className="text-stone-700">{c.email}</p>
                      {c.phone && <p className="text-[11px] text-stone-400">{c.phone}</p>}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-stone-800">
                      <span className="font-mono tabular-nums">{c.active_subscriptions_count || 0}</span> active
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-right font-mono tabular-nums text-stone-700">
                      {formatCurrency(c.total_spent)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-right font-mono tabular-nums font-medium">
                      <span className={(c.outstanding_balance || 0) > 0 ? 'text-amber-700' : 'text-stone-400'}>
                        {formatCurrency(c.outstanding_balance)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-center">
                      <StatusBadge status={c.status} size="sm" />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-xs text-stone-400">
                    No customers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </DashboardCard>

      {/* Customer Detail Drawer */}
      {selectedCustomer && (
        <DashboardCard
          title={selectedCustomer.name}
          subtitle={`${selectedCustomer.company || 'Individual'} · ${selectedCustomer.email}`}
          action={
            <button
              onClick={() => setSelectedCustomer(null)}
              className="text-xs text-stone-400 hover:text-stone-700"
            >
              Close Details ✕
            </button>
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-stone-50/70 border border-stone-100 rounded-xl">
              <span className="text-stone-400 block text-[10px] uppercase tracking-wide">Registered Address</span>
              <span className="text-stone-800 font-medium">{selectedCustomer.address || 'Not specified'}</span>
            </div>
            <div className="p-3 bg-stone-50/70 border border-stone-100 rounded-xl">
              <span className="text-stone-400 block text-[10px] uppercase tracking-wide">Tax ID (GSTIN)</span>
              <span className="font-mono text-stone-800 font-medium">{selectedCustomer.gst_number || 'Unregistered'}</span>
            </div>
            <div className="p-3 bg-stone-50/70 border border-stone-100 rounded-xl">
              <span className="text-stone-400 block text-[10px] uppercase tracking-wide">Customer Since</span>
              <span className="font-mono text-stone-800 font-medium">{formatDate(selectedCustomer.created_at)}</span>
            </div>
          </div>
        </DashboardCard>
      )}

      {/* Modal: Add Customer */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Register New Customer"
        subtitle="Customer record will be enabled for recurring subscriptions and automated invoicing"
        maxWidth="lg"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">Contact Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Rajesh Patel"
                className="w-full rounded-xl border border-stone-200 bg-white p-2 text-xs focus:border-stone-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">Company / Organization</label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Acme Technologies Ltd"
                className="w-full rounded-xl border border-stone-200 bg-white p-2 text-xs focus:border-stone-900 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">Corporate Email *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="billing@customer.com"
                className="w-full rounded-xl border border-stone-200 bg-white p-2 text-xs focus:border-stone-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full rounded-xl border border-stone-200 bg-white p-2 text-xs focus:border-stone-900 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">GSTIN / Tax ID</label>
            <input
              type="text"
              value={gstNumber}
              onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
              placeholder="29ABCDE1234F1Z5"
              className="w-full rounded-xl border border-stone-200 bg-white p-2 text-xs font-mono focus:border-stone-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">Billing & Delivery Address</label>
            <textarea
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Office street address, city, state, postal code…"
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
              Save Customer
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
