# Subscription Management System --- Implementation Plan

**Project:** Brightloop Software Subscription Management System\
**Document type:** Detailed implementation plan\
**Version:** 1.0\
**Source basis:** `Subscription_Management_System.pdf` and the
accompanying technical architecture document.

------------------------------------------------------------------------

## 1. Purpose

This plan turns the Subscription Management System requirements into an
ordered, actionable development programme. It defines workstreams,
implementation tasks, dependencies, deliverables, testing gates, and
completion criteria.

The project brief requires a platform for managing products, plans,
customers, quotations, subscriptions, recurring invoices, taxes,
discounts, payment records, and finance reporting. It also requires
role-based access and page responses under two seconds with thousands of
subscriptions.

This plan uses the recommended stack from the architecture:

-   Frontend: Next.js, TypeScript, Tailwind CSS.
-   Backend: Node.js, TypeScript, Express.
-   Database: PostgreSQL.
-   Background processing: Redis and BullMQ (or an equivalent durable
    job system).
-   ORM: Drizzle ORM or Prisma.
-   Deployment: Docker, HTTPS reverse proxy, and separate
    development/staging/production environments.

These are implementation recommendations, not technology requirements
stated in the original PDF.

------------------------------------------------------------------------

## 2. Delivery approach

### 2.1 Build a vertical slice first

Do not build every screen independently and leave integration until the
end. Build one complete business path early:

1.  Admin creates a product and monthly plan.
2.  Staff creates a customer and quotation.
3.  Quotation is accepted.
4.  A subscription is created and activated.
5.  A billing run generates an invoice.
6.  Staff records a payment against the invoice.
7.  Dashboard reflects the updated subscription and payment.

This proves that the main domain model, permissions, API, database, and
billing workflow work together.

### 2.2 Suggested project stages

  -----------------------------------------------------------------------
  Stage                   Focus                   Main outcome
  ----------------------- ----------------------- -----------------------
  0                       Requirements and        Decisions, repo,
                          project setup           environments and
                                                  backlog

  1                       Foundation and          Secure application with
                          authentication          roles

  2                       Customers and catalogue Customers, products,
                                                  variants and plans

  3                       Quotations and          Accepted quotation
                          subscriptions           creates a subscription

  4                       Taxes, discounts and    Correct invoice
                          invoices                calculations and
                                                  lifecycle

  5                       Recurring billing       Reliable automatic
                          engine                  invoice generation

  6                       Payment recording       Payment allocation and
                                                  balances

  7                       Dashboards and customer Useful role-specific
                          portal                  interfaces

  8                       Hardening and release   Security, performance
                                                  and deployment
                                                  readiness
  -----------------------------------------------------------------------

The order deliberately implements the core billing path before investing
heavily in dashboard polish.

------------------------------------------------------------------------

## 3. Stage 0 --- Requirements confirmation and project setup

**Goal:** Remove important ambiguity and create a working development
foundation.

### Tasks

#### 3.1 Confirm business rules

Create a short decision log and obtain answers for:

-   Whether partial payments are allowed.
-   Whether subscriptions renew automatically or only after an explicit
    action.
-   Whether pausing a subscription extends its expiry date.
-   What happens to billing dates after a pause or resume.
-   What happens when a billing run was missed because the system was
    offline.
-   Monthly billing behaviour for subscriptions starting on the 29th,
    30th, or 31st.
-   Whether tax is inclusive or exclusive and which tax jurisdiction
    rules apply.
-   How discount usage is counted and whether cancellation restores a
    use.
-   Whether subscription changes during a billing period are prorated.
-   Which staff actions are allowed.
-   Whether customer registration automatically creates a customer
    profile or must be linked by staff.
-   Whether invoice email delivery is required for the first release.

The original PDF does not answer all these questions. Do not invent
production rules silently.

#### 3.2 Create repository and application skeleton

Suggested monorepo:

``` text
subscription-management/
  apps/
    web/
    api/
    worker/
  packages/
    shared/
  infrastructure/
  docs/
  docker-compose.yml
  README.md
```

