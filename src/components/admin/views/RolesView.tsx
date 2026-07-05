import React, { useEffect, useState } from 'react';
import { 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  Users, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Info,
  Sliders,
  Check,
  X
} from 'lucide-react';
import { fetchUsers, updateUserRole, UserProfile, getSupabase } from '../../../lib/supabaseClient';
import { logAdminActivity } from '../../../lib/operations';

export default function RolesView() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Authentication & Authorization state
  const [currentUserRole, setCurrentUserRole] = useState<'admin' | 'staff' | 'customer' | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    async function init() {
      await loadCurrentUserRole();
      await loadUsers();
    }
    init();
  }, []);

  async function loadCurrentUserRole() {
    setIsAuthLoading(true);
    try {
      const client = getSupabase();
      if (client) {
        const { data: { user } } = await client.auth.getUser();
        if (user) {
          setCurrentUserEmail(user.email);
          const { data, error } = await client
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .maybeSingle();
          if (!error && data) {
            setCurrentUserRole(data.role);
            return;
          }
        }
      }
      
      // Sandbox fallback mode check
      const stored = localStorage.getItem('bakenye_demo_users');
      if (stored) {
        const demoUsers = JSON.parse(stored);
        const activeEmail = 'aaronwancha@gmail.com'; // Admin default session
        setCurrentUserEmail(activeEmail);
        const matched = demoUsers.find((u: any) => u.email === activeEmail);
        if (matched) {
          setCurrentUserRole(matched.role);
          return;
        }
      }
      
      setCurrentUserEmail('aaronwancha@gmail.com');
      setCurrentUserRole('admin');
    } catch (err) {
      console.error('Failed to resolve authenticated session role:', err);
      setCurrentUserRole('admin');
    } finally {
      setIsAuthLoading(false);
    }
  }

  useEffect(() => {
    let result = [...users];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(u => u.email.toLowerCase().includes(q));
    }
    if (roleFilter !== 'All') {
      result = result.filter(u => u.role === roleFilter);
    }
    setFilteredUsers(result);
  }, [users, search, roleFilter]);

  async function loadUsers() {
    setIsLoading(true);
    try {
      const data = await fetchUsers();
      setUsers(data);
    } catch (err) {
      console.error('Failed to load users for RolesView:', err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRoleChange(id: string, newRole: UserProfile['role']) {
    if (currentUserRole !== 'admin') {
      alert('Access Denied: You do not have Super Admin authority required to change system roles.');
      return;
    }

    const userToChange = users.find(u => u.id === id);
    if (!userToChange) return;

    if (userToChange.email === 'aaronwancha@gmail.com' && newRole !== 'admin') {
      alert('Action Blocked: To prevent lockout, you cannot revoke Super Admin role from the primary account (aaronwancha@gmail.com).');
      logAdminActivity(
        'Super Admin',
        'Role Demotion Blocked',
        `Attempted to demote primary Super Admin ${userToChange.email} to ${newRole.toUpperCase()} but was blocked to prevent platform lockout.`,
        'Roles',
        'Warning',
        id
      );
      return;
    }

    setUpdatingId(id);
    try {
      const updated = await updateUserRole(id, newRole);
      if (updated) {
        setUsers(prev => prev.map(u => u.id === id ? updated : u));
        
        logAdminActivity(
          'Super Admin',
          'Role Delegated',
          `Elevated user account ${updated.email} to administrative role: [${newRole.toUpperCase()}].`,
          'Roles',
          'Success',
          id
        );
      }
    } catch (err) {
      console.error('Failed to update user role:', err);
      alert('Could not update role. Ensure you have network access.');
    } finally {
      setUpdatingId(null);
    }
  }

  const permissionsMatrix = {
    admin: [
      { name: 'Moderate Artifact Contributions', allowed: true },
      { name: 'Write & Edit Historiographies', allowed: true },
      { name: 'Full Database & Backups Access', allowed: true },
      { name: 'Manage System Credentials', allowed: true },
      { name: 'Modify System Roles & Access', allowed: true },
      { name: 'Delete Storage Bucket Assets', allowed: true }
    ],
    staff: [
      { name: 'Moderate Artifact Contributions', allowed: true },
      { name: 'Write & Edit Historiographies', allowed: true },
      { name: 'Full Database & Backups Access', allowed: false },
      { name: 'Manage System Credentials', allowed: false },
      { name: 'Modify System Roles & Access', allowed: false },
      { name: 'Delete Storage Bucket Assets', allowed: true }
    ],
    customer: [
      { name: 'Moderate Artifact Contributions', allowed: false },
      { name: 'Write & Edit Historiographies', allowed: false },
      { name: 'Full Database & Backups Access', allowed: false },
      { name: 'Manage System Credentials', allowed: false },
      { name: 'Modify System Roles & Access', allowed: false },
      { name: 'Delete Storage Bucket Assets', allowed: false }
    ]
  };

  return (
    <div className="space-y-8 text-left">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-sans">Roles & Permissions</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-sans">
            Verify system roles, inspect fine-grained permissions, and delegate administration responsibilities.
          </p>
        </div>
        
        {isAuthLoading ? (
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Resolving session credentials...</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200/40 dark:border-slate-700/50">
            <Shield className="w-3.5 h-3.5 text-indigo-500" />
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 font-mono uppercase">
              Current Session: <span className="text-slate-800 dark:text-slate-200 font-black">{currentUserRole || 'customer'}</span>
            </span>
          </div>
        )}
      </div>

      {/* Security Authorization Banner for Non-Authorized Users */}
      {!isAuthLoading && currentUserRole !== 'admin' && (
        <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex items-start gap-3 animate-fade-in shadow-xs">
          <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-amber-800 dark:text-amber-400">Read-Only Mode Enabled</h4>
            <p className="text-xs text-amber-700/80 dark:text-amber-300/80 font-semibold leading-relaxed">
              Your account ({currentUserEmail}) is authenticated under the role level <span className="font-bold uppercase text-amber-600 dark:text-amber-400">[{currentUserRole || 'customer'}]</span>. 
              Modifying system access tiers or re-assigning administrative user roles is strictly restricted to authorized <strong>Super Administrators</strong> to ensure platform security.
            </p>
          </div>
        </div>
      )}

      {/* Role Definitions Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Administrator */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-rose-100 dark:border-rose-950/30 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-black text-sm text-slate-900 dark:text-white">Administrator</h3>
                <p className="text-[10px] text-rose-500 font-black uppercase tracking-wider">Superuser Access</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Complete administrative authority. Oversees core databases, manages security policies, and configures external integrations.
            </p>
            
            {/* List of Permission Indicators */}
            <div className="space-y-2.5 pt-4 border-t border-slate-100 dark:border-slate-700/50">
              {permissionsMatrix.admin.map((p, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs">
                  {p.allowed ? (
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : (
                    <X className="w-4 h-4 text-rose-500 shrink-0" />
                  )}
                  <span className={p.allowed ? 'text-slate-700 dark:text-slate-300 font-medium' : 'text-slate-400 font-medium line-through'}>
                    {p.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Staff member / Reporter */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-indigo-100 dark:border-indigo-950/30 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-black text-sm text-slate-900 dark:text-white">Staff Member</h3>
                <p className="text-[10px] text-indigo-500 font-black uppercase tracking-wider">Editor & Moderator</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Vets public submissions, curates the digital history archive, coordinates language dictionaries, and uploads media resources.
            </p>
            
            {/* List of Permission Indicators */}
            <div className="space-y-2.5 pt-4 border-t border-slate-100 dark:border-slate-700/50">
              {permissionsMatrix.staff.map((p, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs">
                  {p.allowed ? (
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : (
                    <X className="w-4 h-4 text-rose-500 shrink-0" />
                  )}
                  <span className={p.allowed ? 'text-slate-700 dark:text-slate-300 font-medium' : 'text-slate-400 font-medium line-through'}>
                    {p.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Regular Customer / Preservation Contributor */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700/50 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-500 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-black text-sm text-slate-900 dark:text-white">Public Contributor</h3>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-wider">Reader Access</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Can explore public historiographies, contribute custom narratives for review, and comment on clan lineage registries.
            </p>
            
            {/* List of Permission Indicators */}
            <div className="space-y-2.5 pt-4 border-t border-slate-100 dark:border-slate-700/50">
              {permissionsMatrix.customer.map((p, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs">
                  {p.allowed ? (
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : (
                    <X className="w-4 h-4 text-rose-500 shrink-0" />
                  )}
                  <span className={p.allowed ? 'text-slate-700 dark:text-slate-300 font-medium' : 'text-slate-400 font-medium line-through'}>
                    {p.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Detailed Side-by-Side Permissions Matrix Grid */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-[28px] border border-slate-100 dark:border-slate-700/50 shadow-sm space-y-4">
        <div>
          <h3 className="text-base font-serif font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-500" />
            <span>Detailed Permission Control Matrix</span>
          </h3>
          <p className="text-xs text-slate-400">Cross-reference administrative capability limits across all three security tiers.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700/40 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                <th className="py-3 px-4">System Capability / Operational Scope</th>
                <th className="py-3 px-4 text-center">Public Contributor</th>
                <th className="py-3 px-4 text-center">Staff Member</th>
                <th className="py-3 px-4 text-center">Super Administrator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/50 dark:divide-slate-700/30 text-xs font-medium text-slate-750 dark:text-slate-300">
              {[
                { 
                  name: 'Explore Public Historiographies & Archives', 
                  desc: 'Read-only access to published heritage articles, clans registries, and visual galleries.',
                  customer: true, staff: true, admin: true 
                },
                { 
                  name: 'Submit Cultural Artifacts & Stories', 
                  desc: 'Upload images to the public gallery or submit clans narratives for review.',
                  customer: true, staff: true, admin: true 
                },
                { 
                  name: 'Moderate Public Contributions', 
                  desc: 'Vetting community-submitted stories and media items for public publication.',
                  customer: false, staff: true, admin: true 
                },
                { 
                  name: 'Write & Edit Archival Historiographies', 
                  desc: 'Draft and format custom heritage articles, clan pages, or dictionary keywords.',
                  customer: false, staff: true, admin: true 
                },
                { 
                  name: 'Publish Archival Content Live', 
                  desc: 'Instantly publish drafted content to the live site feed, bypassing vetting queues.',
                  customer: false, staff: false, admin: true 
                },
                { 
                  name: 'Approve & Verify Registered Users', 
                  desc: 'Approve or reject pending registration accounts in the system signup hub.',
                  customer: false, staff: false, admin: true 
                },
                { 
                  name: 'Assign & Re-Delegate Access Roles', 
                  desc: 'Assign roles (Admin, Staff, Customer) to users or revoke administrative powers.',
                  customer: false, staff: false, admin: true 
                },
                { 
                  name: 'View Administrative Activity Audits', 
                  desc: 'Browse complete historical logs of administrative and system configuration actions.',
                  customer: false, staff: false, admin: true 
                },
                { 
                  name: 'Access Platform Health Telemetry', 
                  desc: 'Monitor database uptime, API response metrics, and connection latency.',
                  customer: false, staff: false, admin: true 
                }
              ].map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors">
                  <td className="py-3.5 px-4 max-w-sm">
                    <div className="font-bold text-slate-900 dark:text-white text-xs">{row.name}</div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 font-normal leading-relaxed mt-0.5">{row.desc}</div>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex justify-center">
                      {row.customer ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 bg-emerald-500/10 rounded-full p-0.5" />
                      ) : (
                        <XCircle className="w-5 h-5 text-slate-300 dark:text-slate-650" />
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex justify-center">
                      {row.staff ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 bg-emerald-500/10 rounded-full p-0.5" />
                      ) : (
                        <XCircle className="w-5 h-5 text-slate-300 dark:text-slate-650" />
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex justify-center">
                      {row.admin ? (
                        <CheckCircle2 className="w-5 h-5 text-indigo-500 bg-indigo-500/10 rounded-full p-0.5" />
                      ) : (
                        <XCircle className="w-5 h-5 text-slate-300 dark:text-slate-650" />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Roles Assignment Database Panel */}
      <div className="space-y-4 bg-white dark:bg-slate-800 p-6 rounded-[28px] border border-slate-100 dark:border-slate-700/50 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-base font-serif font-bold text-slate-900 dark:text-white">Delegation Database</h3>
            <p className="text-xs text-slate-400">Re-assign, revoke, or upgrade access levels across the user catalog.</p>
          </div>

          <div className="flex gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search user emails..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-200"
              />
            </div>
            
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 dark:text-slate-300"
            >
              <option value="All">All Roles</option>
              <option value="admin">Administrator</option>
              <option value="staff">Staff Member</option>
              <option value="customer">Customer</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto pt-2">
          {isLoading ? (
            <div className="flex flex-col justify-center items-center py-16 space-y-2">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              <span className="text-xs text-slate-400">Syncing delegation directory...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-16 text-slate-400 font-semibold text-xs">No matching user profiles found.</div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700/40 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  <th className="py-3">User Profile</th>
                  <th className="py-3">Email Address</th>
                  <th className="py-3">Joined Date</th>
                  <th className="py-3 text-right">Administrative Role Assignment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/50 dark:divide-slate-700/30 text-xs text-slate-600 dark:text-slate-300">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                    <td className="py-3 font-semibold text-slate-900 dark:text-white">{u.email.split('@')[0]}</td>
                    <td className="py-3 font-mono text-slate-500 dark:text-slate-400">{u.email}</td>
                    <td className="py-3 text-slate-400">{new Date(u.created_at).toLocaleDateString()}</td>
                    <td className="py-3 text-right">
                      <div className="flex justify-end items-center gap-2">
                        {updatingId === u.id ? (
                          <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
                        ) : (
                          <>
                            {currentUserRole !== 'admin' && (
                              <span className="text-[10px] text-slate-450 dark:text-slate-500 flex items-center gap-1 select-none font-black uppercase tracking-wider mr-1">
                                <Shield className="w-3.5 h-3.5 text-amber-500" />
                                <span>Read-Only</span>
                              </span>
                            )}
                            <select
                              value={u.role}
                              disabled={currentUserRole !== 'admin'}
                              onChange={(e) => handleRoleChange(u.id, e.target.value as UserProfile['role'])}
                              className="px-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg text-[11px] font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              <option value="admin">🛡️ Administrator</option>
                              <option value="staff">💼 Staff Member</option>
                              <option value="customer">👤 Public User</option>
                            </select>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
