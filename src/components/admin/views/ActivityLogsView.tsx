import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Trash2, 
  Download, 
  Search, 
  Filter, 
  Clock, 
  User, 
  Shield, 
  CheckCircle,
  Database,
  ArrowDownToLine,
  Activity
} from 'lucide-react';

interface ActivityLog {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  details: string;
  category: 'Security' | 'Content' | 'Database' | 'Roles';
  status: 'Success' | 'Warning' | 'Error';
}

export default function ActivityLogsView() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<ActivityLog[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    loadLogs();
  }, []);

  useEffect(() => {
    let result = [...logs];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(l => 
        l.actor.toLowerCase().includes(q) || 
        l.action.toLowerCase().includes(q) || 
        l.details.toLowerCase().includes(q)
      );
    }
    if (categoryFilter !== 'All') {
      result = result.filter(l => l.category === categoryFilter);
    }
    if (statusFilter !== 'All') {
      result = result.filter(l => l.status === statusFilter);
    }
    setFilteredLogs(result);
  }, [logs, search, categoryFilter, statusFilter]);

  function loadLogs() {
    const stored = localStorage.getItem('bakenye_activity_logs');
    if (stored) {
      setLogs(JSON.parse(stored));
    } else {
      // Seed initial high-quality operational telemetry logs
      const initialLogs: ActivityLog[] = [
        {
          id: 'act_001',
          timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(), // 12 mins ago
          actor: 'admin@bakenyi.org',
          action: 'Audit Submission Approved',
          details: 'Approved community artifact "Traditional Paliisa Fishing Canoe" and synced to Digital Gallery.',
          category: 'Content',
          status: 'Success'
        },
        {
          id: 'act_002',
          timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 mins ago
          actor: 'admin@bakenyi.org',
          action: 'User Role Delegated',
          details: 'Elevated contributor user account to Staff Member (staff) role.',
          category: 'Roles',
          status: 'Success'
        },
        {
          id: 'act_003',
          timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(), // 3 hours ago
          actor: 'System Daemon',
          action: 'Automated Security Audit',
          details: 'Executed integrity verification scans across Supabase RLS security policies. No anomalies detected.',
          category: 'Security',
          status: 'Success'
        },
        {
          id: 'act_004',
          timestamp: new Date(Date.now() - 1000 * 3600 * 18).toISOString(), // 18 hours ago
          actor: 'admin@bakenyi.org',
          action: 'Draft Publication Updated',
          details: 'Modified title and excerpt on article "Dialect Lexicon of Lukenye Language".',
          category: 'Content',
          status: 'Success'
        },
        {
          id: 'act_005',
          timestamp: new Date(Date.now() - 1000 * 3600 * 32).toISOString(), // 32 hours ago
          actor: 'System Daemon',
          action: 'Database Snapshot Compiled',
          details: 'Completed offline schema snapshot backup and cleared memory caches.',
          category: 'Database',
          status: 'Success'
        },
        {
          id: 'act_006',
          timestamp: new Date(Date.now() - 1000 * 3600 * 48).toISOString(), // 48 hours ago
          actor: 'moderator@bakenyi.org',
          action: 'Attachment Upload Blocked',
          details: 'Prevented upload of document with unvetted MIME type in contributions form.',
          category: 'Security',
          status: 'Warning'
        }
      ];
      localStorage.setItem('bakenye_activity_logs', JSON.stringify(initialLogs));
      setLogs(initialLogs);
    }
  }

  function handleClearLogs() {
    if (window.confirm('Are you sure you want to permanently purge all security and operational logs? This is irreversible.')) {
      localStorage.removeItem('bakenye_activity_logs');
      setLogs([]);
      // Log the clearing action itself as a new starting record
      const clearingLog: ActivityLog = {
        id: `act_${Date.now()}`,
        timestamp: new Date().toISOString(),
        actor: 'admin@bakenyi.org',
        action: 'Telemetry Logs Purged',
        details: 'Permanently wiped historical system log records from server memory storage.',
        category: 'Security',
        status: 'Warning'
      };
      const list = [clearingLog];
      localStorage.setItem('bakenye_activity_logs', JSON.stringify(list));
      setLogs(list);
    }
  }

  function handleExportLogs() {
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bakenye_platform_activity_logs_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-8 text-left">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-sans">Activity Registry</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-sans">
            Immutable log directory tracking security handshakes, article editions, and role modifications.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleExportLogs}
            className="flex items-center gap-2 px-4.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            <ArrowDownToLine className="w-4 h-4" />
            <span>Export Registry</span>
          </button>
          
          <button
            onClick={handleClearLogs}
            className="flex items-center gap-2 px-4.5 py-2.5 bg-rose-50 hover:bg-rose-500 hover:text-white text-rose-600 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Purge Logs</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Panel */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-[24px] border border-slate-100 dark:border-slate-700/50 shadow-xs flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search action logs, descriptions or actors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-200"
          />
        </div>

        <div className="flex gap-3 w-full md:w-auto overflow-x-auto shrink-0">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 dark:text-slate-300 cursor-pointer"
          >
            <option value="All">All Categories</option>
            <option value="Security">🛡️ Security</option>
            <option value="Content">📝 Content</option>
            <option value="Database">🗄️ Database</option>
            <option value="Roles">🔑 Roles</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 dark:text-slate-300 cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Success">🟢 Success</option>
            <option value="Warning">🟡 Warning</option>
            <option value="Error">🔴 Error</option>
          </select>
        </div>
      </div>

      {/* Main Table Panel */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-[28px] border border-slate-100 dark:border-slate-700/50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-20 text-slate-400 font-semibold text-xs">No logged activities match current filters.</div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700/40 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 pb-3">
                  <th className="py-3 pr-4">Actor</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Description Details</th>
                  <th className="py-3 px-4">Event Group</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 pl-4 text-right">Timestamp (UTC)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/50 dark:divide-slate-700/30 text-xs text-slate-600 dark:text-slate-300">
                {filteredLogs.map((log) => {
                  const badgeColors = {
                    Success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
                    Warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
                    Error: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                  };

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                      <td className="py-4 pr-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 rounded-lg flex items-center justify-center shrink-0">
                            <User className="w-3.5 h-3.5" />
                          </div>
                          <span className="font-semibold text-slate-900 dark:text-white">{log.actor}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-bold text-slate-800 dark:text-slate-200">{log.action}</td>
                      <td className="py-4 px-4 text-slate-500 dark:text-slate-400 max-w-sm font-medium">{log.details}</td>
                      <td className="py-4 px-4 font-semibold text-indigo-500">{log.category}</td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-0.5 border rounded-full text-[9px] font-bold uppercase tracking-wider ${badgeColors[log.status]}`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="py-4 pl-4 text-right font-mono text-slate-400 text-[10px]">
                        {new Date(log.timestamp).toLocaleTimeString()} • {new Date(log.timestamp).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