Tasks: - Initialize Git repository and branch strategy. - Create Next.js
frontend. - Create Express API using TypeScript. - Create background
worker application. - Add linting, formatting and type checking. - Add
environment variable validation. - Add a shared package for types and
validation schemas. - Add API health endpoint and frontend health
check. - Add Docker Compose for local PostgreSQL and Redis.

#### 3.3 Database foundation

Tasks: - Create PostgreSQL database. - Select Drizzle ORM or Prisma. -
Configure migration workflow. - Add migration scripts. - Add seed script
structure. - Add transaction helper and database connection pooling. -
Add request ID and structured logging.

### Deliverables

-   Running frontend, API and worker skeleton.
-   PostgreSQL and Redis available locally.
-   Database migrations can run from a clean database.
-   Initial README with setup instructions.
-   Requirements decision log.

### Exit criteria

A developer can clone the repository, configure local environment
variables, start the services, run migrations, and access the frontend
and API health endpoint.

------------------------------------------------------------------------

## 4. Stage 1 --- Authentication, users and authorization

**Goal:** Implement the three user types and enforce their access
boundaries.

### 4.1 Database tasks

Create: - `users` - `roles` - `permissions` - `user_roles` -
`role_permissions` - `password_reset_tokens` - `customers` -
`staff_profiles`

Add: - Unique normalized email constraint. - Foreign keys and
appropriate indexes. - User status fields. - Created/updated timestamps.

### 4.2 Backend tasks

Implement: - Customer registration. - Login and logout. - Current-user
endpoint. - Password hashing using Argon2id or bcrypt. - Password policy
validation: more than eight characters, uppercase, lowercase, and
special character. - Forgot-password request. - Reset-password endpoint
with a single-use, expiring token. - Admin-only staff creation. - Role
and permission middleware. - Customer ownership authorization. - Rate
limiting for login and password-reset routes.

Do not rely on frontend route hiding as an authorization mechanism.

### 4.3 Frontend tasks

Build: - Registration page. - Login page. - Forgot-password page. -
Reset-password page. - Protected route handling. - Role-aware
navigation. - Basic admin, staff and customer layouts.

### 4.4 Tests

-   Duplicate email registration is rejected.
-   Invalid password is rejected.
-   Password is never stored in plain text.
-   Reset token expires and cannot be reused.
-   Staff cannot create another staff account.
-   Customer cannot access another customer's records.
-   Unauthenticated users cannot access protected pages or APIs.

### Deliverables

-   Authentication flow.
-   Role-based access control.
-   Admin-created staff accounts.
-   Customer account-to-profile linking.
-   Authentication and authorization tests.

### Exit criteria

All three roles can sign in, and backend authorization tests prove that
each role can access only permitted resources.

------------------------------------------------------------------------

## 5. Stage 2 --- Customer management and product catalogue

**Goal:** Allow the business to manage customers, products, variants,
plans and plan pricing.

### 5.1 Customer management

Database: - `customers`

Backend: - Create customer. - List/search customers. - View customer
detail. - Update customer. - Link customer profile to a portal user. -
List subscriptions and invoices for a customer.

Frontend: - Customer list with pagination and search. - Create/edit
customer form. - Customer detail page. - Customer subscription and
invoice tabs.

### 5.2 Product management

Database: - `products` - `product_variants`

Backend: - Create, read, update and deactivate products. -
Add/update/deactivate variants. - Validate sales price and cost price. -
Calculate final price from base price plus variant adjustment.

Frontend: - Product list. - Product create/edit form. - Variant
editor. - Product detail view.

Example test: - Base price = ₹2,000. - Odoo variant adjustment = ₹560. -
Expected final price = ₹2,560.

### 5.3 Plan management

Database: - `plans` - `plan_prices`

