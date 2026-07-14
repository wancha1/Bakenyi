import React, { useState, useMemo } from 'react';
import { 
  Search, 
  ArrowRight, 
  Activity, 
  Sparkles, 
  BookOpen, 
  Compass, 
  Globe, 
  Flame, 
  ShieldCheck, 
  FileText, 
  FolderOpen, 
  Eye, 
  Scroll, 
  Heart, 
  Users, 
  Book, 
  Quote, 
  Music, 
  Smile, 
  Clock, 
  Image as ImageIcon, 
  Video, 
  Volume2, 
  Calendar, 
  Newspaper, 
  FileSpreadsheet, 
  Phone, 
  UserCheck, 
  Lock, 
  Bell, 
  BarChart2, 
  FileCode, 
  Sliders,
  ExternalLink,
  MapPin,
  HelpCircle
} from 'lucide-react';
import { GovernancePage, ContentItem } from './types';

interface GovernanceMapProps {
  pages: GovernancePage[];
  contentItems: ContentItem[];
  pendingCounts: Record<string, number>;
  onSelectPage: (pageId: string) => void;
}

// Map pageId to its simulated public-facing route
export function getPublicRoute(pageId: string): string {
  const routes: Record<string, string> = {
    'overview': '/',
    'home-hero': '/',
    'home-featured': '/featured',
    'home-activity': '/activities',
    'about-origin': '/about/origin',
    'about-culture': '/about/culture',
    'about-traditions': '/about/traditions',
    'about-leadership': '/about/leadership',
    'heritage-articles': '/heritage/articles',
    'heritage-collections': '/heritage/collections',
    'heritage-exhibitions': '/heritage/exhibitions',
    'clans-records': '/clans/records',
    'clans-totems': '/clans/totems',
    'clans-leaders': '/clans/leaders',
    'language-dictionary': '/language/dictionary',
    'language-proverbs': '/language/proverbs',
    'language-songs': '/language/songs',
    'language-names': '/language/names',
    'timeline': '/timeline',
    'gallery-images': '/gallery/images',
    'gallery-videos': '/gallery/videos',
    'gallery-audio': '/gallery/audio',
    'events': '/events',
    'news': '/news',
    'research': '/research',
    'contact': '/contact',
    'users': '/admin/users',
    'roles': '/admin/roles',
    'notifications': '/admin/notifications',
    'reports': '/admin/reports',
    'audit-logs': '/admin/audit-logs',
    'settings': '/admin/settings',
  };
  return routes[pageId] || `/${pageId.replace('-', '/')}`;
}

const getPageIcon = (iconName: string) => {
  const map: Record<string, any> = {
    Activity: Activity,
    Sparkles: Sparkles,
    BookOpen: BookOpen,
    Compass: Compass,
    Globe: Globe,
    Flame: Flame,
    Shield: ShieldCheck,
    FileText: FileText,
    FolderOpen: FolderOpen,
    Eye: Eye,
    Scroll: Scroll,
    Heart: Heart,
    Users: Users,
    Book: Book,
    Quote: Quote,
    Music: Music,
    Smile: Smile,
    Clock: Clock,
    Image: ImageIcon,
    Video: Video,
    Volume2: Volume2,
    Calendar: Calendar,
    Newspaper: Newspaper,
    FileSpreadsheet: FileSpreadsheet,
    Phone: Phone,
    UserCheck: UserCheck,
    Lock: Lock,
    Bell: Bell,
    BarChart2: BarChart2,
    FileCode: FileCode,
    Sliders: Sliders,
  };
  return map[iconName] || HelpCircle;
};

