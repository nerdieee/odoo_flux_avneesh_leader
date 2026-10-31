# Subscription Management System --- Technical Architecture

**Project:** Brightloop Software Subscription Management System\
**Document type:** Technical architecture and implementation blueprint\
**Version:** 1.0\
**Basis:** `Subscription_Management_System.pdf` (four-page project
brief)

------------------------------------------------------------------------

## 1. Purpose and scope

This document describes a practical architecture for implementing the
Subscription Management System (SMS) requested in the project brief. The
system centralizes the lifecycle of subscription products and plans,
quotations, customer subscriptions, recurring invoices, taxes,
discounts, payment records, and financial reporting.

### 1.1 Business goals from the brief

The system must replace spreadsheet- and manually-driven processes with
one application that can:

-   Manage customers, staff, products, product variants, plans, and plan
    availability.
-   Create quotation templates and convert accepted quotations into
    subscriptions.
-   Track subscription states from Draft through Quotation, Confirmed,
    Active, and Closed.
-   Generate invoices from subscriptions on their billing dates.
-   Calculate configured taxes and applicable discounts.
-   Record payments against invoices and expose outstanding and overdue
    invoices.
-   Present subscription and finance summaries with filters.
-   Keep pages responsive in under two seconds, including with thousands
    of subscriptions.

### 1.2 Out of scope unless separately requested

The brief does **not** explicitly require a payment gateway, automatic
bank reconciliation, automatic collection of money, external accounting
integration, SMS/WhatsApp notifications, or a customer-facing
self-service cancellation workflow. These can be added later, but should
not be treated as mandatory acceptance criteria without confirmation.

The brief says that payments are recorded with a method, amount, date,
note, and invoice association. This architecture therefore treats
payment recording as an internal operation; a gateway integration is an
optional extension.

------------------------------------------------------------------------

## 2. Assumptions and design decisions

The PDF specifies business behaviour, not a technical stack or complete
data model. The following are implementation recommendations, not facts
stated in the brief:

1.  **Architecture style:** modular monolith initially. One backend
    application with clearly separated business modules is simpler to
    develop and deploy than microservices, while preserving boundaries
    for future extraction.
2.  **Frontend:** Next.js with TypeScript and Tailwind CSS.
3.  **Backend:** Node.js with TypeScript and Express (or NestJS if a
    more opinionated structure is preferred).
4.  **Database:** PostgreSQL as the source of truth.
5.  **Background jobs:** Redis + BullMQ, or a PostgreSQL-backed job
    runner. The scheduler must be durable and retryable.
6.  **ORM:** Drizzle ORM or Prisma. Use database migrations and explicit
    constraints.
7.  **Authentication:** secure password hashing, session or short-lived
    access token strategy, and role-based authorization.
8.  **Email:** an SMTP/email provider for password reset and optional
    invoice delivery.
9.  **Deployment:** Docker containers behind HTTPS, with managed
    PostgreSQL and Redis where available.

### 2.1 Important domain interpretations to confirm

The brief leaves some details open. Record decisions before
implementation:

-   Whether "Confirmed" invoices become legally issued invoices
    immediately, and whether they can later be cancelled or require a
    credit note.
-   Whether partial payments are allowed. The brief requires payment
    records and outstanding balances but does not explicitly define
    partial-payment behaviour.
-   Whether a subscription renews automatically by default or only when
    a user chooses renewal.
-   Whether pause extends the expiry date or preserves the original end
    date.
-   Whether tax is inclusive or exclusive of price, and how
    jurisdiction/place-of-supply rules work.
-   Whether discount usage is counted per invoice, subscription,
    customer, or redemption.
-   Whether subscription changes are prorated mid-cycle.
-   Whether "cost price" is used only for internal reporting or for
    margin calculations.
-   Whether customers can create accounts themselves and how an account
    is linked to a customer record.
-   Whether staff can record payments, confirm invoices, or change
    subscriptions; the brief says staff have limited access but does not
    define each permission.

Do not silently assume these policies in production. Keep them
configurable where practical.

------------------------------------------------------------------------

## 3. System context and actors

### 3.1 Actors

  -----------------------------------------------------------------------
  Actor                   Responsibilities        Access boundary
  ----------------------- ----------------------- -----------------------
  Admin                   Full system             All permitted business
                          configuration;          data
                          products, plans, taxes, 
                          discounts; staff        
                          creation; oversight     

  Internal staff          Day-to-day customer,    Only actions granted by
                          quotation,              staff permissions
                          subscription, invoice,  
                          and payment operations  

  Customer                View their own          Own customer record and
                          subscriptions and       related resources only
                          invoices through a      
                          portal                  

  Background worker       Billing runs, invoice   Machine identity with
                          generation,             narrowly scoped
                          expiry/renewal checks,  permissions
                          email delivery          
  -----------------------------------------------------------------------

The background worker is an implementation component, not a human role
defined in the brief.

### 3.2 Context diagram

``` mermaid
flowchart LR
    A[Admin] --> UI[Web application]
    S[Internal staff] --> UI
    C[Customer] --> UI
    UI --> API[Backend API]
    API --> DB[(PostgreSQL)]
    API --> Q[Job queue]
    Q --> W[Background workers]
    W --> DB
    W --> E[Email provider]
    API --> E
```

The application owns business data in PostgreSQL. Workers use the same
domain services and database rules as synchronous API requests; they
must not implement a separate version of billing logic.

------------------------------------------------------------------------

## 4. High-level architecture

### 4.1 Recommended modular monolith

