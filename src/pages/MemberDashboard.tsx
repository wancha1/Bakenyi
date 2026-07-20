import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, Heart, Bookmark, Search, Bell, User, Settings, LogOut, 
  Globe, Calendar, Share2, Play, Volume2, Video, Image, Download, 
  ArrowLeft, ArrowRight, Check, Plus, Trash2, List, FileText, 
  ChevronRight, Sparkles, Clock, Compass, HelpCircle, Info, 
  CheckCircle, SlidersHorizontal, X, ExternalLink, Shield, BookMarked
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import SEO from '../components/SEO';
import { getSupabase } from '../lib/supabaseClient';
import LeaderDashboardView from '../components/leader/LeaderDashboardView';
import UserProfileModule from '../components/profile/UserProfileModule';
import { 
  getUserNotifications, 
  markNotificationAsRead as apiMarkAsRead, 
  markAllNotificationsAsRead as apiMarkAllAsRead,
  getUnreadNotificationsCount as apiGetUnreadCount,
  getArticles,
  getContributions
} from '../lib/supabase';
import { getNews, getEvents, getStatuses, getAnnouncements } from '../lib/heritageService';

// Types for the Member Dashboard Workspace
interface SavedItem {
  id: string;
  type: 'article' | 'clan' | 'proverb' | 'dictionary' | 'song' | 'video' | 'exhibition';
  title: string;
  subtitle: string;
  detail: string;
  image?: string;
  category?: string;
  duration?: string;
}

interface SavedSearch {
  id: string;
  query: string;
  category: string;
  timestamp: string;
}

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  category: 'article' | 'exhibition' | 'event' | 'announcement' | 'resource' | 'update';
  timestamp: string;
  isRead: boolean;
  link?: string;
}

interface CommunityUpdateItem {
  id: string;
  title: string;
  body: string;
  author: string;
  category: 'announcement' | 'news' | 'highlight' | 'event' | 'update';
  publishedAt: string;
  likes: number;
  image?: string;
}

interface HeritageEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  elder: string;
  isJoined: boolean;
  category: 'Assembly' | 'Regatta' | 'Language' | 'Craft';
}

interface MediaItem {
  id: string;
  title: string;
  type: 'image' | 'video' | 'audio' | 'pdf';
  category: string;
  url: string;
  thumbnail: string;
  duration?: string;
  description: string;
}

// Default Seed Data
const DEFAULT_SAVED_ITEMS: SavedItem[] = [
  {
    id: 'art-1',
    type: 'article',
    title: 'Migratory Waters of Kyoga',
    subtitle: 'By Elder Moses Musuusu',
    detail: 'An analysis of early Bakenyi settlement patterns on floating papyrus islands.',
    image: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&q=80&w=600',
    category: 'History'
  },
  {
    id: 'clan-1',
    type: 'clan',
    title: 'BaiseMugosa Clan',
    subtitle: 'Totem: Traditional Fishing Spear (Eshumu)',
    detail: 'Guardians of deep water netcrafting techniques along the river channels.'
  },
  {
    id: 'prov-1',
    type: 'proverb',
    title: '\"Amanzi amangyi tigaita bulogo\"',
    subtitle: 'Water Context Wisdom',
    detail: '\"An abundance of clean water does not invite misfortune.\" Real-world application: prepare resources thoroughly in seasons of peace.'
  },
  {
    id: 'dict-1',
    type: 'dictionary',
    title: 'Ebiswa',
    subtitle: 'Floating Islands',
    detail: 'The custom buoyancy beds of papyrus reed roots historically navigated as mobile settlements.'
  },
  {
    id: 'song-1',
    type: 'song',
    title: 'Kyoga Fisherman Chant',
    subtitle: 'Traditional Hymn • 4:12 mins',
    detail: 'Authentic canoe sailing rhythm passed down by Generations of Lukenye paddlers.',
    image: 'https://images.unsplash.com/photo-1501535033-a593e6afb94d?auto=format&fit=crop&q=80&w=600'
  },
  {
    id: 'video-1',
    type: 'video',
    title: 'Canoe Crafting Masterclass',
    subtitle: 'Educational Video • 12:45 mins',
    detail: 'Demonstration of dugout tree trunk crafting by elder carpenters of Kadungulu.',
    image: 'https://images.unsplash.com/photo-1523805009345-7448845a9e53?auto=format&fit=crop&q=80&w=600'
  },
  {
    id: 'exh-1',
    type: 'exhibition',
    title: 'Kyandaza Papyrus Tapestry Exhibition',
    subtitle: 'Virtual Heritage Gallery',
    detail: 'A digital collection highlighting 15 antique woven ceremonial artifacts from the 19th Century.',
    image: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&q=80&w=600'
  }
];

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'not-1',
    title: 'New Heritage Article',
    body: 'Elder Musuusu has published: \"Advanced Canoe Navigation across the Kyoga Rapids.\" Explore the ancient landmarks now.',
    category: 'article',
    timestamp: '2 hours ago',
    isRead: false,
    link: 'art-nav'
  },
  {
    id: 'not-2',
    title: 'Platform Update',
    body: 'The Lukenye Dictionary has been updated with high-fidelity audio recordings for over 50 vocabulary cards!',
    category: 'update',
    timestamp: '1 day ago',
    isRead: false
  },
  {
    id: 'not-3',
    title: 'Upcoming Community Event',
    body: 'Reminder: The Annual Canoe Craft Regatta & Assembly is scheduled in 3 days. Prepare your calendar details.',
    category: 'event',
    timestamp: '2 days ago',
    isRead: true
  },
  {
    id: 'not-4',
    title: 'New Exhibition Available',
    body: 'We have launched the digital exhibit: \"The Royal Spears & Totem Seals of our Founding Clans.\" Browse beautiful images.',
    category: 'exhibition',
    timestamp: '5 days ago',
    isRead: true
  }
];

const DEFAULT_COMMUNITY_UPDATES: CommunityUpdateItem[] = [
  {
    id: 'com-1',
    title: 'Annual Canoe Craft Regatta Dates Finalized',
    body: 'The Bakenyi Cultural Council is proud to announce that the annual gathering on Lake Kyoga is officially set for next month. Members are encouraged to register early to watch traditional boat races and enjoy live oral stories by campfire. There will be dedicated zones for children to learn basic vocabulary.',
    author: 'Council Secretary',
    category: 'event',
    publishedAt: 'July 12, 2026',
    likes: 42,
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'com-2',
    title: 'Elder Moses Musuusu Appointed Primary Language Custodian',
    body: 'We celebrate the historic appointment of Elder Moses Musuusu as the Chief Linguist for the Lukenye Dialect Preservation Commission. His team will lead the effort to translate regional ancestral archives and record authentic audio vocabulary.',
    author: 'Heritage Council Board',
    category: 'news',
    publishedAt: 'July 09, 2026',
    likes: 78
  },
  {
    id: 'com-3',
    title: 'Traditional papyrus woven shields added to permanent vault',
    body: 'Three well-preserved ceremonial shields, estimated to date back to 1895, have been donated back to the Bakenyi vault. High-definition scans and 3D photographs are currently being prepared for a digital exhibition in the member sanctuary.',
    author: 'Archive Custodian',
    category: 'highlight',
    publishedAt: 'July 05, 2026',
    likes: 56,
    image: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&q=80&w=800'
  }
];

const DEFAULT_EVENTS: HeritageEvent[] = [
  {
    id: 'evt-1',
    title: 'Annual Bakenyi Canoe Regatta & Traditional Racing',
    description: 'Our premier annual assembly on the southern bays of Lake Kyoga. Watch authentic dugout canoe races, hear historical clan migrations chanted live, and taste traditional foods.',
    date: 'August 15, 2026',
    time: '09:00 AM - 05:00 PM',
    location: 'Kadungulu landing bay, Kyoga region',
    elder: 'Elder Moses Musuusu & Council Judges',
    isJoined: false,
    category: 'Regatta'
  },
  {
    id: 'evt-2',
    title: 'Lukenye Oral Language Circle',
    description: 'An interactive discussion group focusing on Lukenye idioms, historical river metaphors, and correct tonal pronunciation. Intended for beginners and families.',
    date: 'July 28, 2026',
    time: '02:00 PM - 04:00 PM',
    location: 'Virtual Zoom Hall & Regional Preservation Centre',
    elder: 'Senior Guardian Nakato Sarah',
    isJoined: true,
    category: 'Language'
  },
  {
    id: 'evt-3',
    title: 'Dugout Canoe Hewing & Woodwork Demonstration',
    description: 'Learn the architectural geometry, timber selections, and papyrus sealant techniques used to craft traditional watercraft capable of carrying heavy clan cargo.',
    date: 'September 02, 2026',
    time: '10:00 AM - 01:00 PM',
    location: 'Bakenyi Cultural Centre, Masese',
    elder: 'Carpenter Master Isabirye Charles',
    isJoined: false,
    category: 'Craft'
  }
];

const DEFAULT_MEDIA: MediaItem[] = [
  {
    id: 'med-1',
    title: 'Historical canoe builders of Kadungulu',
    type: 'image',
    category: 'Archival Photo',
    url: 'https://images.unsplash.com/photo-1501535033-a593e6afb94d?auto=format&fit=crop&q=80&w=1200',
    thumbnail: 'https://images.unsplash.com/photo-1501535033-a593e6afb94d?auto=format&fit=crop&q=80&w=200',
    description: 'A beautifully preserved historical photography showcasing fishermen assembling a canoe along the wetland shore.'
  },
  {
    id: 'med-2',
    title: 'Lukenye Oral Alphabet & Consonants Guide',
    type: 'audio',
    category: 'Linguistic Lesson',
    url: '#audio-stream',
    thumbnail: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&q=80&w=200',
    duration: '14:20',
    description: 'High-fidelity audio sequence guide demonstrating standard vowel tones and unique river consonants of the native Lukenye language.'
  },
  {
    id: 'med-3',
    title: 'Deep waters: The floating island ecosystems',
    type: 'video',
    category: 'Documentary',
    url: '#video-stream',
    thumbnail: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&q=80&w=200',
    duration: '08:45',
    description: 'An educational video guide describing the biology and engineering of Ebiswa—floating papyrus roots mobilized by clans.'
  },
  {
    id: 'med-4',
    title: 'Bakenye Heritage Clans Totem Guide',
    type: 'pdf',
    category: 'Downloadable Booklet',
    url: '#download-pdf-totems',
    thumbnail: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&q=80&w=200',
    description: 'An official 24-page PDF document listing the ancestral totems, mottos, and custom shields of all recognized Bakenye clans.'
  }
];

