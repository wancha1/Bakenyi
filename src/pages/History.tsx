import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  Map, 
  BookOpen,
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Volume2, 
  VolumeX, 
  Search, 
  Clock, 
  User, 
  Globe, 
  Sparkles, 
  ListMusic, 
  Volume1, 
  Volume,
  Headphones,
  Languages,
  ArrowRight,
  MapPin,
  ChevronRight,
  X,
  FileText,
  Bookmark,
  TrendingUp,
  Download,
  AlertCircle
} from 'lucide-react';
import { getSupabase } from '../lib/supabaseClient';
import SEO from '../components/SEO';
import { 
  TimelineEvent, 
  AudioTrack, 
  MigrationNode, 
  HistoricalDocument,
  FALLBACK_EVENTS,
  FALLBACK_AUDIO_TRACKS,
  MIGRATION_NODES,
  HISTORICAL_DOCUMENTS
} from '../data/historyData';

export default function History() {
  const [searchParams] = useSearchParams();
  const [oralHistoryTracks, setOralHistoryTracks] = useState<AudioTrack[]>(FALLBACK_AUDIO_TRACKS);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>(FALLBACK_EVENTS);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEra, setSelectedEra] = useState<string>('All');
  const [selectedTheme, setSelectedTheme] = useState<string>('All');
  const [selectedClan, setSelectedClan] = useState<string>('All');
  const [selectedLocation, setSelectedLocation] = useState<string>('All');

  // Interactive Timeline Detail Modal
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);

  // Interactive Migration Map Node
  const [activeMapNode, setActiveMapNode] = useState<MigrationNode>(MIGRATION_NODES[0]);

  // Audio Player States
  const [activeTrackIndex, setActiveTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [translationLang, setTranslationLang] = useState<'lukenye' | 'english' | 'both'>('both');

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const transcriptionContainerRef = useRef<HTMLDivElement | null>(null);

  // Fetch dynamic timeline and audio recordings from Supabase and blend
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const client = getSupabase();
      
      // 1. Fetch oral history recordings
      let dbTracks: AudioTrack[] = [];
      try {
        if (client) {
          const { data, error } = await client.from('oral_history').select('*');
          if (!error && data && data.length > 0) {
            dbTracks = data.map((row: any) => ({
              id: String(row.id),
              title: row.title || 'Untitled Narrative',
              elder: row.elder || row.narrator || 'Elder Storyteller',
              clan: row.clan || 'Bakenyi',
              role: row.role || 'Traditional Guardian',
              topic: (row.topic || 'Tradition') as any,
              duration: row.duration || '2:30',
              durationSeconds: row.duration_seconds || 150,
              imageUrl: row.image_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300',
              audioUrl: row.audio_url || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
              recordingDate: row.recording_date || 'September 2023',
              transcription: Array.isArray(row.transcription) ? row.transcription : []
            }));
          }
        }
      } catch (e) {
        console.error('History: failed to load oral history table:', e);
      }

      if (dbTracks.length > 0) {
        const combined = [...dbTracks];
        FALLBACK_AUDIO_TRACKS.forEach(fallback => {
          if (!combined.some(t => t.id === fallback.id || t.title.toLowerCase() === fallback.title.toLowerCase())) {
            combined.push(fallback);
          }
        });
        setOralHistoryTracks(combined);
      } else {
        setOralHistoryTracks(FALLBACK_AUDIO_TRACKS);
      }

      // 2. Fetch history timeline events
      let dbTimeline: any[] = [];
      try {
        if (client) {
          const { data, error } = await client
            .from('timeline_events')
            .select('*')
            .order('year_order', { ascending: true });
          
          if (!error && data && data.length > 0) {
            dbTimeline = data;
          }
        }
      } catch (e) {
        console.error('History: failed to load timeline events table:', e);
      }

      if (dbTimeline.length > 0) {
        const blended = dbTimeline.map((row: any, idx: number): TimelineEvent => {
          const match = FALLBACK_EVENTS.find(
            fe => fe.title.toLowerCase().includes(row.title.toLowerCase()) || 
                  row.title.toLowerCase().includes(fe.title.toLowerCase())
          );

          const yearNum = parseInt(row.period || row.year || '0') || 1000 + idx * 100;
          const era: 'Pre-Colonial' | 'Colonial' | 'Modern' = 
            yearNum < 1890 ? 'Pre-Colonial' : yearNum < 1960 ? 'Colonial' : 'Modern';

          return {
            id: row.id ? String(row.id) : `dynamic-${idx}`,
            period: row.period || row.year || match?.period || 'Unknown Era',
            title: row.title || match?.title || 'Historical Event',
            desc: row.desc || row.description || match?.desc || 'No description provided.',
            detailedDesc: match?.detailedDesc || row.desc || row.description || 'No further details cataloged.',
            category: match?.category || era,
            theme: match?.theme || 'Settlement',
            location: match?.location || 'Lake Kyoga',
            relatedClans: match?.relatedClans || ['Bakenyi Clans'],
            relatedLeaders: match?.relatedLeaders || ['Elders Council'],
            image: match?.image || 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&q=80&w=800',
            year_order: row.year_order || match?.year_order || yearNum,
            elderQuote: match?.elderQuote || undefined,
            relatedTrackId: match?.relatedTrackId || undefined
          };
        });

        FALLBACK_EVENTS.forEach(fallback => {
          if (!blended.some(e => e.title.toLowerCase() === fallback.title.toLowerCase())) {
            blended.push(fallback);
          }
        });

        blended.sort((a, b) => (a.year_order || 0) - (b.year_order || 0));
        setTimelineEvents(blended);
      } else {
        setTimelineEvents(FALLBACK_EVENTS);
      }

      setLoading(false);
    }

    fetchData();
  }, []);

  // Parse track parameter to select and play specific oral history recording
  useEffect(() => {
    if (oralHistoryTracks.length === 0) return;
    const trackParam = searchParams.get('track');
    if (trackParam) {
      const index = oralHistoryTracks.findIndex(t => t.id === trackParam);
      if (index !== -1) {
        setActiveTrackIndex(index);
        setIsPlaying(true);
        setTimeout(() => {
          const sectionEl = document.getElementById('oral-history-archive');
          if (sectionEl) {
            sectionEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 300);
      }
    }
  }, [searchParams, oralHistoryTracks]);

  // Parse section parameter to scroll to specific history timeline event
  useEffect(() => {
    const sectionParam = searchParams.get('section');
    if (sectionParam) {
      setTimeout(() => {
        const timelineEl = document.getElementById('vertical-timeline');
        if (timelineEl) {
          timelineEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 300);
    }
  }, [searchParams]);

  // Audio player synchronization & transcription logic
  const currentTrack = oralHistoryTracks[activeTrackIndex];

  const activeSegmentIndex = currentTrack?.transcription ? currentTrack.transcription.findIndex((seg, i) => {
    const nextSeg = currentTrack.transcription[i + 1];
    return currentTime >= seg.time && (!nextSeg || currentTime < nextSeg.time);
  }) : -1;

  useEffect(() => {
    if (transcriptionContainerRef.current) {
      const activeElement = transcriptionContainerRef.current.querySelector('[data-active="true"]');
      if (activeElement) {
        activeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }
    }
  }, [activeSegmentIndex]);

  useEffect(() => {
    if (audioRef.current && currentTrack) {
      audioRef.current.src = currentTrack.audioUrl;
      audioRef.current.load();
      audioRef.current.playbackRate = playbackRate;
      audioRef.current.volume = isMuted ? 0 : volume;
      audioRef.current.muted = isMuted;

      if (isPlaying) {
        audioRef.current.play().catch((err) => {
          console.warn("Autoplay blocked or audio load error:", err);
          setIsPlaying(false);
        });
      } else {
        setCurrentTime(0);
      }
    }
  }, [activeTrackIndex]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  const handleSelectOralTrack = (trackId: string) => {
    if (oralHistoryTracks.length === 0) return;
    const index = oralHistoryTracks.findIndex(t => t.id === trackId);
    const targetIdx = index !== -1 ? index : 0;
    
    setActiveTrackIndex(targetIdx);
    setIsPlaying(true);
    
    setTimeout(() => {
      const playerEl = document.getElementById('oral-history-archive');
      if (playerEl) {
        playerEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 150);
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.error("Play failed:", err);
      });
    }
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const handleSkip = (seconds: number) => {
    if (!audioRef.current) return;
    let newTime = audioRef.current.currentTime + seconds;
    if (newTime < 0) newTime = 0;
    if (newTime > duration) newTime = duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    setIsMuted(vol === 0);
    if (audioRef.current) {
      audioRef.current.volume = vol;
      audioRef.current.muted = vol === 0;
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    const newMute = !isMuted;
    setIsMuted(newMute);
    audioRef.current.muted = newMute;
    audioRef.current.volume = newMute ? 0 : volume;
  };

  const handleSpeedChange = () => {
    const speeds = [1, 1.25, 1.5];
    const nextIndex = (speeds.indexOf(playbackRate) + 1) % speeds.length;
    setPlaybackRate(speeds[nextIndex]);
  };

  const handleSeekToSegment = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
      if (!isPlaying) {
        audioRef.current.play().then(() => setIsPlaying(true));
      }
    }
  };

  const formatTime = (timeInSeconds: number) => {
    if (isNaN(timeInSeconds)) return "0:00";
    const mins = Math.floor(timeInSeconds / 60);
    const secs = Math.floor(timeInSeconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Multi-criteria timeline filters
  const filteredTimeline = timelineEvents.filter(event => {
    const matchesSearch = 
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.detailedDesc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesEra = selectedEra === 'All' || event.category === selectedEra;
    const matchesTheme = selectedTheme === 'All' || event.theme === selectedTheme;
    const matchesClan = selectedClan === 'All' || event.relatedClans.includes(selectedClan);
    const matchesLocation = selectedLocation === 'All' || event.location === selectedLocation;

    return matchesSearch && matchesEra && matchesTheme && matchesClan && matchesLocation;
  });

  const filteredPlaylist = oralHistoryTracks.filter(track => {
    const matchesSearch = track.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          track.elder.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          track.clan.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#fcfaf7] text-[#2c1d11] font-sans overflow-x-hidden selection:bg-heritage-terracotta/20 selection:text-heritage-terracotta">
      <SEO 
        title="Chronicles of the Waters: History & Timelines"
        description="Listen to direct recordings from community Elders and explore the chronological timeline of the migrations and settlements of Bakenye lake-dwelling societies."
        keywords="Oral history, timeline, Bakenye migrations, Lake Kyoga archives, audio stories, elder testimony"
      />

      {/* 1. Exhibition Hero Banner */}
      <section className="relative min-h-[90vh] flex flex-col justify-between bg-gradient-to-br from-stone-950 via-stone-900 to-[#1c120c] text-white pt-32 pb-16 px-4 md:px-8 overflow-hidden border-b border-stone-800/60">
        {/* Atmospheric wetland background overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-25 mix-blend-overlay pointer-events-none" 
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&q=80&w=1600')` }}
        />
        {/* Subtle radial light glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-heritage-terracotta/10 via-transparent to-transparent pointer-events-none" />
        
        {/* Upper Breadcrumbs & Platform tag */}
        <div className="max-w-7xl mx-auto w-full z-10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-2 text-xs font-mono tracking-widest text-[#dfc29a] uppercase">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-white/60">Heritage Exhibition</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-[#c2593f]">Chamber of Chronicles</span>
          </div>
          <div className="flex items-center space-x-2 bg-white/5 px-3.5 py-1.5 rounded-full border border-white/10 text-[10px] font-black uppercase tracking-wider text-[#dfc29a]">
            <Sparkles className="w-3 h-3 text-[#c2593f]" />
            <span>Digital Museum Platform v1.0</span>
          </div>
        </div>

        {/* Central Hero Headline */}
        <div className="max-w-5xl mx-auto w-full text-center py-12 md:py-20 z-10 space-y-6">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-4xl sm:text-6xl md:text-8xl font-serif font-black tracking-tight leading-none text-white"
          >
            Chronicles of <br className="hidden md:inline" />
            the <span className="text-[#c2593f]">Water People</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-stone-300 max-w-2xl mx-auto text-base sm:text-lg md:text-xl font-light leading-relaxed font-sans"
          >
            Walk through the history, migrations, and oral records of the Bakenyi people of Lake Kyoga. Experience ancient chronicles preserved through the voices of elder custodians.
          </motion.p>
        </div>

        {/* Bottom Scroll Down indicator */}
        <div className="max-w-7xl mx-auto w-full z-10 flex items-center justify-between border-t border-white/10 pt-8 mt-12 text-stone-400">
          <span className="text-xs uppercase font-bold font-mono tracking-widest text-[#dfc29a]/80">
            Scroll to walk the timeline
          </span>
          <motion.div 
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="flex flex-col items-center cursor-pointer"
            onClick={() => document.getElementById('museum-statistics')?.scrollIntoView({ behavior: 'smooth' })}
          >
            <span className="text-[10px] font-bold uppercase tracking-widest font-mono text-white/50 mb-1">Enter Exhibition</span>
            <div className="w-5 h-8 border border-white/30 rounded-full flex items-start justify-center p-1">
              <div className="w-1 h-2 bg-[#c2593f] rounded-full animate-bounce" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. Timeline Statistics Section */}
      <section id="museum-statistics" className="py-12 bg-[#2c1d11] text-white border-b border-stone-800">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 md:divide-x md:divide-white/10">
            <div className="flex flex-col items-center justify-center text-center p-4">
              <Calendar className="w-6 h-6 mb-3 text-[#dfc29a]" />
              <span className="text-2xl sm:text-3xl font-serif font-black">12+</span>
              <span className="text-[10px] text-stone-400 uppercase tracking-widest font-bold mt-1">Verified Milestones</span>
            </div>
            <div className="flex flex-col items-center justify-center text-center p-4">
              <Headphones className="w-6 h-6 mb-3 text-[#dfc29a]" />
              <span className="text-2xl sm:text-3xl font-serif font-black">24+ Hrs</span>
              <span className="text-[10px] text-stone-400 uppercase tracking-widest font-bold mt-1">Oral Recordings</span>
            </div>
            <div className="flex flex-col items-center justify-center text-center p-4">
              <FileText className="w-6 h-6 mb-3 text-[#dfc29a]" />
              <span className="text-2xl sm:text-3xl font-serif font-black">150+</span>
              <span className="text-[10px] text-stone-400 uppercase tracking-widest font-bold mt-1">Archived Pages</span>
            </div>
            <div className="flex flex-col items-center justify-center text-center p-4">
              <Globe className="w-6 h-6 mb-3 text-[#dfc29a]" />
              <span className="text-2xl sm:text-3xl font-serif font-black">5</span>
              <span className="text-[10px] text-stone-400 uppercase tracking-widest font-bold mt-1">Settlement Districts</span>
            </div>
            <div className="flex flex-col items-center justify-center text-center p-4 col-span-2 md:col-span-1">
              <User className="w-6 h-6 mb-3 text-[#dfc29a]" />
              <span className="text-2xl sm:text-3xl font-serif font-black">18</span>
              <span className="text-[10px] text-stone-400 uppercase tracking-widest font-bold mt-1">Participating Elders</span>
            </div>
          </div>
        </div>
      </section>

      {/* Intro Narrative Section */}
      <section className="py-24 px-4 max-w-7xl mx-auto border-b border-stone-200/40">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-6 text-left"
          >
            <div className="flex items-center space-x-3 text-[#c2593f] mb-4">
              <Map className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-widest">The Great Migration</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#2c1d11]">Migration from the Lakeshores</h2>
            <p className="text-[#2c1d11]/80 leading-relaxed text-base md:text-lg">
              Historical oral traditions suggest that the Bakenyi entered the Lake Kyoga region from multiple directions. One significant route traces ancestry to the ancestors of the Baganda and Basoga near Lake Victoria, while another branch shares lineage roots with the people of Bunyoro.
            </p>
            <p className="text-[#2c1d11]/80 leading-relaxed text-base md:text-lg">
              Known as the 'Water People', the Bakenyi were the master navigators long before modern exploration. They were recognized for their unique dugout canoes and their reliance on the papyrus floating islands, which acted as mobile homes and protective fortresses.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-6 text-left"
          >
            <div className="flex items-center space-x-3 text-[#5f6f52] mb-4">
              <BookOpen className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-widest">Oral Tradition</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#2c1d11]">The Power of the Word</h2>
            <p className="text-[#2c1d11]/80 leading-relaxed text-base md:text-lg">
              For centuries, Bakenyi history was preserved through 'Engero' (proverbs) and epic storytelling sessions around fires at night. Elders would recount the heroic acts of clan leaders who navigated the treacherous storms of Lake Kyoga and successfully negotiated peace with neighboring tribes.
            </p>
            <div className="bg-[#5f6f52]/5 p-8 rounded-3xl border-l-4 border-[#5f6f52] italic text-[#2c1d11]/80 text-sm md:text-base leading-relaxed">
              "We do not write on paper alone; we write on the hearts of our children. When an elder dies, it is as if a whole library has burned down." 
              <span className="block mt-4 font-bold text-xs uppercase not-italic text-[#5f6f52]">— Traditional Wisdom</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 3. Interactive Vertical Alternating Timeline */}
      <section id="vertical-timeline" className="py-24 bg-[#fbf9f4] border-b border-stone-200 relative">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-[#c2593f]/10 border border-[#c2593f]/20 text-[#c2593f] rounded-full text-[10px] font-black uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5" />
              <span>Interactive Exhibition Chronicle</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-serif font-black text-[#2c1d11] tracking-tight">The River of Time</h2>
            <p className="text-stone-600 text-sm md:text-base leading-relaxed font-medium">
              Journey chronologically through Bakenyi history. Filter milestones by era, theme, location, or clan, and listen to first-hand accounts by clicking on events.
            </p>
          </div>

          {/* Timeline Multi-Criteria Filters Panel */}
          <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-sm space-y-4 mb-12 max-w-6xl mx-auto text-left">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-stone-100">
              <span className="text-xs font-black uppercase tracking-wider text-stone-400 flex items-center">
                <Search className="w-4 h-4 mr-2 text-[#c2593f]" />
                Interactive Search & Filters
              </span>
              {filteredTimeline.length !== timelineEvents.length && (
                <button 
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedEra('All');
                    setSelectedTheme('All');
                    setSelectedClan('All');
                    setSelectedLocation('All');
                  }}
                  className="text-xs text-[#c2593f] font-bold uppercase tracking-wider hover:underline"
                >
                  Reset Filters ({filteredTimeline.length} of {timelineEvents.length})
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
              {/* Text Search */}
              <div className="relative">
                <label className="text-[10px] uppercase font-bold text-stone-400 tracking-wider block mb-1.5">Keywords</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input 
                    type="text"
                    placeholder="Search titles, logs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#fcfaf7] border border-stone-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-[#c2593f] transition-colors"
                  />
                </div>
              </div>

              {/* Era Filter */}
              <div>
                <label className="text-[10px] uppercase font-bold text-stone-400 tracking-wider block mb-1.5">Historical Era</label>
                <select 
                  value={selectedEra}
                  onChange={(e) => setSelectedEra(e.target.value)}
                  className="w-full bg-[#fcfaf7] border border-stone-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#c2593f] cursor-pointer"
                >
                  <option value="All">All Eras</option>
                  <option value="Pre-Colonial">Pre-Colonial</option>
                  <option value="Colonial">Colonial</option>
                  <option value="Modern">Modern</option>
                </select>
              </div>

              {/* Theme Filter */}
              <div>
                <label className="text-[10px] uppercase font-bold text-stone-400 tracking-wider block mb-1.5">Exhibition Theme</label>
                <select 
                  value={selectedTheme}
                  onChange={(e) => setSelectedTheme(e.target.value)}
                  className="w-full bg-[#fcfaf7] border border-stone-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#c2593f] cursor-pointer"
                >
                  <option value="All">All Themes</option>
                  <option value="Migration">Migration</option>
                  <option value="Settlement">Settlement</option>
                  <option value="Tradition">Tradition</option>
                  <option value="Leadership">Leadership</option>
                </select>
              </div>

              {/* Clan Filter */}
              <div>
                <label className="text-[10px] uppercase font-bold text-stone-400 tracking-wider block mb-1.5">Related Clan</label>
                <select 
                  value={selectedClan}
                  onChange={(e) => setSelectedClan(e.target.value)}
                  className="w-full bg-[#fcfaf7] border border-stone-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#c2593f] cursor-pointer"
                >
                  <option value="All">All Clans</option>
                  <option value="Baise-Mugaya">Baise-Mugaya</option>
                  <option value="Baise-Musuuba">Baise-Musuuba</option>
                  <option value="Baise-Igaga">Baise-Igaga</option>
                </select>
              </div>

              {/* Location Filter */}
              <div>
                <label className="text-[10px] uppercase font-bold text-stone-400 tracking-wider block mb-1.5">Geography</label>
                <select 
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full bg-[#fcfaf7] border border-stone-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#c2593f] cursor-pointer"
                >
                  <option value="All">All Regions</option>
                  <option value="Victoria Nile">Victoria Nile</option>
                  <option value="Lake Kyoga">Lake Kyoga</option>
                  <option value="Namasale">Namasale</option>
                  <option value="Kagwara">Kagwara</option>
                </select>
              </div>
            </div>
          </div>

          {/* Vertical Alternating Timeline Trail */}
          <div className="relative max-w-6xl mx-auto mt-16">
            
            {/* Center Dotted Path Line */}
            <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-0.5 border-l-2 border-dashed border-[#dfc29a]/80 -translate-x-1/2 z-0" />

            {filteredTimeline.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-stone-200 shadow-sm max-w-2xl mx-auto px-6">
                <AlertCircle className="w-12 h-12 text-[#c2593f]/60 mx-auto mb-4 animate-bounce" />
                <h3 className="text-lg font-serif font-bold mb-1">No Milestones Found</h3>
                <p className="text-sm text-stone-500 max-w-md mx-auto">
                  No chronological events match your selected combination of era, theme, clan, and keyword filters.
                </p>
                <button 
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedEra('All');
                    setSelectedTheme('All');
                    setSelectedClan('All');
                    setSelectedLocation('All');
                  }}
                  className="mt-4 px-4 py-2 bg-[#c2593f] hover:bg-[#2c1d11] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="space-y-16 relative z-10">
                {filteredTimeline.map((event, index) => {
                  const isLeft = index % 2 === 0;

                  return (
                    <motion.div 
                      key={event.id}
                      initial={{ opacity: 0, y: 35 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-100px" }}
                      className={`flex flex-col md:flex-row items-stretch w-full ${isLeft ? 'md:flex-row-reverse' : ''}`}
                    >
                      {/* Left/Right Card Spacer on Desktop */}
                      <div className="w-full hidden md:block" />

                      {/* Timeline Central Node Dot */}
                      <div className="absolute left-8 md:left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-[#fcfaf7] border-4 border-[#c2593f] flex items-center justify-center shadow-md z-20 mt-6">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#c2593f]" />
                      </div>

                      {/* Content Card Panel */}
                      <div className="w-full pl-16 md:pl-0 md:px-12">
                        <div 
                          className="bg-white border border-stone-200/80 rounded-[32px] overflow-hidden hover:border-[#c2593f]/50 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col h-full hover:-translate-y-1"
                        >
                          {/* Event Cover Image */}
                          <div className="h-48 relative overflow-hidden bg-stone-100 shrink-0">
                            <img 
                              src={event.image} 
                              alt={event.title} 
                              className="w-full h-full object-cover object-center transition-transform duration-700 hover:scale-105"
                              referrerPolicy="no-referrer"
                            />
                            {/* Gradient shadow */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                            {/* Year period pill */}
                            <span className="absolute bottom-4 left-4 text-xs font-black text-white bg-[#c2593f] px-3.5 py-1 rounded-full uppercase tracking-wider shadow">
                              {event.period}
                            </span>
                          </div>

                          {/* Event Card Info */}
                          <div className="p-6 md:p-8 flex-grow flex flex-col justify-between text-left space-y-4">
                            <div className="space-y-3">
                              {/* Tags */}
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[9px] font-black uppercase tracking-wider text-[#c2593f] bg-[#c2593f]/10 border border-[#c2593f]/10 px-2 py-0.5 rounded-md">
                                  {event.category}
                                </span>
                                <span className="text-[9px] font-black uppercase tracking-wider text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md flex items-center">
                                  <MapPin className="w-2.5 h-2.5 mr-0.5" />
                                  {event.location}
                                </span>
                                <span className="text-[9px] font-black uppercase tracking-wider text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md">
                                  {event.theme}
                                </span>
                              </div>

                              <h3 className="text-xl sm:text-2xl font-serif font-black text-[#2c1d11]">
                                {event.title}
                              </h3>

                              <p className="text-sm text-stone-600 leading-relaxed font-sans line-clamp-3">
                                {event.desc}
                              </p>

                              {/* Key Custodians & Clans badges */}
                              <div className="pt-3 border-t border-stone-100 flex flex-wrap gap-2 items-center text-xs text-stone-500">
                                <span className="font-mono text-[10px] text-stone-400">Related:</span>
                                {event.relatedClans.map(clanName => (
                                  <span key={clanName} className="bg-stone-50 border border-stone-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-[#2c1d11]/80">
                                    {clanName}
                                  </span>
                                ))}
                                {event.relatedLeaders.map(leaderName => (
                                  <span key={leaderName} className="bg-stone-50 border border-stone-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-stone-600 italic">
                                    {leaderName}
                                  </span>
                                ))}
                              </div>
                            </div>

                            {/* Action Row */}
                            <div className="pt-4 border-t border-stone-100 flex flex-wrap items-center justify-between gap-4">
                              <button 
                                onClick={() => setSelectedEvent(event)}
                                className="inline-flex items-center space-x-1.5 text-xs font-black uppercase tracking-wider text-[#c2593f] hover:text-[#2c1d11] transition-colors"
                              >
                                <span>Examine Archive</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>

                              {event.relatedTrackId && (
                                <button
                                  onClick={() => handleSelectOralTrack(event.relatedTrackId!)}
                                  className="inline-flex items-center space-x-1.5 bg-[#5f6f52]/10 hover:bg-[#5f6f52]/20 border border-[#5f6f52]/20 text-[#5f6f52] px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer"
                                  title="Listen to corresponding audio story"
                                >
                                  <Volume2 className="w-3.5 h-3.5" />
                                  <span>Hear Oral Account</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </section>

      {/* 4. Interactive Migration Journey Section */}
      <section id="migration-journey" className="py-24 bg-[#2c1d11] text-white border-b border-stone-950 relative overflow-hidden">
        {/* Abstract pattern overlays */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,_var(--tw-gradient-stops))] from-heritage-terracotta/5 via-transparent to-transparent pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
          
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-white/5 border border-white/10 text-[#dfc29a] rounded-full text-[10px] font-black uppercase tracking-wider">
              <Map className="w-3.5 h-3.5 text-[#c2593f]" />
              <span>Interactive Geographical Exhibition</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-serif font-black text-white tracking-tight">The Migration Journey</h2>
            <p className="text-stone-300 text-sm md:text-base leading-relaxed font-light">
              Explore the physical pathways Bakenyi ancestral flotillas sailed. Click checkpoints on the interactive map to inspect settlement records, timelines, and lineage narratives.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
            
            {/* SVG MAP WRAPPER PANEL */}
            <div className="lg:col-span-7 bg-black/30 border border-white/10 rounded-[40px] p-6 flex flex-col justify-between overflow-hidden relative min-h-[400px]">
              <div className="absolute top-4 left-4 z-20 text-xs text-stone-400 font-mono flex items-center bg-black/40 px-3 py-1 rounded-full border border-white/5">
                <Globe className="w-3.5 h-3.5 mr-1.5 text-[#c2593f]" />
                Interactive Flotilla Route Matrix
              </div>

              {/* Responsive custom SVG route map */}
              <div className="flex-grow flex items-center justify-center relative py-6">
                <svg viewBox="0 0 800 500" className="w-full max-w-2xl h-auto">
                  {/* Define animations/gradients */}
                  <defs>
                    <radialGradient id="lake-glow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#c2593f" stopOpacity="0.15" />
                      <stop offset="100%" stopColor="#c2593f" stopOpacity="0" />
                    </radialGradient>
                    <linearGradient id="route-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#dfc29a" stopOpacity="0.3" />
                      <stop offset="50%" stopColor="#c2593f" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#dfc29a" stopOpacity="0.8" />
                    </linearGradient>
                  </defs>

                  {/* Lake Kyoga shape representation - abstract water contour */}
                  <path 
                    d="M 280,100 C 350,90 480,110 520,130 C 580,120 720,160 700,240 C 650,290 520,240 450,250 C 400,290 350,330 250,300 C 180,280 120,320 150,240 C 180,160 220,110 280,100 Z" 
                    fill="url(#lake-glow)" 
                    stroke="rgba(223, 194, 154, 0.15)"
                    strokeWidth="2"
                    className="animate-pulse"
                  />

                  {/* River Victoria Nile path representation */}
                  <path 
                    d="M 350,450 C 320,400 240,360 180,300" 
                    fill="none" 
                    stroke="url(#route-gradient)"
                    strokeWidth="3"
                    strokeDasharray="6, 6"
                    className="transition-all"
                  />

                  {/* Interconnected glowing routes */}
                  <path 
                    d="M 180,300 C 250,260 330,220 420,200" 
                    fill="none" 
                    stroke="url(#route-gradient)"
                    strokeWidth="3"
                    strokeDasharray="6, 6"
                  />
                  <path 
                    d="M 420,200 C 500,210 580,220 650,230" 
                    fill="none" 
                    stroke="url(#route-gradient)"
                    strokeWidth="3.5"
                    strokeDasharray="6, 6"
                  />
                  <path 
                    d="M 420,200 C 460,160 480,130 520,110" 
                    fill="none" 
                    stroke="url(#route-gradient)"
                    strokeWidth="3"
                    strokeDasharray="6, 6"
                  />

                  {/* Node Pins */}
                  {MIGRATION_NODES.map((node) => {
                    const isActive = activeMapNode.id === node.id;
                    return (
                      <g 
                        key={node.id} 
                        transform={`translate(${node.x}, ${node.y})`}
                        className="cursor-pointer group"
                        onClick={() => setActiveMapNode(node)}
                      >
                        {/* Outer ping animation */}
                        {isActive && (
                          <circle r="22" fill="none" stroke="#c2593f" strokeWidth="2" className="animate-ping" opacity="0.6" />
                        )}
                        {/* Interactive circle boundary */}
                        <circle 
                          r={isActive ? "13" : "9"} 
                          fill={isActive ? "#c2593f" : "#2c1d11"} 
                          stroke={isActive ? "#dfc29a" : "#c2593f"} 
                          strokeWidth="3" 
                          className="transition-all duration-300 group-hover:scale-125"
                        />
                        {/* Node Label text overlay */}
                        <text 
                          y="-20" 
                          textAnchor="middle" 
                          fill={isActive ? "#dfc29a" : "#fff"} 
                          fontSize="10" 
                          fontWeight="bold" 
                          className="font-mono drop-shadow select-none group-hover:fill-[#dfc29a] transition-colors"
                        >
                          {node.label}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Bottom Instructions */}
              <div className="flex items-center space-x-2 text-[10px] text-stone-400 font-mono mt-4 border-t border-white/5 pt-4">
                <span className="h-2 w-2 rounded-full bg-[#c2593f] animate-ping" />
                <span>Interact with glowing anchors to navigate historic epochs.</span>
              </div>
            </div>

            {/* EXHIBITION LOG PANEL (Right Column) */}
            <div className="lg:col-span-5 flex flex-col justify-between">
              <AnimatePresence mode="wait">
                <motion.div 
                  key={activeMapNode.id}
                  initial={{ opacity: 0, x: 25 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -25 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white/5 border border-white/10 rounded-[40px] p-8 text-left space-y-6 flex flex-col h-full justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-white/5 pb-4">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[#dfc29a] font-mono tracking-widest block">Exhibition checkpoint</span>
                        <h3 className="text-2xl font-serif font-black text-white">{activeMapNode.title}</h3>
                      </div>
                      <span className="text-xs font-black text-white bg-[#c2593f] px-3 py-1 rounded-lg">
                        {activeMapNode.year}
                      </span>
                    </div>

                    <p className="text-stone-300 text-sm leading-relaxed font-light">
                      {activeMapNode.description}
                    </p>

                    <div className="space-y-2 pt-2">
                      <div className="flex items-start text-xs">
                        <span className="font-mono text-[10px] text-stone-500 w-24 shrink-0 mt-0.5 uppercase tracking-wider">Clans involved:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {activeMapNode.clansInvolved.map(clan => (
                            <span key={clan} className="bg-white/10 text-white/90 px-2 py-0.5 rounded-md text-[10px] font-bold">
                              {clan}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-start text-xs">
                        <span className="font-mono text-[10px] text-stone-500 w-24 shrink-0 mt-0.5 uppercase tracking-wider">Lineage Chiefs:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {activeMapNode.leadersInvolved.map(leader => (
                            <span key={leader} className="bg-white/5 text-[#dfc29a] border border-[#dfc29a]/15 px-2 py-0.5 rounded-md text-[10px] font-bold">
                              {leader}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {activeMapNode.relatedTrackId && (
                    <div className="pt-6 border-t border-white/5 flex items-center justify-between gap-4">
                      <div className="flex items-center space-x-2 text-xs text-stone-400">
                        <Volume2 className="w-4 h-4 text-[#dfc29a]" />
                        <span>Acoustic narrative available</span>
                      </div>
                      <button 
                        onClick={() => handleSelectOralTrack(activeMapNode.relatedTrackId!)}
                        className="px-4 py-2 bg-[#c2593f] hover:bg-white hover:text-[#2c1d11] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Play Narrative</span>
                      </button>
                    </div>
                  )}

                </motion.div>
              </AnimatePresence>
            </div>

          </div>

        </div>
      </section>

      {/* 5. Oral History Archive Section (Premium Audio Suite) */}
      <section id="oral-history-archive" className="py-24 bg-[#1c120c] text-white relative border-b border-stone-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-white/5 via-transparent to-transparent pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
          
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-white/5 border border-white/10 text-[#dfc29a] rounded-full text-[10px] font-black uppercase tracking-wider">
              <Headphones className="w-3.5 h-3.5 text-[#c2593f]" />
              <span>Acoustic Preservation Vault</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-serif font-black text-white tracking-tight">Voices of our Elders</h2>
            <p className="text-stone-300 text-sm md:text-base leading-relaxed font-light">
              Listen to actual transcriptions and audio registers recorded directly from traditional custodians, complete with real-time word tracking and translation logs.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
            
            {/* LEFT COLUMN: ACTIVE AUDIO PLAYER MODULE */}
            <div className="lg:col-span-7 flex flex-col space-y-6">
              
              <div className="bg-[#2c1d11] rounded-[40px] p-6 sm:p-10 border border-white/10 shadow-2xl relative overflow-hidden flex flex-col justify-between h-full">
                {/* Embedded HTML Audio tag */}
                <audio 
                  ref={audioRef}
                  onTimeUpdate={() => {
                    if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
                  }}
                  onDurationChange={() => {
                    if (audioRef.current) setDuration(audioRef.current.duration);
                  }}
                  onEnded={() => {
                    setIsPlaying(false);
                    setCurrentTime(0);
                  }}
                />

                {currentTrack ? (
                  <div className="space-y-6">
                    {/* Elder Info Header */}
                    <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-6 pb-6 border-b border-white/10">
                      <div className="relative shrink-0">
                        <img 
                          src={currentTrack.imageUrl} 
                          alt={currentTrack.elder} 
                          className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover border-4 border-[#dfc29a] shadow-lg"
                        />
                        {isPlaying && (
                          <div className="absolute -bottom-2 -right-2 bg-[#c2593f] p-2 rounded-full border border-white/10 text-white animate-bounce shadow">
                            <Sparkles className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>

                      <div className="space-y-2 flex-grow">
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs">
                          <span className="bg-[#c2593f]/20 border border-[#c2593f]/30 text-[#dfc29a] px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider">
                            {currentTrack.topic}
                          </span>
                          <span className="text-stone-400 font-mono text-[10px] flex items-center">
                            <Clock className="w-3.5 h-3.5 mr-1" />
                            Registered {currentTrack.recordingDate}
                          </span>
                        </div>
                        <h3 className="text-xl sm:text-2xl font-serif font-black">{currentTrack.title}</h3>
                        <p className="text-sm font-semibold flex items-center justify-center sm:justify-start text-[#dfc29a]">
                          <User className="w-4 h-4 mr-1.5 text-[#c2593f]" />
                          {currentTrack.elder}
                          <span className="text-white/30 mx-2">•</span>
                          <span className="text-white/80 font-normal">{currentTrack.clan} Clan</span>
                        </p>
                        <p className="text-stone-400 text-xs italic">{currentTrack.role}</p>
                      </div>
                    </div>

                    {/* Dynamic Sound Wave Visualizer */}
                    <div className="bg-black/35 border border-white/5 rounded-2xl py-6 flex flex-col items-center justify-center min-h-[90px] relative">
                      {isPlaying ? (
                        <div className="flex items-center space-x-1 h-8">
                          {[...Array(24)].map((_, i) => (
                            <motion.div 
                              key={i}
                              animate={{ height: ["20%", "100%", "20%"] }}
                              transition={{
                                repeat: Infinity,
                                duration: 0.5 + (i % 6) * 0.12,
                                ease: "easeInOut"
                              }}
                              className="w-1 bg-[#dfc29a] rounded-full"
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1 opacity-40">
                          {[...Array(24)].map((_, i) => (
                            <div key={i} className="w-1 h-2 bg-stone-500 rounded-full" />
                          ))}
                          <span className="text-[10px] font-mono uppercase tracking-widest text-stone-500 ml-4 font-bold">Acoustic Feed Paused</span>
                        </div>
                      )}
                    </div>

                    {/* Progress seeking slide bar */}
                    <div className="space-y-2">
                      <input 
                        type="range"
                        min={0}
                        max={duration || currentTrack.durationSeconds}
                        step={0.1}
                        value={currentTime}
                        onChange={handleProgressChange}
                        className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#dfc29a] outline-none"
                      />
                      <div className="flex items-center justify-between font-mono text-xs text-stone-400">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration || currentTrack.durationSeconds)}</span>
                      </div>
                    </div>

                    {/* Operational controls button matrix */}
                    <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                      {/* Playback speed toggle */}
                      <button 
                        onClick={handleSpeedChange}
                        className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono font-bold text-[#dfc29a] cursor-pointer"
                        title="Adjust playback speed"
                      >
                        {playbackRate}x speed
                      </button>

                      {/* Main play skip buttons */}
                      <div className="flex items-center space-x-4">
                        <button 
                          onClick={() => handleSkip(-10)}
                          className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-full transition-all cursor-pointer"
                          title="Rewind 10s"
                        >
                          <SkipBack className="w-5 h-5 text-[#dfc29a]" />
                        </button>
                        <button 
                          onClick={togglePlay}
                          className="w-16 h-16 rounded-full bg-[#c2593f] hover:bg-[#dfc29a] text-white hover:text-[#2c1d11] transition-all hover:scale-105 active:scale-95 flex items-center justify-center shadow-lg border border-white/10 cursor-pointer"
                        >
                          {isPlaying ? (
                            <Pause className="w-6 h-6 fill-current text-current" />
                          ) : (
                            <Play className="w-6 h-6 fill-current text-current translate-x-0.5" />
                          )}
                        </button>
                        <button 
                          onClick={() => handleSkip(10)}
                          className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-full transition-all cursor-pointer"
                          title="Forward 10s"
                        >
                          <SkipForward className="w-5 h-5 text-[#dfc29a]" />
                        </button>
                      </div>

                      {/* Volume / mute controls */}
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={toggleMute}
                          className="p-2.5 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 text-[#dfc29a] cursor-pointer"
                        >
                          {isMuted || volume === 0 ? (
                            <VolumeX className="w-4 h-4" />
                          ) : volume < 0.4 ? (
                            <Volume className="w-4 h-4" />
                          ) : volume < 0.7 ? (
                            <Volume1 className="w-4 h-4" />
                          ) : (
                            <Volume2 className="w-4 h-4" />
                          )}
                        </button>
                        <input 
                          type="range"
                          min={0}
                          max={1}
                          step={0.05}
                          value={isMuted ? 0 : volume}
                          onChange={handleVolumeChange}
                          className="w-16 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#dfc29a] outline-none hidden sm:block"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-stone-400">
                    <p className="text-sm">No track selected.</p>
                  </div>
                )}
              </div>

              {/* SYNCHRONIZED INTERACTIVE TRANSCRIPT BOX */}
              {currentTrack && currentTrack.transcription && currentTrack.transcription.length > 0 && (
                <div className="bg-[#2c1d11] rounded-[32px] p-6 border border-white/10 flex flex-col h-[280px]">
                  <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-4 shrink-0">
                    <div className="flex items-center space-x-2 text-[#dfc29a]">
                      <Languages className="w-4 h-4 text-[#c2593f]" />
                      <span className="text-xs font-black uppercase tracking-widest">Interactive Transcripts</span>
                    </div>

                    {/* Translation Language Selector */}
                    <div className="flex bg-black/30 p-1 rounded-xl border border-white/10">
                      {(['lukenye', 'english', 'both'] as const).map((lang) => (
                        <button 
                          key={lang}
                          onClick={() => setTranslationLang(lang)}
                          className={`px-3 py-1 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                            translationLang === lang 
                              ? 'bg-[#c2593f] text-white shadow-sm' 
                              : 'text-stone-400 hover:text-white'
                          }`}
                        >
                          {lang}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Lyrics scroll body */}
                  <div 
                    ref={transcriptionContainerRef}
                    className="flex-grow overflow-y-auto pr-2 space-y-3.5 scrollbar-thin scrollbar-thumb-white/10 text-left"
                  >
                    {currentTrack.transcription.map((seg, idx) => {
                      const isActive = idx === activeSegmentIndex;
                      return (
                        <div 
                          key={idx}
                          onClick={() => handleSeekToSegment(seg.time)}
                          data-active={isActive ? "true" : "false"}
                          className={`p-3.5 rounded-2xl cursor-pointer transition-all duration-300 border text-left flex items-start gap-3 group/line ${
                            isActive 
                              ? 'bg-[#c2593f]/25 border-[#dfc29a] text-white shadow-md scale-[1.01]' 
                              : 'bg-white/5 border-transparent text-stone-300 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <div className={`text-[10px] font-mono shrink-0 px-2 py-0.5 rounded-md ${
                            isActive ? 'bg-[#dfc29a] text-[#2c1d11] font-bold' : 'bg-white/5 text-stone-500'
                          }`}>
                            {formatTime(seg.time)}
                          </div>
                          <div className="space-y-1 flex-grow">
                            {(translationLang === 'lukenye' || translationLang === 'both') && (
                              <p className={`text-sm leading-relaxed ${isActive ? 'font-serif font-bold text-[#dfc29a]' : 'font-serif text-stone-200'}`}>
                                {seg.textLukenye}
                              </p>
                            )}
                            {(translationLang === 'english' || translationLang === 'both') && (
                              <p className={`text-xs leading-relaxed ${isActive ? 'text-white font-medium' : 'text-stone-400'}`}>
                                {seg.textEnglish}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>

            {/* RIGHT COLUMN: RELEVANT STORY PLAYLIST */}
            <div className="lg:col-span-5 flex flex-col space-y-6">
              
              <div className="bg-[#2c1d11] rounded-[40px] p-6 sm:p-8 border border-white/10 flex flex-col justify-between h-full">
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
                    <div className="flex items-center space-x-2 text-[#dfc29a]">
                      <ListMusic className="w-5 h-5 text-[#c2593f]" />
                      <span className="text-xs font-black uppercase tracking-widest">Exhibition playlist</span>
                    </div>
                    <span className="text-xs text-stone-400 font-mono font-bold">
                      {filteredPlaylist.length} audio tapes
                    </span>
                  </div>

                  {/* Playlist Search input */}
                  <div className="relative shrink-0">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <input 
                      type="text"
                      placeholder="Search tapes, speakers..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-black/20 border border-white/10 rounded-2xl pl-10 pr-4 py-3 text-xs text-white placeholder-stone-500 outline-none focus:border-[#c2593f]"
                    />
                  </div>

                  {/* Playlist scroll tracks */}
                  <div className="overflow-y-auto max-h-[400px] pr-2 space-y-3 mt-6 scrollbar-thin scrollbar-thumb-white/10 text-left">
                    {filteredPlaylist.length === 0 ? (
                      <div className="text-center py-12 text-stone-500">
                        <p className="text-xs">No tapes found matching your request.</p>
                      </div>
                    ) : (
                      filteredPlaylist.map((track) => {
                        const isSelected = currentTrack && currentTrack.id === track.id;
                        const masterIdx = oralHistoryTracks.findIndex(t => t.id === track.id);
                        return (
                          <div 
                            key={track.id}
                            onClick={() => {
                              setActiveTrackIndex(masterIdx);
                              if (!isPlaying) setIsPlaying(true);
                            }}
                            className={`p-4 rounded-[20px] cursor-pointer transition-all duration-300 border text-left flex items-center gap-4 group/item ${
                              isSelected 
                                ? 'bg-[#c2593f] text-white border-[#dfc29a] shadow-lg scale-[1.01]' 
                                : 'bg-white/5 border-white/5 text-white hover:bg-white/10 hover:border-white/10'
                            }`}
                          >
                            <div className="relative shrink-0 w-12 h-12 rounded-xl overflow-hidden shadow-md">
                              <img 
                                src={track.imageUrl} 
                                alt={track.elder} 
                                className="w-full h-full object-cover transition-transform group-hover/item:scale-105"
                              />
                              <div className={`absolute inset-0 bg-black/30 flex items-center justify-center transition-all ${
                                isSelected ? 'opacity-100 bg-[#c2593f]/40' : 'opacity-0 group-hover/item:opacity-100'
                              }`}>
                                {isSelected && isPlaying ? (
                                  <Pause className="w-4 h-4 text-white fill-white animate-pulse" />
                                ) : (
                                  <Play className="w-4 h-4 text-white fill-white" />
                                )}
                              </div>
                            </div>

                            <div className="flex-grow min-w-0">
                              <div className="flex items-center justify-between mb-0.5">
                                <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                                  isSelected ? 'bg-white/20 text-white' : 'bg-[#dfc29a]/20 text-[#dfc29a]'
                                }`}>
                                  {track.topic}
                                </span>
                                <span className="text-[10px] text-stone-400 font-mono">{track.duration}</span>
                              </div>
                              <h4 className="text-sm font-serif font-bold truncate">
                                {track.title}
                              </h4>
                              <p className={`text-xs truncate ${isSelected ? 'text-[#dfc29a] font-semibold' : 'text-stone-400'}`}>
                                {track.elder} <span className="opacity-40">•</span> {track.clan}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="pt-6 border-t border-white/10 mt-6 shrink-0 flex items-center justify-between text-xs text-stone-400 font-medium">
                  <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#dfc29a] opacity-75 animate-duration-1000" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#dfc29a]" />
                    </span>
                    <span>Broadcasting Preservations</span>
                  </div>
                  <span className="text-[#dfc29a]/60">Bakenyi Archive Office</span>
                </div>

              </div>

            </div>

          </div>

        </div>
      </section>

      {/* 6. Historical Documents Section */}
      <section id="historical-documents" className="py-24 bg-[#fbf9f4] border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-[#c2593f]/10 border border-[#c2593f]/20 text-[#c2593f] rounded-full text-[10px] font-black uppercase tracking-wider">
              <FileText className="w-3.5 h-3.5" />
              <span>Chamber of Manuscripts</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-serif font-black text-[#2c1d11] tracking-tight">Preserved Documents</h2>
            <p className="text-stone-600 text-sm md:text-base leading-relaxed font-medium">
              Examine transcribes, colonial survey papers, structural maps, and grammatical registers certified by our heritage council experts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {HISTORICAL_DOCUMENTS.map((doc) => (
              <motion.div 
                key={doc.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-white border border-stone-200 rounded-[28px] p-6 hover:border-[#c2593f]/40 hover:shadow-xl transition-all flex flex-col justify-between text-left h-full group"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                    <span className="text-[9px] font-black uppercase tracking-wider text-[#c2593f] bg-[#c2593f]/10 px-2 py-0.5 rounded-md">
                      {doc.category}
                    </span>
                    <span className="text-[10px] text-stone-400 font-mono font-bold">
                      {doc.date}
                    </span>
                  </div>

                  <h3 className="text-base font-serif font-black leading-snug text-[#2c1d11] group-hover:text-[#c2593f] transition-colors line-clamp-2">
                    {doc.title}
                  </h3>
                  
                  <p className="text-xs text-stone-500 font-sans leading-relaxed line-clamp-4">
                    {doc.excerpt}
                  </p>

                  <p className="text-[10px] font-medium text-stone-400">
                    By: <span className="text-stone-600 font-semibold">{doc.author}</span>
                  </p>
                </div>

                <div className="pt-4 mt-6 border-t border-stone-100 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-stone-400 font-bold">
                    {doc.downloadSize} File
                  </span>
                  {doc.permitted ? (
                    <button 
                      onClick={() => alert(`Beginning secure download of "${doc.title}"...`)}
                      className="px-3.5 py-1.5 bg-[#c2593f] hover:bg-[#2c1d11] text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all flex items-center gap-1 cursor-pointer shadow-md"
                      title="Download Certified PDF"
                    >
                      <Download className="w-3 h-3" />
                      <span>Examine</span>
                    </button>
                  ) : (
                    <span className="text-[9px] font-black uppercase tracking-wider text-stone-400 bg-stone-100 px-2.5 py-1.5 rounded-xl border border-stone-200">
                      Restricted Access
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

        </div>
      </section>

      {/* Featured Quote Section */}
      <section className="py-24 bg-[#2c1d11] text-white border-b border-stone-950 relative">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <BookOpen className="w-12 h-12 text-[#dfc29a]/30 mx-auto mb-8" />
          <h2 className="text-2xl font-serif font-bold text-white mb-6">Historical Challenges</h2>
          <p className="text-[#dfc29a] leading-relaxed mb-8 text-base md:text-lg italic font-light">
            "Through climatic shifts that affected the water levels of Lake Kyoga and the political changes of various Ugandan empires, the Bakenyi maintained a distinct identity by keeping their language and clan systems alive despite being small in number."
          </p>
          <div className="w-16 h-0.5 bg-[#c2593f] mx-auto" />
        </div>
      </section>

      {/* 8. Continue Exploring Footer Directory */}
      <section className="py-24 bg-[#fcfaf7]">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h3 className="text-2xl sm:text-4xl font-serif font-black text-[#2c1d11]">Continue Exploring the Platform</h3>
            <p className="text-stone-500 text-sm leading-relaxed">
              Continue your walkthrough journey across other sectors of Bakenyi cultural databases.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <Link to="/clans" className="group">
              <div className="bg-white border border-stone-200 p-6 rounded-[32px] text-left space-y-4 hover:border-[#c2593f]/40 hover:shadow-xl transition-all h-full flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#c2593f]/10 flex items-center justify-center text-[#c2593f]">
                    <Globe className="w-5 h-5" />
                  </div>
                  <h4 className="text-lg font-serif font-black text-[#2c1d11] group-hover:text-[#c2593f] transition-colors">Water-Based Clans</h4>
                  <p className="text-xs text-stone-500 leading-relaxed font-sans">
                    Inspect the registered lineages, mottos, and sacred aquatic totems of the Bakenyi people.
                  </p>
                </div>
                <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-[#c2593f] group-hover:gap-2 transition-all pt-2">
                  <span>Explore Clans</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </Link>

            <Link to="/leadership" className="group">
              <div className="bg-white border border-stone-200 p-6 rounded-[32px] text-left space-y-4 hover:border-[#c2593f]/40 hover:shadow-xl transition-all h-full flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#c2593f]/10 flex items-center justify-center text-[#c2593f]">
                    <User className="w-5 h-5" />
                  </div>
                  <h4 className="text-lg font-serif font-black text-[#2c1d11] group-hover:text-[#c2593f] transition-colors">Elder Councils</h4>
                  <p className="text-xs text-stone-500 leading-relaxed font-sans">
                    Read biography profiles of historical lineage chiefs and active community custodians.
                  </p>
                </div>
                <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-[#c2593f] group-hover:gap-2 transition-all pt-2">
                  <span>Explore Councils</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </Link>

            <Link to="/language" className="group">
              <div className="bg-white border border-stone-200 p-6 rounded-[32px] text-left space-y-4 hover:border-[#c2593f]/40 hover:shadow-xl transition-all h-full flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#c2593f]/10 flex items-center justify-center text-[#c2593f]">
                    <Languages className="w-5 h-5" />
                  </div>
                  <h4 className="text-lg font-serif font-black text-[#2c1d11] group-hover:text-[#c2593f] transition-colors">Lukenye Glossary</h4>
                  <p className="text-xs text-stone-500 leading-relaxed font-sans">
                    Study the dictionary codes, maritime verbs, and phonological terms of our Bantu dialect.
                  </p>
                </div>
                <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-[#c2593f] group-hover:gap-2 transition-all pt-2">
                  <span>Study Glossary</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </Link>

            <Link to="/gallery" className="group">
              <div className="bg-white border border-stone-200 p-6 rounded-[32px] text-left space-y-4 hover:border-[#c2593f]/40 hover:shadow-xl transition-all h-full flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#c2593f]/10 flex items-center justify-center text-[#c2593f]">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h4 className="text-lg font-serif font-black text-[#2c1d11] group-hover:text-[#c2593f] transition-colors">Museum Gallery</h4>
                  <p className="text-xs text-stone-500 leading-relaxed font-sans">
                    View photographic layouts of dugout crafts, ancient ritual drums, and wetland shore vistas.
                  </p>
                </div>
                <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-[#c2593f] group-hover:gap-2 transition-all pt-2">
                  <span>View Photos</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </Link>
          </div>

        </div>
      </section>

      {/* DETAILED HISTORICAL NARRATIVE EXPANDED MODAL */}
      <AnimatePresence>
        {selectedEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            {/* Backdrop overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedEvent(null)}
              className="fixed inset-0 bg-stone-950/80 backdrop-blur-md"
            />

            {/* Modal Body container */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="bg-[#fcfaf7] w-full max-w-4xl rounded-[36px] border border-stone-200 shadow-2xl relative overflow-hidden z-10 max-h-[90vh] flex flex-col md:flex-row text-left"
            >
              {/* Close Floating button */}
              <button 
                onClick={() => setSelectedEvent(null)}
                className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-md transition-all active:scale-95 cursor-pointer border border-white/10"
                title="Close overlay"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Graphic Cover Column */}
              <div className="md:w-[42%] relative h-60 md:h-auto shrink-0 border-r border-stone-200/40">
                <img 
                  src={selectedEvent.image} 
                  alt={selectedEvent.title} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black/80 md:from-transparent via-transparent to-transparent pointer-events-none" />
                
                <div className="absolute bottom-6 left-6 right-6 text-white md:hidden space-y-2">
                  <span className="px-3 py-1 bg-[#c2593f] text-white rounded-full text-xs font-black uppercase tracking-wider">
                    {selectedEvent.period}
                  </span>
                  <h3 className="text-xl font-serif font-black text-white">{selectedEvent.title}</h3>
                </div>
              </div>

              {/* Content text Scrollable Column */}
              <div className="md:w-[58%] p-6 sm:p-10 overflow-y-auto max-h-[60vh] md:max-h-[90vh] flex flex-col justify-between scrollbar-thin space-y-6">
                <div className="space-y-6">
                  {/* Top info tags */}
                  <div className="hidden md:flex items-center justify-between pb-4 border-b border-stone-200/40">
                    <span className="text-xs font-black text-white bg-[#c2593f] px-3.5 py-1 rounded-full uppercase tracking-wider">
                      {selectedEvent.period}
                    </span>
                    <span className="text-xs font-black uppercase tracking-widest text-[#c2593f] bg-[#c2593f]/10 px-3 py-1 rounded-md">
                      {selectedEvent.category} Era
                    </span>
                  </div>

                  {/* Title */}
                  <div className="hidden md:block">
                    <h3 className="text-2xl sm:text-3xl font-serif font-black text-[#2c1d11] leading-tight">
                      {selectedEvent.title}
                    </h3>
                    <p className="text-xs text-stone-400 font-bold flex items-center mt-2 uppercase tracking-wider">
                      <MapPin className="w-4 h-4 mr-1 text-[#c2593f]" />
                      Location: <span className="text-stone-600 ml-1">{selectedEvent.location}</span>
                    </p>
                  </div>

                  {/* Narratives */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono font-black uppercase tracking-widest text-stone-400 block">Exhibition Narrative Logs</span>
                    <p className="text-sm text-stone-600 leading-relaxed">
                      {selectedEvent.detailedDesc}
                    </p>
                  </div>

                  {/* Quote block */}
                  {selectedEvent.elderQuote && (
                    <div className="bg-[#c2593f]/5 border-l-4 border-[#c2593f] p-5 rounded-2xl italic text-sm text-stone-600 leading-relaxed">
                      {selectedEvent.elderQuote}
                    </div>
                  )}

                  {/* Badges */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono font-black uppercase tracking-widest text-stone-400 block">Lineages & Leaders Involved</span>
                    <div className="flex flex-wrap gap-2">
                      {selectedEvent.relatedClans.map(clanName => (
                        <span key={clanName} className="bg-stone-100 border border-stone-200 px-3 py-1 rounded-full text-xs font-bold text-[#2c1d11]">
                          {clanName} Clan
                        </span>
                      ))}
                      {selectedEvent.relatedLeaders.map(leaderName => (
                        <span key={leaderName} className="bg-stone-100 border border-stone-200 px-3 py-1 rounded-full text-xs font-bold text-stone-600 italic">
                          {leaderName}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer and play actions */}
                <div className="pt-6 border-t border-stone-200/40 flex flex-wrap items-center justify-between gap-4 shrink-0">
                  <span className="text-[10px] text-stone-400 flex items-center font-bold">
                    <BookOpen className="w-4 h-4 mr-1.5 text-[#c2593f]/60" />
                    Transcribed by Eldership Councils
                  </span>

                  {selectedEvent.relatedTrackId ? (
                    <button 
                      onClick={() => {
                        handleSelectOralTrack(selectedEvent.relatedTrackId!);
                        setSelectedEvent(null);
                      }}
                      className="px-4 py-2 bg-[#c2593f] hover:bg-[#2c1d11] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                    >
                      <Volume2 className="w-4 h-4 animate-pulse" />
                      <span>Hear Oral Account</span>
                    </button>
                  ) : (
                    <span className="text-[10px] text-stone-400 italic">No corresponding audio track</span>
                  )}
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