Backend: - Create and update plans. - Configure daily, weekly, monthly
and yearly intervals. - Configure minimum quantity. - Configure
availability start/end dates. - Configure auto-close, early-close, pause
and renewal options. - Preserve historical plan prices. - Validate
interval and date ranges.

Frontend: - Plan list. - Plan create/edit form. - Billing interval
selector. - Plan availability and policy controls. - Plan detail view.

### Tests

-   Product price and variant price calculations.
-   Invalid price and date ranges rejected.
-   All four billing intervals accepted.
-   Minimum quantity enforced.
-   Inactive/unavailable plans cannot be used for new quotations.
-   Existing subscriptions retain their agreed price after catalogue
    price changes.

### Deliverables

Customer, product, variant and plan management modules.

### Exit criteria

An admin can configure a product with variants and a plan with a billing
interval, and staff can select those records when preparing a quotation.

------------------------------------------------------------------------

## 6. Stage 3 --- Quotation templates, quotations and subscriptions

**Goal:** Implement the sales workflow and subscription lifecycle.

### 6.1 Quotation templates

Database: - `quotation_templates` - `quotation_template_items`

Backend: - Create/update/list templates. - Add product and plan lines. -
Configure validity days. - Copy template items into a quotation as
snapshots.

Frontend: - Template list. - Template editor. - Template item selector.

### 6.2 Quotations

Database: - `quotations` - `quotation_items`

Backend: - Create quotation for a customer. - Create quotation from a
template. - Calculate line totals and quotation total. - Set issue and
validity dates. - Send quotation if email delivery is included. -
Accept, reject or expire quotation according to agreed rules.

Frontend: - Quotation list and filters. - Quotation builder. - Quotation
detail. - Preview/print view. - Accept/confirm action where authorized.

### 6.3 Subscriptions

Database: - `subscriptions` - `subscription_items`

Backend: - Generate unique subscription number. - Create subscription
from accepted quotation. - Copy customer, plan, dates, payment terms and
line snapshots. - Implement allowed state transitions. - Implement
close, pause, resume and renewal policies. - Store next billing date and
billing period information. - Prevent duplicate subscription creation
from repeated quotation acceptance.

Frontend: - Subscription list and filters. - Subscription detail. -
Status timeline. - Pause/resume/renew/close actions based on
permissions. - Subscription line-item view.

### 6.4 Required lifecycle

Implement the required sequence:

``` text
Draft → Quotation → Confirmed → Active → Closed
```

Pause and renewal behaviour must follow the decisions confirmed in Stage
0. Do not add unapproved transitions.

### Tests

-   Quotation template copies the correct lines.
-   Quotation validity is calculated correctly.
-   Accepted quotation creates exactly one subscription.
-   Subscription receives correct customer, plan, dates and line items.
-   Invalid status transitions are rejected.
-   Catalogue price changes do not change an existing subscription.
-   Only authorized users can change subscription state.

### Deliverables

Working quotation-to-subscription workflow.

### Exit criteria

A staff member can prepare a quotation, and accepting it creates one
correctly configured subscription with the required status and fields.

------------------------------------------------------------------------

## 7. Stage 4 --- Tax, discounts and invoice management

**Goal:** Calculate invoice totals accurately and implement the invoice
lifecycle.

### 7.1 Tax rules

Database: - `tax_rules`

Backend: - Admin-only tax rule CRUD. - Rule activation and effective
dates. - Tax calculation service. - Tax snapshots on invoice lines.

Frontend: - Tax rule list. - Tax rule create/edit form. - Tax summary in
quotation and invoice previews.

Confirm inclusive/exclusive tax and jurisdiction rules before production
use.

### 7.2 Discounts

Database: - `discounts` - `discount_products` - `discount_usages`

Backend: - Admin-only discount creation and updates. - Fixed and
percentage discount calculations. - Minimum purchase validation. -
Minimum quantity validation. - Start/end date validation. - Maximum
usage validation. - Product-specific or subscription-wide eligibility. -
Transactional usage reservation.

Frontend: - Discount list. - Discount create/edit form. - Eligible
product selector. - Usage and validity display.

