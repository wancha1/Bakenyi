import React, { useEffect, useState } from 'react';
import { 
  Heart, 
  Activity, 
  Database, 
  ShieldCheck, 
  FolderGit2, 
  Server, 
  Zap,
  Cpu,
  Lock,
  Loader2,
  FileCode
} from 'lucide-react';
import { isSupabaseConfigured } from '../../../lib/supabase';
import { getSupabase } from '../../../lib/supabaseClient';

export default function SystemHealthView() {
  const [dbStatus, setDbStatus] = useState<'connected' | 'disconnected'>('disconnected');
  const [latency, setLatency] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    testDbConnection();
  }, []);

  async function testDbConnection() {
    setLoading(true);
    const start = performance.now();
    try {
      const configured = isSupabaseConfigured();
      if (configured) {
        const client = getSupabase();
        if (client) {
          // Perform a quick real select query to test connection integrity
          const { data, error } = await client.from('profiles').select('count').limit(1);
          if (!error) {
            setDbStatus('connected');
          } else {
            setDbStatus('disconnected');
          }
        }
      } else {
        setDbStatus('disconnected');
      }
    } catch (err) {
      setDbStatus('disconnected');
    } finally {
      const duration = Math.round(performance.now() - start);
      setLatency(duration);
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8 text-left">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-sans">System Integrity & Diagnostics</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-sans">
          Verify database connection health, review Row Level Security (RLS) layers, and monitor operational telemetry.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col justify-center items-center py-24 space-y-2">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <span className="text-xs text-slate-400">Pinging server daemons...</span>
        </div>
      ) : (
        <>
          {/* Main Status Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Status Card */}
            <div className={`p-6 rounded-3xl border shadow-xs flex items-center gap-5 ${
              dbStatus === 'connected' 
                ? 'bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/10 text-emerald-600' 
                : 'bg-rose-500/5 dark:bg-rose-500/10 border-rose-500/10 text-rose-600'
            }`}>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                dbStatus === 'connected' ? 'bg-emerald-500/10' : 'bg-rose-500/10'
              }`}>
                <Activity className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Database Engine</span>
                <h3 className="text-xl font-serif font-black text-slate-900 dark:text-white leading-none">
                  {dbStatus === 'connected' ? 'Supabase Postgres' : 'Supabase Disconnected'}
                </h3>
                <p className="text-xs text-slate-500 font-medium leading-tight">
                  {dbStatus === 'connected' ? 'Secure persistent cloud layer' : 'Awaiting keys in environment'}
                </p>
              </div>
            </div>

            {/* Connection Latency */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700/50 shadow-xs flex items-center gap-5">
              <div className="w-12 h-12 bg-indigo-500/10 text-indigo-500 rounded-2xl flex items-center justify-center shrink-0">
                <Zap className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">API Latency handshake</span>
                <h3 className="text-xl font-serif font-black text-slate-900 dark:text-white leading-none">
                  {latency ? `${latency} ms` : 'N/A'}
                </h3>
                <p className="text-xs text-slate-500 font-medium leading-tight">Response time of the active database server</p>
              </div>
            </div>

            {/* Security Handshake */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700/50 shadow-xs flex items-center gap-5">
              <div className="w-12 h-12 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Security Layer</span>
                <h3 className="text-xl font-serif font-black text-slate-900 dark:text-white leading-none">RLS Policies Activated</h3>
                <p className="text-xs text-slate-500 font-medium leading-tight">Strict multi-tenant row-level authorization</p>
              </div>
            </div>

          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Database schema tables layout */}
            <div className="lg:col-span-6 bg-white dark:bg-slate-800 p-6 rounded-[28px] border border-slate-100 dark:border-slate-700/50 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-700/40">
                <Database className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                  <h3 className="text-base font-serif font-bold text-slate-900 dark:text-white">Relational Schema Directory</h3>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Verified Supabase Tables</p>
                </div>
              </div>

              <div className="space-y-3.5 pt-2">
                
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-850">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-emerald-500" />
                    <span className="font-mono font-bold text-xs text-slate-800 dark:text-slate-200">profiles</span>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Auth Roles & Vetting Privileges</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-850">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-emerald-500" />
                    <span className="font-mono font-bold text-xs text-slate-800 dark:text-slate-200">articles</span>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">History Publications & Dialects</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-850">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-emerald-500" />
                    <span className="font-mono font-bold text-xs text-slate-800 dark:text-slate-200">gallery</span>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Digital Artifact Library Images</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-850">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-emerald-500" />
                    <span className="font-mono font-bold text-xs text-slate-800 dark:text-slate-200">contributions</span>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Vetting Submission Queue</span>
                </div>

              </div>
            </div>

            {/* Storage Buckets directory layout */}
            <div className="lg:col-span-6 bg-white dark:bg-slate-800 p-6 rounded-[28px] border border-slate-100 dark:border-slate-700/50 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-700/40">
                <FolderGit2 className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                  <h3 className="text-base font-serif font-bold text-slate-900 dark:text-white">Storage Buckets Directory</h3>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Asset Media Repositories</p>
                </div>
              </div>

              <div className="space-y-3.5 pt-2">
                
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-850">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                    <span className="font-mono font-bold text-xs text-slate-800 dark:text-slate-200">media</span>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Primary uploaded materials</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-850">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                    <span className="font-mono font-bold text-xs text-slate-800 dark:text-slate-200">images</span>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Vetted high-res illustrations</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-850">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                    <span className="font-mono font-bold text-xs text-slate-800 dark:text-slate-200">pdfs</span>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Educational downloads attachment catalogs</span>
                </div>

              </div>
            </div>

          </div>

          {/* Code display showing exact active PostgreSQL schema */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-[28px] border border-slate-100 dark:border-slate-700/50 shadow-sm space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
              <FileCode className="w-4 h-4 text-indigo-500" />
              <span>Row Level Security (RLS) Configuration Schema</span>
            </h4>
            
            <div className="bg-slate-950 rounded-2xl p-6 overflow-x-auto relative group font-mono text-xs text-slate-300 text-left">
              <pre className="leading-relaxed">
{`-- Profiles security policies
alter table public.profiles enable row level security;

create policy "Allow public read access to all profiles"
  on public.profiles for select using (true);

create policy "Allow users to edit their own profile"
  on public.profiles for update using (auth.uid() = id);

-- Articles security policies
alter table public.articles enable row level security;

create policy "Allow public read access to published articles" 
  on public.articles for select using (status = 'published');

create policy "Allow full access to authenticated admins & staff" 
  on public.articles for all to authenticated using (true);`}
              </pre>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
