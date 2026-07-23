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
      className="bg-amber-500/5 dark:bg-stone-900/60 py-10 border-y border-stone-200/60 dark:border-stone-800/80 relative text-left backdrop-blur-sm"
      aria-label="Live cultural status feed"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400">
                Living Chronicles
              </span>
            </div>
            <h3 className="font-serif font-bold text-xl sm:text-2xl text-stone-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400" /> Live Cultural Status Stories
            </h3>
          </div>
          <span className="text-[10px] font-mono text-stone-600 dark:text-stone-400 font-bold uppercase tracking-wider bg-white dark:bg-stone-800/80 px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 shadow-xs select-none self-start sm:self-auto">
            Click bubble to stream vetted stories
          </span>
        </div>

        {/* List Stagger Animation Container */}
        <ListStagger className="flex items-center gap-6 overflow-x-auto pb-3 pt-2 scrollbar-none">
          {statuses.map((status) => {
            const hasMedia = status.media_items && status.media_items.length > 0;
            const previewImage = hasMedia 
              ? status.media_items[0].url 
              : 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&q=80&w=150';

            return (
              <ListItem key={status.id} className="shrink-0">
                <button 
                  onClick={() => handleOpenStatus(status)}
                  className="flex flex-col items-center space-y-2 focus:outline-none group relative cursor-pointer"
                  id={`status-bubble-${status.id}`}
                  aria-label={`View story: ${status.text || 'Cultural Story'}`}
                >
                  {/* Outer ring container */}
                  <div className="relative p-0.5 rounded-full bg-gradient-to-tr from-amber-600 via-amber-400 to-stone-400 group-hover:scale-105 group-hover:shadow-md transition-all duration-300">
                    <div className="p-0.5 bg-white dark:bg-stone-950 rounded-full">
                      <img 
                        src={previewImage} 
                        alt="Curator upload preview" 
                        className="w-16 h-16 rounded-full object-cover filter brightness-95"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    
                    {/* Visual Media Type Indicator */}
                    <span className="absolute bottom-0 right-0 w-5 h-5 bg-stone-900 text-amber-400 rounded-full flex items-center justify-center border border-white dark:border-stone-900 shadow-sm">
                      {status.media_items?.[0]?.type === 'audio' ? (
                        <Volume2 className="w-2.5 h-2.5" />
                      ) : status.media_items?.[0]?.type === 'video' ? (
                        <Video className="w-2.5 h-2.5" />
                      ) : (
                        <ImageIcon className="w-2.5 h-2.5" />
                      )}
                    </span>
                  </div>
                  
                  <div className="text-center max-w-[96px]">
                    <span className="block text-xs font-semibold text-stone-900 dark:text-stone-100 truncate group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
                      {status.text || 'Cultural Story'}
                    </span>
                    <span className="block text-[9px] text-stone-600 dark:text-stone-400 font-mono font-medium tracking-wider mt-0.5">
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
