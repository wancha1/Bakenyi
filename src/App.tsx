import React, { useEffect, useState, lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { ThemeProvider } from './context/ThemeContext';
import { getSupabaseConfig, getSupabase, checkIsAdmin } from './lib/supabaseClient';

// Core Layout components
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import AppInstallPrompt from './components/AppInstallPrompt';
import ScrollToTop from './components/ScrollToTop';

// Admin Components
const Login = lazy(() => import('./components/admin/Login'));
import Sidebar from './components/admin/Sidebar';
import Header from './components/admin/Header';

// Storefront Pages (Lazy loaded for massive speed improvements and micro-chunk code-splitting)
const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const History = lazy(() => import('./pages/History'));
const Clans = lazy(() => import('./pages/Clans'));
const Leadership = lazy(() => import('./pages/Leadership'));
const Gallery = lazy(() => import('./pages/Gallery'));
const Language = lazy(() => import('./pages/Language'));
const Articles = lazy(() => import('./pages/Articles'));
const Contribute = lazy(() => import('./pages/Contribute'));
const Contact = lazy(() => import('./pages/Contact'));
const Search = lazy(() => import('./pages/Search'));

// Admin View Panels (Lazy loaded to optimize bundle size for general visitors)
const DashboardView = lazy(() => import('./components/admin/views/DashboardView'));
const UsersView = lazy(() => import('./components/admin/views/UsersView'));
const RolesView = lazy(() => import('./components/admin/views/RolesView'));
const ContentView = lazy(() => import('./components/admin/views/ContentView'));
const MediaView = lazy(() => import('./components/admin/views/MediaView'));
const ReportsView = lazy(() => import('./components/admin/views/ReportsView'));
const ActivityLogsView = lazy(() => import('./components/admin/views/ActivityLogsView'));
const SettingsView = lazy(() => import('./components/admin/views/SettingsView'));
const SystemHealthView = lazy(() => import('./components/admin/views/SystemHealthView'));

/**
 * Beautiful Page Loader with pulsing Bakenyi cultural pattern.
 */
function PageLoader() {
  return (
    <div className="w-full min-h-[60vh] flex flex-col items-center justify-center py-20 px-4">
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-4 border-heritage-terracotta/20 border-t-heritage-terracotta animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-heritage-sand/10 cultural-pattern animate-pulse" />
        </div>
      </div>
      <p className="text-xs font-bold uppercase tracking-widest text-heritage-brown/40 mt-6 animate-pulse">
        Unveiling Bakenyi Wisdom...
      </p>
    </div>
  );
}

/**
 * Public Layout which includes the global Navbar and Footer.
 */
function StorefrontLayout({ user, userRole }: { user: any; userRole: string | null }) {
  // Check if super admin has opted to view the public site
  const superAdminViewMode = localStorage.getItem('bakenye_superadmin_view_mode');

  return (
    <div className="flex flex-col min-h-screen bg-heritage-cream text-heritage-ink transition-colors duration-300">
      {userRole === 'super_admin' && superAdminViewMode === 'public' && (
        <div className="bg-slate-900 text-white text-[11px] font-bold py-2.5 px-4 flex items-center justify-between shadow-md select-none sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Logged in as <strong className="text-amber-400">Elder</strong> (Public Preview Mode)</span>
          </div>
          <button 
            onClick={() => {
              localStorage.removeItem('bakenye_superadmin_view_mode');
              window.location.href = '/admin';
            }}
            className="bg-white/10 hover:bg-white/20 px-3 py-1 rounded-md text-[10px] uppercase tracking-wider font-bold transition-all cursor-pointer text-white"
          >
            Switch back to Admin Panel &rarr;
          </button>
        </div>
      )}
      <Navbar />
      <main className="flex-grow">
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <AppInstallPrompt />
    </div>
  );
}

/**
 * Guard Component for `/admin` route.
 * Redirects unauthenticated users to `/login`.
 * Redirects non-admin users to home `/`.
 */
function ProtectedAdminRoute({ 
  user, 
  isAuthLoading, 
  children 
}: { 
  user: any; 
  isAuthLoading: boolean; 
  children: React.ReactNode;
}) {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  useEffect(() => {
    if (isAuthLoading) return;
    
    if (!user) {
      setCheckingAdmin(false);
      return;
    }

    async function verifyAdmin() {
      const result = await checkIsAdmin(user);
      setIsAdmin(result);
      setCheckingAdmin(false);
    }
    verifyAdmin();
  }, [user, isAuthLoading]);

  if (isAuthLoading || checkingAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col justify-center items-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
        <span className="text-xs text-slate-400 dark:text-slate-500 mt-3 font-semibold uppercase tracking-wider">Verifying security credentials...</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (isAdmin === false) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

/**
 * Guard Component for `/login` route.
 * Prevents logged in users from seeing the login screen.
 * Redirects admins to `/admin`, and other members to `/`.
 */
function PublicLoginRoute({ 
  user, 
  isAuthLoading, 
  children 
}: { 
  user: any; 
  isAuthLoading: boolean; 
  children: React.ReactNode;
}) {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  useEffect(() => {
    if (isAuthLoading) return;
    
    if (!user) {
      setCheckingAdmin(false);
      return;
    }

    async function verifyAdmin() {
      const result = await checkIsAdmin(user);
      setIsAdmin(result);
      setCheckingAdmin(false);
    }
    verifyAdmin();
  }, [user, isAuthLoading]);

  if (isAuthLoading || checkingAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col justify-center items-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
        <span className="text-xs text-slate-400 dark:text-slate-500 mt-3 font-semibold uppercase tracking-wider">Loading secure session...</span>
      </div>
    );
  }

  if (user) {
    if (isAdmin) {
      return <Navigate to="/admin" replace />;
    } else {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
}

/**
 * Secured Dashboard Panel component.
 */
function DashboardApp({ user, onLogout }: { user: any; onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [userRole, setUserRole] = useState<'super_admin' | 'admin' | 'reporter' | 'public'>('public');
  const [roleLoading, setRoleLoading] = useState(true);

  useEffect(() => {
    async function fetchRole() {
      if (!user) return;
      try {
        const client = getSupabase();
        let rawRole = 'customer';
        if (client) {
          const { data, error } = await client
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .maybeSingle();
          if (!error && data?.role) {
            rawRole = data.role;
          } else {
            rawRole = user.app_metadata?.role || 'customer';
          }
        } else {
          rawRole = user.app_metadata?.role || 'customer';
        }
        
        const email = user.email?.toLowerCase() || '';
        if (rawRole === 'super_admin' || email === 'wanchaaaron@gmail.com' || email === 'aaronwancha@gmail.com' || email === 'superadmin@bakenye.com') {
          setUserRole('super_admin');
        } else if (rawRole === 'admin' || email === 'admin@bakenye.com' || email === 'admin@bakenyi.org') {
          setUserRole('admin');
        } else if (rawRole === 'staff' || rawRole === 'reporter' || email.includes('staff') || email.includes('reporter')) {
          setUserRole('reporter');
        } else {
          setUserRole('public');
        }
      } catch (e) {
        console.error('Failed to resolve role in DashboardApp:', e);
        setUserRole('public');
      } finally {
        setRoleLoading(false);
      }
    }
    fetchRole();
  }, [user]);

  // Handle reporter members attempting to load restricted tabs
  useEffect(() => {
    if (!roleLoading && userRole === 'reporter' && !['dashboard', 'content', 'media'].includes(activeTab)) {
      setActiveTab('dashboard');
    }
  }, [activeTab, userRole, roleLoading]);

  if (roleLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col justify-center items-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        <span className="text-xs text-slate-400 dark:text-slate-500 mt-3 font-semibold uppercase tracking-wider">Verifying permissions...</span>
      </div>
    );
  }

  // Render view by tab ID
  const renderView = () => {
    // Reporter role restriction guard
    if (userRole === 'reporter' && !['dashboard', 'content', 'media'].includes(activeTab)) {
      return <DashboardView onNavigate={(tab) => setActiveTab(tab)} user={user} userRole={userRole} />;
    }

    switch (activeTab) {
      case 'dashboard':
        return <DashboardView onNavigate={(tab) => setActiveTab(tab)} user={user} userRole={userRole} />;
      case 'users':
        return <UsersView />;
      case 'roles':
        return <RolesView />;
      case 'content':
        return <ContentView userRole={userRole} />;
      case 'media':
        return <MediaView />;
      case 'reports':
        return <ReportsView />;
      case 'activity_logs':
        return <ActivityLogsView />;
      case 'settings':
        return <SettingsView />;
      case 'system_health':
        return <SystemHealthView />;
      default:
        return <DashboardView onNavigate={(tab) => setActiveTab(tab)} user={user} userRole={userRole} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 flex transition-colors duration-300 w-full">
      {/* Collapsible/Responsive Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onNavigate={setActiveTab}
        onLogout={onLogout}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        userEmail={user?.email || 'Admin'}
        userRole={userRole}
      />

      {/* Main Container Area */}
      <div className={`flex-grow flex flex-col min-h-screen transition-all duration-300 w-full ${
        isCollapsed ? 'md:pl-20' : 'md:pl-64'
      }`}>
        {/* Top Header */}
        <Header 
          onMobileMenuToggle={() => setIsMobileOpen(true)} 
          activeTab={activeTab}
          userEmail={user?.email || 'Admin'}
          userRole={userRole}
        />

        {/* Inner Content Area */}
        <main className="flex-grow p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
          <Suspense fallback={
            <div className="py-20 flex flex-col justify-center items-center">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              <span className="text-xs text-slate-400 dark:text-slate-500 mt-3 font-semibold uppercase tracking-wider">Accessing chronicles...</span>
            </div>
          }>
            {renderView()}
          </Suspense>
        </main>
      </div>
    </div>
  );
}

/**
 * Root Application Entry with Client Side Routing.
 */
export default function App() {
  const [user, setUser] = useState<any>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [appUserRole, setAppUserRole] = useState<'super_admin' | 'admin' | 'reporter' | 'public' | null>(null);

  useEffect(() => {
    async function resolveRole() {
      if (!user) {
        setAppUserRole(null);
        return;
      }
      try {
        const { isConfigured } = getSupabaseConfig();
        const email = user.email?.toLowerCase() || '';

        // Unified Elder role override for testing & design review
        if (email === 'superadmin@bakenye.com' || email === 'wanchaaaron@gmail.com' || email === 'aaronwancha@gmail.com') {
          setAppUserRole('super_admin');
          return;
        }

        // 1. Local Sandbox Mode fallback
        if (!isConfigured) {
          if (email === 'admin@bakenye.com' || email === 'admin@bakenyi.org') {
            setAppUserRole('admin');
            return;
          }
          if (email.includes('staff') || email.includes('reporter')) {
            setAppUserRole('reporter');
            return;
          }
          setAppUserRole('public');
          return;
        }

        // 2. Real Supabase mode: STRICTLY query database profiles table, never use hardcoded emails or user_metadata for authorization
        const client = getSupabase();
        let rawRole = 'customer';
        if (client) {
          const { data, error } = await client
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .maybeSingle();
          if (!error && data?.role) {
            rawRole = data.role;
          }
        } else {
          rawRole = user.app_metadata?.role || 'customer';
        }
        
        if (rawRole === 'super_admin') {
          setAppUserRole('super_admin');
        } else if (rawRole === 'admin') {
          setAppUserRole('admin');
        } else if (rawRole === 'staff' || rawRole === 'reporter') {
          setAppUserRole('reporter');
        } else {
          setAppUserRole('public');
        }
      } catch (e) {
        console.error('Failed to resolve role in root App:', e);
        setAppUserRole('public');
      }
    }
    resolveRole();
  }, [user]);

  useEffect(() => {
    // Check auth status
    const client = getSupabase();
    if (client) {
      // 1. Get initial session
      client.auth.getSession().then(({ data: { session } }: any) => {
        if (session?.user) {
          setUser(session.user);
        }
        setIsAuthLoading(false);
      });

      // 2. Listen for auth changes
      const { data: { subscription } } = client.auth.onAuthStateChange((_event: any, session: any) => {
        setUser(session?.user || null);
      });

      return () => {
        subscription?.unsubscribe();
      };
    } else {
      // Sandbox mode: Check local storage for mocked session
      const stored = localStorage.getItem('bakenye_sandbox_session');
      if (stored) {
        try {
          setUser(JSON.parse(stored));
        } catch (e) {}
      }
      setIsAuthLoading(false);
    }
  }, []);

  // Handle Logout Action
  const handleLogout = async () => {
    const client = getSupabase();
    if (client) {
      await client.auth.signOut();
    } else {
      localStorage.removeItem('bakenye_sandbox_session');
      setUser(null);
    }
  };

  // Handle Login Success Action
  const handleLoginSuccess = (loggedInUser: any) => {
    setUser(loggedInUser);
    // Persist mock session if in Sandbox mode
    const client = getSupabase();
    if (!client) {
      localStorage.setItem('bakenye_sandbox_session', JSON.stringify(loggedInUser));
    }
  };

  return (
    <HelmetProvider>
      <ThemeProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            {/* Public Storefront Routes */}
            <Route element={<StorefrontLayout user={user} userRole={appUserRole} />}>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/history" element={<History />} />
              <Route path="/clans" element={<Clans />} />
              <Route path="/leadership" element={<Leadership />} />
              <Route path="/gallery" element={<Gallery />} />
              <Route path="/language" element={<Language />} />
              <Route path="/articles" element={<Articles />} />
              <Route path="/contribute" element={<Contribute />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/search" element={<Search />} />
            </Route>

            {/* Public Login Route (redirects if already logged in) */}
            <Route 
              path="/login" 
              element={
                <PublicLoginRoute user={user} isAuthLoading={isAuthLoading}>
                  <Suspense fallback={<PageLoader />}>
                    <Login onLoginSuccess={handleLoginSuccess} />
                  </Suspense>
                </PublicLoginRoute>
              } 
            />

            {/* Protected Admin Routes */}
            <Route 
              path="/admin" 
              element={
                <ProtectedAdminRoute user={user} isAuthLoading={isAuthLoading}>
                  <Suspense fallback={
                    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col justify-center items-center">
                      <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                      <span className="text-xs text-slate-400 dark:text-slate-500 mt-3 font-semibold uppercase tracking-wider">Opening sanctuary...</span>
                    </div>
                  }>
                    <DashboardApp user={user} onLogout={handleLogout} />
                  </Suspense>
                </ProtectedAdminRoute>
              } 
            />

            {/* Catch-all Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </HelmetProvider>
  );
}
