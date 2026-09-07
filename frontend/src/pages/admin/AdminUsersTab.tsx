import React from 'react';
import { Search, Shield, Store as StoreIcon, UserCheck, Eye } from 'lucide-react';
import { User } from '../../types';
import { TableSortHeader } from '../../components/TableSortHeader';
import { StarRating } from '../../components/StarRating';

interface AdminUsersTabProps {
  users: User[];
  loading: boolean;
  filter: { search: string; name: string; email: string; address: string; role: string };
  onFilterChange: (key: string, val: string) => void;
  sort: { field: string; order: 'asc' | 'desc' };
  onSort: (field: string) => void;
  onViewDetails: (userId: string) => void;
}

export const AdminUsersTab: React.FC<AdminUsersTabProps> = ({
  users,
  loading,
  filter,
  onFilterChange,
  sort,
  onSort,
  onViewDetails
}) => {
  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800/80">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Global User Search..."
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
            value={filter.role}
            onChange={(e) => onFilterChange('role', e.target.value)}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Roles</option>
            <option value="ADMIN">System Administrator</option>
            <option value="STORE_OWNER">Store Owner</option>
            <option value="USER">Normal User</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-950 border-b border-slate-800 text-slate-400">
            <tr>
              <TableSortHeader
                label="Name"
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
                label="Address"
                field="address"
                currentSortBy={sort.field}
                currentSortOrder={sort.order}
                onSort={onSort}
              />
              <TableSortHeader
                label="Role"
                field="role"
                currentSortBy={sort.field}
                currentSortOrder={sort.order}
                onSort={onSort}
              />
              <th className="px-4 py-3 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Store Owner Rating
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-slate-400">
                  Loading users...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-slate-400">
                  No users found matching the criteria.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3.5 font-bold text-white">
                    {u.name}
                  </td>
                  <td className="px-4 py-3.5 text-slate-300 font-mono text-xs">
                    {u.email}
                  </td>
                  <td className="px-4 py-3.5 text-slate-300 max-w-xs truncate" title={u.address}>
                    {u.address}
                  </td>
                  <td className="px-4 py-3.5">
                    {u.role === 'ADMIN' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                        <Shield className="w-3 h-3" /> Admin
                      </span>
                    )}
                    {u.role === 'STORE_OWNER' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        <StoreIcon className="w-3 h-3" /> Store Owner
                      </span>
                    )}
                    {u.role === 'USER' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        <UserCheck className="w-3 h-3" /> Normal User
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    {u.role === 'STORE_OWNER' ? (
                      u.storeRating !== null && u.storeRating !== undefined ? (
                        <div className="flex items-center gap-1.5">
                          <StarRating value={u.storeRating} readOnly size="sm" />
                          <span className="font-bold text-amber-400 text-xs">
                            {u.storeRating.toFixed(1)}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            ({u.totalRatingsCount} reviews)
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500 italic">No ratings yet</span>
                      )
                    ) : (
                      <span className="text-xs text-slate-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <button
                      onClick={() => onViewDetails(u.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors border border-slate-700"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-400" />
                      <span>Details</span>
                    </button>
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