import React from 'react';
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

import { Header } from '@/components/header';
import { HeroSection } from '@/components/hero';
import { LogosSection } from '@/components/logos-section';
import { PricingSection } from '@/components/pricing-section';

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

  const handleDemoLogin = (email: string) => {
    if (onQuickLogin) {
      onQuickLogin(email);
    } else {
      onOpenAuth('signin');
    }
  };

  return (
    <div id="top" className="landing-dark dark min-h-screen bg-background font-sans text-foreground selection:bg-primary/10 selection:text-foreground">
      <Header
        onEnterApp={onEnterApp}
        onOpenAuth={onOpenAuth}
        isLoggedIn={isLoggedIn}
        onOpenHome={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      />
      <main>
        <HeroSection onEnterApp={onEnterApp} onOpenAuth={onOpenAuth} isLoggedIn={isLoggedIn} />
        <LogosSection />

      {/* 1-CLICK PERSONA EVALUATION SECTION */}
      <section id="demo" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-background border-y border-border">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-100 text-violet-800 text-xs font-semibold mb-3">
            <Flame className="h-3.5 w-3.5 text-violet-600" />
            <span>Interactive Multi-Role Test</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            See billing from every perspective
          </h2>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
            Explore Brightloop through the roles that use it every day. Choose a demo account to see its workspace.
          </p>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-5 text-left">
            {/* Persona 1: Admin */}
            <div className="p-6 rounded-sm bg-card border border-indigo-100 shadow-sm hover:shadow-sm hover:border-indigo-300 transition-all flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="h-12 w-12 rounded-sm bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-sm shadow-orange-500/20">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    Full Control
                  </span>
                </div>
                <h3 className="text-base font-bold text-foreground group-hover:text-indigo-600 transition">
                  👑 Sarah Connor (Admin)
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">admin@brightloop.com</p>
                <ul className="mt-4 space-y-2 text-xs text-muted-foreground">
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
                className="mt-6 w-full rounded-sm bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white py-2.5 text-xs font-bold shadow-sm shadow-orange-600/20 transition flex items-center justify-center gap-1.5"
              >
                <span>Login as Admin</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Persona 2: Staff */}
            <div className="p-6 rounded-sm bg-card border border-indigo-100 shadow-sm hover:shadow-sm hover:border-indigo-300 transition-all flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="h-12 w-12 rounded-sm bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
                    <Users className="h-6 w-6" />
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                    Operations
                  </span>
                </div>
                <h3 className="text-base font-bold text-foreground group-hover:text-indigo-600 transition">
                  👔 Alex Morgan (Staff)
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">staff@brightloop.com</p>
                <ul className="mt-4 space-y-2 text-xs text-muted-foreground">
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
                className="mt-6 w-full rounded-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-2.5 text-xs font-bold shadow-sm shadow-blue-600/20 transition flex items-center justify-center gap-1.5"
              >
                <span>Login as Staff</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Persona 3: Customer */}
            <div className="p-6 rounded-sm bg-card border border-indigo-100 shadow-sm hover:shadow-sm hover:border-indigo-300 transition-all flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="h-12 w-12 rounded-sm bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-sm shadow-emerald-500/20">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Client Portal
                  </span>
                </div>
                <h3 className="text-base font-bold text-foreground group-hover:text-indigo-600 transition">
                  👤 Rajesh Patel (Customer)
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">customer@acme.com · Acme Tech</p>
                <ul className="mt-4 space-y-2 text-xs text-muted-foreground">
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
                className="mt-6 w-full rounded-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-2.5 text-xs font-bold shadow-sm shadow-emerald-600/20 transition flex items-center justify-center gap-1.5"
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
            Built for the full billing lifecycle
          </span>
          <h2 className="mt-3 text-3xl sm:text-5xl font-extrabold text-foreground tracking-tight">
            One workspace for every billing cycle
          </h2>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
            Bring subscriptions, invoicing, tax rules, and collections into one dependable workflow.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Automated recurring invoices */}
          <div className="p-6 rounded-sm bg-card border border-border shadow-sm hover:shadow-sm hover:border-violet-300 transition-all">
            <div className="h-11 w-11 rounded-sm border border-border bg-muted text-primary flex items-center justify-center mb-4">
              <Repeat className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-foreground">Automated recurring invoices</h3>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              Generate invoices on each billing date, with built-in duplicate protection.
            </p>
          </div>

          {/* 2. Products & Variant Pricing */}
          <div className="p-6 rounded-sm bg-card border border-border shadow-sm hover:shadow-sm hover:border-blue-300 transition-all">
            <div className="h-11 w-11 rounded-sm border border-border bg-muted text-primary flex items-center justify-center mb-4">
              <Layers className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-foreground">Flexible products &amp; variants</h3>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              Set base pricing, costs, and variant adjustments. Prices update as options change.
            </p>
          </div>

          {/* 3. Quotation Templates */}
          <div className="p-6 rounded-sm bg-card border border-border shadow-sm hover:shadow-sm hover:border-emerald-300 transition-all">
            <div className="h-11 w-11 rounded-sm border border-border bg-muted text-primary flex items-center justify-center mb-4">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-foreground">Reusable quotation templates</h3>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              Create reusable offers and convert accepted quotations directly into subscriptions.
            </p>
          </div>

          {/* 4. Automated Taxes (GST) */}
          <div className="p-6 rounded-sm bg-card border border-border shadow-sm hover:shadow-sm hover:border-amber-300 transition-all">
            <div className="h-11 w-11 rounded-sm border border-border bg-muted text-primary flex items-center justify-center mb-4">
              <Receipt className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-foreground">GST calculation</h3>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              Apply configured tax rates and show GST clearly on every invoice.
            </p>
          </div>

          {/* 5. Discount Rules & Quotas */}
          <div className="p-6 rounded-sm bg-card border border-border shadow-sm hover:shadow-sm hover:border-rose-300 transition-all">
            <div className="h-11 w-11 rounded-sm border border-border bg-muted text-primary flex items-center justify-center mb-4">
              <Percent className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-foreground">Discounts and quotas</h3>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              Apply fixed or percentage discounts with quantity, order minimum, and validity rules.
            </p>
          </div>

          {/* 6. Payment Settlements */}
          <div className="p-6 rounded-sm bg-card border border-border shadow-sm hover:shadow-sm hover:border-purple-300 transition-all">
            <div className="h-11 w-11 rounded-sm border border-border bg-muted text-primary flex items-center justify-center mb-4">
              <CreditCard className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-foreground">Payments and overdue tracking</h3>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              Record UPI, bank, card, or cheque payments and keep overdue items visible.
            </p>
          </div>

          {/* 7. Strict RBAC & Authentication */}
          <div className="p-6 rounded-sm bg-card border border-border shadow-sm hover:shadow-sm hover:border-indigo-300 transition-all">
            <div className="h-11 w-11 rounded-sm border border-border bg-muted text-primary flex items-center justify-center mb-4">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-foreground">Role-based access controls</h3>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              Password policy compliance (&gt;8 chars, uppercase, lowercase, special char), email reset tokens, unique email constraint, and staff invitations limited to Admin.
            </p>
          </div>

          {/* Customer self-service */}
          <div className="p-6 rounded-sm bg-card border border-border shadow-sm hover:shadow-sm hover:border-teal-300 transition-all">
            <div className="h-11 w-11 rounded-sm border border-border bg-muted text-primary flex items-center justify-center mb-4">
              <Building2 className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-foreground">Customer self-service</h3>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              Give customers one place to view renewals, billing history, and GST invoices.
            </p>
          </div>

          {/* 9. Real-time Finance Dashboard */}
          <div className="p-6 rounded-sm bg-card border border-border shadow-sm hover:shadow-sm hover:border-amber-300 transition-all">
            <div className="h-11 w-11 rounded-sm border border-border bg-muted text-primary flex items-center justify-center mb-4">
              <BarChart3 className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-foreground">Revenue analytics</h3>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              Track active plans, collected revenue, open balances, and overdue invoices together.
            </p>
          </div>
        </div>
      </section>

      <PricingSection onSelectPlan={isLoggedIn ? onEnterApp : () => onOpenAuth('signup')} />

      {/* ======================================================== */}
      {/* PERFORMANCE SNAPSHOT */}
      {/* ======================================================== */}
      <section id="performance" className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="p-8 sm:p-10 rounded-sm bg-card border border-border text-foreground shadow-sm relative overflow-hidden">
          

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
            <div className="max-w-xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted text-primary text-xs font-semibold border border-border">
                <Zap className="h-3.5 w-3.5" />
                Performance snapshot
              </span>
              <h2 className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight">
                Fast responses, even at scale
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Built around indexed queries and cached calculations, this demo returns a current query result in around <strong>11.8 ms</strong>.
              </p>
            </div>

            <div className="p-5 rounded-sm bg-muted border border-border text-center shrink-0">
              <span className="text-[11px] font-mono uppercase text-muted-foreground block">Current query snapshot</span>
              <span className="text-4xl font-extrabold font-mono text-primary block my-1">
                11.8 ms
              </span>
              <span className="text-[10px] text-muted-foreground block">Target: under 2 seconds</span>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* BOTTOM CALL TO ACTION */}
      {/* ======================================================== */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 text-center bg-muted/30">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            Simplify your subscription billing
          </h2>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground">
            Explore the demo, or create an account to get started.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={isLoggedIn ? onEnterApp : () => onOpenAuth('signup')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-3.5 text-sm font-bold shadow-sm shadow-indigo-500/25 transition transform hover:-translate-y-0.5"
            >
              <span>{isLoggedIn ? 'Enter Dashboard' : 'Create Free Account'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => handleDemoLogin('admin@brightloop.com')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card hover:bg-muted text-slate-800 px-6 py-3.5 text-sm font-semibold shadow-xs transition"
            >
              <span>Launch Admin Evaluation</span>
            </button>
          </div>
        </div>
      </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-10 px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity text-left"
            title="Return to Home Screen"
          >
            <div className="h-6 w-6 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
              BL
            </div>
            <span className="font-semibold text-slate-800 dark:text-slate-200">Brightloop Software SMS</span>
            <span className="text-slate-400">· Subscription &amp; Recurring Invoicing Platform</span>
          </button>

          <div className="flex items-center gap-6">
            <span>Subscription billing for growing teams</span>
            <span>Invoices, payments, renewals</span>
            <span className="text-emerald-700 font-medium">GST-ready billing</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPageView;
