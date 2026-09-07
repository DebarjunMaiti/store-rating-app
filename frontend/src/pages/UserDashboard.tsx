import React, { useState, useEffect, useCallback } from 'react';
import { Search, Store as StoreIcon, CheckCircle2, AlertCircle, Sparkles, MapPin, Check } from 'lucide-react';
import api from '../api/client';
import { Store } from '../types';
import { TableSortHeader } from '../components/TableSortHeader';
import { StarRating } from '../components/StarRating';

export const UserDashboard: React.FC = () => {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState({ search: '', name: '', address: '' });
  const [sort, setSort] = useState({ field: 'name', order: 'asc' as 'asc' | 'desc' });
  
  // Rating state
  const [ratingSubmittingId, setRatingSubmittingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchStores = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        sortBy: sort.field,
        sortOrder: sort.order
      };
      if (filter.search) params.search = filter.search;
      if (filter.name) params.name = filter.name;
      if (filter.address) params.address = filter.address;

      const res = await api.get('/user/stores', { params });
      if (res.data.success) {
        setStores(res.data.stores);
      }
    } catch (err) {
      console.error('Failed to load stores', err);
    } finally {
      setLoading(false);
    }
  }, [filter, sort]);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  const handleSort = (field: string) => {
    setSort(prev => ({
      field,
      order: prev.field === field && prev.order === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleRateStore = async (storeId: string, ratingValue: number) => {
    setRatingSubmittingId(storeId);
    try {
      const res = await api.post('/user/ratings', {
        storeId,
        rating: ratingValue
      });

      if (res.data.success) {
        showToast('success', `Submitted ${ratingValue}★ rating successfully!`);
        // Update local state directly for instant snappy feedback
        setStores(prev => prev.map(s => {
          if (s.id === storeId) {
            return {
              ...s,
              overallRating: res.data.overallRating,
              totalRatings: res.data.totalRatings,
              userSubmittedRating: ratingValue
            };
          }
          return s;
        }));
      }
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to submit rating.');
    } finally {
      setRatingSubmittingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
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

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-500/20 rounded-3xl p-6 sm:p-8 relative overflow-hidden">
        <div className="max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Community Store Ratings</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Discover & Rate Registered Stores
          </h1>
          <p className="text-slate-400 text-sm">
            Search nearby stores by name and address. Share your honest feedback by submitting or modifying ratings from 1 to 5 stars anytime.
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800/80">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search Name or Address..."
              value={filter.search}
              onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <input
              type="text"
              placeholder="Filter by Store Name..."
              value={filter.name}
              onChange={(e) => setFilter(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <input
              type="text"
              placeholder="Filter by Address..."
              value={filter.address}
              onChange={(e) => setFilter(prev => ({ ...prev, address: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Stores Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950 border-b border-slate-800 text-slate-400">
              <tr>
                <TableSortHeader
                  label="Store Name"
                  field="name"
                  currentSortBy={sort.field}
                  currentSortOrder={sort.order}
                  onSort={handleSort}
                />
                <TableSortHeader
                  label="Address"
                  field="address"
                  currentSortBy={sort.field}
                  currentSortOrder={sort.order}
                  onSort={handleSort}
                />
                <TableSortHeader
                  label="Overall Rating"
                  field="overallRating"
                  currentSortBy={sort.field}
                  currentSortOrder={sort.order}
                  onSort={handleSort}
                />
                <th className="px-4 py-3 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Your Rating
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Rate / Modify (1–5 Stars)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-slate-400">
                    Loading stores...
                  </td>
                </tr>
              ) : stores.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-slate-400">
                    No stores found matching your search.
                  </td>
                </tr>
              ) : (
                stores.map((store) => (
                  <tr key={store.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-800 text-emerald-400 rounded-xl border border-slate-700">
                          <StoreIcon className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-white text-sm">{store.name}</span>
                      </div>
                    </td>

                    <td className="px-4 py-4 text-slate-300 max-w-xs">
                      <div className="flex items-start gap-1.5 text-xs">
                        <MapPin className="w-3.5 h-3.5 text-slate-500 mt-0.5 flex-shrink-0" />
                        <span>{store.address}</span>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <StarRating value={store.overallRating} readOnly size="sm" />
                        <span className="font-black text-amber-400 text-xs">
                          {store.overallRating > 0 ? store.overallRating.toFixed(1) : 'Unrated'}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          ({store.totalRatings} review{store.totalRatings === 1 ? '' : 's'})
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      {store.userSubmittedRating ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-bold">
                          <Check className="w-3.5 h-3.5" />
                          <span>Rated: {store.userSubmittedRating}★</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500 italic">Not rated yet</span>
                      )}
                    </td>

                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <StarRating
                          value={store.userSubmittedRating || 0}
                          size="md"
                          onChange={(newVal) => handleRateStore(store.id, newVal)}
                        />
                        {ratingSubmittingId === store.id && (
                          <span className="text-xs text-emerald-400 animate-pulse font-medium">Saving...</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};