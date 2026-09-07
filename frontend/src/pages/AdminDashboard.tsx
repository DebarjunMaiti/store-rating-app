import React, { useState, useEffect, useCallback } from 'react';
import { Store as StoreIcon, Users, Plus, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../api/client';
import { User, Store, AdminStats } from '../types';
import { AdminStatsCards } from './admin/AdminStatsCards';
import { AdminStoresTab } from './admin/AdminStoresTab';
import { AdminUsersTab } from './admin/AdminUsersTab';
import { AddStoreModal } from './admin/AddStoreModal';
import { AddUserModal } from './admin/AddUserModal';
import { UserDetailsModal } from './admin/UserDetailsModal';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'stores' | 'users'>('stores');
  const [stats, setStats] = useState<AdminStats | null>(null);
  
  // Stores State
  const [stores, setStores] = useState<Store[]>([]);
  const [storesLoading, setStoresLoading] = useState(false);
  const [storeFilter, setStoreFilter] = useState({ search: '', name: '', email: '', address: '' });
  const [storeSort, setStoreSort] = useState({ field: 'createdAt', order: 'desc' as 'asc' | 'desc' });
  const [isAddStoreModalOpen, setIsAddStoreModalOpen] = useState(false);
  const [availableOwners, setAvailableOwners] = useState<{ id: string; name: string; email: string; role: string }[]>([]);

  // Users State
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userFilter, setUserFilter] = useState({ search: '', name: '', email: '', address: '', role: 'ALL' });
  const [userSort, setUserSort] = useState({ field: 'createdAt', order: 'desc' as 'asc' | 'desc' });
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);

  // User Details Modal
  const [selectedUserDetails, setSelectedUserDetails] = useState<any | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Alerts
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/dashboard-stats');
      if (res.data.success) {
        setStats(res.data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch admin stats', err);
    }
  };

  const fetchStores = useCallback(async () => {
    setStoresLoading(true);
    try {
      const params: any = {
        sortBy: storeSort.field,
        sortOrder: storeSort.order
      };
      if (storeFilter.search) params.search = storeFilter.search;
      if (storeFilter.name) params.name = storeFilter.name;
      if (storeFilter.email) params.email = storeFilter.email;
      if (storeFilter.address) params.address = storeFilter.address;

      const res = await api.get('/admin/stores', { params });
      if (res.data.success) {
        setStores(res.data.stores);
      }
    } catch (err) {
      console.error('Failed to fetch stores', err);
    } finally {
      setStoresLoading(false);
    }
  }, [storeFilter, storeSort]);

  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const params: any = {
        sortBy: userSort.field,
        sortOrder: userSort.order
      };
      if (userFilter.search) params.search = userFilter.search;
      if (userFilter.name) params.name = userFilter.name;
      if (userFilter.email) params.email = userFilter.email;
      if (userFilter.address) params.address = userFilter.address;
      if (userFilter.role && userFilter.role !== 'ALL') params.role = userFilter.role;

      const res = await api.get('/admin/users', { params });
      if (res.data.success) {
        setUsers(res.data.users);
      }
    } catch (err) {
      console.error('Failed to fetch users', err);
    } finally {
      setUsersLoading(false);
    }
  }, [userFilter, userSort]);

  const fetchOwners = async () => {
    try {
      const res = await api.get('/admin/store-owners');
      if (res.data.success) {
        setAvailableOwners(res.data.owners);
      }
    } catch (err) {
      console.error('Failed to fetch store owners', err);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'stores') {
      fetchStores();
    } else {
      fetchUsers();
    }
  }, [activeTab, fetchStores, fetchUsers]);

  const handleStoreSort = (field: string) => {
    setStoreSort(prev => ({
      field,
      order: prev.field === field && prev.order === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleUserSort = (field: string) => {
    setUserSort(prev => ({
      field,
      order: prev.field === field && prev.order === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleViewUserDetails = async (userId: string) => {
    setDetailsLoading(true);
    setIsDetailsModalOpen(true);
    try {
      const res = await api.get('/admin/users/' + userId);
      if (res.data.success) {
        setSelectedUserDetails(res.data.user);
      }
    } catch (err) {
      showToast('error', 'Failed to load user details.');
      setIsDetailsModalOpen(false);
    } finally {
      setDetailsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border ${
          toastMessage.type === 'success' 
            ? 'bg-emerald-950 border-emerald-500/40 text-emerald-200' 
            : 'bg-red-950 border-red-500/40 text-red-200'
        }`}>
          {toastMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-red-400" />}
          <span className="text-sm font-medium">{toastMessage.text}</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Administrator Control Center
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage stores, monitor platform users, inspect store ratings, and govern system entities.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => { setIsAddStoreModalOpen(true); fetchOwners(); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-emerald-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add Store</span>
          </button>
          <button
            onClick={() => setIsAddUserModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-purple-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add User</span>
          </button>
        </div>
      </div>

      <AdminStatsCards stats={stats} />

      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
        <div className="flex border-b border-slate-800 gap-6">
          <button
            onClick={() => setActiveTab('stores')}
            className={`pb-3.5 font-bold text-sm flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'stores'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <StoreIcon className="w-4 h-4" />
            <span>Stores Management ({stores.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-3.5 font-bold text-sm flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'users'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Users Management ({users.length})</span>
          </button>
        </div>

        {activeTab === 'stores' && (
          <AdminStoresTab
            stores={stores}
            loading={storesLoading}
            filter={storeFilter}
            onFilterChange={(k, v) => setStoreFilter(prev => ({ ...prev, [k]: v }))}
            sort={storeSort}
            onSort={handleStoreSort}
            onRefresh={() => { fetchStores(); fetchStats(); }}
            showToast={showToast}
          />
        )}

        {activeTab === 'users' && (
          <AdminUsersTab
            users={users}
            loading={usersLoading}
            filter={userFilter}
            onFilterChange={(k, v) => setUserFilter(prev => ({ ...prev, [k]: v }))}
            sort={userSort}
            onSort={handleUserSort}
            onViewDetails={handleViewUserDetails}
          />
        )}
      </div>

      <AddStoreModal
        isOpen={isAddStoreModalOpen}
        onClose={() => setIsAddStoreModalOpen(false)}
        onStoreAdded={() => { fetchStores(); fetchStats(); }}
        availableOwners={availableOwners}
        showToast={showToast}
      />

      <AddUserModal
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
        onUserAdded={() => { fetchUsers(); fetchStats(); }}
        showToast={showToast}
      />

      <UserDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        loading={detailsLoading}
        user={selectedUserDetails}
      />
    </div>
  );
};