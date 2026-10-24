import * as XLSX from 'xlsx';

/**
 * Builds a single worksheet formatted EXACTLY like R. Mahajan Enterprise's authentic APMC Excel sheet.
 */
export function buildStatementWorksheet(statement, settings = {}) {
  const ws = {};

  const millName = statement.millName || 'General';
  const statementDate = statement.date || new Date().toISOString().slice(0, 10);
  const parts = statementDate.split('-');
  const formattedDate = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : statementDate;

  // Helper to set cell
  function setCell(r, c, val, formula = null, numFmt = null) {
    const addr = XLSX.utils.encode_cell({ r, c });
    const cell = { v: val };
    if (typeof val === 'number') {
      cell.t = 'n';
    } else if (typeof val === 'boolean') {
      cell.t = 'b';
    } else {
      cell.t = 's';
    }
    if (formula) cell.f = formula;
    if (numFmt) cell.z = numFmt;
    ws[addr] = cell;
  }

  // Row 1 (0-indexed: r = 0)
  setCell(0, 0, settings.enterpriseName || 'R. MAHAJAN ENTERPRISE');
  setCell(0, 8, `Proprietor : ${settings.proprietor || 'Yash Mahajan'}`);

  // Row 2 (r = 1)
  setCell(1, 0, settings.apmcAddress || 'Agricultural Product Market Committee, Saoner');
  setCell(1, 8, `                                  Mob. : ${settings.phone || '9850020793'}`);

  // Row 3 (r = 2)
  setCell(2, 0, millName ? `STATEMENT (${millName})` : 'STATEMENT');
  setCell(2, 8, `                               Date: ${formattedDate}`);

  // Row 4 Headers (r = 3)
  const headers = ['No.', "Broker's Name", 'Bags', 'Weight', 'Rate', 'Bill Amount', 'Brokerage', 'Total Bill Amount', 'Check No.', 'Stock'];
  headers.forEach((h, c) => setCell(3, c, h));

  const lots = statement.lots || [];
  const minRows = 11;
  const numRows = Math.max(minRows, lots.length);

  for (let i = 0; i < numRows; i++) {
    const r = 4 + i;       // row index in 0-based
    const rowNum = r + 1;  // 1-based row number for Excel formulas
    const lot = lots[i];

    if (lot && (lot.brokerName || lot.weight || lot.billAmount || lot.rate)) {
      setCell(r, 0, i + 1);
      setCell(r, 1, lot.brokerName || '');
      setCell(r, 2, '');
      const w = parseFloat(lot.weight) || 0;
      setCell(r, 3, w);
      setCell(r, 4, lot.rate ? parseFloat(lot.rate) : '');
      const billAmt = parseFloat(lot.billAmount) || 0;
      setCell(r, 5, billAmt, null, '#,##0.00');
      const brokerage = parseFloat(lot.brokerage) || parseFloat((billAmt * 0.015).toFixed(2));
      setCell(r, 6, brokerage, `F${rowNum}*0.015`, '#,##0.00');
      const totalLot = parseFloat(lot.total || lot.totalLotAmount) || parseFloat((billAmt + brokerage).toFixed(2));
      setCell(r, 7, totalLot, `F${rowNum}+G${rowNum}`, '#,##0.00');
      setCell(r, 8, lot.chequeNo || '');
      setCell(r, 9, lot.stockStatus || 'Cleared');
    } else {
      setCell(r, 6, 0, `F${rowNum}*0.015`, '#,##0.00');
      setCell(r, 7, 0, `F${rowNum}+G${rowNum}`, '#,##0.00');
    }
  }

  const subtotalRow = 4 + numRows; // Row 16 for 11 lots
  const subtotalRowNum = subtotalRow + 1;

  setCell(subtotalRow, 3, statement.totalWeight || 0, `SUM(D5:D${subtotalRowNum - 1})`);
  setCell(subtotalRow, 5, statement.pureBillAmount || 0, `SUM(F5:F${subtotalRowNum - 1})`, '#,##0.00');
  setCell(subtotalRow, 6, statement.totalBrokerage || 0, `SUM(G5:G${subtotalRowNum - 1})`, '#,##0.00');
  setCell(subtotalRow, 7, statement.lotPurchaseTotal || 0, `F${subtotalRowNum}+G${subtotalRowNum}`, '#,##0.00');

  // Packing Row (Row 17: r = subtotalRow + 1)
  const packingRow = subtotalRow + 1;
  const packingRowNum = packingRow + 1;
  const bags = parseInt(statement.dispatchBags) || 0;
  const extraKg = parseInt(statement.dispatchExtraKg) || 0;
  const totalKg = bags > 0 ? (bags * 65 + extraKg) : Math.round((statement.totalWeight || 0) * 100);
  
  if (bags > 0 || extraKg > 0) {
    setCell(packingRow, 1, `${bags} Bags | ${extraKg} KG`, `INT(D${packingRowNum}/65)&" Bags | "&MOD(D${packingRowNum},65)&" KG"`);
    setCell(packingRow, 3, totalKg);
  } else {
    setCell(packingRow, 1, '0 Bags | 0 KG');
    setCell(packingRow, 3, totalKg);
  }

  // Net Padta Row (Row 19: r = subtotalRow + 3)
  const netPadtaRow = subtotalRow + 3;
  setCell(netPadtaRow, 1, `Net Padta: ${(statement.netPadta || 0).toFixed(2)}`, `"Net Padta: "&ROUND(F${subtotalRowNum}/D${subtotalRowNum},2)`);

  // Expenses Block (Rows 21 to 26)
  const expRow1 = subtotalRow + 5; // Row 21 (0-indexed 20)
  const expRow2 = expRow1 + 1;     // Row 22
  const expRow3 = expRow1 + 2;     // Row 23
  const expRow4 = expRow1 + 3;     // Row 24
  const totalExpRow = expRow1 + 4; // Row 25
  const grandTotalRow = expRow1 + 5; // Row 26

  const grandTotalRowNum = grandTotalRow + 1;
  const expRow2Num = expRow2 + 1;

  const bardanaTare = parseFloat(statement.bardanaRateKg) || 0.6;
  const mandiSheshPct = parseFloat(statement.mandiSheshPct) || 1.05;
  const commissionPct = parseFloat(statement.commissionPct) || 1.5;
  const workerRate = parseFloat(statement.workerRate) || 14;
  const transportRate = parseFloat(statement.transportRate) || 40;

  // Row 21: Gross Padta + Bardana + Mandi Shesh
  setCell(expRow1, 1, `Gross Padta: ${(statement.grossPadta || 0).toFixed(2)}`, `"Gross Padta: " &ROUND(H${grandTotalRowNum}/D${expRow2Num},2)`);
  setCell(expRow1, 3, statement.bardanaWeight || (statement.totalWeight / 65 * bardanaTare), `D${subtotalRowNum}/65*${bardanaTare}`);
  setCell(expRow1, 4, `Bardana Weight: ${bardanaTare}`);
  setCell(expRow1, 7, statement.mandiSheshAmount || 0, `F${subtotalRowNum}*J${expRow1 + 1}`, '#,##0.00');
  setCell(expRow1, 8, 'Mandi Shesh');
  setCell(expRow1, 9, mandiSheshPct / 100, null, '0.00%');

  // Row 22: Gross Weight + Commission
  setCell(expRow2, 3, statement.grossWeight || 0, `D${subtotalRowNum}+D${expRow1 + 1}`);
  setCell(expRow2, 7, statement.commissionAmount || 0, `F${subtotalRowNum}*J${expRow2 + 1}`, '#,##0.00');
  setCell(expRow2, 8, 'Commission');
  setCell(expRow2, 9, commissionPct / 100, null, '0.00%');

  // Row 23: Worker Charges
  setCell(expRow3, 7, statement.workerCharges || 0, `D${packingRowNum}/65*J${expRow3 + 1}`, '#,##0.00');
  setCell(expRow3, 8, 'Worker Charges');
  setCell(expRow3, 9, workerRate);

  // Row 24: Transportation Charges
  setCell(expRow4, 7, statement.transportCharges || 0, `D${expRow2Num}*J${expRow4 + 1}`, '#,##0.00');
  setCell(expRow4, 8, 'Transportation Charges');
  setCell(expRow4, 9, transportRate);

  // Row 25: Total Expenses
  setCell(totalExpRow, 6, 'Total');
  setCell(totalExpRow, 7, statement.totalExpenses || 0, `SUM(H${expRow1 + 1}:H${expRow4 + 1})`, '#,##0.00');

  // Row 26: Grand Total
  setCell(grandTotalRow, 6, 'Grand Total');
  setCell(grandTotalRow, 7, statement.grandTotal || 0, `H${subtotalRowNum}+H${totalExpRow + 1}`, '#,##0.00');

  // Merged Header ranges (matching original template)
  ws['!ref'] = `A1:J${grandTotalRow + 1}`;
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } },
    { s: { r: 0, c: 8 }, e: { r: 0, c: 9 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } },
    { s: { r: 1, c: 8 }, e: { r: 1, c: 9 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 7 } },
    { s: { r: 2, c: 8 }, e: { r: 2, c: 9 } }
  ];

  // Professional column widths
  ws['!cols'] = [
    { wch: 6 },  // A: No.
    { wch: 28 }, // B: Broker's Name
    { wch: 8 },  // C: Bags
    { wch: 14 }, // D: Weight
    { wch: 12 }, // E: Rate
    { wch: 16 }, // F: Bill Amount
    { wch: 14 }, // G: Brokerage
    { wch: 18 }, // H: Total Bill Amount
    { wch: 24 }, // I: Check No. / Charge Name
    { wch: 16 }  // J: Stock / Rate %
  ];

  return ws;
}

