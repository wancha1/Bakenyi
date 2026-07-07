import React from 'react';
import { 
  Shield, 
  LayoutDashboard, 
  Users, 
  Image, 
  Settings, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  Menu,
  X,
  FileText,
  BarChart2,
  Activity,
  Heart,
  Home
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onNavigate: (tab: string) => void;
  onLogout: () => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  userEmail?: string;
  userRole?: 'super_admin' | 'admin' | 'reporter' | 'public' | 'staff' | 'customer';
}

export default function Sidebar({
  activeTab,
  onNavigate,
  onLogout,
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen,
  userEmail,
  userRole = 'public'
}: SidebarProps) {
  
  // Normalize user roles for clean checks
  const resolvedRole = 
    userRole === 'staff' ? 'reporter' : 
    userRole === 'customer' ? 'public' : 
    userRole;

  const isElder = resolvedRole === 'super_admin';

  const allNavItems = [
    { id: 'dashboard', label: resolvedRole === 'reporter' ? 'My Workspace' : (isElder ? 'Council Chamber' : 'Dashboard'), icon: LayoutDashboard },
    { id: 'users', label: isElder ? 'Heritage Guardians' : 'Users', icon: Users },
    { id: 'roles', label: isElder ? 'Council Hierarchy' : 'Roles & Permissions', icon: Shield },
    { id: 'content', label: resolvedRole === 'reporter' ? 'My Submissions' : (isElder ? 'Chronicled Wisdom' : 'Content'), icon: FileText },
    { id: 'media', label: resolvedRole === 'reporter' ? 'My Media' : (isElder ? 'Sacred Media Library' : 'Media Library'), icon: Image },
    { id: 'reports', label: 'Reports', icon: BarChart2 },
    { id: 'activity_logs', label: 'Activity Logs', icon: Activity },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'system_health', label: 'System Health', icon: Heart },
  ];

  // Filter based on normalized role
  let navItems = allNavItems;
  if (resolvedRole === 'admin') {
    // Admins see everything except roles, settings, system_health
    navItems = allNavItems.filter(item => ['dashboard', 'users', 'content', 'media', 'reports', 'activity_logs'].includes(item.id));
  } else if (resolvedRole === 'reporter') {
    // Reporters see workspace, submissions, media
    navItems = allNavItems.filter(item => ['dashboard', 'content', 'media'].includes(item.id));
  } else if (resolvedRole === 'super_admin') {
    navItems = allNavItems;
  } else {
    // Public user shouldn't usually see this, but give them minimal
    navItems = allNavItems.filter(item => ['dashboard'].includes(item.id));
  }

  const sidebarContent = (
    <div className={`flex flex-col h-full bg-white dark:bg-slate-800 border-r ${isElder ? 'border-amber-200/50 dark:border-amber-950/40 shadow-[4px_0_24px_rgba(245,158,11,0.02)]' : 'border-slate-100 dark:border-slate-700/50 shadow-xs'} transition-all duration-300`}>
      {/* Brand Header */}
      <div className={`h-16 flex items-center justify-between px-5 border-b ${isElder ? 'border-amber-100/40 dark:border-amber-950/20 bg-amber-50/10 dark:bg-amber-950/5' : 'border-slate-50 dark:border-slate-700/40'} select-none`}>
        <div className="flex items-center gap-3 overflow-hidden">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-md ${isElder ? 'bg-amber-500 text-slate-950 shadow-amber-500/20' : 'bg-indigo-600 text-white shadow-indigo-600/10'}`}>
            <Shield className="w-5 h-5 animate-pulse" />
          </div>
          {(!isCollapsed || isMobileOpen) && (
            <div className="flex flex-col text-left">
              <span className="font-bold text-sm text-slate-800 dark:text-white leading-none">Bakenye</span>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${isElder ? 'text-amber-500' : 'text-slate-400 dark:text-slate-500'}`}>
                {isElder ? 'Elder Sanctuary' : 'Admin Suite'}
              </span>
            </div>
          )}
        </div>

        {/* Collapsible toggle on desktop */}
        {!isMobileOpen && (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`hidden md:flex p-1.5 rounded-lg border hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer ${isElder ? 'border-amber-200/20 dark:border-amber-950/25' : 'border-slate-100 dark:border-slate-700'}`}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}

        {/* Close Button on mobile */}
        {isMobileOpen && (
          <button
            onClick={() => setIsMobileOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {/* Global Return to Public Home Option */}
        <button
          onClick={() => {
            window.location.href = '/';
          }}
          className={`w-full flex items-center gap-3.5 py-3 rounded-xl transition-all cursor-pointer select-none font-bold text-xs uppercase tracking-wider text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700/20 ${
            isCollapsed && !isMobileOpen ? 'justify-center px-0' : 'px-4'
          }`}
          title="Return to Public Site"
        >
          <Home className="w-5 h-5 shrink-0 text-amber-500" />
          {(!isCollapsed || isMobileOpen) && <span>Public Home</span>}
        </button>

        <div className={`h-px my-2 ${isElder ? 'bg-amber-100/50 dark:bg-amber-950/20' : 'bg-slate-100 dark:bg-slate-700/50'}`} />

        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => {
                onNavigate(item.id);
                setIsMobileOpen(false);
              }}
              className={`w-full flex items-center gap-3.5 py-3 rounded-xl transition-all cursor-pointer select-none font-bold text-xs uppercase tracking-wider ${
                isCollapsed && !isMobileOpen ? 'justify-center px-0' : 'px-4'
              } ${
                isActive
                  ? isElder
                    ? 'bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/10 font-extrabold'
                    : 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/10'
                  : isElder
                    ? 'text-amber-700/70 hover:text-amber-900 dark:text-amber-400/70 dark:hover:text-amber-300 hover:bg-amber-500/5'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700/20'
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className={`w-5 h-5 shrink-0 ${isActive && isElder ? 'stroke-[2.5px]' : ''}`} />
              {(!isCollapsed || isMobileOpen) && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Footer Profile Box & Logout */}
      <div className={`p-3 border-t bg-slate-50/50 dark:bg-slate-900/10 ${isElder ? 'border-amber-100/40 dark:border-amber-950/20 bg-amber-500/[0.02]' : 'border-slate-50 dark:border-slate-700/40'}`}>
        {/* User profile */}
        {(!isCollapsed || isMobileOpen) && userEmail && (
          <div className={`px-3 py-2 border rounded-xl mb-2 flex items-center gap-2.5 overflow-hidden ${isElder ? 'bg-amber-50/40 dark:bg-amber-950/15 border-amber-200/30 dark:border-amber-950/25' : 'bg-slate-100/50 dark:bg-slate-700/30 border-slate-100 dark:border-slate-750/30'}`}>
            <div className={`w-7 h-7 rounded-lg font-bold text-[10px] flex items-center justify-center shrink-0 uppercase ${isElder ? 'bg-amber-500 text-slate-950' : 'bg-indigo-500/15 text-indigo-500'}`}>
              {userEmail.substring(0, 2)}
            </div>
            <div className="overflow-hidden text-left">
              <div className={`text-[11px] font-bold truncate ${isElder ? 'text-amber-900 dark:text-amber-200' : 'text-slate-700 dark:text-slate-350'}`}>{userEmail.split('@')[0]}</div>
              <div className="text-[9px] text-slate-400 dark:text-slate-500 leading-none truncate">
                {isElder ? 'Respected Heritage Elder' : 'Manager Account'}
              </div>
            </div>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={onLogout}
          className={`w-full flex items-center gap-3.5 py-3 rounded-xl hover:bg-rose-500/10 hover:text-rose-500 dark:hover:text-rose-400 text-slate-500 dark:text-slate-400 cursor-pointer select-none font-bold text-xs uppercase tracking-wider ${
            isCollapsed && !isMobileOpen ? 'justify-center px-0' : 'px-4'
          }`}
          title={isCollapsed ? 'Logout' : undefined}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {(!isCollapsed || isMobileOpen) && <span>Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className={`hidden md:block h-screen fixed left-0 top-0 z-20 shrink-0 transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}>
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Sidebar Overlay */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs flex">
          <div className="w-64 h-full relative animation-slide-right animate-fade-in">
            {sidebarContent}
          </div>
          {/* Backdrop Touch Dismiss */}
          <div className="flex-1" onClick={() => setIsMobileOpen(false)} />
        </div>
      )}
    </>
  );
}