export default function MemberDashboard() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  
  // Real user state from Supabase / Sandbox
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<'public' | 'reporter'>('public');

  // Layout Tab State
  const [activeTab, setActiveTab] = useState<string>(() => {
    return localStorage.getItem('bakenyi_member_active_tab') || 'dashboard';
  });

  // Data States loaded from LocalStorage or Defaults
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifError, setNotifError] = useState<string | null>(null);
  const [notifPage, setNotifPage] = useState(1);
  const [notifTotalCount, setNotifTotalCount] = useState(0);
  const notifPageSize = 5;
  const [communityUpdates, setCommunityUpdates] = useState<CommunityUpdateItem[]>([]);
  const [events, setEvents] = useState<HeritageEvent[]>([]);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  
  // Search Experience States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [suggestedResults, setSuggestedResults] = useState<any[]>([]);

  // Profile States
  const [profileName, setProfileName] = useState('Bakenyi Learner');
  const [profileAvatar, setProfileAvatar] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200');
  const [preferredDialect, setPreferredDialect] = useState('Lukenye Standard');
  const [notifPref, setNotifPref] = useState({
    articles: true,
    exhibitions: true,
    events: true,
    announcements: true,
    resources: true,
    updates: false,
    email: true,
    push: false
  });
  const [accessibilityFont, setAccessibilityFont] = useState<'normal' | 'large' | 'extra'>('normal');
  const [highContrast, setHighContrast] = useState(false);

  // Active Experiences Overlays/Panels
  const [readingArticle, setReadingArticle] = useState<any | null>(null);
  const [readingProgress, setReadingProgress] = useState(72); // Continue reading starts at 72%
  const [selectedEvent, setSelectedEvent] = useState<HeritageEvent | null>(null);
  const [activeMedia, setActiveMedia] = useState<MediaItem | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [showStatusToast, setShowStatusToast] = useState<string | null>(null);

  // Sync active tab to storage
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    localStorage.setItem('bakenyi_member_active_tab', tabId);
    setReadingArticle(null); // Close overlays on tab transition
    setSelectedEvent(null);
    setActiveMedia(null);
  };

  // Auth Listener
  useEffect(() => {
    const client = getSupabase();

    const checkRole = async (currentUser: any) => {
      if (!currentUser) return;
      const email = currentUser.email?.toLowerCase() || '';
      
      // Sandbox fallback / direct email triggers
      if (email.includes('staff') || email.includes('reporter') || email.includes('leader')) {
        setUserRole('reporter');
        return;
      }
      
      if (client) {
        try {
          const { data, error } = await client
            .from('profiles')
            .select('role')
            .eq('id', currentUser.id)
            .maybeSingle();
          if (!error && (data?.role === 'staff' || data?.role === 'reporter')) {
            setUserRole('reporter');
            return;
          }
        } catch (e) {
          console.error("Error loading role:", e);
        }
      }
      setUserRole('public');
    };

    if (client) {
      client.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          setUser(session.user);
          setProfileName(session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Learner');
          checkRole(session.user);
        }
        setLoading(false);
      });
      const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user || null);
        if (session?.user) {
          setProfileName(session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Learner');
          checkRole(session.user);
        }
      });
      return () => subscription.unsubscribe();
    } else {
      setLoading(false);
    }
  }, []);

  // Initialize data stores
  useEffect(() => {
    // Saved Items
    const storedSaved = localStorage.getItem('bakenyi_saved_items');
    if (storedSaved) {
      setSavedItems(JSON.parse(storedSaved));
    } else {
      setSavedItems(DEFAULT_SAVED_ITEMS);
      localStorage.setItem('bakenyi_saved_items', JSON.stringify(DEFAULT_SAVED_ITEMS));
    }

    // Notifications
    const storedNotifs = localStorage.getItem('bakenyi_notifications');
    if (storedNotifs) {
      setNotifications(JSON.parse(storedNotifs));
    } else {
      setNotifications(DEFAULT_NOTIFICATIONS);
      localStorage.setItem('bakenyi_notifications', JSON.stringify(DEFAULT_NOTIFICATIONS));
    }

    // Saved Searches
    const storedSavedSearches = localStorage.getItem('bakenyi_saved_searches');
    if (storedSavedSearches) {
      setSavedSearches(JSON.parse(storedSavedSearches));
    } else {
      const defaultSearches: SavedSearch[] = [
        { id: 'ss-1', query: 'BaiseMugosa Clan', category: 'Clans', timestamp: '2 days ago' },
        { id: 'ss-2', query: 'Canoe Building', category: 'Articles', timestamp: '5 days ago' }
      ];
      setSavedSearches(defaultSearches);
      localStorage.setItem('bakenyi_saved_searches', JSON.stringify(defaultSearches));
    }

    // Search History
    const storedSearchHistory = localStorage.getItem('bakenyi_search_history');
    if (storedSearchHistory) {
      setSearchHistory(JSON.parse(storedSearchHistory));
    } else {
      const defaultHistory = ['Kyoga geography', 'Floating Islands', 'Lukenye Alphabet'];
      setSearchHistory(defaultHistory);
      localStorage.setItem('bakenyi_search_history', JSON.stringify(defaultHistory));
    }

    // Fetch live backend data to keep dashboard functional and aligned with backend
    async function loadBackendData() {
      try {
        const [newsData, eventsData, contributionsData] = await Promise.all([
          getNews(),
          getEvents(),
          getContributions()
        ]);

        // Map News/Articles to Community Updates
        if (newsData && newsData.length > 0) {
          const mappedUpdates: CommunityUpdateItem[] = newsData.map(n => ({
            id: n.id,
            title: n.title,
            body: n.content || n.summary || '',
            author: 'Bakenyi Reporter',
            category: 'news',
            publishedAt: n.published_at ? new Date(n.published_at).toLocaleDateString() : new Date().toLocaleDateString(),
            likes: 0,
            image: n.cover_image
          }));
          setCommunityUpdates(mappedUpdates);
        } else {
          setCommunityUpdates([]);
        }

        // Map Events
        if (eventsData && eventsData.length > 0) {
          const mappedEvents: HeritageEvent[] = eventsData.map(e => ({
            id: e.id,
            title: e.title,
            description: e.description,
            date: e.start_datetime ? new Date(e.start_datetime).toLocaleDateString() : 'Upcoming',
            time: e.start_datetime ? new Date(e.start_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'All day',
            location: e.location,
            elder: e.organizer || 'Bakenyi Leader',
            isJoined: false,
            category: 'Assembly'
          }));
          setEvents(mappedEvents);
        } else {
          setEvents([]);
        }

        // Map Contributions to Media
        if (contributionsData && contributionsData.length > 0) {
          const mappedMedia: MediaItem[] = contributionsData.filter(c => c.status === 'approved' && c.imageUrl).map(c => ({
            id: c.id,
            title: c.title,
            type: (c.type === 'video' || c.type === 'audio' || c.type === 'pdf') ? c.type as any : 'image',
            category: c.type || 'Upload',
            url: c.imageUrl,
            thumbnail: c.imageUrl,
            description: c.description
          }));
          setMediaItems(mappedMedia);
        } else {
          setMediaItems([]);
        }
      } catch (err) {
        console.error('Failed to load backend data for member dashboard:', err);
      }
    }
    loadBackendData();

    // Profile preferences
    const storedProfileName = localStorage.getItem('bakenyi_profile_name');
    if (storedProfileName) setProfileName(storedProfileName);

    const storedProfileAvatar = localStorage.getItem('bakenyi_profile_avatar');
    if (storedProfileAvatar) setProfileAvatar(storedProfileAvatar);

    const storedDialect = localStorage.getItem('bakenyi_profile_dialect');
    if (storedDialect) setPreferredDialect(storedDialect);

    const storedNotifPrefs = localStorage.getItem('bakenyi_profile_notif_prefs');
    if (storedNotifPrefs) setNotifPref(JSON.parse(storedNotifPrefs));
  }, []);

  // Fetch dispatches/notifications directly from Supabase (or fallback safely)
  const fetchDBNotifications = async (userId: string, pageNum: number) => {
    setNotifLoading(true);
    setNotifError(null);
    try {
      const offset = (pageNum - 1) * notifPageSize;
      const { data, count, error } = await getUserNotifications(userId, notifPageSize, offset);
      if (error) throw error;
      
      const mapped: NotificationItem[] = data.map((n) => {
        let cat: 'article' | 'exhibition' | 'event' | 'announcement' | 'resource' | 'update' = 'announcement';
        if (['article', 'exhibition', 'event', 'announcement', 'resource', 'update'].includes(n.type)) {
          cat = n.type as any;
        }
        
        let displayTime = 'Recent';
        if (n.created_at) {
          const date = new Date(n.created_at);
          const diffMs = Date.now() - date.getTime();
          const diffMins = Math.floor(diffMs / 60000);
          const diffHours = Math.floor(diffMins / 60);
          const diffDays = Math.floor(diffHours / 24);
          
          if (diffMins < 60) {
            displayTime = diffMins <= 1 ? 'Just now' : `${diffMins} mins ago`;
          } else if (diffHours < 24) {
            displayTime = diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
          } else {
            displayTime = diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
          }
        }

        return {
          id: n.id,
          title: n.title,
          body: n.message,
          category: cat,
          timestamp: displayTime,
          isRead: n.is_read,
          link: n.link
        };
      });

      setNotifications(mapped);
      setNotifTotalCount(count);
    } catch (err: any) {
      console.warn("Could not retrieve notifications from Supabase, using localStorage:", err);
      setNotifError("Database connection is not fully configured. Using offline cached dispatches instead.");
      
      const storedNotifs = localStorage.getItem('bakenyi_notifications');
      if (storedNotifs) {
        try {
          const parsed = JSON.parse(storedNotifs);
          setNotifTotalCount(parsed.length);
          const offset = (pageNum - 1) * notifPageSize;
          setNotifications(parsed.slice(offset, offset + notifPageSize));
        } catch {
          setNotifications(DEFAULT_NOTIFICATIONS);
          setNotifTotalCount(DEFAULT_NOTIFICATIONS.length);
        }
      } else {
        setNotifications(DEFAULT_NOTIFICATIONS);
        setNotifTotalCount(DEFAULT_NOTIFICATIONS.length);
      }
    } finally {
      setNotifLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchDBNotifications(user.id, notifPage);
    }
  }, [user?.id, notifPage]);

  // Handle Search Input Suggested Results
  useEffect(() => {
    if (searchQuery.trim().length === 0) {
      setSuggestedResults([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    
    // Search within vocabulary, clans, and default bookmarks
    const vocabularyList = [
      { id: 'v-1', type: 'dictionary', title: 'Ebiswa', subtitle: 'Floating Islands', detail: 'Papyrus root islands migrated as shelters.' },
      { id: 'v-2', type: 'dictionary', title: 'Amanzi', subtitle: 'Water', detail: 'The core ecological element in Bakenyi oral wisdom.' },
      { id: 'v-3', type: 'dictionary', title: 'Eshumu', subtitle: 'Fishing Spear', detail: 'The ceremonial spear symbolizing aquatic guardianship.' }
    ];

    const allSources = [...DEFAULT_SAVED_ITEMS, ...vocabularyList];
    const filtered = allSources.filter(item => 
      item.title.toLowerCase().includes(query) ||
      item.subtitle.toLowerCase().includes(query) ||
      item.detail.toLowerCase().includes(query)
    );

    setSuggestedResults(filtered.slice(0, 5));
  }, [searchQuery]);

  // Toast helper
  const triggerToast = (message: string) => {
    setShowStatusToast(message);
    setTimeout(() => {
      setShowStatusToast(null);
    }, 3000);
  };

  // Log out session
  const handleLogout = async () => {
    const client = getSupabase();
    if (client) {
      await client.auth.signOut();
    }
    triggerToast('Logged out successfully.');
    navigate('/');
  };

  // Add/Remove Saved Item (Bookmark system)
  const toggleBookmark = (item: Omit<SavedItem, 'id'> & { id?: string }) => {
    const itemId = item.id || `custom-${Date.now()}`;
    const exists = savedItems.some(s => s.id === itemId || (s.title === item.title && s.type === item.type));

    let updatedList: SavedItem[] = [];
    if (exists) {
      updatedList = savedItems.filter(s => s.id !== itemId && !(s.title === item.title && s.type === item.type));
      triggerToast(`Removed from My Heritage.`);
    } else {
      updatedList = [
        ...savedItems,
        {
          id: itemId,
          type: item.type,
          title: item.title,
          subtitle: item.subtitle,
          detail: item.detail,
          image: item.image,
          category: item.category
        }
      ];
      triggerToast(`Saved to My Heritage.`);
    }

    setSavedItems(updatedList);
    localStorage.setItem('bakenyi_saved_items', JSON.stringify(updatedList));
  };

  // Remove bookmark directly
  const removeSavedItem = (id: string) => {
    const updated = savedItems.filter(s => s.id !== id);
    setSavedItems(updated);
    localStorage.setItem('bakenyi_saved_items', JSON.stringify(updated));
    triggerToast('Item removed from saved heritage.');
  };

  // Save active Search Query
  const saveSearchQuery = () => {
    if (!searchQuery.trim()) return;
    const exists = savedSearches.some(s => s.query.toLowerCase() === searchQuery.toLowerCase());
    if (exists) {
      triggerToast('Search is already saved.');
      return;
    }

    const newSaved: SavedSearch = {
      id: `ss-${Date.now()}`,
      query: searchQuery.trim(),
      category: 'General',
      timestamp: 'Just now'
    };

    const updated = [newSaved, ...savedSearches];
    setSavedSearches(updated);
    localStorage.setItem('bakenyi_saved_searches', JSON.stringify(updated));
    triggerToast('Search criteria bookmarked.');
  };

  // Trigger search execution
  const executeSearch = (query: string) => {
    setSearchQuery(query);
    // Add to history
    const isHistoryExist = searchHistory.includes(query);
    let updatedHistory = [...searchHistory];
    if (!isHistoryExist) {
      updatedHistory = [query, ...searchHistory].slice(0, 10);
      setSearchHistory(updatedHistory);
      localStorage.setItem('bakenyi_search_history', JSON.stringify(updatedHistory));
    }
    
    // Simulate finding results - if it matches a saved default item type, we open it!
    const matches = DEFAULT_SAVED_ITEMS.find(s => s.title.toLowerCase().includes(query.toLowerCase()));
    if (matches) {
      if (matches.type === 'article') {
        openArticle(matches);
      } else {
        // Switch to My Heritage tab filtered to this type
        setActiveTab('my_heritage');
        setSearchQuery('');
      }
    } else {
      triggerToast(`Searched: "${query}". See matches in repository.`);
    }
  };

  const clearSearchHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('bakenyi_search_history');
    triggerToast('Search history cleared.');
  };

  const deleteSavedSearch = (id: string) => {
    const updated = savedSearches.filter(s => s.id !== id);
    setSavedSearches(updated);
    localStorage.setItem('bakenyi_saved_searches', JSON.stringify(updated));
    triggerToast('Saved search deleted.');
  };

  // Notification management
  const markNotificationRead = async (id: string) => {
    // Optimistic update
    const updated = notifications.map(n => n.id === id ? { ...n, isRead: true } : n);
    setNotifications(updated);
    
    // Backup local state update
    const storedNotifs = localStorage.getItem('bakenyi_notifications');
    if (storedNotifs) {
      try {
        const parsed = JSON.parse(storedNotifs) as NotificationItem[];
        const localUpdated = parsed.map(n => n.id === id ? { ...n, isRead: true } : n);
        localStorage.setItem('bakenyi_notifications', JSON.stringify(localUpdated));
      } catch (e) {
        console.error(e);
      }
    }

    if (user?.id) {
      await apiMarkAsRead(id);
    }
  };

  const markAllNotificationsRead = async () => {
    const updated = notifications.map(n => ({ ...n, isRead: true }));
    setNotifications(updated);

    const storedNotifs = localStorage.getItem('bakenyi_notifications');
    if (storedNotifs) {
      try {
        const parsed = JSON.parse(storedNotifs) as NotificationItem[];
        const localUpdated = parsed.map(n => ({ ...n, isRead: true }));
        localStorage.setItem('bakenyi_notifications', JSON.stringify(localUpdated));
      } catch (e) {
        console.error(e);
      }
    }

    if (user?.id) {
      const success = await apiMarkAllAsRead(user.id);
      if (success) {
        triggerToast('All dispatches marked as read.');
        fetchDBNotifications(user.id, notifPage);
      }
    } else {
      triggerToast('All dispatches marked as read.');
    }
  };

  // Join / Subscribe to events
  const toggleJoinEvent = (eventId: string) => {
    const updated = events.map(e => {
      if (e.id === eventId) {
        const isNowJoined = !e.isJoined;
        if (isNowJoined) {
          triggerToast('Registered for community event reminder!');
        } else {
          triggerToast('Cancelled event reminder.');
        }
        return { ...e, isJoined: isNowJoined };
      }
      return e;
    });
    setEvents(updated);
    localStorage.setItem('bakenyi_member_events', JSON.stringify(updated));
  };

  // Calendar Event (.ics download generator for cross-platform support)
  const downloadCalendarEvent = (event: HeritageEvent) => {
    const cleanTitle = event.title.replace(/[^a-zA-Z0-9 ]/g, '');
    const cleanDesc = event.description.replace(/[^a-zA-Z0-9 ]/g, '');
    const icsContent = 
`BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Bakenyi Heritage Platform//Member Event//EN
BEGIN:VEVENT
SUMMARY:${cleanTitle}
DESCRIPTION:${cleanDesc}\\nElder Representative: ${event.elder}
LOCATION:${event.location}
DTSTART:20260815T090000Z
DTEND:20260815T170000Z
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${event.id}_event.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast('Calendar invitation (.ics) downloaded.');
  };

  // Share Event
  const shareEventDetails = (event: HeritageEvent) => {
    const text = `Join the Bakenyi Community Event: "${event.title}" on ${event.date} at ${event.location}. Presided by ${event.elder}.`;
    navigator.clipboard.writeText(text);
    triggerToast('Event details copied to clipboard!');
  };

  // Profile preferences updates
  const saveProfileSettings = (name: string, dialect: string) => {
    setProfileName(name);
    setPreferredDialect(dialect);
    localStorage.setItem('bakenyi_profile_name', name);
    localStorage.setItem('bakenyi_profile_dialect', dialect);
    triggerToast('Profile successfully saved.');
  };

  const updateNotifPref = (key: keyof typeof notifPref, value: boolean) => {
    const updated = { ...notifPref, [key]: value };
    setNotifPref(updated);
    localStorage.setItem('bakenyi_profile_notif_prefs', JSON.stringify(updated));
  };

  // Simulated Media Download
  const executeDownload = (media: MediaItem) => {
    triggerToast(`Initializing file retrieval for: "${media.title}"...`);
    setTimeout(() => {
      const icsContent = `% BAKENYI HERITAGE PRESERVATION FILE\nTITLE: ${media.title}\nCATEGORY: ${media.category}\nCUSTODIAN: Bakenyi Cultural Council Archive\n\n[Protected heritage study material. Distributed under regional fair use guidelines.]`;
      const blob = new Blob([icsContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${media.id}_preservation_booklet.txt`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      triggerToast('Download completed successfully.');
    }, 1500);
  };

  // Reading Experience Activation
  const openArticle = (item: any) => {
    setReadingArticle({
      id: item.id,
      title: item.title,
      author: item.subtitle || 'Elder Moses Musuusu',
      category: item.category || 'Heritage',
      image: item.image || 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&q=80&w=1200',
      content: `The waters of Lake Kyoga have served as the lifeforce and adaptive platform of the Bakenyi clans for centuries. Unlike agricultural communities settled firmly on territorial shorelines, the early Bakenyi engineered a migratory canoe economy centered on floating islands (known natively as Ebiswa).\n\n### The Engineering of Ebiswa\nThese floating islands are not merely natural accidents, but carefully managed root ecosystems. Over generations, craftsmen bound together living papyrus reed rootbeds, creating stable, buoyant, and transportable surfaces. Entire families constructed temporary houses on these beds, drifting with the currents to optimize fishing spots and avoid regional conflicts.\n\n### Traditional Canoe Navigation\nCrafting the vessel requires selection of durable native timber like the mahogany variants found along the riparian valleys. Using handhewn adzes, carvers hollow the trunk before sealing seams with wild papyrus fiber and tree resin sealants.\n\n### Modern Language Preservation\nPreserving the original Lukenye nouns for these natural elements is critical. The word "Amanzi" carries heavy spiritual gravity, referencing the aquatic sanctuary that provided safety from regional wars. Under modern platforms, the preservation of vocabulary keeps these ancient lifeways accessible to the younger generation.`
    });
    setReadingProgress(item.id === 'art-1' ? 72 : 0); // Start at 72% for the default continuous article, otherwise 0%
  };

  // Custom Vocabulary tooltip inside article
  const [hoveredVocab, setHoveredVocab] = useState<string | null>(null);
  const vocabDefinitions: { [key: string]: string } = {
    'Ebiswa': 'Floating islands engineered from buoyant papyrus reed roots.',
    'Amanzi': 'Lukenye term for water, viewed as a physical and spiritual sanctuary.',
    'Eshumu': 'The traditional fishing spear, symbolic of ancestral provider lineage.'
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-heritage-cream dark:bg-slate-900 flex flex-col justify-center items-center py-20">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-4 border-heritage-terracotta/20 border-t-heritage-terracotta animate-spin" />
        </div>
        <p className="text-xs font-bold uppercase tracking-widest text-heritage-brown/60 dark:text-heritage-sand/60 mt-6 animate-pulse">
          Opening Member Sanctuary...
        </p>
      </div>
    );
  }

  if (userRole === 'reporter') {
    return (
      <div className="min-h-screen bg-heritage-cream dark:bg-slate-950 transition-colors duration-300">
        <SEO 
          title="Community Leader Workspace" 
          description="Operational dashboard for Community Leaders of Bakenye Heritage Platform."
        />
        <div className="pt-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 relative z-10">
          <LeaderDashboardView user={user} />
        </div>
      </div>
    );
  }

  // Determine accessibility style classes
  const fontClass = accessibilityFont === 'large' ? 'text-lg' : accessibilityFont === 'extra' ? 'text-xl' : 'text-sm md:text-base';
  const headingClass = accessibilityFont === 'large' ? 'text-2xl font-serif' : accessibilityFont === 'extra' ? 'text-3xl font-serif' : 'text-xl font-serif';

  return (
    <div className={`min-h-screen bg-heritage-cream dark:bg-slate-950 text-heritage-ink dark:text-slate-100 transition-colors duration-300 relative ${highContrast ? 'contrast-125' : ''}`}>
      <SEO 
        title="Member Heritage Sanctuary" 
        description="Redesigned Registered Member Experience - explore authentic Bakenye chronicles, dictionary vocabularies, community alerts, and custom saved collections."
      />
      <div className="absolute inset-0 cultural-pattern opacity-[0.03] pointer-events-none" />

      {/* Global Status Toast */}
      <AnimatePresence>
        {showStatusToast && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-[120] bg-heritage-brown text-white dark:bg-heritage-sand dark:text-heritage-brown px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 font-bold text-xs uppercase tracking-wider"
          >
            <Check className="w-4 h-4 text-heritage-terracotta" />
            <span>{showStatusToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 relative z-10">
        
        {/* Top Header Section */}
        <div className="bg-white/85 dark:bg-slate-900/80 backdrop-blur-md border border-heritage-brown/10 dark:border-slate-800 rounded-3xl p-6 mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img 
                src={profileAvatar} 
                alt={profileName}
                className="w-16 h-16 rounded-full object-cover border-2 border-heritage-terracotta shadow-inner"
              />
              <div className="absolute -bottom-1 -right-1 bg-heritage-terracotta text-white p-1 rounded-full shadow-md" title="Registered Member (Consumer)">
                <Shield className="w-3.5 h-3.5" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-widest text-heritage-terracotta">Member Sanctuary</span>
                <span className="text-[9px] font-black uppercase bg-heritage-brown/5 text-heritage-brown dark:bg-slate-800 dark:text-heritage-sand px-2 py-0.5 rounded-full">
                  Read Only
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-serif font-black text-heritage-brown dark:text-white leading-tight">
                Welcome, {profileName}
              </h1>
              <p className="text-xs text-heritage-brown/60 dark:text-slate-400 font-semibold mt-0.5">
                Dialect Preference: <span className="text-heritage-terracotta">{preferredDialect}</span>
              </p>
            </div>
          </div>

          {/* Core Member Navigation Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-heritage-brown/5 dark:bg-slate-950/40 rounded-2xl border border-heritage-brown/10 dark:border-slate-800/80">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: Compass },
              { id: 'my_heritage', label: 'My Heritage', icon: Heart },
              { id: 'community_feed', label: 'Updates', icon: Globe },
              { id: 'notifications', label: 'Dispatches', icon: Bell, count: notifications.filter(n => !n.isRead).length },
              { id: 'profile', label: 'Profile', icon: User },
              { id: 'settings', label: 'Settings', icon: Settings }
            ].map((tab) => {
              const IconComp = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer relative ${
                    isSelected 
                      ? 'bg-heritage-brown text-white dark:bg-heritage-terracotta shadow-sm'
                      : 'hover:bg-heritage-brown/5 text-heritage-brown/80 dark:text-slate-300 dark:hover:bg-slate-900'
                  }`}
                >
                  <IconComp className="w-4 h-4 shrink-0" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className={`px-1.5 py-0.5 text-[9px] font-black rounded-full leading-none ${
                      isSelected ? 'bg-white text-heritage-brown' : 'bg-heritage-terracotta text-white'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area Switcher */}
        <div className="grid grid-cols-1 gap-8">
          
          {/* OVERLAY PANEL: Article Reading Experience */}
          <AnimatePresence>
            {readingArticle && (
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 30 }}
                className="bg-white dark:bg-slate-900 border border-heritage-brown/15 dark:border-slate-800 rounded-[32px] overflow-hidden shadow-xl p-6 md:p-10 mb-8 relative"
              >
                {/* Floating Top reading progress bar */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-heritage-brown/15 dark:bg-slate-800">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${readingProgress}%` }}
                    className="h-full bg-heritage-terracotta"
                  />
                </div>

                <div className="flex items-center justify-between gap-4 mb-8">
                  <button
                    onClick={() => {
                      // Save progress if desired
                      triggerToast(`Saved reading progress: ${readingProgress}%`);
                      setReadingArticle(null);
                    }}
                    className="flex items-center gap-1.5 text-heritage-brown/60 hover:text-heritage-terracotta dark:text-slate-400 dark:hover:text-heritage-sand transition-colors font-bold text-xs uppercase tracking-widest cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Return to Dashboard</span>
                  </button>

                  <div className="flex items-center gap-2">
                    {/* Simulated Reading Progress Slider */}
                    <div className="flex items-center gap-2 bg-heritage-brown/5 dark:bg-slate-950 px-3 py-1.5 rounded-full text-[10px] font-black uppercase text-heritage-brown/60 dark:text-slate-300">
                      <span>Progress:</span>
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={readingProgress}
                        onChange={(e) => setReadingProgress(Number(e.target.value))}
                        className="w-16 md:w-24 accent-heritage-terracotta cursor-pointer"
                      />
                      <span>{readingProgress}%</span>
                    </div>

                    <button
                      onClick={() => toggleBookmark({
                        type: 'article',
                        title: readingArticle.title,
                        subtitle: readingArticle.author,
                        detail: 'An interactive bookmarked chronicle.'
                      })}
                      className="p-2 bg-heritage-brown/5 dark:bg-slate-950 rounded-full hover:bg-heritage-brown/10 dark:hover:bg-slate-800 text-heritage-brown dark:text-slate-300 transition-all cursor-pointer"
                      title="Bookmark Article"
                    >
                      <Bookmark className={`w-4 h-4 ${savedItems.some(s => s.title === readingArticle.title) ? 'fill-heritage-terracotta text-heritage-terracotta' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Article Header Grid */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start mb-10 pb-8 border-b border-heritage-brown/10 dark:border-slate-800">
                  <div className="md:col-span-8">
                    <span className="inline-block px-3 py-1 rounded-full bg-heritage-terracotta/10 border border-heritage-terracotta/20 text-heritage-terracotta text-[10px] font-black uppercase tracking-widest mb-3">
                      {readingArticle.category}
                    </span>
                    <h2 className="text-2xl md:text-4xl font-serif font-black text-heritage-brown dark:text-white tracking-tight leading-tight">
                      {readingArticle.title}
                    </h2>
                    <p className="text-xs text-heritage-brown/60 dark:text-slate-400 font-bold mt-2">
                      Written by <span className="text-heritage-brown dark:text-slate-300 font-extrabold">{readingArticle.author}</span> • Published in preservation archives
                    </p>
                  </div>
                  <div className="md:col-span-4 w-full h-36 rounded-2xl overflow-hidden border border-heritage-brown/10">
                    <img 
                      src={readingArticle.image} 
                      alt={readingArticle.title} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Content columns */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Left Main Reading Body */}
                  <div className="lg:col-span-8 prose prose-slate dark:prose-invert max-w-none">
                    <div className={`space-y-6 text-heritage-brown/85 dark:text-slate-200 leading-relaxed font-medium ${fontClass}`}>
                      {readingArticle.content.split('\n\n').map((paragraph: string, idx: number) => {
                        if (paragraph.startsWith('### ')) {
                          return (
                            <h3 key={idx} className="text-lg md:text-xl font-serif font-black text-heritage-brown dark:text-white pt-4">
                              {paragraph.replace('### ', '')}
                            </h3>
                          );
                        }
                        return (
                          <p key={idx} className="indent-0">
                            {/* Simple inline highlight for custom vocabulary dictionary definitions */}
                            {paragraph.split(' ').map((word, wIdx) => {
                              const cleanWord = word.replace(/[^a-zA-Z]/g, '');
                              const hasDefinition = vocabDefinitions[cleanWord] !== undefined;
                              if (hasDefinition) {
                                return (
                                  <span 
                                    key={wIdx}
                                    className="relative inline-block"
                                    onMouseEnter={() => setHoveredVocab(cleanWord)}
                                    onMouseLeave={() => setHoveredVocab(null)}
                                  >
                                    <span className="bg-heritage-terracotta/10 dark:bg-heritage-sand/10 border-b border-dashed border-heritage-terracotta text-heritage-terracotta font-extrabold px-1 rounded cursor-help">
                                      {word}
                                    </span>
                                    <AnimatePresence>
                                      {hoveredVocab === cleanWord && (
                                        <motion.span 
                                          initial={{ opacity: 0, y: -10 }}
                                          animate={{ opacity: 1, y: -5 }}
                                          exit={{ opacity: 0, y: -10 }}
                                          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-900 text-white text-[10px] p-2.5 rounded-xl shadow-lg leading-normal z-50 pointer-events-none text-center font-bold"
                                        >
                                          <span className="text-heritage-sand block uppercase font-black tracking-wider mb-1">Lukenye Vocab:</span>
                                          {vocabDefinitions[cleanWord]}
                                        </motion.span>
                                      )}
                                    </AnimatePresence>
                                  </span>
                                );
                              }
                              return word + ' ';
                            })}
                          </p>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right Reading Meta Sidebar (Vocabulary, Timeline events, related Media) */}
                  <div className="lg:col-span-4 space-y-6">
                    {/* Interactive Related Vocabulary Card */}
                    <div className="bg-heritage-brown/5 dark:bg-slate-950 p-5 rounded-2xl border border-heritage-brown/10 dark:border-slate-800">
                      <h4 className="text-xs font-black uppercase tracking-widest text-heritage-brown dark:text-heritage-sand mb-3 flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4 text-heritage-terracotta" />
                        <span>Interactive Glossary</span>
                      </h4>
                      <p className="text-[11px] text-heritage-brown/50 dark:text-slate-400 mb-4 font-semibold leading-relaxed">
                        Hover or click highlights inside the article, or examine key lesson cards below:
                      </p>
                      <div className="space-y-3">
                        {Object.entries(vocabDefinitions).map(([term, def]) => (
                          <div 
                            key={term}
                            onClick={() => toggleBookmark({
                              type: 'dictionary',
                              title: term,
                              subtitle: 'Lukenye Vocabulary Card',
                              detail: def
                            })}
                            className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-heritage-brown/5 dark:border-slate-800/60 hover:border-heritage-terracotta cursor-pointer transition-all flex justify-between items-start gap-2 group"
                            title="Save dictionary card"
                          >
                            <div>
                              <span className="font-extrabold text-xs text-heritage-terracotta block group-hover:underline">{term}</span>
                              <span className="text-[10.5px] text-heritage-brown/75 dark:text-slate-300 block leading-normal mt-1">{def}</span>
                            </div>
                            <Plus className="w-3.5 h-3.5 text-heritage-brown/40 group-hover:text-heritage-terracotta shrink-0 mt-0.5" />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Related Timeline Events */}
                    <div className="bg-heritage-brown/5 dark:bg-slate-950 p-5 rounded-2xl border border-heritage-brown/10 dark:border-slate-800">
                      <h4 className="text-xs font-black uppercase tracking-widest text-heritage-brown dark:text-heritage-sand mb-3 flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-heritage-terracotta" />
                        <span>Related History Logs</span>
                      </h4>
                      <ul className="space-y-3 text-xs">
                        <li className="flex items-start gap-2.5">
                          <span className="w-2 h-2 rounded-full bg-heritage-terracotta mt-1.5 shrink-0" />
                          <div>
                            <strong className="text-heritage-brown dark:text-white font-extrabold">1840 Migration Epoch:</strong>
                            <p className="text-[10.5px] text-heritage-brown/60 dark:text-slate-400 leading-normal mt-0.5">Clans establish base around southern papyrus swamp regions of Kyoga.</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-2.5">
                          <span className="w-2 h-2 rounded-full bg-heritage-terracotta mt-1.5 shrink-0" />
                          <div>
                            <strong className="text-heritage-brown dark:text-white font-extrabold">Canoe Craft Codification:</strong>
                            <p className="text-[10.5px] text-heritage-brown/60 dark:text-slate-400 leading-normal mt-0.5">Elders declare standardized structural guidelines for dugout watercraft hulls.</p>
                          </div>
                        </li>
                      </ul>
                    </div>

                    {/* Related Media stream */}
                    <div className="bg-heritage-brown/5 dark:bg-slate-950 p-5 rounded-2xl border border-heritage-brown/10 dark:border-slate-800">
                      <h4 className="text-xs font-black uppercase tracking-widest text-heritage-brown dark:text-heritage-sand mb-3 flex items-center gap-1.5">
                        <Volume2 className="w-4 h-4 text-heritage-terracotta animate-pulse" />
                        <span>Related Chant Media</span>
                      </h4>
                      <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-heritage-brown/5 dark:border-slate-800/60 flex items-center gap-3">
                        <button 
                          onClick={() => {
                            setActiveMedia(DEFAULT_MEDIA[1]);
                            setIsAudioPlaying(true);
                          }}
                          className="w-8 h-8 rounded-full bg-heritage-terracotta hover:bg-heritage-brown text-white flex items-center justify-center cursor-pointer shadow-sm shrink-0"
                        >
                          <Play className="w-4 h-4 fill-white pl-0.5" />
                        </button>
                        <div className="min-w-0">
                          <span className="font-bold text-xs text-heritage-brown dark:text-white block truncate">Lukenye Oral Alphabet</span>
                          <span className="text-[9px] text-heritage-brown/50 dark:text-slate-400 block font-semibold mt-0.5">Lesson Chant • 14:20 mins</span>
                        </div>
                      </div>
                    </div>

                    {/* Share Article link action */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`Check out this historical article: ${readingArticle.title} on Bakenyi Heritage Platform.`);
                          triggerToast('Article link copied to clipboard!');
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-heritage-brown/10 hover:bg-heritage-brown text-heritage-brown hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                      >
                        <Share2 className="w-4 h-4" />
                        <span>Copy Share Link</span>
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* TAB 1: Member Dashboard Home Feed */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-fade-in">
              
              {/* Quick Search and Suggested Topics */}
              <div className="bg-white dark:bg-slate-900 border border-heritage-brown/10 dark:border-slate-800 rounded-3xl p-5 md:p-6 shadow-sm">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-heritage-brown/40 dark:text-slate-500" />
                  <input 
                    type="text"
                    placeholder="Quick search across clans, language cards, and historic chronicles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        executeSearch(searchQuery);
                      }
                    }}
                    className="w-full bg-heritage-cream dark:bg-slate-950 border border-heritage-brown/10 dark:border-slate-800 rounded-2xl pl-12 pr-28 py-4 text-sm text-heritage-brown dark:text-white placeholder-heritage-brown/40 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-950 focus:border-heritage-terracotta focus:outline-none transition-all font-semibold shadow-inner"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                    {searchQuery.trim().length > 0 && (
                      <button
                        onClick={saveSearchQuery}
                        className="px-2.5 py-1.5 bg-heritage-terracotta/10 hover:bg-heritage-terracotta/20 text-heritage-terracotta text-[10px] font-black uppercase tracking-widest rounded-lg cursor-pointer"
                        title="Save search parameters"
                      >
                        Save Search
                      </button>
                    )}
                    <button 
                      onClick={() => executeSearch(searchQuery)}
                      className="px-4 py-1.5 bg-heritage-brown text-white dark:bg-heritage-sand dark:text-heritage-brown rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Search
                    </button>
                  </div>
                </div>

                {/* Suggested results overlay */}
                <AnimatePresence>
                  {suggestedResults.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="mt-4 p-2 bg-heritage-cream/50 dark:bg-slate-950/50 rounded-2xl border border-heritage-brown/5 dark:border-slate-800/60 divide-y divide-heritage-brown/5 dark:divide-slate-800/80"
                    >
                      <span className="text-[9px] font-black uppercase tracking-widest text-heritage-brown/40 block px-3 py-1.5">Suggested Matches</span>
                      {suggestedResults.map((item) => (
                        <div 
                          key={item.id}
                          onClick={() => {
                            if (item.type === 'article') {
                              openArticle(item);
                            } else {
                              toggleBookmark(item);
                            }
                            setSearchQuery('');
                          }}
                          className="p-3 hover:bg-white dark:hover:bg-slate-900 rounded-xl cursor-pointer transition-all flex justify-between items-center group"
                        >
                          <div>
                            <span className="text-[9px] font-black uppercase text-heritage-terracotta tracking-wider block">{item.type}</span>
                            <span className="font-extrabold text-xs text-heritage-brown dark:text-white block group-hover:underline">{item.title}</span>
                            <span className="text-[10.5px] text-heritage-brown/50 dark:text-slate-400 block truncate max-w-lg">{item.detail}</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-heritage-brown/30 group-hover:text-heritage-terracotta group-hover:translate-x-1 transition-all" />
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Search helper and history */}
                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
                  <span className="text-[10px] font-black uppercase tracking-widest text-heritage-brown/40 dark:text-slate-500">Popular:</span>
                  {['Ebiswa', 'BaiseMugosa', 'Canoe Craft', 'Amanzi'].map((term) => (
                    <button 
                      key={term}
                      onClick={() => executeSearch(term)}
                      className="text-heritage-brown/80 dark:text-slate-300 font-extrabold hover:text-heritage-terracotta hover:underline"
                    >
                      #{term}
                    </button>
                  ))}
                </div>
              </div>

              {/* Personalized Activity Summary and Continue Reading Row */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Continue Reading section */}
                <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-heritage-brown/10 dark:border-slate-800 rounded-[28px] p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-heritage-brown/5 dark:border-slate-800">
                      <span className="text-xs font-black uppercase tracking-widest text-heritage-brown dark:text-heritage-sand flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-heritage-terracotta" />
                        <span>Continue Reading</span>
                      </span>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-heritage-terracotta/10 text-heritage-terracotta rounded-full">
                        72% Complete
                      </span>
                    </div>

                    <h3 className="text-lg md:text-xl font-serif font-black text-heritage-brown dark:text-white tracking-tight leading-snug">
                      The Migratory Waters of Kyoga
                    </h3>
                    <p className="text-xs text-heritage-brown/60 dark:text-slate-400 font-bold mt-1">
                      Oral chronicle compiled by Chief Elder Moses Musuusu
                    </p>
                    <p className="text-xs text-heritage-brown/70 dark:text-slate-300 leading-relaxed mt-3">
                      "...The Ebiswa floating papyrus islands drift with seasonal winds, allowing clans to transition fishing fields without dismantling settlement logs..."
                    </p>
                  </div>

                  <div className="pt-6 mt-6 border-t border-heritage-brown/5 dark:border-slate-800 flex items-center justify-between gap-4">
                    <div className="w-1/2 h-1.5 bg-heritage-brown/10 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-heritage-terracotta w-[72%]" />
                    </div>
                    <button
                      onClick={() => openArticle({
                        id: 'art-1',
                        title: 'Migratory Waters of Kyoga',
                        subtitle: 'Elder Moses Musuusu',
                        image: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&q=80&w=1200'
                      })}
                      className="px-5 py-2.5 bg-heritage-terracotta hover:bg-heritage-brown text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center gap-1 shadow-sm active:scale-95"
                    >
                      <span>Resume Chapter</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Personalized Activity Summary metrics */}
                <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-heritage-brown/10 dark:border-slate-800 rounded-[28px] p-6 shadow-sm">
                  <h3 className="text-xs font-black uppercase tracking-widest text-heritage-brown dark:text-heritage-sand mb-4 pb-2 border-b border-heritage-brown/5 dark:border-slate-800">
                    Heritage Activity Summary
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-heritage-brown/5 dark:bg-slate-950 p-3.5 rounded-2xl border border-heritage-brown/5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-heritage-brown/40 dark:text-slate-400 block">Saved Clans</span>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-2xl font-serif font-black text-heritage-terracotta">
                          {savedItems.filter(s => s.type === 'clan').length}
                        </span>
                        <span className="text-[10px] text-heritage-brown/50 font-bold">clans</span>
                      </div>
                    </div>

                    <div className="bg-heritage-brown/5 dark:bg-slate-950 p-3.5 rounded-2xl border border-heritage-brown/5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-heritage-brown/40 dark:text-slate-400 block">Saved Words</span>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-2xl font-serif font-black text-heritage-terracotta">
                          {savedItems.filter(s => s.type === 'dictionary').length}
                        </span>
                        <span className="text-[10px] text-heritage-brown/50 font-bold">cards</span>
                      </div>
                    </div>

                    <div className="bg-heritage-brown/5 dark:bg-slate-950 p-3.5 rounded-2xl border border-heritage-brown/5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-heritage-brown/40 dark:text-slate-400 block">Culture Hours</span>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-2xl font-serif font-black text-heritage-terracotta">2.4</span>
                        <span className="text-[10px] text-heritage-brown/50 font-bold">hours</span>
                      </div>
                    </div>

                    <div className="bg-heritage-brown/5 dark:bg-slate-950 p-3.5 rounded-2xl border border-heritage-brown/5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-heritage-brown/40 dark:text-slate-400 block">Saved Media</span>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-2xl font-serif font-black text-heritage-terracotta">
                          {savedItems.filter(s => ['song','video'].includes(s.type)).length}
                        </span>
                        <span className="text-[10px] text-heritage-brown/50 font-bold">items</span>
                      </div>
                    </div>
                  </div>

                  {/* Aesthetic Wisdom Proverb banner */}
                  <div className="mt-5 p-3.5 bg-heritage-terracotta/5 dark:bg-slate-950 border border-dashed border-heritage-terracotta/25 rounded-2xl text-center">
                    <span className="text-[8px] font-black uppercase tracking-widest text-heritage-terracotta block mb-1">Daily River Wisdom</span>
                    <p className="text-xs text-heritage-brown font-serif italic font-bold dark:text-slate-200">
                      "Ekintu ekyeitayebwa amanzi tikiitibwa"
                    </p>
                    <p className="text-[9.5px] text-heritage-brown/50 dark:text-slate-400 font-semibold mt-0.5">
                      That which is protected by the sanctuary of waters cannot be lost.
                    </p>
                  </div>
                </div>
              </div>

              {/* Recommended Heritage Content and Saved Searches Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Left: Recommended Content Collection */}
                <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-heritage-brown/10 dark:border-slate-800 rounded-[28px] p-6 shadow-sm">
                  <h3 className="text-xs font-black uppercase tracking-widest text-heritage-brown dark:text-heritage-sand mb-5 pb-2 border-b border-heritage-brown/5 dark:border-slate-800">
                    Recommended Heritage Content
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {DEFAULT_SAVED_ITEMS.slice(1, 5).map((item) => (
                      <div 
                        key={item.id}
                        className="bg-heritage-cream/40 dark:bg-slate-950/40 p-4 rounded-2xl border border-heritage-brown/5 dark:border-slate-800/60 flex flex-col justify-between group"
                      >
                        <div>
                          <span className="text-[8px] font-black uppercase bg-heritage-terracotta/10 text-heritage-terracotta px-2 py-0.5 rounded-full inline-block mb-2">
                            {item.type}
                          </span>
                          <h4 className="font-serif font-black text-xs text-heritage-brown dark:text-white group-hover:text-heritage-terracotta leading-snug">
                            {item.title}
                          </h4>
                          <span className="text-[10px] text-heritage-brown/50 dark:text-slate-400 block mt-1 font-semibold leading-normal">
                            {item.subtitle}
                          </span>
                          <p className="text-[11px] text-heritage-brown/70 dark:text-slate-300 leading-normal mt-2">
                            {item.detail}
                          </p>
                        </div>

                        <div className="pt-4 mt-4 border-t border-heritage-brown/5 dark:border-slate-800 flex items-center justify-between">
                          <button
                            onClick={() => {
                              if (item.type === 'article') {
                                openArticle(item);
                              } else {
                                toggleBookmark(item);
                              }
                            }}
                            className="text-[10px] font-black uppercase text-heritage-terracotta hover:underline cursor-pointer"
                          >
                            Explore Item
                          </button>
                          <button
                            onClick={() => toggleBookmark(item)}
                            className="p-1.5 hover:bg-heritage-brown/5 dark:hover:bg-slate-900 rounded-full text-heritage-brown/50 hover:text-heritage-terracotta cursor-pointer"
                            title="Save bookmark"
                          >
                            <Bookmark className={`w-3.5 h-3.5 ${savedItems.some(s => s.title === item.title) ? 'fill-heritage-terracotta text-heritage-terracotta' : ''}`} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: Saved Searches & Search History */}
                <div className="lg:col-span-4 space-y-6">
                  
                  {/* Saved Searches */}
                  <div className="bg-white dark:bg-slate-900 border border-heritage-brown/10 dark:border-slate-800 rounded-[28px] p-6 shadow-sm">
                    <h3 className="text-xs font-black uppercase tracking-widest text-heritage-brown dark:text-heritage-sand mb-4 pb-2 border-b border-heritage-brown/5 dark:border-slate-800">
                      Saved Searches
                    </h3>
                    
                    {savedSearches.length > 0 ? (
                      <div className="space-y-3">
                        {savedSearches.map((s) => (
                          <div 
                            key={s.id}
                            className="bg-heritage-brown/5 dark:bg-slate-950 p-3 rounded-xl border border-heritage-brown/5 flex items-center justify-between gap-2"
                          >
                            <button
                              onClick={() => executeSearch(s.query)}
                              className="text-left text-xs font-bold text-heritage-brown dark:text-white hover:text-heritage-terracotta hover:underline truncate flex-1 block"
                            >
                              "{s.query}"
                              <span className="text-[9px] font-black block uppercase text-heritage-brown/40 dark:text-slate-500 mt-0.5">
                                Filter: {s.category} • {s.timestamp}
                              </span>
                            </button>
                            <button
                              onClick={() => deleteSavedSearch(s.id)}
                              className="p-1 text-heritage-brown/40 hover:text-rose-600 rounded-full cursor-pointer"
                              title="Delete saved search"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center py-6 text-xs text-heritage-brown/40 dark:text-slate-500 font-semibold italic">
                        No saved searches. Use the search bar above to query.
                      </p>
                    )}
                  </div>

                  {/* Search History */}
                  <div className="bg-white dark:bg-slate-900 border border-heritage-brown/10 dark:border-slate-800 rounded-[28px] p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-heritage-brown/5 dark:border-slate-800">
                      <h3 className="text-xs font-black uppercase tracking-widest text-heritage-brown dark:text-heritage-sand">
                        Search History
                      </h3>
                      {searchHistory.length > 0 && (
                        <button
                          onClick={clearSearchHistory}
                          className="text-[9px] font-black uppercase text-heritage-brown/40 hover:text-rose-600"
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    {searchHistory.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {searchHistory.map((h, i) => (
                          <button
                            key={i}
                            onClick={() => executeSearch(h)}
                            className="px-2.5 py-1.5 bg-heritage-cream hover:bg-heritage-brown/5 dark:bg-slate-950 dark:hover:bg-slate-900 border border-heritage-brown/10 dark:border-slate-800 rounded-lg text-[10.5px] text-heritage-brown/80 dark:text-slate-300 font-bold transition-all cursor-pointer"
                          >
                            {h}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center py-4 text-xs text-heritage-brown/40 dark:text-slate-500 font-semibold italic">
                        History is clear.
                      </p>
                    )}
                  </div>

                </div>

              </div>

              {/* Upcoming Community Events and Recent Announcements Row */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Left: Upcoming Community Events Details Panel */}
                <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-heritage-brown/10 dark:border-slate-800 rounded-[28px] p-6 shadow-sm">
                  <h3 className="text-xs font-black uppercase tracking-widest text-heritage-brown dark:text-heritage-sand mb-5 pb-2 border-b border-heritage-brown/5 dark:border-slate-800">
                    Upcoming Community Events
                  </h3>

                  <div className="space-y-4">
                    {events.map((evt) => (
                      <div 
                        key={evt.id}
                        className="bg-heritage-cream/40 dark:bg-slate-950/40 p-5 rounded-2xl border border-heritage-brown/5 dark:border-slate-800/60"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                          <span className="px-2.5 py-0.5 rounded-full bg-heritage-terracotta/10 border border-heritage-terracotta/15 text-heritage-terracotta text-[9px] font-black uppercase tracking-wider">
                            {evt.category} Event
                          </span>
                          <span className="text-[10px] font-black uppercase text-heritage-brown/50 dark:text-slate-400 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-heritage-terracotta" />
                            {evt.date}
                          </span>
                        </div>

                        <h4 className="font-serif font-black text-sm text-heritage-brown dark:text-white leading-tight mb-2">
                          {evt.title}
                        </h4>
                        <p className="text-[11px] text-heritage-brown/70 dark:text-slate-300 leading-normal line-clamp-2">
                          {evt.description}
                        </p>

                        <div className="pt-4 mt-4 border-t border-heritage-brown/5 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
                          <div className="text-[10px] text-heritage-brown/60 dark:text-slate-400 font-bold">
                            Presiding: <span className="font-extrabold text-heritage-brown dark:text-white">{evt.elder}</span> • <span className="italic">{evt.location}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => downloadCalendarEvent(evt)}
                              className="px-3 py-1.5 bg-heritage-brown/5 hover:bg-heritage-brown/10 text-heritage-brown dark:text-slate-300 dark:hover:bg-slate-800 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center gap-1"
                              title="Download Calendar (.ics) invitation"
                            >
                              <Download className="w-3 h-3" />
                              <span>Add Calendar</span>
                            </button>
                            <button
                              onClick={() => shareEventDetails(evt)}
                              className="px-3 py-1.5 bg-heritage-brown/5 hover:bg-heritage-brown/10 text-heritage-brown dark:text-slate-300 dark:hover:bg-slate-800 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center gap-1"
                              title="Copy details"
                            >
                              <Share2 className="w-3 h-3" />
                              <span>Share</span>
                            </button>
                            <button
                              onClick={() => toggleJoinEvent(evt.id)}
                              className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                                evt.isJoined 
                                  ? 'bg-heritage-olive text-white' 
                                  : 'bg-heritage-terracotta text-white hover:bg-heritage-brown'
                              }`}
                            >
                              {evt.isJoined ? <Check className="w-3.5 h-3.5" /> : null}
                              <span>{evt.isJoined ? 'Subscribed' : 'Get Reminders'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: Recent Announcements */}
                <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-heritage-brown/10 dark:border-slate-800 rounded-[28px] p-6 shadow-sm">
                  <h3 className="text-xs font-black uppercase tracking-widest text-heritage-brown dark:text-heritage-sand mb-4 pb-2 border-b border-heritage-brown/5 dark:border-slate-800">
                    Recent Council Announcements
                  </h3>

                  <div className="space-y-4">
                    {DEFAULT_COMMUNITY_UPDATES.filter(u => u.category === 'announcement' || u.category === 'news').slice(0, 2).map((upd) => (
                      <div key={upd.id} className="border-b border-heritage-brown/5 dark:border-slate-800 pb-3 last:border-b-0 last:pb-0">
                        <span className="text-[9px] font-black uppercase text-heritage-terracotta tracking-wider block mb-1">
                          {upd.publishedAt} • By {upd.author}
                        </span>
                        <h4 className="font-serif font-black text-xs text-heritage-brown dark:text-white leading-snug">
                          {upd.title}
                        </h4>
                        <p className="text-[11px] text-heritage-brown/60 dark:text-slate-400 line-clamp-2 leading-relaxed mt-1">
                          {upd.body}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 mt-4 border-t border-heritage-brown/5 dark:border-slate-800">
                    <button
                      onClick={() => handleTabChange('community_feed')}
                      className="text-xs font-black uppercase tracking-wider text-heritage-terracotta hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <span>View all community dispatches</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: My Heritage - Saved Content Workspace */}
          {activeTab === 'my_heritage' && (
            <div className="bg-white dark:bg-slate-900 border border-heritage-brown/10 dark:border-slate-800 rounded-3xl p-6 shadow-sm animate-fade-in">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-heritage-brown/10 dark:border-slate-800 pb-5 mb-6 gap-4">
                <div>
                  <h2 className="text-xl font-serif font-black text-heritage-brown dark:text-white">
                    My Heritage Space
                  </h2>
                  <p className="text-xs text-heritage-brown/60 dark:text-slate-400 mt-1 font-semibold">
                    Organize, review, and manage your bookmarked cultural resources and dictionary cards.
                  </p>
                </div>

                {/* Local search inside My Heritage */}
                <span className="text-xs font-black uppercase px-3 py-1 bg-heritage-brown/5 dark:bg-slate-950 text-heritage-brown dark:text-heritage-sand rounded-xl border border-heritage-brown/10">
                  Total Saved: {savedItems.length} records
                </span>
              </div>

              {savedItems.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {savedItems.map((item) => (
                    <div 
                      key={item.id}
                      className="bg-heritage-cream/30 dark:bg-slate-950/40 border border-heritage-brown/10 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between group"
                    >
                      {item.image && (
                        <div className="h-32 w-full overflow-hidden shrink-0">
                          <img 
                            src={item.image} 
                            alt={item.title} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                      )}

                      <div className="p-4 flex-grow flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="text-[8px] font-black uppercase px-2 py-0.5 bg-heritage-terracotta/10 text-heritage-terracotta rounded-full inline-block">
                              {item.type}
                            </span>
                            {item.category && (
                              <span className="text-[8px] font-bold text-heritage-brown/40 uppercase">
                                {item.category}
                              </span>
                            )}
                          </div>

                          <h4 className="font-serif font-black text-sm text-heritage-brown dark:text-white group-hover:text-heritage-terracotta leading-snug">
                            {item.title}
                          </h4>
                          <span className="text-[10px] text-heritage-brown/50 dark:text-slate-400 block mt-0.5 font-bold">
                            {item.subtitle}
                          </span>
                          <p className="text-[11px] text-heritage-brown/70 dark:text-slate-300 leading-normal mt-2.5">
                            {item.detail}
                          </p>
                        </div>

                        <div className="pt-4 mt-4 border-t border-heritage-brown/5 dark:border-slate-800 flex items-center justify-between">
                          <button
                            onClick={() => {
                              if (item.type === 'article') {
                                openArticle(item);
                              } else {
                                // Emulate trigger matching media if song or video
                                if (['song', 'video', 'audio'].includes(item.type)) {
                                  const matchingMedia = DEFAULT_MEDIA.find(m => m.title.toLowerCase().includes(item.title.toLowerCase()) || m.type === item.type);
                                  if (matchingMedia) {
                                    setActiveMedia(matchingMedia);
                                  } else {
                                    triggerToast(`Opening custom saved ${item.type}.`);
                                  }
                                } else {
                                  triggerToast(`Viewing Saved ${item.type} metadata details.`);
                                }
                              }
                            }}
                            className="text-[10px] font-black uppercase text-heritage-terracotta hover:underline cursor-pointer flex items-center gap-1"
                          >
                            <span>Launch</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>

                          <button
                            onClick={() => removeSavedItem(item.id)}
                            className="p-1.5 hover:bg-rose-50 rounded-full text-heritage-brown/40 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Remove Saved Bookmark"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-heritage-cream/10 rounded-2xl border border-dashed border-heritage-brown/15 p-8">
                  <Heart className="w-12 h-12 text-heritage-brown/20 mx-auto mb-3" />
                  <h4 className="font-serif font-black text-base text-heritage-brown dark:text-white mb-1">
                    No Saved Heritage Items
                  </h4>
                  <p className="text-xs text-heritage-brown/50 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                    Explore the dashboard recommended topics or search the platform dictionary, saving elements using the heart or bookmark icon.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Community Updates Feed (Read-Only) */}
          {activeTab === 'community_feed' && (
            <div className="bg-white dark:bg-slate-900 border border-heritage-brown/10 dark:border-slate-800 rounded-3xl p-6 shadow-sm animate-fade-in">
              <div className="border-b border-heritage-brown/10 dark:border-slate-800 pb-5 mb-8">
                <h2 className="text-xl font-serif font-black text-heritage-brown dark:text-white">
                  Community Chronicles & updates
                </h2>
                <p className="text-xs text-heritage-brown/60 dark:text-slate-400 mt-1 font-semibold">
                  Personalized read-only dispatch feed of news, council dispatches, and preservation updates.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Left vertical timeline feed */}
                <div className="lg:col-span-8 space-y-8">
                  {communityUpdates.map((item) => (
                    <div 
                      key={item.id}
                      className="bg-heritage-cream/20 dark:bg-slate-950/20 p-6 rounded-2xl border border-heritage-brown/5 dark:border-slate-800 flex flex-col md:flex-row gap-6 relative"
                    >
                      {item.image && (
                        <div className="w-full md:w-[35%] h-44 rounded-xl overflow-hidden shrink-0 border border-heritage-brown/10">
                          <img 
                            src={item.image} 
                            alt={item.title} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      <div className="flex-grow flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="px-2.5 py-0.5 rounded-full bg-heritage-terracotta/10 border border-heritage-terracotta/15 text-heritage-terracotta text-[9px] font-black uppercase tracking-wider">
                              {item.category} Update
                            </span>
                            <span className="text-[10px] font-black uppercase text-heritage-brown/40 dark:text-slate-500">
                              {item.publishedAt}
                            </span>
                          </div>

                          <h3 className="font-serif font-black text-base md:text-lg text-heritage-brown dark:text-white leading-snug">
                            {item.title}
                          </h3>
                          <span className="text-[10px] text-heritage-brown/50 dark:text-slate-400 block mt-0.5 font-bold">
                            By {item.author}
                          </span>
                          <p className="text-xs text-heritage-brown/75 dark:text-slate-300 leading-relaxed mt-3 font-semibold">
                            {item.body}
                          </p>
                        </div>

                        <div className="pt-4 mt-4 border-t border-heritage-brown/5 dark:border-slate-800 flex items-center justify-between">
                          <span className="text-[10px] text-heritage-brown/40 dark:text-slate-500 font-extrabold flex items-center gap-1.5 uppercase">
                            <Heart className="w-3.5 h-3.5 text-heritage-terracotta fill-heritage-terracotta" />
                            <span>{item.likes} members validated</span>
                          </span>

                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(`Community dispatch: "${item.title}" - published by Bakenye Heritage Board.`);
                              triggerToast('Dispatch text copied!');
                            }}
                            className="text-[10px] font-black uppercase text-heritage-brown/50 hover:text-heritage-terracotta cursor-pointer"
                          >
                            Copy Share Link
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Right: Media browser widget */}
                <div className="lg:col-span-4 bg-heritage-brown/5 dark:bg-slate-950 p-6 rounded-[24px] border border-heritage-brown/10 dark:border-slate-800">
                  <h3 className="text-xs font-black uppercase tracking-widest text-heritage-brown dark:text-heritage-sand mb-4 pb-2 border-b border-heritage-brown/5 dark:border-slate-800 flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-heritage-terracotta animate-pulse" />
                    <span>Media Experience Vault</span>
                  </h3>
                  <p className="text-[11px] text-heritage-brown/50 dark:text-slate-400 mb-4 font-semibold leading-relaxed">
                    Watch traditional canoe carpentry videos or listen to lessons authorized by the board:
                  </p>

                  <div className="space-y-4">
                    {mediaItems.map((med) => (
                      <div 
                        key={med.id}
                        className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-heritage-brown/5 dark:border-slate-800 flex gap-3 p-2.5 items-start relative group hover:border-heritage-terracotta transition-all"
                      >
                        <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 relative">
                          <img 
                            src={med.thumbnail} 
                            alt={med.title} 
                            className="w-full h-full object-cover"
                          />
                          {med.type === 'video' && (
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                              <Play className="w-4 h-4 text-white fill-white" />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <span className="text-[8px] font-black uppercase text-heritage-terracotta tracking-wider block">
                            {med.category} {med.duration ? `• ${med.duration}` : ''}
                          </span>
                          <h4 className="font-serif font-extrabold text-[11.5px] text-heritage-brown dark:text-white truncate mt-0.5 leading-snug">
                            {med.title}
                          </h4>
                          <div className="flex gap-2.5 mt-1.5">
                            <button
                              onClick={() => {
                                if (med.type === 'pdf') {
                                  executeDownload(med);
                                } else {
                                  setActiveMedia(med);
                                }
                              }}
                              className="text-[9px] font-black uppercase text-heritage-terracotta hover:underline cursor-pointer"
                            >
                              {med.type === 'pdf' ? 'Download' : 'Launch'}
                            </button>
                            <button
                              onClick={() => toggleBookmark({
                                type: med.type === 'video' ? 'video' : 'song',
                                title: med.title,
                                subtitle: med.category,
                                detail: med.description
                              })}
                              className="text-[9px] font-black uppercase text-heritage-brown/40 hover:text-heritage-terracotta cursor-pointer"
                            >
                              Bookmark
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 4: Notifications (Dispatches) Center */}
          {activeTab === 'notifications' && (
            <div className="bg-white dark:bg-slate-900 border border-heritage-brown/10 dark:border-slate-800 rounded-3xl p-6 shadow-sm animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-heritage-brown/10 dark:border-slate-800 pb-5 mb-6 gap-4">
                <div>
                  <h2 className="text-xl font-serif font-black text-heritage-brown dark:text-white">
                    Dispatches & Alerts
                  </h2>
                  <p className="text-xs text-heritage-brown/60 dark:text-slate-400 mt-1 font-semibold">
                    Notification center showing real-time updates for newly published heritage resources.
                  </p>
                </div>

                {!notifLoading && notifications.some(n => !n.isRead) && (
                  <button
                    onClick={markAllNotificationsRead}
                    className="px-3 py-1.5 bg-heritage-terracotta/10 hover:bg-heritage-terracotta/20 text-heritage-terracotta text-xs font-bold rounded-lg transition-all cursor-pointer"
                  >
                    Mark All As Read
                  </button>
                )}
              </div>

              {notifError && (
                <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-2xl text-amber-800 dark:text-amber-300 text-xs font-semibold flex items-center gap-2">
                  <Info className="w-4 h-4 shrink-0" />
                  <span>{notifError}</span>
                </div>
              )}

              {notifLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-4 rounded-2xl border border-heritage-brown/5 dark:border-slate-800/60 bg-white dark:bg-slate-900 animate-pulse flex items-start gap-4">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0" />
                      <div className="flex-1 space-y-2 py-1">
                        <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-md w-1/4" />
                        <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-md w-3/4" />
                        <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-md w-5/6" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : notifications.length > 0 ? (
                <div className="space-y-4">
                  {notifications.map((notif) => (
                    <div 
                      key={notif.id}
                      onClick={() => !notif.isRead && markNotificationRead(notif.id)}
                      className={`p-4 rounded-2xl border transition-all flex items-start gap-4 cursor-pointer relative ${
                        notif.isRead 
                          ? 'bg-heritage-cream/10 border-heritage-brown/5 dark:bg-slate-900 dark:border-slate-800/40 opacity-70' 
                          : 'bg-heritage-terracotta/5 border-heritage-terracotta/25 dark:bg-slate-950 dark:border-slate-800/80 shadow-xs'
                      }`}
                    >
                      <div className="p-2.5 bg-white dark:bg-slate-900 border border-heritage-brown/5 dark:border-slate-800 rounded-xl shrink-0">
                        {notif.category === 'article' && <FileText className="w-4 h-4 text-heritage-terracotta" />}
                        {notif.category === 'event' && <Calendar className="w-4 h-4 text-heritage-olive" />}
                        {notif.category === 'announcement' && <Bell className="w-4 h-4 text-amber-500 animate-pulse" />}
                        {notif.category === 'update' && <SlidersHorizontal className="w-4 h-4 text-purple-500" />}
                        {!['article','event','announcement','update'].includes(notif.category) && <Info className="w-4 h-4 text-blue-500" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-[8px] font-black uppercase bg-heritage-brown/5 text-heritage-brown dark:bg-slate-800 dark:text-heritage-sand px-2 py-0.5 rounded-full inline-block">
                            {notif.category}
                          </span>
                          <span className="text-[10px] text-heritage-brown/40 dark:text-slate-500 font-bold">
                            {notif.timestamp}
                          </span>
                        </div>
                        <h4 className={`font-serif text-sm text-heritage-brown dark:text-white leading-snug ${notif.isRead ? 'font-bold' : 'font-black'}`}>
                          {notif.title}
                        </h4>
                        <p className="text-xs text-heritage-brown/70 dark:text-slate-300 leading-normal mt-1 font-semibold">
                          {notif.body}
                        </p>
                      </div>

                      {!notif.isRead && (
                        <span className="w-2.5 h-2.5 bg-heritage-terracotta rounded-full shrink-0 mt-2.5 shadow-sm animate-ping" title="Unread Dispatch" />
                      )}
                    </div>
                  ))}

                  {/* Pagination Controls */}
                  {notifTotalCount > notifPageSize && (
                    <div className="flex items-center justify-between border-t border-heritage-brown/10 dark:border-slate-800 pt-5 mt-6">
                      <button
                        onClick={() => setNotifPage(p => Math.max(p - 1, 1))}
                        disabled={notifPage === 1 || notifLoading}
                        className="flex items-center gap-1.5 px-3 py-2 bg-heritage-cream/30 dark:bg-slate-800/80 hover:bg-heritage-cream/60 dark:hover:bg-slate-700/80 text-heritage-brown dark:text-white rounded-xl text-xs font-bold transition-all disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed border border-heritage-brown/5 dark:border-slate-750"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Previous</span>
                      </button>
                      
                      <span className="text-xs text-heritage-brown/60 dark:text-slate-400 font-bold font-sans">
                        Page {notifPage} of {Math.ceil(notifTotalCount / notifPageSize)}
                      </span>
                      
                      <button
                        onClick={() => setNotifPage(p => Math.min(p + 1, Math.ceil(notifTotalCount / notifPageSize)))}
                        disabled={notifPage >= Math.ceil(notifTotalCount / notifPageSize) || notifLoading}
                        className="flex items-center gap-1.5 px-3 py-2 bg-heritage-cream/30 dark:bg-slate-800/80 hover:bg-heritage-cream/60 dark:hover:bg-slate-700/80 text-heritage-brown dark:text-white rounded-xl text-xs font-bold transition-all disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed border border-heritage-brown/5 dark:border-slate-750"
                      >
                        <span>Next</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-center py-12 text-xs text-heritage-brown/40 dark:text-slate-500 font-semibold italic">
                  Dispatch queue is empty.
                </p>
              )}
            </div>
          )}

          {/* TAB 5: Profile - Consumer Access Panel */}
          {activeTab === 'profile' && (
            <UserProfileModule user={user} />
          )}

          {/* TAB 6: Settings & Accessibility Controls */}
          {activeTab === 'settings' && (
            <div className="bg-white dark:bg-slate-900 border border-heritage-brown/10 dark:border-slate-800 rounded-3xl p-6 shadow-sm animate-fade-in">
              <div className="border-b border-heritage-brown/10 dark:border-slate-800 pb-5 mb-8">
                <h2 className="text-xl font-serif font-black text-heritage-brown dark:text-white">
                  System Settings & Accessibility
                </h2>
                <p className="text-xs text-heritage-brown/60 dark:text-slate-400 mt-1 font-semibold">
                  Personalize your visual canvas, text sizing ratios, theme, and account diagnostics.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Visual Customization & Sizing */}
                <div className="space-y-6">
                  <div className="bg-heritage-brown/5 dark:bg-slate-950 p-5 rounded-2xl border border-heritage-brown/5 space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-heritage-brown dark:text-heritage-sand pb-1.5 border-b border-heritage-brown/5">
                      Visual Canvas & Theme
                    </h3>

                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-heritage-brown dark:text-slate-300 block">Contrast Dark Mode</span>
                        <span className="text-[10px] text-heritage-brown/50 dark:text-slate-400 font-semibold">Switch colors to fit high visibility guidelines.</span>
                      </div>
                      <button
                        onClick={toggleTheme}
                        className="px-4 py-2 bg-heritage-brown text-white dark:bg-heritage-sand dark:text-heritage-brown text-[10px] font-black uppercase tracking-wider rounded-xl cursor-pointer"
                      >
                        Toggle Mode
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-heritage-brown dark:text-slate-300 block">High Contrast Mode</span>
                        <span className="text-[10px] text-heritage-brown/50 dark:text-slate-400 font-semibold">Enhance contrast ratios for borders and lines.</span>
                      </div>
                      <input 
                        type="checkbox"
                        checked={highContrast}
                        onChange={(e) => {
                          setHighContrast(e.target.checked);
                          triggerToast(e.target.checked ? 'High contrast mode active.' : 'Standard contrast mode.');
                        }}
                        className="accent-heritage-terracotta cursor-pointer w-4 h-4"
                      />
                    </div>
                  </div>

                  {/* Accessibility font slider */}
                  <div className="bg-heritage-brown/5 dark:bg-slate-950 p-5 rounded-2xl border border-heritage-brown/5 space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-heritage-brown dark:text-heritage-sand pb-1.5 border-b border-heritage-brown/5">
                      Accessibility Typography sizing
                    </h3>

                    <div>
                      <span className="text-xs font-bold text-heritage-brown dark:text-slate-300 block mb-2">Display Sizing Scale:</span>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'normal', label: 'Normal' },
                          { id: 'large', label: 'Large (18px)' },
                          { id: 'extra', label: 'Extra (22px)' }
                        ].map((scale) => (
                          <button
                            key={scale.id}
                            onClick={() => {
                              setAccessibilityFont(scale.id as any);
                              triggerToast(`Font scale updated to: ${scale.label}`);
                            }}
                            className={`py-2 text-[10px] font-black uppercase tracking-wider rounded-lg border transition-all cursor-pointer ${
                              accessibilityFont === scale.id 
                                ? 'bg-heritage-terracotta text-white border-heritage-terracotta shadow-sm'
                                : 'bg-white hover:bg-heritage-brown/5 text-heritage-brown/80 border-heritage-brown/10'
                            }`}
                          >
                            {scale.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Governance and Account Security dispatches */}
                <div className="space-y-6">
                  <div className="bg-heritage-brown/5 dark:bg-slate-950 p-5 rounded-2xl border border-heritage-brown/5 space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-heritage-brown dark:text-heritage-sand pb-1.5 border-b border-heritage-brown/5">
                      Compliance & Governance
                    </h3>

                    <p className="text-xs text-heritage-brown/70 dark:text-slate-300 leading-relaxed font-semibold">
                      This redesign preserves strict **Row Level Security (RLS)** in Supabase. Your registered account is isolated inside the reader role.
                    </p>

                    <div className="bg-amber-50 dark:bg-slate-900 border border-amber-200 dark:border-slate-800 p-3.5 rounded-xl text-[11px] text-amber-800 dark:text-slate-300 font-semibold space-y-1">
                      <strong className="text-heritage-terracotta uppercase tracking-wider font-black block">Strict Governance Safeguard:</strong>
                      <span>Members are granted read-only viewing of historical chronicles and dictionary tags. No media publishing, deletion, or administrative tools are accessible under this security token.</span>
                    </div>
                  </div>

                  <div className="bg-heritage-brown/5 dark:bg-slate-950 p-5 rounded-2xl border border-heritage-brown/5 text-center">
                    <h3 className="text-xs font-black uppercase tracking-widest text-heritage-brown dark:text-heritage-sand mb-2">
                      Registered Member Session
                    </h3>
                    <p className="text-[10.5px] text-heritage-brown/50 dark:text-slate-400 mb-4 leading-normal">
                      Are you done exploring the chronicles? Safely sign out of your current heritage session below.
                    </p>
                    <button
                      onClick={handleLogout}
                      className="w-full py-3 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <LogOut className="w-4.5 h-4.5" />
                      <span>Sign Out Session</span>
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>

      </div>

      {/* AUDIO/VIDEO IMMERSIVE MEDIA PLAYER DRAWER OVERLAY */}
      <AnimatePresence>
        {activeMedia && (
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-0 left-0 right-0 z-[110] bg-slate-950 text-white border-t border-slate-800 shadow-2xl p-6 rounded-t-[32px]"
          >
            <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
              
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-slate-800 relative">
                  <img src={activeMedia.thumbnail} alt={activeMedia.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    {activeMedia.type === 'audio' ? (
                      <Volume2 className="w-5 h-5 text-heritage-terracotta animate-pulse" />
                    ) : (
                      <Video className="w-5 h-5 text-heritage-terracotta" />
                    )}
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black uppercase text-heritage-terracotta tracking-wider px-2 py-0.5 bg-slate-900 rounded-full">
                      {activeMedia.category}
                    </span>
                    {activeMedia.duration && (
                      <span className="text-[9px] text-slate-400 font-bold">
                        {activeMedia.duration} Duration
                      </span>
                    )}
                  </div>
                  <h4 className="font-serif font-black text-sm text-white truncate mt-1 leading-snug">
                    {activeMedia.title}
                  </h4>
                  <p className="text-[10.5px] text-slate-400 truncate max-w-md mt-0.5 font-semibold">
                    {activeMedia.description}
                  </p>
                </div>
              </div>

              {/* Player Simulators */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2.5 bg-slate-900 px-4 py-2 rounded-2xl border border-slate-800">
                  <button 
                    onClick={() => setIsAudioPlaying(!isAudioPlaying)}
                    className="w-9 h-9 rounded-full bg-heritage-terracotta hover:bg-white text-white hover:text-heritage-brown flex items-center justify-center cursor-pointer transition-all shrink-0"
                  >
                    {isAudioPlaying ? (
                      <span className="w-3.5 h-3.5 flex gap-1 justify-center items-center">
                        <span className="w-1 h-3.5 bg-current rounded-full animate-pulse" />
                        <span className="w-1 h-3.5 bg-current rounded-full animate-pulse [animation-delay:0.2s]" />
                      </span>
                    ) : (
                      <Play className="w-4 h-4 fill-current pl-0.5" />
                    )}
                  </button>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-300">
                    {isAudioPlaying ? 'Streaming Chant Live' : 'Streaming Paused'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleBookmark({
                      type: activeMedia.type === 'video' ? 'video' : 'song',
                      title: activeMedia.title,
                      subtitle: activeMedia.category,
                      detail: activeMedia.description
                    })}
                    className="p-2.5 bg-slate-900 hover:bg-slate-800 rounded-xl border border-slate-800 text-slate-300 cursor-pointer"
                    title="Bookmark Media File"
                  >
                    <Bookmark className={`w-4 h-4 ${savedItems.some(s => s.title === activeMedia.title) ? 'fill-heritage-terracotta text-heritage-terracotta' : ''}`} />
                  </button>
                  <button
                    onClick={() => setActiveMedia(null)}
                    className="p-2.5 bg-slate-900 hover:bg-slate-800 rounded-xl border border-slate-800 text-slate-400 hover:text-white cursor-pointer"
                    title="Close Media Player"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
