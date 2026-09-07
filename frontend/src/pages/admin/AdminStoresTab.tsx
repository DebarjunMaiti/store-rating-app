import React from 'react';
import { Search, CheckCircle, XCircle, Clock, AlertTriangle, Trash2 } from 'lucide-react';
import { Store } from '../../types';
import { TableSortHeader } from '../../components/TableSortHeader';
import { StarRating } from '../../components/StarRating';
import api from '../../api/client';

interface AdminStoresTabProps {
  stores: Store[];
  loading: boolean;
  filter: { search: string; name: string; email: string; address: string; status?: string };
  onFilterChange: (key: string, val: string) => void;
  sort: { field: string; order: 'asc' | 'desc' };
  onSort: (field: string) => void;
  onRefresh: () => void;
  showToast: (type: 'success' | 'error', text: string) => void;
}

export const AdminStoresTab: React.FC<AdminStoresTabProps> = ({
  stores,
  loading,
  filter,
  onFilterChange,
  sort,
  onSort,
  onRefresh,
  showToast
}) => {
  const handleUpdateStatus = async (storeId: string, newStatus: string) => {
    try {
      const res = await api.put(`/admin/stores/${storeId}/status`, { status: newStatus });
      if (res.data.success) {
        showToast('success', res.data.message);
        onRefresh();
      }
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to update store status.');
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800/80">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Global Store Search..."
            value={filter.search}
            onChange={(e) => onFilterChange('search', e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <input
            type="text"
            placeholder="Filter by Name..."
            value={filter.name}
            onChange={(e) => onFilterChange('name', e.target.value)}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <input
            type="text"
            placeholder="Filter by Email..."
            value={filter.email}
            onChange={(e) => onFilterChange('email', e.target.value)}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <input
            type="text"
            placeholder="Filter by Address..."
            value={filter.address}
            onChange={(e) => onFilterChange('address', e.target.value)}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <select
            value={filter.status || 'ALL'}
            onChange={(e) => onFilterChange('status', e.target.value)}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 font-semibold"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">⏳ Pending Verification</option>
            <option value="PENDING_DELETION">⚠️ Deletion Requests</option>
            <option value="APPROVED">✅ Approved & Live</option>
            <option value="REJECTED">❌ Rejected</option>
          </select>
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
                onSort={onSort}
              />
              <TableSortHeader
                label="Email"
                field="email"
                currentSortBy={sort.field}
                currentSortOrder={sort.order}
                onSort={onSort}
              />
              <TableSortHeader
                label="Status"
                field="status"
                currentSortBy={sort.field}
                currentSortOrder={sort.order}
                onSort={onSort}
              />
              <TableSortHeader
                label="Overall Rating"
                field="rating"
                currentSortBy={sort.field}
                currentSortOrder={sort.order}
                onSort={onSort}
              />
              <th className="px-4 py-3 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Store Owner
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Verification & Approval Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-slate-400">
                  Loading stores...
                </td>
              </tr>
            ) : stores.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-slate-400">
                  No stores found matching the criteria.
                </td>
              </tr>
            ) : (
              stores.map((store) => (
                <tr key={store.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="font-bold text-white">{store.name}</div>
                    <div className="text-[11px] text-slate-400 truncate max-w-xs">{store.address}</div>
                  </td>

                  <td className="px-4 py-3.5 text-slate-300 font-mono text-xs">
                    {store.email}
                  </td>

                  <td className="px-4 py-3.5">
                    {store.status === 'APPROVED' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        <CheckCircle className="w-3.5 h-3.5" /> Approved
                      </span>
                    )}
                    {(!store.status || store.status === 'PENDING') && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 animate-pulse">
                        <Clock className="w-3.5 h-3.5" /> Pending Approval
                      </span>
                    )}
                    {store.status === 'PENDING_DELETION' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-500/15 text-orange-300 border border-orange-500/30 animate-pulse">
                        <AlertTriangle className="w-3.5 h-3.5" /> Deletion Requested
                      </span>
                    )}
                    {store.status === 'REJECTED' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-500/15 text-red-300 border border-red-500/30">
                        <XCircle className="w-3.5 h-3.5" /> Rejected
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <StarRating value={store.overallRating} readOnly size="sm" />
                      <span className="font-bold text-amber-400 text-xs">
                        {store.overallRating > 0 ? store.overallRating.toFixed(1) : 'Unrated'}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        ({store.totalRatings} review{store.totalRatings === 1 ? '' : 's'})
                      </span>
                    </div>
                  </td>

                  <td className="px-4 py-3.5">
                    {store.owner ? (
                      <div>
                        <div className="font-medium text-slate-200 text-xs">{store.owner.name}</div>
                        <div className="text-[11px] text-slate-500">{store.owner.email}</div>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500 italic">Unassigned</span>
                    )}
                  </td>

                  <td className="px-4 py-3.5 text-right">
                    {/* Actions when store deletion is requested */}
                    {store.status === 'PENDING_DELETION' ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleUpdateStatus(store.id, 'APPROVE_DELETION')}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-red-600 hover:bg-red-500 text-white rounded-lg shadow-sm transition-all"
                          title="Approve Deletion and Permanently Remove Store"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Approve Deletion</span>
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(store.id, 'REJECT_DELETION')}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-all"
                          title="Reject Deletion and Keep Store Active"
                        >
                          <span>Reject Deletion</span>
                        </button>
                      </div>
                    ) : store.status === 'PENDING' || !store.status ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleUpdateStatus(store.id, 'APPROVED')}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-sm transition-all"
                          title="Approve Store Registration"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(store.id, 'REJECTED')}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 rounded-lg transition-all"
                          title="Reject Store Registration"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </div>
                    ) : store.status === 'APPROVED' ? (
                      <button
                        onClick={() => handleUpdateStatus(store.id, 'REJECTED')}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-slate-800 hover:bg-red-950 text-slate-300 hover:text-red-300 border border-slate-700 hover:border-red-500/40 rounded-lg transition-colors"
                      >
                        Revoke Approval
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUpdateStatus(store.id, 'APPROVED')}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-slate-800 hover:bg-emerald-950 text-slate-300 hover:text-emerald-300 border border-slate-700 hover:border-emerald-500/40 rounded-lg transition-colors"
                      >
                        Re-Approve
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};