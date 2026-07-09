import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowRight, BookOpen, Users, Compass, Globe, Volume2, Video, 
  Image as ImageIcon, MapPin, Calendar, Megaphone, Heart, X, 
  MessageSquare, Pin, Clock, AlertTriangle, Sparkles, Check,
  Search, Shield, Award, Coffee, Music, ChevronRight, Play, Pause, Info, HelpCircle,
  Share2, Bookmark
} from 'lucide-react';
import { getArticles, getContributions, getClans, getLeaders, getVocabulary, getGalleryImages } from '../lib/supabase';
import { 
  getStatuses, getNews, getAnnouncements, getEvents, 
  updateStatus, updateEvent, updateAnnouncement 
} from '../lib/heritageService';
import { Status, News, Announcement, Event } from '../types/heritage';
import { dailySpotlights, getIcon as getDailyIcon, SpotlightItem } from '../data/dailyHeritage';
import { journeySteps, getJourneyIcon } from '../data/heritageJourney';

const containerAnimation = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemAnimation = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
};

export default function Home() {
  const navigate = useNavigate();
  const [recentArticles, setRecentArticles] = useState<any[]>([]);
  const [recentStories, setRecentStories] = useState<any[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [news, setNews] = useState<News[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [clans, setClans] = useState<any[]>([]);
  const [leaders, setLeaders] = useState<any[]>([]);
  const [vocabulary, setVocabulary] = useState<any[]>([]);
  const [galleryImages, setGalleryImages] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);

  // Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Daily seed for "Today in Bakenyi Heritage"
  const dailySpotlight = useMemo(() => {
    const date = new Date();
    // Deterministic seed based on year, month, and day
    const dateSeed = date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
    const index = dateSeed % dailySpotlights.length;
    return dailySpotlights[index];
  }, []);

  const [bookmarks, setBookmarks] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('bakenyi-bookmarks') || '[]');
    } catch {
      return [];
    }
  });

  const toggleBookmark = (id: string) => {
    setBookmarks(prev => {
      const next = prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id];
      localStorage.setItem('bakenyi-bookmarks', JSON.stringify(next));
      return next;
    });
  };

  const [shareNotification, setShareNotification] = useState<string | null>(null);

  const handleShare = (item: any) => {
    const url = `${window.location.origin}${item.path}?shared=${item.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setShareNotification(`Heritage link copied for ${item.title}!`);
      setTimeout(() => setShareNotification(null), 3000);
    });
  };

  const [recentlyViewed, setRecentlyViewed] = useState<any[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('bakenyi-recently-viewed') || '[]');
    } catch {
      return [];
    }
  });

  const addToRecentlyViewed = (item: any) => {
    setRecentlyViewed(prev => {
      const filtered = prev.filter(r => r.id !== item.id);
      const next = [item, ...filtered].slice(0, 4);
      localStorage.setItem('bakenyi-recently-viewed', JSON.stringify(next));
      return next;
    });
  };

  const [activeJourneyStep, setActiveJourneyStep] = useState(0);

  // Active status modal states
  const [activeStatus, setActiveStatus] = useState<Status | null>(null);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [statusTimer, setStatusTimer] = useState(0);
  const [newComment, setNewComment] = useState('');
  const progressInterval = useRef<any>(null);

  // RSVP Modal states
  const [selectedEventForRsvp, setSelectedEventForRsvp] = useState<Event | null>(null);
  const [rsvpName, setRsvpName] = useState('');
  const [rsvpSuccess, setRsvpSuccess] = useState(false);

  // Stats Counters
  const [counterStats, setCounterStats] = useState({
    stories: 18,
    clans: 6,
    leaders: 5,
    photos: 12,
    videos: 3,
    vocabulary: 45,
    contributors: 9,
    events: 2,
    visitors: 1420
  });

  useEffect(() => {
    async function loadAllContent() {
      try {
        const [
          articlesData,
          contribsData,
          statusesData,
          newsData,
          announcementsData,
          eventsData,
          clansData,
          leadersData,
          vocabData,
          galleryData
        ] = await Promise.all([
          getArticles(true).catch(() => []),
          getContributions().catch(() => []),
          getStatuses(true).catch(() => []),
          getNews(true).catch(() => []),
          getAnnouncements(true).catch(() => []),
          getEvents(true).catch(() => []),
          getClans(true).catch(() => []),
          getLeaders(true).catch(() => []),
          getVocabulary(true).catch(() => []),
          getGalleryImages(false).catch(() => [])
        ]) as [any[], any[], any[], any[], any[], any[], any[], any[], any[], any[]];

        setRecentArticles(articlesData.slice(0, 4));
        
        const approvedStories = contribsData.filter((c: any) => c.status === 'approved');
        setRecentStories(approvedStories.slice(0, 4));

        // Filter out expired statuses in compliance with "Expired statuses should never appear"
        const now = new Date();
        const activeStatuses = statusesData.filter((status: Status) => {
          const notExpired = status.expires_at ? new Date(status.expires_at) > now : true;
          return notExpired && status.status === 'approved' && !status.is_archived;
        });
        setStatuses(activeStatuses);

        setNews(newsData.slice(0, 3));
        setAnnouncements(announcementsData);
        setEvents(eventsData);
        setClans(clansData);
        setLeaders(leadersData);
        setVocabulary(vocabData);
        setGalleryImages(galleryData);

        // Update statistics counter from database lengths
        const uniqueContributors = new Set([
          ...approvedStories.map((c: any) => c.userEmail),
          ...articlesData.map((a: any) => a.author),
          ...newsData.map((n: any) => n.author_id)
        ]);

        setCounterStats({
          stories: approvedStories.length + articlesData.length,
          clans: clansData.length || 12,
          leaders: leadersData.length || 8,
          photos: galleryData.filter((g: any) => g.type === 'photo').length || 24,
          videos: galleryData.filter((g: any) => g.type === 'video').length || 6,
          vocabulary: vocabData.length || 125,
          contributors: uniqueContributors.size || 15,
          events: eventsData.length || 4,
          visitors: 1850
        });

      } catch (err) {
        console.error('Error fetching home content:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAllContent();
  }, []);

  // Status Player loop logic
  useEffect(() => {
    if (activeStatus) {
      setStatusTimer(0);
      const mediaItemsCount = activeStatus.media_items?.length || 0;
      
      progressInterval.current = setInterval(() => {
        setStatusTimer((prev) => {
          if (prev >= 100) {
            if (activeMediaIndex < mediaItemsCount - 1) {
              setActiveMediaIndex(prevIdx => prevIdx + 1);
              return 0;
            } else {
              handleCloseStatus();
              return 100;
            }
          }
          return prev + 1.25; // Loop duration control
        });
      }, 100);

      // Increment view count
      const updatedViews = (activeStatus.view_count || 0) + 1;
      updateStatus(activeStatus.id, { view_count: updatedViews });
    } else {
      if (progressInterval.current) clearInterval(progressInterval.current);
    }

    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, [activeStatus, activeMediaIndex]);

  const handleOpenStatus = (status: Status) => {
    setActiveStatus(status);
    setActiveMediaIndex(0);
    setStatusTimer(0);
  };

  const handleCloseStatus = () => {
    setActiveStatus(null);
    setActiveMediaIndex(0);
    setStatusTimer(0);
    if (progressInterval.current) clearInterval(progressInterval.current);
  };

  const handleAddReaction = async (emoji: string) => {
    if (!activeStatus) return;
    const currentReactions = { ...activeStatus.reactions };
    currentReactions[emoji] = (currentReactions[emoji] || 0) + 1;
    
    setStatuses(prev => prev.map(s => s.id === activeStatus.id ? { ...s, reactions: currentReactions } : s));
    setActiveStatus(prev => prev ? { ...prev, reactions: currentReactions } : null);
    await updateStatus(activeStatus.id, { reactions: currentReactions });
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStatus || !newComment.trim()) return;

    const commentObj = {
      id: Math.random().toString(),
      user_id: 'guest',
      user_email: 'Guest Contributor',
      text: newComment.trim(),
      created_at: new Date().toISOString()
    };

    const currentComments = [...(activeStatus.comments || []), commentObj];

    setStatuses(prev => prev.map(s => s.id === activeStatus.id ? { ...s, comments: currentComments } : s));
    setActiveStatus(prev => prev ? { ...prev, comments: currentComments } : null);
    setNewComment('');
    await updateStatus(activeStatus.id, { comments: currentComments });
  };

  const handleRsvpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventForRsvp || !rsvpName.trim()) return;

    const currentRsvps = selectedEventForRsvp.rsvp_settings?.rsvps || [];
    if (!currentRsvps.includes(rsvpName.trim())) {
      const updatedRsvps = [...currentRsvps, rsvpName.trim()];
      const updatedSettings = { ...selectedEventForRsvp.rsvp_settings, rsvps: updatedRsvps };
      
      setEvents(prev => prev.map(ev => ev.id === selectedEventForRsvp.id ? { ...ev, rsvp_settings: updatedSettings } : ev));
      await updateEvent(selectedEventForRsvp.id, { rsvp_settings: updatedSettings });
    }

    setRsvpSuccess(true);
    setTimeout(() => {
      setRsvpSuccess(false);
      setSelectedEventForRsvp(null);
      setRsvpName('');
    }, 2000);
  };

  // Pinned/Emergency announcement check
  // compliance: "Only one announcement should be pinned at a time."
  const pinnedAnnouncement = useMemo(() => {
    const emergency = announcements.find(a => a.priority === 'emergency' && a.status === 'approved');
    if (emergency) return emergency;
    const pinned = announcements.find(a => a.pinned && a.status === 'approved');
    return pinned || announcements.find(a => a.priority === 'high' && a.status === 'approved') || null;
  }, [announcements]);

  // Unified global search database
  const searchItems = useMemo(() => {
    const items: any[] = [];
    clans.forEach(c => items.push({ id: `clan-${c.id || c.name}`, title: c.name, type: 'Clan', subtitle: c.totem || 'Bakenyi Clan', text: c.desc || c.motto || '', path: `/clans?q=${c.name}` }));
    leaders.forEach(l => items.push({ id: `leader-${l.id || l.name}`, title: l.name, type: 'Leader', subtitle: l.role || 'Elder / Custodian', text: l.bio || l.expertise || '', path: `/leadership?q=${l.name}` }));
    news.forEach(n => items.push({ id: `news-${n.id}`, title: n.title, type: 'News', subtitle: n.category || 'Archive News', text: n.summary || n.content || '', path: `/articles` }));
    events.forEach(e => items.push({ id: `event-${e.id}`, title: e.title, type: 'Event', subtitle: e.location || 'Cultural Gathering', text: e.description || '', path: `/contact` }));
    recentArticles.forEach(a => items.push({ id: `article-${a.id}`, title: a.title, type: 'Article', subtitle: a.category || 'Lore Memoir', text: a.content || '', path: `/articles` }));
    vocabulary.forEach(v => items.push({ id: `vocab-${v.id || v.word}`, title: v.word, type: 'Vocabulary', subtitle: v.translation || 'Lukenye Word', text: `${v.word} means ${v.translation}.`, path: `/language` }));
    announcements.forEach(a => items.push({ id: `ann-${a.id}`, title: a.title, type: 'Announcement', subtitle: a.category || 'Elder Notice', text: a.message || '', path: '/' }));
    return items;
  }, [clans, leaders, news, events, recentArticles, vocabulary, announcements]);

  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const q = searchTerm.toLowerCase().trim();
    return searchItems.filter(item => 
      item.title?.toLowerCase().includes(q) || 
      item.subtitle?.toLowerCase().includes(q) || 
      item.text?.toLowerCase().includes(q)
    ).slice(0, 10);
  }, [searchTerm, searchItems]);

  // Countdown display helper
  const getCountdown = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - new Date().getTime();
    if (diff <= 0) return 'Gathering Underway / Completed';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days} days ${hours} hours remaining`;
    return `${hours}h ${minutes}m remaining`;
  };

  // Curated Featured items
  const featuredItems = useMemo(() => {
    const selectedClan = clans[0] || { name: 'Baise-Mugaya Clan', totem: 'Crested Crane (Nnali)', desc: 'Traditionally serving as the navigators and high canoe crafters of Lake Kyoga, steering communities across the waters.' };
    const selectedLeader = leaders[0] || { name: 'Elder Christopher Kyega', role: 'Chief Historian & Story Keeper (92 years)', bio: 'Possesses direct oral line coordinates of the 17th-century migrations of the Bakenyi riverine communities.' };
    
    return {
      clan: selectedClan,
      leader: selectedLeader,
      food: {
        title: 'Embaata & Smoked Kyoga Catfish',
        desc: 'Traditional lake cuisine salted and slow-smoked on dry papyrus reed mattresses, creating a distinctive deep river aroma.'
      },
      artifact: {
        title: 'The Amato (Traditional Dugout Canoe)',
        desc: 'Hand-carved from a single Musizi tree trunk, shaped to pierce the heavy Kyoga water lilies and propelled by distinctive heart-shaped paddles.'
      },
      oralHistory: {
        title: 'The Legends of the Ebiswa',
        desc: 'Ancient accounts of the floating reed islands of Lake Kyoga which served as temporary mobile settlements during periods of regional migration.'
      }
    };
  }, [clans, leaders]);

  const categoriesList = [
    { name: 'Stories', path: '/articles', icon: BookOpen, desc: 'Approved historical records, narrative memoirs, and transcriptions.', color: 'from-amber-600/10 to-amber-700/5 hover:border-amber-500/40', count: recentArticles.length + recentStories.length },
    { name: 'Clans', path: '/clans', icon: Shield, desc: 'Discover ancestral Bakenyi clans, totems, and lineages.', color: 'from-emerald-600/10 to-emerald-700/5 hover:border-emerald-500/40', count: clans.length || 12 },
    { name: 'Leaders', path: '/leadership', icon: Users, desc: 'Meet the Elder Council members, guardians, and leaders.', color: 'from-blue-600/10 to-blue-700/5 hover:border-blue-500/40', count: leaders.length || 8 },
    { name: 'Gallery', path: '/gallery', icon: ImageIcon, desc: 'Visual archive of landmarks, craft, and historical photos.', color: 'from-purple-600/10 to-purple-700/5 hover:border-purple-500/40', count: galleryImages.length || 24 },
    { name: 'Vocabulary', path: '/language', icon: Volume2, desc: 'Interactive dictionary, pronunciation logs, and dialect charts.', color: 'from-rose-600/10 to-rose-700/5 hover:border-rose-500/40', count: vocabulary.length || 125 },
    { name: 'Traditions', path: '/history', icon: Award, desc: 'Descriptions of river naming ceremonies, craft, and spiritual lore.', color: 'from-amber-600/10 to-amber-700/5 hover:border-amber-500/40', count: 7 },
    { name: 'Music', path: '/gallery', icon: Music, desc: 'Ancestral paddle songs, ritual drumming, and flute recordings.', color: 'from-sky-600/10 to-sky-700/5 hover:border-sky-500/40', count: 4 },
    { name: 'Food', path: '/history', icon: Coffee, desc: 'Gastronomy of the Kyoga basin, including solar smoke cures.', color: 'from-orange-600/10 to-orange-700/5 hover:border-orange-500/40', count: 3 },
    { name: 'Proverbs', path: '/language', icon: Compass, desc: 'Timeless Lukenye proverbs (Kusiga) and cultural moral warnings.', color: 'from-teal-600/10 to-teal-700/5 hover:border-teal-500/40', count: 12 },
    { name: 'Oral Histories', path: '/gallery', icon: Volume2, desc: 'Raw voice testimonies from regional community story keepers.', color: 'from-indigo-600/10 to-indigo-700/5 hover:border-indigo-500/40', count: recentStories.filter(s => s.type === 'audio').length || 4 },
    { name: 'Events', path: '/contact', icon: Calendar, desc: 'Schedule of language learning groups and handcraft circles.', color: 'from-emerald-600/10 to-emerald-700/5 hover:border-emerald-500/40', count: events.length || 2 },
    { name: 'News', path: '/articles', icon: Megaphone, desc: 'Official declarations and press pieces from the Elder Board.', color: 'from-red-600/10 to-red-700/5 hover:border-red-500/40', count: news.length || 3 },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-heritage-cream flex flex-col justify-center items-center py-12 px-4">
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
          className="w-12 h-12 border-4 border-heritage-terracotta border-t-transparent rounded-full mb-4"
        />
        <h3 className="font-serif text-lg text-heritage-brown font-bold tracking-wide">
          Unfolding the Bakenyi Archives...
        </h3>
        <p className="text-xs text-heritage-brown/60 mt-1 font-mono">
          Verifying community seals & oral records
        </p>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden bg-[#faf8f5] dark:bg-stone-950 text-stone-900 dark:text-stone-100 min-h-screen font-sans">
      
      {/* 1. HERO SECTION */}
      <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden bg-stone-950">
        <motion.div 
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.8 }}
          className="absolute inset-0 z-0"
        >
          <img 
            src="https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&q=80&w=2000" 
            alt="Lake Kyoga shoreline background" 
            className="w-full h-full object-cover brightness-[0.3] contrast-[1.05]"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-stone-950/40 to-stone-950" />
          <div className="absolute inset-0 bg-stone-900/10 backdrop-blur-[1px]" />
        </motion.div>

        {/* Global Search Overlay container when focused */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white w-full py-16 flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="w-full max-w-4xl"
          >
            <span className="inline-block px-4 py-1.5 mb-6 rounded-full bg-amber-500/10 border border-amber-500/30 text-heritage-sand text-[10px] tracking-[0.35em] font-black uppercase text-amber-300">
              The Digital Sanctuary of the Bakenyi People
            </span>
            
            <h1 className="text-4xl sm:text-6xl md:text-8xl font-serif font-black mb-8 leading-[1.05] tracking-tight">
              Preserving the <br />
              <span className="text-amber-400 font-serif italic text-shadow-md">Riverine Heritage</span>
            </h1>

            <p className="max-w-2xl mx-auto text-base sm:text-lg md:text-xl text-stone-300 mb-10 font-light leading-relaxed">
              Explore the history, clans, language, and custom oral memories of Uganda's lake dwellers, archived directly from the Elder Council.
            </p>

            {/* Premium Global Search Bar */}
            <div className="relative w-full max-w-2xl mx-auto mb-10 z-30">
              <div className={`flex items-center bg-white dark:bg-stone-900 border ${isSearchFocused ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-stone-200/20'} rounded-2xl shadow-2xl transition-all duration-300 p-1.5 overflow-hidden`}>
                <div className="pl-4 pr-2 text-stone-400">
                  <Search className="w-5 h-5 text-amber-500" />
                </div>
                <input 
                  type="text"
                  placeholder="Search Stories, Clans, Vocabulary, Leaders, Events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  className="flex-grow bg-transparent border-none text-stone-900 dark:text-white px-2 py-3 text-sm focus:outline-none placeholder-stone-500 font-medium"
                />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')}
                    className="p-2 text-stone-400 hover:text-stone-600 rounded-lg mr-1 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <button 
                  onClick={() => navigate(`/search?q=${encodeURIComponent(searchTerm)}`)}
                  className="bg-amber-500 hover:bg-amber-400 text-stone-950 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Search
                </button>
              </div>

              {/* Instant Search Dropdown Results Panel */}
              <AnimatePresence>
                {isSearchFocused && searchTerm.trim() && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setIsSearchFocused(false)} 
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 15 }}
                      className="absolute left-0 right-0 mt-3 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 max-h-[400px] overflow-y-auto text-left z-20 p-4 scrollbar-thin"
                    >
                      <div className="flex justify-between items-center pb-2 mb-3 border-b border-stone-100 dark:border-stone-800">
                        <span className="text-[10px] font-black uppercase tracking-wider text-stone-400">
                          Search Database Results ({searchResults.length})
                        </span>
                        <button 
                          onClick={() => setIsSearchFocused(false)}
                          className="text-stone-400 hover:text-stone-600 text-xs flex items-center gap-1 cursor-pointer"
                        >
                          Close <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {searchResults.length > 0 ? (
                        <div className="space-y-2">
                          {searchResults.map((item) => (
                            <Link
                              key={item.id}
                              to={item.path}
                              onClick={() => setIsSearchFocused(false)}
                              className="block p-3 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800/60 transition-colors border border-transparent hover:border-stone-100 dark:hover:border-stone-800"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                  {item.type}
                                </span>
                                <span className="text-[9px] text-stone-400 font-mono">
                                  {item.subtitle}
                                </span>
                              </div>
                              <h5 className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100 mt-1">
                                {item.title}
                              </h5>
                              <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-1 mt-0.5">
                                {item.text}
                              </p>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <div className="py-8 text-center text-stone-500 dark:text-stone-400">
                          <Compass className="w-8 h-8 mx-auto text-stone-300 mb-2 animate-pulse" />
                          <p className="text-xs font-bold">No exact cultural records found.</p>
                          <p className="text-[10px] text-stone-400 mt-1">Try another search term like "Clan", "Kyoga", "Canoe", or "Language".</p>
                        </div>
                      )}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                to="/history" 
                className="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs uppercase tracking-widest px-10 py-4.5 rounded-2xl flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] shadow-xl cursor-pointer"
              >
                Explore Heritage <Compass className="w-4 h-4" />
              </Link>
              <Link 
                to="/contribute" 
                className="w-full sm:w-auto bg-white/10 hover:bg-white/15 text-white border border-white/20 font-black text-xs uppercase tracking-widest px-10 py-4.5 rounded-2xl transition-all hover:border-white/40 flex items-center justify-center cursor-pointer"
              >
                Submit a Story
              </Link>
              <Link 
                to="/about" 
                className="w-full sm:w-auto text-stone-300 hover:text-white text-xs font-bold uppercase tracking-wider py-3 flex items-center justify-center hover:underline"
              >
                Learn Our Mission &rarr;
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/40 text-[9px] uppercase tracking-[0.25em] flex flex-col items-center gap-2">
          <span>Unveil Archive</span>
          <motion.div 
            animate={{ y: [0, 8, 0] }} 
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="w-1.5 h-1.5 bg-amber-400 rounded-full"
          />
        </div>
      </section>

      {/* 2. HERITAGE STATUS STORIES SECTION */}
      {statuses.length > 0 && (
        <section className="bg-white dark:bg-stone-900 py-10 border-b border-stone-100 dark:border-stone-800 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 text-left">
              <div>
                <span className="text-[9px] font-black uppercase tracking-[0.25em] text-amber-600 dark:text-amber-400 block mb-1">
                  Living Chronicles
                </span>
                <h3 className="font-serif font-black text-xl text-stone-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" /> Live Cultural Status Stories
                </h3>
              </div>
              <span className="text-[10px] font-mono text-stone-400">
                Click bubble to enter the full-screen storyteller stream
              </span>
            </div>

            <div className="flex items-center gap-6 overflow-x-auto pb-4 pt-1 scrollbar-none">
              {statuses.map((status) => {
                const hasMedia = status.media_items && status.media_items.length > 0;
                const previewImage = hasMedia 
                  ? status.media_items[0].url 
                  : 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&q=80&w=150';

                return (
                  <button 
                    key={status.id}
                    onClick={() => handleOpenStatus(status)}
                    className="flex flex-col items-center shrink-0 space-y-2 focus:outline-none group relative cursor-pointer"
                  >
                    {/* Ring Container representing the story ring */}
                    <div className="relative p-1 rounded-full bg-gradient-to-tr from-amber-500 via-orange-500 to-yellow-400 group-hover:scale-105 transition-transform duration-300 shadow-lg">
                      <div className="p-0.5 bg-white dark:bg-stone-900 rounded-full">
                        <img 
                          src={previewImage} 
                          alt="curator avatar" 
                          className="w-16 h-16 rounded-full object-cover filter brightness-95"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      
                      {/* Media Icon Badge */}
                      <span className="absolute bottom-0.5 right-0.5 w-6 h-6 bg-stone-950 text-white rounded-full flex items-center justify-center border-2 border-white dark:border-stone-900 shadow-md">
                        {status.media_items?.[0]?.type === 'audio' ? (
                          <Volume2 className="w-2.5 h-2.5 text-amber-400" />
                        ) : status.media_items?.[0]?.type === 'video' ? (
                          <Video className="w-2.5 h-2.5 text-amber-400" />
                        ) : (
                          <ImageIcon className="w-2.5 h-2.5 text-amber-400" />
                        )}
                      </span>
                    </div>
                    
                    <div className="text-center">
                      <span className="block text-[11px] font-bold text-stone-800 dark:text-stone-200 max-w-[85px] truncate">
                        {status.text || 'Cultural Story'}
                      </span>
                      <span className="block text-[8px] text-stone-400 font-mono mt-0.5">
                        {status.view_count || 0} views • {status.reactions ? (Object.values(status.reactions) as number[]).reduce((a: number, b: number) => a + b, 0) : 0} reacts
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* TODAY IN BAKENYI HERITAGE SECTION */}
      <section className="py-20 bg-[#faf8f5] dark:bg-stone-950 border-b border-stone-200/50 dark:border-stone-800/80 relative text-left">
        {/* Share Notification Toast */}
        <AnimatePresence>
          {shareNotification && (
            <motion.div 
              initial={{ opacity: 0, y: 50, x: "-50%" }}
              animate={{ opacity: 1, y: 0, x: "-50%" }}
              exit={{ opacity: 0, y: 20, x: "-50%" }}
              className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] bg-stone-900 dark:bg-white text-white dark:text-stone-950 px-6 py-3 rounded-full shadow-2xl border border-stone-800 dark:border-stone-100 flex items-center gap-3 text-sm font-bold"
            >
              <Check className="w-4 h-4 text-emerald-500" />
              <span>{shareNotification}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-amber-600 dark:text-amber-400 font-black text-[10px] uppercase tracking-[0.25em] block">
                  Interactive Daily Exhibit
                </span>
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping" />
              </div>
              <h2 className="text-3xl md:text-5xl font-serif font-black text-stone-900 dark:text-white leading-tight">
                Today in Bakenyi Heritage
              </h2>
              <p className="text-sm text-stone-500 dark:text-stone-400 mt-2 max-w-xl">
                A daily rotating showcase of timeless wisdom, ecological innovations, and ancestral records curated by the Elder Council.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-stone-400 bg-stone-100 dark:bg-stone-900/60 border border-stone-200/10 px-4 py-2 rounded-2xl shrink-0 self-start md:self-end">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>Rotates daily at midnight</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Main Daily Spotlight Card (Hero) */}
            <motion.div 
              whileHover={{ y: -4 }}
              transition={{ type: "spring", stiffness: 100 }}
              className="lg:col-span-8 bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800 rounded-[32px] overflow-hidden shadow-sm flex flex-col md:flex-row h-full relative"
            >
              {/* Image side */}
              <div className="md:w-1/2 relative min-h-[250px] md:min-h-full">
                <img 
                  src={dailySpotlight.image} 
                  alt={dailySpotlight.title} 
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-stone-950/75 via-transparent to-transparent md:from-transparent" />
                <span className="absolute top-4 left-4 z-10 px-3.5 py-1.5 bg-amber-500 text-stone-950 text-[9px] font-black uppercase tracking-wider rounded-full shadow-lg">
                  {dailySpotlight.type} of the day
                </span>
              </div>

              {/* Content side */}
              <div className="md:w-1/2 p-8 md:p-10 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-stone-400 font-mono block uppercase tracking-wider mb-2">
                    {dailySpotlight.metadata}
                  </span>
                  <h3 className="text-2xl font-serif font-black text-stone-900 dark:text-white mb-2 leading-snug font-bold">
                    {dailySpotlight.subtitle || dailySpotlight.title}
                  </h3>
                  
                  {dailySpotlight.lukenye && (
                    <p className="text-xs sm:text-sm font-serif italic text-amber-600 dark:text-amber-400 font-medium mb-4 bg-amber-500/5 p-3 rounded-xl border border-amber-500/10">
                      {dailySpotlight.lukenye}
                    </p>
                  )}

                  <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed font-normal">
                    {dailySpotlight.desc}
                  </p>
                </div>

                <div className="pt-8 border-t border-stone-100 dark:border-stone-800/80 mt-8 flex flex-col sm:flex-row gap-3">
                  <Link 
                    to={dailySpotlight.path}
                    onClick={() => addToRecentlyViewed({
                      id: dailySpotlight.id,
                      title: dailySpotlight.subtitle || dailySpotlight.title,
                      path: dailySpotlight.path,
                      type: dailySpotlight.type,
                      image: dailySpotlight.image
                    })}
                    className="flex-grow bg-amber-500 hover:bg-amber-400 text-stone-950 text-center font-black text-xs uppercase tracking-wider px-6 py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-colors cursor-pointer font-bold"
                  >
                    Learn More <ArrowRight className="w-4 h-4" />
                  </Link>

                  <div className="flex gap-2 shrink-0">
                    {/* Share Button */}
                    <button 
                      onClick={() => handleShare(dailySpotlight)}
                      className="p-3.5 bg-stone-50 hover:bg-stone-100 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 rounded-2xl border border-stone-200/10 hover:scale-[1.03] transition-all cursor-pointer"
                      title="Share Exhibit Link"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>

                    {/* Bookmark Button */}
                    <button 
                      onClick={() => toggleBookmark(dailySpotlight.id)}
                      className="p-3.5 bg-stone-50 hover:bg-stone-100 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 rounded-2xl border border-stone-200/10 hover:scale-[1.03] transition-all cursor-pointer"
                      title={bookmarks.includes(dailySpotlight.id) ? "Bookmarked (Click to remove)" : "Save Bookmark"}
                    >
                      <Bookmark className={`w-4 h-4 ${bookmarks.includes(dailySpotlight.id) ? 'fill-amber-500 text-amber-500' : ''}`} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Side Daily Curations (2 smaller cards) */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              {[1, 2].map((offset) => {
                const index = (new Date().getDate() + offset) % dailySpotlights.length;
                const spotlight = dailySpotlights[index];
                return (
                  <motion.div
                    key={offset}
                    whileHover={{ x: 4 }}
                    className="bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800 rounded-3xl p-5 shadow-xs flex items-center gap-4 group"
                  >
                    <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 relative">
                      <img 
                        src={spotlight.image} 
                        alt={spotlight.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex-grow min-w-0">
                      <span className="text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-amber-600 dark:text-amber-400">
                        {spotlight.type}
                      </span>
                      <h4 className="font-serif font-bold text-sm text-stone-900 dark:text-white truncate mt-1.5 font-bold">
                        {spotlight.subtitle || spotlight.title}
                      </h4>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400 line-clamp-2 mt-1 leading-snug">
                        {spotlight.desc}
                      </p>
                      <Link 
                        to={spotlight.path}
                        onClick={() => addToRecentlyViewed({
                          id: spotlight.id,
                          title: spotlight.subtitle || spotlight.title,
                          path: spotlight.path,
                          type: spotlight.type,
                          image: spotlight.image
                        })}
                        className="text-[9px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 hover:underline inline-flex items-center gap-1 mt-2 font-bold"
                      >
                        Explore <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* QUICK STATS STRIP */}
      <section className="bg-stone-950 border-t border-b border-stone-800 relative z-20 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-6 text-center">
            {[
              { label: 'Stories Preserved', value: counterStats.stories, icon: BookOpen },
              { label: 'Ancient Clans', value: counterStats.clans, icon: Shield },
              { label: 'Elders Vouched', value: counterStats.leaders, icon: Users },
              { label: 'Historical Photos', value: counterStats.photos, icon: ImageIcon },
              { label: 'Authentic Videos', value: counterStats.videos, icon: Video },
              { label: 'Vocabulary Logs', value: counterStats.vocabulary, icon: Volume2 },
              { label: 'Active Custodians', value: counterStats.contributors, icon: Globe },
            ].map((stat, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
                className="p-3 bg-stone-900/50 border border-stone-800/60 rounded-2xl text-white hover:border-amber-500/40 transition-colors"
              >
                <div className="flex items-center justify-center gap-2 mb-1.5">
                  <stat.icon className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="text-xl sm:text-2xl font-serif font-black text-amber-400">
                    {stat.value}
                  </span>
                </div>
                <p className="text-[10px] text-stone-400 font-medium uppercase tracking-wider">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. PINNED ANNOUNCEMENT */}
      {pinnedAnnouncement && (
        <section className="bg-amber-500/5 dark:bg-amber-500/2.5 py-8 border-b border-stone-200 dark:border-stone-800/80 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-left">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-amber-50 dark:bg-stone-900/60 border border-amber-500/20 rounded-3xl p-6 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center shrink-0 text-amber-600 dark:text-amber-400">
                  <Megaphone className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className="bg-red-500 text-white text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full flex items-center gap-1">
                      <AlertTriangle className="w-2.5 h-2.5" /> High Priority
                    </span>
                    <span className="bg-amber-100 dark:bg-stone-800 text-amber-800 dark:text-amber-300 text-[8px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <Pin className="w-2.5 h-2.5" /> PINNED DECREE
                    </span>
                    {pinnedAnnouncement.end_date && (
                      <span className="text-[9px] text-stone-400 font-mono">
                        Active till {new Date(pinnedAnnouncement.end_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <h4 className="font-serif font-black text-lg text-stone-900 dark:text-amber-100">
                    {pinnedAnnouncement.title}
                  </h4>
                  <p className="text-sm text-stone-600 dark:text-stone-300 mt-1 max-w-3xl leading-relaxed">
                    {pinnedAnnouncement.message}
                  </p>
                </div>
              </div>
              <Link 
                to="/articles"
                className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-[10px] uppercase tracking-widest px-6 py-3.5 rounded-xl text-center transition-colors shrink-0 cursor-pointer"
              >
                Read More Notices
              </Link>
            </motion.div>
          </div>
        </section>
      )}

      {/* 4. FEATURED HERITAGE (BENTO GRID - NATIONAL GEOGRAPHIC STYLE) */}
      <section className="py-24 bg-stone-50 dark:bg-stone-900/40 border-b border-stone-200/50 dark:border-stone-800 relative text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-16">
            <span className="text-amber-600 dark:text-amber-400 font-black text-[10px] uppercase tracking-[0.25em] block mb-2">
              Curated Museum Exhibits
            </span>
            <h2 className="text-3xl md:text-5xl font-serif font-black text-stone-900 dark:text-white leading-tight">
              Featured Cultural Spotlights
            </h2>
            <p className="text-sm text-stone-500 dark:text-stone-400 mt-2 max-w-xl">
              Immerse yourself in authentic pieces of Bakenyi memory, vetted and presented by our digital keepers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* Box 1: Clan of the Week */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800 rounded-3xl p-8 shadow-sm flex flex-col justify-between h-full relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-amber-500/5 to-transparent rounded-full" />
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <Shield className="w-5 h-5 text-amber-500" />
                  <span className="text-[9px] font-black uppercase tracking-wider text-stone-400">
                    Clan of the Week
                  </span>
                </div>
                <h3 className="font-serif font-bold text-2xl text-stone-900 dark:text-white">
                  {featuredItems.clan.name}
                </h3>
                <div className="mt-2 inline-block px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold rounded-lg font-mono">
                  Totem: {featuredItems.clan.totem}
                </div>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-4 leading-relaxed">
                  {featuredItems.clan.desc}
                </p>
              </div>
              <div className="pt-6 border-t border-stone-100 dark:border-stone-800/80 mt-6 flex justify-between items-center">
                <span className="text-[10px] text-stone-400">Settled around Kyoga basin</span>
                <Link to="/clans" className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 hover:underline flex items-center">
                  Discover Clans <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </motion.div>

            {/* Box 2: Elder Spotlight */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800 rounded-3xl p-8 shadow-sm flex flex-col justify-between h-full relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-emerald-500/5 to-transparent rounded-full" />
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <Award className="w-5 h-5 text-emerald-500" />
                  <span className="text-[9px] font-black uppercase tracking-wider text-stone-400">
                    Elder Spotlight
                  </span>
                </div>
                <h3 className="font-serif font-bold text-2xl text-stone-900 dark:text-white">
                  {featuredItems.leader.name}
                </h3>
                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 mt-1 block">
                  {featuredItems.leader.role}
                </span>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-4 leading-relaxed">
                  {featuredItems.leader.bio}
                </p>
              </div>
              <div className="pt-6 border-t border-stone-100 dark:border-stone-800/80 mt-6 flex justify-between items-center">
                <span className="text-[10px] text-stone-400">Active Council Member</span>
                <Link to="/leadership" className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 hover:underline flex items-center">
                  Meet Elders <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </motion.div>

            {/* Box 3: Traditional Food */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800 rounded-3xl p-8 shadow-sm flex flex-col justify-between h-full relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-orange-500/5 to-transparent rounded-full" />
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <Coffee className="w-5 h-5 text-orange-500" />
                  <span className="text-[9px] font-black uppercase tracking-wider text-stone-400">
                    Gastronomy & Diet
                  </span>
                </div>
                <h3 className="font-serif font-bold text-2xl text-stone-900 dark:text-white">
                  {featuredItems.food.title}
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-4 leading-relaxed">
                  {featuredItems.food.desc}
                </p>
              </div>
              <div className="pt-6 border-t border-stone-100 dark:border-stone-800/80 mt-6 flex justify-between items-center">
                <span className="text-[10px] text-stone-400">Kyoga Basin Cuisine</span>
                <Link to="/history" className="text-[10px] font-black uppercase tracking-widest text-orange-600 dark:text-orange-400 hover:underline flex items-center">
                  Read History <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </motion.div>

            {/* Box 4: Cultural Artifact */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800 rounded-3xl p-8 shadow-sm flex flex-col justify-between h-full lg:col-span-2 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-500/5 to-transparent rounded-full" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Compass className="w-5 h-5 text-amber-500" />
                    <span className="text-[9px] font-black uppercase tracking-wider text-stone-400">
                      Ancestral Artifacts
                    </span>
                  </div>
                  <h3 className="font-serif font-bold text-2xl text-stone-900 dark:text-white">
                    {featuredItems.artifact.title}
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-3 leading-relaxed">
                    {featuredItems.artifact.desc}
                  </p>
                </div>
                <div className="relative h-44 rounded-2xl overflow-hidden border border-stone-100 dark:border-stone-800">
                  <img 
                    src="https://images.unsplash.com/photo-1523805009345-7448845a9e53?auto=format&fit=crop&q=80&w=600" 
                    alt="Dugout canoe visual representative" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-stone-900/10" />
                </div>
              </div>
              <div className="pt-6 border-t border-stone-100 dark:border-stone-800/80 mt-6 flex justify-between items-center">
                <span className="text-[10px] text-stone-400">Lake Navigation Tech</span>
                <Link to="/gallery" className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 hover:underline flex items-center">
                  Examine Gallery <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </motion.div>

            {/* Box 5: Oral Legend */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800 rounded-3xl p-8 shadow-sm flex flex-col justify-between h-full relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-rose-500/5 to-transparent rounded-full" />
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <Volume2 className="w-5 h-5 text-rose-500" />
                  <span className="text-[9px] font-black uppercase tracking-wider text-stone-400">
                    Oral Legend
                  </span>
                </div>
                <h3 className="font-serif font-bold text-xl text-stone-900 dark:text-white line-clamp-1">
                  {featuredItems.oralHistory.title}
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-4 leading-relaxed line-clamp-4">
                  {featuredItems.oralHistory.desc}
                </p>
              </div>
              <div className="pt-6 border-t border-stone-100 dark:border-stone-800/80 mt-6 flex justify-between items-center">
                <span className="text-[10px] text-stone-400">Floating worlds of Kyoga</span>
                <Link to="/articles" className="text-[10px] font-black uppercase tracking-widest text-rose-600 dark:text-rose-400 hover:underline flex items-center">
                  Read Memoirs <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* 5. JOURNEY THROUGH BAKENYI HERITAGE ROADMAP */}
      <section className="py-24 bg-white dark:bg-stone-950 border-b border-stone-100 dark:border-stone-800/80 relative text-left overflow-hidden">
        {/* Background Decorative Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="mb-16">
            <span className="text-amber-600 dark:text-amber-400 font-black text-[10px] uppercase tracking-[0.25em] block mb-2">
              Guided Interactive Roadmap
            </span>
            <h2 className="text-3xl md:text-5xl font-serif font-black text-stone-900 dark:text-white leading-tight">
              Journey Through Bakenyi Heritage
            </h2>
            <p className="text-sm text-stone-500 dark:text-stone-400 mt-2 max-w-xl">
              An immersive digital voyage designed to guide visitors, students, and family historians through the archives step-by-step.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Interactive Stage (Left Side) */}
            <div className="lg:col-span-6 xl:col-span-7 h-full">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeJourneyStep}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="bg-stone-50 dark:bg-stone-900/40 border border-stone-200/50 dark:border-stone-800/60 rounded-[32px] overflow-hidden p-6 sm:p-10 flex flex-col justify-between min-h-[540px] shadow-sm relative group"
                >
                  {/* Decorative Big Number */}
                  <span className="absolute top-6 right-8 text-9xl font-mono font-black text-stone-200/40 dark:text-stone-800/20 pointer-events-none select-none z-0">
                    0{journeySteps[activeJourneyStep].stepNumber}
                  </span>

                  <div className="relative z-10">
                    <span className="text-[10px] font-mono uppercase tracking-[0.2em] bg-amber-500/10 dark:bg-amber-500/5 text-amber-600 dark:text-amber-400 px-3.5 py-1.5 rounded-full font-bold">
                      Milestone 0{journeySteps[activeJourneyStep].stepNumber} of 08
                    </span>

                    <h3 className="text-2xl sm:text-3.5xl font-serif font-black text-stone-900 dark:text-white mt-6 mb-4 font-bold">
                      {journeySteps[activeJourneyStep].title}
                    </h3>

                    {/* Step Visual Card */}
                    <div className="w-full h-56 rounded-2xl overflow-hidden relative mb-6 shadow-xs">
                      <img 
                        src={journeySteps[activeJourneyStep].image} 
                        alt={journeySteps[activeJourneyStep].title}
                        className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-700"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-950/20 to-transparent" />
                      <div className="absolute bottom-4 left-4 flex items-center gap-2">
                        {React.createElement(getJourneyIcon(journeySteps[activeJourneyStep].iconName), {
                          className: "w-5 h-5 text-amber-400 shrink-0"
                        })}
                        <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                          {journeySteps[activeJourneyStep].stat}
                        </span>
                      </div>
                    </div>

                    <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed max-w-xl font-normal">
                      {journeySteps[activeJourneyStep].desc}
                    </p>
                  </div>

                  <div className="pt-8 border-t border-stone-200/40 dark:border-stone-800/80 mt-8 relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <span className="text-xs text-stone-400 dark:text-stone-500 flex items-center gap-1.5">
                      <Info className="w-4 h-4 text-amber-500 shrink-0" />
                      Status: Verified by Elder Council
                    </span>
                    <Link
                      to={journeySteps[activeJourneyStep].path}
                      onClick={() => addToRecentlyViewed({
                        id: `journey-${journeySteps[activeJourneyStep].stepNumber}`,
                        title: journeySteps[activeJourneyStep].title,
                        path: journeySteps[activeJourneyStep].path,
                        type: 'Milestone',
                        image: journeySteps[activeJourneyStep].image
                      })}
                      className="w-full sm:w-auto bg-stone-900 hover:bg-stone-800 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-stone-950 font-black text-xs uppercase tracking-widest px-8 py-4 rounded-2xl flex items-center justify-center gap-2 transition-colors cursor-pointer font-bold shrink-0 shadow-lg"
                    >
                      Embark on Step &rarr;
                    </Link>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Interactive Milestones Timeline List (Right Side) */}
            <div className="lg:col-span-6 xl:col-span-5 relative flex flex-col h-full">
              {/* Vertical SVG connection line */}
              <div className="absolute left-7 top-6 bottom-6 w-0.5 border-l-2 border-dashed border-stone-200 dark:border-stone-800 hidden sm:block z-0 pointer-events-none" />

              <div className="space-y-4 relative z-10">
                {journeySteps.map((step, idx) => {
                  const isActive = activeJourneyStep === idx;
                  return (
                    <motion.button
                      key={step.stepNumber}
                      onClick={() => setActiveJourneyStep(idx)}
                      whileHover={{ scale: 1.01 }}
                      className={`w-full text-left p-4 rounded-2xl border transition-all flex items-start gap-4 cursor-pointer relative overflow-hidden ${
                        isActive 
                          ? 'bg-amber-50/50 dark:bg-amber-500/5 border-amber-500/40 dark:border-amber-500/20 shadow-xs' 
                          : 'bg-white dark:bg-stone-900 border-stone-100 dark:border-stone-800/80 hover:border-stone-200 dark:hover:border-stone-700/60'
                      }`}
                    >
                      {/* Active glow background */}
                      {isActive && (
                        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-transparent pointer-events-none" />
                      )}

                      {/* Timeline Dot Indicator */}
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-[10px] font-black shrink-0 border relative z-10 ${
                        isActive
                          ? 'bg-amber-500 text-stone-950 border-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                          : 'bg-stone-50 dark:bg-stone-800 text-stone-500 border-stone-200 dark:border-stone-700'
                      }`}>
                        {step.stepNumber}
                      </div>

                      <div className="flex-grow min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className={`font-serif font-bold text-sm truncate font-bold ${
                            isActive ? 'text-amber-700 dark:text-amber-400' : 'text-stone-800 dark:text-stone-200'
                          }`}>
                            {step.title}
                          </h4>
                          <span className={`text-[9px] font-mono uppercase font-black px-2 py-0.5 rounded ${
                            isActive 
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' 
                              : 'bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-500'
                          }`}>
                            {step.iconName === 'PenTool' ? 'Contribute' : 'Archive'}
                          </span>
                        </div>
                        <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-1 mt-1 leading-snug">
                          {step.desc}
                        </p>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. LATEST NEWS & PRESS RELEASES */}
      {news.length > 0 && (
        <section className="py-24 bg-stone-50 dark:bg-stone-900/20 border-t border-b border-stone-200/50 dark:border-stone-800/80 relative text-left">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-16 gap-4">
              <div>
                <span className="text-amber-600 dark:text-amber-400 font-black text-[10px] uppercase tracking-[0.25em] block mb-2">
                  Official Chronicles
                </span>
                <h2 className="text-3xl md:text-5xl font-serif font-black text-stone-900 dark:text-white">
                  Latest News & Press Releases
                </h2>
                <p className="text-sm text-stone-500 dark:text-stone-400 mt-2 max-w-xl">
                  Stay updated with official declarations, historical research progress, and conservation efforts from the board.
                </p>
              </div>
              <Link 
                to="/articles" 
                className="text-amber-600 dark:text-amber-400 font-black text-xs uppercase tracking-widest flex items-center hover:underline whitespace-nowrap group shrink-0"
              >
                View All News <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {news.map((item) => (
                <motion.article 
                  key={item.id}
                  whileHover={{ y: -4 }}
                  className="bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800 rounded-3xl p-6 shadow-xs hover:shadow-md transition-all flex flex-col h-full justify-between text-left"
                >
                  <div className="space-y-4">
                    {item.cover_image ? (
                      <div className="h-48 rounded-2xl overflow-hidden border border-stone-100 dark:border-stone-800">
                        <img 
                          src={item.cover_image} 
                          alt={item.title} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ) : (
                      <div className="h-48 rounded-2xl bg-amber-500/5 dark:bg-stone-800 flex items-center justify-center border border-dashed border-stone-200 dark:border-stone-700">
                        <Megaphone className="w-8 h-8 text-amber-500" />
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-stone-400">
                      <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2.5 py-0.5 rounded-full">
                        {item.category}
                      </span>
                      <span>
                        {new Date(item.published_at || item.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-white leading-snug line-clamp-2">
                      {item.title}
                    </h3>

                    <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed line-clamp-3">
                      {item.summary}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-stone-100 dark:border-stone-800 mt-6 flex items-center justify-between text-xs font-medium">
                    <span className="text-stone-400 font-mono">
                      By Elder Reporter
                    </span>
                    <span className="text-[10px] text-stone-400 bg-stone-50 dark:bg-stone-800 px-2 py-0.5 rounded">
                      5 min read
                    </span>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 7. UPCOMING EVENTS WITH LIVE COUNTDOWNS */}
      {events.length > 0 && (
        <section className="py-24 bg-white dark:bg-stone-950 relative text-left border-b border-stone-200/50 dark:border-stone-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-16">
              <span className="text-amber-600 dark:text-amber-400 font-black text-[10px] uppercase tracking-[0.25em] block mb-2">
                Communal Timelines
              </span>
              <h2 className="text-3xl md:text-5xl font-serif font-black text-stone-900 dark:text-white leading-tight">
                Upcoming Cultural Gatherings
              </h2>
              <p className="text-sm text-stone-500 dark:text-stone-400 mt-2 max-w-xl">
                Attend Elder summits, handcraft canoe lessons, and dialect learning groups arranged by the heritage board.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {events.map((event) => (
                <motion.div 
                  key={event.id}
                  whileHover={{ y: -4 }}
                  className="bg-stone-50 dark:bg-stone-900/40 border border-stone-200/60 dark:border-stone-800 rounded-3xl p-6 flex flex-col justify-between h-full"
                >
                  <div className="space-y-4">
                    {event.cover_image && (
                      <div className="h-44 rounded-2xl overflow-hidden border border-stone-100 dark:border-stone-800">
                        <img 
                          src={event.cover_image} 
                          alt={event.title} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center">
                      <span className="inline-block bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[8px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full">
                        Elder Vetted Gathering
                      </span>
                      <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 font-mono bg-amber-500/10 px-2 py-0.5 rounded">
                        {getCountdown(event.start_datetime)}
                      </span>
                    </div>

                    <h4 className="font-serif font-bold text-lg text-stone-900 dark:text-white leading-snug">
                      {event.title}
                    </h4>

                    <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed line-clamp-3">
                      {event.description}
                    </p>

                    <div className="space-y-2 pt-4 border-t border-stone-200/60 dark:border-stone-800/80 text-xs text-stone-600 dark:text-stone-400 font-medium">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-amber-500" />
                        <span>{new Date(event.start_datetime).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-emerald-500" />
                        <span>{event.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-stone-400">
                        <Users className="w-3.5 h-3.5" />
                        <span>Convener: <strong className="text-stone-700 dark:text-stone-300">{event.organizer}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-stone-200/60 dark:border-stone-800/80 mt-6 flex items-center justify-between">
                    <span className="text-[10px] text-stone-400 font-mono">
                      {event.rsvp_settings?.rsvps?.length || 0} RSVPs Registered
                    </span>
                    
                    <button 
                      onClick={() => setSelectedEventForRsvp(event)}
                      className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-[10px] uppercase font-black tracking-widest cursor-pointer transition-colors"
                    >
                      RSVP NOW
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 8. RECENTLY APPROVED CONTRIBUTIONS */}
      <section className="py-24 bg-stone-50 dark:bg-stone-900/20 relative text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-16">
            <span className="text-amber-600 dark:text-amber-400 font-black text-[10px] uppercase tracking-[0.25em] block mb-2">
              Community Contributions
            </span>
            <h2 className="text-3xl md:text-5xl font-serif font-black text-stone-900 dark:text-white leading-tight">
              Recently Vouched Contributions
            </h2>
            <p className="text-sm text-stone-500 dark:text-stone-400 mt-2 max-w-xl">
              These digital historical records have been submitted by community members and approved by the Elder Council.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {recentStories.map((story) => (
              <motion.div 
                key={story.id}
                whileHover={{ y: -3 }}
                className="bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800 rounded-3xl p-5 shadow-xs flex flex-col h-full justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-wider text-stone-400">
                    <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded">
                      {story.type.toUpperCase()}
                    </span>
                    <span>
                      {new Date(story.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {story.imageUrl && (
                    <div className="h-32 rounded-xl overflow-hidden border border-stone-100 dark:border-stone-800">
                      <img 
                        src={story.imageUrl} 
                        alt={story.title} 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}

                  <h4 className="font-serif font-bold text-sm text-stone-900 dark:text-white line-clamp-1">
                    {story.title}
                  </h4>

                  <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed line-clamp-3">
                    {story.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-stone-100 dark:border-stone-800 mt-4 flex items-center justify-between">
                  <span className="text-[10px] text-stone-400">
                    By <strong className="text-stone-700 dark:text-stone-300 truncate max-w-[80px] inline-block align-bottom">{story.userEmail ? story.userEmail.split('@')[0] : 'Custodian'}</strong>
                  </span>
                  <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded flex items-center gap-1">
                    <Check className="w-3 h-3" /> Vouched
                  </span>
                </div>
              </motion.div>
            ))}

            {recentStories.length === 0 && (
              <div className="col-span-4 text-center py-16 bg-white/40 dark:bg-stone-900/20 rounded-3xl border border-dashed border-stone-200 dark:border-stone-800 space-y-2">
                <Compass className="w-8 h-8 text-stone-300 mx-auto" />
                <p className="text-xs text-stone-500 dark:text-stone-400 font-bold">Chronicles in Transcription...</p>
                <p className="text-[10px] text-stone-400">Elders are currently auditing newly submitted community documents.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 8. VISITOR ENGAGEMENT (RECENTLY VIEWED & EDITOR'S PICKS) */}
      <section className="py-20 bg-stone-50 dark:bg-stone-900/10 border-t border-b border-stone-100 dark:border-stone-800/60 relative text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {recentlyViewed.length > 0 && (
            <div className="mb-16">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <span className="text-amber-600 dark:text-amber-400 font-black text-[10px] uppercase tracking-[0.25em] block mb-1">
                    Your Personal Logbook
                  </span>
                  <h3 className="text-2xl font-serif font-black text-stone-900 dark:text-white flex items-center gap-2">
                    <Clock className="w-5 h-5 text-amber-500" /> Continue Your Voyage
                  </h3>
                </div>
                <button 
                  onClick={() => {
                    localStorage.removeItem('bakenyi-recently-viewed');
                    setRecentlyViewed([]);
                  }}
                  className="text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:underline cursor-pointer"
                >
                  Clear Log
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {recentlyViewed.map((item, idx) => (
                  <motion.div
                    key={item.id}
                    whileHover={{ y: -3 }}
                    className="bg-white dark:bg-stone-900/60 border border-stone-200/50 dark:border-stone-800 rounded-2xl overflow-hidden p-4 flex gap-4 items-center group shadow-2xs"
                  >
                    <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 relative bg-stone-100">
                      <img 
                        src={item.image} 
                        alt={item.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="min-w-0 flex-grow">
                      <span className="text-[8px] font-mono font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">
                        {item.type}
                      </span>
                      <h4 className="font-serif font-bold text-xs text-stone-900 dark:text-white truncate mt-0.5 font-bold">
                        {item.title}
                      </h4>
                      <Link 
                        to={item.path}
                        className="text-[9px] font-black uppercase text-amber-600 dark:text-amber-400 hover:underline inline-flex items-center gap-0.5 mt-1 font-bold"
                      >
                        Resume &rarr;
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Curated Curator's / Editor's Picks */}
          <div>
            <div className="mb-10">
              <span className="text-amber-600 dark:text-amber-400 font-black text-[10px] uppercase tracking-[0.25em] block mb-1">
                Curator's Highlights
              </span>
              <h3 className="text-2xl md:text-3xl font-serif font-black text-stone-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5.5 h-5.5 text-amber-500" /> Editor's Recommended Exhibits
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-lg leading-relaxed">
                Highly recommended historical entries chosen by our archiving librarians to deepen your cultural understanding.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  id: 'pick-1',
                  title: 'Architecture of Floating Reed Houses',
                  desc: 'Discover the ancient structural science behind homes that float directly on top of deep-water silt layers.',
                  image: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&q=80&w=400',
                  path: '/history',
                  tag: 'History'
                },
                {
                  id: 'pick-2',
                  title: 'Lineage of the founding Water Clans',
                  desc: 'Understand the traditional boundaries, canoe emblems, and sacred totems of the founding Bakenyi clans.',
                  image: 'https://images.unsplash.com/photo-1501535033-a593e6afb94d?auto=format&fit=crop&q=80&w=400',
                  path: '/clans',
                  tag: 'Ancestry'
                },
                {
                  id: 'pick-3',
                  title: 'Historic Paddling Songs Archive',
                  desc: 'Listen to restored field recordings of rowing rhythms used to synchronize high-speed canoe navigation.',
                  image: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&q=80&w=400',
                  path: '/gallery',
                  tag: 'Acoustics'
                },
                {
                  id: 'pick-4',
                  title: 'Interactive Dialect Pronunciations',
                  desc: 'Explore our curated audio dictionary preserving the unique marine terminology of native Lukenye speech.',
                  image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&q=80&w=400',
                  path: '/language',
                  tag: 'Linguistics'
                }
              ].map((pick) => (
                <motion.div
                  key={pick.id}
                  whileHover={{ y: -4 }}
                  className="bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800 rounded-3xl overflow-hidden p-4 flex flex-col justify-between h-full group shadow-xs"
                >
                  <div>
                    <div className="h-32 rounded-2xl overflow-hidden relative mb-4">
                      <img 
                        src={pick.image} 
                        alt={pick.title} 
                        className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute top-3 left-3 bg-stone-950/80 backdrop-blur-xs text-amber-400 font-mono text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                        {pick.tag}
                      </span>
                    </div>
                    <h4 className="font-serif font-bold text-sm text-stone-900 dark:text-white leading-snug line-clamp-2 font-bold">
                      {pick.title}
                    </h4>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed mt-2 line-clamp-3">
                      {pick.desc}
                    </p>
                  </div>
                  <div className="pt-4 border-t border-stone-100 dark:border-stone-800/80 mt-4 text-right">
                    <Link
                      to={pick.path}
                      onClick={() => addToRecentlyViewed({
                        id: pick.id,
                        title: pick.title,
                        path: pick.path,
                        type: 'Recommendation',
                        image: pick.image
                      })}
                      className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 hover:underline inline-flex items-center gap-1 font-bold"
                    >
                      Enter Exhibit &rarr;
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 9. ANCESTRAL GARRISON QUOTE */}
      <section className="py-24 bg-stone-950 relative overflow-hidden text-center text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 relative z-10">
          <span className="text-6xl font-serif text-amber-500/40 block mb-4">"</span>
          <p className="text-2xl md:text-3xl font-serif italic mb-8 leading-relaxed text-stone-200">
            "A people without the knowledge of their past history, origin and culture is like a tree without roots."
          </p>
          <div className="w-12 h-px bg-amber-500/50 mx-auto mb-4" />
          <p className="text-amber-400 font-black tracking-widest uppercase text-xs">Marcus Garvey</p>
        </div>
      </section>

      {/* 10. CALL TO ACTION (CONTRIBUTION DRIVE) */}
      <section className="py-24 bg-[#1c1917] text-white relative text-left">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-amber-500/5 via-stone-900 to-stone-950 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-amber-400 font-black text-[10px] uppercase tracking-[0.25em] block mb-3">
                Join the Custodian Ranks
              </span>
              <h2 className="text-3xl sm:text-5xl font-serif font-black mb-6 leading-tight">
                Help Preserve the History of the Bakenyi People
              </h2>
              <p className="text-stone-300 text-sm sm:text-base leading-relaxed mb-8">
                Your ancestral memories, family lineages, traditional song recordings, and historic photographs are crucial to the survival of the Lukenye culture. Become a verified archive contributor today.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <span className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-sm shrink-0 border border-amber-500/20">
                    1
                  </span>
                  <div>
                    <h5 className="font-bold text-sm text-stone-100">Submit Oral Tracks</h5>
                    <p className="text-xs text-stone-400 mt-1">Upload voice memoirs or ancestral storytelling recordings.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-sm shrink-0 border border-amber-500/20">
                    2
                  </span>
                  <div>
                    <h5 className="font-bold text-sm text-stone-100">Register Clan Lineage</h5>
                    <p className="text-xs text-stone-400 mt-1">Ensure your family totem and migration history is documented.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-stone-900/80 border border-stone-800 rounded-3xl p-8 shadow-2xl space-y-6">
              <h4 className="font-serif font-bold text-xl text-stone-100">
                Initiate a Submission
              </h4>
              <p className="text-xs text-stone-400">
                Choose a contribution channel to launch our simplified elder approval wizard.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link 
                  to="/contribute" 
                  className="p-4 rounded-2xl bg-stone-950 border border-stone-800 hover:border-amber-500/50 transition-colors block text-left"
                >
                  <BookOpen className="w-5 h-5 text-amber-500 mb-2" />
                  <h5 className="font-bold text-xs text-stone-100">Submit Story</h5>
                  <p className="text-[10px] text-stone-400 mt-1">Write historical logs or transcription drafts.</p>
                </Link>
                <Link 
                  to="/contribute" 
                  className="p-4 rounded-2xl bg-stone-950 border border-stone-800 hover:border-amber-500/50 transition-colors block text-left"
                >
                  <ImageIcon className="w-5 h-5 text-emerald-500 mb-2" />
                  <h5 className="font-bold text-xs text-stone-100">Upload Photos</h5>
                  <p className="text-[10px] text-stone-400 mt-1">Publish pictures of family landmarks or craft.</p>
                </Link>
                <Link 
                  to="/contribute" 
                  className="p-4 rounded-2xl bg-stone-950 border border-stone-800 hover:border-amber-500/50 transition-colors block text-left"
                >
                  <Volume2 className="w-5 h-5 text-rose-500 mb-2" />
                  <h5 className="font-bold text-xs text-stone-100">Share Oral History</h5>
                  <p className="text-[10px] text-stone-400 mt-1">Record and stream native audio memories.</p>
                </Link>
                <Link 
                  to="/contribute" 
                  className="p-4 rounded-2xl bg-amber-500 text-stone-950 hover:bg-amber-400 transition-colors block text-left"
                >
                  <Users className="w-5 h-5 text-stone-950 mb-2" />
                  <h5 className="font-black text-xs">Become Contributor</h5>
                  <p className="text-[10px] text-stone-950/80 mt-1">Access full publishing capabilities.</p>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          ACTIVE STATUS PLAYER POPUP MODAL (IMMERSIVE EXPERIENCE)
          ========================================================================= */}
      <AnimatePresence>
        {activeStatus && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-stone-950/98 z-50 flex items-center justify-center p-4 backdrop-blur-lg text-left"
          >
            <div className="w-full max-w-lg bg-stone-900 rounded-3xl overflow-hidden relative border border-stone-800 flex flex-col h-[90vh] md:h-[80vh]">
              
              {/* Media Element (Top / Fill) */}
              <div className="relative flex-grow flex items-center justify-center bg-black overflow-hidden group">
                
                {/* Story indicators */}
                <div className="absolute top-4 inset-x-4 flex gap-1.5 z-30">
                  {activeStatus.media_items?.map((item, idx) => (
                    <div key={idx} className="h-1 bg-stone-700 rounded-full flex-grow overflow-hidden">
                      <div 
                        className="h-full bg-amber-400 transition-all duration-100 ease-linear"
                        style={{ 
                          width: idx < activeMediaIndex 
                            ? '100%' 
                            : idx === activeMediaIndex 
                              ? `${statusTimer}%` 
                              : '0%' 
                        }}
                      />
                    </div>
                  ))}
                </div>

                {/* Header Information */}
                <div className="absolute top-8 inset-x-4 z-30 flex items-center justify-between text-white bg-gradient-to-b from-black/60 to-transparent p-2 rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                    <div>
                      <h4 className="font-bold text-xs">Bakenyi Archival Curator</h4>
                      <div className="flex items-center gap-1.5 text-[9px] text-stone-400">
                        <Clock className="w-3 h-3" />
                        <span>Vetted Live Story</span>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={handleCloseStatus}
                    className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Main slide display */}
                {activeStatus.media_items && activeStatus.media_items.length > 0 ? (
                  <div className="w-full h-full relative">
                    {activeStatus.media_items[activeMediaIndex].type === 'image' && (
                      <img 
                        src={activeStatus.media_items[activeMediaIndex].url} 
                        alt="story content" 
                        className="w-full h-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    )}
                    
                    {activeStatus.media_items[activeMediaIndex].type === 'audio' && (
                      <div className="w-full h-full flex flex-col items-center justify-center p-8 space-y-4">
                        <div className="w-20 h-20 bg-amber-400/10 border border-amber-400/30 rounded-full flex items-center justify-center animate-pulse">
                          <Volume2 className="w-10 h-10 text-amber-400" />
                        </div>
                        <p className="text-zinc-300 font-serif italic text-center max-w-xs text-sm">
                          "{activeStatus.text}"
                        </p>
                        <audio 
                          src={activeStatus.media_items[activeMediaIndex].url} 
                          autoPlay 
                          controls 
                          className="w-full max-w-xs h-8 bg-zinc-900 border border-zinc-800 rounded-lg text-xs mt-4" 
                        />
                      </div>
                    )}

                    {activeStatus.media_items[activeMediaIndex].type === 'video' && (
                      <video 
                        src={activeStatus.media_items[activeMediaIndex].url} 
                        autoPlay 
                        controls 
                        className="w-full h-full object-contain"
                      />
                    )}
                  </div>
                ) : (
                  <div className="p-8 text-center text-zinc-300">
                    <p className="font-serif italic text-lg">"{activeStatus.text}"</p>
                  </div>
                )}

                {/* Subtext overlay if image */}
                {activeStatus.media_items?.[activeMediaIndex]?.type === 'image' && activeStatus.text && (
                  <div className="absolute bottom-6 inset-x-6 p-4 rounded-2xl bg-black/75 backdrop-blur-md border border-white/10 text-white text-xs text-center">
                    "{activeStatus.text}"
                  </div>
                )}
              </div>

              {/* Status Interaction Panel (Bottom / Half) */}
              <div className="bg-stone-950 p-5 border-t border-stone-800 flex flex-col justify-between h-[230px]">
                {/* Reactions */}
                <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                  <div className="flex items-center gap-2">
                    {['👍', '❤️', '🔥', '🙌'].map((emoji) => (
                      <button 
                        key={emoji}
                        onClick={() => handleAddReaction(emoji)}
                        className="px-3 py-1.5 rounded-full bg-stone-800 hover:bg-stone-700 text-xs flex items-center gap-1.5 text-white cursor-pointer transition-colors"
                      >
                        <span>{emoji}</span>
                        <span className="font-mono text-[10px] text-stone-400">
                          {activeStatus.reactions?.[emoji] || 0}
                        </span>
                      </button>
                    ))}
                  </div>

                  <span className="text-[10px] text-stone-500 font-mono">
                    {activeStatus.view_count || 0} views
                  </span>
                </div>

                {/* Live Comments scrolling log */}
                <div className="flex-grow overflow-y-auto space-y-1.5 py-2 scrollbar-none max-h-[80px]">
                  {activeStatus.comments?.map((comment) => (
                    <div key={comment.id} className="text-[11px] text-zinc-300 bg-stone-900 p-2 rounded-xl flex items-start gap-1">
                      <strong className="text-amber-400 mr-1 text-[10px] shrink-0 font-mono">Guest:</strong>
                      <span>{comment.text}</span>
                    </div>
                  ))}
                  {(!activeStatus.comments || activeStatus.comments.length === 0) && (
                    <div className="text-[10px] text-stone-500 italic">
                      No ancestral thoughts shared yet. Be the first to leave a thought.
                    </div>
                  )}
                </div>

                {/* Add thought form */}
                <form onSubmit={handleAddComment} className="flex gap-2 pt-2">
                  <input 
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Contribute your thought..."
                    className="flex-grow bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                  <button 
                    type="submit"
                    className="bg-amber-500 hover:bg-amber-400 text-stone-950 px-4 py-2 rounded-xl text-[10px] font-bold uppercase transition-colors cursor-pointer"
                  >
                    Send
                  </button>
                </form>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =========================================================================
          EVENT RSVP MODAL DIALOG
          ========================================================================= */}
      <AnimatePresence>
        {selectedEventForRsvp && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-xs text-left"
          >
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="w-full max-w-md bg-white dark:bg-stone-900 rounded-3xl p-8 shadow-2xl relative border border-stone-200 dark:border-stone-800"
            >
              <button 
                onClick={() => setSelectedEventForRsvp(null)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 dark:text-stone-400 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="font-serif font-black text-2xl text-stone-900 dark:text-white mb-2">
                Register for Gathering
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mb-6 leading-relaxed">
                You are RSVPing to: <strong className="text-amber-600 dark:text-amber-400">{selectedEventForRsvp.title}</strong>
              </p>

              {rsvpSuccess ? (
                <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-400 p-4 rounded-2xl flex items-center gap-3">
                  <Check className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span className="text-xs font-bold">Successfully Registered! Your seat is secured.</span>
                </div>
              ) : (
                <form onSubmit={handleRsvpSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-stone-400">
                      Your Full Name
                    </label>
                    <input 
                      type="text"
                      required
                      value={rsvpName}
                      onChange={(e) => setRsvpName(e.target.value)}
                      placeholder="e.g., Elder Daniel Mukasa"
                      className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-amber-500 text-stone-900 dark:text-white font-medium"
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs uppercase tracking-widest py-3.5 rounded-xl transition-colors cursor-pointer"
                  >
                    Confirm RSVP
                  </button>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
