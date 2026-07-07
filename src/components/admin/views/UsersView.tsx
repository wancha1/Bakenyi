import React, { useEffect, useState } from 'react';
import { 
  Users, 
  Search, 
  Shield, 
  Check, 
  X, 
  Calendar, 
  UserX, 
  UserCheck, 
  Loader2,
  Mail,
  ShieldAlert,
  Fingerprint,
  ThumbsUp,
  ThumbsDown,
  Info,
  Eye,
  Edit,
  Trash2,
  Camera,
  Clock,
  ShieldCheck,
  UserPlus
} from 'lucide-react';
import { 
  fetchUsers, 
  updateUserStatus, 
  updateUserRole, 
  updateUserProfile, 
  deleteUser, 
  UserProfile, 
  getSupabase, 
  getSupabaseConfig 
} from '../../../lib/supabaseClient';
import { logAdminActivity } from '../../../lib/operations';

export default function UsersView() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  
  // Auth state
  const [currentUserRole, setCurrentUserRole] = useState<'super_admin' | 'admin' | 'reporter' | 'public' | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Modal / Interaction states
  const [viewingUser, setViewingUser] = useState<UserProfile | null>(null);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Edit form states
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<UserProfile['role']>('customer');
  const [editStatus, setEditStatus] = useState<UserProfile['status']>('active');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');

  // Sample premium avatar presets
  const avatarPresets = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150',
    'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&q=80&w=150'
  ];

  const flashMessage = (msg: string) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(null), 4000);
  };

  useEffect(() => {
    async function init() {
      await loadCurrentUserRole();
      await loadUsers();
    }
    init();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, search, roleFilter, statusFilter]);

  async function loadCurrentUserRole() {
    setIsAuthLoading(true);
    try {
      const client = getSupabase();
      let emailVal = '';
      let rawRole = 'customer';
      if (client) {
        const { data: { user } } = await client.auth.getUser();
        if (user) {
          emailVal = user.email || '';
          const { data, error } = await client
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .maybeSingle();
          if (!error && data?.role) {
            rawRole = data.role;
          }
        }
      } else {
        const stored = localStorage.getItem('bakenye_sandbox_session');
        if (stored) {
          const u = JSON.parse(stored);
          emailVal = u.email || '';
        }
      }
      
      if (!emailVal) emailVal = 'admin@bakenye.com';

      const email = emailVal.toLowerCase();
      let role: 'super_admin' | 'admin' | 'reporter' | 'public' = 'public';
      if (email === 'superadmin@bakenye.com' || email === 'wanchaaaron@gmail.com' || email === 'aaronwancha@gmail.com') {
        role = 'super_admin';
      } else if (email === 'admin@bakenye.com' || email === 'admin@bakenyi.org' || rawRole === 'admin') {
        role = 'admin';
      } else if (email.includes('reporter') || email.includes('staff') || rawRole === 'staff' || rawRole === 'reporter') {
        role = 'reporter';
      }

      setCurrentUserEmail(emailVal);
      setCurrentUserRole(role);
    } catch (err) {
      console.error('Failed to resolve authenticated session role:', err);
      setCurrentUserRole('admin');
    } finally {
      setIsAuthLoading(false);
    }
  }

  async function loadUsers() {
    setIsLoading(true);
    try {
      const data = await fetchUsers();
      setUsers(data);
    } catch (err) {
      console.error('Failed to fetch user accounts:', err);
    } finally {
      setIsLoading(false);
    }
  }

  function filterUsers() {
    let result = [...users];

    // Search query (checks email, full_name, id)
    if (search.trim()) {
      const query = search.toLowerCase();
      result = result.filter(u => 
        u.email.toLowerCase().includes(query) || 
        (u.full_name || '').toLowerCase().includes(query) ||
        u.id.toLowerCase().includes(query)
      );
    }

    // Role filter
    if (roleFilter !== 'All') {
      result = result.filter(u => u.role === roleFilter.toLowerCase());
    }

    // Status filter
    if (statusFilter !== 'All') {
      result = result.filter(u => u.status === statusFilter.toLowerCase());
    }

    setFilteredUsers(result);
  }

  // Quick Action: Approve User Registration
  async function handleApprove(userId: string, targetRole: UserProfile['role']) {
    setIsSubmitting(true);
    try {
      await updateUserRole(userId, targetRole);
      const updated = await updateUserStatus(userId, 'active');
      
      if (updated) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'active', role: targetRole } : u));
        logAdminActivity(
          'Super Admin',
          'User Approved & Activated',
          `Approved registration for ${updated.email} and assigned role: [${targetRole.toUpperCase()}].`,
          'Roles',
          'Success',
          userId
        );
        flashMessage(`Account for ${updated.email} activated successfully as ${targetRole.toUpperCase()}.`);
        
        // Sync triggers for external views
        window.dispatchEvent(new Event('bakenye_operations_updated'));
      }
    } catch (err) {
      console.error('Failed to approve registration:', err);
      alert('Failed to approve registration.');
    } finally {
      setIsSubmitting(false);
    }
  }

  // Quick Action: Reject / Suspend Registration
  async function handleReject(user: UserProfile) {
    if (window.confirm(`Are you sure you want to REJECT and suspend the registration of ${user.email}?`)) {
      setIsSubmitting(true);
      try {
        const updated = await updateUserStatus(user.id, 'suspended');
        if (updated) {
          setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: 'suspended' } : u));
          logAdminActivity(
            'Super Admin',
            'User Registration Rejected',
            `Denied registration application for ${user.email}. Status set to suspended.`,
            'Security',
            'Warning',
            user.id
          );
          flashMessage(`Registration for ${user.email} has been suspended.`);
          window.dispatchEvent(new Event('bakenye_operations_updated'));
        }
      } catch (err) {
        console.error('Failed to reject registration:', err);
        alert('Failed to reject registration.');
      } finally {
        setIsSubmitting(false);
      }
    }
  }

  // Quick Action: Toggle Status (Suspend / Reactivate)
  async function handleToggleStatus(user: UserProfile) {
    const nextStatus: UserProfile['status'] = user.status === 'active' ? 'suspended' : 'active';
    const label = nextStatus === 'suspended' ? 'SUSPEND' : 'ACTIVATE';
    
    if (window.confirm(`Are you sure you want to ${label} the user account ${user.email}?`)) {
      try {
        const updated = await updateUserStatus(user.id, nextStatus);
        if (updated) {
          setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: nextStatus } : u));
          logAdminActivity(
            'Super Admin',
            nextStatus === 'suspended' ? 'Account Suspended' : 'Account Re-activated',
            `Manually toggled account status for ${user.email} to ${nextStatus.toUpperCase()}.`,
            'Security',
            nextStatus === 'suspended' ? 'Warning' : 'Success',
            user.id
          );
          flashMessage(`Account for ${user.email} is now ${nextStatus.toUpperCase()}.`);
          window.dispatchEvent(new Event('bakenye_operations_updated'));
        }
      } catch (err) {
        console.error('Failed to toggle status:', err);
      }
    }
  }

  // Delete Action: Elder Only
  async function handleDeleteUser(user: UserProfile) {
    if (currentUserRole !== 'admin' && currentUserRole !== 'super_admin') {
      alert('Access Denied: Only Elders can delete user profiles.');
      return;
    }

    if (user.email === 'aaronwancha@gmail.com') {
      alert('Action Blocked: To prevent lockouts, the primary administrator account cannot be deleted.');
      return;
    }

    if (window.confirm(`⚠️ WARNING: Are you sure you want to PERMANENTLY DELETE ${user.email}? This action is irreversible and deletes their entire database profile record.`)) {
      try {
        const success = await deleteUser(user.id);
        if (success) {
          setUsers(prev => prev.filter(u => u.id !== user.id));
          logAdminActivity(
            'Elder',
            'Profile Deleted',
            `Permanently deleted database profile record for ${user.email} (${user.id}).`,
            'Security',
            'Error',
            user.id
          );
          flashMessage(`Permanently deleted user account ${user.email}`);
          window.dispatchEvent(new Event('bakenye_operations_updated'));
        }
      } catch (err) {
        console.error('Failed to delete user:', err);
        alert('Failed to delete user record.');
      }
    }
  }

  // Edit Modal triggers
  const startEditing = (user: UserProfile) => {
    setEditingUser(user);
    setEditFullName(user.full_name || user.email.split('@')[0]);
    setEditEmail(user.email);
    setEditRole(user.role);
    setEditStatus(user.status);
    setEditAvatarUrl(user.avatar_url || '');
  };

  // Submit profile edits
  async function handleSaveProfileEdits(e: React.FormEvent) {
    e.preventDefault();
    if (!editingUser) return;

    setIsSubmitting(true);
    try {
      const updates = {
        full_name: editFullName,
        email: editEmail,
        role: editRole,
        status: editStatus,
        avatar_url: editAvatarUrl
      };

      const updated = await updateUserProfile(editingUser.id, updates);
      if (updated) {
        setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, ...updated } : u));
        logAdminActivity(
          'Super Admin',
          'User Profile Edited',
          `Modified profile details for ${editEmail}. Saved metadata updates.`,
          'Roles',
          'Success',
          editingUser.id
        );
        flashMessage(`Profile for ${editEmail} updated successfully.`);
        setEditingUser(null);
        window.dispatchEvent(new Event('bakenye_operations_updated'));
      }
    } catch (err) {
      console.error('Failed to update user profile:', err);
      alert('Failed to save profile edits.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const { isConfigured } = getSupabaseConfig();

  return (
    <div className="space-y-6 text-left">
      {/* Toast notifications */}
      {actionMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white border border-slate-800 rounded-2xl px-5 py-3.5 shadow-xl flex items-center space-x-2.5 animate-slide-up text-xs font-bold">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white font-sans flex items-center gap-2">
            <Fingerprint className="w-5 h-5 text-indigo-500" />
            <span>Registration & Identity Hub</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-sans">
            Review registration requests, manage credentials, edit details, and modify administrative system access.
          </p>
        </div>
        
        {/* Live Counters */}
        <div className="flex items-center gap-2.5 bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700 p-2 rounded-2xl shrink-0">
          <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-xl text-center">
            <span className="block text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">Review Queue</span>
            <span className="text-sm font-black text-amber-600 dark:text-amber-400">
              {users.filter(u => u.status === 'pending').length} Pending
            </span>
          </div>
          <div className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-center">
            <span className="block text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Total Accounts</span>
            <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">
              {users.length} Registered
            </span>
          </div>
        </div>
      </div>

      {/* Security Warning for Non-Admins */}
      {!isAuthLoading && currentUserRole !== 'admin' && currentUserRole !== 'super_admin' && (
        <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex items-start gap-3 shadow-xs">
          <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-amber-800 dark:text-amber-400">Restricted Operations Mode</h4>
            <p className="text-xs text-amber-700/80 dark:text-amber-300/80 font-semibold leading-relaxed">
              You are signed in as <strong>{currentUserRole?.toUpperCase() || 'MEMBER'}</strong>.
              Only certified <strong>Elders</strong> can perform database profile modifications, role promotions, account suspensions, or permanent user deletions.
            </p>
          </div>
        </div>
      )}

      {/* Filters and Controls */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative w-full flex-grow">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, or user identifier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto shrink-0">
          <div className="flex-1 md:w-44">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 dark:text-slate-300"
            >
              <option value="All">All Roles</option>
              <option value="Admin">Administrators</option>
              <option value="Staff">Staff Members</option>
              <option value="Customer">Standard Members</option>
            </select>
          </div>

          <div className="flex-1 md:w-44">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 dark:text-slate-300"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active Accounts</option>
              <option value="Pending">Pending Approvals</option>
              <option value="Suspended">Suspended / Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col justify-center items-center h-64 space-y-2">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Retrieving Identities...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-20 text-slate-400 space-y-3">
            <Users className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">No identities match your parameters</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mx-auto leading-normal">
              Try modifying your search text, role filter settings, or status values to locate specific preservers.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700/40 text-left text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  <th className="p-4">Identity Profile</th>
                  <th className="p-4 hidden md:table-cell">Contact Address</th>
                  <th className="p-4">System Role</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 hidden sm:table-cell">Joined Date</th>
                  <th className="p-4 hidden lg:table-cell">Last Login</th>
                  <th className="p-4 text-center">Operations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/50 dark:divide-slate-700/30 text-xs font-semibold">
                {filteredUsers.map((u) => {
                  const roleLabels = {
                    admin: '🛡️ Admin',
                    staff: '💼 Staff Reporter',
                    customer: '👤 Culturer'
                  };

                  const roleColors = {
                    admin: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/30 dark:text-indigo-300 border border-indigo-200/20',
                    staff: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300 border border-emerald-200/20',
                    customer: 'bg-slate-100 text-slate-850 dark:bg-slate-700/30 dark:text-slate-300 border border-slate-200/20'
                  };

                  const isPending = u.status === 'pending';
                  const isSuspended = u.status === 'suspended';

                  // Fallback values
                  const fullName = u.full_name || u.email.split('@')[0];
                  const initials = fullName.substring(0, 2).toUpperCase();

                  return (
                    <tr key={u.id} className="text-slate-600 dark:text-slate-350 hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {u.avatar_url ? (
                            <img 
                              src={u.avatar_url} 
                              alt={fullName} 
                              className="w-9 h-9 rounded-full object-cover border dark:border-slate-700" 
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-indigo-50 dark:bg-indigo-950/40 border dark:border-slate-700 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-xs uppercase shadow-xs">
                              {initials}
                            </div>
                          )}
                          <div className="text-left">
                            <div className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                              <span>{fullName}</span>
                              {u.email === 'aaronwancha@gmail.com' && (
                                <span className="bg-indigo-600 text-[8px] text-white px-1 py-0.2 rounded-sm uppercase tracking-widest font-black">Super</span>
                              )}
                            </div>
                            <div className="text-[9px] text-slate-400 dark:text-slate-500 font-mono uppercase tracking-wider">{u.id}</div>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 hidden md:table-cell text-slate-750 dark:text-slate-300">
                        <div className="flex items-center gap-1.5 font-medium">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{u.email}</span>
                        </div>
                      </td>

                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${roleColors[u.role] || roleColors.customer}`}>
                          {roleLabels[u.role] || u.role}
                        </span>
                      </td>

                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                          isPending
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300 border border-amber-500/20'
                            : isSuspended
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/30 dark:text-rose-300 border border-rose-500/20'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300 border border-emerald-500/20'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            isPending ? 'bg-amber-500 animate-ping' : isSuspended ? 'bg-rose-500' : 'bg-emerald-500'
                          }`} />
                          <span>{u.status}</span>
                        </span>
                      </td>

                      <td className="p-4 hidden sm:table-cell font-mono text-slate-400 dark:text-slate-500">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>

                      <td className="p-4 hidden lg:table-cell font-mono text-slate-400 dark:text-slate-500">
                        {u.last_login ? new Date(u.last_login).toLocaleString() : new Date(u.created_at).toLocaleString()}
                      </td>

                      <td className="p-4">
                        <div className="flex items-center justify-center gap-1">
                          {/* Details Button */}
                          <button
                            onClick={() => setViewingUser(u)}
                            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl transition-all cursor-pointer"
                            title="View complete user details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Approval workflows for pending accounts */}
                          {isPending ? (
                            <>
                              <button
                                onClick={() => handleApprove(u.id, 'staff')}
                                disabled={isSubmitting || currentUserRole !== 'super_admin'}
                                className="p-1.5 text-emerald-600 hover:text-white hover:bg-emerald-600 disabled:opacity-40 rounded-xl transition-all cursor-pointer"
                                title="Approve as Content Staff"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleReject(u)}
                                disabled={isSubmitting || currentUserRole !== 'super_admin'}
                                className="p-1.5 text-rose-600 hover:text-white hover:bg-rose-600 disabled:opacity-40 rounded-xl transition-all cursor-pointer"
                                title="Deny application"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              {/* Edit Button */}
                              <button
                                onClick={() => startEditing(u)}
                                disabled={currentUserRole !== 'super_admin'}
                                className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl transition-all cursor-pointer"
                                title="Edit profile details & metadata"
                              >
                                <Edit className="w-4 h-4" />
                              </button>

                              {/* Direct suspend / activate action toggle */}
                              <button
                                onClick={() => handleToggleStatus(u)}
                                disabled={currentUserRole !== 'super_admin'}
                                className={`p-1.5 rounded-xl transition-all disabled:opacity-40 cursor-pointer ${
                                  isSuspended
                                    ? 'text-emerald-600 hover:bg-emerald-500/10'
                                    : 'text-rose-600 hover:bg-rose-500/10'
                                }`}
                                title={isSuspended ? 'Re-activate user account' : 'Suspend user account'}
                              >
                                {isSuspended ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                              </button>
                            </>
                          )}

                          {/* Delete - ONLY Super Admin can see/perform */}
                          {currentUserRole === 'super_admin' && (
                            <button
                              onClick={() => handleDeleteUser(u)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-550/10 rounded-xl transition-all cursor-pointer"
                              title="Permanently remove profile from database"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* MODAL 1: VIEW PROFILE CARD */}
      {/* ========================================================= */}
      {viewingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 max-w-md w-full shadow-2xl relative overflow-hidden text-left p-6 space-y-6">
            <button 
              onClick={() => setViewingUser(null)}
              className="absolute right-4 top-4 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center space-y-4 pt-4">
              <div className="relative inline-block mx-auto">
                {viewingUser.avatar_url ? (
                  <img 
                    src={viewingUser.avatar_url} 
                    alt={viewingUser.full_name || viewingUser.email} 
                    className="w-20 h-20 rounded-full object-cover mx-auto border-4 border-indigo-50 dark:border-indigo-950/50 shadow-md"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-2xl uppercase mx-auto border shadow-sm">
                    {(viewingUser.full_name || viewingUser.email).substring(0, 2).toUpperCase()}
                  </div>
                )}
                <span className={`absolute bottom-0 right-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-800 ${
                  viewingUser.status === 'active' ? 'bg-emerald-500' : viewingUser.status === 'pending' ? 'bg-amber-500' : 'bg-rose-500'
                }`} />
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white font-sans flex items-center justify-center gap-1.5">
                  <span>{viewingUser.full_name || viewingUser.email.split('@')[0]}</span>
                  {viewingUser.email === 'aaronwancha@gmail.com' && (
                    <span className="bg-indigo-600 text-[8px] text-white px-1 py-0.2 rounded-sm uppercase tracking-widest font-black">Super</span>
                  )}
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-mono tracking-wider">{viewingUser.id}</p>
              </div>

              <div className="flex items-center justify-center gap-2">
                <span className="px-2.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 text-[9px] font-bold uppercase tracking-wider rounded-md">
                  {viewingUser.role.toUpperCase()}
                </span>
                <span className={`px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-full ${
                  viewingUser.status === 'active' 
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30' 
                    : viewingUser.status === 'pending'
                    ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/30'
                    : 'bg-rose-50 text-rose-700 dark:bg-rose-950/30'
                }`}>
                  {viewingUser.status}
                </span>
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-700/50 pt-4 space-y-3.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 dark:text-slate-500 font-bold uppercase text-[9px] tracking-wider">Contact Address</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{viewingUser.email}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 dark:text-slate-500 font-bold uppercase text-[9px] tracking-wider">Join Timestamp</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {new Date(viewingUser.created_at).toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 dark:text-slate-500 font-bold uppercase text-[9px] tracking-wider">Last Recorded Login</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {viewingUser.last_login ? new Date(viewingUser.last_login).toLocaleString() : new Date(viewingUser.created_at).toLocaleString()}
                </span>
              </div>

              <div className="flex items-start justify-between gap-4 pt-2 border-t border-slate-50 dark:border-slate-700/30">
                <span className="text-slate-400 dark:text-slate-500 font-bold uppercase text-[9px] tracking-wider mt-0.5">Permissions</span>
                <p className="font-semibold text-slate-600 dark:text-slate-400 text-[10px] text-right leading-relaxed">
                  {viewingUser.role === 'admin' 
                    ? 'Superuser status. Complete structural command, role delegations, content publisher workflows and logs inspection.'
                    : viewingUser.role === 'staff'
                    ? 'Reporter status. Authorized to publish digital assets and draft historiographies. Vetting checks mandatory for updates.'
                    : 'Standard community reader permissions. Digital archives viewing and digital contributions uploads only.'}
                </p>
              </div>
            </div>

            <button 
              onClick={() => setViewingUser(null)}
              className="w-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-150 dark:hover:bg-slate-650 text-slate-700 dark:text-slate-200 py-3 rounded-xl text-xs font-black uppercase tracking-wider text-center cursor-pointer transition-colors"
            >
              Close Profile
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: EDIT PROFILE FORM */}
      {/* ========================================================= */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 max-w-lg w-full shadow-2xl relative overflow-hidden text-left p-6 space-y-5">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700/60 pb-3">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                <Edit className="w-4 h-4 text-indigo-500" />
                <span>Configure Profile Registry</span>
              </h3>
              <button 
                onClick={() => setEditingUser(null)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfileEdits} className="space-y-4 text-xs">
              
              {/* Full Name & Email row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-600 dark:text-slate-400 block uppercase text-[10px] tracking-wider">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
                    placeholder="Enter full name"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-600 dark:text-slate-400 block uppercase text-[10px] tracking-wider">Email Address</label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              {/* Role & Status row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-600 dark:text-slate-400 block uppercase text-[10px] tracking-wider">Assign Role</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as UserProfile['role'])}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 dark:text-slate-300"
                  >
                    <option value="customer">👤 Standard Culturer (customer)</option>
                    <option value="staff">💼 Staff Reporter (staff)</option>
                    <option value="admin">🛡️ Elder Administrator (admin)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-600 dark:text-slate-400 block uppercase text-[10px] tracking-wider">Account Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as UserProfile['status'])}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 dark:text-slate-300"
                  >
                    <option value="active">Active</option>
                    <option value="pending">Pending Review</option>
                    <option value="suspended">Suspended / Rejected</option>
                  </select>
                </div>
              </div>

              {/* Avatar Preset selections */}
              <div className="space-y-2">
                <label className="font-bold text-slate-600 dark:text-slate-400 block uppercase text-[10px] tracking-wider">Profile Photo Preset</label>
                <div className="flex gap-2.5 items-center flex-wrap">
                  {avatarPresets.map((av, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setEditAvatarUrl(av)}
                      className={`relative rounded-full overflow-hidden w-11 h-11 border-2 transition-transform cursor-pointer ${
                        editAvatarUrl === av ? 'border-indigo-600 scale-110 shadow-md' : 'border-slate-100 dark:border-slate-700 hover:scale-105'
                      }`}
                    >
                      <img src={av} alt="Preset avatar" className="w-full h-full object-cover" />
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setEditAvatarUrl('')}
                    className={`w-11 h-11 rounded-full border-2 flex items-center justify-center text-[10px] font-bold text-slate-500 dark:text-slate-400 cursor-pointer ${
                      editAvatarUrl === '' ? 'border-indigo-600 text-indigo-600 font-bold bg-indigo-50 dark:bg-indigo-950/25' : 'border-slate-100 dark:border-slate-700'
                    }`}
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Custom Photo URL Input */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-600 dark:text-slate-400 block uppercase text-[10px] tracking-wider">Custom Profile Photo URL</label>
                <div className="relative">
                  <Camera className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="url"
                    value={editAvatarUrl}
                    onChange={(e) => setEditAvatarUrl(e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-700/60 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-650 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Save Profile Updates</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
