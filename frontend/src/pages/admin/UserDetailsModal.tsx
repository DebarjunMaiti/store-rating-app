import React from 'react';
import { X } from 'lucide-react';
import { StarRating } from '../../components/StarRating';

interface UserDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  loading: boolean;
  user: any | null;
}

export const UserDetailsModal: React.FC<UserDetailsModalProps> = ({
  isOpen,
  onClose,
  loading,
  user
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        {loading ? (
          <div className="py-12 text-center text-slate-400">Loading user details...</div>
        ) : user ? (
          <div className="space-y-6">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-purple-400 mb-1">
                User Profile Inspector
              </div>
              <h3 className="text-2xl font-bold text-white">{user.name}</h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">{user.email}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <div>
                <span className="text-[11px] font-semibold uppercase text-slate-500">Role</span>
                <p className="text-sm font-bold text-slate-200 mt-0.5">{user.role}</p>
              </div>
              <div>
                <span className="text-[11px] font-semibold uppercase text-slate-500">Joined</span>
                <p className="text-sm font-bold text-slate-200 mt-0.5">
                  {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="col-span-2">
                <span className="text-[11px] font-semibold uppercase text-slate-500">Address</span>
                <p className="text-xs text-slate-300 mt-0.5">{user.address}</p>
              </div>
            </div>

            {/* If Store Owner, display Store Overall Average Rating & Reviews */}
            {user.role === 'STORE_OWNER' && user.storeDetails && (
              <div className="space-y-3 bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                      Assigned Store
                    </span>
                    <h4 className="text-base font-bold text-white">{user.storeDetails.name}</h4>
                    <p className="text-xs text-slate-400">{user.storeDetails.address}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                      Store Rating
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <StarRating value={user.storeDetails.averageRating || 0} readOnly size="sm" />
                      <span className="text-base font-black text-amber-400">
                        {user.storeDetails.averageRating 
                          ? user.storeDetails.averageRating.toFixed(1) 
                          : '0.0'}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      ({user.storeDetails.totalRatings} reviews)
                    </span>
                  </div>
                </div>

                {user.storeDetails.ratings && user.storeDetails.ratings.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-amber-500/20 space-y-2">
                    <div className="text-xs font-bold text-slate-300">Ratings Received:</div>
                    <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                      {user.storeDetails.ratings.map((r: any) => (
                        <div key={r.id} className="flex items-center justify-between text-xs bg-slate-900/60 p-2 rounded-xl">
                          <span className="text-slate-300 font-medium">{r.userName}</span>
                          <div className="flex items-center gap-1.5">
                            <StarRating value={r.value} readOnly size="sm" />
                            <span className="font-bold text-amber-400">{r.value}★</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={onClose}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};