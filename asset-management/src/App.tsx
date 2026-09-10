import React, { useState } from 'react';
import { UserProvider } from './context/UserContext';
import { ToastProvider } from './context/ToastContext';
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
  const { hasPermission } = usePermission();

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
        Your current Dataverse security role does not grant permission to view this section. Switch
        roles in the header to simulate other personas or contact your Power Platform administrator.
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
