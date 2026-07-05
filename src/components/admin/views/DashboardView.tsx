import React, { useEffect, useState } from 'react';
import { 
  Users, 
  Inbox, 
  Image as ImageIcon, 
  BookOpen, 
  CheckCircle2, 
  Loader2,
  X,
  PlusCircle,
  FileText,
  Clock,
  ArrowRight,
  ShieldAlert,
  UserCheck
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
  updateArticle 
} from '../../../lib/supabase';
import { Article } from '../../../types/article';
import { getAuditLogs, logAdminActivity, AuditLog } from '../../../lib/operations';

interface DashboardViewProps {
  onNavigate: (tab: string) => void;
  user?: any;
  userRole?: 'super_admin' | 'admin' | 'reporter' | 'public' | 'staff' | 'customer';
}

export default function DashboardView({ onNavigate, user, userRole = 'public' }: DashboardViewProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [media, setMedia] = useState<MediaFile[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Connection status
  const { isConfigured } = getSupabaseConfig();

  // Normalize user roles for clean checks
  const resolvedRole = 
    userRole === 'staff' ? 'reporter' : 
    userRole === 'customer' ? 'public' : 
    userRole;

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
        flashMessage(`Successfully activated ${email} as ${role === 'staff' ? 'REPORTER' : 'USER'}`);
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

  // Filter content authored by the current logged-in reporter
  const reporterEmail = user?.email || '';
  const myArticles = articles.filter(a => a.authorEmail === reporterEmail || a.author === reporterEmail.split('@')[0]);
  const myMedia = media.filter(m => m.url && (m.name.includes(reporterEmail.split('@')[0]) || m.status === 'approved'));

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
        <Loader2 className="w-8 h-8 text-indigo-650 animate-spin" />
        <span className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
          Retrieving heritage workspace datasets...
        </span>
      </div>
    );
  }

  // ==========================================
  // REPORTER (CREATOR) DASHBOARD WORKSPACE
  // ==========================================
  if (resolvedRole === 'reporter') {
    return (
      <div className="space-y-8 animate-fade-in text-left">
        {/* Toast Flash Message */}
        {actionMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white border border-slate-800 rounded-2xl px-5 py-3.5 shadow-xl flex items-center space-x-2.5 animate-slide-up text-xs font-bold font-sans">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionMessage}</span>
          </div>
        )}

        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-emerald-950 to-slate-900 p-6 md:p-8 rounded-[32px] text-white relative overflow-hidden shadow-lg">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent pointer-events-none" />
          <div className="space-y-2 relative z-10">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">Contributor Workspace</span>
            <h1 className="text-2xl md:text-3xl font-serif font-black tracking-tight">Preserver {user?.email?.split('@')[0]}</h1>
            <p className="text-xs text-slate-300 max-w-xl font-medium leading-relaxed">
              Help capture and preserve the precious cultural legacy, lore, and history of the Bakenye community. Draft writings, document oral histories, or contribute media assets.
            </p>
          </div>
        </div>

        {/* Reporter Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700/50 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">My Written Articles</p>
              <h3 className="text-3xl font-serif font-black text-slate-900 dark:text-white leading-none">{myArticles.length}</h3>
              <span className="text-[10px] text-slate-400 font-semibold block">Total draft or published submissions</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700/50 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Published Live</p>
              <h3 className="text-3xl font-serif font-black text-slate-900 dark:text-white leading-none">
                {myArticles.filter(a => a.status === 'published' || a.status === 'approved').length}
              </h3>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block">Visible to the public site</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <BookOpen className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700/50 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Pending Vetting</p>
              <h3 className="text-3xl font-serif font-black text-slate-900 dark:text-white leading-none">
                {myArticles.filter(a => a.status === 'pending').length}
              </h3>
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold block">Awaiting admin review</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700/50 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">My Media Uploads</p>
              <h3 className="text-3xl font-serif font-black text-slate-900 dark:text-white leading-none">{myMedia.length}</h3>
              <span className="text-[10px] text-slate-400 font-semibold block">Contributed digital heritage assets</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <ImageIcon className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Creator Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Create CTA Bento Card */}
          <div className="bg-white dark:bg-slate-800 rounded-[28px] border border-slate-100 dark:border-slate-700/50 p-6 shadow-xs flex flex-col justify-between space-y-6">
            <div className="space-y-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
                <PlusCircle className="w-6 h-6" />
              </div>
              <h3 className="font-serif font-black text-lg text-slate-900 dark:text-white">Draft a Heritage Piece</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
                Add written chronicles, clan lineage accounts, or linguistic insights. Once submitted, administrators will review it before publishing.
              </p>
            </div>
            <button
              onClick={() => onNavigate('content')}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-wider text-[11px] py-3 rounded-2xl cursor-pointer flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/10"
            >
              <span>Go to Content Creator</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Submissions List */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-[28px] border border-slate-100 dark:border-slate-700/50 p-6 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-slate-50 dark:border-slate-700/40 pb-3">
              <h3 className="font-serif font-black text-base text-slate-900 dark:text-white">My Active Submissions</h3>
              <span className="text-[10px] font-bold text-slate-400">{myArticles.length} submissions</span>
            </div>

            <div className="divide-y divide-slate-100/50 dark:divide-slate-700/30 overflow-y-auto max-h-[220px]">
              {myArticles.map((art) => {
                const statusColors = {
                  draft: 'bg-slate-100 text-slate-700',
                  pending: 'bg-amber-100 text-amber-800 border-amber-200/20',
                  published: 'bg-emerald-100 text-emerald-800 border-emerald-200/20',
                  approved: 'bg-emerald-100 text-emerald-800 border-emerald-200/20',
                  rejected: 'bg-rose-100 text-rose-800 border-rose-200/20'
                };

                return (
                  <div key={art.id} className="py-3 flex items-center justify-between text-xs font-semibold gap-4">
                    <div className="min-w-0 text-left space-y-1">
                      <span className="font-bold text-slate-800 dark:text-white truncate block max-w-[280px]" title={art.title}>
                        {art.title}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-mono">Category: {art.category || 'General'}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-slate-400 font-medium">
                        {art.createdAt ? new Date(art.createdAt).toLocaleDateString() : 'Recent'}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${statusColors[art.status as keyof typeof statusColors] || 'bg-slate-100 text-slate-600'}`}>
                        {art.status}
                      </span>
                    </div>
                  </div>
                );
              })}

              {myArticles.length === 0 && (
                <div className="text-center py-12 text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-[10px] space-y-1">
                  <p>You have not drafted any chronicles yet.</p>
                  <button 
                    onClick={() => onNavigate('content')}
                    className="text-indigo-500 hover:underline cursor-pointer"
                  >
                    Write your first heritage chronicle
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    );
  }

  // ==========================================
  // SUPER ADMIN & ADMIN OPERATIONS VIEW
  // ==========================================
  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Toast Flash Message */}
      {actionMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white border border-slate-800 rounded-2xl px-5 py-3.5 shadow-xl flex items-center space-x-2.5 animate-slide-up text-xs font-bold font-sans">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Header Banner - Clean Heritage Style */}
      <div className="bg-slate-950 p-6 md:p-8 rounded-[32px] text-white relative overflow-hidden shadow-lg shadow-slate-950/20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/15 via-transparent to-transparent pointer-events-none" />
        <div className="space-y-1.5 relative z-10">
          <div className="flex items-center gap-2 text-indigo-400">
            <UserCheck className="w-4 h-4 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Platform Administration Space</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-serif font-black text-white tracking-tight">
            {resolvedRole === 'super_admin' ? 'Super Admin command' : 'Platform Moderator Panel'}
          </h1>
          <p className="text-xs text-slate-400 max-w-xl font-medium leading-relaxed">
            Oversee Bakenyi community content reviews, public publication approvals, media library assets vetting, and user management workflows.
          </p>
        </div>
      </div>

      {/* Admin Central Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700/50 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Moderation Backlog</p>
            <h3 className="text-3xl font-serif font-black text-slate-900 dark:text-white leading-none">
              {resolvedRole === 'admin' ? pendingArticles.length + pendingMedia.length : totalQueueCount}
            </h3>
            <span className="text-[10px] text-slate-400 font-semibold block">Awaiting publication vetting</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Inbox className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700/50 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Active Preservers</p>
            <h3 className="text-3xl font-serif font-black text-slate-900 dark:text-white leading-none">
              {users.filter(u => u.status === 'active').length}
            </h3>
            <span className="text-[10px] text-slate-400 font-semibold block">Authorized portal profiles</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700/50 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Live Chronicles</p>
            <h3 className="text-3xl font-serif font-black text-slate-900 dark:text-white leading-none">
              {articles.filter(a => a.status === 'published' || a.status === 'approved').length}
            </h3>
            <span className="text-[10px] text-slate-400 font-semibold block">Published public articles</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700/50 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Vetted Media Assets</p>
            <h3 className="text-3xl font-serif font-black text-slate-900 dark:text-white leading-none">
              {media.filter(m => m.status === 'approved').length}
            </h3>
            <span className="text-[10px] text-slate-400 font-semibold block">Approved public gallery assets</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400 flex items-center justify-center">
            <ImageIcon className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Work Queues Bento Layout */}
      <div className={`grid grid-cols-1 ${resolvedRole === 'super_admin' ? 'lg:grid-cols-3' : 'lg:grid-cols-2'} gap-8`}>
        
        {/* Queue 1: Sign-Ups Vetting (Super Admin ONLY) */}
        {resolvedRole === 'super_admin' && (
          <div className="bg-white dark:bg-slate-800 rounded-[28px] border border-slate-100 dark:border-slate-700/50 p-6 flex flex-col justify-between space-y-4">
            <div className="space-y-3.5 flex-1">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-indigo-500" />
                  <h4 className="font-serif font-bold text-slate-800 dark:text-white text-base">Sign-Ups Vetting</h4>
                </div>
                <span className={`px-2.5 py-0.5 text-[9px] font-black rounded-full uppercase tracking-wider ${pendingUsers.length > 0 ? 'bg-amber-100 text-amber-800 animate-pulse' : 'bg-slate-100 text-slate-400'}`}>
                  {pendingUsers.length} Pending
                </span>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Awaiting profile activation and role credentials verification.
              </p>

              <div className="space-y-3 pt-2">
                {pendingUsers.slice(0, 3).map(u => (
                  <div key={u.id} className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/40 text-xs">
                    <div className="text-left space-y-1 mb-2.5">
                      <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Applicant Email</span>
                      <span className="font-bold text-slate-800 dark:text-white truncate block">{u.email}</span>
                    </div>

                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleApproveUser(u.id, u.email, 'staff')}
                        className="flex-1 bg-indigo-650 hover:bg-indigo-700 text-white text-[9px] font-black uppercase tracking-wider py-1.5 rounded-lg transition-colors cursor-pointer"
                      >
                        Approve Reporter
                      </button>
                      <button
                        onClick={() => handleRejectUser(u.id, u.email)}
                        className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-lg transition-colors cursor-pointer"
                        title="Reject application"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {pendingUsers.length === 0 && (
                  <div className="text-center py-10 border border-dashed border-slate-100 dark:border-slate-700/60 rounded-2xl space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                    <p className="text-xs text-slate-400 font-bold">Registry Vetted</p>
                    <p className="text-[10px] text-slate-400/70">No pending accounts await review.</p>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => onNavigate('users')}
              className="w-full bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-200 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider text-center cursor-pointer transition-colors"
            >
              Manage Users
            </button>
          </div>
        )}

        {/* Queue 2: Chronicle Publications Vetting (Admin / Super Admin) */}
        <div className="bg-white dark:bg-slate-800 rounded-[28px] border border-slate-100 dark:border-slate-700/50 p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-3.5 flex-1">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-amber-500" />
                <h4 className="font-serif font-bold text-slate-800 dark:text-white text-base">Chronicling Vetting</h4>
              </div>
              <span className={`px-2.5 py-0.5 text-[9px] font-black rounded-full uppercase tracking-wider ${pendingArticles.length > 0 ? 'bg-amber-100 text-amber-800 animate-pulse' : 'bg-slate-100 text-slate-400'}`}>
                {pendingArticles.length} Pending
              </span>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Submitted writings and cultural lore awaiting editorial approval to become public.
            </p>

            <div className="space-y-3 pt-2">
              {pendingArticles.slice(0, 3).map(art => (
                <div key={art.id} className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/40 text-xs">
                  <div className="text-left space-y-1 mb-2.5">
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block"> Chronicles Title</span>
                    <h5 className="font-bold text-slate-800 dark:text-white line-clamp-1">{art.title}</h5>
                    <span className="text-[9px] text-slate-400 block font-mono">Author: {art.author || 'Reporter'}</span>
                  </div>

                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleApproveArticle(art.id, art.title)}
                      className="flex-1 bg-amber-500 hover:bg-amber-600 text-white text-[9px] font-black uppercase tracking-wider py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      Approve & Publish
                    </button>
                    <button
                      onClick={() => handleRejectArticle(art.id, art.title)}
                      className="p-1.5 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-[9px] font-bold transition-colors cursor-pointer"
                      title="Reject to Draft"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}

              {pendingArticles.length === 0 && (
                <div className="text-center py-10 border border-dashed border-slate-100 dark:border-slate-700/60 rounded-2xl space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                  <p className="text-xs text-slate-400 font-bold">Chronicles Clean</p>
                  <p className="text-[10px] text-slate-400/70">No articles currently require publication review.</p>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => onNavigate('content')}
            className="w-full bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-200 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider text-center cursor-pointer transition-colors"
          >
            Moderate Chronicles
          </button>
        </div>

        {/* Queue 3: Gallery Media Vetting (Admin / Super Admin) */}
        <div className="bg-white dark:bg-slate-800 rounded-[28px] border border-slate-100 dark:border-slate-700/50 p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-3.5 flex-1">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <ImageIcon className="w-5 h-5 text-sky-500" />
                <h4 className="font-serif font-bold text-slate-800 dark:text-white text-base">Media Vetting</h4>
              </div>
              <span className={`px-2.5 py-0.5 text-[9px] font-black rounded-full uppercase tracking-wider ${pendingMedia.length > 0 ? 'bg-amber-100 text-amber-800 animate-pulse' : 'bg-slate-100 text-slate-400'}`}>
                {pendingMedia.length} Pending
              </span>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Contributed digital media assets requiring catalog vetting before public publication.
            </p>

            <div className="space-y-3 pt-2">
              {pendingMedia.slice(0, 3).map(file => (
                <div key={file.name} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/40 flex items-center gap-3">
                  <img 
                    src={file.url} 
                    alt={file.name} 
                    className="w-11 h-11 object-cover rounded-xl border border-slate-100 dark:border-slate-700" 
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 min-w-0 space-y-1">
                    <h5 className="text-[11px] font-bold text-slate-800 dark:text-white truncate" title={file.name}>
                      {file.name.split('/').pop()}
                    </h5>
                    <div className="flex gap-1 pt-0.5">
                      <button
                        onClick={() => handleApproveMedia(file.name)}
                        className="flex-1 bg-sky-500 hover:bg-sky-600 text-white text-[9px] font-black uppercase py-1 rounded-md transition-colors cursor-pointer"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleRejectMedia(file.name)}
                        className="px-2 bg-rose-50 hover:bg-rose-100 text-rose-500 text-[9px] font-bold py-1 rounded-md transition-colors cursor-pointer"
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
                  <p className="text-xs text-slate-400 font-bold">Media Repository Clean</p>
                  <p className="text-[10px] text-slate-400/70">No pending uploads require verification.</p>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => onNavigate('media')}
            className="w-full bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-200 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider text-center cursor-pointer transition-colors"
          >
            Moderate Gallery Media
          </button>
        </div>

      </div>

    </div>
  );
}
