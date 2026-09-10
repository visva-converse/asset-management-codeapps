import React, { useState } from 'react';
import { UserProvider } from './context/UserContext';
import { ToastProvider } from './context/ToastContext';
import { useCurrentUser } from './hooks/useCurrentUser';
import { usePermission } from './hooks/usePermission';
import { AppPermissions } from './permissions/permissions';
import { Layout } from './components/layout/Layout';
import type { ActivePage } from './components/layout/Sidebar';
import { DashboardPage } from './pages/Dashboard/DashboardPage';
import { AssetsPage } from './pages/Assets/AssetsPage';
import { RequestsPage } from './pages/Requests/RequestsPage';
import { ApprovalsPage } from './pages/Approvals/ApprovalsPage';
import { AssignmentsPage } from './pages/Assignments/AssignmentsPage';
import { MaintenancePage } from './pages/Maintenance/MaintenancePage';
import { AdminPage } from './pages/Administration/AdminPage';
import { ShieldAlert } from 'lucide-react';
import { Button } from './components/common/Button';

const MainApp: React.FC = () => {
  const [activePage, setActivePage] = useState<ActivePage>('dashboard');
  const { hasPermission, permissions } = usePermission();
  const { user, isLoading, activeRole, refreshUser } = useCurrentUser();

  // Fullscreen Loading State while resolving Dataverse privileges
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 select-none">
        <div className="flex flex-col items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-md animate-pulse">
            AM
          </div>
          <div className="flex items-center gap-2.5 text-slate-600 font-medium text-sm">
            <svg
              className="animate-spin h-4 w-4 text-blue-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Verifying permissions...</span>
          </div>
        </div>
      </div>
    );
  }

  // App-level Access Denied: User has no Dataverse security roles or privileges for this app
  if (permissions.size === 0 || activeRole === 'No Role Assigned') {
    return (
      <div className="min-h-screen bg-slate-100/80 flex items-center justify-center p-4 sm:p-6 font-sans select-none">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
          {/* Header Banner */}
          <div className="bg-gradient-to-br from-rose-600 to-red-700 px-6 py-8 text-center text-white">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-3.5 shadow-inner">
              <ShieldAlert className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold tracking-tight">Access Denied</h2>
            <p className="text-red-100 text-xs mt-1">
              No Dataverse Security Role Assigned
            </p>
          </div>

          {/* Body Content */}
          <div className="p-6 space-y-5">
            <p className="text-xs sm:text-sm text-slate-600 text-center leading-relaxed">
              Your account does not have permission to access the{' '}
              <strong className="text-slate-900 font-semibold">Asset Management</strong> application.
              Please contact your Power Platform administrator to assign the appropriate security role.
            </p>

            {/* Authenticated User Diagnostics */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-500">
                <span>Signed-in User</span>
                <span className="font-semibold text-slate-800">{user?.fullName || 'Unknown'}</span>
              </div>
              <div className="flex items-center justify-between text-slate-500">
                <span>Account (UPN)</span>
                <span
                  className="font-mono text-[11px] text-slate-700 truncate max-w-[200px]"
                  title={user?.userPrincipalName}
                >
                  {user?.userPrincipalName || 'Unknown'}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-500">
                <span>Access Status</span>
                <span className="inline-flex items-center gap-1.5 font-semibold text-rose-600">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  Unauthorized
                </span>
              </div>
            </div>

            {/* Action */}
            <div className="pt-2">
              <Button
                variant="primary"
                className="w-full justify-center"
                onClick={() => refreshUser()}
              >
                Refresh Access
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderCurrentPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <DashboardPage onNavigate={setActivePage} />;

      case 'assets':
        if (!hasPermission(AppPermissions.VIEW_ASSETS)) {
          return <AccessDeniedNotice onGoHome={() => setActivePage('dashboard')} />;
        }
        return <AssetsPage />;

      case 'requests':
        if (!hasPermission(AppPermissions.VIEW_REQUESTS)) {
          return <AccessDeniedNotice onGoHome={() => setActivePage('dashboard')} />;
        }
        return <RequestsPage />;

      case 'approvals':
        if (
          !hasPermission(AppPermissions.APPROVE_REQUEST) &&
          !hasPermission(AppPermissions.REJECT_REQUEST)
        ) {
          return <AccessDeniedNotice onGoHome={() => setActivePage('dashboard')} />;
        }
        return <ApprovalsPage />;

      case 'assignments':
        if (
          !hasPermission(AppPermissions.ASSIGN_ASSET) &&
          !hasPermission(AppPermissions.RETURN_ASSET) &&
          !hasPermission(AppPermissions.TRANSFER_ASSET)
        ) {
          return <AccessDeniedNotice onGoHome={() => setActivePage('dashboard')} />;
        }
        return <AssignmentsPage />;

      case 'maintenance':
        if (!hasPermission(AppPermissions.MANAGE_MAINTENANCE)) {
          return <AccessDeniedNotice onGoHome={() => setActivePage('dashboard')} />;
        }
        return <MaintenancePage />;

      case 'categories':
        if (!hasPermission(AppPermissions.MANAGE_CATEGORIES)) {
          return <AccessDeniedNotice onGoHome={() => setActivePage('dashboard')} />;
        }
        return <AdminPage initialTab="categories" />;

      case 'locations':
        if (!hasPermission(AppPermissions.MANAGE_LOCATIONS)) {
          return <AccessDeniedNotice onGoHome={() => setActivePage('dashboard')} />;
        }
        return <AdminPage initialTab="locations" />;

      default:
        return <DashboardPage onNavigate={setActivePage} />;
    }
  };

  return (
    <Layout activePage={activePage} onSelectPage={setActivePage}>
      {renderCurrentPage()}
    </Layout>
  );
};

const AccessDeniedNotice: React.FC<{ onGoHome: () => void }> = ({ onGoHome }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-xl border border-slate-200 shadow-xs max-w-md mx-auto mt-10">
      <div className="p-3 bg-rose-50 text-rose-600 rounded-full mb-4">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <h3 className="text-base font-bold text-slate-900">Access Restricted</h3>
      <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
        Your assigned Dataverse security role does not grant permission to view this section. If you
        require access, please contact your Power Platform administrator.
      </p>
      <div className="mt-5">
        <Button variant="primary" size="sm" onClick={onGoHome}>
          Return to Dashboard
        </Button>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <UserProvider>
      <ToastProvider>
        <MainApp />
      </ToastProvider>
    </UserProvider>
  );
}
