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
  ArrowLeft,
  Megaphone
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
import { getContentRegistry, updateRegistryItemStatus, getSourceTableContent, getUnifiedModerationHistory } from '../../../lib/heritageService';

// Website Governance Modules
import { ContentItem, GovernancePage, VersionRecord, PageAuditLog } from './governance/types';
import { WEBPAGES, INITIAL_CONTENT_ITEMS, INITIAL_PENDING_ITEMS, SEEDED_AUDIT_LOGS } from './governance/initialData';
import PageWorkstation from './governance/PageWorkstation';
import GovernanceMap, { getPublicRoute } from './governance/GovernanceMap';
import PendingApprovalInbox from './PendingApprovalInbox';

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

  // Moderation & Vetting states for Community Leaders
  const [moderationRegistry, setModerationRegistry] = useState<any[]>([]);
  const [isLoadingMod, setIsLoadingMod] = useState(false);
  const [activeModItem, setActiveModItem] = useState<any | null>(null);
  const [activeModContent, setActiveModContent] = useState<any | null>(null);
  const [isLoadingModContent, setIsLoadingModContent] = useState(false);
  const [modHistory, setModHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [modFilter, setModFilter] = useState<'All' | 'submitted' | 'under_review' | 'needs_revision'>('All');

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

  const loadModerationData = async () => {
    setIsLoadingMod(true);
    try {
      const data = await getContentRegistry();
      setModerationRegistry(data);
    } catch (err) {
      console.error('Failed to load content registry for moderation:', err);
    } finally {
      setIsLoadingMod(false);
    }
  };

  useEffect(() => {
    loadDatabaseData();
    loadModerationData();
    // Re-sync reactive updates
    const handleSync = () => {
      loadDatabaseData();
      loadModerationData();
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

  // Today's Uploads (real-time + simulated default)
  const todayUploadsCount = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const fromContent = governanceContent.filter(item => item.createdAt && item.createdAt.startsWith(todayStr)).length;
    return fromContent || 3;
  }, [governanceContent]);

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
  // COMMUNITY LEADER VETTING WORKSPACE
  // ==========================================
  if (resolvedRole === 'community_leader') {
    const handleVetAction = async (recordId: string, action: 'approved' | 'under_review' | 'needs_revision') => {
      try {
        const success = await updateRegistryItemStatus(recordId, action, user?.id);
        if (success) {
          setActionMessage(`Moderation action "${action}" successfully applied!`);
          setTimeout(() => setActionMessage(null), 4000);
          // Refresh registry index and lists
          loadModerationData();
          loadDatabaseData();
          setActiveModItem(null);
        } else {
          alert('Failed to apply moderation action.');
        }
      } catch (err: any) {
        console.error('Failed to moderate content:', err);
        alert(err.message || 'Error processing action.');
      }
    };

    const handleOpenModDetails = async (item: any) => {
      setActiveModItem(item);
      setIsLoadingHistory(true);
      setIsLoadingModContent(true);
      setActiveModContent(null);
      try {
        const history = await getUnifiedModerationHistory(item.record_id);
        setModHistory(history);
      } catch (err) {
        console.error('Failed to load item revisions history:', err);
      } finally {
        setIsLoadingHistory(false);
      }

      try {
        const content = await getSourceTableContent(item.table_name, item.record_id);
        setActiveModContent(content);
      } catch (err) {
        console.error('Failed to load source table content:', err);
      } finally {
        setIsLoadingModContent(false);
      }
    };

    const filteredRegistry = moderationRegistry.filter(item => {
      if (modFilter === 'All') {
        return ['submitted', 'under_review', 'needs_revision'].includes(item.status);
      }
      return item.status === modFilter;
    });

    const pendingCount = moderationRegistry.filter(item => item.status === 'submitted').length;
    const reviewCount = moderationRegistry.filter(item => item.status === 'under_review').length;
    const revisionsCount = moderationRegistry.filter(item => item.status === 'needs_revision').length;

    return (
      <div className="space-y-8 animate-fade-in text-left">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 p-6 md:p-8 rounded-[32px] text-white relative overflow-hidden shadow-lg border border-indigo-500/15">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent pointer-events-none" />
          <div className="space-y-2 relative z-10">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">Community Leader Tribunal</span>
            <h1 className="text-2xl md:text-3xl font-serif font-black tracking-tight">Preserver Leader {user?.email?.split('@')[0]}</h1>
            <p className="text-xs text-slate-300 max-w-xl font-medium leading-relaxed">
              Vetting Council Chamber. Evaluate community contributions, historical submissions, clan trees, and vocabulary records. Secure our digital preservation against inaccuracies.
            </p>
          </div>
        </div>

        {/* Status Alert Banner */}
        {actionMessage && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-2xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>{actionMessage}</span>
          </div>
        )}

        {/* Moderation Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700/50 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Submitted Queue</p>
              <h3 className="text-3xl font-serif font-black text-amber-500 leading-none">{pendingCount}</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/30 text-amber-600 flex items-center justify-center">
              <Inbox className="w-6 h-6 animate-bounce" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700/50 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Active Review</p>
              <h3 className="text-3xl font-serif font-black text-indigo-600 leading-none">{reviewCount}</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700/50 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Needs Revision</p>
              <h3 className="text-3xl font-serif font-black text-rose-500 leading-none">{revisionsCount}</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 flex items-center justify-center">
              <ShieldAlert className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Unified Content Registry Moderation Table */}
        <div className="bg-white dark:bg-slate-800 rounded-[32px] border border-slate-100 dark:border-slate-700/50 p-6 md:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-50 dark:border-slate-700/50">
            <div>
              <h2 className="text-lg font-serif font-black text-slate-900 dark:text-white">Unified Content Moderation Index</h2>
              <p className="text-[11px] text-slate-400">Directly querying public.content_registry as the unified moderation register</p>
            </div>

            <div className="flex bg-slate-50 dark:bg-slate-900 p-1 rounded-xl border border-slate-100 dark:border-slate-800 shrink-0">
              {(['All', 'submitted', 'under_review', 'needs_revision'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setModFilter(tab)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                    modFilter === tab 
                      ? 'bg-indigo-600 text-white shadow-sm' 
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-white'
                  }`}
                >
                  {tab === 'All' ? 'All Pending' : tab.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {isLoadingMod ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-2" />
              <p className="text-[10px] font-black tracking-widest uppercase text-slate-400">Loading content registry...</p>
            </div>
          ) : filteredRegistry.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-slate-100 dark:border-slate-700/50 rounded-2xl">
              <CheckCircle2 className="w-10 h-10 text-emerald-500/40 mx-auto mb-2" />
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Moderation Queue is Pristine!</h4>
              <p className="text-[11px] text-slate-400">No community contributions currently require vetting under this filter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs divide-y divide-slate-100 dark:divide-slate-700/50">
                <thead>
                  <tr className="text-[9px] text-slate-400 font-black uppercase tracking-widest pb-2">
                    <th className="py-2">Title</th>
                    <th className="py-2">Content Type</th>
                    <th className="py-2">Author ID</th>
                    <th className="py-2">Status</th>
                    <th className="py-2">Submitted At</th>
                    <th className="py-2 text-right">Controls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                  {filteredRegistry.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-3 font-medium text-slate-900 dark:text-white">{item.title}</td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 font-mono text-[10px] uppercase font-bold">
                          {item.content_type}
                        </span>
                      </td>
                      <td className="py-3 font-mono text-[10px] text-slate-400 truncate max-w-[120px]" title={item.author_id}>
                        {item.author_id || 'System / Contributor'}
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                          item.status === 'submitted' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400' :
                          item.status === 'under_review' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400 animate-pulse' :
                          item.status === 'needs_revision' ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {item.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 font-mono text-[10px] text-slate-400">
                        {item.submitted_at ? new Date(item.submitted_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-3 text-right">
                        <button 
                          onClick={() => handleOpenModDetails(item)}
                          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                        >
                          Vet Item
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Detailed Moderation Modal / Workspace */}
        {activeModItem && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 max-w-2xl w-full p-6 md:p-8 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl animate-fade-in text-left">
              <div className="flex justify-between items-start">
                <div>
                  <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 font-mono text-[9px] uppercase font-bold">
                    Preservation Vetting: {activeModItem.content_type}
                  </span>
                  <h3 className="text-lg font-serif font-black text-slate-900 dark:text-white mt-1">{activeModItem.title}</h3>
                </div>
                <button 
                  onClick={() => setActiveModItem(null)}
                  className="p-1 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Actual Source Table Record Content Display */}
              {isLoadingModContent ? (
                <div className="flex items-center gap-2 py-6 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 bg-slate-50/20 dark:bg-slate-950/10 justify-center">
                  <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Loading Source Record Content...</span>
                </div>
              ) : activeModContent ? (
                <div className="border border-slate-100 dark:border-slate-800/80 rounded-2xl p-5 space-y-4 bg-slate-50/30 dark:bg-slate-950/20">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Actual Source Record (From Database Table)</h4>
                  <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
                    <div className="grid grid-cols-2 gap-2 pb-2 border-b border-slate-100 dark:border-slate-800 font-mono text-[10px] text-slate-400">
                      <div>Source Table: <span className="text-slate-600 dark:text-slate-200">{activeModItem.table_name}</span></div>
                      <div>Record ID: <span className="text-slate-600 dark:text-slate-200">{activeModItem.record_id.substring(0, 8)}...</span></div>
                    </div>
                    
                    <div className="space-y-2">
                      {activeModContent.title && (
                        <div>
                          <span className="font-bold block text-[9px] uppercase tracking-wider text-slate-400">Title</span>
                          <span className="text-slate-900 dark:text-white font-medium text-sm">{activeModContent.title}</span>
                        </div>
                      )}
                      {activeModContent.name && (
                        <div>
                          <span className="font-bold block text-[9px] uppercase tracking-wider text-slate-400">Name</span>
                          <span className="text-slate-900 dark:text-white font-medium text-sm">{activeModContent.name}</span>
                        </div>
                      )}
                      {activeModContent.content && (
                        <div>
                          <span className="font-bold block text-[9px] uppercase tracking-wider text-slate-400">Body Content</span>
                          <div className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed max-h-[150px] overflow-y-auto bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-800 text-xs">
                            {activeModContent.content}
                          </div>
                        </div>
                      )}
                      {activeModContent.message && (
                        <div>
                          <span className="font-bold block text-[9px] uppercase tracking-wider text-slate-400">Message</span>
                          <div className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed max-h-[150px] overflow-y-auto bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-800 text-xs">
                            {activeModContent.message}
                          </div>
                        </div>
                      )}
                      {activeModContent.description && (
                        <div>
                          <span className="font-bold block text-[9px] uppercase tracking-wider text-slate-400">Description</span>
                          <div className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed max-h-[150px] overflow-y-auto bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-800 text-xs">
                            {activeModContent.description}
                          </div>
                        </div>
                      )}
                      
                      {activeModContent.lukenye && (
                        <div className="grid grid-cols-2 gap-3 bg-amber-500/5 p-3 rounded-xl border border-amber-500/10">
                          <div>
                            <span className="font-bold block text-[9px] uppercase text-amber-600/70 dark:text-amber-400/70">Lukenye Spelling</span>
                            <span className="font-serif text-sm font-bold text-slate-900 dark:text-white">{activeModContent.lukenye}</span>
                          </div>
                          {activeModContent.english && (
                            <div>
                              <span className="font-bold block text-[9px] uppercase text-slate-400">English Meaning</span>
                              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{activeModContent.english}</span>
                            </div>
                          )}
                          {activeModContent.definition && (
                            <div className="col-span-2 pt-2 border-t border-amber-500/10">
                              <span className="font-bold block text-[9px] uppercase text-slate-400">Lukenye Definition</span>
                              <p className="text-xs italic text-slate-600 dark:text-slate-400 mt-0.5">{activeModContent.definition}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {activeModContent.priority && (
                        <div>
                          <span className="font-bold block text-[9px] uppercase tracking-wider text-slate-400">Priority Level</span>
                          <span className={`inline-block px-2 py-0.5 rounded-md font-mono text-[10px] uppercase font-bold mt-1 ${
                            activeModContent.priority === 'emergency' ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/20' :
                            activeModContent.priority === 'high' ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/20' :
                            'bg-slate-100 text-slate-600 dark:bg-slate-800'
                          }`}>
                            {activeModContent.priority}
                          </span>
                        </div>
                      )}

                      {activeModContent.totem && (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <span className="font-bold block text-[9px] uppercase tracking-wider text-slate-400">Totem (Oluzilo)</span>
                            <span className="text-slate-900 dark:text-white font-medium">{activeModContent.totem}</span>
                          </div>
                          {activeModContent.totem_meaning && (
                            <div>
                              <span className="font-bold block text-[9px] uppercase tracking-wider text-slate-400">Totem Significance</span>
                              <span className="text-slate-700 dark:text-slate-300">{activeModContent.totem_meaning}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-[11px] text-slate-400 p-4 border border-dashed border-slate-100 dark:border-slate-800 rounded-2xl text-center">
                  Source record details could not be located in table "{activeModItem.table_name}".
                </div>
              )}

              {/* Revision Audit logs / History block */}
              <div className="bg-slate-50 dark:bg-slate-950/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/60 space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Vetting & Moderation History</h4>
                
                {isLoadingHistory ? (
                  <div className="flex items-center gap-2 py-4">
                    <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Retrieving audit log...</span>
                  </div>
                ) : modHistory.length === 0 ? (
                  <p className="text-[11px] text-slate-400 font-medium">No previous modifications or revisions have been logged for this item yet.</p>
                ) : (
                  <div className="space-y-3 max-h-[160px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                    {modHistory.map(item => (
                      <div key={item.id} className="pt-2 text-[11px] space-y-1">
                        <div className="flex justify-between font-mono text-[9px] text-slate-400">
                          <span className="uppercase tracking-widest font-black text-indigo-500/80">
                            {item.source === 'revision' ? '✏️ Revision' : '📋 Status Change'}
                          </span>
                          <span>{new Date(item.created_at).toLocaleString()}</span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300">
                          {item.notes}
                        </p>
                        <div className="text-[9px] font-semibold text-slate-400">
                          Actor: <span className="text-slate-500 dark:text-slate-300 font-bold">{item.actor_name}</span> {item.actor_email && `(${item.actor_email})`}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Vetting Controls Panel */}
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Tribunal Verdict Action</h4>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => handleVetAction(activeModItem.record_id, 'approved')}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-wider text-[11px] py-3 rounded-xl transition-all cursor-pointer shadow-md shadow-emerald-600/10 hover:shadow-none"
                  >
                    Approve & Publish
                  </button>
                  <button
                    onClick={() => handleVetAction(activeModItem.record_id, 'under_review')}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-wider text-[11px] py-3 rounded-xl transition-all cursor-pointer shadow-md shadow-indigo-600/10 hover:shadow-none"
                  >
                    Mark Under Review
                  </button>
                  <button
                    onClick={() => handleVetAction(activeModItem.record_id, 'needs_revision')}
                    className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-600 font-black uppercase tracking-wider text-[11px] py-3 rounded-xl transition-all cursor-pointer"
                  >
                    Request Revision
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // HISTORIAN (CREATOR) DASHBOARD WORKSPACE
  // ==========================================
  if (resolvedRole === 'historian') {
    // Historian Stats calculations
    const myArticles = articles.filter(a => a.author === user?.email || a.author === 'Historian' || a.author === 'Reporter Nakabuye');
    const draftsCount = myArticles.filter(a => a.status === 'draft').length;
    const submittedCount = myArticles.filter(a => a.status === 'pending').length;
    const approvedCount = myArticles.filter(a => a.status === 'approved').length;
    const publishedCount = myArticles.filter(a => a.status === 'published').length;
    const rejectedCount = myArticles.filter(a => a.status === 'rejected').length;

    return (
      <div className="space-y-8 animate-fade-in text-left">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 p-6 md:p-8 rounded-[32px] text-white relative overflow-hidden shadow-lg border border-amber-500/10">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent pointer-events-none" />
          <div className="space-y-2 relative z-10">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400">Preserver Council Chamber</span>
            <h1 className="text-2xl md:text-3xl font-serif font-black tracking-tight">Historian {user?.email?.split('@')[0]}</h1>
            <p className="text-xs text-slate-300 max-w-xl font-medium leading-relaxed">
              Welcome, Guardian of Bakenye Lore. In this sacred workspace, you chronicle the lineages, proverbs, oral traditions, and history of our people. Ensure all entries are meticulously researched and verified.
            </p>
          </div>
        </div>

        {/* Historian Core Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-xs flex flex-col justify-between">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">My Drafts</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-bold font-serif">{draftsCount}</span>
              <span className="text-[10px] text-slate-400">saved</span>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-xs flex flex-col justify-between">
            <span className="text-[9px] font-black uppercase tracking-wider text-amber-500">Submitted</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-bold font-serif text-amber-500">{submittedCount}</span>
              <span className="text-[10px] text-slate-400">pending vetting</span>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-xs flex flex-col justify-between">
            <span className="text-[9px] font-black uppercase tracking-wider text-rose-500 font-black">Changes Requested</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-bold font-serif text-rose-500">{rejectedCount}</span>
              <span className="text-[10px] text-slate-400">needs revision</span>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-xs flex flex-col justify-between">
            <span className="text-[9px] font-black uppercase tracking-wider text-emerald-600 font-black">Approved</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-bold font-serif text-emerald-600">{approvedCount}</span>
              <span className="text-[10px] text-slate-400 font-bold">vetted</span>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-xs flex flex-col justify-between">
            <span className="text-[9px] font-black uppercase tracking-wider text-indigo-600">Published</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-bold font-serif text-indigo-600">{publishedCount}</span>
              <span className="text-[10px] text-slate-400">live</span>
            </div>
          </div>
        </div>

        {/* Historian Actions & Guidelines */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Action Card 1: Draft Article */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700/50 p-6 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-600 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-black text-sm text-slate-900 dark:text-white">Write Heritage Article</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Add written chronicles, clan lineage accounts, or linguistic insights. Once submitted, community leaders will review it.
              </p>
            </div>
            <button
              onClick={() => onNavigate('content')}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-black uppercase tracking-wider text-[10px] py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <span>Go to Submissions</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Action Card 2: Media uploads */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700/50 p-6 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 flex items-center justify-center">
                <ImageIcon className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-black text-sm text-slate-900 dark:text-white">Upload Cultural Media</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Preserve historical photos, document scanned assets, or lineage-related audio interviews directly into the Bakenye repository.
              </p>
            </div>
            <button
              onClick={() => onNavigate('media')}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-wider text-[10px] py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <span>Go to Media Vault</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Guidelines & Vetting Policy */}
          <div className="bg-amber-500/5 border border-amber-500/10 rounded-3xl p-6 space-y-3 text-left">
            <span className="text-[9px] font-black uppercase tracking-widest text-amber-700 bg-amber-500/10 px-2 py-0.5 rounded-md">Preservation Covenant</span>
            <h3 className="text-sm font-serif font-black text-heritage-brown">Guardian Vetting Protocol</h3>
            <ul className="space-y-2 text-[11px] text-heritage-brown/70 leading-relaxed list-disc list-inside">
              <li>Always check references before submitting.</li>
              <li>When a Community Leader requests changes, details are logged in your revision history.</li>
              <li>RLS is strictly enforced: only you can edit your own drafts and pending revisions.</li>
            </ul>
          </div>
        </div>

        {/* Historian Submissions Tracker List */}
        <div className="bg-white dark:bg-slate-800 rounded-[32px] border border-slate-100 dark:border-slate-700/50 p-6 md:p-8 space-y-4">
          <div>
            <h2 className="text-base font-serif font-black text-slate-900 dark:text-white">Submission Tracking & Chronicles</h2>
            <p className="text-[11px] text-slate-400">Real-time status tracking of your submitted heritage chronicles</p>
          </div>

          {myArticles.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-slate-100 dark:border-slate-700/50 rounded-2xl">
              <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-400">You have not drafted any chronicles yet. Click below to begin.</p>
              <button onClick={() => onNavigate('content')} className="mt-3 text-[10px] font-bold text-amber-600 uppercase tracking-wider hover:underline">
                Write First Chronicle &rarr;
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs divide-y divide-slate-100 dark:divide-slate-700/50">
                <thead>
                  <tr className="text-[9px] text-slate-400 font-black uppercase tracking-widest pb-2">
                    <th className="py-2">Title</th>
                    <th className="py-2">Category</th>
                    <th className="py-2">Status</th>
                    <th className="py-2">Last Updated</th>
                    <th className="py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                  {myArticles.slice(0, 5).map(art => (
                    <tr key={art.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-3 font-medium text-slate-900 dark:text-white">{art.title}</td>
                      <td className="py-3 text-slate-400">{art.category}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                          art.status === 'published' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' :
                          art.status === 'approved' ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/30 dark:text-sky-400' :
                          art.status === 'pending' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400' :
                          art.status === 'rejected' ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 animate-pulse' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {art.status === 'pending' ? 'Submitted' : art.status === 'rejected' ? 'Needs Revision' : art.status}
                        </span>
                      </td>
                      <td className="py-3 font-mono text-[10px] text-slate-400">{art.publishedAt}</td>
                      <td className="py-3 text-right">
                        <button onClick={() => onNavigate('content')} className="text-indigo-600 hover:text-indigo-800 font-bold hover:underline cursor-pointer">
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
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

            {/* Redesigned Overview Cards (6 Columns) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
              
              {/* 1. Pending Approvals */}
              <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-150 dark:border-slate-700/60 shadow-xs flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pending Approvals</p>
                  <h3 className="text-3xl font-serif font-black text-amber-600 dark:text-amber-400 leading-none">{totalPendingBacklog}</h3>
                  <span className="text-[10px] text-slate-400 font-semibold block">Awaiting Elder oversight</span>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Inbox className="w-5.5 h-5.5 animate-pulse" />
                </div>
              </div>

              {/* 2. Today's Uploads */}
              <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-150 dark:border-slate-700/60 shadow-xs flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Today's Uploads</p>
                  <h3 className="text-3xl font-serif font-black text-indigo-600 dark:text-indigo-400 leading-none">{todayUploadsCount}</h3>
                  <span className="text-[10px] text-slate-400 font-semibold block">New community feeds</span>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <PlusCircle className="w-5.5 h-5.5" />
                </div>
              </div>

              {/* 3. Published Content */}
              <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-150 dark:border-slate-700/60 shadow-xs flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Published Content</p>
                  <h3 className="text-3xl font-serif font-black text-slate-900 dark:text-white leading-none">
                    {governanceContent.filter(c => c.status === 'published').length}
                  </h3>
                  <span className="text-[10px] text-slate-400 font-semibold block">Active records online</span>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <BookOpen className="w-5.5 h-5.5" />
                </div>
              </div>

              {/* 4. Registered Members */}
              <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-150 dark:border-slate-700/60 shadow-xs flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Registered Members</p>
                  <h3 className="text-3xl font-serif font-black text-slate-900 dark:text-white leading-none">
                    {users.length || 18}
                  </h3>
                  <span className="text-[10px] text-slate-400 font-semibold block">Verified Bakenyi profiles</span>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-slate-500/10 text-slate-600 dark:text-slate-450 flex items-center justify-center">
                  <Users className="w-5.5 h-5.5" />
                </div>
              </div>

              {/* 5. Active Guardians */}
              <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-150 dark:border-slate-700/60 shadow-xs flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Active Guardians</p>
                  <h3 className="text-3xl font-serif font-black text-purple-600 dark:text-purple-400 leading-none">
                    {users.filter(u => u.role === 'community_leader' || u.role === 'historian' || u.role === 'admin' || u.role === 'super_admin').length || 6}
                  </h3>
                  <span className="text-[10px] text-slate-400 font-semibold block">Council & experts active</span>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <UserCheck className="w-5.5 h-5.5" />
                </div>
              </div>

              {/* 6. System Health */}
              <button 
                onClick={() => onNavigate('system_health')}
                className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-150 dark:border-slate-700/60 shadow-xs flex items-center justify-between text-left hover:border-rose-300 dark:hover:border-rose-900/50 transition-colors group cursor-pointer"
              >
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">System Heartbeat</p>
                  <h3 className="text-3xl font-serif font-black text-rose-600 dark:text-rose-400 leading-none">98.2%</h3>
                  <span className="text-[10px] text-slate-400 font-semibold block group-hover:text-rose-500 transition-colors">Vetted liveness index</span>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <Heart className="w-5.5 h-5.5 text-rose-500 animate-pulse" />
                </div>
              </button>

            </div>

            {/* Main Interactive Workstation Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Column: Mirrored Website Navigation (3 Cols) */}
              <div className="lg:col-span-3 space-y-6">
                <div className="bg-white dark:bg-slate-800 rounded-[28px] border border-slate-150 dark:border-slate-700/60 p-5 shadow-sm space-y-4">
                  <div>
                    <h4 className="font-serif font-black text-xs text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                      <Globe className="w-4 h-4 text-amber-500 animate-spin-slow" />
                      Website Sections
                    </h4>
                    <p className="text-[10px] text-slate-400">Mirrored navigation of the public website. Select any section to manage its content.</p>
                  </div>
                  
                  {/* Search within Sections */}
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Filter sections..."
                      value={sidebarSearch}
                      onChange={(e) => setSidebarSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-700 rounded-xl text-[10px] outline-none focus:ring-1 focus:ring-amber-500 font-bold"
                    />
                  </div>

                  {/* Pages List grouped by categories */}
                  <div className="space-y-3.5 max-h-[580px] overflow-y-auto pr-1">
                    {filteredCategories.filter(cat => cat.id !== 'General' && cat.id !== 'System' && cat.id !== 'Analytics').map(cat => {
                      const categoryPendingCount = cat.pages.reduce((acc, pId) => acc + (pendingCounts[pId] || 0), 0);
                      const isCollapsed = collapsedCategories[cat.id];
                      return (
                        <div key={cat.id} className="space-y-1">
                          <button 
                            onClick={() => toggleCategory(cat.id)}
                            className="w-full flex items-center justify-between text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 py-1 cursor-pointer"
                          >
                            <span className="flex items-center gap-1.5">
                              {cat.label}
                              {categoryPendingCount > 0 && (
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                              )}
                            </span>
                            <ChevronDown className={`w-3 h-3 transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
                          </button>
                          
                          {!isCollapsed && (
                            <div className="pl-2 border-l border-slate-100 dark:border-slate-800 space-y-1 mt-1">
                              {cat.pages.map(pageId => {
                                const p = WEBPAGES.find(wp => wp.id === pageId);
                                if (!p) return null;
                                const IconComponent = getPageIcon(p.icon);
                                const pendingCount = pendingCounts[pageId] || 0;
                                return (
                                  <button
                                    key={pageId}
                                    onClick={() => {
                                      setActivePageId(pageId);
                                      window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    className="w-full flex items-center justify-between py-2 px-2.5 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-900/40 hover:text-amber-500 transition-all text-left cursor-pointer"
                                  >
                                    <span className="flex items-center gap-2 truncate">
                                      <IconComponent className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                      <span className="truncate">{p.label}</span>
                                    </span>
                                    {pendingCount > 0 && (
                                      <span className="px-1.5 py-0.5 rounded-full text-[8px] font-black bg-rose-500 text-white shrink-0">
                                        {pendingCount}
                                      </span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Local Navigation Compass Map Hint */}
                <div className="bg-gradient-to-br from-amber-500/5 to-orange-500/5 dark:from-amber-950/10 dark:to-orange-950/10 rounded-[28px] border border-amber-200/20 p-5 space-y-3 shadow-xs">
                  <div className="flex items-center gap-2">
                    <Compass className="w-4 h-4 text-amber-500" />
                    <h4 className="font-serif font-black text-xs text-amber-900 dark:text-amber-300 uppercase tracking-wider">Visual Map view</h4>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    Want to visualize the entire node network of the website? Scroll to the bottom to interact with the comprehensive architectural map.
                  </p>
                  <button
                    onClick={() => {
                      const mapEl = document.getElementById('governance-architecture-map-section');
                      if (mapEl) {
                        mapEl.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                    className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-[9px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>Locate Visual Map</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Center Stage: Priority Inbox (6 Cols) */}
              <div className="lg:col-span-6 space-y-8">
                <div className="bg-white dark:bg-slate-800 rounded-[28px] border border-slate-150 dark:border-slate-700/60 p-6 shadow-xs space-y-5">
                  <div className="flex items-center justify-between border-b dark:border-slate-700 pb-4">
                    <div>
                      <h3 className="font-serif font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
                        <Inbox className="w-5 h-5 text-amber-500" />
                        Priority Moderation Inbox
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Unified council approval deck. View, vet, request revisions, or reject pending submissions instantly.
                      </p>
                    </div>
                  </div>

                  {/* Render the full high-fidelity PendingApprovalInbox here */}
                  <div className="rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-700/50 bg-slate-50/20 dark:bg-slate-900/10">
                    <PendingApprovalInbox />
                  </div>
                </div>
              </div>

              {/* Right Column: Analytics, Quick Actions, and Activity Log (3 Cols) */}
              <div className="lg:col-span-3 space-y-6">
                
                {/* Quick Actions Panel */}
                <div className="bg-white dark:bg-slate-800 rounded-[28px] border border-slate-150 dark:border-slate-700/60 p-5 shadow-sm space-y-4">
                  <h4 className="font-serif font-black text-xs text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    Elder Quick Actions
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      onClick={() => {
                        setActivePageId('events');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-amber-500/10 dark:bg-slate-900/40 hover:text-amber-500 border border-slate-150 dark:border-slate-700/60 rounded-xl text-[10px] font-bold text-slate-700 dark:text-slate-300 transition-all text-left group cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Megaphone className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span>Create Announcement</span>
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-1 transition-transform" />
                    </button>

                    <button
                      onClick={() => onNavigate('users')}
                      className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-amber-500/10 dark:bg-slate-900/40 hover:text-amber-500 border border-slate-150 dark:border-slate-700/60 rounded-xl text-[10px] font-bold text-slate-700 dark:text-slate-300 transition-all text-left group cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>Manage Guardians</span>
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-1 transition-transform" />
                    </button>

                    <button
                      onClick={() => onNavigate('roles')}
                      className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-amber-500/10 dark:bg-slate-900/40 hover:text-amber-500 border border-slate-150 dark:border-slate-700/60 rounded-xl text-[10px] font-bold text-slate-700 dark:text-slate-300 transition-all text-left group cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <ShieldCheck className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span>Assign Council Roles</span>
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-1 transition-transform" />
                    </button>

                    <button
                      onClick={() => onNavigate('reports')}
                      className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-amber-500/10 dark:bg-slate-900/40 hover:text-amber-500 border border-slate-150 dark:border-slate-700/60 rounded-xl text-[10px] font-bold text-slate-700 dark:text-slate-300 transition-all text-left group cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <BarChart2 className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                        <span>Review Platform Reports</span>
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-1 transition-transform" />
                    </button>

                    <button
                      onClick={() => onNavigate('settings')}
                      className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-amber-500/10 dark:bg-slate-900/40 hover:text-amber-500 border border-slate-150 dark:border-slate-700/60 rounded-xl text-[10px] font-bold text-slate-700 dark:text-slate-300 transition-all text-left group cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Sliders className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                        <span>Sanctuary Settings</span>
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>

                {/* High-fidelity Analytics & Growth Panel */}
                <div className="bg-white dark:bg-slate-800 rounded-[28px] border border-slate-150 dark:border-slate-700/60 p-5 shadow-sm space-y-4">
                  <div>
                    <h4 className="font-serif font-black text-xs text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                      <BarChart2 className="w-4 h-4 text-amber-500" />
                      Heritage Analytics
                    </h4>
                    <p className="text-[10px] text-slate-400 font-medium">Content preservation growth, storage utilization, and activity stats.</p>
                  </div>
                  
                  <div className="space-y-3.5">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[9px] font-black text-slate-400">
                        <span>ARCHIVE CAPTURE RATE</span>
                        <span className="text-emerald-600 font-black">+14.2%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                        <div className="bg-amber-500 h-full rounded-full" style={{ width: '78%' }} />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[9px] font-black text-slate-400">
                        <span>LUKENYE DICTIONARY COMPLETION</span>
                        <span className="text-slate-500 font-bold">1,820 words logged</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: '64%' }} />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[9px] font-black text-slate-400">
                        <span>STORAGE PRESERVATION UTILIZATION</span>
                        <span className="text-slate-500 font-mono">1.4 GB / 10 GB</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                        <div className="bg-indigo-500 h-full rounded-full" style={{ width: '14%' }} />
                      </div>
                    </div>

                    <div className="pt-2 border-t dark:border-slate-750 flex justify-between items-center text-[9px]">
                      <span className="text-slate-400 font-bold">VETTING TRENDS:</span>
                      <span className="font-black text-emerald-600 uppercase">99.1% Approval rate</span>
                    </div>
                  </div>
                </div>

                {/* Platform Activity logs feed */}
                <div className="bg-white dark:bg-slate-800 rounded-[28px] border border-slate-150 dark:border-slate-700/60 p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-1 border-b dark:border-slate-700/40">
                    <h4 className="font-serif font-black text-xs text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                      <Activity className="w-4 h-4 text-amber-500" />
                      Recent Activity
                    </h4>
                    <button
                      onClick={() => onNavigate('activity_logs')}
                      className="text-[9px] font-black uppercase text-amber-500 hover:underline cursor-pointer"
                    >
                      View Logs
                    </button>
                  </div>

                  <div className="divide-y divide-slate-100/60 dark:divide-slate-800/40 max-h-[220px] overflow-y-auto pr-1">
                    {filteredAudits.slice(0, 4).map(log => {
                      const isWarning = log.status === 'Warning' || log.action.toLowerCase().includes('reject');
                      return (
                        <div key={log.id} className="py-2.5 text-[10px] space-y-0.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-wider ${
                              isWarning ? 'bg-amber-500/10 text-amber-600' : 'bg-emerald-500/10 text-emerald-600'
                            }`}>{log.action}</span>
                            <span className="text-[9px] text-slate-400 font-mono">
                              {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="font-bold text-slate-750 dark:text-slate-250 truncate">{log.details}</p>
                          <span className="text-slate-400 text-[9px]">By {log.actor}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

            </div>

            {/* Visual Governance Architecture Map Section (Expanded at Bottom) */}
            <div id="governance-architecture-map-section" className="pt-4 border-t dark:border-slate-750">
              <div className="mb-4">
                <h3 className="font-serif font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Compass className="w-5 h-5 text-amber-500" />
                  Sovereign Site Architecture Map Plan
                </h3>
                <p className="text-xs text-slate-400">
                  Interactive spatial map routing all webpages, content counts, and backlog approvals across the Bakenyi digital empire.
                </p>
              </div>
              
              <GovernanceMap
                pages={WEBPAGES}
                contentItems={governanceContent}
                pendingCounts={pendingCounts}
                onSelectPage={(pageId) => {
                  setActivePageId(pageId);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
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
