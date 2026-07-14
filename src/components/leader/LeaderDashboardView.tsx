import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Megaphone, Newspaper, Calendar as CalendarIcon, Trophy, AlertOctagon, 
  Plus, Edit3, Trash2, CheckCircle2, Clock, Eye, AlertTriangle, 
  Upload, FileText, Play, Volume2, Image as ImageIcon, Check, 
  X, ChevronRight, User, Bell, Sliders, ChevronDown, RefreshCw, 
  MessageSquare, Calendar, ChevronLeft, ArrowUpRight, Search, 
  MapPin, Clock4, Users, Radio, ArrowLeft, ArrowRight
} from 'lucide-react';
import { getSupabase } from '../../lib/supabaseClient';
import { generateUUID } from '../../lib/supabase';

// ==========================================
// DATA MODELS & SCHEMAS
// ==========================================

interface Submission {
  id: string;
  title: string;
  type: 'announcement' | 'news' | 'event' | 'highlight' | 'notice';
  status: 'draft' | 'pending' | 'approved' | 'revision' | 'rejected' | 'archived';
  category: string;
  body: string;
  summary?: string;
  createdAt: string;
  updatedAt: string;
  reviewedBy?: string;
  elderFeedback?: string;
  revisionHistory: Array<{
    date: string;
    action: string;
    note: string;
  }>;
  // Module specific fields
  eventDetails?: {
    date: string;
    time: string;
    venue: string;
    guestSpeaker?: string;
    posterUrl?: string;
    clanScope?: string;
  };
  newsMedia?: string[];
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

interface MediaAlbum {
  id: string;
  name: string;
  description: string;
  type: 'image' | 'video' | 'audio';
  createdAt: string;
}

interface LeaderMedia {
  id: string;
  title: string;
  description: string;
  type: 'image' | 'video' | 'audio';
  url: string;
  thumbnail: string;
  albumId?: string;
  status: 'draft' | 'pending' | 'approved';
  createdAt: string;
}

interface LeaderNotification {
  id: string;
  title: string;
  body: string;
  type: 'approved' | 'revision' | 'feedback' | 'alert';
  isRead: boolean;
  timestamp: string;
}

// Seed Initial Data for Demo/Sandbox
const INITIAL_SUBMISSIONS: Submission[] = [
  {
    id: 'sub-1',
    title: 'Lukenye Vocabulary Audio Sessions Launching',
    type: 'announcement',
    status: 'approved',
    category: 'Language Preservation',
    body: 'The language department will stream recorded audio pronunciations of foundational Lukenye greetings, verbs, and maritime terms every Thursday evening.',
    summary: 'Stream schedules and lists of certified speakers for Lukenye language loops.',
    createdAt: '2026-07-10T14:30:00Z',
    updatedAt: '2026-07-11T09:00:00Z',
    reviewedBy: 'Elder Moses Musuusu',
    revisionHistory: [
      { date: '2026-07-10T14:30:00Z', action: 'Created Submission', note: 'Draft initialized.' },
      { date: '2026-07-10T15:00:00Z', action: 'Submitted to Council', note: 'Sent for elder audit.' },
      { date: '2026-07-11T09:00:00Z', action: 'Approved', note: 'Published immediately on the sanctuary feed.' }
    ],
    priority: 'high'
  },
  {
    id: 'sub-2',
    title: 'Abatenga Fishery & Netcrafting Exhibition Notice',
    type: 'notice',
    status: 'revision',
    category: 'Cultural Exhibition',
    body: 'Community gathering notice to convene Abatenga lineage members to donate ancient handmade deep water fishing nets for the regional museum exhibit.',
    summary: 'Pottery and net-weaving specimens needed for Paliisa cultural assembly.',
    createdAt: '2026-07-12T08:15:00Z',
    updatedAt: '2026-07-13T10:45:00Z',
    reviewedBy: 'Elder David K.',
    elderFeedback: 'Please specify the exact dates and hours that elders can deliver these nets safely, and clarify that fragile materials will be guarded in high-security glass cages.',
    revisionHistory: [
      { date: '2026-07-12T08:15:00Z', action: 'Created Submission', note: 'Initial draft.' },
      { date: '2026-07-12T10:00:00Z', action: 'Submitted to Council', note: 'Requested priority review.' },
      { date: '2026-07-13T10:45:00Z', action: 'Revision Requested', note: 'Elder David requested security clarifications.' }
    ],
    priority: 'medium'
  },
  {
    id: 'sub-3',
    title: 'Youth Canoe Construction Seminar',
    type: 'event',
    status: 'pending',
    category: 'Maritime Architecture',
    body: 'A hands-on woodwork masterclass where youngsters learn the architectural geometry, water density considerations, and wood-curing secrets for Lake Kyoga wooden vessels.',
    summary: 'Empowering the next generation of shipwrights and navigators.',
    createdAt: '2026-07-14T06:00:00Z',
    updatedAt: '2026-07-14T06:00:00Z',
    revisionHistory: [
      { date: '2026-07-14T06:00:00Z', action: 'Submitted to Council', note: 'Sent for verification.' }
    ],
    eventDetails: {
      date: '2026-08-20',
      time: '10:00 AM - 03:00 PM',
      venue: 'Masese Traditional Landing Site',
      guestSpeaker: 'Shipwright Master Charles Isabirye',
      posterUrl: 'https://images.unsplash.com/photo-1523805009345-7448845a9e53?q=80&w=600',
      clanScope: 'All Clans Welcome'
    },
    priority: 'high'
  },
  {
    id: 'sub-4',
    title: 'Floating Island Flood Alert notices',
    type: 'notice',
    status: 'draft',
    category: 'Emergency Dispatch',
    body: 'Drafting critical alerts for residents living near Paliisa eastern bay. Water level charts show unprecedented rise in Kyoga marsh basins, causing floating roots to detach.',
    summary: 'Ebiswa anchoring warnings and safe coordinate corridors.',
    createdAt: '2026-07-14T07:12:00Z',
    updatedAt: '2026-07-14T07:12:00Z',
    revisionHistory: [
      { date: '2026-07-14T07:12:00Z', action: 'Created Draft', note: 'Saved locally.' }
    ],
    priority: 'critical'
  }
];

const INITIAL_MEDIA: LeaderMedia[] = [
  {
    id: 'm-1',
    title: 'Elder Mary Nak Weaving Papyrus',
    description: 'Documenting the intricate diagonal weaving process used for structural flooring mats of floating cabins.',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=800',
    thumbnail: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=200',
    albumId: 'alb-1',
    status: 'approved',
    createdAt: '2026-07-10T11:00:00Z'
  },
  {
    id: 'm-2',
    title: 'Buoyancy Calibration Ritual Chant',
    description: 'Oral audio prayer recorded prior to launching traditional dugout boats on Lake Kyoga.',
    type: 'audio',
    url: '#audio-stream',
    thumbnail: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=200',
    albumId: 'alb-2',
    status: 'pending',
    createdAt: '2026-07-13T15:20:00Z'
  }
];

const INITIAL_ALBUMS: MediaAlbum[] = [
  { id: 'alb-1', name: 'Paliisa Weaving Arts', description: 'Papyrus harvesting, drying, and curing processes.', type: 'image', createdAt: '2026-07-01T00:00:00Z' },
  { id: 'alb-2', name: 'Maritime Oral Anthems', description: 'Fishing, paddling, and assembly songs.', type: 'audio', createdAt: '2026-07-05T00:00:00Z' }
];

const INITIAL_NOTIFICATIONS: LeaderNotification[] = [
  {
    id: 'not-1',
    title: 'Submission Approved!',
    body: 'Your announcement "Lukenye Vocabulary Audio Sessions" has been approved and published on the homepage feed.',
    type: 'approved',
    isRead: false,
    timestamp: '3 hours ago'
  },
  {
    id: 'not-2',
    title: 'Revision Required',
    body: 'Elder David K. requested security changes on "Abatenga Lineage Netcraft notice". Please edit and resubmit.',
    type: 'revision',
    isRead: false,
    timestamp: '1 day ago'
  }
];

export default function LeaderDashboardView({ user }: { user: any }) {
  // Navigation tabs: 'dashboard', 'hub', 'media', 'submissions', 'calendar', 'notifications', 'profile', 'settings'
  const [activeNav, setActiveNav] = useState<string>('dashboard');
  
  // Dashboard states
  const [submissions, setSubmissions] = useState<Submission[]>(() => {
    const stored = localStorage.getItem('bakenye_leader_submissions');
    return stored ? JSON.parse(stored) : INITIAL_SUBMISSIONS;
  });

  const [mediaList, setMediaList] = useState<LeaderMedia[]>(() => {
    const stored = localStorage.getItem('bakenye_leader_media');
    return stored ? JSON.parse(stored) : INITIAL_MEDIA;
  });

  const [albums, setAlbums] = useState<MediaAlbum[]>(() => {
    const stored = localStorage.getItem('bakenye_leader_albums');
    return stored ? JSON.parse(stored) : INITIAL_ALBUMS;
  });

  const [notifications, setNotifications] = useState<LeaderNotification[]>(() => {
    const stored = localStorage.getItem('bakenye_leader_notifs');
    return stored ? JSON.parse(stored) : INITIAL_NOTIFICATIONS;
  });

  // Local storage synchronization
  useEffect(() => {
    localStorage.setItem('bakenye_leader_submissions', JSON.stringify(submissions));
  }, [submissions]);

  useEffect(() => {
    localStorage.setItem('bakenye_leader_media', JSON.stringify(mediaList));
  }, [mediaList]);

  useEffect(() => {
    localStorage.setItem('bakenye_leader_albums', JSON.stringify(albums));
  }, [albums]);

  useEffect(() => {
    localStorage.setItem('bakenye_leader_notifs', JSON.stringify(notifications));
  }, [notifications]);

  // Toast / Status state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Profile Form States
  const [profileName, setProfileName] = useState(user?.user_metadata?.full_name || 'Sarah Nakato');
  const [profilePhone, setProfilePhone] = useState('+256 772 123456');
  const [preferredDialect, setPreferredDialect] = useState('Lukenye Paliisa');
  const [notifyByEmail, setNotifyByEmail] = useState(true);

  // Submissions filter state
  const [submissionFilter, setSubmissionFilter] = useState<'all' | 'draft' | 'pending' | 'approved' | 'revision' | 'rejected'>('all');

  // Hub form modal / sliding panel state
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const [formType, setFormType] = useState<'announcement' | 'news' | 'event' | 'highlight' | 'notice'>('announcement');
  const [editingSubmission, setEditingSubmission] = useState<Submission | null>(null);

  // Form Fields State
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    body: '',
    summary: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    eventDate: '',
    eventTime: '',
    eventVenue: '',
    eventSpeaker: '',
    eventScope: 'All Clans Welcome',
    eventPoster: ''
  });

  const resetForm = () => {
    setFormData({
      title: '',
      category: '',
      body: '',
      summary: '',
      priority: 'medium',
      eventDate: '',
      eventTime: '',
      eventVenue: '',
      eventSpeaker: '',
      eventScope: 'All Clans Welcome',
      eventPoster: ''
    });
    setEditingSubmission(null);
  };

  // Open Form for Editing
  const openEditForm = (sub: Submission) => {
    setEditingSubmission(sub);
    setFormType(sub.type);
    setFormData({
      title: sub.title,
      category: sub.category,
      body: sub.body,
      summary: sub.summary || '',
      priority: sub.priority || 'medium',
      eventDate: sub.eventDetails?.date || '',
      eventTime: sub.eventDetails?.time || '',
      eventVenue: sub.eventDetails?.venue || '',
      eventSpeaker: sub.eventDetails?.guestSpeaker || '',
      eventScope: sub.eventDetails?.clanScope || 'All Clans Welcome',
      eventPoster: sub.eventDetails?.posterUrl || ''
    });
    setShowCreateForm(true);
  };

  // Handle Form Submission (Draft or Submit)
  const saveSubmission = (action: 'draft' | 'pending') => {
    if (!formData.title || !formData.body || !formData.category) {
      triggerToast('Please fill in title, category, and content fields!');
      return;
    }

    const isEdit = !!editingSubmission;
    const now = new Date().toISOString();

    const formattedSubmission: Submission = {
      id: isEdit ? editingSubmission!.id : 'sub-' + Date.now(),
      title: formData.title,
      type: formType,
      status: action,
      category: formData.category,
      body: formData.body,
      summary: formData.summary,
      priority: formData.priority,
      createdAt: isEdit ? editingSubmission!.createdAt : now,
      updatedAt: now,
      reviewedBy: isEdit ? editingSubmission!.reviewedBy : undefined,
      elderFeedback: isEdit && action === 'pending' ? undefined : editingSubmission?.elderFeedback, // clear feedback if resubmitted
      revisionHistory: [
        ...(isEdit ? editingSubmission!.revisionHistory : []),
        {
          date: now,
          action: action === 'draft' ? 'Saved Draft' : isEdit ? 'Resubmitted for Review' : 'Submitted for Elder Audit',
          note: isEdit ? 'Updates applied' : 'New submission'
        }
      ],
      eventDetails: formType === 'event' ? {
        date: formData.eventDate,
        time: formData.eventTime,
        venue: formData.eventVenue,
        guestSpeaker: formData.eventSpeaker,
        posterUrl: formData.eventPoster || 'https://images.unsplash.com/photo-1501535033-a593e6afb94d?q=80&w=600',
        clanScope: formData.eventScope
      } : undefined
    };

    if (isEdit) {
      setSubmissions(prev => prev.map(item => item.id === formattedSubmission.id ? formattedSubmission : item));
      triggerToast(action === 'draft' ? 'Draft updated successfully.' : 'Submissions successfully updated & sent to Elder Board!');
    } else {
      setSubmissions(prev => [formattedSubmission, ...prev]);
      triggerToast(action === 'draft' ? 'Saved to local drafts.' : 'New chronicle sent to Elder Council for approval.');
    }

    // Real Supabase insert if client is ready
    const client = getSupabase();
    if (client && action === 'pending') {
      const emailStr = user?.email || 'reporter@bakenye.com';
      client.from('contributions').insert({
        title: formattedSubmission.title,
        content: JSON.stringify({
          description: formattedSubmission.body,
          imageUrl: formattedSubmission.eventDetails?.posterUrl || '',
          type: formattedSubmission.type,
          userEmail: emailStr,
          userId: user?.id || ''
        }),
        status: 'pending',
        reporter_id: user?.id || null
      }).then(({ error }) => {
        if (error) console.error("Could not sync leader submission with remote DB:", error);
      });
    }

    setShowCreateForm(false);
    resetForm();
  };

  // Delete Draft
  const deleteSubmissionItem = (id: string) => {
    if (window.confirm("Are you sure you want to delete this submission? This action is irreversible.")) {
      setSubmissions(prev => prev.filter(item => item.id !== id));
      triggerToast('Submission deleted.');
    }
  };

  // Media Manager Form states
  const [showMediaForm, setShowMediaForm] = useState(false);
  const [mediaTitle, setMediaTitle] = useState('');
  const [mediaDesc, setMediaDesc] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'audio'>('image');
  const [mediaAlbum, setMediaAlbum] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');

  const submitMedia = (status: 'draft' | 'pending') => {
    if (!mediaTitle || !mediaDesc) {
      triggerToast('Please provide a title and description.');
      return;
    }

    const defaultThumbs = {
      image: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?q=80&w=200',
      video: 'https://images.unsplash.com/photo-1501535033-a593e6afb94d?q=80&w=200',
      audio: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=200'
    };

    const newMedia: LeaderMedia = {
      id: 'media-' + Date.now(),
      title: mediaTitle,
      description: mediaDesc,
      type: mediaType,
      url: mediaUrl || '#stream-link',
      thumbnail: defaultThumbs[mediaType],
      albumId: mediaAlbum || undefined,
      status,
      createdAt: new Date().toISOString()
    };

    setMediaList(prev => [newMedia, ...prev]);
    triggerToast(status === 'draft' ? 'Media draft saved.' : 'Media submitted for Elder approval.');
    
    // Clear and close
    setMediaTitle('');
    setMediaDesc('');
    setMediaUrl('');
    setMediaAlbum('');
    setShowMediaForm(false);
  };

  // Active review modal for detailed feedback Resubmission
  const [reviewItem, setReviewItem] = useState<Submission | null>(null);

  // Filter Submissions
  const filteredSubmissions = submissions.filter(s => {
    if (submissionFilter === 'all') return true;
    return s.status === submissionFilter;
  });

  // Calendar logic
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 6)); // July 2026
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayIndex = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

  // Match events to days
  const getDayEvents = (day: number) => {
    const formattedDate = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return submissions.filter(s => s.type === 'event' && s.eventDetails?.date === formattedDate);
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };
  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  return (
    <div className="min-h-screen bg-heritage-cream text-heritage-brown dark:bg-slate-950 dark:text-white transition-colors duration-300 flex flex-col lg:flex-row gap-6 p-4 md:p-8">
      
      {/* Dynamic Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-heritage-terracotta text-white font-serif px-6 py-3.5 rounded-full shadow-2xl flex items-center gap-3 border border-heritage-cream/15 font-black text-sm"
          >
            <CheckCircle2 className="w-5 h-5 text-heritage-cream animate-pulse" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LEFT COLUMN: Sidebar Navigation Panel */}
      <div className="lg:w-72 shrink-0 bg-white dark:bg-slate-900 border border-heritage-brown/10 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex flex-col justify-between self-start w-full lg:sticky lg:top-8">
        <div>
          {/* User Profile Summary */}
          <div className="flex items-center gap-3.5 pb-5 border-b border-heritage-brown/5 dark:border-slate-800 mb-6">
            <div className="w-12 h-12 rounded-full bg-heritage-terracotta border-2 border-heritage-terracotta/20 flex items-center justify-center text-white font-serif font-black text-lg select-none uppercase shadow-inner">
              {profileName.substring(0, 2)}
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-serif font-black text-heritage-brown dark:text-white truncate">
                {profileName}
              </h2>
              <span className="text-[10px] font-black uppercase text-heritage-terracotta tracking-wider flex items-center gap-1.5 mt-0.5">
                <Radio className="w-3 h-3 text-heritage-terracotta animate-pulse" />
                <span>Community Leader</span>
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {[
              { id: 'dashboard', label: 'Overview Panel', icon: Sliders },
              { id: 'hub', label: 'Community Hub', icon: Megaphone },
              { id: 'media', label: 'Media Vault', icon: ImageIcon },
              { id: 'submissions', label: 'My Submissions', icon: FileText, badge: submissions.length },
              { id: 'calendar', label: 'Operational Calendar', icon: CalendarIcon },
              { id: 'notifications', label: 'Notifications Feed', icon: Bell, badge: notifications.filter(n => !n.isRead).length },
              { id: 'profile', label: 'Profile Settings', icon: User },
            ].map(item => {
              const IconComp = item.icon;
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveNav(item.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-heritage-terracotta/10 text-heritage-terracotta border border-heritage-terracotta/25 dark:bg-heritage-terracotta/20 dark:text-heritage-sand' 
                      : 'text-heritage-brown/70 hover:bg-heritage-brown/5 hover:text-heritage-brown dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-white border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <IconComp className={`w-4 h-4 ${isActive ? 'text-heritage-terracotta' : 'text-heritage-brown/40 dark:text-slate-500'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge ? (
                    <span className="px-2 py-0.5 text-[9px] bg-heritage-terracotta text-white rounded-full font-sans font-black">
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Support Card in sidebar */}
        <div className="mt-8 pt-6 border-t border-heritage-brown/5 dark:border-slate-800 hidden lg:block">
          <div className="bg-heritage-cream/20 dark:bg-slate-950/40 border border-heritage-brown/5 rounded-2xl p-4">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-heritage-terracotta mb-1.5">
              Elder Council Rule
            </h4>
            <p className="text-[10.5px] text-heritage-brown/60 dark:text-slate-400 leading-normal font-semibold">
              All stories, notices, and events are reviewed by Elders before becoming available to public members.
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Dynamic Content Display Panel */}
      <div className="flex-1 min-w-0">
        
        {/* ==========================================
            VIEW 1: OVERVIEW DASHBOARD PANEL
            ========================================== */}
        {activeNav === 'dashboard' && (
          <div className="space-y-8 animate-fade-in">
            {/* Welcome Greeting Banner */}
            <div className="bg-gradient-to-br from-heritage-terracotta to-orange-800 rounded-[32px] p-6 md:p-8 text-white relative overflow-hidden shadow-md">
              <div className="absolute right-0 bottom-0 top-0 opacity-10 pointer-events-none select-none cultural-pattern w-[35%]" />
              <div className="max-w-xl relative z-10">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-white/10 text-white/95 px-3 py-1 rounded-full inline-block mb-3 border border-white/5">
                  Lukenye Greetings • Omusinge gw’Omuriango!
                </span>
                <h1 className="text-2xl md:text-3.5xl font-serif font-black leading-tight">
                  Buoyancy & Wisdom, {profileName}
                </h1>
                <p className="text-white/80 text-xs md:text-sm mt-2 leading-relaxed font-semibold">
                  Manage the dispatches, announcements, news logs, and localized events of Paliisa under the strict governance of the Elder Board.
                </p>
              </div>

              {/* Top Level Quick Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-white/10">
                <div className="bg-white/5 border border-white/5 rounded-2xl p-3">
                  <span className="block text-[10px] font-black text-white/55 uppercase tracking-wider">Submissions</span>
                  <span className="text-lg md:text-xl font-serif font-black">{submissions.length}</span>
                </div>
                <div className="bg-white/5 border border-white/5 rounded-2xl p-3">
                  <span className="block text-[10px] font-black text-white/55 uppercase tracking-wider">Pending Audit</span>
                  <span className="text-lg md:text-xl font-serif font-black text-amber-300">
                    {submissions.filter(s => s.status === 'pending').length}
                  </span>
                </div>
                <div className="bg-white/5 border border-white/5 rounded-2xl p-3">
                  <span className="block text-[10px] font-black text-white/55 uppercase tracking-wider">Approved</span>
                  <span className="text-lg md:text-xl font-serif font-black text-emerald-300">
                    {submissions.filter(s => s.status === 'approved').length}
                  </span>
                </div>
                <div className="bg-white/5 border border-white/5 rounded-2xl p-3">
                  <span className="block text-[10px] font-black text-white/55 uppercase tracking-wider">Needs Revision</span>
                  <span className="text-lg md:text-xl font-serif font-black text-orange-300">
                    {submissions.filter(s => s.status === 'revision').length}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions Bar */}
            <div className="bg-white dark:bg-slate-900 border border-heritage-brown/10 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
              <h3 className="text-xs font-black uppercase tracking-widest text-heritage-brown dark:text-heritage-sand mb-4 pb-2 border-b border-heritage-brown/5">
                Dispatch Action Box
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  { type: 'announcement', label: 'Announce', color: 'text-sky-600 bg-sky-50 dark:bg-sky-950/20 border-sky-100 dark:border-sky-900/30', icon: Megaphone },
                  { type: 'news', label: 'News Entry', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30', icon: Newspaper },
                  { type: 'event', label: 'Create Event', color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30', icon: CalendarIcon },
                  { type: 'highlight', label: 'Highlight', color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/20 border-purple-100 dark:border-purple-900/30', icon: Trophy },
                  { type: 'notice', label: 'Write Notice', color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30', icon: AlertOctagon },
                ].map(action => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.type}
                      onClick={() => {
                        setFormType(action.type as any);
                        setShowCreateForm(true);
                      }}
                      className={`flex flex-col items-center justify-center p-4 rounded-2xl border hover:scale-[1.02] transition-all cursor-pointer ${action.color}`}
                    >
                      <Icon className="w-5 h-5 mb-2 shrink-0" />
                      <span className="text-xs font-bold uppercase tracking-wider">{action.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* BENTO GRID: Pending / Revision Requests vs Recent Approved */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Bento: Action Required / Needs Revision & Elder Feedback */}
              <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-heritage-brown/10 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-heritage-brown/5 mb-5">
                    <h3 className="text-xs font-black uppercase tracking-widest text-heritage-brown dark:text-heritage-sand flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-heritage-terracotta" />
                      <span>Revisions & Active Audits</span>
                    </h3>
                    <span className="text-[10px] font-black uppercase text-heritage-terracotta px-2.5 py-0.5 bg-heritage-terracotta/10 rounded-full">
                      Needs Action ({submissions.filter(s => s.status === 'revision').length})
                    </span>
                  </div>

                  <div className="space-y-4">
                    {submissions.filter(s => s.status === 'revision').map(item => (
                      <div 
                        key={item.id}
                        className="p-5 bg-orange-50/40 dark:bg-slate-950/40 border border-orange-200 dark:border-orange-950/60 rounded-2xl"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-300 rounded">
                            {item.type}
                          </span>
                          <span className="text-[10px] text-heritage-brown/40 dark:text-slate-500 font-bold">
                            {new Date(item.updatedAt).toLocaleDateString()}
                          </span>
                        </div>

                        <h4 className="font-serif font-black text-sm text-heritage-brown dark:text-white leading-snug">
                          {item.title}
                        </h4>

                        {/* ELDER FEEDBACK CONTAINER */}
                        <div className="bg-heritage-terracotta/5 border-l-4 border-heritage-terracotta p-3 rounded-r-xl mt-3 mb-4">
                          <span className="block text-[8px] font-black uppercase tracking-widest text-heritage-terracotta mb-1">
                            Elder Feedback ({item.reviewedBy || 'Reviewer Elder'}):
                          </span>
                          <p className="text-[11px] text-heritage-brown dark:text-slate-300 italic leading-relaxed font-semibold">
                            "{item.elderFeedback || 'No details provided.'}"
                          </p>
                        </div>

                        <div className="flex justify-end gap-2.5">
                          <button
                            onClick={() => openEditForm(item)}
                            className="px-3.5 py-1.5 bg-heritage-terracotta text-white hover:bg-heritage-terracotta/90 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Modify & Resubmit</span>
                          </button>
                        </div>
                      </div>
                    ))}

                    {submissions.filter(s => s.status === 'revision').length === 0 && (
                      <div className="text-center py-10 bg-heritage-cream/10 rounded-2xl border border-dashed border-heritage-brown/15 p-6">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                        <h4 className="font-serif font-black text-xs text-heritage-brown dark:text-white mb-0.5">
                          Pristine Council Records
                        </h4>
                        <p className="text-[11px] text-heritage-brown/50 dark:text-slate-400">
                          No revisions have been requested by the Elder Council at this time.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Bento: Recently Approved Content */}
              <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-heritage-brown/10 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-heritage-brown/5 mb-5">
                    <h3 className="text-xs font-black uppercase tracking-widest text-heritage-brown dark:text-heritage-sand flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>Recently Published</span>
                    </h3>
                  </div>

                  <div className="space-y-3">
                    {submissions.filter(s => s.status === 'approved').slice(0, 3).map(item => (
                      <div 
                        key={item.id}
                        className="p-3.5 bg-heritage-cream/15 dark:bg-slate-950/20 border border-heritage-brown/5 dark:border-slate-850 rounded-xl flex items-start gap-3.5"
                      >
                        <div className="p-2 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg shrink-0 border border-emerald-100 dark:border-emerald-900/30">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[8px] font-black uppercase text-heritage-terracotta">
                              {item.type}
                            </span>
                            <span className="text-[9px] text-heritage-brown/40 dark:text-slate-500">
                              {new Date(item.updatedAt).toLocaleDateString()}
                            </span>
                          </div>
                          <h4 className="font-serif font-extrabold text-xs text-heritage-brown dark:text-white truncate leading-snug mt-0.5">
                            {item.title}
                          </h4>
                          <span className="text-[9.5px] text-heritage-brown/60 dark:text-slate-400 block truncate mt-0.5 font-semibold">
                            Reviewed by {item.reviewedBy || 'the Elder Council'}
                          </span>
                        </div>
                      </div>
                    ))}

                    {submissions.filter(s => s.status === 'approved').length === 0 && (
                      <div className="text-center py-12 text-heritage-brown/40">
                        No approved dispatches found on feed.
                      </div>
                    )}
                  </div>
                </div>

                <button 
                  onClick={() => {
                    setSubmissionFilter('approved');
                    setActiveNav('submissions');
                  }}
                  className="w-full text-center text-[10px] font-black uppercase text-heritage-terracotta hover:underline pt-4 mt-4 border-t border-heritage-brown/5 flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>Browse Published Sanctuary Logs</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>

          </div>
        )}

        {/* ==========================================
            VIEW 2: COMMUNITY HUB (PUBLISHING LOGS)
            ========================================== */}
        {activeNav === 'hub' && (
          <div className="bg-white dark:bg-slate-900 border border-heritage-brown/10 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-5 border-b border-heritage-brown/10 dark:border-slate-800 gap-4">
              <div>
                <h2 className="text-xl font-serif font-black text-heritage-brown dark:text-white">
                  Community Hub Management
                </h2>
                <p className="text-xs text-heritage-brown/60 dark:text-slate-400 mt-1 font-semibold">
                  Launch announcements, local events, safety dispatches, news stories, and clan celebrations.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setFormType('announcement');
                    setShowCreateForm(true);
                  }}
                  className="px-4 py-2.5 bg-heritage-terracotta text-white hover:bg-heritage-terracotta/90 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Draft New Chronicle</span>
                </button>
              </div>
            </div>

            {/* Core Modules Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Module: Announcements */}
              <div className="border border-heritage-brown/10 dark:border-slate-800 rounded-2xl p-5 hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  <span className="p-2.5 bg-sky-50 dark:bg-sky-950/20 text-sky-600 rounded-xl inline-block mb-3.5 border border-sky-100 dark:border-sky-900/30">
                    <Megaphone className="w-5 h-5 shrink-0" />
                  </span>
                  <h3 className="font-serif font-black text-base text-heritage-brown dark:text-white">
                    Announcements Board
                  </h3>
                  <p className="text-xs text-heritage-brown/60 dark:text-slate-400 leading-relaxed mt-1 font-semibold">
                    Broadcast structural board notes, floating school openings, and local meeting directives.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setFormType('announcement');
                    setShowCreateForm(true);
                  }}
                  className="text-xs font-black uppercase text-sky-600 hover:underline mt-4 text-left cursor-pointer flex items-center gap-1"
                >
                  <span>Compose Dispatch</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Module: News */}
              <div className="border border-heritage-brown/10 dark:border-slate-800 rounded-2xl p-5 hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  <span className="p-2.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 rounded-xl inline-block mb-3.5 border border-emerald-100 dark:border-emerald-900/30">
                    <Newspaper className="w-5 h-5 shrink-0" />
                  </span>
                  <h3 className="font-serif font-black text-base text-heritage-brown dark:text-white">
                    News Articles
                  </h3>
                  <p className="text-xs text-heritage-brown/60 dark:text-slate-400 leading-relaxed mt-1 font-semibold">
                    Document local updates, archaeological findings, and clan historical resolutions.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setFormType('news');
                    setShowCreateForm(true);
                  }}
                  className="text-xs font-black uppercase text-emerald-600 hover:underline mt-4 text-left cursor-pointer flex items-center gap-1"
                >
                  <span>Write News Segment</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Module: Events */}
              <div className="border border-heritage-brown/10 dark:border-slate-800 rounded-2xl p-5 hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  <span className="p-2.5 bg-amber-50 dark:bg-amber-950/20 text-amber-600 rounded-xl inline-block mb-3.5 border border-amber-100 dark:border-amber-900/30">
                    <CalendarIcon className="w-5 h-5 shrink-0" />
                  </span>
                  <h3 className="font-serif font-black text-base text-heritage-brown dark:text-white">
                    Event Logistics Coordinator
                  </h3>
                  <p className="text-xs text-heritage-brown/60 dark:text-slate-400 leading-relaxed mt-1 font-semibold">
                    Plan Regattas, language study assemblies, woodwork demonstrations, and clan high seats.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setFormType('event');
                    setShowCreateForm(true);
                  }}
                  className="text-xs font-black uppercase text-amber-600 hover:underline mt-4 text-left cursor-pointer flex items-center gap-1"
                >
                  <span>Schedule Event</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Module: Highlights & Success Stories */}
              <div className="border border-heritage-brown/10 dark:border-slate-800 rounded-2xl p-5 hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  <span className="p-2.5 bg-purple-50 dark:bg-purple-950/20 text-purple-600 rounded-xl inline-block mb-3.5 border border-purple-100 dark:border-purple-900/30">
                    <Trophy className="w-5 h-5 shrink-0" />
                  </span>
                  <h3 className="font-serif font-black text-base text-heritage-brown dark:text-white">
                    Preservation Highlights
                  </h3>
                  <p className="text-xs text-heritage-brown/60 dark:text-slate-400 leading-relaxed mt-1 font-semibold">
                    Celebrate outstanding local achievements, language certification milestones, and artisan profiles.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setFormType('highlight');
                    setShowCreateForm(true);
                  }}
                  className="text-xs font-black uppercase text-purple-600 hover:underline mt-4 text-left cursor-pointer flex items-center gap-1"
                >
                  <span>Submit Highlight Card</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>

          </div>
        )}

        {/* ==========================================
            VIEW 3: MEDIA VAULT & METADATA UPLOADER
            ========================================== */}
        {activeNav === 'media' && (
          <div className="bg-white dark:bg-slate-900 border border-heritage-brown/10 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-8 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-5 border-b border-heritage-brown/10 dark:border-slate-800 gap-4">
              <div>
                <h2 className="text-xl font-serif font-black text-heritage-brown dark:text-white">
                  Media Experience Vault
                </h2>
                <p className="text-xs text-heritage-brown/60 dark:text-slate-400 mt-1 font-semibold">
                  Upload, tag, and organize regional event photographs, high-fidelity linguistic audio recordings, and videos.
                </p>
              </div>

              <button
                onClick={() => setShowMediaForm(true)}
                className="px-4 py-2.5 bg-heritage-terracotta text-white hover:bg-heritage-terracotta/90 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Media Item</span>
              </button>
            </div>

            {/* Albums List */}
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-heritage-brown dark:text-heritage-sand mb-4">
                Active Resource Albums
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {albums.map(alb => (
                  <div 
                    key={alb.id}
                    className="p-4 bg-heritage-cream/10 dark:bg-slate-950/20 border border-heritage-brown/5 dark:border-slate-800 rounded-2xl flex items-center gap-4 hover:border-heritage-terracotta transition-all cursor-default"
                  >
                    <div className="p-3 bg-heritage-terracotta/10 text-heritage-terracotta rounded-xl border border-heritage-terracotta/15">
                      {alb.type === 'image' && <ImageIcon className="w-5 h-5 shrink-0" />}
                      {alb.type === 'audio' && <Volume2 className="w-5 h-5 shrink-0" />}
                      {alb.type === 'video' && <Play className="w-5 h-5 shrink-0" />}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-serif font-black text-xs text-heritage-brown dark:text-white truncate">
                        {alb.name}
                      </h4>
                      <p className="text-[10px] text-heritage-brown/50 dark:text-slate-400 truncate mt-0.5 font-semibold">
                        {alb.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Media Items Browser Grid */}
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-heritage-brown dark:text-heritage-sand mb-4">
                My Media Submissions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {mediaList.map(media => (
                  <div 
                    key={media.id}
                    className="bg-heritage-cream/5 dark:bg-slate-950/30 border border-heritage-brown/10 dark:border-slate-850 rounded-2xl overflow-hidden shadow-sm flex flex-col group relative"
                  >
                    <div className="h-36 w-full overflow-hidden shrink-0 relative bg-black/5 dark:bg-black/20">
                      <img 
                        src={media.thumbnail} 
                        alt={media.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-2.5 right-2.5">
                        <span className={`text-[8px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                          media.status === 'approved' 
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}>
                          {media.status}
                        </span>
                      </div>
                      {media.type === 'video' && (
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                          <Play className="w-8 h-8 text-white fill-white drop-shadow" />
                        </div>
                      )}
                      {media.type === 'audio' && (
                        <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                          <Volume2 className="w-8 h-8 text-white drop-shadow" />
                        </div>
                      )}
                    </div>

                    <div className="p-4 flex-grow flex flex-col justify-between">
                      <div>
                        <span className="text-[8px] font-black uppercase text-heritage-terracotta bg-heritage-terracotta/5 px-2 py-0.5 rounded-full inline-block mb-1.5 border border-heritage-terracotta/10">
                          {media.type}
                        </span>
                        <h4 className="font-serif font-black text-xs text-heritage-brown dark:text-white truncate">
                          {media.title}
                        </h4>
                        <p className="text-[10px] text-heritage-brown/60 dark:text-slate-400 mt-1 leading-normal line-clamp-2 font-semibold">
                          {media.description}
                        </p>
                      </div>
                      <span className="text-[9px] text-heritage-brown/40 dark:text-slate-500 mt-3 font-bold block">
                        Added {new Date(media.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ==========================================
            VIEW 4: MY SUBMISSIONS (WORKFLOW ENGINE)
            ========================================== */}
        {activeNav === 'submissions' && (
          <div className="bg-white dark:bg-slate-900 border border-heritage-brown/10 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-8 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-5 border-b border-heritage-brown/10 dark:border-slate-800 gap-4">
              <div>
                <h2 className="text-xl font-serif font-black text-heritage-brown dark:text-white">
                  My Submissions Dashboard
                </h2>
                <p className="text-xs text-heritage-brown/60 dark:text-slate-400 mt-1 font-semibold">
                  Track the complete lifecycle of your submissions, read Elder reviews, and view revision histories.
                </p>
              </div>

              <div className="flex bg-heritage-cream/20 dark:bg-slate-950 p-1 rounded-xl border border-heritage-brown/5 gap-0.5">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'draft', label: 'Draft' },
                  { id: 'pending', label: 'Pending' },
                  { id: 'revision', label: 'Revisions' },
                  { id: 'approved', label: 'Approved' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setSubmissionFilter(tab.id as any)}
                    className={`px-3.5 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all cursor-pointer ${
                      submissionFilter === tab.id 
                        ? 'bg-heritage-terracotta text-white' 
                        : 'text-heritage-brown/60 hover:text-heritage-brown dark:text-slate-400'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Submissions Table / Cards */}
            <div className="space-y-4">
              {filteredSubmissions.map(item => {
                const statusColors = {
                  draft: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
                  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200/50',
                  approved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200/50',
                  revision: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 border border-orange-200/50',
                  rejected: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-200/50',
                  archived: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                };

                return (
                  <div 
                    key={item.id}
                    className="border border-heritage-brown/10 dark:border-slate-800 rounded-2xl p-5 hover:border-heritage-terracotta transition-all relative"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                      <div className="flex items-center gap-2.5">
                        <span className="text-[9px] font-black uppercase bg-heritage-terracotta/10 text-heritage-terracotta px-2.5 py-0.5 rounded-full border border-heritage-terracotta/15">
                          {item.type}
                        </span>
                        <span className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full ${statusColors[item.status]}`}>
                          {item.status === 'revision' ? 'needs revision' : item.status}
                        </span>
                        <span className="text-[10px] text-heritage-brown/40 dark:text-slate-500 font-semibold">
                          Created: {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 self-start md:self-auto">
                        <button
                          onClick={() => openEditForm(item)}
                          className="p-1.5 hover:bg-heritage-brown/5 dark:hover:bg-slate-800 rounded-lg text-heritage-brown/60 dark:text-slate-400 hover:text-heritage-terracotta transition-colors cursor-pointer"
                          title="Modify Entry"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        {item.status === 'draft' && (
                          <button
                            onClick={() => deleteSubmissionItem(item.id)}
                            className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg text-heritage-brown/40 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Delete Draft"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setReviewItem(item)}
                          className="px-3 py-1.5 bg-heritage-brown/5 dark:bg-slate-800 hover:bg-heritage-brown/10 text-[10px] font-black uppercase text-heritage-brown dark:text-white rounded-lg transition-colors cursor-pointer flex items-center gap-1 border border-heritage-brown/10 dark:border-slate-700"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>Timeline</span>
                        </button>
                      </div>
                    </div>

                    <h3 className="font-serif font-black text-base text-heritage-brown dark:text-white leading-snug">
                      {item.title}
                    </h3>
                    <p className="text-xs text-heritage-brown/70 dark:text-slate-300 leading-relaxed mt-2.5 font-semibold">
                      {item.summary || item.body.substring(0, 160) + '...'}
                    </p>

                    {/* Active feedback preview box if revision required */}
                    {item.status === 'revision' && item.elderFeedback && (
                      <div className="mt-4 p-4 bg-orange-50/40 dark:bg-slate-950/40 border-l-4 border-orange-500 rounded-r-xl">
                        <span className="block text-[9px] font-black uppercase text-orange-800 dark:text-orange-400 mb-1">
                          Action Required by Elder ({item.reviewedBy}):
                        </span>
                        <p className="text-xs text-heritage-brown dark:text-slate-300 italic leading-relaxed font-semibold">
                          "{item.elderFeedback}"
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}

              {filteredSubmissions.length === 0 && (
                <div className="text-center py-20 text-heritage-brown/40">
                  No submissions match this filter.
                </div>
              )}
            </div>

          </div>
        )}

        {/* ==========================================
            VIEW 5: OPERATIONAL CALENDAR EXPERIENCE
            ========================================== */}
        {activeNav === 'calendar' && (
          <div className="bg-white dark:bg-slate-900 border border-heritage-brown/10 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-8 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-5 border-b border-heritage-brown/10 dark:border-slate-800 gap-4">
              <div>
                <h2 className="text-xl font-serif font-black text-heritage-brown dark:text-white">
                  Leader's Operational Calendar
                </h2>
                <p className="text-xs text-heritage-brown/60 dark:text-slate-400 mt-1 font-semibold">
                  Coordinate upcoming clan gatherings, boat regattas, study assemblies, and council deadlines.
                </p>
              </div>

              {/* Month Selector Controls */}
              <div className="flex items-center gap-3">
                <button 
                  onClick={prevMonth}
                  className="p-1.5 hover:bg-heritage-brown/5 dark:hover:bg-slate-850 rounded-lg text-heritage-brown/60 dark:text-slate-400 border border-heritage-brown/10 dark:border-slate-850 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-black uppercase tracking-wider text-heritage-brown dark:text-white font-serif select-none min-w-[120px] text-center">
                  {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </span>
                <button 
                  onClick={nextMonth}
                  className="p-1.5 hover:bg-heritage-brown/5 dark:hover:bg-slate-850 rounded-lg text-heritage-brown/60 dark:text-slate-400 border border-heritage-brown/10 dark:border-slate-850 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Grid for Calendar Dates */}
            <div>
              <div className="grid grid-cols-7 gap-2.5 mb-2.5">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                  <span key={d} className="text-center text-[10px] font-black uppercase text-heritage-brown/40 dark:text-slate-500 py-1">
                    {d}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2.5">
                {/* Empty buffer days */}
                {Array.from({ length: firstDayIndex }).map((_, idx) => (
                  <div key={`empty-${idx}`} className="h-28 bg-heritage-cream/5 dark:bg-slate-950/10 border border-transparent rounded-2xl" />
                ))}

                {/* Actual Month Days */}
                {Array.from({ length: daysInMonth }).map((_, idx) => {
                  const day = idx + 1;
                  const dayEvents = getDayEvents(day);
                  const isToday = day === 14 && currentMonth.getMonth() === 6; // Mock July 14, 2026

                  return (
                    <div 
                      key={`day-${day}`}
                      className={`h-28 p-2 border border-heritage-brown/5 dark:border-slate-850 rounded-2xl flex flex-col justify-between ${
                        isToday 
                          ? 'bg-heritage-terracotta/5 border-heritage-terracotta/30 dark:bg-heritage-terracotta/15 dark:border-heritage-terracotta/40' 
                          : 'bg-heritage-cream/15 dark:bg-slate-950/20 hover:border-heritage-terracotta/20 transition-all'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-[11px] font-black h-5 w-5 rounded-full flex items-center justify-center ${
                          isToday 
                            ? 'bg-heritage-terracotta text-white font-black' 
                            : 'text-heritage-brown dark:text-white'
                        }`}>
                          {day}
                        </span>
                        {dayEvents.length > 0 && (
                          <span className="w-1.5 h-1.5 bg-heritage-terracotta rounded-full" />
                        )}
                      </div>

                      {/* Display brief titles if events exist */}
                      <div className="space-y-1 overflow-y-auto max-h-[50px] scrollbar-thin">
                        {dayEvents.map(ev => (
                          <div 
                            key={ev.id}
                            onClick={() => openEditForm(ev)}
                            className="bg-heritage-terracotta text-white rounded-lg p-1 text-[8px] font-black tracking-wide leading-tight truncate uppercase cursor-pointer"
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

          </div>
        )}

        {/* ==========================================
            VIEW 6: NOTIFICATIONS DISPATCH FEED
            ========================================== */}
        {activeNav === 'notifications' && (
          <div className="bg-white dark:bg-slate-900 border border-heritage-brown/10 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-8 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-5 border-b border-heritage-brown/10 dark:border-slate-800 gap-4">
              <div>
                <h2 className="text-xl font-serif font-black text-heritage-brown dark:text-white">
                  Leader's Notifications Feed
                </h2>
                <p className="text-xs text-heritage-brown/60 dark:text-slate-400 mt-1 font-semibold">
                  Real-time status updates directly from the Elder Council regarding approvals, drafts, and reviews.
                </p>
              </div>

              {notifications.some(n => !n.isRead) && (
                <button
                  onClick={() => {
                    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                    triggerToast('All dispatches marked as read.');
                  }}
                  className="px-3.5 py-1.5 bg-heritage-terracotta/10 hover:bg-heritage-terracotta/20 text-heritage-terracotta text-xs font-black rounded-lg transition-all cursor-pointer uppercase tracking-wider"
                >
                  Mark All Read
                </button>
              )}
            </div>

            <div className="space-y-4">
              {notifications.map(notif => (
                <div 
                  key={notif.id}
                  onClick={() => {
                    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
                  }}
                  className={`p-4.5 rounded-2xl border transition-all flex items-start gap-4 relative cursor-pointer ${
                    notif.isRead 
                      ? 'bg-heritage-cream/15 border-heritage-brown/5 dark:bg-slate-900 dark:border-slate-800 opacity-60' 
                      : 'bg-heritage-terracotta/5 border-heritage-terracotta/15 dark:bg-slate-950 dark:border-slate-800 shadow-sm'
                  }`}
                >
                  <div className="p-2.5 bg-white dark:bg-slate-900 border border-heritage-brown/5 rounded-xl shrink-0">
                    {notif.type === 'approved' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                    {notif.type === 'revision' && <AlertTriangle className="w-4 h-4 text-orange-500" />}
                    {notif.type === 'feedback' && <MessageSquare className="w-4 h-4 text-purple-500" />}
                    {notif.type === 'alert' && <AlertOctagon className="w-4 h-4 text-rose-500 animate-pulse" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[8px] font-black uppercase tracking-wider text-heritage-terracotta">
                        Status Log
                      </span>
                      <span className="text-[10px] text-heritage-brown/40 dark:text-slate-500 font-bold">
                        {notif.timestamp}
                      </span>
                    </div>
                    <h4 className="font-serif font-black text-sm text-heritage-brown dark:text-white mt-1">
                      {notif.title}
                    </h4>
                    <p className="text-xs text-heritage-brown/70 dark:text-slate-300 leading-relaxed mt-2 font-semibold">
                      {notif.body}
                    </p>
                  </div>
                </div>
              ))}

              {notifications.length === 0 && (
                <div className="text-center py-16 text-heritage-brown/40">
                  No active dispatches found.
                </div>
              )}
            </div>

          </div>
        )}

        {/* ==========================================
            VIEW 7: PROFILE & SECURITY CREDENTIALS
            ========================================== */}
        {activeNav === 'profile' && (
          <div className="bg-white dark:bg-slate-900 border border-heritage-brown/10 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-8 animate-fade-in">
            <div className="pb-5 border-b border-heritage-brown/10 dark:border-slate-800">
              <h2 className="text-xl font-serif font-black text-heritage-brown dark:text-white">
                Leader Profile & Preferences
              </h2>
              <p className="text-xs text-heritage-brown/60 dark:text-slate-400 mt-1 font-semibold">
                Manage your credentials, phone contacts, notification dispatches, and preferred Lukenye dialect loops.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-heritage-brown/50 dark:text-slate-400 mb-1.5">
                    Full Registered Name
                  </label>
                  <input 
                    type="text" 
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full px-4.5 py-3 rounded-2xl border border-heritage-brown/15 bg-transparent text-xs font-bold focus:border-heritage-terracotta focus:outline-none dark:border-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-heritage-brown/50 dark:text-slate-400 mb-1.5">
                    Primary Phone Contact
                  </label>
                  <input 
                    type="text" 
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    className="w-full px-4.5 py-3 rounded-2xl border border-heritage-brown/15 bg-transparent text-xs font-bold focus:border-heritage-terracotta focus:outline-none dark:border-slate-800"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-heritage-brown/50 dark:text-slate-400 mb-1.5">
                    Preferred Regional Dialect
                  </label>
                  <select 
                    value={preferredDialect}
                    onChange={(e) => setPreferredDialect(e.target.value)}
                    className="w-full px-4.5 py-3 rounded-2xl border border-heritage-brown/15 bg-white dark:bg-slate-900 text-xs font-bold focus:border-heritage-terracotta focus:outline-none dark:border-slate-800"
                  >
                    <option value="Lukenye Paliisa">Lukenye Paliisa Standard</option>
                    <option value="Lukenye Kadungulu">Lukenye Kadungulu Dialect</option>
                    <option value="Lukenye Kyoga Coast">Lukenye Coastal Dialect</option>
                  </select>
                </div>

                <div className="p-4 bg-heritage-cream/15 dark:bg-slate-950/20 border border-heritage-brown/5 rounded-2xl flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-serif font-black text-heritage-brown dark:text-white">Email Dispatches</h4>
                    <p className="text-[10px] text-heritage-brown/50 dark:text-slate-400 mt-0.5 font-semibold">Receive Elder decisions by mail.</p>
                  </div>
                  <input 
                    type="checkbox"
                    checked={notifyByEmail}
                    onChange={(e) => setNotifyByEmail(e.target.checked)}
                    className="w-4 h-4 accent-heritage-terracotta rounded"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-5 border-t border-heritage-brown/5 dark:border-slate-850">
              <button
                onClick={() => triggerToast('Profile settings saved successfully.')}
                className="px-6 py-3 bg-heritage-terracotta text-white hover:bg-heritage-terracotta/90 text-xs font-black uppercase tracking-wider rounded-2xl transition-all cursor-pointer"
              >
                Save Settings
              </button>
            </div>
          </div>
        )}

      </div>

      {/* ==========================================
          SLIDE-OVER / MODAL: COMPOSE CHRONICLE FORM
          ========================================== */}
      <AnimatePresence>
        {showCreateForm && (
          <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowCreateForm(false);
                resetForm();
              }}
              className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
            />

            {/* Sliding Panel */}
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 24, stiffness: 220 }}
              className="relative w-full max-w-xl bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col justify-between z-10 border-l border-heritage-brown/15 dark:border-slate-800"
            >
              
              {/* Header */}
              <div className="p-6 border-b border-heritage-brown/5 dark:border-slate-800 flex items-center justify-between bg-heritage-cream/10">
                <div>
                  <span className="text-[9px] font-black uppercase text-heritage-terracotta px-2.5 py-0.5 bg-heritage-terracotta/10 rounded-full border border-heritage-terracotta/15 mb-1.5 inline-block">
                    {editingSubmission ? 'Revise Chronicle' : `New ${formType}`}
                  </span>
                  <h3 className="font-serif font-black text-lg text-heritage-brown dark:text-white">
                    {editingSubmission ? `Modify "${editingSubmission.title}"` : 'Compose Heritage Chronicle'}
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    resetForm();
                  }}
                  className="p-2 hover:bg-heritage-brown/5 dark:hover:bg-slate-800 rounded-full text-heritage-brown/50 dark:text-slate-400 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Content Scroll Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                
                {/* Title */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-heritage-brown/50 dark:text-slate-400 mb-1.5">
                    Title / Caption
                  </label>
                  <input 
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(e.target.value)}
                    placeholder={`e.g. Paliisa Clan Assembly Dates, Study Circle, ${formType} Title`}
                    className="w-full px-4.5 py-3 rounded-2xl border border-heritage-brown/15 bg-transparent text-xs font-bold focus:border-heritage-terracotta focus:outline-none dark:border-slate-850"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-heritage-brown/50 dark:text-slate-400 mb-1.5">
                    Dispatches Category
                  </label>
                  <input 
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData(e.target.value)}
                    placeholder="e.g. Traditional Craft, Clan Assembly, Safety Alert"
                    className="w-full px-4.5 py-3 rounded-2xl border border-heritage-brown/15 bg-transparent text-xs font-bold focus:border-heritage-terracotta focus:outline-none dark:border-slate-850"
                  />
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-heritage-brown/50 dark:text-slate-400 mb-1.5">
                    Critical Severity Priority
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {['low', 'medium', 'high', 'critical'].map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, priority: p as any }))}
                        className={`py-2 text-[10px] font-black uppercase rounded-xl transition-all cursor-pointer border ${
                          formData.priority === p 
                            ? 'bg-heritage-terracotta text-white border-heritage-terracotta shadow-sm' 
                            : 'bg-transparent text-heritage-brown/50 border-heritage-brown/15 hover:bg-heritage-brown/5 dark:text-slate-400 dark:border-slate-800'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Event specific fields */}
                {formType === 'event' && (
                  <div className="p-4 bg-heritage-cream/15 dark:bg-slate-950/20 border border-heritage-brown/10 dark:border-slate-800 rounded-2xl space-y-4">
                    <span className="text-[9px] font-black uppercase tracking-widest text-heritage-terracotta block pb-2 border-b border-heritage-brown/5">
                      Event Coordinator Specifications:
                    </span>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[9px] font-black uppercase text-heritage-brown/40 dark:text-slate-500 mb-1">Date</label>
                        <input 
                          type="date" 
                          value={formData.eventDate}
                          onChange={(e) => setFormData(prev => ({ ...prev, eventDate: e.target.value }))}
                          className="w-full px-3 py-2 rounded-xl border border-heritage-brown/15 bg-transparent text-xs font-semibold focus:border-heritage-terracotta focus:outline-none dark:border-slate-850"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black uppercase text-heritage-brown/40 dark:text-slate-500 mb-1">Time Frame</label>
                        <input 
                          type="text" 
                          placeholder="e.g. 09:00 AM - 01:00 PM"
                          value={formData.eventTime}
                          onChange={(e) => setFormData(prev => ({ ...prev, eventTime: e.target.value }))}
                          className="w-full px-3 py-2 rounded-xl border border-heritage-brown/15 bg-transparent text-xs font-semibold focus:border-heritage-terracotta focus:outline-none dark:border-slate-850"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[9px] font-black uppercase text-heritage-brown/40 dark:text-slate-500 mb-1 font-semibold">Venue / Coordinates Location</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Kadungulu Landing Bay, Lake Kyoga"
                        value={formData.eventVenue}
                        onChange={(e) => setFormData(prev => ({ ...prev, eventVenue: e.target.value }))}
                        className="w-full px-3.5 py-2 rounded-xl border border-heritage-brown/15 bg-transparent text-xs font-semibold focus:border-heritage-terracotta focus:outline-none dark:border-slate-850"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-black uppercase text-heritage-brown/40 dark:text-slate-500 mb-1 font-semibold">Target Audience Scope</label>
                      <input 
                        type="text" 
                        placeholder="e.g. All Clans Welcome, BaiseMugosa Lineage Only"
                        value={formData.eventScope}
                        onChange={(e) => setFormData(prev => ({ ...prev, eventScope: e.target.value }))}
                        className="w-full px-3.5 py-2 rounded-xl border border-heritage-brown/15 bg-transparent text-xs font-semibold focus:border-heritage-terracotta focus:outline-none dark:border-slate-850"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-black uppercase text-heritage-brown/40 dark:text-slate-500 mb-1 font-semibold">Guest Speakers / Conveners</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Elder Moses Musuusu"
                        value={formData.eventSpeaker}
                        onChange={(e) => setFormData(prev => ({ ...prev, eventSpeaker: e.target.value }))}
                        className="w-full px-3.5 py-2 rounded-xl border border-heritage-brown/15 bg-transparent text-xs font-semibold focus:border-heritage-terracotta focus:outline-none dark:border-slate-850"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-black uppercase text-heritage-brown/40 dark:text-slate-500 mb-1 font-semibold">Flyer / Poster Image URL</label>
                      <input 
                        type="text" 
                        placeholder="https://..."
                        value={formData.eventPoster}
                        onChange={(e) => setFormData(prev => ({ ...prev, eventPoster: e.target.value }))}
                        className="w-full px-3.5 py-2 rounded-xl border border-heritage-brown/15 bg-transparent text-xs font-semibold focus:border-heritage-terracotta focus:outline-none dark:border-slate-850"
                      />
                    </div>
                  </div>
                )}

                {/* Summary */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-heritage-brown/50 dark:text-slate-400 mb-1.5">
                    Excerpt / Short Summary
                  </label>
                  <input 
                    type="text"
                    value={formData.summary}
                    onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
                    placeholder="Short description highlighting the core message (one sentence)"
                    className="w-full px-4.5 py-3 rounded-2xl border border-heritage-brown/15 bg-transparent text-xs font-bold focus:border-heritage-terracotta focus:outline-none dark:border-slate-850"
                  />
                </div>

                {/* Body Content */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-heritage-brown/50 dark:text-slate-400 mb-1.5">
                    Chronicle Body Details
                  </label>
                  <textarea 
                    rows={8}
                    value={formData.body}
                    onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value }))}
                    placeholder="Write the full specifications, instructions, or stories for your community submission."
                    className="w-full px-4.5 py-3 rounded-2xl border border-heritage-brown/15 bg-transparent text-xs font-semibold focus:border-heritage-terracotta focus:outline-none dark:border-slate-850 font-sans leading-relaxed"
                  />
                </div>

              </div>

              {/* Action Buttons */}
              <div className="p-6 border-t border-heritage-brown/5 dark:border-slate-800 bg-heritage-cream/10 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => saveSubmission('draft')}
                  className="px-5 py-3 border border-heritage-brown/15 dark:border-slate-750 text-heritage-brown hover:bg-heritage-brown/5 dark:text-slate-300 dark:hover:bg-slate-800 text-xs font-black uppercase tracking-wider rounded-2xl transition-all cursor-pointer"
                >
                  Save Draft
                </button>
                <button
                  type="button"
                  onClick={() => saveSubmission('pending')}
                  className="px-5 py-3 bg-heritage-terracotta text-white hover:bg-heritage-terracotta/90 text-xs font-black uppercase tracking-wider rounded-2xl transition-all shadow cursor-pointer flex items-center gap-1"
                >
                  <Check className="w-4 h-4" />
                  <span>Submit to Elder Council</span>
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==========================================
          MODAL: VIEW SUBMISSIONS REVISION HISTORY / LOGS
          ========================================== */}
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
              className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-heritage-brown/10 dark:border-slate-800 p-6 z-10"
            >
              <div className="flex justify-between items-start pb-4 border-b border-heritage-brown/5 dark:border-slate-800 mb-5">
                <div>
                  <span className="text-[8px] font-black uppercase px-2.5 py-0.5 bg-heritage-terracotta/10 text-heritage-terracotta rounded-full">
                    Audit Logs
                  </span>
                  <h3 className="font-serif font-black text-base text-heritage-brown dark:text-white mt-1">
                    Chronicle Lifecycle History
                  </h3>
                </div>
                <button 
                  onClick={() => setReviewItem(null)}
                  className="p-1 hover:bg-heritage-brown/5 dark:hover:bg-slate-800 rounded-full text-heritage-brown/40 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-3.5 bg-heritage-cream/10 dark:bg-slate-950/25 border border-heritage-brown/5 rounded-xl">
                  <span className="text-[9px] font-black uppercase text-heritage-brown/40 block">Chronicle Title</span>
                  <span className="text-xs font-bold text-heritage-brown dark:text-white leading-normal mt-0.5 block">{reviewItem.title}</span>
                </div>

                <div className="space-y-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-heritage-terracotta block">
                    Submission Timeline Events:
                  </span>

                  <div className="relative border-l-2 border-heritage-terracotta/20 ml-2.5 pl-5 space-y-5">
                    {reviewItem.revisionHistory.map((hist, idx) => (
                      <div key={idx} className="relative">
                        <span className="absolute -left-[26px] top-0.5 w-3 h-3 rounded-full bg-heritage-terracotta border-2 border-white dark:border-slate-900" />
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-heritage-brown dark:text-white uppercase">
                              {hist.action}
                            </span>
                            <span className="text-[9px] text-heritage-brown/40 dark:text-slate-500">
                              {new Date(hist.date).toLocaleDateString()} {new Date(hist.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-[10.5px] text-heritage-brown/60 dark:text-slate-400 mt-1 font-semibold leading-relaxed">
                            {hist.note}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6 pt-4 border-t border-heritage-brown/5 dark:border-slate-800">
                <button
                  onClick={() => setReviewItem(null)}
                  className="px-5 py-2.5 bg-heritage-brown/5 dark:bg-slate-800 hover:bg-heritage-brown/10 text-xs font-black uppercase text-heritage-brown dark:text-white rounded-xl transition-all cursor-pointer border border-heritage-brown/5"
                >
                  Dismiss History
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==========================================
          MODAL: MEDIA VAULT UPLOAD DIALOG
          ========================================== */}
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
              <div className="flex justify-between items-start pb-4 border-b border-heritage-brown/5 dark:border-slate-800 mb-2">
                <div>
                  <span className="text-[8px] font-black uppercase px-2.5 py-0.5 bg-heritage-terracotta/10 text-heritage-terracotta rounded-full">
                    Uploader Setup
                  </span>
                  <h3 className="font-serif font-black text-base text-heritage-brown dark:text-white mt-1">
                    Submit Media Metadata
                  </h3>
                </div>
                <button 
                  onClick={() => setShowMediaForm(false)}
                  className="p-1 hover:bg-heritage-brown/5 dark:hover:bg-slate-800 rounded-full text-heritage-brown/40 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div>
                <label className="block text-[9px] font-black uppercase text-heritage-brown/50 dark:text-slate-400 mb-1">
                  Resource Title
                </label>
                <input 
                  type="text" 
                  value={mediaTitle}
                  onChange={(e) => setMediaTitle(e.target.value)}
                  placeholder="e.g. Canoe Regatta Paddling Chant"
                  className="w-full px-4 py-2.5 rounded-xl border border-heritage-brown/15 bg-transparent text-xs font-bold focus:border-heritage-terracotta focus:outline-none dark:border-slate-850"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-black uppercase text-heritage-brown/50 dark:text-slate-400 mb-1">
                    Resource Type
                  </label>
                  <select 
                    value={mediaType}
                    onChange={(e) => setMediaType(e.target.value as any)}
                    className="w-full px-4 py-2.5 rounded-xl border border-heritage-brown/15 bg-white dark:bg-slate-900 text-xs font-bold focus:border-heritage-terracotta focus:outline-none dark:border-slate-850"
                  >
                    <option value="image">Image Attachment</option>
                    <option value="video">Video Recording</option>
                    <option value="audio">Oral Audio Guide</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] font-black uppercase text-heritage-brown/50 dark:text-slate-400 mb-1">
                    Target Album Group
                  </label>
                  <select 
                    value={mediaAlbum}
                    onChange={(e) => setMediaAlbum(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-heritage-brown/15 bg-white dark:bg-slate-900 text-xs font-bold focus:border-heritage-terracotta focus:outline-none dark:border-slate-850"
                  >
                    <option value="">None / Standalone Resource</option>
                    {albums.map(alb => (
                      <option key={alb.id} value={alb.id}>{alb.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-black uppercase text-heritage-brown/50 dark:text-slate-400 mb-1">
                  Upload Resource URL (or direct streaming link)
                </label>
                <input 
                  type="text" 
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  placeholder="e.g. https://images.unsplash.com/..."
                  className="w-full px-4 py-2.5 rounded-xl border border-heritage-brown/15 bg-transparent text-xs font-bold focus:border-heritage-terracotta focus:outline-none dark:border-slate-850"
                />
              </div>

              <div>
                <label className="block text-[9px] font-black uppercase text-heritage-brown/50 dark:text-slate-400 mb-1">
                  Resource Description
                </label>
                <textarea 
                  rows={3}
                  value={mediaDesc}
                  onChange={(e) => setMediaDesc(e.target.value)}
                  placeholder="Provide precise details, metadata, and recording dates for Elders to audit."
                  className="w-full px-4 py-2.5 rounded-xl border border-heritage-brown/15 bg-transparent text-xs font-semibold focus:border-heritage-terracotta focus:outline-none dark:border-slate-850"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-heritage-brown/5 dark:border-slate-800">
                <button
                  onClick={() => submitMedia('draft')}
                  className="px-4 py-2 bg-heritage-cream/10 border border-heritage-brown/15 dark:border-slate-750 text-heritage-brown dark:text-white text-xs font-black uppercase tracking-wider rounded-xl hover:bg-heritage-brown/5 transition-colors cursor-pointer"
                >
                  Save Draft
                </button>
                <button
                  onClick={() => submitMedia('pending')}
                  className="px-4 py-2 bg-heritage-terracotta text-white text-xs font-black uppercase tracking-wider rounded-xl hover:bg-heritage-terracotta/90 transition-all cursor-pointer flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Submit Media</span>
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
