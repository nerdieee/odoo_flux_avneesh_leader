import { Router, Request, Response } from 'express';
import { db, hashPassword } from './db';
import {
  CENTRAL_PERMISSION_REGISTRY,
  getEffectivePermissions,
  hasPermission,
  logAudit,
  recordLoginSession,
  revokeUserSessions
} from './rbac';
import * as crypto from 'crypto';

export const rbacRouter = Router();

// Password strength validator helper
function validatePassword(pass: string): { valid: boolean; message?: string } {
  if (!pass || pass.length <= 8) {
    return { valid: false, message: 'Password must be greater than 8 characters.' };
  }
  if (!/[A-Z]/.test(pass)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter.' };
  }
  if (!/[a-z]/.test(pass)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter.' };
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pass)) {
    return { valid: false, message: 'Password must contain at least one special character.' };
  }
  return { valid: true };
}

// Middleware: Permission verification
export function requirePerm(permissionKey: string, allowCustomerSelfService = false) {
  return (req: Request, res: Response, next: Function) => {
    const userRole = (req.headers['x-user-role'] as string) || '';
    const userId = Number(req.headers['x-user-id'] || 0);

    // Super Admin retains complete, unrestricted control over the entire SaaS application
    if (userRole === 'admin') {
      return next();
    }

    // Allow customers on their own self-service endpoints (invoices, subscriptions, payments)
    if (allowCustomerSelfService && userRole === 'customer') {
      return next();
    }

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required. Missing user identity.' });
    }

    const user = db.query('SELECT * FROM users WHERE id = ?').get(userId) as any;
    if (!user || user.is_active === 0) {
      return res.status(403).json({ error: 'Your account is deactivated or invalid. Access revoked.' });
    }

    if (user.role === 'admin') {
      return next();
    }

    // Customers cannot access internal staff administrative endpoints
    if (user.role === 'customer') {
      return res.status(403).json({ error: 'Access Denied: Customer accounts cannot access internal administrative resources.' });
    }

    const effective = getEffectivePermissions(userId);
    if (!effective.has(permissionKey)) {
      return res.status(403).json({
        error: `Access Denied: You do not possess the required permission (${permissionKey}) for this operation.`,
        required_permission: permissionKey
      });
    }

    next();
  };
}

// ----------------------------------------------------------------------
// 1. AUTHENTICATION & SESSION PROFILE
// ----------------------------------------------------------------------

// GET /api/auth/me - Current user details, role and fresh effective permissions
rbacRouter.get('/auth/me', (req: Request, res: Response) => {
  const userId = Number(req.headers['x-user-id'] || 0);
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const user = db.query(`
    SELECT u.id, u.email, u.name, u.role, u.customer_id, u.created_at,
           u.is_active, u.must_change_password, u.department, u.designation, u.last_login_at,
           c.company, c.phone, c.gst_number
    FROM users u
    LEFT JOIN customers c ON u.customer_id = c.id
    WHERE u.id = ?
  `).get(userId) as any;

  if (!user || user.is_active === 0) {
    return res.status(403).json({ error: 'Account not found or deactivated.' });
  }

  const roleInfo = db.query(`
    SELECT r.id as role_id, r.name as role_name, r.code as role_code
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = ?
    LIMIT 1
  `).get(user.id) as any;

  const permissions = Array.from(getEffectivePermissions(user.id));

  return res.json({
    user: {
      ...user,
      role_id: roleInfo?.role_id || (user.role === 'admin' ? 1 : null),
      role_name: roleInfo?.role_name || (user.role === 'admin' ? 'Super Admin' : user.role === 'staff' ? 'Staff Member' : 'Customer'),
      role_code: roleInfo?.role_code || (user.role === 'admin' ? 'SUPER_ADMIN' : null),
      permissions
    }
  });
});

// POST /api/auth/change-password - First-time login forced password change or self-service
rbacRouter.post('/auth/change-password', (req: Request, res: Response) => {
  const userId = Number(req.headers['x-user-id'] || req.body.user_id || 0);
  const { current_password, new_password } = req.body;

  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  if (!new_password) {
    return res.status(400).json({ error: 'New password is required' });
  }

  const passCheck = validatePassword(new_password);
  if (!passCheck.valid) {
    return res.status(400).json({ error: passCheck.message });
  }

  const user = db.query('SELECT * FROM users WHERE id = ?').get(userId) as any;
  if (!user || user.is_active === 0) {
    return res.status(404).json({ error: 'User not found or deactivated.' });
  }

  // If user was not forced to change password on first login, check current password
  if (user.must_change_password === 0 && current_password) {
    if (hashPassword(current_password) !== user.password_hash) {
      return res.status(400).json({ error: 'Current password does not match.' });
    }
  }

  const newHash = hashPassword(new_password);
  const now = new Date().toISOString();

  db.run(`
    UPDATE users
    SET password_hash = ?, must_change_password = 0, updated_at = ?
    WHERE id = ?
  `, [newHash, now, user.id]);

  logAudit(user.id, user.name, 'PASSWORD_CHANGE', 'Authentication', 'User successfully updated their password', 'User', String(user.id), req.ip);

  return res.json({ success: true, message: 'Password updated successfully. You now have full access.' });
});

