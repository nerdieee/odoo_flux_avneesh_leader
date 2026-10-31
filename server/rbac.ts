import { db } from './db';

export interface PermissionDef {
  module: string;
  action: string;
  permission_key: string;
  description: string;
}

export interface RoleDef {
  name: string;
  code: string;
  description: string;
  is_system_role: number;
  permissions: string[];
}

export const CENTRAL_PERMISSION_REGISTRY: PermissionDef[] = [
  // 1. Customers Module
  { module: 'Customers', action: 'view', permission_key: 'customers.view', description: 'View customer accounts and profiles' },
  { module: 'Customers', action: 'create', permission_key: 'customers.create', description: 'Create new customer accounts' },
  { module: 'Customers', action: 'edit', permission_key: 'customers.edit', description: 'Edit customer information and contacts' },
  { module: 'Customers', action: 'delete', permission_key: 'customers.delete', description: 'Archive or remove customer accounts' },

  // 2. Quotations Module
  { module: 'Quotations', action: 'view', permission_key: 'quotations.view', description: 'View sales quotations and draft proposals' },
  { module: 'Quotations', action: 'create', permission_key: 'quotations.create', description: 'Draft new sales quotations' },
  { module: 'Quotations', action: 'edit', permission_key: 'quotations.edit', description: 'Edit quotations, discounts, and custom pricing' },
  { module: 'Quotations', action: 'delete', permission_key: 'quotations.delete', description: 'Delete or cancel draft quotations' },
  { module: 'Quotations', action: 'confirm', permission_key: 'quotations.confirm', description: 'Confirm quotation and convert to live subscription' },

  // 3. Quotation Templates Module
  { module: 'Quotation Templates', action: 'view', permission_key: 'templates.view', description: 'View pre-configured quotation templates' },
  { module: 'Quotation Templates', action: 'create', permission_key: 'templates.create', description: 'Create new reusable quotation templates' },
  { module: 'Quotation Templates', action: 'edit', permission_key: 'templates.edit', description: 'Edit quotation template line items and terms' },
  { module: 'Quotation Templates', action: 'delete', permission_key: 'templates.delete', description: 'Delete quotation templates' },

  // 4. Subscriptions Module
  { module: 'Subscriptions', action: 'view', permission_key: 'subscriptions.view', description: 'View subscriptions and recurring lifecycles' },
  { module: 'Subscriptions', action: 'create', permission_key: 'subscriptions.create', description: 'Provision new subscriptions' },
  { module: 'Subscriptions', action: 'edit', permission_key: 'subscriptions.edit', description: 'Edit subscription plans, seats, and terms' },
  { module: 'Subscriptions', action: 'pause', permission_key: 'subscriptions.pause', description: 'Temporarily pause active subscriptions' },
  { module: 'Subscriptions', action: 'resume', permission_key: 'subscriptions.resume', description: 'Resume paused subscriptions' },
  { module: 'Subscriptions', action: 'close', permission_key: 'subscriptions.close', description: 'Close subscriptions early' },
  { module: 'Subscriptions', action: 'renew', permission_key: 'subscriptions.renew', description: 'Renew and reopen closed subscriptions' },

  // 5. Invoices Module
  { module: 'Invoices', action: 'view', permission_key: 'invoices.view', description: 'View tax invoices, balances, and overdue statuses' },
  { module: 'Invoices', action: 'create', permission_key: 'invoices.create', description: 'Generate manual or ad-hoc invoices' },
  { module: 'Invoices', action: 'edit', permission_key: 'invoices.edit', description: 'Edit draft invoices and billing dates' },
  { module: 'Invoices', action: 'delete', permission_key: 'invoices.delete', description: 'Delete draft invoices' },
  { module: 'Invoices', action: 'confirm', permission_key: 'invoices.confirm', description: 'Confirm draft invoices and mark due for payment' },
  { module: 'Invoices', action: 'cancel', permission_key: 'invoices.cancel', description: 'Cancel unpaid or disputed invoices' },
  { module: 'Invoices', action: 'download', permission_key: 'invoices.download', description: 'Print and download official tax invoice PDFs' },

  // 6. Payments Module
  { module: 'Payments', action: 'view', permission_key: 'payments.view', description: 'View payment transactions and reconciliation history' },
  { module: 'Payments', action: 'record', permission_key: 'payments.record', description: 'Record manual, bank transfer, and UPI payments' },
  { module: 'Payments', action: 'edit', permission_key: 'payments.edit', description: 'Edit payment transaction notes and references' },
  { module: 'Payments', action: 'refund', permission_key: 'payments.refund', description: 'Process payment refunds' },

  // 7. Products & Variants Module
  { module: 'Products', action: 'view', permission_key: 'products.view', description: 'View product catalog and variants' },
  { module: 'Products', action: 'create', permission_key: 'products.create', description: 'Create products and custom variants' },
  { module: 'Products', action: 'edit', permission_key: 'products.edit', description: 'Edit product specifications and prices' },
  { module: 'Products', action: 'delete', permission_key: 'products.delete', description: 'Archive or remove products' },

  // 8. Plans Module
  { module: 'Plans', action: 'view', permission_key: 'plans.view', description: 'View subscription plans and frequencies' },
  { module: 'Plans', action: 'create', permission_key: 'plans.create', description: 'Create new subscription plans' },
  { module: 'Plans', action: 'edit', permission_key: 'plans.edit', description: 'Edit subscription plans, pricing, and seat rules' },
  { module: 'Plans', action: 'delete', permission_key: 'plans.delete', description: 'Delete unused subscription plans' },

  // 9. Discounts & Promotions Module
  { module: 'Discounts', action: 'view', permission_key: 'discounts.view', description: 'View promotion and coupon rules' },
  { module: 'Discounts', action: 'create', permission_key: 'discounts.create', description: 'Create new coupon and discount rules' },
  { module: 'Discounts', action: 'edit', permission_key: 'discounts.edit', description: 'Edit discount rates, limits, and quotas' },
  { module: 'Discounts', action: 'delete', permission_key: 'discounts.delete', description: 'Delete discount rules' },
  { module: 'Discounts', action: 'toggle', permission_key: 'discounts.toggle', description: 'Enable or disable discount rules' },

  // 10. Financial Reports Module
  { module: 'Reports', action: 'view', permission_key: 'reports.view', description: 'View financial analytics, MRR, churn, and revenue charts' },
  { module: 'Reports', action: 'export', permission_key: 'reports.export', description: 'Export financial reports and data summaries' },

  // 11. Staff & Access Management Module
  { module: 'Staff Management', action: 'view', permission_key: 'staff.view', description: 'View staff directory and profiles' },
  { module: 'Staff Management', action: 'create', permission_key: 'staff.create', description: 'Create staff accounts and send invitations' },
  { module: 'Staff Management', action: 'edit', permission_key: 'staff.edit', description: 'Edit staff member profiles and designations' },
  { module: 'Staff Management', action: 'delete', permission_key: 'staff.delete', description: 'Remove staff accounts' },
  { module: 'Staff Management', action: 'manage_roles', permission_key: 'staff.manage_roles', description: 'Create, edit, duplicate, and delete custom roles' },
  { module: 'Staff Management', action: 'manage_permissions', permission_key: 'staff.manage_permissions', description: 'Assign role permissions and individual user overrides' },
  { module: 'Staff Management', action: 'reset_password', permission_key: 'staff.reset_password', description: 'Reset employee passwords and force credentials setup' },

  // 12. Security, Audit & Login History
  { module: 'Audit Logs', action: 'view', permission_key: 'audit_logs.view', description: 'View immutable system audit logs' },
  { module: 'Login History', action: 'view', permission_key: 'login_history.view', description: 'View employee login history and active sessions' },

  // 13. System Settings
  { module: 'Settings', action: 'view', permission_key: 'settings.view', description: 'View system and tax settings' },
  { module: 'Settings', action: 'edit', permission_key: 'settings.edit', description: 'Configure default tax % and company settings' }
];

