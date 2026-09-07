import React, { useState } from 'react';
import { LogOut, Key, User as UserIcon, Shield, Store, Sparkles, Settings } from 'lucide-react';
import { User } from '../types';
import { ChangePasswordModal } from './ChangePasswordModal';
import { ProfileModal } from './ProfileModal';

interface NavbarProps {
  user: User;
  onLogout: () => void;
  onUserUpdated: (updatedUser: User) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, onLogout, onUserUpdated }) => {
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const getRoleBadge = () => {
    switch (user.role) {
      case 'ADMIN':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30">
            <Shield className="w-3.5 h-3.5" />
            System Administrator
          </span>
        );
      case 'STORE_OWNER':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <Store className="w-3.5 h-3.5" />
            Store Owner
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <UserIcon className="w-3.5 h-3.5" />
            Normal User
          </span>
        );
    }
  };

  return (
    <>
      <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-black tracking-tight text-white flex items-center gap-1">
                  Store<span className="text-emerald-400">Rate</span>
                </span>
                <span className="hidden sm:block text-[10px] text-slate-400 -mt-1 font-medium tracking-wide">
                  RATING & MANAGEMENT PLATFORM
                </span>
              </div>
            </div>

            {/* User Info & Actions */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              <button
                onClick={() => setIsProfileModalOpen(true)}
                className="text-right hidden md:block hover:opacity-80 transition-opacity text-left cursor-pointer"
                title="Click to edit profile"
              >
                <div className="text-sm font-semibold text-slate-200 truncate max-w-[180px]">
                  {user.name}
                </div>
                <div className="text-xs text-slate-400 truncate max-w-[180px]">
                  {user.email}
                </div>
              </button>

              {getRoleBadge()}

              {/* Profile Button */}
              <button
                onClick={() => setIsProfileModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                title="Profile & Settings"
              >
                <Settings className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Profile</span>
              </button>

              {/* Change Password Button */}
              <button
                onClick={() => setIsPasswordModalOpen(true)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700/60 transition-colors"
                title="Change Password"
              >
                <Key className="w-4 h-4" />
              </button>

              {/* Logout Button */}
              <button
                onClick={onLogout}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
                title="Log Out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Log out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={user}
        onUserUpdated={onUserUpdated}
      />

      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </>
  );
};