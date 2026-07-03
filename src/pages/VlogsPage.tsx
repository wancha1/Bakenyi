import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Calendar, Video, Search, X, ArrowRight, Loader2 } from 'lucide-react';
import { getVlogs, VlogItem, formatFirebaseDate } from '../lib/firebaseContentService';

export default function VlogsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeVideo, setActiveVideo] = useState<{title: string; url: string; desc: string} | null>(null);
  const [vlogsList, setVlogsList] = useState<VlogItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Load all vlogs from Firestore
  useEffect(() => {
    async function fetchVlogs() {
      try {
        const data = await getVlogs();
        setVlogsList(data);
      } catch (err) {
        console.error("Failed to load video logs:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchVlogs();
  }, []);

  // Filter vlogs
  const filteredVlogs = useMemo(() => {
    return vlogsList.filter(vlog => {
      return (
        (vlog.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (vlog.description || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [vlogsList, searchQuery]);

  // Helper to extract YouTube video ID
  const getEmbedUrl = (urlStr: string) => {
    try {
      if (!urlStr) return '';
      let videoId = '';
      if (urlStr.includes('youtube.com/watch')) {
        const urlParams = new URLSearchParams(new URL(urlStr).search);
        videoId = urlParams.get('v') || '';
      } else if (urlStr.includes('youtu.be/')) {
        videoId = urlStr.split('youtu.be/')[1]?.split('?')[0] || '';
      } else if (urlStr.includes('youtube.com/embed/')) {
        videoId = urlStr.split('youtube.com/embed/')[1]?.split('?')[0] || '';
      }
      return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1` : urlStr;
    } catch {
      return urlStr;
    }
  };

  if (loading) {
    return (
      <div className="pt-32 min-h-screen bg-heritage-cream dark:bg-zinc-950 flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-heritage-terracotta animate-spin mb-4" />
        <span className="text-xs font-black uppercase tracking-widest text-heritage-brown/40">Loading Video Archives...</span>
      </div>
    );
  }

  return (
    <div className="pt-24 min-h-screen bg-heritage-cream dark:bg-zinc-950 transition-colors duration-300 pb-20">
      
      {/* Banner Header */}
      <section className="bg-heritage-olive dark:bg-zinc-900 py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center space-x-2 px-3 py-1 bg-white/10 text-heritage-sand rounded-full text-xs font-bold uppercase tracking-widest mb-4"
          >
            <Video className="w-3.5 h-3.5" />
            <span>Digital Archive</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-serif font-bold text-white mb-6"
          >
            Bakenyi Heritage Vlogs
          </motion.h1>
          <p className="text-heritage-sand max-w-2xl mx-auto text-base md:text-lg font-medium leading-relaxed">
            Witness traditional boat construction, elder testimonies, musical performances, and historic festivals captured on camera.
          </p>
        </div>
      </section>

      {/* Main Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        
        {/* Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-12 bg-white/50 dark:bg-zinc-900/50 p-6 rounded-[24px] border border-heritage-brown/5 dark:border-zinc-800">
          <div className="relative flex-grow max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-heritage-brown/40 dark:text-zinc-500" />
            <input 
              type="text" 
              placeholder="Search vlogs and video journals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-zinc-950 border border-heritage-brown/10 dark:border-zinc-850 rounded-xl pl-11 pr-4 py-3 text-sm text-heritage-brown dark:text-white placeholder-heritage-brown/40 focus:outline-none focus:border-heritage-terracotta transition-all"
            />
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-heritage-brown/40 dark:text-zinc-500">
            {filteredVlogs.length} Videos Available
          </p>
        </div>

        {/* Video Grid */}
        {filteredVlogs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence mode="popLayout">
              {filteredVlogs.map((vlog) => (
                <motion.article
                  layout
                  key={vlog.id || vlog.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex flex-col bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl border border-heritage-brown/5 dark:border-zinc-800 hover:-translate-y-1 transition-all duration-350 group cursor-pointer"
                  onClick={() => setActiveVideo({
                    title: vlog.title || '',
                    url: vlog.youtubeUrl || '',
                    desc: vlog.description || ''
                  })}
                >
                  {/* Thumbnail Cover */}
                  <div className="aspect-[16/9] relative overflow-hidden bg-zinc-950">
                    <img 
                      src={vlog.thumbnailImage || "https://images.unsplash.com/photo-1523805009345-7448845a9e53?auto=format&fit=crop&q=80&w=800"} 
                      alt={vlog.title} 
                      className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    
                    {/* Dark/Play Overlay */}
                    <div className="absolute inset-0 bg-heritage-brown/20 group-hover:bg-heritage-brown/40 transition-colors flex items-center justify-center">
                      <div className="w-14 h-14 rounded-full bg-heritage-terracotta text-white flex items-center justify-center shadow-lg border border-white/20 transform scale-90 group-hover:scale-100 transition-transform duration-300">
                        <Play className="w-6 h-6 fill-current ml-1" />
                      </div>
                    </div>
                  </div>

                  {/* Body Info */}
                  <div className="p-6 flex flex-col flex-grow justify-between">
                    <div>
                      <div className="flex items-center space-x-2 text-[10px] font-bold text-heritage-brown/40 dark:text-zinc-500 mb-2">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Published {formatFirebaseDate(vlog.publishDate)}</span>
                      </div>
                      
                      <h3 className="text-lg md:text-xl font-serif font-bold text-heritage-brown dark:text-white leading-tight group-hover:text-heritage-terracotta dark:group-hover:text-heritage-sand transition-colors mb-2">
                        {vlog.title}
                      </h3>
                      
                      <p className="text-xs text-heritage-brown/60 dark:text-zinc-400 line-clamp-2 leading-relaxed mb-4">
                        {vlog.description}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-heritage-brown/5 dark:border-zinc-800 flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-heritage-brown dark:text-zinc-400 group-hover:text-heritage-terracotta transition-colors">
                      <span className="flex items-center space-x-1">
                        <Video className="w-3.5 h-3.5 text-heritage-terracotta" />
                        <span>Watch Video</span>
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1.5 transition-transform" />
                    </div>
                  </div>
                </motion.article>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="text-center py-24 bg-white dark:bg-zinc-900 rounded-[32px] border border-heritage-brown/5 dark:border-zinc-800">
            <Video className="w-12 h-12 text-heritage-brown/20 dark:text-zinc-600 mx-auto mb-4 animate-pulse" />
            <h3 className="text-xl font-serif font-bold text-heritage-brown dark:text-white mb-2">No Videos Found</h3>
            <p className="text-sm text-heritage-brown/50 dark:text-zinc-400 max-w-md mx-auto">
              We couldn't find any vlog episodes or documentary entries matching your search.
            </p>
          </div>
        )}

      </div>

      {/* Video Player Modal / Lightbox */}
      <AnimatePresence>
        {activeVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-heritage-brown/95 dark:bg-zinc-950/95 backdrop-blur-xl"
            onClick={() => setActiveVideo(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="relative max-w-4xl w-full bg-white dark:bg-zinc-900 rounded-[32px] overflow-hidden shadow-2xl border border-heritage-brown/5 dark:border-zinc-800"
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={() => setActiveVideo(null)}
                className="absolute top-6 right-6 z-50 p-2 bg-heritage-brown/10 dark:bg-zinc-800 text-heritage-brown dark:text-zinc-200 hover:bg-heritage-brown/20 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="aspect-video bg-black w-full">
                <iframe 
                  src={getEmbedUrl(activeVideo.url)}
                  title={activeVideo.title}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>

              <div className="p-8 md:p-10 bg-white dark:bg-zinc-900">
                <h2 className="text-2xl md:text-3xl font-serif font-bold text-heritage-brown dark:text-white mb-4 leading-tight">
                  {activeVideo.title}
                </h2>
                <p className="text-heritage-brown/70 dark:text-zinc-400 text-sm md:text-base leading-relaxed">
                  {activeVideo.desc}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
