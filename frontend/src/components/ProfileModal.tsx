import React, { useState, useEffect } from 'react';
import { X, User as UserIcon, Store as StoreIcon, Mail, MapPin, CheckCircle, AlertCircle, Save, Trash2 } from 'lucide-react';
import api from '../api/client';
import { User } from '../types';
import { validateUserForm, validateStoreForm } from '../utils/validation';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onUserUpdated: (updatedUser: User) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onUserUpdated
}) => {
  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email || '',
    address: user.address || ''
  });

  // Store fields (for Store Owner)
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const [storeData, setStoreData] = useState({
    name: '',
    email: '',
    address: ''
  });

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingStore, setDeletingStore] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        address: user.address || ''
      });

      if (user.role === 'STORE_OWNER' && user.stores && user.stores.length > 0) {
        const initialStore = user.stores[0];
        setSelectedStoreId(initialStore.id);
        setStoreData({
          name: initialStore.name,
          email: initialStore.email,
          address: initialStore.address
        });
      }
    }
  }, [user, isOpen]);

  const handleStoreSelect = (storeId: string) => {
    setSelectedStoreId(storeId);
    setDeleteConfirmOpen(false);
    const store = user.stores?.find(s => s.id === storeId);
    if (store) {
      setStoreData({
        name: store.name,
        email: store.email,
        address: store.address
      });
    }
  };

  const handleRequestStoreDelete = async () => {
    if (!selectedStoreId) return;
    setDeletingStore(true);
    setErrors({});
    try {
      const res = await api.post(`/store-owner/stores/${selectedStoreId}/request-delete`);
      if (res.data.success) {
        setSuccessMessage('Store deletion requested! A System Administrator will review and approve.');
        setDeleteConfirmOpen(false);
        const userRes = await api.get('/auth/profile');
        if (userRes.data?.user) {
          onUserUpdated(userRes.data.user);
          localStorage.setItem('user', JSON.stringify(userRes.data.user));
        }
        setTimeout(() => {
          onClose();
          setSuccessMessage('');
        }, 1500);
      }
    } catch (err: any) {
      setErrors({ general: err.response?.data?.message || 'Failed to request store deletion.' });
    } finally {
      setDeletingStore(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSuccessMessage('');

    // Validate User fields
    const userVal = validateUserForm({
      name: formData.name,
      email: formData.email,
      address: formData.address,
      isPasswordRequired: false
    });

    if (!userVal.isValid) {
      setErrors(userVal.errors);
      return;
    }

    // If Store Owner with selected store, validate store fields too
    if (user.role === 'STORE_OWNER' && selectedStoreId) {
      const storeVal = validateStoreForm({
        name: storeData.name,
        email: storeData.email,
        address: storeData.address
      });

      if (!storeVal.isValid) {
        setErrors(prev => ({ ...prev, ...storeVal.errors }));
        return;
      }
    }

    setLoading(true);
    try {
      const payload: any = {
        name: formData.name,
        email: formData.email,
        address: formData.address
      };

      if (user.role === 'STORE_OWNER' && selectedStoreId) {
        payload.storeId = selectedStoreId;
        payload.storeName = storeData.name;
        payload.storeEmail = storeData.email;
        payload.storeAddress = storeData.address;
      }

      const res = await api.put('/auth/profile', payload);

      if (res.data.success) {
        setSuccessMessage('Profile updated successfully!');
        if (res.data.token) {
          localStorage.setItem('token', res.data.token);
        }
        localStorage.setItem('user', JSON.stringify(res.data.user));
        onUserUpdated(res.data.user);

        setTimeout(() => {
          onClose();
          setSuccessMessage('');
        }, 1200);
      }
    } catch (err: any) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        setErrors({ general: err.response?.data?.message || 'Failed to update profile.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl">
            <UserIcon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Profile & Account Settings</h3>
            <p className="text-xs text-slate-400">Manage your personal and store details</p>
          </div>
        </div>

        {successMessage && (
          <div className="mb-4 p-3.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 rounded-xl flex items-center gap-2.5 text-sm">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {errors.general && (
          <div className="mb-4 p-3.5 bg-red-500/15 border border-red-500/30 text-red-300 rounded-xl flex items-center gap-2.5 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{errors.general}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* PERSONAL INFORMATION SECTION */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3.5">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800/80">
              <UserIcon className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Personal Information
              </h4>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Full Name <span className="text-emerald-400">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Jonathan Alexander Smith"
                className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-sm"
              />
              <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                <span>Min 8, Max 60 characters</span>
                <span>{formData.name.length}/60</span>
              </div>
              {errors.name && <p className="text-xs text-red-400 mt-0.5">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Email Address <span className="text-emerald-400">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="user@example.com"
                  className="w-full pl-9 pr-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-sm"
                />
              </div>
              {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Address <span className="text-emerald-400">*</span>
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="e.g. 742 Evergreen Terrace, Springfield, OR 97477"
                  className="w-full pl-9 pr-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-sm"
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                <span>Max 400 characters</span>
                <span>{formData.address.length}/400</span>
              </div>
              {errors.address && <p className="text-xs text-red-400 mt-0.5">{errors.address}</p>}
            </div>
          </div>

          {/* STORE INFORMATION SECTION (Store Owner Only) */}
          {user.role === 'STORE_OWNER' && user.stores && user.stores.length > 0 && (
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <StoreIcon className="w-4 h-4 text-amber-400" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Store Information
                  </h4>
                </div>
                {user.stores.length > 1 && (
                  <span className="text-[11px] text-amber-400 font-semibold">
                    {user.stores.length} Stores Owned
                  </span>
                )}
              </div>

              {user.stores.length > 1 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Select Store To Edit
                  </label>
                  <select
                    value={selectedStoreId}
                    onChange={(e) => handleStoreSelect(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
                  >
                    {user.stores.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Store Name <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  value={storeData.name}
                  onChange={(e) => setStoreData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Store Business Name"
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-sm"
                />
                <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                  <span>Min 8, Max 60 characters</span>
                  <span>{storeData.name.length}/60</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Store Email <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={storeData.email}
                    onChange={(e) => setStoreData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="contact@storename.com"
                    className="w-full pl-9 pr-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-sm"
                  />
                </div>
                {errors.storeEmail && <p className="text-xs text-red-400 mt-1">{errors.storeEmail}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Store Address <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <textarea
                    rows={2}
                    value={storeData.address}
                    onChange={(e) => setStoreData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Physical store address"
                    className="w-full pl-9 pr-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-sm"
                  />
                </div>
              </div>

              {/* Store Deletion Action */}
              <div className="pt-2 border-t border-slate-800/80">
                {!deleteConfirmOpen ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-300">Delete this store</p>
                      <p className="text-[10px] text-slate-500">Requires System Admin verification and approval</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmOpen(true)}
                      className="px-3 py-1.5 bg-red-950/60 hover:bg-red-900/60 text-red-300 border border-red-800/40 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      <span>Delete Store</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-3 bg-red-950/60 border border-red-500/30 rounded-xl space-y-2">
                    <p className="text-xs text-red-200 font-bold flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-red-400" />
                      <span>Confirm Store Deletion Request</span>
                    </p>
                    <p className="text-[11px] text-red-300/80">
                      Request deletion for "{storeData.name}"? A System Administrator will review and verify this deletion before permanent removal.
                    </p>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmOpen(false)}
                        className="px-2.5 py-1 text-xs text-slate-400 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleRequestStoreDelete}
                        disabled={deletingStore}
                        className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
                      >
                        {deletingStore ? 'Submitting...' : 'Confirm Delete Request'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Saving Changes...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};