import React from 'react';
import { usePermission } from '../../hooks/usePermission';
import { AppPermissions } from '../../permissions/permissions';
import {
  LayoutDashboard,
  Laptop,
  ClipboardList,
  CheckSquare,
  ArrowLeftRight,
  Wrench,
  Tags,
  MapPin,
} from 'lucide-react';

export type ActivePage =
  | 'dashboard'
  | 'assets'
  | 'requests'
  | 'approvals'
  | 'assignments'
  | 'maintenance'
  | 'categories'
  | 'locations';

interface SidebarProps {
  activePage: ActivePage;
  onSelectPage: (page: ActivePage) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activePage, onSelectPage }) => {
  const { hasPermission, activeRole } = usePermission();

  const isEmployee = activeRole === 'Asset Management - Employee';

  const navItems = [
    {
      id: 'dashboard' as ActivePage,
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-4 h-4" />,
      visible: true,
    },
    {
      id: 'assets' as ActivePage,
      label: 'Assets',
      icon: <Laptop className="w-4 h-4" />,
      visible: hasPermission(AppPermissions.VIEW_ASSETS),
    },
    {
      id: 'requests' as ActivePage,
      label: isEmployee ? 'My Requests' : 'Requests',
      icon: <ClipboardList className="w-4 h-4" />,
      visible: hasPermission(AppPermissions.VIEW_REQUESTS),
    },
    {
      id: 'approvals' as ActivePage,
      label: 'Manager Approvals',
      icon: <CheckSquare className="w-4 h-4" />,
      visible:
        hasPermission(AppPermissions.APPROVE_REQUEST) ||
        hasPermission(AppPermissions.REJECT_REQUEST),
    },
    {
      id: 'assignments' as ActivePage,
      label: 'Asset Assignments',
      icon: <ArrowLeftRight className="w-4 h-4" />,
      visible:
        hasPermission(AppPermissions.ASSIGN_ASSET) ||
        hasPermission(AppPermissions.RETURN_ASSET) ||
        hasPermission(AppPermissions.TRANSFER_ASSET),
    },
    {
      id: 'maintenance' as ActivePage,
      label: 'Maintenance',
      icon: <Wrench className="w-4 h-4" />,
      visible: hasPermission(AppPermissions.MANAGE_MAINTENANCE),
    },
    {
      id: 'categories' as ActivePage,
      label: 'Categories',
      icon: <Tags className="w-4 h-4" />,
      visible: hasPermission(AppPermissions.MANAGE_CATEGORIES),
    },
    {
      id: 'locations' as ActivePage,
      label: 'Locations',
      icon: <MapPin className="w-4 h-4" />,
      visible: hasPermission(AppPermissions.MANAGE_LOCATIONS),
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 min-h-[calc(100vh-4rem)] border-r border-slate-800">
      {/* Navigation Groups */}
      <div className="flex-1 px-3 py-4 space-y-1">
        <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Navigation
        </div>
        {navItems
          .filter((item) => item.visible)
          .map((item) => {
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectPage(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span className={isActive ? 'text-white' : 'text-slate-400'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800/80 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-slate-300 font-medium">Dataverse Connected</span>
        </div>
        <p className="mt-1 text-[11px] text-slate-400 truncate">
          org4c940879.crm8.dynamics.com
        </p>
      </div>
    </aside>
  );
};