``` mermaid
flowchart TB
    subgraph Clients
      ADM[Admin dashboard]
      STAFF[Staff workspace]
      PORTAL[Customer portal]
    end

    subgraph Application
      API[HTTP API and middleware]
      AUTH[Identity and access]
      CUST[Customer module]
      CATALOG[Product and plan catalogue]
      QUOTE[Quotation module]
      SUB[Subscription module]
      BILL[Billing and invoice module]
      TAX[Tax and discount modules]
      PAY[Payment recording]
      REPORT[Reporting module]
      AUDIT[Audit log]
      SCHED[Scheduler and job publisher]
      WORKER[Background workers]
    end

    DB[(PostgreSQL)]
    REDIS[(Redis / job queue)]
    MAIL[Email provider]

    ADM --> API
    STAFF --> API
    PORTAL --> API
    API --> AUTH
    API --> CUST
    API --> CATALOG
    API --> QUOTE
    API --> SUB
    API --> BILL
    API --> TAX
    API --> PAY
    API --> REPORT
    API --> AUDIT
    SCHED --> REDIS
    REDIS --> WORKER
    WORKER --> BILL
    WORKER --> SUB
    WORKER --> MAIL
    AUTH --> DB
    CUST --> DB
    CATALOG --> DB
    QUOTE --> DB
    SUB --> DB
    BILL --> DB
    TAX --> DB
    PAY --> DB
    REPORT --> DB
    AUDIT --> DB
```

### 4.2 Module responsibilities

  -----------------------------------------------------------------------
  Module                  Owns                    Main responsibilities
  ----------------------- ----------------------- -----------------------
  Identity & access       Users, roles,           Registration, login,
                          permissions, reset      password reset,
                          tokens                  authorization

  Customers               Customer profiles       Customer records and
                                                  account linkage

  Catalogue               Products, variants,     Product configuration
                          plans, prices           and plan availability

  Quotations              Templates, quotations,  Create offers and
                          lines                   manage validity

  Subscriptions           Subscription records    Lifecycle, dates,
                          and lines               pause, renewal, closure

  Tax                     Tax rules               Resolve applicable tax
                                                  and calculate invoice
                                                  tax

  Discounts               Discount rules and      Eligibility, limits,
                          usage                   dates, application

  Billing                 Billing runs, invoices, Due detection, invoice
                          invoice lines           creation, totals,
                                                  invoice states

  Payments                Payment records and     Record money received
                          allocations             and calculate balances

  Reporting               Read models / aggregate Dashboard and filtered
                          queries                 reports

  Audit                   Audit events            Trace important changes

  Notifications           Email delivery jobs     Password reset and
                                                  optional invoice email
  -----------------------------------------------------------------------

Modules should call one another through service interfaces or domain
events, rather than reaching into one another's internal implementation.

------------------------------------------------------------------------

## 5. Core domain model

### 5.1 Main entities and relationships

``` mermaid
erDiagram
    USER ||--o| CUSTOMER : "may link to"
    USER }o--o{ ROLE : has
    CUSTOMER ||--o{ QUOTATION : receives
    QUOTATION ||--|{ QUOTATION_ITEM : contains
    QUOTATION }o--|| QUOTATION_TEMPLATE : based_on
    CUSTOMER ||--o{ SUBSCRIPTION : owns
    PLAN ||--o{ SUBSCRIPTION : selected_for
    SUBSCRIPTION ||--|{ SUBSCRIPTION_ITEM : contains
    PRODUCT ||--o{ PRODUCT_VARIANT : has
    PRODUCT ||--o{ SUBSCRIPTION_ITEM : referenced_by
    PRODUCT_VARIANT o|--o{ SUBSCRIPTION_ITEM : selected_as
    PLAN ||--o{ PLAN_PRICE : priced_by
    SUBSCRIPTION ||--o{ INVOICE : billed_by
    INVOICE ||--|{ INVOICE_ITEM : contains
    INVOICE ||--o{ PAYMENT_ALLOCATION : settled_by
    PAYMENT ||--o{ PAYMENT_ALLOCATION : allocated
    TAX_RULE ||--o{ INVOICE_ITEM : applied_to
    DISCOUNT ||--o{ DISCOUNT_USAGE : consumed_as
    SUBSCRIPTION ||--o{ DISCOUNT_USAGE : may_use
    USER ||--o{ AUDIT_LOG : performs
```

This is a conceptual model. The exact cardinalities and whether
quotation acceptance creates a subscription directly or through a
confirmation step should be finalized with the product owner.

### 5.2 Suggested tables

#### Identity and authorization

**users** - `id` UUID primary key - `email` unique, normalized and
indexed - `password_hash` - `status` (active, disabled, pending) -
`created_at`, `updated_at`, `last_login_at`

**roles** - `id`, `name` (admin, staff, customer)

**permissions** - `id`, `key`, `description`

**user_roles** - `user_id`, `role_id`

**role_permissions** - `role_id`, `permission_id`

**password_reset_tokens** - `id`, `user_id`, `token_hash`, `expires_at`,
`used_at`, `created_at`

Never store raw passwords or raw reset tokens. Enforce unique email
addresses in the database, not only in application code.

#### Customers and staff

**customers** - `id` - `user_id` nullable unique, if a portal login
exists - `customer_code` unique - `name`, `email`, `phone` -
`billing_address`, `tax_identifier` (if required) - `status` -
timestamps

**staff_profiles** - `id`, `user_id` unique - `display_name`,
`department` - timestamps

Staff accounts are created by an admin. Customer accounts can be linked
to customer profiles. Enforce ownership at the API/service layer for
every customer-facing read.

#### Products and variants

**products** - `id`, `name`, `type` - `sales_price` numeric -
`cost_price` numeric - `currency` - `notes`, `status` - timestamps

**product_variants** - `id`, `product_id` - `attribute_name`,
`attribute_value` (for example, brand = Odoo) - `price_adjustment`
numeric - `status`

Store money as `NUMERIC`, not floating-point. Define whether a variant
adjustment is additive or replaces the base price; the brief's Odoo
example indicates an additive adjustment of 560.

