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

// Handcrafted, richly detailed history collection for fallback and enrichment
const FALLBACK_EVENTS: TimelineEvent[] = [
  {
    id: 'timeline-early-beginnings',
    period: '14th Century',
    title: 'Early Riverine Settlements',
    desc: 'The ancestors of the Bakenyi people began settling along the marshlands of major river basins in Eastern Uganda.',
    detailedDesc: 'During the early 14th century, the ancestors of the Bakenyi people settled along the rivers of eastern and central Uganda. Moving along waterways, they developed highly specialized riverine skills, including deep-water fishing and building stable platforms over marshy land. This lifestyle allowed them to remain secure from landlocked conflicts, establishing their unique identity as the "Water People" of Uganda.',
    category: 'Pre-Colonial',
    image: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&q=80&w=800',
    location: 'Victoria Nile & Eastern River basins',
    elderQuote: '“Our ancestors did not walk on the dust; they carved their pathways into the blue rivers and marshy bays.” — Traditional Lineage Record',
    iconName: 'Map',
    year_order: 1300
  },
  {
    id: 'timeline-clan-formation',
    period: '15th–16th Century',
    title: 'Emergence of Water-Based Clans',
    desc: 'Bakenyi river groups migrated northward and diverged into structured, lineage-based clans with aquatic totems.',
    detailedDesc: 'As families multiplied, they migrated towards the vast wetlands and established distinct clans. Each clan took on key duties for the community—from canoe construction to net crafting. They adopted sacred totems based on river creatures, like the Crested Crane (Nnali), the lungfish, and the water lily, cementing their ecological bonds and creating a tight social safety net.',
    category: 'Pre-Colonial',
    image: 'https://images.unsplash.com/photo-1501535033-a593e6afb94d?auto=format&fit=crop&q=80&w=800',
    location: 'Lake Kyoga Basins',
    elderQuote: '“Every clan is a rib of the canoe. If one breaks, the boat of our tribe sinks.” — Elder Christopher Kyega',
    iconName: 'Shield',
    year_order: 1500
  },
  {
    id: 'timeline-ebiswa-settlements',
    period: 'c. 1650s',
    title: 'Pioneering "Ebiswa" Sanctuaries',
    desc: 'Bakenyi groups developed the technique of building stable temporary shelters on floating papyrus reed islands.',
    detailedDesc: 'To guard against rising conflicts on mainland shores, Bakenyi families pioneered building shelters on "Ebiswa"—mobile floating islands composed of dense papyrus root structures. These giant natural rafts drifted across Lake Kyoga, functioning as floating fortresses that could be cut loose to float away from danger, making Bakenyi settlements virtually unreachable by land warriors.',
    category: 'Pre-Colonial',
    image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=800',
    location: 'Lake Kyoga Floating Islands',
    elderQuote: '“The reed islands are our shields. They bend with the storm but they never sink under our feet.”',
    iconName: 'Home',
    year_order: 1650
  },
  {
    id: 'timeline-nile-crossing',
    period: '1720',
    title: 'The Great Crossing of the Victoria Nile',
    desc: 'Led by legendary lineage chiefs, a great fleet of dugout canoes crossed the mists of the Nile to establish Namasale.',
    detailedDesc: 'In the year 1720, a heavy regional drought led several water clans to search for deeper waters. Led by historic lineage commanders, a great flotilla of heart-shaped dugout canoes (Eisiga) navigated the heavy morning mists of the Victoria Nile, successfully crossing into Lake Kyoga to establish the first permanent Bakenyi fishing settlements in Namasale and Kagwara.',
    category: 'Pre-Colonial',
    image: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&q=80&w=800',
    location: 'Victoria Nile Crossing / Namasale Peninsula',
    elderQuote: '“A fleet of mists, a heart of wood. That day, Lake Kyoga welcomed the paddle of our grandfathers.” — Namasale Storyteller',
    iconName: 'Compass',
    year_order: 1720
  },
  {
    id: 'timeline-lukenye-codification',
    period: '1800s',
    title: 'Flourishing of the Lukenye Language',
    desc: 'The Lukenye language solidified as a distinct Bantu dialect, preserved via traditional storytelling and rhythmic paddle chants.',
    detailedDesc: 'During the 1800s, the Lukenye language fully emerged as a distinct, expressive Bantu dialect. Isolated from deep inland tribes, Bakenyi communities preserved Lukenye by embedding grammar, historical records, and moral laws into rhythmic paddling chants and lakeside melodies that could travel across the quiet water.',
    category: 'Pre-Colonial',
    image: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&q=80&w=800',
    location: 'Lakeside Communes',
    elderQuote: '“We did not write our words in stone. We sang them to the winds, and the water carried them to our children.”',
    iconName: 'Volume2',
    year_order: 1800
  },
  {
    id: 'timeline-colonial-resistance',
    period: '1890s',
    title: 'Colonial Shore boundaries & Autonomy',
    desc: 'Bakenyi clans resisted colonial administration boundaries, maintaining absolute autonomy over Lake Kyoga’s waterways.',
    detailedDesc: 'When colonial surveyors arrived in East Africa and attempted to divide land and waterways into districts, Bakenyi chiefs stood firm. They refused to recognize administrative borders that restricted their fishing and canoe trade, maintaining their age-old autonomy over Lake Kyoga’s waters through strategic mobility and passive resistance.',
    category: 'Colonial',
    image: 'https://images.unsplash.com/photo-1523805009345-7448845a9e53?auto=format&fit=crop&q=80&w=800',
    location: 'Kyoga Waterway Lines',
    elderQuote: '“How do you draw lines on the water? The lake belongs to the birds and the canoes, not to the ink of your papers.” — Chief of the Baise-Mugosa',
    iconName: 'FileText',
    year_order: 1890
  },
  {
    id: 'timeline-water-trade-boom',
    period: '1940s–1950s',
    title: 'The Great Lake Kyoga Trade Boom',
    desc: 'Bakenyi boat builders and fishermen became the primary trading link across Lake Kyoga, connecting major regional markets.',
    detailedDesc: 'During the mid-20th century, Bakenyi merchants became essential to the region’s economy. Utilizing large freight dugout boats, they ferried cotton, fish, hand-braided papyrus mats, and metalwork between the Langi, Basoga, and Bagwere peoples, transforming Lake Kyoga from a natural barrier into a highly active trade highway.',
    category: 'Colonial',
    image: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&q=80&w=800',
    location: 'Kagwara and Namasale Docks',
    elderQuote: '“Our canoes were the bridges of Uganda. We carried the harvest of three tribes on our wooden backs.”',
    iconName: 'Users',
    year_order: 1940
  },
  {
    id: 'timeline-ecological-changes',
    period: '1980s',
    title: 'Ecological Shifts & Preservation Push',
    desc: 'Introduction of the Nile Perch and rising water levels altered lake lifestyles, sparking the first oral archive initiatives.',
    detailedDesc: 'The 1980s brought rapid changes. The introduction of the Nile Perch altered Lake Kyoga’s ecosystem, and climate-induced water level shifts flooded traditional shoreline ports. Recognizing these environmental pressures and the migration of youth to cities, community elders began holding formal storytelling circles to transcribe oral records and preserve Lukenye vocabulary.',
    category: 'Modern',
    image: 'https://images.unsplash.com/photo-1534482421-64566f976cfa?auto=format&fit=crop&q=80&w=800',
    location: 'Kyoga Shores',
    elderQuote: '“The fish changed, the water rose, and our old paths vanished. But the words of our ancestors remain dry and safe in our minds.”',
    iconName: 'Activity',
    year_order: 1980
  },
  {
    id: 'timeline-digital-renaissance',
    period: 'Present Day',
    title: 'The Digital Bakenyi Heritage Project',
    desc: 'A modern renaissance powered by digital archives, keeping ancestral lineages and language alive for generations.',
    detailedDesc: 'Today, the Bakenyi people are undergoing a powerful digital renaissance. By launching cultural portals, digital audio maps, and clan registries, Bakenyi youth and elders are ensuring that their ancient riverine history, the Lukenye language, and the lineage structures are preserved and accessible to the entire world, bridging the gap between historical water islands and global digital networks.',
    category: 'Modern',
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=800',
    location: 'Global Community Hubs',
    elderQuote: '“The modern computer screen is our new canoe. We sail it to ensure that the memory of Namasale never washes away.” — Elder Council Youth Representative',
    iconName: 'Sparkles',
    year_order: 2026
  }
];

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
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>(FALLBACK_EVENTS);

  useEffect(() => {
    if (dynamicEvents && dynamicEvents.length > 0) {
      // Blend Supabase events into our structured events
      const blended = dynamicEvents.map((row: any, idx: number) => {
        // Try to match with our fallback list to get rich details (images, long desc, etc.)
        const match = FALLBACK_EVENTS.find(
          fe => fe.title.toLowerCase().includes(row.title.toLowerCase()) || 
                row.title.toLowerCase().includes(fe.title.toLowerCase())
        );

        const yearNum = parseInt(row.period || row.year || '0') || 1000 + idx * 100;
        const era: 'Pre-Colonial' | 'Colonial' | 'Modern' = 
          yearNum < 1890 ? 'Pre-Colonial' : yearNum < 1960 ? 'Colonial' : 'Modern';

        return {
          id: row.id ? String(row.id) : `dynamic-${idx}`,
          period: row.period || row.year || match?.period || 'Unknown Era',
          title: row.title || match?.title || 'Historical Event',
          desc: row.desc || row.description || match?.desc || 'No description provided.',
          detailedDesc: match?.detailedDesc || row.desc || row.description || 'No further details cataloged.',
          category: match?.category || era,
          image: match?.image || 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&q=80&w=800',
          location: match?.location || 'Lake Kyoga Region',
          elderQuote: match?.elderQuote || '“We carry the memories of the waters.”',
          year_order: row.year_order || match?.year_order || yearNum
        };
      });

      // Sort by year order
      blended.sort((a, b) => (a.year_order || 0) - (b.year_order || 0));
      setTimelineEvents(blended);
    } else {
      setTimelineEvents(FALLBACK_EVENTS);
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
