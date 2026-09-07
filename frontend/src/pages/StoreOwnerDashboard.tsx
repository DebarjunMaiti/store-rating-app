import React, { useState, useEffect, useCallback } from 'react';
import { Store as StoreIcon, Users, MapPin, Mail, Calendar, Plus, Edit3, ChevronDown, CheckCircle2, AlertCircle, X, RotateCcw, XCircle, Clock, Trash2 } from 'lucide-react';
import api from '../api/client';
import { StoreOwnerDashboardData } from '../types';
import { StarRating } from '../components/StarRating';
import { TableSortHeader } from '../components/TableSortHeader';
import { validateStoreForm } from '../utils/validation';

export const StoreOwnerDashboard: React.FC = () => {
  const [data, setData] = useState<StoreOwnerDashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedStoreIndex, setSelectedStoreIndex] = useState<number>(0);
  const [sort, setSort] = useState({ field: 'submittedAt', order: 'desc' as 'asc' | 'desc' });

  // Add Store Modal
  const [isAddStoreModalOpen, setIsAddStoreModalOpen] = useState(false);
  const [newStore, setNewStore] = useState({ name: '', email: '', address: '' });
  const [addStoreErrors, setAddStoreErrors] = useState<Record<string, string>>({});
  const [addingStore, setAddingStore] = useState(false);

  // Edit Active Store Modal
  const [isEditStoreModalOpen, setIsEditStoreModalOpen] = useState(false);
  const [editStoreData, setEditStoreData] = useState({ name: '', email: '', address: '' });
  const [editStoreErrors, setEditStoreErrors] = useState<Record<string, string>>({});
  const [editingStore, setEditingStore] = useState(false);

  // Delete Store Modal
  const [isDeleteStoreModalOpen, setIsDeleteStoreModalOpen] = useState(false);
  const [deletingStore, setDeletingStore] = useState(false);
  const [cancellingDelete, setCancellingDelete] = useState(false);

  // Re-verify loading state
  const [reverifying, setReverifying] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/store-owner/dashboard', {
        params: {
          sortBy: sort.field,
          sortOrder: sort.order
        }
      });
      if (res.data.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load store owner dashboard data', err);
    } finally {
      setLoading(false);
    }
  }, [sort]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleSort = (field: string) => {
    setSort(prev => ({
      field,
      order: prev.field === field && prev.order === 'asc' ? 'desc' : 'asc'
    }));
  };

  const activeStore = data?.stores && data.stores.length > 0
    ? data.stores[Math.min(selectedStoreIndex, data.stores.length - 1)]
    : null;

  const handleOpenEditModal = () => {
    if (activeStore) {
      setEditStoreData({
        name: activeStore.name,
        email: activeStore.email,
        address: activeStore.address
      });
      setEditStoreErrors({});
      setIsEditStoreModalOpen(true);
    }
  };

  // Add Another Store
  const handleAddStoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddStoreErrors({});

    const val = validateStoreForm(newStore);
    if (!val.isValid) {
      setAddStoreErrors(val.errors);
      return;
    }

    setAddingStore(true);
    try {
      const res = await api.post('/store-owner/stores', newStore);
      if (res.data.success) {
        showToast('success', res.data.message || 'New store created successfully!');
        setIsAddStoreModalOpen(false);
        setNewStore({ name: '', email: '', address: '' });
        await fetchDashboardData();
        if (data && data.stores) {
          setSelectedStoreIndex(data.stores.length);
        }
      }
    } catch (err: any) {
      if (err.response?.data?.errors) {
        setAddStoreErrors(err.response.data.errors);
      } else {
        showToast('error', err.response?.data?.message || 'Failed to add store.');
      }
    } finally {
      setAddingStore(false);
    }
  };

  // Edit Store Details
  const handleEditStoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStore) return;
    setEditStoreErrors({});

    const val = validateStoreForm(editStoreData);
    if (!val.isValid) {
      setEditStoreErrors(val.errors);
      return;
    }

    setEditingStore(true);
    try {
      const res = await api.put(`/store-owner/stores/${activeStore.id}`, editStoreData);
      if (res.data.success) {
        showToast('success', 'Store details updated successfully!');
        setIsEditStoreModalOpen(false);
        fetchDashboardData();
      }
    } catch (err: any) {
      if (err.response?.data?.errors) {
        setEditStoreErrors(err.response.data.errors);
      } else {
        showToast('error', err.response?.data?.message || 'Failed to update store.');
      }
    } finally {
      setEditingStore(false);
    }
  };

  // Submit for Re-verification (for Rejected stores)
  const handleReverifyStore = async (storeId: string) => {
    setReverifying(true);
    try {
      const res = await api.post(`/store-owner/stores/${storeId}/re-verify`);
      if (res.data.success) {
        showToast('success', res.data.message || 'Store resubmitted for verification!');
        fetchDashboardData();
      }
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to resubmit store for verification.');
    } finally {
      setReverifying(false);
    }
  };

  // Request Store Deletion (Sends for Admin Verification)
  const handleRequestDeleteStore = async () => {
    if (!activeStore) return;
    setDeletingStore(true);
    try {
      const res = await api.post(`/store-owner/stores/${activeStore.id}/request-delete`);
      if (res.data.success) {
        showToast('success', res.data.message || 'Store deletion requested. Pending Admin verification.');
        setIsDeleteStoreModalOpen(false);
        fetchDashboardData();
      }
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to request store deletion.');
    } finally {
      setDeletingStore(false);
    }
  };

  // Cancel Store Deletion Request
  const handleCancelDeleteStore = async (storeId: string) => {
    setCancellingDelete(true);
    try {
      const res = await api.post(`/store-owner/stores/${storeId}/cancel-delete`);
      if (res.data.success) {
        showToast('success', res.data.message || 'Store deletion request cancelled.');
        fetchDashboardData();
      }
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to cancel store deletion request.');
    } finally {
      setCancellingDelete(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-400">
        Loading store owner dashboard...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Toast */}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border animate-in slide-in-from-bottom ${
          toastMessage.type === 'success' 
            ? 'bg-emerald-950 border-emerald-500/40 text-emerald-200' 
            : 'bg-red-950 border-red-500/40 text-red-200'
        }`}>
          {toastMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-red-400" />}
          <span className="text-sm font-medium">{toastMessage.text}</span>
        </div>
      )}

      {/* Top Header with Store Switcher Dropdown & Add Store Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-3xl">
        <div className="space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Store Owner Workspace
          </span>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>Manage Your Stores</span>
            {data?.stores && data.stores.length > 0 && (
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                {data.stores.length} store{data.stores.length > 1 ? 's' : ''}
              </span>
            )}
          </h2>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Store Switcher Dropdown with Status Indicators */}
          {data?.stores && data.stores.length > 0 && (
            <div className="relative min-w-[240px]">
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                Active Store Switcher:
              </label>
              <div className="relative">
                <select
                  value={selectedStoreIndex}
                  onChange={(e) => setSelectedStoreIndex(parseInt(e.target.value, 10))}
                  className="w-full appearance-none px-3.5 py-2 bg-slate-950 border border-amber-500/30 hover:border-amber-500/60 rounded-xl text-white text-xs font-bold focus:outline-none focus:border-amber-400 pr-9 transition-colors cursor-pointer"
                >
                  {data.stores.map((s, idx) => {
                    const statusIcon = s.status === 'APPROVED' ? '✅' : s.status === 'REJECTED' ? '❌' : s.status === 'PENDING_DELETION' ? '🗑️' : '⏳';
                    const statusText = s.status === 'APPROVED' ? 'Approved' : s.status === 'REJECTED' ? 'Rejected' : s.status === 'PENDING_DELETION' ? 'Pending Deletion' : 'Pending';
                    return (
                      <option key={s.id} value={idx}>
                        {statusIcon} {s.name} ({statusText})
                      </option>
                    );
                  })}
                </select>
                <ChevronDown className="w-4 h-4 text-amber-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          )}

          {/* Add Another Store Button */}
          <div className="self-end">
            <button
              onClick={() => { setAddStoreErrors({}); setIsAddStoreModalOpen(true); }}
              className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-amber-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>Add Another Store</span>
            </button>
          </div>
        </div>
      </div>

      {(!data?.hasStore || !activeStore) ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-4">
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-3xl inline-flex">
            <StoreIcon className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold text-white">No Stores Yet</h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            You do not have any registered stores yet. Click the button below to add your first store!
          </p>
          <button
            onClick={() => setIsAddStoreModalOpen(true)}
            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-amber-600/20"
          >
            + Register First Store
          </button>
        </div>
      ) : (
        <>
          {/* PENDING DELETION STATUS BANNER */}
          {activeStore.status === 'PENDING_DELETION' && (
            <div className="bg-amber-950/80 border border-amber-500/50 rounded-3xl p-5 shadow-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-in fade-in">
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-2xl flex-shrink-0 mt-0.5">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-amber-200 flex items-center gap-2">
                    <span>Store Deletion Pending Administrator Verification</span>
                  </h4>
                  <p className="text-xs text-amber-300/80 mt-1">
                    You have requested deletion for this store. A System Administrator must review and approve this deletion before the store is permanently deleted. While pending, this store is hidden from customer ratings.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 flex-shrink-0">
                <button
                  onClick={() => handleCancelDeleteStore(activeStore.id)}
                  disabled={cancellingDelete}
                  className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-colors disabled:opacity-50"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${cancellingDelete ? 'animate-spin' : ''}`} />
                  <span>{cancellingDelete ? 'Cancelling...' : 'Cancel Deletion Request'}</span>
                </button>
              </div>
            </div>
          )}

          {/* REJECTED STATUS BANNER */}
          {activeStore.status === 'REJECTED' && (
            <div className="bg-red-950/80 border border-red-500/40 rounded-3xl p-5 shadow-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-in fade-in">
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 bg-red-500/20 text-red-400 rounded-2xl flex-shrink-0 mt-0.5">
                  <XCircle className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-red-200 flex items-center gap-2">
                    <span>Store Verification Application Rejected</span>
                  </h4>
                  <p className="text-xs text-red-300/80 mt-1">
                    A System Administrator reviewed this store application and marked it as rejected. Please check your store details and submit for re-verification when ready.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 flex-shrink-0">
                <button
                  onClick={handleOpenEditModal}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-colors"
                >
                  Edit Details
                </button>
                <button
                  onClick={() => handleReverifyStore(activeStore.id)}
                  disabled={reverifying}
                  className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-red-600/30 transition-all disabled:opacity-50"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${reverifying ? 'animate-spin' : ''}`} />
                  <span>{reverifying ? 'Submitting...' : 'Submit for Re-verification'}</span>
                </button>
              </div>
            </div>
          )}

          {/* PENDING STATUS BANNER */}
          {(!activeStore.status || activeStore.status === 'PENDING') && (
            <div className="bg-amber-950/60 border border-amber-500/30 rounded-3xl p-4 shadow-xl flex items-center gap-3 animate-in fade-in">
              <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl flex-shrink-0">
                <Clock className="w-5 h-5 animate-spin" />
              </div>
              <div>
                <h5 className="text-xs font-bold text-amber-200">Awaiting Administrator Verification</h5>
                <p className="text-[11px] text-amber-300/70">
                  This store is currently under review by a System Administrator. It will become discoverable by shoppers once approved.
                </p>
              </div>
            </div>
          )}

          {/* Active Store Header & Stats */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              
              <div className="md:col-span-7 space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-bold">
                    <StoreIcon className="w-3.5 h-3.5" />
                    <span>Selected Store</span>
                  </div>

                  {/* Status Badge */}
                  {activeStore.status === 'APPROVED' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Approved & Live
                    </span>
                  )}
                  {activeStore.status === 'PENDING_DELETION' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 animate-pulse">
                      <Trash2 className="w-3.5 h-3.5" /> Deletion Pending Approval
                    </span>
                  )}
                  {(!activeStore.status || activeStore.status === 'PENDING') && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 animate-pulse">
                      <Clock className="w-3.5 h-3.5" /> Pending Verification
                    </span>
                  )}
                  {activeStore.status === 'REJECTED' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/15 text-red-300 border border-red-500/30">
                      <XCircle className="w-3.5 h-3.5" /> Rejected
                    </span>
                  )}

                  <button
                    onClick={handleOpenEditModal}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors"
                    title="Edit Store Details"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Edit Store Info</span>
                  </button>

                  {activeStore.status === 'PENDING_DELETION' ? (
                    <button
                      onClick={() => handleCancelDeleteStore(activeStore.id)}
                      disabled={cancellingDelete}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors disabled:opacity-50"
                      title="Cancel Deletion Request"
                    >
                      <RotateCcw className={`w-3.5 h-3.5 text-amber-400 ${cancellingDelete ? 'animate-spin' : ''}`} />
                      <span>Cancel Deletion</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsDeleteStoreModalOpen(true)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-red-950/60 hover:bg-red-900/60 text-red-300 rounded-lg border border-red-800/40 transition-colors"
                      title="Request Store Deletion"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      <span>Delete Store</span>
                    </button>
                  )}
                </div>

                <h1 className="text-3xl font-black text-white tracking-tight">
                  {activeStore.name}
                </h1>
                
                <div className="space-y-1.5 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    <span>{activeStore.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    <span>{activeStore.address}</span>
                  </div>
                </div>
              </div>

              <div className="md:col-span-5 grid grid-cols-2 gap-4">
                {/* Average Rating Card */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center space-y-1.5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Average Rating</p>
                  <div className="flex items-center justify-center gap-2">
                    <StarRating value={activeStore.averageRating || 0} readOnly size="sm" />
                    <span className="text-2xl font-black text-amber-400">
                      {activeStore.averageRating ? activeStore.averageRating.toFixed(1) : '0.0'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500">Scale of 1.0 to 5.0</p>
                </div>

                {/* Total Reviewers Card */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center space-y-1.5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Reviews</p>
                  <div className="flex items-center justify-center gap-1.5">
                    <Users className="w-5 h-5 text-emerald-400" />
                    <span className="text-2xl font-black text-white">
                      {activeStore.totalRatings || 0}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500">Shopper feedback</p>
                </div>
              </div>

            </div>
          </div>

          {/* Reviewers Table */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white">Customer Rating History</h3>
                <p className="text-xs text-slate-400">Reviews submitted for {activeStore.name}</p>
              </div>
              <span className="text-xs font-semibold text-slate-400 bg-slate-800 px-3 py-1 rounded-xl">
                {activeStore.reviewers.length} Review{activeStore.reviewers.length === 1 ? '' : 's'}
              </span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-950 border-b border-slate-800 text-slate-400">
                  <tr>
                    <TableSortHeader
                      label="Customer Name"
                      field="name"
                      currentSortBy={sort.field}
                      currentSortOrder={sort.order}
                      onSort={handleSort}
                    />
                    <TableSortHeader
                      label="Email"
                      field="email"
                      currentSortBy={sort.field}
                      currentSortOrder={sort.order}
                      onSort={handleSort}
                    />
                    <TableSortHeader
                      label="Rating Submitted"
                      field="rating"
                      currentSortBy={sort.field}
                      currentSortOrder={sort.order}
                      onSort={handleSort}
                    />
                    <TableSortHeader
                      label="Date Submitted"
                      field="submittedAt"
                      currentSortBy={sort.field}
                      currentSortOrder={sort.order}
                      onSort={handleSort}
                    />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                  {activeStore.reviewers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-12 text-slate-400">
                        No customers have submitted ratings for this store yet.
                      </td>
                    </tr>
                  ) : (
                    activeStore.reviewers.map((reviewer) => (
                      <tr key={reviewer.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-4 font-bold text-white">
                          {reviewer.userName}
                        </td>
                        <td className="px-4 py-4 text-slate-300 font-mono text-xs">
                          {reviewer.userEmail}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <StarRating value={reviewer.rating} readOnly size="sm" />
                            <span className="font-bold text-amber-400 text-xs">
                              {reviewer.rating} / 5
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-slate-400 text-xs">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-500" />
                            <span>{new Date(reviewer.submittedAt).toLocaleString()}</span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ADD ANOTHER STORE MODAL */}
      {isAddStoreModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative">
            <button
              onClick={() => setIsAddStoreModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-amber-500/10 text-amber-400 rounded-2xl">
                <StoreIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Add Another Store</h3>
                <p className="text-xs text-slate-400">Register an additional store (Subject to Admin Verification)</p>
              </div>
            </div>

            <form onSubmit={handleAddStoreSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Store Name <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  value={newStore.name}
                  onChange={(e) => setNewStore(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Downtown Espresso Lounge"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 text-sm"
                />
                <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                  <span>Min 8, Max 60 characters</span>
                  <span>{newStore.name.length}/60</span>
                </div>
                {addStoreErrors.name && <p className="text-xs text-red-400 mt-0.5">{addStoreErrors.name}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Store Email <span className="text-amber-400">*</span>
                </label>
                <input
                  type="email"
                  value={newStore.email}
                  onChange={(e) => setNewStore(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="contact@storename.com"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 text-sm"
                />
                {addStoreErrors.email && <p className="text-xs text-red-400 mt-1">{addStoreErrors.email}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Store Address <span className="text-amber-400">*</span>
                </label>
                <textarea
                  rows={2}
                  value={newStore.address}
                  onChange={(e) => setNewStore(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Physical street address"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 text-sm"
                />
                <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                  <span>Max 400 characters</span>
                  <span>{newStore.address.length}/400</span>
                </div>
                {addStoreErrors.address && <p className="text-xs text-red-400 mt-0.5">{addStoreErrors.address}</p>}
              </div>

              <div className="pt-3 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddStoreModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingStore}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow-lg shadow-amber-600/20 text-sm disabled:opacity-50"
                >
                  {addingStore ? 'Adding...' : 'Add Store'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT STORE DETAILS MODAL */}
      {isEditStoreModalOpen && activeStore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative">
            <button
              onClick={() => setIsEditStoreModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-amber-500/10 text-amber-400 rounded-2xl">
                <Edit3 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Edit Store Details</h3>
                <p className="text-xs text-slate-400">Modify information for {activeStore.name}</p>
              </div>
            </div>

            <form onSubmit={handleEditStoreSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Store Name <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  value={editStoreData.name}
                  onChange={(e) => setEditStoreData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
                />
                <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                  <span>Min 8, Max 60 characters</span>
                  <span>{editStoreData.name.length}/60</span>
                </div>
                {editStoreErrors.name && <p className="text-xs text-red-400 mt-0.5">{editStoreErrors.name}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Store Email <span className="text-amber-400">*</span>
                </label>
                <input
                  type="email"
                  value={editStoreData.email}
                  onChange={(e) => setEditStoreData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
                />
                {editStoreErrors.email && <p className="text-xs text-red-400 mt-1">{editStoreErrors.email}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Store Address <span className="text-amber-400">*</span>
                </label>
                <textarea
                  rows={2}
                  value={editStoreData.address}
                  onChange={(e) => setEditStoreData(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
                />
                <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                  <span>Max 400 characters</span>
                  <span>{editStoreData.address.length}/400</span>
                </div>
                {editStoreErrors.address && <p className="text-xs text-red-400 mt-0.5">{editStoreErrors.address}</p>}
              </div>

              <div className="pt-3 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditStoreModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editingStore}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow-lg shadow-amber-600/20 text-sm disabled:opacity-50"
                >
                  {editingStore ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE STORE CONFIRMATION MODAL */}
      {isDeleteStoreModalOpen && activeStore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-red-500/30 rounded-3xl w-full max-w-md p-6 shadow-2xl relative space-y-5">
            <button
              onClick={() => setIsDeleteStoreModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-500/10 text-red-400 rounded-2xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Delete Store</h3>
                <p className="text-xs text-slate-400">Submit store deletion request</p>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs text-slate-300">
              <p className="font-semibold text-white">
                Are you sure you want to request deletion for <span className="text-amber-400">"{activeStore.name}"</span>?
              </p>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                As per platform verification policy, deleting a store requires verification and approval by a <strong className="text-slate-200">System Administrator</strong>. Once approved, the store and all associated customer ratings will be permanently removed.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteStoreModalOpen(false)}
                className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRequestDeleteStore}
                disabled={deletingStore}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-lg shadow-red-600/20 text-sm disabled:opacity-50 transition-all"
              >
                <Trash2 className="w-4 h-4" />
                <span>{deletingStore ? 'Submitting Request...' : 'Confirm Deletion Request'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};