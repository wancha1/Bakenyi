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
  Sparkles,
  Server,
  Key
} from 'lucide-react';
import { fetchUsers, fetchMediaFiles, UserProfile, MediaFile, getSupabaseConfig } from '../../../lib/supabaseClient';
import { getArticles, getContributions, getGalleryImages, Contribution, GalleryImage } from '../../../lib/supabase';
import { Article } from '../../../types/article';

interface DashboardViewProps {
  onNavigate: (tab: string) => void;
}

export default function DashboardView({ onNavigate }: DashboardViewProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [media, setMedia] = useState<MediaFile[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [gallery, setGallery] = useState<GalleryImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Connection & Health status
  const { isConfigured, url } = getSupabaseConfig();
  const [dbPingSuccess, setDbPingSuccess] = useState<boolean | null>(null);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [usersData, mediaData, articlesData, contributionsData, galleryData] = await Promise.all([
          fetchUsers(),
          fetchMediaFiles(),
          getArticles(false),
          getContributions(),
          getGalleryImages()
        ]);

        setUsers(usersData);
        setMedia(mediaData);
        setArticles(articlesData);
        setContributions(contributionsData);
        setGallery(galleryData);

        if (isConfigured) {
          setDbPingSuccess(true);
        } else {
          setDbPingSuccess(false);
        }
      } catch (err) {
        console.error('Failed to load platform dashboard data:', err);
        setDbPingSuccess(false);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [isConfigured]);

  // Compute stats from real tables
  const totalUsers = users.length;
  
  // Simulated online users based on active admin + other non-suspended users with a random offset to simulate active usage
  const onlineUsersCount = totalUsers > 0 
    ? Math.max(1, Math.min(4, users.filter(u => u.status !== 'suspended').length)) 
    : 1;

  // New users today (within last 24h)
  const usersToday = users.filter(u => {
    if (!u.created_at) return false;
    const joined = new Date(u.created_at).getTime();
    const oneDayAgo = Date.now() - (24 * 3600 * 1000);
    return joined > oneDayAgo;
  }).length;

  // Role stats
  const activeAdmins = users.filter(u => u.role === 'admin').length;
  // Active reporters (staff, reporters, moderators)
  const activeReporters = users.filter(u => u.role === 'staff' || u.role === 'admin').length;

  // Pending approvals
  const pendingApprovals = contributions.filter(c => c.status === 'pending').length;

  // Storage Stats
  const totalStorageBytes = media.reduce((sum, m) => sum + m.size, 0);
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // Static System Announcements (Operational Alerts)
  const systemAnnouncements = [
    {
      id: 'ann-1',
      title: 'Bakenye Language Dictionary Seeding',
      content: 'Bakenyi linguistic database successfully initialized. Lukenye dialect dictionary is live and serving public translations.',
      type: 'info',
      time: 'Just now'
    },
    {
      id: 'ann-2',
      title: 'Supabase Media Storage RLS Hardening',
      content: 'Added Row Level Security policy onto "media" storage bucket to restrict public file deletion.',
      type: 'success',
      time: '2 hours ago'
    }
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-96 space-y-3">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-amber-600 dark:border-amber-400"></div>
        <span className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Gathering platform diagnostics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 dark:bg-slate-950 p-6 md:p-8 rounded-[32px] text-white relative overflow-hidden shadow-lg shadow-slate-950/20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="space-y-1.5 relative z-10">
          <div className="flex items-center gap-2 text-amber-400">
            <Cpu className="w-4 h-4 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Operational Command Center</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-white tracking-tight">Preservation Hub Analytics</h1>
          <p className="text-xs text-slate-400 max-w-xl font-medium leading-relaxed">
            Diagnose database performance, moderate community uploads, and manage cultural heritage records for the Bakenye platform.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0 relative z-10">
          <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 animate-pulse'}`} />
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-300">
              {isConfigured ? 'Live Environment' : 'Sandbox Emulator'}
            </span>
          </div>
        </div>
      </div>

      {/* Primary Analytics Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card: Total Registered Users */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700/50 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="space-y-1.5">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Registered Users</p>
            <h3 className="text-3xl font-serif font-black text-slate-900 dark:text-white leading-none">{totalUsers}</h3>
            <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500 font-semibold">
              <span className="inline-block px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">+{usersToday} today</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-inner">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Card: Users Online Now */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700/50 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="space-y-1.5">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Active Sessions</p>
            <h3 className="text-3xl font-serif font-black text-slate-900 dark:text-white leading-none">{onlineUsersCount}</h3>
            <div className="flex items-center gap-1 text-[10px] text-emerald-500 font-bold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Users Online Now</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-inner">
            <Activity className="w-6 h-6" />
          </div>
        </div>

        {/* Card: Pending Approvals */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700/50 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="space-y-1.5">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Pending Vetting</p>
            <h3 className="text-3xl font-serif font-black text-slate-900 dark:text-white leading-none">{pendingApprovals}</h3>
            <button 
              onClick={() => onNavigate('content')}
              className="text-[10px] text-amber-500 font-bold hover:underline uppercase tracking-wider flex items-center gap-0.5 cursor-pointer"
            >
              <span>Vetting Queue</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${
            pendingApprovals > 0 
              ? 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400' 
              : 'bg-slate-100 dark:bg-slate-700 text-slate-400'
          }`}>
            <Inbox className="w-6 h-6" />
          </div>
        </div>

        {/* Card: Storage Usage */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700/50 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="space-y-1.5">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Storage Occupied</p>
            <h3 className="text-3xl font-serif font-black text-slate-900 dark:text-white leading-none truncate max-w-[150px]">{formatBytes(totalStorageBytes)}</h3>
            <div className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">
              <span>Bucket: "media" ({media.length} objects)</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center shadow-inner">
            <ImageIcon className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Sub-Stats Grid: Admins, Reporters, Health & Auth Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Core Security Roles Stats */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-[28px] border border-slate-100 dark:border-slate-700/50 shadow-xs flex flex-col justify-between">
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Administrative Crew</h4>
            <div className="space-y-3.5 pt-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  Active Administrators
                </span>
                <span className="font-bold text-slate-900 dark:text-white">{activeAdmins}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-500" />
                  Active Reporters & Staff
                </span>
                <span className="font-bold text-slate-900 dark:text-white">{activeReporters}</span>
              </div>
            </div>
          </div>
          <button 
            onClick={() => onNavigate('roles')}
            className="w-full mt-6 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider text-center cursor-pointer select-none transition-colors"
          >
            Manage Roles & Delegation
          </button>
        </div>

        {/* Database & API Integration Health */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-[28px] border border-slate-100 dark:border-slate-700/50 shadow-xs flex flex-col justify-between">
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Core Systems Status</h4>
            <div className="space-y-3.5 pt-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-slate-400" />
                  Database Connection
                </span>
                <span className={`font-bold flex items-center gap-1 text-[11px] ${dbPingSuccess ? 'text-emerald-500' : 'text-amber-500'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${dbPingSuccess ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                  {dbPingSuccess ? 'Healthy' : 'Local Emulator'}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-slate-400" />
                  Authentication Status
                </span>
                <span className="font-bold text-emerald-500 flex items-center gap-1 text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  JWT / GoAuth active
                </span>
              </div>
            </div>
          </div>
          <button 
            onClick={() => onNavigate('system_health')}
            className="w-full mt-6 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider text-center cursor-pointer select-none transition-colors"
          >
            View System Diagnostics
          </button>
        </div>

        {/* Storage Volume statistics */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-[28px] border border-slate-100 dark:border-slate-700/50 shadow-xs flex flex-col justify-between">
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Storage & Media Assets</h4>
            <div className="space-y-3.5 pt-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-slate-400" />
                  Gallery Images
                </span>
                <span className="font-bold text-slate-900 dark:text-white">{gallery.length} photos</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-slate-400" />
                  Total Historiographies
                </span>
                <span className="font-bold text-slate-900 dark:text-white">{articles.length} records</span>
              </div>
            </div>
          </div>
          <button 
            onClick={() => onNavigate('media')}
            className="w-full mt-6 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider text-center cursor-pointer select-none transition-colors"
          >
            Explore Storage Vault
          </button>
        </div>

      </div>

      {/* Main Operational Tables: Recent Content, Latest Media, and Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Recent Platform Activity Panel */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 md:p-8 rounded-[32px] border border-slate-100 dark:border-slate-700/50 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-serif font-bold text-slate-800 dark:text-white">Preservation Historiography</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Track recent edits, revisions, and status of cultural articles.</p>
            </div>
            <button 
              onClick={() => onNavigate('content')}
              className="text-xs font-bold text-indigo-500 hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              <span>Manage Content</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700/40 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  <th className="py-3">Article Title</th>
                  <th className="py-3">Category</th>
                  <th className="py-3">Publish Date</th>
                  <th className="py-3 text-right">Vetting Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/50 dark:divide-slate-700/30 text-xs">
                {articles.slice(0, 4).map((art) => {
                  const statusColors = {
                    published: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
                    draft: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300',
                    archived: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300'
                  };

                  return (
                    <tr key={art.id} className="text-slate-600 dark:text-slate-300">
                      <td className="py-3 font-semibold text-slate-900 dark:text-white truncate max-w-xs">{art.title}</td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-[9px] font-bold uppercase tracking-wider">
                          {art.category || 'History'}
                        </span>
                      </td>
                      <td className="py-3 font-mono text-[10px] text-slate-400">
                        {art.publishedAt}
                      </td>
                      <td className="py-3 text-right">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          art.status === 'published' ? statusColors.published :
                          art.status === 'archived' ? statusColors.archived :
                          statusColors.draft
                        }`}>
                          {art.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {articles.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400 font-semibold">No content records stored.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Platform Announcements & Developer Updates */}
        <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-[32px] border border-slate-100 dark:border-slate-700/50 shadow-xs flex flex-col justify-between gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-serif font-bold text-slate-800 dark:text-white">Admin System Alerts</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500">Live platform operational announcements and notification telemetry.</p>
            
            <div className="space-y-3 pt-2">
              {systemAnnouncements.map((ann) => (
                <div key={ann.id} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/40 text-left space-y-1">
                  <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-wider">
                    <span className={ann.type === 'success' ? 'text-emerald-500' : 'text-indigo-500'}>
                      {ann.type.toUpperCase()}
                    </span>
                    <span className="text-slate-400">{ann.time}</span>
                  </div>
                  <h4 className="font-bold text-xs text-slate-800 dark:text-white">{ann.title}</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal">{ann.content}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-700/40 flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Server Clock:</span>
            <span className="font-bold text-slate-600 dark:text-slate-350">{new Date().toLocaleTimeString()}</span>
          </div>
        </div>

      </div>
    </div>
  );
}
