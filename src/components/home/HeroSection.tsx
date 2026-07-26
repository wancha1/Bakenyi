import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, NavigateFunction } from 'react-router-dom';
import { Search, X, Compass, Newspaper, ArrowRight, Play, Pause, Film, Sparkles, ChevronRight, ChevronLeft } from 'lucide-react';
import { Button, Badge, FadeIn } from '../ui';

interface SearchResultItem {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  text: string;
  path: string;
}

interface HeroSectionProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  isSearchFocused: boolean;
  setIsSearchFocused: (value: boolean) => void;
  searchResults: SearchResultItem[];
  navigate: NavigateFunction;
}

// Curated motion pictures of Lake Kyoga riverine environments
const MOTION_PICTURES = [
  {
    id: 'slide-1',
    title: 'Lake Kyoga Wetlands at Golden Hour',
    subtitle: 'Floating Reed Horizons',
    url: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&q=80&w=2000',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-sunset-over-a-calm-lake-42867-large.mp4',
  },
  {
    id: 'slide-2',
    title: 'Dawn Canoe Voyage',
    subtitle: 'Ancestral Rowing Routes',
    url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&q=80&w=2000',
    videoUrl: '',
  },
  {
    id: 'slide-3',
    title: 'Sacred Waterways & Reeds',
    subtitle: 'Silt Basins of Uganda',
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=2000',
    videoUrl: '',
  },
  {
    id: 'slide-4',
    title: 'Serene Riverine Sanctuary',
    subtitle: 'Preserved Aquatic Echoes',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=2000',
    videoUrl: '',
  }
];

