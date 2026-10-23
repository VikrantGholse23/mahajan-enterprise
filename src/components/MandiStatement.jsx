import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Printer, 
  Save, 
  Download, 
  Building2, 
  Calendar, 
  Calculator, 
  CheckCircle2, 
  Scale,
  Package
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { formatIndianCurrency } from '../utils/numberToWords';
import { 
  getSystemSettings, 
  getMasterParties, 
  saveProcurementStatement 
} from '../utils/storage';

export default function MandiStatement({ onSaveSuccess }) {
  const settings = getSystemSettings();
  const parties = getMasterParties();
  const brokerParties = parties.filter(p => p.type === 'Broker');
  const millParties = parties.filter(p => p.type === 'Mill');

  // Statement Header State
  const [statementNo, setStatementNo] = useState(`RME/STMT/${new Date().getFullYear()}/${String(Math.floor(Math.random() * 900) + 100)}`);
  const [statementDate, setStatementDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedMill, setSelectedMill] = useState('SHREE MOHAN INDUSTRIES Pvt. Ltd.');
  const [customMill, setCustomMill] = useState('');
  const [commodity, setCommodity] = useState('Toor');

  // Broker Lots State (Split inputs: Qtl and KG for fast Mandi entry)
  // e.g. 566.5 kg is entered as 5 in qtl box and 66.5 in kg box -> 5.665 Quintals
  const [lots, setLots] = useState([
    { id: '1', brokerName: 'Dilip Jain', qtl: 1, kg: 77.5, rate: 10200, chequeNo: '', stockStatus: 'Cleared' },
    { id: '2', brokerName: 'Roshan Chandak', qtl: 5, kg: 73.5, rate: 10251.39, chequeNo: '', stockStatus: 'Cleared' }
  ]);

  // Consignment Dispatch Bags (Optional, for Mill packing & Bardana tare)
  const [dispatchBags, setDispatchBags] = useState(115);
  const [dispatchExtraKg, setDispatchExtraKg] = useState(35);

  // Mandi Expense Parameters State
  const [bardanaRateKg, setBardanaRateKg] = useState(settings.defaultBardanaTareKg || 0.6);
  const [mandiSheshPct, setMandiSheshPct] = useState(settings.defaultMandiSheshPct || 1.05);
  const [commissionPct, setCommissionPct] = useState(settings.defaultCommissionPct || 1.5);
  const [workerRate, setWorkerRate] = useState(settings.defaultWorkerRate || 14);
  const [transportRate, setTransportRate] = useState(settings.defaultTransportRate || 40);
  const [bardanaChargesPerBag, setBardanaChargesPerBag] = useState(0);

  // Success alert
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Auto-calculated fields: Weight (Qtl) = Qtl + (KG / 100)
  const calculatedLots = lots.map(lot => {
    const q = parseFloat(lot.qtl) || 0;
    const k = parseFloat(lot.kg) || 0;
    const w = parseFloat((q + (k / 100)).toFixed(3)); // Total in Quintals
    const r = parseFloat(lot.rate) || 0;             // ₹ per Quintal
    const billAmt = w * r;
    const brokerage = billAmt * 0.015; // 1.5%
    const totalLot = billAmt + brokerage;
    return {
      ...lot,
      qtl: lot.qtl !== undefined ? lot.qtl : q,
      kg: lot.kg !== undefined ? lot.kg : k,
      weight: w,
      rate: r,
      billAmount: billAmt,
      brokerage: brokerage,
      totalLotAmount: totalLot
    };
  });

  const totalWeightQtl = calculatedLots.reduce((sum, l) => sum + l.weight, 0);
  const totalPureBill = calculatedLots.reduce((sum, l) => sum + l.billAmount, 0);
  const totalBrokerage = calculatedLots.reduce((sum, l) => sum + l.brokerage, 0);
  const totalLotPurchases = calculatedLots.reduce((sum, l) => sum + l.totalLotAmount, 0);

  // Net Padta (Pure Mandi Cost per Quintal)
  const netPadta = totalWeightQtl > 0 ? (totalPureBill / totalWeightQtl) : 0;

  // Mandi Expenses Calculations (1 Quintal = 100 kg)
  const bagsCount = parseInt(dispatchBags) || 0;
  const bardanaWeightQtl = bagsCount > 0 ? ((bagsCount * bardanaRateKg) / 1000) : 0;
  const grossWeightQtl = totalWeightQtl + bardanaWeightQtl;

  const mandiSheshAmount = totalPureBill * (mandiSheshPct / 100);
  const commissionAmount = totalPureBill * (commissionPct / 100);
  const workerChargesAmount = bagsCount > 0 ? (bagsCount * workerRate) : (totalWeightQtl * workerRate);
  const transportChargesAmount = grossWeightQtl * transportRate;
  const bardanaChargesAmount = bagsCount * bardanaChargesPerBag;

  const totalExpenses = mandiSheshAmount + commissionAmount + workerChargesAmount + transportChargesAmount + bardanaChargesAmount;
  const grandTotal = totalLotPurchases + totalExpenses;

  // Gross Padta (Total Landed Cost per Quintal)
  const grossPadta = grossWeightQtl > 0 ? (grandTotal / grossWeightQtl) : 0;

  // Add Lot Row
  const handleAddLot = () => {
    setLots([
      ...lots,
      {
        id: String(Date.now()),
        brokerName: brokerParties[0]?.name || 'Dilip Jain',
        qtl: '',
        kg: '',
        rate: '',
        chequeNo: '',
        stockStatus: 'Cleared'
      }
    ]);
  };

  // Update Lot Field
  const handleUpdateLot = (id, field, value) => {
    setLots(lots.map(l => l.id === id ? { ...l, [field]: value } : l));
  };

  // Delete Lot Row
  const handleDeleteLot = (id) => {
    if (lots.length <= 1) return;
    setLots(lots.filter(l => l.id !== id));
  };

  // Save Statement
  const handleSave = () => {
    const finalMillName = selectedMill === 'OTHER' ? customMill : selectedMill;
    const statementObj = {
      id: `stmt-${Date.now()}`,
      statementNo,
      date: statementDate,
      millName: finalMillName,
      commodity,
      dispatchBags: bagsCount,
      dispatchExtraKg: parseInt(dispatchExtraKg) || 0,
      lots: calculatedLots.map(l => ({
        id: l.id,
        brokerName: l.brokerName,
        qtl: l.qtl,
        kg: l.kg,
        weight: l.weight,
        rate: l.rate,
        billAmount: l.billAmount,
        brokerage: l.brokerage,
        total: l.totalLotAmount,
        chequeNo: l.chequeNo,
        stockStatus: l.stockStatus
      })),
      totalBags: bagsCount,
      totalWeight: totalWeightQtl, // in Quintals
      pureBillAmount: totalPureBill,
      totalBrokerage,
      lotPurchaseTotal: totalLotPurchases,
      netPadta,
      bardanaRateKg,
      bardanaWeight: bardanaWeightQtl,
      grossWeight: grossWeightQtl,
      mandiSheshPct,
      mandiSheshAmount,
      commissionPct,
      commissionAmount,
      bardanaCharges: bardanaChargesAmount,
      workerCharges: workerChargesAmount,
      transportCharges: transportChargesAmount,
      totalExpenses,
      grandTotal,
      grossPadta
    };

    saveProcurementStatement(statementObj);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
    if (onSaveSuccess) onSaveSuccess();
  };

  // Export current statement to Excel
  const handleExportExcel = () => {
    const finalMillName = selectedMill === 'OTHER' ? customMill : selectedMill;
    const wb = XLSX.utils.book_new();

    const rows = [
      ['R. MAHAJAN ENTERPRISE'],
      ['Agricultural Product Market Committee, Saoner', '', '', '', '', '', '', 'Proprietor : Yash Mahajan'],
      [`STATEMENT (${finalMillName})`, '', '', '', '', '', '', `Date: ${statementDate}`],
      ['No.', "Broker's Name", 'Qtl', 'KG', 'Total Weight (Qtl)', 'Rate (₹/Qtl)', 'Bill Amount (₹)', 'Brokerage (1.5%)', 'Total Bill Amount (₹)', 'Check No.', 'Stock']
    ];

    calculatedLots.forEach((l, idx) => {
      rows.push([
        idx + 1,
        l.brokerName,
        l.qtl,
        l.kg,
        l.weight.toFixed(3),
        l.rate.toFixed(2),
        l.billAmount.toFixed(2),
        l.brokerage.toFixed(2),
        l.totalLotAmount.toFixed(2),
        l.chequeNo,
        l.stockStatus
      ]);
    });

    rows.push(['', '', '', '', totalWeightQtl.toFixed(3), '', totalPureBill.toFixed(2), totalBrokerage.toFixed(2), totalLotPurchases.toFixed(2), '', '']);
    if (bagsCount > 0) {
      rows.push(['', `${bagsCount} Bags | ${dispatchExtraKg} KG`, '', '', '', '', '', '', '', '']);
    }
    rows.push(['', `Net Padta: ₹${netPadta.toFixed(2)} / Qtl`, '', '', '', '', '', '', '', '']);
    rows.push(['', `Gross Padta: ₹${grossPadta.toFixed(2)} / Qtl`, '', bardanaWeightQtl.toFixed(4), `Bardana Tare: ${bardanaRateKg} kg`, '', mandiSheshAmount.toFixed(2), 'Mandi Shesh', `${mandiSheshPct}%`]);
    rows.push(['', '', '', grossWeightQtl.toFixed(4), 'Gross Wt (Qtl)', '', commissionAmount.toFixed(2), 'Commission', `${commissionPct}%`]);
    rows.push(['', '', '', '', '', '', workerChargesAmount.toFixed(2), 'Worker Charges (Hamali)', workerRate]);
    rows.push(['', '', '', '', '', '', transportChargesAmount.toFixed(2), 'Transportation (Bhada)', transportRate]);
    if (bardanaChargesAmount > 0) {
      rows.push(['', '', '', '', '', '', bardanaChargesAmount.toFixed(2), 'Bardana Charges', bardanaChargesPerBag]);
    }
    rows.push(['', '', '', '', '', 'Total Mandi Expenses', totalExpenses.toFixed(2), '', '']);
    rows.push(['', '', '', '', '', 'Grand Total', grandTotal.toFixed(2), '', '']);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Statement');
    XLSX.writeFile(wb, `Statement_${finalMillName.replace(/[^a-zA-Z0-9]/g, '_')}_${statementDate}.xlsx`);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Action Header Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/90 flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 text-amber-700 rounded-xl border border-amber-500/30">
            <Calculator className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h2 className="text-base md:text-lg font-black text-slate-900">Buying Statement & Padta Calculator</h2>
            <p className="text-xs text-slate-500">APMC Saoner • Dual Input Weight Entry (Qtl + KG) & Rate Basis</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {savedSuccess && (
            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Saved to Archive!
            </span>
          )}

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-sm transition border border-emerald-600/50"
          >
            <Download className="w-4 h-4" />
            <span>Excel Export</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>Print Slip</span>
          </button>

          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl text-xs font-black shadow-md transition transform active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>Save Statement</span>
          </button>
        </div>
      </div>

      {/* Main Statement Sheet Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 overflow-hidden print-area">
        
        {/* Mandi Letterhead Header */}
        <div className="border-b border-slate-200 p-6 bg-slate-50/50">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-black text-slate-950 tracking-tight">R. MAHAJAN ENTERPRISE</h1>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
                  APMC Saoner
                </span>
              </div>
              <p className="text-xs font-bold text-slate-600 uppercase mt-0.5">Agricultural Product Market Committee, Saoner - 441107</p>
            </div>
            <div className="text-left md:text-right text-xs text-slate-600 space-y-0.5">
              <p><strong className="text-slate-900">Proprietor:</strong> Yash Mahajan (9850020793)</p>
              <p><strong className="text-slate-900">PAN:</strong> IKGPK7086G | <strong className="text-slate-900">State:</strong> 27 (Maharashtra)</p>
            </div>
          </div>

          {/* Statement Metadata Configuration Bar */}
          <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Target Dal Mill / Consignee</label>
              <select
                value={selectedMill}
                onChange={(e) => setSelectedMill(e.target.value)}
                className="w-full font-bold text-slate-900 bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 focus:ring-1 focus:ring-amber-500 shadow-sm"
              >
                {millParties.map(m => (
                  <option key={m.id} value={m.name}>{m.name}</option>
                ))}
                <option value="OTHER">+ Add Other Mill...</option>
              </select>
              {selectedMill === 'OTHER' && (
                <input
                  type="text"
                  placeholder="Type Dal Mill Name"
                  value={customMill}
                  onChange={(e) => setCustomMill(e.target.value)}
                  className="mt-1.5 w-full border border-amber-500 rounded-lg p-1.5 text-xs font-bold"
                />
              )}
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Statement Date</label>
              <input
                type="date"
                value={statementDate}
                onChange={(e) => setStatementDate(e.target.value)}
                className="w-full font-bold text-slate-900 bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 focus:ring-1 focus:ring-amber-500 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Commodity</label>
              <select
                value={commodity}
                onChange={(e) => setCommodity(e.target.value)}
                className="w-full font-bold text-slate-900 bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 focus:ring-1 focus:ring-amber-500 shadow-sm"
              >
                <option value="Toor">Toor (Arhar)</option>
                <option value="Chana">Chana (Gram)</option>
                <option value="Moong">Moong</option>
                <option value="Urad">Urad</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Statement Ref No.</label>
              <input
                type="text"
                value={statementNo}
                onChange={(e) => setStatementNo(e.target.value)}
                className="w-full font-mono font-bold text-slate-800 bg-slate-100/80 border border-slate-300 rounded-xl px-2.5 py-1.5 shadow-inner"
              />
            </div>
          </div>
        </div>

        {/* Dynamic Lots Table (Dual Input Qtl + KG Weight Entry) */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white uppercase text-[10px] md:text-[11px] font-black tracking-wider">
                <th className="py-3 px-3 text-center w-12 border-r border-slate-800">No.</th>
                <th className="py-3 px-3 min-w-[190px] border-r border-slate-800">Broker's / Farmer's Name</th>
                <th className="py-3 px-3 text-center min-w-[220px] border-r border-slate-800">
                  Weight (Quintal + KG)
                </th>
                <th className="py-3 px-3 text-right w-28 border-r border-slate-800">Rate (₹/Qtl)</th>
                <th className="py-3 px-3 text-right w-36 border-r border-slate-800">Bill Amount (₹)</th>
                <th className="py-3 px-3 text-right w-32 border-r border-slate-800">Brokerage (1.5%)</th>
                <th className="py-3 px-3 text-right w-36 border-r border-slate-800">Total Bill (₹)</th>
                <th className="py-3 px-3 w-32 border-r border-slate-800">Cheque / UTR</th>
                <th className="py-3 px-2 w-12 text-center no-print"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {calculatedLots.map((lot, index) => (
                <tr key={lot.id} className="hover:bg-amber-50/30 transition">
                  <td className="py-2.5 px-3 text-center font-bold text-slate-500 border-r border-slate-200">{index + 1}</td>
                  
                  {/* Broker Name */}
                  <td className="py-2 px-2 border-r border-slate-200">
                    <select
                      value={lot.brokerName}
                      onChange={(e) => handleUpdateLot(lot.id, 'brokerName', e.target.value)}
                      className="w-full font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    >
                      {brokerParties.map(bp => (
                        <option key={bp.id} value={bp.name}>{bp.name}</option>
                      ))}
                    </select>
                  </td>

                  {/* Dual Weight Input: Box 1 for Qtl, Box 2 for KG */}
                  <td className="py-2 px-2 border-r border-slate-200">
                    <div className="flex items-center justify-center gap-1.5">
                      
                      {/* Box 1: Quintals */}
                      <div className="relative w-24">
                        <input
                          type="number"
                          step="1"
                          value={lot.qtl !== undefined && lot.qtl !== null ? lot.qtl : ''}
                          onChange={(e) => handleUpdateLot(lot.id, 'qtl', e.target.value)}
                          className="w-full text-right font-mono font-black text-slate-900 bg-slate-50 border border-slate-300 rounded-lg pr-8 pl-1.5 py-1.5 text-xs focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                          placeholder="0"
                        />
                        <span className="absolute right-1.5 top-2 text-[10px] font-black text-amber-700 pointer-events-none">Qtl</span>
                      </div>

                      <span className="text-slate-400 font-black text-xs">+</span>

                      {/* Box 2: Kilograms (KG) */}
                      <div className="relative w-28">
                        <input
                          type="number"
                          step="0.1"
                          value={lot.kg !== undefined && lot.kg !== null ? lot.kg : ''}
                          onChange={(e) => handleUpdateLot(lot.id, 'kg', e.target.value)}
                          className="w-full text-right font-mono font-black text-slate-900 bg-slate-50 border border-slate-300 rounded-lg pr-7 pl-1.5 py-1.5 text-xs focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                          placeholder="0.0"
                        />
                        <span className="absolute right-1.5 top-2 text-[10px] font-black text-blue-700 pointer-events-none">KG</span>
                      </div>

                    </div>

                    {/* Instant Calculated Combined Weight Pill */}
                    <div className="text-[10px] font-mono text-center mt-1 font-bold">
                      <span className="text-slate-500">= </span>
                      <strong className="text-slate-950 font-black bg-amber-50 px-1 py-0.2 rounded border border-amber-200">
                        {lot.weight.toFixed(3)} Qtl
                      </strong>
                      <span className="text-slate-500 ml-1">
                        ({((parseFloat(lot.qtl || 0) * 100) + parseFloat(lot.kg || 0)).toFixed(1)} kg)
                      </span>
                    </div>
                  </td>

                  {/* Rate in ₹ per Quintal */}
                  <td className="py-2 px-2 border-r border-slate-200">
                    <div className="relative">
                      <span className="absolute left-2 top-2 text-[10px] font-bold text-slate-400 pointer-events-none">₹</span>
                      <input
                        type="number"
                        step="0.01"
                        value={lot.rate || ''}
                        onChange={(e) => handleUpdateLot(lot.id, 'rate', e.target.value)}
                        className="w-full text-right font-mono font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg pl-5 pr-2 py-1.5 focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                        placeholder="0.00"
                      />
                    </div>
                  </td>

                  {/* Bill Amount = Weight × Rate */}
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 border-r border-slate-200">
                    {lot.billAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>

                  {/* Brokerage 1.5% */}
                  <td className="py-2.5 px-3 text-right font-mono text-slate-600 font-semibold border-r border-slate-200">
                    {lot.brokerage.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>

                  {/* Total Bill Amount */}
                  <td className="py-2.5 px-3 text-right font-mono font-black text-slate-950 border-r border-slate-200">
                    {lot.totalLotAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>

                  {/* Cheque / UTR */}
                  <td className="py-2 px-2 border-r border-slate-200">
                    <input
                      type="text"
                      value={lot.chequeNo}
                      onChange={(e) => handleUpdateLot(lot.id, 'chequeNo', e.target.value)}
                      placeholder="CHQ / UTR"
                      className="w-full text-xs font-mono font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 focus:bg-white focus:border-amber-500"
                    />
                  </td>

                  {/* Delete Button */}
                  <td className="py-2 px-2 text-center no-print">
                    <button
                      onClick={() => handleDeleteLot(lot.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition rounded-lg"
                      title="Remove Row"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>

            {/* Table Subtotals Footer */}
            <tfoot>
              <tr className="bg-slate-100 font-black text-slate-900 border-t-2 border-slate-900">
                <td colSpan={2} className="py-3 px-3 uppercase text-amber-900 font-black tracking-wider">
                  LOT TOTALS:
                </td>
                <td className="py-3 px-3 text-center font-mono font-black text-amber-950 text-sm">
                  {totalWeightQtl.toFixed(3)} Qtl
                  <span className="block text-[10px] font-bold text-slate-500">
                    (= {(totalWeightQtl * 100).toFixed(1)} KG)
                  </span>
                </td>
                <td></td>
                <td className="py-3 px-3 text-right font-mono font-black">
                  {totalPureBill.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="py-3 px-3 text-right font-mono text-slate-700 font-bold">
                  {totalBrokerage.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="py-3 px-3 text-right font-mono font-black text-slate-950 text-sm">
                  {totalLotPurchases.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Add Row Button Strip */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 no-print flex justify-between items-center">
          <button
            onClick={handleAddLot}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Broker Row</span>
          </button>
          <span className="text-xs font-bold text-slate-500">
            {calculatedLots.length} Lots included in statement
          </span>
        </div>

        {/* Costing Engine & Padta Summary Cards */}
        <div className="p-6 bg-slate-50/80 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Left Box: Net Padta & Base Mandi Purchase */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Scale className="w-4 h-4 text-amber-600" />
                Purchases Summary & Net Padta
              </h4>
              <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-black text-slate-600 uppercase">Base Cost</span>
            </div>

            <div className="grid grid-cols-1 gap-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center">
                <div>
                  <span className="text-slate-500 font-semibold block text-[11px]">Total Purchased Weight:</span>
                  <span className="font-black text-xl text-slate-900 font-mono">{totalWeightQtl.toFixed(3)} Quintals</span>
                </div>
                <div className="text-right text-slate-500 text-xs font-bold">
                  = {(totalWeightQtl * 100).toLocaleString('en-IN')} KG
                </div>
              </div>
            </div>

            {/* Net Padta Highlight Box */}
            <div className="p-4 bg-amber-500/10 rounded-2xl border border-amber-500/30">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-amber-950">Net Padta (Base Cost Rate)</span>
                  <p className="text-[11px] text-amber-800">Formula: Pure Bill Amount ÷ Total Weight</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-amber-950 font-mono">
                    {formatIndianCurrency(netPadta)}
                  </span>
                  <span className="text-xs font-bold text-amber-800 block">/ Quintal</span>
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-600 space-y-1.5 pt-1">
              <div className="flex justify-between">
                <span>Total Broker Purchases:</span>
                <strong className="text-slate-900 font-mono">{formatIndianCurrency(totalPureBill)}</strong>
              </div>
              <div className="flex justify-between">
                <span>Total Brokerage (1.50%):</span>
                <strong className="text-slate-900 font-mono">{formatIndianCurrency(totalBrokerage)}</strong>
              </div>
              <div className="flex justify-between font-bold pt-1.5 border-t border-slate-100">
                <span>Total Purchases Outflow:</span>
                <strong className="text-slate-950 font-mono text-sm">{formatIndianCurrency(totalLotPurchases)}</strong>
              </div>
            </div>
          </div>

          {/* Right Box: Mandi Charges & Gross Padta */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Calculator className="w-4 h-4 text-emerald-600" />
                Mandi Expenses & Gross Padta
              </h4>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-black uppercase">Landed Cost</span>
            </div>

            {/* Optional Consignment Dispatch Bags */}
            <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-200/80 text-xs">
              <div className="flex items-center gap-1.5 text-amber-900 font-bold mb-2">
                <Package className="w-4 h-4 text-amber-600" />
                <span>Consignment Packing for Dal Mill (Optional for Tare & Hamali):</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Total Bags Packed:</label>
                  <input
                    type="number"
                    value={dispatchBags || ''}
                    onChange={(e) => setDispatchBags(parseInt(e.target.value) || 0)}
                    placeholder="e.g. 115"
                    className="w-full border border-slate-300 rounded-lg p-1.5 font-bold text-slate-900 text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Extra KG:</label>
                  <input
                    type="number"
                    value={dispatchExtraKg || ''}
                    onChange={(e) => setDispatchExtraKg(parseInt(e.target.value) || 0)}
                    placeholder="e.g. 35"
                    className="w-full border border-slate-300 rounded-lg p-1.5 font-bold text-slate-900 text-xs bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Configurable Charge Inputs */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Tare (kg/bag):</label>
                <input
                  type="number"
                  step="0.05"
                  value={bardanaRateKg}
                  onChange={(e) => setBardanaRateKg(parseFloat(e.target.value) || 0)}
                  className="w-full border border-slate-300 rounded-lg p-1.5 font-bold text-slate-900 text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Mandi Shesh (%):</label>
                <input
                  type="number"
                  step="0.01"
                  value={mandiSheshPct}
                  onChange={(e) => setMandiSheshPct(parseFloat(e.target.value) || 0)}
                  className="w-full border border-slate-300 rounded-lg p-1.5 font-bold text-slate-900 text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Commission (%):</label>
                <input
                  type="number"
                  step="0.01"
                  value={commissionPct}
                  onChange={(e) => setCommissionPct(parseFloat(e.target.value) || 0)}
                  className="w-full border border-slate-300 rounded-lg p-1.5 font-bold text-slate-900 text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Hamali (₹/bag):</label>
                <input
                  type="number"
                  step="1"
                  value={workerRate}
                  onChange={(e) => setWorkerRate(parseFloat(e.target.value) || 0)}
                  className="w-full border border-slate-300 rounded-lg p-1.5 font-bold text-slate-900 text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Bhada (₹/unit):</label>
                <input
                  type="number"
                  step="1"
                  value={transportRate}
                  onChange={(e) => setTransportRate(parseFloat(e.target.value) || 0)}
                  className="w-full border border-slate-300 rounded-lg p-1.5 font-bold text-slate-900 text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Bardana (₹/bag):</label>
                <input
                  type="number"
                  step="1"
                  value={bardanaChargesPerBag}
                  onChange={(e) => setBardanaChargesPerBag(parseFloat(e.target.value) || 0)}
                  className="w-full border border-slate-300 rounded-lg p-1.5 font-bold text-slate-900 text-xs"
                />
              </div>
            </div>

            {/* Expense breakdown list */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1.5 text-xs font-medium">
              {bardanaWeightQtl > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Bardana Weight ({bagsCount} bags × {bardanaRateKg} kg):</span>
                  <strong className="text-slate-900 font-mono">{bardanaWeightQtl.toFixed(4)} Qtl</strong>
                </div>
              )}
              <div className="flex justify-between text-slate-700">
                <span className="font-bold">Gross Wt with Bardana:</span>
                <strong className="text-amber-900 font-mono font-black">{grossWeightQtl.toFixed(4)} Quintals</strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Mandi Shesh ({mandiSheshPct}%):</span>
                <strong className="text-slate-900 font-mono">{formatIndianCurrency(mandiSheshAmount)}</strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Commission ({commissionPct}%):</span>
                <strong className="text-slate-900 font-mono">{formatIndianCurrency(commissionAmount)}</strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Hamali / Worker Charges:</span>
                <strong className="text-slate-900 font-mono">{formatIndianCurrency(workerChargesAmount)}</strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Transportation (Bhada):</span>
                <strong className="text-slate-900 font-mono">{formatIndianCurrency(transportChargesAmount)}</strong>
              </div>
              <div className="flex justify-between pt-1.5 border-t border-slate-200 font-black text-slate-900">
                <span>Total Mandi Expenses:</span>
                <strong className="font-mono text-slate-950">{formatIndianCurrency(totalExpenses)}</strong>
              </div>
            </div>

            {/* Grand Total & Gross Padta Box */}
            <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-md border border-slate-800 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-300 font-bold uppercase">Grand Total Cost:</span>
                <span className="text-xl font-black text-amber-400 font-mono">{formatIndianCurrency(grandTotal)}</span>
              </div>
              <div className="flex justify-between items-center pt-2.5 border-t border-slate-800">
                <div>
                  <span className="text-xs font-black uppercase text-emerald-400">GROSS PADTA (Landed Cost)</span>
                  <p className="text-[10px] text-slate-400">Grand Total ÷ Gross Wt ({grossWeightQtl.toFixed(3)} Qtl)</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-emerald-300 font-mono">{formatIndianCurrency(grossPadta)}</span>
                  <span className="text-xs font-bold text-slate-400 block">/ Quintal</span>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
