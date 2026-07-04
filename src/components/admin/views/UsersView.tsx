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
  UserCheck2
} from 'lucide-react';
import { fetchUsers, updateUserStatus, UserProfile } from '../../../lib/supabaseClient';

export default function UsersView() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, search, roleFilter]);

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

    // Search
    if (search.trim()) {
      const query = search.toLowerCase();
      result = result.filter(
        u => u.name.toLowerCase().includes(query) || u.email.toLowerCase().includes(query)
      );
    }

    // Role
    if (roleFilter !== 'All') {
      result = result.filter(u => u.role === roleFilter);
    }

    setFilteredUsers(result);
  }

  // Handle status suspension/activation toggles
  async function toggleStatus(id: string, currentStatus: UserProfile['status']) {
    const nextStatus: UserProfile['status'] = currentStatus === 'active' ? 'suspended' : 'active';
    const label = nextStatus === 'suspended' ? 'SUSPEND' : 'ACTIVATE';
    
    if (window.confirm(`Are you sure you want to ${label} this user account?`)) {
      try {
        const updated = await updateUserStatus(id, nextStatus);
        if (updated) {
          setUsers(prev => prev.map(u => u.id === id ? updated : u));
        }
      } catch (err) {
        console.error('Failed to change user status:', err);
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-sans">Users</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-sans">
          Verify user credentials, active roles, and regulate administrative access levels.
        </p>
      </div>

      {/* Control Filters Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        {/* Search */}
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by customer name, email address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-200"
          />
        </div>

        {/* Role Select */}
        <div className="w-full md:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full md:w-44 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 dark:text-slate-300"
          >
            <option value="All">All User Roles</option>
            <option value="admin">Administrator</option>
            <option value="staff">Staff / Manager</option>
            <option value="customer">Regular Customer</option>
          </select>
        </div>
      </div>

      {/* Main Grid: Accounts List */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col justify-center items-center h-64 space-y-2">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            <span className="text-xs text-slate-400">Loading user database...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-20 text-slate-400 space-y-2">
            <Users className="w-10 h-10 mx-auto opacity-50" />
            <p className="text-sm font-semibold">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700/40 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  <th className="p-4">User Details</th>
                  <th className="p-4">Contact</th>
                  <th className="p-4">Administrative Role</th>
                  <th className="p-4">Registration Date</th>
                  <th className="p-4">System Status</th>
                  <th className="p-4 text-center w-32">Administrative Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/50 dark:divide-slate-700/30 text-xs">
                {filteredUsers.map((u) => {
                  const roleColors = {
                    admin: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/30 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-850',
                    staff: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-850',
                    customer: 'bg-slate-100 text-slate-800 dark:bg-slate-700/30 dark:text-slate-300 border border-slate-200 dark:border-slate-850'
                  };

                  const isSuspended = u.status === 'suspended';

                  return (
                    <tr key={u.id} className="text-slate-600 dark:text-slate-300 hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {/* Avatar Circle with Initials */}
                          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 flex items-center justify-center font-bold text-xs uppercase shadow-xs select-none">
                            {u.email.substring(0, 2)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white text-sm">{u.email.split('@')[0]}</div>
                            <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono uppercase">{u.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span>{u.email}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${roleColors[u.role]}`}>
                          {u.role === 'admin' ? '🛡️ Administrator' : u.role === 'staff' ? '💼 Staff Member' : '👤 Customer'}
                        </span>
                      </td>
                      <td className="p-4 font-mono font-medium text-slate-400 dark:text-slate-500">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          isSuspended 
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/30 dark:text-rose-300' 
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isSuspended ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
                          <span>{u.status}</span>
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => toggleStatus(u.id, u.status)}
                          className={`px-3 py-1.5 rounded-xl font-bold uppercase text-[9px] tracking-wider flex items-center justify-center gap-1 mx-auto transition-all cursor-pointer border ${
                            isSuspended
                              ? 'bg-emerald-500/10 hover:bg-emerald-500 text-emerald-600 dark:text-emerald-400 hover:text-white border-emerald-500/15'
                              : 'bg-rose-500/10 hover:bg-rose-500 text-rose-600 dark:text-rose-400 hover:text-white border-rose-500/15'
                          }`}
                        >
                          {isSuspended ? (
                            <>
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Activate</span>
                            </>
                          ) : (
                            <>
                              <UserX className="w-3.5 h-3.5" />
                              <span>Suspend</span>
                            </>
                          )}
                        </button>
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
  );
}