// POST /api/auth/logout - Invalidate session
rbacRouter.post('/auth/logout', (req: Request, res: Response) => {
  const userId = Number(req.headers['x-user-id'] || 0);
  if (userId) {
    revokeUserSessions(userId);
    const user = db.query('SELECT name FROM users WHERE id = ?').get(userId) as any;
    logAudit(userId, user?.name || 'User', 'LOGOUT', 'Authentication', 'User logged out', 'User', String(userId), req.ip);
  }
  return res.json({ success: true, message: 'Logged out successfully' });
});

// ----------------------------------------------------------------------
// 2. STAFF MANAGEMENT APIS
// ----------------------------------------------------------------------

// GET /api/staff - Comprehensive staff directory with roles and overrides
rbacRouter.get('/staff', requirePerm('staff.view'), (req: Request, res: Response) => {
  const search = ((req.query.search as string) || '').toLowerCase().trim();
  const roleFilter = (req.query.role_id as string) || '';
  const statusFilter = (req.query.status as string) || '';
  const departmentFilter = (req.query.department as string) || '';

  let sql = `
    SELECT s.id as staff_id, s.user_id, s.name, s.email, s.department, s.title as designation,
           s.phone, s.created_at, s.status as staff_status,
           u.is_active, u.must_change_password, u.last_login_at,
           r.id as role_id, r.name as role_name, r.code as role_code,
           (SELECT COUNT(*) FROM user_permissions up WHERE up.user_id = s.user_id) as overrides_count
    FROM staff s
    JOIN users u ON s.user_id = u.id
    LEFT JOIN user_roles ur ON u.id = ur.user_id
    LEFT JOIN roles r ON ur.role_id = r.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (search) {
    sql += ` AND (LOWER(s.name) LIKE ? OR LOWER(s.email) LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }
  if (roleFilter) {
    sql += ` AND r.id = ?`;
    params.push(Number(roleFilter));
  }
  if (statusFilter) {
    if (statusFilter === 'active') sql += ` AND u.is_active = 1`;
    if (statusFilter === 'inactive') sql += ` AND u.is_active = 0`;
  }
  if (departmentFilter) {
    sql += ` AND s.department = ?`;
    params.push(departmentFilter);
  }

  sql += ` ORDER BY s.id DESC`;

  const staffList = db.query(sql).all(...params) as any[];

  // Attach effective permissions count
  const enriched = staffList.map(st => ({
    ...st,
    status: st.is_active ? 'active' : 'inactive',
    effective_permissions_count: getEffectivePermissions(st.user_id).size
  }));

  return res.json(enriched);
});

