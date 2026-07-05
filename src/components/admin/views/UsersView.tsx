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
  UserCheck2,
  ShieldAlert,
  Fingerprint,
  Radio,
  BadgeAlert,
  ThumbsUp,
  ThumbsDown,
  Info
} from 'lucide-react';
import { fetchUsers, updateUserStatus, updateUserRole, UserProfile } from '../../../lib/supabaseClient';
import { logAdminActivity } from '../../../lib/operations';

export default function UsersView() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'pending' | 'active'>('pending');
  
  // Registration review state
  const [reviewingUser, setReviewingUser] = useState<UserProfile | null>(null);
  const [selectedRole, setSelectedRole] = useState<'admin' | 'staff' | 'customer'>('customer');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, search, roleFilter, activeSubTab]);

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

    // Filter by sub-tab status
    if (activeSubTab === 'pending') {
      result = result.filter(u => u.status === 'pending');
    } else {
      result = result.filter(u => u.status === 'active' || u.status === 'suspended');
    }

    // Search query
    if (search.trim()) {
      const query = search.toLowerCase();
      result = result.filter(
        u => u.email.toLowerCase().includes(query)
      );
    }

    // Role filter (only applicable to active users)
    if (activeSubTab === 'active' && roleFilter !== 'All') {
      result = result.filter(u => u.role === roleFilter);
    }

    setFilteredUsers(result);
  }

  // Workflow Action: Approve User Registration
  async function handleApprove(userId: string, targetRole: UserProfile['role']) {
    setIsSubmitting(true);
    try {
      // 1. Assign selected role
      await updateUserRole(userId, targetRole);
      // 2. Set status to active
      const updated = await updateUserStatus(userId, 'active');
      
      if (updated) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'active', role: targetRole } : u));
        
        // Write to Platform Audit Trails
        logAdminActivity(
          'Super Admin',
          'User Approved & Activated',
          `Approved registration for ${updated.email} and assigned role: [${targetRole.toUpperCase()}].`,
          'Roles',
          'Success',
          userId
        );
        
        alert(`Account for ${updated.email} has been successfully activated with the ${targetRole.toUpperCase()} role.`);
      }
      setReviewingUser(null);
    } catch (err) {
      console.error('Failed to approve registration:', err);
      alert('Failed to approve registration.');
    } finally {
      setIsSubmitting(false);
    }
  }

  // Workflow Action: Reject User Registration
  async function handleReject(user: UserProfile) {
    if (window.confirm(`Are you sure you want to REJECT and permanently suspend the registration of ${user.email}?`)) {
      setIsSubmitting(true);
      try {
        const updated = await updateUserStatus(user.id, 'suspended');
        if (updated) {
          setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: 'suspended' } : u));
          
          // Log to audit trails
          logAdminActivity(
            'Super Admin',
            'User Registration Rejected',
            `Denied registration application for ${user.email}. Status set to suspended.`,
            'Security',
            'Warning',
            user.id
          );
          
          alert(`Registration for ${user.email} has been rejected.`);
        }
        setReviewingUser(null);
      } catch (err) {
        console.error('Failed to reject registration:', err);
        alert('Failed to reject registration.');
      } finally {
        setIsSubmitting(false);
      }
    }
  }

  // Toggle suspension status of already active users
  async function toggleStatus(id: string, currentStatus: UserProfile['status'], email: string) {
    const nextStatus: UserProfile['status'] = currentStatus === 'active' ? 'suspended' : 'active';
    const label = nextStatus === 'suspended' ? 'SUSPEND' : 'RE-ACTIVATE';
    
    if (window.confirm(`Are you sure you want to ${label} the user account ${email}?`)) {
      try {
        const updated = await updateUserStatus(id, nextStatus);
        if (updated) {
          setUsers(prev => prev.map(u => u.id === id ? updated : u));
          
          // Log Activity
          logAdminActivity(
            'Super Admin',
            nextStatus === 'suspended' ? 'Account Suspended' : 'Account Re-activated',
            `Manually toggled account status for ${email} to ${nextStatus.toUpperCase()}.`,
            'Security',
            nextStatus === 'suspended' ? 'Warning' : 'Success',
            id
          );
        }
      } catch (err) {
        console.error('Failed to toggle status:', err);
      }
    }
  }

  const pendingCount = users.filter(u => u.status === 'pending').length;

  return (
    <div className="space-y-6 text-left">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white font-sans flex items-center gap-2">
            <Fingerprint className="w-5 h-5 text-indigo-500" />
            <span>Registration & Identity Hub</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-sans">
            Verify new signups, delegate operational roles, and regulate administrative system access.
          </p>
        </div>
        
        {/* Live Counters */}
        <div className="flex items-center gap-2.5 bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700 p-2 rounded-2xl">
          <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-xl text-center">
            <span className="block text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">Review Queue</span>
            <span className="text-sm font-black text-amber-600 dark:text-amber-400">{pendingCount} Pending</span>
          </div>
          <div className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-center">
            <span className="block text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Total Accounts</span>
            <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">{users.length} Registered</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-2 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-xs">
        <div className="flex gap-2">
          <button
            onClick={() => { setActiveSubTab('pending'); setReviewingUser(null); }}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'pending'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700/30'
            }`}
          >
            <span>Registration Vetting Queue</span>
            {pendingCount > 0 && (
              <span className="bg-amber-500 text-slate-950 font-black text-[9px] px-2 py-0.5 rounded-full animate-pulse">
                {pendingCount}
              </span>
            )}
          </button>
          
          <button
            onClick={() => { setActiveSubTab('active'); setReviewingUser(null); }}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeSubTab === 'active'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700/30'
            }`}
          >
            All Active Accounts
          </button>
        </div>
      </div>

      {/* Main split work layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Users Grid/List */}
        <div className={`${reviewingUser && activeSubTab === 'pending' ? 'lg:col-span-7' : 'lg:col-span-12'} space-y-4 transition-all duration-300`}>
          
          {/* Filters Bar */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative w-full flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by registered email address..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-850 dark:text-slate-100"
              />
            </div>

            {activeSubTab === 'active' && (
              <div className="w-full sm:w-auto shrink-0">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full sm:w-44 px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 dark:text-slate-300"
                >
                  <option value="All">All Roles</option>
                  <option value="admin">Administrators</option>
                  <option value="staff">Staff Members</option>
                  <option value="customer">Standard Members</option>
                </select>
              </div>
            )}
          </div>

          {/* Table Card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="flex flex-col justify-center items-center h-64 space-y-2">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Retrieving Identities...</span>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-24 text-slate-400 space-y-3">
                <Users className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600" />
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  {activeSubTab === 'pending' ? ' Vetting Queue is Clear' : 'No records match search'}
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mx-auto leading-normal">
                  {activeSubTab === 'pending' 
                    ? 'No signups are currently awaiting administrative review and approval before onboarding.'
                    : 'Try checking spelling or adjusting the dropdown filters.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-700/40 text-left text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      <th className="p-4">Identities</th>
                      <th className="p-4 hidden md:table-cell">Contact Credentials</th>
                      {activeSubTab === 'active' && <th className="p-4">Assigned Role</th>}
                      <th className="p-4">Registered Date</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-center">Operational Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/50 dark:divide-slate-700/30 text-xs font-semibold">
                    {filteredUsers.map((u) => {
                      const roleLabels = {
                        admin: '🛡️ Administrator',
                        staff: '💼 Staff / Editor',
                        customer: '👤 Culturer'
                      };
                      
                      const roleColors = {
                        admin: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/30 dark:text-indigo-300 border border-indigo-200/20',
                        staff: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300 border border-emerald-200/20',
                        customer: 'bg-slate-100 text-slate-800 dark:bg-slate-700/30 dark:text-slate-300 border border-slate-200/20'
                      };

                      const isPending = u.status === 'pending';
                      const isSuspended = u.status === 'suspended';

                      return (
                        <tr key={u.id} className="text-slate-600 dark:text-slate-350 hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-900 border dark:border-slate-750 text-slate-800 dark:text-slate-200 flex items-center justify-center font-black text-xs uppercase shadow-xs">
                                {u.email.substring(0, 2)}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 dark:text-white text-sm">{u.email.split('@')[0]}</div>
                                <div className="text-[9px] text-slate-400 dark:text-slate-500 font-mono uppercase">{u.id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 hidden md:table-cell">
                            <div className="flex items-center gap-1.5 font-medium text-slate-750 dark:text-slate-300">
                              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{u.email}</span>
                            </div>
                          </td>
                          {activeSubTab === 'active' && (
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${roleColors[u.role]}`}>
                                {roleLabels[u.role]}
                              </span>
                            </td>
                          )}
                          <td className="p-4 font-mono text-slate-400 dark:text-slate-500">
                            {new Date(u.created_at).toLocaleDateString()}
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
                          <td className="p-4 text-center">
                            {isPending ? (
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => handleApprove(u.id, u.role || 'customer')}
                                  disabled={isSubmitting}
                                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer shadow-sm flex items-center gap-1 transition-all"
                                  title="Directly approve and activate user account"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Approve</span>
                                </button>
                                <button
                                  onClick={() => handleReject(u)}
                                  disabled={isSubmitting}
                                  className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer shadow-sm flex items-center gap-1 transition-all"
                                  title="Reject and suspend user registration"
                                >
                                  <ThumbsDown className="w-3.5 h-3.5" />
                                  <span>Reject</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setReviewingUser(u);
                                    setSelectedRole(u.role || 'customer');
                                  }}
                                  disabled={isSubmitting}
                                  className="px-2 py-1.5 bg-slate-150 hover:bg-slate-200 text-slate-700 dark:bg-slate-750 dark:hover:bg-slate-700 dark:text-slate-200 rounded-xl text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all"
                                  title="Review details and assign customized administrative roles"
                                >
                                  <span>Details</span>
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => toggleStatus(u.id, u.status, u.email)}
                                className={`px-3 py-1.5 rounded-xl font-bold uppercase text-[9px] tracking-wider flex items-center justify-center gap-1 mx-auto transition-all cursor-pointer border ${
                                  isSuspended
                                    ? 'bg-emerald-500/10 hover:bg-emerald-500 text-emerald-600 dark:text-emerald-400 hover:text-white border-emerald-500/15'
                                    : 'bg-rose-500/10 hover:bg-rose-500 text-rose-600 dark:text-rose-400 hover:text-white border-rose-500/15'
                                }`}
                              >
                                {isSuspended ? (
                                  <>
                                    <UserCheck className="w-3.5 h-3.5" />
                                    <span>Re-activate</span>
                                  </>
                                ) : (
                                  <>
                                    <UserX className="w-3.5 h-3.5" />
                                    <span>Suspend</span>
                                  </>
                                )}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

        {/* Right Side: Vetting Action Panel (Active when reviewing a user) */}
        {reviewingUser && activeSubTab === 'pending' && (
          <div className="lg:col-span-5 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-6 shadow-md h-fit space-y-6 animate-fade-in text-left">
            
            {/* Header info */}
            <div className="flex justify-between items-start pb-4 border-b border-slate-100 dark:border-slate-700">
              <div className="space-y-1">
                <span className="px-2 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/15 rounded-md text-[9px] font-black uppercase tracking-wider">
                  Approval Vetting Workstation
                </span>
                <h3 className="text-base font-bold text-slate-950 dark:text-white font-sans">
                  Identity Review Form
                </h3>
              </div>
              <button
                onClick={() => setReviewingUser(null)}
                className="p-1.5 bg-slate-100 dark:bg-slate-700 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Profile Summary Card */}
            <div className="bg-slate-50 dark:bg-slate-900/55 p-4 rounded-2xl border border-slate-100 dark:border-slate-750/30 space-y-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 font-black text-sm flex items-center justify-center uppercase">
                  {reviewingUser.email.substring(0, 2)}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{reviewingUser.email.split('@')[0]}</h4>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono uppercase">ID: {reviewingUser.id}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-200/50 dark:border-slate-850 text-[11px]">
                <div>
                  <span className="block text-[9px] text-slate-400 dark:text-slate-500 font-black uppercase">Email Address</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300 break-all">{reviewingUser.email}</span>
                </div>
                <div>
                  <span className="block text-[9px] text-slate-400 dark:text-slate-500 font-black uppercase">Registered Timestamp</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    {new Date(reviewingUser.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Step 1: Assign administrative Role */}
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 block">
                STEP 1: DELEGATE CORE ADMINISTRATIVE ROLE
              </label>
              
              <div className="space-y-2.5">
                {/* Customer (Regular Member) */}
                <label className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer select-none transition-all ${
                  selectedRole === 'customer'
                    ? 'border-indigo-600 bg-indigo-500/5 dark:bg-indigo-500/10'
                    : 'border-slate-100 dark:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-900/10'
                }`}>
                  <input
                    type="radio"
                    name="vet_role"
                    checked={selectedRole === 'customer'}
                    onChange={() => setSelectedRole('customer')}
                    className="mt-1 accent-indigo-600"
                  />
                  <div>
                    <span className="block text-xs font-bold text-slate-900 dark:text-white">👤 Standard Member (customer)</span>
                    <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-medium leading-normal mt-0.5">
                      Standard membership. Grants access to view digital archives, submit community contributions, and download PDF documents.
                    </span>
                  </div>
                </label>

                {/* Staff / Editor */}
                <label className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer select-none transition-all ${
                  selectedRole === 'staff'
                    ? 'border-indigo-600 bg-indigo-500/5 dark:bg-indigo-500/10'
                    : 'border-slate-100 dark:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-900/10'
                }`}>
                  <input
                    type="radio"
                    name="vet_role"
                    checked={selectedRole === 'staff'}
                    onChange={() => setSelectedRole('staff')}
                    className="mt-1 accent-indigo-600"
                  />
                  <div>
                    <span className="block text-xs font-bold text-slate-900 dark:text-white">💼 Content Staff / Reporter (staff)</span>
                    <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-medium leading-normal mt-0.5">
                      Grants access to create articles and upload cultural assets. All published articles are put in Pending review for admin oversight.
                    </span>
                  </div>
                </label>

                {/* Administrator */}
                <label className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer select-none transition-all ${
                  selectedRole === 'admin'
                    ? 'border-indigo-600 bg-indigo-500/5 dark:bg-indigo-500/10'
                    : 'border-slate-100 dark:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-900/10'
                }`}>
                  <input
                    type="radio"
                    name="vet_role"
                    checked={selectedRole === 'admin'}
                    onChange={() => setSelectedRole('admin')}
                    className="mt-1 accent-indigo-600"
                  />
                  <div>
                    <span className="block text-xs font-bold text-slate-900 dark:text-white">🛡️ Super Administrator (admin)</span>
                    <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-medium leading-normal mt-0.5">
                      Full access controls. Grants the capability to review user registrations, moderate contents, grant roles, and inspect system telemetry.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Step 2: Approve or Reject buttons */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-700 space-y-2.5">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleApprove(reviewingUser.id, selectedRole)}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-indigo-600/10 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Approve Application & Activate Account</span>
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleReject(reviewingUser)}
                className="w-full flex items-center justify-center gap-2 py-3 border border-rose-250 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
              >
                <ThumbsDown className="w-4 h-4" />
                <span>Deny & Suspend Application</span>
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
