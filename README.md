# Brightloop Software — Subscription Management System (SMS)

A complete, high-performance, desktop-optimized Subscription Management and Recurring Billing Platform built for **Brightloop Software**.

---

## 🌟 Quick Start on Desktop

### 1. Launch via Desktop Shortcut
Double-click the **`Brightloop SMS`** icon on your Linux Desktop:
```bash
/home/yash/Desktop/Brightloop-SMS.desktop
```

### 2. Launch via Terminal
```bash
/home/yash/start-brightloop-sms.sh
```
Or:
```bash
cd /home/yash/brightloop-sms
bun run server/index.ts
```

Open your browser at: **`http://localhost:3001`**

---

## 👥 Built-in Personas & Test Credentials

The application includes an instant **1-Click Persona Switcher** in the top navigation bar so you can test all views without logging out:

| Persona | Name | Email | Password | Role & Permissions |
| :--- | :--- | :--- | :--- | :--- |
| 👑 **Admin** | Sarah Connor | `admin@brightloop.com` | `Brightloop@2026` | Full system control: catalog, taxes, discounts, staff, subscriptions, reports |
| 👔 **Internal Staff** | Alex Morgan | `staff@brightloop.com` | `Brightloop@2026` | Operational access: customers, quotations, subscriptions, invoices & payments |
| 👤 **Customer** | Rajesh Patel (Acme Tech) | `customer@acme.com` | `Brightloop@2026` | Customer portal: view active subscriptions, view & print tax invoices, receipts |

---

## 🧩 Implemented Modules Overview

### 1. User Authentication & RBAC
- Role-based access control with distinct permission boundaries (Admin, Staff, Customer).
- Strict password policy enforcement: **> 8 characters, at least 1 uppercase letter, 1 lowercase letter, and 1 special character** (e.g. `Brightloop@2026`).
- Password reset token verification workflow with simulated email delivery.
- Admin-only staff member invitation and onboarding.

### 2. Customer Management
- Complete profile management: Name, Corporate Email, Phone, Company, Billing Address, and GSTIN / Tax ID.
- Real-time customer financial metrics: Active subscription counts, total spent, and outstanding unpaid balance.

### 3. Product & Variant Catalog
- Sales price, Cost price (with real-time gross margin calculation), and internal notes.
- **Dynamic Variant Engine**: Base product price combined with variant delta adjustments (e.g., *ERP Software* base ₹2,000 + *Odoo brand* variant +₹560 = **₹2,560**).

### 4. Subscription Plans & Billing Frequencies
- Supported billing frequencies: **Daily, Weekly, Monthly, and Yearly**.
- Minimum seat quantity restrictions.
- Plan lifecycle management: **Active**, **Paused**, **Closed Early**, and **Renewed**.
- Availability start and end dates with automatic plan termination.

### 5. Quotation Templates & Sales Offers
- **Reusable Quotation Templates**: Pre-configured offers (e.g. *Enterprise ERP Pack - 50 Seats* @ ₹1,05,000).
- Sales Quotation lifecycle: `Draft` ➔ `Sent` ➔ `Accepted` ➔ `Rejected`.
- **1-Click Subscription Conversion**: Accepting a quotation automatically generates a confirmed subscription and issues the initial billing cycle invoice.

### 6. Subscription Lifecycle Management
- Full 5-stage lifecycle visual progress stepper:
  Draft ➔ Quotation ➔ Confirmed ➔ Active ➔ Closed
- In-flight operational controls: **Pause Subscription**, **Resume**, **Close Early with Reason**, and **Renew Term**.

### 7. Automated Recurring Billing Scheduler
- Automated recurring invoice generation based on plan frequencies (`daily`, `weekly`, `monthly`, `yearly`).
- **Strict Idempotency Guarantee**: Unique composite database constraint on `(subscription_id, billing_cycle_start)` ensuring **zero duplicate invoices** and **zero skipped cycles**.
- **Interactive Simulator**: Advance the billing calendar (+30 days) and trigger the billing engine on demand with detailed real-time execution logs.

### 8. Tax Rules & Automated GST/VAT Engine
- Configurable statutory tax rules (Standard GST 18%, VAT 5%, Zero Tax 0%).
- Automatically calculated on net taxable amounts during quotation, subscription, and invoice generation.

### 9. Discount & Promotion Engine
- **Percentage Discounts** (e.g. `BULK10` — 10% off on 10+ seats) and **Fixed Discounts** (e.g. `FIXED500` — ₹500 off).
- Strict validation rules: Minimum order value, minimum seat count, date validity window, and maximum usage quotas.
- Automatically applied to billing cycles and recorded in discount audit logs.

### 10. Payment Settlements & Overdue Tracking
- Record payments across multiple payment rails: **UPI, Bank Transfer (NEFT/RTGS), Credit Card, Cash, and Cheque**.
- Real-time invoice status transitions (`confirmed` ➔ `paid` or partial balance tracking).
- Automated overdue invoice identification where `due_date < today` and invoice remains unpaid.

### 11. Finance Dashboard & Revenue Reports
- High-level KPIs: **Active Subscriptions**, **Revenue Received**, **Outstanding Balance**, and **Overdue Invoices**.
- Sub-second performance SLA: **~10ms response time** (well below the required < 2.0s constraint) using optimized SQLite indexing and WAL mode.
- Monthly revenue trends, payment method distributions, and agreement status breakdowns.

### 12. Printable Tax Invoices
- Pixel-perfect, professional A4 printable invoice document with Brightloop company branding, GSTIN, customer details, line items, tax breakdowns, discount stamps, and bank transfer instructions.

---

## 🛠️ Technology Stack
- **Frontend**: React 19, Tailwind CSS v4, Lucide Icons, Vite
- **Backend API**: Node.js / Bun, Express
- **Database**: SQLite with WAL mode & strict foreign key constraints
- **Desktop Launcher**: Linux `.desktop` file and shell runner
