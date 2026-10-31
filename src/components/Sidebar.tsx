import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Repeat,
  FileSpreadsheet,
  FileText,
  CreditCard,
  Package,
  Layers,
  Percent,
  Receipt,
  Users,
  UserCheck,
  CalendarClock,
  Building2,
  FolderOpen,
  LogOut,
  X,
  Play
} from 'lucide-react';
import { cn } from '../utils/cn';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  overdueCount?: number;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  overdueCount = 0,
  mobileOpen = false,
  onCloseMobile
}) => {
  const { user, logout } = useAuth();
  const isCustomer = user?.role === 'customer';
  const isAdmin = user?.role === 'admin';

  const customerNav = [
    { tab: 'customer-portal', label: 'My Subscriptions', icon: Building2 },
    { tab: 'invoices', label: 'My Invoices & Tax Receipts', icon: FileText },
    { tab: 'payments', label: 'Payment History', icon: CreditCard },
  ];

  const adminNav = [
    { tab: 'dashboard', label: 'Dashboard & Reports', icon: LayoutDashboard },
    { tab: 'subscriptions', label: 'Subscriptions', icon: Repeat },
    { tab: 'quotations', label: 'Quotations', icon: FileSpreadsheet },
    { tab: 'quotation-templates', label: 'Quotation Templates', icon: FolderOpen },
    { tab: 'invoices', label: 'Invoices', icon: FileText, badge: overdueCount > 0 ? `${overdueCount} due` : undefined },
    { tab: 'payments', label: 'Payments', icon: CreditCard },
    { tab: 'scheduler', label: 'Recurring Scheduler', icon: CalendarClock },
    { tab: 'products', label: 'Products & Variants', icon: Package },
    { tab: 'plans', label: 'Plans & Frequency', icon: Layers },
    { tab: 'discounts', label: 'Discount Rules', icon: Percent },
    { tab: 'taxes', label: 'Tax Rules (GST/VAT)', icon: Receipt },
    { tab: 'customers', label: 'Customers', icon: Users },
    ...(isAdmin ? [{ tab: 'staff', label: 'Internal Staff', icon: UserCheck }] : []),
  ];

  const navList = isCustomer ? customerNav : adminNav;

  const renderNavContent = () => (
    <>
      <nav className="rounded-2xl border border-stone-200/70 bg-white p-2 shadow-2xs" aria-label="Primary">
        {navList.map((item) => {
          const isActive = currentTab === item.tab;
          const Icon = item.icon;

          return (
            <button
              key={item.tab}
              type="button"
              onClick={() => {
                setCurrentTab(item.tab);
                onCloseMobile?.();
              }}
              className={cn(
                'flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs transition cursor-pointer',
                isActive
                  ? 'bg-stone-900 text-white font-medium'
                  : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
              )}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-white' : 'text-stone-400')} />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={cn(
                    'shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                    isActive ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-700'
                  )}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Live Engine Status Tile (nwis-style active widget) */}
      {!isCustomer && (
        <div
          onClick={() => {
            setCurrentTab('scheduler');
            onCloseMobile?.();
          }}
          className="mt-3 w-full rounded-2xl border border-stone-200/70 bg-white p-4 text-left hover:border-stone-300 transition shadow-2xs cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] uppercase tracking-wide text-stone-400">
              Recurring Engine · Active
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="mt-1 text-[13px] font-semibold tabular-nums text-stone-900">
            Automated Daily Cycle
          </div>
          <div className="mt-0.5 text-[11px] tabular-nums text-stone-500">
            Idempotency 100% · Sub-2s SLA
          </div>
          <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-stone-100">
            <div className="h-full rounded-full bg-stone-900 transition-all" style={{ width: '92%' }} />
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] tabular-nums text-stone-500">
            <span className="text-stone-400">Next: Nov 1, 2026</span>
            <span className="font-semibold text-stone-900 group-hover:text-stone-700 inline-flex items-center gap-1">
              Simulate <Play className="h-2.5 w-2.5 fill-current" />
            </span>
          </div>
        </div>
      )}

      {/* Sign Out Card */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          logout();
        }}
        className="mt-3 w-full flex items-center justify-center gap-2 py-2 px-3 rounded-2xl border border-stone-200/80 bg-white text-xs font-semibold text-stone-700 hover:text-stone-900 hover:bg-stone-50 transition shadow-2xs cursor-pointer"
      >
        <LogOut className="h-3.5 w-3.5 text-stone-400" />
        <span>Sign Out</span>
      </button>

      <p className="mt-3 px-1 text-[10.5px] leading-4 text-stone-400">
        Brightloop SMS · Desktop v2.6 · {isCustomer ? 'Customer Portal' : 'Admin & Staff Platform'}
      </p>
    </>
  );

  return (
    <>
      {/* Desktop Sticky Aside */}
      <aside className="sticky top-[72px] hidden max-h-[calc(100vh-88px)] w-56 shrink-0 overflow-y-auto lg:block xl:w-60 select-none">
        {renderNavContent()}
      </aside>

      {/* Mobile Drawer (nwis-style) */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-stone-950/30 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
        >
          <div
            className="h-full w-72 max-w-[80vw] overflow-y-auto bg-[#FAFAF8] p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between px-1">
              <span className="text-[13px] font-semibold text-stone-900">Brightloop Menu</span>
              <button
                type="button"
                onClick={onCloseMobile}
                className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-200"
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {renderNavContent()}
          </div>
        </div>
      )}
    </>
  );
};
