import React, { useState } from 'react';
import { 
  Printer, 
  Save, 
  Download, 
  Share2, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Building2, 
  Receipt,
  Copy,
  Check
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { numberToIndianWords, formatIndianCurrency } from '../utils/numberToWords';
import { getSystemSettings, getMasterParties, saveSaleInvoice } from '../utils/storage';

export default function SaleInvoice({ onSaveSuccess }) {
  const settings = getSystemSettings();
  const parties = getMasterParties();
  const millParties = parties.filter(p => p.type === 'Mill');
  const brokerParties = parties.filter(p => p.type === 'Broker');

  // Form State
  const [invoiceNo, setInvoiceNo] = useState(`RME/${new Date().getFullYear()}-${String(new Date().getFullYear() + 1).slice(2)}/${String(Math.floor(Math.random() * 900) + 100)}`);
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [buyerName, setBuyerName] = useState('');
  const [customBuyer, setCustomBuyer] = useState('');
  const [buyerAddress, setBuyerAddress] = useState('');
  const [broker, setBroker] = useState('');
  const [vehicleNo, setVehicleNo] = useState('');
  const [transporter, setTransporter] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('Unpaid');

  // Line Items State - Fresh Empty Row
  const [items, setItems] = useState([
    { id: '1', description: 'Toor', bags: '', grossWeight: '', tarePerBag: 0.006, rate: '' }
  ]);

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedBank, setCopiedBank] = useState(false);

  // Auto-calculated item fields
  const calculatedItems = items.map(item => {
    const bags = parseInt(item.bags) || 0;
    const gross = parseFloat(item.grossWeight) || 0;
    const tare = bags * (item.tarePerBag || 0.006); // 0.6 kg = 0.006 MT/Qtl
    const net = Math.max(0, gross - tare);
    const rate = parseFloat(item.rate) || 0;
    const amount = gross * rate; // In user sheet: 27.57 * 10845.48 = 298978.88
    return {
      ...item,
      bags,
      grossWeight: gross,
      netWeight: parseFloat(net.toFixed(3)),
      rate,
      amount
    };
  });

  const totalBags = calculatedItems.reduce((sum, it) => sum + it.bags, 0);
  const totalAmount = calculatedItems.reduce((sum, it) => sum + it.amount, 0);
  const grandTotal = Math.round(totalAmount);
  const amountWords = numberToIndianWords(grandTotal);

  // Item Management
  const handleAddItem = () => {
    setItems([
      ...items,
      {
        id: String(Date.now()),
        description: 'Toor',
        bags: 0,
        grossWeight: 0,
        tarePerBag: 0.006,
        rate: 0
      }
    ]);
  };

  const handleUpdateItem = (id, field, value) => {
    setItems(items.map(it => it.id === id ? { ...it, [field]: value } : it));
  };

  const handleDeleteItem = (id) => {
    if (items.length <= 1) return;
    setItems(items.filter(it => it.id !== id));
  };

  // Save Invoice
  const handleSaveInvoice = () => {
    const finalBuyer = buyerName === 'OTHER' ? customBuyer : buyerName;
    const invoiceObj = {
      id: `inv-${Date.now()}`,
      invoiceNo,
      date: invoiceDate,
      buyerName: finalBuyer,
      buyerAddress,
      broker,
      vehicleNo,
      transporter,
      paymentStatus,
      items: calculatedItems,
      totalBags,
      totalAmount,
      grandTotal,
      amountInWords: amountWords,
      createdAt: new Date().toISOString()
    };

    saveSaleInvoice(invoiceObj);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
    if (onSaveSuccess) onSaveSuccess();
  };

  // Export to Excel
  const handleExportExcel = () => {
    const finalBuyer = buyerName === 'OTHER' ? customBuyer : buyerName;
    const wb = XLSX.utils.book_new();

    const rows = [
      ['R. MAHAJAN ENTERPRISE', '', '', '', '', '', ''],
      ['GRAIN MERCHANTS OF TOOR, CHANA ETC.', '', '', '', '', '', ''],
      ['A.P.M.C. SAONER - 441107    |    Yash Mahajan: 9850020793', '', '', '', '', '', ''],
      ['PAN No.: IKGPK7086G', '', '', '', 'Maharashtra State Code: 27', '', ''],
      ['Buyer/Consignee:', '', '', '', 'Date:', invoiceDate, ''],
      [finalBuyer, '', '', '', 'Broker:', broker, ''],
      [buyerAddress, '', '', '', 'Vehicle No.:', vehicleNo, ''],
      ['', '', '', '', 'Transporter:', transporter, ''],
      ['S.No.', 'Description of Goods', 'Bags', 'Gross Wt.', 'Net Wt.', 'Rate', 'Amount (₹)']
    ];

    calculatedItems.forEach((it, idx) => {
      rows.push([
        idx + 1,
        it.description,
        it.bags,
        it.grossWeight.toFixed(3),
        it.netWeight.toFixed(3),
        it.rate.toFixed(2),
        it.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      ]);
    });

    rows.push(['TOTAL', '', '', '', '', '', totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })]);
    rows.push(['Rs. in Words: ' + amountWords, '', '', '', '', '', '']);
    rows.push(['GRAND TOTAL', '', '', '', '', '', `₹${grandTotal.toLocaleString('en-IN')}/-`]);
    rows.push(['Bank:', settings.bankName || 'AXIS BANK', '', '', '', '', '']);
    rows.push(['Branch:', settings.branch || 'SAONER', '', '', '', '', '']);
    rows.push(['A/c No.:', settings.accountNo || '924020061268613', '', '', '', '', '']);
    rows.push(['IFSC Code:', settings.ifscCode || 'UTIB0003817', '', '', '', '', '']);
    rows.push(['Note: Payment within 10 days otherwise interest @ 24% Per Annum will be charged from the date of the bill.', '', '', '', '', '', '']);
    rows.push(["Buyer's Signature", '', 'E. & O. E.', '', 'For, R. MAHAJAN ENTERPRISE', '', '']);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Sale Bill');
    XLSX.writeFile(wb, `Bill_${finalBuyer.replace(/[^a-zA-Z0-9]/g, '_')}_${invoiceNo.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`);
  };

  // WhatsApp Share
  const handleWhatsAppShare = () => {
    const finalBuyer = buyerName === 'OTHER' ? customBuyer : buyerName;
    const msg = `*R. MAHAJAN ENTERPRISE - SALE BILL*\n` +
      `Bill No: ${invoiceNo}\n` +
      `Date: ${invoiceDate}\n` +
      `Buyer: ${finalBuyer}\n` +
      `Vehicle: ${vehicleNo}\n` +
      `Total Bags: ${totalBags}\n` +
      `Grand Total: ₹${grandTotal.toLocaleString('en-IN')}/-\n\n` +
      `Bank Details:\n` +
      `AXIS BANK SAONER\n` +
      `A/c: ${settings.accountNo || '924020061268613'}\n` +
      `IFSC: ${settings.ifscCode || 'UTIB0003817'}\n\n` +
      `Payment terms: within 10 days.`;

    const encoded = encodeURIComponent(msg);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  const copyBankInfo = () => {
    const txt = `A/c: ${settings.accountNo || '924020061268613'}, IFSC: ${settings.ifscCode || 'UTIB0003817'}, AXIS BANK SAONER`;
    navigator.clipboard.writeText(txt);
    setCopiedBank(true);
    setTimeout(() => setCopiedBank(false), 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Action Header */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/90 flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-500/10 text-blue-700 rounded-xl border border-blue-500/30">
            <Receipt className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-base md:text-lg font-black text-slate-900">Sale Bill / Tax Invoice Generator</h2>
            <p className="text-xs text-slate-500">APMC Saoner Official Mill Dispatch Invoice</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {savedSuccess && (
            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Invoice Saved!
            </span>
          )}

          <button
            onClick={handleWhatsAppShare}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-sm transition"
          >
            <Share2 className="w-4 h-4" />
            <span>WhatsApp</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-sm transition border border-emerald-600/50"
          >
            <Download className="w-4 h-4" />
            <span>Excel</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>Print Bill / PDF</span>
          </button>

          <button
            onClick={handleSaveInvoice}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 rounded-xl text-xs font-black shadow-md transition transform active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>Save & Archive</span>
          </button>
        </div>
      </div>

      {/* Official Invoice Sheet Container */}
      <div className="bg-white rounded-2xl shadow-md border-2 border-slate-900 overflow-hidden max-w-4xl mx-auto print-area print:border-2 print:border-slate-900 print:rounded-none print:shadow-none print:max-w-none print:w-full">
        
        {/* Bill Top Banner */}
        <div className="text-center p-4 md:p-6 print:p-2 border-b-2 border-slate-900 bg-slate-50/50">
          <h1 className="text-2xl md:text-3xl print:text-xl font-black tracking-wider text-slate-950 uppercase font-serif">
            {settings.enterpriseName || 'R. MAHAJAN ENTERPRISE'}
          </h1>
          <p className="text-xs print:text-[10px] font-bold tracking-widest text-slate-700 uppercase mt-0.5">
            {settings.tagline || 'GRAIN MERCHANTS OF TOOR, CHANA ETC.'}
          </p>
          <div className="flex flex-wrap justify-center items-center gap-3 print:gap-2 text-xs print:text-[10px] font-semibold text-slate-600 mt-1">
            <span>{settings.apmcAddress || 'A.P.M.C. SAONER - 441107'}</span>
            <span>•</span>
            <span>Yash Mahajan: <strong className="text-slate-950">{settings.phone || '9850020793'}</strong></span>
          </div>

          <div className="flex justify-between items-center text-xs print:text-[10px] font-mono font-bold text-slate-800 mt-2 pt-1.5 print:mt-1 print:pt-1 border-t border-slate-300">
            <span>PAN No.: <strong className="text-slate-950 font-black">{settings.panNo || 'IKGPK7086G'}</strong></span>
            <span>Maharashtra State Code: <strong className="text-slate-950 font-black">{settings.stateCode || '27'}</strong></span>
          </div>
        </div>

        {/* Consignee & Dispatch Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 border-b-2 border-slate-900 text-xs print:text-[11px]">
          
          {/* Buyer Details */}
          <div className="p-3 md:p-4 print:p-2 border-b md:border-b-0 md:border-r-2 print:border-b-0 print:border-r-2 border-slate-900 space-y-1.5 print:space-y-0.5">
            <span className="font-black uppercase text-[10px] print:text-[9px] text-slate-500 tracking-wider block">Buyer / Consignee:</span>
            
            <div className="no-print">
              <select
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                className="w-full font-black text-xs md:text-sm text-slate-900 border border-slate-300 rounded-lg p-2 mb-1.5 focus:ring-1 focus:ring-amber-500"
              >
                <option value="">-- Select Buyer / Consignee --</option>
                {millParties.map(m => (
                  <option key={m.id} value={m.name}>{m.name}</option>
                ))}
                <option value="OTHER">+ Add Other Buyer...</option>
              </select>
              {buyerName === 'OTHER' && (
                <input
                  type="text"
                  placeholder="Type Buyer Mill Name"
                  value={customBuyer}
                  onChange={(e) => setCustomBuyer(e.target.value)}
                  className="w-full border border-amber-500 rounded-lg p-1.5 font-bold text-xs mb-1.5"
                />
              )}
            </div>

            {/* Print View for Buyer */}
            <div className="font-black text-sm md:text-base print:text-sm text-slate-950 uppercase">
              {buyerName === 'OTHER' ? customBuyer : buyerName}
            </div>

            <div>
              <label className="text-[10px] print:text-[9px] font-bold text-slate-500 block mb-0.5 print:mb-0">City / Delivery Address:</label>
              <input
                type="text"
                value={buyerAddress}
                onChange={(e) => setBuyerAddress(e.target.value)}
                className="w-full font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 print:px-0 print:py-0 print:border-0 print:bg-transparent text-xs print:text-[11px]"
              />
            </div>
          </div>

          {/* Invoice & Dispatch Meta */}
          <div className="p-3 md:p-4 print:p-2 space-y-2 print:space-y-1">
            <div className="grid grid-cols-2 gap-2 print:gap-1.5">
              <div>
                <label className="text-[10px] print:text-[9px] font-bold text-slate-500 block mb-0.5 print:mb-0">Invoice Date:</label>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="w-full font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 print:px-0 print:py-0 print:border-0 print:bg-transparent text-xs print:text-[11px]"
                />
              </div>
              <div>
                <label className="text-[10px] print:text-[9px] font-bold text-slate-500 block mb-0.5 print:mb-0">Broker:</label>
                <select
                  value={broker}
                  onChange={(e) => setBroker(e.target.value)}
                  className="w-full font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 print:px-0 print:py-0 print:border-0 print:bg-transparent text-xs print:text-[11px]"
                >
                  <option value="">-- Select Broker --</option>
                  {brokerParties.map(bp => (
                    <option key={bp.id} value={bp.name}>{bp.name}</option>
                  ))}
                  <option value="Direct / Self">Direct / Self</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 print:gap-1.5">
              <div>
                <label className="text-[10px] print:text-[9px] font-bold text-slate-500 block mb-0.5 print:mb-0">Vehicle No.:</label>
                <input
                  type="text"
                  value={vehicleNo}
                  onChange={(e) => setVehicleNo(e.target.value)}
                  placeholder="e.g. MH 40 CM 8588"
                  className="w-full font-mono font-black text-slate-900 uppercase bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 print:px-0 print:py-0 print:border-0 print:bg-transparent text-xs print:text-[11px]"
                />
              </div>
              <div>
                <label className="text-[10px] print:text-[9px] font-bold text-slate-500 block mb-0.5 print:mb-0">Transporter:</label>
                <input
                  type="text"
                  value={transporter}
                  onChange={(e) => setTransporter(e.target.value)}
                  placeholder="Transporter Name"
                  className="w-full font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 print:px-0 print:py-0 print:border-0 print:bg-transparent text-xs print:text-[11px]"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Goods Line Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-900 bg-slate-100 font-black text-slate-900 uppercase text-[10px] md:text-[11px] print:text-[9.5px]">
                <th className="py-2 md:py-2.5 px-3 print:py-1 print:px-2 text-center w-12 print:w-10 border-r border-slate-300">S.No.</th>
                <th className="py-2 md:py-2.5 px-3 print:py-1 print:px-2 border-r border-slate-300">Description of Goods</th>
                <th className="py-2 md:py-2.5 px-3 print:py-1 print:px-2 text-right w-20 print:w-16 border-r border-slate-300">Bags</th>
                <th className="py-2 md:py-2.5 px-3 print:py-1 print:px-2 text-right w-28 print:w-24 border-r border-slate-300">Gross Wt. (Qtl)</th>
                <th className="py-2 md:py-2.5 px-3 print:py-1 print:px-2 text-right w-28 print:w-24 border-r border-slate-300">Net Wt. (Qtl)</th>
                <th className="py-2 md:py-2.5 px-3 print:py-1 print:px-2 text-right w-28 print:w-24 border-r border-slate-300">Rate (₹/Qtl)</th>
                <th className="py-2 md:py-2.5 px-3 print:py-1 print:px-2 text-right w-36 print:w-32">Amount (₹)</th>
                <th className="py-2.5 px-2 text-center w-12 no-print"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {calculatedItems.map((item, idx) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="py-1.5 md:py-2 px-3 print:py-1 print:px-2 text-center font-bold text-slate-600 border-r border-slate-300">{idx + 1}</td>
                  
                  <td className="py-1.5 px-2 print:py-1 print:px-2 border-r border-slate-300">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleUpdateItem(item.id, 'description', e.target.value)}
                      className="w-full font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded px-2 py-1 print:p-0 print:border-0 print:bg-transparent text-xs print:text-[11px]"
                    />
                  </td>

                  <td className="py-1.5 px-2 print:py-1 print:px-2 text-right border-r border-slate-300">
                    <input
                      type="number"
                      value={item.bags || ''}
                      onChange={(e) => handleUpdateItem(item.id, 'bags', e.target.value)}
                      className="w-full text-right font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded px-2 py-1 print:p-0 print:border-0 print:bg-transparent text-xs print:text-[11px]"
                    />
                  </td>

                  <td className="py-1.5 px-2 print:py-1 print:px-2 text-right border-r border-slate-300">
                    <input
                      type="number"
                      step="0.001"
                      value={item.grossWeight || ''}
                      onChange={(e) => handleUpdateItem(item.id, 'grossWeight', e.target.value)}
                      className="w-full text-right font-mono font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded px-2 py-1 print:p-0 print:border-0 print:bg-transparent text-xs print:text-[11px]"
                    />
                  </td>

                  <td className="py-1.5 md:py-2 px-3 print:py-1 print:px-2 text-right font-mono font-black text-slate-800 border-r border-slate-300 text-xs print:text-[11px]">
                    {item.netWeight.toFixed(3)}
                  </td>

                  <td className="py-1.5 px-2 print:py-1 print:px-2 text-right border-r border-slate-300">
                    <input
                      type="number"
                      step="0.01"
                      value={item.rate || ''}
                      onChange={(e) => handleUpdateItem(item.id, 'rate', e.target.value)}
                      className="w-full text-right font-mono font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded px-2 py-1 print:p-0 print:border-0 print:bg-transparent text-xs print:text-[11px]"
                    />
                  </td>

                  <td className="py-1.5 md:py-2 px-3 print:py-1 print:px-2 text-right font-mono font-black text-slate-950 text-sm print:text-xs">
                    {item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>

                  <td className="py-1.5 px-2 text-center no-print">
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>

            {/* Total Row */}
            <tfoot>
              <tr className="border-t-2 border-slate-900 bg-slate-50 font-black">
                <td colSpan={2} className="py-2 md:py-3 px-3 print:py-1 print:px-2 uppercase text-slate-900 font-black text-xs print:text-[11px]">TOTAL:</td>
                <td className="py-2 md:py-3 px-3 print:py-1 print:px-2 text-right font-black text-slate-900 text-xs print:text-[11px]">{totalBags}</td>
                <td colSpan={3} className="border-r border-slate-300"></td>
                <td className="py-2 md:py-3 px-3 print:py-1 print:px-2 text-right font-black text-slate-950 text-sm print:text-xs font-mono">
                  {totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="no-print"></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Add Row Button */}
        <div className="p-2.5 border-t border-slate-200 bg-slate-50/50 no-print">
          <button
            onClick={handleAddItem}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-900 rounded-lg font-bold text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Goods Item</span>
          </button>
        </div>

        {/* Amount in Words & Grand Total Banner */}
        <div className="border-t-2 border-slate-900 p-3 md:p-4 print:p-2 space-y-1 bg-gradient-to-r from-amber-50/40 via-white to-amber-50/20">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-1.5 print:flex-row print:items-center">
            <div className="text-xs">
              <span className="font-black text-slate-500 uppercase tracking-wider block text-[10px] print:text-[9px]">Rupees in Words:</span>
              <p className="font-extrabold text-slate-950 italic text-xs md:text-sm print:text-[11px]">{amountWords}</p>
            </div>
            <div className="text-right">
              <span className="font-black text-slate-500 uppercase tracking-wider block text-[10px] print:text-[9px]">GRAND TOTAL:</span>
              <span className="text-xl md:text-2xl print:text-lg font-black text-slate-950 font-mono">₹{grandTotal.toLocaleString('en-IN')}/-</span>
            </div>
          </div>
        </div>

        {/* Bank Details & Terms */}
        <div className="border-t-2 border-slate-900 p-3 md:p-4 print:p-2 grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-3 print:gap-2 text-xs bg-slate-50">
          
          {/* Axis Bank Saoner Details */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-black uppercase text-[10px] print:text-[9px] text-slate-600 tracking-wider">Bank Details for RTGS / NEFT:</span>
              <button 
                onClick={copyBankInfo}
                className="no-print text-[10px] text-slate-500 hover:text-slate-900 flex items-center gap-1 font-bold"
              >
                {copiedBank ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                {copiedBank ? 'Copied!' : 'Copy Bank Info'}
              </button>
            </div>
            <div className="bg-white p-2.5 md:p-3 print:p-1.5 rounded-xl border border-slate-300 font-mono text-xs print:text-[10px] space-y-0.5 shadow-sm">
              <p><strong className="text-slate-900 font-sans">Bank:</strong> {settings.bankName || 'AXIS BANK'}</p>
              <p><strong className="text-slate-900 font-sans">Branch:</strong> {settings.branch || 'SAONER'}</p>
              <p><strong className="text-slate-900 font-sans">A/c No.:</strong> <span className="font-black text-amber-950 text-xs md:text-sm print:text-xs tracking-wide">{settings.accountNo || '924020061268613'}</span></p>
              <p><strong className="text-slate-900 font-sans">IFSC Code:</strong> <span className="font-black text-slate-950">{settings.ifscCode || 'UTIB0003817'}</span></p>
            </div>
          </div>

          {/* Legal Note & Terms */}
          <div className="space-y-1.5 text-[11px] print:text-[9.5px] text-slate-600 flex flex-col justify-between">
            <div>
              <strong className="text-slate-900">Note & Statutory Terms:</strong>
              <p className="mt-0.5 leading-relaxed print:leading-tight">
                Payment within 10 days otherwise interest @ 24% Per Annum will be charged from the date of the bill. Buyer is responsible to collect the Transporter's Copy at the time of unloading. Subject to Nagpur Jurisdiction.
              </p>
            </div>

            <div className="flex justify-between items-center text-xs print:text-[10px] font-bold text-slate-700 pt-1.5 border-t border-slate-200">
              <span>Payment Status: <strong className={paymentStatus === 'Paid' ? 'text-emerald-700 font-black' : 'text-rose-700 font-black'}>{paymentStatus}</strong></span>
              <button 
                onClick={() => setPaymentStatus(paymentStatus === 'Paid' ? 'Unpaid' : 'Paid')}
                className="no-print text-[11px] underline text-blue-700 font-bold"
              >
                Mark as {paymentStatus === 'Paid' ? 'Unpaid' : 'Paid'}
              </button>
            </div>
          </div>

        </div>

        {/* Signatures Footer */}
        <div className="border-t-2 border-slate-900 p-4 md:p-6 print:py-2.5 print:px-4 grid grid-cols-3 text-center text-xs print:text-[10px] font-bold text-slate-800">
          <div className="pt-6 md:pt-10 print:pt-4 border-t border-slate-300 mx-2 md:mx-4">
            Buyer's Signature
          </div>
          <div className="pt-6 md:pt-10 print:pt-4 mx-2 md:mx-4 text-slate-400 font-medium">
            E. & O. E.
          </div>
          <div className="pt-6 md:pt-10 print:pt-4 border-t border-slate-300 mx-2 md:mx-4">
            For, R. MAHAJAN ENTERPRISE<br />
            <span className="text-[10px] print:text-[9px] text-slate-500 font-normal">(Authorised Signatory)</span>
          </div>
        </div>

      </div>

    </div>
  );
}
