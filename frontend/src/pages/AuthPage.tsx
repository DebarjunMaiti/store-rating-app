import React, { useState } from 'react';
import { Sparkles, Shield, Store, User, Lock, Mail, MapPin, ArrowRight, CheckCircle2, AlertCircle, KeyRound, ShieldAlert } from 'lucide-react';
import api from '../api/client';
import { validateUserForm } from '../utils/validation';
import { User as UserType } from '../types';

interface AuthPageProps {
  onLoginSuccess: (user: UserType, token: string) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  
  // Role Selection for Login and Register
  const [selectedLoginRole, setSelectedLoginRole] = useState<'USER' | 'STORE_OWNER' | 'ADMIN'>('USER');
  const [selectedRegisterRole, setSelectedRegisterRole] = useState<'USER' | 'STORE_OWNER'>('USER');

  // Admin 2FA State
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [adminEmailForOtp, setAdminEmailForOtp] = useState('');
  const [tempOtpToken, setTempOtpToken] = useState('');
  const [otpCodeInput, setOtpCodeInput] = useState('');
  const [previewOtp, setPreviewOtp] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    address: '',
    storeName: '',
    storeEmail: '',
    storeAddress: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  const handleQuickLogin = async (email: string) => {
    setLoading(true);
    setGeneralError('');
    setIsOtpStep(false);
    try {
      const res = await api.post('/auth/login', {
        email,
        password: 'Password@123'
      });

      // If admin requires OTP
      if (res.data.requireOtp) {
        setIsOtpStep(true);
        setAdminEmailForOtp(res.data.email);
        setTempOtpToken(res.data.tempToken || '');
        setPreviewOtp(res.data.previewOtp || '');
        setOtpCodeInput(res.data.previewOtp || '');
        return;
      }

      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        onLoginSuccess(res.data.user, res.data.token);
      }
    } catch (err: any) {
      setGeneralError(err.response?.data?.message || 'Quick login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError('');
    setErrors({});

    if (isLogin) {
      if (!formData.email || !formData.password) {
        setGeneralError('Please enter both email and password.');
        return;
      }

      setLoading(true);
      try {
        const res = await api.post('/auth/login', {
          email: formData.email,
          password: formData.password,
          expectedRole: selectedLoginRole
        });

        // If admin requires 2FA OTP
        if (res.data.requireOtp) {
          setIsOtpStep(true);
          setAdminEmailForOtp(res.data.email);
          setTempOtpToken(res.data.tempToken || '');
          setPreviewOtp(res.data.previewOtp || '');
          return;
        }

        if (res.data.success) {
          localStorage.setItem('token', res.data.token);
          localStorage.setItem('user', JSON.stringify(res.data.user));
          onLoginSuccess(res.data.user, res.data.token);
        }
      } catch (err: any) {
        setGeneralError(err.response?.data?.message || 'Invalid email or password.');
      } finally {
        setLoading(false);
      }
    } else {
      // Sign Up Validation (Min 8, Max 60 chars)
      const validation = validateUserForm({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        address: formData.address,
        isPasswordRequired: true
      });

      if (!validation.isValid) {
        setErrors(validation.errors);
        return;
      }

      if (selectedRegisterRole === 'STORE_OWNER' && formData.storeName && (formData.storeName.length < 8 || formData.storeName.length > 60)) {
        setErrors(prev => ({ ...prev, storeName: 'Store name must be between 8 and 60 characters.' }));
        return;
      }

      setLoading(true);
      try {
        const payload: any = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          address: formData.address,
          role: selectedRegisterRole
        };

        if (selectedRegisterRole === 'STORE_OWNER' && formData.storeName) {
          payload.storeName = formData.storeName;
          payload.storeEmail = formData.storeEmail || formData.email;
          payload.storeAddress = formData.storeAddress || formData.address;
        }

        const res = await api.post('/auth/register', payload);
        if (res.data.success) {
          localStorage.setItem('token', res.data.token);
          localStorage.setItem('user', JSON.stringify(res.data.user));
          onLoginSuccess(res.data.user, res.data.token);
        }
      } catch (err: any) {
        if (err.response?.data?.errors) {
          setErrors(err.response.data.errors);
        } else {
          setGeneralError(err.response?.data?.message || 'Registration failed. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError('');

    if (!otpCodeInput || otpCodeInput.length !== 6) {
      setGeneralError('Please enter a valid 6-digit OTP.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/verify-admin-otp', {
        email: adminEmailForOtp,
        otp: otpCodeInput,
        tempToken: tempOtpToken
      });

      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        onLoginSuccess(res.data.user, res.data.token);
      }
    } catch (err: any) {
      setGeneralError(err.response?.data?.message || 'OTP verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black">
      <div className="w-full max-w-5xl grid lg:grid-cols-12 gap-8 items-center">
        
        {/* Left Info Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <Sparkles className="w-4 h-4" />
            <span>Store Rating & Discovery Portal</span>
          </div>

          <h1 className="text-4xl font-extrabold text-white tracking-tight leading-tight">
            Rate, Explore & Manage Local Stores.
          </h1>

          <p className="text-slate-400 text-sm leading-relaxed">
            A comprehensive unified platform with multi-store management for business owners, instant shopper ratings, and high-security 2FA OTP verification for Administrators.
          </p>

          {/* Quick Login Test Accounts */}
          <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl space-y-3">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>🚀 1-Click Quick Demo Login</span>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@example.com')}
                className="flex items-center justify-between p-3 bg-purple-500/10 border border-purple-500/20 hover:border-purple-500/40 rounded-xl text-left transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/20 text-purple-300 rounded-lg">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-purple-200">System Administrator (2FA OTP)</div>
                    <div className="text-[11px] text-purple-400/80">admin@example.com</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('owner1@example.com')}
                className="flex items-center justify-between p-3 bg-amber-500/10 border border-amber-500/20 hover:border-amber-500/40 rounded-xl text-left transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/20 text-amber-300 rounded-lg">
                    <Store className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-amber-200">Store Owner (Tech Haven)</div>
                    <div className="text-[11px] text-amber-400/80">owner1@example.com</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('user1@example.com')}
                className="flex items-center justify-between p-3 bg-emerald-500/10 border border-emerald-500/20 hover:border-emerald-500/40 rounded-xl text-left transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/20 text-emerald-300 rounded-lg">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-emerald-200">Normal User (Jonathan)</div>
                    <div className="text-[11px] text-emerald-400/80">user1@example.com</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>
            <div className="text-[11px] text-slate-500 text-center">
              All test accounts password: <code className="text-slate-400 bg-slate-800 px-1 py-0.5 rounded">Password@123</code>
            </div>
          </div>
        </div>

        {/* Right Form Card */}
        <div className="lg:col-span-7">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            
            {/* ADMIN 2FA OTP VERIFICATION MODAL / VIEW */}
            {isOtpStep ? (
              <div className="space-y-5 animate-in fade-in">
                <div className="flex items-center gap-3 pb-3 border-b border-purple-500/20">
                  <div className="p-3 bg-purple-500/20 text-purple-300 rounded-2xl">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Administrator 2FA Verification</h3>
                    <p className="text-xs text-slate-400">High-Security OTP authentication required</p>
                  </div>
                </div>

                {previewOtp && (
                  <div className="p-3.5 bg-purple-950/80 border border-purple-500/40 rounded-2xl text-xs text-purple-200 space-y-1">
                    <div className="font-bold flex items-center gap-1.5 text-purple-300">
                      <KeyRound className="w-4 h-4 text-purple-400" />
                      <span>Security OTP Code Generated:</span>
                    </div>
                    <div className="text-xl font-mono font-black tracking-widest text-amber-400">
                      {previewOtp}
                    </div>
                    <p className="text-[10px] text-purple-300/70">
                      (Sent to {adminEmailForOtp} • Valid for 5 minutes)
                    </p>
                  </div>
                )}

                {generalError && (
                  <div className="p-3.5 bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl flex items-center gap-2.5 text-sm">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span>{generalError}</span>
                  </div>
                )}

                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                      Enter 6-Digit One-Time Password (OTP)
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={otpCodeInput}
                      onChange={(e) => setOtpCodeInput(e.target.value.replace(/\D/g, ''))}
                      placeholder="e.g. 849201"
                      className="w-full text-center tracking-widest text-2xl font-mono py-3 bg-slate-950 border border-purple-500/50 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-purple-400"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setIsOtpStep(false)}
                      className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-colors"
                    >
                      Back to Login
                    </button>
                    <button
                      type="submit"
                      disabled={loading || otpCodeInput.length !== 6}
                      className="flex-1 py-3 px-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-lg shadow-purple-600/30 text-xs transition-all disabled:opacity-50"
                    >
                      {loading ? 'Verifying...' : 'Verify & Sign In'}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <>
                {/* Tabs */}
                <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800/80 mb-6">
                  <button
                    type="button"
                    onClick={() => { setIsLogin(true); setErrors({}); setGeneralError(''); }}
                    className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${
                      isLogin
                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsLogin(false); setErrors({}); setGeneralError(''); }}
                    className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${
                      !isLogin
                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Register
                  </button>
                </div>

                {/* ROLE SELECTOR */}
                {isLogin ? (
                  <div className="mb-5 bg-slate-950 p-3 rounded-2xl border border-slate-800">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Login as a:
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedLoginRole('USER')}
                        className={`py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                          selectedLoginRole === 'USER'
                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                            : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                        }`}
                      >
                        <User className="w-3.5 h-3.5" />
                        <span>Normal User</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedLoginRole('STORE_OWNER')}
                        className={`py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                          selectedLoginRole === 'STORE_OWNER'
                            ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                            : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                        }`}
                      >
                        <Store className="w-3.5 h-3.5" />
                        <span>Store Owner</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedLoginRole('ADMIN')}
                        className={`py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                          selectedLoginRole === 'ADMIN'
                            ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                            : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                        }`}
                      >
                        <Shield className="w-3.5 h-3.5" />
                        <span>Admin (2FA)</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mb-5 bg-slate-950 p-3 rounded-2xl border border-slate-800">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Register as a:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedRegisterRole('USER')}
                        className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                          selectedRegisterRole === 'USER'
                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                            : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                        }`}
                      >
                        <User className="w-4 h-4" />
                        <span>Normal User (Shopper)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedRegisterRole('STORE_OWNER')}
                        className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                          selectedRegisterRole === 'STORE_OWNER'
                            ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                            : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                        }`}
                      >
                        <Store className="w-4 h-4" />
                        <span>Store Owner</span>
                      </button>
                    </div>
                  </div>
                )}

