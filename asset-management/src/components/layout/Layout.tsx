import React, { useState } from 'react';
import { Header } from './Header';
import { Sidebar, type ActivePage } from './Sidebar';
import { Breadcrumbs } from './Breadcrumbs';
import { ToastContainer } from '../common/ToastContainer';

interface LayoutProps {
  activePage: ActivePage;
  onSelectPage: (page: ActivePage) => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ activePage, onSelectPage, children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      {/* Top Header */}
      <Header onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} />

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Permission-aware Left Sidebar */}
        {isSidebarOpen && (
          <Sidebar activePage={activePage} onSelectPage={onSelectPage} />
        )}

        {/* Content Area */}
        <main className="flex-1 flex flex-col overflow-y-auto min-w-0">
          <div className="px-8 py-6 max-w-7xl w-full mx-auto flex-1 flex flex-col">
            <Breadcrumbs
              activePage={activePage}
              onNavigateHome={() => onSelectPage('dashboard')}
            />
            <div className="flex-1 mt-2">{children}</div>
          </div>
        </main>
      </div>

      {/* Enterprise Toast Notifications */}
      <ToastContainer />
    </div>
  );
};