// POST /api/staff - Super Admin creates a new staff account
rbacRouter.post('/staff', requirePerm('staff.create'), (req: Request, res: Response) => {
  const actorId = Number(req.headers['x-user-id'] || 0);
  const actorName = (req.headers['x-user-name'] as string) || 'Administrator';

  const { name, email, phone, department, designation, role_id, custom_password } = req.body;

  if (!name || !email || !department || !role_id) {
    return res.status(400).json({ error: 'Name, email, department, and role assignment are required.' });
  }

  const cleanEmail = email.toLowerCase().trim();
  const existingUser = db.query('SELECT id FROM users WHERE email = ?').get(cleanEmail);
  if (existingUser) {
    return res.status(400).json({ error: `An account with email ${cleanEmail} already exists.` });
  }

  const role = db.query('SELECT * FROM roles WHERE id = ?').get(Number(role_id)) as any;
  if (!role) {
    return res.status(400).json({ error: 'Selected role was not found.' });
  }

  // Generate secure temporary password if not provided
  const tempPassword = custom_password && custom_password.trim()
    ? custom_password.trim()
    : 'Bright#' + crypto.randomBytes(4).toString('hex') + '26';

  const passCheck = validatePassword(tempPassword);
  if (!passCheck.valid) {
    return res.status(400).json({ error: passCheck.message });
  }

  const passwordHash = hashPassword(tempPassword);
  const now = new Date().toISOString();

  const createStaffTx = db.transaction(() => {
    // 1. Create user with must_change_password = 1
    const resUser = db.run(`
      INSERT INTO users (email, password_hash, name, role, customer_id, is_active, must_change_password, department, designation, created_at, updated_at)
      VALUES (?, ?, ?, 'staff', NULL, 1, 1, ?, ?, ?, ?)
    `, [cleanEmail, passwordHash, name.trim(), department.trim(), (designation || role.name).trim(), now, now]);

    const newUserId = resUser.lastInsertRowid as number;

    // 2. Create staff record
    const resStaff = db.run(`
      INSERT INTO staff (user_id, name, email, department, title, phone, status, role_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?)
    `, [newUserId, name.trim(), cleanEmail, department.trim(), (designation || role.name).trim(), phone || '', role.id, now]);

    // 3. Assign role
    db.run(`
      INSERT INTO user_roles (user_id, role_id, created_at)
      VALUES (?, ?, ?)
    `, [newUserId, role.id, now]);

    return { userId: newUserId, staffId: resStaff.lastInsertRowid };
  });

  try {
    const result = createStaffTx();

    logAudit(actorId, actorName, 'STAFF_CREATED', 'Staff Management', `Created staff account for ${name} (${cleanEmail}) with role ${role.name}`, 'Staff', String(result.staffId), req.ip);

    return res.json({
      success: true,
      message: `Staff account created successfully for ${name}.`,
      temporary_password: tempPassword,
      staff_id: result.staffId,
      user_id: result.userId,
      staff: {
        id: result.staffId,
        user_id: result.userId,
        name,
        email: cleanEmail,
        department,
        title: designation || 'Staff Member',
        is_active: 1,
        must_change_password: 1
      }
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to create staff account: ' + err.message });
  }
});

// GET /api/staff/:id - Retrieve specific staff profile with permissions
rbacRouter.get('/staff/:id', requirePerm('staff.view'), (req: Request, res: Response) => {
  const staffId = Number(req.params.id);
  const staff = db.query(`
    SELECT s.id as staff_id, s.user_id, s.name, s.email, s.department, s.title as designation,
           s.phone, s.created_at, s.status as staff_status,
           u.is_active, u.must_change_password, u.last_login_at,
           r.id as role_id, r.name as role_name, r.code as role_code
    FROM staff s
    JOIN users u ON s.user_id = u.id
    LEFT JOIN user_roles ur ON u.id = ur.user_id
    LEFT JOIN roles r ON ur.role_id = r.id
    WHERE s.id = ? OR s.user_id = ?
  `).get(staffId, staffId) as any;

  if (!staff) {
    return res.status(404).json({ error: 'Staff member not found.' });
  }

  const effective = Array.from(getEffectivePermissions(staff.user_id));

  return res.json({
    ...staff,
    effective_permissions: effective
  });
});

// PUT /api/staff/:id - Edit staff information and role assignment
rbacRouter.put('/staff/:id', requirePerm('staff.edit'), (req: Request, res: Response) => {
  const actorId = Number(req.headers['x-user-id'] || 0);
  const actorName = (req.headers['x-user-name'] as string) || 'Administrator';
  const staffId = Number(req.params.id);

  const staff = (db.query('SELECT * FROM staff WHERE id = ?').get(staffId) ||
                 db.query('SELECT * FROM staff WHERE user_id = ?').get(staffId)) as any;
  if (!staff) {
    return res.status(404).json({ error: 'Staff account not found.' });
  }

  const { name, email, phone, department, designation, role_id } = req.body;
  const now = new Date().toISOString();

  // If email changed, verify uniqueness
  if (email && email.toLowerCase().trim() !== staff.email) {
    const conflict = db.query('SELECT id FROM users WHERE email = ? AND id != ?').get(email.toLowerCase().trim(), staff.user_id);
    if (conflict) {
      return res.status(400).json({ error: 'Another user account with this email already exists.' });
    }
  }

  const cleanName = name ? name.trim() : staff.name;
  const cleanEmail = email ? email.toLowerCase().trim() : staff.email;
  const cleanDept = department ? department.trim() : staff.department;
  const cleanTitle = designation ? designation.trim() : staff.title;
  const cleanPhone = phone !== undefined ? phone : staff.phone;

  const updateTx = db.transaction(() => {
    // 1. Update staff table
    db.run(`
      UPDATE staff
      SET name = ?, email = ?, department = ?, title = ?, phone = ?, role_id = ?
      WHERE id = ?
    `, [cleanName, cleanEmail, cleanDept, cleanTitle, cleanPhone, role_id || staff.role_id, staff.id]);

    // 2. Update users table
    db.run(`
      UPDATE users
      SET name = ?, email = ?, department = ?, designation = ?, updated_at = ?
      WHERE id = ?
    `, [cleanName, cleanEmail, cleanDept, cleanTitle, now, staff.user_id]);

    // 3. Update user_roles if role_id provided
    if (role_id) {
      db.run('DELETE FROM user_roles WHERE user_id = ?', [staff.user_id]);
      db.run('INSERT INTO user_roles (user_id, role_id, created_at) VALUES (?, ?, ?)', [staff.user_id, Number(role_id), now]);
    }
  });

  try {
    updateTx();
    logAudit(actorId, actorName, 'STAFF_UPDATED', 'Staff Management', `Updated staff profile for ${cleanName} (${cleanEmail})`, 'Staff', String(staff.id), req.ip);
    return res.json({ success: true, message: `Staff profile for ${cleanName} updated successfully.` });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update staff: ' + err.message });
  }
});

// PATCH /api/staff/:id/status - Activate or Deactivate staff account
rbacRouter.patch('/staff/:id/status', requirePerm('staff.edit'), (req: Request, res: Response) => {
  const actorId = Number(req.headers['x-user-id'] || 0);
  const actorName = (req.headers['x-user-name'] as string) || 'Administrator';
  const staffId = Number(req.params.id);

  const staff = (db.query('SELECT * FROM staff WHERE id = ?').get(staffId) ||
                 db.query('SELECT * FROM staff WHERE user_id = ?').get(staffId)) as any;
  if (!staff) {
    return res.status(404).json({ error: 'Staff account not found.' });
  }

  // Prevent deactivating admin
  const userRecord = db.query('SELECT * FROM users WHERE id = ?').get(staff.user_id) as any;
  if (userRecord && userRecord.role === 'admin') {
    return res.status(403).json({ error: 'Cannot deactivate the system administrator account.' });
  }

  const { is_active } = req.body;
  const newActive = is_active ? 1 : 0;
  const newStaffStatus = newActive ? 'active' : 'inactive';
  const now = new Date().toISOString();

  db.run(`UPDATE users SET is_active = ?, updated_at = ? WHERE id = ?`, [newActive, now, staff.user_id]);
  db.run(`UPDATE staff SET status = ? WHERE id = ?`, [newStaffStatus, staff.id]);

  // When deactivated: Immediately revoke active login sessions
  if (!newActive) {
    revokeUserSessions(staff.user_id);
  }

  const action = newActive ? 'STAFF_ACTIVATED' : 'STAFF_DEACTIVATED';
  const details = newActive
    ? `Account for ${staff.name} (${staff.email}) was activated.`
    : `Account for ${staff.name} (${staff.email}) was deactivated. Active sessions revoked immediately.`;

  logAudit(actorId, actorName, action, 'Staff Management', details, 'Staff', String(staff.id), req.ip);

  return res.json({
    success: true,
    is_active: Boolean(newActive),
    message: details
  });
});

// POST /api/staff/:id/reset-password - Super Admin resets staff credentials
rbacRouter.post('/staff/:id/reset-password', requirePerm('staff.reset_password'), (req: Request, res: Response) => {
  const actorId = Number(req.headers['x-user-id'] || 0);
  const actorName = (req.headers['x-user-name'] as string) || 'Administrator';
  const staffId = Number(req.params.id);

  const staff = (db.query('SELECT * FROM staff WHERE id = ?').get(staffId) ||
                 db.query('SELECT * FROM staff WHERE user_id = ?').get(staffId)) as any;
  if (!staff) {
    return res.status(404).json({ error: 'Staff account not found.' });
  }

  // Generate strong temporary password
  const tempPassword = 'Reset#' + crypto.randomBytes(4).toString('hex') + '26';
  const passHash = hashPassword(tempPassword);
  const now = new Date().toISOString();

  db.run(`
    UPDATE users
    SET password_hash = ?, must_change_password = 1, updated_at = ?
    WHERE id = ?
  `, [passHash, now, staff.user_id]);

  // Invalidate any active sessions
  revokeUserSessions(staff.user_id);

  logAudit(actorId, actorName, 'STAFF_PASSWORD_RESET', 'Staff Management', `Reset password for employee ${staff.name} (${staff.email}). First-login password change enforced.`, 'Staff', String(staff.id), req.ip);

  return res.json({
    success: true,
    message: `Password for ${staff.name} reset successfully. Employee will be forced to change credentials upon next login.`,
    temporary_password: tempPassword
  });
});

// DELETE /api/staff/:id & /api/auth/staff/:id - Remove staff account
const handleDeleteStaffRoute = (req: Request, res: Response) => {
  const actorId = Number(req.headers['x-user-id'] || 0);
  const actorName = (req.headers['x-user-name'] as string) || 'Administrator';
  const staffId = Number(req.params.id);

  if (!staffId || isNaN(staffId)) {
    return res.status(400).json({ error: 'Valid staff ID is required.' });
  }

  // System Administrator account can never be deleted
  const directUser = db.query('SELECT * FROM users WHERE id = ?').get(staffId) as any;
  if (directUser && directUser.role === 'admin') {
    return res.status(403).json({ error: 'System administrator accounts cannot be deleted.' });
  }

  const staff = (db.query('SELECT * FROM staff WHERE id = ?').get(staffId) ||
                 db.query('SELECT * FROM staff WHERE user_id = ?').get(staffId)) as any;
  if (!staff) {
    return res.status(404).json({ error: 'Staff account not found.' });
  }

  const userRecord = db.query('SELECT * FROM users WHERE id = ?').get(staff.user_id) as any;
  if (userRecord && userRecord.role === 'admin') {
    return res.status(403).json({ error: 'System administrator accounts cannot be deleted.' });
  }

  try {
    db.transaction(() => {
      // 1. Revoke and clean up login sessions
      revokeUserSessions(staff.user_id);
      db.run('DELETE FROM login_sessions WHERE user_id = ?', [staff.user_id]);

      // 2. Clear role assignments and permission overrides
      db.run('DELETE FROM user_roles WHERE user_id = ?', [staff.user_id]);
      db.run('DELETE FROM user_permissions WHERE user_id = ?', [staff.user_id]);

      // 3. Nullify inviter references so foreign key checks don't fail
      if (staff.user_id) {
        db.run('UPDATE staff_invitations SET invited_by = NULL WHERE invited_by = ?', [staff.user_id]);
      }

      // 4. Set audit logs actor to NULL
      if (staff.user_id) {
        db.run('UPDATE audit_logs SET actor_user_id = NULL WHERE actor_user_id = ?', [staff.user_id]);
      }

      // 5. Delete from staff table
      db.run('DELETE FROM staff WHERE id = ?', [staff.id]);

      // 6. Delete from users table (clears authentication credentials)
      if (staff.user_id) {
        db.run('DELETE FROM users WHERE id = ?', [staff.user_id]);
      }

      // 7. Revoke any pending invitations for this email
      if (staff.email) {
        db.run("UPDATE staff_invitations SET status = 'revoked' WHERE email = ?", [staff.email]);
      }
    })();

    logAudit(
      actorId,
      actorName,
      'STAFF_DELETE',
      'Staff Management',
      `Deleted staff account for ${staff.name} (${staff.email})`,
      'Staff',
      String(staff.id),
      req.ip
    );

    return res.json({ success: true, message: `Staff member "${staff.name}" has been removed.` });
  } catch (err: any) {
    console.error('Failed to remove staff account:', err);
    return res.status(500).json({ error: 'Failed to delete staff member: ' + (err.message || 'Database error') });
  }
};

rbacRouter.delete('/staff/:id', requirePerm('staff.delete'), handleDeleteStaffRoute);
rbacRouter.delete('/auth/staff/:id', requirePerm('staff.delete'), handleDeleteStaffRoute);

// ----------------------------------------------------------------------
// 3. DYNAMIC ROLE MANAGEMENT APIS
// ----------------------------------------------------------------------

// GET /api/roles - List all roles with user counts and permissions counts
rbacRouter.get('/roles', requirePerm('staff.manage_roles'), (req: Request, res: Response) => {
  const roles = db.query(`
    SELECT r.*,
      (SELECT COUNT(*) FROM user_roles ur WHERE ur.role_id = r.id) as users_count,
      (SELECT COUNT(*) FROM role_permissions rp WHERE rp.role_id = r.id) as permissions_count
    FROM roles r
    ORDER BY r.is_system_role DESC, r.id ASC
  `).all() as any[];

  return res.json(roles);
});

// POST /api/roles - Create custom role
rbacRouter.post('/roles', requirePerm('staff.manage_roles'), (req: Request, res: Response) => {
  const actorId = Number(req.headers['x-user-id'] || 0);
  const actorName = (req.headers['x-user-name'] as string) || 'Administrator';

  const { name, code, description, permission_ids } = req.body;
  if (!name || !code) {
    return res.status(400).json({ error: 'Role name and role code are required.' });
  }

  const cleanCode = code.toUpperCase().trim().replace(/[^A-Z0-9_]/g, '_');
  const existing = db.query('SELECT id FROM roles WHERE code = ? OR name = ?').get(cleanCode, name.trim());
  if (existing) {
    return res.status(400).json({ error: `A role with code ${cleanCode} or name "${name}" already exists.` });
  }

  const now = new Date().toISOString();

  const createRoleTx = db.transaction(() => {
    const resRole = db.run(`
      INSERT INTO roles (name, code, description, is_system_role, created_at, updated_at)
      VALUES (?, ?, ?, 0, ?, ?)
    `, [name.trim(), cleanCode, description || '', now, now]);

    const newRoleId = resRole.lastInsertRowid as number;

    if (Array.isArray(permission_ids) && permission_ids.length > 0) {
      const insertStmt = db.prepare('INSERT INTO role_permissions (role_id, permission_id, created_at) VALUES (?, ?, ?)');
      for (const pId of permission_ids) {
        insertStmt.run(newRoleId, Number(pId), now);
      }
    }

    return newRoleId;
  });

  try {
    const roleId = createRoleTx();
    logAudit(actorId, actorName, 'ROLE_CREATED', 'Role Management', `Created custom role "${name}" (${cleanCode})`, 'Role', String(roleId), req.ip);

    const created = db.query(`
      SELECT r.*,
        (SELECT COUNT(*) FROM user_roles ur WHERE ur.role_id = r.id) as users_count,
        (SELECT COUNT(*) FROM role_permissions rp WHERE rp.role_id = r.id) as permissions_count
      FROM roles r WHERE r.id = ?
    `).get(roleId);

    return res.json(created);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to create role: ' + err.message });
  }
});

// GET /api/roles/:id - Get role with its assigned permission IDs
rbacRouter.get('/roles/:id', requirePerm('staff.manage_roles'), (req: Request, res: Response) => {
  const roleId = Number(req.params.id);
  const role = db.query('SELECT * FROM roles WHERE id = ?').get(roleId) as any;
  if (!role) {
    return res.status(404).json({ error: 'Role not found' });
  }

  const perms = db.query(`
    SELECT p.id, p.permission_key, p.module, p.action, p.description
    FROM role_permissions rp
    JOIN permissions p ON rp.permission_id = p.id
    WHERE rp.role_id = ?
  `).all(roleId) as any[];

  return res.json({
    role,
    permission_ids: perms.map(p => p.id),
    permissions: perms
  });
});

// PUT /api/roles/:id - Edit role details and permissions
rbacRouter.put('/roles/:id', requirePerm('staff.manage_roles'), (req: Request, res: Response) => {
  const actorId = Number(req.headers['x-user-id'] || 0);
  const actorName = (req.headers['x-user-name'] as string) || 'Administrator';
  const roleId = Number(req.params.id);

  const role = db.query('SELECT * FROM roles WHERE id = ?').get(roleId) as any;
  if (!role) {
    return res.status(404).json({ error: 'Role not found' });
  }

  const { name, description, permission_ids } = req.body;
  const now = new Date().toISOString();

  // Super Admin system role protection: Super Admin always retains all permissions
  if (role.code === 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'The Super Admin role is protected and cannot be modified.' });
  }

  const updateRoleTx = db.transaction(() => {
    db.run(`
      UPDATE roles
      SET name = ?, description = ?, updated_at = ?
      WHERE id = ?
    `, [name ? name.trim() : role.name, description !== undefined ? description : role.description, now, roleId]);

    if (Array.isArray(permission_ids)) {
      db.run('DELETE FROM role_permissions WHERE role_id = ?', [roleId]);
      const insertStmt = db.prepare('INSERT INTO role_permissions (role_id, permission_id, created_at) VALUES (?, ?, ?)');
      for (const pId of permission_ids) {
        insertStmt.run(roleId, Number(pId), now);
      }
    }
  });

  try {
    updateRoleTx();
    logAudit(actorId, actorName, 'ROLE_UPDATED', 'Role Management', `Updated role "${name || role.name}" and permission assignments`, 'Role', String(roleId), req.ip);

    const updated = db.query(`
      SELECT r.*,
        (SELECT COUNT(*) FROM user_roles ur WHERE ur.role_id = r.id) as users_count,
        (SELECT COUNT(*) FROM role_permissions rp WHERE rp.role_id = r.id) as permissions_count
      FROM roles r WHERE r.id = ?
    `).get(roleId);

    return res.json(updated);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update role: ' + err.message });
  }
});

