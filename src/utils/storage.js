import { supabase } from './supabase';

// LocalStorage persistence engine with pre-seeded data from Excel sheets

const STORAGE_KEYS = {
  SETTINGS: 'rme_system_settings',
  STATEMENTS: 'rme_procurement_statements',
  INVOICES: 'rme_sale_invoices',
  PARTIES: 'rme_master_parties',
  AUTH: 'rme_current_user'
};

const DEFAULT_SETTINGS = {
  enterpriseName: 'R. MAHAJAN ENTERPRISE',
  tagline: 'GRAIN MERCHANTS OF TOOR, CHANA ETC.',
  apmcAddress: 'A.P.M.C. SAONER - 441107',
  proprietor: 'Yash Mahajan',
  phone: '9850020793',
  panNo: 'IKGPK7086G',
  stateCode: '27',
  bankName: 'AXIS BANK',
  branch: 'SAONER',
  accountNo: '924020061268613',
  ifscCode: 'UTIB0003817',
  defaultBrokeragePct: 1.5,
  defaultMandiSheshPct: 1.05,
  defaultCommissionPct: 1.5,
  defaultWorkerRate: 14,
  defaultTransportRate: 40,
  defaultBardanaTareKg: 0.6
};

const DEFAULT_PARTIES = [
  { id: 'p1', name: 'Dilip Jain', type: 'Broker', phone: '9823100001', city: 'Saoner' },
  { id: 'p2', name: 'Roshan Chandak', type: 'Broker', phone: '9823100002', city: 'Saoner' },
  { id: 'p3', name: 'Dhonbaji Nirgude', type: 'Broker', phone: '9823100003', city: 'Saoner' },
  { id: 'p4', name: 'Jagdish Thakare', type: 'Broker', phone: '9823100004', city: 'Saoner' },
  { id: 'p5', name: 'Ramesh Mouje', type: 'Broker', phone: '9823100005', city: 'Saoner' },
  { id: 'p6', name: 'Bhavrao Gonmare', type: 'Broker', phone: '9823100006', city: 'Saoner' },
  { id: 'p7', name: 'Chandrashekhar Wath', type: 'Broker', phone: '9823100007', city: 'Saoner' },
  { id: 'p8', name: 'Vikrant Rokade', type: 'Broker', phone: '9823100008', city: 'Saoner' },
  { id: 'p9', name: 'Suresh Bhai', type: 'Broker', phone: '9823100009', city: 'Saoner' },
  { id: 'p10', name: 'SHREE MOHAN INDUSTRIES Pvt. Ltd.', type: 'Mill', phone: '9822200001', city: 'Nagpur' },
  { id: 'p11', name: 'Pawansut Dall Mill pvt ltd.', type: 'Mill', phone: '9822200002', city: 'Saoner' },
  { id: 'p12', name: 'Saurabh Dall Mill', type: 'Mill', phone: '9822200003', city: 'Saoner' },
  { id: 'p13', name: 'Maira Food Mill', type: 'Mill', phone: '9822200004', city: 'Saoner' }
];