#### Plans and prices

**plans** - `id`, `name`, `description` - `minimum_quantity` -
`available_from`, `available_until` - `auto_close_on_end` -
`allow_early_close`, `allow_pause`, `allow_renewal` - `status` -
timestamps

**plan_prices** - `id`, `plan_id` - `billing_interval` enum: daily,
weekly, monthly, yearly - `interval_count` (default 1) - `unit_price`,
`currency` - `effective_from`, `effective_until`

Separating plan metadata from plan prices makes it possible to retain
price history. When a subscription is created, snapshot the agreed price
so a later catalogue price change does not silently alter an existing
contract.

#### Quotations

**quotation_templates** - `id`, `name`, `validity_days`, `status` -
timestamps

**quotation_template_items** - `id`, `template_id`, `product_id`,
`variant_id` nullable - `plan_id`, `quantity`, `unit_price`

**quotations** - `id`, `quotation_number` unique, `customer_id` -
`template_id` nullable - `status` (draft, sent/quotation, accepted,
rejected, expired) - `issued_at`, `valid_until`, `accepted_at` -
`currency`, `subtotal`, `discount_total`, `tax_total`, `grand_total` -
`created_by`, timestamps

**quotation_items** - `id`, `quotation_id`, `product_id`, `variant_id`
nullable, `plan_id` - `description_snapshot`, `quantity`, `unit_price` -
`tax_rule_id` nullable, `line_total`

The PDF's subscription lifecycle uses Draft → Quotation → Confirmed →
Active → Closed. Quotation status fields above are a suggested
representation; keep quotation status and subscription status separate.

#### Subscriptions

**subscriptions** - `id`, `subscription_number` unique - `customer_id`,
`plan_id` - `source_quotation_id` nullable unique - `status` (draft,
quotation, confirmed, active, closed) - `start_date`, `expiry_date` -
`next_billing_at` - `billing_interval`, `interval_count` - `currency`,
`payment_terms` - `paused_at`, `closed_at`, `close_reason` - timestamps

**subscription_items** - `id`, `subscription_id`, `product_id`,
`variant_id` nullable - `description_snapshot`, `quantity` -
`unit_price`, `tax_rule_id` nullable - `created_at`, `updated_at`

Persist the billing interval and agreed prices on the subscription (or
in a versioned subscription-price record) so changes to a plan do not
retroactively modify existing subscriptions.

#### Taxes and discounts

**tax_rules** - `id`, `name`, `rate` numeric - `calculation_type`
(percentage or fixed, if fixed tax is supported) - `inclusive` boolean -
`country/region` or other applicability fields as needed -
`effective_from`, `effective_until`, `active`

The brief requires admin-configured tax rules but does not specify tax
jurisdictions or inclusive/exclusive treatment. Confirm these details
before implementing real tax compliance.

**discounts** - `id`, `code` nullable, `name` - `discount_type` (fixed,
percentage) - `value` - `minimum_purchase_amount` nullable -
`minimum_quantity` nullable - `starts_at`, `ends_at` - `maximum_uses`
nullable - `usage_count` - `scope` (selected products or whole
subscription) - `active`

**discount_products** - `discount_id`, `product_id`

**discount_usages** - `id`, `discount_id`, `customer_id`,
`subscription_id` nullable - `invoice_id` nullable - `amount_applied`,
`used_at` - unique/idempotency key as appropriate

Usage-limit checks must be transactional to prevent two simultaneous
invoice jobs from consuming the final available use.

#### Invoices and payments

**invoices** - `id`, `invoice_number` unique - `customer_id`,
`subscription_id` - `billing_period_start`, `billing_period_end` -
`issue_date`, `due_date` - `status` (draft, confirmed, paid,
cancelled) - `currency` - `subtotal`, `discount_total`, `tax_total`,
`grand_total` - `amount_paid`, `balance_due` - `created_at`,
`confirmed_at`, `paid_at`

**invoice_items** - `id`, `invoice_id`, `product_id` nullable -
`description_snapshot`, `quantity`, `unit_price` - `discount_amount`,
`taxable_amount`, `tax_amount`, `line_total` - `tax_rule_snapshot` or
tax-rule reference plus stored rate

**payments** - `id`, `payment_reference` unique nullable -
`customer_id`, `method`, `amount`, `currency` - `payment_date`, `note`,
`recorded_by` - `created_at`

**payment_allocations** - `id`, `payment_id`, `invoice_id`,
`amount_allocated` - unique constraints to prevent duplicate allocation
events where relevant

A separate allocation table is recommended because one payment may
settle multiple invoices, and an invoice may be settled by multiple
payments. If the product owner confirms a strict
one-payment-to-one-invoice rule, this can be simplified.

#### Operations and audit

**billing_runs** - `id`, `run_key` unique, `started_at`, `finished_at` -
`status`, `candidate_count`, `created_count`, `failed_count`

**billing_run_items** - `id`, `billing_run_id`, `subscription_id` -
`billing_period_start`, `billing_period_end` - `status`, `invoice_id`
nullable, `error_code` nullable - unique (`subscription_id`,
`billing_period_start`, `billing_period_end`)

**audit_logs** - `id`, `actor_user_id` nullable, `actor_type` -
`action`, `entity_type`, `entity_id` - `before_data` JSONB nullable,
`after_data` JSONB nullable - `request_id`, `created_at`

Audit sensitive administrative changes, subscription state changes,
invoice confirmation/cancellation, discount changes, and payment
creation/allocation.

------------------------------------------------------------------------

## 6. Business workflows

### 6.1 Registration and password reset

1.  Accept name, email, and password.
2.  Normalize email and check format.
3.  Validate password: more than eight characters, at least one
    uppercase letter, one lowercase letter, and one special character.
4.  Hash password using Argon2id or bcrypt with an appropriate work
    factor.