export const PREDEFINED_ROLES: RoleDef[] = [
  {
    name: 'Super Admin',
    code: 'SUPER_ADMIN',
    description: 'Full unrestricted administrative control over all platform modules, security policies, staff, and financial data.',
    is_system_role: 1,
    permissions: CENTRAL_PERMISSION_REGISTRY.map(p => p.permission_key)
  },
  {
    name: 'Sales Manager',
    code: 'SALES_MANAGER',
    description: 'Supervises sales pipelines, customer relations, custom quotes, and quotation templates.',
    is_system_role: 1,
    permissions: [
      'customers.view', 'customers.create', 'customers.edit', 'customers.delete',
      'quotations.view', 'quotations.create', 'quotations.edit', 'quotations.delete', 'quotations.confirm',
      'templates.view', 'templates.create', 'templates.edit', 'templates.delete',
      'products.view', 'plans.view', 'discounts.view', 'subscriptions.view', 'reports.view'
    ]
  },
  {
    name: 'Sales Executive',
    code: 'SALES_EXEC',
    description: 'Handles customer proposals, customer onboarding, and quotation drafting.',
    is_system_role: 1,
    permissions: [
      'customers.view', 'customers.create', 'customers.edit',
      'quotations.view', 'quotations.create', 'quotations.edit', 'quotations.confirm',
      'templates.view', 'products.view', 'plans.view', 'subscriptions.view'
    ]
  },
  {
    name: 'Finance Manager',
    code: 'FINANCE_MANAGER',
    description: 'Oversees revenue reconciliation, invoice confirmation, payments, refunds, and financial reporting.',
    is_system_role: 1,
    permissions: [
      'invoices.view', 'invoices.create', 'invoices.edit', 'invoices.delete', 'invoices.confirm', 'invoices.cancel', 'invoices.download',
      'payments.view', 'payments.record', 'payments.edit', 'payments.refund',
      'reports.view', 'reports.export', 'customers.view', 'subscriptions.view', 'discounts.view', 'settings.view'
    ]
  },
  {
    name: 'Finance Executive',
    code: 'FINANCE_EXEC',
    description: 'Processes day-to-day invoice records, records incoming payments, and views receipts.',
    is_system_role: 1,
    permissions: [
      'invoices.view', 'invoices.create', 'invoices.confirm', 'invoices.download',
      'payments.view', 'payments.record', 'customers.view', 'subscriptions.view', 'reports.view'
    ]
  },
  {
    name: 'Support Executive',
    code: 'SUPPORT_EXEC',
    description: 'Assists customers with account lookups, queries, and subscription details.',
    is_system_role: 1,
    permissions: [
      'customers.view', 'subscriptions.view', 'invoices.view', 'invoices.download'
    ]
  },
  {
    name: 'Operations Manager',
    code: 'OPS_MANAGER',
    description: 'Manages subscription lifecycle (pause/resume/renew), product catalog, and recurring plans.',
    is_system_role: 1,
    permissions: [
      'subscriptions.view', 'subscriptions.create', 'subscriptions.edit', 'subscriptions.pause', 'subscriptions.resume', 'subscriptions.close', 'subscriptions.renew',
      'products.view', 'products.create', 'products.edit',
      'plans.view', 'plans.create', 'plans.edit',
      'customers.view', 'invoices.view', 'reports.view'
    ]
  }
];

