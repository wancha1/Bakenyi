import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Search, 
  Maximize2, 
  Tag, 
  Facebook, 
  Twitter, 
  Download, 
  Loader2, 
  Plus, 
  Upload, 
  Check,
  Grid,
  List,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Video,
  Music,
  Headphones,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Eye
} from 'lucide-react';
import { getSupabase, checkIsAdmin } from '../lib/supabaseClient';
import { getGalleryImages, addGalleryImage, uploadMedia } from '../lib/supabase';
import SEO from '../components/SEO';

interface UnifiedMediaItem {
  id: string;
  title: string;
  fileUrl: string;
  fileType: 'image' | 'audio' | 'video';
  description: string;
  category: string;
  created_at: string;
  duration?: string;
  authorName?: string;
}

const categories = ["All", "Landscape", "Tradition", "Craft", "History"];
const mediaTypes = ["All", "Images", "Audio", "Video"];

// Rich fallback items for high fidelity offline rendering or empty tables
const DEFAULT_MEDIA_ITEMS: UnifiedMediaItem[] = [];

export default function Gallery() {
  const supabase = getSupabase();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedMediaType, setSelectedMediaType] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Unified state for and query results
  const [mediaItems, setMediaItems] = useState<UnifiedMediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Full screen preview modal
  const [previewItem, setPreviewItem] = useState<UnifiedMediaItem | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Audio preview internal player
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);

  // Custom upload modal state
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadCategory, setUploadCategory] = useState('Landscape');
  const [uploadType, setUploadType] = useState<'image' | 'audio' | 'video'>('image');
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ url: string; title: string; desc: string; type: 'image' | 'audio' | 'video' }>>([]);
  const [submittingImage, setSubmittingImage] = useState(false);

  // Toast notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  useEffect(() => {
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }: any) => {
        const u = session?.user || null;
        setUser(u);
        if (u) checkIsAdmin(u).then(setIsAdmin);
      });
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
        const u = session?.user || null;
        setUser(u);
        if (u) {
          checkIsAdmin(u).then(setIsAdmin);
        } else {
          setIsAdmin(false);
        }
      });
      return () => subscription.unsubscribe();
    }
  }, [supabase]);

  const loadMediaLibrary = async () => {
    setLoading(true);
    try {
      const client = getSupabase();
      let combinedList: UnifiedMediaItem[] = [];

      // 1. Fetch images from Supabase Gallery
      const rawImages = await getGalleryImages(true);
      const formattedImages: UnifiedMediaItem[] = rawImages.map(img => ({
        id: img.id,
        title: img.title,
        fileUrl: img.imageUrl,
        fileType: 'image',
        description: img.description || '',
        category: img.category || 'General',
        created_at: img.created_at || new Date().toISOString(),
        authorName: 'Contributor'
      }));
      combinedList = [...combinedList, ...formattedImages];

      // 2. Fetch oral histories and audio tracks from Supabase `oral_history` table
      if (client) {
        const { data: oralTracks } = await client.from('oral_history').select('*');
        if (oralTracks && oralTracks.length > 0) {
          const formattedAudio: UnifiedMediaItem[] = oralTracks.map(track => ({
            id: `audio-${track.id}`,
            title: track.title || 'Oral Narrative',
            fileUrl: track.audio_url || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
            fileType: 'audio',
            description: track.summary || track.narration_summary || `Oral history narration regarding Bakenyi ${track.topic || 'traditions'}.`,
            category: track.topic || 'Tradition',
            created_at: track.recording_date || track.created_at || new Date().toISOString(),
            duration: track.duration || '3:00',
            authorName: track.elder || track.narrator || 'Elder Storyteller'
          }));
          combinedList = [...combinedList, ...formattedAudio];
        }

        // 3. Fetch custom video files from database `media` table
        const { data: videoTracks } = await client.from('media').select('*').eq('file_type', 'video');
        if (videoTracks && videoTracks.length > 0) {
          const formattedVideo: UnifiedMediaItem[] = videoTracks.map(vid => ({
            id: vid.id,
            title: vid.title,
            fileUrl: vid.file_url,
            fileType: 'video',
            description: vid.description || '',
            category: vid.category || 'General',
            created_at: vid.created_at || new Date().toISOString(),
            authorName: 'Contributor'
          }));
          combinedList = [...combinedList, ...formattedVideo];
        }
      }

      // Sort and set strict live items
      combinedList.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setMediaItems(combinedList);

    } catch (err) {
      console.warn("Database fetching failed:", err);
      setMediaItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMediaLibrary();
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files ? Array.from(e.target.files) as File[] : [];
    if (selectedFiles.length === 0) return;

    setSubmittingImage(true);
    const newUploads = [...uploadedFiles];
    
    for (const file of selectedFiles) {
      try {
        const { url, error } = await uploadMedia(file, 'images');
        if (error) throw error;
        
        const cleanTitle = file.name
          .replace(/\.[^/.]+$/, "")
          .split(/[-_]+/)
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");

        newUploads.push({
          url,
          title: cleanTitle,
          desc: '',
          type: uploadType
        });
      } catch (err: any) {
        console.error("Upload error:", err);
        const cleanTitle = file.name
          .replace(/\.[^/.]+$/, "")
          .split(/[-_]+/)
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");

        await new Promise<void>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            newUploads.push({
              url: reader.result as string,
              title: cleanTitle,
              desc: '',
              type: uploadType
            });
            resolve();
          };
          reader.readAsDataURL(file);
        });
      }
    }
    
    setUploadedFiles(newUploads);
    setSubmittingImage(false);
  };

  const handleAddImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadedFiles.length === 0) return;

    setSubmittingImage(true);
    try {
      const client = getSupabase();
      if (client) {
        // Direct DB insertion
        for (const file of uploadedFiles) {
          if (file.type === 'image') {
            await addGalleryImage(
              file.title,
              file.url,
              file.desc,
              uploadCategory,
              isAdmin ? 'approved' : 'pending'
            );
          } else if (file.type === 'audio') {
            await client.from('oral_history').insert({
              title: file.title,
              audio_url: file.url,
              summary: file.desc,
              topic: uploadCategory,
              elder: user?.email || 'Anonymous Contributor',
              recording_date: new Date().toISOString().split('T')[0]
            });
          } else if (file.type === 'video') {
            await client.from('media').insert({
              title: file.title,
              file_url: file.url,
              description: file.desc,
              file_type: 'video',
              category: uploadCategory,
              status: isAdmin ? 'approved' : 'pending'
            });
          }
        }
      }

      showToast(isAdmin 
        ? `Successfully published ${uploadedFiles.length} asset(s) to the public gallery in bulk!` 
        : `Successfully submitted ${uploadedFiles.length} asset(s) to the moderation queue in bulk!`,
        "success"
      );
      
      setShowUploadModal(false);
      setUploadedFiles([]);
      await loadMediaLibrary();
    } catch (err: any) {
      showToast(err.message || "Failed to submit assets.", "error");
    } finally {
      setSubmittingImage(false);
    }
  };

  // Audio preview playback hooks
  useEffect(() => {
    if (!audioPreviewRef.current) return;
    const audio = audioPreviewRef.current;

    const updateTime = () => setAudioCurrentTime(audio.currentTime);
    const updateDur = () => setAudioDuration(audio.duration);
    const resetPlay = () => {
      setIsAudioPlaying(false);
      setAudioCurrentTime(0);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDur);
    audio.addEventListener('ended', resetPlay);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDur);
      audio.removeEventListener('ended', resetPlay);
    };
  }, [previewItem]);

  const toggleAudioPlay = () => {
    if (!audioPreviewRef.current) return;
    if (isAudioPlaying) {
      audioPreviewRef.current.pause();
    } else {
      audioPreviewRef.current.play().catch(e => console.error(e));
    }
    setIsAudioPlaying(!isAudioPlaying);
  };

  const handleAudioSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioPreviewRef.current) return;
    const value = parseFloat(e.target.value);
    audioPreviewRef.current.currentTime = value;
    setAudioCurrentTime(value);
  };

  const toggleAudioMute = () => {
    if (!audioPreviewRef.current) return;
    audioPreviewRef.current.muted = !isAudioMuted;
    setIsAudioMuted(!isAudioMuted);
  };

  const formatAudioTime = (secs: number) => {
    const min = Math.floor(secs / 60);
    const sec = Math.floor(secs % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  // Filtering + Searching logic
  const filteredItems = mediaItems.filter(item => {
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    
    let matchesType = true;
    if (selectedMediaType === "Images") matchesType = item.fileType === 'image';
    else if (selectedMediaType === "Audio") matchesType = item.fileType === 'audio';
    else if (selectedMediaType === "Video") matchesType = item.fileType === 'video';

    const cleanQuery = searchQuery.toLowerCase().trim();
    const matchesSearch = !cleanQuery || 
      item.title.toLowerCase().includes(cleanQuery) || 
      item.description.toLowerCase().includes(cleanQuery);

    return matchesCategory && matchesType && matchesSearch;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);

  // Sync pagination page number
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedMediaType, searchQuery]);

  return (
    <div id="media_gallery_module" className="pt-24 min-h-screen bg-heritage-cream dark:bg-stone-950 transition-colors duration-300">
      <SEO 
        title="Bakenyi Multi-Media Gallery & Archive"
        description="Browse high-resolution images, elder voice narrations, and historical documentary footage regarding Bakenyi customs, navigation paths, and crafts."
      />

      {/* Hero Header */}
      <section className="relative bg-gradient-to-br from-stone-950 via-stone-900 to-[#2c1d11] py-20 px-4 overflow-hidden border-b border-stone-800/60 text-center">
        <div className="absolute inset-0 cultural-pattern opacity-10 pointer-events-none" />
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-heritage-terracotta/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-serif font-black text-white mb-4 tracking-tight leading-tight"
          >
            Digital Gallery & Archive
          </motion.h1>
          <p className="text-heritage-sand max-w-2xl mx-auto text-xs md:text-sm font-black tracking-widest uppercase">
            Preserving Bakenyi history, maritime craft, and wetland ecology.
          </p>
        </div>
      </section>

      {/* Central Interactive Content Area */}
      <section className="py-12 px-4 max-w-7xl mx-auto space-y-8">
        
        {/* Controls Toolbar */}
        <div className="bg-white dark:bg-stone-900 border border-heritage-brown/10 dark:border-stone-800 p-6 rounded-3xl shadow-sm space-y-6">
          <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
            
            {/* Left side: media types and search */}
            <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
              {/* Media Type toggles */}
              <div className="flex bg-heritage-cream dark:bg-stone-950 p-1.5 rounded-2xl border border-heritage-brown/5 dark:border-stone-800 self-start">
                {mediaTypes.map(type => (
                  <button
                    key={type}
                    onClick={() => setSelectedMediaType(type)}
                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                      selectedMediaType === type
                        ? 'bg-heritage-terracotta text-white shadow-sm'
                        : 'text-heritage-brown/60 dark:text-stone-400 hover:text-heritage-brown dark:hover:text-stone-100'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              {/* Instant Search input */}
              <div className="relative flex-grow sm:max-w-xs">
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search titles, descriptions..."
                  className="w-full bg-heritage-cream dark:bg-stone-950 border border-heritage-brown/10 dark:border-stone-800 rounded-2xl py-2.5 pl-10 pr-4 text-xs font-bold text-heritage-brown dark:text-white focus:outline-none focus:border-heritage-terracotta"
                />
                <Search className="w-4 h-4 text-heritage-brown/40 dark:text-stone-500 absolute left-3.5 top-3.5" />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="absolute right-3.5 top-3.5 text-xs text-heritage-brown/40 dark:text-stone-500 hover:text-heritage-brown dark:hover:text-stone-100 font-bold cursor-pointer">&times;</button>
                )}
              </div>
            </div>

            {/* Right side: View Switcher & contribute button */}
            <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-end">
              <div className="flex items-center gap-2 border-r border-heritage-brown/10 dark:border-stone-800 pr-4">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-xl transition-all cursor-pointer ${viewMode === 'grid' ? 'bg-heritage-brown/10 text-heritage-brown dark:text-heritage-sand' : 'text-heritage-brown/30 dark:text-stone-600'}`}
                  title="Grid View"
                >
                  <Grid className="w-4.5 h-4.5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-xl transition-all cursor-pointer ${viewMode === 'list' ? 'bg-heritage-brown/10 text-heritage-brown dark:text-heritage-sand' : 'text-heritage-brown/30 dark:text-stone-600'}`}
                  title="List View"
                >
                  <List className="w-4.5 h-4.5" />
                </button>
              </div>

              {user && (
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="px-5 py-3 bg-heritage-terracotta hover:bg-heritage-brown text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-md flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Contribute Media</span>
                </button>
              )}
            </div>
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2.5 pt-4 border-t border-heritage-brown/5 dark:border-stone-800">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                  selectedCategory === cat 
                    ? 'bg-heritage-olive border-heritage-olive text-white shadow-sm' 
                    : 'bg-heritage-cream/40 dark:bg-stone-950 border-heritage-brown/10 dark:border-stone-800 text-heritage-brown dark:text-stone-300 hover:border-heritage-olive/30'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* LOADING STATE */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center bg-white dark:bg-stone-900 border border-heritage-brown/5 dark:border-stone-800 rounded-[32px] shadow-sm">
            <Loader2 className="w-10 h-10 text-heritage-terracotta animate-spin mb-4" />
            <p className="text-xs font-black uppercase tracking-widest text-heritage-brown/40 dark:text-stone-400">Querying Digital Vault...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          /* EMPTY STATE */
          <div className="py-24 text-center bg-white dark:bg-stone-900 border border-heritage-brown/5 dark:border-stone-800 rounded-[32px] shadow-sm">
            <Tag className="w-12 h-12 text-heritage-brown/20 dark:text-stone-700 mx-auto mb-4" />
            <h3 className="text-xl font-serif font-black text-heritage-brown dark:text-white mb-2">No Archives Unveiled</h3>
            <p className="text-xs text-heritage-brown/60 dark:text-stone-400 font-bold uppercase tracking-wider">Try adjusting your filters or search keywords</p>
          </div>
        ) : (
          /* MULTI-MEDIA ARCHIVE GRID/LIST CONTAINER */
          <div className="space-y-8">
            <div className={viewMode === 'grid' 
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8" 
              : "space-y-4 text-left"
            }>
              {currentItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`bg-white dark:bg-stone-900 rounded-3xl overflow-hidden border border-heritage-brown/10 dark:border-stone-800 shadow-sm hover:shadow-md transition-all ${
                    viewMode === 'list' ? 'flex flex-col sm:flex-row items-center p-4 gap-6 text-left' : 'flex flex-col text-left'
                  }`}
                >
                  {/* Thumbnail / Media Icon Cover */}
                  <div className={`relative overflow-hidden bg-stone-950 shrink-0 ${
                    viewMode === 'list' ? 'w-full sm:w-44 aspect-video sm:aspect-square rounded-2xl' : 'aspect-video'
                  }`}>
                    {item.fileType === 'image' ? (
                      <img 
                        src={item.fileUrl} 
                        alt={item.title} 
                        loading="lazy"
                        className="w-full h-full object-cover hover:scale-105 transition-all duration-300"
                      />
                    ) : item.fileType === 'video' ? (
                      <div className="w-full h-full relative flex items-center justify-center">
                        <video src={item.fileUrl} className="w-full h-full object-cover opacity-60" muted playsInline />
                        <div className="absolute p-3 bg-stone-900/80 rounded-full border border-white/10 shadow-lg text-white">
                          <Video className="w-5 h-5 text-heritage-sand" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full relative flex items-center justify-center bg-gradient-to-br from-heritage-brown to-stone-900">
                        <Headphones className="w-10 h-10 text-heritage-sand/40" />
                        <span className="absolute bottom-2.5 right-2.5 text-[8px] bg-stone-900/60 text-heritage-sand px-1.5 py-0.5 rounded font-black tracking-wider uppercase">Audio {item.duration || ''}</span>
                      </div>
                    )}

                    {/* Quick zoom icon */}
                    <div className="absolute inset-0 bg-stone-950/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-all">
                      <button
                        onClick={() => {
                          setPreviewItem(item);
                          if (item.fileType === 'audio') {
                            setIsAudioPlaying(false);
                            setAudioCurrentTime(0);
                          }
                        }}
                        className="p-3 bg-white hover:bg-heritage-terracotta hover:text-white text-heritage-brown rounded-full shadow-lg hover:scale-110 transition-all cursor-pointer"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Body textual information */}
                  <div className="p-6 flex-grow flex flex-col justify-between h-full min-w-0">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest bg-heritage-olive/10 text-heritage-olive dark:bg-heritage-olive/20 dark:text-heritage-sand">
                          {item.category}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest bg-heritage-brown/5 text-heritage-brown/60 dark:bg-stone-800 dark:text-stone-300">
                          {item.fileType}
                        </span>
                      </div>

                      <h3 className="font-serif font-black text-lg text-heritage-brown dark:text-white truncate">
                        {item.title}
                      </h3>

                      <p className="text-xs text-heritage-brown/60 dark:text-stone-400 font-medium line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-heritage-brown/40 dark:text-stone-500 font-bold pt-4 border-t border-heritage-brown/5 dark:border-stone-800 mt-4">
                      <span>By {item.authorName || 'Cultural Archivist'}</span>
                      <span>{new Date(item.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* PAGINATION FOOTER */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 pt-6">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-2 bg-white dark:bg-stone-900 border border-heritage-brown/10 dark:border-stone-800 text-heritage-brown dark:text-stone-300 rounded-xl hover:text-heritage-terracotta disabled:opacity-40 transition-all cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                
                <span className="text-xs font-black uppercase text-heritage-brown/60 dark:text-stone-400">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 bg-white dark:bg-stone-900 border border-heritage-brown/10 dark:border-stone-800 text-heritage-brown dark:text-stone-300 rounded-xl hover:text-heritage-terracotta disabled:opacity-40 transition-all cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        )}

      </section>

      {/* FULL-SCREEN IMMERSIVE PREVIEW LIGHTBOX MODAL */}
      <AnimatePresence>
        {previewItem && (
          <div className="fixed inset-0 bg-heritage-brown/95 dark:bg-stone-950/98 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <button 
              onClick={() => {
                setPreviewItem(null);
                setIsAudioPlaying(false);
              }}
              className="absolute right-6 top-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-4xl w-full flex flex-col md:flex-row bg-white dark:bg-stone-900 rounded-[32px] overflow-hidden shadow-2xl text-left border border-heritage-brown/10"
            >
              {/* Left Side: Media Render Box */}
              <div className="md:w-3/5 bg-stone-950 flex items-center justify-center max-h-[70vh] md:max-h-none min-h-[300px] relative">
                {previewItem.fileType === 'image' && (
                  <img src={previewItem.fileUrl} className="w-full h-full object-contain" alt={previewItem.title} />
                )}

                {previewItem.fileType === 'video' && (
                  <video 
                    src={previewItem.fileUrl} 
                    controls 
                    autoPlay 
                    className="w-full h-full object-contain focus:outline-none"
                  />
                )}

                {previewItem.fileType === 'audio' && (
                  <div className="w-full h-full p-8 flex flex-col justify-center items-center gap-6 bg-gradient-to-br from-[#2c1d11] to-stone-950">
                    <audio ref={audioPreviewRef} src={previewItem.fileUrl} />
                    
                    <div className="w-24 h-24 rounded-full bg-heritage-terracotta/10 border-2 border-heritage-terracotta flex items-center justify-center animate-pulse">
                      <Music className="w-10 h-10 text-heritage-sand" />
                    </div>

                    <div className="w-full space-y-3">
                      <div className="flex justify-between text-[10px] text-heritage-sand/60 font-mono">
                        <span>{formatAudioTime(audioCurrentTime)}</span>
                        <span>{formatAudioTime(audioDuration || 180)}</span>
                      </div>
                      
                      <input 
                        type="range"
                        min="0"
                        max={audioDuration || 180}
                        value={audioCurrentTime}
                        onChange={handleAudioSeek}
                        className="w-full h-1.5 accent-heritage-terracotta bg-white/10 rounded-lg cursor-pointer"
                      />

                      <div className="flex items-center justify-center gap-4">
                        <button onClick={toggleAudioMute} className="text-white/60 hover:text-white transition-colors cursor-pointer">
                          {isAudioMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4" />}
                        </button>
                        <button 
                          onClick={toggleAudioPlay}
                          className="w-11 h-11 bg-heritage-terracotta text-white rounded-full flex items-center justify-center hover:scale-105 transition-all cursor-pointer shadow-md"
                        >
                          {isAudioPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Side: Descriptive metadata */}
              <div className="md:w-2/5 p-8 flex flex-col justify-between bg-white dark:bg-stone-900 border-l border-heritage-brown/10 dark:border-stone-800">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest bg-heritage-olive/10 text-heritage-olive dark:bg-stone-850 dark:text-heritage-sand">
                      {previewItem.category}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest bg-heritage-brown/5 text-heritage-brown/60 dark:bg-stone-850 dark:text-stone-300">
                      {previewItem.fileType}
                    </span>
                  </div>

                  <h2 className="text-2xl font-serif font-black text-heritage-brown dark:text-white mb-3">
                    {previewItem.title}
                  </h2>

                  <p className="text-xs text-heritage-brown/70 dark:text-stone-300 leading-relaxed font-bold">
                    {previewItem.description}
                  </p>

                  <div className="mt-6 space-y-2 text-[10px] font-bold text-heritage-brown/40 dark:text-stone-400">
                    <p>Uploaded by: {previewItem.authorName || 'Heritage Scribe'}</p>
                    <p>Date Published: {new Date(previewItem.created_at).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="border-t border-heritage-brown/10 dark:border-stone-800 pt-6 mt-6">
                  <div className="flex gap-2.5">
                    <a
                      href={previewItem.fileUrl}
                      download={previewItem.title}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-grow py-3 px-4 bg-heritage-olive hover:bg-heritage-brown text-white font-black text-[10px] uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Archive Asset</span>
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* UPLOAD MODAL FOR CONCISED BULK CONTRIBUTORS */}
      <AnimatePresence>
        {showUploadModal && (
          <div className="fixed inset-0 bg-heritage-brown/65 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-stone-900 rounded-[32px] p-8 max-w-2xl w-full shadow-2xl relative text-left border border-heritage-brown/10 dark:border-stone-800"
            >
              <button 
                onClick={() => { setShowUploadModal(false); setUploadedFiles([]); }}
                className="absolute right-6 top-6 p-2 text-heritage-brown/40 dark:text-stone-400 hover:text-heritage-brown dark:hover:text-stone-100 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-2xl font-serif font-black text-heritage-brown dark:text-white mb-6">Contribute Traditional Media Assets</h2>

              <form onSubmit={handleAddImage} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-heritage-brown/60 dark:text-stone-400 ml-1">Asset Category</label>
                    <select
                      value={uploadCategory}
                      onChange={(e) => setUploadCategory(e.target.value)}
                      className="w-full px-4 py-3 bg-heritage-cream/40 dark:bg-stone-950 border border-heritage-brown/15 dark:border-stone-800 focus:border-heritage-terracotta rounded-xl outline-none font-bold text-xs text-heritage-brown dark:text-white"
                    >
                      <option value="Landscape">Landscape</option>
                      <option value="Tradition">Tradition</option>
                      <option value="Craft">Craft</option>
                      <option value="History">History</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-heritage-brown/60 dark:text-stone-400 ml-1">Media Type</label>
                    <select
                      value={uploadType}
                      onChange={(e) => setUploadType(e.target.value as any)}
                      className="w-full px-4 py-3 bg-heritage-cream/40 dark:bg-stone-950 border border-heritage-brown/15 dark:border-stone-800 focus:border-heritage-terracotta rounded-xl outline-none font-bold text-xs text-heritage-brown dark:text-white"
                    >
                      <option value="image">Image File</option>
                      <option value="audio">Audio Voice Track</option>
                      <option value="video">Video Documentary</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-heritage-brown/60 dark:text-stone-400 ml-1">Select File</label>
                    <div className="relative">
                      <input
                        type="file"
                        accept={uploadType === 'image' ? "image/*" : uploadType === 'audio' ? "audio/*" : "video/*"}
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                        id="modal-file-upload"
                      />
                      <label
                        htmlFor="modal-file-upload"
                        className="w-full px-4 py-3 bg-heritage-cream/40 dark:bg-stone-950 border-2 border-dashed border-heritage-brown/15 dark:border-stone-800 hover:border-heritage-olive/45 rounded-xl flex items-center justify-center gap-2 cursor-pointer font-black text-xs text-heritage-brown dark:text-white transition-colors"
                      >
                        <Upload className="w-4 h-4 text-heritage-olive" />
                        <span>Add File</span>
                      </label>
                    </div>
                  </div>
                </div>

                {uploadedFiles.length > 0 && (
                  <div className="space-y-4 max-h-72 overflow-y-auto pr-1 border-t border-b border-heritage-brown/5 dark:border-stone-800 py-4">
                    <label className="text-[9px] font-black uppercase tracking-widest text-heritage-brown/60 dark:text-stone-400 ml-1 block">Uploaded Assets ({uploadedFiles.length})</label>
                    {uploadedFiles.map((file, idx) => (
                      <div key={idx} className="flex gap-4 p-3 bg-heritage-cream/10 dark:bg-stone-850 rounded-xl border border-heritage-brown/5 dark:border-stone-800 relative items-start">
                        {file.type === 'image' && (
                          <img src={file.url} className="w-16 h-16 object-cover rounded-xl border border-heritage-brown/5 shrink-0" alt="Preview" />
                        )}
                        <div className="flex-grow space-y-2">
                          <input
                            type="text"
                            required
                            value={file.title}
                            onChange={(e) => {
                              const copy = [...uploadedFiles];
                              copy[idx].title = e.target.value;
                              setUploadedFiles(copy);
                            }}
                            placeholder="Asset Title"
                            className="w-full px-3 py-1.5 bg-white dark:bg-stone-900 border border-heritage-brown/10 dark:border-stone-800 focus:border-heritage-olive/20 rounded-xl outline-none text-xs font-bold text-heritage-brown dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500"
                          />
                          <input
                            type="text"
                            value={file.desc}
                            onChange={(e) => {
                              const copy = [...uploadedFiles];
                              copy[idx].desc = e.target.value;
                              setUploadedFiles(copy);
                            }}
                            placeholder="Asset Description (optional)"
                            className="w-full px-3 py-1.5 bg-white dark:bg-stone-900 border border-heritage-brown/10 dark:border-stone-800 focus:border-heritage-olive/20 rounded-xl outline-none text-xs font-medium text-heritage-brown/70 dark:text-stone-300 placeholder-stone-400 dark:placeholder-stone-500"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => setUploadedFiles(prev => prev.filter((_, i) => i !== idx))}
                          className="p-1 hover:bg-rose-50 dark:hover:bg-stone-800 rounded-lg text-rose-500 cursor-pointer self-center"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  disabled={submittingImage || uploadedFiles.length === 0}
                  type="submit"
                  className="w-full py-4 bg-heritage-terracotta hover:bg-heritage-brown text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-md flex items-center justify-center gap-2 mt-2 cursor-pointer disabled:opacity-50"
                >
                  {submittingImage ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                  <span>Publish All {uploadedFiles.length > 0 ? `(${uploadedFiles.length} Assets)` : ''}</span>
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* TOAST PANEL */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 20, x: "-50%" }}
            className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-bold border ${
              toastType === 'success' 
                ? 'bg-stone-900 text-white border-stone-800' 
                : 'bg-red-600 text-white border-red-500'
            }`}
          >
            <Check className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
