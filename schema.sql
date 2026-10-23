-- =====================================================================
-- R. MAHAJAN ENTERPRISE (A.P.M.C. SAONER)
-- ERP & Billing System Database Schema
-- Compatible with PostgreSQL / Supabase
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 0. Admin & Staff Authentication
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE,
    phone VARCHAR(20) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    pin_code VARCHAR(10), -- 4-digit mobile quick-unlock PIN
    role VARCHAR(50) NOT NULL DEFAULT 'OPERATOR' CHECK (role IN ('ADMIN', 'OPERATOR', 'AUDITOR')),
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed initial Admin User (Proprietor Yash Mahajan)
INSERT INTO users (full_name, phone, email, password_hash, pin_code, role) VALUES
('Yash Mahajan', '9850020793', 'yashmahajan@enterprise.com', '$2b$10$e8K...admin_hash', '1234', 'ADMIN')
ON CONFLICT (phone) DO NOTHING;

-- 0.1 Enterprise Master Settings (Configurable by Admin via UI)
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    enterprise_name VARCHAR(255) DEFAULT 'R. MAHAJAN ENTERPRISE',
    tagline VARCHAR(255) DEFAULT 'GRAIN MERCHANTS OF TOOR, CHANA ETC.',
    apmc_address TEXT DEFAULT 'A.P.M.C. SAONER - 441107',
    proprietor_name VARCHAR(100) DEFAULT 'Yash Mahajan',
    contact_phone VARCHAR(20) DEFAULT '9850020793',
    pan_no VARCHAR(20) DEFAULT 'IKGPK7086G',
    state_code VARCHAR(10) DEFAULT '27',
    bank_name VARCHAR(100) DEFAULT 'AXIS BANK',
    bank_branch VARCHAR(100) DEFAULT 'SAONER',
    bank_account_no VARCHAR(50) DEFAULT '924020061268613',
    bank_ifsc VARCHAR(20) DEFAULT 'UTIB0003817',
    default_brokerage_pct NUMERIC(6, 2) DEFAULT 1.50,
    default_mandi_shesh_pct NUMERIC(6, 4) DEFAULT 0.0105,
    default_commission_pct NUMERIC(6, 4) DEFAULT 0.0150,
    default_worker_rate NUMERIC(10, 2) DEFAULT 14.00,
    default_transport_rate NUMERIC(10, 2) DEFAULT 40.00,
    default_bardana_tare_kg NUMERIC(6, 3) DEFAULT 0.600,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO system_settings (enterprise_name) VALUES ('R. MAHAJAN ENTERPRISE')
ON CONFLICT DO NOTHING;

-- 0.2 Audit Log (Tracks every transaction by user)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL, -- 'LOGIN', 'CREATE_STATEMENT', 'UPDATE_INVOICE', 'DELETE_RECORD'
    entity_type VARCHAR(50),      -- 'procurement_statements', 'sale_invoices'
    entity_id UUID,
    ip_address VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1. Parties Master (Brokers, Farmers, Dal Mills, Transporters)
CREATE TABLE IF NOT EXISTS parties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    party_type VARCHAR(50) NOT NULL CHECK (party_type IN ('Broker', 'Mill', 'Farmer', 'Transporter')),
    phone VARCHAR(20),
    city VARCHAR(100) DEFAULT 'Saoner',
    state VARCHAR(50) DEFAULT 'Maharashtra',
    state_code VARCHAR(10) DEFAULT '27',
    pan_no VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed initial master parties from existing Excel records
INSERT INTO parties (name, party_type, city) VALUES
('Dhonbaji Nirgude', 'Broker', 'Saoner'),
('Dilip Jain', 'Broker', 'Saoner'),
('Vikrant Rokade', 'Broker', 'Saoner'),
('Chandrashekhar Wath', 'Broker', 'Saoner'),
('Ramesh Mouje', 'Broker', 'Saoner'),
('Bhavrao Gonmare', 'Broker', 'Saoner'),
('Jagdish Thakare', 'Broker', 'Saoner'),
('Roshan Chandak', 'Broker', 'Saoner'),
('Suresh Bhai', 'Broker', 'Saoner'),
('SHREE MOHAN INDUSTRIES Pvt. Ltd.', 'Mill', 'Nagpur'),
('Pawansut Dall Mill pvt ltd.', 'Mill', 'Saoner'),
('Saurabh Dall Mill', 'Mill', 'Saoner'),
('Maira Food Mill', 'Mill', 'Saoner')
ON CONFLICT DO NOTHING;

-- 2. Commodities Master
CREATE TABLE IF NOT EXISTS commodities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    default_unit VARCHAR(20) DEFAULT 'Quintal'
);

INSERT INTO commodities (name, default_unit) VALUES
('Toor', 'Quintal'),
('Chana', 'Quintal')
ON CONFLICT (name) DO NOTHING;