5.  Insert user with a unique email constraint.
6.  Assign the customer role for self-service registration.
7.  Create or link a customer profile.
8.  For password reset, create a cryptographically random, single-use
    token; store only its hash and expiry.
9.  Send reset link through the configured email provider.
10. On use, validate expiry and unused state, update the password hash,
    and invalidate the token.

Do not reveal whether an email address exists in password-reset
responses.

### 6.2 Product and plan setup

1.  Admin creates product with name, type, sales price, cost price,
    notes.
2.  Admin adds variants and price adjustments.
3.  Admin creates a plan and selects billing interval.
4.  Admin sets minimum quantity and availability dates.
5.  Admin configures auto-close, early-close, pause, and renewal
    policies.
6.  Validate date ranges and price/currency values.
7.  Record an audit event.

### 6.3 Quotation to subscription

1.  Staff selects a customer and quotation template.
2.  System copies template lines into a new quotation; it does not keep
    mutable line values linked only to the template.
3.  Staff adjusts quantities or allowed terms.
4.  System calculates subtotal, eligible discount, tax and total.
5.  Set `valid_until` from the configured validity period.
6.  Send or expose the quotation to the customer.
7.  On acceptance, execute one transaction:
    -   lock/check quotation state and validity;
    -   mark quotation accepted;
    -   create one subscription using a unique source-quotation
        reference;
    -   copy product lines and agreed prices;
    -   set start/expiry dates and billing terms;
    -   move subscription through the required states according to the
        accepted workflow.
8.  Write audit records and publish a subscription-created event.

The unique source quotation reference prevents accidental duplicate
subscriptions from repeated acceptance requests.

### 6.4 Subscription state transitions

Required states in the brief:

``` mermaid
stateDiagram-v2
    [*] --> Draft
    Draft --> Quotation
    Quotation --> Confirmed
    Confirmed --> Active
    Active --> Closed
    Draft --> Closed
    Quotation --> Closed
    Confirmed --> Closed
```

This diagram is a recommended baseline. The brief also mentions pausing
and renewing, but does not name them as states in the required
lifecycle. Implement pause as either a separate `paused` state or a
pause period/flag only after choosing a consistent policy. Renewal can
create a new term/version or extend the existing subscription; choose
and document one approach.

All state changes must be validated in a domain service. Do not allow
arbitrary status updates from the client.

### 6.5 Recurring billing workflow

This is the most critical workflow.

**Recommended sequence:**

1.  A scheduler runs at a defined frequency (for example, every few
    minutes).
2.  It finds active subscriptions whose `next_billing_at` is due.
3.  It creates a billing-run record.
4.  It claims due subscriptions in small batches using row locks (for
    example, `FOR UPDATE SKIP LOCKED`) or another safe distributed-claim
    mechanism.
5.  For each subscription, determine the billing period and verify it is
    eligible:
    -   subscription is active;
    -   billing date is due;
    -   plan/contract has not expired;
    -   no invoice already exists for this subscription and period;
    -   subscription is not paused or closed.
6.  Calculate product lines from stored subscription snapshots.
7.  Resolve eligible discounts and tax rules.
8.  Create invoice and invoice lines in one database transaction.
9.  Record billing-run item and advance `next_billing_at` in the same
    transaction.
10. Commit and enqueue optional invoice-email delivery.
11. Retry transient failures with backoff; record permanent failures for
    staff review.

**Duplicate prevention is mandatory.** Use a unique database key on
`(subscription_id, billing_period_start, billing_period_end)` or an
equivalent stable billing-cycle key. Application-level "check then
insert" alone is not safe under concurrency.

**Skipped billing dates:** define whether the system catches up one
invoice per missed period or generates one consolidated invoice. The
brief says invoices must not be skipped, so the implementation should
detect missed periods and create the required invoices according to a
documented catch-up policy.

**Date handling:** store timestamps consistently (UTC for instants) and
store billing timezone or billing calendar context where necessary.
Monthly recurrence must handle month ends deliberately (for example, a
subscription starting on the 31st). Define whether the next charge
becomes the last day of shorter months or follows another policy.

### 6.6 Invoice lifecycle

Required states in the brief:

``` mermaid
stateDiagram-v2
    [*] --> Draft
    Draft --> Confirmed
    Draft --> Cancelled
    Confirmed --> Paid
```

The brief says invoices can be confirmed, cancelled, sent, and printed.
"Sent" and "printed" are actions, not necessarily financial statuses.
Track `sent_at` and delivery attempts separately if needed.

A confirmed invoice should become paid when its balance reaches zero. If
partial payments are supported, keep it confirmed/partially paid until
the balance reaches zero; "partially paid" is a recommended extension,
not a required status from the PDF.

### 6.7 Tax and total calculation

Recommended calculation sequence:

1.  Determine eligible product lines and quantities.
2.  Calculate base line amount.
3.  Apply product/variant price adjustments.
4.  Apply eligible line-level or subscription-level discounts according
    to the configured scope.
5.  Determine taxable base.
6.  Apply the applicable tax rule.
7.  Round using a documented currency precision and rounding policy.
8.  Store calculation snapshots on invoice lines.
9.  Sum line values into invoice totals.

Use decimal arithmetic in the application and `NUMERIC` columns in
PostgreSQL. Never use JavaScript binary floating-point as the
authoritative money calculation.

The brief does not define tax jurisdiction, tax-inclusive prices,
compound taxes, exemptions, or rounding rules. Those require
product/business decisions.

### 6.8 Discount eligibility

Before applying a discount, validate:

-   active flag;
-   current time within start/end dates;
-   minimum purchase amount;
-   minimum quantity;
-   product scope or subscription-wide scope;
-   maximum usage not exceeded;
-   whether the customer/subscription is eligible under the chosen
    policy.

