import { Database } from 'bun:sqlite';
import * as crypto from 'crypto';
import * as path from 'path';
import { initRbacSchema } from './rbac';

const DB_PATH = path.resolve(process.cwd(), 'brightloop_sms.sqlite');
export const db = new Database(DB_PATH);

// Enable WAL mode for high performance and sub-second concurrent reads
db.run('PRAGMA journal_mode = WAL;');
db.run('PRAGMA foreign_keys = ON;');

export function hashPassword(password: string): string {
  const salt = 'brightloop_salt_2026';
  return crypto.createHash('sha256').update(password + salt).digest('hex');
}

export function initDatabase() {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'staff', 'customer')),
      customer_id INTEGER,
      created_at TEXT NOT NULL
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      company TEXT,
      address TEXT,
      gst_number TEXT,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'archived')),
      created_at TEXT NOT NULL
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS staff (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      department TEXT NOT NULL,
      title TEXT NOT NULL,
      phone TEXT,
      created_at TEXT NOT NULL
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      sales_price REAL NOT NULL,
      cost_price REAL NOT NULL,
      notes TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS product_variants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      variant_name TEXT NOT NULL,
      price_adjustment REAL NOT NULL DEFAULT 0,
      sku TEXT
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      billing_frequency TEXT NOT NULL CHECK(billing_frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
      price REAL NOT NULL,
      min_quantity INTEGER NOT NULL DEFAULT 1,
      start_date TEXT,
      end_date TEXT,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'paused', 'closed')),
      description TEXT,
      created_at TEXT NOT NULL
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS tax_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      rate REAL NOT NULL,
      type TEXT DEFAULT 'percentage',
      is_active INTEGER NOT NULL DEFAULT 1,
      is_default INTEGER NOT NULL DEFAULT 0,
      description TEXT
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS discounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      description TEXT,
      discount_type TEXT NOT NULL CHECK(discount_type IN ('percentage', 'fixed')),
      value REAL NOT NULL,
      min_amount REAL DEFAULT 0,
      min_quantity INTEGER DEFAULT 0,
      start_date TEXT,
      end_date TEXT,
      max_uses INTEGER DEFAULT 100,
      current_uses INTEGER DEFAULT 0,
      applicable_product_id INTEGER REFERENCES products(id),
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'expired')),
      created_at TEXT NOT NULL
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS discount_usages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      discount_id INTEGER NOT NULL REFERENCES discounts(id),
      customer_id INTEGER REFERENCES customers(id),
      subscription_id INTEGER REFERENCES subscriptions(id),
      invoice_id INTEGER REFERENCES invoices(id),
      amount_discounted REAL NOT NULL,
      used_at TEXT NOT NULL
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS quotation_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      plan_id INTEGER REFERENCES plans(id),
      validity_days INTEGER NOT NULL DEFAULT 15,
      notes TEXT,
      created_at TEXT NOT NULL
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS quotation_template_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      template_id INTEGER NOT NULL REFERENCES quotation_templates(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id),
      variant_id INTEGER REFERENCES product_variants(id),
      quantity INTEGER NOT NULL DEFAULT 1,
      unit_price REAL NOT NULL
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS quotations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quotation_number TEXT UNIQUE NOT NULL,
      customer_id INTEGER NOT NULL REFERENCES customers(id),
      plan_id INTEGER REFERENCES plans(id),
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'sent', 'accepted', 'rejected', 'expired')),
      valid_until TEXT NOT NULL,
      subtotal REAL NOT NULL DEFAULT 0,
      discount_amount REAL NOT NULL DEFAULT 0,
      discount_id INTEGER REFERENCES discounts(id),
      tax_amount REAL NOT NULL DEFAULT 0,
      tax_rule_id INTEGER REFERENCES tax_rules(id),
      total_amount REAL NOT NULL DEFAULT 0,
      notes TEXT,
      converted_subscription_id INTEGER,
      created_at TEXT NOT NULL
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS quotation_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quotation_id INTEGER NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id),
      variant_id INTEGER REFERENCES product_variants(id),
      quantity INTEGER NOT NULL DEFAULT 1,
      unit_price REAL NOT NULL,
      tax_rate REAL DEFAULT 0,
      amount REAL NOT NULL
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subscription_number TEXT UNIQUE NOT NULL,
      customer_id INTEGER NOT NULL REFERENCES customers(id),
      plan_id INTEGER NOT NULL REFERENCES plans(id),
      quotation_id INTEGER REFERENCES quotations(id),
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'quotation', 'confirmed', 'active', 'paused', 'closed')),
      start_date TEXT NOT NULL,
      next_billing_date TEXT NOT NULL,
      expiry_date TEXT,
      payment_terms TEXT DEFAULT 'Net 15',
      auto_renew INTEGER NOT NULL DEFAULT 1,
      discount_id INTEGER REFERENCES discounts(id),
      tax_rule_id INTEGER REFERENCES tax_rules(id),
      subtotal REAL NOT NULL DEFAULT 0,
      discount_amount REAL NOT NULL DEFAULT 0,
      tax_amount REAL NOT NULL DEFAULT 0,
      total_amount REAL NOT NULL DEFAULT 0,
      notes TEXT,
      closed_at TEXT,
      paused_at TEXT,
      created_at TEXT NOT NULL
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS subscription_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subscription_id INTEGER NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id),
      variant_id INTEGER REFERENCES product_variants(id),
      quantity INTEGER NOT NULL DEFAULT 1,
      unit_price REAL NOT NULL,
      tax_rate REAL DEFAULT 0,
      amount REAL NOT NULL
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_number TEXT UNIQUE NOT NULL,
      subscription_id INTEGER REFERENCES subscriptions(id),
      customer_id INTEGER NOT NULL REFERENCES customers(id),
      issue_date TEXT NOT NULL,
      due_date TEXT NOT NULL,
      billing_cycle_start TEXT NOT NULL,
      billing_cycle_end TEXT NOT NULL,
      subtotal REAL NOT NULL DEFAULT 0,
      discount_amount REAL NOT NULL DEFAULT 0,
      discount_code TEXT,
      tax_rate REAL NOT NULL DEFAULT 0,
      tax_amount REAL NOT NULL DEFAULT 0,
      total_amount REAL NOT NULL DEFAULT 0,
      amount_paid REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'confirmed', 'paid', 'cancelled')),
      sent_at TEXT,
      notes TEXT,
      created_at TEXT NOT NULL
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS invoice_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
      product_name TEXT NOT NULL,
      variant_name TEXT,
      quantity INTEGER NOT NULL DEFAULT 1,
      unit_price REAL NOT NULL,
      tax_rate REAL NOT NULL DEFAULT 0,
      tax_amount REAL NOT NULL DEFAULT 0,
      amount REAL NOT NULL
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      payment_number TEXT UNIQUE NOT NULL,
      invoice_id INTEGER NOT NULL REFERENCES invoices(id),
      customer_id INTEGER NOT NULL REFERENCES customers(id),
      amount REAL NOT NULL,
      payment_method TEXT NOT NULL CHECK(payment_method IN ('UPI', 'Bank Transfer', 'Credit Card', 'Cash', 'Cheque')),
      payment_date TEXT NOT NULL,
      transaction_ref TEXT,
      notes TEXT,
      status TEXT DEFAULT 'completed',
      created_at TEXT NOT NULL
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS scheduler_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      run_date TEXT NOT NULL,
      subscriptions_checked INTEGER NOT NULL DEFAULT 0,
      invoices_generated INTEGER NOT NULL DEFAULT 0,
      details TEXT,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS password_resets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      expires_at TEXT NOT NULL,
      used INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS staff_invitations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      name TEXT NOT NULL,
      department TEXT NOT NULL,
      title TEXT NOT NULL,
      phone TEXT,
      invite_token TEXT UNIQUE NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'expired', 'revoked')),
      invited_by INTEGER REFERENCES users(id),
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  // Performance indexes & Idempotency unique constraints
  db.run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_single_admin ON users(role) WHERE role = 'admin';`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_staff_inv_token ON staff_invitations(invite_token);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_staff_inv_email ON staff_invitations(email);`);
  db.run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_sub_cycle_idempotency ON invoices(subscription_id, billing_cycle_start) WHERE subscription_id IS NOT NULL;`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_sub_status_billing ON subscriptions(status, next_billing_date);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_invoice_status_due ON invoices(status, due_date);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_customer_email ON customers(email);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_user_email ON users(email);`);

  // Initialize RBAC tables & permissions
  initRbacSchema();

  // Seed default data if empty
  seedInitialData();
}

