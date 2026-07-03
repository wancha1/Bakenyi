import React, { useState, useEffect } from 'react';
import { 
  Users, Loader2, Check, AlertCircle, Search, Calendar, Shield, Mail, UserCheck
} from 'lucide-react';
import { 
  getAllUsers, updateUserRole, UserProfile, UserRole, formatFirebaseDate 
} from '../../lib/firebaseContentService';

interface UserManagerProps {
  userRole: string;
}

export default function UserManager({ userRole }: UserManagerProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const isSuperAdmin = userRole === 'super_admin';

  useEffect(() => {
    if (isSuperAdmin) {
      loadData();
    }
  }, [isSuperAdmin]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (err: any) {
      setError('Failed to fetch users list from Firestore.');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (msg: string, isSuccess = true) => {
    if (isSuccess) {
      setSuccess(msg);
      setTimeout(() => setSuccess(''), 4000);
    } else {
      setError(msg);
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleRoleChange = async (uid: string, newRole: UserRole) => {
    if (!isSuperAdmin) {
      showNotification('Access denied. Only Super Admin can manage roles.', false);
      return;
    }
    
    // Find user to confirm
    const u = users.find(usr => usr.uid === uid);
    if (!u) return;
    
    if (u.email === 'wanchaaaron@gmail.com') {
      showNotification('Cannot change role of primary bootstrapped administrator.', false);
      return;
    }

    if (!window.confirm(`Are you sure you want to change ${u.displayName}'s role to ${newRole}?`)) {
      return;
    }

    try {
      await updateUserRole(uid, newRole);
      showNotification(`Successfully updated ${u.displayName} to ${newRole}!`);
      loadData();
    } catch (err: any) {
      showNotification('Role update failed. Access restrictions apply.', false);
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-8 rounded-[24px] flex flex-col items-center text-center space-y-3 shadow-sm">
        <Shield className="w-10 h-10 text-red-500" />
        <h3 className="text-lg font-bold font-serif">Super Admin Privileges Required</h3>
        <p className="text-xs text-red-700/80 max-w-sm leading-relaxed">
          Your account is registered but does not possess the requisite clearance levels to audit user registry keys or assign operational roles.
        </p>
      </div>
    );
  }

  const filteredUsers = users.filter(u => 
    u.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl flex items-start space-x-3 shadow-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span className="text-sm font-semibold">{error}</span>
        </div>
      )}
      {success && (
        <div className="bg-heritage-olive/10 border border-heritage-olive/20 text-heritage-olive px-6 py-4 rounded-2xl flex items-start space-x-3 shadow-sm">
          <Check className="w-5 h-5 shrink-0 mt-0.5" />
          <span className="text-sm font-semibold">{success}</span>
        </div>
      )}

      <div className="bg-white rounded-[32px] border border-heritage-brown/5 shadow-sm p-6 md:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-heritage-brown/5">
          <div>
            <h2 className="text-xl font-serif font-bold text-heritage-brown">Operational User Registry</h2>
            <p className="text-xs text-heritage-brown/50 font-medium">Verify credentials and allocate access roles across contributors</p>
          </div>
        </div>

        <div className="relative w-full sm:max-w-md bg-heritage-cream/20 p-2.5 rounded-2xl border border-heritage-brown/5">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-heritage-brown/30" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-heritage-brown/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-heritage-brown placeholder-heritage-brown/30 font-medium outline-none focus:border-heritage-terracotta"
          />
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-heritage-terracotta animate-spin mb-3" />
            <p className="text-[10px] uppercase font-black tracking-widest text-heritage-brown/40">Querying registry database...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-heritage-brown/5 rounded-[24px]">
            <Users className="w-12 h-12 text-heritage-brown/20 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-heritage-brown">No accounts found</h4>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-heritage-brown/10 text-[9px] font-black uppercase tracking-widest text-heritage-brown/40 pb-3">
                  <th className="py-3">User Profile</th>
                  <th className="py-3 hidden sm:table-cell">Identity Verification</th>
                  <th className="py-3 hidden md:table-cell">Registered</th>
                  <th className="py-3">Assigned Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-heritage-brown/5 text-xs">
                {filteredUsers.map((u) => (
                  <tr key={u.uid} className="hover:bg-heritage-cream/10 transition-colors">
                    <td className="py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-heritage-brown text-heritage-sand flex items-center justify-center font-black text-sm uppercase">
                          {u.displayName ? u.displayName.slice(0, 2) : 'CR'}
                        </div>
                        <div>
                          <span className="font-bold text-heritage-brown text-sm block leading-snug">{u.displayName}</span>
                          <span className="text-[10px] text-heritage-brown/40 font-semibold block">{u.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 hidden sm:table-cell">
                      <span className="px-2.5 py-1 rounded-full bg-heritage-olive/10 text-heritage-olive font-black text-[9px] uppercase tracking-wider flex items-center gap-1 w-fit">
                        <UserCheck className="w-3 h-3" />
                        <span>{u.status}</span>
                      </span>
                    </td>
                    <td className="py-4 hidden md:table-cell">
                      <span className="text-heritage-brown/50 font-mono font-bold">{formatFirebaseDate(u.createdAt)}</span>
                    </td>
                    <td className="py-4">
                      {u.email === 'wanchaaaron@gmail.com' ? (
                        <span className="px-3 py-1.5 rounded-xl bg-purple-100 text-purple-700 font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5 w-fit">
                          <Shield className="w-3.5 h-3.5" />
                          <span>Super Admin (Primary)</span>
                        </span>
                      ) : (
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.uid, e.target.value as UserRole)}
                          className="bg-heritage-cream/40 border border-heritage-brown/10 rounded-xl px-3 py-2 text-xs text-heritage-brown font-black uppercase tracking-wider focus:outline-none focus:border-heritage-terracotta"
                        >
                          <option value="reporter">Reporter</option>
                          <option value="editor">Editor</option>
                          <option value="admin">Admin</option>
                          <option value="super_admin">Super Admin</option>
                        </select>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