const DEFAULT_STATEMENTS = [
  {
    id: 'stmt-001',
    statementNo: 'RME/STMT/2026/001',
    date: '2026-10-14',
    millName: 'SHREE MOHAN INDUSTRIES Pvt. Ltd.',
    commodity: 'Toor',
    dispatchBags: 115,
    dispatchExtraKg: 35,
    lots: [
      { id: 'l1', brokerName: 'Dilip Jain', weight: 1.775, rate: 10200, billAmount: 18105, brokerage: 271.58, total: 18376.58, chequeNo: 'CHQ-4401', stockStatus: 'Dispatched' },
      { id: 'l2', brokerName: 'Roshan Chandak', weight: 5.735, rate: 10251.39, billAmount: 58791.72, brokerage: 881.88, total: 59673.60, chequeNo: 'CHQ-4402', stockStatus: 'Dispatched' }
    ],
    totalBags: 115,
    totalWeight: 7.51, // in Quintals
    pureBillAmount: 76896.72,
    totalBrokerage: 1153.45,
    lotPurchaseTotal: 78050.17,
    netPadta: 10239.24,
    bardanaRateKg: 0.6,
    bardanaWeight: 0.0693,
    grossWeight: 7.5793,
    mandiSheshPct: 1.05,
    mandiSheshAmount: 807.42,
    commissionPct: 1.5,
    commissionAmount: 1153.45,
    bardanaCharges: 0,
    workerCharges: 1617.54,
    transportCharges: 303.17,
    totalExpenses: 3881.58,
    grandTotal: 81931.75,
    grossPadta: 10809.90
  },
  {
    id: 'stmt-002',
    statementNo: 'RME/STMT/2026/002',
    date: '2026-08-01',
    millName: 'Pawansut Dall Mill pvt ltd.',
    commodity: 'Toor',
    dispatchBags: 50,
    dispatchExtraKg: 32,
    lots: [
      { id: 'l3', brokerName: 'Dilip Jain', weight: 28.275, rate: 7932, billAmount: 224277.30, brokerage: 3364.16, total: 227641.46, chequeNo: 'CHQ-3211', stockStatus: 'Cleared' },
      { id: 'l4', brokerName: 'Jagdish Thakare', weight: 0.70, rate: 7851, billAmount: 5495.70, brokerage: 82.44, total: 5578.14, chequeNo: 'CHQ-3212', stockStatus: 'Cleared' },
      { id: 'l5', brokerName: 'Bhavrao Gonmare', weight: 3.27, rate: 7851, billAmount: 25672.77, brokerage: 385.09, total: 26057.86, chequeNo: 'CHQ-3213', stockStatus: 'Cleared' },
      { id: 'l6', brokerName: 'Dhonbaji Nirgude', weight: 0.58, rate: 7851, billAmount: 4553.58, brokerage: 68.30, total: 4621.88, chequeNo: 'CHQ-3214', stockStatus: 'Cleared' }
    ],
    totalBags: 50,
    totalWeight: 32.825, // in Quintals
    pureBillAmount: 259999.35,
    totalBrokerage: 3899.99,
    lotPurchaseTotal: 263899.34,
    netPadta: 7920.77,
    bardanaRateKg: 0.6,
    bardanaWeight: 0.303,
    grossWeight: 33.128,
    mandiSheshPct: 1.05,
    mandiSheshAmount: 2729.99,
    commissionPct: 1.0,
    commissionAmount: 2599.99,
    bardanaCharges: 1262.31,
    workerCharges: 706.89,
    transportCharges: 1490.76,
    totalExpenses: 8789.95,
    grandTotal: 272689.29,
    grossPadta: 8307.37
  }
];

const DEFAULT_INVOICES = [
  {
    id: 'inv-001',
    invoiceNo: 'RME/2026-27/001',
    date: '2026-12-10',
    buyerName: 'SHREE MOHAN INDUSTRIES Pvt. Ltd.',
    buyerAddress: 'Nagpur',
    broker: 'Suresh Bhai',
    vehicleNo: 'MH 40 CM 8588',
    transporter: 'Local Mandi Transport',
    items: [
      { id: 'it1', description: 'Toor', bags: 42, grossWeight: 27.57, netWeight: 27.315, rate: 10845.48, amount: 298978.91 }
    ],
    totalBags: 42,
    totalAmount: 298978.91,
    grandTotal: 298978,
    amountInWords: 'Rupees Two Lakh Ninety-Eight Thousand Nine Hundred Seventy-Eight Only',
    paymentStatus: 'Pending',
    paymentDueDate: '2026-12-20'
  }
];

export function getSystemSettings() {
  const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
  return data ? JSON.parse(data) : DEFAULT_SETTINGS;
}

export function saveSystemSettings(settings) {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
}

export function getProcurementStatements() {
  const data = localStorage.getItem(STORAGE_KEYS.STATEMENTS);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.STATEMENTS, JSON.stringify(DEFAULT_STATEMENTS));
    return DEFAULT_STATEMENTS;
  }
  return JSON.parse(data);
}

