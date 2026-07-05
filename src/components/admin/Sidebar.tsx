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
  Heart
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
}

export default function Sidebar({
  activeTab,
  onNavigate,
  onLogout,
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen,
  userEmail
}: SidebarProps) {
  
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'roles', label: 'Roles & Permissions', icon: Shield },
    { id: 'content', label: 'Content', icon: FileText },
    { id: 'media', label: 'Media Library', icon: Image },
    { id: 'reports', label: 'Reports', icon: BarChart2 },
    { id: 'activity_logs', label: 'Activity Logs', icon: Activity },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'system_health', label: 'System Health', icon: Heart },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-slate-800 border-r border-slate-100 dark:border-slate-700/50 shadow-xs transition-colors duration-300">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-slate-50 dark:border-slate-700/40 select-none">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-600/10">
            <Shield className="w-5 h-5" />
          </div>
          {(!isCollapsed || isMobileOpen) && (
            <div className="flex flex-col text-left">
              <span className="font-bold text-sm text-slate-800 dark:text-white leading-none">Bakenye</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Admin Suite</span>
            </div>
          )}
        </div>

        {/* Collapsible toggle on desktop */}
        {!isMobileOpen && (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex p-1.5 rounded-lg border border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
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
      <nav className="flex-1 px-3 py-4 space-y-1">
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
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/10'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700/20'
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {(!isCollapsed || isMobileOpen) && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Footer Profile Box & Logout */}
      <div className="p-3 border-t border-slate-50 dark:border-slate-700/40 bg-slate-50/50 dark:bg-slate-900/10">
        {/* User profile */}
        {(!isCollapsed || isMobileOpen) && userEmail && (
          <div className="px-3 py-2 bg-slate-100/50 dark:bg-slate-700/30 border dark:border-slate-750/30 rounded-xl mb-2 flex items-center gap-2.5 overflow-hidden">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/15 text-indigo-500 font-bold text-[10px] flex items-center justify-center shrink-0 uppercase">
              {userEmail.substring(0, 2)}
            </div>
            <div className="overflow-hidden text-left">
              <div className="text-[11px] font-bold text-slate-700 dark:text-slate-350 truncate">{userEmail.split('@')[0]}</div>
              <div className="text-[9px] text-slate-400 dark:text-slate-500 leading-none truncate">Manager Account</div>
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
