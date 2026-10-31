import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, ShieldAlert, CheckCircle2, AlertCircle } from 'lucide-react';

export const ForcedPasswordChangeModal: React.FC = () => {
  const { user, changePassword, logout } = useAuth();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!user || !user.must_change_password) {
    return null;
  }

  const validatePasswordRules = (pass: string) => {
    return {
      length: pass.length > 8,
      upper: /[A-Z]/.test(pass),
      lower: /[a-z]/.test(pass),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pass)
    };
  };

  const rules = validatePasswordRules(newPassword);
  const allRulesPassed = rules.length && rules.upper && rules.lower && rules.special;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    if (!allRulesPassed) {
      setError('Password does not meet all security complexity rules.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await changePassword(oldPassword, newPassword);
      if (res.success) {
        setSuccess('Password updated successfully! Welcome to Brightloop.');
      } else {
        setError(res.error || 'Failed to change password');
      }
    } catch (err: any) {
      setError(err.message || 'Network error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="h-10 w-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Mandatory Password Update</h2>
            <p className="text-xs text-slate-500">First-time login security credential requirement</p>
          </div>
        </div>

        <p className="mt-3 text-xs text-slate-600 leading-relaxed">
          Welcome, <strong className="text-slate-900">{user.name}</strong>. Because you logged in with a temporary password, you must set a permanent password before accessing the SaaS platform.
        </p>

        {error && (
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-700">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Current / Temporary Password
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Enter current temporary password"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              <Lock className="absolute right-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              New Permanent Password
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new strong password"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              <Lock className="absolute right-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              <Lock className="absolute right-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            </div>
          </div>

          {/* Real-time complexity checklist */}
          <div className="rounded-2xl bg-slate-50 p-3 border border-slate-100 text-[11px] space-y-1">
            <span className="font-bold text-slate-700 block mb-1">Password Requirements:</span>
            <div className={`flex items-center gap-1.5 ${rules.length ? 'text-emerald-700 font-medium' : 'text-slate-400'}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${rules.length ? 'bg-emerald-500' : 'bg-slate-300'}`} />
              <span>More than 8 characters long</span>
            </div>
            <div className={`flex items-center gap-1.5 ${rules.upper ? 'text-emerald-700 font-medium' : 'text-slate-400'}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${rules.upper ? 'bg-emerald-500' : 'bg-slate-300'}`} />
              <span>At least one uppercase letter (A-Z)</span>
            </div>
            <div className={`flex items-center gap-1.5 ${rules.lower ? 'text-emerald-700 font-medium' : 'text-slate-400'}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${rules.lower ? 'bg-emerald-500' : 'bg-slate-300'}`} />
              <span>At least one lowercase letter (a-z)</span>
            </div>
            <div className={`flex items-center gap-1.5 ${rules.special ? 'text-emerald-700 font-medium' : 'text-slate-400'}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${rules.special ? 'bg-emerald-500' : 'bg-slate-300'}`} />
              <span>At least one special character (!@#$%^&amp;*...)</span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={logout}
              className="rounded-xl px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              Sign Out
            </button>
            <button
              type="submit"
              disabled={submitting || !allRulesPassed}
              className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-500/20 hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50 transition cursor-pointer"
            >
              {submitting ? 'Updating...' : 'Set Permanent Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

