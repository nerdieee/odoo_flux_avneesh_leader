import { db } from './db';

interface BillingRunResult {
  runDate: string;
  subscriptionsChecked: number;
  invoicesGenerated: number;
  invoicesSkipped: number;
  details: string[];
}

// Utility to calculate date offsets
export function addBillingPeriod(dateStr: string, frequency: string): string {
  const d = new Date(dateStr);
  if (frequency === 'daily') {
    d.setDate(d.getDate() + 1);
  } else if (frequency === 'weekly') {
    d.setDate(d.getDate() + 7);
  } else if (frequency === 'monthly') {
    d.setMonth(d.getMonth() + 1);
  } else if (frequency === 'yearly') {
    d.setFullYear(d.getFullYear() + 1);
  } else {
    d.setMonth(d.getMonth() + 1); // default monthly
  }
  return d.toISOString().split('T')[0];
}

export function addPaymentTermDays(dateStr: string, terms: string): string {
  const d = new Date(dateStr);
  if (terms === 'Net 15') {
    d.setDate(d.getDate() + 15);
  } else if (terms === 'Net 30') {
    d.setDate(d.getDate() + 30);
  } else if (terms === 'Net 45') {
    d.setDate(d.getDate() + 45);
  } else {
    // Due on receipt / default
    d.setDate(d.getDate() + 3);
  }
  return d.toISOString().split('T')[0];
}

