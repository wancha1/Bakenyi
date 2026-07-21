import React, { useState, useEffect } from 'react';
import { 
  Menu, 
  Sun, 
  Moon, 
  Bell, 
  Search, 
  User, 
  HelpCircle,
  Database,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { getSupabaseConfig } from '../../lib/supabaseClient';
import { getNotifications, markAllNotificationsRead } from '../../lib/operations';

interface HeaderProps {
  onMobileMenuToggle: () => void;
  activeTab: string;
  userEmail?: string;
  userRole?: string;
}

export default function Header({ onMobileMenuToggle, activeTab, userEmail, userRole }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { isConfigured } = getSupabaseConfig();
  const [showNotifications, setShowNotifications] = useState(false);

  const resolvedRole = 
    userRole === 'staff' ? 'reporter' : 
    userRole === 'customer' ? 'public' : 
    userRole === 'member' ? 'public' :
    userRole;

  const roleBadge = 
    resolvedRole === 'super_admin' ? 'Elder' :
    resolvedRole === 'admin' ? 'Platform Admin' :
    resolvedRole === 'community_leader' ? 'Community Leader' :
    resolvedRole === 'historian' ? 'Historian' :
    resolvedRole === 'reporter' ? 'Heritage Reporter' :
    'Public User';

  // Tab Titles dictionary for clean display
  const tabTitles: { [key: string]: string } = {
    dashboard: resolvedRole === 'reporter' ? 'Reporter Workspace' : 'Operational Dashboard',
    users: 'Platform Users Database',
    roles: 'Roles & Permissions Control',
    content: resolvedRole === 'reporter' ? 'My Submissions Repository' : 'Preservation Content Manager',
    media: resolvedRole === 'reporter' ? 'My Contributed Media' : 'Storage Media Library',
    reports: 'Live Platform Reports',
    activity_logs: 'System Activity Logs',
    settings: 'Platform Configurations',
    system_health: 'Preservation Core Health',
  };

  const currentTitle = tabTitles[activeTab] || 'Admin Suite';

  const [liveNotifs, setLiveNotifs] = useState<any[]>([]);

  useEffect(() => {
    const syncNotifs = () => {
      setLiveNotifs(getNotifications());
    };
    syncNotifs();
    window.addEventListener('bakenye_operations_updated', syncNotifs);
    return () => window.removeEventListener('bakenye_operations_updated', syncNotifs);
  }, []);

  const unreadCount = liveNotifs.filter(n => !n.read).length;

  const handleMarkAllRead = () => {
    markAllNotificationsRead();
  };

  const isElder = resolvedRole === 'super_admin';

  return (
    <header className={`h-16 flex items-center justify-between px-6 sticky top-0 z-10 transition-colors duration-300 ${
      isElder 
        ? 'bg-gradient-to-r from-white via-white to-amber-500/[0.03] dark:from-slate-800 dark:via-slate-800 dark:to-amber-500/[0.02] border-b border-amber-200/40 dark:border-amber-950/40' 
        : 'bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700/50'
    }`}>
      {/* Left items: Mobile Menu trigger + Current Page Title */}
      <div className="flex items-center gap-4 text-left">
        <button
          onClick={onMobileMenuToggle}
          className="md:hidden p-2 -ml-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden sm:block">
          <h2 className={`text-sm font-bold uppercase tracking-widest leading-none font-sans ${isElder ? 'text-amber-500' : 'text-slate-400 dark:text-slate-500'}`}>
            {isElder ? 'Bakenye Council of Elders' : 'Bakenye Platform'}
          </h2>
          <span className="text-base font-bold text-slate-800 dark:text-white leading-none font-sans">
            {currentTitle}
          </span>
        </div>
      </div>

      {/* Right controls: Theme Switch, Supabase Indicator, Notifications, Profiler */}
      <div className="flex items-center gap-3">
        {/* Supabase Status Chip */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider select-none border dark:border-slate-700 border-slate-100 bg-slate-50 dark:bg-slate-900/50">
          <span className={`w-1.5 h-1.5 rounded-full ${isConfigured ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'}`} />
          <span className={isConfigured ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
            {isConfigured ? 'Live Database' : 'Database Inactive'}
          </span>
        </div>

        {/* Theme Toggler Button */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl border border-slate-100 dark:border-slate-700/60 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
        </button>

        {/* Notifications Icon with Toggle list */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-xl border border-slate-100 dark:border-slate-700/60 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors relative"
          >
            <Bell className="w-4.5 h-4.5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse flex items-center justify-center border-2 border-white dark:border-slate-800" />
            )}
          </button>

          {/* Notifications Dropdown menu */}
          {showNotifications && (
            <>
              {/* Backdrop Click Dismiss */}
              <div className="fixed inset-0 z-20" onClick={() => setShowNotifications(false)} />
              
              <div className="absolute right-0 mt-3.5 w-72 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 p-4 z-30 space-y-3 animation-slide-up text-left">
                <div className="flex items-center justify-between pb-2 border-b dark:border-slate-700">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">Alert Center</h4>
                  {unreadCount > 0 && (
                    <span 
                      onClick={handleMarkAllRead}
                      className="text-[10px] font-bold text-indigo-500 hover:underline cursor-pointer"
                    >
                      Mark all read
                    </span>
                  )}
                </div>

                <div className="divide-y divide-slate-100/50 dark:divide-slate-700/30 max-h-64 overflow-y-auto">
                  {liveNotifs.length > 0 ? (
                    liveNotifs.map((n) => (
                      <div key={n.id} className={`py-2.5 space-y-0.5 text-xs ${!n.read ? 'bg-indigo-50/10 -mx-4 px-4' : ''}`}>
                        <div className="font-bold text-slate-800 dark:text-white flex justify-between">
                          <span>{n.title}</span>
                          <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">
                            {n.timestamp ? new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">{n.desc}</p>
                      </div>
                    ))
                  ) : (
                    <div className="py-4 text-center text-slate-400 text-xs">No notifications available.</div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {resolvedRole === 'super_admin' && (
          <button
            onClick={() => {
              localStorage.setItem('bakenye_superadmin_view_mode', 'public');
              window.location.href = '/';
            }}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-500/20 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
            title="Switch View to Public Storefront"
          >
            Switch to Public View
          </button>
        )}

        {/* Profiler Details */}
        {userEmail && (
          <div className="flex items-center gap-2 border-l border-slate-100 dark:border-slate-700/50 pl-3 select-none">
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-900 border dark:border-slate-700/50 text-slate-800 dark:text-slate-200 font-bold text-[11px] flex items-center justify-center uppercase">
              {userEmail.substring(0, 2)}
            </div>
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-800 dark:text-white leading-none">
                {userEmail.split('@')[0]}
              </span>
              <span className={`text-[9px] font-bold uppercase tracking-wider ${resolvedRole === 'super_admin' ? 'text-amber-500' : 'text-indigo-500'}`}>
                {roleBadge}
              </span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
