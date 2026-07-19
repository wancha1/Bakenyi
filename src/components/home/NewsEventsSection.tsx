import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Megaphone, AlertTriangle, Pin, User, ChevronRight, 
  Calendar, Clock, MapPin 
} from 'lucide-react';
import { News, Announcement, Event } from '../../types/heritage';
import { Badge, Button, Card, FadeIn } from '../ui';

interface NewsEventsSectionProps {
  pinnedAnnouncement: Announcement | null;
  news: News[];
  events: Event[];
  getCountdown: (dateStr: string) => string;
  setSelectedEventForRsvp: (event: Event) => void;
}

export default function NewsEventsSection({
  pinnedAnnouncement,
  news,
  events,
  getCountdown,
  setSelectedEventForRsvp,
}: NewsEventsSectionProps) {
  return (
    <section 
      id="official-news-and-gatherings" 
      className="py-24 bg-white dark:bg-stone-950 relative text-left border-t border-b border-heritage-brown/5 dark:border-white/5"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Pinned Notice Section */}
        {pinnedAnnouncement && (
          <FadeIn direction="up" className="mb-16">
            <div 
              className="bg-heritage-terracotta/5 dark:bg-heritage-terracotta/2 px-6 sm:px-10 py-8 rounded-[32px] border border-heritage-terracotta/10 flex flex-col md:flex-row md:items-center justify-between gap-8 relative overflow-hidden"
              id={`pinned-notice-${pinnedAnnouncement.id}`}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-heritage-terracotta/10 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-heritage-terracotta/15 flex items-center justify-center shrink-0 text-heritage-terracotta">
                  <Megaphone className="w-6 h-6 animate-pulse" />
                </div>
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="terracotta" size="sm">
                      <AlertTriangle className="w-2.5 h-2.5 mr-1" /> High Priority
                    </Badge>
                    <Badge variant="sand" size="sm">
                      <Pin className="w-2.5 h-2.5 mr-1" /> PINNED DECREE
                    </Badge>
                    {pinnedAnnouncement.end_date && (
                      <span className="text-[9px] text-heritage-brown/40 dark:text-stone-500 font-mono font-bold uppercase tracking-wider">
                        Active till {new Date(pinnedAnnouncement.end_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <h4 className="font-serif font-black text-xl text-heritage-brown dark:text-white">
                    {pinnedAnnouncement.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-heritage-brown/70 dark:text-stone-300 leading-relaxed max-w-3xl">
                    {pinnedAnnouncement.message}
                  </p>
                </div>
              </div>
              
              <Button 
                variant="primary"
                onClick={() => window.location.href = '/articles'}
                className="shrink-0 rounded-xl"
                id="read-more-notices"
              >
                Read Notices
              </Button>
            </div>
          </FadeIn>
        )}

        {/* Dynamic Split News & Events Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left: Official Gazette (7 Columns on Large) */}
          <div className="lg:col-span-7 space-y-10">
            <FadeIn direction="left">
              <span className="text-heritage-terracotta dark:text-heritage-sand font-black text-[10px] uppercase tracking-[0.25em] block mb-1">
                Official Chronicles
              </span>
              <h3 className="text-2xl md:text-3xl font-serif font-black text-heritage-brown dark:text-white flex items-center gap-2">
                <Megaphone className="w-5.5 h-5.5 text-heritage-terracotta" /> Bakenyi Gazette
              </h3>
            </FadeIn>

            <div className="space-y-6">
              {news.map((item, index) => (
                <FadeIn key={item.id} direction="up" delay={index * 0.1}>
                  <Card 
                    variant="default"
                    hoverEffect="translate"
                    className="p-6 relative flex flex-col md:flex-row gap-6 items-stretch group"
                    id={`news-article-${item.id}`}
                  >
                    <div className="md:w-1/3 rounded-2xl overflow-hidden min-h-[140px] relative bg-stone-100 dark:bg-stone-900 border border-heritage-brown/5 dark:border-white/5">
                      <img 
                        src={item.cover_image || "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&q=80&w=400"} 
                        alt={item.title} 
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    
                    <div className="md:w-2/3 flex flex-col justify-between text-left">
                      <div>
                        <div className="flex items-center justify-between gap-2 text-[9px] font-mono font-bold text-heritage-terracotta dark:text-heritage-sand uppercase tracking-widest mb-1.5">
                          <span>{item.category || 'Gazette'}</span>
                          <span>{new Date(item.published_at || item.created_at).toLocaleDateString()}</span>
                        </div>
                        <h4 className="font-serif font-bold text-lg text-heritage-brown dark:text-white leading-snug line-clamp-2">
                          {item.title}
                        </h4>
                        <p className="text-xs text-heritage-brown/60 dark:text-stone-400 mt-2 line-clamp-3 leading-relaxed">
                          {item.summary || item.content}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-4 mt-4 border-t border-heritage-brown/5 dark:border-white/5 text-[10px]">
                        <span className="text-heritage-brown/45 dark:text-stone-500 flex items-center gap-1 font-mono font-bold uppercase tracking-wider">
                          <User className="w-3.5 h-3.5 text-heritage-terracotta" /> By Council Keeper
                        </span>
                        <Link to="/articles" className="font-black uppercase text-heritage-terracotta hover:text-heritage-brown dark:text-heritage-sand dark:hover:text-white flex items-center font-bold">
                          Read More <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </Card>
                </FadeIn>
              ))}

              {news.length === 0 && (
                <div className="p-12 text-center bg-stone-50 dark:bg-stone-900/20 rounded-3xl border border-dashed border-heritage-brown/10 dark:border-white/10">
                  <Megaphone className="w-8 h-8 text-heritage-brown/20 dark:text-white/20 mx-auto mb-2 animate-pulse" />
                  <p className="text-xs text-heritage-brown/60 dark:text-stone-400 font-bold">No public dispatches published this week.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right: Cultural Gatherings & Events (5 Columns on Large) */}
          <div className="lg:col-span-5 space-y-10">
            <FadeIn direction="right">
              <span className="text-heritage-terracotta dark:text-heritage-sand font-black text-[10px] uppercase tracking-[0.25em] block mb-1">
                Kyoga Sanctuary Guild
              </span>
              <h3 className="text-2xl md:text-3xl font-serif font-black text-heritage-brown dark:text-white flex items-center gap-2">
                <Calendar className="w-5.5 h-5.5 text-heritage-terracotta" /> Cultural Gatherings
              </h3>
            </FadeIn>

            <div className="space-y-6">
              {events.map((event, index) => {
                const dateObj = new Date(event.start_datetime);
                const isRsvpOpen = event.rsvp_settings?.enabled;
                const totalRsvpsCount = event.rsvp_settings?.rsvps?.length || 0;

                return (
                  <FadeIn key={event.id} direction="up" delay={index * 0.1}>
                    <Card 
                      variant="default"
                      hoverEffect="translate"
                      className="p-6 relative flex flex-col justify-between text-left"
                      id={`cultural-event-${event.id}`}
                    >
                      <div>
                        {/* Status/Badge Block */}
                        <div className="flex items-center justify-between gap-3 mb-4">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[9px] font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                              Upcoming Event
                            </span>
                          </div>
                          <span className="text-[9px] font-mono font-bold text-heritage-terracotta dark:text-heritage-sand bg-heritage-terracotta/5 border border-heritage-terracotta/10 px-2.5 py-1 rounded-md">
                            {getCountdown(event.start_datetime)}
                          </span>
                        </div>

                        <h4 className="font-serif font-bold text-lg text-heritage-brown dark:text-white leading-snug">
                          {event.title}
                        </h4>

                        <p className="text-xs text-heritage-brown/60 dark:text-stone-400 mt-2 line-clamp-2 leading-relaxed">
                          {event.description}
                        </p>

                        <div className="space-y-2 mt-4 text-[11px] text-heritage-brown/70 dark:text-stone-400 border-t border-b border-heritage-brown/5 dark:border-white/5 py-3 my-4">
                          <div className="flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-heritage-terracotta shrink-0" />
                            <span>
                              {dateObj.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            <span className="truncate">{event.location}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <span className="text-[10px] text-heritage-brown/45 dark:text-stone-500 font-mono font-bold uppercase tracking-wider">
                          {totalRsvpsCount > 0 ? `${totalRsvpsCount} guardians registered` : 'No reservations yet'}
                        </span>
                        {isRsvpOpen ? (
                          <Button 
                            variant="primary"
                            onClick={() => setSelectedEventForRsvp(event)}
                            id={`btn-rsvp-trigger-${event.id}`}
                            className="px-4 py-2 text-[9px] rounded-lg"
                          >
                            RSVP Seat
                          </Button>
                        ) : (
                          <span className="text-[9px] font-mono font-bold text-heritage-brown/40 dark:text-stone-500 uppercase">RSVP Closed</span>
                        )}
                      </div>
                    </Card>
                  </FadeIn>
                );
              })}

              {events.length === 0 && (
                <div className="p-12 text-center bg-stone-50 dark:bg-stone-900/20 rounded-3xl border border-dashed border-heritage-brown/10 dark:border-white/10">
                  <Calendar className="w-8 h-8 text-heritage-brown/20 dark:text-white/20 mx-auto mb-2 animate-pulse" />
                  <p className="text-xs text-heritage-brown/60 dark:text-stone-400 font-bold">No public summits scheduled.</p>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
