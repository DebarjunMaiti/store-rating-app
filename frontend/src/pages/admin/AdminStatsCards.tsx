import React from 'react';
import { Users, Store as StoreIcon, Star, Clock } from 'lucide-react';
import { AdminStats } from '../../types';

interface AdminStatsCardsProps {
  stats: AdminStats | null;
}

export const AdminStatsCards: React.FC<AdminStatsCardsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Users</p>
            <h3 className="text-3xl font-black text-white mt-1.5">{stats?.totalUsers ?? '...'}</h3>
            <p className="text-xs text-slate-400 mt-2">
              <span className="text-purple-400 font-semibold">{stats?.roleCounts.admin ?? 0} Admins</span> •{' '}
              <span className="text-amber-400 font-semibold">{stats?.roleCounts.storeOwner ?? 0} Owners</span>
            </p>
          </div>
          <div className="p-3.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-2xl">
            <Users className="w-7 h-7" />
          </div>
        </div>
      </div>

      <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Approved Stores</p>
            <h3 className="text-3xl font-black text-emerald-400 mt-1.5">{stats?.approvedStoresCount ?? stats?.totalStores ?? '...'}</h3>
            <p className="text-xs text-slate-400 mt-2">Live & open for ratings</p>
          </div>
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl">
            <StoreIcon className="w-7 h-7" />
          </div>
        </div>
      </div>

      <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-amber-400">Pending Approvals</p>
            <h3 className="text-3xl font-black text-amber-400 mt-1.5">{stats?.pendingStoresCount ?? 0}</h3>
            <p className="text-xs text-slate-400 mt-2">
              {stats?.deletionRequestsCount ? (
                <span className="text-red-400 font-bold">+{stats.deletionRequestsCount} Deletion Requests</span>
              ) : (
                'Store registration reviews'
              )}
            </p>
          </div>
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl">
            <Clock className="w-7 h-7" />
          </div>
        </div>
      </div>

      <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Submitted Ratings</p>
            <h3 className="text-3xl font-black text-white mt-1.5">{stats?.totalRatings ?? '...'}</h3>
            <p className="text-xs text-slate-400 mt-2">Shopper reviews (1–5 stars)</p>
          </div>
          <div className="p-3.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-2xl">
            <Star className="w-7 h-7" />
          </div>
        </div>
      </div>
    </div>
  );
};