import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Info, 
  Clock, 
  MapPin, 
  Volume2, 
  X, 
  ArrowRight,
  Sparkles,
  BookOpen,
  Filter
} from 'lucide-react';

export interface TimelineEvent {
  id: string;
  period: string; // e.g. "14th Century", "1720"
  title: string;
  desc: string;
  detailedDesc: string;
  category: 'Pre-Colonial' | 'Colonial' | 'Modern';
  image: string;
  location?: string;
  elderQuote?: string;
  iconName?: string;
  relatedTrackId?: string; // If it maps to a specific oral history track
  year_order?: number;
}

interface HeritageTimelineProps {
  dynamicEvents?: any[];
  onSelectOralTrack?: (trackId: string) => void;
}

export default function HeritageTimeline({ dynamicEvents = [], onSelectOralTrack }: HeritageTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | 'Pre-Colonial' | 'Colonial' | 'Modern'>('All');
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  
  // Drag-to-scroll mouse state
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Combine dynamic Supabase events with the detailed fallback data
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);

  useEffect(() => {
    if (dynamicEvents && dynamicEvents.length > 0) {
      // Blend Supabase events into our structured events
      const blended = dynamicEvents.map((row: any, idx: number) => {
        const yearNum = parseInt(row.period || row.year || '0') || 1000 + idx * 100;
        const era: 'Pre-Colonial' | 'Colonial' | 'Modern' = 
          yearNum < 1890 ? 'Pre-Colonial' : yearNum < 1960 ? 'Colonial' : 'Modern';

        return {
          id: row.id ? String(row.id) : `dynamic-${idx}`,
          period: row.period || row.year || 'Unknown Era',
          title: row.title || 'Historical Event',
          desc: row.desc || row.description || 'No description provided.',
          detailedDesc: row.desc || row.description || 'No further details cataloged.',
          category: era,
          image: row.image_url || 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&q=80&w=800',
          location: row.location || 'Lake Kyoga Region',
          elderQuote: row.elder_quote || '“We carry the memories of the waters.”',
          year_order: row.year_order || yearNum
        };
      });

      // Sort by year order
      blended.sort((a, b) => (a.year_order || 0) - (b.year_order || 0));
      setTimelineEvents(blended);
    } else {
      setTimelineEvents([]);
    }
  }, [dynamicEvents]);

  // Drag-to-scroll handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - containerRef.current.offsetLeft);
    setScrollLeft(containerRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    e.preventDefault();
    const x = e.pageX - containerRef.current.offsetLeft;
    const walk = (x - startX) * 1.5; // Scroll speed multiplier
    containerRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  // Scroll left/right button triggers
  const handleScroll = (direction: 'left' | 'right') => {
    if (!containerRef.current) return;
    const scrollAmount = 450;
    containerRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  // Filter events by Search & Category
  const filteredEvents = timelineEvents.filter(event => {
    const matchesSearch = 
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.period.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.desc.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (event.location && event.location.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'All' || event.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div id="heritage-timeline-showcase" className="py-20 bg-[#f9f5f0] border-y border-stone-200 relative overflow-hidden text-left">
      {/* Visual Water Pattern overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-heritage-terracotta/5 via-transparent to-transparent pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Upper Header Layout */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-heritage-terracotta/10 border border-heritage-terracotta/20 text-heritage-terracotta rounded-full mb-3 shadow-sm">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-[10px] font-black uppercase tracking-wider">Interactive Chronicles</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-serif font-bold text-heritage-brown tracking-tight">
              River of Time
            </h2>
            <p className="text-heritage-brown/60 text-sm md:text-base mt-2 max-w-2xl font-medium">
              Explore the key historical milestones, migrations, and cultural preservation efforts of the Bakenyi water-dwelling communities along Lake Kyoga. Drag to navigate.
            </p>
          </div>

          {/* Quick Filters + Search box */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative flex-grow sm:flex-grow-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-heritage-brown/40" />
              <input 
                type="text"
                placeholder="Search milestones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-60 bg-white border border-heritage-brown/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-heritage-brown placeholder-heritage-brown/30 outline-none focus:border-heritage-terracotta/40 focus:ring-1 focus:ring-heritage-terracotta/20 transition-all shadow-inner"
              />
            </div>

            {/* Era Filter Selector */}
            <div className="flex bg-stone-100 p-1 rounded-xl border border-stone-200">
              {(['All', 'Pre-Colonial', 'Colonial', 'Modern'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    selectedCategory === cat 
                      ? 'bg-heritage-terracotta text-white shadow-sm' 
                      : 'text-heritage-brown/60 hover:text-heritage-brown'
                  }`}
                >
                  {cat === 'All' ? 'All Eras' : cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Horizontal Navigation Controllers */}
        <div className="relative">
          {/* Scroll Track container */}
          <div 
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUpOrLeave}
            onMouseLeave={handleMouseUpOrLeave}
            className={`flex items-stretch overflow-x-auto gap-8 pb-12 pt-6 scrollbar-thin scrollbar-thumb-stone-300 scrollbar-track-stone-100 select-none cursor-grab active:cursor-grabbing ${
              isDragging ? 'scroll-smooth-none' : 'scroll-smooth'
            }`}
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {filteredEvents.length === 0 ? (
              <div className="w-full py-16 text-center text-heritage-brown/40 flex flex-col items-center justify-center bg-white rounded-3xl border border-stone-200/60 shadow-inner">
                <Info className="w-10 h-10 mb-3 text-heritage-brown/30" />
                <p className="text-sm font-semibold italic">No historical milestones match your query.</p>
                <button 
                  onClick={() => { setSearchTerm(''); setSelectedCategory('All'); }}
                  className="mt-3 text-xs text-heritage-terracotta font-bold uppercase tracking-wider hover:underline cursor-pointer"
                >
                  Reset filters
                </button>
              </div>
            ) : (
              <div className="flex items-stretch gap-10 px-4 min-w-max relative py-16">
                
                {/* Central "River of Time" Line */}
                <div className="absolute top-[50%] left-0 right-0 h-1.5 bg-gradient-to-r from-heritage-terracotta/20 via-heritage-terracotta/70 to-heritage-terracotta/20 rounded-full z-0 pointer-events-none">
                  {/* Streaming water droplet animation */}
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent_50%,rgba(168,85,247,0.15)_60%,transparent_70%)] bg-[length:200%_100%] animate-pulse pointer-events-none" />
                </div>

                {filteredEvents.map((event, idx) => {
                  const isEven = idx % 2 === 0;

                  return (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, y: isEven ? 40 : -40 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.08, duration: 0.5 }}
                      className="w-80 flex flex-col items-center relative z-10"
                    >
                      {/* Connection node point */}
                      <div className="absolute top-[50%] -translate-y-1/2 w-8 h-8 rounded-full bg-[#f9f5f0] border-4 border-heritage-terracotta flex items-center justify-center shadow-md z-20 group">
                        <div className="w-2.5 h-2.5 rounded-full bg-heritage-terracotta group-hover:scale-125 transition-transform" />
                      </div>

                      {/* Alternate layout placements */}
                      <div className={`w-full flex flex-col ${isEven ? 'mt-auto pb-10' : 'mb-auto pt-10'}`}>
                        
                        {/* Event Card Container */}
                        <div 
                          onClick={() => setSelectedEvent(event)}
                          className="bg-white border border-stone-200/80 rounded-3xl p-5 hover:border-heritage-terracotta/50 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer group flex flex-col text-left h-full border-b-4 hover:border-b-heritage-terracotta"
                        >
                          {/* Image box */}
                          <div className="w-full h-36 rounded-2xl overflow-hidden mb-4 relative bg-stone-100 shadow-sm shrink-0">
                            <img 
                              src={event.image} 
                              alt={event.title} 
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
                            <span className="absolute bottom-3 left-3 text-[10px] font-black text-white bg-heritage-terracotta px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                              {event.period}
                            </span>
                          </div>

                          <div className="flex-grow flex flex-col">
                            {/* Era and location */}
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <span className="text-[9px] font-bold uppercase tracking-wider text-heritage-terracotta bg-heritage-terracotta/5 px-2 py-0.5 rounded-md">
                                {event.category}
                              </span>
                              {event.location && (
                                <span className="text-[10px] text-heritage-brown/50 flex items-center font-medium max-w-[140px] truncate">
                                  <MapPin className="w-3 h-3 mr-0.5 shrink-0" />
                                  {event.location}
                                </span>
                              )}
                            </div>

                            <h3 className="text-base font-serif font-bold text-heritage-brown mb-2 leading-snug group-hover:text-heritage-terracotta transition-colors">
                              {event.title}
                            </h3>
                            
                            <p className="text-xs text-heritage-brown/70 leading-relaxed font-medium tracking-tight flex-grow line-clamp-3">
                              {event.desc}
                            </p>
                          </div>

                          {/* Action footer */}
                          <div className="flex items-center gap-1 text-heritage-terracotta font-bold text-[10px] uppercase tracking-wider mt-4 pt-4 border-t border-stone-100 shrink-0 group-hover:gap-2 transition-all">
                            <span>Examine Archive</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </div>
                        </div>

                      </div>
                    </motion.div>
                  );
                })}

              </div>
            )}
          </div>

          {/* Left / Right buttons */}
          {filteredEvents.length > 0 && (
            <div className="flex items-center justify-center gap-4 mt-4 relative z-20">
              <button
                onClick={() => handleScroll('left')}
                className="w-11 h-11 rounded-full bg-white border border-stone-200 hover:border-heritage-terracotta/50 text-heritage-brown hover:text-heritage-terracotta flex items-center justify-center shadow-md transition-all active:scale-95 hover:bg-stone-50 cursor-pointer"
                title="Scroll Left"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-xs font-bold font-mono text-heritage-brown/40 uppercase tracking-widest">
                Swipe to Navigate
              </span>
              <button
                onClick={() => handleScroll('right')}
                className="w-11 h-11 rounded-full bg-white border border-stone-200 hover:border-heritage-terracotta/50 text-heritage-brown hover:text-heritage-terracotta flex items-center justify-center shadow-md transition-all active:scale-95 hover:bg-stone-50 cursor-pointer"
                title="Scroll Right"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Expanded Details Modal (AnimatePresence Overlay) */}
      <AnimatePresence>
        {selectedEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 overflow-y-auto">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedEvent(null)}
              className="fixed inset-0 bg-stone-900/70 backdrop-blur-md"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="bg-[#fcfaf7] w-full max-w-4xl rounded-[32px] border border-stone-200 shadow-2xl relative overflow-hidden z-10 max-h-[90vh] flex flex-col md:flex-row text-left"
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedEvent(null)}
                className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-md transition-all active:scale-95 cursor-pointer border border-white/10"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Graphic/Image Showcase Column */}
              <div className="md:w-[42%] relative h-64 md:h-auto shrink-0 border-r border-stone-200/40">
                <img 
                  src={selectedEvent.image} 
                  alt={selectedEvent.title} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                {/* Visual gradient */}
                <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black/80 md:from-transparent via-transparent to-transparent pointer-events-none" />
                
                {/* Year tag inside left column */}
                <div className="absolute bottom-6 left-6 right-6 text-white md:hidden">
                  <span className="px-3 py-1 bg-heritage-terracotta text-white rounded-full text-xs font-black uppercase tracking-wider">
                    {selectedEvent.period}
                  </span>
                  <h3 className="text-xl font-serif font-bold text-white mt-2 leading-snug">
                    {selectedEvent.title}
                  </h3>
                </div>
              </div>

              {/* Detail Content Column */}
              <div className="md:w-[58%] p-6 md:p-10 overflow-y-auto max-h-[60vh] md:max-h-[90vh] flex flex-col justify-between scrollbar-thin">
                
                <div className="space-y-6">
                  {/* Era Badge and Location */}
                  <div className="hidden md:flex items-center justify-between gap-4 border-b border-stone-200/40 pb-4">
                    <span className="text-xs font-black text-white bg-heritage-terracotta px-3.5 py-1 rounded-full uppercase tracking-wider">
                      {selectedEvent.period}
                    </span>
                    <span className="text-xs font-bold text-heritage-terracotta uppercase tracking-widest bg-heritage-terracotta/5 px-2.5 py-1 rounded-md">
                      {selectedEvent.category} Era
                    </span>
                  </div>

                  {/* Title and location details */}
                  <div className="hidden md:block">
                    <h3 className="text-3xl font-serif font-bold text-heritage-brown leading-tight">
                      {selectedEvent.title}
                    </h3>
                    {selectedEvent.location && (
                      <p className="text-sm text-heritage-brown/50 flex items-center font-bold mt-2">
                        <MapPin className="w-4 h-4 mr-1.5 text-heritage-terracotta" />
                        {selectedEvent.location}
                      </p>
                    )}
                  </div>

                  {/* Mobile location details */}
                  <div className="md:hidden">
                    {selectedEvent.location && (
                      <p className="text-xs text-heritage-brown/60 flex items-center font-bold">
                        <MapPin className="w-3.5 h-3.5 mr-1.5 text-heritage-terracotta" />
                        {selectedEvent.location}
                      </p>
                    )}
                  </div>

                  {/* Curated Historical Narrative */}
                  <div>
                    <h4 className="text-xs font-black text-heritage-brown/40 uppercase tracking-widest mb-2">
                      Historical Account
                    </h4>
                    <p className="text-sm text-heritage-brown/80 leading-relaxed font-medium">
                      {selectedEvent.detailedDesc}
                    </p>
                  </div>

                  {/* Elder Quote block */}
                  {selectedEvent.elderQuote && (
                    <div className="bg-heritage-terracotta/5 border-l-4 border-heritage-terracotta p-5 rounded-2xl italic text-heritage-brown/80 text-xs md:text-sm leading-relaxed">
                      {selectedEvent.elderQuote}
                    </div>
                  )}
                </div>

                {/* Navigation / Action Footer */}
                <div className="mt-8 pt-6 border-t border-stone-200/60 flex flex-wrap gap-4 items-center justify-between">
                  <div className="text-xs text-heritage-brown/50 flex items-center font-bold">
                    <BookOpen className="w-4 h-4 mr-1.5 text-heritage-terracotta/50" />
                    <span>Transcribed in the Elder Council Archives</span>
                  </div>

                  {/* If it links back to an Oral History track */}
                  {selectedEvent.category === 'Pre-Colonial' && onSelectOralTrack ? (
                    <button
                      onClick={() => {
                        // Dynamically link Migration related events back to the audio track!
                        onSelectOralTrack('1'); // Let's trigger the first track (The Great Migration story)
                        setSelectedEvent(null);
                      }}
                      className="px-4 py-2 bg-heritage-terracotta hover:bg-heritage-brown text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md hover:shadow-lg flex items-center gap-1.5 cursor-pointer"
                    >
                      <Volume2 className="w-4 h-4" />
                      <span>Hear Oral Account</span>
                    </button>
                  ) : null}
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
