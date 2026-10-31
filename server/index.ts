import express, { Request, Response } from 'express';
import cors from 'cors';
import { db, initDatabase, hashPassword } from './db';
import { runRecurringBilling, addBillingPeriod, addPaymentTermDays } from './billingEngine';
import { rbacRouter, requirePerm } from './rbacRoutes';
import { getEffectivePermissions, recordLoginSession, logAudit } from './rbac';
import * as path from 'path';
import * as crypto from 'crypto';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Initialize SQLite database and seed initial data
initDatabase();

// Mount RBAC and Staff Management routes
app.use('/api', rbacRouter);

// ----------------------------------------------------------------------
// Password validation helper: > 8 chars, uppercase, lowercase, special char
// ----------------------------------------------------------------------
function validatePassword(password: string): { valid: boolean; message?: string } {
  if (!password || password.length <= 8) {
    return { valid: false, message: 'Password must be more than 8 characters long.' };
  }
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  if (!hasUpper || !hasLower || !hasSpecial) {
    return {
      valid: false,
      message: 'Password must contain at least one uppercase letter, one lowercase letter, and one special character.'
    };
  }
  return { valid: true };
}

// ----------------------------------------------------------------------
// 1. AUTHENTICATION & USERS
// ----------------------------------------------------------------------
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const passHash = hashPassword(password);
  const user = db.query(`
    SELECT u.id, u.email, u.name, u.role, u.customer_id, u.created_at,
           u.is_active, u.must_change_password, u.department, u.designation,
           c.company, c.phone, c.gst_number
    FROM users u
    LEFT JOIN customers c ON u.customer_id = c.id
    WHERE u.email = ? AND u.password_hash = ?
  `).get(email.toLowerCase().trim(), passHash) as any;

  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  if (user.is_active === 0) {
    return res.status(403).json({ error: 'Your account has been deactivated. Please contact your system administrator.' });
  }

  // Update last_login_at
  const now = new Date().toISOString();
  db.run(`UPDATE users SET last_login_at = ? WHERE id = ?`, [now, user.id]);

  // Record session
  const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
  const userAgent = req.headers['user-agent'] || 'Web Browser';
  const sessionToken = 'sess_' + crypto.randomBytes(16).toString('hex');
  recordLoginSession(user.id, sessionToken, ip, userAgent);

  // Compute effective permissions
  const permissions = Array.from(getEffectivePermissions(user.id));

  // Get user role information
  const roleInfo = db.query(`
    SELECT r.id, r.name, r.code
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = ?
    LIMIT 1
  `).get(user.id) as any;

  // Log audit
  logAudit(user.id, user.name, 'USER_LOGIN', 'Authentication', `User ${user.email} logged in successfully`, 'User', String(user.id), ip);

  return res.json({
    user: {
      ...user,
      role_id: roleInfo?.id || null,
      role_name: roleInfo?.name || (user.role === 'admin' ? 'Super Admin' : user.role),
      permissions
    }
  });
});