### 7.3 Invoices

Database: - `invoices` - `invoice_items`

Backend: - Create invoice from subscription billing period. - Calculate
subtotal, discount, tax and grand total. - Confirm invoice. - Cancel
invoice according to allowed rules. - Generate printable PDF. - Send
invoice email if included. - Track sent time and delivery result
separately from invoice status.

Frontend: - Invoice list and filters. - Invoice detail. - Invoice
preview. - Confirm/cancel/send/print actions. - Tax, discount and total
breakdown.

### 7.4 Invoice lifecycle

Required statuses:

``` text
Draft → Confirmed → Paid
```

Cancellation is an available action from the brief. Define exactly which
states may be cancelled and how financial corrections are represented.

### Tests

-   Fixed discount calculation.
-   Percentage discount calculation.
-   Minimum amount and quantity rules.
-   Discount start/end date handling.
-   Maximum usage under concurrent attempts.
-   Tax calculation and rounding.
-   Invoice totals match the sum of lines.
-   Cancelled or failed invoice creation does not leave incorrect
    discount usage.
-   Invoice confirmation and cancellation follow valid state rules.

### Deliverables

Tax, discount and invoice modules.

### Exit criteria

A user can create an invoice with correct product lines, applicable
discount, configured tax, and a consistent total. Invoice actions
enforce the defined lifecycle.

------------------------------------------------------------------------

## 8. Stage 5 --- Recurring billing engine

**Goal:** Generate invoices automatically for due subscriptions without
duplicates or omissions.

This is the highest-risk and most important backend workstream.

### 8.1 Database and queue tasks

Create: - `billing_runs` - `billing_run_items`

Add a unique billing-period key, preferably on the invoice or
billing-run item, for:

``` text
(subscription_id, billing_period_start, billing_period_end)
```

Configure: - Redis. - BullMQ queues. - Worker process. - Retry policy. -
Failed-job handling. - Queue monitoring.

### 8.2 Billing scan

Implement a scheduled task that: 1. Finds active subscriptions with a
due `next_billing_at`. 2. Claims due subscriptions safely in batches. 3.
Creates a billing-run record. 4. Enqueues one invoice-generation job per
eligible subscription/billing period. 5. Records scan and job outcomes.

Use safe concurrency controls such as database row locks with
`SKIP LOCKED`, or an equivalent atomic claim mechanism.

### 8.3 Invoice generation worker

For each job: 1. Load and lock the subscription. 2. Confirm it is active
and due. 3. Determine the billing period. 4. Check that the period has
not already been invoiced. 5. Load stored subscription item snapshots.
6. Calculate subtotal. 7. Apply eligible discount. 8. Calculate
configured taxes. 9. Create invoice and invoice lines transactionally.
10. Record billing-run result. 11. Advance next billing date. 12. Commit
transaction. 13. Enqueue invoice email after commit if enabled.

### 8.4 Date handling

Implement and test: - Daily recurrence. - Weekly recurrence. - Monthly
recurrence. - Yearly recurrence. - Month-end dates. - Leap-year dates. -
Timezone and daylight-saving behaviour where applicable. - Paused and
closed subscriptions. - Expired plans and subscriptions. - Catch-up
billing after downtime.

A missed billing period must be detected. The business must decide
whether to generate one invoice per missed period or consolidate missed
periods.

### 8.5 Reliability and idempotency

-   Retrying a job must not create another invoice for the same period.
-   Concurrent workers must not invoice the same subscription period
    twice.
-   A worker restart must not lose billing work.
-   A failed email must not undo a successfully created invoice.
-   A failed invoice transaction must not advance the subscription
    billing date.
-   Discount usage and invoice creation must commit or roll back
    together.

### Tests

-   Due subscription generates an invoice.
-   Future subscription does not generate an invoice.
-   Paused/closed subscription is not billed.
-   Same job executed twice creates one invoice.
-   Two workers racing for the same subscription period create one
    invoice.
