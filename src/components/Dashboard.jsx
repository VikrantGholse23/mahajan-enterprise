import React from 'react';
import { 
  TrendingUp, 
  Scale, 
  Receipt, 
  Coins, 
  ArrowUpRight, 
  PlusCircle, 
  FileSpreadsheet, 
  Calendar, 
  Building2
} from 'lucide-react';
import { formatIndianCurrency } from '../utils/numberToWords';

function formatDateDisplay(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${parts[2]} ${months[parseInt(parts[1], 10) - 1]} ${parts[0]}`;
  }
  return dateStr;
}

export default function Dashboard({ statements, invoices, onNavigate }) {
  // Aggregate stats (All weights in Quintals)
  const totalPurchasesAmount = statements.reduce((sum, s) => sum + (s.grandTotal || 0), 0);
  const totalSalesAmount = invoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
  const totalWeightProcured = statements.reduce((sum, s) => sum + (s.totalWeight || 0), 0);
  
  // Pending / Unpaid invoices
  const pendingInvoices = invoices.filter(inv => inv.paymentStatus === 'Pending' || inv.paymentStatus === 'Unpaid');
  const pendingReceivables = pendingInvoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);

  // Latest statement & Padta
  const latestStatement = statements[0] || null;

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Quick Actions */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 rounded-2xl p-6 text-white shadow-xl border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-400 font-extrabold text-xs uppercase tracking-wider mb-1.5">
            <Building2 className="w-3.5 h-3.5" />
            <span>APMC Saoner, Maharashtra (State Code: 27)</span>
            <span className="text-slate-500">•</span>
            <span className="text-emerald-400 flex items-center gap-1 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Mandi Active
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
            R. Mahajan Enterprise ERP
          </h1>
          <p className="text-slate-300 text-xs md:text-sm mt-1">
            Proprietor: <strong className="text-amber-300">Yash Mahajan (9850020793)</strong> | Daily Trading & Billing Terminal
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => onNavigate('procurement')}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 px-4 py-2.5 rounded-xl font-black text-xs md:text-sm shadow-md transition transform active:scale-95 whitespace-nowrap"
          >
            <PlusCircle className="w-4 h-4 text-slate-950" />
            <span>+ New Buying Statement</span>
          </button>

          <button
            onClick={() => onNavigate('sales')}
            className="flex items-center gap-2 bg-slate-800/90 hover:bg-slate-700 text-white border border-slate-700 px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm shadow transition whitespace-nowrap"
          >
            <Receipt className="w-4 h-4 text-amber-400" />
            <span>+ New Sale Bill</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Procurement (Quintals) */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/90 flex flex-col justify-between hover:border-amber-400/60 transition group">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Procurement</span>
            <div className="p-2.5 bg-amber-50 text-amber-700 rounded-xl border border-amber-200/60 group-hover:bg-amber-100 transition">
              <Scale className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-slate-900">
              {totalWeightProcured.toFixed(3)} <span className="text-sm font-semibold text-slate-500">Qtl</span>
            </div>
            <div className="text-xs text-slate-600 mt-1 flex items-center gap-1.5">
              <span className="font-extrabold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">
                {(totalWeightProcured * 100).toLocaleString('en-IN')} KG
              </span>
              <span>across {statements.length} Statements</span>
            </div>
          </div>
        </div>

        {/* Card 2: Landed Cost (Padta in ₹ / Quintal) */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/90 flex flex-col justify-between hover:border-emerald-400/60 transition group">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Latest Landed Cost</span>
            <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200/60 group-hover:bg-emerald-100 transition">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-emerald-700">
              {latestStatement ? formatIndianCurrency(latestStatement.grossPadta) : '₹0.00'}
              <span className="text-xs font-semibold text-slate-500"> / Qtl</span>
            </div>
            <div className="text-xs text-slate-600 mt-1 flex items-center justify-between">
              <span>Net Padta: <strong className="text-slate-900">{latestStatement ? formatIndianCurrency(latestStatement.netPadta) : '₹0'} / Qtl</strong></span>
              <span className="text-[10px] text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded font-black uppercase tracking-wider">Gross Padta</span>
            </div>
          </div>
        </div>

        {/* Card 3: Total Billed Sales */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/90 flex flex-col justify-between hover:border-blue-400/60 transition group">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Billed Sales</span>
            <div className="p-2.5 bg-blue-50 text-blue-700 rounded-xl border border-blue-200/60 group-hover:bg-blue-100 transition">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-slate-900">
              {formatIndianCurrency(totalSalesAmount)}
            </div>
            <div className="text-xs text-slate-600 mt-1 flex items-center gap-1">
              <strong className="text-slate-900">{invoices.length} Invoices</strong> generated for Dal Mills
            </div>
          </div>
        </div>

        {/* Card 4: Mill Receivables */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/90 flex flex-col justify-between hover:border-rose-400/60 transition group">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Mill Receivables</span>
            <div className="p-2.5 bg-rose-50 text-rose-700 rounded-xl border border-rose-200/60 group-hover:bg-rose-100 transition">
              <Coins className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-rose-600">
              {formatIndianCurrency(pendingReceivables)}
            </div>
            <div className="text-xs text-slate-600 mt-1 flex items-center gap-1.5">
              <span className="font-extrabold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                {pendingInvoices.length} Pending
              </span>
              <span className="text-[11px] text-slate-500">(10-day credit window)</span>
            </div>
          </div>
        </div>

      </div>

      {/* Main Two Columns: Recent Statements & Recent Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recent Buying Statements */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/90 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-amber-600" />
                <h3 className="font-extrabold text-slate-900 text-sm">Recent Buying Statements</h3>
              </div>
              <button 
                onClick={() => onNavigate('archive')}
                className="text-xs text-amber-600 hover:text-amber-700 font-bold flex items-center gap-1"
              >
                View Archive <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100 mt-2">
              {statements.slice(0, 4).map((stmt) => (
                <div 
                  key={stmt.id} 
                  onClick={() => onNavigate('procurement')}
                  className="py-3 px-2 flex items-center justify-between hover:bg-amber-50/40 rounded-xl transition cursor-pointer group"
                >
                  <div>
                    <div className="font-black text-xs md:text-sm text-slate-900 group-hover:text-amber-900 transition">
                      {stmt.millName || 'APMC Saoner Lot'}
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                      <span className="flex items-center gap-1 font-semibold text-slate-700">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {formatDateDisplay(stmt.date)}
                      </span>
                      <span>•</span>
                      <span className="font-mono font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">
                        {stmt.totalWeight} Qtl
                      </span>
                      {stmt.dispatchBags > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-slate-600 font-medium">{stmt.dispatchBags} Bags</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-xs md:text-sm text-slate-950">
                      {formatIndianCurrency(stmt.grandTotal)}
                    </div>
                    <div className="text-[11px] font-bold text-emerald-700 mt-0.5">
                      Padta: {formatIndianCurrency(stmt.grossPadta)} / Qtl
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4">
            <button
              onClick={() => onNavigate('procurement')}
              className="w-full py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-950 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-2 border border-amber-200/60"
            >
              <PlusCircle className="w-4 h-4 text-amber-700" />
              <span>Create New Mandi Procurement Statement</span>
            </button>
          </div>
        </div>

        {/* Recent Sale Bills / Invoices */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/90 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-blue-600" />
                <h3 className="font-extrabold text-slate-900 text-sm">Recent Sale Invoices</h3>
              </div>
              <button 
                onClick={() => onNavigate('archive')}
                className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1"
              >
                View Archive <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100 mt-2">
              {invoices.slice(0, 4).map((inv) => (
                <div 
                  key={inv.id} 
                  onClick={() => onNavigate('sales')}
                  className="py-3 px-2 flex items-center justify-between hover:bg-blue-50/40 rounded-xl transition cursor-pointer group"
                >
                  <div>
                    <div className="font-black text-xs md:text-sm text-slate-900 group-hover:text-blue-900 transition">
                      {inv.buyerName}
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                      <span className="font-mono text-slate-600 font-bold">{inv.invoiceNo}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-semibold text-slate-700">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {formatDateDisplay(inv.date)}
                      </span>
                      <span>•</span>
                      <span className="bg-slate-100 px-1.5 py-0.2 rounded font-mono font-bold text-slate-700">
                        {inv.vehicleNo || 'MH 40'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-xs md:text-sm text-slate-950">
                      {formatIndianCurrency(inv.grandTotal)}
                    </div>
                    <span className={`inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-full mt-1 ${
                      inv.paymentStatus === 'Paid' 
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                        : 'bg-rose-100 text-rose-800 border border-rose-200'
                    }`}>
                      {inv.paymentStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4">
            <button
              onClick={() => onNavigate('sales')}
              className="w-full py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-950 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-2 border border-blue-200/60"
            >
              <PlusCircle className="w-4 h-4 text-blue-700" />
              <span>Generate Official Sale Bill</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
