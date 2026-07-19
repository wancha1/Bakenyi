import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, NavigateFunction } from 'react-router-dom';
import { Search, X, Compass, PlusCircle, ArrowRight } from 'lucide-react';
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

export default function HeroSection({
  searchTerm,
  setSearchTerm,
  isSearchFocused,
  setIsSearchFocused,
  searchResults,
  navigate,
}: HeroSectionProps) {
  return (
    <section 
      id="homepage-hero" 
      className="relative min-h-[92vh] flex items-center justify-center overflow-hidden bg-stone-950"
      aria-label="Welcome section"
    >
      {/* Background with cinematic panning animation */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.8 }}
        className="absolute inset-0 z-0 overflow-hidden"
      >
        <motion.img 
          src="https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&q=80&w=2000" 
          alt="Lake Kyoga wetlands shoreline background" 
          className="w-[106%] h-[106%] -left-[3%] -top-[3%] relative object-cover brightness-[0.25] contrast-[1.05]"
          referrerPolicy="no-referrer"
          animate={{
            scale: [1.02, 1.07, 1.02],
            x: [0, 10, -10, 0],
            y: [0, -8, 8, 0],
          }}
          transition={{
            duration: 35,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-stone-950/20 via-stone-950/40 to-stone-950" />
        <div className="absolute inset-0 bg-black/20 backdrop-blur-[0.5px]" />
      </motion.div>

      {/* Hero Content Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white w-full py-16 flex flex-col items-center">
        <FadeIn direction="up" duration={0.8} className="w-full max-w-4xl flex flex-col items-center">
          
          {/* Subheading Badge */}
          <Badge 
            variant="sand" 
            size="md" 
            className="mb-8 border-heritage-sand/30 bg-heritage-sand/10 text-heritage-sand tracking-[0.25em] py-2 px-4 shadow-sm"
          >
            Digital Sanctuary of the Bakenyi People
          </Badge>
          
          {/* Typography Heading */}
          <h1 className="text-4xl sm:text-6xl md:text-8xl font-serif font-black mb-8 leading-[1.1] tracking-tight">
            Preserving the <br />
            <span className="text-heritage-terracotta dark:text-heritage-sand font-serif italic text-shadow-premium">
              Riverine Heritage
            </span>
          </h1>

          {/* Body description */}
          <p className="max-w-2xl mx-auto text-base sm:text-lg md:text-xl text-stone-300 mb-10 font-normal leading-relaxed">
            Explore the history, clans, language, and custom oral memories of Uganda's lake dwellers, archived directly from the Elder Council.
          </p>

          {/* Premium Search Bar */}
          <div className="relative w-full max-w-2xl mx-auto mb-12 z-30 hidden md:block">
            <div 
              className={`flex items-center bg-white dark:bg-stone-900 border ${
                isSearchFocused 
                  ? 'border-heritage-terracotta ring-4 ring-heritage-terracotta/20' 
                  : 'border-heritage-brown/10 dark:border-white/10'
              } rounded-[20px] shadow-2xl transition-all duration-300 p-1.5 overflow-hidden`}
            >
              <div className="pl-4 pr-2">
                <Search className="w-5 h-5 text-heritage-terracotta" />
              </div>
              <input 
                type="text"
                placeholder="Search Stories, Clans, Vocabulary, Leaders, Events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                className="flex-grow bg-transparent border-none text-stone-900 dark:text-stone-100 px-2 py-3 text-sm focus:outline-none placeholder-stone-500 font-medium"
                aria-label="Search cultural records"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="p-2 text-stone-400 hover:text-stone-600 rounded-lg mr-1 cursor-pointer"
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
                className="px-6 py-3 rounded-xl"
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
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
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
              onClick={() => navigate('/contribute')}
              leftIcon={<PlusCircle className="w-4 h-4" />}
              id="cta-submit-story"
              className="w-full sm:w-auto text-white dark:text-white border-white/20 hover:bg-white/10"
            >
              Submit News
            </Button>

            <Link 
              to="/about" 
              className="w-full sm:w-auto text-stone-300 hover:text-white text-xs font-bold uppercase tracking-wider py-3 flex items-center justify-center hover:underline"
              id="cta-learn-mission"
            >
              Learn Our Mission <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>

        </FadeIn>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/40 text-[9px] uppercase tracking-[0.25em] flex flex-col items-center gap-2 select-none">
        <span>Explore Archives</span>
        <motion.div 
          animate={{ y: [0, 8, 0] }} 
          transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
          className="w-1.5 h-1.5 bg-heritage-sand rounded-full"
        />
      </div>
    </section>
  );
}