export function saveProcurementStatement(statement) {
  const list = getProcurementStatements();
  const index = list.findIndex(s => s.id === statement.id);
  if (index >= 0) {
    list[index] = statement;
  } else {
    list.unshift(statement);
  }
  localStorage.setItem(STORAGE_KEYS.STATEMENTS, JSON.stringify(list));
  
  // Async background sync to Supabase Cloud
  try {
    supabase.from('procurement_statements').upsert({
      statement_no: statement.statementNo,
      statement_date: statement.date,
      total_bags: statement.totalBags || 0,
      total_weight: statement.totalWeight || 0,
      pure_bill_amount: statement.pureBillAmount || 0,
      total_brokerage: statement.totalBrokerage || 0,
      net_padta: statement.netPadta || 0,
      bardana_tare_rate: statement.bardanaRateKg || 0.6,
      bardana_weight: statement.bardanaWeight || 0,
      gross_weight: statement.grossWeight || 0,
      mandi_shesh_amount: statement.mandiSheshAmount || 0,
      commission_amount: statement.commissionAmount || 0,
      worker_charges: statement.workerCharges || 0,
      transport_charges: statement.transportCharges || 0,
      total_expenses: statement.totalExpenses || 0,
      grand_total: statement.grandTotal || 0,
      gross_padta: statement.grossPadta || 0,
      notes: statement.millName
    }, { onConflict: 'statement_no' }).then(({ error }) => {
      if (error && error.code !== 'PGRST205') console.warn('Supabase statement sync:', error.message);
    });
  } catch (e) {
    // Offline safe
  }

  return list;
}

export function deleteProcurementStatement(id) {
  const list = getProcurementStatements().filter(s => s.id !== id);
  localStorage.setItem(STORAGE_KEYS.STATEMENTS, JSON.stringify(list));
  return list;
}

export function getSaleInvoices() {
  const data = localStorage.getItem(STORAGE_KEYS.INVOICES);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(DEFAULT_INVOICES));
    return DEFAULT_INVOICES;
  }
  return JSON.parse(data);
}

export function saveSaleInvoice(invoice) {
  const list = getSaleInvoices();
  const index = list.findIndex(inv => inv.id === invoice.id);
  if (index >= 0) {
    list[index] = invoice;
  } else {
    list.unshift(invoice);
  }
  localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(list));

  // Async background sync to Supabase Cloud
  try {
    supabase.from('sale_invoices').upsert({
      invoice_no: invoice.invoiceNo,
      invoice_date: invoice.date,
      vehicle_no: invoice.vehicleNo,
      transporter_name: invoice.transporter,
      total_bags: invoice.totalBags || 0,
      total_amount: invoice.totalAmount || 0,
      grand_total: invoice.grandTotal || 0,
      amount_in_words: invoice.amountInWords,
      payment_status: invoice.paymentStatus || 'Pending'
    }, { onConflict: 'invoice_no' }).then(({ error }) => {
      if (error && error.code !== 'PGRST205') console.warn('Supabase invoice sync:', error.message);
    });
  } catch (e) {
    // Offline safe
  }

  return list;
}

export function deleteSaleInvoice(id) {
  const list = getSaleInvoices().filter(inv => inv.id !== id);
  localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(list));
  return list;
}

export function getMasterParties() {
  const data = localStorage.getItem(STORAGE_KEYS.PARTIES);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.PARTIES, JSON.stringify(DEFAULT_PARTIES));
    return DEFAULT_PARTIES;
  }
  return JSON.parse(data);
}

export function saveMasterParty(party) {
  const list = getMasterParties();
  const index = list.findIndex(p => p.id === party.id);
  if (index >= 0) {
    list[index] = party;
  } else {
    list.push(party);
  }
  localStorage.setItem(STORAGE_KEYS.PARTIES, JSON.stringify(list));
  return list;
}

export function getCurrentUser() {
  const data = localStorage.getItem(STORAGE_KEYS.AUTH);
  if (!data) {
    // Default logged in as Yash Mahajan for instant preview, can be logged out
    const defaultUser = { name: 'Yash Mahajan', phone: '9850020793', role: 'ADMIN', pin: '1234' };
    localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(defaultUser));
    return defaultUser;
  }
  return JSON.parse(data);
}

export function setCurrentUser(user) {
  if (user) {
    localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEYS.AUTH);
  }
}
