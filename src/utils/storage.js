import { supabase } from './supabase';

// LocalStorage persistence engine - Fresh Initial State (Zero Dummy Data)

const STORAGE_KEYS = {
  SETTINGS: 'rme_system_settings',
  STATEMENTS: 'rme_procurement_statements_v2',
  INVOICES: 'rme_sale_invoices_v2',
  PARTIES: 'rme_master_parties',
  AUTH: 'rme_current_user',
  CLEAN_FLAG: 'rme_cleared_initial_dummy_v2'
};

// Auto-clean old sample/dummy data from user's browser localStorage
if (typeof window !== 'undefined' && window.localStorage) {
  if (!localStorage.getItem(STORAGE_KEYS.CLEAN_FLAG)) {
    localStorage.removeItem('rme_procurement_statements');
    localStorage.removeItem('rme_sale_invoices');
    localStorage.setItem(STORAGE_KEYS.STATEMENTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.CLEAN_FLAG, 'true');
  }
}

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

const DEFAULT_STATEMENTS = [];
const DEFAULT_INVOICES = [];

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
