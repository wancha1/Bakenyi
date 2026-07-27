import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Megaphone, Newspaper, Calendar as CalendarIcon, AlertOctagon, 
  Plus, Edit3, Trash2, CheckCircle2, Clock, AlertTriangle, 
  Upload, FileText, Play, Volume2, Image as ImageIcon, Check, 
  X, ChevronRight, User, Bell, RefreshCw, 
  MessageSquare, ChevronLeft, Search, 
  MapPin, Clock4, Loader2, AlertCircle, Eye
} from 'lucide-react';
import { getSupabase } from '../../lib/supabaseClient';
import { uploadMedia } from '../../lib/supabase';
import { UploadZone } from '../ui/UploadZone';
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
  ElderProfile,
  INITIAL_SAMPLE_SUBMISSIONS,
  INITIAL_SAMPLE_MEDIA,
  INITIAL_SAMPLE_EVENTS,
  INITIAL_SAMPLE_NOTIFICATIONS
} from '../../lib/elderDashboardService';

export default function LeaderDashboardView({ user }: { user: any }) {
  const userId = user?.id || user?.email || 'elder_council_custodian';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'updated' | 'alpha'>('newest');

  // Confirmation Modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    isDanger?: boolean;
  } | null>(null);

  // Compose Form slide-over state
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const [formType, setFormType] = useState<'article' | 'announcement' | 'event' | 'notice'>('article');
  const [editingSubmission, setEditingSubmission] = useState<ElderSubmission | null>(null);
  const [savingForm, setSavingForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [hasRestoredDraft, setHasRestoredDraft] = useState(false);

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

  // Local Autosave Effect
  useEffect(() => {
    if (showCreateForm && (formData.title || formData.body) && !editingSubmission) {
      try {
        localStorage.setItem(`elder_draft_autosave_${userId}`, JSON.stringify({
          formType,
          formData,
          savedAt: new Date().toISOString()
        }));
      } catch (e) {
        // localStorage non-blocking fallback
      }
    }
  }, [formData, showCreateForm, formType, editingSubmission, userId]);
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
    setLoadingProfile(true);
    setErrorProfile(null);
    const { profile: resProfile } = await fetchElderProfile(userId);
    if (resProfile && resProfile.name) {
      setProfile(resProfile);
      setProfileName(resProfile.name);
      setProfileBio(resProfile.bio);
      setProfileAvatar(resProfile.avatarUrl);
    } else {
      const fallbackName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Elder Mukama James';
      const fallbackProfile: ElderProfile = {
        id: userId,
        email: user?.email || 'elder@bakenye.org',
        name: fallbackName,
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
        bio: 'Custodian of Bakenyi Oral History & Lake Kyoga Maritime Traditions',
        role: 'community_leader'
      };
      setProfile(fallbackProfile);
      setProfileName(fallbackProfile.name);
      setProfileBio(fallbackProfile.bio);
      setProfileAvatar(fallbackProfile.avatarUrl);
    }
    setLoadingProfile(false);
  };

  const loadSubmissionsData = async () => {
    setLoadingSubmissions(true);
    setErrorSubmissions(null);
    const { submissions: list, error } = await fetchElderSubmissions(userId);
    if (error || !list || list.length === 0) {
      setSubmissions(INITIAL_SAMPLE_SUBMISSIONS);
    } else {
      setSubmissions(list);
    }
    setLoadingSubmissions(false);
  };

  const loadMediaData = async () => {
    setLoadingMedia(true);
    setErrorMedia(null);
    const { media: list, error } = await fetchElderMediaList(userId);
    if (error || !list || list.length === 0) {
      setMediaList(INITIAL_SAMPLE_MEDIA);
    } else {
      setMediaList(list);
    }
    setLoadingMedia(false);
  };

  const loadEventsData = async () => {
    setLoadingEvents(true);
    setErrorEvents(null);
    const { events: list, error } = await fetchElderEventsList(userId);
    if (error || !list || list.length === 0) {
      setEventsList(INITIAL_SAMPLE_EVENTS);
    } else {
      setEventsList(list);
    }
    setLoadingEvents(false);
  };

  const loadNotificationsData = async () => {
    setLoadingNotifications(true);
    setErrorNotifications(null);
    const { notifications: list, error } = await fetchElderNotificationsList(userId);
    if (error || !list || list.length === 0) {
      setNotifications(INITIAL_SAMPLE_NOTIFICATIONS);
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
    setHasRestoredDraft(false);
  };

  const clearAutosavedDraft = () => {
    try {
      localStorage.removeItem(`elder_draft_autosave_${userId}`);
    } catch (e) {}
  };

  const handleCloseForm = () => {
    if ((formData.title.trim() || formData.body.trim()) && !editingSubmission) {
      setConfirmModal({
        isOpen: true,
        title: 'Discard Unsaved Contribution?',
        message: 'You have entered content for this submission. Closing now will save a local recovery draft in your browser, or you can discard it completely.',
        confirmText: 'Discard & Close',
        cancelText: 'Keep Editing',
        isDanger: true,
        onConfirm: () => {
          setShowCreateForm(false);
          resetForm();
          setConfirmModal(null);
        }
      });
    } else {
      setShowCreateForm(false);
      resetForm();
    }
  };

  const restoreAutosavedDraft = () => {
    try {
      const saved = localStorage.getItem(`elder_draft_autosave_${userId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.formData) {
          setFormData(parsed.formData);
          if (parsed.formType) setFormType(parsed.formType);
          setHasRestoredDraft(true);
          triggerToast('Restored unsaved draft from local session!');
        }
      }
    } catch (e) {}
  };

  const openEditForm = (sub: ElderSubmission) => {
    setEditingSubmission(sub);
    const mappedType = sub.type === 'event' ? 'event' : sub.type === 'announcement' ? 'announcement' : 'article';
    setFormType(mappedType);

    let eventTimeFormatted = '';
    if (sub.type === 'event' && sub.originalData?.starts_at) {
      try {
        const d = new Date(sub.originalData.starts_at);
        if (!isNaN(d.getTime())) {
          eventTimeFormatted = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
      } catch {
        eventTimeFormatted = '';
      }
    }

    setFormData({
      title: sub.title || '',
      category: sub.category || 'General',
      body: sub.body || '',
      summary: sub.summary || '',
      priority: 'normal',
      eventDate: sub.type === 'event' && sub.originalData?.starts_at ? String(sub.originalData.starts_at).substring(0, 10) : '',
      eventTime: eventTimeFormatted,
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

    setSavingForm(true);
    setFormError(null);

    // Save to database asynchronously
    if (formType === 'event') {
      await saveElderEvent(userId, {
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
      await saveElderAnnouncement(userId, {
        id: editingSubmission?.id,
        title: formData.title,
        message: formData.body,
        category: formData.category || 'community',
        priority: formData.priority,
        status
      });
    } else {
      await saveElderArticle(userId, {
        id: editingSubmission?.id,
        title: formData.title,
        summary: formData.summary,
        body: formData.body,
        coverImage: formData.eventPoster,
        status
      });
    }

    // Local state optimistic update so user sees change immediately
    const targetId = editingSubmission?.id || `sub-live-${Date.now()}`;
    const newSubItem: ElderSubmission = {
      id: targetId,
      title: formData.title,
      type: formType === 'event' ? 'event' : formType === 'announcement' ? 'announcement' : 'article',
      status,
      createdAt: editingSubmission?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      summary: formData.summary || (formType === 'event' ? `${formData.eventVenue} | ${formData.eventDate}` : formData.body.substring(0, 120)),
      body: formData.body,
      category: formData.category || 'Heritage',
      coverImage: formData.eventPoster || editingSubmission?.coverImage,
      originalTable: formType === 'event' ? 'events' : formType === 'announcement' ? 'announcements' : 'articles',
      originalData: { starts_at: formData.eventDate, location: formData.eventVenue, organizer: formData.eventSpeaker }
    };

    setSubmissions(prev => {
      const exists = prev.some(item => item.id === targetId);
      if (exists) {
        return prev.map(item => item.id === targetId ? newSubItem : item);
      }
      return [newSubItem, ...prev];
    });

    if (formType === 'event' && formData.eventDate) {
      const newEvItem: ElderEventItem = {
        id: `ev-live-${Date.now()}`,
        title: formData.title,
        description: formData.body,
        location: formData.eventVenue || 'Bakenye Heritage Sanctuary',
        startDatetime: formData.eventDate,
        endDatetime: formData.eventDate,
        organizer: formData.eventSpeaker || 'Elder Council',
        status,
        createdAt: new Date().toISOString()
      };
      setEventsList(prev => [newEvItem, ...prev]);
    }

    clearAutosavedDraft();
    setSavingForm(false);
    setShowCreateForm(false);
    resetForm();
    triggerToast(status === 'draft' ? 'Submission saved as draft.' : 'Submitted to Elder Council for vetting!');
  };

  const handleDeleteSubmission = (id: string, table: 'articles' | 'events' | 'gallery' | 'announcements' | 'contributions') => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Cultural Artifact / Submission?',
      message: 'Are you sure you want to permanently delete this submission? This action cannot be undone.',
      confirmText: 'Delete Permanently',
      cancelText: 'Cancel',
      isDanger: true,
      onConfirm: async () => {
        setSubmissions(prev => prev.filter(item => item.id !== id));
        setMediaList(prev => prev.filter(item => item.id !== id));
        setEventsList(prev => prev.filter(item => item.id !== id));
        setConfirmModal(null);
        triggerToast('Item removed successfully.');
        await deleteElderSubmission(userId, id, table);
      }
    });
  };

  const handleSaveMedia = async (status: 'pending' | 'draft') => {
    if (!mediaTitle.trim() || !mediaUrl.trim()) {
      setMediaError('Title and file media attachment URL are required.');
      return;
    }

    setSavingMedia(true);
    setMediaError(null);

    const newMediaItem: ElderMediaItem = {
      id: `media-live-${Date.now()}`,
      title: mediaTitle,
      description: mediaDesc,
      url: mediaUrl,
      type: mediaType,
      category: mediaCategory || 'General',
      createdAt: new Date().toISOString(),
      status: status === 'pending' ? 'approved' : 'draft'
    };

    setMediaList(prev => [newMediaItem, ...prev]);

    await saveElderMedia(userId, {
      title: mediaTitle,
      description: mediaDesc,
      fileUrl: mediaUrl,
      fileType: mediaType,
      category: mediaCategory,
      status
    });

    setSavingMedia(false);
    triggerToast('Media resource added to Elder Vault.');
    setShowMediaForm(false);
    setMediaTitle('');
    setMediaDesc('');
    setMediaUrl('');
    setMediaError(null);
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    const updatedProfile: ElderProfile = {
      id: userId,
      email: user?.email || 'elder@bakenye.org',
      name: profileName || 'Elder Mukama James',
      avatarUrl: profileAvatar,
      bio: profileBio,
      role: 'community_leader'
    };
    setProfile(updatedProfile);
    await updateElderProfile(userId, {
      name: profileName,
      bio: profileBio,
      avatarUrl: profileAvatar
    });
    setSavingProfile(false);
    triggerToast('Elder leader profile updated successfully.');
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

  // Submissions Multi-Criteria Search, Filter & Sort
  const filteredSubmissions = submissions.filter(item => {
    // Status Filter
    if (submissionFilter !== 'all') {
      if (submissionFilter === 'revision') {
        if (item.status !== 'revision' && item.status !== 'rejected') return false;
      } else if (item.status !== submissionFilter) {
        return false;
      }
    }

    // Category Filter
    if (categoryFilter !== 'all' && item.category !== categoryFilter) {
      return false;
    }

    // Type Filter
    if (typeFilter !== 'all' && item.type !== typeFilter) {
      return false;
    }

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchBody = (item.body || '').toLowerCase().includes(q);
      const matchSummary = (item.summary || '').toLowerCase().includes(q);
      const matchCategory = (item.category || '').toLowerCase().includes(q);
      if (!matchTitle && !matchBody && !matchSummary && !matchCategory) return false;
    }

    return true;
  }).sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sortBy === 'oldest') {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    if (sortBy === 'updated') {
      return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime();
    }
    if (sortBy === 'alpha') {
      return a.title.localeCompare(b.title);
    }
    return 0;
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
          {/* QUICK STATISTICS CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-heritage-brown/10 dark:border-slate-800 rounded-3xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-heritage-brown/60 dark:text-slate-400">Total Contributions</span>
                <div className="p-2 bg-heritage-terracotta/10 rounded-xl text-heritage-terracotta">
                  <FileText className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-serif font-black text-heritage-brown dark:text-white mt-2">
                {submissions.length}
              </p>
              <span className="text-[9px] font-bold text-slate-400 mt-1 block">Saved Cultural Items</span>
            </div>

            <div className="bg-amber-500/5 dark:bg-amber-950/20 border border-amber-500/20 rounded-3xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">Drafts</span>
                <div className="p-2 bg-amber-500/15 rounded-xl text-amber-600">
                  <Edit3 className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-serif font-black text-amber-700 dark:text-amber-400 mt-2">
                {submissions.filter(s => s.status === 'draft').length}
              </p>
              <span className="text-[9px] font-bold text-amber-600/70 mt-1 block">In Progress</span>
            </div>

            <div className="bg-sky-500/5 dark:bg-sky-950/20 border border-sky-500/20 rounded-3xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-sky-700 dark:text-sky-400">Pending Review</span>
                <div className="p-2 bg-sky-500/15 rounded-xl text-sky-600">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-serif font-black text-sky-700 dark:text-sky-400 mt-2">
                {submissions.filter(s => s.status === 'pending').length}
              </p>
              <span className="text-[9px] font-bold text-sky-600/70 mt-1 block">Under Review</span>
            </div>

            <div className="bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/20 rounded-3xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Approved</span>
                <div className="p-2 bg-emerald-500/15 rounded-xl text-emerald-600">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-serif font-black text-emerald-700 dark:text-emerald-400 mt-2">
                {submissions.filter(s => s.status === 'approved' || s.status === 'published').length}
              </p>
              <span className="text-[9px] font-bold text-emerald-600/70 mt-1 block">Published to Archive</span>
            </div>

            <div className="bg-rose-500/5 dark:bg-rose-950/20 border border-rose-500/20 rounded-3xl p-4 shadow-sm col-span-2 sm:col-span-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 dark:text-rose-400">Rejected / Revision</span>
                <div className="p-2 bg-rose-500/15 rounded-xl text-rose-600">
                  <AlertCircle className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-serif font-black text-rose-700 dark:text-rose-400 mt-2">
                {submissions.filter(s => s.status === 'rejected' || s.status === 'revision').length}
              </p>
              <span className="text-[9px] font-bold text-rose-600/70 mt-1 block">Requires Updates</span>
            </div>
          </div>

          {/* QUICK ACTIONS BAR */}
          <div className="bg-white dark:bg-slate-900 border border-heritage-brown/10 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-heritage-brown/10 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-serif font-black text-heritage-brown dark:text-white">
                  Elder Quick Actions
                </h3>
                <p className="text-xs text-heritage-brown/60 dark:text-slate-400 font-semibold mt-0.5">
                  Publish new cultural materials directly into the Bakenyi digital repository.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {[
                { label: 'New Article', action: () => { resetForm(); setFormType('article'); setShowCreateForm(true); }, icon: FileText, color: 'text-heritage-terracotta bg-heritage-terracotta/10' },
                { label: 'New Gallery', action: () => { setMediaType('image'); setShowMediaForm(true); }, icon: ImageIcon, color: 'text-purple-600 bg-purple-500/10' },
                { label: 'New Oral History', action: () => { resetForm(); setFormType('article'); setFormData(prev => ({ ...prev, category: 'Oral History' })); setShowCreateForm(true); }, icon: Volume2, color: 'text-amber-600 bg-amber-500/10' },
                { label: 'New Event', action: () => { resetForm(); setFormType('event'); setShowCreateForm(true); }, icon: CalendarIcon, color: 'text-emerald-600 bg-emerald-500/10' },
                { label: 'Upload Doc', action: () => { setMediaType('document'); setShowMediaForm(true); }, icon: FileText, color: 'text-sky-600 bg-sky-500/10' },
                { label: 'Upload Audio', action: () => { setMediaType('audio'); setShowMediaForm(true); }, icon: Volume2, color: 'text-amber-600 bg-amber-500/10' },
                { label: 'Upload Video', action: () => { setMediaType('video'); setShowMediaForm(true); }, icon: Play, color: 'text-indigo-600 bg-indigo-500/10' },
              ].map((act, i) => {
                const Icon = act.icon;
                return (
                  <button
                    key={i}
                    onClick={act.action}
                    className="p-3 rounded-2xl border border-stone-200 dark:border-slate-800 bg-stone-50/50 dark:bg-slate-950/40 hover:border-heritage-terracotta hover:bg-white dark:hover:bg-slate-900 transition-all flex flex-col items-center justify-center text-center gap-2 cursor-pointer group shadow-2xs"
                  >
                    <div className={`p-2.5 rounded-xl ${act.color} group-hover:scale-110 transition-transform`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[11px] font-bold text-heritage-brown dark:text-slate-200 leading-tight">
                      {act.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* RECENT ACTIVITY & SUBMISSIONS LIST */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Drafts */}
            <div className="bg-white dark:bg-slate-900 border border-heritage-brown/10 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-heritage-brown/10 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-amber-500/10 text-amber-600 rounded-lg">
                    <Edit3 className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-serif font-black text-heritage-brown dark:text-white">
                    Recent Drafts
                  </h3>
                </div>
                <button 
                  onClick={() => setActiveNav('submissions')}
                  className="text-[10px] font-black text-heritage-terracotta hover:underline cursor-pointer uppercase"
                >
                  View All
                </button>
              </div>

              {submissions.filter(s => s.status === 'draft').length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No saved drafts. Start composing a new story above!
                </div>
              ) : (
                <div className="space-y-3">
                  {submissions.filter(s => s.status === 'draft').slice(0, 4).map(item => (
                    <div 
                      key={item.id}
                      className="p-3.5 rounded-2xl border border-amber-500/20 bg-amber-500/5 flex items-center justify-between gap-3"
                    >
                      <div className="overflow-hidden">
                        <span className="text-[9px] font-bold uppercase text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded-md inline-block mb-1">
                          Draft
                        </span>
                        <h4 className="font-serif font-black text-xs text-heritage-brown dark:text-white truncate">
                          {item.title}
                        </h4>
                        <p className="text-[10px] text-slate-500 truncate mt-0.5">{new Date(item.createdAt).toLocaleDateString()}</p>
                      </div>
                      <button
                        onClick={() => openEditForm(item)}
                        className="px-3 py-1.5 text-[10px] font-bold bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-colors flex-shrink-0 cursor-pointer"
                      >
                        Continue Edit
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recently Approved */}
            <div className="bg-white dark:bg-slate-900 border border-heritage-brown/10 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-heritage-brown/10 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-500/10 text-emerald-600 rounded-lg">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-serif font-black text-heritage-brown dark:text-white">
                    Recently Approved
                  </h3>
                </div>
                <button 
                  onClick={() => setActiveNav('submissions')}
                  className="text-[10px] font-black text-heritage-terracotta hover:underline cursor-pointer uppercase"
                >
                  View All
                </button>
              </div>

              {submissions.filter(s => s.status === 'approved' || s.status === 'published').length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No approved contributions yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {submissions.filter(s => s.status === 'approved' || s.status === 'published').slice(0, 4).map(item => (
                    <div 
                      key={item.id}
                      className="p-3.5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 flex items-center justify-between gap-3"
                    >
                      <div className="overflow-hidden">
                        <span className="text-[9px] font-bold uppercase text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md inline-block mb-1">
                          Approved & Active
                        </span>
                        <h4 className="font-serif font-black text-xs text-heritage-brown dark:text-white truncate">
                          {item.title}
                        </h4>
                        <p className="text-[10px] text-slate-500 truncate mt-0.5">{new Date(item.createdAt).toLocaleDateString()}</p>
                      </div>
                      <button
                        onClick={() => setReviewItem(item)}
                        className="px-3 py-1.5 text-[10px] font-bold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors flex-shrink-0 cursor-pointer"
                      >
                        View Details
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
          <div className="space-y-4 pb-4 border-b border-heritage-brown/10 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-serif font-black text-heritage-brown dark:text-white">
                  My Submissions Lifecycle
                </h2>
                <p className="text-xs text-heritage-brown/60 dark:text-slate-400 font-semibold mt-1">
                  Track status changes, review histories, and elder vetting decisions.
                </p>
              </div>

              {/* Primary Action Button */}
              <button
                onClick={() => {
                  resetForm();
                  setShowCreateForm(true);
                }}
                className="px-4 py-2.5 bg-heritage-terracotta text-white text-xs font-black uppercase tracking-wider rounded-xl hover:bg-heritage-terracotta/90 transition-all cursor-pointer flex items-center gap-2 self-start sm:self-auto shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>New Contribution</span>
              </button>
            </div>

            {/* Search and Filters Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
              {/* Search Box */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-heritage-brown/40 dark:text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search submissions..."
                  className="w-full pl-9 pr-8 py-2 bg-stone-50 dark:bg-slate-950 border border-heritage-brown/15 dark:border-slate-800 rounded-xl text-xs font-semibold focus:border-heritage-terracotta focus:outline-none"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 bg-stone-50 dark:bg-slate-950 border border-heritage-brown/15 dark:border-slate-800 rounded-xl text-xs font-semibold focus:border-heritage-terracotta focus:outline-none text-heritage-brown dark:text-slate-200"
              >
                <option value="all">All Categories</option>
                <option value="Maritime Traditions">Maritime Traditions</option>
                <option value="Community Guidance">Community Guidance</option>
                <option value="Clans & Lineage">Clans & Lineage</option>
                <option value="Heritage">Heritage</option>
                <option value="General">General</option>
              </select>

              {/* Content Type Filter */}
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 bg-stone-50 dark:bg-slate-950 border border-heritage-brown/15 dark:border-slate-800 rounded-xl text-xs font-semibold focus:border-heritage-terracotta focus:outline-none text-heritage-brown dark:text-slate-200"
              >
                <option value="all">All Content Types</option>
                <option value="article">Articles & Chronicles</option>
                <option value="event">Gatherings & Events</option>
                <option value="announcement">Announcements & Decrees</option>
              </select>

              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 bg-stone-50 dark:bg-slate-950 border border-heritage-brown/15 dark:border-slate-800 rounded-xl text-xs font-semibold focus:border-heritage-terracotta focus:outline-none text-heritage-brown dark:text-slate-200"
              >
                <option value="newest">Sort: Newest First</option>
                <option value="oldest">Sort: Oldest First</option>
                <option value="updated">Sort: Recently Updated</option>
                <option value="alpha">Sort: Alphabetical (A-Z)</option>
              </select>
            </div>

            {/* Status Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-heritage-brown/50 dark:text-slate-400 mr-1">
                Status:
              </span>
              {[
                { id: 'all', label: 'All Items' },
                { id: 'draft', label: 'Drafts' },
                { id: 'pending', label: 'Pending Review' },
                { id: 'revision', label: 'Revision / Rejected' },
                { id: 'approved', label: 'Approved' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setSubmissionFilter(tab.id as any)}
                  className={`px-3 py-1 text-[10px] font-black uppercase rounded-lg transition-all cursor-pointer ${
                    submissionFilter === tab.id 
                      ? 'bg-heritage-terracotta text-white shadow-sm' 
                      : 'bg-stone-100 dark:bg-slate-800 text-heritage-brown/70 dark:text-slate-300 hover:bg-stone-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {loadingSubmissions ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="p-5 border border-slate-200 dark:border-slate-800 rounded-3xl animate-pulse space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 bg-stone-200 dark:bg-slate-800 rounded-2xl" />
                    <div className="space-y-2 flex-1">
                      <div className="h-3 bg-stone-200 dark:bg-slate-800 rounded w-1/3" />
                      <div className="h-4 bg-stone-200 dark:bg-slate-800 rounded w-3/4" />
                    </div>
                  </div>
                  <div className="h-3 bg-stone-200 dark:bg-slate-800 rounded w-full" />
                </div>
              ))}
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="text-center py-16 text-heritage-brown/50 dark:text-slate-400 space-y-3">
              <FileText className="w-10 h-10 mx-auto text-heritage-brown/20 dark:text-slate-700" />
              <p className="text-xs font-bold uppercase tracking-wider">No submissions match the selected filters.</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setCategoryFilter('all');
                  setTypeFilter('all');
                  setSubmissionFilter('all');
                }}
                className="px-4 py-2 bg-stone-100 dark:bg-slate-800 text-xs font-bold rounded-xl text-heritage-brown dark:text-slate-200 hover:bg-stone-200 transition-colors cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredSubmissions.map(item => {
                const isDraft = item.status === 'draft';
                const isPending = item.status === 'pending';
                const isApproved = item.status === 'approved' || item.status === 'published';
                const isRejected = item.status === 'rejected' || item.status === 'revision';

                return (
                  <div 
                    key={item.id}
                    className="border border-heritage-brown/10 dark:border-slate-800 rounded-3xl p-5 hover:border-heritage-terracotta transition-all bg-white dark:bg-slate-900/60 shadow-sm flex flex-col justify-between gap-4"
                  >
                    <div className="flex items-start gap-4">
                      {/* Thumbnail */}
                      <div className="w-20 h-20 rounded-2xl bg-stone-100 dark:bg-slate-800 overflow-hidden flex-shrink-0 border border-stone-200 dark:border-slate-800 flex items-center justify-center">
                        {item.coverImage ? (
                          <img src={item.coverImage} alt={item.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="text-heritage-terracotta/60">
                            {item.type === 'event' ? <CalendarIcon className="w-8 h-8" /> : item.type === 'announcement' ? <Megaphone className="w-8 h-8" /> : <FileText className="w-8 h-8" />}
                          </div>
                        )}
                      </div>

                      {/* Content Info */}
                      <div className="overflow-hidden flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[9px] font-black uppercase bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-300 px-2 py-0.5 rounded-md">
                            {item.type}
                          </span>
                          
                          {/* Exact Moderation Status Colors */}
                          <span className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                            isDraft ? 'bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/70 dark:text-amber-300' :
                            isPending ? 'bg-sky-100 text-sky-900 border border-sky-300 dark:bg-sky-950/70 dark:text-sky-300' :
                            isApproved ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-300' :
                            'bg-rose-100 text-rose-900 border border-rose-300 dark:bg-rose-950/70 dark:text-rose-300'
                          }`}>
                            {item.status}
                          </span>
                        </div>

                        <h3 className="font-serif font-black text-sm text-heritage-brown dark:text-white line-clamp-1 mt-1">
                          {item.title}
                        </h3>

                        <div className="flex items-center gap-3 text-[10px] text-slate-400 font-semibold">
                          <span>Created: {new Date(item.createdAt).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>Updated: {new Date(item.updatedAt || item.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-heritage-brown/70 dark:text-slate-300 line-clamp-2 font-medium">
                      {item.summary || item.body?.substring(0, 140)}
                    </p>

                    {/* Inline Moderation Feedback Card */}
                    {isRejected && (
                      <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-2xl space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase text-rose-700 dark:text-rose-300 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Reviewer Feedback
                          </span>
                          {item.reviewedBy && (
                            <span className="text-[9px] text-rose-600/80 dark:text-rose-400 font-bold">
                              By {item.reviewedBy}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-rose-900 dark:text-rose-200 font-medium leading-relaxed italic">
                          "{item.elderFeedback || 'Revision requested by Elder Council. Please review historical details and resubmit.'}"
                        </p>
                        <button
                          onClick={() => openEditForm(item)}
                          className="w-full py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>One-Click Edit & Resubmit</span>
                        </button>
                      </div>
                    )}

                    {isApproved && item.elderFeedback && (
                      <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-xl">
                        <span className="text-[9px] font-black uppercase text-emerald-700 dark:text-emerald-300 block">
                          ✓ Vetting Notes: {item.elderFeedback}
                        </span>
                      </div>
                    )}

                    {/* Action Bar: View, Edit, Delete, Duplicate */}
                    <div className="flex items-center justify-between pt-3 border-t border-stone-100 dark:border-slate-800/80 gap-2">
                      <button
                        onClick={() => setReviewItem(item)}
                        className="px-3 py-1.5 text-[10px] font-bold text-slate-700 dark:text-slate-200 bg-stone-100 dark:bg-slate-800 rounded-xl hover:bg-stone-200 dark:hover:bg-slate-700 transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Details</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openEditForm(item)}
                          className="px-3 py-1.5 text-[10px] font-bold text-heritage-terracotta bg-heritage-terracotta/10 rounded-xl hover:bg-heritage-terracotta hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>

                        <button
                          onClick={() => {
                            const dupId = `sub-dup-${Date.now()}`;
                            const dupItem: ElderSubmission = {
                              ...item,
                              id: dupId,
                              title: `${item.title} (Draft Copy)`,
                              status: 'draft',
                              createdAt: new Date().toISOString(),
                              updatedAt: new Date().toISOString()
                            };
                            setSubmissions(prev => [dupItem, ...prev]);
                            triggerToast('Contribution duplicated as draft.');
                          }}
                          className="px-2.5 py-1.5 text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-stone-100 dark:bg-slate-800 rounded-xl hover:bg-stone-200 transition-colors cursor-pointer"
                          title="Duplicate Contribution"
                        >
                          Duplicate
                        </button>

                        <button
                          onClick={() => handleDeleteSubmission(item.id, item.originalTable)}
                          className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
                          title="Delete Contribution"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
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
                handleCloseForm();
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
                  onClick={handleCloseForm}
                  className="p-2 hover:bg-stone-100 dark:hover:bg-slate-800 rounded-full text-heritage-brown/50 dark:text-slate-400 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Scroll Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {editingSubmission && (editingSubmission.elderFeedback || editingSubmission.status === 'revision' || editingSubmission.status === 'rejected') && (
                  <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-2xl space-y-1.5 text-amber-900 dark:text-amber-200">
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-800 dark:text-amber-300">
                      <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <span>Council Reviewer Notes & Revision Guidance</span>
                    </div>
                    <p className="text-xs font-medium leading-relaxed italic bg-white/60 dark:bg-slate-900/60 p-3 rounded-xl border border-amber-200/60 dark:border-amber-900/60">
                      "{editingSubmission.elderFeedback || 'Council requested revisions. Please address the feedback, update necessary fields, and resubmit for final approval.'}"
                    </p>
                  </div>
                )}

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

                {/* Cover Image / Poster Upload */}
                <div>
                  <label className="block text-[9px] font-black uppercase text-heritage-brown/50 dark:text-slate-400 mb-2">
                    Cover Image / Event Poster Attachment
                  </label>
                  {formData.eventPoster ? (
                    <div className="relative rounded-2xl overflow-hidden border border-heritage-brown/15 bg-stone-50 dark:bg-slate-950 p-2 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img src={formData.eventPoster} alt="Cover preview" className="w-12 h-12 object-cover rounded-xl" referrerPolicy="no-referrer" />
                        <div>
                          <span className="text-xs font-bold text-emerald-600 block">Cover Image Linked</span>
                          <span className="text-[9px] text-slate-400 truncate max-w-[200px] block">{formData.eventPoster}</span>
                        </div>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setFormData(prev => ({ ...prev, eventPoster: '' }))}
                        className="p-1.5 bg-stone-200 dark:bg-slate-800 text-stone-700 dark:text-slate-300 rounded-lg hover:bg-rose-500 hover:text-white transition-colors cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <UploadZone
                      accept={["image/*"]}
                      maxSizeMB={10}
                      bucket="images"
                      folderPath="posters"
                      label="Upload Cover or Poster Image"
                      hint="PNG, JPG, or WEBP up to 10MB"
                      onUploadSuccess={(url) => {
                        setFormData(prev => ({ ...prev, eventPoster: url }));
                        triggerToast('Cover image attached successfully.');
                      }}
                      onUploadError={(err) => setFormError(`Cover upload error: ${err}`)}
                    />
                  )}
                </div>

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
                <label className="block text-[9px] font-black uppercase text-heritage-brown/50 dark:text-slate-400 mb-2">
                  File Attachment (Supabase Storage Bucket)
                </label>
                {mediaUrl ? (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 block">File Uploaded & Linked</span>
                      <span className="text-[10px] text-slate-500 truncate max-w-[220px] block">{mediaUrl}</span>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setMediaUrl('')}
                      className="p-1.5 bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 rounded-lg hover:bg-rose-500 hover:text-white transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <UploadZone
                    accept={
                      mediaType === 'image' ? ["image/*"] :
                      mediaType === 'audio' ? ["audio/*"] :
                      mediaType === 'video' ? ["video/*"] :
                      ["application/pdf", ".doc", ".docx"]
                    }
                    maxSizeMB={mediaType === 'video' ? 100 : 25}
                    bucket={mediaType === 'document' ? 'pdfs' : mediaType === 'audio' ? 'audio' : 'images'}
                    folderPath={mediaType}
                    label={`Select ${mediaType.toUpperCase()} file to upload`}
                    hint="Drag & drop file or click to browse"
                    onUploadSuccess={(url) => {
                      setMediaUrl(url);
                      triggerToast('Media file uploaded successfully.');
                    }}
                    onUploadError={(err) => setMediaError(`File upload error: ${err}`)}
                  />
                )}
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
              className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-heritage-brown/10 dark:border-slate-800 p-6 z-10 space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-start pb-3 border-b border-heritage-brown/10 dark:border-slate-800">
                <div>
                  <span className="text-[8px] font-black uppercase px-2.5 py-0.5 bg-heritage-terracotta/10 text-heritage-terracotta rounded-full">
                    Moderation Audit Log
                  </span>
                  <h3 className="font-serif font-black text-base text-heritage-brown dark:text-white mt-1">
                    Vetting History & Details
                  </h3>
                </div>
                <button onClick={() => setReviewItem(null)} className="p-1 text-heritage-brown/40 hover:text-heritage-brown cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status Header */}
              <div className="flex items-center justify-between bg-stone-50 dark:bg-slate-950 p-3 rounded-2xl border border-stone-200 dark:border-slate-800">
                <div>
                  <span className="text-[9px] font-bold uppercase text-slate-400 block">Current Status</span>
                  <span className={`text-xs font-black uppercase tracking-wider ${
                    reviewItem.status === 'approved' || reviewItem.status === 'published' ? 'text-emerald-600' :
                    reviewItem.status === 'pending' ? 'text-sky-600' :
                    reviewItem.status === 'draft' ? 'text-amber-600' : 'text-rose-600'
                  }`}>
                    {reviewItem.status}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-bold uppercase text-slate-400 block">Category</span>
                  <span className="text-xs font-bold text-heritage-brown dark:text-slate-200">{reviewItem.category || 'General'}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <h4 className="font-serif font-black text-sm text-heritage-brown dark:text-white">
                    {reviewItem.title}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                    Submitted on {new Date(reviewItem.createdAt).toLocaleString()}
                  </p>
                </div>

                {/* Feedback Section */}
                {(reviewItem.status === 'rejected' || reviewItem.status === 'revision' || reviewItem.elderFeedback) && (
                  <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-2xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-rose-700 dark:text-rose-300 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Reviewer Feedback
                      </span>
                      {reviewItem.reviewedBy && (
                        <span className="text-[9px] font-bold text-rose-600/80 dark:text-rose-400">
                          Reviewer: {reviewItem.reviewedBy}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-rose-900 dark:text-rose-200 font-medium italic leading-relaxed">
                      "{reviewItem.elderFeedback || 'Please review the content body for clarity and resubmit.'}"
                    </p>
                  </div>
                )}

                {/* Content Preview */}
                <div className="space-y-1">
                  <span className="text-[9px] font-black uppercase text-slate-400">Content Preview</span>
                  <div className="p-3 bg-stone-50 dark:bg-slate-950 rounded-2xl border border-stone-200 dark:border-slate-800 text-xs text-heritage-brown/80 dark:text-slate-300 max-h-40 overflow-y-auto font-sans leading-relaxed">
                    {reviewItem.body}
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex items-center justify-between pt-4 border-t border-heritage-brown/10 dark:border-slate-800 gap-3">
                <button 
                  onClick={() => setReviewItem(null)} 
                  className="px-4 py-2 bg-stone-100 dark:bg-slate-800 text-xs font-bold rounded-xl cursor-pointer text-slate-700 dark:text-slate-200 hover:bg-stone-200"
                >
                  Dismiss
                </button>

                <button
                  onClick={() => {
                    const itemToEdit = reviewItem;
                    setReviewItem(null);
                    openEditForm(itemToEdit);
                  }}
                  className="px-4 py-2 bg-heritage-terracotta text-white text-xs font-bold rounded-xl cursor-pointer hover:bg-heritage-terracotta/90 flex items-center gap-1.5 shadow-sm"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit & Resubmit</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CONFIRMATION MODAL */}
      <AnimatePresence>
        {confirmModal && confirmModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmModal(null)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-heritage-brown/10 dark:border-slate-800 p-6 z-10 space-y-4 text-center"
            >
              <div className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center ${
                confirmModal.isDanger ? 'bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-300' : 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-300'
              }`}>
                <AlertCircle className="w-6 h-6" />
              </div>

              <div className="space-y-1">
                <h3 className="font-serif font-black text-lg text-heritage-brown dark:text-white">
                  {confirmModal.title}
                </h3>
                <p className="text-xs text-heritage-brown/70 dark:text-slate-300 font-medium leading-relaxed">
                  {confirmModal.message}
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmModal(null)}
                  className="px-4 py-2 text-xs font-bold bg-stone-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-stone-200 cursor-pointer"
                >
                  {confirmModal.cancelText || 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    confirmModal.onConfirm();
                  }}
                  className={`px-4 py-2 text-xs font-bold text-white rounded-xl shadow cursor-pointer transition-colors ${
                    confirmModal.isDanger ? 'bg-rose-600 hover:bg-rose-700' : 'bg-heritage-terracotta hover:bg-heritage-terracotta/90'
                  }`}
                >
                  {confirmModal.confirmText || 'Confirm'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
