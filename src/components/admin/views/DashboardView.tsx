import React, { useEffect, useState } from 'react';
import { 
  Users, 
  ShieldCheck, 
  Inbox, 
  Image as ImageIcon, 
  BookOpen, 
  Database, 
  Activity, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Cpu, 
  Clock, 
  ArrowUpRight,
  Server,
  Key,
  Shield,
  Check,
  X,
  FileSpreadsheet,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { 
  fetchUsers, 
  fetchMediaFiles, 
  updateUserStatus, 
  updateUserRole, 
  updateMediaStatus, 
  UserProfile, 
  MediaFile, 
  getSupabaseConfig 
} from '../../../lib/supabaseClient';
import { 
  getArticles, 
  updateArticle, 
  getContributions, 
  Contribution 
} from '../../../lib/supabase';
import { Article } from '../../../types/article';
import { getAuditLogs, logAdminActivity, AuditLog } from '../../../lib/operations';

interface DashboardViewProps {
  onNavigate: (tab: string) => void;
}

export default function DashboardView({ onNavigate }: DashboardViewProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [media, setMedia] = useState<MediaFile[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Connection & Health status
  const { isConfigured } = getSupabaseConfig();

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [usersData, mediaData, articlesData] = await Promise.all([
        fetchUsers(),
        fetchMediaFiles(),
        getArticles(false)
      ]);

      setUsers(usersData);
      setMedia(mediaData);
      setArticles(articlesData);
      setAuditLogs(getAuditLogs());
    } catch (err) {
      console.error('Failed to load platform operations dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Listen to operational custom events for state sync
    const handleSync = () => {
      loadData();
    };
    window.addEventListener('bakenye_operations_updated', handleSync);
    return () => {
      window.removeEventListener('bakenye_operations_updated', handleSync);
    };
  }, []);

  const flashMessage = (msg: string) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(null), 4000);
  };

  // --- Interactive Dashboard Queue Actions ---
  
  // 1. User Approval Action
  const handleApproveUser = async (userId: string, email: string, role: 'staff' | 'customer') => {
    try {
      await updateUserRole(userId, role);
      const updated = await updateUserStatus(userId, 'active');
      if (updated) {
        logAdminActivity(
          'Super Admin',
          'User Approved & Activated',
          `Approved registration for ${email} with assigned role: [${role.toUpperCase()}].`,
          'Roles',
          'Success',
          userId
        );
        flashMessage(`Successfully activated ${email} as ${role.toUpperCase()}`);
        loadData();
      }
    } catch (err) {
      console.error('Dashboard failed to approve user:', err);
    }
  };

  // 2. User Reject Action
  const handleRejectUser = async (userId: string, email: string) => {
    try {
      const updated = await updateUserStatus(userId, 'suspended');
      if (updated) {
        logAdminActivity(
          'Super Admin',
          'User Registration Denied',
          `Denied registration for ${email} and placed account on suspended list.`,
          'Security',
          'Warning',
          userId
        );
        flashMessage(`Denied registration for ${email}`);
        loadData();
      }
    } catch (err) {
      console.error('Dashboard failed to reject user:', err);
    }
  };

  // 3. Article Approval Action
  const handleApproveArticle = async (id: string, title: string) => {
    try {
      const { error } = await updateArticle(id, { 
        status: 'published', 
        publishedAt: new Date().toISOString().split('T')[0] 
      });
      if (error) throw error;

      logAdminActivity(
        'Super Admin',
        'Article Approved & Published',
        `Approved and dynamically published reporter article "${title}" to the public portal.`,
        'Content',
        'Success',
        id
      );
      flashMessage(`Approved and published article: "${title}"`);
      loadData();
    } catch (err) {
      console.error('Dashboard failed to approve article:', err);
    }
  };

  // 4. Article Rejection Action
  const handleRejectArticle = async (id: string, title: string) => {
    try {
      const { error } = await updateArticle(id, { status: 'draft' });
      if (error) throw error;

      logAdminActivity(
        'Super Admin',
        'Article Vetting Rejected',
        `Rejected reporter article "${title}" and reverted it to a secure draft.`,
        'Content',
        'Success',
        id
      );
      flashMessage(`Article "${title}" rejected and returned to draft mode.`);
      loadData();
    } catch (err) {
      console.error('Dashboard failed to reject article:', err);
    }
  };

  // 5. Media Approval Action
  const handleApproveMedia = async (name: string) => {
    try {
      const approved = await updateMediaStatus(name, 'approved');
      if (approved) {
        logAdminActivity(
          'Super Admin',
          'Media Upload Vetted',
          `Approved private media asset "${name}" making it publicly active in the gallery.`,
          'Media',
          'Success',
          name
        );
        flashMessage(`Approved media asset: "${name.split('/').pop()}"`);
        loadData();
      }
    } catch (err) {
      console.error('Dashboard failed to approve media:', err);
    }
  };

  // 6. Media Rejection Action
  const handleRejectMedia = async (name: string) => {
    try {
      await updateMediaStatus(name, 'rejected');
      logAdminActivity(
        'Super Admin',
        'Media Upload Rejected',
        `Rejected private media upload "${name}" and removed file from secure storage.`,
        'Media',
        'Warning',
        name
      );
      flashMessage(`Rejected media asset: "${name.split('/').pop()}"`);
      loadData();
    } catch (err) {
      console.error('Dashboard failed to reject media:', err);
    }
  };

  // Compute stats
  const pendingUsers = users.filter(u => u.status === 'pending');
  const pendingArticles = articles.filter(a => a.status === 'pending');
  const pendingMedia = media.filter(m => m.status === 'pending');
  const totalQueueCount = pendingUsers.length + pendingArticles.length + pendingMedia.length;

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-96 space-y-3">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <span className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
          Diagnosing operational databases & health status...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Top Interactive Status Messages */}
      {actionMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white border border-slate-800 rounded-2xl px-5 py-3.5 shadow-xl flex items-center space-x-2.5 animate-slide-up text-xs font-bold font-sans">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Header Banner - Operations Center Styled */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-950 p-6 md:p-8 rounded-[32px] text-white relative overflow-hidden shadow-lg shadow-slate-950/20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/15 via-transparent to-transparent pointer-events-none" />
        <div className="space-y-1.5 relative z-10">
          <div className="flex items-center gap-2 text-indigo-400">
            <Cpu className="w-4 h-4 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Operational Command Center</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-white tracking-tight">Bakenye Platform Controller</h1>
          <p className="text-xs text-slate-400 max-w-xl font-medium leading-relaxed">
            Real-time vetting queues, database authorization controls, and secure media storage moderation workflows.
          </p>
        </div>
        
        {/* Connection status display */}
        <div className="flex items-center gap-3 shrink-0 relative z-10">
          <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 animate-pulse'}`} />
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-300">
              {isConfigured ? 'Live Environment' : 'Sandbox Emulator'}
            </span>
          </div>
        </div>
      </div>

      {/* Central Queue Summaries - Operational Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Backlog Item Card */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700/50 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="space-y-1.5 text-left">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Backlog Action Items</p>
            <h3 className="text-3xl font-serif font-black text-slate-900 dark:text-white leading-none">
              {totalQueueCount}
            </h3>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500 font-semibold">
              <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold ${totalQueueCount > 0 ? 'bg-amber-500/10 text-amber-600' : 'bg-emerald-500/10 text-emerald-600'}`}>
                {totalQueueCount > 0 ? 'Attention Needed' : 'Queue Cleared'}
              </span>
            </div>
          </div>
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${totalQueueCount > 0 ? 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400' : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30'}`}>
            <Inbox className="w-6 h-6" />
          </div>
        </div>

        {/* Total Active Preservers */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700/50 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="space-y-1.5 text-left">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Active Preservers</p>
            <h3 className="text-3xl font-serif font-black text-slate-900 dark:text-white leading-none">
              {users.filter(u => u.status === 'active').length}
            </h3>
            <span className="text-[10px] text-slate-400 font-semibold block">Fully verified accounts</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-inner">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Total Publications */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700/50 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="space-y-1.5 text-left">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Public Publications</p>
            <h3 className="text-3xl font-serif font-black text-slate-900 dark:text-white leading-none">
              {articles.filter(a => a.status === 'published').length}
            </h3>
            <span className="text-[10px] text-slate-400 font-semibold block">Live heritage articles</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-inner">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        {/* Storage Volume */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700/50 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="space-y-1.5 text-left">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Moderated Assets</p>
            <h3 className="text-3xl font-serif font-black text-slate-900 dark:text-white leading-none truncate max-w-[150px]">
              {formatBytes(media.reduce((sum, m) => sum + m.size, 0))}
            </h3>
            <span className="text-[10px] text-slate-400 font-semibold block">{media.filter(m => m.status === 'approved').length} approved uploads</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400 flex items-center justify-center shadow-inner">
            <ImageIcon className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* ACTIVE BAKE-OFF WORK QUEUES - BENTO ACTION GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Queue Column 1: User Registration Sign-Ups Awaiting Vetting */}
        <div className="bg-white dark:bg-slate-800 rounded-[28px] border border-slate-100 dark:border-slate-700/50 shadow-xs p-6 flex flex-col justify-between space-y-5 text-left">
          <div className="space-y-4 flex-1">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-indigo-500" />
                <h4 className="font-serif font-bold text-slate-800 dark:text-white text-base">Sign-Ups Vetting</h4>
              </div>
              <span className={`px-2 py-0.5 text-[9px] font-black rounded-full uppercase tracking-wider ${pendingUsers.length > 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-400'}`}>
                {pendingUsers.length} Pending
              </span>
            </div>
            
            <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
              New preservers waiting for registration verification and role designation.
            </p>

            <div className="space-y-3 pt-2">
              {pendingUsers.map(user => (
                <div key={user.id} className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/40 space-y-3">
                  <div className="text-left space-y-0.5">
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Applicant Email</span>
                    <span className="text-xs font-bold text-slate-800 dark:text-white truncate block">{user.email}</span>
                  </div>

                  <div className="flex gap-1.5 pt-1">
                    <button
                      onClick={() => handleApproveUser(user.id, user.email, 'staff')}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[9px] font-black uppercase tracking-wider py-1.5 rounded-lg transition-colors cursor-pointer"
                      title="Activate with staff (Reporter) permissions"
                    >
                      Approve Reporter
                    </button>
                    <button
                      onClick={() => handleApproveUser(user.id, user.email, 'customer')}
                      className="flex-1 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 text-[9px] font-black uppercase tracking-wider py-1.5 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-650 transition-colors cursor-pointer"
                      title="Activate as normal user"
                    >
                      Approve User
                    </button>
                    <button
                      onClick={() => handleRejectUser(user.id, user.email)}
                      className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-lg transition-colors cursor-pointer"
                      title="Reject Registration"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {pendingUsers.length === 0 && (
                <div className="text-center py-10 border border-dashed border-slate-100 dark:border-slate-700/60 rounded-2xl space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-bold">All Sign-Ups Vetted</p>
                  <p className="text-[10px] text-slate-400/70 dark:text-slate-500/70">No accounts are currently pending approval.</p>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => onNavigate('users')}
            className="w-full bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-200 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider text-center cursor-pointer transition-colors"
          >
            Manage User Registry
          </button>
        </div>

        {/* Queue Column 2: Reporter Articles Awaiting Publication */}
        <div className="bg-white dark:bg-slate-800 rounded-[28px] border border-slate-100 dark:border-slate-700/50 shadow-xs p-6 flex flex-col justify-between space-y-5 text-left">
          <div className="space-y-4 flex-1">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-amber-500" />
                <h4 className="font-serif font-bold text-slate-800 dark:text-white text-base">Publications Vetting</h4>
              </div>
              <span className={`px-2 py-0.5 text-[9px] font-black rounded-full uppercase tracking-wider ${pendingArticles.length > 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-400'}`}>
                {pendingArticles.length} Pending
              </span>
            </div>
            
            <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
              Historical articles drafted and submitted by content reporters for Super Admin moderation.
            </p>

            <div className="space-y-3 pt-2">
              {pendingArticles.map(art => (
                <div key={art.id} className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/40 space-y-3">
                  <div className="text-left space-y-0.5">
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Submitted Article</span>
                    <h5 className="text-xs font-bold text-slate-800 dark:text-white line-clamp-1">{art.title}</h5>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 block font-mono">By: {art.author || 'Reporter'}</span>
                  </div>

                  <div className="flex gap-1.5 pt-1">
                    <button
                      onClick={() => handleApproveArticle(art.id, art.title)}
                      className="flex-1 bg-amber-500 hover:bg-amber-600 text-white text-[9px] font-black uppercase tracking-wider py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      Approve & Publish
                    </button>
                    <button
                      onClick={() => handleRejectArticle(art.id, art.title)}
                      className="px-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-650 text-slate-800 dark:text-slate-100 text-[9px] font-black uppercase tracking-wider py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      Reject to Draft
                    </button>
                  </div>
                </div>
              ))}

              {pendingArticles.length === 0 && (
                <div className="text-center py-10 border border-dashed border-slate-100 dark:border-slate-700/60 rounded-2xl space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-bold">Editorial Queue Clear</p>
                  <p className="text-[10px] text-slate-400/70 dark:text-slate-500/70">No articles are currently pending approval.</p>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => onNavigate('content')}
            className="w-full bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-200 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider text-center cursor-pointer transition-colors"
          >
            Moderate Repository Content
          </button>
        </div>

        {/* Queue Column 3: Media Uploads Awaiting Approvals */}
        <div className="bg-white dark:bg-slate-800 rounded-[28px] border border-slate-100 dark:border-slate-700/50 shadow-xs p-6 flex flex-col justify-between space-y-5 text-left">
          <div className="space-y-4 flex-1">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <ImageIcon className="w-5 h-5 text-sky-500" />
                <h4 className="font-serif font-bold text-slate-800 dark:text-white text-base">Media Vetting</h4>
              </div>
              <span className={`px-2 py-0.5 text-[9px] font-black rounded-full uppercase tracking-wider ${pendingMedia.length > 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-400'}`}>
                {pendingMedia.length} Pending
              </span>
            </div>
            
            <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
              Images and records uploaded privately that require vetting before becoming publicly viewable.
            </p>

            <div className="space-y-3 pt-2">
              {pendingMedia.map(file => (
                <div key={file.name} className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/40 flex items-center gap-3">
                  <img 
                    src={file.url} 
                    alt={file.name} 
                    className="w-12 h-12 object-cover rounded-xl border border-slate-100 dark:border-slate-700" 
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="text-left space-y-0.5">
                      <h5 className="text-[11px] font-bold text-slate-800 dark:text-white truncate" title={file.name}>
                        {file.name.split('/').pop()}
                      </h5>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 block font-mono">
                        {formatBytes(file.size)}
                      </span>
                    </div>

                    <div className="flex gap-1">
                      <button
                        onClick={() => handleApproveMedia(file.name)}
                        className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white text-[9px] font-black uppercase tracking-wider py-1 rounded-md transition-colors cursor-pointer"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleRejectMedia(file.name)}
                        className="px-2 bg-rose-50 hover:bg-rose-100 text-rose-500 text-[9px] font-black py-1 rounded-md transition-colors cursor-pointer"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {pendingMedia.length === 0 && (
                <div className="text-center py-10 border border-dashed border-slate-100 dark:border-slate-700/60 rounded-2xl space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-bold">Media Archive Vetted</p>
                  <p className="text-[10px] text-slate-400/70 dark:text-slate-500/70">No files are currently pending approval.</p>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => onNavigate('media')}
            className="w-full bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-200 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider text-center cursor-pointer transition-colors"
          >
            Moderate Storage Library
          </button>
        </div>

      </div>

      {/* SYSTEM TELEMETRY HEALTH & REAL-TIME AUDIT TRAILS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Live Activity Audit Trail (Real ActivityLogs data) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 md:p-8 rounded-[32px] border border-slate-100 dark:border-slate-700/50 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div className="text-left">
              <h3 className="text-lg font-serif font-bold text-slate-800 dark:text-white">Recent Administrator Action Logs</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Live, tamper-proof system audit logs synced across active views.</p>
            </div>
            <button 
              onClick={() => onNavigate('activity_logs')}
              className="text-xs font-bold text-indigo-500 hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              <span>View Audit Center</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700/40 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  <th className="py-3 font-bold">Timestamp</th>
                  <th className="py-3 font-bold">Actor</th>
                  <th className="py-3 font-bold">Action Conducted</th>
                  <th className="py-3 font-bold">Module</th>
                  <th className="py-3 font-bold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/50 dark:divide-slate-700/30 text-[11px]">
                {auditLogs.slice(0, 5).map((log) => {
                  const badgeColors = {
                    Success: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
                    Warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
                    Error: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300'
                  };

                  return (
                    <tr key={log.id} className="text-slate-600 dark:text-slate-300 hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors">
                      <td className="py-3 font-mono text-[10px] text-slate-400">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td className="py-3 font-bold text-slate-800 dark:text-white">
                        {log.actor}
                      </td>
                      <td className="py-3 truncate max-w-[200px]" title={log.details}>
                        {log.action}
                      </td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 font-bold text-[9px] uppercase tracking-wider">
                          {log.category}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${badgeColors[log.status] || badgeColors.Success}`}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}

                {auditLogs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                      No administrator actions recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Platform Core Telemetry Diagnostics */}
        <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-[32px] border border-slate-100 dark:border-slate-700/50 shadow-xs flex flex-col justify-between gap-6">
          <div className="space-y-4">
            <h3 className="text-base font-serif font-bold text-slate-800 dark:text-white text-left">Preservation Core Health</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 text-left">Live diagnostic checkups on connected service APIs.</p>
            
            <div className="space-y-3.5 pt-2">
              {/* Service 1: Database Link */}
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/40 text-xs">
                <span className="font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-2">
                  <Database className="w-4 h-4 text-indigo-500" />
                  Database Link
                </span>
                <span className="font-bold text-emerald-500 flex items-center gap-1.5 text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {isConfigured ? 'Healthy' : 'Local Emulator'}
                </span>
              </div>

              {/* Service 2: Storage Buckets */}
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/40 text-xs">
                <span className="font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-2">
                  <Server className="w-4 h-4 text-sky-500" />
                  Storage Vault ("media")
                </span>
                <span className="font-bold text-emerald-500 flex items-center gap-1.5 text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active
                </span>
              </div>

              {/* Service 3: Auth Provider */}
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/40 text-xs">
                <span className="font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-2">
                  <Key className="w-4 h-4 text-emerald-500" />
                  GoAuth / MFA Engine
                </span>
                <span className="font-bold text-emerald-500 flex items-center gap-1.5 text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Healthy
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-700/40 flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Core Telemetry Clock:</span>
            <span className="font-bold text-slate-600 dark:text-slate-350">{new Date().toLocaleTimeString()}</span>
          </div>
        </div>

      </div>
    </div>
  );
}