export default function GovernanceMap({ pages, contentItems, pendingCounts, onSelectPage }: GovernanceMapProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

  // Filter out meta pages that aren't content pages or need distinct handling
  const filteredPagesList = useMemo(() => {
    return pages.filter(p => p.id !== 'overview');
  }, [pages]);

  // Categories extraction
  const categories = useMemo(() => {
    const list = new Set<string>();
    filteredPagesList.forEach(p => {
      if (p.category) list.add(p.category);
    });
    return ['all', ...Array.from(list)];
  }, [filteredPagesList]);

  // Grouped pages based on category and query search
  const categoriesWithMappedPages = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    
    // Group all pages by category first
    const groups: Record<string, GovernancePage[]> = {};
    
    filteredPagesList.forEach(p => {
      const publicRoute = getPublicRoute(p.id);
      const matchesSearch = 
        p.label.toLowerCase().includes(query) || 
        publicRoute.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query) ||
        p.id.toLowerCase().includes(query);

      const matchesCategory = selectedCategoryFilter === 'all' || p.category === selectedCategoryFilter;

      if (matchesSearch && matchesCategory) {
        if (!groups[p.category]) {
          groups[p.category] = [];
        }
        groups[p.category].push(p);
      }
    });

    return Object.entries(groups).map(([category, catPages]) => ({
      category,
      pages: catPages
    })).sort((a, b) => a.category.localeCompare(b.category));

  }, [filteredPagesList, searchQuery, selectedCategoryFilter]);

  // General counts for overview helper
  const mapStats = useMemo(() => {
    const totalRoutes = filteredPagesList.length;
    const totalPending = Object.values(pendingCounts).reduce((a, b) => a + b, 0);
    const totalPublished = contentItems.filter(c => c.status === 'published').length;
    return { totalRoutes, totalPending, totalPublished };
  }, [filteredPagesList, contentItems, pendingCounts]);

  return (
    <div id="governance-map-container" className="bg-white dark:bg-slate-800 rounded-[32px] border border-slate-150 dark:border-slate-700/60 p-6 md:p-8 shadow-sm space-y-6 text-left">
      
      {/* Map Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-700/40 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
              <MapPin className="w-5 h-5 animate-pulse" />
            </span>
            <h2 className="text-xl font-serif font-black text-slate-900 dark:text-white">
              Website Governance & Route Directory Map
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            A real-time blueprint of the public-facing Bakenyi portal mapped to corresponding Elder control workstations.
          </p>
        </div>

        {/* Mini stats badges */}
        <div className="flex flex-wrap gap-2 shrink-0">
          <div className="bg-slate-50 dark:bg-slate-900/40 px-3.5 py-1.5 rounded-2xl border border-slate-100 dark:border-slate-750/30 text-[10px] font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
            <span>Routes: <strong>{mapStats.totalRoutes}</strong></span>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900/40 px-3.5 py-1.5 rounded-2xl border border-slate-100 dark:border-slate-750/30 text-[10px] font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Published: <strong>{mapStats.totalPublished}</strong></span>
          </div>
          {mapStats.totalPending > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/20 px-3.5 py-1.5 rounded-2xl text-[10px] font-mono text-amber-600 dark:text-amber-400 flex items-center gap-1.5 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Pending Backlog: <strong>{mapStats.totalPending}</strong></span>
            </div>
          )}
        </div>
      </div>

      {/* Control Filters and Search */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Search Input */}
        <div className="md:col-span-7 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            id="governance-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by page name, category, or public URL structure (e.g. /language)..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/40 border border-slate-150 dark:border-slate-700/60 rounded-2xl text-xs focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-hidden transition-all text-slate-800 dark:text-white"
          />
        </div>

        {/* Category Filters */}
        <div className="md:col-span-5 flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <span className="text-[10px] font-black uppercase text-slate-400 shrink-0">Filter:</span>
          <div className="flex gap-1.5 min-w-max">
            {categories.slice(0, 5).map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  selectedCategoryFilter === cat
                    ? 'bg-amber-500 text-slate-950 font-extrabold'
                    : 'bg-slate-50 dark:bg-slate-900/40 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white border border-slate-100 dark:border-slate-750/30'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Visually Mapped Routes Tree/Grid */}
      <div className="space-y-8 pt-2">
        {categoriesWithMappedPages.map(({ category, pages: catPages }) => (
          <div key={category} className="space-y-4 animate-fade-in">
            {/* Category Node Ribbon */}
            <div className="flex items-center gap-3">
              <span className="h-px bg-slate-100 dark:bg-slate-700/40 flex-1" />
              <span className="px-3 py-1 rounded-full bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-750/30 text-[10px] font-black uppercase tracking-widest text-slate-500">
                {category} Domain Hierarchy
              </span>
              <span className="h-px bg-slate-100 dark:bg-slate-700/40 flex-1" />
            </div>

            {/* Grid of Pages within this Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {catPages.map(page => {
                const IconComponent = getPageIcon(page.icon);
                const publicUrl = getPublicRoute(page.id);
                const pagePendingCount = pendingCounts[page.id] || 0;
                const pageTotalCount = contentItems.filter(item => item.pageId === page.id).length;
                const activeCount = contentItems.filter(item => item.pageId === page.id && item.status === 'published').length;

                return (
                  <div 
                    key={page.id}
                    id={`route-card-${page.id}`}
                    className="group bg-slate-50/40 dark:bg-slate-900/10 hover:bg-white dark:hover:bg-slate-900/60 border border-slate-100 dark:border-slate-750/15 hover:border-amber-500/30 dark:hover:border-amber-500/40 rounded-2xl p-4 transition-all duration-300 flex flex-col justify-between gap-4 shadow-xs hover:shadow-md hover:shadow-amber-500/2"
                  >
                    <div className="space-y-3">
                      {/* Card Header Info */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className={`p-2 rounded-xl transition-all ${
                            pagePendingCount > 0 
                              ? 'bg-amber-500/10 text-amber-500 animate-pulse'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-amber-500/10 group-hover:text-amber-500'
                          }`}>
                            <IconComponent className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white leading-tight">
                              {page.label}
                            </h4>
                            <span className="text-[9px] font-mono text-slate-400">
                              panel: <strong className="text-slate-500 dark:text-slate-300">{page.id}</strong>
                            </span>
                          </div>
                        </div>

                        {pagePendingCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[8px] uppercase tracking-wider animate-bounce">
                            {pagePendingCount} PENDING
                          </span>
                        )}
                      </div>

                      {/* Path mapping connection */}
                      <div className="space-y-1 bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/60 text-left font-mono">
                        <div className="flex items-center justify-between text-[9px] text-slate-400">
                          <span>Public URL Structure:</span>
                          <span className="flex items-center gap-0.5 text-slate-500 group-hover:text-amber-500 transition-colors">
                            <ExternalLink className="w-2.5 h-2.5" /> preview
                          </span>
                        </div>
                        <div className="text-[10.5px] font-bold text-indigo-600 dark:text-amber-400 truncate">
                          bakenyi.org{publicUrl}
                        </div>
                      </div>

                      {/* Content metrics bar */}
                      <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 border-t border-slate-100 dark:border-slate-800/40 pt-2.5">
                        <div>
                          <span>Published items:</span>
                          <strong className="block text-slate-700 dark:text-slate-200">{activeCount} / {pageTotalCount}</strong>
                        </div>
                        <div>
                          <span>Activity Status:</span>
                          <span className={`block font-bold ${activeCount > 0 ? 'text-emerald-500' : 'text-slate-400'}`}>
                            {activeCount > 0 ? '● Seeded Integrity' : '○ Standby Empty'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Manage workstation routing button */}
                    <button
                      id={`manage-btn-${page.id}`}
                      onClick={() => onSelectPage(page.id)}
                      className="w-full flex items-center justify-between py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 text-slate-700 hover:text-slate-950 dark:text-slate-300 transition-all font-bold text-[10px] uppercase tracking-wider cursor-pointer group/btn shadow-xs hover:shadow-xs border border-transparent"
                    >
                      <span>Manage Section Controls</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover/btn:translate-x-1.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {categoriesWithMappedPages.length === 0 && (
          <div className="text-center py-12 space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center mx-auto border border-slate-100 dark:border-slate-800">
              <Search className="w-5 h-5 text-slate-400" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-800 dark:text-white">No mapped routes found</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No public pages or administrative panels matched "{searchQuery}" in category "{selectedCategoryFilter}". Try adjusting your terms.
              </p>
            </div>
            <button
              onClick={() => { setSearchQuery(''); setSelectedCategoryFilter('all'); }}
              className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-[10px] font-bold uppercase transition-all cursor-pointer"
            >
              Reset Search Parameters
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
