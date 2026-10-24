import React from 'react';
import { 
  Building2, 
  FileSpreadsheet, 
  Receipt, 
  Calendar, 
  Settings, 
  LogOut, 
  Lock,
  Download,
  Wheat,
  Cloud
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { getProcurementStatements, getSaleInvoices, getSystemSettings } from '../utils/storage';
import { buildStatementWorksheet } from '../utils/exportStatementExcel';

export default function Navbar({ activeTab, setActiveTab, currentUser, onOpenLogin, onLogout }) {
  
  const handleExportAllExcel = () => {
    const statements = getProcurementStatements();
    const invoices = getSaleInvoices();
    const settings = getSystemSettings();

    const wb = XLSX.utils.book_new();

    // Add each Mandi Purchase Statement in authentic APMC Saoner format
    if (statements.length === 0) {
      const wsEmpty = buildStatementWorksheet({ millName: 'Purchasing', lots: [] }, settings);
      XLSX.utils.book_append_sheet(wb, wsEmpty, 'Purchasing');
    } else {
      const usedNames = new Set();
      statements.forEach((s, idx) => {
        const ws = buildStatementWorksheet(s, settings);
        let tabName = (s.millName || `Statement_${idx + 1}`).replace(/Pvt\.?|Ltd\.?|Industry|Industries/gi, '').trim().split(' ')[0] || `Statement_${idx + 1}`;
        tabName = tabName.slice(0, 28);
        if (usedNames.has(tabName)) {
          tabName = `${tabName}_${idx + 1}`;
        }
        usedNames.add(tabName);
        XLSX.utils.book_append_sheet(wb, ws, tabName);
      });
    }

    // Outward Sale Invoices Sheet
    const invoiceRows = [];
    invoices.forEach(inv => {
      inv.items.forEach(it => {
        invoiceRows.push({
          'Invoice Date': inv.date,
          'Invoice No': inv.invoiceNo,
          'Buyer Name': inv.buyerName,
          'City': inv.buyerAddress,
          'Broker': inv.broker,
          'Vehicle No': inv.vehicleNo,
          'Transporter': inv.transporter,
          'Goods': it.description,
          'Bags': it.bags,
          'Gross Wt': it.grossWeight,
          'Net Wt': it.netWeight,
          'Rate': it.rate,
          'Amount': it.amount,
          'Grand Total': inv.grandTotal,
          'Status': inv.paymentStatus
        });
      });
    });
    const wsInvoices = XLSX.utils.json_to_sheet(invoiceRows);
    XLSX.utils.book_append_sheet(wb, wsInvoices, 'Sale Invoices (Outward)');

    XLSX.writeFile(wb, `Mahajan_Enterprise_All_Records_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Building2 },
    { id: 'procurement', label: 'Buying & Padta', icon: FileSpreadsheet },
    { id: 'sales', label: 'Sale Bills', icon: Receipt },
    { id: 'archive', label: 'Date Archive', icon: Calendar },
    ...(currentUser && currentUser.role === 'ADMIN' ? [{ id: 'settings', label: 'Settings', icon: Settings }] : [])
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white shadow-md sticky top-0 z-50 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Brand Identity */}
          <div 
            className="flex items-center gap-3 cursor-pointer select-none shrink-0" 
            onClick={() => setActiveTab('dashboard')}
          >
            <div className="bg-gradient-to-br from-amber-400 to-amber-600 p-2.5 rounded-xl text-slate-950 font-black shadow-md flex items-center justify-center">
              <Wheat className="w-5 h-5 text-slate-950" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-black text-base lg:text-lg tracking-wide text-white">
                  R. MAHAJAN <span className="text-amber-400">ENTERPRISE</span>
                </span>
                <span className="hidden xl:inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  APMC Saoner
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">Grain Merchant ERP & Mandi Portal</span>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1.5 shrink-0">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                    isActive 
                      ? 'bg-amber-500 text-slate-950 shadow-sm' 
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-amber-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action Tools */}
          <div className="flex items-center gap-2.5 shrink-0">
            
            {/* Supabase Cloud Connection Status */}
            <div 
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-950/70 border border-emerald-500/50 rounded-xl text-[11px] font-bold text-emerald-300 shadow-sm"
              title="Connected to Supabase Cloud Database: laiqoysoyxmmhjrryzac.supabase.co"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <Cloud className="w-3.5 h-3.5 text-emerald-300" />
              <span>Cloud DB: Active</span>
            </div>

            {/* Backup Excel button */}
            <button
              onClick={handleExportAllExcel}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700/80 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-sm transition border border-emerald-600/50 whitespace-nowrap"
              title="Download complete database to Excel (.xlsx)"
            >
              <Download className="w-3.5 h-3.5 text-emerald-200" />
              <span>Backup Excel</span>
            </button>

            {/* User Profile Pill */}
            {currentUser ? (
              <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700/80 pl-3 pr-2 py-1.5 rounded-xl shadow-inner">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-extrabold text-slate-200 leading-tight whitespace-nowrap">
                    {currentUser.name}
                  </span>
                  <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider leading-none">
                    {currentUser.role}
                  </span>
                </div>
                <button
                  onClick={onLogout}
                  className="ml-1 p-1.5 hover:bg-slate-700/80 text-slate-400 hover:text-rose-400 rounded-lg transition"
                  title="Logout"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black shadow transition whitespace-nowrap"
              >
                <Lock className="w-3.5 h-3.5" />
                Admin Login
              </button>
            )}

          </div>

        </div>
      </div>

      {/* Mobile Horizontal Navigation Strip */}
      <div className="md:hidden flex overflow-x-auto px-3 py-2 border-t border-slate-800 bg-slate-950/80 gap-1.5 text-xs no-scrollbar">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 whitespace-nowrap transition ${
                isActive ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
}
