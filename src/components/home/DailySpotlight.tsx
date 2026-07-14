import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { Clock, Share2, Bookmark, Check, ArrowRight, ChevronRight } from 'lucide-react';
import { dailySpotlights, SpotlightItem } from '../../data/dailyHeritage';

interface DailySpotlightProps {
  dailySpotlight: SpotlightItem;
  shareNotification: string | null;
  bookmarks: string[];
  toggleBookmark: (id: string) => void;
  handleShare: (item: any) => void;
  addToRecentlyViewed: (item: any) => void;
}

export default function DailySpotlight({
  dailySpotlight,
  shareNotification,
  bookmarks,
  toggleBookmark,
  handleShare,
  addToRecentlyViewed,
}: DailySpotlightProps) {
  return (
    <section id="daily-spotlight-exhibit" className="py-20 bg-[#faf8f5] dark:bg-stone-950 border-b border-stone-200/50 dark:border-stone-800/80 relative text-left">
      {/* Share Notification Toast */}
      <AnimatePresence>
        {shareNotification && (
          <motion.div 
            initial={{ opacity: 0, y: 50, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 20, x: "-50%" }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] bg-stone-900 dark:bg-white text-white dark:text-stone-950 px-6 py-3 rounded-full shadow-2xl border border-stone-800 dark:border-stone-100 flex items-center gap-3 text-sm font-bold animate-fade-in"
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
              A daily rotating showcase of wisdom, ecological innovations, and ancestral records curated by the Elder Council.
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
            id={`spotlight-card-${dailySpotlight.id}`}
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

                <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed font-normal text-left">
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
                    id={`btn-share-spotlight-${dailySpotlight.id}`}
                  >
                    <Share2 className="w-4 h-4" />
                  </button>

                  {/* Bookmark Button */}
                  <button 
                    onClick={() => toggleBookmark(dailySpotlight.id)}
                    className="p-3.5 bg-stone-50 hover:bg-stone-100 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 rounded-2xl border border-stone-200/10 hover:scale-[1.03] transition-all cursor-pointer"
                    title={bookmarks.includes(dailySpotlight.id) ? "Bookmarked (Click to remove)" : "Save Bookmark"}
                    id={`btn-bookmark-spotlight-${dailySpotlight.id}`}
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
                  className="bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800 rounded-3xl p-5 shadow-xs flex items-center gap-4 group text-left"
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
  );
}
