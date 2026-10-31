import React, { useState, useEffect } from 'react';
import type { StaffMember, Role, Permission, AuditLog, LoginSession, StaffInvitation } from '../types';
import { formatDate } from '../utils/formatters';
import { Modal } from '../components/Modal';
import { DashboardCard } from '../components/DashboardCard';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  UserCheck,
  Shield,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  History,
  FileSpreadsheet,
  Plus,
  Search,
  Filter,
  Check,
  Copy,
  Trash2,
  Edit,
  RotateCcw,
  Sliders,
  ChevronDown,
  ChevronRight,
  Eye,
  Lock,
  Mail,
  Phone,
  Building,
  Briefcase,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Sparkles,
  Layers,
  FileText,
  UserX,
  RefreshCw,
  LogOut,
  Send,
  Ticket
} from 'lucide-react';

export const StaffView: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const isAdmin = user?.role === 'admin';

  // Active Tab
  type TabKey = 'directory' | 'roles' | 'matrix' | 'overrides' | 'audit' | 'sessions' | 'invites';
  const [activeTab, setActiveTab] = useState<TabKey>('directory');

  // Core Data
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loginSessions, setLoginSessions] = useState<LoginSession[]>([]);
  const [invitations, setInvitations] = useState<StaffInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Filters for Staff Directory
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modals state
  const [showCreateStaffModal, setShowCreateStaffModal] = useState(false);
  const [showEditStaffModal, setShowEditStaffModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetTargetStaff, setResetTargetStaff] = useState<StaffMember | null>(null);
  const [generatedTempPass, setGeneratedTempPass] = useState<string | null>(null);
  const [copiedPass, setCopiedPass] = useState(false);

  // Create Staff Form
  const [staffForm, setStaffForm] = useState({
    name: '',
    email: '',
    phone: '',
    department: 'Sales Operations',
    designation: 'Account Executive',
    role_id: 2, // Default to Sales Executive
    is_active: 1
  });

  // Role Management State
  const [showCreateRoleModal, setShowCreateRoleModal] = useState(false);
  const [showEditRoleModal, setShowEditRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleForm, setRoleForm] = useState({
    name: '',
    code: '',
    description: ''
  });
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateTargetRole, setDuplicateTargetRole] = useState<Role | null>(null);
  const [duplicateForm, setDuplicateForm] = useState({ new_name: '', new_code: '' });

  // Permission Matrix State
  const [selectedMatrixRoleId, setSelectedMatrixRoleId] = useState<number>(2);
  const [matrixRolePermIds, setMatrixRolePermIds] = useState<number[]>([]);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  const [permSearch, setPermSearch] = useState('');
  const [savingMatrix, setSavingMatrix] = useState(false);

  // User Overrides State
  const [selectedOverrideStaffId, setSelectedOverrideStaffId] = useState<number | null>(null);
  const [overrideStaffData, setOverrideStaffData] = useState<{
    user: any;
    role: any;
    role_permissions: string[];
    user_overrides: { [key: string]: 'grant' | 'revoke' };
    effective_permissions: string[];
  } | null>(null);
  const [pendingOverrides, setPendingOverrides] = useState<{ [key: string]: 'inherit' | 'grant' | 'revoke' }>({});
  const [overrideSearch, setOverrideSearch] = useState('');
  const [savingOverrides, setSavingOverrides] = useState(false);

  // Audit Logs Filter
  const [auditModuleFilter, setAuditModuleFilter] = useState('');
  const [auditSearch, setAuditSearch] = useState('');

  // Invitations Form State
  const [inviteForm, setInviteForm] = useState({
    name: '',
    email: '',
    department: 'Sales Operations',
    title: 'Account Executive',
    phone: ''
  });
  const [generatedInvite, setGeneratedInvite] = useState<{ token: string; link: string; email: string } | null>(null);
  const [copiedInviteLink, setCopiedInviteLink] = useState(false);

  // Common Request Headers
  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'x-user-id': String(user?.id || 0),
    'x-user-role': user?.role || '',
    'x-user-name': user?.name || ''
  });

  const showFeedbackMsg = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 5000);
  };

  // Initial Data Fetch
  const refreshAllData = async () => {
    setLoading(true);
    try {
      const [staffRes, rolesRes, permsRes, auditsRes, sessionsRes, invitesRes] = await Promise.all([
        fetch('/api/staff', { headers: getHeaders() }),
        fetch('/api/roles', { headers: getHeaders() }),
        fetch('/api/permissions', { headers: getHeaders() }),
        fetch('/api/audit-logs', { headers: getHeaders() }),
        fetch('/api/login-history', { headers: getHeaders() }),
        fetch('/api/auth/invitations', { headers: getHeaders() })
      ]);

      if (staffRes.ok) setStaffList(await staffRes.json());
      if (rolesRes.ok) {
        const rData = await rolesRes.json();
        setRoles(rData);
        if (rData.length > 0 && !selectedMatrixRoleId) {
          setSelectedMatrixRoleId(rData[0].id);
        }
      }
      if (permsRes.ok) {
        const pData = await permsRes.json();
        const permsList = Array.isArray(pData) ? pData : (pData.permissions || []);
        setAllPermissions(permsList);
        // Expand all modules by default
        const initExpand: Record<string, boolean> = {};
        permsList.forEach((p: Permission) => {
          initExpand[p.module] = true;
        });
        setExpandedModules(initExpand);
      }
      if (auditsRes.ok) {
        const aData = await auditsRes.json();
        setAuditLogs(Array.isArray(aData) ? aData : (aData.logs || []));
      }
      if (sessionsRes.ok) {
        const sData = await sessionsRes.json();
        setLoginSessions(Array.isArray(sData) ? sData : (sData.sessions || []));
      }
      if (invitesRes.ok) setInvitations(await invitesRes.json());
    } catch (err: any) {
      console.error('Failed to load RBAC data:', err);
      showFeedbackMsg('error', 'Error loading access control data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAllData();
  }, []);

  // Fetch Role Permissions whenever Matrix Role changes
  useEffect(() => {
    if (!selectedMatrixRoleId) return;
    fetch(`/api/roles/${selectedMatrixRoleId}/permissions`, { headers: getHeaders() })
      .then((res) => res.json())
      .then((data) => {
        if (data.permission_ids) {
          setMatrixRolePermIds(data.permission_ids);
        }
      })
      .catch(console.error);
  }, [selectedMatrixRoleId]);

  // Fetch User Overrides Data whenever target staff changes
  useEffect(() => {
    if (!selectedOverrideStaffId) {
      if (staffList.length > 0) {
        setSelectedOverrideStaffId(staffList[0].id);
      }
      return;
    }
    fetch(`/api/staff/${selectedOverrideStaffId}/permissions`, { headers: getHeaders() })
      .then((res) => res.json())
      .then((data) => {
        setOverrideStaffData(data);
        // Initialize pending overrides map
        const initialOverrides: { [key: string]: 'inherit' | 'grant' | 'revoke' } = {};
        allPermissions.forEach((p) => {
          if (data.user_overrides && data.user_overrides[p.permission_key]) {
            initialOverrides[p.permission_key] = data.user_overrides[p.permission_key];
          } else {
            initialOverrides[p.permission_key] = 'inherit';
          }
        });
        setPendingOverrides(initialOverrides);
      })
      .catch(console.error);
  }, [selectedOverrideStaffId, staffList, allPermissions]);

  // ----------------------------------------------------------------------
  // HANDLERS: STAFF DIRECTORY
  // ----------------------------------------------------------------------
  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(staffForm)
      });
      const data = await res.json();
      if (res.ok) {
        showFeedbackMsg('success', data.message || 'Staff member created successfully.');
        setShowCreateStaffModal(false);
        setGeneratedTempPass(data.temporary_password);
        setShowResetModal(true);
        setResetTargetStaff({
          id: data.staff.id,
          user_id: data.staff.user_id,
          name: data.staff.name,
          email: data.staff.email,
          department: data.staff.department,
          title: data.staff.title,
          is_active: 1,
          must_change_password: 1,
          created_at: new Date().toISOString()
        });
        refreshAllData();
      } else {
        showFeedbackMsg('error', data.error || 'Failed to create staff member.');
      }
    } catch (err: any) {
      showFeedbackMsg('error', err.message);
    }
  };

  const handleEditStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;
    try {
      const res = await fetch(`/api/staff/${editingStaff.id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          name: editingStaff.name,
          email: editingStaff.email,
          phone: editingStaff.phone,
          department: editingStaff.department,
          designation: editingStaff.title,
          role_id: editingStaff.role_id,
          is_active: editingStaff.is_active
        })
      });
      const data = await res.json();
      if (res.ok) {
        showFeedbackMsg('success', data.message || 'Staff profile updated.');
        setShowEditStaffModal(false);
        refreshAllData();
      } else {
        showFeedbackMsg('error', data.error || 'Failed to update staff member.');
      }
    } catch (err: any) {
      showFeedbackMsg('error', err.message);
    }
  };

  const handleToggleStaffStatus = async (staffMember: StaffMember) => {
    const nextStatus = staffMember.is_active === 1 ? 0 : 1;
    const confirmMsg =
      nextStatus === 0
        ? `Deactivate ${staffMember.name}'s account?\n\nThis will immediately terminate active sessions and block any API access.`
        : `Reactivate ${staffMember.name}'s account? Access will be restored according to assigned permissions.`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/staff/${staffMember.id}/status`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ is_active: nextStatus })
      });
      const data = await res.json();
      if (res.ok) {
        showFeedbackMsg('success', data.message);
        refreshAllData();
      } else {
        showFeedbackMsg('error', data.error || 'Failed to update account status.');
      }
    } catch (err: any) {
      showFeedbackMsg('error', err.message);
    }
  };

  const handleResetPassword = async (staffMember: StaffMember) => {
    if (!window.confirm(`Generate new temporary credentials for ${staffMember.name} (${staffMember.email})?`)) return;
    try {
      const res = await fetch(`/api/staff/${staffMember.id}/reset-password`, {
        method: 'POST',
        headers: getHeaders()
      });
      const data = await res.json();
      if (res.ok) {
        setGeneratedTempPass(data.temporary_password);
        setResetTargetStaff(staffMember);
        setShowResetModal(true);
        showFeedbackMsg('success', 'Credentials regenerated. Password change on next login is enforced.');
        refreshAllData();
      } else {
        showFeedbackMsg('error', data.error || 'Failed to reset password.');
      }
    } catch (err: any) {
      showFeedbackMsg('error', err.message);
    }
  };

  const handleDeleteStaff = async (staffMember: StaffMember) => {
    if (!window.confirm(`Permanently remove staff member "${staffMember.name}"?\n\nThis action cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/staff/${staffMember.id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      const data = await res.json();
      if (res.ok) {
        showFeedbackMsg('success', data.message);
        refreshAllData();
      } else {
        showFeedbackMsg('error', data.error || 'Failed to delete staff member.');
      }
    } catch (err: any) {
      showFeedbackMsg('error', err.message);
    }
  };

  // ----------------------------------------------------------------------
  // HANDLERS: ROLE MANAGEMENT
  // ----------------------------------------------------------------------
  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/roles', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          name: roleForm.name,
          code: roleForm.code,
          description: roleForm.description,
          permission_ids: []
        })
      });
      const data = await res.json();
      if (res.ok) {
        showFeedbackMsg('success', data.message);
        setShowCreateRoleModal(false);
        setRoleForm({ name: '', code: '', description: '' });
        refreshAllData();
      } else {
        showFeedbackMsg('error', data.error || 'Failed to create role.');
      }
    } catch (err: any) {
      showFeedbackMsg('error', err.message);
    }
  };

  const handleEditRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRole) return;
    try {
      const res = await fetch(`/api/roles/${editingRole.id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          name: editingRole.name,
          description: editingRole.description
        })
      });
      const data = await res.json();
      if (res.ok) {
        showFeedbackMsg('success', data.message);
        setShowEditRoleModal(false);
        refreshAllData();
      } else {
        showFeedbackMsg('error', data.error || 'Failed to update role.');
      }
    } catch (err: any) {
      showFeedbackMsg('error', err.message);
    }
  };

  const handleDuplicateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!duplicateTargetRole) return;
    try {
      const res = await fetch(`/api/roles/${duplicateTargetRole.id}/duplicate`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(duplicateForm)
      });
      const data = await res.json();
      if (res.ok) {
        showFeedbackMsg('success', data.message);
        setShowDuplicateModal(false);
        setDuplicateForm({ new_name: '', new_code: '' });
        refreshAllData();
      } else {
        showFeedbackMsg('error', data.error || 'Failed to duplicate role.');
      }
    } catch (err: any) {
      showFeedbackMsg('error', err.message);
    }
  };

  const handleDeleteRole = async (role: Role) => {
    if (!window.confirm(`Are you sure you want to delete custom role "${role.name}"?`)) return;
    try {
      const res = await fetch(`/api/roles/${role.id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      const data = await res.json();
      if (res.ok) {
        showFeedbackMsg('success', data.message);
        refreshAllData();
      } else {
        showFeedbackMsg('error', data.error || 'Failed to delete role.');
      }
    } catch (err: any) {
      showFeedbackMsg('error', err.message);
    }
  };

  // ----------------------------------------------------------------------
  // HANDLERS: PERMISSION MATRIX
  // ----------------------------------------------------------------------
  const togglePermissionInMatrix = (permId: number) => {
    setMatrixRolePermIds((prev) =>
      prev.includes(permId) ? prev.filter((id) => id !== permId) : [...prev, permId]
    );
  };

  const selectAllInMatrix = () => {
    setMatrixRolePermIds(allPermissions.map((p) => p.id));
  };

  const deselectAllInMatrix = () => {
    setMatrixRolePermIds([]);
  };

  const selectModuleInMatrix = (moduleName: string) => {
    const modPermIds = allPermissions.filter((p) => p.module === moduleName).map((p) => p.id);
    setMatrixRolePermIds((prev) => Array.from(new Set([...prev, ...modPermIds])));
  };

  const deselectModuleInMatrix = (moduleName: string) => {
    const modPermIds = new Set(allPermissions.filter((p) => p.module === moduleName).map((p) => p.id));
    setMatrixRolePermIds((prev) => prev.filter((id) => !modPermIds.has(id)));
  };

  const handleSaveMatrix = async () => {
    setSavingMatrix(true);
    try {
      const res = await fetch(`/api/roles/${selectedMatrixRoleId}/permissions`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ permission_ids: matrixRolePermIds })
      });
      const data = await res.json();
      if (res.ok) {
        showFeedbackMsg('success', data.message);
        refreshAllData();
      } else {
        showFeedbackMsg('error', data.error || 'Failed to save permissions.');
      }
    } catch (err: any) {
      showFeedbackMsg('error', err.message);
    } finally {
      setSavingMatrix(false);
    }
  };

  // Group permissions by module
  const permissionsByModule = allPermissions.reduce((acc, p) => {
    if (!acc[p.module]) acc[p.module] = [];
    acc[p.module].push(p);
    return acc;
  }, {} as Record<string, Permission[]>);

  // ----------------------------------------------------------------------
  // HANDLERS: USER OVERRIDES
  // ----------------------------------------------------------------------
  const setOverrideState = (permKey: string, val: 'inherit' | 'grant' | 'revoke') => {
    setPendingOverrides((prev) => ({ ...prev, [permKey]: val }));
  };

  const calculateEffective = (permKey: string): boolean => {
    if (!overrideStaffData) return false;
    const roleHasIt = overrideStaffData.role_permissions.includes(permKey);
    const override = pendingOverrides[permKey] || 'inherit';
    if (override === 'grant') return true;
    if (override === 'revoke') return false;
    return roleHasIt;
  };

  const handleSaveUserOverrides = async () => {
    if (!selectedOverrideStaffId) return;
    setSavingOverrides(true);
    try {
      // Build array of override items
      const overridesPayload: Array<{ permission_key: string; override_type: 'grant' | 'revoke' }> = [];
      Object.entries(pendingOverrides).forEach(([permKey, state]) => {
        if (state === 'grant' || state === 'revoke') {
          overridesPayload.push({ permission_key: permKey, override_type: state });
        }
      });

      const res = await fetch(`/api/staff/${selectedOverrideStaffId}/permissions`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ overrides: overridesPayload })
      });
      const data = await res.json();
      if (res.ok) {
        showFeedbackMsg('success', data.message);
        // Refresh local override data
        setOverrideStaffData(data);
        refreshAllData();
      } else {
        showFeedbackMsg('error', data.error || 'Failed to update user overrides.');
      }
    } catch (err: any) {
      showFeedbackMsg('error', err.message);
    } finally {
      setSavingOverrides(false);
    }
  };

  // ----------------------------------------------------------------------
  // HANDLERS: INVITATIONS
  // ----------------------------------------------------------------------
  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/invite-staff', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(inviteForm)
      });
      const data = await res.json();
      if (res.ok) {
        setGeneratedInvite({
          token: data.invite_token,
          link: data.invite_link,
          email: inviteForm.email
        });
        setInviteForm({
          name: '',
          email: '',
          department: 'Sales Operations',
          title: 'Account Executive',
          phone: ''
        });
        showFeedbackMsg('success', 'Invitation link created successfully.');
        refreshAllData();
      } else {
        showFeedbackMsg('error', data.error || 'Failed to create invitation.');
      }
    } catch (err: any) {
      showFeedbackMsg('error', err.message);
    }
  };

  // Filtered staff list
  const filteredStaff = staffList.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !roleFilter || String(s.role_id) === roleFilter;
    const matchesDept = !deptFilter || s.department === deptFilter;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && s.is_active === 1) ||
      (statusFilter === 'inactive' && s.is_active === 0);
    return matchesSearch && matchesRole && matchesDept && matchesStatus;
  });

  const uniqueDepartments = Array.from(new Set(staffList.map((s) => s.department).filter(Boolean)));

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-[11px] font-bold text-indigo-700">
            <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
            <span>Centralized Authorization &amp; Access Control</span>
          </div>
          <h1 className="mt-1 text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
            Staff &amp; Access Management
          </h1>
          <p className="text-xs text-slate-500">
            Enterprise RBAC · Dynamic module permissions · User overrides · Security audit logs
          </p>
        </div>

        {/* Global Feedback Banner */}
        {feedback && (
          <div
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-2xl text-xs font-semibold shadow-xs animate-in fade-in duration-200 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border border-rose-200 text-rose-800'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200/90 pb-2 overflow-x-auto">
        {[
          { key: 'directory', label: 'Staff Directory', icon: Users, count: staffList.length },
          { key: 'roles', label: 'Role Management', icon: Shield, count: roles.length },
          { key: 'matrix', label: 'Permission Matrix', icon: Sliders },
          { key: 'overrides', label: 'User Overrides', icon: UserCheck },
          { key: 'audit', label: 'Audit Trail', icon: History, count: auditLogs.length },
          { key: 'sessions', label: 'Login History', icon: Lock, count: loginSessions.length },
          { key: 'invites', label: 'Invitations', icon: Ticket, count: invitations.length }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as TabKey)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/25'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: STAFF DIRECTORY */}
      {/* ==================================================================== */}
      {activeTab === 'directory' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
              {/* Search */}
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search staff by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {/* Role Filter */}
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="py-1.5 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 text-slate-700 focus:bg-white focus:outline-none"
              >
                <option value="">All Roles</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>

              {/* Department Filter */}
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="py-1.5 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 text-slate-700 focus:bg-white focus:outline-none"
              >
                <option value="">All Departments</option>
                {uniqueDepartments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="py-1.5 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 text-slate-700 focus:bg-white focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="inactive">Deactivated Only</option>
              </select>
            </div>

            {/* Create Staff Button */}
            <button
              type="button"
              onClick={() => setShowCreateStaffModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-indigo-500/20 hover:from-indigo-700 hover:to-violet-700 transition cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Add Staff Member</span>
            </button>
          </div>

          {/* Staff Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10.5px]">
                    <th className="px-4 py-3 text-left">Staff Member</th>
                    <th className="px-4 py-3 text-left">Department &amp; Title</th>
                    <th className="px-4 py-3 text-left">Assigned Role</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-left">Last Login</th>
                    <th className="px-4 py-3 text-left">Created</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStaff.length > 0 ? (
                    filteredStaff.map((member) => (
                      <tr key={member.id} className="hover:bg-slate-50/80 transition">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-600 text-white font-bold flex items-center justify-center text-xs">
                              {member.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{member.name}</p>
                              <p className="text-[11px] font-mono text-slate-400">{member.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="font-medium text-slate-800">{member.department || 'Operations'}</p>
                          <p className="text-[11px] text-slate-500">{member.title || 'Staff'}</p>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center gap-1 font-semibold text-[11px] px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                            <Shield className="h-3 w-3 text-indigo-500" />
                            {member.role_name || 'Staff Member'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleStaffStatus(member)}
                            title="Click to toggle account status"
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold cursor-pointer transition ${
                              member.is_active === 1
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                member.is_active === 1 ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                              }`}
                            />
                            {member.is_active === 1 ? 'Active' : 'Deactivated'}
                          </button>
                        </td>
                        <td className="px-4 py-3.5 text-slate-500 font-mono text-[11px]">
                          {member.last_login_at ? formatDate(member.last_login_at) : 'Never'}
                        </td>
                        <td className="px-4 py-3.5 text-slate-500 font-mono text-[11px]">
                          {formatDate(member.created_at)}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Manage Permissions */}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedOverrideStaffId(member.id);
                                setActiveTab('overrides');
                              }}
                              title="Manage Individual Permission Overrides"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
                            >
                              <Sliders className="h-3.5 w-3.5" />
                            </button>

                            {/* Edit Profile */}
                            <button
                              type="button"
                              onClick={() => {
                                setEditingStaff(member);
                                setShowEditStaffModal(true);
                              }}
                              title="Edit Staff Member"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>

                            {/* Reset Password */}
                            <button
                              type="button"
                              onClick={() => handleResetPassword(member)}
                              title="Reset Password (Force First-Login Change)"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition cursor-pointer"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => handleDeleteStaff(member)}
                              title="Delete Account"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <Users className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                        <p className="font-medium text-slate-600">No staff members match the selected filters.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: ROLE MANAGEMENT */}
      {/* ==================================================================== */}
      {activeTab === 'roles' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Configured System &amp; Custom Roles</h2>
              <p className="text-xs text-slate-500">
                Predefined roles contain default permissions. Custom roles can be tailored freely.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowCreateRoleModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-indigo-500/20 hover:from-indigo-700 hover:to-violet-700 transition cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Create Custom Role</span>
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {roles.map((role) => (
              <div
                key={role.id}
                className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-2xs hover:shadow-md hover:border-indigo-200 transition space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center">
                      <Shield className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{role.name}</h3>
                      <span className="text-[10.5px] font-mono text-slate-400 uppercase">
                        {role.code}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      role.is_system_role === 1
                        ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                    }`}
                  >
                    {role.is_system_role === 1 ? 'System' : 'Custom'}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed min-h-[36px]">
                  {role.description || 'Predefined system role.'}
                </p>

                <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
                  <span className="font-medium text-slate-700">
                    <strong className="text-indigo-600">{role.users_count || 0}</strong> assigned users
                  </span>
                  <span className="font-mono text-[11px] text-slate-400">
                    {role.permissions_count || 0} permissions
                  </span>
                </div>

                {/* Role Actions */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-50">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMatrixRoleId(role.id);
                      setActiveTab('matrix');
                    }}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                  >
                    Edit Permissions →
                  </button>

                  <div className="flex items-center gap-1">
                    {/* Duplicate */}
                    <button
                      type="button"
                      onClick={() => {
                        setDuplicateTargetRole(role);
                        setDuplicateForm({
                          new_name: `${role.name} Copy`,
                          new_code: `${role.code}_COPY`.toUpperCase()
                        });
                        setShowDuplicateModal(true);
                      }}
                      title="Duplicate Role"
                      className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 cursor-pointer"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>

                    {/* Edit */}
                    <button
                      type="button"
                      onClick={() => {
                        setEditingRole(role);
                        setShowEditRoleModal(true);
                      }}
                      title="Edit Role Details"
                      className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 cursor-pointer"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>

                    {/* Delete (custom roles only) */}
                    {role.is_system_role === 0 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteRole(role)}
                        title="Delete Role"
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: PERMISSION MATRIX */}
      {/* ==================================================================== */}
      {activeTab === 'matrix' && (
        <div className="space-y-4">
          {/* Header & Role Selector */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-slate-700">Configuring Role:</label>
              <select
                value={selectedMatrixRoleId}
                onChange={(e) => setSelectedMatrixRoleId(Number(e.target.value))}
                className="py-1.5 px-3 rounded-xl border border-indigo-200 bg-indigo-50/50 text-indigo-900 text-xs font-bold focus:bg-white focus:outline-none"
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.code})
                  </option>
                ))}
              </select>

              <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                Active Permissions: {matrixRolePermIds.length} / {allPermissions.length}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={selectAllInMatrix}
                className="px-2.5 py-1 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition cursor-pointer"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={deselectAllInMatrix}
                className="px-2.5 py-1 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition cursor-pointer"
              >
                Deselect All
              </button>
              <button
                type="button"
                onClick={handleSaveMatrix}
                disabled={savingMatrix}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-xs font-bold text-white shadow-md shadow-indigo-500/20 hover:from-indigo-700 hover:to-violet-700 transition cursor-pointer disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
                <span>{savingMatrix ? 'Saving...' : 'Save Role Permissions'}</span>
              </button>
            </div>
          </div>

          {/* Module-wise Expandable Sections */}
          <div className="space-y-3">
            {Object.entries(permissionsByModule).map(([moduleName, perms]) => {
              const isExpanded = expandedModules[moduleName] ?? true;
              const selectedCount = perms.filter((p) => matrixRolePermIds.includes(p.id)).length;

              return (
                <div
                  key={moduleName}
                  className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs"
                >
                  {/* Module Accordion Header */}
                  <div className="flex items-center justify-between px-4 py-3 bg-slate-50/70 border-b border-slate-100">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedModules((prev) => ({ ...prev, [moduleName]: !isExpanded }))
                      }
                      className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-800 hover:text-indigo-600 transition cursor-pointer"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      )}
                      <span>{moduleName.replace('_', ' ')}</span>
                      <span className="text-[10.5px] font-mono font-semibold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600">
                        {selectedCount} / {perms.length} selected
                      </span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => selectModuleInMatrix(moduleName)}
                        className="text-[11px] font-semibold text-indigo-600 hover:underline cursor-pointer"
                      >
                        Select Module
                      </button>
                      <span className="text-slate-300">·</span>
                      <button
                        type="button"
                        onClick={() => deselectModuleInMatrix(moduleName)}
                        className="text-[11px] font-semibold text-slate-500 hover:underline cursor-pointer"
                      >
                        Clear Module
                      </button>
                    </div>
                  </div>

                  {/* Module Checkbox Grid */}
                  {isExpanded && (
                    <div className="p-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {perms.map((p) => {
                        const isChecked = matrixRolePermIds.includes(p.id);
                        return (
                          <label
                            key={p.id}
                            className={`flex items-start gap-2.5 p-3 rounded-xl border transition cursor-pointer ${
                              isChecked
                                ? 'bg-indigo-50/50 border-indigo-200 shadow-2xs'
                                : 'bg-slate-50/30 border-slate-100 hover:border-slate-200'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => togglePermissionInMatrix(p.id)}
                              className="mt-0.5 h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
                            />
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 text-xs">{p.name}</p>
                              <p className="text-[10px] font-mono text-slate-400">{p.permission_key}</p>
                              <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                                {p.description}
                              </p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 4: USER OVERRIDES */}
      {/* ==================================================================== */}
      {activeTab === 'overrides' && (
        <div className="space-y-4">
          {/* Staff Member Selector */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-slate-700">Employee Account:</label>
              <select
                value={selectedOverrideStaffId || ''}
                onChange={(e) => setSelectedOverrideStaffId(Number(e.target.value))}
                className="py-1.5 px-3 rounded-xl border border-indigo-200 bg-indigo-50/50 text-indigo-900 text-xs font-bold focus:bg-white focus:outline-none"
              >
                {staffList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.email}) · {s.role_name || 'Staff'}
                  </option>
                ))}
              </select>

              {overrideStaffData && (
                <div className="text-xs font-mono text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                  Assigned Base Role: <strong>{overrideStaffData.role?.name || 'Staff'}</strong>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleSaveUserOverrides}
              disabled={savingOverrides}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-xs font-bold text-white shadow-md shadow-indigo-500/20 hover:from-indigo-700 hover:to-violet-700 transition cursor-pointer disabled:opacity-50"
            >
              <Check className="h-4 w-4" />
              <span>{savingOverrides ? 'Applying...' : 'Save User Overrides'}</span>
            </button>
          </div>

          {/* Formula Callout Banner */}
          <div className="rounded-2xl bg-gradient-to-r from-indigo-50 via-violet-50 to-pink-50 p-3.5 border border-indigo-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-indigo-900">
              <Sparkles className="h-4 w-4 text-indigo-600" />
              <span className="font-semibold">
                Authorization Rule: <code>Effective = Role Permissions + Grants - Revocations</code>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-slate-200 text-slate-700">
                Inherit = Default
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-100 text-emerald-800">
                Grant = Force Allow
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-rose-100 text-rose-800">
                Revoke = Force Deny
              </span>
            </div>
          </div>

          {/* Overrides Table / Grid */}
          <div className="space-y-3">
            {Object.entries(permissionsByModule).map(([moduleName, perms]) => (
              <div
                key={moduleName}
                className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs"
              >
                <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 font-extrabold text-xs uppercase tracking-wider text-slate-700">
                  {moduleName.replace('_', ' ')}
                </div>

                <div className="divide-y divide-slate-100">
                  {perms.map((p) => {
                    const currentState = pendingOverrides[p.permission_key] || 'inherit';
                    const isEffective = calculateEffective(p.permission_key);
                    const baseInRole = overrideStaffData?.role_permissions.includes(p.permission_key);

                    return (
                      <div
                        key={p.id}
                        className="px-4 py-3 flex flex-wrap items-center justify-between gap-3 hover:bg-slate-50/50 transition"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-xs">{p.name}</span>
                            <span className="font-mono text-[10px] text-slate-400">
                              {p.permission_key}
                            </span>
                            {/* Base Role Indicator */}
                            <span
                              className={`text-[9.5px] px-1.5 py-0.2 rounded font-mono ${
                                baseInRole
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : 'bg-slate-100 text-slate-500'
                              }`}
                            >
                              Role: {baseInRole ? 'Granted' : 'Not Granted'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">{p.description}</p>
                        </div>

                        {/* Effective Status Badge */}
                        <div className="flex items-center gap-3">
                          <span
                            className={`inline-flex items-center gap-1 text-[10.5px] font-bold px-2.5 py-0.5 rounded-full ${
                              isEffective
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-500 border border-slate-200'
                            }`}
                          >
                            {isEffective ? 'ALLOW' : 'DENY'}
                          </span>

                          {/* 3-State Override Buttons */}
                          <div className="inline-flex rounded-xl bg-slate-100 p-0.5 border border-slate-200">
                            <button
                              type="button"
                              onClick={() => setOverrideState(p.permission_key, 'inherit')}
                              className={`px-2 py-1 rounded-lg text-[10.5px] font-bold transition cursor-pointer ${
                                currentState === 'inherit'
                                  ? 'bg-white text-slate-800 shadow-2xs'
                                  : 'text-slate-500 hover:text-slate-900'
                              }`}
                            >
                              Inherit
                            </button>
                            <button
                              type="button"
                              onClick={() => setOverrideState(p.permission_key, 'grant')}
                              className={`px-2 py-1 rounded-lg text-[10.5px] font-bold transition cursor-pointer ${
                                currentState === 'grant'
                                  ? 'bg-emerald-600 text-white shadow-2xs'
                                  : 'text-slate-500 hover:text-emerald-700'
                              }`}
                            >
                              Grant
                            </button>
                            <button
                              type="button"
                              onClick={() => setOverrideState(p.permission_key, 'revoke')}
                              className={`px-2 py-1 rounded-lg text-[10.5px] font-bold transition cursor-pointer ${
                                currentState === 'revoke'
                                  ? 'bg-rose-600 text-white shadow-2xs'
                                  : 'text-slate-500 hover:text-rose-700'
                              }`}
                            >
                              Revoke
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 5: AUDIT TRAIL */}
      {/* ==================================================================== */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-2 flex-1 max-w-sm">
              <Search className="h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search audit trail..."
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                className="w-full text-xs bg-transparent focus:outline-none"
              />
            </div>

            <button
              type="button"
              onClick={refreshAllData}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Refresh Log</span>
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10.5px]">
                    <th className="px-4 py-3 text-left">Timestamp</th>
                    <th className="px-4 py-3 text-left">Actor</th>
                    <th className="px-4 py-3 text-left">Action</th>
                    <th className="px-4 py-3 text-left">Module</th>
                    <th className="px-4 py-3 text-left">Details</th>
                    <th className="px-4 py-3 text-left">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {auditLogs.length > 0 ? (
                    auditLogs
                      .filter(
                        (l) =>
                          !auditSearch ||
                          l.action.toLowerCase().includes(auditSearch.toLowerCase()) ||
                          l.user_name.toLowerCase().includes(auditSearch.toLowerCase()) ||
                          l.details.toLowerCase().includes(auditSearch.toLowerCase())
                      )
                      .map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/80 transition">
                          <td className="px-4 py-3 text-slate-400 whitespace-nowrap text-[11px]">
                            {formatDate(log.created_at)}
                          </td>
                          <td className="px-4 py-3 font-sans font-bold text-slate-900">
                            {log.user_name}
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/50">
                              {log.action}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-sans text-slate-600 text-[11px]">
                            {log.module}
                          </td>
                          <td className="px-4 py-3 font-sans text-slate-800 max-w-md truncate text-[11px]">
                            {log.details}
                          </td>
                          <td className="px-4 py-3 text-slate-400 text-[11px]">
                            {log.ip_address || '127.0.0.1'}
                          </td>
                        </tr>
                      ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-400">
                        No audit records recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 6: LOGIN HISTORY */}
      {/* ==================================================================== */}
      {activeTab === 'sessions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Active &amp; Historical Login Sessions</h2>
              <p className="text-xs text-slate-500">
                Track employee access points, IP addresses, client user-agents, and active session states.
              </p>
            </div>
            <button
              type="button"
              onClick={refreshAllData}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Refresh Sessions</span>
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10.5px]">
                    <th className="px-4 py-3 text-left">Staff User</th>
                    <th className="px-4 py-3 text-left">IP Address</th>
                    <th className="px-4 py-3 text-left">Browser / Device</th>
                    <th className="px-4 py-3 text-left">Login Timestamp</th>
                    <th className="px-4 py-3 text-center">Session State</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {loginSessions.length > 0 ? (
                    loginSessions.map((session) => (
                      <tr key={session.id} className="hover:bg-slate-50/80 transition">
                        <td className="px-4 py-3 font-sans">
                          <p className="font-bold text-slate-900">{session.user_name}</p>
                          <p className="text-[11px] font-mono text-slate-400">{session.user_email}</p>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{session.ip_address || '127.0.0.1'}</td>
                        <td className="px-4 py-3 font-sans text-slate-600 max-w-xs truncate text-[11px]">
                          {session.user_agent || 'Standard Web Browser'}
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-[11px]">
                          {formatDate(session.login_at)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-flex items-center gap-1 text-[10.5px] font-bold px-2.5 py-0.5 rounded-full ${
                              session.is_active === 1
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-500 border border-slate-200'
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                session.is_active === 1 ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                              }`}
                            />
                            {session.is_active === 1 ? 'Live Active' : 'Terminated / Expired'}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-slate-400">
                        No login sessions recorded.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 7: INVITATIONS */}
      {/* ==================================================================== */}
      {activeTab === 'invites' && (
        <div className="space-y-4">
          {/* Create Invite Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Issue Staff Invitation</h2>
              <p className="text-xs text-slate-500">
                Staff registration is invite-only. Candidates must register with their unique token or invitation URL.
              </p>
            </div>

            <form onSubmit={handleCreateInvite} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 items-end">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Candidate Name"
                  value={inviteForm.name}
                  onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="candidate@company.com"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Department
                </label>
                <select
                  value={inviteForm.department}
                  onChange={(e) => setInviteForm({ ...inviteForm, department: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none"
                >
                  <option value="Sales Operations">Sales Operations</option>
                  <option value="Finance & Accounts">Finance & Accounts</option>
                  <option value="Customer Support">Customer Support</option>
                  <option value="Product Operations">Product Operations</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Designation / Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sales Executive"
                  value={inviteForm.title}
                  onChange={(e) => setInviteForm({ ...inviteForm, title: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 py-2 px-3 text-xs font-bold text-white shadow-md shadow-indigo-500/20 hover:from-indigo-700 hover:to-violet-700 transition cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Generate Invite</span>
                </button>
              </div>
            </form>

            {/* Display generated invite token & link */}
            {generatedInvite && (
              <div className="rounded-2xl bg-indigo-50/70 p-4 border border-indigo-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-900">
                    Invite Created for {generatedInvite.email}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedInvite.link);
                      setCopiedInviteLink(true);
                      setTimeout(() => setCopiedInviteLink(false), 2000);
                    }}
                    className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700 bg-white px-3 py-1 rounded-lg border border-indigo-200 hover:bg-indigo-50 cursor-pointer"
                  >
                    {copiedInviteLink ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedInviteLink ? 'Link Copied!' : 'Copy Invite Link'}</span>
                  </button>
                </div>
                <div className="p-2 rounded-xl bg-white border border-indigo-100 font-mono text-xs text-indigo-800 break-all select-all">
                  {generatedInvite.link}
                </div>
              </div>
            )}
          </div>

          {/* Invitations Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10.5px]">
                    <th className="px-4 py-3 text-left">Candidate Name &amp; Email</th>
                    <th className="px-4 py-3 text-left">Department &amp; Title</th>
                    <th className="px-4 py-3 text-left">Invite Token</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-left">Expires</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invitations.length > 0 ? (
                    invitations.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                        <td className="px-4 py-3">
                          <p className="font-bold text-slate-900">{inv.name}</p>
                          <p className="text-[11px] font-mono text-slate-400">{inv.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-700">{inv.department}</p>
                          <p className="text-[11px] text-slate-400">{inv.title}</p>
                        </td>
                        <td className="px-4 py-3 font-mono text-indigo-700">{inv.invite_token}</td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold ${
                              inv.status === 'accepted'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : inv.status === 'pending'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {inv.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">
                          {formatDate(inv.expires_at)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-slate-400">
                        No invitations recorded.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: CREATE STAFF MEMBER */}
      {/* ==================================================================== */}
      <Modal
        isOpen={showCreateStaffModal}
        onClose={() => setShowCreateStaffModal(false)}
        title="Add Staff Member"
      >
        <form onSubmit={handleCreateStaff} className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. John Doe"
              value={staffForm.name}
              onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Work Email Address
            </label>
            <input
              type="email"
              required
              placeholder="e.g. john.doe@brightloop.io"
              value={staffForm.email}
              onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Department
              </label>
              <select
                value={staffForm.department}
                onChange={(e) => setStaffForm({ ...staffForm, department: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:outline-none"
              >
                <option value="Sales Operations">Sales Operations</option>
                <option value="Finance & Accounts">Finance & Accounts</option>
                <option value="Customer Support">Customer Support</option>
                <option value="Product Operations">Product Operations</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Designation / Title
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Sales Executive"
                value={staffForm.designation}
                onChange={(e) => setStaffForm({ ...staffForm, designation: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Assigned Role
              </label>
              <select
                value={staffForm.role_id}
                onChange={(e) => setStaffForm({ ...staffForm, role_id: Number(e.target.value) })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:outline-none"
              >
                {roles
                  .filter((r) => r.code !== 'SUPER_ADMIN')
                  .map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Phone Number
              </label>
              <input
                type="text"
                placeholder="+91 98765 43210"
                value={staffForm.phone}
                onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:outline-none"
              />
            </div>
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
            A temporary password will be securely generated. The staff member will be required to change their credentials on first login.
          </p>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowCreateStaffModal(false)}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm cursor-pointer"
            >
              Create Account
            </button>
          </div>
        </form>
      </Modal>

      {/* ==================================================================== */}
      {/* MODAL: EDIT STAFF MEMBER */}
      {/* ==================================================================== */}
      {editingStaff && (
        <Modal
          isOpen={showEditStaffModal}
          onClose={() => setShowEditStaffModal(false)}
          title={`Edit ${editingStaff.name}`}
        >
          <form onSubmit={handleEditStaff} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={editingStaff.name}
                onChange={(e) => setEditingStaff({ ...editingStaff, name: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={editingStaff.email}
                onChange={(e) => setEditingStaff({ ...editingStaff, email: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  required
                  value={editingStaff.department}
                  onChange={(e) => setEditingStaff({ ...editingStaff, department: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Designation
                </label>
                <input
                  type="text"
                  required
                  value={editingStaff.title}
                  onChange={(e) => setEditingStaff({ ...editingStaff, title: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Assigned Role
                </label>
                <select
                  value={editingStaff.role_id || ''}
                  onChange={(e) => setEditingStaff({ ...editingStaff, role_id: Number(e.target.value) })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:outline-none"
                >
                  {roles
                    .filter((r) => r.code !== 'SUPER_ADMIN')
                    .map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Account Status
                </label>
                <select
                  value={editingStaff.is_active}
                  onChange={(e) => setEditingStaff({ ...editingStaff, is_active: Number(e.target.value) })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:outline-none"
                >
                  <option value={1}>Active</option>
                  <option value={0}>Deactivated</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowEditStaffModal(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm cursor-pointer"
              >
                Update Profile
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ==================================================================== */}
      {/* MODAL: RESET CREDENTIALS DISPLAY */}
      {/* ==================================================================== */}
      <Modal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        title="Temporary Credentials Generated"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Temporary login credentials have been assigned to{' '}
            <strong className="text-slate-900">{resetTargetStaff?.name}</strong> ({resetTargetStaff?.email}).
          </p>

          <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">
              One-Time Temporary Password
            </span>
            <div className="flex items-center justify-between bg-white px-3.5 py-2.5 rounded-xl border border-indigo-100 font-mono text-sm font-bold text-indigo-900 select-all">
              <span>{generatedTempPass}</span>
              <button
                type="button"
                onClick={() => {
                  if (generatedTempPass) {
                    navigator.clipboard.writeText(generatedTempPass);
                    setCopiedPass(true);
                    setTimeout(() => setCopiedPass(false), 2000);
                  }
                }}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer inline-flex items-center gap-1"
              >
                {copiedPass ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedPass ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-emerald-800 bg-emerald-50 p-3 rounded-xl border border-emerald-200">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>
              The user will be strictly forced to update this password to a permanent secure password upon their first login.
            </span>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => setShowResetModal(false)}
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </Modal>

      {/* ==================================================================== */}
      {/* MODAL: CREATE ROLE */}
      {/* ==================================================================== */}
      <Modal
        isOpen={showCreateRoleModal}
        onClose={() => setShowCreateRoleModal(false)}
        title="Create Custom Role"
      >
        <form onSubmit={handleCreateRole} className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Role Display Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Regional Sales Director"
              value={roleForm.name}
              onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Role Code (Uppercase Identifier)
            </label>
            <input
              type="text"
              required
              placeholder="e.g. REGIONAL_SALES_DIR"
              value={roleForm.code}
              onChange={(e) => setRoleForm({ ...roleForm, code: e.target.value.toUpperCase().replace(/\s+/g, '_') })}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Role Description
            </label>
            <textarea
              rows={3}
              placeholder="Brief description of the duties and access scope for this role"
              value={roleForm.description}
              onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowCreateRoleModal(false)}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm cursor-pointer"
            >
              Save Role
            </button>
          </div>
        </form>
      </Modal>

      {/* ==================================================================== */}
      {/* MODAL: EDIT ROLE */}
      {/* ==================================================================== */}
      {editingRole && (
        <Modal
          isOpen={showEditRoleModal}
          onClose={() => setShowEditRoleModal(false)}
          title={`Edit Role: ${editingRole.name}`}
        >
          <form onSubmit={handleEditRole} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Role Name
              </label>
              <input
                type="text"
                required
                value={editingRole.name}
                onChange={(e) => setEditingRole({ ...editingRole, name: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Description
              </label>
              <textarea
                rows={3}
                value={editingRole.description || ''}
                onChange={(e) => setEditingRole({ ...editingRole, description: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowEditRoleModal(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm cursor-pointer"
              >
                Update Role
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ==================================================================== */}
      {/* MODAL: DUPLICATE ROLE */}
      {/* ==================================================================== */}
      {duplicateTargetRole && (
        <Modal
          isOpen={showDuplicateModal}
          onClose={() => setShowDuplicateModal(false)}
          title={`Duplicate Role: ${duplicateTargetRole.name}`}
        >
          <form onSubmit={handleDuplicateRole} className="space-y-3.5">
            <p className="text-xs text-slate-600">
              This will create a new custom role with an exact clone of the {duplicateTargetRole.permissions_count || 0} permissions assigned to {duplicateTargetRole.name}.
            </p>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                New Role Name
              </label>
              <input
                type="text"
                required
                value={duplicateForm.new_name}
                onChange={(e) => setDuplicateForm({ ...duplicateForm, new_name: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                New Role Code
              </label>
              <input
                type="text"
                required
                value={duplicateForm.new_code}
                onChange={(e) => setDuplicateForm({ ...duplicateForm, new_code: e.target.value.toUpperCase().replace(/\s+/g, '_') })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDuplicateModal(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm cursor-pointer"
              >
                Duplicate &amp; Save
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
