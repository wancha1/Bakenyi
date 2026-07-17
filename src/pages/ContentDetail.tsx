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
  Bookmark
} from 'lucide-react';
import { getSupabase } from '../lib/supabaseClient';
import { getArticleById, getClans, getLeaders } from '../lib/supabase';
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
          const article = await getArticleById(id);
          if (article) {
            setData(article);
            // Fetch related articles
            const allArticles = await getArticleById(''); // fetch list if id empty, or direct query
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
          const clanItem = clansList.find(c => c.id === id || c.name.toLowerCase().replace(/\s+/g, '-') === id);
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
          const leaderItem = leadersList.find(l => l.id === id || l.name.toLowerCase().replace(/\s+/g, '-') === id);
          if (leaderItem) {
            setData(leaderItem);
            // Related content: other leaders
            setRelated(leadersList.filter(l => l.id !== leaderItem.id).slice(0, 3));
          } else {
            setError('Council leader record not found.');
          }
        } 
        
        else if (contentType === 'oral-history') {
          if (client) {
            const { data: track, error: trackErr } = await client.from('oral_history').select('*').eq('id', id).maybeSingle();
            if (!trackErr && track) {
              setData({
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
              });
            } else {
              // Try local storage fallback
              const storedHistory = JSON.parse(localStorage.getItem('bakenye_oral_histories') || '[]');
              const matched = storedHistory.find((h: any) => h.id === id);
              if (matched) {
                setData(matched);
              } else {
                setError('Oral History record not found.');
              }
            }
          } else {
            setError('Supabase client offline. Oral History record not accessible.');
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
    <div className="w-full min-h-screen bg-heritage-cream dark:bg-stone-950 text-heritage-ink dark:text-stone-100 py-12 px-4 sm:px-6 lg:px-8">
      <SEO 
        title={`${data.title || data.name} - Bakenyi Heritage`} 
        description={data.summary || data.bio || data.description || 'Exploring Bakenyi cultural registry records.'} 
      />

      <div className="max-w-4xl mx-auto">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-heritage-brown/60 dark:text-stone-400 hover:text-heritage-terracotta transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Chronicles</span>
          </button>

          <span className="px-3 py-1 bg-heritage-brown/5 dark:bg-stone-900 border border-heritage-brown/10 rounded-full text-[10px] font-black uppercase tracking-wider text-heritage-brown dark:text-heritage-sand">
            {typeTitles[contentType] || 'Heritage Record'}
          </span>
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

        {/* SCHEMA 3: LEADER BIOGRAPHY */}
        {contentType === 'leader' && (
          <div className="space-y-8 text-left">
            <div className="bg-white dark:bg-stone-900 border border-heritage-brown/10 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row gap-6 relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-heritage-olive to-heritage-terracotta" />
              
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-heritage-terracotta shadow-md shrink-0 mx-auto sm:mx-0 bg-heritage-brown/15 flex items-center justify-center">
                {data.photo_url ? (
                  <img src={data.photo_url} alt={data.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-12 h-12 text-heritage-brown/30" />
                )}
              </div>

              <div className="flex-1 text-center sm:text-left space-y-3">
                <div>
                  <h1 className="font-serif font-black text-2xl text-heritage-brown dark:text-white">
                    {data.name}
                  </h1>
                  <span className="px-2.5 py-1 bg-heritage-terracotta/10 border border-heritage-terracotta/20 text-heritage-terracotta text-[10px] font-black uppercase tracking-wider rounded-full inline-block mt-1">
                    {data.role}
                  </span>
                </div>

                <div className="flex flex-wrap justify-center sm:justify-start gap-4 text-xs font-bold text-heritage-brown/60 dark:text-stone-400">
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-heritage-olive" />
                    <span>Clan: {data.clan || 'Baise-Mugaya'}</span>
                  </div>
                  {data.expertise && (
                    <div className="flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-amber-600" />
                      <span>Expertise: {data.expertise}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h2 className="font-serif font-black text-xl text-heritage-brown dark:text-white">
                Elder Chronicle & Biography
              </h2>
              <div className="whitespace-pre-line text-sm sm:text-base leading-relaxed text-heritage-brown/90 dark:text-stone-200 bg-white dark:bg-stone-900 border border-heritage-brown/10 p-6 rounded-3xl shadow-sm">
                {data.bio}
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
    </div>
  );
}
