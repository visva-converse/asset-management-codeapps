import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import type { ActivePage } from './Sidebar';

interface BreadcrumbsProps {
  activePage: ActivePage;
  onNavigateHome: () => void;
}

const pageTitles: Record<ActivePage, string> = {
  dashboard: 'Dashboard Overview',
  assets: 'Enterprise Assets Directory',
  requests: 'Hardware & Equipment Requests',
  approvals: 'Manager Approvals Queue',
  assignments: 'Asset Assignments & Custody',
  maintenance: 'Maintenance & Service Management',
  categories: 'Asset Categories Administration',
  locations: 'Facility Locations Administration',
};

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ activePage, onNavigateHome }) => {
  return (
    <nav className="flex items-center gap-2 text-xs text-slate-500 py-3" aria-label="Breadcrumb">
      <button
        onClick={onNavigateHome}
        className="flex items-center gap-1 hover:text-blue-600 transition-colors"
      >
        <Home className="w-3.5 h-3.5" />
        <span>Asset Management</span>
      </button>
      <ChevronRight className="w-3 h-3 text-slate-400" />
      <span className="font-semibold text-slate-800">{pageTitles[activePage]}</span>
    </nav>
  );
};