export default function HeroSection({
  searchTerm,
  setSearchTerm,
  isSearchFocused,
  setIsSearchFocused,
  searchResults,
  navigate,
}: HeroSectionProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlayingMotion, setIsPlayingMotion] = useState(true);
  const [useVideo, setUseVideo] = useState(true);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Auto-rotate motion picture slides when playing
  useEffect(() => {
    if (!isPlayingMotion) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % MOTION_PICTURES.length);
    }, 9000);
    return () => clearInterval(interval);
  }, [isPlayingMotion]);

  const activePicture = MOTION_PICTURES[currentSlide];

  return (
    <section 
      id="homepage-hero" 
      className="relative min-h-[95vh] flex items-center justify-center overflow-hidden bg-stone-950"
      aria-label="Welcome section"
    >
      {/* Background Motion Picture Layer */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activePicture.id + (useVideo && !videoError ? '-video' : '-img')}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.8, ease: "easeOut" }}
            className="absolute inset-0"
          >
            {useVideo && activePicture.videoUrl && !videoError ? (
              <video
                ref={videoRef}
                autoPlay
                loop
                muted
                playsInline
                onError={() => setVideoError(true)}
                className="w-full h-full object-cover brightness-[0.35] contrast-[1.1]"
              >
                <source src={activePicture.videoUrl} type="video/mp4" />
                <img src={activePicture.url} alt={activePicture.title} className="w-full h-full object-cover" />
              </video>
            ) : (
              <motion.img 
                src={activePicture.url} 
                alt={activePicture.title} 
                className="w-[108%] h-[108%] -left-[4%] -top-[4%] relative object-cover brightness-[0.3] contrast-[1.1]"
                referrerPolicy="no-referrer"
                animate={isPlayingMotion ? {
                  scale: [1.02, 1.08, 1.02],
                  x: [0, 12, -12, 0],
                  y: [0, -10, 10, 0],
                  rotate: [0, 0.5, -0.5, 0],
                } : { scale: 1.02 }}
                transition={{
                  duration: 25,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Ambient Water Sparkle Particle Overlay */}
        <div className="absolute inset-0 pointer-events-none z-1">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-amber-300/30 blur-[1px]"
              style={{
                width: `${Math.random() * 4 + 2}px`,
                height: `${Math.random() * 4 + 2}px`,
                left: `${(i * 8.5) % 100}%`,
                top: `${(i * 15 + 10) % 90}%`,
              }}
              animate={isPlayingMotion ? {
                y: [0, -35, 0],
                x: [0, (i % 2 === 0 ? 15 : -15), 0],
                opacity: [0.1, 0.7, 0.1],
                scale: [0.8, 1.4, 0.8],
              } : { opacity: 0.2 }}
              transition={{
                duration: 6 + (i % 5),
                repeat: Infinity,
                delay: i * 0.4,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>

        {/* Gradient Cinematic Vignette Overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-stone-950/40 via-stone-950/30 to-stone-950/95 z-2" />
        <div className="absolute inset-0 bg-gradient-to-r from-stone-950/60 via-transparent to-stone-950/60 z-2" />
        <div className="absolute inset-0 bg-black/20 backdrop-blur-[0.5px] z-2" />
      </div>

      {/* Floating Motion Picture Canvas Badge Bar (Top/Side Indicator) */}
      <div className="absolute top-6 right-6 z-20 hidden lg:flex items-center gap-3 bg-stone-900/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-stone-700/50 shadow-xl text-xs font-mono text-amber-200/90">
        <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px]">
          <span className={`w-2 h-2 rounded-full ${isPlayingMotion ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
          Motion Picture Canvas
        </span>
        <span className="text-stone-500">|</span>
        <span className="text-[11px] text-stone-300 font-sans font-medium line-clamp-1 max-w-[180px]">
          {activePicture.title}
        </span>
        <button 
          onClick={() => setIsPlayingMotion(!isPlayingMotion)}
          className="p-1 hover:bg-stone-800 rounded-full text-stone-300 hover:text-white transition-colors cursor-pointer"
          title={isPlayingMotion ? "Pause Motion Picture" : "Play Motion Picture"}
          id="btn-toggle-hero-motion"
        >
          {isPlayingMotion ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Hero Content Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white w-full py-16 flex flex-col items-center">
        <FadeIn direction="up" duration={0.8} className="w-full max-w-4xl flex flex-col items-center">
          
          {/* Subheading Pill Badge */}
          <div className="inline-flex items-center gap-2 mb-8 px-4 py-1.5 rounded-full bg-stone-900/85 border border-stone-700/70 backdrop-blur-md shadow-2xl">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-widest text-amber-200/90">
              Digital Sanctuary of the Bakenyi People
            </span>
          </div>
          
          {/* Typography Heading */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-serif font-black mb-8 leading-[1.08] tracking-tight drop-shadow-md">
            Preserving the <br />
            <span className="text-amber-400 dark:text-amber-300 font-serif italic drop-shadow-lg">
              Riverine Heritage
            </span>
          </h1>

          {/* Body description */}
          <p className="max-w-2xl mx-auto text-base sm:text-lg md:text-xl text-stone-200/90 mb-10 font-normal leading-relaxed text-shadow-sm">
            Explore the history, clans, language, and oral memories of Uganda's lake dwellers, archived directly under the guidance of the Council of Elders.
          </p>

          {/* Premium Search Bar */}
          <div className="relative w-full max-w-2xl mx-auto mb-10 z-30 hidden md:block">
            <div 
              className={`flex items-center bg-stone-900/90 backdrop-blur-md border ${
                isSearchFocused 
                  ? 'border-amber-500 ring-4 ring-amber-500/20' 
                  : 'border-stone-700/60 hover:border-stone-600'
              } rounded-2xl shadow-2xl transition-all duration-300 p-2 overflow-hidden`}
            >
              <div className="pl-4 pr-2">
                <Search className="w-5 h-5 text-amber-400" />
              </div>
              <input 
                type="text"
                placeholder="Search Stories, Clans, Vocabulary, Leaders, Events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                className="flex-grow bg-transparent border-none text-white px-2 py-2.5 text-sm focus:outline-none placeholder-stone-400 font-medium"
                aria-label="Search cultural records"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="p-2 text-stone-400 hover:text-white rounded-lg mr-1 cursor-pointer transition-colors"
                  id="btn-clear-hero-search"
                  title="Clear input"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <Button 
                variant="primary"
                onClick={() => navigate(`/search?q=${encodeURIComponent(searchTerm)}`)}
                id="btn-submit-hero-search"
                className="px-6 py-2.5 rounded-xl font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-md border border-amber-500/30"
              >
                Search
              </Button>
            </div>

            {/* Dropdown Instant Results Panel */}
            <AnimatePresence>
              {isSearchFocused && searchTerm.trim() && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setIsSearchFocused(false)} 
                    aria-hidden="true"
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 15 }}
                    className="absolute left-0 right-0 mt-3 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 rounded-3xl shadow-2xl border border-heritage-brown/10 dark:border-white/10 max-h-[400px] overflow-y-auto text-left z-20 p-4 scrollbar-thin"
                  >
                    <div className="flex justify-between items-center pb-2 mb-3 border-b border-heritage-brown/5 dark:border-white/5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-heritage-brown/40 dark:text-white/40">
                        Search Database Results ({searchResults.length})
                      </span>
                      <button 
                        onClick={() => setIsSearchFocused(false)}
                        className="text-heritage-brown/40 hover:text-heritage-terracotta dark:text-white/40 dark:hover:text-heritage-sand text-xs flex items-center gap-1 cursor-pointer font-bold"
                        id="btn-close-dropdown-search"
                      >
                        Close <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {searchResults.length > 0 ? (
                      <div className="space-y-1">
                        {searchResults.map((item) => (
                          <Link
                            key={item.id}
                            to={item.path}
                            onClick={() => setIsSearchFocused(false)}
                            className="block p-3 rounded-xl hover:bg-heritage-brown/5 dark:hover:bg-white/5 transition-all duration-200 border border-transparent hover:border-heritage-brown/5 dark:hover:border-white/5"
                            id={`hero-search-item-${item.id}`}
                          >
                            <div className="flex items-center justify-between">
                              <Badge variant="olive" size="sm">
                                {item.type}
                              </Badge>
                              <span className="text-[9px] text-heritage-brown/40 dark:text-white/40 font-mono font-bold tracking-wider">
                                {item.subtitle}
                              </span>
                            </div>
                            <h5 className="font-serif font-bold text-sm text-heritage-brown dark:text-white mt-1">
                              {item.title}
                            </h5>
                            <p className="text-xs text-heritage-brown/60 dark:text-white/60 line-clamp-1 mt-0.5">
                              {item.text}
                            </p>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="py-8 text-center text-heritage-brown/40 dark:text-white/40">
                        <Compass className="w-8 h-8 mx-auto text-heritage-brown/20 dark:text-white/20 mb-2 animate-pulse" />
                        <p className="text-xs font-bold">No exact cultural records found.</p>
                        <p className="text-[10px] text-heritage-brown/30 mt-1">Try another search term like "Clan", "Kyoga", "Canoe", or "Language".</p>
                      </div>
                    )}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* CTA Button Group */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto mb-8">
            <Button 
              variant="primary" 
              size="lg"
              onClick={() => navigate('/history')}
              leftIcon={<Compass className="w-4 h-4" />}
              id="cta-explore"
              className="w-full sm:w-auto font-black shadow-lg"
            >
              Explore Heritage
            </Button>
            
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => navigate('/news')}
              leftIcon={<Newspaper className="w-4 h-4" />}
              id="cta-submit-story"
              className="w-full sm:w-auto text-white dark:text-white border-white/20 hover:bg-white/10"
            >
              Get the Latest
            </Button>

            <Link 
              to="/about" 
              className="w-full sm:w-auto text-stone-300 hover:text-white text-xs font-bold uppercase tracking-wider py-3 flex items-center justify-center hover:underline"
              id="cta-learn-mission"
            >
              Learn Our Mission <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>

          {/* Motion Picture Gallery Navigation Pills */}
          <div className="flex items-center justify-center gap-2 max-w-full overflow-x-auto py-2 px-4 rounded-full bg-stone-900/60 border border-stone-800/80 backdrop-blur-md">
            <button
              onClick={() => setCurrentSlide((prev) => (prev - 1 + MOTION_PICTURES.length) % MOTION_PICTURES.length)}
              className="p-1 hover:bg-stone-800 rounded-full text-stone-400 hover:text-white cursor-pointer transition-colors"
              title="Previous Motion Picture"
              id="btn-hero-prev-slide"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <div className="flex items-center gap-2">
              {MOTION_PICTURES.map((pic, idx) => (
                <button
                  key={pic.id}
                  onClick={() => setCurrentSlide(idx)}
                  className={`group flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-medium transition-all cursor-pointer ${
                    currentSlide === idx 
                      ? 'bg-amber-500 text-stone-950 font-bold shadow-md' 
                      : 'bg-stone-800/80 text-stone-400 hover:text-stone-200 hover:bg-stone-800'
                  }`}
                  id={`btn-hero-slide-${idx}`}
                >
                  <Film className={`w-3 h-3 ${currentSlide === idx ? 'text-stone-950' : 'text-stone-500 group-hover:text-amber-400'}`} />
                  <span className="hidden sm:inline">{pic.subtitle}</span>
                  <span className="sm:hidden">{idx + 1}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setCurrentSlide((prev) => (prev + 1) % MOTION_PICTURES.length)}
              className="p-1 hover:bg-stone-800 rounded-full text-stone-400 hover:text-white cursor-pointer transition-colors"
              title="Next Motion Picture"
              id="btn-hero-next-slide"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </FadeIn>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/40 text-[9px] uppercase tracking-[0.25em] flex flex-col items-center gap-1.5 select-none z-10">
        <span>Explore Archives</span>
        <motion.div 
          animate={{ y: [0, 6, 0] }} 
          transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
          className="w-1.5 h-1.5 bg-amber-400 rounded-full"
        />
      </div>
    </section>
  );
}