/**
 * Exports a single Mandi statement to an .xlsx file matching the user's authentic format.
 */
export function exportSingleStatementToExcel(statement, settings = {}) {
  const wb = XLSX.utils.book_new();
  const ws = buildStatementWorksheet(statement, settings);
  
  const rawMill = statement.millName || 'Purchasing';
  // Clean sheet name: max 31 chars, no special characters disallowed by Excel
  const cleanSheetName = (rawMill.replace(/Pvt\.?|Ltd\.?|Industry|Industries/gi, '').trim().split(' ')[0] || 'Purchasing').slice(0, 31);
  XLSX.utils.book_append_sheet(wb, ws, cleanSheetName);

  const cleanFileName = `Mandi_Statement_${rawMill.replace(/[^a-zA-Z0-9]/g, '_')}_${statement.date || new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, cleanFileName);
}

/**
 * Exports multiple Mandi statements into one workbook, each statement as its own tab.
 */
export function exportMultipleStatementsToExcel(statements, settings = {}) {
  const wb = XLSX.utils.book_new();

  if (!statements || statements.length === 0) {
    const ws = buildStatementWorksheet({ millName: 'Purchasing', lots: [] }, settings);
    XLSX.utils.book_append_sheet(wb, ws, 'Purchasing');
  } else {
    const usedNames = new Set();
    statements.forEach((stmt, idx) => {
      const ws = buildStatementWorksheet(stmt, settings);
      let sheetName = (stmt.millName || `Statement_${idx + 1}`).replace(/Pvt\.?|Ltd\.?|Industry|Industries/gi, '').trim().split(' ')[0] || `Statement_${idx + 1}`;
      sheetName = sheetName.slice(0, 28);
      if (usedNames.has(sheetName)) {
        sheetName = `${sheetName}_${idx + 1}`;
      }
      usedNames.add(sheetName);
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    });
  }

  const cleanFileName = `Mahajan_Enterprise_Mandi_Purchases_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, cleanFileName);
}