-   Worker restart does not lose pending work.
-   Failed transaction does not advance next billing date.
-   Catch-up policy handles missed billing dates.

### Deliverables

-   Durable recurring billing scheduler.
-   Invoice-generation worker.
-   Billing-run history.
-   Retry and failure handling.
-   Billing monitoring.

### Exit criteria

The system reliably creates exactly one invoice per eligible
subscription billing period, including retry and concurrency tests.

------------------------------------------------------------------------

## 9. Stage 6 --- Payment recording and outstanding balances

**Goal:** Record payments and make invoice balances accurate.

### 9.1 Database

Create: - `payments` - `payment_allocations`

Use allocation records if one payment may settle multiple invoices or
one invoice may receive multiple payments. If the product owner chooses
one-to-one payments, simplify the model accordingly.

### 9.2 Backend tasks

Implement: - Record payment method, amount, date and note. - Associate
payment with customer and invoice. - Allocate payment to invoice. -
Validate currency and amount. - Recalculate amount paid and balance due
transactionally. - Mark invoice Paid when fully settled. - Calculate
outstanding balance. - Identify overdue invoices. - Prevent duplicate
payment submissions using idempotency keys or unique payment references.

### 9.3 Frontend tasks

Build: - Record payment form. - Payment history. - Invoice payment
history. - Outstanding invoice list. - Overdue invoice list. - Payment
detail view.

### Tests

-   Correct payment updates invoice balance.
-   Full payment marks invoice Paid.
-   Partial payment behaviour matches the agreed policy.
-   Invalid or excessive payment is rejected or handled by the agreed
    credit policy.
-   Duplicate payment request is not applied twice.
-   Payment allocation cannot exceed permitted limits.
-   Overdue status is calculated from due date and remaining balance.

### Deliverables

Payment records, invoice allocations, paid/outstanding/overdue views.

### Exit criteria

Staff can record a payment against the correct invoice, and the invoice
balance and status update consistently.

------------------------------------------------------------------------

## 10. Stage 7 --- Dashboards, reports and customer portal

**Goal:** Provide useful views for finance staff, administrators and
customers.

### 10.1 Admin/finance dashboard

Implement: - Active subscription count. - Revenue received for selected
date range. - Outstanding amount. - Overdue invoice count. - Filters and
summary view. - Links from summary metrics to detailed records.

Define all metric formulas centrally. In particular, calculate revenue
received from recorded payment allocations, not simply from invoice
totals.

### 10.2 Staff workspace

Implement: - Customer search. - Quotation pipeline. - Subscription list
and status filters. - Invoice list and status filters. - Payment
recording. - Overdue follow-up list.

### 10.3 Customer portal

Implement: - Customer profile. - Own subscriptions. - Subscription
details and status. - Own invoices. - Invoice PDF download. - Payment
history if included.

Customer ownership must be derived from the authenticated account, not
from an arbitrary customer ID supplied by the browser.

### 10.4 Reporting API

Implement: - Finance summary endpoint. - Active subscriptions report. -
Revenue/payment report. - Outstanding invoice report. - Overdue invoice
report. - Server-side filters, sorting and pagination.

### Tests

-   Dashboard totals match database fixtures.
-   Date filters return correct records.
-   Customer portal cannot access another customer's data.
-   Staff see only records/actions permitted by their permissions.
-   Empty and large result sets paginate correctly.

### Deliverables

Role-specific dashboards, customer portal and finance reports.

### Exit criteria

Finance users can answer the questions in the brief from the dashboard,
and customers can view only their own subscriptions and invoices.

------------------------------------------------------------------------

## 11. Stage 8 --- Performance, security and release

**Goal:** Validate the complete system against the brief and prepare it
for deployment.

### 11.1 Performance work

-   Add indexes based on actual query plans.
-   Paginate large lists.
-   Use server-side filters and sorting.
-   Optimize dashboard aggregation queries.
-   Eliminate N+1 database access.
-   Add caching only where measurements justify it.
-   Load-test with thousands of subscriptions and associated invoices.