                {generalError && (
                  <div className="mb-5 p-3.5 bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl flex items-center gap-2.5 text-sm">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span>{generalError}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {!isLogin && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                        Full Name <span className="text-emerald-400">*</span>
                      </label>
                      <div className="relative">
                        <User className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          placeholder="e.g. John Doe"
                          className="w-full pl-11 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors text-sm"
                        />
                      </div>
                      <div className="flex justify-between items-center text-[11px] text-slate-500 mt-1">
                        <span>Min 8, Max 60 characters</span>
                        <span className={formData.name.length >= 8 && formData.name.length <= 60 ? 'text-emerald-400' : 'text-slate-500'}>
                          {formData.name.length}/60
                        </span>
                      </div>
                      {errors.name && <p className="text-xs text-red-400 mt-0.5">{errors.name}</p>}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Email Address <span className="text-emerald-400">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="user@example.com"
                        className="w-full pl-11 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors text-sm"
                      />
                    </div>
                    {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email}</p>}
                  </div>

                  {!isLogin && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                        Personal Address <span className="text-emerald-400">*</span>
                      </label>
                      <div className="relative">
                        <MapPin className="w-5 h-5 text-slate-500 absolute left-3.5 top-3" />
                        <textarea
                          rows={2}
                          value={formData.address}
                          onChange={(e) => handleInputChange('address', e.target.value)}
                          placeholder="e.g. 742 Evergreen Terrace, Springfield, OR 97477"
                          className="w-full pl-11 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors text-sm"
                        />
                      </div>
                      <div className="flex justify-between items-center text-[11px] text-slate-500 mt-1">
                        <span>Max 400 characters</span>
                        <span className={formData.address.length <= 400 ? 'text-emerald-400' : 'text-red-400'}>
                          {formData.address.length}/400
                        </span>
                      </div>
                      {errors.address && <p className="text-xs text-red-400 mt-0.5">{errors.address}</p>}
                    </div>
                  )}

                  {!isLogin && selectedRegisterRole === 'STORE_OWNER' && (
                    <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl space-y-3">
                      <div className="flex items-center gap-2">
                        <Store className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                          Initial Store Details (Subject to Admin Verification)
                        </span>
                      </div>

                      <div>
                        <input
                          type="text"
                          value={formData.storeName}
                          onChange={(e) => handleInputChange('storeName', e.target.value)}
                          placeholder="Store Name (e.g. Urban Books and Coffee)"
                          className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 text-xs"
                        />
                        {errors.storeName && <p className="text-xs text-red-400 mt-0.5">{errors.storeName}</p>}
                      </div>

                      <div>
                        <input
                          type="text"
                          value={formData.storeAddress}
                          onChange={(e) => handleInputChange('storeAddress', e.target.value)}
                          placeholder="Store Address (leave blank to use personal address)"
                          className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 text-xs"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Password <span className="text-emerald-400">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-11 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors text-sm"
                      />
                    </div>
                    {!isLogin && (
                      <div className="text-[11px] text-slate-500 mt-1">
                        8–16 characters, 1 uppercase letter and 1 special character (!@#$%...)
                      </div>
                    )}
                    {errors.password && <p className="text-xs text-red-400 mt-1">{errors.password}</p>}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
                  >
                    {loading ? (
                      <span>Processing...</span>
                    ) : isLogin ? (
                      <>
                        <span>
                          Sign In as {selectedLoginRole === 'STORE_OWNER' ? 'Store Owner' : selectedLoginRole === 'ADMIN' ? 'Admin' : 'Normal User'}
                        </span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>
                          Register as {selectedRegisterRole === 'STORE_OWNER' ? 'Store Owner' : 'Normal User'}
                        </span>
                      </>
                    )}
                  </button>
                </form>
              </>
            )}

          </div>
        </div>

      </div>
    </div>
  );
};