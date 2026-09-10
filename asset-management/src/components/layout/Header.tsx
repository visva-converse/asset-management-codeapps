import React from 'react';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import type { DataverseRole } from '../../types';
import { Shield, User, Menu } from 'lucide-react';

interface HeaderProps {
  onMenuToggle?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuToggle }) => {
  const { user, activeRole } = useCurrentUser();

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const getRoleColor = (role: DataverseRole) => {
    switch (role) {
      case 'Asset Management - IT Administrator':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Asset Management - Asset Administrator':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Asset Management - Manager':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Asset Management - Employee':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-rose-50 text-rose-700 border-rose-200';
    }
  };

  return (
    <header className="h-16 shrink-0 bg-white border-b border-slate-200/90 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-2xs select-none">
      {/* Left: Hamburger (mobile/tablet) & Branding */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={onMenuToggle}
          aria-label="Toggle navigation menu"
          className="lg:hidden p-1.5 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-xs shrink-0 tracking-tight">
          AM
        </div>
        <div className="min-w-0">
          <h1 className="text-sm sm:text-base font-bold text-slate-900 leading-none truncate">
            Asset Management
          </h1>
          <span className="text-[11px] text-slate-500 font-medium hidden sm:inline-block">
            Microsoft Power Apps Enterprise
          </span>
        </div>
      </div>

      {/* Right: Role Badge & User Profile */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {/* Read-only Dataverse Security Role Badge */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg border text-xs font-semibold ${getRoleColor(activeRole)}`}
          title={`Assigned Dataverse Security Role: ${activeRole}`}
        >
          <Shield className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate max-w-[200px] sm:max-w-none">
            {activeRole}
          </span>
        </div>

        {/* Current Authenticated User Info */}
        <div className="flex items-center gap-2 sm:gap-3 pl-2 border-l border-slate-200">
          <div
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-xs ring-2 ring-blue-100 shrink-0"
            title={user?.fullName || 'Signed-in User'}
          >
            {user ? getInitials(user.fullName) : <User className="w-4 h-4" />}
          </div>
          <div className="hidden md:block text-left max-w-[160px] lg:max-w-[200px]">
            <div className="text-xs sm:text-sm font-semibold text-slate-800 leading-tight truncate">
              {user?.fullName || 'Loading user...'}
            </div>
            <div className="text-[11px] text-slate-500 leading-tight truncate">
              {user?.userPrincipalName || ''}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
