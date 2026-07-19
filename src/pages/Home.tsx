import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { X, Check, Volume2, Clock } from 'lucide-react';

import { 
  getArticles, 
  getContributions, 
  getClans, 
  getLeaders, 
  getVocabulary, 
  getGalleryImages 
} from '../lib/supabase';
import { 
  getStatuses, 
  getNews, 
  getAnnouncements, 
  getEvents, 
  updateStatus, 
  updateEvent 
} from '../lib/heritageService';
import { Status, News, Announcement, Event } from '../types/heritage';
import { dailySpotlights } from '../data/dailyHeritage';
import SEO from '../components/SEO';
import { Modal, Button, Input } from '../components/ui';

// Modular Home Components
import HeroSection from '../components/home/HeroSection';
import StatusFeed from '../components/home/StatusFeed';
import DailySpotlight from '../components/home/DailySpotlight';
import FeaturedHeritage from '../components/home/FeaturedHeritage';
import HeritageRoadmap from '../components/home/HeritageRoadmap';
import NewsEventsSection from '../components/home/NewsEventsSection';
import CommunityContributions from '../components/home/CommunityContributions';
import VisitorEngagement from '../components/home/VisitorEngagement';

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
  
  const [loading, setLoading] = useState(false);

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
      setShareNotification(`Heritage link copied for ${item.title || item.subtitle}!`);
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
    stories: 0,
    clans: 0,
    leaders: 0,
    photos: 0,
    videos: 0,
    vocabulary: 0,
    contributors: 0,
    events: 0,
    visitors: 124 // Keep a dynamic visitor offset or count if no analytic service, but keep simple
  });

  useEffect(() => {
    async function loadAllContent() {
      setLoading(true);
      // Fetch each collection in parallel and update state progressively
      getArticles(true).then(articlesData => {
        setRecentArticles(articlesData.slice(0, 4));
        setCounterStats(prev => ({
          ...prev,
          stories: prev.stories + articlesData.length
        }));
      }).catch(err => console.warn('Articles fetch failed:', err));

      getContributions().then(contribsData => {
        const approvedStories = contribsData.filter((c: any) => c.status === 'approved');
        setRecentStories(approvedStories.slice(0, 4));
        const uniqueUsers = new Set(contribsData.map(c => c.userId || c.userEmail).filter(Boolean));
        setCounterStats(prev => ({
          ...prev,
          stories: prev.stories + approvedStories.length,
          contributors: uniqueUsers.size
        }));
      }).catch(err => console.warn('Contributions fetch failed:', err));

      getStatuses(true).then(statusesData => {
        const now = new Date();
        const activeStatuses = statusesData.filter((status: Status) => {
          const notExpired = status.expires_at ? new Date(status.expires_at) > now : true;
          return notExpired && status.status === 'approved' && !status.is_archived;
        });
        setStatuses(activeStatuses);
      }).catch(err => console.warn('Statuses fetch failed:', err));

      getNews(true).then(newsData => {
        setNews(newsData.slice(0, 3));
      }).catch(err => console.warn('News fetch failed:', err));

      getAnnouncements(true).then(announcementsData => {
        setAnnouncements(announcementsData);
      }).catch(err => console.warn('Announcements fetch failed:', err));

      getEvents(true).then(eventsData => {
        setEvents(eventsData);
        setCounterStats(prev => ({ ...prev, events: eventsData.length }));
      }).catch(err => console.warn('Events fetch failed:', err));

      getClans(true).then(clansData => {
        setClans(clansData);
        setCounterStats(prev => ({ ...prev, clans: clansData.length }));
      }).catch(err => console.warn('Clans fetch failed:', err));

      getLeaders(true).then(leadersData => {
        setLeaders(leadersData);
        setCounterStats(prev => ({ ...prev, leaders: leadersData.length }));
      }).catch(err => console.warn('Leaders fetch failed:', err));

      getVocabulary(true).then(vocabData => {
        setVocabulary(vocabData);
        setCounterStats(prev => ({ ...prev, vocabulary: vocabData.length }));
      }).catch(err => console.warn('Vocabulary fetch failed:', err));

      getGalleryImages(false).then(galleryData => {
        setGalleryImages(galleryData);
        setCounterStats(prev => ({
          ...prev,
          photos: galleryData.filter((g: any) => g.type === 'photo').length,
          videos: galleryData.filter((g: any) => g.type === 'video').length
        }));
      }).catch(err => console.warn('Gallery images fetch failed:', err));
      
      setLoading(false);
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
    const selectedClan = clans.find(c => c.name?.toLowerCase().includes('baise-mugaya')) || clans[0] || { 
      id: 'baise-mugaya-clan-fallback-id',
      name: 'Baise-Mugaya Clan', 
      totem: 'Crested Crane (Nnali)', 
      desc: 'Traditionally serving as the navigators and high canoe crafters of Lake Kyoga, steering communities across the waters.' 
    };

    const selectedLeader = leaders.find(l => l.name?.toLowerCase().includes('christopher kyega')) || leaders[0] || { 
      id: 'elder-christopher-kyega-fallback-id',
      name: 'Elder Christopher Kyega', 
      role: 'Chief Historian & Story Keeper (92 years)', 
      bio: 'Possesses direct oral line coordinates of the 17th-century migrations of the Bakenyi riverine communities.' 
    };

    const selectedOralHistory = recentArticles.find(a => a.title?.toLowerCase().includes('ebiswa') || a.title?.toLowerCase().includes('legend')) || recentArticles[0] || {
      id: 'legends-of-ebiswa-fallback-id',
      title: 'The Legends of the Ebiswa',
      desc: 'Ancient accounts of the floating reed islands of Lake Kyoga which served as temporary mobile settlements during periods of regional migration.'
    };
    
    return {
      clan: selectedClan,
      leader: selectedLeader,
      food: {
        id: 'gastronomy-food-spotlight-id',
        title: 'Embaata & Smoked Kyoga Catfish',
        desc: 'Traditional lake cuisine salted and slow-smoked on dry papyrus reed mattresses, creating a distinctive deep river aroma.'
      },
      artifact: {
        id: 'canoe-artifact-spotlight-id',
        title: 'The Amato (Traditional Dugout Canoe)',
        desc: 'Hand-carved from a single Musizi tree trunk, shaped to pierce the heavy Kyoga water lilies and propelled by distinctive heart-shaped paddles.'
      },
      oralHistory: selectedOralHistory
    };
  }, [clans, leaders, recentArticles]);

  return (
    <div className="relative overflow-hidden bg-[#faf8f5] dark:bg-stone-950 text-stone-900 dark:text-stone-100 min-h-screen font-sans">
      <SEO 
        title="Bakenye Cultural Heritage Hub"
        description="Preserving the rich riverine traditions, clans, totems, language (Lukenye), and oral history archives of the Bakenye people of Lake Kyoga, Uganda."
        keywords="Home, Bakenye culture, Lake Kyoga, Lukenye dialect, oral history preservation, African clans, indigenous river dwellers"
      />

      {/* Subtle Ambient Floating Background Gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div 
          animate={{
            x: [0, 40, -20, 0],
            y: [0, -60, 40, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-[10%] left-[5%] w-72 h-72 rounded-full bg-amber-500/5 dark:bg-amber-500/3 blur-[120px]"
        />
        <motion.div 
          animate={{
            x: [0, -50, 30, 0],
            y: [0, 40, -50, 0],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-[40%] right-[10%] w-96 h-96 rounded-full bg-orange-600/5 dark:bg-orange-600/3 blur-[140px]"
        />
        <motion.div 
          animate={{
            x: [0, 30, -30, 0],
            y: [0, 50, -40, 0],
          }}
          transition={{
            duration: 28,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute bottom-[20%] left-[15%] w-80 h-80 rounded-full bg-emerald-600/5 dark:bg-emerald-600/3 blur-[125px]"
        />
      </div>
      
      {/* 1. HERO SECTION */}
      <HeroSection 
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        isSearchFocused={isSearchFocused}
        setIsSearchFocused={setIsSearchFocused}
        searchResults={searchResults}
        navigate={navigate}
      />

      {/* 2. LIVE STATUS STORIES FEED */}
      <StatusFeed 
        statuses={statuses}
        handleOpenStatus={handleOpenStatus}
      />

      {/* Spacing before "Today in Bakenye" */}
      <div className="h-10 md:h-16" />

      {/* 3. DAILY SPOTLIGHT */}
      <DailySpotlight 
        dailySpotlight={dailySpotlight}
        shareNotification={shareNotification}
        bookmarks={bookmarks}
        toggleBookmark={toggleBookmark}
        handleShare={handleShare}
        addToRecentlyViewed={addToRecentlyViewed}
      />

      {/* 4. FEATURED HERITAGE BENTO GRID */}
      <FeaturedHeritage 
        featuredItems={featuredItems}
      />

      {/* 5. HERITAGE VOYAGE TIMELINE ROADMAP */}
      <HeritageRoadmap 
        activeJourneyStep={activeJourneyStep}
        setActiveJourneyStep={setActiveJourneyStep}
      />

      {/* 6. NEWS DISPATCHES & EVENTS SUMMITS */}
      <NewsEventsSection 
        pinnedAnnouncement={pinnedAnnouncement}
        news={news}
        events={events}
        getCountdown={getCountdown}
        setSelectedEventForRsvp={setSelectedEventForRsvp}
      />

      {/* 7. COMMUNITY VOUCHED CONTRIBUTIONS */}
      <CommunityContributions 
        recentStories={recentStories}
      />

      {/* 8. VISITOR LOGBOOK, RECOMMENDED EXHBITS & CTA DRIVE */}
      <VisitorEngagement 
        recentlyViewed={recentlyViewed}
        setRecentlyViewed={setRecentlyViewed}
        addToRecentlyViewed={addToRecentlyViewed}
      />

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
                    className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-colors animate-fade-in"
                    id="btn-close-status-modal"
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
                        id={`btn-status-react-${emoji}`}
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
                    id="input-status-comment"
                  />
                  <button 
                    type="submit"
                    className="bg-amber-500 hover:bg-amber-400 text-stone-950 px-4 py-2 rounded-xl text-[10px] font-bold uppercase transition-colors cursor-pointer"
                    id="btn-submit-status-comment"
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
      <Modal
        isOpen={!!selectedEventForRsvp}
        onClose={() => setSelectedEventForRsvp(null)}
        title="Register for Gathering"
        size="sm"
        id="rsvp-modal-container"
      >
        {selectedEventForRsvp && (
          <div className="space-y-6">
            <p className="text-xs sm:text-sm text-heritage-brown/65 dark:text-stone-400 leading-relaxed">
              You are RSVPing to: <strong className="text-heritage-terracotta dark:text-heritage-sand font-bold">{selectedEventForRsvp.title}</strong>
            </p>

            {rsvpSuccess ? (
              <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250 text-emerald-800 dark:text-emerald-400 p-4.5 rounded-2xl flex items-center gap-3">
                <Check className="w-5 h-5 text-emerald-600 shrink-0 animate-bounce" />
                <span className="text-xs font-bold font-mono uppercase tracking-wider">Successfully Registered! Your seat is secured.</span>
              </div>
            ) : (
              <form onSubmit={handleRsvpSubmit} className="space-y-5">
                <Input 
                  label="Your Full Name"
                  required
                  value={rsvpName}
                  onChange={(e) => setRsvpName(e.target.value)}
                  placeholder="e.g., Elder Daniel Mukasa"
                  id="input-rsvp-name"
                />

                <Button 
                  type="submit"
                  variant="primary"
                  className="w-full py-4 rounded-xl font-bold font-mono text-xs"
                  id="btn-submit-rsvp"
                >
                  Confirm RSVP Seat
                </Button>
              </form>
            )}
          </div>
        )}
      </Modal>

    </div>
  );
}
