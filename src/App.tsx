import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { getSupabaseConfig, getSupabase, checkIsAdmin } from './lib/supabaseClient';

// Core Layout components
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

// Admin Components
import Login from './components/admin/Login';
import Sidebar from './components/admin/Sidebar';
import Header from './components/admin/Header';

// Storefront Pages
import Home from './pages/Home';
import About from './pages/About';
import History from './pages/History';
import Clans from './pages/Clans';
import Leadership from './pages/Leadership';
import Gallery from './pages/Gallery';
import Language from './pages/Language';
import Articles from './pages/Articles';
import Contribute from './pages/Contribute';
import Contact from './pages/Contact';
import Search from './pages/Search';

// Admin View Panels
import DashboardView from './components/admin/views/DashboardView';
import UsersView from './components/admin/views/UsersView';
import RolesView from './components/admin/views/RolesView';
import ContentView from './components/admin/views/ContentView';
import MediaView from './components/admin/views/MediaView';
import ReportsView from './components/admin/views/ReportsView';
import ActivityLogsView from './components/admin/views/ActivityLogsView';
import SettingsView from './components/admin/views/SettingsView';
import SystemHealthView from './components/admin/views/SystemHealthView';

/**
 * Public Layout which includes the global Navbar and Footer.
 */
function StorefrontLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-heritage-cream text-heritage-ink transition-colors duration-300">
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
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

  // Render view by tab ID
  const renderView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView onNavigate={(tab) => setActiveTab(tab)} />;
      case 'users':
        return <UsersView />;
      case 'roles':
        return <RolesView />;
      case 'content':
        return <ContentView />;
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
        return <DashboardView onNavigate={(tab) => setActiveTab(tab)} />;
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
        />

        {/* Inner Content Area */}
        <main className="flex-grow p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {renderView()}
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
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Storefront Routes */}
          <Route element={<StorefrontLayout />}>
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
                <Login onLoginSuccess={handleLoginSuccess} />
              </PublicLoginRoute>
            } 
          />

          {/* Protected Admin Routes */}
          <Route 
            path="/admin" 
            element={
              <ProtectedAdminRoute user={user} isAuthLoading={isAuthLoading}>
                <DashboardApp user={user} onLogout={handleLogout} />
              </ProtectedAdminRoute>
            } 
          />

          {/* Catch-all Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
