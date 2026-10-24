import React, { useState } from 'react';
import { 
  Calendar, 
  Search, 
  Download, 
  FileSpreadsheet, 
  Receipt, 
  Trash2,
  Scale
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { formatIndianCurrency } from '../utils/numberToWords';
import { exportMultipleStatementsToExcel } from '../utils/exportStatementExcel';
import { 
  getProcurementStatements, 
  deleteProcurementStatement, 
  getSaleInvoices, 
  deleteSaleInvoice,
  getSystemSettings
} from '../utils/storage';

function formatDateDisplay(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${parts[2]} ${months[parseInt(parts[1], 10) - 1]} ${parts[0]}`;
  }
  return dateStr;
}

export default function DateArchive() {
  const [activeSubTab, setActiveSubTab] = useState('statements'); // 'statements' or 'invoices'
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [statements, setStatements] = useState(getProcurementStatements());
  const [invoices, setInvoices] = useState(getSaleInvoices());

  // Filtered Statements
  const filteredStatements = statements.filter(stmt => {
    const matchesSearch = 
      (stmt.millName && stmt.millName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (stmt.statementNo && stmt.statementNo.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (stmt.lots && stmt.lots.some(l => l.brokerName.toLowerCase().includes(searchTerm.toLowerCase())));

    const matchesStart = !startDate || stmt.date >= startDate;
    const matchesEnd = !endDate || stmt.date <= endDate;

    return matchesSearch && matchesStart && matchesEnd;
  });

  // Filtered Invoices
  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = 
      (inv.buyerName && inv.buyerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (inv.invoiceNo && inv.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (inv.vehicleNo && inv.vehicleNo.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (inv.broker && inv.broker.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStart = !startDate || inv.date >= startDate;
    const matchesEnd = !endDate || inv.date <= endDate;

    return matchesSearch && matchesStart && matchesEnd;
  });

  const handleDeleteStatement = (id) => {
    if (window.confirm('Are you sure you want to delete this statement?')) {
      const updated = deleteProcurementStatement(id);
      setStatements(updated);
    }
  };

  const handleDeleteInvoice = (id) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      const updated = deleteSaleInvoice(id);
      setInvoices(updated);
    }
  };

  // Export filtered list to Excel (using authentic APMC format for statements)
  const handleExportFiltered = () => {
    if (activeSubTab === 'statements') {
      const settings = getSystemSettings();
      exportMultipleStatementsToExcel(filteredStatements, settings);
    } else {
      const wb = XLSX.utils.book_new();
      const rows = [];
      filteredInvoices.forEach(inv => {
        inv.items.forEach(it => {
          rows.push({
            'Invoice Date': inv.date,
            'Invoice No': inv.invoiceNo,
            'Buyer Name': inv.buyerName,
            'City': inv.buyerAddress,
            'Broker': inv.broker,
            'Vehicle': inv.vehicleNo,
            'Goods': it.description,
            'Bags': it.bags,
            'Gross Wt (Qtl)': it.grossWeight,
            'Net Wt (Qtl)': it.netWeight,
            'Rate (₹/Qtl)': it.rate,
            'Amount (₹)': it.amount,
            'Invoice Total (₹)': inv.grandTotal,
            'Status': inv.paymentStatus
          });
        });
      });
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'Filtered Invoices');
      XLSX.writeFile(wb, `Filtered_Invoices_${new Date().toISOString().slice(0, 10)}.xlsx`);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Filter Bar */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/90 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h2 className="text-base md:text-lg font-black text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-600" />
              Date-Wise Historical Records Archive
            </h2>
            <p className="text-xs text-slate-500">All procurement weights calculated in Quintals (100 kg) & Rate Basis</p>
          </div>

          <button
            onClick={handleExportFiltered}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-sm transition border border-emerald-600/50"
          >
            <Download className="w-4 h-4" />
            Export Filtered to Excel
          </button>
        </div>

        {/* Sub tabs & Search inputs */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setActiveSubTab('statements')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                activeSubTab === 'statements' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-amber-600" />
              Buying Statements ({filteredStatements.length})
            </button>

            <button
              onClick={() => setActiveSubTab('invoices')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                activeSubTab === 'invoices' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Receipt className="w-3.5 h-3.5 text-blue-600" />
              Sale Invoices ({filteredInvoices.length})
            </button>
          </div>

          {/* Date range filters */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-1.5 rounded-xl">
              <span className="text-slate-500 text-[11px] font-semibold">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent font-bold text-slate-800 text-xs focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-1.5 rounded-xl">
              <span className="text-slate-500 text-[11px] font-semibold">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent font-bold text-slate-800 text-xs focus:outline-none"
              />
            </div>

            {/* Quick search input */}
            <div className="relative min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search broker, mill, bill no..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

        </div>
      </div>

      {/* Main Records Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 overflow-hidden">
        {activeSubTab === 'statements' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white uppercase text-[10px] md:text-[11px] font-black">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Statement Ref</th>
                  <th className="py-3 px-4">Target Dal Mill</th>
                  <th className="py-3 px-4 text-right">Lots</th>
                  <th className="py-3 px-4 text-right">Weight (Quintals)</th>
                  <th className="py-3 px-4 text-right">Net Padta (₹/Qtl)</th>
                  <th className="py-3 px-4 text-right">Gross Padta (₹/Qtl)</th>
                  <th className="py-3 px-4 text-right">Grand Total (₹)</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStatements.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400 font-medium">
                      No procurement statements found matching the filters.
                    </td>
                  </tr>
                ) : (
                  filteredStatements.map(stmt => (
                    <tr key={stmt.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-bold text-slate-900">{formatDateDisplay(stmt.date)}</td>
                      <td className="py-3 px-4 font-mono text-slate-600 font-bold">{stmt.statementNo}</td>
                      <td className="py-3 px-4 font-bold text-amber-950">{stmt.millName}</td>
                      <td className="py-3 px-4 text-right font-medium">{stmt.lots ? stmt.lots.length : 0} Lots</td>
                      <td className="py-3 px-4 text-right font-mono font-black text-slate-900">{stmt.totalWeight.toFixed(3)} Qtl</td>
                      <td className="py-3 px-4 text-right text-slate-700 font-semibold">{formatIndianCurrency(stmt.netPadta)}</td>
                      <td className="py-3 px-4 text-right text-emerald-700 font-black">{formatIndianCurrency(stmt.grossPadta)}</td>
                      <td className="py-3 px-4 text-right font-black text-slate-950 text-sm font-mono">{formatIndianCurrency(stmt.grandTotal)}</td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleDeleteStatement(stmt.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 transition rounded-lg"
                          title="Delete Statement"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white uppercase text-[10px] md:text-[11px] font-black">
                  <th className="py-3 px-4">Invoice Date</th>
                  <th className="py-3 px-4">Invoice No</th>
                  <th className="py-3 px-4">Buyer / Consignee</th>
                  <th className="py-3 px-4">Broker</th>
                  <th className="py-3 px-4">Vehicle No</th>
                  <th className="py-3 px-4 text-right">Bags</th>
                  <th className="py-3 px-4 text-right">Grand Total (₹)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400 font-medium">
                      No sale invoices found matching the filters.
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map(inv => (
                    <tr key={inv.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-bold text-slate-900">{formatDateDisplay(inv.date)}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-700">{inv.invoiceNo}</td>
                      <td className="py-3 px-4 font-bold text-blue-950">{inv.buyerName}</td>
                      <td className="py-3 px-4 text-slate-600">{inv.broker}</td>
                      <td className="py-3 px-4 font-mono text-slate-700 font-bold">{inv.vehicleNo}</td>
                      <td className="py-3 px-4 text-right font-bold">{inv.totalBags}</td>
                      <td className="py-3 px-4 text-right font-black text-slate-950 text-sm font-mono">{formatIndianCurrency(inv.grandTotal)}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                          inv.paymentStatus === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {inv.paymentStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleDeleteInvoice(inv.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 transition rounded-lg"
                          title="Delete Invoice"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
