import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  Lock,
  Mail,
  User as UserIcon,
  Building2,
  Phone,
  FileText,
  Eye,
  EyeOff,
  AlertCircle,
  ShieldCheck,
  UserCheck,
  ArrowRight,
  CheckCircle2,
  KeyRound,
  ArrowLeft
} from 'lucide-react';
import { cn } from '../utils/cn';

interface AuthViewProps {
  onBackToLanding?: () => void;
  initialTab?: 'signin' | 'signup' | 'forgot';
}

export const AuthView: React.FC<AuthViewProps> = ({
  onBackToLanding,
  initialTab = 'signin'
}) => {
  const { login, register, requestPasswordReset, resetPassword } = useAuth();
  const [activeTab, setActiveTab] = useState<'signin' | 'signup' | 'forgot'>(initialTab);

  // Sign In State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Sign Up State
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirm, setSignupConfirm] = useState('');
  const [signupCompany, setSignupCompany] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupAddress, setSignupAddress] = useState('');
  const [signupGst, setSignupGst] = useState('');
  const [signupError, setSignupError] = useState('');
  const [signupLoading, setSignupLoading] = useState(false);

  // Forgot Password State
  const [resetEmail, setResetEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetStep, setResetStep] = useState<1 | 2>(1);
  const [resetMsg, setResetMsg] = useState<{ text: string; link?: string; isError?: boolean } | null>(null);

  // Password rules validation logic
  const passLength = signupPassword.length > 8;
  const passUpper = /[A-Z]/.test(signupPassword);
  const passLower = /[a-z]/.test(signupPassword);
  const passSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(signupPassword);
  const isPasswordValid = passLength && passUpper && passLower && passSpecial;

  // Handle Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    const res = await login(loginEmail, loginPassword);
    setLoginLoading(false);
    if (!res.success) {
      setLoginError(res.error || 'Invalid email or password.');
    }
  };

  // Handle Quick Demo Login
  const handleQuickLogin = (email: string) => {
    setLoginEmail(email);
    setLoginPassword('Brightloop@2026');
    login(email, 'Brightloop@2026');
  };

  // Handle Sign Up
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError('');

    if (!isPasswordValid) {
      setSignupError('Password does not satisfy all security requirements.');
      return;
    }

    if (signupPassword !== signupConfirm) {
      setSignupError('Passwords do not match.');
      return;
    }

    setSignupLoading(true);
    const res = await register({
      name: signupName,
      email: signupEmail,
      password: signupPassword,
      company: signupCompany,
      phone: signupPhone,
      address: signupAddress,
      gst_number: signupGst
    });
    setSignupLoading(false);

    if (!res.success) {
      setSignupError(res.error || 'Registration failed.');
    }
  };

  // Handle Request Password Reset
  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetMsg(null);
    const res = await requestPasswordReset(resetEmail);
    if (res.success) {
      setResetMsg({ text: res.message || 'Reset link created!', link: res.resetLink });
      if (res.resetLink) {
        const match = res.resetLink.match(/token=([^&]+)/);
        if (match && match[1]) {
          setResetToken(match[1]);
          setResetStep(2);
        }
      }
    } else {
      setResetMsg({ text: res.error || 'Failed to request reset', isError: true });
    }
  };

  // Handle Complete Password Reset
  const handleResetComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetMsg(null);
    const res = await resetPassword(resetEmail, resetToken, newPassword);
    if (res.success) {
      setResetMsg({ text: 'Password reset successful! You can now log in.' });
      setTimeout(() => {
        setActiveTab('signin');
        setLoginEmail(resetEmail);
        setLoginPassword(newPassword);
      }, 1500);
    } else {
      setResetMsg({ text: res.error || 'Password reset failed', isError: true });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/40 via-white to-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900 relative">
      {/* Decorative ambient blurred gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-indigo-300/30 via-violet-300/25 to-pink-300/20 blur-3xl rounded-full pointer-events-none -z-10" />

      {/* Optional Top Return Link */}
      {onBackToLanding && (
        <div className="absolute top-6 left-6">
          <button
            type="button"
            onClick={onBackToLanding}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/90 backdrop-blur-xs px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-indigo-600 hover:border-indigo-300 transition shadow-2xs cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Landing Page</span>
          </button>
        </div>
      )}

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Brand Logo */}
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-pink-500 shadow-xl shadow-indigo-500/25 text-white mb-3">
          <Sparkles className="h-6 w-6" />
        </div>

        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          Brightloop Software
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          Subscription Management &amp; Recurring Invoicing Platform
        </p>

        {/* Tab Selector */}
        <div className="mt-5 flex justify-center">
          <div className="inline-flex p-1 bg-slate-100/90 rounded-full border border-slate-200/90 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setActiveTab('signin');
                setLoginError('');
              }}
              className={cn(
                'px-5 py-1.5 rounded-full transition-all text-xs font-bold',
                activeTab === 'signin'
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('signup');
                setSignupError('');
              }}
              className={cn(
                'px-5 py-1.5 rounded-full transition-all text-xs font-bold',
                activeTab === 'signup'
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              Create Account
            </button>
          </div>
        </div>
      </div>

      <div className="mt-5 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/95 backdrop-blur-sm py-7 px-5 sm:px-8 rounded-3xl border border-slate-200/90 shadow-xl shadow-indigo-500/5">
          {/* ======================================================== */}
          {/* TAB 1: SIGN IN */}
          {/* ======================================================== */}
          {activeTab === 'signin' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Sign in to your account</h3>
                <p className="text-xs text-slate-500 mt-0.5">Enter your email and password to access the portal</p>
              </div>

              {loginError && (
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="name@company.com"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:bg-white focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setActiveTab('forgot')}
                      className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-9 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:bg-white focus:outline-none transition-colors font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 py-2.5 px-4 text-xs font-bold text-white transition-all shadow-md shadow-indigo-500/25 disabled:opacity-50 flex items-center justify-center gap-1.5 mt-2"
                >
                  <span>{loginLoading ? 'Signing in…' : 'Sign In'}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </form>

              {/* 1-Click Fast Demo Login Buttons */}
              <div className="pt-4 border-t border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center mb-2.5">
                  1-Click Instant Evaluation Sign In
                </p>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('admin@brightloop.com')}
                    className="w-full flex items-center justify-between p-2.5 rounded-2xl border border-amber-200/80 bg-amber-50/40 hover:bg-amber-100/60 text-left transition text-xs group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-xs">
                        <ShieldCheck className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 block">👑 Sarah Connor (Admin)</span>
                        <span className="text-[10.5px] text-slate-500 font-mono">admin@brightloop.com · Full Control</span>
                      </div>
                    </div>
                    <span className="text-[11px] text-amber-700 font-bold group-hover:translate-x-0.5 transition">Log in →</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickLogin('staff@brightloop.com')}
                    className="w-full flex items-center justify-between p-2.5 rounded-2xl border border-blue-200/80 bg-blue-50/40 hover:bg-blue-100/60 text-left transition text-xs group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-xs">
                        <UserCheck className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 block">👔 Alex Morgan (Staff)</span>
                        <span className="text-[10.5px] text-slate-500 font-mono">staff@brightloop.com · Operations</span>
                      </div>
                    </div>
                    <span className="text-[11px] text-blue-700 font-bold group-hover:translate-x-0.5 transition">Log in →</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickLogin('customer@acme.com')}
                    className="w-full flex items-center justify-between p-2.5 rounded-2xl border border-emerald-200/80 bg-emerald-50/40 hover:bg-emerald-100/60 text-left transition text-xs group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white shadow-xs">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 block">👤 Rajesh Patel (Customer)</span>
                        <span className="text-[10.5px] text-slate-500 font-mono">customer@acme.com · Acme Tech</span>
                      </div>
                    </div>
                    <span className="text-[11px] text-emerald-700 font-bold group-hover:translate-x-0.5 transition">Log in →</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: SIGN UP (CUSTOMER REGISTRATION) */}
          {/* ======================================================== */}
          {activeTab === 'signup' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Create Customer Account</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Register your company profile to access subscription services &amp; tax invoices
                </p>
              </div>

              {/* Note on RBAC as per PDF requirement */}
              <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-100 text-[11px] text-indigo-900 flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 shrink-0 text-indigo-600 mt-0.5" />
                <span>
                  <strong>Role policy:</strong> Client accounts register here. Internal Staff accounts can only be invited directly by an Administrator.
                </span>
              </div>

              {signupError && (
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                  <span>{signupError}</span>
                </div>
              )}

              <form onSubmit={handleSignupSubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                    <div className="relative">
                      <UserIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-8 pr-2.5 py-1.5 text-xs text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Company Name</label>
                    <div className="relative">
                      <Building2 className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        value={signupCompany}
                        onChange={(e) => setSignupCompany(e.target.value)}
                        placeholder="Acme Corp"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-8 pr-2.5 py-1.5 text-xs text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Corporate Email *</label>
                    <div className="relative">
                      <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        placeholder="john@company.com"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-8 pr-2.5 py-1.5 text-xs text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        value={signupPhone}
                        onChange={(e) => setSignupPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-8 pr-2.5 py-1.5 text-xs text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">GSTIN / Tax ID</label>
                  <input
                    type="text"
                    value={signupGst}
                    onChange={(e) => setSignupGst(e.target.value.toUpperCase())}
                    placeholder="29ABCDE1234F1Z5"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-900 font-mono focus:border-indigo-600 focus:bg-white focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Billing Address</label>
                  <input
                    type="text"
                    value={signupAddress}
                    onChange={(e) => setSignupAddress(e.target.value)}
                    placeholder="Tech Park, Outer Ring Rd, Bengaluru"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none transition-colors"
                  />
                </div>

                {/* Password Input with Policy Visual Checklist */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Password *</label>
                  <div className="relative">
                    <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      placeholder="e.g. Brightloop@2026"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-8 pr-3 py-1.5 text-xs text-slate-900 font-mono focus:border-indigo-600 focus:bg-white focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Password Security Checklist as per PDF */}
                  <div className="mt-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[10.5px] grid grid-cols-2 gap-1.5">
                    <div className={`flex items-center gap-1.5 ${passLength ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}>
                      <CheckCircle2 className={`h-3.5 w-3.5 ${passLength ? 'text-emerald-600' : 'text-slate-300'}`} />
                      <span>&gt; 8 characters</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${passUpper ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}>
                      <CheckCircle2 className={`h-3.5 w-3.5 ${passUpper ? 'text-emerald-600' : 'text-slate-300'}`} />
                      <span>1 Uppercase (A-Z)</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${passLower ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}>
                      <CheckCircle2 className={`h-3.5 w-3.5 ${passLower ? 'text-emerald-600' : 'text-slate-300'}`} />
                      <span>1 Lowercase (a-z)</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${passSpecial ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}>
                      <CheckCircle2 className={`h-3.5 w-3.5 ${passSpecial ? 'text-emerald-600' : 'text-slate-300'}`} />
                      <span>1 Special character</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm Password *</label>
                  <input
                    type="password"
                    required
                    value={signupConfirm}
                    onChange={(e) => setSignupConfirm(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-900 font-mono focus:border-indigo-600 focus:bg-white focus:outline-none transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={signupLoading || !isPasswordValid}
                  className="w-full rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 py-2.5 px-4 text-xs font-bold text-white transition-all shadow-md shadow-indigo-500/25 disabled:opacity-50 flex items-center justify-center gap-1.5 mt-2"
                >
                  <span>{signupLoading ? 'Creating Account…' : 'Register Customer Account'}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </form>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: FORGOT PASSWORD */}
          {/* ======================================================== */}
          {activeTab === 'forgot' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Reset Your Password</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Follow the verified email token reset workflow required by the specification
                </p>
              </div>

              {resetMsg && (
                <div className={`p-3 rounded-2xl text-xs ${resetMsg.isError ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'}`}>
                  <p className="font-semibold">{resetMsg.text}</p>
                  {resetMsg.link && (
                    <p className="mt-1 font-mono text-[10px] break-all bg-white/80 p-1.5 rounded-lg border border-emerald-200">
                      {resetMsg.link}
                    </p>
                  )}
                </div>
              )}

              {resetStep === 1 ? (
                <form onSubmit={handleResetRequest} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Enter registered account email
                    </label>
                    <input
                      type="email"
                      required
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="e.g. customer@acme.com"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2 text-xs focus:border-indigo-600 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('signin')}
                      className="flex-1 rounded-full border border-slate-200 py-2 text-xs font-semibold text-slate-600 hover:border-slate-300"
                    >
                      Back to Sign In
                    </button>
                    <button
                      type="submit"
                      className="flex-1 rounded-full bg-slate-900 py-2 text-xs font-bold text-white hover:bg-slate-800"
                    >
                      Send Reset Token
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleResetComplete} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Reset Token</label>
                    <input
                      type="text"
                      required
                      value={resetToken}
                      onChange={(e) => setResetToken(e.target.value)}
                      placeholder="rst_..."
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2 text-xs font-mono focus:border-indigo-600 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">New Password</label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Must be >8 chars, upper, lower, special"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2 text-xs font-mono focus:border-indigo-600 focus:bg-white focus:outline-none"
                    />
                    <p className="mt-1 text-[10.5px] text-slate-400">Example: <code className="text-indigo-600 font-mono">Brightloop@2026</code></p>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setResetStep(1)}
                      className="flex-1 rounded-full border border-slate-200 py-2 text-xs font-semibold text-slate-600 hover:border-slate-300"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="flex-1 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 py-2 text-xs font-bold text-white hover:from-indigo-700 hover:to-violet-700 shadow-md shadow-indigo-500/20"
                    >
                      Update Password
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthView;
