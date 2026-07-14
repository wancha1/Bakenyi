import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, NavigateFunction } from 'react-router-dom';
import { Search, X, Compass } from 'lucide-react';

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
    <section id="homepage-hero" className="relative min-h-[92vh] flex items-center justify-center overflow-hidden bg-stone-950">
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
                  id="btn-clear-hero-search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button 
                onClick={() => navigate(`/search?q=${encodeURIComponent(searchTerm)}`)}
                className="bg-amber-500 hover:bg-amber-400 text-stone-950 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
                id="btn-submit-hero-search"
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
                        id="btn-close-dropdown-search"
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
                            id={`hero-search-item-${item.id}`}
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
              className="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs uppercase tracking-widest px-10 py-4.5 rounded-2xl flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] shadow-xl cursor-pointer font-bold"
              id="cta-explore"
            >
              Explore Heritage <Compass className="w-4 h-4" />
            </Link>
            <Link 
              to="/contribute" 
              className="w-full sm:w-auto bg-white/10 hover:bg-white/15 text-white border border-white/20 font-black text-xs uppercase tracking-widest px-10 py-4.5 rounded-2xl transition-all hover:border-white/40 flex items-center justify-center cursor-pointer font-bold"
              id="cta-submit-story"
            >
              Submit a Story
            </Link>
            <Link 
              to="/about" 
              className="w-full sm:w-auto text-stone-300 hover:text-white text-xs font-bold uppercase tracking-wider py-3 flex items-center justify-center hover:underline"
              id="cta-learn-mission"
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
  );
}