export function seedInitialData() {
  const usersCount = (db.query('SELECT COUNT(*) as count FROM users').get() as { count: number }).count;
  if (usersCount > 0) return; // Already seeded

  console.log('Seeding initial Brightloop data...');

  // 1. Tax Rules
  db.run(`INSERT INTO tax_rules (name, rate, type, is_active, is_default, description) VALUES
    ('GST (18%)', 18.0, 'percentage', 1, 1, 'Standard Indian GST rate for SaaS and IT services'),
    ('VAT (5%)', 5.0, 'percentage', 1, 0, 'Value Added Tax for regional software subscriptions'),
    ('Zero Tax (0%)', 0.0, 'percentage', 1, 0, 'Export services or tax-exempt non-profit accounts')
  `);

  // 2. Products & Variants (incorporating problem statement example)
  // ERP Software: Base ₹2,000, Variants: Standard (₹2,000), Odoo brand (₹2,560, +₹560)
  db.run(`INSERT INTO products (id, name, type, sales_price, cost_price, notes, is_active, created_at) VALUES
    (1, 'ERP Software', 'ERP', 2000.0, 800.0, 'Core enterprise resource planning platform per seat', 1, '2026-01-01'),
    (2, 'Support Add-on', 'Service', 5000.0, 1500.0, '24/7 Priority SLA dedicated phone and email support package', 1, '2026-01-01'),
    (3, 'CRM Suite', 'SaaS', 1499.0, 450.0, 'Customer relationship, pipeline, and email automation module', 1, '2026-01-01'),
    (4, 'Cloud Backup Pro', 'Add-on', 1200.0, 300.0, 'Automated hourly encrypted snapshot and compliance storage', 1, '2026-01-01')
  `);

  db.run(`INSERT INTO product_variants (product_id, variant_name, price_adjustment, sku) VALUES
    (1, 'Standard brand', 0.0, 'ERP-STD'),
    (1, 'Odoo brand', 560.0, 'ERP-ODOO'),
    (1, 'Enterprise Custom Edition', 1200.0, 'ERP-ENT'),
    (3, 'Standard Edition', 0.0, 'CRM-STD'),
    (3, 'AI Augmented Edition', 800.0, 'CRM-AI'),
    (4, '500 GB Storage', 0.0, 'BAK-500'),
    (4, '2 TB High-Performance', 1500.0, 'BAK-2TB')
  `);

  // 3. Plans
  db.run(`INSERT INTO plans (id, name, code, billing_frequency, price, min_quantity, start_date, end_date, status, description, created_at) VALUES
    (1, 'Basic Tier', 'PLAN-BASIC', 'monthly', 499.0, 1, '2026-01-01', '2027-12-31', 'active', 'Ideal for early-stage teams and basic tools', '2026-01-01'),
    (2, 'Pro Plan', 'PLAN-PRO', 'monthly', 999.0, 1, '2026-01-01', '2027-12-31', 'active', 'Full suite with premium integrations and analytics', '2026-01-01'),
    (3, 'Enterprise Annual', 'PLAN-ENT', 'yearly', 9999.0, 5, '2026-01-01', '2028-12-31', 'active', 'Enterprise tier billed annually with volume discount', '2026-01-01'),
    (4, 'Weekly Sprint License', 'PLAN-WEEKLY', 'weekly', 299.0, 1, '2026-01-01', '2027-12-31', 'active', 'Weekly billing cycle for short contracts', '2026-01-01'),
    (5, 'Daily Compute Access', 'PLAN-DAILY', 'daily', 49.0, 1, '2026-01-01', '2027-12-31', 'active', 'Micro-billing per calendar day', '2026-01-01')
  `);

  // 4. Discounts (including BULK10 from problem statement)
  db.run(`INSERT INTO discounts (id, code, description, discount_type, value, min_amount, min_quantity, start_date, end_date, max_uses, current_uses, applicable_product_id, status, created_at) VALUES
    (1, 'BULK10', '10% OFF on 10 or more seats volume purchase', 'percentage', 10.0, 0, 10, '2026-01-01', '2026-12-31', 100, 4, NULL, 'active', '2026-01-01'),
    (2, 'FIXED500', '₹500 flat off on orders exceeding ₹5,000', 'fixed', 500.0, 5000.0, 0, '2026-01-01', '2026-12-31', 50, 1, NULL, 'active', '2026-01-01'),
    (3, 'WELCOME15', 'Special 15% discount for first-time adopters', 'percentage', 15.0, 1000.0, 0, '2026-01-01', '2026-12-31', 200, 2, NULL, 'active', '2026-01-01')
  `);

  // 5. Customers
  db.run(`INSERT INTO customers (id, name, email, phone, company, address, gst_number, status, created_at) VALUES
    (1, 'Rajesh Patel', 'customer@acme.com', '+91 98765 43210', 'Acme Technologies Ltd', '402 Cyber City, Outer Ring Rd, Bengaluru, KA', '29ABCDE1234F1Z5', 'active', '2026-01-10'),
    (2, 'Ananya Sharma', 'ananya@technova.io', '+91 98111 22334', 'TechNova Solutions Pvt Ltd', 'Floor 8, Lotus IT Park, Powai, Mumbai, MH', '27AABCT8901G1Z3', 'active', '2026-01-15'),
    (3, 'Vikram Malhotra', 'vikram@zenith.com', '+91 97234 56789', 'Zenith Global Logistics', 'Plot 12, Phase 3, Udyog Vihar, Gurugram, HR', '06AAACZ4567H1Z8', 'active', '2026-02-01'),
    (4, 'Dr. Meera Nambiar', 'meera@innohealth.org', '+91 99887 76655', 'InnoHealth Foundation', '14 Temple Rock Rd, Jubilee Hills, Hyderabad, TS', '36AAAFI1122J1Z1', 'active', '2026-02-10')
  `);

  // 6. Users (Admin, Staff, Customer)
  // Password for all demo accounts: 'Brightloop@2026' (satisfies >8 chars, uppercase, lowercase, special char)
  const defaultPassHash = hashPassword('Brightloop@2026');

  db.run(`INSERT INTO users (id, email, password_hash, name, role, customer_id, created_at) VALUES
    (1, 'admin@brightloop.com', '${defaultPassHash}', 'Administrator', 'admin', NULL, '2026-01-01'),
    (2, 'staff@brightloop.com', '${defaultPassHash}', 'Alex Morgan', 'staff', NULL, '2026-01-05'),
    (3, 'customer@acme.com', '${defaultPassHash}', 'Rajesh Patel', 'customer', 1, '2026-01-10'),
    (4, 'ananya@technova.io', '${defaultPassHash}', 'Ananya Sharma', 'customer', 2, '2026-01-15'),
    (5, 'vikram@zenith.com', '${defaultPassHash}', 'Vikram Malhotra', 'customer', 3, '2026-02-01'),
    (6, 'meera@innohealth.org', '${defaultPassHash}', 'Dr. Meera Nambiar', 'customer', 4, '2026-02-10')
  `);

  // 7. Staff profile
  db.run(`INSERT INTO staff (user_id, name, email, department, title, phone, created_at) VALUES
    (2, 'Alex Morgan', 'staff@brightloop.com', 'Sales Operations', 'Senior Account Executive', '+91 98700 11223', '2026-01-05')
  `);

  // 8. Quotation Templates
  // QT-001 from PDF: ERP Software 50 qty @ ₹2,000 + Support Add-on 1 qty @ ₹5,000 = ₹1,05,000
  db.run(`INSERT INTO quotation_templates (id, name, plan_id, validity_days, notes, created_at) VALUES
    (1, 'Enterprise ERP Pack (50 Seats)', 3, 15, 'Pre-configured standard enterprise package with priority support', '2026-01-10'),
    (2, 'Growth SaaS Bundle', 2, 30, 'ERP Standard + CRM Suite for scaling organizations', '2026-01-12')
  `);

  db.run(`INSERT INTO quotation_template_items (template_id, product_id, variant_id, quantity, unit_price) VALUES
    (1, 1, 1, 50, 2000.0),
    (1, 2, NULL, 1, 5000.0),
    (2, 1, 1, 10, 2000.0),
    (2, 3, 4, 10, 1499.0)
  `);

  // 9. Quotations (Example QT-001)
  db.run(`INSERT INTO quotations (id, quotation_number, customer_id, plan_id, status, valid_until, subtotal, discount_amount, discount_id, tax_amount, tax_rule_id, total_amount, notes, converted_subscription_id, created_at) VALUES
    (1, 'QT-001', 1, 3, 'accepted', '2026-11-15', 105000.0, 10500.0, 1, 17010.0, 1, 111510.0, 'Enterprise ERP package quotation with BULK10 discount', 1, '2026-10-01'),
    (2, 'QT-002', 2, 2, 'sent', '2026-11-20', 34990.0, 0, NULL, 6298.2, 1, 41288.2, 'Pending review by TechNova procurement team', NULL, '2026-10-25')
  `);

  db.run(`INSERT INTO quotation_items (quotation_id, product_id, variant_id, quantity, unit_price, tax_rate, amount) VALUES
    (1, 1, 1, 50, 2000.0, 18.0, 100000.0),
    (1, 2, NULL, 1, 5000.0, 18.0, 5000.0),
    (2, 1, 1, 10, 2000.0, 18.0, 20000.0),
    (2, 3, 4, 10, 1499.0, 18.0, 14990.0)
  `);

  // 10. Subscriptions
  // Subscription 1: Converted from QT-001, Active
  db.run(`INSERT INTO subscriptions (id, subscription_number, customer_id, plan_id, quotation_id, status, start_date, next_billing_date, expiry_date, payment_terms, auto_renew, discount_id, tax_rule_id, subtotal, discount_amount, tax_amount, total_amount, notes, created_at) VALUES
    (1, 'SUB-2026-0001', 1, 3, 1, 'active', '2026-10-01', '2026-11-01', '2027-10-01', 'Net 15', 1, 1, 1, 105000.0, 10500.0, 17010.0, 111510.0, 'Converted from accepted quotation QT-001', '2026-10-01'),
    (2, 'SUB-2026-0002', 2, 2, NULL, 'active', '2026-10-05', '2026-11-05', '2027-10-05', 'Net 30', 1, NULL, 1, 999.0, 0.0, 179.82, 1178.82, 'Pro Plan Monthly subscription', '2026-10-05'),
    (3, 'SUB-2026-0003', 3, 1, NULL, 'confirmed', '2026-10-20', '2026-11-20', '2027-10-20', 'Due on receipt', 1, NULL, 1, 499.0, 0.0, 89.82, 588.82, 'Awaiting customer initial onboarding', '2026-10-20'),
    (4, 'SUB-2026-0004', 4, 1, NULL, 'closed', '2026-01-01', '2026-06-01', '2026-06-01', 'Net 15', 0, NULL, 1, 499.0, 0.0, 89.82, 588.82, 'Ended after pilot term', '2026-01-01')
  `);

  db.run(`UPDATE quotations SET converted_subscription_id = 1 WHERE id = 1`);

  db.run(`INSERT INTO subscription_items (subscription_id, product_id, variant_id, quantity, unit_price, tax_rate, amount) VALUES
    (1, 1, 1, 50, 2000.0, 18.0, 100000.0),
    (1, 2, NULL, 1, 5000.0, 18.0, 5000.0),
    (2, 1, 2, 1, 2560.0, 18.0, 2560.0),
    (3, 1, 1, 1, 2000.0, 18.0, 2000.0),
    (4, 1, 1, 1, 2000.0, 18.0, 2000.0)
  `);

  // 11. Invoices (Initial cycle invoices)
  db.run(`INSERT INTO invoices (id, invoice_number, subscription_id, customer_id, issue_date, due_date, billing_cycle_start, billing_cycle_end, subtotal, discount_amount, discount_code, tax_rate, tax_amount, total_amount, amount_paid, status, sent_at, notes, created_at) VALUES
    (1, 'INV-2026-0001', 1, 1, '2026-10-01', '2026-10-16', '2026-10-01', '2026-11-01', 105000.0, 10500.0, 'BULK10', 18.0, 17010.0, 111510.0, 111510.0, 'paid', '2026-10-01', 'Initial cycle invoice for Enterprise ERP pack', '2026-10-01'),
    (2, 'INV-2026-0002', 2, 2, '2026-10-05', '2026-10-20', '2026-10-05', '2026-11-05', 2560.0, 0.0, NULL, 18.0, 460.8, 3020.8, 0.0, 'confirmed', '2026-10-05', 'TechNova Pro monthly billing (Overdue for testing)', '2026-10-05'),
    (3, 'INV-2026-0003', 3, 3, '2026-10-20', '2026-11-04', '2026-10-20', '2026-11-20', 2000.0, 0.0, NULL, 18.0, 360.0, 2360.0, 1000.0, 'confirmed', '2026-10-20', 'Partially paid invoice', '2026-10-20')
  `);

  db.run(`INSERT INTO invoice_items (invoice_id, product_name, variant_name, quantity, unit_price, tax_rate, tax_amount, amount) VALUES
    (1, 'ERP Software', 'Standard brand', 50, 2000.0, 18.0, 16200.0, 100000.0),
    (1, 'Support Add-on', 'Priority SLA', 1, 5000.0, 18.0, 810.0, 5000.0),
    (2, 'ERP Software', 'Odoo brand', 1, 2560.0, 18.0, 460.8, 2560.0),
    (3, 'ERP Software', 'Standard brand', 1, 2000.0, 18.0, 360.0, 2000.0)
  `);

  // 12. Payments
  db.run(`INSERT INTO payments (id, payment_number, invoice_id, customer_id, amount, payment_method, payment_date, transaction_ref, notes, status, created_at) VALUES
    (1, 'PAY-2026-0001', 1, 1, 111510.0, 'Bank Transfer', '2026-10-03', 'HDFC-NEFT-889021', 'Full payment received via corporate RTGS', 'completed', '2026-10-03'),
    (2, 'PAY-2026-0002', 3, 3, 1000.0, 'UPI', '2026-10-21', 'UPI/2903112/zenith', 'Partial payment advance', 'completed', '2026-10-21')
  `);

  // 13. Discount usages
  db.run(`INSERT INTO discount_usages (discount_id, customer_id, subscription_id, invoice_id, amount_discounted, used_at) VALUES
    (1, 1, 1, 1, 10500.0, '2026-10-01')
  `);

  console.log('Seeding completed successfully!');
}