Measure: - Dashboard summary. - Subscription list. - Invoice list. -
Customer detail. - Billing scan and invoice-generation throughput.

Target from the PDF: pages respond in under two seconds. Agree on
hardware, concurrency and percentile (for example, p95) for a repeatable
test.

### 11.2 Security work

-   Review every route's authentication and authorization.
-   Test customer record ownership.
-   Check password reset token expiry and single-use behaviour.
-   Rate-limit authentication endpoints.
-   Check CSRF protection if cookie-based sessions are used.
-   Validate request schemas.
-   Check for SQL injection and unsafe query construction.
-   Ensure secrets are not committed or logged.
-   Review staff creation restrictions.
-   Audit sensitive changes.
-   Check dependency vulnerabilities.

### 11.3 Production readiness

-   Configure staging and production environments.
-   Configure HTTPS and secure cookies.
-   Configure database backups.
-   Perform a database restore test.
-   Configure worker health checks.
-   Configure queue and job monitoring.
-   Configure structured application logs.
-   Configure error reporting and alerting.
-   Run migrations in a controlled release process.
-   Document rollback and incident procedures.

### Deliverables

-   Performance test report.
-   Security test report.
-   Deployment configuration.
-   Backup and restore procedure.
-   Production runbook.

### Exit criteria

All required workflows pass acceptance tests, the performance target is
demonstrated under agreed load, and operational recovery procedures are
documented.

------------------------------------------------------------------------

## 12. Suggested sprint plan

The following is an illustrative schedule for a small team. It is not a
deadline from the project brief. Actual duration depends on team size,
experience, design readiness, and integrations.

  -----------------------------------------------------------------------
  Sprint                  Focus                   Demonstrable result
  ----------------------- ----------------------- -----------------------
  Sprint 0                Requirements, repo,     Application skeleton
                          environments, DB setup  runs

  Sprint 1                Authentication, roles,  Users can log in with
                          customer profiles       enforced access

  Sprint 2                Customers, products,    Admin manages catalogue
                          variants                and customers

  Sprint 3                Plans, prices,          Staff can prepare
                          quotation templates     reusable offers

  Sprint 4                Quotations and          Accepted quotation
                          subscriptions           creates subscription

  Sprint 5                Tax, discounts, invoice Invoice calculation
                          model                   works

  Sprint 6                Recurring billing       Due subscription
                          engine                  creates invoice safely

  Sprint 7                Payments and invoice    Payment updates invoice
                          balances                status

  Sprint 8                Dashboards and customer Finance and customers
                          portal                  have useful views

  Sprint 9                Performance, security,  Release candidate
                          deployment              passes acceptance
  -----------------------------------------------------------------------

For a solo developer, this may take longer. Prioritize a working
vertical slice over attempting to finish one entire layer (all frontend
or all backend) before integrating the others.

------------------------------------------------------------------------

## 13. Prioritized backlog

### P0 --- Must work for the core project

-   [ ] Authentication and unique email.
-   [ ] Password policy and reset link.
-   [ ] Admin, staff and customer access.
-   [ ] Admin-only staff creation.
-   [ ] Customer management.
-   [ ] Product and variant management.
-   [ ] Plan and billing interval management.
-   [ ] Quotation templates and validity.
-   [ ] Quotation-to-subscription workflow.
-   [ ] Required subscription lifecycle.
-   [ ] Automatic invoice generation.
-   [ ] Tax rules and calculation.
-   [ ] Invoice confirm/cancel/send/print actions.
-   [ ] Discount rules and automatic application.
-   [ ] Payment recording against invoices.
-   [ ] Paid/outstanding/overdue visibility.
-   [ ] Finance summary and filters.
-   [ ] Under-two-second page performance target tested with thousands
    of subscriptions.

### P1 --- Important implementation quality