// DELETE /api/roles/:id - Delete custom role (guarded against system roles or active assignments)
rbacRouter.delete('/roles/:id', requirePerm('staff.manage_roles'), (req: Request, res: Response) => {
  const actorId = Number(req.headers['x-user-id'] || 0);
  const actorName = (req.headers['x-user-name'] as string) || 'Administrator';
  const roleId = Number(req.params.id);

  const role = db.query('SELECT * FROM roles WHERE id = ?').get(roleId) as any;
  if (!role) {
    return res.status(404).json({ error: 'Role not found' });
  }

  if (role.is_system_role === 1) {
    return res.status(403).json({ error: `Cannot delete system-critical role "${role.name}".` });
  }

  const assignedUsersCount = (db.query('SELECT COUNT(*) as count FROM user_roles WHERE role_id = ?').get(roleId) as any).count;
  if (assignedUsersCount > 0) {
    return res.status(400).json({
      error: `Cannot delete role "${role.name}" because it is currently assigned to ${assignedUsersCount} staff member(s). Please reassign those members first.`
    });
  }

  db.run('DELETE FROM role_permissions WHERE role_id = ?', [roleId]);
  db.run('DELETE FROM roles WHERE id = ?', [roleId]);

  logAudit(actorId, actorName, 'ROLE_DELETED', 'Role Management', `Deleted custom role "${role.name}"`, 'Role', String(roleId), req.ip);

  return res.json({ success: true, message: `Role "${role.name}" deleted successfully.` });
});

