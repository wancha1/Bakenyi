import React from 'react';
import { motion } from 'motion/react';
import { Check, Compass } from 'lucide-react';

interface Story {
  id: string;
  type: string;
  created_at: string;
  imageUrl?: string;
  title: string;
  description: string;
  userEmail?: string;
}

interface CommunityContributionsProps {
  recentStories: Story[];
}

export default function CommunityContributions({ recentStories }: CommunityContributionsProps) {
  return (
    <section id="vouched-community-stories" className="py-24 bg-stone-50 dark:bg-stone-900/20 relative text-left">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-16">
          <span className="text-amber-600 dark:text-amber-400 font-black text-[10px] uppercase tracking-[0.25em] block mb-2">
            Community Contributions
          </span>
          <h2 className="text-3xl md:text-5xl font-serif font-black text-stone-900 dark:text-white leading-tight">
            Recently Vouched Contributions
          </h2>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-2 max-w-xl">
            These digital historical records have been submitted by community members and approved by the Elder Council.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {recentStories.map((story) => (
            <motion.div 
              key={story.id}
              whileHover={{ y: -3 }}
              className="bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800 rounded-3xl p-5 shadow-xs flex flex-col h-full justify-between group"
              id={`vouched-story-${story.id}`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-wider text-stone-400">
                  <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded font-bold">
                    {story.type.toUpperCase()}
                  </span>
                  <span className="font-mono">
                    {new Date(story.created_at).toLocaleDateString()}
                  </span>
                </div>

                {story.imageUrl && (
                  <div className="h-32 rounded-xl overflow-hidden border border-stone-100 dark:border-stone-800 relative bg-stone-50">
                    <img 
                      src={story.imageUrl} 
                      alt={story.title} 
                      className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500" 
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}

                <h4 className="font-serif font-bold text-sm text-stone-900 dark:text-white line-clamp-1 font-bold">
                  {story.title}
                </h4>

                <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed line-clamp-3">
                  {story.description}
                </p>
              </div>

              <div className="pt-4 border-t border-stone-100 dark:border-stone-800 mt-4 flex items-center justify-between">
                <span className="text-[10px] text-stone-400 truncate max-w-[120px]">
                  By <strong className="text-stone-700 dark:text-stone-300 truncate max-w-[80px] inline-block align-bottom font-mono">{story.userEmail ? story.userEmail.split('@')[0] : 'Custodian'}</strong>
                </span>
                <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded flex items-center gap-1 font-mono">
                  <Check className="w-3 h-3" /> Vouched
                </span>
              </div>
            </motion.div>
          ))}

          {recentStories.length === 0 && (
            <div className="col-span-1 sm:col-span-2 lg:col-span-4 text-center py-16 bg-white/40 dark:bg-stone-900/20 rounded-3xl border border-dashed border-stone-200 dark:border-stone-800 space-y-2">
              <Compass className="w-8 h-8 text-stone-300 mx-auto" />
              <p className="text-xs text-stone-500 dark:text-stone-400 font-bold">Chronicles in Transcription...</p>
              <p className="text-[10px] text-stone-400">Elders are currently auditing newly submitted community documents.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