-   [ ] Audit log for sensitive operations.
-   [ ] Durable job retries and failed-job review.
-   [ ] Billing-run history.
-   [ ] Idempotency for invoice and payment operations.
-   [ ] Pagination and server-side filtering.
-   [ ] Customer portal ownership tests.
-   [ ] Database backup and restore test.
-   [ ] Load and concurrency testing.

### P2 --- Optional extensions (not explicitly required by the PDF)

-   [ ] Payment gateway integration.
-   [ ] Automatic payment collection.
-   [ ] Bank statement reconciliation.
-   [ ] SMS/WhatsApp reminders.
-   [ ] Accounting software integration.
-   [ ] Advanced MRR/ARR and revenue recognition reports.
-   [ ] Subscription proration.
-   [ ] Coupons or referral campaigns.
-   [ ] Multi-currency support.

Do not let optional extensions delay the P0 requirements.

------------------------------------------------------------------------

## 14. Definition of done

A feature is complete only when:

1.  Database migration is committed.
2.  Backend validation and authorization are implemented.
3.  Business logic is in a service/domain layer, not only in a
    controller.
4.  Frontend states include loading, success, empty and error handling.
5.  Unit tests cover important calculations and transitions.
6.  Integration tests cover database and permission behaviour.
7.  Audit events exist for sensitive operations where applicable.
8.  API and UI behaviour is documented.
9.  No secrets or sensitive values are exposed.
10. The feature works in the integrated application.

A workflow is not complete merely because its screen exists.

------------------------------------------------------------------------

## 15. End-to-end release acceptance checklist

Use this checklist for the final project demonstration.

### Authentication and roles

-   [ ] Customer can register with a unique email.
-   [ ] Password rules are enforced.
-   [ ] Password reset email/link works.
-   [ ] Admin can create staff.
-   [ ] Staff cannot create staff.
-   [ ] Customer sees only their own records.

### Catalogue and plans

-   [ ] Admin can create a product with sales price and cost price.
-   [ ] Admin can create variants and price adjustments.
-   [ ] Admin can create daily, weekly, monthly and yearly plans.
-   [ ] Plan minimum quantity and availability are enforced.
-   [ ] Plan closure, pause and renewal settings are respected.

### Quotations and subscriptions

-   [ ] Staff can create and reuse a quotation template.
-   [ ] Quotation has a validity period.
-   [ ] Accepted quotation creates one subscription.
-   [ ] Subscription has a unique number and required fields.
-   [ ] Required subscription lifecycle is visible and enforced.

### Billing, tax and discounts

-   [ ] Due subscription generates an invoice automatically.
-   [ ] Duplicate billing run does not duplicate invoice.
-   [ ] No eligible due period is silently skipped.
-   [ ] Tax rules calculate invoice tax.
-   [ ] Fixed and percentage discounts work.
-   [ ] Discount minimums, dates and usage limits work.
-   [ ] Invoice can be confirmed, cancelled, sent and printed.

### Payments and reporting

-   [ ] Payment includes method, amount, date and note.
-   [ ] Payment is associated with the correct invoice.
-   [ ] Paid and outstanding invoices are visible.
-   [ ] Overdue invoices are identifiable.
-   [ ] Dashboard shows active subscriptions, received revenue,
    outstanding amount and overdue invoices.
-   [ ] Dashboard filters work.
-   [ ] Page performance target is measured with thousands of
    subscriptions.

------------------------------------------------------------------------

## 16. Immediate next actions

Start with these tasks rather than implementing the entire application
at once:

1.  Confirm unresolved business rules in Stage 0.
2.  Create the monorepo and local Docker Compose environment.
3.  Design and migrate the identity, customer, product, plan, quotation,
    subscription, invoice and payment tables.
4.  Implement authentication and role authorization.
5.  Build the first vertical slice: product → plan → customer →
    quotation → subscription → invoice → payment.
6.  Add the recurring billing worker and prove idempotency before adding
    large amounts of UI polish.

**The first major milestone is not a beautiful dashboard. It is a
correct, testable end-to-end subscription billing workflow.**