// POST /api/roles/:id/duplicate - Duplicate role configuration
rbacRouter.post('/roles/:id/duplicate', requirePerm('staff.manage_roles'), (req: Request, res: Response) => {
  const actorId = Number(req.headers['x-user-id'] || 0);
  const actorName = (req.headers['x-user-name'] as string) || 'Administrator';
  const roleId = Number(req.params.id);

  const sourceRole = db.query('SELECT * FROM roles WHERE id = ?').get(roleId) as any;
  if (!sourceRole) {
    return res.status(404).json({ error: 'Source role not found.' });
  }

  const newName = (req.body.name || `${sourceRole.name} (Copy)`).trim();
  const newCode = (req.body.code || `${sourceRole.code}_COPY_${Date.now().toString().slice(-4)}`).toUpperCase().trim();
  const now = new Date().toISOString();

  const duplicateTx = db.transaction(() => {
    const resRole = db.run(`
      INSERT INTO roles (name, code, description, is_system_role, created_at, updated_at)
      VALUES (?, ?, ?, 0, ?, ?)
    `, [newName, newCode, sourceRole.description || '', now, now]);

    const newRoleId = resRole.lastInsertRowid as number;

    const sourcePerms = db.query('SELECT permission_id FROM role_permissions WHERE role_id = ?').all(roleId) as { permission_id: number }[];
    const insertStmt = db.prepare('INSERT INTO role_permissions (role_id, permission_id, created_at) VALUES (?, ?, ?)');
    for (const sp of sourcePerms) {
      insertStmt.run(newRoleId, sp.permission_id, now);
    }

    return newRoleId;
  });

  try {
    const newId = duplicateTx();
    logAudit(actorId, actorName, 'ROLE_DUPLICATED', 'Role Management', `Duplicated role "${sourceRole.name}" into "${newName}"`, 'Role', String(newId), req.ip);

    const created = db.query(`
      SELECT r.*,
        (SELECT COUNT(*) FROM user_roles ur WHERE ur.role_id = r.id) as users_count,
        (SELECT COUNT(*) FROM role_permissions rp WHERE rp.role_id = r.id) as permissions_count
      FROM roles r WHERE r.id = ?
    `).get(newId);

    return res.json(created);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to duplicate role: ' + err.message });
  }
});

