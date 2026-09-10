import React from 'react';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import type { DataverseRole } from '../../types';
import { Shield, ChevronDown, User } from 'lucide-react';

interface HeaderProps {
  onMenuToggle?: () => void;
}

export const Header: React.FC<HeaderProps> = () => {
  const { user, activeRole, setActiveRole, availableRoles } = useCurrentUser();

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
      default:
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
      {/* Left: Branding / Title */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-base shadow-xs">
          AM
        </div>
        <div>
          <h1 className="text-base font-semibold text-slate-900 leading-none">
            Asset Management Enterprise
          </h1>
          <span className="text-xs text-slate-500 font-medium">
            Microsoft Power Apps Code App
          </span>
        </div>
      </div>

      {/* Right: Role Switcher & User Profile */}
      <div className="flex items-center gap-4">
        {/* Role Simulator Switcher */}
        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
          <Shield className="w-4 h-4 text-slate-500" />
          <span className="text-xs text-slate-500 font-medium hidden sm:inline">Role:</span>
          <div className="relative">
            <select
              value={activeRole}
              onChange={(e) => setActiveRole(e.target.value as DataverseRole)}
              className={`appearance-none text-xs font-semibold px-2.5 py-1 pr-6 rounded-md border cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 ${getRoleColor(
                activeRole
              )}`}
              title="Switch role to simulate permissions for testing"
            >
              {availableRoles.map((role) => (
                <option key={role} value={role}>
                  {role.replace('Asset Management - ', '')}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Current User Info (fullName and userPrincipalName) */}
        <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
          <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-xs ring-2 ring-blue-100">
            {user ? getInitials(user.fullName) : <User className="w-4 h-4" />}
          </div>
          <div className="hidden md:block text-left">
            <div className="text-sm font-semibold text-slate-800 leading-tight">
              {user?.fullName || 'Visva V'}
            </div>
            <div className="text-xs text-slate-500 leading-tight">
              {user?.userPrincipalName || 'visva@company.com'}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
