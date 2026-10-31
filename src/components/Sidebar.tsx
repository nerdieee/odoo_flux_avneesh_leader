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
  Play,
  Sparkles,
  Settings
} from 'lucide-react';
import { cn } from '../utils/cn';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  overdueCount?: number;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
  onOpenLandingPage?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  overdueCount = 0,
  mobileOpen = false,
  onCloseMobile,
  onOpenLandingPage
}) => {
  const { user, logout, hasPermission, hasAnyPermission } = useAuth();
  const isCustomer = user?.role === 'customer';
  const isAdmin = user?.role === 'admin';

  const customerNav = [
    { tab: 'customer-portal', label: 'My Subscriptions', icon: Building2 },
    { tab: 'invoices', label: 'My Invoices & Tax Receipts', icon: FileText },
    { tab: 'payments', label: 'Payment History', icon: CreditCard },
  ];

  const staffOrAdminNav = [
    {
      tab: 'dashboard',
      label: 'Dashboard & Reports',
      icon: LayoutDashboard,
      visible: isAdmin || hasAnyPermission(['reports.view', 'reports.export', 'customers.view', 'subscriptions.view', 'invoices.view'])
    },
    {
      tab: 'subscriptions',
      label: 'Subscriptions',
      icon: Repeat,
      visible: isAdmin || hasPermission('subscriptions.view')
    },
    {
      tab: 'quotations',
      label: 'Quotations',
      icon: FileSpreadsheet,
      visible: isAdmin || hasPermission('quotations.view')
    },
    {
      tab: 'quotation-templates',
      label: 'Quotation Templates',
      icon: FolderOpen,
      visible: isAdmin || hasPermission('quotation_templates.view')
    },
    {
      tab: 'invoices',
      label: 'Invoices',
      icon: FileText,
      badge: overdueCount > 0 ? `${overdueCount} due` : undefined,
      visible: isAdmin || hasPermission('invoices.view')
    },
    {
      tab: 'payments',
      label: 'Payments',
      icon: CreditCard,
      visible: isAdmin || hasPermission('payments.view')
    },
    {
      tab: 'scheduler',
      label: 'Recurring Scheduler',
      icon: CalendarClock,
      visible: isAdmin || hasPermission('subscriptions.view')
    },
    {
      tab: 'products',
      label: 'Products & Variants',
      icon: Package,
      visible: isAdmin || hasPermission('products.view')
    },
    {
      tab: 'plans',
      label: 'Plans & Frequency',
      icon: Layers,
      visible: isAdmin || hasPermission('plans.view')
    },
    {
      tab: 'discounts',
      label: 'Discount Rules',
      icon: Percent,
      visible: isAdmin || hasPermission('discounts.view')
    },
    {
      tab: 'customers',
      label: 'Customers',
      icon: Users,
      visible: isAdmin || hasPermission('customers.view')
    },
    {
      tab: 'staff',
      label: 'Staff & Access Control',
      icon: UserCheck,
      visible: isAdmin || hasAnyPermission(['staff.view', 'staff.manage_roles', 'staff.manage_permissions', 'audit_logs.view', 'login_history.view'])
    },
    {
      tab: 'settings',
      label: 'Settings',
      icon: Settings,
      visible: isAdmin || hasAnyPermission(['taxes.view', 'taxes.edit'])
    },
  ];

  const navList = isCustomer
    ? customerNav
    : staffOrAdminNav.filter((item) => item.visible);

  const renderNavContent = () => (
    <>
      <nav className="rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white p-2.5 shadow-sm" aria-label="Primary">
        {/* Optional Landing Page shortcut */}
        {onOpenLandingPage && (
          <button
            type="button"
            onClick={() => {
              onOpenLandingPage();
              onCloseMobile?.();
            }}
            className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50/70 hover:bg-indigo-100 transition mb-2 cursor-pointer"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Sparkles className="h-4 w-4 shrink-0 text-indigo-600" />
              <span className="truncate">View Landing Page</span>
            </div>
            <span className="text-[10px] bg-indigo-600 text-white px-1.5 py-0.5 rounded-full font-mono">NEW</span>
          </button>
        )}

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
                'flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs transition cursor-pointer my-0.5',
                isActive
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold shadow-md shadow-indigo-500/25'
                  : 'text-slate-600 hover:bg-indigo-50/70 hover:text-indigo-900 font-medium'
              )}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-white' : 'text-slate-400')} />
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

      {/* Live Engine Status Tile */}
      {!isCustomer && (
        <div
          onClick={() => {
            setCurrentTab('scheduler');
            onCloseMobile?.();
          }}
          className="mt-3.5 w-full rounded-2xl sm:rounded-3xl border border-indigo-100/90 bg-gradient-to-br from-indigo-50/60 via-white to-violet-50/40 p-4 text-left hover:border-indigo-300 hover:shadow-md transition shadow-2xs cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] uppercase font-bold tracking-wider text-indigo-700">
              Recurring Engine · Active
            </span>
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="mt-1 text-[13px] font-bold tabular-nums text-slate-900">
            Automated Daily Cycle
          </div>
          <div className="mt-0.5 text-[11px] tabular-nums text-slate-500">
            Idempotency 100% · Sub-2s SLA
          </div>
          <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 transition-all" style={{ width: '92%' }} />
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] tabular-nums text-slate-500">
            <span className="text-slate-400">Next: Nov 1, 2026</span>
            <span className="font-semibold text-indigo-600 group-hover:text-indigo-800 inline-flex items-center gap-1">
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
        className="mt-3.5 w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50/50 transition shadow-2xs cursor-pointer"
      >
        <LogOut className="h-3.5 w-3.5 text-slate-400" />
        <span>Sign Out</span>
      </button>

      <p className="mt-3 px-1 text-[10.5px] leading-4 text-slate-400 text-center">
        Brightloop SMS · v2.6 · {isCustomer ? 'Customer Portal' : 'Admin & Staff'}
      </p>
    </>
  );

  return (
    <>
      {/* Desktop Sticky Aside */}
      <aside className="sticky top-[76px] hidden max-h-[calc(100vh-92px)] w-56 shrink-0 overflow-y-auto lg:block xl:w-60 select-none">
        {renderNavContent()}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
        >
          <div
            className="h-full w-72 max-w-[80vw] overflow-y-auto bg-slate-50 p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between px-1">
              <span className="text-[13px] font-bold text-slate-900">Brightloop Menu</span>
              <button
                type="button"
                onClick={onCloseMobile}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-200"
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
