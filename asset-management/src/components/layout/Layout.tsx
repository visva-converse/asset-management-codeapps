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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSelectPage = (page: ActivePage) => {
    onSelectPage(page);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-50 text-slate-900 font-sans overflow-hidden antialiased select-auto">
      {/* Top Application Header */}
      <Header onMenuToggle={() => setIsMobileMenuOpen((prev) => !prev)} />

      {/* Main Application Container */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {/* Desktop Fixed Left Sidebar */}
        <Sidebar activePage={activePage} onSelectPage={handleSelectPage} />

        {/* Mobile / Tablet Slide-out Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-hidden="true"
            />
            {/* Drawer */}
            <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-slate-900 z-50 shadow-2xl flex flex-col">
              <Sidebar
                activePage={activePage}
                onSelectPage={handleSelectPage}
                isMobileDrawer={true}
                onClose={() => setIsMobileMenuOpen(false)}
              />
            </div>
          </div>
        )}

        {/* Main Content Viewport */}
        <main className="flex-1 flex flex-col min-w-0 min-h-0 h-full overflow-hidden bg-slate-50">
          <div className="flex-1 flex flex-col min-w-0 min-h-0 h-full px-3.5 sm:px-6 lg:px-8 py-3 sm:py-4 max-w-7xl w-full mx-auto overflow-hidden">
            <div className="shrink-0">
              <Breadcrumbs
                activePage={activePage}
                onNavigateHome={() => handleSelectPage('dashboard')}
              />
            </div>
            <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Enterprise Toast Notifications */}
      <ToastContainer />
    </div>
  );
};
