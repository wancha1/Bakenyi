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
  Sparkles,
  Users,
  Image as ImageIcon,
  Activity,
  FileCode,
  Settings,
  Heart
} from 'lucide-react';
import { getSupabase, fetchUsers, updateUserStatus } from '../lib/supabaseClient';
import { 
  signIn, 
  signOut, 
  getCurrentUser, 
  isSupabaseConfigured,
  getArticles,
  getContributions,
  updateContributionStatus,
  getGalleryImages,
  addGalleryImage,
  Contribution,
  GalleryImage
} from '../lib/supabase';
import ArticlesManager from '../components/admin/ArticlesManager';

export default function Admin() {
  const supabase = getSupabase();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'articles' | 'contributions' | 'gallery' | 'users' | 'settings'>('dashboard');
  
  // Auth states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<'admin' | 'staff' | 'customer'>('customer');
  const [authChecking, setAuthChecking] = useState(true);
  const [authError, setAuthError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Stats and list states
  const [articlesCount, setArticlesCount] = useState(0);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Check login state and fetch initial profile role
  useEffect(() => {
    async function checkUser() {
      try {
        const user = await getCurrentUser();
        setCurrentUser(user);
        if (user && supabase) {
          // Fetch exact user role from profiles
          const { data, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .maybeSingle();
          if (!error && data) {
            setUserRole(data.role || 'customer');
          } else {
            // Check email-based bypass for fallback admin credentials
            const emailLower = user.email?.toLowerCase() || '';
            if (emailLower === 'superadmin@bakenye.com' || emailLower === 'wanchaaaron@gmail.com' || emailLower === 'aaronwancha@gmail.com') {
              setUserRole('super_admin');
            } else if (
              emailLower === 'admin@bakenye.com' || 
              emailLower === 'admin@bakenyi.org'
            ) {
              setUserRole('admin');
            }
          }
        }
      } catch (err) {
        console.error('Failed to resolve current admin user', err);
      } finally {
        setAuthChecking(false);
      }
    }
    checkUser();
  }, [refreshTrigger]);

  // Fetch metrics and list data
  useEffect(() => {
    if (!currentUser) return;

    async function fetchDashboardMetrics() {
      setLoadingStats(true);
      try {
        const articles = await getArticles(false);
        setArticlesCount(articles.length);

        const contribs = await getContributions();
        setContributions(contribs);

        const gallery = await getGalleryImages();
        // Since getGalleryImages merges hardcoded gallery, let's keep only database gallery items for precise admin editing if desired, or all
        setGalleryImages(gallery);

        const users = await fetchUsers();
        setUsersList(users);
      } catch (err) {
        console.error('Error loading admin metrics:', err);
      } finally {
        setLoadingStats(false);
      }
    }
    fetchDashboardMetrics();
  }, [currentUser, refreshTrigger, activeTab]);

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
      if (error) throw error;
      setCurrentUser(user);
      setRefreshTrigger(prev => prev + 1);
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
      setUserRole('customer');
    }
  };

  // Contribution review
  const handleReviewContribution = async (contrib: Contribution, status: 'approved' | 'rejected') => {
    try {
      const { success, error } = await updateContributionStatus(contrib.id, status);
      if (error) throw error;

      if (status === 'approved') {
        // Automatically add approved contribution to the gallery!
        await addGalleryImage(
          contrib.title,
          contrib.imageUrl,
          contrib.description,
          contrib.type === 'photo' ? 'History' : 'Tradition'
        );
        alert('Contribution approved and automatically published to the Digital Gallery!');
      } else {
        alert('Contribution marked as rejected.');
      }
      setRefreshTrigger(prev => prev + 1);
    } catch (err: any) {
      alert(err.message || 'Failed to update submission status.');
    }
  };

  const handleDeleteGalleryItem = async (id: string) => {
    if (!window.confirm('Are you sure you want to unpublish and delete this gallery image?')) return;
    if (!supabase) return;
    
    try {
      const { error } = await supabase.from('gallery').delete().eq('id', id);
      if (error) throw error;
      alert('Gallery asset unpublished successfully.');
      setRefreshTrigger(prev => prev + 1);
    } catch (err: any) {
      alert(err.message || 'Failed to unpublish asset.');
    }
  };

  const handleUpdateUserRole = async (userId: string, targetRole: 'admin' | 'staff' | 'customer') => {
    if (!supabase) return;
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: targetRole, is_admin: targetRole === 'admin' })
        .eq('id', userId);
      if (error) throw error;
      alert('User role updated successfully.');
      setRefreshTrigger(prev => prev + 1);
    } catch (err: any) {
      alert(err.message || 'Failed to update user role.');
    }
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
          <div className="w-20 h-20 bg-heritage-terracotta/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-heritage-terracotta" />
          </div>
          <h1 className="text-3xl font-serif font-black text-heritage-brown mb-2">Heritage Control</h1>
          <p className="text-heritage-brown/60 text-sm font-semibold mb-8">
            Access secure admin publishing & management tools
          </p>

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

          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-heritage-brown/50">Admin Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@bakenyi.org"
                className="w-full px-5 py-3.5 bg-heritage-cream/30 border border-heritage-brown/10 rounded-2xl text-xs font-bold text-heritage-brown outline-none focus:border-heritage-terracotta font-sans"
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
                className="w-full px-5 py-3.5 bg-heritage-cream/30 border border-heritage-brown/10 rounded-2xl text-xs font-bold text-heritage-brown outline-none focus:border-heritage-terracotta font-sans"
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
    <div className="pt-24 min-h-screen bg-heritage-cream text-left">
      
      {/* Admin Branding Strip */}
      <section className="bg-heritage-brown text-white py-12 px-4 border-b border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-heritage-sand">
              <ShieldCheck className="w-5 h-5 text-heritage-terracotta" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">Secure Administrator Interface</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-serif font-black">Platform Preservation Control</h1>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            {/* User credentials identifier */}
            <div className="bg-white/5 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-heritage-terracotta/20 flex items-center justify-center">
                <User className="w-4 h-4 text-heritage-sand" />
              </div>
              <div>
                <p className="text-[8px] font-black uppercase tracking-widest text-heritage-sand leading-none mb-1">
                  Role: <span className="text-white font-bold">{userRole.toUpperCase()}</span>
                </p>
                <p className="text-xs font-bold truncate max-w-[150px] leading-none text-white">{currentUser.email}</p>
              </div>
            </div>

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
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`py-5 border-b-2 font-black uppercase text-xs tracking-widest flex items-center gap-2 cursor-pointer transition-all whitespace-nowrap ${
              activeTab === 'dashboard' 
                ? 'border-heritage-terracotta text-heritage-terracotta' 
                : 'border-transparent text-heritage-brown/50 hover:text-heritage-brown'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('articles')}
            className={`py-5 border-b-2 font-black uppercase text-xs tracking-widest flex items-center gap-2 cursor-pointer transition-all whitespace-nowrap ${
              activeTab === 'articles' 
                ? 'border-heritage-terracotta text-heritage-terracotta' 
                : 'border-transparent text-heritage-brown/50 hover:text-heritage-brown'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Content Publisher</span>
          </button>

          <button
            onClick={() => setActiveTab('contributions')}
            className={`py-5 border-b-2 font-black uppercase text-xs tracking-widest flex items-center gap-2 cursor-pointer transition-all whitespace-nowrap ${
              activeTab === 'contributions' 
                ? 'border-heritage-terracotta text-heritage-terracotta' 
                : 'border-transparent text-heritage-brown/50 hover:text-heritage-brown'
            }`}
          >
            <Inbox className="w-4 h-4" />
            <span>Community Submissions</span>
            {contributions.filter(c => c.status === 'pending').length > 0 && (
              <span className="bg-heritage-terracotta text-white text-[9px] font-black px-2 py-0.5 rounded-full">
                {contributions.filter(c => c.status === 'pending').length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('gallery')}
            className={`py-5 border-b-2 font-black uppercase text-xs tracking-widest flex items-center gap-2 cursor-pointer transition-all whitespace-nowrap ${
              activeTab === 'gallery' 
                ? 'border-heritage-terracotta text-heritage-terracotta' 
                : 'border-transparent text-heritage-brown/50 hover:text-heritage-brown'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Gallery Assets</span>
          </button>

          {userRole === 'admin' && (
            <button
              onClick={() => setActiveTab('users')}
              className={`py-5 border-b-2 font-black uppercase text-xs tracking-widest flex items-center gap-2 cursor-pointer transition-all whitespace-nowrap ${
                activeTab === 'users' 
                  ? 'border-heritage-terracotta text-heritage-terracotta' 
                  : 'border-transparent text-heritage-brown/50 hover:text-heritage-brown'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>User Roles</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('settings')}
            className={`py-5 border-b-2 font-black uppercase text-xs tracking-widest flex items-center gap-2 cursor-pointer transition-all whitespace-nowrap ${
              activeTab === 'settings' 
                ? 'border-heritage-terracotta text-heritage-terracotta' 
                : 'border-transparent text-heritage-brown/50 hover:text-heritage-brown'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>System Config</span>
          </button>
        </div>
      </div>

      {/* Tab Contents Frame */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        
        {/* TAB: DASHBOARD OVERVIEW */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-fade-in">
            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-heritage-brown/5 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-heritage-brown/40">Total Articles</p>
                  <h3 className="text-3xl font-serif font-black text-heritage-brown mt-1">
                    {loadingStats ? <Loader2 className="w-6 h-6 animate-spin text-heritage-terracotta" /> : articlesCount}
                  </h3>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-heritage-terracotta/10 flex items-center justify-center text-heritage-terracotta">
                  <BookOpen className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-heritage-brown/5 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-heritage-brown/40">Pending Vetting</p>
                  <h3 className="text-3xl font-serif font-black text-heritage-brown mt-1">
                    {loadingStats ? (
                      <Loader2 className="w-6 h-6 animate-spin text-heritage-terracotta" />
                    ) : (
                      contributions.filter(c => c.status === 'pending').length
                    )}
                  </h3>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-heritage-olive/10 flex items-center justify-center text-heritage-olive">
                  <Inbox className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-heritage-brown/5 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-heritage-brown/40">Gallery Assets</p>
                  <h3 className="text-3xl font-serif font-black text-heritage-brown mt-1">
                    {loadingStats ? <Loader2 className="w-6 h-6 animate-spin text-heritage-terracotta" /> : galleryImages.length}
                  </h3>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600">
                  <ImageIcon className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-heritage-brown/5 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-heritage-brown/40">Preservationists</p>
                  <h3 className="text-3xl font-serif font-black text-heritage-brown mt-1">
                    {loadingStats ? <Loader2 className="w-6 h-6 animate-spin text-heritage-terracotta" /> : usersList.length}
                  </h3>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                  <Users className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Quick Summary Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Platform Preservation Status */}
              <div className="lg:col-span-2 bg-white rounded-[32px] p-8 border border-heritage-brown/5 shadow-sm space-y-6">
                <div>
                  <h2 className="text-2xl font-serif font-bold text-heritage-brown">Preservation Activity Log</h2>
                  <p className="text-xs text-heritage-brown/50">Historical contributions currently undergoing digitization or community audit.</p>
                </div>

                <div className="divide-y divide-heritage-brown/5">
                  {contributions.slice(0, 4).map(c => (
                    <div key={c.id} className="py-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <img src={c.imageUrl} className="w-12 h-12 rounded-xl object-cover shrink-0 border" alt="" />
                        <div>
                          <h4 className="font-serif font-bold text-heritage-brown leading-tight">{c.title}</h4>
                          <p className="text-[10px] text-heritage-brown/40 font-medium">By {c.userEmail} • {c.type.toUpperCase()}</p>
                        </div>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border shrink-0 ${
                        c.status === 'approved' ? 'bg-heritage-olive/10 text-heritage-olive border-heritage-olive/20' :
                        c.status === 'rejected' ? 'bg-red-50 text-red-500 border-red-500/20' :
                        'bg-heritage-terracotta/10 text-heritage-terracotta border-heritage-terracotta/20'
                      }`}>
                        {c.status}
                      </span>
                    </div>
                  ))}
                  {contributions.length === 0 && (
                    <div className="py-12 text-center text-heritage-brown/40 text-xs font-semibold">
                      No community activity logged yet.
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Platform Information Panel */}
              <div className="bg-heritage-olive text-white rounded-[32px] p-8 space-y-6 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                    <Heart className="w-6 h-6 text-heritage-sand" />
                  </div>
                  <h3 className="text-2xl font-serif font-bold text-white">Preserving Bakenyi Heritage</h3>
                  <p className="text-xs text-white/80 leading-relaxed font-medium">
                    This administrative interface controls content published to the Bakenye platform. Approve community submissions to dynamically update our Digital Gallery and publish custom-written educational histories.
                  </p>
                </div>
                <div className="pt-6 border-t border-white/10 text-[10px] font-mono text-white/60">
                  Bakenye Platform Server • Active
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: CONTENT PUBLISHER */}
        {activeTab === 'articles' && (
          <div className="animate-fade-in">
            <ArticlesManager />
          </div>
        )}

        {/* TAB: COMMUNITY SUBMISSIONS */}
        {activeTab === 'contributions' && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-2xl font-serif font-bold text-heritage-brown">Vetting Queue</h2>
              <p className="text-xs text-heritage-brown/50">Moderate and approve cultural items submitted by public contributors.</p>
            </div>

            {contributions.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-[32px] border border-heritage-brown/5 shadow-sm p-8">
                <Inbox className="w-12 h-12 text-heritage-brown/20 mx-auto mb-4" />
                <p className="text-heritage-brown font-black text-sm">Vetting queue is empty</p>
                <p className="text-heritage-brown/40 text-xs mt-1">Community submissions will appear here for audit before public archiving.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {contributions.map((item) => (
                  <div 
                    key={item.id}
                    className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-heritage-brown/5 flex flex-col h-full"
                  >
                    <div className="aspect-video relative overflow-hidden bg-heritage-cream/50">
                      <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
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

                    <div className="p-6 flex-grow flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-3 text-[9px] font-black uppercase tracking-widest text-heritage-brown/40">
                          <span>{item.type.toUpperCase()}</span>
                          <span>{item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Recent'}</span>
                        </div>
                        <h3 className="text-lg font-serif font-bold text-heritage-brown mb-2">{item.title}</h3>
                        <p className="text-xs text-heritage-brown/60 leading-relaxed mb-6 italic">
                          "{item.description}"
                        </p>
                      </div>
                      
                      <div className="space-y-4 pt-4 border-t border-heritage-brown/5 mt-auto">
                        <p className="text-[10px] font-mono text-heritage-brown/40 truncate">Sender: {item.userEmail}</p>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleReviewContribution(item, 'approved')}
                            disabled={item.status === 'approved'}
                            className="flex-grow flex items-center justify-center space-x-2 py-2.5 bg-heritage-olive/15 text-heritage-olive hover:bg-heritage-olive hover:text-white rounded-xl transition-all text-[10px] font-black uppercase tracking-widest disabled:opacity-30 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>
                          <button 
                            onClick={() => handleReviewContribution(item, 'rejected')}
                            disabled={item.status === 'rejected'}
                            className="flex-grow flex items-center justify-center space-x-2 py-2.5 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all text-[10px] font-black uppercase tracking-widest disabled:opacity-30 cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Reject</span>
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

        {/* TAB: GALLERY ASSETS */}
        {activeTab === 'gallery' && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-2xl font-serif font-bold text-heritage-brown">Archive Assets</h2>
              <p className="text-xs text-heritage-brown/50">Manage images displayed in the public Digital Gallery.</p>
            </div>

            {galleryImages.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-[32px] border border-heritage-brown/5 shadow-sm p-8">
                <ImageIcon className="w-12 h-12 text-heritage-brown/20 mx-auto mb-4" />
                <p className="text-heritage-brown font-black text-sm">Digital gallery is empty</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {galleryImages.map((img) => (
                  <div key={img.id} className="bg-white rounded-[24px] overflow-hidden shadow-sm border border-heritage-brown/5 flex flex-col">
                    <div className="aspect-video relative overflow-hidden bg-heritage-cream/50">
                      <img src={img.imageUrl} alt={img.title} className="w-full h-full object-cover" />
                      <button
                        onClick={() => handleDeleteGalleryItem(img.id)}
                        className="absolute top-3 right-3 p-2 bg-red-50 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-all cursor-pointer border border-red-100"
                        title="Delete Gallery Item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="p-4">
                      <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest bg-heritage-olive/10 text-heritage-olive">
                        {img.category}
                      </span>
                      <h4 className="font-serif font-bold text-heritage-brown truncate mt-2">{img.title}</h4>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: USER ROLES */}
        {activeTab === 'users' && userRole === 'admin' && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-2xl font-serif font-bold text-heritage-brown">User Permission Control</h2>
              <p className="text-xs text-heritage-brown/50">Inspect registered cultural contributors and delegate administrative permissions.</p>
            </div>

            <div className="bg-white rounded-[32px] overflow-hidden border border-heritage-brown/5 shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-heritage-cream/40 border-b border-heritage-brown/10">
                      <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-heritage-brown/50">Email</th>
                      <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-heritage-brown/50">Role</th>
                      <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-heritage-brown/50">Created At</th>
                      <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-heritage-brown/50 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-heritage-brown/5">
                    {usersList.map((usr) => (
                      <tr key={usr.id} className="hover:bg-heritage-cream/10">
                        <td className="px-6 py-4 font-semibold text-sm text-heritage-brown">{usr.email}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                            usr.role === 'admin' ? 'bg-red-50 text-red-500 border-red-500/20' :
                            usr.role === 'staff' ? 'bg-indigo-50 text-indigo-500 border-indigo-500/20' :
                            'bg-heritage-olive/10 text-heritage-olive border-heritage-olive/20'
                          }`}>
                            {usr.role || 'customer'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-heritage-brown/50 font-medium">
                          {usr.created_at ? new Date(usr.created_at).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-right shrink-0">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleUpdateUserRole(usr.id, 'admin')}
                              disabled={usr.role === 'admin'}
                              className="px-3 py-1.5 bg-red-50 hover:bg-red-500 text-red-600 hover:text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-30 cursor-pointer"
                            >
                              Make Admin
                            </button>
                            <button
                              onClick={() => handleUpdateUserRole(usr.id, 'customer')}
                              disabled={usr.role === 'customer' || !usr.role}
                              className="px-3 py-1.5 bg-heritage-olive/10 hover:bg-heritage-olive text-heritage-olive hover:text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-30 cursor-pointer"
                            >
                              Revoke Admin
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB: SYSTEM CONFIG */}
        {activeTab === 'settings' && (
          <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
            <div className="bg-white border border-heritage-brown/10 rounded-[32px] p-8 shadow-sm space-y-6">
              <div>
                <h2 className="text-2xl font-serif font-bold text-heritage-brown">System Integration Status</h2>
                <p className="text-sm text-heritage-brown/50">Your Bakenyi platform is configured with secure row-level security policy layers.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <div className="p-5 bg-heritage-cream/30 rounded-2xl border border-heritage-brown/5">
                  <span className="text-[10px] font-black text-heritage-terracotta uppercase tracking-wider">Active Database Schema</span>
                  <p className="text-lg font-serif font-bold text-heritage-brown mt-1">Supabase PostgreSQL</p>
                  <p className="text-xs text-heritage-brown/60 leading-relaxed mt-1 font-medium">
                    All updates are saved securely inside database tables including profiles, articles, gallery, and contributions.
                  </p>
                </div>

                <div className="p-5 bg-heritage-cream/30 rounded-2xl border border-heritage-brown/5">
                  <span className="text-[10px] font-black text-heritage-terracotta uppercase tracking-wider">Authentication Layer</span>
                  <p className="text-lg font-serif font-bold text-heritage-brown mt-1">Supabase GoAuth / JWT</p>
                  <p className="text-xs text-heritage-brown/60 leading-relaxed mt-1 font-medium">
                    Protects client-side queries, monitors contributor identity, and structures platform-level roles.
                  </p>
                </div>
              </div>

              <div className="pt-6 border-t border-heritage-brown/5">
                <h4 className="text-xs font-black uppercase tracking-widest text-heritage-brown/50 mb-4 flex items-center gap-1.5">
                  <FileCode className="w-4 h-4 text-heritage-terracotta" />
                  <span>Row Level Security (RLS) Configuration Schema</span>
                </h4>
                
                <div className="bg-slate-950 rounded-2xl p-6 overflow-x-auto relative group font-mono text-xs text-slate-300 text-left">
                  <pre className="leading-relaxed">
{`-- Articles security policies
alter table public.articles enable row level security;

create policy "Allow public read access to published articles" 
  on public.articles for select using (status = 'published');

create policy "Allow full access to authenticated admins" 
  on public.articles for all to authenticated using (true);`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
