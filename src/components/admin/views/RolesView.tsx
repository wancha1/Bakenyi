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
import { fetchUsers, updateUserRole, UserProfile } from '../../../lib/supabaseClient';

export default function RolesView() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

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
    setUpdatingId(id);
    try {
      const updated = await updateUserRole(id, newRole);
      if (updated) {
        setUsers(prev => prev.map(u => u.id === id ? updated : u));
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-sans">Roles & Permissions</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-sans">
          Verify system roles, inspect fine-grained permissions, and delegate administration responsibilities.
        </p>
      </div>

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
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.id, e.target.value as UserProfile['role'])}
                            className="px-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg text-[11px] font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          >
                            <option value="admin">🛡️ Administrator</option>
                            <option value="staff">💼 Staff Member</option>
                            <option value="customer">👤 Public User</option>
                          </select>
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
