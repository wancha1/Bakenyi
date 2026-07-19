import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Volume2, Video, Image as ImageIcon } from 'lucide-react';
import { Status } from '../../types/heritage';
import { Badge, ListStagger, ListItem } from '../ui';

interface StatusFeedProps {
  statuses: Status[];
  handleOpenStatus: (status: Status) => void;
}

export default function StatusFeed({ statuses, handleOpenStatus }: StatusFeedProps) {
  if (statuses.length === 0) return null;

  return (
    <section 
      id="status-stories-feed" 
      className="bg-white dark:bg-stone-900 py-12 border-b border-heritage-brown/5 dark:border-white/5 relative text-left"
      aria-label="Live cultural status feed"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <span className="text-[9px] font-black uppercase tracking-[0.25em] text-heritage-terracotta dark:text-heritage-sand block mb-1">
              Living Chronicles
            </span>
            <h3 className="font-serif font-black text-2xl text-heritage-brown dark:text-white flex items-center gap-2">
              <Sparkles className="w-5.5 h-5.5 text-heritage-terracotta animate-pulse" /> Live Cultural Status Stories
            </h3>
          </div>
          <span className="text-[10px] font-mono text-heritage-brown/40 dark:text-white/40 font-bold uppercase tracking-wider bg-heritage-brown/[0.03] dark:bg-white/[0.03] px-3.5 py-1.5 rounded-xl border border-heritage-brown/5 dark:border-white/5 select-none">
            Click bubble to stream vetted stories
          </span>
        </div>

        {/* List Stagger Animation Container */}
        <ListStagger className="flex items-center gap-6 overflow-x-auto pb-4 pt-1 scrollbar-none">
          {statuses.map((status) => {
            const hasMedia = status.media_items && status.media_items.length > 0;
            const previewImage = hasMedia 
              ? status.media_items[0].url 
              : 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&q=80&w=150';

            return (
              <ListItem key={status.id} className="shrink-0">
                <button 
                  onClick={() => handleOpenStatus(status)}
                  className="flex flex-col items-center space-y-2.5 focus:outline-none group relative cursor-pointer outline-none"
                  id={`status-bubble-${status.id}`}
                  aria-label={`View story: ${status.text || 'Cultural Story'}`}
                >
                  {/* Outer glowing ring container */}
                  <div className="relative p-1 rounded-full bg-gradient-to-tr from-heritage-terracotta via-heritage-sand to-heritage-olive group-hover:scale-105 transition-transform duration-300 shadow-md">
                    <div className="p-0.5 bg-white dark:bg-stone-900 rounded-full">
                      <img 
                        src={previewImage} 
                        alt="Curator upload preview" 
                        className="w-16 h-16 rounded-full object-cover filter brightness-95"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    
                    {/* Visual Media Type Indicator */}
                    <span className="absolute bottom-0.5 right-0.5 w-6 h-6 bg-heritage-brown text-white dark:bg-heritage-cream dark:text-heritage-ink rounded-full flex items-center justify-center border-2 border-white dark:border-stone-900 shadow-md">
                      {status.media_items?.[0]?.type === 'audio' ? (
                        <Volume2 className="w-2.5 h-2.5 text-heritage-sand" />
                      ) : status.media_items?.[0]?.type === 'video' ? (
                        <Video className="w-2.5 h-2.5 text-heritage-sand" />
                      ) : (
                        <ImageIcon className="w-2.5 h-2.5 text-heritage-sand" />
                      )}
                    </span>
                  </div>
                  
                  <div className="text-center max-w-[90px]">
                    <span className="block text-xs font-bold text-heritage-ink truncate">
                      {status.text || 'Cultural Story'}
                    </span>
                    <span className="block text-[8px] text-heritage-brown/40 dark:text-white/40 font-mono font-bold uppercase tracking-wider mt-0.5">
                      {status.view_count || 0} views
                    </span>
                  </div>
                </button>
              </ListItem>
            );
          })}
        </ListStagger>
      </div>
    </section>
  );
}
