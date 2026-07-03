import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Lock, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  Loader2, 
  User, 
  Database, 
  BookOpen, 
  Inbox, 
  LogOut, 
  AlertTriangle, 
  Check, 
  Copy, 
  Terminal,
  FileCode,
  Sparkles
} from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, updateDoc, doc, deleteDoc, Timestamp, setDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { signIn, signOut, getCurrentUser, isSupabaseConfigured } from '../lib/supabase';
import ArticlesManager from '../components/admin/ArticlesManager';

interface Contribution {
  id: string;
  userId: string;
  userEmail: string;
  title: string;
  description: string;
  type: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Timestamp;
  imageUrl: string;
}

export default function Admin() {
  // Navigation / Tabs
  const [activeTab, setActiveTab] = useState<'articles' | 'contributions' | 'integration'>('articles');
  
  // Authentication State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [authError, setAuthError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Archive Contributions State (legacy integration)
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [contribsLoading, setContribsLoading] = useState(true);

  // SQL schema code copy feedback
  const [copiedSql, setCopiedSql] = useState(false);

  // Check login state on mount
  useEffect(() => {
    async function checkUser() {
      try {
        const user = await getCurrentUser();
        setCurrentUser(user);
      } catch (err) {
        console.error('Failed to resolve current admin user', err);
      } finally {
        setAuthChecking(false);
      }
    }
    checkUser();
  }, []);

  // Fetch contributions if logged in and on the contributions tab
  useEffect(() => {
    if (!currentUser || activeTab !== 'contributions') return;

    setContribsLoading(true);
    const q = query(collection(db, 'contributions'), orderBy('submittedAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      })) as Contribution[];
      setContributions(docs);
      setContribsLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'contributions');
      setContribsLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser, activeTab]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setAuthError('Please fill in all credentials.');
      return;
    }

    setLoginLoading(true);
    setAuthError('');
    try {
      const { user, error } = await signIn(email, password);
      if (error) {
        throw error;
      }
      setCurrentUser(user);
    } catch (err: any) {
      setAuthError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
      console.error('Failed to log out', error);
    } else {
      setCurrentUser(null);
    }
  };

  // Pre-existing contribution review action
  const updateStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const contrib = contributions.find(c => c.id === id);
      if (!contrib) return;

      await updateDoc(doc(db, 'contributions', id), { status });

      if (status === 'approved') {
        const galleryPath = 'gallery';
        await setDoc(doc(db, galleryPath, id), {
          title: contrib.title,
          category: contrib.type === 'photo' ? 'History' : 'Tradition',
          description: contrib.description,
          imageUrl: contrib.imageUrl,
          contributionId: id,
          createdAt: serverTimestamp()
        });
      } else {
        await deleteDoc(doc(db, 'gallery', id));
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `contributions/${id}`);
    }
  };

  // Pre-existing contribution deletion action
  const removeContribution = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this contribution?')) return;
    try {
      await deleteDoc(doc(db, 'contributions', id));
      await deleteDoc(doc(db, 'gallery', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `contributions/${id}`);
    }
  };

  const copySqlToClipboard = () => {
    const sql = `
-- 1. CREATE THE ARTICLES TABLE
create table if not exists public.articles (
  id text primary key,
  title text not null,
  excerpt text not null,
  content text not null,
  category text not null,
  author text not null,
  "publishedAt" text not null,
  "imageUrl" text,
  "pdfUrl" text,
  views integer default 0,
  tags text[] default array[]::text[],
  "additionalImages" text[] default array[]::text[],
  status text default 'draft'
);

-- 2. ENABLE ROW LEVEL SECURITY (RLS) FOR ARTICLES
alter table public.articles enable row level security;

-- Create policies for Articles
create policy "Allow public read access to published articles" 
  on public.articles for select 
  using (status = 'published');

create policy "Allow full access to authenticated admins" 
  on public.articles for all 
  to authenticated 
  using (true);

-- 3. STORAGE SETUP FOR ATTACHMENTS
-- Note: Create two public storage buckets in Supabase:
--    a. 'featured-images' (for article covers)
--    b. 'pdf-attachments' (for downloadable research papers)
    `;
    navigator.clipboard.writeText(sql.trim());
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  if (authChecking) {
    return (
      <div className="pt-24 min-h-screen bg-heritage-cream flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-heritage-terracotta animate-spin mb-4" />
        <span className="text-xs font-black uppercase tracking-[0.2em] text-heritage-brown/40">Securing environment...</span>
      </div>
    );
  }

  // ==========================================
  // VIEW: AUTHENTICATION LOGIN FORM
  // ==========================================
  if (!currentUser) {
    return (
      <div className="pt-24 min-h-screen bg-heritage-cream relative flex items-center justify-center px-4">
        <div className="absolute inset-0 cultural-pattern opacity-5 pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white rounded-[40px] p-8 md:p-10 shadow-2xl border border-heritage-brown/5 text-center relative z-10"
        >
          {/* Lock Header */}
          <div className="w-20 h-20 bg-heritage-terracotta/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-heritage-terracotta" />
          </div>
          <h1 className="text-3xl font-serif font-black text-heritage-brown mb-2">Heritage Control</h1>
          <p className="text-heritage-brown/60 text-sm font-semibold mb-8">
            Access secure admin publishing & management tools
          </p>

          {/* Fallback Warning Box */}
          {!isSupabaseConfigured() && (
            <div className="bg-heritage-sand/15 border border-heritage-sand/30 rounded-2xl p-4 text-left mb-6 text-xs space-y-1">
              <div className="flex items-center text-heritage-terracotta font-black uppercase tracking-wider gap-1.5 mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Local Sandbox Mode Active</span>
              </div>
              <p className="text-heritage-brown/75 font-semibold leading-relaxed">
                Supabase keys aren't added yet. We have auto-enabled high-fidelity local storage emulation.
              </p>
              <div className="pt-1.5 font-bold text-heritage-brown/60">
                👉 Login with: <code className="bg-white/80 px-1.5 py-0.5 rounded font-mono text-heritage-terracotta">admin@bakenyi.org</code><br />
                👉 Password: <code className="bg-white/80 px-1.5 py-0.5 rounded font-mono text-heritage-terracotta">admin123</code>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-heritage-brown/50">Admin Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@bakenyi.org"
                className="w-full px-5 py-3.5 bg-heritage-cream/30 border border-heritage-brown/10 rounded-2xl text-xs font-bold text-heritage-brown outline-none focus:border-heritage-terracotta"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-heritage-brown/50">Admin Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-5 py-3.5 bg-heritage-cream/30 border border-heritage-brown/10 rounded-2xl text-xs font-bold text-heritage-brown outline-none focus:border-heritage-terracotta"
                required
              />
            </div>

            {authError && (
              <div className="p-3.5 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-2 text-red-600 text-xs font-semibold">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            <button 
              type="submit"
              disabled={loginLoading}
              className="w-full flex items-center justify-center space-x-2 py-4 bg-heritage-terracotta hover:bg-heritage-brown text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-heritage-terracotta/20 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {loginLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>Authenticate Session</span>
                  <ShieldCheck className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  // ==========================================
  // VIEW: MAIN SECURE ADMINISTRATOR BOARD
  // ==========================================
  return (
    <div className="pt-24 min-h-screen bg-heritage-cream">
      
      {/* Admin Branding Strip */}
      <section className="bg-heritage-brown text-white py-12 px-4 border-b border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-heritage-sand">
              <ShieldCheck className="w-5 h-5 text-heritage-terracotta" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">Secure Administrator Interface</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-serif font-black">Archive Management</h1>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            {/* User credentials identifier */}
            <div className="bg-white/5 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-heritage-terracotta/20 flex items-center justify-center">
                <User className="w-4 h-4 text-heritage-sand" />
              </div>
              <div className="text-left">
                <p className="text-[8px] font-black uppercase tracking-widest text-heritage-sand">Logged in as</p>
                <p className="text-xs font-bold truncate max-w-[150px]">{currentUser.email || 'Admin'}</p>
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="p-3.5 bg-white/5 hover:bg-red-500 hover:text-white text-white rounded-2xl border border-white/10 transition-all cursor-pointer active:scale-90"
              title="End Secure Session"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Tabs navigation bar */}
      <div className="bg-white border-b border-heritage-brown/10">
        <div className="max-w-7xl mx-auto px-4 flex gap-6 overflow-x-auto">
          {/* Tab: Articles Manager */}
          <button
            onClick={() => setActiveTab('articles')}
            className={`py-5 border-b-2 font-black uppercase text-xs tracking-widest flex items-center gap-2 cursor-pointer transition-all whitespace-nowrap ${
              activeTab === 'articles' 
                ? 'border-heritage-terracotta text-heritage-terracotta' 
                : 'border-transparent text-heritage-brown/50 hover:text-heritage-brown'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Articles Publisher</span>
          </button>

          {/* Tab: Contributions review */}
          <button
            onClick={() => setActiveTab('contributions')}
            className={`py-5 border-b-2 font-black uppercase text-xs tracking-widest flex items-center gap-2 cursor-pointer transition-all whitespace-nowrap ${
              activeTab === 'contributions' 
                ? 'border-heritage-terracotta text-heritage-terracotta' 
                : 'border-transparent text-heritage-brown/50 hover:text-heritage-brown'
            }`}
          >
            <Inbox className="w-4 h-4" />
            <span>Community Contributions</span>
            {contributions.filter(c => c.status === 'pending').length > 0 && (
              <span className="bg-heritage-terracotta text-white text-[9px] font-black px-2 py-0.5 rounded-full">
                {contributions.filter(c => c.status === 'pending').length}
              </span>
            )}
          </button>

          {/* Tab: Supabase configuration setup */}
          <button
            onClick={() => setActiveTab('integration')}
            className={`py-5 border-b-2 font-black uppercase text-xs tracking-widest flex items-center gap-2 cursor-pointer transition-all whitespace-nowrap ${
              activeTab === 'integration' 
                ? 'border-heritage-terracotta text-heritage-terracotta' 
                : 'border-transparent text-heritage-brown/50 hover:text-heritage-brown'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Supabase Setup</span>
          </button>
        </div>
      </div>

      {/* Tab Contents Frame */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        
        {/* TAB 1: ARTICLES MANAGER */}
        {activeTab === 'articles' && (
          <div className="animate-fade-in">
            <ArticlesManager />
          </div>
        )}

        {/* TAB 2: ORIGINAL ARCHIVE REVIEW PROCESS */}
        {activeTab === 'contributions' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center pb-4 border-b border-heritage-brown/10">
              <div>
                <h2 className="text-xl font-serif font-black text-heritage-brown">Review Archive Submissions</h2>
                <p className="text-xs text-heritage-brown/50 font-semibold">Verify and moderate heritage media items sent in by the community</p>
              </div>
            </div>

            {contribsLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-10 h-10 text-heritage-terracotta animate-spin mb-4" />
                <p className="text-heritage-brown/40 font-bold uppercase tracking-widest text-xs">Loading submissions...</p>
              </div>
            ) : contributions.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-[32px] border border-heritage-brown/5 shadow-sm p-8">
                <Inbox className="w-12 h-12 text-heritage-brown/20 mx-auto mb-4" />
                <p className="text-heritage-brown font-black text-sm">No submissions in queue</p>
                <p className="text-heritage-brown/40 text-xs mt-1">When public users upload media on the Contribute page, it will populate here for vetting.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {contributions.map((item) => (
                  <div 
                    key={item.id}
                    className="bg-white rounded-[28px] overflow-hidden shadow-sm border border-heritage-brown/5 flex flex-col h-full group"
                  >
                    <div className="aspect-video relative overflow-hidden bg-heritage-cream/50">
                      <img 
                        src={item.imageUrl} 
                        alt={item.title} 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-4 left-4">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                          item.status === 'approved' ? 'bg-heritage-olive/10 text-heritage-olive border-heritage-olive/20' :
                          item.status === 'rejected' ? 'bg-red-50 text-red-500 border-red-500/20' :
                          'bg-heritage-terracotta/10 text-heritage-terracotta border-heritage-terracotta/20'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                    </div>

                    <div className="p-6 flex-grow flex flex-col">
                      <div className="flex items-center justify-between mb-3 text-[10px] font-black uppercase tracking-widest text-heritage-brown/40">
                        <span>Type: {item.type}</span>
                        <span>{item.submittedAt?.toDate().toLocaleDateString()}</span>
                      </div>
                      <h3 className="text-lg font-serif font-bold text-heritage-brown mb-2">{item.title}</h3>
                      <p className="text-xs text-heritage-brown/60 leading-relaxed mb-6 line-clamp-3 italic">
                        "{item.description}"
                      </p>
                      
                      <div className="mt-auto space-y-4 pt-4 border-t border-heritage-brown/5">
                        <p className="text-[10px] font-mono text-heritage-brown/40 truncate">Sender: {item.userEmail || item.userId}</p>
                        <div className="flex gap-1.5">
                          <button 
                            onClick={() => updateStatus(item.id, 'approved')}
                            disabled={item.status === 'approved'}
                            className="flex-grow flex items-center justify-center space-x-2 py-2.5 bg-heritage-olive/10 text-heritage-olive hover:bg-heritage-olive hover:text-white rounded-xl transition-all text-[10px] font-black uppercase tracking-widest disabled:opacity-30 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>
                          <button 
                            onClick={() => updateStatus(item.id, 'rejected')}
                            disabled={item.status === 'rejected'}
                            className="flex-grow flex items-center justify-center space-x-2 py-2.5 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all text-[10px] font-black uppercase tracking-widest disabled:opacity-30 cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                          <button 
                            onClick={() => removeContribution(item.id)}
                            className="p-2.5 bg-heritage-brown/5 hover:bg-red-500 text-heritage-brown/40 hover:text-white rounded-xl transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: INTEGRATION MONITORING & SCHEMAS */}
        {activeTab === 'integration' && (
          <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
            {/* Status Check Card */}
            <div className="bg-white border border-heritage-brown/10 rounded-[32px] p-6 md:p-8 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  isSupabaseConfigured() ? 'bg-heritage-olive/10 text-heritage-olive' : 'bg-amber-50 text-amber-600'
                }`}>
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-serif font-bold text-heritage-brown">Connection Verification</h3>
                  <p className="text-xs text-heritage-brown/50 font-medium">Supabase service status monitoring</p>
                </div>
              </div>

              {isSupabaseConfigured() ? (
                <div className="bg-heritage-olive/5 border border-heritage-olive/10 p-4 rounded-xl flex items-start gap-3">
                  <Check className="w-5 h-5 text-heritage-olive mt-0.5 shrink-0" />
                  <div className="text-xs text-heritage-olive space-y-1">
                    <p className="font-bold uppercase tracking-wider">SUPABASE ACTIVE & CONFIGURED</p>
                    <p className="font-medium text-heritage-brown/80 leading-relaxed">
                      Your app is connected to the live Supabase instance at <code className="font-mono bg-white px-1 py-0.5 border rounded">{(import.meta as any).env.VITE_SUPABASE_URL}</code>. Secure authentication, publishing tables, and media storage buckets are fully active.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                  <div className="text-xs text-amber-800 space-y-1">
                    <p className="font-bold uppercase tracking-wider">LOCAL EMULATION ACTIVE</p>
                    <p className="font-medium text-heritage-brown/80 leading-relaxed">
                      This environment is running a flawless client-side simulation. To link a real Supabase database and storage, click <strong>Settings</strong> in the AI Studio editor sidebar, and provide the credentials below:
                    </p>
                    <div className="pt-2 font-mono text-[10px] space-y-1 text-heritage-brown/70">
                      <div>🗝️ <span className="font-bold">VITE_SUPABASE_URL</span> = <span className="italic">Your Supabase Endpoint URL</span></div>
                      <div>🗝️ <span className="font-bold">VITE_SUPABASE_ANON_KEY</span> = <span className="italic">Your Supabase Anon API Key</span></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* SQL Blueprint Copy Card */}
            <div className="bg-white border border-heritage-brown/10 rounded-[32px] p-6 md:p-8 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-heritage-terracotta/10 text-heritage-terracotta rounded-full flex items-center justify-center">
                    <Terminal className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-serif font-bold text-heritage-brown">Supabase SQL Blueprint</h3>
                    <p className="text-xs text-heritage-brown/50 font-medium">Execute this schema in your Supabase SQL Editor to provision tables</p>
                  </div>
                </div>
                
                <button
                  onClick={copySqlToClipboard}
                  className="flex items-center space-x-2 px-4 py-2.5 bg-heritage-terracotta hover:bg-heritage-brown text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-sm"
                >
                  {copiedSql ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy SQL</span>
                    </>
                  )}
                </button>
              </div>

              {/* Code Pre Box */}
              <div className="bg-heritage-brown/5 rounded-2xl p-5 border border-heritage-brown/10 font-mono text-[10px] overflow-x-auto text-heritage-brown/80 leading-relaxed max-h-[350px]">
                <pre>{`-- 1. CREATE THE ARTICLES TABLE
create table if not exists public.articles (
  id text primary key,
  title text not null,
  excerpt text not null,
  content text not null,
  category text not null,
  author text not null,
  "publishedAt" text not null,
  "imageUrl" text,
  "pdfUrl" text,
  views integer default 0,
  tags text[] default array[]::text[],
  "additionalImages" text[] default array[]::text[],
  status text default 'draft'
);

-- 2. ENABLE ROW LEVEL SECURITY (RLS)
alter table public.articles enable row level security;

-- Policies for Articles
create policy "Allow public read access to published articles" 
  on public.articles for select 
  using (status = 'published');

create policy "Allow full access to authenticated admins" 
  on public.articles for all 
  to authenticated 
  using (true);`}</pre>
              </div>
            </div>

            {/* Storage Buckets Instructions Card */}
            <div className="bg-white border border-heritage-brown/10 rounded-[32px] p-6 md:p-8 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-heritage-olive/10 text-heritage-olive rounded-full flex items-center justify-center">
                  <FileCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-serif font-bold text-heritage-brown">Required Storage Buckets</h3>
                  <p className="text-xs text-heritage-brown/50 font-medium">Configure Supabase Storage to handle uploads securely</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold leading-relaxed text-heritage-brown">
                <div className="border border-heritage-brown/10 p-5 rounded-2xl space-y-1 bg-heritage-cream/10">
                  <p className="font-black text-heritage-terracotta uppercase">Bucket 1: featured-images</p>
                  <p className="text-heritage-brown/70">Used for uploading featured banner images for articles.</p>
                  <p className="pt-2 text-[10px] font-bold text-heritage-brown/50">🔒 Set access to: <span className="font-black text-heritage-brown">Public</span></p>
                </div>
                
                <div className="border border-heritage-brown/10 p-5 rounded-2xl space-y-1 bg-heritage-cream/10">
                  <p className="font-black text-heritage-terracotta uppercase">Bucket 2: pdf-attachments</p>
                  <p className="text-heritage-brown/70">Used for uploading custom research files and historical documents.</p>
                  <p className="pt-2 text-[10px] font-bold text-heritage-brown/50">🔒 Set access to: <span className="font-black text-heritage-brown">Public</span></p>
                </div>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* Integrity Disclaimer strip */}
      <footer className="py-16 bg-white border-t border-heritage-brown/5 text-center px-4 mt-12">
        <div className="max-w-2xl mx-auto space-y-4">
          <ShieldCheck className="w-10 h-10 text-heritage-terracotta mx-auto" />
          <h2 className="text-2xl font-serif font-bold text-heritage-brown">Administrator Code of Ethics</h2>
          <p className="text-heritage-brown/60 text-xs leading-relaxed max-w-lg mx-auto font-medium">
            You hold the key to the digital archives of the Bakenyi people. Ensure that all published resources are accurate, respectful, and contribute to the long-term documentation and defense of our culture.
          </p>
        </div>
      </footer>

    </div>
  );
}