// ----------------------------------------------------------------------
// 4. PERMISSION REGISTRY & USER OVERRIDES
// ----------------------------------------------------------------------

// GET /api/permissions - Centralized permission registry grouped by module
rbacRouter.get('/permissions', requirePerm('staff.view'), (req: Request, res: Response) => {
  const all = db.query('SELECT * FROM permissions ORDER BY module ASC, action ASC').all() as any[];

  // Group by module
  const grouped: Record<string, any[]> = {};
  for (const p of all) {
    if (!grouped[p.module]) grouped[p.module] = [];
    grouped[p.module].push(p);
  }

  return res.json({
    total_count: all.length,
    permissions: all,
    modules: grouped
  });
});

// GET /api/roles/:id/permissions - Get assigned permission IDs for a role
rbacRouter.get('/roles/:id/permissions', requirePerm('staff.manage_roles'), (req: Request, res: Response) => {
  const roleId = Number(req.params.id);
  const perms = db.query(`
    SELECT p.id, p.permission_key, p.module, p.action, p.description
    FROM role_permissions rp
    JOIN permissions p ON rp.permission_id = p.id
    WHERE rp.role_id = ?
  `).all(roleId) as any[];

  return res.json({
    role_id: roleId,
    permission_ids: perms.map(p => p.id),
    permission_keys: perms.map(p => p.permission_key),
    permissions: perms
  });
});