export function runRecurringBilling(targetDateStr?: string): BillingRunResult {
  const runDate = targetDateStr || new Date().toISOString().split('T')[0];
  const details: string[] = [];
  let generatedCount = 0;
  let skippedCount = 0;

  console.log(`[Billing Engine] Running recurring billing for date: ${runDate}`);

  // 1. Fetch all active subscriptions
  const activeSubs = db.query(`
    SELECT s.*, p.billing_frequency, p.name as plan_name, p.status as plan_status, p.end_date as plan_end_date,
           c.name as customer_name, c.email as customer_email
    FROM subscriptions s
    JOIN plans p ON s.plan_id = p.id
    JOIN customers c ON s.customer_id = c.id
    WHERE s.status = 'active' AND s.next_billing_date <= ?
  `).all(runDate) as any[];

  console.log(`[Billing Engine] Found ${activeSubs.length} subscriptions eligible for billing`);

  for (const sub of activeSubs) {
    // Check if subscription or plan has reached end date and should be closed
    const hasSubExpired = sub.expiry_date && sub.expiry_date <= runDate && sub.auto_renew === 0;
    const hasPlanClosed = sub.plan_status === 'closed' || (sub.plan_end_date && sub.plan_end_date <= runDate);

    if (hasSubExpired || hasPlanClosed) {
      db.run(
        `UPDATE subscriptions SET status = 'closed', closed_at = ? WHERE id = ?`,
        [runDate, sub.id]
      );
      details.push(`Subscription ${sub.subscription_number} (${sub.customer_name}) auto-closed as plan/term ended`);
      continue;
    }

    const cycleStart = sub.next_billing_date;
    const cycleEnd = addBillingPeriod(cycleStart, sub.billing_frequency);

    // IDEMPOTENCY CHECK: Ensure no invoice exists for this subscription and cycle start
    const existingInvoice = db.query(
      `SELECT id, invoice_number FROM invoices WHERE subscription_id = ? AND billing_cycle_start = ?`
    ).get(sub.id, cycleStart) as any;

    if (existingInvoice) {
      skippedCount++;
      details.push(`Skipped ${sub.subscription_number}: invoice ${existingInvoice.invoice_number} already exists for cycle ${cycleStart}`);
      // Advance next_billing_date if somehow it wasn't advanced
      db.run(`UPDATE subscriptions SET next_billing_date = ? WHERE id = ?`, [cycleEnd, sub.id]);
      continue;
    }

    // Fetch subscription items
    const items = db.query(`
      SELECT si.*, p.name as product_name, pv.variant_name
      FROM subscription_items si
      JOIN products p ON si.product_id = p.id
      LEFT JOIN product_variants pv ON si.variant_id = pv.id
      WHERE si.subscription_id = ?
    `).all(sub.id) as any[];

    if (items.length === 0) {
      skippedCount++;
      details.push(`Skipped ${sub.subscription_number}: no line items attached`);
      continue;
    }

    let subtotal = 0;
    let totalQuantity = 0;
    for (const item of items) {
      subtotal += item.amount;
      totalQuantity += item.quantity;
    }

    // Evaluate Discounts
    let discountAmount = 0;
    let discountCode: string | null = null;
    let activeDiscount: any = null;

    if (sub.discount_id) {
      activeDiscount = db.query(`SELECT * FROM discounts WHERE id = ?`).get(sub.discount_id) as any;
    }

    // Check discount validity
    if (activeDiscount && activeDiscount.status === 'active') {
      const isDateValid = (!activeDiscount.start_date || activeDiscount.start_date <= runDate) &&
                          (!activeDiscount.end_date || activeDiscount.end_date >= runDate);
      const isUsageValid = activeDiscount.max_uses === 0 || activeDiscount.current_uses < activeDiscount.max_uses;
      const isAmountValid = subtotal >= (activeDiscount.min_amount || 0);
      const isQtyValid = totalQuantity >= (activeDiscount.min_quantity || 0);

      if (isDateValid && isUsageValid && isAmountValid && isQtyValid) {
        if (activeDiscount.discount_type === 'percentage') {
          discountAmount = Math.round((subtotal * (activeDiscount.value / 100.0)) * 100) / 100;
        } else {
          discountAmount = Math.min(activeDiscount.value, subtotal);
        }
        discountCode = activeDiscount.code;
      }
    }

    // Evaluate Taxes
    let taxRate = 0;
    if (sub.tax_rule_id) {
      const taxRule = db.query(`SELECT * FROM tax_rules WHERE id = ?`).get(sub.tax_rule_id) as any;
      if (taxRule && taxRule.is_active) {
        taxRate = taxRule.rate;
      }
    } else {
      const defaultTax = db.query(`SELECT * FROM tax_rules WHERE is_default = 1 AND is_active = 1`).get() as any;
      if (defaultTax) {
        taxRate = defaultTax.rate;
      }
    }

    const taxableAmount = Math.max(0, subtotal - discountAmount);
    const taxAmount = Math.round((taxableAmount * (taxRate / 100.0)) * 100) / 100;
    const totalAmount = Math.round((taxableAmount + taxAmount) * 100) / 100;

    // Generate Invoice Number
    const lastInvoice = db.query(`SELECT id FROM invoices ORDER BY id DESC LIMIT 1`).get() as any;
    const nextInvoiceId = (lastInvoice?.id || 0) + 1;
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(nextInvoiceId).padStart(4, '0')}`;
    const dueDate = addPaymentTermDays(runDate, sub.payment_terms || 'Net 15');

    // Insert Invoice inside transaction
    const insertInvoice = db.transaction(() => {
      const res = db.run(`
        INSERT INTO invoices (
          invoice_number, subscription_id, customer_id, issue_date, due_date,
          billing_cycle_start, billing_cycle_end, subtotal, discount_amount, discount_code,
          tax_rate, tax_amount, total_amount, amount_paid, status, sent_at, notes, created_at
        ) VALUES (
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, 0.0, 'confirmed', ?, ?, ?
        )
      `, [
        invoiceNumber, sub.id, sub.customer_id, runDate, dueDate,
        cycleStart, cycleEnd, subtotal, discountAmount, discountCode,
        taxRate, taxAmount, totalAmount, runDate,
        `Automated recurring invoice for cycle ${cycleStart} to ${cycleEnd}`, runDate
      ]);

      const invoiceId = res.lastInsertRowid;

      // Insert line items
      for (const item of items) {
        const itemTax = Math.round((item.amount * (taxRate / 100.0)) * 100) / 100;
        db.run(`
          INSERT INTO invoice_items (
            invoice_id, product_name, variant_name, quantity, unit_price, tax_rate, tax_amount, amount
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          invoiceId, item.product_name, item.variant_name || null, item.quantity,
          item.unit_price, taxRate, itemTax, item.amount
        ]);
      }

      // Record discount usage if applied
      if (discountAmount > 0 && activeDiscount) {
        db.run(`
          INSERT INTO discount_usages (discount_id, customer_id, subscription_id, invoice_id, amount_discounted, used_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [activeDiscount.id, sub.customer_id, sub.id, invoiceId, discountAmount, runDate]);

        db.run(`
          UPDATE discounts SET current_uses = current_uses + 1 WHERE id = ?
        `, [activeDiscount.id]);
      }

      // Advance subscription next_billing_date to cycleEnd
      db.run(`
        UPDATE subscriptions SET next_billing_date = ? WHERE id = ?
      `, [cycleEnd, sub.id]);

      return invoiceId;
    });

    const newInvoiceId = insertInvoice();
    generatedCount++;
    details.push(`Generated invoice ${invoiceNumber} for ${sub.customer_name} (₹${totalAmount.toLocaleString('en-IN')}) for cycle ${cycleStart} to ${cycleEnd}`);
  }

  // Record scheduler log
  db.run(`
    INSERT INTO scheduler_logs (run_date, subscriptions_checked, invoices_generated, details, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [
    runDate,
    activeSubs.length,
    generatedCount,
    JSON.stringify(details),
    'success',
    new Date().toISOString()
  ]);

  return {
    runDate,
    subscriptionsChecked: activeSubs.length,
    invoicesGenerated: generatedCount,
    invoicesSkipped: skippedCount,
    details
  };
}