app.post('/api/auth/register', (req: Request, res: Response) => {
  const { email, password, name, company, phone, address, gst_number, invite_token, role } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  // Prevent creation of any admin accounts under all circumstances
  if (role === 'admin' || req.body.isAdmin) {
    return res.status(403).json({ error: 'Creation of administrator accounts is strictly forbidden. Only one system admin exists.' });
  }

  const passCheck = validatePassword(password);
  if (!passCheck.valid) {
    return res.status(400).json({ error: passCheck.message });
  }

  const cleanEmail = email.toLowerCase().trim();
  const existing = db.query('SELECT id FROM users WHERE email = ?').get(cleanEmail);
  if (existing) {
    return res.status(400).json({ error: 'An account with this email already exists.' });
  }

  // Case 1: Staff registration via invite token
  if (invite_token && invite_token.trim()) {
    const token = invite_token.trim();
    const invitation = db.query(`
      SELECT * FROM staff_invitations
      WHERE invite_token = ? AND status = 'pending'
    `).get(token) as any;

    if (!invitation) {
      return res.status(400).json({ error: 'Invalid or already used staff invitation token.' });
    }

    if (new Date(invitation.expires_at) < new Date()) {
      db.run(`UPDATE staff_invitations SET status = 'expired' WHERE id = ?`, [invitation.id]);
      return res.status(400).json({ error: 'This staff invitation has expired. Please contact the administrator.' });
    }

    if (cleanEmail !== invitation.email.toLowerCase().trim()) {
      return res.status(400).json({
        error: `This invitation was issued for ${invitation.email}. Please register using that email address.`
      });
    }

    try {
      const registerStaffTx = db.transaction(() => {
        // Create user with role 'staff'
        const userRes = db.run(`
          INSERT INTO users (email, password_hash, name, role, customer_id, created_at)
          VALUES (?, ?, ?, 'staff', NULL, ?)
        `, [cleanEmail, hashPassword(password), name, new Date().toISOString()]);

        const userId = userRes.lastInsertRowid;

        // Create staff record
        db.run(`
          INSERT INTO staff (user_id, name, email, department, title, phone, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          userId,
          name,
          cleanEmail,
          invitation.department || 'Operations',
          invitation.title || 'Staff Member',
          phone || invitation.phone || '',
          new Date().toISOString()
        ]);

        // Mark invitation as accepted
        db.run(`UPDATE staff_invitations SET status = 'accepted' WHERE id = ?`, [invitation.id]);

        return {
          id: userId,
          email: cleanEmail,
          name,
          role: 'staff',
          customer_id: null
        };
      });

      const user = registerStaffTx();
      return res.json({ user, message: 'Staff account registered successfully from invite.' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  // Case 2: Public registration without invite -> ONLY creates Customer account
  try {
    const registerTx = db.transaction(() => {
      // 1. Create Customer record
      const custRes = db.run(`
        INSERT INTO customers (name, email, phone, company, address, gst_number, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, 'active', ?)
      `, [name, cleanEmail, phone || '', company || '', address || '', gst_number || '', new Date().toISOString()]);

      const customerId = custRes.lastInsertRowid;

      // 2. Create User account with role 'customer' strictly
      const userRes = db.run(`
        INSERT INTO users (email, password_hash, name, role, customer_id, created_at)
        VALUES (?, ?, ?, 'customer', ?, ?)
      `, [cleanEmail, hashPassword(password), name, customerId, new Date().toISOString()]);

      return {
        id: userRes.lastInsertRowid,
        email: cleanEmail,
        name,
        role: 'customer',
        customer_id: customerId
      };
    });

    const user = registerTx();
    return res.json({ user, message: 'Customer account registered successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/request-password-reset', (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const cleanEmail = email.toLowerCase().trim();
  const user = db.query('SELECT id, name FROM users WHERE email = ?').get(cleanEmail) as any;
  if (!user) {
    // For security, still return success message
    return res.json({ message: 'If this email is registered, a password reset link has been sent.' });
  }

  const token = `rst_${Math.random().toString(36).substring(2)}${Date.now().toString(36)}`;
  const expiresAt = new Date(Date.now() + 3600000).toISOString(); // 1 hour expiry

  db.run(`
    INSERT INTO password_resets (email, token, expires_at, used, created_at)
    VALUES (?, ?, ?, 0, ?)
  `, [cleanEmail, token, expiresAt, new Date().toISOString()]);

  const resetLink = `http://localhost:3000/#reset-password?token=${token}&email=${encodeURIComponent(cleanEmail)}`;

  return res.json({
    message: `Password reset link sent to ${cleanEmail}.`,
    resetLink,
    token
  });
});

app.post('/api/auth/reset-password', (req: Request, res: Response) => {
  const { email, token, newPassword } = req.body;
  if (!email || !token || !newPassword) {
    return res.status(400).json({ error: 'Email, token, and new password are required' });
  }

  const passCheck = validatePassword(newPassword);
  if (!passCheck.valid) {
    return res.status(400).json({ error: passCheck.message });
  }

  const resetRecord = db.query(`
    SELECT * FROM password_resets
    WHERE email = ? AND token = ? AND used = 0 AND expires_at > ?
  `).get(email.toLowerCase().trim(), token, new Date().toISOString()) as any;

  if (!resetRecord) {
    return res.status(400).json({ error: 'Invalid or expired password reset token' });
  }

  db.transaction(() => {
    db.run(`UPDATE users SET password_hash = ? WHERE email = ?`, [
      hashPassword(newPassword),
      email.toLowerCase().trim()
    ]);
    db.run(`UPDATE password_resets SET used = 1 WHERE id = ?`, [resetRecord.id]);
  })();

  return res.json({ message: 'Password has been reset successfully. You can now log in.' });
});

// Admin creates/sends staff invitation (Staff accounts are invite-only)
app.post('/api/auth/invite-staff', requirePerm('staff.create'), (req: Request, res: Response) => {
  const { email, name, department, title, phone, invited_by } = req.body;
  if (!email || !name || !department || !title) {
    return res.status(400).json({ error: 'Name, email, department, and title are required' });
  }

  const cleanEmail = email.toLowerCase().trim();
  const existing = db.query('SELECT id FROM users WHERE email = ?').get(cleanEmail);
  if (existing) {
    return res.status(400).json({ error: 'An active user account with this email already exists' });
  }

  // Revoke any existing pending invites for this email
  db.run(`UPDATE staff_invitations SET status = 'revoked' WHERE email = ? AND status = 'pending'`, [cleanEmail]);

  try {
    const invite_token = 'inv_' + crypto.randomBytes(12).toString('hex');
    const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

    const resDb = db.run(`
      INSERT INTO staff_invitations (email, name, department, title, phone, invite_token, status, invited_by, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)
    `, [cleanEmail, name, department, title, phone || '', invite_token, invited_by || null, expires_at, new Date().toISOString()]);

    const invitation = {
      id: resDb.lastInsertRowid,
      email: cleanEmail,
      name,
      department,
      title,
      phone: phone || '',
      invite_token,
      status: 'pending',
      expires_at,
      created_at: new Date().toISOString()
    };

    return res.json({
      invitation,
      invite_token,
      invite_link: `http://localhost:3000/#register?invite=${invite_token}`,
      message: 'Staff invitation created successfully. Share this invite code/link with the candidate.'
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Admin lists all staff invitations
app.get('/api/auth/invitations', requirePerm('staff.view'), (req: Request, res: Response) => {
  const invitations = db.query(`
    SELECT * FROM staff_invitations
    ORDER BY id DESC
  `).all();
  return res.json(invitations);
});

// Admin revokes staff invitation
app.post('/api/auth/invitations/:id/revoke', requirePerm('staff.edit'), (req: Request, res: Response) => {
  const { id } = req.params;
  db.run(`UPDATE staff_invitations SET status = 'revoked' WHERE id = ?`, [id]);
  return res.json({ success: true, message: 'Invitation has been revoked' });
});

// Verify staff invite token before registration
app.get('/api/auth/verify-invite', (req: Request, res: Response) => {
  const token = (req.query.token as string || '').trim();
  if (!token) {
    return res.status(400).json({ valid: false, error: 'Invite token is required' });
  }

  const invitation = db.query(`
    SELECT * FROM staff_invitations
    WHERE invite_token = ?
  `).get(token) as any;

  if (!invitation) {
    return res.status(404).json({ valid: false, error: 'Invitation not found or invalid' });
  }

  if (invitation.status !== 'pending') {
    return res.status(400).json({
      valid: false,
      error: `This invitation has already been ${invitation.status}.`
    });
  }

  if (new Date(invitation.expires_at) < new Date()) {
    db.run(`UPDATE staff_invitations SET status = 'expired' WHERE id = ?`, [invitation.id]);
    return res.status(400).json({ valid: false, error: 'This invitation has expired.' });
  }

  return res.json({
    valid: true,
    invitation: {
      id: invitation.id,
      email: invitation.email,
      name: invitation.name,
      department: invitation.department,
      title: invitation.title,
      phone: invitation.phone,
      expires_at: invitation.expires_at
    }
  });
});

app.get('/api/auth/staff', requirePerm('staff.view'), (req: Request, res: Response) => {
  const staff = db.query(`
    SELECT s.*, u.created_at as user_created_at
    FROM staff s
    JOIN users u ON s.user_id = u.id
    ORDER BY s.id DESC
  `).all();
  return res.json(staff);
});

// Note: DELETE /api/staff/:id and /api/auth/staff/:id are handled with full RBAC transaction in rbacRoutes.ts

// Admin deletes an invitation record
app.delete('/api/auth/invitations/:id', requirePerm('staff.delete'), (req: Request, res: Response) => {
  const userRole = (req.headers['x-user-role'] as string) || '';
  if (userRole && userRole !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Only administrators can delete invitations.' });
  }
  const id = Number(req.params.id);
  db.run(`DELETE FROM staff_invitations WHERE id = ?`, [id]);
  return res.json({ success: true, message: 'Invitation deleted successfully.' });
});

// ----------------------------------------------------------------------
// 2. CUSTOMERS
// ----------------------------------------------------------------------
app.get('/api/customers', requirePerm('customers.view'), (req: Request, res: Response) => {
  const customers = db.query(`
    SELECT c.*,
      (SELECT COUNT(*) FROM subscriptions s WHERE s.customer_id = c.id AND s.status = 'active') as active_subscriptions_count,
      (SELECT COALESCE(SUM(i.total_amount - i.amount_paid), 0) FROM invoices i WHERE i.customer_id = c.id AND i.status IN ('draft', 'confirmed')) as outstanding_balance,
      (SELECT COALESCE(SUM(i.amount_paid), 0) FROM invoices i WHERE i.customer_id = c.id) as total_spent
    FROM customers c
    ORDER BY c.id DESC
  `).all();
  return res.json(customers);
});

app.get('/api/customers/:id', requirePerm('customers.view'), (req: Request, res: Response) => {
  const customer = db.query('SELECT * FROM customers WHERE id = ?').get(req.params.id) as any;
  if (!customer) return res.status(400).json({ error: 'Customer not found' });

  const subscriptions = db.query(`
    SELECT s.*, p.name as plan_name, p.billing_frequency
    FROM subscriptions s
    JOIN plans p ON s.plan_id = p.id
    WHERE s.customer_id = ?
    ORDER BY s.id DESC
  `).all(req.params.id);

  const invoices = db.query(`
    SELECT * FROM invoices WHERE customer_id = ? ORDER BY id DESC
  `).all(req.params.id);

  const payments = db.query(`
    SELECT p.*, i.invoice_number
    FROM payments p
    JOIN invoices i ON p.invoice_id = i.id
    WHERE p.customer_id = ?
    ORDER BY p.id DESC
  `).all(req.params.id);

  return res.json({ customer, subscriptions, invoices, payments });
});

app.post('/api/customers', requirePerm('customers.create'), (req: Request, res: Response) => {
  const { name, email, phone, company, address, gst_number } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'Name and email are required' });

  try {
    const resDb = db.run(`
      INSERT INTO customers (name, email, phone, company, address, gst_number, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 'active', ?)
    `, [name, email.toLowerCase().trim(), phone || '', company || '', address || '', gst_number || '', new Date().toISOString()]);

    const newCust = db.query('SELECT * FROM customers WHERE id = ?').get(resDb.lastInsertRowid);
    return res.json(newCust);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.put('/api/customers/:id', requirePerm('customers.edit'), (req: Request, res: Response) => {
  const { name, email, phone, company, address, gst_number, status } = req.body;
  db.run(`
    UPDATE customers
    SET name = ?, email = ?, phone = ?, company = ?, address = ?, gst_number = ?, status = ?
    WHERE id = ?
  `, [name, email, phone, company, address, gst_number, status || 'active', req.params.id]);

  const updated = db.query('SELECT * FROM customers WHERE id = ?').get(req.params.id);
  return res.json(updated);
});

// ----------------------------------------------------------------------
// 3. PRODUCTS & VARIANTS
// ----------------------------------------------------------------------
app.get('/api/products', requirePerm('products.view'), (req: Request, res: Response) => {
  const products = db.query('SELECT * FROM products ORDER BY id ASC').all() as any[];
  const variants = db.query('SELECT * FROM product_variants').all() as any[];

  const result = products.map(p => ({
    ...p,
    variants: variants.filter(v => v.product_id === p.id)
  }));
  return res.json(result);
});

app.post('/api/products', requirePerm('products.create'), (req: Request, res: Response) => {
  const { name, type, sales_price, cost_price, notes, variants } = req.body;
  if (!name || sales_price === undefined || cost_price === undefined) {
    return res.status(400).json({ error: 'Name, sales price, and cost price are required' });
  }

  const createProdTx = db.transaction(() => {
    const prodRes = db.run(`
      INSERT INTO products (name, type, sales_price, cost_price, notes, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, 1, ?)
    `, [name, type || 'SaaS', Number(sales_price), Number(cost_price), notes || '', new Date().toISOString()]);

    const prodId = prodRes.lastInsertRowid;

    if (Array.isArray(variants)) {
      for (const v of variants) {
        if (v.variant_name) {
          db.run(`
            INSERT INTO product_variants (product_id, variant_name, price_adjustment, sku)
            VALUES (?, ?, ?, ?)
          `, [prodId, v.variant_name, Number(v.price_adjustment || 0), v.sku || null]);
        }
      }
    }

    return prodId;
  });

  const newId = createProdTx();
  const newProduct = db.query('SELECT * FROM products WHERE id = ?').get(newId) as any;
  const prodVariants = db.query('SELECT * FROM product_variants WHERE product_id = ?').all(newId);
  return res.json({ ...newProduct, variants: prodVariants });
});

app.put('/api/products/:id', requirePerm('products.edit'), (req: Request, res: Response) => {
  const { name, type, sales_price, cost_price, notes, is_active, variants } = req.body;
  const prodId = req.params.id;

  const updateProdTx = db.transaction(() => {
    db.run(`
      UPDATE products
      SET name = ?, type = ?, sales_price = ?, cost_price = ?, notes = ?, is_active = ?
      WHERE id = ?
    `, [name, type, Number(sales_price), Number(cost_price), notes || '', is_active !== undefined ? is_active : 1, prodId]);

    if (Array.isArray(variants)) {
      db.run('DELETE FROM product_variants WHERE product_id = ?', [prodId]);
      for (const v of variants) {
        if (v.variant_name) {
          db.run(`
            INSERT INTO product_variants (product_id, variant_name, price_adjustment, sku)
            VALUES (?, ?, ?, ?)
          `, [prodId, v.variant_name, Number(v.price_adjustment || 0), v.sku || null]);
        }
      }
    }
  });

  updateProdTx();
  const updated = db.query('SELECT * FROM products WHERE id = ?').get(prodId) as any;
  const prodVariants = db.query('SELECT * FROM product_variants WHERE product_id = ?').all(prodId);
  return res.json({ ...updated, variants: prodVariants });
});

// ----------------------------------------------------------------------
// 4. PLANS
// ----------------------------------------------------------------------
app.get('/api/plans', requirePerm('plans.view'), (req: Request, res: Response) => {
  const plans = db.query(`
    SELECT p.*,
      (SELECT COUNT(*) FROM subscriptions s WHERE s.plan_id = p.id AND s.status = 'active') as active_subscribers_count
    FROM plans p
    ORDER BY p.id ASC
  `).all();
  return res.json(plans);
});

app.post('/api/plans', requirePerm('plans.create'), (req: Request, res: Response) => {
  const { name, code, billing_frequency, price, min_quantity, start_date, end_date, description } = req.body;
  if (!name || !code || !billing_frequency || price === undefined) {
    return res.status(400).json({ error: 'Name, code, billing frequency, and price are required' });
  }

  try {
    const resDb = db.run(`
      INSERT INTO plans (name, code, billing_frequency, price, min_quantity, start_date, end_date, status, description, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)
    `, [
      name, code.toUpperCase().trim(), billing_frequency, Number(price),
      Number(min_quantity || 1), start_date || null, end_date || null,
      description || '', new Date().toISOString()
    ]);

    const newPlan = db.query('SELECT * FROM plans WHERE id = ?').get(resDb.lastInsertRowid);
    return res.json(newPlan);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.patch('/api/plans/:id/status', requirePerm('plans.edit'), (req: Request, res: Response) => {
  const { status } = req.body; // 'active', 'paused', 'closed'
  if (!['active', 'paused', 'closed'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  db.run(`UPDATE plans SET status = ? WHERE id = ?`, [status, req.params.id]);
  const plan = db.query('SELECT * FROM plans WHERE id = ?').get(req.params.id);
  return res.json(plan);
});

// Edit / Update pre-existing plan details
app.put('/api/plans/:id', requirePerm('plans.edit'), (req: Request, res: Response) => {
  const userRole = (req.headers['x-user-role'] as string) || '';
  if (userRole && userRole !== 'admin' && userRole !== 'staff') {
    return res.status(403).json({ error: 'Access denied. Only administrators and staff can edit plans.' });
  }

  const { name, code, billing_frequency, price, min_quantity, start_date, end_date, description, status } = req.body;
  if (!name || price === undefined) {
    return res.status(400).json({ error: 'Plan name and price are required' });
  }

  const planId = Number(req.params.id);
  const existing = db.query('SELECT * FROM plans WHERE id = ?').get(planId) as any;
  if (!existing) {
    return res.status(404).json({ error: 'Plan not found' });
  }

  // Check code uniqueness if changing code
  if (code && code.toUpperCase().trim() !== existing.code) {
    const codeConflict = db.query('SELECT id FROM plans WHERE code = ? AND id != ?').get(code.toUpperCase().trim(), planId);
    if (codeConflict) {
      return res.status(400).json({ error: `Plan code "${code.toUpperCase().trim()}" is already in use by another plan.` });
    }
  }

  const cleanCode = code ? code.toUpperCase().trim() : existing.code;
  const cleanFreq = billing_frequency || existing.billing_frequency;
  const cleanStatus = status || existing.status;

  try {
    db.run(`
      UPDATE plans
      SET name = ?, code = ?, billing_frequency = ?, price = ?, min_quantity = ?,
          start_date = ?, end_date = ?, description = ?, status = ?
      WHERE id = ?
    `, [
      name.trim(),
      cleanCode,
      cleanFreq,
      Number(price),
      Number(min_quantity || 1),
      start_date || null,
      end_date || null,
      description !== undefined ? description : existing.description,
      cleanStatus,
      planId
    ]);

    const updated = db.query(`
      SELECT p.*,
        (SELECT COUNT(*) FROM subscriptions s WHERE s.plan_id = p.id AND s.status = 'active') as active_subscribers_count
      FROM plans p
      WHERE p.id = ?
    `).get(planId);

    return res.json(updated);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Admin deletes a plan (if no active subscriptions reference it)
app.delete('/api/plans/:id', requirePerm('plans.delete'), (req: Request, res: Response) => {
  const userRole = (req.headers['x-user-role'] as string) || '';
  if (userRole && userRole !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Only administrators can delete plans.' });
  }

  const planId = Number(req.params.id);
  const plan = db.query('SELECT * FROM plans WHERE id = ?').get(planId) as any;
  if (!plan) {
    return res.status(404).json({ error: 'Plan not found' });
  }

  const activeSubs = (db.query('SELECT COUNT(*) as count FROM subscriptions WHERE plan_id = ?').get(planId) as any).count;
  if (activeSubs > 0) {
    return res.status(400).json({
      error: `Cannot delete plan "${plan.name}" because it is currently assigned to ${activeSubs} subscription(s). You can close or pause the plan instead.`
    });
  }

  db.run('DELETE FROM plans WHERE id = ?', [planId]);
  return res.json({ success: true, message: `Plan "${plan.name}" deleted successfully.` });
});

// ----------------------------------------------------------------------
// 5. TAX RULES & PLATFORM SETTINGS
// ----------------------------------------------------------------------
app.get('/api/settings/tax', requirePerm('taxes.view'), (req: Request, res: Response) => {
  const defaultTax = db.query('SELECT * FROM tax_rules WHERE is_default = 1').get() as any;
  const allTaxes = db.query('SELECT * FROM tax_rules ORDER BY id ASC').all();
  return res.json({
    defaultTax: defaultTax || allTaxes[0] || null,
    allTaxes
  });
});

app.put('/api/settings/tax', requirePerm('taxes.edit'), (req: Request, res: Response) => {
  const userRole = (req.headers['x-user-role'] as string) || '';
  if (userRole && userRole !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Only administrators can configure tax settings.' });
  }

  const { rate, name, description, is_active } = req.body;
  if (rate === undefined || isNaN(Number(rate))) {
    return res.status(400).json({ error: 'Valid tax percentage rate is required.' });
  }

  const numericRate = Math.max(0, Math.min(100, Math.round(Number(rate) * 100) / 100));
  const taxName = name && String(name).trim() ? String(name).trim() : `GST (${numericRate}%)`;
  const taxDesc = description !== undefined ? String(description).trim() : 'Standard tax rate applied to invoices and subscriptions';
  const activeStatus = is_active === undefined ? 1 : (is_active ? 1 : 0);

  const existingDefault = db.query('SELECT * FROM tax_rules WHERE is_default = 1').get() as any;

  if (existingDefault) {
    db.run(`
      UPDATE tax_rules
      SET rate = ?, name = ?, description = ?, is_active = ?
      WHERE id = ?
    `, [numericRate, taxName, taxDesc, activeStatus, existingDefault.id]);
  } else {
    db.run('UPDATE tax_rules SET is_default = 0');
    db.run(`
      INSERT INTO tax_rules (name, rate, type, is_active, is_default, description)
      VALUES (?, ?, 'percentage', ?, 1, ?)
    `, [taxName, numericRate, activeStatus, taxDesc]);
  }

  const updatedDefault = db.query('SELECT * FROM tax_rules WHERE is_default = 1').get() as any;
  const allTaxes = db.query('SELECT * FROM tax_rules ORDER BY id ASC').all();
  return res.json({
    success: true,
    message: `Tax rate successfully updated to ${numericRate}% (${taxName}).`,
    defaultTax: updatedDefault,
    allTaxes
  });
});

app.get('/api/taxes', requirePerm('taxes.view'), (req: Request, res: Response) => {
  const taxes = db.query('SELECT * FROM tax_rules ORDER BY id ASC').all();
  return res.json(taxes);
});

app.post('/api/taxes', requirePerm('taxes.create'), (req: Request, res: Response) => {
  const { name, rate, type, is_active, is_default, description } = req.body;
  if (!name || rate === undefined) return res.status(400).json({ error: 'Name and rate are required' });

  if (is_default) {
    db.run('UPDATE tax_rules SET is_default = 0');
  }

  const resDb = db.run(`
    INSERT INTO tax_rules (name, rate, type, is_active, is_default, description)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [name, Number(rate), type || 'percentage', is_active ? 1 : 0, is_default ? 1 : 0, description || '']);

  const newTax = db.query('SELECT * FROM tax_rules WHERE id = ?').get(resDb.lastInsertRowid);
  return res.json(newTax);
});

app.get('/api/discounts', requirePerm('discounts.view'), (req: Request, res: Response) => {
  const discounts = db.query(`
    SELECT d.*, p.name as applicable_product_name
    FROM discounts d
    LEFT JOIN products p ON d.applicable_product_id = p.id
    ORDER BY d.id DESC
  `).all();
  return res.json(discounts);
});

app.post('/api/discounts', requirePerm('discounts.create'), (req: Request, res: Response) => {
  const { code, description, discount_type, value, min_amount, min_quantity, start_date, end_date, max_uses, applicable_product_id } = req.body;
  if (!code || !discount_type || value === undefined) {
    return res.status(400).json({ error: 'Code, discount type, and value are required' });
  }

  try {
    const resDb = db.run(`
      INSERT INTO discounts (
        code, description, discount_type, value, min_amount, min_quantity,
        start_date, end_date, max_uses, current_uses, applicable_product_id, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, 'active', ?)
    `, [
      code.toUpperCase().trim(), description || '', discount_type, Number(value),
      Number(min_amount || 0), Number(min_quantity || 0), start_date || null,
      end_date || null, Number(max_uses || 100), applicable_product_id || null,
      new Date().toISOString()
    ]);

    const newDisc = db.query('SELECT * FROM discounts WHERE id = ?').get(resDb.lastInsertRowid);
    return res.json(newDisc);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Validate discount code against quotation/sub totals
app.post('/api/discounts/validate', (req: Request, res: Response) => {
  const { code, subtotal, quantity } = req.body;
  if (!code) return res.status(400).json({ error: 'Code required' });

  const discount = db.query('SELECT * FROM discounts WHERE code = ?').get(code.toUpperCase().trim()) as any;
  if (!discount) return res.status(404).json({ valid: false, message: 'Discount code not found' });

  const today = new Date().toISOString().split('T')[0];
  if (discount.status !== 'active') return res.json({ valid: false, message: 'Discount is not active' });
  if (discount.start_date && discount.start_date > today) return res.json({ valid: false, message: 'Discount has not started yet' });
  if (discount.end_date && discount.end_date < today) return res.json({ valid: false, message: 'Discount has expired' });
  if (discount.max_uses > 0 && discount.current_uses >= discount.max_uses) {
    return res.json({ valid: false, message: 'Discount usage limit reached' });
  }
  if (subtotal < (discount.min_amount || 0)) {
    return res.json({ valid: false, message: `Minimum order amount of ₹${discount.min_amount} required` });
  }
  if (quantity < (discount.min_quantity || 0)) {
    return res.json({ valid: false, message: `Minimum quantity of ${discount.min_quantity} items required` });
  }

  let calculatedDiscount = 0;
  if (discount.discount_type === 'percentage') {
    calculatedDiscount = Math.round((subtotal * (discount.value / 100.0)) * 100) / 100;
  } else {
    calculatedDiscount = Math.min(discount.value, subtotal);
  }

  return res.json({
    valid: true,
    discount,
    discountAmount: calculatedDiscount
  });
});

// Admin updates discount status (e.g. enable/disable or expire)
app.patch('/api/discounts/:id/status', requirePerm('discounts.toggle'), (req: Request, res: Response) => {
  const userRole = (req.headers['x-user-role'] as string) || '';
  if (userRole && userRole !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Only administrators can modify discount rules.' });
  }

  const { status } = req.body;
  if (!['active', 'inactive', 'expired'].includes(status)) {
    return res.status(400).json({ error: 'Status must be active, inactive, or expired' });
  }

  const discount = db.query('SELECT * FROM discounts WHERE id = ?').get(req.params.id) as any;
  if (!discount) {
    return res.status(404).json({ error: 'Discount rule not found' });
  }

  db.run('UPDATE discounts SET status = ? WHERE id = ?', [status, req.params.id]);
  const updated = db.query(`
    SELECT d.*, p.name as applicable_product_name
    FROM discounts d
    LEFT JOIN products p ON d.applicable_product_id = p.id
    WHERE d.id = ?
  `).get(req.params.id);
  return res.json(updated);
});

// Admin toggles discount rule between active and inactive (disable / enable)
app.patch('/api/discounts/:id/toggle', requirePerm('discounts.toggle'), (req: Request, res: Response) => {
  const userRole = (req.headers['x-user-role'] as string) || '';
  if (userRole && userRole !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Only administrators can disable or enable discounts.' });
  }

  const discount = db.query('SELECT * FROM discounts WHERE id = ?').get(req.params.id) as any;
  if (!discount) {
    return res.status(404).json({ error: 'Discount rule not found' });
  }

  const newStatus = discount.status === 'active' ? 'inactive' : 'active';
  db.run('UPDATE discounts SET status = ? WHERE id = ?', [newStatus, req.params.id]);
  const updated = db.query(`
    SELECT d.*, p.name as applicable_product_name
    FROM discounts d
    LEFT JOIN products p ON d.applicable_product_id = p.id
    WHERE d.id = ?
  `).get(req.params.id);
  return res.json(updated);
});

// Admin deletes a discount rule
app.delete('/api/discounts/:id', requirePerm('discounts.delete'), (req: Request, res: Response) => {
  const userRole = (req.headers['x-user-role'] as string) || '';
  if (userRole && userRole !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Only administrators can delete discount rules.' });
  }

  const discount = db.query('SELECT * FROM discounts WHERE id = ?').get(req.params.id) as any;
  if (!discount) {
    return res.status(404).json({ error: 'Discount rule not found' });
  }

  db.run('DELETE FROM discount_usages WHERE discount_id = ?', [req.params.id]);
  db.run('DELETE FROM discounts WHERE id = ?', [req.params.id]);
  return res.json({ success: true, message: `Discount rule "${discount.code}" has been removed.` });
});

// ----------------------------------------------------------------------
// 6. QUOTATION TEMPLATES & QUOTATIONS
// ----------------------------------------------------------------------
app.get('/api/quotation-templates', requirePerm('quotation_templates.view'), (req: Request, res: Response) => {
  const templates = db.query(`
    SELECT qt.*, p.name as plan_name, p.billing_frequency, p.price as plan_price
    FROM quotation_templates qt
    LEFT JOIN plans p ON qt.plan_id = p.id
    ORDER BY qt.id DESC
  `).all() as any[];

  const items = db.query(`
    SELECT qti.*, pr.name as product_name, pv.variant_name
    FROM quotation_template_items qti
    JOIN products pr ON qti.product_id = pr.id
    LEFT JOIN product_variants pv ON qti.variant_id = pv.id
  `).all() as any[];

  const result = templates.map(t => ({
    ...t,
    items: items.filter(i => i.template_id === t.id)
  }));
  return res.json(result);
});

app.post('/api/quotation-templates', requirePerm('quotation_templates.create'), (req: Request, res: Response) => {
  const { name, plan_id, validity_days, notes, items } = req.body;
  if (!name || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Name and items are required' });
  }

  const createTemplateTx = db.transaction(() => {
    const resTpl = db.run(`
      INSERT INTO quotation_templates (name, plan_id, validity_days, notes, created_at)
      VALUES (?, ?, ?, ?, ?)
    `, [name, plan_id || null, Number(validity_days || 15), notes || '', new Date().toISOString()]);

    const templateId = resTpl.lastInsertRowid;

    for (const it of items) {
      db.run(`
        INSERT INTO quotation_template_items (template_id, product_id, variant_id, quantity, unit_price)
        VALUES (?, ?, ?, ?, ?)
      `, [templateId, it.product_id, it.variant_id || null, Number(it.quantity || 1), Number(it.unit_price)]);
    }

    return templateId;
  });

  const newId = createTemplateTx();
  return res.json({ id: newId, message: 'Template created successfully' });
});

app.get('/api/quotations', requirePerm('quotations.view'), (req: Request, res: Response) => {
  const quotations = db.query(`
    SELECT q.*, c.name as customer_name, c.company as customer_company, c.email as customer_email,
           p.name as plan_name, p.billing_frequency, d.code as discount_code, tr.name as tax_rule_name
    FROM quotations q
    JOIN customers c ON q.customer_id = c.id
    LEFT JOIN plans p ON q.plan_id = p.id
    LEFT JOIN discounts d ON q.discount_id = d.id
    LEFT JOIN tax_rules tr ON q.tax_rule_id = tr.id
    ORDER BY q.id DESC
  `).all() as any[];

  const items = db.query(`
    SELECT qi.*, pr.name as product_name, pv.variant_name
    FROM quotation_items qi
    JOIN products pr ON qi.product_id = pr.id
    LEFT JOIN product_variants pv ON qi.variant_id = pv.id
  `).all() as any[];

  const result = quotations.map(q => ({
    ...q,
    items: items.filter(i => i.quotation_id === q.id)
  }));
  return res.json(result);
});

app.post('/api/quotations', requirePerm('quotations.create'), (req: Request, res: Response) => {
  const { customer_id, plan_id, valid_days, discount_id, tax_rule_id, notes, items } = req.body;
  if (!customer_id || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Customer and items are required' });
  }

  const validDays = Number(valid_days || 15);
  const validUntil = new Date(Date.now() + validDays * 86400000).toISOString().split('T')[0];

  const createQuoteTx = db.transaction(() => {
    // Generate quotation number
    const count = (db.query('SELECT COUNT(*) as count FROM quotations').get() as any).count;
    const quotationNumber = `QT-${String(count + 1).padStart(3, '0')}`;

    let subtotal = 0;
    let totalQty = 0;
    for (const item of items) {
      subtotal += Number(item.unit_price) * Number(item.quantity);
      totalQty += Number(item.quantity);
    }

    // Discounts
    let discountAmount = 0;
    if (discount_id) {
      const disc = db.query('SELECT * FROM discounts WHERE id = ?').get(discount_id) as any;
      if (disc && disc.status === 'active') {
        if (disc.discount_type === 'percentage') {
          discountAmount = Math.round((subtotal * (disc.value / 100.0)) * 100) / 100;
        } else {
          discountAmount = Math.min(disc.value, subtotal);
        }
      }
    }

    // Taxes
    let taxRate = 0;
    if (tax_rule_id) {
      const tr = db.query('SELECT * FROM tax_rules WHERE id = ?').get(tax_rule_id) as any;
      if (tr) taxRate = tr.rate;
    } else {
      const defTax = db.query('SELECT * FROM tax_rules WHERE is_default = 1').get() as any;
      if (defTax) taxRate = defTax.rate;
    }

    const taxable = Math.max(0, subtotal - discountAmount);
    const taxAmount = Math.round((taxable * (taxRate / 100.0)) * 100) / 100;
    const totalAmount = Math.round((taxable + taxAmount) * 100) / 100;

    const resQuote = db.run(`
      INSERT INTO quotations (
        quotation_number, customer_id, plan_id, status, valid_until,
        subtotal, discount_amount, discount_id, tax_amount, tax_rule_id,
        total_amount, notes, created_at
      ) VALUES (?, ?, ?, 'sent', ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      quotationNumber, customer_id, plan_id || null, validUntil,
      subtotal, discountAmount, discount_id || null, taxAmount, tax_rule_id || null,
      totalAmount, notes || '', new Date().toISOString()
    ]);

    const quoteId = resQuote.lastInsertRowid;

    for (const it of items) {
      const lineTotal = Number(it.unit_price) * Number(it.quantity);
      db.run(`
        INSERT INTO quotation_items (
          quotation_id, product_id, variant_id, quantity, unit_price, tax_rate, amount
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [quoteId, it.product_id, it.variant_id || null, Number(it.quantity), Number(it.unit_price), taxRate, lineTotal]);
    }

    return quoteId;
  });

  const quoteId = createQuoteTx();
  return res.json({ id: quoteId, message: 'Quotation created successfully' });
});

// Accept quotation -> instantly create Confirmed/Active Subscription!
app.post('/api/quotations/:id/accept', requirePerm('quotations.confirm'), (req: Request, res: Response) => {
  const quoteId = req.params.id;
  const quote = db.query(`
    SELECT q.*, p.billing_frequency, c.name as customer_name
    FROM quotations q
    LEFT JOIN plans p ON q.plan_id = p.id
    JOIN customers c ON q.customer_id = c.id
    WHERE q.id = ?
  `).get(quoteId) as any;

  if (!quote) return res.status(404).json({ error: 'Quotation not found' });
  if (quote.status === 'accepted') {
    return res.status(400).json({ error: 'Quotation is already accepted' });
  }

  const items = db.query(`
    SELECT qi.*, pr.name as product_name, pv.variant_name
    FROM quotation_items qi
    JOIN products pr ON qi.product_id = pr.id
    LEFT JOIN product_variants pv ON qi.variant_id = pv.id
    WHERE qi.quotation_id = ?
  `).all(quoteId) as any[];

  const acceptTx = db.transaction(() => {
    // Generate Subscription Number
    const count = (db.query('SELECT COUNT(*) as count FROM subscriptions').get() as any).count;
    const subNumber = `SUB-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const startDate = new Date().toISOString().split('T')[0];
    const frequency = quote.billing_frequency || 'monthly';
    const nextBillingDate = addBillingPeriod(startDate, frequency);
    const expiryDate = addBillingPeriod(startDate, 'yearly'); // 1 year default term

    const subRes = db.run(`
      INSERT INTO subscriptions (
        subscription_number, customer_id, plan_id, quotation_id, status,
        start_date, next_billing_date, expiry_date, payment_terms, auto_renew,
        discount_id, tax_rule_id, subtotal, discount_amount, tax_amount, total_amount,
        notes, created_at
      ) VALUES (?, ?, ?, ?, 'active', ?, ?, ?, 'Net 15', 1, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      subNumber, quote.customer_id, quote.plan_id || 1, quote.id,
      startDate, nextBillingDate, expiryDate, quote.discount_id, quote.tax_rule_id,
      quote.subtotal, quote.discount_amount, quote.tax_amount, quote.total_amount,
      `Created from accepted quotation ${quote.quotation_number}`, startDate
    ]);

    const subId = subRes.lastInsertRowid;

    for (const it of items) {
      db.run(`
        INSERT INTO subscription_items (
          subscription_id, product_id, variant_id, quantity, unit_price, tax_rate, amount
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [subId, it.product_id, it.variant_id || null, it.quantity, it.unit_price, it.tax_rate, it.amount]);
    }

    // Update Quotation status
    db.run(`
      UPDATE quotations
      SET status = 'accepted', converted_subscription_id = ?
      WHERE id = ?
    `, [subId, quote.id]);

    // Generate First Cycle Invoice immediately for the new subscription
    const lastInvoice = db.query(`SELECT id FROM invoices ORDER BY id DESC LIMIT 1`).get() as any;
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String((lastInvoice?.id || 0) + 1).padStart(4, '0')}`;
    const dueDate = addPaymentTermDays(startDate, 'Net 15');

    const invRes = db.run(`
      INSERT INTO invoices (
        invoice_number, subscription_id, customer_id, issue_date, due_date,
        billing_cycle_start, billing_cycle_end, subtotal, discount_amount, discount_code,
        tax_rate, tax_amount, total_amount, amount_paid, status, sent_at, notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0.0, 'confirmed', ?, ?, ?)
    `, [
      invoiceNumber, subId, quote.customer_id, startDate, dueDate,
      startDate, nextBillingDate, quote.subtotal, quote.discount_amount,
      quote.discount_id ? 'BULK10' : null, 18.0, quote.tax_amount, quote.total_amount,
      startDate, `Initial cycle invoice for accepted quotation ${quote.quotation_number}`, startDate
    ]);

    const invoiceId = invRes.lastInsertRowid;

    for (const it of items) {
      const itemTax = Math.round((it.amount * (it.tax_rate / 100.0)) * 100) / 100;
      db.run(`
        INSERT INTO invoice_items (
          invoice_id, product_name, variant_name, quantity, unit_price, tax_rate, tax_amount, amount
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [invoiceId, it.product_name, it.variant_name || null, it.quantity, it.unit_price, it.tax_rate, itemTax, it.amount]);
    }

    return { subId, subNumber, invoiceId, invoiceNumber };
  });

  const result = acceptTx();
  return res.json({
    message: `Quotation accepted! Created subscription ${result.subNumber} and first invoice ${result.invoiceNumber}.`,
    subscriptionId: result.subId,
    invoiceId: result.invoiceId
  });
});

// ----------------------------------------------------------------------
// 7. SUBSCRIPTIONS
// ----------------------------------------------------------------------
app.get('/api/subscriptions', requirePerm('subscriptions.view', true), (req: Request, res: Response) => {
  const { status, customer_id } = req.query;
  const userRole = (req.headers['x-user-role'] as string) || '';
  const userCustId = (req.headers['x-customer-id'] as string) || '';
  let targetCustomerId = customer_id as string;

  if (userRole === 'customer') {
    targetCustomerId = userCustId || (customer_id as string);
  }

  let sql = `
    SELECT s.*, c.name as customer_name, c.company as customer_company, c.email as customer_email,
           p.name as plan_name, p.billing_frequency, d.code as discount_code, tr.name as tax_rule_name
    FROM subscriptions s
    JOIN customers c ON s.customer_id = c.id
    JOIN plans p ON s.plan_id = p.id
    LEFT JOIN discounts d ON s.discount_id = d.id
    LEFT JOIN tax_rules tr ON s.tax_rule_id = tr.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (status) {
    sql += ` AND s.status = ?`;
    params.push(status);
  }
  if (targetCustomerId) {
    sql += ` AND s.customer_id = ?`;
    params.push(targetCustomerId);
  }

  sql += ` ORDER BY s.id DESC`;

  const subscriptions = db.query(sql).all(...params) as any[];
  const items = db.query(`
    SELECT si.*, pr.name as product_name, pv.variant_name
    FROM subscription_items si
    JOIN products pr ON si.product_id = pr.id
    LEFT JOIN product_variants pv ON si.variant_id = pv.id
  `).all() as any[];

  const result = subscriptions.map(s => ({
    ...s,
    items: items.filter(i => i.subscription_id === s.id)
  }));
  return res.json(result);
});

app.get('/api/subscriptions/:id', requirePerm('subscriptions.view', true), (req: Request, res: Response) => {
  const userRole = (req.headers['x-user-role'] as string) || '';
  const userCustId = (req.headers['x-customer-id'] as string) || '';

  const sub = db.query(`
    SELECT s.*, c.name as customer_name, c.company as customer_company, c.email as customer_email,
           p.name as plan_name, p.billing_frequency, d.code as discount_code, tr.name as tax_rule_name
    FROM subscriptions s
    JOIN customers c ON s.customer_id = c.id
    JOIN plans p ON s.plan_id = p.id
    LEFT JOIN discounts d ON s.discount_id = d.id
    LEFT JOIN tax_rules tr ON s.tax_rule_id = tr.id
    WHERE s.id = ?
  `).get(req.params.id) as any;

  if (!sub) return res.status(404).json({ error: 'Subscription not found' });

  if (userRole === 'customer' && userCustId && String(sub.customer_id) !== String(userCustId)) {
    return res.status(403).json({ error: 'Access denied: You are only permitted to view your own subscriptions.' });
  }

  const items = db.query(`
    SELECT si.*, pr.name as product_name, pv.variant_name
    FROM subscription_items si
    JOIN products pr ON si.product_id = pr.id
    LEFT JOIN product_variants pv ON si.variant_id = pv.id
    WHERE si.subscription_id = ?
  `).all(req.params.id);

  const invoices = db.query(`
    SELECT * FROM invoices WHERE subscription_id = ? ORDER BY id DESC
  `).all(req.params.id);

  return res.json({ subscription: sub, items, invoices });
});

app.post('/api/subscriptions', requirePerm('subscriptions.create'), (req: Request, res: Response) => {
  const { customer_id, plan_id, payment_terms, discount_id, tax_rule_id, notes, items, start_date } = req.body;
  if (!customer_id || !plan_id || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Customer, plan, and line items are required' });
  }

  const plan = db.query('SELECT * FROM plans WHERE id = ?').get(plan_id) as any;
  if (!plan) return res.status(400).json({ error: 'Plan not found' });

  const createSubTx = db.transaction(() => {
    const count = (db.query('SELECT COUNT(*) as count FROM subscriptions').get() as any).count;
    const subNumber = `SUB-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const startDate = start_date || new Date().toISOString().split('T')[0];
    const nextBillingDate = addBillingPeriod(startDate, plan.billing_frequency);
    const expiryDate = addBillingPeriod(startDate, 'yearly');

    let subtotal = 0;
    let totalQty = 0;
    for (const it of items) {
      subtotal += Number(it.unit_price) * Number(it.quantity);
      totalQty += Number(it.quantity);
    }

    let discountAmount = 0;
    if (discount_id) {
      const disc = db.query('SELECT * FROM discounts WHERE id = ?').get(discount_id) as any;
      if (disc && disc.status === 'active') {
        if (disc.discount_type === 'percentage') {
          discountAmount = Math.round((subtotal * (disc.value / 100.0)) * 100) / 100;
        } else {
          discountAmount = Math.min(disc.value, subtotal);
        }
      }
    }

    let taxRate = 0;
    if (tax_rule_id) {
      const tr = db.query('SELECT * FROM tax_rules WHERE id = ?').get(tax_rule_id) as any;
      if (tr) taxRate = tr.rate;
    } else {
      const defTax = db.query('SELECT * FROM tax_rules WHERE is_default = 1').get() as any;
      if (defTax) taxRate = defTax.rate;
    }

    const taxable = Math.max(0, subtotal - discountAmount);
    const taxAmount = Math.round((taxable * (taxRate / 100.0)) * 100) / 100;
    const totalAmount = Math.round((taxable + taxAmount) * 100) / 100;

    const resSub = db.run(`
      INSERT INTO subscriptions (
        subscription_number, customer_id, plan_id, status, start_date,
        next_billing_date, expiry_date, payment_terms, auto_renew,
        discount_id, tax_rule_id, subtotal, discount_amount, tax_amount, total_amount,
        notes, created_at
      ) VALUES (?, ?, ?, 'active', ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      subNumber, customer_id, plan_id, startDate, nextBillingDate, expiryDate,
      payment_terms || 'Net 15', discount_id || null, tax_rule_id || null,
      subtotal, discountAmount, taxAmount, totalAmount, notes || '', startDate
    ]);

    const subId = resSub.lastInsertRowid;

    for (const it of items) {
      const lineTotal = Number(it.unit_price) * Number(it.quantity);
      db.run(`
        INSERT INTO subscription_items (
          subscription_id, product_id, variant_id, quantity, unit_price, tax_rate, amount
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [subId, it.product_id, it.variant_id || null, Number(it.quantity), Number(it.unit_price), taxRate, lineTotal]);
    }

    return { subId, subNumber };
  });

  const result = createSubTx();
  return res.json({ id: result.subId, subscription_number: result.subNumber, message: 'Subscription created' });
});

// Subscription Lifecycle Actions: Pause, Resume, Close Early, Renew
app.patch('/api/subscriptions/:id/status', requirePerm('subscriptions.edit'), (req: Request, res: Response) => {
  const { status, reason } = req.body;
  const subId = req.params.id;

  const validStatuses = ['draft', 'quotation', 'confirmed', 'active', 'paused', 'closed'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid subscription status' });
  }

  const today = new Date().toISOString().split('T')[0];

  if (status === 'paused') {
    db.run(`UPDATE subscriptions SET status = 'paused', paused_at = ? WHERE id = ?`, [today, subId]);
  } else if (status === 'closed') {
    db.run(`UPDATE subscriptions SET status = 'closed', closed_at = ?, notes = notes || ' [Closed: ' || ? || ']' WHERE id = ?`, [today, reason || 'Closed by user', subId]);
  } else if (status === 'active') {
    db.run(`UPDATE subscriptions SET status = 'active', paused_at = NULL WHERE id = ?`, [subId]);
  } else {
    db.run(`UPDATE subscriptions SET status = ? WHERE id = ?`, [status, subId]);
  }

  const updated = db.query('SELECT * FROM subscriptions WHERE id = ?').get(subId);
  return res.json(updated);
});

app.post('/api/subscriptions/:id/renew', requirePerm('subscriptions.renew'), (req: Request, res: Response) => {
  const sub = db.query('SELECT s.*, p.billing_frequency FROM subscriptions s JOIN plans p ON s.plan_id = p.id WHERE s.id = ?').get(req.params.id) as any;
  if (!sub) return res.status(404).json({ error: 'Subscription not found' });

  const currentExpiry = sub.expiry_date || new Date().toISOString().split('T')[0];
  const newExpiry = addBillingPeriod(currentExpiry, 'yearly');

  db.run(`
    UPDATE subscriptions
    SET status = 'active', expiry_date = ?, auto_renew = 1, closed_at = NULL
    WHERE id = ?
  `, [newExpiry, sub.id]);

  return res.json({ message: `Subscription renewed until ${newExpiry}` });
});

// ----------------------------------------------------------------------
// 8. INVOICES
// ----------------------------------------------------------------------
app.get('/api/invoices', requirePerm('invoices.view', true), (req: Request, res: Response) => {
  const { status, customer_id, overdue_only } = req.query;
  const userRole = (req.headers['x-user-role'] as string) || '';
  const userCustId = (req.headers['x-customer-id'] as string) || '';
  const today = new Date().toISOString().split('T')[0];

  // Tenant security: customer accounts can ONLY view their own invoices
  let targetCustomerId = customer_id as string;
  if (userRole === 'customer') {
    targetCustomerId = userCustId || (customer_id as string);
  }

  let sql = `
    SELECT i.*, c.name as customer_name, c.company as customer_company, c.email as customer_email,
           s.subscription_number,
           CASE
             WHEN i.status != 'paid' AND i.status != 'cancelled' AND i.due_date < ? THEN 1
             ELSE 0
           END as is_overdue
    FROM invoices i
    JOIN customers c ON i.customer_id = c.id
    LEFT JOIN subscriptions s ON i.subscription_id = s.id
    WHERE 1=1
  `;
  const params: any[] = [today];

  if (status) {
    sql += ` AND i.status = ?`;
    params.push(status);
  }
  if (targetCustomerId) {
    sql += ` AND i.customer_id = ?`;
    params.push(targetCustomerId);
  }
  if (overdue_only === 'true') {
    sql += ` AND i.status != 'paid' AND i.status != 'cancelled' AND i.due_date < ?`;
    params.push(today);
  }

  sql += ` ORDER BY i.id DESC`;

  const invoices = db.query(sql).all(...params) as any[];
  const items = db.query('SELECT * FROM invoice_items').all() as any[];

  const result = invoices.map(inv => ({
    ...inv,
    items: items.filter(it => it.invoice_id === inv.id)
  }));
  return res.json(result);
});

app.get('/api/invoices/:id', requirePerm('invoices.view', true), (req: Request, res: Response) => {
  const userRole = (req.headers['x-user-role'] as string) || '';
  const userCustId = (req.headers['x-customer-id'] as string) || '';
  const today = new Date().toISOString().split('T')[0];

  const invoice = db.query(`
    SELECT i.*, c.name as customer_name, c.company as customer_company, c.email as customer_email,
           c.phone as customer_phone, c.address as customer_address, c.gst_number as customer_gst,
           s.subscription_number, s.payment_terms,
           CASE
             WHEN i.status != 'paid' AND i.status != 'cancelled' AND i.due_date < ? THEN 1
             ELSE 0
           END as is_overdue
    FROM invoices i
    JOIN customers c ON i.customer_id = c.id
    LEFT JOIN subscriptions s ON i.subscription_id = s.id
    WHERE i.id = ?
  `).get(today, req.params.id) as any;

  if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

  // Tenant security: customer accounts can ONLY view their own invoice
  if (userRole === 'customer') {
    if (userCustId && String(invoice.customer_id) !== String(userCustId)) {
      return res.status(403).json({ error: 'Access denied: You are only permitted to view your own invoices.' });
    }
  }

  const items = db.query('SELECT * FROM invoice_items WHERE invoice_id = ?').all(req.params.id);
  const payments = db.query('SELECT * FROM payments WHERE invoice_id = ? ORDER BY id DESC').all(req.params.id);

  return res.json({ invoice, items, payments });
});

app.patch('/api/invoices/:id/confirm', requirePerm('invoices.confirm'), (req: Request, res: Response) => {
  if (req.headers['x-user-role'] === 'customer') {
    return res.status(403).json({ error: 'Access denied: Customer accounts cannot confirm draft invoices.' });
  }
  db.run(`UPDATE invoices SET status = 'confirmed' WHERE id = ? AND status = 'draft'`, [req.params.id]);
  const invoice = db.query('SELECT * FROM invoices WHERE id = ?').get(req.params.id);
  return res.json(invoice);
});

app.patch('/api/invoices/:id/cancel', requirePerm('invoices.cancel'), (req: Request, res: Response) => {
  if (req.headers['x-user-role'] === 'customer') {
    return res.status(403).json({ error: 'Access denied: Customer accounts cannot cancel invoices.' });
  }
  db.run(`UPDATE invoices SET status = 'cancelled' WHERE id = ? AND status != 'paid'`, [req.params.id]);
  const invoice = db.query('SELECT * FROM invoices WHERE id = ?').get(req.params.id);
  return res.json(invoice);
});

app.post('/api/invoices/:id/send', requirePerm('invoices.view'), (req: Request, res: Response) => {
  if (req.headers['x-user-role'] === 'customer') {
    return res.status(403).json({ error: 'Access denied: Customer accounts cannot dispatch invoices.' });
  }
  const today = new Date().toISOString();
  db.run(`UPDATE invoices SET sent_at = ? WHERE id = ?`, [today, req.params.id]);
  const invoice = db.query(`
    SELECT i.*, c.email as customer_email, c.name as customer_name
    FROM invoices i
    JOIN customers c ON i.customer_id = c.id
    WHERE i.id = ?
  `).get(req.params.id) as any;

  return res.json({
    message: `Invoice ${invoice.invoice_number} sent to ${invoice.customer_email}`,
    sent_at: today
  });
});

// ----------------------------------------------------------------------
// 9. PAYMENTS
// ----------------------------------------------------------------------
app.get('/api/payments', requirePerm('payments.view', true), (req: Request, res: Response) => {
  const { customer_id } = req.query;
  const userRole = (req.headers['x-user-role'] as string) || '';
  const userCustId = (req.headers['x-customer-id'] as string) || '';

  let targetCustomerId = customer_id as string;
  if (userRole === 'customer') {
    targetCustomerId = userCustId || (customer_id as string);
  }

  let sql = `
    SELECT p.*, i.invoice_number, i.total_amount as invoice_total,
           c.name as customer_name, c.company as customer_company
    FROM payments p
    JOIN invoices i ON p.invoice_id = i.id
    JOIN customers c ON p.customer_id = c.id
    WHERE 1=1
  `;
  const params: any[] = [];
  if (targetCustomerId) {
    sql += ` AND p.customer_id = ?`;
    params.push(targetCustomerId);
  }
  sql += ` ORDER BY p.id DESC`;

  const payments = db.query(sql).all(...params);
  return res.json(payments);
});

app.post('/api/payments', requirePerm('payments.record'), (req: Request, res: Response) => {
  const { invoice_id, amount, payment_method, payment_date, transaction_ref, notes } = req.body;
  if (!invoice_id || !amount || !payment_method) {
    return res.status(400).json({ error: 'Invoice ID, amount, and payment method are required' });
  }

  const invoice = db.query('SELECT * FROM invoices WHERE id = ?').get(invoice_id) as any;
  if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
  if (invoice.status === 'cancelled') return res.status(400).json({ error: 'Cannot pay cancelled invoice' });

  const paymentAmount = Number(amount);
  if (paymentAmount <= 0) return res.status(400).json({ error: 'Payment amount must be greater than 0' });

  const recordPaymentTx = db.transaction(() => {
    // Generate Payment number
    const count = (db.query('SELECT COUNT(*) as count FROM payments').get() as any).count;
    const paymentNumber = `PAY-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
    const payDate = payment_date || new Date().toISOString().split('T')[0];

    const payRes = db.run(`
      INSERT INTO payments (
        payment_number, invoice_id, customer_id, amount, payment_method,
        payment_date, transaction_ref, notes, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?)
    `, [
      paymentNumber, invoice.id, invoice.customer_id, paymentAmount, payment_method,
      payDate, transaction_ref || '', notes || '', new Date().toISOString()
    ]);

    const newAmountPaid = invoice.amount_paid + paymentAmount;
    const newStatus = newAmountPaid >= invoice.total_amount ? 'paid' : 'confirmed';

    db.run(`
      UPDATE invoices
      SET amount_paid = ?, status = ?
      WHERE id = ?
    `, [newAmountPaid, newStatus, invoice.id]);

    return { paymentNumber, newStatus, newAmountPaid };
  });

  const result = recordPaymentTx();
  return res.json({
    message: `Payment of ₹${paymentAmount.toLocaleString('en-IN')} recorded successfully. Invoice status: ${result.newStatus.toUpperCase()}`,
    payment_number: result.paymentNumber,
    newStatus: result.newStatus,
    newAmountPaid: result.newAmountPaid
  });
});

// ----------------------------------------------------------------------
// 10. RECURRING BILLING SCHEDULER (AUTOMATION & SIMULATOR)
// ----------------------------------------------------------------------
app.post('/api/scheduler/run', requirePerm('subscriptions.edit'), (req: Request, res: Response) => {
  const { targetDate } = req.body;
  try {
    const result = runRecurringBilling(targetDate);
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/scheduler/logs', requirePerm('subscriptions.view'), (req: Request, res: Response) => {
  const logs = db.query('SELECT * FROM scheduler_logs ORDER BY id DESC LIMIT 50').all() as any[];
  const parsed = logs.map(l => ({
    ...l,
    details: l.details ? JSON.parse(l.details) : []
  }));
  return res.json(parsed);
});

app.get('/api/scheduler/upcoming', requirePerm('subscriptions.view'), (req: Request, res: Response) => {
  const upcoming = db.query(`
    SELECT s.id, s.subscription_number, s.next_billing_date, s.status, s.total_amount,
           c.name as customer_name, c.company as customer_company, p.name as plan_name, p.billing_frequency
    FROM subscriptions s
    JOIN customers c ON s.customer_id = c.id
    JOIN plans p ON s.plan_id = p.id
    WHERE s.status = 'active'
    ORDER BY s.next_billing_date ASC
    LIMIT 10
  `).all();
  return res.json(upcoming);
});

// ----------------------------------------------------------------------
// 11. FINANCE DASHBOARD & REVENUE REPORTS (Performance < 2s Guaranteed)
// ----------------------------------------------------------------------
app.get('/api/dashboard', requirePerm('reports.view'), (req: Request, res: Response) => {
  const startTime = performance.now();
  const today = new Date().toISOString().split('T')[0];

  // 1. Core KPIs
  const activeSubsCount = (db.query(`SELECT COUNT(*) as count FROM subscriptions WHERE status = 'active'`).get() as any).count;
  const revenueReceived = (db.query(`SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'completed'`).get() as any).total;
  const outstandingAmount = (db.query(`SELECT COALESCE(SUM(total_amount - amount_paid), 0) as total FROM invoices WHERE status IN ('draft', 'confirmed')`).get() as any).total;
  
  const overdueStats = db.query(`
    SELECT COUNT(*) as count, COALESCE(SUM(total_amount - amount_paid), 0) as amount
    FROM invoices
    WHERE status != 'paid' AND status != 'cancelled' AND due_date < ?
  `).get(today) as any;

  // 2. Monthly Revenue Trend (Last 6 months)
  const monthlyRevenue = db.query(`
    SELECT strftime('%Y-%m', payment_date) as month, SUM(amount) as revenue
    FROM payments
    WHERE status = 'completed'
    GROUP BY month
    ORDER BY month ASC
    LIMIT 6
  `).all();

  // 3. Payment Method Distribution
  const paymentMethods = db.query(`
    SELECT payment_method, COUNT(*) as count, SUM(amount) as total
    FROM payments
    GROUP BY payment_method
  `).all();

  // 4. Subscriptions by Status
  const subscriptionStatus = db.query(`
    SELECT status, COUNT(*) as count
    FROM subscriptions
    GROUP BY status
  `).all();

  // 5. Recent Activity: Latest payments and invoices
  const recentPayments = db.query(`
    SELECT p.*, c.name as customer_name, i.invoice_number
    FROM payments p
    JOIN customers c ON p.customer_id = c.id
    JOIN invoices i ON p.invoice_id = i.id
    ORDER BY p.id DESC
    LIMIT 5
  `).all();

  const overdueInvoices = db.query(`
    SELECT i.*, c.name as customer_name, c.company as customer_company
    FROM invoices i
    JOIN customers c ON i.customer_id = c.id
    WHERE i.status != 'paid' AND i.status != 'cancelled' AND i.due_date < ?
    ORDER BY i.due_date ASC
    LIMIT 5
  `).all(today);

  const durationMs = Math.round((performance.now() - startTime) * 100) / 100;

  return res.json({
    kpis: {
      activeSubscriptions: activeSubsCount,
      revenueReceived,
      outstandingAmount,
      overdueInvoicesCount: overdueStats.count,
      overdueAmount: overdueStats.amount
    },
    monthlyRevenue,
    paymentMethods,
    subscriptionStatus,
    recentPayments,
    overdueInvoices,
    performance: {
      queryTimeMs: durationMs,
      target: '< 2000ms',
      status: durationMs < 2000 ? 'optimal' : 'degraded'
    }
  });
});

// Serve frontend static build if dist exists
const distPath = path.resolve(process.cwd(), 'dist');
app.use(express.static(distPath));
app.use((req: Request, res: Response, next) => {
  if (req.path.startsWith('/api')) return next();
  const indexPath = path.join(distPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) next();
  });
});

app.listen(PORT, () => {
  console.log(`Brightloop SMS Backend API listening on http://localhost:${PORT}`);
});