// PUT /api/roles/:id/permissions - Save permissions for a role
rbacRouter.put('/roles/:id/permissions', requirePerm('staff.manage_permissions'), (req: Request, res: Response) => {
  const actorId = Number(req.headers['x-user-id'] || 0);
  const actorName = (req.headers['x-user-name'] as string) || 'Administrator';
  const roleId = Number(req.params.id);

  const role = db.query('SELECT * FROM roles WHERE id = ?').get(roleId) as any;
  if (!role) {
    return res.status(404).json({ error: 'Role not found' });
  }

  if (role.code === 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Super Admin permissions cannot be modified.' });
  }

  const { permission_ids } = req.body;
  if (!Array.isArray(permission_ids)) {
    return res.status(400).json({ error: 'permission_ids must be an array.' });
  }

  const now = new Date().toISOString();

  const syncTx = db.transaction(() => {
    db.run('DELETE FROM role_permissions WHERE role_id = ?', [roleId]);
    const insertStmt = db.prepare('INSERT INTO role_permissions (role_id, permission_id, created_at) VALUES (?, ?, ?)');
    for (const pId of permission_ids) {
      insertStmt.run(roleId, Number(pId), now);
    }
  });

  try {
    syncTx();
    logAudit(actorId, actorName, 'ROLE_PERMISSIONS_SYNC', 'Permission Management', `Updated permissions for role "${role.name}" (${permission_ids.length} assigned)`, 'Role', String(roleId), req.ip);

    return res.json({
      success: true,
      message: `Permissions for role "${role.name}" saved successfully (${permission_ids.length} permissions assigned).`,
      count: permission_ids.length
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update role permissions: ' + err.message });
  }
});

// GET /api/staff/:id/permissions - Get individual user permission overrides and effective permissions
rbacRouter.get('/staff/:id/permissions', requirePerm('staff.manage_permissions'), (req: Request, res: Response) => {
  const staffId = Number(req.params.id);
  const staff = (db.query('SELECT * FROM staff WHERE id = ?').get(staffId) ||
                 db.query('SELECT * FROM staff WHERE user_id = ?').get(staffId)) as any;
  if (!staff) {
    return res.status(404).json({ error: 'Staff member not found.' });
  }

  // 1. Inherited permissions from role
  const rolePerms = db.query(`
    SELECT p.id, p.permission_key, p.module, p.action, p.description
    FROM user_roles ur
    JOIN role_permissions rp ON ur.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = ?
  `).all(staff.user_id) as any[];

  // 2. Individual user overrides
  const overrides = db.query(`
    SELECT up.id as override_id, up.permission_id, up.effect,
           p.permission_key, p.module, p.action, p.description
    FROM user_permissions up
    JOIN permissions p ON up.permission_id = p.id
    WHERE up.user_id = ?
  `).all(staff.user_id) as any[];

  // 3. Effective permissions
  const effective = Array.from(getEffectivePermissions(staff.user_id));

  return res.json({
    staff_id: staff.id,
    user_id: staff.user_id,
    role_permissions: rolePerms,
    overrides,
    effective_permissions: effective
  });
});

// PUT /api/staff/:id/permissions - Save individual user permission overrides (GRANT / REVOKE / INHERIT)
rbacRouter.put('/staff/:id/permissions', requirePerm('staff.manage_permissions'), (req: Request, res: Response) => {
  const actorId = Number(req.headers['x-user-id'] || 0);
  const actorName = (req.headers['x-user-name'] as string) || 'Administrator';
  const staffId = Number(req.params.id);

  const staff = (db.query('SELECT * FROM staff WHERE id = ?').get(staffId) ||
                 db.query('SELECT * FROM staff WHERE user_id = ?').get(staffId)) as any;
  if (!staff) {
    return res.status(404).json({ error: 'Staff member not found.' });
  }

  // Prevent overriding super admin
  const userRecord = db.query('SELECT * FROM users WHERE id = ?').get(staff.user_id) as any;
  if (userRecord && userRecord.role === 'admin') {
    return res.status(403).json({ error: 'Cannot override permissions for the Super Administrator.' });
  }

  const { overrides } = req.body;
  if (!Array.isArray(overrides)) {
    return res.status(400).json({ error: 'overrides array is required.' });
  }

  const now = new Date().toISOString();

  const syncOverridesTx = db.transaction(() => {
    // Clear existing individual overrides for this user
    db.run('DELETE FROM user_permissions WHERE user_id = ?', [staff.user_id]);

    const insertStmt = db.prepare(`
      INSERT INTO user_permissions (user_id, permission_id, effect, created_at)
      VALUES (?, ?, ?, ?)
    `);

    for (const ov of overrides) {
      const effect = String(ov.effect || ov.override_type || '').toUpperCase();
      let permId = ov.permission_id;
      if (!permId && ov.permission_key) {
        const found = db.query('SELECT id FROM permissions WHERE permission_key = ?').get(ov.permission_key) as any;
        if (found) permId = found.id;
      }
      if ((effect === 'GRANT' || effect === 'REVOKE') && permId) {
        insertStmt.run(staff.user_id, Number(permId), effect, now);
      }
      // 'INHERIT' simply does not have a user_permissions row
    }
  });

  try {
    syncOverridesTx();
    logAudit(actorId, actorName, 'USER_PERMISSIONS_OVERRIDDEN', 'Permission Management', `Updated individual permission overrides for ${staff.name} (${staff.email})`, 'Staff', String(staff.id), req.ip);

    const newEffective = Array.from(getEffectivePermissions(staff.user_id));

    return res.json({
      success: true,
      message: `Permission overrides for ${staff.name} saved successfully. Effective permissions: ${newEffective.length}.`,
      effective_permissions: newEffective
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to save permission overrides: ' + err.message });
  }
});

// ----------------------------------------------------------------------
// 5. AUDIT LOGS & LOGIN HISTORY APIS
// ----------------------------------------------------------------------

// GET /api/audit-logs - Query immutable security & business audit logs
rbacRouter.get('/audit-logs', requirePerm('audit_logs.view'), (req: Request, res: Response) => {
  const search = ((req.query.search as string) || '').toLowerCase().trim();
  const moduleFilter = (req.query.module as string) || '';
  const actionFilter = (req.query.action as string) || '';
  const limit = Math.min(100, Math.max(10, Number(req.query.limit || 50)));
  const offset = Math.max(0, Number(req.query.offset || 0));

  let sql = 'SELECT id, actor_user_id as user_id, actor_name, actor_name as user_name, action, module, target_type, target_id, details, ip_address, created_at FROM audit_logs WHERE 1=1';
  let countSql = 'SELECT COUNT(*) as total FROM audit_logs WHERE 1=1';
  const params: any[] = [];
  const countParams: any[] = [];

  if (search) {
    const sClause = ' AND (LOWER(actor_name) LIKE ? OR LOWER(details) LIKE ? OR LOWER(action) LIKE ?)';
    sql += sClause;
    countSql += sClause;
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (moduleFilter) {
    sql += ' AND module = ?';
    countSql += ' AND module = ?';
    params.push(moduleFilter);
    countParams.push(moduleFilter);
  }
  if (actionFilter) {
    sql += ' AND action = ?';
    countSql += ' AND action = ?';
    params.push(actionFilter);
    countParams.push(actionFilter);
  }

  sql += ' ORDER BY id DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const logs = db.query(sql).all(...params);
  const total = (db.query(countSql).get(...countParams) as any)?.total || 0;

  return res.json({
    total,
    limit,
    offset,
    logs
  });
});

// GET /api/login-history - Query login sessions and device logs
rbacRouter.get('/login-history', requirePerm('login_history.view'), (req: Request, res: Response) => {
  const search = ((req.query.search as string) || '').toLowerCase().trim();
  const limit = Math.min(100, Math.max(10, Number(req.query.limit || 50)));
  const offset = Math.max(0, Number(req.query.offset || 0));

  let sql = `
    SELECT ls.*, u.name as user_name, u.email as user_email, u.role as user_role
    FROM login_sessions ls
    JOIN users u ON ls.user_id = u.id
    WHERE 1=1
  `;
  let countSql = `
    SELECT COUNT(*) as total
    FROM login_sessions ls
    JOIN users u ON ls.user_id = u.id
    WHERE 1=1
  `;
  const params: any[] = [];
  const countParams: any[] = [];

  if (search) {
    const sClause = ' AND (LOWER(u.name) LIKE ? OR LOWER(u.email) LIKE ? OR LOWER(ls.ip_address) LIKE ?)';
    sql += sClause;
    countSql += sClause;
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  sql += ' ORDER BY ls.id DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const sessions = db.query(sql).all(...params);
  const total = (db.query(countSql).get(...countParams) as any)?.total || 0;

  return res.json({
    total,
    limit,
    offset,
    sessions
  });
});
