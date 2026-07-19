import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Sparkles, BookOpen, ImageIcon, Volume2, Users } from 'lucide-react';
import { Badge, Button, Card, FadeIn, ListStagger, ListItem } from '../ui';

interface VisitorEngagementProps {
  recentlyViewed: any[];
  setRecentlyViewed: (value: any[]) => void;
  addToRecentlyViewed: (item: any) => void;
}

export default function VisitorEngagement({
  recentlyViewed,
  setRecentlyViewed,
  addToRecentlyViewed,
}: VisitorEngagementProps) {
  return (
    <>
      {/* PERSONAL LOGBOOK & CURATOR'S PICKS */}
      <section 
        id="visitor-log-exhibits" 
        className="py-20 bg-stone-50 dark:bg-stone-900/10 border-t border-b border-heritage-brown/5 dark:border-white/5 relative text-left"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Recently Viewed Block */}
          {recentlyViewed.length > 0 && (
            <div className="mb-16">
              <div className="flex items-center justify-between mb-8">
                <FadeIn direction="left">
                  <span className="text-heritage-terracotta dark:text-heritage-sand font-black text-[10px] uppercase tracking-[0.25em] block mb-1">
                    Your Personal Logbook
                  </span>
                  <h3 className="text-2xl font-serif font-black text-heritage-brown dark:text-white flex items-center gap-2">
                    <Clock className="w-5 h-5 text-heritage-terracotta" /> Continue Your Voyage
                  </h3>
                </FadeIn>
                
                <FadeIn direction="right">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      localStorage.removeItem('bakenyi-recently-viewed');
                      setRecentlyViewed([]);
                    }}
                    id="btn-clear-logbook"
                    className="text-[10px] font-mono font-bold uppercase tracking-widest text-heritage-brown/40 hover:text-heritage-terracotta"
                  >
                    Clear Log
                  </Button>
                </FadeIn>
              </div>

              <ListStagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {recentlyViewed.map((item) => (
                  <ListItem key={item.id}>
                    <Card
                      variant="default"
                      hoverEffect="translate"
                      className="overflow-hidden p-4 flex gap-4 items-center group shadow-2xs"
                    >
                      <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 relative bg-stone-100">
                        <img 
                          src={item.image} 
                          alt={item.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="min-w-0 flex-grow">
                        <Badge variant="sand" size="sm">
                          {item.type}
                        </Badge>
                        <h4 className="font-serif font-bold text-xs text-heritage-brown dark:text-white truncate mt-1">
                          {item.title}
                        </h4>
                        <Link 
                          to={item.path}
                          className="text-[9px] font-black uppercase text-heritage-terracotta hover:text-heritage-brown dark:text-heritage-sand dark:hover:text-white inline-flex items-center gap-0.5 mt-1 font-bold"
                        >
                          Resume &rarr;
                        </Link>
                      </div>
                    </Card>
                  </ListItem>
                ))}
              </ListStagger>
            </div>
          )}

          {/* Recommended Highlights Grid */}
          <div>
            <div className="mb-10">
              <FadeIn direction="up">
                <span className="text-heritage-terracotta dark:text-heritage-sand font-black text-[10px] uppercase tracking-[0.25em] block mb-1">
                  Curator's Highlights
                </span>
                <h3 className="text-2xl md:text-3xl font-serif font-black text-heritage-brown dark:text-white flex items-center gap-2">
                  <Sparkles className="w-5.5 h-5.5 text-heritage-terracotta" /> Editor's Recommended Exhibits
                </h3>
                <p className="text-xs sm:text-sm text-heritage-brown/65 dark:text-stone-400 mt-1 max-w-lg leading-relaxed">
                  Highly recommended historical entries chosen by our archiving librarians to deepen your cultural understanding.
                </p>
              </FadeIn>
            </div>

            <ListStagger className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  id: 'pick-1',
                  title: 'Architecture of Floating Reed Houses',
                  desc: 'Discover the ancient structural science behind homes that float directly on top of deep-water silt layers.',
                  image: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&q=80&w=400',
                  path: '/history',
                  tag: 'History'
                },
                {
                  id: 'pick-2',
                  title: 'Lineage of the founding Water Clans',
                  desc: 'Understand the traditional boundaries, canoe emblems, and sacred totems of the founding Bakenyi clans.',
                  image: 'https://images.unsplash.com/photo-1501535033-a593e6afb94d?auto=format&fit=crop&q=80&w=400',
                  path: '/clans',
                  tag: 'Ancestry'
                },
                {
                  id: 'pick-3',
                  title: 'Historic Paddling Songs Archive',
                  desc: 'Listen to restored field recordings of rowing rhythms used to synchronize high-speed canoe navigation.',
                  image: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&q=80&w=400',
                  path: '/gallery',
                  tag: 'Acoustics'
                },
                {
                  id: 'pick-4',
                  title: 'Interactive Dialect Pronunciations',
                  desc: 'Explore our curated audio dictionary preserving the unique marine terminology of native Lukenye speech.',
                  image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&q=80&w=400',
                  path: '/language',
                  tag: 'Linguistics'
                }
              ].map((pick) => (
                <ListItem key={pick.id}>
                  <Card
                    variant="default"
                    hoverEffect="translate"
                    className="p-4 flex flex-col justify-between h-full group"
                  >
                    <div>
                      <div className="h-32 rounded-2xl overflow-hidden relative mb-4">
                        <img 
                          src={pick.image} 
                          alt={pick.title} 
                          className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                        <span className="absolute top-3 left-3 bg-stone-950/85 backdrop-blur-xs text-heritage-sand font-mono text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded">
                          {pick.tag}
                        </span>
                      </div>
                      <h4 className="font-serif font-bold text-sm text-heritage-brown dark:text-white leading-snug line-clamp-2">
                        {pick.title}
                      </h4>
                      <p className="text-[11px] text-heritage-brown/60 dark:text-stone-400 leading-relaxed mt-2 line-clamp-3">
                        {pick.desc}
                      </p>
                    </div>
                    <div className="pt-4 border-t border-heritage-brown/5 dark:border-white/5 mt-4 text-right">
                      <Link
                        to={pick.path}
                        onClick={() => addToRecentlyViewed({
                          id: pick.id,
                          title: pick.title,
                          path: pick.path,
                          type: 'Recommendation',
                          image: pick.image
                        })}
                        className="text-[10px] font-black uppercase text-heritage-terracotta hover:text-heritage-brown dark:text-heritage-sand flex items-center gap-1 font-bold"
                      >
                        Enter Exhibit &rarr;
                      </Link>
                    </div>
                  </Card>
                </ListItem>
              ))}
            </ListStagger>
          </div>
        </div>
      </section>

      {/* QUOTE BANNER */}
      <section 
        id="cultural-garrison-quote" 
        className="py-24 bg-stone-950 relative overflow-hidden text-center text-white"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-heritage-sand/10 via-transparent to-transparent pointer-events-none" />
        <FadeIn direction="up" className="max-w-4xl mx-auto px-4 relative z-10">
          <span className="text-6xl font-serif text-heritage-sand/40 block mb-4">"</span>
          <p className="text-2xl md:text-3xl font-serif italic mb-8 leading-relaxed text-stone-200">
            "A people without the knowledge of their past history, origin and culture is like a tree without roots."
          </p>
          <div className="w-12 h-px bg-heritage-sand/50 mx-auto mb-4" />
          <p className="text-heritage-sand font-black tracking-widest uppercase text-xs">Marcus Garvey</p>
        </FadeIn>
      </section>

      {/* CALL TO ACTION Preserving the History */}
      <section 
        id="homepage-cta-drive" 
        className="py-24 bg-[#1c1917] text-white relative text-left"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-heritage-sand/5 via-stone-900 to-stone-950 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <FadeIn direction="left" className="space-y-6">
              <span className="text-heritage-sand font-black text-[10px] uppercase tracking-[0.25em] block mb-3">
                Join the Custodian Ranks
              </span>
              <h2 className="text-3xl sm:text-5xl font-serif font-black mb-6 leading-tight">
                Help Preserve the History of the Bakenyi People
              </h2>
              <p className="text-stone-300 text-sm sm:text-base leading-relaxed mb-8">
                Your ancestral memories, family lineages, traditional song recordings, and historic photographs are crucial to the survival of the Lukenye culture. Become a verified archive contributor today.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <span className="w-8 h-8 rounded-full bg-heritage-sand/10 text-heritage-sand flex items-center justify-center font-bold text-sm shrink-0 border border-heritage-sand/20">
                    1
                  </span>
                  <div>
                    <h5 className="font-bold text-sm text-stone-100">Submit Oral Tracks</h5>
                    <p className="text-xs text-stone-400 mt-1">Upload voice memoirs or ancestral storytelling recordings.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-8 h-8 rounded-full bg-heritage-sand/10 text-heritage-sand flex items-center justify-center font-bold text-sm shrink-0 border border-heritage-sand/20">
                    2
                  </span>
                  <div>
                    <h5 className="font-bold text-sm text-stone-100">Register Clan Lineage</h5>
                    <p className="text-xs text-stone-400 mt-1">Ensure your family totem and migration history is documented.</p>
                  </div>
                </div>
              </div>
            </FadeIn>

            <FadeIn direction="right">
              <div className="bg-stone-900/80 border border-stone-800 rounded-3xl p-8 shadow-2xl space-y-6">
                <h4 className="font-serif font-bold text-xl text-stone-100">
                  Initiate a Submission
                </h4>
                <p className="text-xs text-stone-400">
                  Choose a contribution channel to launch our simplified elder approval wizard.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Link 
                    to="/contribute" 
                    className="p-4 rounded-2xl bg-stone-950 border border-stone-800 hover:border-heritage-sand/50 transition-colors block text-left"
                  >
                    <BookOpen className="w-5 h-5 text-heritage-sand mb-2" />
                    <h5 className="font-bold text-xs text-stone-100">Submit News</h5>
                    <p className="text-[10px] text-stone-400 mt-1">Write historical logs or transcription drafts.</p>
                  </Link>
                  <Link 
                    to="/contribute" 
                    className="p-4 rounded-2xl bg-stone-950 border border-stone-800 hover:border-heritage-sand/50 transition-colors block text-left"
                  >
                    <ImageIcon className="w-5 h-5 text-emerald-500 mb-2" />
                    <h5 className="font-bold text-xs text-stone-100">Upload Photos</h5>
                    <p className="text-[10px] text-stone-400 mt-1">Publish pictures of family landmarks or craft.</p>
                  </Link>
                  <Link 
                    to="/contribute" 
                    className="p-4 rounded-2xl bg-stone-950 border border-stone-800 hover:border-heritage-sand/50 transition-colors block text-left"
                  >
                    <Volume2 className="w-5 h-5 text-rose-500 mb-2" />
                    <h5 className="font-bold text-xs text-stone-100">Share Oral History</h5>
                    <p className="text-[10px] text-stone-400 mt-1">Record and stream native audio memories.</p>
                  </Link>
                  <Link 
                    to="/contribute" 
                    className="p-4 rounded-2xl bg-heritage-sand text-stone-950 hover:bg-heritage-sand/90 transition-colors block text-left"
                  >
                    <Users className="w-5 h-5 text-stone-950 mb-2" />
                    <h5 className="font-black text-xs">Become Contributor</h5>
                    <p className="text-[10px] text-stone-950/80 mt-1">Access full publishing capabilities.</p>
                  </Link>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>
    </>
  );
}
