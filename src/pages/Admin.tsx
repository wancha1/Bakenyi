import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Lock, ShieldCheck, Loader2, User, LogOut, AlertTriangle, 
  Check, Copy, Sparkles, BookOpen, Film, Image as ImageIcon, 
  Tag, Users, LayoutDashboard, Key, ShieldAlert, CheckCircle2,
  Mail, Settings, ChevronRight
} from 'lucide-react';
import { auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from '../lib/firebase';
import { loginWithGoogle } from '../appwrite/auth';
import { 
  getUserProfile, createUserProfile, UserProfile, UserRole 
} from '../lib/firebaseContentService';

// Import our newly created managers
import NewsBlogManager from '../components/admin/NewsBlogManager';
import VlogsManager from '../components/admin/VlogsManager';
import GalleryManager from '../components/admin/GalleryManager';
import CategoryManager from '../components/admin/CategoryManager';
import UserManager from '../components/admin/UserManager';

export default function Admin() {
  // Navigation / Tabs
  const [activeTab, setActiveTab] = useState<'overview' | 'news' | 'blogs' | 'vlogs' | 'gallery' | 'categories' | 'users'>('overview');
  
  // Authentication State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [authError, setAuthError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Monitor auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          // Attempt to fetch profile from Firestore
          let profile = await getUserProfile(user.uid);
          if (!profile) {
            // Self-register profile if none exists
            profile = await createUserProfile(
              user.uid, 
              user.email || '', 
              user.displayName || displayName || user.email?.split('@')[0] || 'Contributor'
            );
          }
          setUserProfile(profile);
        } catch (err) {
          console.error("Failed to resolve profile from Firestore, using fallback role", err);
          // Set safety fallback
          setUserProfile({
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || 'Contributor',
            role: user.email === 'wanchaaaron@gmail.com' ? 'super_admin' : 'reporter',
            status: 'active',
            createdAt: new Date().toISOString()
          });
        }
      } else {
        setUserProfile(null);
      }
      setAuthChecking(false);
    });

    return () => unsubscribe();
  }, [displayName]);

  const handleGoogleLogin = async () => {
    setLoginLoading(true);
    setAuthError('');
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setAuthError(err.message || 'Google authentication failed.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setAuthError('Please fill in all credentials.');
      return;
    }
    setLoginLoading(true);
    setAuthError('');
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setAuthError(err.message || 'Email authorization failed.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setUserProfile(null);
      setActiveTab('overview');
    } catch (err) {
      console.error('Failed to log out', err);
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
  // VIEW: AUTHENTICATION LOGIN / SIGNUP FORM
  // ==========================================
  if (!currentUser || !userProfile) {
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

          {/* Social Sign-in Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={loginLoading}
            className="w-full flex items-center justify-center space-x-3 py-3.5 bg-white border-2 border-heritage-brown/10 hover:border-heritage-terracotta text-heritage-brown font-bold rounded-2xl text-xs uppercase tracking-wider transition-all cursor-pointer mb-6 shadow-sm active:scale-95"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="flex items-center my-6">
            <div className="flex-grow border-t border-heritage-brown/10"></div>
            <span className="mx-4 text-[10px] font-black uppercase tracking-wider text-heritage-brown/40">Or Use Email Credentials</span>
            <div className="flex-grow border-t border-heritage-brown/10"></div>
          </div>

          {/* Email Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4 text-left">
            {isSignUp && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-heritage-brown/50">Full Name</label>
                <input 
                  type="text" 
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Aaron Wancha"
                  className="w-full px-5 py-3 bg-heritage-cream/30 border border-heritage-brown/10 rounded-2xl text-xs font-bold text-heritage-brown outline-none focus:border-heritage-terracotta"
                  required={isSignUp}
                />
              </div>
            )}

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
              className="w-full flex items-center justify-center space-x-2 py-4 bg-heritage-terracotta hover:bg-heritage-brown text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-heritage-terracotta/20 transition-all cursor-pointer active:scale-95"
            >
              {loginLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>{isSignUp ? 'Register Account' : 'Authenticate Session'}</span>
                  <ShieldCheck className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Toggle login vs signup */}
          <div className="text-center mt-6">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-xs font-bold text-heritage-terracotta hover:text-heritage-brown underline"
            >
              {isSignUp ? 'Already registered? Log In here' : "First time? Self-register an account"}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Determine user clearance string
  const roleLabels: Record<UserRole, string> = {
    super_admin: 'Super Admin',
    admin: 'Administrator',
    editor: 'Content Editor',
    reporter: 'Field Reporter'
  };

  const currentRoleLabel = roleLabels[userProfile.role] || 'Contributor';

  // ==========================================
  // VIEW: MAIN SECURE CMS DASHBOARD
  // ==========================================
  return (
    <div className="pt-24 min-h-screen bg-heritage-cream">
      
      {/* Admin Header Section */}
      <section className="bg-heritage-brown text-white py-12 px-4 border-b border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-heritage-sand">
              <ShieldCheck className="w-5 h-5 text-heritage-terracotta" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">Bakenyi Heritage CMS Portal</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-serif font-black">Archive Management</h1>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            {/* User credentials identifier */}
            <div className="bg-white/5 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-heritage-terracotta text-white flex items-center justify-center font-black">
                {userProfile.displayName ? userProfile.displayName.slice(0, 2).toUpperCase() : 'C'}
              </div>
              <div className="text-left">
                <p className="text-[8px] font-black uppercase tracking-widest text-heritage-sand flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-heritage-terracotta" />
                  <span>{currentRoleLabel}</span>
                </p>
                <p className="text-xs font-black truncate max-w-[150px]">{userProfile.displayName}</p>
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="p-3.5 bg-white/5 hover:bg-red-500 hover:text-white text-white rounded-2xl border border-white/10 transition-all cursor-pointer active:scale-90"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Tabs Navigation Rail */}
      <div className="bg-white border-b border-heritage-brown/10">
        <div className="max-w-7xl mx-auto px-4 flex gap-6 overflow-x-auto scrollbar-none">
          
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-5 border-b-2 font-black uppercase text-xs tracking-widest flex items-center gap-2 cursor-pointer transition-all whitespace-nowrap ${
              activeTab === 'overview' ? 'border-heritage-terracotta text-heritage-terracotta' : 'border-transparent text-heritage-brown/50 hover:text-heritage-brown'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('news')}
            className={`py-5 border-b-2 font-black uppercase text-xs tracking-widest flex items-center gap-2 cursor-pointer transition-all whitespace-nowrap ${
              activeTab === 'news' ? 'border-heritage-terracotta text-heritage-terracotta' : 'border-transparent text-heritage-brown/50 hover:text-heritage-brown'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Kyoga News</span>
          </button>

          <button
            onClick={() => setActiveTab('blogs')}
            className={`py-5 border-b-2 font-black uppercase text-xs tracking-widest flex items-center gap-2 cursor-pointer transition-all whitespace-nowrap ${
              activeTab === 'blogs' ? 'border-heritage-terracotta text-heritage-terracotta' : 'border-transparent text-heritage-brown/50 hover:text-heritage-brown'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Culture Blog</span>
          </button>

          <button
            onClick={() => setActiveTab('vlogs')}
            className={`py-5 border-b-2 font-black uppercase text-xs tracking-widest flex items-center gap-2 cursor-pointer transition-all whitespace-nowrap ${
              activeTab === 'vlogs' ? 'border-heritage-terracotta text-heritage-terracotta' : 'border-transparent text-heritage-brown/50 hover:text-heritage-brown'
            }`}
          >
            <Film className="w-4 h-4" />
            <span>Video Logs</span>
          </button>

          <button
            onClick={() => setActiveTab('gallery')}
            className={`py-5 border-b-2 font-black uppercase text-xs tracking-widest flex items-center gap-2 cursor-pointer transition-all whitespace-nowrap ${
              activeTab === 'gallery' ? 'border-heritage-terracotta text-heritage-terracotta' : 'border-transparent text-heritage-brown/50 hover:text-heritage-brown'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Photo Galleries</span>
          </button>

          <button
            onClick={() => setActiveTab('categories')}
            className={`py-5 border-b-2 font-black uppercase text-xs tracking-widest flex items-center gap-2 cursor-pointer transition-all whitespace-nowrap ${
              activeTab === 'categories' ? 'border-heritage-terracotta text-heritage-terracotta' : 'border-transparent text-heritage-brown/50 hover:text-heritage-brown'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>Taxonomies</span>
          </button>

          {userProfile.role === 'super_admin' && (
            <button
              onClick={() => setActiveTab('users')}
              className={`py-5 border-b-2 font-black uppercase text-xs tracking-widest flex items-center gap-2 cursor-pointer transition-all whitespace-nowrap ${
                activeTab === 'users' ? 'border-heritage-terracotta text-heritage-terracotta' : 'border-transparent text-heritage-brown/50 hover:text-heritage-brown'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>User Roles</span>
            </button>
          )}

        </div>
      </div>

      {/* Main Tab View Contents */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-fade-in">
            {/* Quick Greeting */}
            <div className="bg-white border border-heritage-brown/10 rounded-[32px] p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm">
              <div className="space-y-1">
                <h2 className="text-2xl font-serif font-bold text-heritage-brown">Welcome, {userProfile.displayName}!</h2>
                <p className="text-xs text-heritage-brown/50 font-medium">
                  Your account has <span className="text-heritage-terracotta font-black">{currentRoleLabel}</span> permissions.
                </p>
              </div>
              <div className="flex gap-2">
                <span className="px-4 py-2 rounded-xl bg-heritage-cream text-heritage-brown text-xs font-bold font-mono">
                  UID: {currentUser.uid.slice(0, 10)}...
                </span>
              </div>
            </div>

            {/* Quick Analytics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              <div onClick={() => setActiveTab('news')} className="bg-white p-6 rounded-2xl border border-heritage-brown/5 hover:border-heritage-terracotta/20 transition-all cursor-pointer shadow-sm space-y-3">
                <div className="w-10 h-10 bg-heritage-terracotta/10 text-heritage-terracotta rounded-full flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-heritage-brown/40">News Dispatches</h4>
                  <p className="text-2xl font-serif font-black text-heritage-brown">Active Collection</p>
                </div>
              </div>

              <div onClick={() => setActiveTab('blogs')} className="bg-white p-6 rounded-2xl border border-heritage-brown/5 hover:border-heritage-terracotta/20 transition-all cursor-pointer shadow-sm space-y-3">
                <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-heritage-brown/40">Blog Posts</h4>
                  <p className="text-2xl font-serif font-black text-heritage-brown">Active Collection</p>
                </div>
              </div>

              <div onClick={() => setActiveTab('vlogs')} className="bg-white p-6 rounded-2xl border border-heritage-brown/5 hover:border-heritage-terracotta/20 transition-all cursor-pointer shadow-sm space-y-3">
                <div className="w-10 h-10 bg-red-50 text-red-600 rounded-full flex items-center justify-center">
                  <Film className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-heritage-brown/40">YouTube Vlogs</h4>
                  <p className="text-2xl font-serif font-black text-heritage-brown">Active Collection</p>
                </div>
              </div>

              <div onClick={() => setActiveTab('gallery')} className="bg-white p-6 rounded-2xl border border-heritage-brown/5 hover:border-heritage-terracotta/20 transition-all cursor-pointer shadow-sm space-y-3">
                <div className="w-10 h-10 bg-heritage-olive/10 text-heritage-olive rounded-full flex items-center justify-center">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-heritage-brown/40">Gallery Albums</h4>
                  <p className="text-2xl font-serif font-black text-heritage-brown">Active Collection</p>
                </div>
              </div>

            </div>

            {/* Role Gating Matrix Instructions */}
            <div className="bg-white border border-heritage-brown/10 rounded-[32px] p-6 md:p-8 shadow-sm space-y-6">
              <div>
                <h3 className="text-lg font-serif font-bold text-heritage-brown">Operational Permissions Matrix</h3>
                <p className="text-xs text-heritage-brown/50 font-medium">Verify your administrative clearance boundaries</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-xs text-heritage-brown">
                
                <div className={`p-5 rounded-2xl border space-y-2 ${userProfile.role === 'super_admin' ? 'border-purple-300 bg-purple-50/25' : 'border-heritage-brown/10'}`}>
                  <h4 className="font-black text-purple-700 uppercase flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Super Admin</span>
                  </h4>
                  <p className="text-heritage-brown/60 leading-relaxed font-medium">
                    Complete authorization keys. Manage users, update roles, create categories, and publish/delete all historical archives.
                  </p>
                </div>

                <div className={`p-5 rounded-2xl border space-y-2 ${userProfile.role === 'admin' ? 'border-heritage-terracotta/30 bg-heritage-terracotta/5' : 'border-heritage-brown/10'}`}>
                  <h4 className="font-black text-heritage-terracotta uppercase flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Admin</span>
                  </h4>
                  <p className="text-heritage-brown/60 leading-relaxed font-medium">
                    Publish authority. Write, edit, publish and delete articles. Manage categories. Create video records and albums.
                  </p>
                </div>

                <div className={`p-5 rounded-2xl border space-y-2 ${userProfile.role === 'editor' ? 'border-heritage-olive/30 bg-heritage-olive/5' : 'border-heritage-brown/10'}`}>
                  <h4 className="font-black text-heritage-olive uppercase flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Editor</span>
                  </h4>
                  <p className="text-heritage-brown/60 leading-relaxed font-medium">
                    Review submissions. Write and edit dispatches, submit for Review queue. Upload media files. Cannot publish directly.
                  </p>
                </div>

                <div className={`p-5 rounded-2xl border space-y-2 ${userProfile.role === 'reporter' ? 'border-amber-300 bg-amber-50/20' : 'border-heritage-brown/10'}`}>
                  <h4 className="font-black text-amber-600 uppercase flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Reporter</span>
                  </h4>
                  <p className="text-heritage-brown/60 leading-relaxed font-medium">
                    Draft contribution. Create blog draft records, upload initial photos. Cannot edit other people's drafts or request reviews.
                  </p>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* TAB NEWS: NEWS MANAGER */}
        {activeTab === 'news' && (
          <div className="animate-fade-in">
            <NewsBlogManager type="news" userRole={userProfile.role} />
          </div>
        )}

        {/* TAB BLOGS: BLOGS MANAGER */}
        {activeTab === 'blogs' && (
          <div className="animate-fade-in">
            <NewsBlogManager type="blogs" userRole={userProfile.role} />
          </div>
        )}

        {/* TAB VLOGS: VLOGS MANAGER */}
        {activeTab === 'vlogs' && (
          <div className="animate-fade-in">
            <VlogsManager userRole={userProfile.role} />
          </div>
        )}

        {/* TAB GALLERY: GALLERY MANAGER */}
        {activeTab === 'gallery' && (
          <div className="animate-fade-in">
            <GalleryManager userRole={userProfile.role} />
          </div>
        )}

        {/* TAB CATEGORIES: CATEGORY MANAGER */}
        {activeTab === 'categories' && (
          <div className="animate-fade-in">
            <CategoryManager userRole={userProfile.role} />
          </div>
        )}

        {/* TAB USERS: USER ROLES MANAGER */}
        {activeTab === 'users' && userProfile.role === 'super_admin' && (
          <div className="animate-fade-in">
            <UserManager userRole={userProfile.role} />
          </div>
        )}

      </main>

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
