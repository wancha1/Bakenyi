import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  MapPin, 
  Clock, 
  BookOpen, 
  Mic, 
  Tag, 
  AlertCircle, 
  Play, 
  Pause, 
  Volume2, 
  Globe, 
  Award, 
  Layers, 
  Share2, 
  FileText,
  VolumeX,
  Volume1,
  ChevronRight,
  Bookmark,
  Facebook,
  Send,
  MessageSquare,
  Check,
  Globe as GlobeIcon
} from 'lucide-react';
import { getSupabase } from '../lib/supabaseClient';
import { getArticleById, getClans, getLeaders, getArticles } from '../lib/supabase';
import { getNews, getEvents } from '../lib/heritageService';
import SEO from '../components/SEO';

interface ContentDetailProps {
  defaultType?: 'article' | 'clan' | 'leader' | 'oral-history' | 'timeline' | 'news' | 'event';
}

export default function ContentDetail({ defaultType }: ContentDetailProps) {
  const { type: pathType, id } = useParams<{ type?: string; id: string }>();
  const navigate = useNavigate();

  const contentType = defaultType || (pathType as any) || 'article';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any | null>(null);
  const [related, setRelated] = useState<any[]>([]);

  // Share States
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [shareToast, setShareToast] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setShareToast('Link copied to clipboard!');
    setTimeout(() => {
      setCopied(false);
      setShareToast(null);
    }, 3000);
  };

  const handleShareClick = () => {
    const shareTitle = data ? (data.title || data.name || 'Bakenyi Heritage Archive') : 'Bakenyi Heritage Archive';
    const shareDesc = data ? (data.summary || data.bio || data.description || 'Exploring Bakenyi cultural registry records.') : 'Exploring Bakenyi cultural registry records.';
    const shareUrl = window.location.href;

    if (navigator.share) {
      navigator.share({
        title: shareTitle,
        text: shareDesc,
        url: shareUrl
      }).then(() => {
        setShareToast('Shared successfully!');
        setTimeout(() => setShareToast(null), 3000);
      }).catch((err) => {
        console.warn('Native share failed or dismissed:', err);
        setIsShareOpen(true);
      });
    } else {
      setIsShareOpen(true);
    }
  };

  // Audio Player states for Oral History
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  // Load Main Content and Related items
  useEffect(() => {
    if (!id) {
      setError('Invalid Content ID requested.');
      setLoading(false);
      return;
    }

    async function loadContent() {
      setLoading(true);
      setError(null);
      const client = getSupabase();

      try {
        if (contentType === 'article') {
          let article = await getArticleById(id);
          if (!article && id === 'legends-of-ebiswa-fallback-id') {
            const allArticles = await getArticles(false);
            article = allArticles.find(a => a.title?.toLowerCase().includes('ebiswa')) || allArticles[0] || {
              id: 'legends-of-ebiswa-fallback-id',
              title: 'The Legends of the Ebiswa',
              excerpt: 'Ancient accounts of the floating reed islands of Lake Kyoga which served as temporary mobile settlements during periods of regional migration.',
              content: `The waters of Lake Kyoga have served as the lifeforce and adaptive platform of the Bakenyi clans for centuries. Unlike agricultural communities settled firmly on territorial shorelines, the early Bakenyi engineered a migratory canoe economy centered on floating islands (known natively as Ebiswa).

### The Engineering of Ebiswa
These floating islands are not merely natural accidents, but carefully managed root ecosystems. Over generations, craftsmen bound together living papyrus reed rootbeds, creating stable, buoyant, and transportable surfaces. Entire families constructed temporary houses on these beds, drifting with the currents to optimize fishing spots and avoid regional conflicts.

### Traditional Canoe Navigation
Crafting the vessel requires selection of durable native timber like the mahogany variants found along the riparian valleys. Using hand-hewn adzes, carvers hollow the trunk before sealing seams with wild papyrus fiber and tree resin sealants.

### Modern Language Preservation
Preserving the original Lukenye nouns for these natural elements is critical. The word "Amanzi" carries heavy spiritual gravity, referencing the aquatic sanctuary that provided safety from regional wars. Under modern platforms, the preservation of vocabulary keeps these ancient lifeways accessible to the younger generation.`,
              category: 'History',
              imageUrl: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&q=80&w=800',
              author: 'Elder Christopher Kyega',
              publishedAt: new Date().toISOString()
            };
          }

          if (article) {
            setData(article);
          } else {
            // Fallback direct query
            if (client) {
              const { data: directArt } = await client.from('heritage_articles').select('*').eq('id', id).maybeSingle();
              if (directArt) {
                setData({
                  id: directArt.id,
                  title: directArt.title,
                  summary: directArt.summary,
                  content: directArt.content,
                  category: directArt.category || 'Culture',
                  coverImage: directArt.cover_image,
                  author: directArt.author_name || 'Bakenyi Scribe',
                  publishedAt: directArt.published_at || directArt.created_at
                });
              } else {
                setError('Heritage article not found.');
              }
            } else {
              setError('Heritage article not found.');
            }
          }
        } 
        
        else if (contentType === 'clan') {
          const clansList = await getClans();
          let clanItem = clansList.find(c => c.id === id || c.name.toLowerCase().replace(/\s+/g, '-') === id);
          if (!clanItem && id === 'baise-mugaya-clan-fallback-id') {
            clanItem = clansList.find(c => c.name?.toLowerCase().includes('baise-mugaya')) || clansList[0] || {
              id: 'baise-mugaya-clan-fallback-id',
              name: 'Baise-Mugaya Clan', 
              totem: 'Crested Crane (Nnali)', 
              desc: 'Traditionally serving as the navigators and high canoe crafters of Lake Kyoga, steering communities across the waters.',
              status: 'approved',
              motto: 'Navigators of the Great Reed Basins',
              history: 'The Baise-Mugaya clan has historically held the sacred duty of building and maintaining canoes for regional lake travel. Their master shipwrights were consulted by neighboring communities for their advanced understanding of buoyancy and structural wood durability.'
            };
          }

          if (clanItem) {
            setData(clanItem);
            // Related content: other clans
            setRelated(clansList.filter(c => c.id !== clanItem.id).slice(0, 3));
          } else {
            setError('Clan registry record not found.');
          }
        } 
        
        else if (contentType === 'leader') {
          const leadersList = await getLeaders(false);
          let leaderItem = leadersList.find(l => l.id === id || l.name.toLowerCase().replace(/\s+/g, '-') === id);
          if (!leaderItem && id === 'elder-christopher-kyega-fallback-id') {
            leaderItem = leadersList.find(l => l.name?.toLowerCase().includes('christopher')) || leadersList[0] || {
              id: 'elder-christopher-kyega-fallback-id',
              name: 'Elder Christopher Kyega', 
              role: 'Chief Historian & Story Keeper (92 years)', 
              bio: 'Possesses direct oral line coordinates of the 17th-century migrations of the Bakenyi riverine communities. Mzee Christopher is highly revered across Namasale, Kadungulu, and Paliisa districts as one of the last keepers of the original paddle chants.',
              status: 'approved'
            };
          }

          if (leaderItem) {
            setData(leaderItem);
            // Related content: other leaders
            setRelated(leadersList.filter(l => l.id !== leaderItem.id).slice(0, 3));
          } else {
            setError('Council leader record not found.');
          }
        } 
        
        else if (contentType === 'oral-history') {
          let matchedHistory = null;
          if (client) {
            const { data: track, error: trackErr } = await client.from('oral_history').select('*').eq('id', id).maybeSingle();
            if (!trackErr && track) {
              matchedHistory = {
                id: String(track.id),
                title: track.title || 'Oral Narrative',
                elder: track.elder || track.narrator || 'Elder Storyteller',
                clan: track.clan || 'Baise-Mugaya',
                role: track.role || 'Traditional Custodian',
                topic: track.topic || 'Tradition',
                duration: track.duration || '2:30',
                imageUrl: track.image_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300',
                audioUrl: track.audio_url || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
                recordingDate: track.recording_date || 'September 2023',
                transcription: Array.isArray(track.transcription) ? track.transcription : []
              };
            }
          }

          if (!matchedHistory) {
            const storedHistory = JSON.parse(localStorage.getItem('bakenye_oral_histories') || '[]');
            matchedHistory = storedHistory.find((h: any) => h.id === id);
          }

          if (!matchedHistory && id === 'legends-of-ebiswa-fallback-id') {
            matchedHistory = {
              id: 'legends-of-ebiswa-fallback-id',
              title: 'The Legends of the Ebiswa',
              elder: 'Elder Christopher Kyega',
              clan: 'Baise-Mugaya',
              role: 'Chief Historian',
              topic: 'Tradition',
              duration: '4:15',
              imageUrl: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&q=80&w=300',
              audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
              recordingDate: 'September 2023',
              transcription: [
                { time: '0:00', text: 'Greeting to the descendants of Lake Kyoga. I am Christopher Kyega, speaking to you from Kadungulu.' },
                { time: '0:30', text: 'The floating islands we call Ebiswa were our sanctuaries during migrations. They allowed us to move without leaving our homes.' },
                { time: '1:15', text: 'We bound the papyrus roots together to create stable, buoyant, and transportable surfaces.' },
                { time: '2:00', text: 'Our children must learn how these islands drift, and how the original Lukenye nouns connect us to the waters.' }
              ]
            };
          }

          if (matchedHistory) {
            setData(matchedHistory);
          } else {
            setError('Oral History record not found.');
          }
        } 
        
        else if (contentType === 'timeline') {
          if (client) {
            const { data: timelineItem } = await client.from('timeline_events').select('*').eq('id', id).maybeSingle();
            if (timelineItem) {
              setData({
                id: timelineItem.id,
                title: timelineItem.title,
                period: timelineItem.period || timelineItem.year,
                desc: timelineItem.desc || timelineItem.description,
                category: timelineItem.category || 'Historical Timeline'
              });
            } else {
              setError('Timeline event not found.');
            }
          } else {
            setError('Supabase client offline. Timeline event not accessible.');
          }
        } 
        
        else if (contentType === 'news') {
          const newsList = await getNews(true);
          const newsItem = newsList.find(n => n.id === id || n.slug === id);
          if (newsItem) {
            setData(newsItem);
            setRelated(newsList.filter(n => n.id !== newsItem.id).slice(0, 3));
          } else {
            setError('News dispatch record not found.');
          }
        } 
        
        else if (contentType === 'event') {
          const eventsList = await getEvents(false);
          const eventItem = eventsList.find(e => e.id === id);
          if (eventItem) {
            setData(eventItem);
            setRelated(eventsList.filter(e => e.id !== eventItem.id).slice(0, 3));
          } else {
            setError('Community Assembly event not found.');
          }
        }

      } catch (err: any) {
        console.error('Error fetching content details:', err);
        setError('Failed to query record from the secure database.');
      } finally {
        setLoading(false);
      }
    }

    loadContent();
  }, [contentType, id]);

  // Audio progress hook
  useEffect(() => {
    if (!audioRef.current) return;
    const audio = audioRef.current;

    const updateProgress = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [data]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(e => console.error('Audio play failed:', e));
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const seekValue = parseFloat(e.target.value);
    audioRef.current.currentTime = seekValue;
    setCurrentTime(seekValue);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const formatTime = (secs: number) => {
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  if (loading) {
    return (
      <div className="w-full min-h-[60vh] flex flex-col items-center justify-center py-24 px-4 bg-heritage-cream text-heritage-ink">
        <div className="w-14 h-14 rounded-full border-4 border-heritage-terracotta/20 border-t-heritage-terracotta animate-spin mb-4" />
        <p className="text-xs font-black uppercase tracking-widest text-heritage-brown/60">
          Accessing Ancestral Archives...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-xl mx-auto px-6 py-20 text-center">
        <div className="w-16 h-16 bg-rose-100 dark:bg-rose-950/30 rounded-full flex items-center justify-center mx-auto mb-6 border border-rose-200">
          <AlertCircle className="w-8 h-8 text-rose-600" />
        </div>
        <h2 className="font-serif font-black text-2xl text-heritage-brown dark:text-white mb-3">
          Chronicle Not Unveiled
        </h2>
        <p className="text-sm text-heritage-brown/60 dark:text-stone-400 mb-8 font-medium">
          {error || 'This record does not exist or may have been restricted under regional publication rules.'}
        </p>
        <div className="flex justify-center gap-4">
          <button 
            onClick={() => navigate(-1)} 
            className="px-5 py-3 bg-heritage-brown/10 hover:bg-heritage-brown/20 text-heritage-brown dark:text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer"
          >
            Go Back
          </button>
          <Link 
            to="/" 
            className="px-5 py-3 bg-heritage-terracotta hover:bg-heritage-brown text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer shadow-md"
          >
            Home Sanctuary
          </Link>
        </div>
      </div>
    );
  }

  // Define dynamic metadata title based on type
  const typeTitles: Record<string, string> = {
    article: 'Heritage Chronicles',
    clan: 'Clan Lineages',
    leader: 'Elder Council',
    'oral-history': 'Oral Traditions',
    timeline: 'Epoch Timeline',
    news: 'Platform Dispatches',
    event: 'Community Assembly'
  };

  return (
    <div className="w-full min-h-screen bg-heritage-cream dark:bg-stone-950 text-heritage-ink dark:text-stone-100 py-12 px-4 sm:px-6 lg:px-8 relative">
      <SEO 
        title={`${data.title || data.name} - Bakenyi Heritage`} 
        description={data.summary || data.bio || data.description || 'Exploring Bakenyi cultural registry records.'} 
      />

      <div className="max-w-4xl mx-auto">
        
        {/* Navigation Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-heritage-brown/60 dark:text-stone-400 hover:text-heritage-terracotta transition-all cursor-pointer text-left"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Chronicles</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={handleShareClick}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-heritage-terracotta text-white rounded-full text-[10px] font-black uppercase tracking-wider transition-all hover:bg-heritage-brown shadow-sm cursor-pointer"
              title="Share this certified cultural curation"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share Archive</span>
            </button>

            <span className="px-3 py-1.5 bg-heritage-brown/5 dark:bg-stone-900 border border-heritage-brown/10 rounded-full text-[10px] font-black uppercase tracking-wider text-heritage-brown dark:text-heritage-sand">
              {typeTitles[contentType] || 'Heritage Record'}
            </span>
          </div>
        </div>

        {/* CONTENT RENDERING SCHEMAS */}

        {/* SCHEMA 1: HERITAGE ARTICLE / NEWS */}
        {(contentType === 'article' || contentType === 'news') && (
          <article className="space-y-8 text-left">
            {data.coverImage || data.cover_image ? (
              <div className="w-full h-80 sm:h-[400px] rounded-3xl overflow-hidden shadow-md relative">
                <img 
                  src={data.coverImage || data.cover_image} 
                  alt={data.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-transparent to-transparent" />
              </div>
            ) : null}

            <div className="space-y-4">
              <h1 className="font-serif font-black text-3xl sm:text-4xl text-heritage-brown dark:text-white leading-tight">
                {data.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-heritage-brown/60 dark:text-stone-400 pt-2 border-b border-heritage-brown/5 pb-4">
                <div className="flex items-center gap-1.5">
                  <User className="w-4 h-4 text-heritage-terracotta" />
                  <span>By {data.author || 'Cultural Custodian'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-heritage-olive" />
                  <span>{new Date(data.publishedAt || data.published_at || data.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
                {data.category && (
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-amber-600" />
                    <span>{data.category}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Main content body */}
            <div className="prose prose-stone dark:prose-invert max-w-none text-sm sm:text-base leading-relaxed text-heritage-brown/90 dark:text-stone-200 space-y-6">
              {data.summary && (
                <p className="font-serif text-lg italic text-heritage-brown/80 dark:text-stone-300 border-l-4 border-heritage-terracotta pl-4 py-1">
                  {data.summary}
                </p>
              )}
              <div className="whitespace-pre-line">
                {data.content}
              </div>
            </div>

            {/* Tags footer */}
            {data.tags && data.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-6 border-t border-heritage-brown/5">
                {data.tags.map((tag: string, idx: number) => (
                  <span key={idx} className="px-2.5 py-1 bg-heritage-cream dark:bg-stone-900 border border-heritage-brown/10 rounded-lg text-[10px] font-bold text-heritage-brown/70 dark:text-stone-400">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </article>
        )}

        {/* SCHEMA 2: CLAN LORE */}
        {contentType === 'clan' && (
          <div className="space-y-8 text-left">
            <div className="p-8 bg-white dark:bg-stone-900 border border-heritage-brown/10 rounded-3xl relative overflow-hidden shadow-sm">
              <div className="absolute top-0 inset-x-0 h-2 bg-heritage-terracotta" />
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h1 className="font-serif font-black text-3xl text-heritage-brown dark:text-white">
                    {data.name} Clan
                  </h1>
                  <p className="text-xs text-heritage-brown/60 dark:text-stone-400 mt-1 font-bold">
                    Primary Totem: <strong className="text-heritage-terracotta uppercase">{data.totem}</strong>
                  </p>
                </div>
                
                <div className="px-4 py-2 bg-heritage-olive/10 border border-heritage-olive/20 rounded-xl">
                  <span className="text-[10px] font-black uppercase text-heritage-olive block tracking-wider">Estimated Population</span>
                  <span className="text-sm font-black text-heritage-brown dark:text-white mt-0.5 block">{data.population || 'Regional'}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 pt-6 border-t border-heritage-brown/5">
                <div className="p-4 bg-heritage-cream dark:bg-stone-950 rounded-2xl">
                  <span className="text-[10px] font-black uppercase text-heritage-brown/40 block">Origin Region / Headquarters</span>
                  <span className="text-xs font-black text-heritage-brown dark:text-stone-200 mt-1 block flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-heritage-terracotta shrink-0" />
                    <span>{data.headquarters || 'Lake Kyoga Basin'}</span>
                  </span>
                </div>
                <div className="p-4 bg-heritage-cream dark:bg-stone-950 rounded-2xl">
                  <span className="text-[10px] font-black uppercase text-heritage-brown/40 block">Leader Representative</span>
                  <span className="text-xs font-black text-heritage-brown dark:text-stone-200 mt-1 block flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-heritage-olive shrink-0" />
                    <span>{data.leader || 'Council Representative'}</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h2 className="font-serif font-black text-xl text-heritage-brown dark:text-white">
                Historical Clan Narratives & Lore
              </h2>
              <div className="whitespace-pre-line text-sm sm:text-base leading-relaxed text-heritage-brown/90 dark:text-stone-200 bg-white dark:bg-stone-900 border border-heritage-brown/10 p-6 rounded-3xl shadow-sm">
                {data.description || 'This clan plays a key role in maritime council networks and environmental preservation around floating marshes.'}
              </div>
            </div>
          </div>
        )}

        {/* SCHEMA 3: LEADER BIOGRAPHY - MUSEUM EXHIBITION REDESIGN */}
        {contentType === 'leader' && (
          <div className="space-y-12 text-left">
            {/* Museum Exhibition Header Plaque */}
            <div className="relative bg-white dark:bg-stone-900 border-2 border-heritage-brown/15 dark:border-stone-800 rounded-[32px] p-8 md:p-12 shadow-xl overflow-hidden flex flex-col lg:flex-row gap-10 items-center">
              {/* Cultural pattern background overlay */}
              <div className="absolute inset-0 cultural-pattern opacity-5 pointer-events-none" />
              <div className="absolute top-0 right-0 w-32 h-32 bg-heritage-terracotta/10 rounded-full blur-2xl pointer-events-none" />
              
              {/* Museum Asymmetric Frame */}
              <div className="relative shrink-0 mx-auto lg:mx-0">
                <div className="absolute inset-0 bg-heritage-terracotta rounded-3xl rotate-3 scale-[1.02] opacity-20 transition-transform group-hover:rotate-6" />
                <div className="w-56 h-56 md:w-64 md:h-64 rounded-2xl overflow-hidden border-8 border-heritage-cream dark:border-stone-950 shadow-2xl relative z-10 bg-heritage-brown/15 flex items-center justify-center">
                  {data.photo_url ? (
                    <img src={data.photo_url} alt={data.name} className="w-full h-full object-cover grayscale-[25%] hover:grayscale-0 transition-all duration-500" />
                  ) : (
                    <User className="w-24 h-24 text-heritage-brown/20" />
                  )}
                </div>
                {/* Official Exhibit Placard Tag */}
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-stone-950 text-heritage-sand text-[9px] font-mono uppercase tracking-[0.25em] py-1.5 px-4 rounded-md shadow-lg z-20 whitespace-nowrap border border-stone-800">
                  Exhibit Ref: ELD-{data.id?.substring(0, 4).toUpperCase() || 'CORE'}
                </div>
              </div>

              {/* Leader Details Panel */}
              <div className="flex-1 space-y-6 relative z-10 text-center lg:text-left">
                <div>
                  <span className="text-[10px] font-sans font-black uppercase tracking-widest text-heritage-terracotta bg-heritage-terracotta/10 px-3.5 py-1.5 rounded-full inline-block mb-3">
                    {data.role || 'Council Custodian'}
                  </span>
                  <h1 className="font-serif font-black text-3xl md:text-5xl text-heritage-brown dark:text-white tracking-tight leading-tight">
                    {data.name}
                  </h1>
                  <p className="text-xs font-mono font-bold text-heritage-olive uppercase tracking-[0.2em] mt-2">
                    Authorized Traditional Representative
                  </p>
                </div>

                {/* Info badge cluster */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto lg:mx-0">
                  <div className="p-4 bg-heritage-cream/50 dark:bg-stone-950 rounded-2xl border border-heritage-brown/5 flex items-center gap-3">
                    <div className="p-2 bg-heritage-terracotta/10 rounded-xl">
                      <Layers className="w-5 h-5 text-heritage-terracotta" />
                    </div>
                    <div className="text-left">
                      <span className="text-[9px] font-black uppercase text-heritage-brown/40 dark:text-stone-500 block">Clan Lineage</span>
                      <strong className="text-sm text-heritage-brown dark:text-stone-200 block">{data.clan || 'Baise-Mugaya'}</strong>
                    </div>
                  </div>

                  <div className="p-4 bg-heritage-cream/50 dark:bg-stone-950 rounded-2xl border border-heritage-brown/5 flex items-center gap-3">
                    <div className="p-2 bg-amber-500/10 rounded-xl">
                      <Award className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="text-left">
                      <span className="text-[9px] font-black uppercase text-heritage-brown/40 dark:text-stone-500 block">Focus & Expertise</span>
                      <strong className="text-sm text-heritage-brown dark:text-stone-200 block">{data.expertise || 'Oral Traditions'}</strong>
                    </div>
                  </div>
                </div>

                {/* Curator Guarantee */}
                <div className="text-xs font-medium text-heritage-brown/60 dark:text-stone-400 border-l-4 border-heritage-terracotta pl-4 italic">
                  "This record is certified by the Bakenye Cultural Committee for accuracy and preservation in the digital national archive."
                </div>
              </div>
            </div>

            {/* Biography & Achievements Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Biography Section */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white dark:bg-stone-900 border border-heritage-brown/10 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
                  <h2 className="font-serif font-black text-2xl text-heritage-brown dark:text-white border-b border-heritage-brown/5 pb-3">
                    Chronicle & Biography
                  </h2>
                  <div className="whitespace-pre-line text-sm sm:text-base leading-relaxed text-heritage-brown/80 dark:text-stone-200 font-medium">
                    {data.bio || 'This honorable custodian is dedicated to preserving the rich oral lineages, linguistic elements, and customary structures of the Bakenye people settling around Lake Kyoga floating islands.'}
                  </div>
                </div>

                {/* Traditional Leadership Oath / Manifesto */}
                <div className="bg-stone-950 text-heritage-sand p-8 rounded-3xl relative overflow-hidden">
                  <div className="absolute inset-0 cultural-pattern opacity-10 pointer-events-none" />
                  <div className="relative z-10 text-center max-w-lg mx-auto space-y-4">
                    <p className="text-sm font-serif italic text-heritage-sand/85">
                      "Traditional guardianship is not a title, but an oath. We serve to build a bridge across epochs, ensuring our children speak Lukenye, understand their totems, and honor our ancestors."
                    </p>
                    <div className="w-10 h-0.5 bg-heritage-terracotta mx-auto" />
                    <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-heritage-terracotta block">The Council Custodian Oath</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Traditional Achievements Timeline */}
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-white dark:bg-stone-900 border border-heritage-brown/10 rounded-3xl p-6 shadow-xs space-y-6">
                  <h3 className="font-serif font-black text-xl text-heritage-brown dark:text-white">
                    Timeline of Custodianship
                  </h3>

                  <div className="relative border-l border-heritage-brown/15 dark:border-stone-800 pl-5 ml-2 space-y-6">
                    {/* Event 1 */}
                    <div className="relative">
                      <span className="absolute -left-[25px] top-1.5 w-2.5 h-2.5 rounded-full bg-heritage-terracotta border-2 border-white dark:border-stone-900" />
                      <span className="text-[10px] font-mono font-bold text-heritage-terracotta block">STAGE 1</span>
                      <strong className="text-xs text-heritage-brown dark:text-stone-200 block mt-0.5">Council Initiation</strong>
                      <p className="text-[11px] text-heritage-brown/60 dark:text-stone-400 mt-1 leading-normal">
                        Appointed as traditional custodian representing the ancestral {data.clan || 'Baise-Mugaya'} lineages.
                      </p>
                    </div>

                    {/* Event 2 */}
                    <div className="relative">
                      <span className="absolute -left-[25px] top-1.5 w-2.5 h-2.5 rounded-full bg-heritage-olive border-2 border-white dark:border-stone-900" />
                      <span className="text-[10px] font-mono font-bold text-heritage-olive block">STAGE 2</span>
                      <strong className="text-xs text-heritage-brown dark:text-stone-200 block mt-0.5">Linguistic Chronicles</strong>
                      <p className="text-[11px] text-heritage-brown/60 dark:text-stone-400 mt-1 leading-normal">
                        Led transcription of native Lukenye dialect terms and verified historical events.
                      </p>
                    </div>

                    {/* Event 3 */}
                    <div className="relative">
                      <span className="absolute -left-[25px] top-1.5 w-2.5 h-2.5 rounded-full bg-amber-500 border-2 border-white dark:border-stone-900" />
                      <span className="text-[10px] font-mono font-bold text-amber-500 block">STAGE 3</span>
                      <strong className="text-xs text-heritage-brown dark:text-stone-200 block mt-0.5">Digital Archive Launch</strong>
                      <p className="text-[11px] text-heritage-brown/60 dark:text-stone-400 mt-1 leading-normal">
                        Supervised digital validation workflows to open Bakenyi archives worldwide.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Clan Lineage Details block */}
                <div className="bg-heritage-cream/40 dark:bg-stone-900/40 border border-heritage-brown/10 rounded-3xl p-6 space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-heritage-brown/50">Ancestral Affiliations</h4>
                  <div className="space-y-3.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-heritage-brown/60">Clan Assembly</span>
                      <span className="font-bold text-heritage-brown dark:text-stone-300">{data.clan || 'Baise-Mugaya'}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-heritage-brown/60">Council Status</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 font-bold text-[9px] uppercase tracking-wider">Approved</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-heritage-brown/60">Traditional Title</span>
                      <span className="font-bold text-heritage-brown dark:text-stone-300">Elder Custodian</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* SCHEMA 4: ORAL HISTORY AUDIO & TRANSCRIPT */}
        {contentType === 'oral-history' && (
          <div className="space-y-8 text-left">
            <div className="bg-white dark:bg-stone-900 border border-heritage-brown/10 rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-2 bg-heritage-terracotta" />
              
              <div className="flex flex-col sm:flex-row gap-6 items-center">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden shadow-md shrink-0">
                  <img src={data.imageUrl} alt={data.title} className="w-full h-full object-cover" />
                </div>

                <div className="flex-1 text-center sm:text-left space-y-2 min-w-0">
                  <span className="text-[10px] font-black uppercase tracking-widest text-heritage-terracotta">
                    Topic: {data.topic}
                  </span>
                  <h1 className="font-serif font-black text-xl sm:text-2xl text-heritage-brown dark:text-white truncate">
                    {data.title}
                  </h1>
                  <p className="text-xs text-heritage-brown/60 dark:text-stone-400 font-bold">
                    Narrated by <strong className="text-heritage-brown dark:text-stone-200">{data.elder}</strong> ({data.role}, {data.clan})
                  </p>
                </div>
              </div>

              {/* Majestic Audio Player Widget */}
              <div className="mt-8 p-4 bg-heritage-cream dark:bg-stone-950 rounded-2xl border border-heritage-brown/5 space-y-4">
                <audio ref={audioRef} src={data.audioUrl} />
                
                <div className="flex items-center justify-between text-[11px] font-bold text-heritage-brown/60 dark:text-stone-400">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration || 150)}</span>
                </div>

                <input 
                  type="range"
                  min="0"
                  max={duration || 150}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full accent-heritage-terracotta h-1.5 bg-heritage-brown/10 rounded-lg cursor-pointer"
                />

                <div className="flex items-center justify-center gap-6">
                  <button 
                    onClick={toggleMute}
                    className="p-2.5 hover:bg-heritage-brown/5 rounded-full transition-all text-heritage-brown/60 dark:text-stone-400 hover:text-heritage-brown cursor-pointer"
                  >
                    {isMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={togglePlay}
                    className="w-12 h-12 rounded-full bg-heritage-terracotta hover:bg-heritage-brown text-white flex items-center justify-center shadow-md active:scale-95 transition-all cursor-pointer"
                  >
                    {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
                  </button>

                  <span className="text-[10px] font-black uppercase text-heritage-brown/40 dark:text-stone-500">
                    {data.duration} Track
                  </span>
                </div>
              </div>
            </div>

            {/* Transcriptions area */}
            <div className="space-y-6">
              <h2 className="font-serif font-black text-xl text-heritage-brown dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-heritage-olive" />
                <span>Synchronized Translation & Transcript</span>
              </h2>

              <div className="space-y-4 max-h-96 overflow-y-auto pr-2 bg-white dark:bg-stone-900 border border-heritage-brown/10 p-6 rounded-3xl shadow-sm">
                {data.transcription && data.transcription.length > 0 ? (
                  data.transcription.map((line: any, idx: number) => {
                    const isPassed = currentTime >= line.time;
                    return (
                      <div 
                        key={idx} 
                        className={`p-3.5 rounded-2xl border transition-all ${
                          isPassed 
                            ? 'bg-heritage-terracotta/5 border-heritage-terracotta/20 dark:bg-heritage-terracotta/10' 
                            : 'bg-transparent border-transparent opacity-65'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[9px] font-black text-heritage-terracotta bg-heritage-terracotta/10 px-2 py-0.5 rounded-md">
                            {formatTime(line.time)}
                          </span>
                        </div>
                        <p className="text-xs font-black text-heritage-brown dark:text-stone-200">
                          {line.textLukenye}
                        </p>
                        <p className="text-xs font-bold text-heritage-brown/60 dark:text-stone-400 mt-1 italic">
                          {line.textEnglish}
                        </p>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-center py-10 text-xs font-semibold text-heritage-brown/40 italic">
                    Traditional transcripts are currently being digitized by the Council of Elders.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* SCHEMA 5: TIMELINE EVENT */}
        {contentType === 'timeline' && (
          <div className="space-y-8 text-left">
            <div className="p-8 bg-white dark:bg-stone-900 border border-heritage-brown/10 rounded-3xl relative overflow-hidden shadow-sm">
              <div className="absolute top-0 inset-x-0 h-2 bg-heritage-olive" />
              
              <div className="space-y-2">
                <span className="text-xs font-black uppercase text-heritage-terracotta tracking-widest bg-heritage-terracotta/10 px-3 py-1 rounded-full">
                  Epoch Era: {data.period}
                </span>
                <h1 className="font-serif font-black text-3xl text-heritage-brown dark:text-white pt-2 leading-tight">
                  {data.title}
                </h1>
              </div>

              <div className="whitespace-pre-line text-sm sm:text-base leading-relaxed text-heritage-brown/90 dark:text-stone-200 bg-heritage-cream/15 dark:bg-stone-950/40 p-6 rounded-2xl border border-heritage-brown/5 mt-8 shadow-inner">
                {data.desc}
              </div>
            </div>
          </div>
        )}

        {/* SCHEMA 6: COMMUNITY ASSEMBLY EVENT */}
        {contentType === 'event' && (
          <div className="space-y-8 text-left">
            {data.cover_image && (
              <div className="w-full h-80 sm:h-[400px] rounded-3xl overflow-hidden shadow-md">
                <img src={data.cover_image} alt={data.title} className="w-full h-full object-cover" />
              </div>
            )}

            <div className="p-6 sm:p-8 bg-white dark:bg-stone-900 border border-heritage-brown/10 rounded-3xl relative overflow-hidden shadow-sm space-y-6">
              <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-amber-500 to-heritage-terracotta" />

              <div className="space-y-2">
                <h1 className="font-serif font-black text-2xl sm:text-3xl text-heritage-brown dark:text-white">
                  {data.title}
                </h1>
                <p className="text-xs font-bold text-heritage-brown/50 dark:text-stone-400">
                  Organized by <strong className="text-heritage-olive">{data.organizer || 'Elders Committee'}</strong>
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-heritage-brown/5">
                <div className="flex items-center gap-3 p-3.5 bg-heritage-cream dark:bg-stone-950 rounded-xl">
                  <Calendar className="w-5 h-5 text-heritage-terracotta shrink-0" />
                  <div>
                    <span className="text-[9px] font-black uppercase text-heritage-brown/40 block">Assembly Date</span>
                    <span className="text-xs font-bold text-heritage-brown dark:text-stone-200">
                      {new Date(data.start_datetime).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3.5 bg-heritage-cream dark:bg-stone-950 rounded-xl">
                  <MapPin className="w-5 h-5 text-heritage-olive shrink-0" />
                  <div>
                    <span className="text-[9px] font-black uppercase text-heritage-brown/40 block">Location Ingress</span>
                    <span className="text-xs font-bold text-heritage-brown dark:text-stone-200">{data.location || 'Central Assembly Sanctuary'}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4 mt-6 pt-4 border-t border-heritage-brown/5">
                <h3 className="text-xs font-black uppercase tracking-widest text-heritage-brown">Assembly Chronicle</h3>
                <div className="whitespace-pre-line text-xs sm:text-sm text-heritage-brown/80 dark:text-stone-300 leading-relaxed">
                  {data.description}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* RELATED CONTENT MODULE */}
        {related.length > 0 && (
          <div className="mt-16 pt-12 border-t border-heritage-brown/10 dark:border-stone-800 text-left">
            <h3 className="font-serif font-black text-xl text-heritage-brown dark:text-white mb-6">
              Explore Related Chronicles
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {related.map((item) => (
                <Link
                  key={item.id}
                  to={`/${contentType === 'leader' ? 'leadership' : contentType === 'clan' ? 'clans' : contentType === 'news' ? 'news' : contentType === 'event' ? 'events' : contentType}s/${item.id}`}
                  className="bg-white dark:bg-stone-900 border border-heritage-brown/10 hover:border-heritage-terracotta/30 dark:border-stone-800 rounded-2xl p-4 transition-all shadow-sm group hover:-translate-y-1 block"
                >
                  {item.cover_image || item.coverImage ? (
                    <div className="w-full h-28 rounded-xl overflow-hidden mb-3">
                      <img src={item.cover_image || item.coverImage} className="w-full h-full object-cover transition-all group-hover:scale-105" alt={item.title || item.name} />
                    </div>
                  ) : null}

                  <span className="text-[8px] font-black uppercase tracking-widest text-heritage-terracotta bg-heritage-terracotta/10 px-2 py-0.5 rounded-full inline-block">
                    {item.category || item.role || 'Registry Record'}
                  </span>
                  
                  <h4 className="font-serif font-black text-sm text-heritage-brown dark:text-white mt-2 group-hover:text-heritage-terracotta transition-colors line-clamp-2">
                    {item.title || item.name}
                  </h4>
                  
                  <p className="text-[11px] text-heritage-brown/50 dark:text-stone-400 mt-1 line-clamp-2 font-medium">
                    {item.summary || item.bio || item.desc || item.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Social Share Modal */}
      <AnimatePresence>
        {isShareOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white dark:bg-stone-900 border-2 border-heritage-brown/10 rounded-[32px] p-6 shadow-2xl relative overflow-hidden text-left"
            >
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-heritage-olive to-heritage-terracotta" />
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="font-serif font-black text-xl text-heritage-brown dark:text-white">
                    Share Cultural Archive
                  </h3>
                  <p className="text-[10px] font-mono text-heritage-olive uppercase tracking-wider mt-1">
                    Spread certified Bakenyi memory
                  </p>
                </div>
                <button
                  onClick={() => setIsShareOpen(false)}
                  className="p-1 text-heritage-brown/40 hover:text-heritage-terracotta transition-colors rounded-full hover:bg-stone-100 dark:hover:bg-stone-800"
                >
                  <ArrowLeft className="w-4 h-4 rotate-90" />
                </button>
              </div>

              {/* Share Options Grid */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {/* WhatsApp */}
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent((data?.title || data?.name || 'Bakenyi Archive') + " - " + window.location.href)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded-2xl transition-all font-bold text-xs text-emerald-800 dark:text-emerald-400"
                >
                  <MessageSquare className="w-4 h-4 text-emerald-600" />
                  <span>WhatsApp</span>
                </a>

                {/* Telegram */}
                <a
                  href={`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(data?.title || data?.name || 'Bakenyi Archive')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-sky-50 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/50 hover:bg-sky-100 dark:hover:bg-sky-900/30 rounded-2xl transition-all font-bold text-xs text-sky-800 dark:text-sky-400"
                >
                  <Send className="w-4 h-4 text-sky-600" />
                  <span>Telegram</span>
                </a>

                {/* Facebook */}
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-2xl transition-all font-bold text-xs text-blue-800 dark:text-blue-400"
                >
                  <Facebook className="w-4 h-4 text-blue-600" />
                  <span>Facebook</span>
                </a>

                {/* X */}
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(data?.title || data?.name || 'Bakenyi Archive')}&url=${encodeURIComponent(window.location.href)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-stone-50 dark:bg-stone-950 border border-stone-100 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800/80 rounded-2xl transition-all font-bold text-xs text-stone-800 dark:text-stone-300"
                >
                  <Share2 className="w-4 h-4 text-amber-500" />
                  <span>X / Twitter</span>
                </a>
              </div>

              {/* Copy Link Section */}
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase text-heritage-brown/40 block">Copy Curated Link</span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={window.location.href}
                    className="flex-1 px-4 py-2.5 bg-stone-50 dark:bg-stone-950 border border-heritage-brown/10 rounded-xl text-xs font-mono select-all focus:outline-none focus:border-heritage-terracotta"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-4 py-2.5 bg-heritage-brown hover:bg-heritage-terracotta text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 min-w-[90px] cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <span>Copy Link</span>
                    )}
                  </button>
                </div>
              </div>

              {/* Native share option if available but we showed the modal */}
              {navigator.share && (
                <button
                  onClick={() => {
                    setIsShareOpen(false);
                    navigator.share({
                      title: data?.title || data?.name || 'Bakenyi Archive',
                      text: data?.summary || data?.bio || data?.description || 'Exploring Bakenyi cultural registry records.',
                      url: window.location.href
                    });
                  }}
                  className="w-full mt-4 py-3 bg-heritage-olive text-white rounded-2xl text-xs font-bold text-center hover:bg-heritage-brown transition-colors cursor-pointer"
                >
                  Open System Share Dialog
                </button>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Alert */}
      <AnimatePresence>
        {shareToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 right-6 z-50 bg-stone-950 text-heritage-sand px-5 py-3 rounded-xl border border-stone-800 shadow-xl flex items-center gap-2 text-xs font-bold"
          >
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{shareToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
