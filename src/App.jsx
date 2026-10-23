import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import MandiStatement from './components/MandiStatement';
import SaleInvoice from './components/SaleInvoice';
import DateArchive from './components/DateArchive';
import AdminSettings from './components/AdminSettings';
import LoginModal from './components/LoginModal';
import { 
  getCurrentUser, 
  setCurrentUser, 
  getProcurementStatements, 
  getSaleInvoices 
} from './utils/storage';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentUser, setUser] = useState(getCurrentUser());
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  // Live state for data
  const [statements, setStatements] = useState(getProcurementStatements());
  const [invoices, setInvoices] = useState(getSaleInvoices());

  const refreshData = () => {
    setStatements(getProcurementStatements());
    setInvoices(getSaleInvoices());
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setUser(null);
    setActiveTab('dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-amber-500 selection:text-slate-950">
      
      {/* Top Fixed Header Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onOpenLogin={() => setIsLoginOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Dynamic View Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'dashboard' && (
          <Dashboard
            statements={statements}
            invoices={invoices}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'procurement' && (
          <MandiStatement onSaveSuccess={refreshData} />
        )}

        {activeTab === 'sales' && (
          <SaleInvoice onSaveSuccess={refreshData} />
        )}

        {activeTab === 'archive' && (
          <DateArchive />
        )}

        {activeTab === 'settings' && (
          <AdminSettings />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-6 text-center text-xs border-t border-slate-800 no-print">
        <p className="font-bold text-slate-300">
          R. MAHAJAN ENTERPRISE — Agricultural Product Market Committee, Saoner - 441107
        </p>
        <p className="text-[11px] text-slate-500 mt-1">
          Grain Merchants of Toor, Chana & Agricultural Produce | Yash Mahajan (9850020793)
        </p>
      </footer>

      {/* Admin Login Modal */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={(user) => {
          setUser(user);
        }}
      />

    </div>
  );
}
