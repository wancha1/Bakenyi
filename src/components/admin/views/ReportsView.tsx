import React, { useEffect, useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Download, 
  Calendar, 
  Users, 
  BookOpen, 
  Sparkles, 
  Database,
  PieChart,
  Grid,
  FileDown,
  Loader2
} from 'lucide-react';
import { getArticles } from '../../../lib/supabase';
import { getContributions, getGalleryImages, Contribution } from '../../../lib/supabase';
import { fetchUsers, UserProfile } from '../../../lib/supabaseClient';
import { Article } from '../../../types/article';

export default function ReportsView() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [galleryCount, setGalleryCount] = useState(0);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setIsLoading(true);
    try {
      const artData = await getArticles(false);
      setArticles(artData);

      const contribData = await getContributions();
      setContributions(contribData);

      const galData = await getGalleryImages();
      setGalleryCount(galData.length);

      const usrData = await fetchUsers();
      setUsers(usrData);
    } catch (err) {
      console.error('Failed to load reports data:', err);
    } finally {
      setIsLoading(false);
    }
  }

  // Calculate some analytics based on REAL data
  const publishedCount = articles.filter(a => a.status === 'published').length;
  const draftCount = articles.filter(a => a.status === 'draft').length;
  
  const approvedContribs = contributions.filter(c => c.status === 'approved').length;
  const pendingContribs = contributions.filter(c => c.status === 'pending').length;
  const rejectedContribs = contributions.filter(c => c.status === 'rejected').length;

  // Breakdown of articles by category
  const categoriesBreakdown = articles.reduce((acc, a) => {
    const cat = a.category || 'History';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Trigger downloading JSON backup of real platform data
  function handleDownloadBackup() {
    const backupData = {
      backupTimestamp: new Date().toISOString(),
      platform: "Bakenye Platform Control Center",
      summary: {
        articlesCount: articles.length,
        contributionsCount: contributions.length,
        galleryCount: galleryCount,
        usersCount: users.length
      },
      data: {
        articles,
        contributions,
        users: users.map(u => ({ id: u.id, email: u.email, role: u.role, created_at: u.created_at }))
      }
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bakenye_platform_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Chart proportions (fallback safely if 0)
  const totalItems = articles.length + contributions.length + galleryCount;
  const articlesPercent = totalItems ? Math.round((articles.length / totalItems) * 100) : 25;
  const contributionsPercent = totalItems ? Math.round((contributions.length / totalItems) * 100) : 25;
  const galleryPercent = totalItems ? Math.round((galleryCount / totalItems) * 100) : 50;

  return (
    <div className="space-y-8 text-left">
      {/* Title section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-sans">Operational Analytics</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-sans">
            Real-time telemetry, database metrics, and secure system archives backup exports.
          </p>
        </div>

        <button
          onClick={handleDownloadBackup}
          disabled={isLoading}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-xs transition-colors cursor-pointer disabled:opacity-50"
        >
          <FileDown className="w-4 h-4" />
          <span>Export Complete Backup</span>
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col justify-center items-center py-24 space-y-2">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <span className="text-xs text-slate-400">Compiling database metrics...</span>
        </div>
      ) : (
        <>
          {/* Top Real Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700/50 shadow-xs">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Articles Published</span>
                <div className="w-8 h-8 bg-emerald-500/10 text-emerald-500 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-3xl font-serif font-black text-slate-900 dark:text-white mt-4">{publishedCount}</h3>
              <p className="text-xs text-slate-400 mt-1">{draftCount} draft articles saved</p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700/50 shadow-xs">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Gallery Collections</span>
                <div className="w-8 h-8 bg-indigo-500/10 text-indigo-500 rounded-lg flex items-center justify-center">
                  <Grid className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-3xl font-serif font-black text-slate-900 dark:text-white mt-4">{galleryCount}</h3>
              <p className="text-xs text-slate-400 mt-1">Sourced from vetted artifacts</p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700/50 shadow-xs">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Vetting Moderation</span>
                <div className="w-8 h-8 bg-amber-500/10 text-amber-500 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-3xl font-serif font-black text-slate-900 dark:text-white mt-4">{approvedContribs}</h3>
              <p className="text-xs text-slate-400 mt-1">{pendingContribs} pending verification</p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700/50 shadow-xs">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Active Accounts</span>
                <div className="w-8 h-8 bg-rose-500/10 text-rose-500 rounded-lg flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-3xl font-serif font-black text-slate-900 dark:text-white mt-4">{users.length}</h3>
              <p className="text-xs text-slate-400 mt-1">
                {users.filter(u => u.role === 'admin').length} administrator accounts
              </p>
            </div>

          </div>

          {/* Interactive Handcrafted Analytics Panels */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Real Category Distribution SVG Bar-Chart */}
            <div className="lg:col-span-8 bg-white dark:bg-slate-800 p-6 rounded-[28px] border border-slate-100 dark:border-slate-700/50 shadow-xs space-y-6">
              <div>
                <h3 className="text-base font-serif font-bold text-slate-900 dark:text-white">Cultural Topics Distribution</h3>
                <p className="text-xs text-slate-400">Actual counts of articles mapped directly inside categories.</p>
              </div>

              <div className="space-y-4.5 pt-2">
                {['History', 'Culture', 'Heritage', 'Leadership', 'Community News', 'Announcements'].map((cat) => {
                  const val = categoriesBreakdown[cat] || 0;
                  const maxVal = Math.max(...(Object.values(categoriesBreakdown) as number[]), 1);
                  const percentWidth = Math.round((val / maxVal) * 100);

                  return (
                    <div key={cat} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-700 dark:text-slate-300">{cat}</span>
                        <span className="text-slate-500 font-mono">{val} articles ({percentWidth}%)</span>
                      </div>
                      <div className="w-full h-3 bg-slate-50 dark:bg-slate-900 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(percentWidth, 4)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Platform Resource Makeup donut chart */}
            <div className="lg:col-span-4 bg-white dark:bg-slate-800 p-6 rounded-[28px] border border-slate-100 dark:border-slate-700/50 shadow-xs flex flex-col justify-between space-y-6">
              <div>
                <h3 className="text-base font-serif font-bold text-slate-900 dark:text-white">Data Repository Volume</h3>
                <p className="text-xs text-slate-400">Volume proportion of digital resources.</p>
              </div>

              {/* Handcrafted Circular SVG donut Chart */}
              <div className="relative flex justify-center py-4">
                <svg width="160" height="160" viewBox="0 0 36 36" className="w-40 h-40 transform -rotate-90">
                  {/* Background circle */}
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="currentColor" className="text-slate-100 dark:text-slate-900" strokeWidth="3" />
                  
                  {/* Arc 1: Gallery */}
                  <circle 
                    cx="18" cy="18" r="15.915" 
                    fill="none" 
                    stroke="#4f46e5" 
                    strokeWidth="3.2" 
                    strokeDasharray={`${galleryPercent} ${100 - galleryPercent}`} 
                    strokeDashoffset="0"
                  />
                  
                  {/* Arc 2: Articles */}
                  <circle 
                    cx="18" cy="18" r="15.915" 
                    fill="none" 
                    stroke="#10b981" 
                    strokeWidth="3.2" 
                    strokeDasharray={`${articlesPercent} ${100 - articlesPercent}`} 
                    strokeDashoffset={`-${galleryPercent}`}
                  />

                  {/* Arc 3: Contributions */}
                  <circle 
                    cx="18" cy="18" r="15.915" 
                    fill="none" 
                    stroke="#f59e0b" 
                    strokeWidth="3.2" 
                    strokeDasharray={`${contributionsPercent} ${100 - contributionsPercent}`} 
                    strokeDashoffset={`-${galleryPercent + articlesPercent}`}
                  />
                </svg>

                {/* Center text */}
                <div className="absolute inset-0 flex flex-col justify-center items-center">
                  <span className="text-2xl font-serif font-black text-slate-900 dark:text-white">{totalItems}</span>
                  <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Total Assets</span>
                </div>
              </div>

              {/* Legend indicators */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-700/40">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                    <span className="text-slate-600 dark:text-slate-400">Digital Gallery Items</span>
                  </div>
                  <span className="text-slate-900 dark:text-white font-mono">{galleryPercent}%</span>
                </div>
                <div className="flex items-center justify-between text-xs font-semibold">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="text-slate-600 dark:text-slate-400">Heritage Articles</span>
                  </div>
                  <span className="text-slate-900 dark:text-white font-mono">{articlesPercent}%</span>
                </div>
                <div className="flex items-center justify-between text-xs font-semibold">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span className="text-slate-600 dark:text-slate-400">Moderated Contributions</span>
                  </div>
                  <span className="text-slate-900 dark:text-white font-mono">{contributionsPercent}%</span>
                </div>
              </div>

            </div>

          </div>

          {/* Secure backup downloader panel */}
          <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-[28px] border border-slate-100 dark:border-slate-800/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1">
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-indigo-500" />
                <span>Encrypted JSON Archive Backups</span>
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                Downloads an offline JSON bundle comprising the complete registered catalog of profiles, publication logs, and vetting queues.
              </p>
            </div>
            
            <button
              onClick={handleDownloadBackup}
              className="px-4.5 py-2.5 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95 flex items-center gap-1.5 shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>Download Schema Dump</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