-- 3. Inward Procurement Statements (Daily Mandi Purchasing & Padta Sheet)
CREATE TABLE IF NOT EXISTS procurement_statements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    statement_no VARCHAR(50) UNIQUE NOT NULL,
    statement_date DATE NOT NULL,
    mill_buyer_id UUID REFERENCES parties(id),
    total_bags INT DEFAULT 0,
    total_weight NUMERIC(12, 4) DEFAULT 0,
    pure_bill_amount NUMERIC(14, 2) DEFAULT 0,
    total_brokerage NUMERIC(14, 2) DEFAULT 0,
    total_purchase_amount NUMERIC(14, 2) DEFAULT 0,
    net_padta NUMERIC(12, 2) DEFAULT 0,
    bardana_tare_rate NUMERIC(6, 3) DEFAULT 0.600, -- 0.6 kg per bag
    bardana_weight NUMERIC(12, 4) DEFAULT 0,
    gross_weight NUMERIC(12, 4) DEFAULT 0,
    mandi_shesh_pct NUMERIC(6, 4) DEFAULT 0.0105, -- 1.05%
    mandi_shesh_amount NUMERIC(14, 2) DEFAULT 0,
    commission_pct NUMERIC(6, 4) DEFAULT 0.0150, -- 1.5%
    commission_amount NUMERIC(14, 2) DEFAULT 0,
    bardana_charge_rate NUMERIC(10, 2) DEFAULT 0, -- e.g. ₹25
    bardana_charges NUMERIC(14, 2) DEFAULT 0,
    worker_charge_rate NUMERIC(10, 2) DEFAULT 14.00, -- ₹14/bag
    worker_charges NUMERIC(14, 2) DEFAULT 0,
    transport_charge_rate NUMERIC(10, 2) DEFAULT 40.00, -- ₹40/unit
    transport_charges NUMERIC(14, 2) DEFAULT 0,
    total_expenses NUMERIC(14, 2) DEFAULT 0,
    grand_total NUMERIC(14, 2) DEFAULT 0,
    gross_padta NUMERIC(12, 2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Inward Statement Lots (Sub-Broker / Farmer Line Items)
CREATE TABLE IF NOT EXISTS statement_lots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    statement_id UUID NOT NULL REFERENCES procurement_statements(id) ON DELETE CASCADE,
    broker_id UUID NOT NULL REFERENCES parties(id),
    commodity_id UUID REFERENCES commodities(id),
    bags INT DEFAULT 0,
    weight NUMERIC(12, 4) NOT NULL,
    rate NUMERIC(12, 2) NOT NULL,
    bill_amount NUMERIC(14, 2) NOT NULL,
    brokerage_pct NUMERIC(6, 2) DEFAULT 1.50,
    brokerage_amount NUMERIC(14, 2) NOT NULL,
    total_bill_amount NUMERIC(14, 2) NOT NULL,
    cheque_no VARCHAR(100),
    stock_status VARCHAR(50) DEFAULT 'Cleared',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Outward Sale Invoices (Mill Bills)
CREATE TABLE IF NOT EXISTS sale_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_no VARCHAR(50) UNIQUE NOT NULL,
    invoice_date DATE NOT NULL,
    buyer_id UUID NOT NULL REFERENCES parties(id),
    broker_id UUID REFERENCES parties(id),
    vehicle_no VARCHAR(50),
    transporter_name VARCHAR(150),
    total_bags INT DEFAULT 0,
    gross_weight NUMERIC(12, 4) DEFAULT 0,
    net_weight NUMERIC(12, 4) DEFAULT 0,
    total_amount NUMERIC(14, 2) DEFAULT 0,
    grand_total NUMERIC(14, 2) DEFAULT 0,
    amount_in_words TEXT,
    payment_terms_days INT DEFAULT 10,
    interest_rate_annual NUMERIC(5, 2) DEFAULT 24.00,
    payment_status VARCHAR(50) DEFAULT 'Unpaid' CHECK (payment_status IN ('Unpaid', 'Partial', 'Paid')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Outward Sale Items
CREATE TABLE IF NOT EXISTS sale_invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES sale_invoices(id) ON DELETE CASCADE,
    commodity_id UUID REFERENCES commodities(id),
    bags INT DEFAULT 0,
    gross_wt NUMERIC(12, 4) NOT NULL,
    net_wt NUMERIC(12, 4) NOT NULL,
    rate NUMERIC(12, 2) NOT NULL,
    amount NUMERIC(14, 2) NOT NULL
);

-- 7. Payment Ledger (Brokers & Mills Khata)
CREATE TABLE IF NOT EXISTS payments_ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_date DATE NOT NULL,
    party_id UUID NOT NULL REFERENCES parties(id),
    statement_id UUID REFERENCES procurement_statements(id),
    invoice_id UUID REFERENCES sale_invoices(id),
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('Paid_To_Broker', 'Received_From_Mill')),
    amount NUMERIC(14, 2) NOT NULL,
    payment_mode VARCHAR(50) DEFAULT 'Cheque' CHECK (payment_mode IN ('Cheque', 'RTGS', 'NEFT', 'Cash', 'UPI')),
    reference_no VARCHAR(100),
    bank_name VARCHAR(100) DEFAULT 'AXIS BANK SAONER',
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance Indexes for instant Date-wise filtering
CREATE INDEX IF NOT EXISTS idx_proc_stmt_date ON procurement_statements(statement_date);
CREATE INDEX IF NOT EXISTS idx_sale_inv_date ON sale_invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_stmt_mill ON procurement_statements(mill_buyer_id);
CREATE INDEX IF NOT EXISTS idx_stmt_lots_broker ON statement_lots(broker_id);
CREATE INDEX IF NOT EXISTS idx_ledger_party_date ON payments_ledger(party_id, transaction_date);