Reserve/increment usage within the same transaction as invoice creation.
If invoice generation fails, the usage reservation must roll back.
Define whether cancelled invoices restore a discount use.

### 6.9 Payment recording and invoice balance

When a staff member records a payment:

1.  Validate amount is positive and currency matches the invoice.
2.  Validate invoice is eligible to receive payment.
3.  Create payment record.
4.  Allocate the amount to the invoice.
5.  Recalculate amount paid and balance due transactionally.
6.  Mark invoice Paid only when balance due is zero (or within an
    explicitly defined rounding tolerance).
7.  Record actor and audit event.

For a payment larger than the invoice balance, reject it or record
unapplied credit according to an explicit policy. Do not silently
discard the excess.

An invoice is overdue when it is not fully paid and its due date is
earlier than the business's current date. Store due date and timezone
policy consistently.

------------------------------------------------------------------------

## 7. API design

Use versioned REST endpoints, for example `/api/v1`. Return consistent
error objects and validate all request bodies.

### 7.1 Authentication

  Method   Endpoint                  Purpose
  -------- ------------------------- -------------------------
  POST     `/auth/register`          Customer registration
  POST     `/auth/login`             Login
  POST     `/auth/logout`            Logout / revoke session
  POST     `/auth/forgot-password`   Request reset link
  POST     `/auth/reset-password`    Use reset token
  GET      `/auth/me`                Current user and role

### 7.2 Users and staff

  Method   Endpoint       Purpose
  -------- -------------- -------------------------------------
  GET      `/users`       List users (authorized staff/admin)
  POST     `/staff`       Admin creates staff member
  PATCH    `/staff/:id`   Update staff profile/status
  GET      `/roles`       List roles and permissions

### 7.3 Customers

  Method   Endpoint                         Purpose
  -------- -------------------------------- ------------------------
  GET      `/customers`                     Search/list customers
  POST     `/customers`                     Create customer
  GET      `/customers/:id`                 Customer detail
  PATCH    `/customers/:id`                 Update customer
  GET      `/customers/:id/subscriptions`   Customer subscriptions
  GET      `/customers/:id/invoices`        Customer invoices

### 7.4 Catalogue

  Method      Endpoint                   Purpose
  ----------- -------------------------- ----------------------
  GET/POST    `/products`                List/create products
  GET/PATCH   `/products/:id`            View/update product
  POST        `/products/:id/variants`   Add variant
  GET/POST    `/plans`                   List/create plans
  GET/PATCH   `/plans/:id`               View/update plan
  POST        `/plans/:id/prices`        Add price version

### 7.5 Quotations and subscriptions

  Method     Endpoint                        Purpose
  ---------- ------------------------------- --------------------------------
  GET/POST   `/quotation-templates`          List/create templates
  GET/POST   `/quotations`                   List/create quotations
  GET        `/quotations/:id`               Quotation detail
  POST       `/quotations/:id/send`          Send quotation
  POST       `/quotations/:id/accept`        Accept and create subscription
  GET/POST   `/subscriptions`                List/create subscriptions
  GET        `/subscriptions/:id`            Subscription detail
  POST       `/subscriptions/:id/confirm`    Confirm
  POST       `/subscriptions/:id/activate`   Activate
  POST       `/subscriptions/:id/pause`      Pause
  POST       `/subscriptions/:id/resume`     Resume
  POST       `/subscriptions/:id/renew`      Renew
  POST       `/subscriptions/:id/close`      Close

The pause/resume/renew endpoints are proposed API operations based on
capabilities mentioned in the brief. Their exact semantics must follow
the chosen domain policy.

### 7.6 Taxes, discounts, invoices and payments

  Method     Endpoint                      Purpose
  ---------- ----------------------------- ---------------------------------
  GET/POST   `/tax-rules`                  List/create tax rules
  GET/POST   `/discounts`                  List/create discount rules
  PATCH      `/discounts/:id`              Update discount
  GET/POST   `/invoices`                   List/create or inspect invoices
  GET        `/invoices/:id`               Invoice detail
  POST       `/invoices/:id/confirm`       Confirm invoice
  POST       `/invoices/:id/cancel`        Cancel invoice
  POST       `/invoices/:id/send`          Send invoice
  GET        `/invoices/:id/pdf`           Render/print invoice PDF
  POST       `/invoices/:id/payments`      Record/allocate payment
  GET        `/payments`                   List payments
  GET        `/reports/finance-summary`    Dashboard totals
  GET        `/reports/overdue-invoices`   Overdue report

For customer portal routes, derive customer identity from the
authenticated session. Do not accept a customer ID from the browser as
proof of ownership.

### 7.7 API conventions

-   Use pagination (`limit`, `cursor` or `page`) for list endpoints.
-   Support server-side filtering and sorting with allowlisted fields.
-   Use idempotency keys for operations that can be retried, especially
    quotation acceptance, invoice creation, and payment recording.
-   Return `400` for invalid input, `401` for unauthenticated, `403` for
    unauthorized, `404` for missing resources, `409` for
    state/uniqueness conflicts, and `422` for domain validation failures
    where appropriate.
-   Never return password hashes, reset tokens, internal secrets, or
    other users' data.
-   Include a request/correlation ID in logs and error responses.

------------------------------------------------------------------------

## 8. Frontend application structure

### 8.1 Main areas

**Admin dashboard** - Overview - Users and staff - Customers - Products
and variants - Plans and prices - Tax rules - Discounts - Quotation
templates - Quotations - Subscriptions - Invoices - Payments - Reports -
Audit history

**Staff workspace** - Customer search and detail - Quotations -
Subscriptions - Invoice list and detail - Payment recording - Overdue
follow-up list

Only show actions permitted to the signed-in staff member. Hiding a
button is not authorization; the backend must enforce permissions.

**Customer portal** - Profile - My subscriptions - Subscription detail
and status - My invoices - Invoice PDF/download - Payment history if
available