export function initRbacSchema() {
  // 1. Extend users table with RBAC attributes
  try { db.run("ALTER TABLE users ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1"); } catch {}
  try { db.run("ALTER TABLE users ADD COLUMN must_change_password INTEGER NOT NULL DEFAULT 0"); } catch {}
  try { db.run("ALTER TABLE users ADD COLUMN designation TEXT"); } catch {}
  try { db.run("ALTER TABLE users ADD COLUMN department TEXT"); } catch {}
  try { db.run("ALTER TABLE users ADD COLUMN last_login_at TEXT"); } catch {}
  try { db.run("ALTER TABLE users ADD COLUMN updated_at TEXT"); } catch {}

  // 2. Extend staff table with status and role_id
  try { db.run("ALTER TABLE staff ADD COLUMN status TEXT NOT NULL DEFAULT 'active'"); } catch {}
  try { db.run("ALTER TABLE staff ADD COLUMN role_id INTEGER REFERENCES roles(id)"); } catch {}

  // 3. Create RBAC tables
  db.run(`
    CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      code TEXT UNIQUE NOT NULL,
      description TEXT,
      is_system_role INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS permissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      module TEXT NOT NULL,
      action TEXT NOT NULL,
      permission_key TEXT UNIQUE NOT NULL,
      description TEXT NOT NULL
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS user_roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL,
      UNIQUE(user_id, role_id)
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS role_permissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
      permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL,
      UNIQUE(role_id, permission_id)
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS user_permissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
      effect TEXT NOT NULL CHECK(effect IN ('GRANT', 'REVOKE')),
      created_at TEXT NOT NULL,
      UNIQUE(user_id, permission_id)
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      actor_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      actor_name TEXT NOT NULL,
      action TEXT NOT NULL,
      module TEXT NOT NULL,
      target_type TEXT,
      target_id TEXT,
      details TEXT,
      ip_address TEXT,
      created_at TEXT NOT NULL
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS login_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      session_identifier TEXT UNIQUE NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      login_at TEXT NOT NULL,
      last_activity_at TEXT NOT NULL,
      logout_at TEXT,
      is_active INTEGER NOT NULL DEFAULT 1
    );
  `);

  // 4. Create Indexes
  db.run(`CREATE INDEX IF NOT EXISTS idx_perm_key ON permissions(permission_key);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_user_roles_uid ON user_roles(user_id);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_role_perms_rid ON role_permissions(role_id);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_user_perms_uid ON user_permissions(user_id);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_sessions_active ON login_sessions(is_active);`);

  // 5. Seed default permissions and roles
  seedRbacDefaults();
}

