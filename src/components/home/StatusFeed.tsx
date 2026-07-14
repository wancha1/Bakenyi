import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Volume2, Video, Image as ImageIcon } from 'lucide-react';
import { Status } from '../../types/heritage';

interface StatusFeedProps {
  statuses: Status[];
  handleOpenStatus: (status: Status) => void;
}

export default function StatusFeed({ statuses, handleOpenStatus }: StatusFeedProps) {
  if (statuses.length === 0) return null;

  return (
    <section id="status-stories-feed" className="bg-white dark:bg-stone-900 py-10 border-b border-stone-100 dark:border-stone-800 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 text-left">
          <div>
            <span className="text-[9px] font-black uppercase tracking-[0.25em] text-amber-600 dark:text-amber-400 block mb-1">
              Living Chronicles
            </span>
            <h3 className="font-serif font-black text-xl text-stone-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" /> Live Cultural Status Stories
            </h3>
          </div>
          <span className="text-[10px] font-mono text-stone-400">
            Click bubble to enter the full-screen storyteller stream
          </span>
        </div>

        <div className="flex items-center gap-6 overflow-x-auto pb-4 pt-1 scrollbar-none">
          {statuses.map((status) => {
            const hasMedia = status.media_items && status.media_items.length > 0;
            const previewImage = hasMedia 
              ? status.media_items[0].url 
              : 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&q=80&w=150';

            return (
              <button 
                key={status.id}
                onClick={() => handleOpenStatus(status)}
                className="flex flex-col items-center shrink-0 space-y-2 focus:outline-none group relative cursor-pointer"
                id={`status-bubble-${status.id}`}
              >
                {/* Ring Container representing the story ring */}
                <div className="relative p-1 rounded-full bg-gradient-to-tr from-amber-500 via-orange-500 to-yellow-400 group-hover:scale-105 transition-transform duration-300 shadow-lg">
                  <div className="p-0.5 bg-white dark:bg-stone-900 rounded-full">
                    <img 
                      src={previewImage} 
                      alt="curator avatar" 
                      className="w-16 h-16 rounded-full object-cover filter brightness-95"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  
                  {/* Media Icon Badge */}
                  <span className="absolute bottom-0.5 right-0.5 w-6 h-6 bg-stone-950 text-white rounded-full flex items-center justify-center border-2 border-white dark:border-stone-900 shadow-md">
                    {status.media_items?.[0]?.type === 'audio' ? (
                      <Volume2 className="w-2.5 h-2.5 text-amber-400" />
                    ) : status.media_items?.[0]?.type === 'video' ? (
                      <Video className="w-2.5 h-2.5 text-amber-400" />
                    ) : (
                      <ImageIcon className="w-2.5 h-2.5 text-amber-400" />
                    )}
                  </span>
                </div>
                
                <div className="text-center">
                  <span className="block text-[11px] font-bold text-stone-800 dark:text-stone-200 max-w-[85px] truncate">
                    {status.text || 'Cultural Story'}
                  </span>
                  <span className="block text-[8px] text-stone-400 font-mono mt-0.5">
                    {status.view_count || 0} views • {status.reactions ? (Object.values(status.reactions) as number[]).reduce((a: number, b: number) => a + b, 0) : 0} reacts
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
