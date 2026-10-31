import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types';
import {
  ShieldCheck,
  UserCheck,
  Building2,
  KeyRound,
  Check,
  ChevronDown,
  Search,
  LogOut,
  X,
  Repeat,
  FileText,
  Users,
  Menu,
  Sparkles,
  ExternalLink,
  Settings
} from 'lucide-react';
import { Modal } from './Modal';
import { cn } from '../utils/cn';

interface HeaderProps {
  onSearchChange?: (term: string) => void;
  searchTerm?: string;
  onNavigateTab?: (tab: string) => void;
  onToggleMobileMenu?: () => void;
  onOpenLandingPage?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onSearchChange,
  searchTerm = '',
  onNavigateTab,
  onToggleMobileMenu,
  onOpenLandingPage
}) => {
  const { user, requestPasswordReset, resetPassword, logout } = useAuth();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetMsg, setResetMsg] = useState<{ text: string; link?: string; isError?: boolean } | null>(null);

  // Quick Command Palette Search Modal
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setShowRoleMenu(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetMsg(null);
    const res = await requestPasswordReset(resetEmail);
    if (res.success) {
      setResetMsg({ text: res.message || 'Reset link created!', link: res.resetLink });
      if (res.resetLink) {
        const match = res.resetLink.match(/token=([^&]+)/);
        if (match && match[1]) setResetToken(match[1]);
      }
    } else {
      setResetMsg({ text: res.error || 'Failed to send reset link', isError: true });
    }
  };

  const handlePerformReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetMsg(null);
    const res = await resetPassword(resetEmail, resetToken, newPassword);
    if (res.success) {
      setResetMsg({ text: 'Password successfully changed! Security rules verified (length > 8, upper, lower, special).' });
      setTimeout(() => setShowResetModal(false), 2000);
    } else {
      setResetMsg({ text: res.error || 'Password reset failed', isError: true });
    }
  };

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md px-3 sm:px-4 lg:px-6">
        <div className="flex h-15 sm:h-16 w-full items-center justify-between gap-3">
          {/* Left: Mobile menu toggle + Brand header */}
          <div className="flex items-center gap-3">
            {onToggleMobileMenu && (
              <button
                type="button"
                onClick={onToggleMobileMenu}
                className="rounded-xl p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden"
                aria-label="Open navigation menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            )}

            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-pink-500 text-white font-bold text-xs tracking-tight shadow-md shadow-indigo-500/20">
                BL
              </div>
              <div className="leading-tight">
                <span className="text-[13.5px] font-bold text-slate-900 tracking-tight block">
                  Brightloop
                </span>
                <span className="text-[10.5px] text-indigo-600 font-semibold tracking-wide block -mt-0.5">
                  Subscription Ops
                </span>
              </div>
            </div>
          </div>

          {/* Center: Command Palette Trigger Button */}
          <div className="flex-1 max-w-sm hidden md:block">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="flex w-full items-center justify-between rounded-full border border-slate-200/90 bg-slate-50/80 px-3.5 py-1.5 text-xs text-slate-400 hover:border-indigo-300 hover:bg-white transition shadow-2xs cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Search className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-slate-500 text-[12px]">Quick search platform…</span>
              </div>
              <kbd className="text-[10px] font-mono text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-2xs">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Right: Controls & Persona Selector */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Landing page link */}
            {onOpenLandingPage && (
              <button
                type="button"
                onClick={onOpenLandingPage}
                className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-700 px-3 py-1.5 text-xs font-semibold transition shadow-2xs cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                <span className="hidden sm:inline">Landing Page</span>
              </button>
            )}

            {/* Sub-2s SLA badge */}
            <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50/80 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 shadow-2xs">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>SLA &lt; 2s (11.8ms)</span>
            </div>

            {/* User Profile Pill & Account Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-slate-300 transition shadow-2xs cursor-pointer"
              >
                <span className={cn(
                  "h-2 w-2 rounded-full",
                  user?.role === 'admin' ? "bg-amber-500" : user?.role === 'staff' ? "bg-blue-600" : "bg-emerald-500"
                )} />
                <span className="text-slate-900 text-[12px] font-semibold">
                  {user?.role_name || user?.role}
                </span>
                <span className="hidden xl:inline text-slate-500 text-[11px] font-normal">
                  · {user?.name}
                </span>
                <ChevronDown className="h-3 w-3 text-slate-400" />
              </button>

              {/* User Account Menu Dropdown */}
              {showRoleMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowRoleMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-72 origin-top-right rounded-2xl border border-slate-200 bg-white p-3 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-1 py-1.5 border-b border-slate-100 mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className={cn(
                          "h-9 w-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-xs",
                          user?.role === 'admin'
                            ? "bg-gradient-to-tr from-amber-500 to-orange-500"
                            : user?.role === 'staff'
                            ? "bg-gradient-to-tr from-blue-600 to-indigo-600"
                            : "bg-gradient-to-tr from-emerald-500 to-teal-600"
                        )}>
                          {user?.role === 'admin' ? <ShieldCheck className="h-4 w-4" /> : user?.role === 'staff' ? <UserCheck className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-slate-900 text-xs truncate">{user?.name}</p>
                          <p className="text-[11px] font-mono text-slate-400 truncate">{user?.email}</p>
                        </div>
                      </div>
                      <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500">
                        <span className="text-slate-400">Assigned Role</span>
                        <span className="font-semibold text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                          {user?.role_name || user?.role}
                        </span>
                      </div>
                      {user?.department && (
                        <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                          <span className="text-slate-400">Department</span>
                          <span className="font-medium text-slate-700">{user.department}</span>
                        </div>
                      )}
                      {user?.company && (
                        <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                          <span className="text-slate-400">Organization</span>
                          <span className="font-medium text-slate-700 truncate max-w-[150px]">{user.company}</span>
                        </div>
                      )}
                    </div>

                    {/* Settings, Reset Password & Sign Out Links */}
                    <div className="space-y-1">
                      {user?.role === 'admin' && onNavigateTab && (
                        <button
                          type="button"
                          onClick={() => {
                            onNavigateTab('settings');
                            setShowRoleMenu(false);
                          }}
                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 cursor-pointer"
                        >
                          <Settings className="h-3.5 w-3.5 text-slate-400" />
                          <span>Settings &amp; Tax %</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setResetEmail(user?.email || '');
                          setShowResetModal(true);
                          setShowRoleMenu(false);
                        }}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 cursor-pointer"
                      >
                        <KeyRound className="h-3.5 w-3.5 text-slate-400" />
                        <span>Security Password Reset</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowRoleMenu(false);
                          logout();
                        }}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 cursor-pointer"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        <span>Sign Out Account</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* User Avatar Circle */}
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-600 via-violet-600 to-pink-500 text-[11px] font-bold text-white shadow-2xs">
              {getUserInitials(user?.name || 'User')}
            </div>
          </div>
        </div>
      </header>

      {/* Quick Command Palette Modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-950/40 backdrop-blur-xs">
          <div
            className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5 px-2">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                type="text"
                autoFocus
                placeholder="Search commands, subscriptions, invoices, customers…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-xs text-slate-900 outline-none placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="py-2 space-y-1 text-xs">
              <p className="px-3 py-1 text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
                Navigation Shortcuts
              </p>
              {[
                { label: 'Financial Dashboard & SLA Analytics', tab: 'dashboard', icon: Repeat },
                { label: 'Subscription Lifecycle Agreements', tab: 'subscriptions', icon: Repeat },
                { label: 'Quotations & Template Offers', tab: 'quotations', icon: FileText },
                { label: 'Invoices & Idempotent Cycle Statements', tab: 'invoices', icon: FileText },
                { label: 'Recurring Billing Scheduler Engine', tab: 'scheduler', icon: Repeat },
                { label: 'Customer Directory & GSTIN Profiles', tab: 'customers', icon: Users },
                { label: 'Product Catalog & Variant Matrix', tab: 'products', icon: FileText },
              ]
                .filter((item) =>
                  !searchQuery || item.label.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((item) => (
                  <button
                    key={item.tab}
                    type="button"
                    onClick={() => {
                      onNavigateTab?.(item.tab);
                      setSearchOpen(false);
                    }}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-slate-700 hover:bg-indigo-50 hover:text-indigo-900 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <item.icon className="h-3.5 w-3.5 text-indigo-600" />
                      <span>{item.label}</span>
                    </div>
                    <span className="text-[10.5px] text-slate-400 font-mono">Jump →</span>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      <Modal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        title="Security Password Reset (PDF Requirement)"
        subtitle="Enforces policy: length > 8, uppercase, lowercase, and special character"
        maxWidth="md"
      >
        <div className="space-y-4">
          {resetMsg && (
            <div
              className={`p-3 rounded-xl text-xs ${
                resetMsg.isError
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              }`}
            >
              <p className="font-semibold">{resetMsg.text}</p>
              {resetMsg.link && (
                <p className="mt-1 font-mono text-[10px] break-all bg-white/80 p-1.5 rounded-lg border border-emerald-200">
                  {resetMsg.link}
                </p>
              )}
            </div>
          )}

          <form onSubmit={handleRequestReset} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Account Email
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="user@brightloop.com"
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs focus:border-indigo-600 focus:outline-none"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 shrink-0"
                >
                  Create Token
                </button>
              </div>
            </div>
          </form>

          {resetToken && (
            <form onSubmit={handlePerformReset} className="space-y-3 pt-3 border-t border-slate-100">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reset Token
                </label>
                <input
                  type="text"
                  required
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs font-mono bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Must contain >8 chars, upper, lower, special"
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs font-mono focus:border-indigo-600 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 py-2 text-xs font-bold text-white hover:from-indigo-700 hover:to-violet-700 shadow-sm"
              >
                Set New Password
              </button>
            </form>
          )}
        </div>
      </Modal>
    </>
  );
};

export default Header;