A customer must only see records linked to their authenticated customer
identity.

### 8.2 Suggested frontend folder structure

``` text
apps/
  web/
    src/
      app/
        (auth)/
        (admin)/
        (staff)/
        (portal)/
      components/
        ui/
        forms/
        tables/
        charts/
      features/
        auth/
        customers/
        products/
        plans/
        quotations/
        subscriptions/
        invoices/
        payments/
        discounts/
        reports/
      lib/
        api-client.ts
        auth.ts
        permissions.ts
        validation/
      hooks/
      types/
```

Prefer feature-based organization. Keep business calculations on the
backend; frontend calculations are previews only.

------------------------------------------------------------------------

## 9. Backend code organization

``` text
apps/
  api/
    src/
      modules/
        auth/
        users/
        customers/
        products/
        plans/
        quotations/
        subscriptions/
        tax/
        discounts/
        billing/
        invoices/
        payments/
        reports/
        audit/
        notifications/
      jobs/
        schedule-billing.ts
        process-billing-run.ts
        send-invoice-email.ts
        expire-quotations.ts
        close-expired-subscriptions.ts
      common/
        middleware/
        errors/
        validation/
        database/
        logger/
        money/
        dates/
      config/
      app.ts
      server.ts
  worker/
    src/
      workers/
      queues/
      bootstrap.ts
packages/
  shared/
    src/
      types/
      schemas/
      constants/
```

Within each module, separate: - **Routes/controllers:** HTTP parsing and
response formatting. - **Schemas:** request validation. - **Services/use
cases:** application workflows. - **Domain logic:** state transitions
and calculations. - **Repositories:** database access. - **Events:**
integration with other modules.

Do not put all business logic in controllers or route handlers.

------------------------------------------------------------------------

## 10. Background jobs and scheduling

### 10.1 Job types

  ------------------------------------------------------------------------------
  Job                            Trigger                 Responsibility
  ------------------------------ ----------------------- -----------------------
  `billing.scan_due`             Scheduled               Find subscriptions due
                                                         for billing

  `billing.generate_invoice`     Queue                   Generate one invoice
                                                         for one billing period

  `subscription.close_expired`   Scheduled               Close
                                                         plans/subscriptions
                                                         when configured to
                                                         auto-close

  `quotation.expire`             Scheduled               Mark quotations expired
                                                         after validity ends

  `invoice.send_email`           Event/manual action     Deliver invoice email

  `report.refresh`               Scheduled/on demand     Refresh expensive
                                                         aggregate read models
                                                         if required
  ------------------------------------------------------------------------------

Only implement quotation expiry automation if the product owner confirms
the desired expired status and behaviour; quotation validity is
specified, but the exact automatic transition is not.

### 10.2 Reliability requirements

-   Jobs must be durable across process restarts.
-   Use bounded retries with exponential backoff and jitter.
-   Make handlers idempotent.
-   Store job/business outcome in PostgreSQL.
-   Use a dead-letter or failed-job review process.
-   Avoid a single long-running job for hundreds of subscriptions;
    process batches.
-   Monitor queue depth, retry count, failure count, and job duration.
-   Do not rely only on an in-memory `setInterval` for billing.

### 10.3 Transaction boundary for invoice generation

The transaction should include: 1. Verify/lock subscription and due
billing period. 2. Check unique billing-period key. 3. Compute and
persist invoice header and lines. 4. Reserve discount usage. 5. Persist
billing-run outcome. 6. Advance next billing date.

Email delivery should happen after commit through a separate job. An
email failure must not roll back a valid invoice.

------------------------------------------------------------------------

## 11. Security and access control

### 11.1 Role-based access

Create explicit permissions such as:

  Permission                    Admin           Staff   Customer
  --------------------------- ------- --------------- ----------
  Manage products/plans           Yes    Configurable         No
  Manage tax/discount rules       Yes   No by default         No
  Create staff                    Yes              No         No
  Manage customers                Yes     Yes, scoped         No
  Create quotations               Yes             Yes         No
  Manage subscriptions            Yes     Yes, scoped         No
  View all invoices               Yes     Yes, scoped         No
  View own invoices               Yes             Yes        Yes
  Record payments                 Yes    Configurable         No
  View finance dashboard          Yes    Configurable         No

The PDF only explicitly defines admin, staff and customer access at a
high level. The staff permission details in this table are recommended
defaults and must be agreed upon.

### 11.2 Security checklist

-   Hash passwords using Argon2id or bcrypt.
-   Enforce unique normalized emails at the database level.
-   Validate password requirements on the server.
-   Use HTTPS in all deployed environments.
-   Use secure, HTTP-only, same-site cookies if cookie sessions are
    used.
-   Protect state-changing cookie-authenticated requests against CSRF.
-   Rate-limit login and password-reset endpoints.
-   Use single-use, expiring password-reset tokens.
-   Enforce ownership checks on every customer resource.
-   Validate input and use parameterized queries.
-   Apply least-privilege database credentials.
-   Keep secrets in environment/secret management, not source control.
-   Audit privileged actions and payment changes.
-   Avoid logging passwords, tokens, payment credentials, or unnecessary
    personal data.

------------------------------------------------------------------------

## 12. Performance and scalability

The PDF sets a target that every page should respond in under two
seconds with thousands of subscriptions.

Treat this as a measurable target, not a guarantee from choosing a
particular stack.

### 12.1 Database indexes

Candidate indexes include:

