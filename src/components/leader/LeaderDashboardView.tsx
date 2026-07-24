import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Megaphone, Newspaper, Calendar as CalendarIcon, AlertOctagon, 
  Plus, Edit3, Trash2, CheckCircle2, Clock, AlertTriangle, 
  Upload, FileText, Play, Volume2, Image as ImageIcon, Check, 
  X, ChevronRight, User, Bell, RefreshCw, 
  MessageSquare, ChevronLeft, Search, 
  MapPin, Clock4, Loader2, AlertCircle
} from 'lucide-react';
import { getSupabase } from '../../lib/supabaseClient';
import { uploadMedia } from '../../lib/supabase';
import { 
  fetchElderProfile, 
  updateElderProfile, 
  fetchElderSubmissions, 
  fetchElderMediaList, 
  fetchElderEventsList, 
  fetchElderNotificationsList, 
  markNotificationRead, 
  markAllNotificationsRead, 
  saveElderArticle, 
  saveElderEvent, 
  saveElderAnnouncement, 
  saveElderMedia, 
  deleteElderSubmission,
  ElderSubmission,
  ElderMediaItem,
  ElderEventItem,
  ElderNotificationItem,
  ElderProfile
} from '../../lib/elderDashboardService';

export default function LeaderDashboardView({ user }: { user: any }) {
  const userId = user?.id || '';

  // Active Navigation Tab
  const [activeNav, setActiveNav] = useState<string>('dashboard');

  // Core Data States
  const [profile, setProfile] = useState<ElderProfile | null>(null);
  const [submissions, setSubmissions] = useState<ElderSubmission[]>([]);
  const [mediaList, setMediaList] = useState<ElderMediaItem[]>([]);
  const [eventsList, setEventsList] = useState<ElderEventItem[]>([]);
  const [notifications, setNotifications] = useState<ElderNotificationItem[]>([]);

  // Loading & Error States per domain
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingSubmissions, setLoadingSubmissions] = useState(true);
  const [loadingMedia, setLoadingMedia] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingNotifications, setLoadingNotifications] = useState(true);

  const [errorProfile, setErrorProfile] = useState<string | null>(null);
  const [errorSubmissions, setErrorSubmissions] = useState<string | null>(null);
  const [errorMedia, setErrorMedia] = useState<string | null>(null);
  const [errorEvents, setErrorEvents] = useState<string | null>(null);
  const [errorNotifications, setErrorNotifications] = useState<string | null>(null);

  // Toast / Status state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Profile Form States
  const [profileName, setProfileName] = useState('');
  const [profileBio, setProfileBio] = useState('');
  const [profileAvatar, setProfileAvatar] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  // Submissions filter state
  const [submissionFilter, setSubmissionFilter] = useState<'all' | 'draft' | 'pending' | 'approved' | 'revision' | 'rejected'>('all');

  // Compose Form slide-over state
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const [formType, setFormType] = useState<'article' | 'announcement' | 'event' | 'notice'>('article');
  const [editingSubmission, setEditingSubmission] = useState<ElderSubmission | null>(null);
  const [savingForm, setSavingForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields State
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    body: '',
    summary: '',
    priority: 'normal' as 'low' | 'normal' | 'high' | 'emergency',
    eventDate: '',
    eventTime: '',
    eventVenue: '',
    eventSpeaker: '',
    eventScope: 'All Clans Welcome',
    eventPoster: ''
  });

  // Media Upload Modal States
  const [showMediaForm, setShowMediaForm] = useState(false);
  const [mediaTitle, setMediaTitle] = useState('');
  const [mediaDesc, setMediaDesc] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'audio' | 'document'>('image');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaCategory, setMediaCategory] = useState('General');
  const [mediaFileUploading, setMediaFileUploading] = useState(false);
  const [savingMedia, setSavingMedia] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);

  // Event poster uploading state
  const [posterUploading, setPosterUploading] = useState(false);

  // Active review modal for detailed feedback / history
  const [reviewItem, setReviewItem] = useState<ElderSubmission | null>(null);

  // Operational Calendar states
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // --------------------------------------------------
  // LOAD DATA FROM SUPABASE
  // --------------------------------------------------

  const loadProfileData = async () => {
    if (!userId) {
      setLoadingProfile(false);
      return;
    }
    setLoadingProfile(true);
    setErrorProfile(null);
    const { profile: resProfile, error } = await fetchElderProfile(userId);
    if (error) {
      setErrorProfile(error.message || 'Failed to load profile.');
    } else if (resProfile) {
      setProfile(resProfile);
      setProfileName(resProfile.name);
      setProfileBio(resProfile.bio);
      setProfileAvatar(resProfile.avatarUrl);
    }
    setLoadingProfile(false);
  };

  const loadSubmissionsData = async () => {
    if (!userId) {
      setLoadingSubmissions(false);
      return;
    }
    setLoadingSubmissions(true);
    setErrorSubmissions(null);
    const { submissions: list, error } = await fetchElderSubmissions(userId);
    if (error) {
      setErrorSubmissions(error.message || 'Failed to load submissions.');
    } else {
      setSubmissions(list);
    }
    setLoadingSubmissions(false);
  };

  const loadMediaData = async () => {
    setLoadingMedia(true);
    setErrorMedia(null);
    const { media: list, error } = await fetchElderMediaList(userId);
    if (error) {
      setErrorMedia(error.message || 'Failed to load media vault.');
    } else {
      setMediaList(list);
    }
    setLoadingMedia(false);
  };

  const loadEventsData = async () => {
    setLoadingEvents(true);
    setErrorEvents(null);
    const { events: list, error } = await fetchElderEventsList(userId);
    if (error) {
      setErrorEvents(error.message || 'Failed to load events.');
    } else {
      setEventsList(list);
    }
    setLoadingEvents(false);
  };

  const loadNotificationsData = async () => {
    if (!userId) {
      setLoadingNotifications(false);
      return;
    }
    setLoadingNotifications(true);
    setErrorNotifications(null);
    const { notifications: list, error } = await fetchElderNotificationsList(userId);
    if (error) {
      setErrorNotifications(error.message || 'Failed to load notifications.');
    } else {
      setNotifications(list);
    }
    setLoadingNotifications(false);
  };

  useEffect(() => {
    loadProfileData();
    loadSubmissionsData();
    loadMediaData();
    loadEventsData();
    loadNotificationsData();
  }, [userId]);

  // --------------------------------------------------
  // FORM HANDLERS
  // --------------------------------------------------

  const resetForm = () => {
    setFormData({
      title: '',
      category: '',
      body: '',
      summary: '',
      priority: 'normal',
      eventDate: '',
      eventTime: '',
      eventVenue: '',
      eventSpeaker: '',
      eventScope: 'All Clans Welcome',
      eventPoster: ''
    });
    setEditingSubmission(null);
    setFormError(null);
  };

  const openEditForm = (sub: ElderSubmission) => {
    setEditingSubmission(sub);
    const mappedType = sub.type === 'event' ? 'event' : sub.type === 'announcement' ? 'announcement' : 'article';
    setFormType(mappedType);
    setFormData({
      title: sub.title,
      category: sub.category || 'General',
      body: sub.body || '',
      summary: sub.summary || '',
      priority: 'normal',
      eventDate: sub.type === 'event' && sub.originalData?.starts_at ? sub.originalData.starts_at.substring(0, 10) : '',
      eventTime: sub.type === 'event' && sub.originalData?.starts_at ? new Date(sub.originalData.starts_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
      eventVenue: sub.type === 'event' ? sub.originalData?.location || '' : '',
      eventSpeaker: sub.type === 'event' ? sub.originalData?.organizer || '' : '',
      eventScope: 'All Clans Welcome',
      eventPoster: sub.coverImage || ''
    });
    setFormError(null);
    setShowCreateForm(true);
  };

  const handleSaveSubmission = async (status: 'draft' | 'pending') => {
    if (!formData.title.trim() || !formData.body.trim()) {
      setFormError('Title and main body content are required.');
      return;
    }

    if (!userId) {
      setFormError('Authentication session expired. Please refresh and log in.');
      return;
    }

    setSavingForm(true);
    setFormError(null);

    let res: { data: any; error: Error | null } = { data: null, error: null };

    if (formType === 'event') {
      res = await saveElderEvent(userId, {
        id: editingSubmission?.id,
        title: formData.title,
        description: formData.body,
        location: formData.eventVenue || 'Bakenye Heritage Sanctuary',
        eventDate: formData.eventDate,
        eventTime: formData.eventTime,
        coverImage: formData.eventPoster,
        organizer: formData.eventSpeaker || 'Elder Council',
        status
      });
    } else if (formType === 'announcement' || formType === 'notice') {
      res = await saveElderAnnouncement(userId, {
        id: editingSubmission?.id,
        title: formData.title,
        message: formData.body,
        category: formData.category || 'community',
        priority: formData.priority,
        status
      });
    } else {
      res = await saveElderArticle(userId, {
        id: editingSubmission?.id,
        title: formData.title,
        summary: formData.summary,
        body: formData.body,
        coverImage: formData.eventPoster,
        status
      });
    }

    setSavingForm(false);

    if (res.error) {
      setFormError(res.error.message || 'Failed to submit to database. Please retry.');
    } else {
      triggerToast(status === 'draft' ? 'Draft saved successfully.' : 'Chronicle submitted successfully to Elder Council.');
      setShowCreateForm(false);
      resetForm();
      loadSubmissionsData();
      if (formType === 'event') loadEventsData();
    }
  };

  const handleDeleteSubmission = async (id: string, table: 'articles' | 'events' | 'gallery' | 'announcements' | 'contributions') => {
    if (!window.confirm('Are you sure you want to delete this item from Supabase?')) return;
    const { success, error } = await deleteElderSubmission(userId, id, table);
    if (error) {
      triggerToast(`Deletion failed: ${error.message}`);
    } else if (success) {
      triggerToast('Item deleted successfully.');
      loadSubmissionsData();
      loadMediaData();
      loadEventsData();
    }
  };

  const handleSaveMedia = async (status: 'pending' | 'draft') => {
    if (!mediaTitle.trim() || !mediaUrl.trim()) {
      setMediaError('Title and file media attachment URL are required.');
      return;
    }

    setSavingMedia(true);
    setMediaError(null);

    const { error } = await saveElderMedia(userId, {
      title: mediaTitle,
      description: mediaDesc,
      fileUrl: mediaUrl,
      fileType: mediaType,
      category: mediaCategory,
      status
    });

    setSavingMedia(false);

    if (error) {
      setMediaError(error.message || 'Failed to save media asset.');
    } else {
      triggerToast('Media resource added to Elder Vault.');
      setShowMediaForm(false);
      setMediaTitle('');
      setMediaDesc('');
      setMediaUrl('');
      setMediaError(null);
      loadMediaData();
      loadSubmissionsData();
    }
  };

  const handleSaveProfile = async () => {
    if (!userId) return;
    setSavingProfile(true);
    const { success, error } = await updateElderProfile(userId, {
      name: profileName,
      bio: profileBio,
      avatarUrl: profileAvatar
    });
    setSavingProfile(false);
    if (error) {
      triggerToast(`Profile update failed: ${error.message}`);
    } else if (success) {
      triggerToast('Elder leader profile updated successfully.');
      loadProfileData();
    }
  };

  // Calendar Helpers
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayIndex = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const getDayEvents = (day: number) => {
    return eventsList.filter(ev => {
      const d = new Date(ev.startDatetime);
      return d.getDate() === day && 
             d.getMonth() === currentMonth.getMonth() && 
             d.getFullYear() === currentMonth.getFullYear();
    });
  };

  // Submissions Filter
  const filteredSubmissions = submissions.filter(item => {
    if (submissionFilter === 'all') return true;
    return item.status === submissionFilter;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-slate-800 dark:text-slate-100 font-sans">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-20 right-6 z-50 bg-stone-900 text-white px-5 py-3 rounded-2xl shadow-xl border border-stone-800 flex items-center gap-3"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-xs font-bold font-sans">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER BAR */}
      <div className="bg-white dark:bg-slate-900 border border-heritage-brown/10 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-heritage-terracotta/10 border-2 border-heritage-terracotta overflow-hidden shadow-inner flex items-center justify-center">
              {profileAvatar ? (
                <img src={profileAvatar} alt="Leader Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <User className="w-8 h-8 text-heritage-terracotta" />
              )}
            </div>
            <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" title="Active Elder Leader Session" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-heritage-terracotta bg-heritage-terracotta/10 px-2.5 py-0.5 rounded-full border border-heritage-terracotta/15">
                Verified Elder Council
              </span>
              <span className="text-xs text-heritage-brown/50 dark:text-slate-400 font-semibold">• Lukenye Region</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-serif font-black text-heritage-brown dark:text-white mt-1">
              {profileName || 'Elder Leader Workspace'}
            </h1>
            <p className="text-xs text-heritage-brown/70 dark:text-slate-400 font-semibold mt-0.5">
              Production Elder Portal — Preserving & Moderating Bakenye Heritage
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          <button
            onClick={() => {
              resetForm();
              setFormType('article');
              setShowCreateForm(true);
            }}
            className="px-4.5 py-2.5 bg-heritage-terracotta text-white hover:bg-heritage-terracotta/90 text-xs font-black uppercase tracking-wider rounded-2xl transition-all shadow-md cursor-pointer flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Compose Chronicle</span>
          </button>

          <button
            onClick={() => setShowMediaForm(true)}
            className="px-4 py-2.5 bg-heritage-brown/5 dark:bg-slate-800 hover:bg-heritage-brown/10 text-heritage-brown dark:text-white text-xs font-black uppercase tracking-wider rounded-2xl transition-all cursor-pointer flex items-center gap-2 border border-heritage-brown/10 dark:border-slate-700"
          >
            <Upload className="w-4 h-4 text-heritage-terracotta" />
            <span>Upload Media</span>
          </button>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex items-center gap-2 border-b border-heritage-brown/10 dark:border-slate-800 overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: 'dashboard', label: 'Overview', icon: Newspaper },
          { id: 'hub', label: 'Community Hub', icon: Megaphone },
          { id: 'media', label: 'Media Vault', icon: ImageIcon, badge: mediaList.length },
          { id: 'submissions', label: 'My Submissions', icon: FileText, badge: submissions.length },
          { id: 'calendar', label: 'Calendar', icon: CalendarIcon, badge: eventsList.length },
          { id: 'notifications', label: 'Notifications', icon: Bell, badge: notifications.filter(n => !n.isRead).length },
          { id: 'profile', label: 'Profile & Settings', icon: User }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeNav === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveNav(tab.id)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                isActive 
                  ? 'bg-heritage-terracotta text-white shadow' 
                  : 'text-heritage-brown/60 dark:text-slate-400 hover:bg-heritage-brown/5 dark:hover:bg-slate-800 hover:text-heritage-brown dark:hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className={`px-2 py-0.5 text-[10px] font-black rounded-full ${
                  isActive ? 'bg-white/20 text-white' : 'bg-heritage-terracotta/15 text-heritage-terracotta'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* VIEW 1: OVERVIEW DASHBOARD */}
      {activeNav === 'dashboard' && (
        <div className="space-y-8 animate-fade-in">
          {/* STATS SUMMARY CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white dark:bg-slate-900 border border-heritage-brown/10 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-heritage-brown/50 dark:text-slate-400">Total Submissions</span>
                <div className="p-2.5 bg-heritage-terracotta/10 rounded-2xl text-heritage-terracotta">
                  <FileText className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-serif font-black text-heritage-brown dark:text-white mt-3">
                {submissions.length}
              </p>
              <span className="text-[10px] font-semibold text-heritage-brown/60 dark:text-slate-400 mt-1 block">Live Supabase Record Count</span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-heritage-brown/10 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">Pending Council Audit</span>
                <div className="p-2.5 bg-amber-500/10 rounded-2xl text-amber-600">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-serif font-black text-amber-600 dark:text-amber-400 mt-3">
                {submissions.filter(s => s.status === 'pending').length}
              </p>
              <span className="text-[10px] font-semibold text-heritage-brown/60 dark:text-slate-400 mt-1 block">Awaiting Elder Decision</span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-heritage-brown/10 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Approved & Active</span>
                <div className="p-2.5 bg-emerald-500/10 rounded-2xl text-emerald-600">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-serif font-black text-emerald-600 dark:text-emerald-400 mt-3">
                {submissions.filter(s => s.status === 'approved' || s.status === 'published').length}
              </p>
              <span className="text-[10px] font-semibold text-heritage-brown/60 dark:text-slate-400 mt-1 block">Published in Public Platform</span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-heritage-brown/10 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400">Media Vault Items</span>
                <div className="p-2.5 bg-purple-500/10 rounded-2xl text-purple-600">
                  <ImageIcon className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-serif font-black text-purple-600 dark:text-purple-400 mt-3">
                {mediaList.length}
              </p>
              <span className="text-[10px] font-semibold text-heritage-brown/60 dark:text-slate-400 mt-1 block">Uploaded Media Assets</span>
            </div>
          </div>

          {/* RECENT SUBMISSIONS TABLE / LIST */}
          <div className="bg-white dark:bg-slate-900 border border-heritage-brown/10 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-heritage-brown/10 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-serif font-black text-heritage-brown dark:text-white">
                  Recent Submissions Activity
                </h3>
                <p className="text-xs text-heritage-brown/60 dark:text-slate-400 font-semibold mt-0.5">
                  Synchronized with Supabase database records
                </p>
              </div>

              <button
                onClick={loadSubmissionsData}
                className="p-2 hover:bg-heritage-brown/5 dark:hover:bg-slate-800 rounded-xl text-heritage-brown/60 dark:text-slate-400 cursor-pointer transition-colors"
                title="Refresh Submissions"
              >
                <RefreshCw className={`w-4 h-4 ${loadingSubmissions ? 'animate-spin text-heritage-terracotta' : ''}`} />
              </button>
            </div>

            {loadingSubmissions ? (
              <div className="py-12 flex flex-col items-center justify-center text-heritage-brown/40">
                <Loader2 className="w-8 h-8 animate-spin text-heritage-terracotta mb-3" />
                <span className="text-xs font-bold uppercase tracking-wider">Fetching live database records...</span>
              </div>
            ) : errorSubmissions ? (
              <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3 text-rose-700 dark:text-rose-300">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span className="text-xs font-semibold">{errorSubmissions}</span>
                </div>
                <button
                  onClick={loadSubmissionsData}
                  className="px-3 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-xl hover:bg-rose-700 transition-colors cursor-pointer"
                >
                  Retry Fetch
                </button>
              </div>
            ) : submissions.length === 0 ? (
              <div className="text-center py-12 text-heritage-brown/40 space-y-3">
                <p className="text-xs font-semibold">No submissions recorded for your account in Supabase yet.</p>
                <button
                  onClick={() => {
                    resetForm();
                    setShowCreateForm(true);
                  }}
                  className="px-4 py-2 bg-heritage-terracotta text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  Compose Your First Chronicle
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {submissions.slice(0, 5).map(item => (
                  <div 
                    key={item.id}
                    className="p-4 rounded-2xl border border-heritage-brown/5 dark:border-slate-800 hover:border-heritage-terracotta/30 dark:hover:border-heritage-terracotta/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-stone-50/50 dark:bg-slate-950/30"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black uppercase bg-heritage-terracotta/10 text-heritage-terracotta px-2 py-0.5 rounded-md">
                          {item.type}
                        </span>
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                          item.status === 'approved' || item.status === 'published' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                          item.status === 'pending' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                          'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                          {item.status}
                        </span>
                        <span className="text-[10px] text-heritage-brown/40 dark:text-slate-500 font-semibold">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="font-serif font-black text-sm text-heritage-brown dark:text-white">
                        {item.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => openEditForm(item)}
                        className="px-3 py-1.5 text-[10px] font-black uppercase bg-white dark:bg-slate-800 border border-heritage-brown/10 dark:border-slate-700 hover:border-heritage-terracotta text-heritage-brown dark:text-white rounded-xl transition-colors cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteSubmission(item.id, item.originalTable)}
                        className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 rounded-xl transition-colors cursor-pointer"
                        title="Delete from Supabase"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: COMMUNITY HUB */}
      {activeNav === 'hub' && (
        <div className="bg-white dark:bg-slate-900 border border-heritage-brown/10 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6 animate-fade-in">
          <div>
            <h2 className="text-xl font-serif font-black text-heritage-brown dark:text-white">
              Elder Community Hub
            </h2>
            <p className="text-xs text-heritage-brown/60 dark:text-slate-400 font-semibold mt-1">
              Select a publishing channel to submit new heritage dispatches, alerts, and clan notices.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { type: 'article', label: 'Heritage Article', desc: 'Document oral histories, maritime traditions, and cultural essays.', icon: FileText },
              { type: 'announcement', label: 'Council Announcement', desc: 'Broadcast critical notices regarding assemblies, clan news, or safety alerts.', icon: Megaphone },
              { type: 'event', label: 'Heritage Event', desc: 'Schedule boat regattas, weaving masterclasses, and council meetings.', icon: CalendarIcon }
            ].map(channel => {
              const Icon = channel.icon;
              return (
                <div 
                  key={channel.type}
                  onClick={() => {
                    resetForm();
                    setFormType(channel.type as any);
                    setShowCreateForm(true);
                  }}
                  className="p-6 rounded-3xl border border-heritage-brown/10 dark:border-slate-800 hover:border-heritage-terracotta transition-all bg-stone-50/50 dark:bg-slate-950/20 cursor-pointer space-y-4 group"
                >
                  <div className="p-3 bg-heritage-terracotta/10 text-heritage-terracotta rounded-2xl w-fit group-hover:bg-heritage-terracotta group-hover:text-white transition-colors">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-serif font-black text-base text-heritage-brown dark:text-white">
                      {channel.label}
                    </h3>
                    <p className="text-xs text-heritage-brown/60 dark:text-slate-400 mt-1 font-semibold leading-relaxed">
                      {channel.desc}
                    </p>
                  </div>
                  <span className="text-[10px] font-black uppercase text-heritage-terracotta flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    <span>Compose Now</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 3: MEDIA VAULT */}
      {activeNav === 'media' && (
        <div className="bg-white dark:bg-slate-900 border border-heritage-brown/10 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-heritage-brown/10 dark:border-slate-800 gap-4">
            <div>
              <h2 className="text-xl font-serif font-black text-heritage-brown dark:text-white">
                Elder Media Vault Registry
              </h2>
              <p className="text-xs text-heritage-brown/60 dark:text-slate-400 font-semibold mt-1">
                Upload and inspect registered photos, audio recordings, documents, and videos.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={loadMediaData}
                className="p-2 hover:bg-heritage-brown/5 dark:hover:bg-slate-800 rounded-xl text-heritage-brown/60 dark:text-slate-400 cursor-pointer"
                title="Refresh Media Vault"
              >
                <RefreshCw className={`w-4 h-4 ${loadingMedia ? 'animate-spin text-heritage-terracotta' : ''}`} />
              </button>
              <button
                onClick={() => setShowMediaForm(true)}
                className="px-4 py-2 bg-heritage-terracotta text-white text-xs font-black uppercase tracking-wider rounded-xl hover:bg-heritage-terracotta/90 transition-all cursor-pointer flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Upload Media</span>
              </button>
            </div>
          </div>

          {loadingMedia ? (
            <div className="py-16 flex flex-col items-center justify-center text-heritage-brown/40">
              <Loader2 className="w-8 h-8 animate-spin text-heritage-terracotta mb-3" />
              <span className="text-xs font-bold uppercase tracking-wider">Fetching media vault records...</span>
            </div>
          ) : errorMedia ? (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-2xl flex items-center justify-between">
              <span className="text-xs text-rose-700 dark:text-rose-300 font-semibold">{errorMedia}</span>
              <button onClick={loadMediaData} className="px-3 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-xl cursor-pointer">Retry</button>
            </div>
          ) : mediaList.length === 0 ? (
            <div className="text-center py-16 text-heritage-brown/40 space-y-3">
              <p className="text-xs font-semibold">No media resources registered in Supabase storage yet.</p>
              <button onClick={() => setShowMediaForm(true)} className="px-4 py-2 bg-heritage-terracotta text-white text-xs font-bold rounded-xl cursor-pointer">Upload First Media Asset</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {mediaList.map(media => (
                <div 
                  key={media.id}
                  className="border border-heritage-brown/10 dark:border-slate-800 rounded-2xl overflow-hidden bg-stone-50/50 dark:bg-slate-950/30 hover:border-heritage-terracotta transition-all flex flex-col justify-between"
                >
                  <div className="h-40 bg-stone-200 dark:bg-slate-800 relative overflow-hidden flex items-center justify-center">
                    {media.type === 'image' && media.url ? (
                      <img src={media.url} alt={media.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : media.type === 'audio' ? (
                      <div className="flex flex-col items-center gap-2 text-heritage-terracotta">
                        <Volume2 className="w-10 h-10" />
                        <span className="text-[10px] font-bold uppercase">Audio Track</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-heritage-terracotta">
                        <Play className="w-10 h-10" />
                        <span className="text-[10px] font-bold uppercase">Video Media</span>
                      </div>
                    )}
                  </div>

                  <div className="p-4 flex-grow flex flex-col justify-between">
                    <div>
                      <span className="text-[8px] font-black uppercase text-heritage-terracotta bg-heritage-terracotta/10 px-2 py-0.5 rounded-full inline-block mb-1.5">
                        {media.type} • {media.category}
                      </span>
                      <h4 className="font-serif font-black text-xs text-heritage-brown dark:text-white truncate">
                        {media.title}
                      </h4>
                      <p className="text-[10px] text-heritage-brown/60 dark:text-slate-400 mt-1 line-clamp-2 font-semibold">
                        {media.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-heritage-brown/5 dark:border-slate-800">
                      <span className="text-[9px] text-heritage-brown/40 dark:text-slate-500 font-bold">
                        {new Date(media.createdAt).toLocaleDateString()}
                      </span>
                      <button
                        onClick={() => handleDeleteSubmission(media.id, 'gallery')}
                        className="p-1 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors cursor-pointer"
                        title="Delete Media"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW 4: MY SUBMISSIONS */}
      {activeNav === 'submissions' && (
        <div className="bg-white dark:bg-slate-900 border border-heritage-brown/10 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-heritage-brown/10 dark:border-slate-800 gap-4">
            <div>
              <h2 className="text-xl font-serif font-black text-heritage-brown dark:text-white">
                My Submissions Lifecycle
              </h2>
              <p className="text-xs text-heritage-brown/60 dark:text-slate-400 font-semibold mt-1">
                Track status changes, review histories, and elder decisions.
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap bg-heritage-cream/20 dark:bg-slate-950 p-1 rounded-xl border border-heritage-brown/5 gap-1">
              {['all', 'draft', 'pending', 'revision', 'approved'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setSubmissionFilter(tab as any)}
                  className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all cursor-pointer ${
                    submissionFilter === tab 
                      ? 'bg-heritage-terracotta text-white' 
                      : 'text-heritage-brown/60 dark:text-slate-400 hover:text-heritage-brown'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {loadingSubmissions ? (
            <div className="py-16 flex flex-col items-center justify-center text-heritage-brown/40">
              <Loader2 className="w-8 h-8 animate-spin text-heritage-terracotta mb-3" />
              <span className="text-xs font-bold uppercase tracking-wider">Loading submissions...</span>
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="text-center py-16 text-heritage-brown/40">
              No submissions match the selected filter.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSubmissions.map(item => (
                <div 
                  key={item.id}
                  className="border border-heritage-brown/10 dark:border-slate-800 rounded-2xl p-5 hover:border-heritage-terracotta transition-all bg-stone-50/30 dark:bg-slate-950/20"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black uppercase bg-heritage-terracotta/10 text-heritage-terracotta px-2.5 py-0.5 rounded-full border border-heritage-terracotta/15">
                        {item.type}
                      </span>
                      <span className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                        item.status === 'approved' || item.status === 'published' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                        item.status === 'pending' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                        'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                      }`}>
                        {item.status}
                      </span>
                      <span className="text-[10px] text-heritage-brown/40 dark:text-slate-500 font-semibold">
                        Submitted: {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditForm(item)}
                        className="p-1.5 hover:bg-heritage-brown/5 rounded-lg text-heritage-brown/60 hover:text-heritage-terracotta cursor-pointer"
                        title="Edit Submission"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteSubmission(item.id, item.originalTable)}
                        className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setReviewItem(item)}
                        className="px-3 py-1.5 bg-heritage-brown/5 dark:bg-slate-800 text-[10px] font-black uppercase text-heritage-brown dark:text-white rounded-lg cursor-pointer flex items-center gap-1"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Timeline</span>
                      </button>
                    </div>
                  </div>

                  <h3 className="font-serif font-black text-base text-heritage-brown dark:text-white">
                    {item.title}
                  </h3>
                  <p className="text-xs text-heritage-brown/70 dark:text-slate-300 leading-relaxed mt-2 font-semibold">
                    {item.summary || item.body?.substring(0, 160)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW 5: OPERATIONAL CALENDAR */}
      {activeNav === 'calendar' && (
        <div className="bg-white dark:bg-slate-900 border border-heritage-brown/10 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6 animate-fade-in">
          <div className="flex items-center justify-between pb-4 border-b border-heritage-brown/10 dark:border-slate-800">
            <div>
              <h2 className="text-xl font-serif font-black text-heritage-brown dark:text-white">
                Leader's Operational Calendar
              </h2>
              <p className="text-xs text-heritage-brown/60 dark:text-slate-400 font-semibold mt-0.5">
                Manage upcoming gatherings, boat regattas, and assemblies.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button onClick={prevMonth} className="p-1.5 hover:bg-heritage-brown/5 rounded-lg border border-heritage-brown/10 cursor-pointer">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-black uppercase tracking-wider min-w-[120px] text-center">
                {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </span>
              <button onClick={nextMonth} className="p-1.5 hover:bg-heritage-brown/5 rounded-lg border border-heritage-brown/10 cursor-pointer">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <span key={d} className="text-center text-[10px] font-black uppercase text-heritage-brown/40 py-1">
                {d}
              </span>
            ))}

            {Array.from({ length: firstDayIndex }).map((_, idx) => (
              <div key={`empty-${idx}`} className="h-24 bg-stone-50/20 dark:bg-slate-950/10 rounded-2xl border border-transparent" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const dayEvents = getDayEvents(day);

              return (
                <div 
                  key={`day-${day}`}
                  className="h-24 p-2 border border-heritage-brown/5 dark:border-slate-800 rounded-2xl flex flex-col justify-between bg-stone-50/40 dark:bg-slate-950/20"
                >
                  <span className="text-[10px] font-black text-heritage-brown dark:text-white">{day}</span>
                  <div className="space-y-1 overflow-y-auto max-h-[45px]">
                    {dayEvents.map(ev => (
                      <div 
                        key={ev.id}
                        className="bg-heritage-terracotta text-white rounded p-1 text-[8px] font-black truncate uppercase"
                        title={ev.title}
                      >
                        {ev.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 6: NOTIFICATIONS */}
      {activeNav === 'notifications' && (
        <div className="bg-white dark:bg-slate-900 border border-heritage-brown/10 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6 animate-fade-in">
          <div className="flex items-center justify-between pb-4 border-b border-heritage-brown/10 dark:border-slate-800">
            <div>
              <h2 className="text-xl font-serif font-black text-heritage-brown dark:text-white">
                Notifications Dispatch Feed
              </h2>
              <p className="text-xs text-heritage-brown/60 dark:text-slate-400 font-semibold mt-0.5">
                Status logs and review notices directly from Supabase notifications table.
              </p>
            </div>

            {notifications.some(n => !n.isRead) && (
              <button
                onClick={async () => {
                  await markAllNotificationsRead(userId);
                  loadNotificationsData();
                  triggerToast('All notifications marked as read.');
                }}
                className="px-3.5 py-1.5 bg-heritage-terracotta/10 text-heritage-terracotta text-xs font-black rounded-lg cursor-pointer uppercase"
              >
                Mark All Read
              </button>
            )}
          </div>

          {loadingNotifications ? (
            <div className="py-12 flex items-center justify-center text-heritage-brown/40">
              <Loader2 className="w-6 h-6 animate-spin text-heritage-terracotta mr-2" />
              <span className="text-xs font-bold">Loading dispatches...</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12 text-heritage-brown/40 text-xs font-semibold">
              No active notification dispatches found for your account.
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map(notif => (
                <div 
                  key={notif.id}
                  onClick={async () => {
                    if (!notif.isRead) {
                      await markNotificationRead(notif.id);
                      loadNotificationsData();
                    }
                  }}
                  className={`p-4 rounded-2xl border transition-all flex items-start gap-4 cursor-pointer ${
                    notif.isRead 
                      ? 'bg-stone-50/50 border-heritage-brown/5 opacity-60 dark:bg-slate-950/20' 
                      : 'bg-heritage-terracotta/5 border-heritage-terracotta/20 dark:bg-slate-950'
                  }`}
                >
                  <div className="p-2 bg-white dark:bg-slate-900 border border-heritage-brown/5 rounded-xl shrink-0">
                    <Bell className="w-4 h-4 text-heritage-terracotta" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-serif font-black text-sm text-heritage-brown dark:text-white">
                        {notif.title}
                      </h4>
                      <span className="text-[10px] text-heritage-brown/40 dark:text-slate-500 font-bold">
                        {notif.timestamp}
                      </span>
                    </div>
                    <p className="text-xs text-heritage-brown/70 dark:text-slate-300 mt-1 font-semibold">
                      {notif.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW 7: PROFILE & PREFERENCES */}
      {activeNav === 'profile' && (
        <div className="bg-white dark:bg-slate-900 border border-heritage-brown/10 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6 animate-fade-in">
          <div className="pb-4 border-b border-heritage-brown/10 dark:border-slate-800">
            <h2 className="text-xl font-serif font-black text-heritage-brown dark:text-white">
              Leader Profile & Credentials
            </h2>
            <p className="text-xs text-heritage-brown/60 dark:text-slate-400 font-semibold mt-0.5">
              Manage your profile identity stored securely in the `public.profiles` database table.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-heritage-brown/50 dark:text-slate-400 mb-1">
                  Full Registered Name
                </label>
                <input 
                  type="text" 
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-heritage-brown/15 bg-transparent text-xs font-bold focus:border-heritage-terracotta focus:outline-none dark:border-slate-800"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-heritage-brown/50 dark:text-slate-400 mb-1">
                  Leader Bio & Lineage Details
                </label>
                <textarea 
                  rows={4}
                  value={profileBio}
                  onChange={(e) => setProfileBio(e.target.value)}
                  placeholder="Provide brief details about your role in the Elder Council."
                  className="w-full px-4 py-2.5 rounded-2xl border border-heritage-brown/15 bg-transparent text-xs font-semibold focus:border-heritage-terracotta focus:outline-none dark:border-slate-800"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-heritage-brown/50 dark:text-slate-400 mb-1">
                  Profile Avatar Image
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-stone-100 dark:bg-slate-800 overflow-hidden border border-heritage-brown/10 flex items-center justify-center shrink-0">
                    {profileAvatar ? (
                      <img src={profileAvatar} className="w-full h-full object-cover" alt="Avatar" referrerPolicy="no-referrer" />
                    ) : (
                      <User className="w-8 h-8 text-heritage-terracotta" />
                    )}
                  </div>

                  <div className="relative flex-1">
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setAvatarUploading(true);
                        const { url, error } = await uploadMedia(file, 'images');
                        setAvatarUploading(false);
                        if (error) {
                          triggerToast(`Avatar upload failed: ${error.message}`);
                        } else if (url) {
                          setProfileAvatar(url);
                          triggerToast('Avatar image uploaded.');
                        }
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full"
                    />
                    <button type="button" className="px-4 py-2 bg-stone-100 dark:bg-slate-800 border border-heritage-brown/15 text-xs font-bold rounded-xl cursor-pointer">
                      {avatarUploading ? 'Uploading...' : 'Upload New Avatar'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-heritage-brown/5 dark:border-slate-800">
            <button
              onClick={handleSaveProfile}
              disabled={savingProfile}
              className="px-6 py-2.5 bg-heritage-terracotta text-white hover:bg-heritage-terracotta/90 text-xs font-black uppercase tracking-wider rounded-2xl transition-all cursor-pointer flex items-center gap-2"
            >
              {savingProfile && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Save Profile Settings</span>
            </button>
          </div>
        </div>
      )}

      {/* SLIDE-OVER MODAL: COMPOSE CHRONICLE */}
      <AnimatePresence>
        {showCreateForm && (
          <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowCreateForm(false);
                resetForm();
              }}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />

            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-full max-w-xl bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col justify-between z-10 border-l border-heritage-brown/15 dark:border-slate-800"
            >
              {/* Header */}
              <div className="p-6 border-b border-heritage-brown/10 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-black uppercase text-heritage-terracotta bg-heritage-terracotta/10 px-2.5 py-0.5 rounded-full border border-heritage-terracotta/15 mb-1 inline-block">
                    {editingSubmission ? 'Modify Record' : `New ${formType}`}
                  </span>
                  <h3 className="font-serif font-black text-lg text-heritage-brown dark:text-white">
                    {editingSubmission ? `Edit "${editingSubmission.title}"` : 'Compose Heritage Chronicle'}
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    resetForm();
                  }}
                  className="p-2 hover:bg-stone-100 rounded-full text-heritage-brown/50 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Scroll Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {formError && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-700 dark:text-rose-300 font-semibold flex items-center justify-between">
                    <span>{formError}</span>
                    <button onClick={() => handleSaveSubmission('pending')} className="underline font-bold text-rose-800 dark:text-rose-200 cursor-pointer">Retry</button>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-black uppercase text-heritage-brown/50 dark:text-slate-400 mb-1">
                    Title / Dispatch Name
                  </label>
                  <input 
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g. Traditional Papyrus Netcrafting Masterclass"
                    className="w-full px-4 py-2.5 rounded-xl border border-heritage-brown/15 bg-transparent text-xs font-bold focus:border-heritage-terracotta focus:outline-none dark:border-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-heritage-brown/50 dark:text-slate-400 mb-1">
                    Category Tag
                  </label>
                  <input 
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    placeholder="e.g. Maritime Traditions, Clan Assembly, Oral History"
                    className="w-full px-4 py-2.5 rounded-xl border border-heritage-brown/15 bg-transparent text-xs font-bold focus:border-heritage-terracotta focus:outline-none dark:border-slate-800"
                  />
                </div>

                {formType === 'event' && (
                  <div className="p-4 bg-stone-50 dark:bg-slate-950/40 border border-heritage-brown/10 dark:border-slate-800 rounded-2xl space-y-3">
                    <span className="text-[9px] font-black uppercase tracking-widest text-heritage-terracotta block">
                      Event Schedule & Venue:
                    </span>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] font-black uppercase text-heritage-brown/40 mb-1">Event Date</label>
                        <input 
                          type="date"
                          value={formData.eventDate}
                          onChange={(e) => setFormData(prev => ({ ...prev, eventDate: e.target.value }))}
                          className="w-full px-3 py-2 rounded-xl border border-heritage-brown/15 bg-transparent text-xs font-semibold focus:border-heritage-terracotta focus:outline-none dark:border-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black uppercase text-heritage-brown/40 mb-1">Start Time</label>
                        <input 
                          type="text"
                          placeholder="e.g. 09:00 AM"
                          value={formData.eventTime}
                          onChange={(e) => setFormData(prev => ({ ...prev, eventTime: e.target.value }))}
                          className="w-full px-3 py-2 rounded-xl border border-heritage-brown/15 bg-transparent text-xs font-semibold focus:border-heritage-terracotta focus:outline-none dark:border-slate-800"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[9px] font-black uppercase text-heritage-brown/40 mb-1">Location / Venue</label>
                      <input 
                        type="text"
                        placeholder="e.g. Paliisa Cultural Sanctuary"
                        value={formData.eventVenue}
                        onChange={(e) => setFormData(prev => ({ ...prev, eventVenue: e.target.value }))}
                        className="w-full px-3.5 py-2 rounded-xl border border-heritage-brown/15 bg-transparent text-xs font-semibold focus:border-heritage-terracotta focus:outline-none dark:border-slate-800"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[9px] font-black uppercase text-heritage-brown/50 dark:text-slate-400 mb-1">
                    Excerpt / Short Summary
                  </label>
                  <input 
                    type="text"
                    value={formData.summary}
                    onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
                    placeholder="Brief description for feed preview card"
                    className="w-full px-4 py-2.5 rounded-xl border border-heritage-brown/15 bg-transparent text-xs font-bold focus:border-heritage-terracotta focus:outline-none dark:border-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-black uppercase text-heritage-brown/50 dark:text-slate-400 mb-1">
                    Full Body & Instruction Details
                  </label>
                  <textarea 
                    rows={8}
                    value={formData.body}
                    onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value }))}
                    placeholder="Write the full chronicle content, stories, or notice text."
                    className="w-full px-4 py-2.5 rounded-xl border border-heritage-brown/15 bg-transparent text-xs font-semibold focus:border-heritage-terracotta focus:outline-none dark:border-slate-800"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-6 border-t border-heritage-brown/10 dark:border-slate-800 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => handleSaveSubmission('draft')}
                  disabled={savingForm}
                  className="px-5 py-2.5 border border-heritage-brown/15 text-heritage-brown dark:text-white text-xs font-black uppercase rounded-2xl cursor-pointer hover:bg-stone-50"
                >
                  Save Draft
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveSubmission('pending')}
                  disabled={savingForm}
                  className="px-5 py-2.5 bg-heritage-terracotta text-white text-xs font-black uppercase rounded-2xl shadow cursor-pointer flex items-center gap-2 hover:bg-heritage-terracotta/90"
                >
                  {savingForm && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Submit to Council</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MEDIA UPLOAD MODAL */}
      <AnimatePresence>
        {showMediaForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMediaForm(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-heritage-brown/10 dark:border-slate-800 p-6 z-10 space-y-4"
            >
              <div className="flex justify-between items-start pb-3 border-b border-heritage-brown/10 dark:border-slate-800">
                <div>
                  <span className="text-[8px] font-black uppercase px-2.5 py-0.5 bg-heritage-terracotta/10 text-heritage-terracotta rounded-full">
                    Supabase Storage Uploader
                  </span>
                  <h3 className="font-serif font-black text-base text-heritage-brown dark:text-white mt-1">
                    Upload Media Asset
                  </h3>
                </div>
                <button onClick={() => setShowMediaForm(false)} className="p-1 text-heritage-brown/40 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {mediaError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-center justify-between">
                  <span>{mediaError}</span>
                  <button onClick={() => handleSaveMedia('pending')} className="underline font-bold text-rose-800 cursor-pointer">Retry</button>
                </div>
              )}

              <div>
                <label className="block text-[9px] font-black uppercase text-heritage-brown/50 dark:text-slate-400 mb-1">
                  Asset Title
                </label>
                <input 
                  type="text" 
                  value={mediaTitle}
                  onChange={(e) => setMediaTitle(e.target.value)}
                  placeholder="e.g. Canoe Regatta Paddling Song"
                  className="w-full px-3.5 py-2 rounded-xl border border-heritage-brown/15 bg-transparent text-xs font-bold focus:border-heritage-terracotta focus:outline-none dark:border-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-black uppercase text-heritage-brown/50 dark:text-slate-400 mb-1">
                    Type
                  </label>
                  <select 
                    value={mediaType}
                    onChange={(e) => setMediaType(e.target.value as any)}
                    className="w-full px-3.5 py-2 rounded-xl border border-heritage-brown/15 bg-white dark:bg-slate-900 text-xs font-bold focus:border-heritage-terracotta focus:outline-none dark:border-slate-800"
                  >
                    <option value="image">Image Attachment</option>
                    <option value="video">Video Clip</option>
                    <option value="audio">Audio Recording</option>
                    <option value="document">PDF Document</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] font-black uppercase text-heritage-brown/50 dark:text-slate-400 mb-1">
                    Category
                  </label>
                  <input 
                    type="text" 
                    value={mediaCategory}
                    onChange={(e) => setMediaCategory(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-heritage-brown/15 bg-transparent text-xs font-bold focus:border-heritage-terracotta focus:outline-none dark:border-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-black uppercase text-heritage-brown/50 dark:text-slate-400 mb-1">
                  File Attachment (Storage Bucket)
                </label>
                <div className="relative border-2 border-dashed border-heritage-brown/15 dark:border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center bg-stone-50/50 dark:bg-slate-950/25">
                  <input 
                    type="file" 
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setMediaFileUploading(true);
                      const { url, error } = await uploadMedia(file, mediaType === 'document' ? 'pdfs' : 'images');
                      setMediaFileUploading(false);
                      if (error) {
                        setMediaError(`File upload error: ${error.message}`);
                      } else if (url) {
                        setMediaUrl(url);
                        triggerToast('Media file uploaded successfully.');
                      }
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  {mediaFileUploading ? (
                    <div className="flex items-center gap-2 text-xs font-bold text-heritage-terracotta">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Uploading to Supabase Storage...</span>
                    </div>
                  ) : mediaUrl ? (
                    <div className="text-center">
                      <span className="text-xs font-bold text-emerald-600 block">File Uploaded & Linked</span>
                      <span className="text-[10px] text-slate-400 truncate max-w-[200px] block">{mediaUrl}</span>
                    </div>
                  ) : (
                    <div className="text-center text-heritage-brown/50">
                      <Upload className="w-5 h-5 mx-auto mb-1 text-heritage-terracotta" />
                      <span className="text-xs font-bold block">Click to select file</span>
                      <span className="text-[9px] block">Bucket automatic selection</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-black uppercase text-heritage-brown/50 dark:text-slate-400 mb-1">
                  Description
                </label>
                <textarea 
                  rows={2}
                  value={mediaDesc}
                  onChange={(e) => setMediaDesc(e.target.value)}
                  placeholder="Details and metadata"
                  className="w-full px-3.5 py-2 rounded-xl border border-heritage-brown/15 bg-transparent text-xs font-semibold focus:border-heritage-terracotta focus:outline-none dark:border-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-heritage-brown/10 dark:border-slate-800">
                <button
                  onClick={() => handleSaveMedia('draft')}
                  disabled={savingMedia}
                  className="px-4 py-2 border border-heritage-brown/15 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Save Draft
                </button>
                <button
                  onClick={() => handleSaveMedia('pending')}
                  disabled={savingMedia}
                  className="px-4 py-2 bg-heritage-terracotta text-white text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1"
                >
                  {savingMedia && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Media</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* TIMELINE / REVIEW AUDIT LOG MODAL */}
      <AnimatePresence>
        {reviewItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setReviewItem(null)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-heritage-brown/10 dark:border-slate-800 p-6 z-10 space-y-4"
            >
              <div className="flex justify-between items-start pb-3 border-b border-heritage-brown/10 dark:border-slate-800">
                <div>
                  <span className="text-[8px] font-black uppercase px-2.5 py-0.5 bg-heritage-terracotta/10 text-heritage-terracotta rounded-full">
                    Audit Log
                  </span>
                  <h3 className="font-serif font-black text-base text-heritage-brown dark:text-white mt-1">
                    Chronicle Lifecycle History
                  </h3>
                </div>
                <button onClick={() => setReviewItem(null)} className="p-1 text-heritage-brown/40 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-bold text-heritage-brown dark:text-white">{reviewItem.title}</p>
                <p className="text-xs text-heritage-brown/60 dark:text-slate-400">Original Table: <span className="font-mono text-heritage-terracotta">{reviewItem.originalTable}</span></p>
                <p className="text-xs text-heritage-brown/60 dark:text-slate-400">Status: <span className="font-bold uppercase text-emerald-600">{reviewItem.status}</span></p>
                <p className="text-xs text-heritage-brown/60 dark:text-slate-400">Created At: {new Date(reviewItem.createdAt).toLocaleString()}</p>
              </div>

              <div className="flex justify-end pt-4 border-t border-heritage-brown/10 dark:border-slate-800">
                <button onClick={() => setReviewItem(null)} className="px-4 py-2 bg-stone-100 dark:bg-slate-800 text-xs font-bold rounded-xl cursor-pointer">
                  Dismiss
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
