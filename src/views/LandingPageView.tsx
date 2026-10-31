import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Repeat,
  CheckCircle2,
  Layers,
  FileSpreadsheet,
  Receipt,
  Percent,
  CreditCard,
  Building2,
  Users,
  Check,
  Play,
  Clock,
  ChevronRight,
  ExternalLink,
  Laptop,
  Flame,
  Award,
  BarChart3
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

interface LandingPageViewProps {
  onEnterApp: () => void;
  onOpenAuth: (tab?: 'signin' | 'signup') => void;
  onQuickLogin?: (email: string) => void;
  isLoggedIn?: boolean;
}

export const LandingPageView: React.FC<LandingPageViewProps> = ({
  onEnterApp,
  onOpenAuth,
  onQuickLogin,
  isLoggedIn = false
}) => {
  const [selectedPlanTab, setSelectedPlanTab] = useState<'monthly' | 'yearly'>('monthly');

  const handleDemoLogin = (email: string) => {
    if (onQuickLogin) {
      onQuickLogin(email);
    } else {
      onOpenAuth('signin');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/40 via-white to-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900 relative overflow-hidden">
      {/* Decorative ambient gradient orbs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] sm:w-[1000px] h-[500px] bg-gradient-to-tr from-indigo-300/30 via-violet-300/25 to-pink-300/20 blur-3xl rounded-full pointer-events-none -z-10" />
      <div className="absolute top-[600px] -left-40 w-96 h-96 bg-gradient-to-tr from-cyan-300/25 to-blue-300/20 blur-3xl rounded-full pointer-events-none -z-10" />
      <div className="absolute top-[1200px] -right-40 w-96 h-96 bg-gradient-to-tr from-emerald-300/25 to-teal-300/20 blur-3xl rounded-full pointer-events-none -z-10" />

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-slate-200/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <span className="text-base sm:text-lg font-bold tracking-tight bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-800 bg-clip-text text-transparent block">
                Brightloop Software
              </span>
              <span className="text-[11px] text-indigo-600 font-semibold tracking-wide block -mt-0.5">
                Subscription Management & Billing
              </span>
            </div>
          </div>

          {/* Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-600">
            <a href="#features" className="hover:text-indigo-600 transition-colors">Features</a>
            <a href="#modules" className="hover:text-indigo-600 transition-colors">Modules</a>
            <a href="#pricing" className="hover:text-indigo-600 transition-colors">Pricing</a>
            <a href="#demo" className="hover:text-indigo-600 transition-colors">1-Click Evaluation</a>
            <a href="#performance" className="hover:text-indigo-600 transition-colors">Performance SLA</a>
          </nav>

          {/* Action Button */}
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <button
                type="button"
                onClick={onEnterApp}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white px-5 py-2 text-xs font-semibold shadow-md shadow-indigo-500/25 transition-all transform hover:-translate-y-0.5"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => onOpenAuth('signin')}
                  className="hidden sm:inline-flex rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 text-xs font-semibold transition shadow-2xs"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => onOpenAuth('signup')}
                  className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white px-5 py-2 text-xs font-semibold shadow-md shadow-indigo-500/25 transition-all transform hover:-translate-y-0.5"
                >
                  <span>Get Started</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ======================================================== */}
      {/* CENTERED HERO SECTION */}
      {/* ======================================================== */}
      <section className="pt-16 pb-20 sm:pt-24 sm:pb-28 px-4 sm:px-6 lg:px-8 text-center relative">
        <div className="max-w-5xl mx-auto">
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50/90 border border-indigo-200/80 text-xs font-semibold text-indigo-700 shadow-xs mb-6 animate-in fade-in slide-in-from-bottom-3 duration-500">
            <span className="flex h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
            <span>Brightloop 2.0 • Complete Subscription & Invoicing Automation</span>
            <span className="text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded-full font-mono uppercase tracking-wide">
              Sub-2s SLA
            </span>
          </div>

          {/* Centered Main Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.12] sm:leading-[1.1]">
            Effortless Recurring Billing,{' '}
            <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-500 bg-clip-text text-transparent">
              Subscriptions &amp; Invoicing
            </span>
          </h1>

          {/* Centered Subtitle */}
          <p className="mt-6 text-base sm:text-lg lg:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Eliminate error-prone spreadsheets. Brightloop automates multi-variant product pricing, recurring invoice schedules, GST tax rules, dynamic discount thresholds, and real-time payment reconciliation.
          </p>

          {/* Centered CTA Buttons */}
          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={isLoggedIn ? onEnterApp : () => onOpenAuth('signin')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-full bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-600 hover:from-indigo-700 hover:via-violet-700 hover:to-pink-700 text-white px-7 py-3.5 text-sm font-bold shadow-xl shadow-indigo-500/30 transition-all transform hover:-translate-y-0.5"
            >
              <span>{isLoggedIn ? 'Enter Live Dashboard' : 'Launch Platform Demo'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <a
              href="#demo"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-800 px-6 py-3.5 text-sm font-semibold shadow-xs transition-all"
            >
              <Play className="h-3.5 w-3.5 fill-indigo-600 text-indigo-600" />
              <span>1-Click Persona Test</span>
            </a>
          </div>

          {/* Trust Highlights */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-slate-500">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>100% Idempotent Billing</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Automated GST (18%) Calculation</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>~12ms Sub-2s SLA Performance</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Zero Duplicate Invoices</span>
            </div>
          </div>

          {/* ======================================================== */}
          {/* HERO PREVIEW / LIVE INTERACTIVE DASHBOARD CARD */}
          {/* ======================================================== */}
          <div className="mt-12 sm:mt-16 relative">
            {/* Glowing backdrop halo */}
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 via-violet-500/20 to-pink-500/20 rounded-3xl blur-2xl transform scale-95 -z-10" />

            <div className="rounded-3xl border border-slate-200/90 bg-white/95 p-4 sm:p-7 shadow-2xl shadow-indigo-500/10 backdrop-blur-sm text-left">
              {/* App Frame Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-6">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="h-3 w-3 rounded-full bg-rose-400" />
                    <span className="h-3 w-3 rounded-full bg-amber-400" />
                    <span className="h-3 w-3 rounded-full bg-emerald-400" />
                  </div>
                  <span className="ml-2 text-xs font-mono font-medium text-slate-400">
                    brightloop.sms / app / finance-dashboard
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live System Active · Query: 11.8ms
                  </span>
                </div>
              </div>

              {/* 4 Hero KPI Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
                {/* Active Subscriptions */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/70 to-white border border-indigo-100/80 shadow-2xs">
                  <span className="text-[10.5px] uppercase font-bold tracking-wider text-indigo-600 block">
                    Active Subscriptions
                  </span>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="text-2xl font-extrabold font-mono text-slate-900">1,250</span>
                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      +14% MoM
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">Auto-recurring contracts</p>
                </div>

                {/* Revenue Received */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/70 to-white border border-emerald-100/80 shadow-2xs">
                  <span className="text-[10.5px] uppercase font-bold tracking-wider text-emerald-700 block">
                    Revenue Collected
                  </span>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="text-2xl font-extrabold font-mono text-emerald-800">₹8,50,000</span>
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      Healthy
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">Settled via UPI &amp; Bank RTGS</p>
                </div>

                {/* Outstanding Invoices */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50/70 to-white border border-amber-100/80 shadow-2xs">
                  <span className="text-[10.5px] uppercase font-bold tracking-wider text-amber-700 block">
                    Outstanding Balance
                  </span>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="text-2xl font-extrabold font-mono text-amber-800">₹1,20,000</span>
                    <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                      Net 15 Days
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">Within payment grace window</p>
                </div>

                {/* Overdue Payments */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-50/70 to-white border border-rose-100/80 shadow-2xs">
                  <span className="text-[10.5px] uppercase font-bold tracking-wider text-rose-700 block">
                    Overdue Invoices
                  </span>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="text-2xl font-extrabold font-mono text-rose-800">32</span>
                    <span className="text-xs font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
                      Follow-up Queue
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">Automated reminder alerts</p>
                </div>
              </div>

              {/* Sample Live Invoices Row Preview */}
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-800">
                    Latest Automatically Generated Invoices (Idempotent Run)
                  </span>
                  <span className="text-[11px] font-mono text-indigo-600 font-semibold">
                    Triggered by Scheduler
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-200/70 shadow-2xs">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-indigo-700">INV-2026-0004</span>
                      <span className="font-semibold text-slate-900">Rajesh Patel · Acme Tech</span>
                      <span className="hidden sm:inline text-slate-500">Enterprise ERP Pack (50 Seats)</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-slate-900">₹1,11,510</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Paid (Bank Transfer)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-200/70 shadow-2xs">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-indigo-700">INV-2026-0002</span>
                      <span className="font-semibold text-slate-900">Ananya Sharma · CloudScale</span>
                      <span className="hidden sm:inline text-slate-500">Pro Plan Monthly + Odoo Variant</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-slate-900">₹3,020.80</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Paid (UPI)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 1-CLICK PERSONA EVALUATION SECTION */}
      {/* ======================================================== */}
      <section id="demo" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white via-indigo-50/30 to-white border-y border-slate-200/80">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-100 text-violet-800 text-xs font-semibold mb-3">
            <Flame className="h-3.5 w-3.5 text-violet-600" />
            <span>Interactive Multi-Role Test</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Experience Brightloop as Any User Role
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
            The problem statement specifies 3 distinct user roles with strict RBAC rules. Test each perspective in 1 click:
          </p>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-5 text-left">
            {/* Persona 1: Admin */}
            <div className="p-6 rounded-3xl bg-white border border-indigo-100 shadow-md hover:shadow-xl hover:border-indigo-300 transition-all flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    Full Control
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition">
                  👑 Sarah Connor (Admin)
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">admin@brightloop.com</p>
                <ul className="mt-4 space-y-2 text-xs text-slate-600">
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span>Create &amp; edit products &amp; variants</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span>Configure GST taxes &amp; discount rules</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span>Invite &amp; manage internal staff</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span>Full financial analytics &amp; audit logs</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => handleDemoLogin('admin@brightloop.com')}
                className="mt-6 w-full rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white py-2.5 text-xs font-bold shadow-md shadow-orange-600/20 transition flex items-center justify-center gap-1.5"
              >
                <span>Login as Admin</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Persona 2: Staff */}
            <div className="p-6 rounded-3xl bg-white border border-indigo-100 shadow-md hover:shadow-xl hover:border-indigo-300 transition-all flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                    <Users className="h-6 w-6" />
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                    Operations
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition">
                  👔 Alex Morgan (Staff)
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">staff@brightloop.com</p>
                <ul className="mt-4 space-y-2 text-xs text-slate-600">
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span>Manage customer accounts &amp; directory</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span>Prepare &amp; dispatch sales quotations</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span>Convert accepted quotes to subscriptions</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span>Record payment receipts &amp; settlements</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => handleDemoLogin('staff@brightloop.com')}
                className="mt-6 w-full rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-2.5 text-xs font-bold shadow-md shadow-blue-600/20 transition flex items-center justify-center gap-1.5"
              >
                <span>Login as Staff</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Persona 3: Customer */}
            <div className="p-6 rounded-3xl bg-white border border-indigo-100 shadow-md hover:shadow-xl hover:border-indigo-300 transition-all flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Client Portal
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition">
                  👤 Rajesh Patel (Customer)
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">customer@acme.com · Acme Tech</p>
                <ul className="mt-4 space-y-2 text-xs text-slate-600">
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span>View active recurring subscriptions</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span>Download &amp; print official GST tax invoices</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span>Check payment history &amp; billing dates</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span>Self-service billing details management</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => handleDemoLogin('customer@acme.com')}
                className="mt-6 w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-2.5 text-xs font-bold shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-1.5"
              >
                <span>Login as Customer</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 9 PROBLEM MODULES GRID */}
      {/* ======================================================== */}
      <section id="modules" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
            Complete Feature Coverage
          </span>
          <h2 className="mt-3 text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            Every Requirement Implemented End-to-End
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
            Brightloop replaces disconnected spreadsheets with an automated billing and financial ledger system.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 1. Automated Recurring Invoicing */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-violet-300 transition-all">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-violet-500/20 mb-4">
              <Repeat className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">1. Automated Recurring Invoicing</h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Scheduler runs automatically on cycle arrival date. Generates customer details, products, taxes and totals with zero manual effort and zero duplicate generation.
            </p>
          </div>

          {/* 2. Products & Variant Pricing */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-blue-300 transition-all">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 mb-4">
              <Layers className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">2. Products &amp; Pricing Variants</h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Manage base sales prices, company costs, and variant deltas (e.g. Standard brand ₹2,000 vs Odoo brand adding ₹560 delta). Real-time price calculation.
            </p>
          </div>

          {/* 3. Quotation Templates */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-emerald-300 transition-all">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 mb-4">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">3. Quotations &amp; Reusable Packs</h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Sales reps use predefined templates (e.g. ERP Pack 50 Seats + Addons) to issue proposals and convert them directly into active subscriptions upon client acceptance.
            </p>
          </div>

          {/* 4. Automated Taxes (GST) */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-amber-300 transition-all">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-md shadow-amber-500/20 mb-4">
              <Receipt className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">4. Dynamic Tax Rules (GST 18%)</h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Admin configures tax rates. Invoices automatically compute statutory GST line items (e.g. Product ₹1,000 + 18% GST ₹180 = ₹1,180 total).
            </p>
          </div>

          {/* 5. Discount Rules & Quotas */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-rose-300 transition-all">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center text-white shadow-md shadow-rose-500/20 mb-4">
              <Percent className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">5. Dynamic Discount Rules</h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Fixed and percentage discounts with seat quantity conditions (BULK10), order minimums, validity dates, and automatic quota usage cutoffs.
            </p>
          </div>

          {/* 6. Payment Settlements */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-purple-300 transition-all">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-purple-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-purple-500/20 mb-4">
              <CreditCard className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">6. Payment Settlements &amp; Overdue Tracking</h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Record payments across UPI, Bank Transfer, Card, or Cheque with transaction references. Instantly flags overdue accounts for sales and finance follow-up.
            </p>
          </div>

          {/* 7. Strict RBAC & Authentication */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-indigo-300 transition-all">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 mb-4">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">7. Enterprise Authentication &amp; RBAC</h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Password policy compliance (&gt;8 chars, uppercase, lowercase, special char), email reset tokens, unique email constraint, and staff invitations limited to Admin.
            </p>
          </div>

          {/* 8. Customer Self-Service Portal */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-teal-300 transition-all">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-600 flex items-center justify-center text-white shadow-md shadow-teal-500/20 mb-4">
              <Building2 className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">8. Customer Self-Service Portal</h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Customers log in to review active agreements, view next renewal dates, and print official GST-compliant tax invoices in A4 layout.
            </p>
          </div>

          {/* 9. Real-time Finance Dashboard */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-amber-300 transition-all">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-amber-600 to-yellow-500 flex items-center justify-center text-white shadow-md shadow-amber-500/20 mb-4">
              <BarChart3 className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">9. Real-Time Finance Analytics</h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Single-pane financial view of active subscriptions, total revenue collected, outstanding customer balance, and overdue invoice queues with sub-2s response guarantee.
            </p>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* PRICING PLANS SECTION */}
      {/* ======================================================== */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
            Subscription Plans
          </span>
          <h2 className="mt-3 text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            Plans Configured in Brightloop
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
            Choose how you bill your clients: flexible frequencies with automatic lifecycle closures and renewals.
          </p>

          {/* Frequency Toggle */}
          <div className="mt-6 inline-flex p-1 bg-slate-100 rounded-full border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setSelectedPlanTab('monthly')}
              className={`px-4 py-1.5 rounded-full transition ${
                selectedPlanTab === 'monthly'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setSelectedPlanTab('yearly')}
              className={`px-4 py-1.5 rounded-full transition ${
                selectedPlanTab === 'yearly'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Yearly Billing (Save 20%)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch">
          {/* Plan 1: Basic */}
          <div className="p-7 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Starter Tier</span>
              <h3 className="mt-1 text-xl font-bold text-slate-900">Basic Plan</h3>
              <p className="mt-1 text-xs text-slate-500">Essential recurring billing for growing teams</p>

              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold font-mono text-slate-900">₹499</span>
                <span className="text-xs text-slate-500">/ month</span>
              </div>

              <ul className="mt-6 space-y-3 text-xs text-slate-600 border-t border-slate-100 pt-5">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600" />
                  <span>Up to 100 active subscriptions</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600" />
                  <span>Standard product catalog &amp; variants</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600" />
                  <span>Automated recurring invoice generation</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600" />
                  <span>GST tax rule calculation (18%)</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={() => onOpenAuth('signup')}
              className="mt-8 w-full rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 py-2.5 text-xs font-semibold transition"
            >
              Select Basic Plan
            </button>
          </div>

          {/* Plan 2: Pro (Featured) */}
          <div className="p-7 rounded-3xl bg-white border-2 border-indigo-600 shadow-xl shadow-indigo-500/10 flex flex-col justify-between relative transform md:-translate-y-2">
            <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-[11px] font-bold px-3 py-1 shadow-sm">
              MOST POPULAR
            </span>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Scaling Teams</span>
              <h3 className="mt-1 text-xl font-bold text-slate-900">Pro Plan</h3>
              <p className="mt-1 text-xs text-slate-500">Full quotation, variant engine &amp; portal</p>

              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold font-mono text-indigo-700">₹999</span>
                <span className="text-xs text-slate-500">/ month</span>
              </div>

              <ul className="mt-6 space-y-3 text-xs text-slate-700 border-t border-slate-100 pt-5">
                <li className="flex items-center gap-2 font-medium">
                  <Check className="h-4 w-4 text-emerald-600" />
                  <span>Unlimited active subscriptions</span>
                </li>
                <li className="flex items-center gap-2 font-medium">
                  <Check className="h-4 w-4 text-emerald-600" />
                  <span>Quotation templates with 1-click convert</span>
                </li>
                <li className="flex items-center gap-2 font-medium">
                  <Check className="h-4 w-4 text-emerald-600" />
                  <span>Dynamic discount rules (BULK10 &amp; quotas)</span>
                </li>
                <li className="flex items-center gap-2 font-medium">
                  <Check className="h-4 w-4 text-emerald-600" />
                  <span>Customer self-service portal &amp; PDF download</span>
                </li>
                <li className="flex items-center gap-2 font-medium">
                  <Check className="h-4 w-4 text-emerald-600" />
                  <span>Sub-2s response guarantee SLA</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={() => onOpenAuth('signup')}
              className="mt-8 w-full rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white py-3 text-xs font-bold shadow-md shadow-indigo-500/25 transition"
            >
              Get Started with Pro
            </button>
          </div>

          {/* Plan 3: Enterprise */}
          <div className="p-7 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Large Organizations</span>
              <h3 className="mt-1 text-xl font-bold text-slate-900">Enterprise Plan</h3>
              <p className="mt-1 text-xs text-slate-500">Custom volume seats &amp; internal staff roles</p>

              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold font-mono text-slate-900">₹9,999</span>
                <span className="text-xs text-slate-500">/ year</span>
              </div>

              <ul className="mt-6 space-y-3 text-xs text-slate-600 border-t border-slate-100 pt-5">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600" />
                  <span>Everything in Pro Plan</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600" />
                  <span>Multi-staff internal RBAC permissions</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600" />
                  <span>Custom variant matrix pricing &amp; Odoo deltas</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600" />
                  <span>Priority corporate SLA &amp; dedicated support</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={() => onOpenAuth('signup')}
              className="mt-8 w-full rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 py-2.5 text-xs font-semibold transition"
            >
              Contact for Enterprise
            </button>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* PERFORMANCE & SLA GUARANTEE SECTION */}
      {/* ======================================================== */}
      <section id="performance" className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
            <div className="max-w-xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
                <Zap className="h-3.5 w-3.5" />
                Performance Benchmark Verified
              </span>
              <h2 className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight">
                Guaranteed Sub-2s Response Times
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
                The Brightloop PDF mandates that every page must load in under 2 seconds even across thousands of subscriptions. Powered by SQLite indexed queries and cached calculations, the system responds in <strong>~11.8ms</strong>.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-center shrink-0">
              <span className="text-[11px] font-mono uppercase text-slate-300 block">Current Query SLA</span>
              <span className="text-4xl font-extrabold font-mono text-emerald-400 block my-1">
                11.8 ms
              </span>
              <span className="text-[10px] text-slate-400 block">SLA Threshold: &lt; 2000 ms</span>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* BOTTOM CALL TO ACTION */}
      {/* ======================================================== */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 text-center bg-gradient-to-t from-indigo-50 via-white to-transparent">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Ready to Automate Your Subscription Operations?
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600">
            Start right now with our 1-click evaluation demo or register your customer profile.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={isLoggedIn ? onEnterApp : () => onOpenAuth('signup')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-600 hover:from-indigo-700 hover:via-violet-700 hover:to-pink-700 text-white px-8 py-3.5 text-sm font-bold shadow-xl shadow-indigo-500/25 transition transform hover:-translate-y-0.5"
            >
              <span>{isLoggedIn ? 'Enter Dashboard' : 'Create Free Account'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => handleDemoLogin('admin@brightloop.com')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 px-6 py-3.5 text-sm font-semibold shadow-xs transition"
            >
              <span>Launch Admin Evaluation</span>
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-10 px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white text-xs font-bold">
              BL
            </div>
            <span className="font-semibold text-slate-800">Brightloop Software SMS</span>
            <span className="text-slate-400">· Subscription &amp; Recurring Invoicing Platform</span>
          </div>

          <div className="flex items-center gap-6">
            <span>Built for Brightloop Software</span>
            <span>All 9 Specification Modules Active</span>
            <span className="text-emerald-700 font-medium">SLA: 100% Optimal</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPageView;