``` sql
CREATE UNIQUE INDEX users_email_unique
  ON users (lower(email));

CREATE INDEX subscriptions_status_next_billing_idx
  ON subscriptions (status, next_billing_at);

CREATE INDEX subscriptions_customer_idx
  ON subscriptions (customer_id, created_at DESC);

CREATE INDEX invoices_customer_issue_date_idx
  ON invoices (customer_id, issue_date DESC);

CREATE INDEX invoices_status_due_date_idx
  ON invoices (status, due_date);

CREATE INDEX payments_customer_date_idx
  ON payments (customer_id, payment_date DESC);

CREATE UNIQUE INDEX billing_period_unique
  ON billing_run_items (
    subscription_id,
    billing_period_start,
    billing_period_end
  );
```

Create indexes based on actual query patterns and inspect query plans.
Adapt the example indexes to the final schema; for example, the unique
billing key may belong on invoices rather than billing-run items.

### 12.2 API and UI performance

-   Paginate all large tables.
-   Filter and sort on the server.
-   Select only required columns.
-   Avoid N+1 queries; use deliberate joins or batched queries.
-   Aggregate dashboard values in SQL rather than downloading all
    records.
-   Cache safe, frequently requested summary data with short TTLs if
    measurements justify it.
-   Refresh expensive reports asynchronously if needed.
-   Debounce search input.
-   Avoid loading every invoice or subscription into the browser.
-   Use loading states and sensible page-size limits.

### 12.3 Performance acceptance test

Test with a generated dataset containing at least several thousand
subscriptions and associated invoices. Measure: - Dashboard summary
endpoint. - Subscription list with common filters. - Invoice list with
status/date filters. - Customer detail with recent
invoices/subscriptions.

Target: p95 response time below two seconds under an agreed test load.
The PDF says "every page" under two seconds but does not define
concurrency, hardware, or percentile; those test conditions should be
agreed and documented.

------------------------------------------------------------------------

## 13. Reporting definitions

Define metrics centrally so different screens do not calculate
conflicting values.

  -----------------------------------------------------------------------
  Metric                              Suggested definition
  ----------------------------------- -----------------------------------
  Active subscriptions                Count of subscriptions with status
                                      Active at the report's as-of time

  Revenue received                    Sum of allocated/received payments
                                      in the selected date range

  Outstanding                         Sum of invoice balances greater
                                      than zero

  Overdue invoices                    Unpaid balance greater than zero
                                      and due date before the business
                                      date

  Subscription revenue                Contracted recurring value for a
                                      selected period, using a documented
                                      normalization rule
  -----------------------------------------------------------------------

The PDF asks for active subscriptions, revenue received, owed amounts,
and overdue invoices. It does not define MRR/ARR or revenue recognition.
If MRR/ARR is displayed, label it as an additional calculated metric and
document how daily, weekly, monthly and yearly plans are normalized.

For reliable financial reporting, base "revenue received" on payment
records/allocations rather than invoice totals. Revenue recognition and
accounting treatment may require separate rules.

------------------------------------------------------------------------

## 14. Testing strategy

### 14.1 Unit tests

Test: - Password policy validation. - Product variant price
adjustment. - Billing date calculation for daily, weekly, monthly and
yearly intervals. - Month-end recurrence behaviour. - Tax calculation
and rounding. - Discount eligibility and usage limits. - Invoice totals
and balance calculations. - Subscription and invoice state transitions.

### 14.2 Integration tests

Test: - Duplicate email registration is rejected. - Only admin can
create staff. - Customer A cannot access Customer B's subscription or
invoice. - Quotation acceptance creates exactly one subscription. - A
due subscription creates exactly one invoice for its billing period. -
Re-running a billing job does not create a duplicate invoice. - Failed
invoice generation does not consume discount usage. - Payment is
allocated to the correct invoice. - Invoice becomes Paid when fully
settled. - Overdue invoice report includes the correct records.

### 14.3 End-to-end tests

Suggested end-to-end scenario:

1.  Admin logs in.
2.  Admin creates product, variant, plan, tax rule and discount.
3.  Admin creates a quotation template.
4.  Staff creates a quotation for a customer.
5.  Quotation is accepted.
6.  Subscription becomes active.
7.  Test clock advances to the billing date.
8.  Billing worker generates an invoice.
9.  Invoice is confirmed and sent.
10. Staff records a payment.
11. Invoice becomes Paid.
12. Dashboard reflects the updated payment and subscription counts.

Use a controllable test clock rather than waiting for real calendar
dates.

### 14.4 Test data

The brief provides examples and business rules, but does not include a
real customer/product dataset, SQL dump, CSV, or JSON seed file. Create
synthetic seed data for development and testing.

Include: - Customers with and without portal accounts. - Daily, weekly,
monthly and yearly plans. - Different product variants. - Active,
paused, expired and closed subscriptions (where pause is implemented). -
Draft, confirmed, paid and overdue invoices. - Fixed and percentage
discounts. - Discounts that are not yet active, expired, or at their
usage limit. - Full and, if supported, partial payments. - Billing
periods around month-end and leap day.

Use clearly fictional names, email addresses and payment references.

------------------------------------------------------------------------

## 15. Deployment and operations

### 15.1 Deployment topology

``` mermaid
flowchart TB
    USER[Browser] --> HTTPS[HTTPS reverse proxy]
    HTTPS --> WEB[Next.js application]
    WEB --> API[Node.js API]
    API --> PG[(PostgreSQL)]
    API --> R[(Redis)]
    R --> WORKER[Worker process]
    WORKER --> PG
    WORKER --> EMAIL[Email provider]
    API --> OBS[Logs and metrics]
    WORKER --> OBS
```

### 15.2 Environments

Maintain separate: - Local development. - Automated test. - Staging. -
Production.

Use migrations to evolve the database. Back up production data regularly
and test restoration. Configure health checks for API, worker, database
and queue. Monitor database connections, slow queries, job failures,
queue backlog, invoice generation counts and email delivery failures.

### 15.3 Suggested environment variables