export function seedRbacDefaults() {
  const now = new Date().toISOString();

  // 1. Seed / Sync permissions
  const insertPermStmt = db.prepare(`
    INSERT OR IGNORE INTO permissions (module, action, permission_key, description)
    VALUES (?, ?, ?, ?)
  `);
  for (const perm of CENTRAL_PERMISSION_REGISTRY) {
    insertPermStmt.run(perm.module, perm.action, perm.permission_key, perm.description);
  }

  // Map permission_key -> id
  const allPerms = db.query('SELECT id, permission_key FROM permissions').all() as { id: number; permission_key: string }[];
  const permMap = new Map<string, number>();
  for (const p of allPerms) {
    permMap.set(p.permission_key, p.id);
  }

  // 2. Seed / Sync predefined roles
  const insertRoleStmt = db.prepare(`
    INSERT OR IGNORE INTO roles (name, code, description, is_system_role, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertRolePermStmt = db.prepare(`
    INSERT OR IGNORE INTO role_permissions (role_id, permission_id, created_at)
    VALUES (?, ?, ?)
  `);

  for (const roleDef of PREDEFINED_ROLES) {
    insertRoleStmt.run(roleDef.name, roleDef.code, roleDef.description, roleDef.is_system_role, now, now);
    const roleRow = db.query('SELECT id FROM roles WHERE code = ?').get(roleDef.code) as { id: number } | null;
    if (roleRow) {
      for (const pKey of roleDef.permissions) {
        const pId = permMap.get(pKey);
        if (pId) {
          insertRolePermStmt.run(roleRow.id, pId, now);
        }
      }
    }
  }

  // 3. Ensure Super Admin user (id 1) is assigned Super Admin role
  const adminUser = db.query("SELECT id FROM users WHERE role = 'admin'").get() as { id: number } | null;
  const adminRole = db.query("SELECT id FROM roles WHERE code = 'SUPER_ADMIN'").get() as { id: number } | null;
  if (adminUser && adminRole) {
    db.run(`
      INSERT OR IGNORE INTO user_roles (user_id, role_id, created_at)
      VALUES (?, ?, ?)
    `, [adminUser.id, adminRole.id, now]);
  }

  // 4. Ensure default staff user (id 2) is assigned Sales Executive role
  const staffUser = db.query("SELECT id FROM users WHERE email = 'staff@brightloop.com'").get() as { id: number } | null;
  const salesExecRole = db.query("SELECT id FROM roles WHERE code = 'SALES_EXEC'").get() as { id: number } | null;
  if (staffUser && salesExecRole) {
    db.run(`
      INSERT OR IGNORE INTO user_roles (user_id, role_id, created_at)
      VALUES (?, ?, ?)
    `, [staffUser.id, salesExecRole.id, now]);

    db.run(`
      UPDATE staff SET role_id = ? WHERE user_id = ? AND (role_id IS NULL OR role_id = 0)
    `, [salesExecRole.id, staffUser.id]);
  }
}

/**
 * Calculates effective permissions for any user:
 * Effective Permissions = Role Permissions + Individual Grants - Individual Revocations
 *
 * Rules:
 * - Inactive users have zero permissions (immediate revocation).
 * - Super Admin always retains complete, unrestricted permissions.
 * - User-level revocation strictly overrides role-level grant.
 */
export function getEffectivePermissions(userId: number): Set<string> {
  const user = db.query('SELECT * FROM users WHERE id = ?').get(userId) as any;
  if (!user || user.is_active === 0) {
    return new Set<string>();
  }

  // Super Admin always has all permissions across the entire platform
  if (user.role === 'admin') {
    const all = db.query('SELECT permission_key FROM permissions').all() as any[];
    return new Set<string>(all.map(p => p.permission_key));
  }

  // 1. Permissions inherited from all assigned roles
  const rolePerms = db.query(`
    SELECT DISTINCT p.permission_key
    FROM user_roles ur
    JOIN role_permissions rp ON ur.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = ?
  `).all(userId) as any[];

  const effective = new Set<string>(rolePerms.map(p => p.permission_key));

  // 2. Individual user overrides (GRANTs and REVOKEs)
  const overrides = db.query(`
    SELECT p.permission_key, up.effect
    FROM user_permissions up
    JOIN permissions p ON up.permission_id = p.id
    WHERE up.user_id = ?
  `).all(userId) as any[];

  for (const o of overrides) {
    if (o.effect === 'GRANT') {
      effective.add(o.permission_key);
    } else if (o.effect === 'REVOKE') {
      effective.delete(o.permission_key);
    }
  }

  return effective;
}

export function hasPermission(userId: number, permissionKey: string): boolean {
  const perms = getEffectivePermissions(userId);
  return perms.has(permissionKey);
}

export function logAudit(
  actorUserId: number | null,
  actorName: string,
  action: string,
  module: string,
  details: string,
  targetType?: string,
  targetId?: string,
  ipAddress?: string
) {
  try {
    db.run(`
      INSERT INTO audit_logs (actor_user_id, actor_name, action, module, target_type, target_id, details, ip_address, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      actorUserId || null,
      actorName || 'System',
      action,
      module,
      targetType || null,
      targetId || null,
      details,
      ipAddress || '127.0.0.1',
      new Date().toISOString()
    ]);
  } catch (err) {
    console.error('Audit logging failed:', err);
  }
}

export function recordLoginSession(
  userId: number,
  sessionIdentifier: string,
  ipAddress: string,
  userAgent: string
) {
  const now = new Date().toISOString();
  try {
    db.run(`
      INSERT INTO login_sessions (user_id, session_identifier, ip_address, user_agent, login_at, last_activity_at, is_active)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `, [userId, sessionIdentifier, ipAddress || '127.0.0.1', userAgent || 'Unknown Browser', now, now]);
  } catch (err) {
    console.error('Session record failed:', err);
  }
}

export function revokeUserSessions(userId: number) {
  const now = new Date().toISOString();
  try {
    db.run(`
      UPDATE login_sessions
      SET is_active = 0, logout_at = ?
      WHERE user_id = ? AND is_active = 1
    `, [now, userId]);
  } catch (err) {
    console.error('Session revocation failed:', err);
  }
}

