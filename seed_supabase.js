import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://laiqoysoyxmmhjrryzac.supabase.co';
const supabaseKey = 'sb_publishable_TF7_UAzyHU3JR80mYy1LIw_BIccR3iy';

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedData() {
  console.log('Seeding historical records to Supabase Cloud...');

  // 1. Seed Statements
  const { data: stmts, error: stmtErr } = await supabase.from('procurement_statements').upsert([
    {
      statement_no: 'RME/STMT/2026/001',
      statement_date: '2026-10-14',
      total_bags: 115,
      total_weight: 7.51,
      pure_bill_amount: 76896.72,
      total_brokerage: 1153.45,
      total_purchase_amount: 78050.17,
      net_padta: 10239.24,
      bardana_tare_rate: 0.600,
      bardana_weight: 0.0693,
      gross_weight: 7.5793,
      mandi_shesh_pct: 0.0105,
      mandi_shesh_amount: 807.42,
      commission_pct: 0.0150,
      commission_amount: 1153.45,
      worker_charge_rate: 14.00,
      worker_charges: 1617.54,
      transport_charge_rate: 40.00,
      transport_charges: 303.17,
      total_expenses: 3881.58,
      grand_total: 81931.75,
      gross_padta: 10809.90,
      notes: 'SHREE MOHAN INDUSTRIES Pvt. Ltd.'
    },
    {
      statement_no: 'RME/STMT/2026/002',
      statement_date: '2026-08-01',
      total_bags: 50,
      total_weight: 32.825,
      pure_bill_amount: 259999.35,
      total_brokerage: 3899.99,
      total_purchase_amount: 263899.34,
      net_padta: 7920.77,
      bardana_tare_rate: 0.600,
      bardana_weight: 0.3030,
      gross_weight: 33.128,
      mandi_shesh_pct: 0.0105,
      mandi_shesh_amount: 2729.99,
      commission_pct: 0.0100,
      commission_amount: 2599.99,
      bardana_charge_rate: 25.00,
      bardana_charges: 1262.31,
      worker_charge_rate: 14.00,
      worker_charges: 706.89,
      transport_charge_rate: 45.00,
      transport_charges: 1490.76,
      total_expenses: 8789.95,
      grand_total: 272689.29,
      gross_padta: 8307.37,
      notes: 'Pawansut Dall Mill pvt ltd.'
    }
  ], { onConflict: 'statement_no' });

  if (stmtErr) console.error('Error seeding statements:', stmtErr);
  else console.log('Buying Statements successfully uploaded to Cloud!');

  // 2. Seed Sale Invoices
  // Get a buyer ID from parties
  const { data: buyers } = await supabase.from('parties').select('id, name').eq('name', 'SHREE MOHAN INDUSTRIES Pvt. Ltd.').limit(1);
  const buyerId = buyers?.[0]?.id;

  if (buyerId) {
    const { data: invs, error: invErr } = await supabase.from('sale_invoices').upsert([
      {
        invoice_no: 'RME/2026-27/001',
        invoice_date: '2026-12-10',
        buyer_id: buyerId,
        vehicle_no: 'MH 40 CM 8588',
        transporter_name: 'Local Mandi Transport',
        total_bags: 42,
        gross_weight: 27.57,
        net_weight: 27.315,
        total_amount: 298978.91,
        grand_total: 298978.00,
        amount_in_words: 'Rupees Two Lakh Ninety-Eight Thousand Nine Hundred Seventy-Eight Only',
        payment_status: 'Unpaid'
      }
    ], { onConflict: 'invoice_no' });

    if (invErr) console.error('Error seeding invoice:', invErr);
    else console.log('Sale Invoices successfully uploaded to Cloud!');
  }
}

seedData();
