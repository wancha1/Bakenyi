import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { Clock, Share2, Bookmark, Check, ArrowRight, ChevronRight } from 'lucide-react';
import { dailySpotlights, SpotlightItem } from '../../data/dailyHeritage';
import { Button, Badge, FadeIn } from '../ui';

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
    <section 
      id="daily-spotlight-exhibit" 
      className="py-20 bg-[#faf8f5] dark:bg-stone-950 border-b border-heritage-brown/5 dark:border-white/5 relative text-left"
    >
      {/* Toast Share Notification */}
      <AnimatePresence>
        {shareNotification && (
          <motion.div 
            initial={{ opacity: 0, y: 50, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 20, x: "-50%" }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] bg-heritage-brown text-white dark:bg-heritage-cream dark:text-heritage-ink px-6 py-3.5 rounded-full shadow-2xl border border-heritage-brown/10 dark:border-white/10 flex items-center gap-3 text-xs font-bold font-mono tracking-wider uppercase"
          >
            <Check className="w-4 h-4 text-emerald-500" />
            <span>{shareNotification}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <FadeIn direction="left" className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="sand" size="sm" pulse>
                Interactive Daily Exhibit
              </Badge>
            </div>
            <h2 className="text-3xl md:text-5xl font-serif font-black text-heritage-brown dark:text-white leading-tight">
              Today in Bakenyi Heritage
            </h2>
            <p className="text-xs sm:text-sm text-heritage-brown/65 dark:text-stone-400 max-w-xl leading-relaxed">
              A daily rotating showcase of wisdom, ecological innovations, and ancestral records curated by the Elder Council.
            </p>
          </FadeIn>
          
          <FadeIn direction="right" className="shrink-0 self-start md:self-end">
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-heritage-brown/55 dark:text-stone-400 bg-heritage-brown/[0.03] dark:bg-stone-900 border border-heritage-brown/5 dark:border-white/5 px-4.5 py-2.5 rounded-xl">
              <Clock className="w-4 h-4 text-heritage-terracotta" />
              <span>Rotates daily at midnight</span>
            </div>
          </FadeIn>
        </div>

        {/* Content Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left Block: Main Featured Daily Card */}
          <div className="lg:col-span-8 h-full">
            <FadeIn direction="up" className="h-full">
              <div 
                className="bg-white dark:bg-stone-900 border border-heritage-brown/10 dark:border-white/10 rounded-[32px] overflow-hidden shadow-sm flex flex-col md:flex-row h-full relative"
                id={`spotlight-card-${dailySpotlight.id}`}
              >
                {/* Visual Block */}
                <div className="md:w-1/2 relative min-h-[250px] md:min-h-full overflow-hidden">
                  <img 
                    src={dailySpotlight.image} 
                    alt={dailySpotlight.title} 
                    className="absolute inset-0 w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-stone-950/70 via-transparent to-transparent md:from-transparent" />
                  <span className="absolute top-4 left-4 z-10 px-4 py-1.5 bg-heritage-terracotta text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-lg">
                    {dailySpotlight.type} of the day
                  </span>
                </div>

                {/* Content Block */}
                <div className="md:w-1/2 p-8 md:p-10 flex flex-col justify-between">
                  <div className="space-y-4">
                    <span className="text-[10px] text-heritage-brown/40 dark:text-white/40 font-mono font-black uppercase tracking-wider block">
                      {dailySpotlight.metadata}
                    </span>
                    <h3 className="text-2xl font-serif font-black text-heritage-brown dark:text-white leading-snug">
                      {dailySpotlight.subtitle || dailySpotlight.title}
                    </h3>
                    
                    {dailySpotlight.lukenye && (
                      <p className="text-xs sm:text-sm font-serif italic text-heritage-terracotta dark:text-heritage-sand font-medium mb-4 bg-heritage-terracotta/5 p-4 rounded-2xl border border-heritage-terracotta/10">
                        {dailySpotlight.lukenye}
                      </p>
                    )}

                    <p className="text-xs sm:text-sm text-heritage-brown/70 dark:text-stone-300 leading-relaxed">
                      {dailySpotlight.desc}
                    </p>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-8 border-t border-heritage-brown/5 dark:border-white/5 mt-8 flex flex-col sm:flex-row gap-3">
                    <Button 
                      variant="primary"
                      onClick={() => {
                        addToRecentlyViewed({
                          id: dailySpotlight.id,
                          title: dailySpotlight.subtitle || dailySpotlight.title,
                          path: dailySpotlight.path,
                          type: dailySpotlight.type,
                          image: dailySpotlight.image
                        });
                        window.location.href = dailySpotlight.path;
                      }}
                      className="flex-grow rounded-2xl"
                      rightIcon={<ArrowRight className="w-4 h-4" />}
                    >
                      Learn More
                    </Button>

                    <div className="flex gap-2 shrink-0">
                      {/* Copy Link Trigger */}
                      <Button 
                        variant="ghost"
                        onClick={() => handleShare(dailySpotlight)}
                        id={`btn-share-spotlight-${dailySpotlight.id}`}
                        title="Share Exhibit Link"
                        className="p-3.5 border-2 border-heritage-brown/10 dark:border-white/10 rounded-2xl text-heritage-brown dark:text-white"
                        leftIcon={<Share2 className="w-4 h-4" />}
                        animateHover
                      />

                      {/* Bookmark Trigger */}
                      <Button 
                        variant="ghost"
                        onClick={() => toggleBookmark(dailySpotlight.id)}
                        id={`btn-bookmark-spotlight-${dailySpotlight.id}`}
                        title={bookmarks.includes(dailySpotlight.id) ? "Bookmarked (Click to remove)" : "Save Bookmark"}
                        className="p-3.5 border-2 border-heritage-brown/10 dark:border-white/10 rounded-2xl text-heritage-brown dark:text-white"
                        leftIcon={<Bookmark className={`w-4 h-4 ${bookmarks.includes(dailySpotlight.id) ? 'fill-heritage-terracotta text-heritage-terracotta border-transparent' : ''}`} />}
                        animateHover
                      />
                    </div>
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>

          {/* Right Block: Rotating curators list */}
          <div className="lg:col-span-4 flex flex-col gap-6 justify-between h-full">
            {[1, 2].map((offset, idx) => {
              const index = (new Date().getDate() + offset) % dailySpotlights.length;
              const spotlight = dailySpotlights[index];
              return (
                <FadeIn key={offset} direction="right" delay={idx * 0.15} className="flex-1">
                  <div
                    className="bg-white dark:bg-stone-900 border border-heritage-brown/10 dark:border-white/10 rounded-3xl p-5 shadow-xs flex items-center gap-4 group text-left h-full"
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
                      <Badge variant="olive" size="sm">
                        {spotlight.type}
                      </Badge>
                      <h4 className="font-serif font-bold text-sm text-heritage-brown dark:text-white truncate mt-1.5 font-bold">
                        {spotlight.subtitle || spotlight.title}
                      </h4>
                      <p className="text-[11px] text-heritage-brown/60 dark:text-stone-400 line-clamp-2 mt-1 leading-snug">
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
                        className="text-[9px] font-black uppercase tracking-widest text-heritage-terracotta hover:text-heritage-brown dark:text-heritage-sand dark:hover:text-white inline-flex items-center gap-1 mt-2.5 font-bold"
                      >
                        Explore <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </FadeIn>
              );
            })}
          </div>

        </div>
      </div>
    </section>
  );
}
