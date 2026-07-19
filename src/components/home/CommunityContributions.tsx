import React from 'react';
import { Check, Compass } from 'lucide-react';
import { Badge, Card, ListStagger, ListItem, FadeIn } from '../ui';

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
    <section 
      id="vouched-community-stories" 
      className="py-24 bg-stone-50 dark:bg-stone-900/20 relative text-left"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Block */}
        <div className="mb-16">
          <FadeIn direction="up">
            <Badge variant="sand" size="sm" className="mb-2">
              Community Contributions
            </Badge>
            <h2 className="text-3xl md:text-5xl font-serif font-black text-heritage-brown dark:text-white leading-tight">
              Recently Vouched Contributions
            </h2>
            <p className="text-xs sm:text-sm text-heritage-brown/65 dark:text-stone-400 mt-2 max-w-xl leading-relaxed">
              These digital historical records have been submitted by community members and approved by the Elder Council.
            </p>
          </FadeIn>
        </div>

        {/* Dynamic Stagger Grid */}
        <ListStagger className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {recentStories.map((story) => (
            <ListItem key={story.id}>
              <Card 
                variant="default"
                hoverEffect="translate"
                className="p-5 flex flex-col h-full justify-between group"
                id={`vouched-story-${story.id}`}
              >
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-wider text-heritage-brown/40 dark:text-stone-500">
                    <Badge variant="sand" size="sm">
                      {story.type}
                    </Badge>
                    <span className="font-mono font-bold">
                      {new Date(story.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {story.imageUrl && (
                    <div className="h-32 rounded-xl overflow-hidden border border-heritage-brown/5 dark:border-white/5 relative bg-stone-50">
                      <img 
                        src={story.imageUrl} 
                        alt={story.title} 
                        className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500" 
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}

                  <h4 className="font-serif font-bold text-sm text-heritage-brown dark:text-white line-clamp-1">
                    {story.title}
                  </h4>

                  <p className="text-xs text-heritage-brown/60 dark:text-stone-400 leading-relaxed line-clamp-3">
                    {story.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-heritage-brown/5 dark:border-white/5 mt-4 flex items-center justify-between">
                  <span className="text-[10px] text-heritage-brown/45 dark:text-stone-500 font-bold uppercase tracking-wider truncate max-w-[120px]">
                    By <strong className="text-heritage-brown dark:text-stone-300 font-mono">{story.userEmail ? story.userEmail.split('@')[0] : 'Custodian'}</strong>
                  </span>
                  <Badge variant="olive" size="sm" className="flex items-center gap-1">
                    <Check className="w-3 h-3" /> Vouched
                  </Badge>
                </div>
              </Card>
            </ListItem>
          ))}
        </ListStagger>

        {recentStories.length === 0 && (
          <FadeIn direction="up">
            <div className="col-span-1 sm:col-span-2 lg:col-span-4 text-center py-16 bg-white/40 dark:bg-stone-900/20 rounded-3xl border border-dashed border-heritage-brown/10 dark:border-white/10 space-y-2">
              <Compass className="w-8 h-8 text-heritage-brown/20 dark:text-white/20 mx-auto animate-pulse" />
              <p className="text-xs text-heritage-brown/60 dark:text-stone-400 font-bold">Chronicles in Transcription...</p>
              <p className="text-[10px] text-heritage-brown/40 dark:text-stone-500">Elders are currently auditing newly submitted community documents.</p>
            </div>
          </FadeIn>
        )}
      </div>
    </section>
  );
}
