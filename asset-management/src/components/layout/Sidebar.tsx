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
  X,
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
  isMobileDrawer?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  onSelectPage,
  isMobileDrawer = false,
  onClose,
}) => {
  const { hasPermission, activeRole } = usePermission();

  const isEmployee = activeRole === 'Asset Management - Employee';

  const navItems = [
    {
      id: 'dashboard' as ActivePage,
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-4 h-4 shrink-0" />,
      visible: true,
    },
    {
      id: 'assets' as ActivePage,
      label: 'Hardware Assets',
      icon: <Laptop className="w-4 h-4 shrink-0" />,
      visible: hasPermission(AppPermissions.VIEW_ASSETS),
    },
    {
      id: 'requests' as ActivePage,
      label: isEmployee ? 'My Requests' : 'Requests Queue',
      icon: <ClipboardList className="w-4 h-4 shrink-0" />,
      visible: hasPermission(AppPermissions.VIEW_REQUESTS),
    },
    {
      id: 'approvals' as ActivePage,
      label: 'Manager Approvals',
      icon: <CheckSquare className="w-4 h-4 shrink-0" />,
      visible:
        hasPermission(AppPermissions.APPROVE_REQUEST) ||
        hasPermission(AppPermissions.REJECT_REQUEST),
    },
    {
      id: 'assignments' as ActivePage,
      label: 'Asset Custody',
      icon: <ArrowLeftRight className="w-4 h-4 shrink-0" />,
      visible:
        hasPermission(AppPermissions.ASSIGN_ASSET) ||
        hasPermission(AppPermissions.RETURN_ASSET) ||
        hasPermission(AppPermissions.TRANSFER_ASSET),
    },
    {
      id: 'maintenance' as ActivePage,
      label: 'Maintenance Service',
      icon: <Wrench className="w-4 h-4 shrink-0" />,
      visible: hasPermission(AppPermissions.MANAGE_MAINTENANCE),
    },
    {
      id: 'categories' as ActivePage,
      label: 'Asset Categories',
      icon: <Tags className="w-4 h-4 shrink-0" />,
      visible: hasPermission(AppPermissions.MANAGE_CATEGORIES),
    },
    {
      id: 'locations' as ActivePage,
      label: 'Facility Locations',
      icon: <MapPin className="w-4 h-4 shrink-0" />,
      visible: hasPermission(AppPermissions.MANAGE_LOCATIONS),
    },
  ];

  const handleItemClick = (id: ActivePage) => {
    onSelectPage(id);
    if (isMobileDrawer && onClose) {
      onClose();
    }
  };

  const containerClasses = isMobileDrawer
    ? 'w-full h-full bg-slate-900 text-slate-300 flex flex-col select-none'
    : 'hidden lg:flex w-64 bg-slate-900 text-slate-300 flex-col shrink-0 h-full border-r border-slate-800/90 select-none';

  return (
    <aside className={containerClasses}>
      {/* Mobile Drawer Header with Close Button */}
      {isMobileDrawer && (
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-xs">
              AM
            </div>
            <span className="text-sm font-bold text-white tracking-tight">Navigation Menu</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation menu"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Navigation Groups */}
      <nav aria-label="Primary Navigation" className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          {/* Enterprise Modules */}
        </div>
        {navItems
          .filter((item) => item.visible)
          .map((item) => {
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleItemClick(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 cursor-pointer ${isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
              >
                <span className={isActive ? 'text-white' : 'text-slate-400'}>
                  {item.icon}
                </span>
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
      </nav>

      {/* Footer Info */}
      <div className="p-3.5 border-t border-slate-800/80 text-xs text-slate-400 shrink-0 bg-slate-950/40">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-slate-300 font-semibold text-[11px]">Dataverse Connected</span>
        </div>
        <p className="mt-0.5 text-[10px] text-slate-400 truncate font-mono">
          org4c940879.crm8.dynamics.com
        </p>
      </div>
    </aside>
  );
};
