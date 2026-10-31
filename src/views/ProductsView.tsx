import React, { useState, useEffect } from 'react';
import type { Product } from '../types';
import { formatCurrency } from '../utils/formatters';
import { Modal } from '../components/Modal';
import DashboardCard from '../components/DashboardCard';
import { Package, Plus, XCircle, Tag, Layers, Edit } from 'lucide-react';

export const ProductsView: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [type, setType] = useState('SaaS');
  const [salesPrice, setSalesPrice] = useState<number | ''>('');
  const [costPrice, setCostPrice] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [variants, setVariants] = useState<{ variant_name: string; price_adjustment: number; sku?: string }[]>([]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const openCreateModal = () => {
    setEditingProduct(null);
    setName('');
    setType('SaaS');
    setSalesPrice('');
    setCostPrice('');
    setNotes('');
    setVariants([
      { variant_name: 'Standard brand', price_adjustment: 0, sku: 'STD' },
      { variant_name: 'Odoo brand', price_adjustment: 560, sku: 'ODOO' }
    ]);
    setShowModal(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setType(p.type);
    setSalesPrice(p.sales_price);
    setCostPrice(p.cost_price);
    setNotes(p.notes || '');
    setVariants(p.variants.map(v => ({
      variant_name: v.variant_name,
      price_adjustment: v.price_adjustment,
      sku: v.sku
    })));
    setShowModal(true);
  };

  const addVariantRow = () => {
    setVariants(prev => [...prev, { variant_name: '', price_adjustment: 0, sku: '' }]);
  };

  const removeVariantRow = (index: number) => {
    setVariants(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || salesPrice === '' || costPrice === '') return;

    const payload = {
      name,
      type,
      sales_price: Number(salesPrice),
      cost_price: Number(costPrice),
      notes,
      variants
    };

    try {
      const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
      const method = editingProduct ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setShowModal(false);
        fetchProducts();
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
          <p className="text-[11px] uppercase tracking-[0.12em] text-stone-400">Software catalog</p>
          <h1 className="mt-1 text-lg font-semibold tracking-tight sm:text-xl text-stone-900">
            Products & Variants
          </h1>
          <p className="mt-0.5 text-xs text-stone-500">
            {products.length} products · base pricing, cost margins & variant price adjustments
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex shrink-0 items-center gap-1.5 rounded-full bg-stone-900 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-stone-800 transition-colors shadow-2xs"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Product</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map(p => {
          const margin = p.sales_price - p.cost_price;
          const marginPercent = Math.round((margin / p.sales_price) * 100);

          return (
            <DashboardCard
              key={p.id}
              title={p.name}
              subtitle={p.type}
              action={
                <button
                  onClick={() => openEditModal(p)}
                  className="p-1 rounded-md text-stone-400 hover:text-stone-900 hover:bg-stone-100"
                  title="Edit Product"
                >
                  <Edit className="h-3.5 w-3.5" />
                </button>
              }
            >
              <div className="my-2 p-3 bg-stone-50/70 rounded-xl border border-stone-100 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-stone-400 block text-[10px] uppercase tracking-wide">Base Price</span>
                  <span className="font-mono font-medium text-stone-900 tabular-nums">{formatCurrency(p.sales_price)}</span>
                </div>
                <div>
                  <span className="text-stone-400 block text-[10px] uppercase tracking-wide">Cost (Margin)</span>
                  <span className="font-mono text-stone-600 tabular-nums">
                    {formatCurrency(p.cost_price)} ({marginPercent}%)
                  </span>
                </div>
              </div>

              {/* Variants List */}
              <div className="space-y-1.5 mt-3">
                <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-stone-400 block">Variants</span>
                {p.variants.length > 0 ? (
                  p.variants.map((v, i) => (
                    <div key={i} className="flex justify-between items-center text-xs py-1 px-2 rounded-lg bg-stone-50/40 border border-stone-100">
                      <span className="text-stone-800 font-medium">{v.variant_name}</span>
                      <div className="font-mono text-[11px] tabular-nums">
                        <span className="text-stone-900 font-medium">
                          {formatCurrency(p.sales_price + v.price_adjustment)}
                        </span>
                        {v.price_adjustment > 0 && (
                          <span className="text-stone-400 ml-1">(+₹{v.price_adjustment})</span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-stone-400 italic">No variants configured.</p>
                )}
              </div>

              <div className="mt-3 pt-2.5 border-t border-stone-100 text-[11px] text-stone-400">
                {p.notes || 'Standard billing catalog item'}
              </div>
            </DashboardCard>
          );
        })}
      </div>

      {/* Modal: Create/Edit Product */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingProduct ? 'Edit Product & Variants' : 'Add New Product'}
        subtitle="Specify product metadata, sales price, company cost, and pricing adjustments per variant"
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">Product Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. ERP Software"
                className="w-full rounded-xl border border-stone-200 bg-white p-2 text-xs focus:border-stone-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">Product Type / Category *</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full rounded-xl border border-stone-200 bg-white p-2 text-xs focus:border-stone-900 focus:outline-none"
              >
                <option value="SaaS">SaaS Platform</option>
                <option value="ERP">ERP System</option>
                <option value="Add-on">Add-on Module</option>
                <option value="Service">Professional Support</option>
                <option value="License">Software License</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">Base Sales Price (₹) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={salesPrice}
                onChange={(e) => setSalesPrice(Number(e.target.value))}
                placeholder="2000"
                className="w-full rounded-xl border border-stone-200 bg-white p-2 text-xs font-mono font-medium focus:border-stone-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">Cost Price (Company Cost ₹) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={costPrice}
                onChange={(e) => setCostPrice(Number(e.target.value))}
                placeholder="800"
                className="w-full rounded-xl border border-stone-200 bg-white p-2 text-xs font-mono focus:border-stone-900 focus:outline-none"
              />
            </div>
          </div>

          {/* Variants Builder */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-medium text-stone-800">
                Product Variants (e.g. Standard, Odoo brand +₹560)
              </label>
              <button
                type="button"
                onClick={addVariantRow}
                className="text-xs font-medium text-stone-800 hover:text-stone-950 underline underline-offset-2"
              >
                + Add Variant
              </button>
            </div>

            <div className="space-y-2 border border-stone-200/80 rounded-xl p-3 bg-stone-50/50">
              {variants.map((v, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs">
                  <input
                    type="text"
                    required
                    placeholder="Variant Name (e.g. Odoo brand)"
                    value={v.variant_name}
                    onChange={(e) => {
                      const val = e.target.value;
                      setVariants(prev => prev.map((it, i) => i === idx ? { ...it, variant_name: val } : it));
                    }}
                    className="flex-2 rounded-lg border border-stone-200 bg-white p-1.5 focus:border-stone-900 focus:outline-none"
                  />
                  <div className="flex-1 flex items-center gap-1">
                    <span className="text-stone-400 text-xs">+₹</span>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Price Delta (560)"
                      value={v.price_adjustment}
                      onChange={(e) => {
                        const delta = Number(e.target.value);
                        setVariants(prev => prev.map((it, i) => i === idx ? { ...it, price_adjustment: delta } : it));
                      }}
                      className="w-full rounded-lg border border-stone-200 bg-white p-1.5 font-mono focus:border-stone-900 focus:outline-none"
                    />
                  </div>
                  <span className="w-24 text-right font-mono text-stone-900 font-medium tabular-nums">
                    = {formatCurrency(Number(salesPrice || 0) + Number(v.price_adjustment || 0))}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeVariantRow(idx)}
                    className="text-stone-400 hover:text-rose-600 p-1"
                  >
                    <XCircle className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">Notes / Description</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Internal product notes…"
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
              Save Product
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
