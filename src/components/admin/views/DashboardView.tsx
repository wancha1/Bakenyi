import React, { useEffect, useState, useMemo } from 'react';
import { 
  Users, 
  Inbox, 
  Image as ImageIcon, 
  BookOpen, 
  CheckCircle2, 
  Loader2,
  X,
  PlusCircle,
  FileText,
  Clock,
  ArrowRight,
  ShieldAlert,
  UserCheck,
  Volume2,
  Languages,
  ShieldCheck,
  Activity,
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  Search,
  Book,
  Calendar,
  Lock,
  Compass,
  Flame,
  Globe,
  Quote,
  Music,
  Smile,
  Scroll,
  Heart,
  Eye,
  Sliders,
  Bell,
  BarChart2,
  FileCode,
  Newspaper,
  FileSpreadsheet,
  Phone,
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import { 
  fetchUsers, 
  fetchMediaFiles, 
  UserProfile, 
  MediaFile, 
  getSupabaseConfig 
} from '../../../lib/supabaseClient';
import { 
  getArticles, 
  getVocabulary,
  getContributions,
  getGalleryImages,
  Vocabulary,
  Contribution,
  GalleryImage
} from '../../../lib/supabase';
import { Article } from '../../../types/article';
import { getAuditLogs, AuditLog } from '../../../lib/operations';

// Website Governance Modules
import { ContentItem, GovernancePage, VersionRecord, PageAuditLog } from './governance/types';
import { WEBPAGES, INITIAL_CONTENT_ITEMS, INITIAL_PENDING_ITEMS, SEEDED_AUDIT_LOGS } from './governance/initialData';
import PageWorkstation from './governance/PageWorkstation';
import GovernanceMap, { getPublicRoute } from './governance/GovernanceMap';

interface DashboardViewProps {
  onNavigate: (tab: string) => void;
  user?: any;
  userRole?: 'super_admin' | 'admin' | 'historian' | 'community_leader' | 'reporter' | 'member' | 'public' | 'staff' | 'customer';
}

export default function DashboardView({ onNavigate, user, userRole = 'public' }: DashboardViewProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [media, setMedia] = useState<MediaFile[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [vocabularies, setVocabularies] = useState<Vocabulary[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Unified State for Governance Center content, audits, and revision logs
  const [governanceContent, setGovernanceContent] = useState<ContentItem[]>([]);
  const [governanceAudits, setGovernanceAudits] = useState<PageAuditLog[]>([]);
  const [governanceVersions, setGovernanceVersions] = useState<VersionRecord[]>([]);

  // Page Navigation Tree state
  const [activePageId, setActivePageId] = useState<string>('overview');
  const [activeCategoryTab, setActiveCategoryTab] = useState<string>('Home');
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [routerInputPath, setRouterInputPath] = useState('');
  const [auditLogTypeFilter, setAuditLogTypeFilter] = useState('all');
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({
    Home: false,
    About: false,
    Heritage: false,
    Clans: false,
    Language: false,
    Gallery: false,
    System: true
  });

  // Supabase state config
  const { isConfigured } = getSupabaseConfig();

  // Normalize user roles for clean checks
  const resolvedRole = 
    userRole === 'staff' ? 'reporter' : 
    userRole === 'customer' ? 'public' : 
    userRole === 'member' ? 'public' :
    userRole;

  const isElder = resolvedRole === 'super_admin';

  // Toggle category folding
  const toggleCategory = (cat: string) => {
    setCollapsedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  // ----------------------------------------------------
  // DATA LOADING & SYNCHRONIZATION MERGING ENGINE
  // ----------------------------------------------------
  const loadDatabaseData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch real tables from Supabase in parallel
      const [usersData, mediaData, articlesData, vocabData, contribData, galleryData] = await Promise.all([
        fetchUsers(),
        fetchMediaFiles(),
        getArticles(false),
        getVocabulary(false),
        getContributions(),
        getGalleryImages(true)
      ]);

      setUsers(usersData);
      setMedia(mediaData);
      setArticles(articlesData);
      setVocabularies(vocabData);
      setContributions(contribData);
      setGalleryImages(galleryData);

      // 2. Initialize Governance State from local storage or seeded constants
      let storedContent: ContentItem[] = [];
      const cachedContent = localStorage.getItem('bakenye_governance_db_content');
      if (cachedContent) {
        try {
          storedContent = JSON.parse(cachedContent);
        } catch {
          storedContent = [...INITIAL_CONTENT_ITEMS, ...INITIAL_PENDING_ITEMS];
        }
      } else {
        storedContent = [...INITIAL_CONTENT_ITEMS, ...INITIAL_PENDING_ITEMS];
      }

      // 3. SYNCHRONIZE DB UPLOADS: Inject and map live items fetched from database
      const syncedContent: ContentItem[] = [...storedContent];

      // A. Sync Articles -> Heritage Articles Page
      articlesData.forEach((art: any) => {
        const exists = syncedContent.some(item => item.id === art.id);
        if (!exists) {
          syncedContent.unshift({
            id: art.id,
            pageId: 'heritage-articles',
            title: art.title,
            summary: art.excerpt || 'Preservation article',
            content: art.content || '',
            status: art.status === 'published' ? 'published' : art.status === 'pending' ? 'pending' : 'draft',
            author: art.author || 'Staff Preserver',
            createdAt: art.publishedAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            views: art.views || 0,
            likes: 0,
            version: 1,
            type: 'article'
          });
        }
      });

      // B. Sync Vocabulary Dictionary suggestions -> Language Dictionary Page
      vocabData.forEach((vocab: any) => {
        const exists = syncedContent.some(item => item.id === vocab.id);
        if (!exists) {
          syncedContent.unshift({
            id: vocab.id,
            pageId: 'language-dictionary',
            title: vocab.lukenye,
            summary: vocab.english,
            content: vocab.definition || '',
            status: vocab.status === 'approved' ? 'published' : vocab.status === 'pending' ? 'pending' : 'draft',
            author: vocab.submittedBy || 'Community Member',
            createdAt: vocab.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            views: 0,
            likes: 0,
            version: 1,
            type: 'dictionary',
            extraFields: {
              partOfSpeech: vocab.partOfSpeech || 'Noun',
              translation: vocab.english,
              example: vocab.exampleUsage || ''
            }
          });
        }
      });

      // C. Sync Media files -> Gallery Pages
      mediaData.forEach((m: any) => {
        const exists = syncedContent.some(item => item.id === m.id);
        if (!exists) {
          const fileType = m.file_type || 'image';
          let pageId = 'gallery-images';
          if (fileType === 'video') pageId = 'gallery-videos';
          if (fileType === 'audio') pageId = 'gallery-audio';

          syncedContent.unshift({
            id: m.id,
            pageId,
            title: m.title,
            summary: m.description || 'Vetted Community Attachment',
            content: m.description || '',
            status: m.status === 'approved' ? 'published' : m.status === 'pending' ? 'pending' : 'draft',
            author: m.uploader_email || 'Community Member',
            createdAt: m.created_at || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            views: 0,
            likes: 0,
            version: 1,
            type: fileType as any,
            mediaUrl: m.file_url,
            extraFields: {
              location: m.category || 'General Preservation'
            }
          });
        }
      });

      // D. Sync Contributions -> Heritage Collections (or oral histories)
      contribData.forEach((c: any) => {
        const exists = syncedContent.some(item => item.id === c.id);
        if (!exists) {
          syncedContent.unshift({
            id: c.id,
            pageId: 'heritage-collections',
            title: c.title,
            summary: c.type === 'audio' ? 'Oral narrative' : 'Lineage photograph',
            content: c.description || '',
            status: c.status === 'approved' ? 'published' : c.status === 'pending' ? 'pending' : 'draft',
            author: c.author_name || 'Community Member',
            createdAt: c.created_at || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            views: 0,
            likes: 0,
            version: 1,
            type: c.type === 'audio' ? 'audio' : 'image',
            mediaUrl: c.imageUrl
          });
        }
      });

      // Write synced state to state hook & caches
      setGovernanceContent(syncedContent);
      localStorage.setItem('bakenye_governance_db_content', JSON.stringify(syncedContent));

      // Load Audits
      const cachedAudits = localStorage.getItem('bakenye_governance_db_audits');
      if (cachedAudits) {
        setGovernanceAudits(JSON.parse(cachedAudits));
      } else {
        setGovernanceAudits(SEEDED_AUDIT_LOGS);
        localStorage.setItem('bakenye_governance_db_audits', JSON.stringify(SEEDED_AUDIT_LOGS));
      }

      // Load Version revisions
      const cachedVersions = localStorage.getItem('bakenye_governance_db_versions');
      if (cachedVersions) {
        setGovernanceVersions(JSON.parse(cachedVersions));
      } else {
        setGovernanceVersions([]);
      }

    } catch (err) {
      console.error('Failed to sync and load platform operations database:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDatabaseData();
    // Re-sync reactive updates
    const handleSync = () => {
      loadDatabaseData();
    };
    window.addEventListener('bakenye_operations_updated', handleSync);
    return () => {
      window.removeEventListener('bakenye_operations_updated', handleSync);
    };
  }, []);

  // Save changes and cache immediately
  const handleSaveContent = (updatedItems: ContentItem[]) => {
    setGovernanceContent(updatedItems);
    localStorage.setItem('bakenye_governance_db_content', JSON.stringify(updatedItems));
  };

  const handleAddAuditLog = (newLog: Omit<PageAuditLog, 'id' | 'timestamp'>) => {
    const formattedLog: PageAuditLog = {
      ...newLog,
      id: `p_aud_${Date.now()}`,
      timestamp: new Date().toISOString()
    };
    const updated = [formattedLog, ...governanceAudits];
    setGovernanceAudits(updated);
    localStorage.setItem('bakenye_governance_db_audits', JSON.stringify(updated));
  };

  const handleAddVersion = (newVer: Omit<VersionRecord, 'id' | 'updatedAt'>) => {
    const formattedVer: VersionRecord = {
      ...newVer,
      id: `ver_${Date.now()}`,
      updatedAt: new Date().toISOString()
    };
    const updated = [formattedVer, ...governanceVersions];
    setGovernanceVersions(updated);
    localStorage.setItem('bakenye_governance_db_versions', JSON.stringify(updated));
  };

  // Helper to resolve page specific icon components
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
      Video: ImageIcon,
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
      Sliders: Sliders
    };
    return map[iconName] || FileText;
  };

  // ----------------------------------------------------
  // PRESET STRUCTURE CATEGORY ORGANIZER
  // ----------------------------------------------------
  const categoriesList = [
    { id: 'General', label: 'PRESERVATION BOARD', pages: ['overview'] },
    { id: 'Home', label: 'HOMEPAGE SECTOR', pages: ['home-hero', 'home-featured', 'home-activity'] },
    { id: 'About', label: 'ABOUT THE BAKENYI', pages: ['about-origin', 'about-culture', 'about-traditions', 'about-leadership'] },
    { id: 'Heritage', label: 'HERITAGE CHRONICLES', pages: ['heritage-articles', 'heritage-collections', 'heritage-exhibitions'] },
    { id: 'Clans', label: 'CLANS & MARITIME LORE', pages: ['clans-records', 'clans-totems', 'clans-leaders'] },
    { id: 'Language', label: 'LUKENYE DIALECTS', pages: ['language-dictionary', 'language-proverbs', 'language-songs', 'language-names'] },
    { id: 'Timeline', label: 'HISTORICAL CHRONOLOGY', pages: ['timeline'] },
    { id: 'Gallery', label: 'PRESERVATION ARCHIVES', pages: ['gallery-images', 'gallery-videos', 'gallery-audio'] },
    { id: 'Direct', label: 'COMMUNITY NOTICES', pages: ['events', 'news', 'research', 'contact'] },
    { id: 'System', label: 'COUNCIL VAULT SETTINGS', pages: ['users', 'roles', 'notifications', 'reports', 'audit-logs', 'settings'] }
  ];

  // Map pending approval counts to categories and subpages
  const pendingCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    governanceContent.forEach(item => {
      if (item.status === 'pending') {
        counts[item.pageId] = (counts[item.pageId] || 0) + 1;
      }
    });
    return counts;
  }, [governanceContent]);

  // Total backlog for alerts
  const totalPendingBacklog = useMemo(() => {
    return (Object.values(pendingCounts) as number[]).reduce((a, b) => a + b, 0);
  }, [pendingCounts]);

  // Filter webpages based on sidebar search
  const filteredCategories = useMemo(() => {
    if (!sidebarSearch.trim()) return categoriesList;
    const query = sidebarSearch.toLowerCase();
    
    return categoriesList.map(cat => {
      const matchingPages = cat.pages.filter(pId => {
        const p = WEBPAGES.find(wp => wp.id === pId);
        return p?.label.toLowerCase().includes(query) || p?.id.toLowerCase().includes(query);
      });
      return { ...cat, pages: matchingPages };
    }).filter(cat => cat.pages.length > 0);
  }, [sidebarSearch]);

  const activePage = useMemo(() => {
    return WEBPAGES.find(wp => wp.id === activePageId) || WEBPAGES[0];
  }, [activePageId]);

  // Filtered Audits for the automated visual feed
  const filteredAudits = useMemo(() => {
    return governanceAudits.filter(log => {
      if (auditLogTypeFilter === 'all') return true;
      const lowerAction = log.action.toLowerCase();
      const lowerDetails = log.details.toLowerCase();
      
      if (auditLogTypeFilter === 'proverb') {
        return lowerAction.includes('proverb') || lowerDetails.includes('proverb');
      }
      if (auditLogTypeFilter === 'dictionary') {
        return lowerAction.includes('dictionary') || lowerDetails.includes('dictionary') || lowerDetails.includes('word') || lowerDetails.includes('vocab');
      }
      if (auditLogTypeFilter === 'article') {
        return lowerAction.includes('article') || lowerDetails.includes('article') || lowerAction.includes('hero') || lowerAction.includes('feat');
      }
      if (auditLogTypeFilter === 'totem') {
        return lowerAction.includes('totem') || lowerDetails.includes('totem') || lowerDetails.includes('clan');
      }
      if (auditLogTypeFilter === 'approve') {
        return lowerAction.includes('approved') || lowerAction.includes('vet') || lowerAction.includes('contribution approved');
      }
      if (auditLogTypeFilter === 'edit') {
        return lowerAction.includes('edited') || lowerAction.includes('modified') || lowerAction.includes('rollback');
      }
      return true;
    });
  }, [governanceAudits, auditLogTypeFilter]);

  // Autocomplete route suggestions for Centralized Sovereign Router
  const routeSuggestions = useMemo(() => {
    const query = routerInputPath.toLowerCase().trim();
    if (!query) return [];
    
    return WEBPAGES.filter(p => p.id !== 'overview').map(p => {
      const publicPath = getPublicRoute(p.id);
      const adminPath = `/admin/${p.id.replace('-', '/')}`;
      return {
        pageId: p.id,
        label: p.label,
        category: p.category,
        publicPath,
        adminPath
      };
    }).filter(item => 
      item.label.toLowerCase().includes(query) || 
      item.publicPath.toLowerCase().includes(query) || 
      item.adminPath.toLowerCase().includes(query) ||
      item.pageId.toLowerCase().includes(query)
    ).slice(0, 5);
  }, [routerInputPath]);

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-96 space-y-3">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        <span className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
          Retrieving governance chronicles datasets...
        </span>
      </div>
    );
  }

  // ==========================================
  // REPORTER (CREATOR) DASHBOARD WORKSPACE
  // ==========================================
  if (resolvedRole === 'reporter') {
    return (
      <div className="space-y-8 animate-fade-in text-left">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-emerald-950 to-slate-900 p-6 md:p-8 rounded-[32px] text-white relative overflow-hidden shadow-lg">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent pointer-events-none" />
          <div className="space-y-2 relative z-10">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">Contributor Workspace</span>
            <h1 className="text-2xl md:text-3xl font-serif font-black tracking-tight">Preserver {user?.email?.split('@')[0]}</h1>
            <p className="text-xs text-slate-300 max-w-xl font-medium leading-relaxed">
              Help capture and preserve the precious cultural legacy, lore, and history of the Bakenye community. Draft writings, document oral histories, or contribute media assets.
            </p>
          </div>
        </div>

        {/* Reporter Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700/50 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">My Written Articles</p>
              <h3 className="text-3xl font-serif font-black text-slate-900 dark:text-white leading-none">
                {governanceContent.filter(c => c.authorEmail === user?.email && c.pageId === 'heritage-articles').length}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700/50 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Published Live</p>
              <h3 className="text-3xl font-serif font-black text-slate-900 dark:text-white leading-none">
                {governanceContent.filter(c => c.authorEmail === user?.email && c.status === 'published').length}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <BookOpen className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700/50 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pending Vetting</p>
              <h3 className="text-3xl font-serif font-black text-slate-900 dark:text-white leading-none">
                {governanceContent.filter(c => c.authorEmail === user?.email && c.status === 'pending').length}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700/50 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">My Media uploads</p>
              <h3 className="text-3xl font-serif font-black text-slate-900 dark:text-white leading-none">
                {governanceContent.filter(c => c.author === user?.email && c.pageId.includes('gallery')).length}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <ImageIcon className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Creator Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-white dark:bg-slate-800 rounded-[28px] border border-slate-100 dark:border-slate-700/50 p-6 shadow-xs flex flex-col justify-between space-y-6">
            <div className="space-y-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
                <PlusCircle className="w-6 h-6" />
              </div>
              <h3 className="font-serif font-black text-lg text-slate-900 dark:text-white">Draft a Heritage Piece</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Add written chronicles, clan lineage accounts, or linguistic insights. Once submitted, administrators will review it before publishing.
              </p>
            </div>
            <button
              onClick={() => onNavigate('content')}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-wider text-[11px] py-3 rounded-2xl cursor-pointer flex items-center justify-center gap-2 transition-all"
            >
              <span>Go to Content Creator</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-[28px] border border-slate-100 dark:border-slate-700/50 p-6 shadow-xs space-y-4">
            <h3 className="font-serif font-black text-base text-slate-900 dark:text-white">My Submissions Logs</h3>
            <div className="divide-y divide-slate-100 dark:divide-slate-700/40">
              {governanceContent.filter(c => c.authorEmail === user?.email).map(item => (
                <div key={item.id} className="py-3 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-serif font-bold text-slate-800 dark:text-white block">{item.title}</span>
                    <span className="text-[10px] text-slate-400 block">{item.pageId}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                    item.status === 'published' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
                  }`}>{item.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // ELDER (COUNCIL OF ELDERS) WEBSITE GOVERNANCE CENTER
  // ==========================================
  const isOverview = activePageId === 'overview';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-10 animate-fade-in text-left">
      
      {/* REDESIGNED HORIZONTAL WEBSITE ARCHITECTURE GOVERNANCE BAR / NAVIGATION RIBBON */}
      {isOverview && (
        <div className="lg:col-span-12 bg-linear-to-r from-stone-50 via-white to-stone-50/50 dark:from-slate-850 dark:via-slate-800 dark:to-slate-900 rounded-[32px] border border-stone-200/80 dark:border-slate-700/60 p-6 shadow-xl shadow-stone-100/50 dark:shadow-slate-950/20 select-none flex flex-col gap-5 relative overflow-hidden group">
          
          {/* Top Decorative Amber Ribbon */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-amber-500 to-terracotta-500 rounded-t-full" />
          
          {/* Header Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-100 dark:border-slate-850 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-500/10 dark:bg-amber-500/15 rounded-2xl border border-amber-500/20 text-amber-600 dark:text-amber-400">
                <Compass className="w-5 h-5 animate-spin-slow" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-[0.2em] block leading-none">Preservation Tree</span>
                  {totalPendingBacklog > 0 && (
                    <span className="px-1.5 py-0.5 bg-rose-500 text-white rounded text-[8px] font-bold animate-pulse leading-none">
                      {totalPendingBacklog} Audits
                    </span>
                  )}
                </div>
                <h3 className="font-serif font-black text-base text-stone-900 dark:text-white leading-tight mt-1">Governance Compass Ribbon</h3>
              </div>
            </div>

            {/* Compact Search */}
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder="Search sectors, dialects & settings..."
                value={sidebarSearch}
                onChange={(e) => setSidebarSearch(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-700/85 rounded-2xl text-[11px] font-sans font-bold text-stone-800 dark:text-white placeholder-stone-400 dark:placeholder-slate-500 outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all shadow-xs"
              />
            </div>
          </div>

          {/* Categories Ribbon Row */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none scroll-smooth">
            {filteredCategories.map(cat => {
              const isSelected = activeCategoryTab === cat.id;
              const categoryPendingCount = cat.pages.reduce((acc, pId) => acc + (pendingCounts[pId] || 0), 0);

              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategoryTab(cat.id)}
                  className={`px-4.5 py-2.5 rounded-2xl text-[10px] font-extrabold uppercase tracking-widest transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 border ${
                    isSelected
                      ? 'bg-amber-500 border-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
                      : 'bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700/80 text-stone-500 hover:text-stone-900 dark:text-slate-400 dark:hover:text-white hover:bg-stone-50 dark:hover:bg-slate-900/40'
                  }`}
                >
                  <span>{cat.label}</span>
                  {categoryPendingCount > 0 && (
                    <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-slate-950' : 'bg-rose-500'} animate-pulse`} />
                  )}
                </button>
              );
            })}
          </div>

          {/* Subpages / Sectors Pills */}
          <div className="bg-stone-50/50 dark:bg-slate-900/20 border border-stone-150 dark:border-slate-800 p-4 rounded-2xl">
            <div className="flex flex-wrap gap-2.5 items-center">
              {(() => {
                const currentCategory = filteredCategories.find(c => c.id === activeCategoryTab) || filteredCategories[0];
                if (!currentCategory || currentCategory.pages.length === 0) {
                  return <span className="text-[10px] text-stone-400 italic">No preservation sectors match search query in this category.</span>;
                }
                
                return currentCategory.pages.map(pageId => {
                  const p = WEBPAGES.find(wp => wp.id === pageId);
                  if (!p) return null;

                  const isActive = activePageId === pageId;
                  const IconComponent = getPageIcon(p.icon);
                  const pendingCount = pendingCounts[pageId] || 0;

                  return (
                    <button
                      key={pageId}
                      onClick={() => {
                        setActivePageId(pageId);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className={`flex items-center gap-2 py-2 px-4 rounded-xl transition-all font-bold text-[10px] uppercase tracking-wider cursor-pointer border group/btn ${
                        isActive
                          ? 'bg-slate-950 dark:bg-amber-500 border-slate-950 dark:border-amber-500 text-white dark:text-slate-950 font-black shadow-sm'
                          : 'bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700/85 text-stone-600 hover:text-stone-900 dark:text-slate-400 dark:hover:text-white hover:bg-stone-50'
                      }`}
                    >
                      <IconComponent className={`w-3.5 h-3.5 transition-transform group-hover/btn:scale-110 ${isActive ? 'text-amber-400 dark:text-slate-950' : 'text-amber-500'}`} />
                      <span>{p.label}</span>
                      {pendingCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[8px] font-black bg-rose-500 text-white animate-pulse">
                          {pendingCount}
                        </span>
                      )}
                    </button>
                  );
                });
              })()}
            </div>
          </div>

        </div>
      )}

      {/* RIGHT COLUMN: DIRECT PAGE MANAGEMENT WORKSTATION */}
      <main className="lg:col-span-12 flex flex-col gap-6">
        
        {/* Dynamic Breadcrumbs Navigation System */}
        <nav id="governance-breadcrumbs" className="flex flex-wrap items-center gap-2 px-5 py-3.5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-150 dark:border-slate-700/60 shadow-xs text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          {!isOverview && (
            <button
              onClick={() => setActivePageId('overview')}
              className="mr-3 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shadow-amber-500/10 hover:scale-102 active:scale-98"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Directory</span>
            </button>
          )}

          <button 
            onClick={() => setActivePageId('overview')}
            className="hover:text-amber-500 font-extrabold transition-all flex items-center gap-1.5 cursor-pointer text-slate-400 dark:text-slate-500"
          >
            <Globe className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>Governance Sanctuary</span>
          </button>
          
          <ChevronRight className="w-3 h-3 text-slate-350 dark:text-slate-650 shrink-0" />
          
          {activePageId === 'overview' ? (
            <span className="text-slate-800 dark:text-slate-200 font-black">
              Overview Directory Map
            </span>
          ) : (
            <>
              <button
                onClick={() => {
                  setActivePageId('overview');
                }}
                className="hover:text-amber-500 font-extrabold transition-all cursor-pointer text-slate-400 dark:text-slate-500"
              >
                {activePage.category}
              </button>
              
              <ChevronRight className="w-3 h-3 text-slate-350 dark:text-slate-650 shrink-0" />
              
              <span className="text-slate-800 dark:text-slate-200 font-black">
                {activePage.label} Page Studio
              </span>
            </>
          )}
        </nav>

        {activePageId === 'overview' ? (
          <div className="space-y-6 text-left">
            
            {/* Overview Header Banner */}
            <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/90 p-6 md:p-8 rounded-[32px] text-white relative overflow-hidden border border-amber-500/20 shadow-xl shadow-amber-500/5 animate-fade-in">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent pointer-events-none" />
              <div className="absolute -right-16 -bottom-16 w-64 h-64 border-8 border-amber-500/5 rounded-full pointer-events-none" />
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
                <div className="lg:col-span-8 space-y-4">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] font-black uppercase tracking-[0.2em] text-amber-400 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      Respected Elder Council Sanctuary
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-slate-900/40 border border-slate-800 text-[9px] font-mono font-bold text-slate-300">
                      ID: {user?.email?.split('@')[0]}
                    </span>
                  </div>
                  
                  <div className="space-y-1.5">
                    <h1 className="text-2xl md:text-3xl font-serif font-black text-white tracking-tight leading-tight">
                      Webale Kushemererwa, Respected Custodian
                    </h1>
                    <p className="text-xs text-slate-300 max-w-xl font-medium leading-relaxed">
                      As an honored **Elder** of the Bakenyi heritage portal, you possess full sovereignty over the website architecture. Navigate pages using the Left Governance Compass to audit and manage each independently.
                    </p>
                  </div>
                </div>

                <div className="lg:col-span-4 flex flex-col justify-between items-end gap-4">
                  <div className="bg-amber-500/5 border border-amber-500/10 p-4 rounded-2xl w-full text-right shadow-xs">
                    <span className="block text-[9px] text-amber-500 font-black uppercase tracking-widest mb-1.5 font-sans">Ancestral Wisdom</span>
                    <p className="text-[11px] text-amber-100/90 italic leading-relaxed font-serif">
                      "Abagurusi nibo bikwatira enanga ya Bakenye."
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Centralized Sovereign Router Workspace */}
            <div id="centralized-sovereign-router" className="bg-white dark:bg-slate-800 rounded-[28px] border border-slate-150 dark:border-slate-700/60 p-6 shadow-sm space-y-4">
              <div>
                <h3 className="font-serif font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  Sovereign Site Architecture Router
                </h3>
                <p className="text-[11px] text-slate-400">
                  Input any public-facing URL path (e.g. <code>/language/proverbs</code>) or administrative module path (e.g. <code>/admin/heritage/articles</code>) to instantly jump to its workstation.
                </p>
              </div>
              
              <div className="relative">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-[9px] font-black text-slate-400 bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-800">
                      PATH
                    </span>
                    <input
                      type="text"
                      value={routerInputPath}
                      onChange={(e) => setRouterInputPath(e.target.value)}
                      placeholder="Try /language/proverbs or /admin/heritage/articles..."
                      className="w-full pl-16 pr-4 py-3 bg-slate-50 dark:bg-slate-900/40 border border-slate-150 dark:border-slate-700/60 rounded-2xl text-xs font-mono focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-slate-800 dark:text-white transition-all"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && routeSuggestions.length > 0) {
                          setActivePageId(routeSuggestions[0].pageId);
                          setRouterInputPath('');
                        }
                      }}
                    />
                  </div>
                  <button
                    onClick={() => {
                      if (routeSuggestions.length > 0) {
                        setActivePageId(routeSuggestions[0].pageId);
                        setRouterInputPath('');
                      } else {
                        const sanitized = routerInputPath.toLowerCase().trim();
                        const match = WEBPAGES.find(p => {
                          const pub = getPublicRoute(p.id).toLowerCase();
                          const adm = `/admin/${p.id.replace('-', '/')}`.toLowerCase();
                          return pub === sanitized || adm === sanitized || p.id.toLowerCase() === sanitized;
                        });
                        if (match) {
                          setActivePageId(match.id);
                          setRouterInputPath('');
                        } else {
                          alert('Warp route not matched. Please select one of the pages in the visual map below or pick an autocomplete option.');
                        }
                      }
                    }}
                    className="px-5 bg-slate-950 hover:bg-amber-500 text-amber-400 hover:text-slate-950 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer border border-amber-500/10 shrink-0"
                  >
                    Warp Router
                  </button>
                </div>
                
                {/* Autocomplete dropdown suggestions */}
                {routeSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-700/80 rounded-2xl shadow-xl z-50 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 text-left">
                    {routeSuggestions.map(sug => (
                      <div 
                        key={sug.pageId}
                        onClick={() => {
                          setActivePageId(sug.pageId);
                          setRouterInputPath('');
                        }}
                        className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors flex items-center justify-between gap-4 text-xs font-mono"
                      >
                        <div className="min-w-0">
                          <span className="text-[9px] uppercase font-sans font-black text-amber-500 bg-amber-500/5 border border-amber-500/10 px-1.5 py-0.5 rounded mr-2 shrink-0">
                            {sug.category}
                          </span>
                          <strong className="text-slate-800 dark:text-white font-serif font-black pr-2 text-xs uppercase">{sug.label}</strong>
                          <span className="text-[10px] text-slate-400 block sm:inline truncate">
                            Public URL: {sug.publicPath}
                          </span>
                        </div>
                        
                        <div className="text-[10px] text-indigo-500 dark:text-amber-400 font-bold shrink-0 flex items-center gap-1 uppercase font-sans">
                          <span>{sug.pageId}</span>
                          <ArrowRight className="w-3 h-3" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Overall Preservations Metrics cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-150 dark:border-slate-700/60 shadow-xs flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Backlog Queue</p>
                  <h3 className="text-3xl font-serif font-black text-amber-600 dark:text-amber-400 leading-none">{totalPendingBacklog}</h3>
                  <span className="text-[10px] text-slate-400 font-semibold block">Awaiting Elder approvals</span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Inbox className="w-6 h-6 animate-pulse" />
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-150 dark:border-slate-700/60 shadow-xs flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Active Preservers</p>
                  <h3 className="text-3xl font-serif font-black text-slate-900 dark:text-white leading-none">
                    {users.filter(u => u.status === 'active').length || 4}
                  </h3>
                  <span className="text-[10px] text-slate-400 font-semibold block">Verified registrars</span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-150 dark:border-slate-700/60 shadow-xs flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Chronicle Records</p>
                  <h3 className="text-3xl font-serif font-black text-slate-900 dark:text-white leading-none">
                    {governanceContent.filter(c => c.status === 'published').length}
                  </h3>
                  <span className="text-[10px] text-slate-400 font-semibold block">Active published blocks</span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <BookOpen className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-150 dark:border-slate-700/60 shadow-xs flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Preservation Integrity</p>
                  <h3 className="text-3xl font-serif font-black text-emerald-600 dark:text-emerald-400 leading-none">98.2%</h3>
                  <span className="text-[10px] text-slate-400 font-semibold block">Error-free validation index</span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Visual Governance Architecture Map Portal */}
            <GovernanceMap
              pages={WEBPAGES}
              contentItems={governanceContent}
              pendingCounts={pendingCounts}
              onSelectPage={(pageId) => {
                setActivePageId(pageId);
                // Scroll page top
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />

            {/* Interactive Automated Audit Log Feed */}
            <div id="automated-audit-feed" className="bg-white dark:bg-slate-800 rounded-[28px] border border-slate-150 dark:border-slate-700/60 p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-700/40 pb-4">
                <div>
                  <h3 className="font-serif font-black text-base text-slate-900 dark:text-white">
                    Sovereign Platform Audit Feed
                  </h3>
                  <p className="text-xs text-slate-400">
                    Real-time visual capture of Bakenyi platform adjustments, Elder approvals, and archived heritage items.
                  </p>
                </div>
                
                {/* Filter for logs by specific type */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-black uppercase text-slate-400">Domain Filter:</span>
                  <select
                    value={auditLogTypeFilter}
                    onChange={(e) => setAuditLogTypeFilter(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-700/60 rounded-xl px-2.5 py-1.5 text-[10px] font-bold text-slate-600 dark:text-slate-300 outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="all">All Content Actions</option>
                    <option value="proverb">Proverbs Section</option>
                    <option value="dictionary">Dictionary Section</option>
                    <option value="article">Heritage Articles</option>
                    <option value="totem">Totem Registries</option>
                    <option value="approve">Approvals & Publishes</option>
                    <option value="edit">Edits & Modifications</option>
                  </select>
                </div>
              </div>
              
              <div className="divide-y divide-slate-100 dark:divide-slate-800/40 max-h-[380px] overflow-y-auto pr-1">
                {filteredAudits.map(log => {
                  const p = WEBPAGES.find(wp => wp.id === log.pageId);
                  const isWarning = log.status === 'Warning' || log.action.toLowerCase().includes('reject') || log.action.toLowerCase().includes('delete');
                  
                  return (
                    <div 
                      key={log.id} 
                      onClick={() => {
                        if (log.pageId) {
                          setActivePageId(log.pageId);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                      }}
                      className="py-3.5 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 px-2 rounded-2xl transition-all cursor-pointer flex items-start justify-between gap-3 group"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Status pill */}
                          <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider ${
                            isWarning 
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' 
                              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          }`}>
                            {log.action}
                          </span>
                          
                          {p && (
                            <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                              In {p.category} &gt; {p.label}
                            </span>
                          )}
                        </div>
                        
                        <p className="text-xs font-serif font-black text-slate-800 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                          {log.details}
                        </p>
                        
                        <div className="text-[9px] text-slate-400 font-mono">
                          Operator: <strong className="text-slate-500 dark:text-slate-300 font-bold">{log.actor}</strong>
                        </div>
                      </div>
                      
                      <div className="text-right shrink-0">
                        <span className="text-[9px] text-slate-400 font-mono block">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="text-[8px] font-mono text-slate-400 block pt-0.5">
                          {new Date(log.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                        <span className="text-[9px] text-indigo-500 dark:text-amber-400 font-bold uppercase group-hover:translate-x-1.5 transition-transform inline-flex items-center gap-0.5 mt-2">
                          Manage &rarr;
                        </span>
                      </div>
                    </div>
                  );
                })}
                
                {filteredAudits.length === 0 && (
                  <div className="text-center py-12 text-xs text-slate-400 font-semibold">
                    No matching activity logs recorded for this select filter.
                  </div>
                )}
              </div>
            </div>

          </div>
        ) : (
          <PageWorkstation
            page={activePage}
            contentItems={governanceContent}
            onSaveItems={handleSaveContent}
            auditLogs={governanceAudits}
            onAddAuditLog={handleAddAuditLog}
            versions={governanceVersions}
            onAddVersion={handleAddVersion}
            onRestoreVersion={handleAddVersion} // saves old version in registry
          />
        )}
      </main>

    </div>
  );
}
