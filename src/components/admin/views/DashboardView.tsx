import React, { useEffect, useState } from 'react';
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
  ShieldCheck
} from 'lucide-react';
import PendingApprovalInbox from './PendingApprovalInbox';
import { 
  fetchUsers, 
  fetchMediaFiles, 
  updateUserStatus, 
  updateUserRole, 
  updateMediaStatus, 
  UserProfile, 
  MediaFile, 
  getSupabaseConfig 
} from '../../../lib/supabaseClient';
import { 
  getArticles, 
  updateArticle,
  getVocabulary,
  updateVocabularyStatus,
  getContributions,
  updateContributionStatus,
  getGalleryImages,
  updateGalleryImageStatus,
  addGalleryImage,
  Vocabulary,
  Contribution,
  GalleryImage
} from '../../../lib/supabase';
import { Article } from '../../../types/article';
import { getAuditLogs, logAdminActivity, AuditLog } from '../../../lib/operations';

interface DashboardViewProps {
  onNavigate: (tab: string) => void;
  user?: any;
  userRole?: 'super_admin' | 'admin' | 'reporter' | 'public' | 'staff' | 'customer';
}

export default function DashboardView({ onNavigate, user, userRole = 'public' }: DashboardViewProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [media, setMedia] = useState<MediaFile[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [vocabularies, setVocabularies] = useState<Vocabulary[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  
  // Tab for Elder vetting dashboard
  const [activeVettingTab, setActiveVettingTab] = useState<'users' | 'articles' | 'oral_histories' | 'vocabulary' | 'gallery'>('articles');
  const [moderationMode, setModerationMode] = useState<'unified' | 'classic'>('unified');

  // Connection status
  const { isConfigured } = getSupabaseConfig();

  // Normalize user roles for clean checks
  const resolvedRole = 
    userRole === 'staff' ? 'reporter' : 
    userRole === 'customer' ? 'public' : 
    userRole;

  const loadData = async () => {
    setIsLoading(true);
    try {
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
      setAuditLogs(getAuditLogs());
    } catch (err) {
      console.error('Failed to load platform operations dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Listen to operational custom events for state sync
    const handleSync = () => {
      loadData();
    };
    window.addEventListener('bakenye_operations_updated', handleSync);
    return () => {
      window.removeEventListener('bakenye_operations_updated', handleSync);
    };
  }, []);

  const flashMessage = (msg: string) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(null), 4000);
  };

  // --- Interactive Dashboard Queue Actions ---
  
  // 1. User Approval Action
  const handleApproveUser = async (userId: string, email: string, role: 'staff' | 'customer') => {
    try {
      await updateUserRole(userId, role);
      const updated = await updateUserStatus(userId, 'active');
      if (updated) {
        logAdminActivity(
          'Elder',
          'User Approved & Activated',
          `Approved registration for ${email} with assigned role: [${role.toUpperCase()}].`,
          'Roles',
          'Success',
          userId
        );
        flashMessage(`Successfully activated ${email} as ${role === 'staff' ? 'REPORTER' : 'USER'}`);
        loadData();
      }
    } catch (err) {
      console.error('Dashboard failed to approve user:', err);
    }
  };

  // 2. User Reject Action
  const handleRejectUser = async (userId: string, email: string) => {
    try {
      const updated = await updateUserStatus(userId, 'suspended');
      if (updated) {
        logAdminActivity(
          'Elder',
          'User Registration Denied',
          `Denied registration for ${email} and placed account on suspended list.`,
          'Security',
          'Warning',
          userId
        );
        flashMessage(`Denied registration for ${email}`);
        loadData();
      }
    } catch (err) {
      console.error('Dashboard failed to reject user:', err);
    }
  };

  // 3. Article Approval Action
  const handleApproveArticle = async (id: string, title: string) => {
    try {
      const { error } = await updateArticle(id, { 
        status: 'published', 
        publishedAt: new Date().toISOString().split('T')[0] 
      });
      if (error) throw error;

      logAdminActivity(
        'Elder',
        'Article Approved & Published',
        `Approved and dynamically published reporter article "${title}" to the public portal.`,
        'Content',
        'Success',
        id
      );
      flashMessage(`Approved and published article: "${title}"`);
      loadData();
    } catch (err) {
      console.error('Dashboard failed to approve article:', err);
    }
  };

  // 4. Article Rejection Action
  const handleRejectArticle = async (id: string, title: string) => {
    try {
      const { error } = await updateArticle(id, { status: 'draft' });
      if (error) throw error;

      logAdminActivity(
        'Elder',
        'Article Vetting Rejected',
        `Rejected reporter article "${title}" and reverted it to a secure draft.`,
        'Content',
        'Success',
        id
      );
      flashMessage(`Article "${title}" rejected and returned to draft mode.`);
      loadData();
    } catch (err) {
      console.error('Dashboard failed to reject article:', err);
    }
  };

  // 5. Media Approval Action
  const handleApproveMedia = async (name: string) => {
    try {
      const approved = await updateMediaStatus(name, 'approved');
      if (approved) {
        logAdminActivity(
          'Elder',
          'Media Upload Vetted',
          `Approved private media asset "${name}" making it publicly active in the gallery.`,
          'Media',
          'Success',
          name
        );
        flashMessage(`Approved media asset: "${name.split('/').pop()}"`);
        loadData();
      }
    } catch (err) {
      console.error('Dashboard failed to approve media:', err);
    }
  };

  // 6. Media Rejection Action
  const handleRejectMedia = async (name: string) => {
    try {
      await updateMediaStatus(name, 'rejected');
      logAdminActivity(
        'Elder',
        'Media Upload Rejected',
        `Rejected private media upload "${name}" and removed file from secure storage.`,
        'Media',
        'Warning',
        name
      );
      flashMessage(`Rejected media asset: "${name.split('/').pop()}"`);
      loadData();
    } catch (err) {
      console.error('Dashboard failed to reject media:', err);
    }
  };

  // 7. Vocabulary Approval Action
  const handleApproveVocabulary = async (id: string, lukenye: string) => {
    try {
      const success = await updateVocabularyStatus(id, 'approved');
      if (success) {
        logAdminActivity(
          'Elder',
          'Vocabulary Approved',
          `Approved Lukenye vocabulary suggestion "${lukenye}" to the public glossary.`,
          'Content',
          'Success',
          id
        );
        flashMessage(`Approved Lukenye word/phrase: "${lukenye}"`);
        loadData();
      }
    } catch (err) {
      console.error('Dashboard failed to approve vocabulary:', err);
    }
  };

  // 8. Vocabulary Rejection Action
  const handleRejectVocabulary = async (id: string, lukenye: string) => {
    try {
      const success = await updateVocabularyStatus(id, 'rejected');
      if (success) {
        logAdminActivity(
          'Elder',
          'Vocabulary Rejected',
          `Rejected Lukenye vocabulary suggestion "${lukenye}".`,
          'Content',
          'Warning',
          id
        );
        flashMessage(`Rejected Lukenye word/phrase: "${lukenye}"`);
        loadData();
      }
    } catch (err) {
      console.error('Dashboard failed to reject vocabulary:', err);
    }
  };

  // 9. Contribution Approval Action
  const handleApproveContribution = async (contrib: Contribution) => {
    try {
      const { success, error } = await updateContributionStatus(contrib.id, 'approved');
      if (error) throw error;

      if (success) {
        // Automatically add approved contribution to the gallery!
        await addGalleryImage(
          contrib.title,
          contrib.imageUrl,
          contrib.description,
          contrib.type === 'photo' ? 'History' : 'Tradition',
          'approved'
        );

        logAdminActivity(
          'Elder',
          'Contribution Approved',
          `Approved community contribution "${contrib.title}" and published to Digital Gallery.`,
          'Content',
          'Success',
          contrib.id
        );
        flashMessage(`Approved and published oral history: "${contrib.title}"`);
        loadData();
      }
    } catch (err) {
      console.error('Dashboard failed to approve contribution:', err);
    }
  };

  // 10. Contribution Rejection Action
  const handleRejectContribution = async (id: string, title: string) => {
    try {
      const { success, error } = await updateContributionStatus(id, 'rejected');
      if (error) throw error;

      if (success) {
        logAdminActivity(
          'Elder',
          'Contribution Rejected',
          `Rejected community contribution "${title}".`,
          'Content',
          'Warning',
          id
        );
        flashMessage(`Rejected community contribution: "${title}"`);
        loadData();
      }
    } catch (err) {
      console.error('Dashboard failed to reject contribution:', err);
    }
  };

  // 11. Gallery Image Approval Action
  const handleApproveGallery = async (id: string, title: string) => {
    try {
      const { success, error } = await updateGalleryImageStatus(id, 'approved');
      if (error) throw error;

      if (success) {
        logAdminActivity(
          'Elder',
          'Gallery Image Approved',
          `Approved gallery submission "${title}" for public display.`,
          'Media',
          'Success',
          id
        );
        flashMessage(`Approved gallery item: "${title}"`);
        loadData();
      }
    } catch (err) {
      console.error('Dashboard failed to approve gallery item:', err);
    }
  };

  // 12. Gallery Image Rejection Action
  const handleRejectGallery = async (id: string, title: string) => {
    try {
      const { success, error } = await updateGalleryImageStatus(id, 'rejected');
      if (error) throw error;

      if (success) {
        logAdminActivity(
          'Elder',
          'Gallery Image Rejected',
          `Rejected gallery submission "${title}".`,
          'Media',
          'Warning',
          id
        );
        flashMessage(`Rejected gallery item: "${title}"`);
        loadData();
      }
    } catch (err) {
      console.error('Dashboard failed to reject gallery item:', err);
    }
  };

  // Compute stats
  const pendingUsers = users.filter(u => u.status === 'pending');
  const pendingArticles = articles.filter(a => a.status === 'pending');
  const pendingMedia = media.filter(m => m.status === 'pending');
  const pendingVocabularies = vocabularies.filter(v => v.status === 'pending');
  const pendingContributions = contributions.filter(c => c.status === 'pending');
  const pendingGalleryImages = galleryImages.filter(g => g.status === 'pending');
  const totalQueueCount = 
    pendingUsers.length + 
    pendingArticles.length + 
    pendingMedia.length + 
    pendingVocabularies.length + 
    pendingContributions.length + 
    pendingGalleryImages.length;

  // Filter content authored by the current logged-in reporter
  const reporterEmail = user?.email || '';
  const myArticles = articles.filter(a => a.authorEmail === reporterEmail || a.author === reporterEmail.split('@')[0]);
  const myMedia = media.filter(m => m.url && (m.name.includes(reporterEmail.split('@')[0]) || m.status === 'approved'));

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-96 space-y-3">
        <Loader2 className="w-8 h-8 text-indigo-650 animate-spin" />
        <span className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
          Retrieving heritage workspace datasets...
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
        {/* Toast Flash Message */}
        {actionMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white border border-slate-800 rounded-2xl px-5 py-3.5 shadow-xl flex items-center space-x-2.5 animate-slide-up text-xs font-bold font-sans">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionMessage}</span>
          </div>
        )}

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
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700/50 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">My Written Articles</p>
              <h3 className="text-3xl font-serif font-black text-slate-900 dark:text-white leading-none">{myArticles.length}</h3>
              <span className="text-[10px] text-slate-400 font-semibold block">Total draft or published submissions</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700/50 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Published Live</p>
              <h3 className="text-3xl font-serif font-black text-slate-900 dark:text-white leading-none">
                {myArticles.filter(a => a.status === 'published' || a.status === 'approved').length}
              </h3>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block">Visible to the public site</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <BookOpen className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700/50 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Pending Vetting</p>
              <h3 className="text-3xl font-serif font-black text-slate-900 dark:text-white leading-none">
                {myArticles.filter(a => a.status === 'pending').length}
              </h3>
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold block">Awaiting admin review</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700/50 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">My Media Uploads</p>
              <h3 className="text-3xl font-serif font-black text-slate-900 dark:text-white leading-none">{myMedia.length}</h3>
              <span className="text-[10px] text-slate-400 font-semibold block">Contributed digital heritage assets</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <ImageIcon className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Creator Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Create CTA Bento Card */}
          <div className="bg-white dark:bg-slate-800 rounded-[28px] border border-slate-100 dark:border-slate-700/50 p-6 shadow-xs flex flex-col justify-between space-y-6">
            <div className="space-y-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
                <PlusCircle className="w-6 h-6" />
              </div>
              <h3 className="font-serif font-black text-lg text-slate-900 dark:text-white">Draft a Heritage Piece</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
                Add written chronicles, clan lineage accounts, or linguistic insights. Once submitted, administrators will review it before publishing.
              </p>
            </div>
            <button
              onClick={() => onNavigate('content')}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-wider text-[11px] py-3 rounded-2xl cursor-pointer flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/10"
            >
              <span>Go to Content Creator</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Submissions List */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-[28px] border border-slate-100 dark:border-slate-700/50 p-6 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-slate-50 dark:border-slate-700/40 pb-3">
              <h3 className="font-serif font-black text-base text-slate-900 dark:text-white">My Active Submissions</h3>
              <span className="text-[10px] font-bold text-slate-400">{myArticles.length} submissions</span>
            </div>

            <div className="divide-y divide-slate-100/50 dark:divide-slate-700/30 overflow-y-auto max-h-[220px]">
              {myArticles.map((art) => {
                const statusColors = {
                  draft: 'bg-slate-100 text-slate-700',
                  pending: 'bg-amber-100 text-amber-800 border-amber-200/20',
                  published: 'bg-emerald-100 text-emerald-800 border-emerald-200/20',
                  approved: 'bg-emerald-100 text-emerald-800 border-emerald-200/20',
                  rejected: 'bg-rose-100 text-rose-800 border-rose-200/20'
                };

                return (
                  <div key={art.id} className="py-3 flex items-center justify-between text-xs font-semibold gap-4">
                    <div className="min-w-0 text-left space-y-1">
                      <span className="font-bold text-slate-800 dark:text-white truncate block max-w-[280px]" title={art.title}>
                        {art.title}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-mono">Category: {art.category || 'General'}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-slate-400 font-medium">
                        {art.createdAt ? new Date(art.createdAt).toLocaleDateString() : 'Recent'}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${statusColors[art.status as keyof typeof statusColors] || 'bg-slate-100 text-slate-600'}`}>
                        {art.status}
                      </span>
                    </div>
                  </div>
                );
              })}

              {myArticles.length === 0 && (
                <div className="text-center py-12 text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-[10px] space-y-1">
                  <p>You have not drafted any chronicles yet.</p>
                  <button 
                    onClick={() => onNavigate('content')}
                    className="text-indigo-500 hover:underline cursor-pointer"
                  >
                    Write your first heritage chronicle
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    );
  }

  // ==========================================
  // SUPER ADMIN & ADMIN OPERATIONS VIEW
  // ==========================================
  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Toast Flash Message */}
      {actionMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white border border-slate-800 rounded-2xl px-5 py-3.5 shadow-xl flex items-center space-x-2.5 animate-slide-up text-xs font-bold font-sans">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Header Banner - Clean Heritage Style */}
      {resolvedRole === 'super_admin' ? (
        <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 p-6 md:p-8 rounded-[32px] text-white relative overflow-hidden border border-amber-500/20 shadow-lg shadow-amber-500/5">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-500/15 via-transparent to-transparent pointer-events-none" />
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-amber-500">
                <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Respected Elder Council Sanctuary</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-serif font-black text-white tracking-tight">
                Webale Kushemererwa, Respected Custodian
              </h1>
              <p className="text-xs text-slate-350 max-w-xl font-medium leading-relaxed">
                As an honored **Elder** of the Bakenyi heritage portal, you possess full sovereignty over the sacred chronicle publication queues, user credential promotions, media vetting, and historical preservation safety.
              </p>
            </div>
            <div className="hidden lg:block shrink-0 bg-amber-500/5 border border-amber-500/15 p-4 rounded-2xl max-w-xs text-right">
              <span className="block text-[9px] text-amber-500 font-bold uppercase tracking-widest mb-1">Ancestral Wisdom</span>
              <p className="text-[10px] text-slate-300 italic leading-relaxed">
                "Abagurusi nibo bikwatira enanga ya Bakenye."
              </p>
              <span className="block text-[8px] text-slate-500 font-medium mt-1">— Heritage Proverb on Guardianship</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-950 p-6 md:p-8 rounded-[32px] text-white relative overflow-hidden shadow-lg shadow-slate-950/20">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/15 via-transparent to-transparent pointer-events-none" />
          <div className="space-y-1.5 relative z-10">
            <div className="flex items-center gap-2 text-indigo-400">
              <UserCheck className="w-4 h-4 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Platform Administration Space</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-serif font-black text-white tracking-tight">
              Platform Moderator Panel
            </h1>
            <p className="text-xs text-slate-400 max-w-xl font-medium leading-relaxed">
              Oversee Bakenyi community content reviews, public publication approvals, media library assets vetting, and user management workflows.
            </p>
          </div>
        </div>
      )}

      {/* Admin Central Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700/50 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Moderation Backlog</p>
            <h3 className="text-3xl font-serif font-black text-slate-900 dark:text-white leading-none">
              {resolvedRole === 'admin' ? pendingArticles.length + pendingMedia.length : totalQueueCount}
            </h3>
            <span className="text-[10px] text-slate-400 font-semibold block">Awaiting publication vetting</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Inbox className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700/50 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Active Preservers</p>
            <h3 className="text-3xl font-serif font-black text-slate-900 dark:text-white leading-none">
              {users.filter(u => u.status === 'active').length}
            </h3>
            <span className="text-[10px] text-slate-400 font-semibold block">Authorized portal profiles</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700/50 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Live Chronicles</p>
            <h3 className="text-3xl font-serif font-black text-slate-900 dark:text-white leading-none">
              {articles.filter(a => a.status === 'published' || a.status === 'approved').length}
            </h3>
            <span className="text-[10px] text-slate-400 font-semibold block">Published public articles</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700/50 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Vetted Media Assets</p>
            <h3 className="text-3xl font-serif font-black text-slate-900 dark:text-white leading-none">
              {media.filter(m => m.status === 'approved').length}
            </h3>
            <span className="text-[10px] text-slate-400 font-semibold block">Approved public gallery assets</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400 flex items-center justify-center">
            <ImageIcon className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Vetting Dashboard Console Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-serif font-black text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-500" />
            <span>Honorable Vetting Council Desk</span>
          </h2>
          <p className="text-xs text-slate-400">
            Select an ancestral channel below to verify, moderate, or publish cultural content submissions.
          </p>
        </div>
        
        {/* Switcher & Status indicators */}
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-750 text-xs">
            <button
              onClick={() => setModerationMode('unified')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                moderationMode === 'unified' 
                  ? 'bg-amber-500 text-white shadow-xs' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Unified Inbox
            </button>
            <button
              onClick={() => setModerationMode('classic')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                moderationMode === 'classic' 
                  ? 'bg-amber-500 text-white shadow-xs' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Classic Vetting
            </button>
          </div>

          <span className="px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
            <span>{totalQueueCount} Total Pending Elements</span>
          </span>
        </div>
      </div>

      {moderationMode === 'unified' ? <PendingApprovalInbox /> : (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700/50 p-4 md:p-6 shadow-xs">
        {/* Tabs Bar */}
        <div className="flex flex-wrap gap-2 border-b border-slate-100 dark:border-slate-700 pb-4 mb-6">
          <button
            onClick={() => setActiveVettingTab('articles')}
            className={`px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
              activeVettingTab === 'articles'
                ? 'bg-amber-500 text-white shadow-md'
                : 'bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-300'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Written Chronicles</span>
            {pendingArticles.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-black/25 text-[8px] font-bold text-white">
                {pendingArticles.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveVettingTab('oral_histories')}
            className={`px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
              activeVettingTab === 'oral_histories'
                ? 'bg-amber-500 text-white shadow-md'
                : 'bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-300'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Oral Histories</span>
            {pendingContributions.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-black/25 text-[8px] font-bold text-white">
                {pendingContributions.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveVettingTab('vocabulary')}
            className={`px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
              activeVettingTab === 'vocabulary'
                ? 'bg-amber-500 text-white shadow-md'
                : 'bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-300'
            }`}
          >
            <Languages className="w-3.5 h-3.5" />
            <span>Vocabulary Proposals</span>
            {pendingVocabularies.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-black/25 text-[8px] font-bold text-white">
                {pendingVocabularies.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveVettingTab('gallery')}
            className={`px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
              activeVettingTab === 'gallery'
                ? 'bg-amber-500 text-white shadow-md'
                : 'bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-300'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Gallery Archives</span>
            {pendingGalleryImages.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-black/25 text-[8px] font-bold text-white">
                {pendingGalleryImages.length}
              </span>
            )}
          </button>

          {resolvedRole === 'super_admin' && (
            <button
              onClick={() => setActiveVettingTab('users')}
              className={`px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                activeVettingTab === 'users'
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-300'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Registry Sign-Ups</span>
              {pendingUsers.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-black/25 text-[8px] font-bold text-white">
                  {pendingUsers.length}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Tab Content Areas */}
        <div className="space-y-4">
          
          {/* 1. Written Chronicles Vetting Queue */}
          {activeVettingTab === 'articles' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex justify-between items-center pb-2">
                <h3 className="font-serif font-black text-slate-800 dark:text-white text-base">Written Chronicle Submissions</h3>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Awaiting Publication Review</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingArticles.map(art => (
                  <div key={art.id} className="p-5 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-850 text-xs flex flex-col justify-between space-y-4 hover:shadow-xs transition-shadow">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-[9px] font-black text-amber-600 uppercase tracking-wider bg-amber-500/10 px-2 py-0.5 rounded-md">
                          {art.category || 'General'}
                        </span>
                        <span className="text-[9px] text-slate-400 font-mono">
                          {art.createdAt ? new Date(art.createdAt).toLocaleDateString() : 'Recent'}
                        </span>
                      </div>
                      <h4 className="font-serif font-bold text-slate-800 dark:text-white text-sm line-clamp-1">{art.title}</h4>
                      <p className="text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">{art.excerpt || art.content}</p>
                      <div className="text-[10px] text-slate-400 pt-1 font-semibold">
                        Submitted by: <span className="text-slate-600 dark:text-slate-200">{art.author || 'Reporter'}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => handleApproveArticle(art.id, art.title)}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase py-2 rounded-xl transition-colors cursor-pointer"
                      >
                        Approve & Publish
                      </button>
                      <button
                        onClick={() => handleRejectArticle(art.id, art.title)}
                        className="px-3 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 text-rose-500 dark:text-rose-400 text-[10px] font-black uppercase py-2 rounded-xl transition-colors cursor-pointer"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {pendingArticles.length === 0 && (
                <div className="text-center py-16 border border-dashed border-slate-100 dark:border-slate-700/60 rounded-3xl space-y-3 bg-slate-50/40 dark:bg-slate-900/10">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                  <p className="text-sm font-bold text-slate-800 dark:text-white">All Chronicles Vetted</p>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">No written articles currently require editorial publication reviews.</p>
                </div>
              )}
            </div>
          )}

          {/* 2. Oral Histories Vetting Queue */}
          {activeVettingTab === 'oral_histories' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex justify-between items-center pb-2">
                <h3 className="font-serif font-black text-slate-800 dark:text-white text-base">Community Oral Histories & Ancestry Lore</h3>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Approved elements automatically publish to public platform</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingContributions.map(contrib => (
                  <div key={contrib.id} className="p-5 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-850 text-xs flex flex-col justify-between space-y-4 hover:shadow-xs transition-shadow">
                    <div className="space-y-2.5">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black text-indigo-600 uppercase tracking-wider bg-indigo-500/10 px-2 py-0.5 rounded-md">
                          {contrib.type.toUpperCase()} Story
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {contrib.created_at ? new Date(contrib.created_at).toLocaleDateString() : 'Recent'}
                        </span>
                      </div>
                      <h4 className="font-serif font-bold text-slate-800 dark:text-white text-sm">{contrib.title}</h4>
                      <p className="text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">{contrib.description}</p>
                      
                      {/* Interactive Media Player */}
                      {contrib.type === 'audio' && contrib.imageUrl && (
                        <div className="pt-2">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Play Ancestry Voice Recording</span>
                          <audio src={contrib.imageUrl} controls className="w-full h-8 bg-slate-100 dark:bg-slate-800 rounded-lg" />
                        </div>
                      )}

                      {contrib.type === 'photo' && contrib.imageUrl && (
                        <div className="pt-2">
                          <img 
                            src={contrib.imageUrl} 
                            alt={contrib.title} 
                            className="w-full h-32 object-cover rounded-xl border border-slate-100 dark:border-slate-700" 
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}

                      <div className="text-[10px] text-slate-400 font-semibold">
                        Suggested by: <span className="text-slate-600 dark:text-slate-200">{contrib.userEmail || 'Community Member'}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => handleApproveContribution(contrib)}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase py-2 rounded-xl transition-colors cursor-pointer"
                      >
                        Approve & Publish to Gallery
                      </button>
                      <button
                        onClick={() => handleRejectContribution(contrib.id, contrib.title)}
                        className="px-3 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 text-rose-500 dark:text-rose-400 text-[10px] font-black uppercase py-2 rounded-xl transition-colors cursor-pointer"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {pendingContributions.length === 0 && (
                <div className="text-center py-16 border border-dashed border-slate-100 dark:border-slate-700/60 rounded-3xl space-y-3 bg-slate-50/40 dark:bg-slate-900/10">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                  <p className="text-sm font-bold text-slate-800 dark:text-white">All Contributions Vetted</p>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">No oral histories or ancestral recordings are currently pending review.</p>
                </div>
              )}
            </div>
          )}

          {/* 3. Vocabulary Proposals Queue */}
          {activeVettingTab === 'vocabulary' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex justify-between items-center pb-2">
                <h3 className="font-serif font-black text-slate-800 dark:text-white text-base">Lukenye Vocabulary & Language Suggestions</h3>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Awaiting Linguistic Elder Endorsement</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingVocabularies.map(vocab => (
                  <div key={vocab.id} className="p-5 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-850 text-xs flex flex-col justify-between space-y-4 hover:shadow-xs transition-shadow">
                    <div className="space-y-2.5 text-left">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black text-amber-600 uppercase tracking-wider bg-amber-500/10 px-2 py-0.5 rounded-md">
                          {vocab.category}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {vocab.created_at ? new Date(vocab.created_at).toLocaleDateString() : 'Recent'}
                        </span>
                      </div>
                      
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Lukenye Word/Phrase</span>
                        <h4 className="text-lg font-mono font-black text-slate-900 dark:text-white leading-tight">
                          {vocab.lukenye}
                        </h4>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">English Meaning</span>
                        <p className="text-slate-800 dark:text-slate-200 font-medium text-sm leading-relaxed">
                          {vocab.english}
                        </p>
                      </div>

                      {vocab.usage && (
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Context/Usage Guidelines</span>
                          <p className="text-slate-500 dark:text-slate-400 leading-relaxed italic">
                            "{vocab.usage}"
                          </p>
                        </div>
                      )}

                      {vocab.example_sentence && (
                        <div className="space-y-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Lukenye Example Sentence</span>
                          <p className="text-slate-600 dark:text-slate-300 font-mono italic">
                            "{vocab.example_sentence}"
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => handleApproveVocabulary(vocab.id, vocab.lukenye)}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase py-2 rounded-xl transition-colors cursor-pointer"
                      >
                        Approve & Publish to Glossary
                      </button>
                      <button
                        onClick={() => handleRejectVocabulary(vocab.id, vocab.lukenye)}
                        className="px-3 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 text-rose-500 dark:text-rose-400 text-[10px] font-black uppercase py-2 rounded-xl transition-colors cursor-pointer"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {pendingVocabularies.length === 0 && (
                <div className="text-center py-16 border border-dashed border-slate-100 dark:border-slate-700/60 rounded-3xl space-y-3 bg-slate-50/40 dark:bg-slate-900/10">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                  <p className="text-sm font-bold text-slate-800 dark:text-white">Linguistic Vault Complete</p>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">All community language suggestions have been fully reviewed by elders.</p>
                </div>
              )}
            </div>
          )}

          {/* 4. Gallery Images Queue */}
          {activeVettingTab === 'gallery' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex justify-between items-center pb-2">
                <h3 className="font-serif font-black text-slate-800 dark:text-white text-base">Digital Archives & Gallery Submissions</h3>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Awaiting Media Asset Publication Review</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingGalleryImages.map(img => (
                  <div key={img.id} className="p-5 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-850 text-xs flex flex-col justify-between space-y-4 hover:shadow-xs transition-shadow">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black text-sky-600 uppercase tracking-wider bg-sky-500/10 px-2 py-0.5 rounded-md">
                          {img.category || 'General'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {img.created_at ? new Date(img.created_at).toLocaleDateString() : 'Recent'}
                        </span>
                      </div>

                      <img 
                        src={img.imageUrl} 
                        alt={img.title} 
                        className="w-full h-40 object-cover rounded-xl border border-slate-100 dark:border-slate-700" 
                        referrerPolicy="no-referrer"
                      />

                      <h4 className="font-serif font-bold text-slate-800 dark:text-white text-sm">{img.title}</h4>
                      {img.description && (
                        <p className="text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">{img.description}</p>
                      )}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => handleApproveGallery(img.id, img.title)}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase py-2 rounded-xl transition-colors cursor-pointer"
                      >
                        Approve & Publish to Gallery
                      </button>
                      <button
                        onClick={() => handleRejectGallery(img.id, img.title)}
                        className="px-3 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 text-rose-500 dark:text-rose-400 text-[10px] font-black uppercase py-2 rounded-xl transition-colors cursor-pointer"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {pendingGalleryImages.length === 0 && (
                <div className="text-center py-16 border border-dashed border-slate-100 dark:border-slate-700/60 rounded-3xl space-y-3 bg-slate-50/40 dark:bg-slate-900/10">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                  <p className="text-sm font-bold text-slate-800 dark:text-white">Media Repositories Clean</p>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">No pending public photographs or archive scans currently require verification.</p>
                </div>
              )}
            </div>
          )}

          {/* 5. Sign-Up Requests Queue (Super Admin ONLY) */}
          {activeVettingTab === 'users' && resolvedRole === 'super_admin' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex justify-between items-center pb-2">
                <h3 className="font-serif font-black text-slate-800 dark:text-white text-base">Registry Portal Applications</h3>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Awaiting Profile Credentials and Authentication</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingUsers.map(u => (
                  <div key={u.id} className="p-5 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-850 text-xs flex flex-col justify-between space-y-4 hover:shadow-xs transition-shadow">
                    <div className="space-y-2">
                      <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Candidate Email</span>
                      <span className="font-serif font-black text-sm text-slate-800 dark:text-white truncate block">{u.email}</span>
                      <p className="text-slate-400 text-[11px]">Needs manual verification before credentials promotion to Reporter/staff.</p>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => handleApproveUser(u.id, u.email, 'staff')}
                        className="flex-1 bg-indigo-650 hover:bg-indigo-700 text-white text-[10px] font-black uppercase py-2 rounded-xl cursor-pointer transition-all"
                      >
                        Approve Reporter
                      </button>
                      <button
                        onClick={() => handleRejectUser(u.id, u.email)}
                        className="px-3 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-xl transition-colors cursor-pointer"
                        title="Reject application"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {pendingUsers.length === 0 && (
                <div className="text-center py-16 border border-dashed border-slate-100 dark:border-slate-700/60 rounded-3xl space-y-3 bg-slate-50/40 dark:bg-slate-900/10">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                  <p className="text-sm font-bold text-slate-800 dark:text-white">Registry Credentials Clear</p>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">No pending accounts require manual registration approvals.</p>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    )}

    </div>
  );
}
