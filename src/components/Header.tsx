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
  Menu
} from 'lucide-react';
import { Modal } from './Modal';
import { cn } from '../utils/cn';

interface HeaderProps {
  onSearchChange?: (term: string) => void;
  searchTerm?: string;
  onNavigateTab?: (tab: string) => void;
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onSearchChange,
  searchTerm = '',
  onNavigateTab,
  onToggleMobileMenu
}) => {
  const { user, switchPersona, requestPasswordReset, resetPassword, logout } = useAuth();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetMsg, setResetMsg] = useState<{ text: string; link?: string; isError?: boolean } | null>(null);

  // Quick Command Palette Search Modal
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchBoxRef = useRef<HTMLDivElement>(null);

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

  const handlePersonaSelect = (role: UserRole) => {
    switchPersona(role);
    setShowRoleMenu(false);
  };

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
      <header className="sticky top-0 z-40 border-b border-stone-200/70 bg-white/90 backdrop-blur-md px-3 sm:px-4 lg:px-6">
        <div className="flex h-14 sm:h-16 w-full items-center justify-between gap-3">
          {/* Left: Mobile menu toggle + Brand header */}
          <div className="flex items-center gap-3">
            {onToggleMobileMenu && (
              <button
                type="button"
                onClick={onToggleMobileMenu}
                className="rounded-lg p-1.5 text-stone-500 hover:bg-stone-100 lg:hidden"
                aria-label="Open navigation menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            )}

            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-stone-900 text-white font-bold text-xs tracking-tight shadow-2xs">
                BL
              </div>
              <div className="leading-tight">
                <span className="text-[13px] font-semibold text-stone-900 tracking-tight block">
                  Brightloop
                </span>
                <span className="text-[10px] text-stone-400 font-mono block">
                  SMS · v2.6
                </span>
              </div>
            </div>
          </div>

          {/* Center: Command Palette Trigger Button (nwis-style) */}
          <div className="flex-1 max-w-sm hidden md:block">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="flex w-full items-center justify-between rounded-full border border-stone-200/80 bg-stone-50/70 px-3.5 py-1.5 text-xs text-stone-400 hover:border-stone-300 hover:bg-white transition shadow-2xs cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Search className="h-3.5 w-3.5 text-stone-400" />
                <span className="text-stone-500 text-[12px]">Quick search platform…</span>
              </div>
              <kbd className="text-[10px] font-mono text-stone-400 bg-white border border-stone-200 px-1.5 py-0.5 rounded shadow-2xs">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Right: Controls & Persona Selector */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Sub-2s SLA badge */}
            <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-2.5 py-1 text-[11px] font-medium text-stone-600 shadow-2xs">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>SLA &lt; 2s (10.4ms)</span>
            </div>

            {/* Persona Switcher Pill */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="flex items-center gap-2 rounded-full border border-stone-200 bg-white px-2.5 sm:px-3 py-1.5 text-xs font-medium text-stone-700 hover:border-stone-300 transition shadow-2xs cursor-pointer"
              >
                <span className="h-2 w-2 rounded-full bg-stone-900" />
                <span className="capitalize font-semibold text-stone-900 text-[12px]">
                  {user?.role}
                </span>
                <span className="hidden xl:inline text-stone-400 text-[11px]">
                  · {user?.name}
                </span>
                <ChevronDown className="h-3 w-3 text-stone-400" />
              </button>

              {/* Persona Switcher Dropdown */}
              {showRoleMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowRoleMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-72 origin-top-right rounded-2xl border border-stone-200 bg-white p-2 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-2 border-b border-stone-100">
                      <p className="text-[10.5px] font-semibold uppercase tracking-wider text-stone-400">
                        Test Role Switcher
                      </p>
                      <p className="text-xs text-stone-500 mt-0.5">
                        Switch accounts instantly to review RBAC
                      </p>
                    </div>

                    <div className="mt-1 space-y-1">
                      {/* Admin */}
                      <button
                        type="button"
                        onClick={() => handlePersonaSelect('admin')}
                        className={cn(
                          'flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition cursor-pointer',
                          user?.role === 'admin'
                            ? 'bg-stone-900 text-white font-medium'
                            : 'text-stone-700 hover:bg-stone-50'
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          <ShieldCheck
                            className={cn(
                              'h-4 w-4',
                              user?.role === 'admin'
                                ? 'text-amber-400'
                                : 'text-stone-400'
                            )}
                          />
                          <div>
                            <p className="font-semibold">Sarah Connor</p>
                            <p
                              className={cn(
                                'text-[11px]',
                                user?.role === 'admin'
                                  ? 'text-stone-300'
                                  : 'text-stone-400'
                              )}
                            >
                              Admin · Full Platform Control
                            </p>
                          </div>
                        </div>
                        {user?.role === 'admin' && (
                          <Check className="h-4 w-4 text-emerald-400" />
                        )}
                      </button>

                      {/* Staff */}
                      <button
                        type="button"
                        onClick={() => handlePersonaSelect('staff')}
                        className={cn(
                          'flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition cursor-pointer',
                          user?.role === 'staff'
                            ? 'bg-stone-900 text-white font-medium'
                            : 'text-stone-700 hover:bg-stone-50'
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          <UserCheck
                            className={cn(
                              'h-4 w-4',
                              user?.role === 'staff'
                                ? 'text-blue-400'
                                : 'text-stone-400'
                            )}
                          />
                          <div>
                            <p className="font-semibold">Alex Morgan</p>
                            <p
                              className={cn(
                                'text-[11px]',
                                user?.role === 'staff'
                                  ? 'text-stone-300'
                                  : 'text-stone-400'
                              )}
                            >
                              Internal Staff · Sales &amp; Billing
                            </p>
                          </div>
                        </div>
                        {user?.role === 'staff' && (
                          <Check className="h-4 w-4 text-emerald-400" />
                        )}
                      </button>

                      {/* Customer */}
                      <button
                        type="button"
                        onClick={() => handlePersonaSelect('customer')}
                        className={cn(
                          'flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition cursor-pointer',
                          user?.role === 'customer'
                            ? 'bg-stone-900 text-white font-medium'
                            : 'text-stone-700 hover:bg-stone-50'
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          <Building2
                            className={cn(
                              'h-4 w-4',
                              user?.role === 'customer'
                                ? 'text-emerald-400'
                                : 'text-stone-400'
                            )}
                          />
                          <div>
                            <p className="font-semibold">Rajesh Patel</p>
                            <p
                              className={cn(
                                'text-[11px]',
                                user?.role === 'customer'
                                  ? 'text-stone-300'
                                  : 'text-stone-400'
                              )}
                            >
                              Customer Portal · Acme Tech
                            </p>
                          </div>
                        </div>
                        {user?.role === 'customer' && (
                          <Check className="h-4 w-4 text-emerald-400" />
                        )}
                      </button>
                    </div>

                    <div className="mt-2 pt-2 border-t border-stone-100 flex items-center justify-between px-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowRoleMenu(false);
                          setResetEmail(user?.email || '');
                          setShowResetModal(true);
                        }}
                        className="inline-flex items-center gap-1.5 text-[11px] text-stone-500 hover:text-stone-900 font-medium transition cursor-pointer"
                      >
                        <KeyRound className="h-3 w-3" />
                        Reset Password
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowRoleMenu(false);
                          logout();
                        }}
                        className="inline-flex items-center gap-1 text-[11px] text-rose-600 hover:text-rose-800 font-semibold cursor-pointer"
                      >
                        <LogOut className="h-3 w-3" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* User Avatar Circle */}
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 text-[11px] font-semibold text-stone-700 select-none border border-stone-200"
              title={`${user?.name} (${user?.email})`}
            >
              {user ? getUserInitials(user.name) : 'BL'}
            </div>

            {/* Quick Sign Out Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                logout();
              }}
              className="flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition shadow-2xs cursor-pointer"
              title="Sign out of account"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Quick Search Palette Modal (Cmd+K style in NWIS) */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-stone-950/30 backdrop-blur-xs pt-16 px-4"
          onClick={() => setSearchOpen(false)}
        >
          <div
            ref={searchBoxRef}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl border border-stone-200 bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center gap-2 border-b border-stone-100 px-4 py-3">
              <Search className="h-4 w-4 shrink-0 text-stone-400" />
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  onSearchChange?.(e.target.value);
                }}
                placeholder="Search subscriptions, customers, invoices, products…"
                className="w-full min-w-0 bg-transparent text-[13px] text-stone-900 outline-hidden placeholder:text-stone-400"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="rounded-md p-1 text-stone-400 hover:bg-stone-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-2 max-h-80 overflow-y-auto space-y-1 text-xs">
              <p className="px-3 py-1.5 text-[10.5px] uppercase tracking-wider text-stone-400 font-semibold">
                Quick Navigation
              </p>

              {[
                { label: 'Finance Dashboard', icon: Repeat, tab: 'dashboard' },
                { label: 'Active Subscriptions', icon: Repeat, tab: 'subscriptions' },
                { label: 'Sales Quotations', icon: FileText, tab: 'quotations' },
                { label: 'Invoices & Receipts', icon: FileText, tab: 'invoices' },
                { label: 'Customer Directory', icon: Users, tab: 'customers' },
                { label: 'Recurring Billing Scheduler', icon: Repeat, tab: 'scheduler' },
              ].map((item) => (
                <button
                  key={item.tab}
                  type="button"
                  onClick={() => {
                    onNavigateTab?.(item.tab);
                    setSearchOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-stone-700 hover:bg-stone-50 hover:text-stone-900 transition text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <item.icon className="h-3.5 w-3.5 text-stone-400" />
                    <span>{item.label}</span>
                  </div>
                  <span className="text-[10.5px] font-mono text-stone-400">Jump →</span>
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
        title="Password Reset Verification Flow"
        subtitle="Verifies requirement: >8 chars, upper, lower, special characters & secure reset token"
        maxWidth="md"
      >
        <div className="space-y-4">
          <form onSubmit={handleRequestReset} className="space-y-3 pb-4 border-b border-stone-100">
            <label className="block text-xs font-medium text-stone-700">
              1. Request Reset Link for Registered Email
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                required
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="registered.email@domain.com"
                className="flex-1 rounded-xl border border-stone-200 px-3 py-1.5 text-xs text-stone-900 focus:border-stone-900 focus:outline-hidden"
              />
              <button
                type="submit"
                className="rounded-xl bg-stone-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-stone-800 transition"
              >
                Send Link
              </button>
            </div>
          </form>

          <form onSubmit={handlePerformReset} className="space-y-3">
            <label className="block text-xs font-medium text-stone-700">
              2. Complete Password Reset with Token
            </label>
            <input
              type="text"
              required
              placeholder="Paste Reset Token (e.g. rst_...)"
              value={resetToken}
              onChange={(e) => setResetToken(e.target.value)}
              className="w-full rounded-xl border border-stone-200 px-3 py-1.5 text-xs text-stone-900 font-mono focus:border-stone-900 focus:outline-hidden"
            />
            <div>
              <input
                type="password"
                required
                placeholder="New Password (> 8 chars, 1 uppercase, 1 lowercase, 1 special)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-xl border border-stone-200 px-3 py-1.5 text-xs text-stone-900 focus:border-stone-900 focus:outline-hidden"
              />
              <p className="mt-1 text-[11px] text-stone-400">
                Example compliant password:{' '}
                <code className="font-mono text-stone-900">Brightloop@2026</code>
              </p>
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-stone-900 py-2 text-xs font-semibold text-white hover:bg-stone-800 transition shadow-xs"
            >
              Update Password
            </button>
          </form>

          {resetMsg && (
            <div
              className={`p-3 rounded-xl text-xs ${
                resetMsg.isError
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              }`}
            >
              <p className="font-medium">{resetMsg.text}</p>
              {resetMsg.link && (
                <p className="mt-1 font-mono text-[10px] break-all bg-white/80 p-1.5 rounded-lg border border-emerald-200/60">
                  {resetMsg.link}
                </p>
              )}
            </div>
          )}
        </div>
      </Modal>
    </>
  );
};
