import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { 
  Megaphone, AlertTriangle, Pin, User, ChevronRight, 
  Calendar, Clock, MapPin 
} from 'lucide-react';
import { News, Announcement, Event } from '../../types/heritage';

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
    <section id="official-news-and-gatherings" className="py-24 bg-white dark:bg-stone-950 relative text-left border-t border-b border-stone-250/20 dark:border-stone-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Pinned Notice Section */}
        {pinnedAnnouncement && (
          <motion.div 
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-16 bg-amber-500/5 dark:bg-amber-500/2 px-6 sm:px-10 py-8 rounded-[32px] border border-amber-500/10 dark:border-amber-500/10 flex flex-col md:flex-row md:items-center justify-between gap-8 relative overflow-hidden"
            id={`pinned-notice-${pinnedAnnouncement.id}`}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 flex items-center justify-center shrink-0 text-amber-600 dark:text-amber-400">
                <Megaphone className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="bg-red-500 text-white text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full flex items-center gap-1 font-sans">
                    <AlertTriangle className="w-2.5 h-2.5" /> High Priority
                  </span>
                  <span className="bg-amber-100 dark:bg-stone-800 text-amber-800 dark:text-amber-300 text-[8px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full flex items-center gap-1 font-sans">
                    <Pin className="w-2.5 h-2.5" /> PINNED DECREE
                  </span>
                  {pinnedAnnouncement.end_date && (
                    <span className="text-[9px] text-stone-400 font-mono">
                      Active till {new Date(pinnedAnnouncement.end_date).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <h4 className="font-serif font-black text-lg text-stone-900 dark:text-amber-100">
                  {pinnedAnnouncement.title}
                </h4>
                <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed font-sans max-w-3xl">
                  {pinnedAnnouncement.message}
                </p>
              </div>
            </div>
            <Link 
              to="/articles"
              className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-[10px] uppercase tracking-widest px-6 py-3.5 rounded-xl text-center transition-colors shrink-0 cursor-pointer font-bold font-mono"
            >
              Read More Notices
            </Link>
          </motion.div>
        )}

        {/* Dynamic Split News & Events Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left: Official Gazette (7 Columns on Large) */}
          <div className="lg:col-span-7 space-y-10">
            <div>
              <span className="text-amber-600 dark:text-amber-400 font-black text-[10px] uppercase tracking-[0.25em] block mb-1">
                Official Chronicles
              </span>
              <h3 className="text-2xl md:text-3xl font-serif font-black text-stone-900 dark:text-white flex items-center gap-2">
                <Megaphone className="w-5.5 h-5.5 text-amber-500" /> Bakenyi Gazette
              </h3>
            </div>

            <div className="space-y-6">
              {news.map((item) => (
                <motion.article 
                  key={item.id}
                  whileHover={{ y: -3 }}
                  className="bg-stone-50 dark:bg-stone-900/40 border border-stone-200/50 dark:border-stone-800 rounded-3xl p-6 relative flex flex-col md:flex-row gap-6 items-stretch group"
                  id={`news-article-${item.id}`}
                >
                  <div className="md:w-1/3 rounded-2xl overflow-hidden min-h-[140px] relative bg-stone-100 dark:bg-stone-900 border border-stone-200/10">
                    <img 
                      src={item.cover_image || "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&q=80&w=400"} 
                      alt={item.title} 
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  
                  <div className="md:w-2/3 flex flex-col justify-between text-left">
                    <div>
                      <div className="flex items-center justify-between gap-2 text-[9px] font-mono font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-1.5">
                        <span>{item.category || 'Gazette'}</span>
                        <span>{new Date(item.published_at || item.created_at).toLocaleDateString()}</span>
                      </div>
                      <h4 className="font-serif font-bold text-lg text-stone-900 dark:text-white leading-snug line-clamp-2 font-bold">
                        {item.title}
                      </h4>
                      <p className="text-xs text-stone-500 dark:text-stone-400 mt-2 line-clamp-3 leading-relaxed">
                        {item.summary || item.content}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-4 mt-4 border-t border-stone-200/10 text-[10px]">
                      <span className="text-stone-400 flex items-center gap-1 font-mono">
                        <User className="w-3.5 h-3.5 text-amber-500" /> By Council Keeper
                      </span>
                      <Link to="/articles" className="font-black uppercase text-amber-600 dark:text-amber-400 hover:underline flex items-center font-bold">
                        Read More <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </motion.article>
              ))}

              {news.length === 0 && (
                <div className="p-12 text-center bg-stone-50 dark:bg-stone-900/20 rounded-3xl border border-dashed border-stone-200 dark:border-stone-800">
                  <Megaphone className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                  <p className="text-xs text-stone-500 dark:text-stone-400 font-bold">No public dispatches published this week.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right: Cultural Gatherings & Events (5 Columns on Large) */}
          <div className="lg:col-span-5 space-y-10">
            <div>
              <span className="text-amber-600 dark:text-amber-400 font-black text-[10px] uppercase tracking-[0.25em] block mb-1">
                Kyoga Sanctuary Guild
              </span>
              <h3 className="text-2xl md:text-3xl font-serif font-black text-stone-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-5.5 h-5.5 text-amber-500" /> Cultural Gatherings
              </h3>
            </div>

            <div className="space-y-6">
              {events.map((event) => {
                const dateObj = new Date(event.start_datetime);
                const isRsvpOpen = event.rsvp_settings?.enabled;
                const totalRsvpsCount = event.rsvp_settings?.rsvps?.length || 0;

                return (
                  <motion.div 
                    key={event.id}
                    whileHover={{ y: -3 }}
                    className="bg-stone-50 dark:bg-stone-900/40 border border-stone-200/50 dark:border-stone-800 rounded-3xl p-6 relative flex flex-col justify-between text-left"
                    id={`cultural-event-${event.id}`}
                  >
                    <div>
                      {/* Date Shield & Countdown Badge */}
                      <div className="flex items-center justify-between gap-3 mb-4">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-[9px] font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                            Upcoming Event
                          </span>
                        </div>
                        <span className="text-[9px] font-mono text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-md font-bold">
                          {getCountdown(event.start_datetime)}
                        </span>
                      </div>

                      <h4 className="font-serif font-bold text-lg text-stone-900 dark:text-white leading-snug font-bold">
                        {event.title}
                      </h4>

                      <p className="text-xs text-stone-500 dark:text-stone-400 mt-2 line-clamp-2 leading-relaxed">
                        {event.description}
                      </p>

                      <div className="space-y-2 mt-4 text-[11px] text-stone-600 dark:text-stone-400 border-t border-b border-stone-200/10 py-3 my-4">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
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
                      <span className="text-[10px] text-stone-400 font-mono">
                        {totalRsvpsCount > 0 ? `${totalRsvpsCount} guardians registered` : 'No reservations yet'}
                      </span>
                      {isRsvpOpen ? (
                        <button 
                          onClick={() => setSelectedEventForRsvp(event)}
                          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 text-[9px] uppercase tracking-wider font-bold rounded-lg cursor-pointer transition-colors font-mono"
                          id={`btn-rsvp-trigger-${event.id}`}
                        >
                          RSVP Seat
                        </button>
                      ) : (
                        <span className="text-[9px] font-mono text-stone-400 uppercase">RSVP Closed</span>
                      )}
                    </div>
                  </motion.div>
                );
              })}

              {events.length === 0 && (
                <div className="p-12 text-center bg-stone-50 dark:bg-stone-900/20 rounded-3xl border border-dashed border-stone-200 dark:border-stone-800">
                  <Calendar className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                  <p className="text-xs text-stone-500 dark:text-stone-400 font-bold">No public summits scheduled.</p>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