``` dotenv
NODE_ENV=development
PORT=4000
DATABASE_URL=
REDIS_URL=
APP_BASE_URL=http://localhost:3000
SESSION_SECRET=
EMAIL_HOST=
EMAIL_PORT=
EMAIL_USER=
EMAIL_PASSWORD=
EMAIL_FROM=
```

Do not commit actual credentials. Use separate secrets for each
environment. If using a managed email service or different
authentication approach, adjust these variables accordingly.

------------------------------------------------------------------------

## 16. Implementation roadmap

### Phase 1 --- Foundation

-   Initialize frontend, API and worker projects.
-   Configure PostgreSQL, migrations and environment variables.
-   Implement users, roles, login, registration and password reset.
-   Add authorization middleware and audit logging.

**Exit criteria:** Admin, staff and customer access boundaries are
enforced by the backend.

### Phase 2 --- Catalogue and customers

-   Customer CRUD and account linking.
-   Product CRUD and variants.
-   Plans, billing intervals, availability and plan policies.
-   Tax and discount configuration.

**Exit criteria:** Admin can configure the catalogue and rules.

### Phase 3 --- Quotations and subscriptions

-   Quotation templates.
-   Quotation creation and validity.
-   Subscription creation and unique numbering.
-   State transitions, pause/renew/close policy.

**Exit criteria:** A quotation can be accepted and produce one correctly
configured subscription.

### Phase 4 --- Invoicing and recurring billing

-   Invoice and invoice-line model.
-   Tax/discount calculation.
-   Scheduler and durable queue.
-   Idempotent invoice generation.
-   Billing run history and failure handling.

**Exit criteria:** Due subscriptions generate exactly one invoice per
billing period, including retry scenarios.

### Phase 5 --- Payments

-   Payment recording.
-   Invoice allocations and balance calculations.
-   Paid/outstanding/overdue views.
-   Invoice send/print/PDF functionality.

**Exit criteria:** Payments are traceable to invoices and balances
remain consistent.

### Phase 6 --- Portals and reports

-   Customer subscription and invoice portal.
-   Admin/staff dashboards.
-   Filters, pagination and finance summaries.
-   Performance testing with synthetic data.

**Exit criteria:** Users see only authorized records and key pages meet
the agreed performance target.

### Phase 7 --- Hardening and release

-   Security review.
-   End-to-end and concurrency tests.
-   Backups and restore test.
-   Monitoring and alerting.
-   Staging acceptance and production deployment.

------------------------------------------------------------------------

## 17. Acceptance criteria mapped to the brief

  -----------------------------------------------------------------------
  Requirement from project brief      Implementation evidence
  ----------------------------------- -----------------------------------
  Unique email and password policy    Registration validation and DB
                                      unique constraint

  Email password reset                Single-use expiring reset link

  Admin, staff, customer roles        RBAC and ownership tests

  Only admin adds staff               Protected staff creation endpoint

  Products and variants               Product/variant CRUD and price
                                      calculation

  Plan billing intervals and policies Plan configuration and validation

  Quotation templates and validity    Template and quotation workflow

  Subscription number and required    Subscription schema and detail view
  fields                              

  Required subscription statuses      Validated state machine

  Automatic invoice generation        Scheduled, idempotent billing
                                      worker

  Tax rules                           Configurable tax engine

  Confirm/cancel/send/print invoices  Invoice actions and PDF/email
                                      output

  Discounts and eligibility limits    Discount engine and usage tracking

  Payment records against invoices    Payment and allocation records

  Paid and outstanding visibility     Invoice balance and status views

  Finance summary and filters         Dashboard/report endpoints

  Under-two-second pages at scale     Load test and query optimization
                                      evidence
  -----------------------------------------------------------------------

------------------------------------------------------------------------

## 18. Key risks and mitigations

  -----------------------------------------------------------------------
  Risk                                Mitigation
  ----------------------------------- -----------------------------------
  Duplicate invoices from retries or  Unique billing-period key,
  concurrent workers                  transactions, idempotency

  Missed invoices after downtime      Catch-up billing scan and persisted
                                      billing periods

  Incorrect monthly billing dates     Explicit month-end recurrence
                                      policy and tests

  Plan price changes alter existing   Snapshot contract price and billing
  subscriptions                       interval

  Discount overuse under concurrency  Transactional usage
                                      reservation/locking

  Customer sees another customer's    Server-side ownership authorization
  records                             and tests

  Payment and invoice balance         Transactional allocations and
  mismatch                            reconciliation checks

  Slow dashboard/list pages           Indexes, pagination, aggregate
                                      queries and load tests

  Worker/email outage                 Durable queue, retries, failure
                                      monitoring

  Ambiguous pause/renewal/tax rules   Written domain decisions before
                                      implementation
  -----------------------------------------------------------------------

------------------------------------------------------------------------

## 19. Recommended first development milestone

Build a vertical slice before implementing every screen:

1.  Admin logs in.
2.  Admin creates one product and one monthly plan.
3.  Staff creates one customer quotation.
4.  Quotation is accepted and creates one active subscription.
5.  A test billing run generates an invoice.
6.  Staff records a payment against that invoice.
7.  Dashboard displays the subscription and payment.

This proves the most important end-to-end business flow early. Then
expand to variants, multiple billing intervals, discounts, taxes,
pause/renewal, overdue handling, and scale testing.

------------------------------------------------------------------------

## 20. Final architecture recommendation

Start with a **TypeScript modular monolith, PostgreSQL, a durable
background-job queue, and a feature-based Next.js frontend**.

The most important architectural principle is to make PostgreSQL the
source of truth and make billing operations transactional, idempotent,
auditable, and retryable. The subscription record defines the ongoing
agreement; each billing period produces a separate invoice; payments are
recorded and allocated against invoices.

The PDF is a requirements brief rather than a technical specification.
This document preserves its stated workflows and marks additional
technical choices and unresolved business policies as recommendations or
decisions to confirm.
