export type UserRole = 'admin' | 'staff' | 'customer';

export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  customer_id?: number | null;
  company?: string;
  phone?: string;
  gst_number?: string;
  created_at: string;
}

export interface Customer {
  id: number;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  address?: string;
  gst_number?: string;
  status: 'active' | 'inactive' | 'archived';
  active_subscriptions_count?: number;
  outstanding_balance?: number;
  total_spent?: number;
  created_at: string;
}

export interface StaffMember {
  id: number;
  user_id: number;
  name: string;
  email: string;
  department: string;
  title: string;
  phone?: string;
  created_at: string;
}

export interface ProductVariant {
  id?: number;
  product_id?: number;
  variant_name: string;
  price_adjustment: number;
  sku?: string;
}

export interface Product {
  id: number;
  name: string;
  type: string;
  sales_price: number;
  cost_price: number;
  notes?: string;
  is_active: number;
  variants: ProductVariant[];
  created_at: string;
}

export type BillingFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface Plan {
  id: number;
  name: string;
  code: string;
  billing_frequency: BillingFrequency;
  price: number;
  min_quantity: number;
  start_date?: string;
  end_date?: string;
  status: 'active' | 'paused' | 'closed';
  description?: string;
  active_subscribers_count?: number;
  created_at: string;
}

export interface TaxRule {
  id: number;
  name: string;
  rate: number;
  type: string;
  is_active: number;
  is_default: number;
  description?: string;
}

export interface Discount {
  id: number;
  code: string;
  description?: string;
  discount_type: 'percentage' | 'fixed';
  value: number;
  min_amount: number;
  min_quantity: number;
  start_date?: string;
  end_date?: string;
  max_uses: number;
  current_uses: number;
  applicable_product_id?: number;
  applicable_product_name?: string;
  status: 'active' | 'inactive' | 'expired';
  created_at: string;
}

export interface QuotationTemplateItem {
  id?: number;
  product_id: number;
  product_name?: string;
  variant_id?: number;
  variant_name?: string;
  quantity: number;
  unit_price: number;
}

export interface QuotationTemplate {
  id: number;
  name: string;
  plan_id?: number;
  plan_name?: string;
  billing_frequency?: string;
  validity_days: number;
  notes?: string;
  items: QuotationTemplateItem[];
  created_at: string;
}

export interface QuotationItem {
  id?: number;
  product_id: number;
  product_name?: string;
  variant_id?: number;
  variant_name?: string;
  quantity: number;
  unit_price: number;
  tax_rate?: number;
  amount: number;
}

export interface Quotation {
  id: number;
  quotation_number: string;
  customer_id: number;
  customer_name?: string;
  customer_company?: string;
  customer_email?: string;
  plan_id?: number;
  plan_name?: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  valid_until: string;
  subtotal: number;
  discount_amount: number;
  discount_id?: number;
  discount_code?: string;
  tax_amount: number;
  tax_rule_id?: number;
  total_amount: number;
  notes?: string;
  converted_subscription_id?: number;
  items: QuotationItem[];
  created_at: string;
}

export interface SubscriptionItem {
  id?: number;
  product_id: number;
  product_name?: string;
  variant_id?: number;
  variant_name?: string;
  quantity: number;
  unit_price: number;
  tax_rate?: number;
  amount: number;
}

export type SubscriptionStatus = 'draft' | 'quotation' | 'confirmed' | 'active' | 'paused' | 'closed';

export interface Subscription {
  id: number;
  subscription_number: string;
  customer_id: number;
  customer_name?: string;
  customer_company?: string;
  customer_email?: string;
  plan_id: number;
  plan_name?: string;
  billing_frequency?: BillingFrequency;
  quotation_id?: number;
  status: SubscriptionStatus;
  start_date: string;
  next_billing_date: string;
  expiry_date?: string;
  payment_terms: string;
  auto_renew: number;
  discount_id?: number;
  discount_code?: string;
  tax_rule_id?: number;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  notes?: string;
  closed_at?: string;
  paused_at?: string;
  items: SubscriptionItem[];
  created_at: string;
}

export interface InvoiceItem {
  id?: number;
  invoice_id?: number;
  product_name: string;
  variant_name?: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  tax_amount: number;
  amount: number;
}

export type InvoiceStatus = 'draft' | 'confirmed' | 'paid' | 'cancelled';

export interface Invoice {
  id: number;
  invoice_number: string;
  subscription_id?: number;
  subscription_number?: string;
  customer_id: number;
  customer_name: string;
  customer_company?: string;
  customer_email: string;
  customer_phone?: string;
  customer_address?: string;
  customer_gst?: string;
  issue_date: string;
  due_date: string;
  billing_cycle_start: string;
  billing_cycle_end: string;
  subtotal: number;
  discount_amount: number;
  discount_code?: string;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  amount_paid: number;
  status: InvoiceStatus;
  is_overdue?: number;
  sent_at?: string;
  notes?: string;
  payment_terms?: string;
  items: InvoiceItem[];
  created_at: string;
}

export interface Payment {
  id: number;
  payment_number: string;
  invoice_id: number;
  invoice_number?: string;
  customer_id: number;
  customer_name?: string;
  customer_company?: string;
  amount: number;
  payment_method: 'UPI' | 'Bank Transfer' | 'Credit Card' | 'Cash' | 'Cheque';
  payment_date: string;
  transaction_ref?: string;
  notes?: string;
  status: string;
  created_at: string;
}

export interface SchedulerLog {
  id: number;
  run_date: string;
  subscriptions_checked: number;
  invoices_generated: number;
  details: string[];
  status: string;
  created_at: string;
}

export interface DashboardData {
  kpis: {
    activeSubscriptions: number;
    revenueReceived: number;
    outstandingAmount: number;
    overdueInvoicesCount: number;
    overdueAmount: number;
    mrr?: number;
    collectionRate?: number;
  };
  monthlyRevenue: { month: string; revenue: number }[];
  dailyRevenue?: { date: string; revenue: number }[];
  planDistribution?: { category: string; count: number; share: number }[];
  churnTrend?: { day: string; date: string; returnRate: number }[];
  paymentMethods: { payment_method: string; count: number; total: number }[];
  subscriptionStatus: { status: string; count: number }[];
  recentPayments: any[];
  overdueInvoices: any[];
  performance: {
    queryTimeMs: number;
    target: string;
    status: string;
  };
}
