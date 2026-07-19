import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bookmark, Trash2, Grid, List, Search, ArrowRight, Sparkles, 
  BookOpen, Clock, Globe, Shield, User, ExternalLink, Calendar,
  FileText
} from 'lucide-react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

interface SavedItem {
  id: string;
  type: string;
  title: string;
  subtitle?: string;
  detail?: string;
  image?: string;
  category?: string;
}

export default function Bookmarks() {
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Retrieve bookmarked items from local storage
  useEffect(() => {
    // Simulate loading for high-fidelity museum feel and skeleton transition
    const timer = setTimeout(() => {
      const storedSaved = localStorage.getItem('bakenyi_saved_items');
      if (storedSaved) {
        setSavedItems(JSON.parse(storedSaved));
      } else {
        setSavedItems([]);
      }
      setLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  // Remove individual bookmark
  const handleRemoveBookmark = (id: string, title: string) => {
    const updated = savedItems.filter(item => item.id !== id);
    setSavedItems(updated);
    localStorage.setItem('bakenyi_saved_items', JSON.stringify(updated));
    
    // Also remove from Home page bookmarks if mapped
    const bakenyiBookmarks = JSON.parse(localStorage.getItem('bakenyi-bookmarks') || '[]');
    const nextBakenyiBookmarks = bakenyiBookmarks.filter((bId: string) => bId !== id);
    localStorage.setItem('bakenyi-bookmarks', JSON.stringify(nextBakenyiBookmarks));
  };

  // Filter items
  const filteredItems = savedItems.filter(item => {
    const matchesSearch = 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.subtitle || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.category || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = selectedType === 'all' || item.type.toLowerCase() === selectedType.toLowerCase();
    
    return matchesSearch && matchesType;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getIconForType = (type: string) => {
    switch (type.toLowerCase()) {
      case 'clan':
        return <Shield className="w-4 h-4 text-purple-600" />;
      case 'leader':
      case 'elder':
        return <User className="w-4 h-4 text-teal-600" />;
      case 'language':
      case 'vocabulary':
        return <BookOpen className="w-4 h-4 text-emerald-600" />;
      case 'timeline':
        return <Clock className="w-4 h-4 text-amber-600" />;
      case 'news':
        return <FileText className="w-4 h-4 text-sky-600" />;
      case 'event':
        return <Calendar className="w-4 h-4 text-indigo-600" />;
      default:
        return <Globe className="w-4 h-4 text-rose-600" />;
    }
  };

  const getDestinationLink = (item: SavedItem) => {
    const typeLower = item.type.toLowerCase();
    if (typeLower === 'clan') return `/clans/${item.id}`;
    if (typeLower === 'leader' || typeLower === 'elder') return `/leadership/${item.id}`;
    if (typeLower === 'timeline') return `/timeline/${item.id}`;
    if (typeLower === 'news') return `/news/${item.id}`;
    if (typeLower === 'event') return `/events/${item.id}`;
    if (typeLower === 'vocabulary' || typeLower === 'language') return `/language`;
    return `/search`;
  };

  return (
    <div className="pt-24 min-h-screen bg-heritage-cream dark:bg-stone-950 transition-colors duration-300">
      <SEO 
        title="My Saved Heritage Archives"
        description="Explore your curated sanctuary of bookmarked clans, elder councils, Lukenye vocabulary cards, and historical articles."
        keywords="Bookmarks, saved heritage, personalized archive, Bakenye chronicles"
      />

      {/* Header Plaque */}
      <section className="relative bg-gradient-to-br from-stone-950 via-stone-900 to-[#2c1d11] py-16 px-4 overflow-hidden border-b border-stone-800/60">
        <div className="absolute inset-0 cultural-pattern opacity-10 pointer-events-none" />
        <div className="absolute -top-32 -right-32 w-72 h-72 bg-heritage-terracotta/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-7xl mx-auto relative z-10 text-center space-y-4">
          <span className="text-[10px] font-sans font-black uppercase tracking-widest text-heritage-sand bg-white/10 px-3.5 py-1.5 rounded-full inline-block">
            Personal Curator
          </span>
          <h1 className="text-3xl md:text-5xl font-serif font-black text-white tracking-tight">
            My Curated Sanctuary
          </h1>
          <p className="text-heritage-sand/70 max-w-xl mx-auto text-xs md:text-sm leading-relaxed">
            Your personalized museum display containing saved records, clans, elders, and vocabulary items kept safe for ancestral reference.
          </p>
        </div>
      </section>

      {/* Search & Tool belt */}
      <section className="py-8 px-4 max-w-7xl mx-auto">
        <div className="bg-white dark:bg-stone-900 border border-heritage-brown/10 dark:border-stone-800 rounded-3xl p-5 shadow-xs flex flex-col md:flex-row justify-between items-center gap-4">
          
          {/* Search box */}
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-heritage-brown/40 dark:text-stone-500 w-4 h-4" />
            <input 
              type="text"
              placeholder="Search saved items..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-heritage-cream/50 dark:bg-stone-950 border border-heritage-brown/5 focus:border-heritage-terracotta focus:outline-none text-xs font-semibold text-heritage-brown dark:text-white transition-all"
            />
          </div>

          {/* Type filters & layout switcher */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
            <div className="flex items-center gap-1.5 bg-heritage-cream/50 dark:bg-stone-950 p-1 rounded-xl border border-heritage-brown/5">
              {[
                { id: 'all', label: 'All Items' },
                { id: 'clan', label: 'Clans' },
                { id: 'leader', label: 'Leaders' },
                { id: 'vocabulary', label: 'Language' },
                { id: 'news', label: 'News' }
              ].map(filter => (
                <button
                  key={filter.id}
                  onClick={() => {
                    setSelectedType(filter.id);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    selectedType === filter.id 
                      ? 'bg-heritage-terracotta text-white shadow-xs' 
                      : 'text-heritage-brown/70 dark:text-stone-400 hover:bg-heritage-brown/5'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {/* Grid/List togglers */}
            <div className="flex items-center bg-heritage-cream/50 dark:bg-stone-950 p-1 rounded-xl border border-heritage-brown/5 shrink-0">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'grid' 
                    ? 'bg-white dark:bg-stone-800 text-heritage-terracotta shadow-xs' 
                    : 'text-heritage-brown/40 dark:text-stone-500 hover:text-heritage-brown'
                }`}
                title="Grid view"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'list' 
                    ? 'bg-white dark:bg-stone-800 text-heritage-terracotta shadow-xs' 
                    : 'text-heritage-brown/40 dark:text-stone-500 hover:text-heritage-brown'
                }`}
                title="List view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* Main Grid/List presentation display */}
      <section className="pb-24 px-4 max-w-7xl mx-auto">
        {loading ? (
          /* Loading Skeleton Grids */
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8' : 'space-y-4'}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div 
                key={i} 
                className={`bg-white dark:bg-stone-900 border border-heritage-brown/5 dark:border-stone-800 rounded-3xl p-6 ${
                  viewMode === 'list' ? 'flex gap-6 items-center' : 'space-y-4'
                } animate-pulse`}
              >
                <div className={`rounded-2xl bg-heritage-brown/10 dark:bg-stone-800 ${
                  viewMode === 'list' ? 'w-16 h-16 shrink-0' : 'w-full h-40'
                }`} />
                <div className="flex-1 space-y-2">
                  <div className="h-2 w-1/4 bg-heritage-brown/10 dark:bg-stone-800 rounded" />
                  <div className="h-4 w-3/4 bg-heritage-brown/10 dark:bg-stone-800 rounded" />
                  <div className="h-3 w-1/2 bg-heritage-brown/10 dark:bg-stone-800 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          /* Empty Sanctuary Plaque */
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20 bg-white dark:bg-stone-900 rounded-[32px] border-2 border-dashed border-heritage-brown/10 dark:border-stone-800 max-w-2xl mx-auto px-6 shadow-sm"
          >
            <div className="w-20 h-20 rounded-full bg-heritage-cream dark:bg-stone-800 flex items-center justify-center mx-auto mb-6 border border-heritage-terracotta/20">
              <Bookmark className="w-10 h-10 text-heritage-terracotta" />
            </div>
            <h3 className="text-2xl font-serif font-black text-heritage-brown dark:text-white mb-2">
              Sanctuary is Empty
            </h3>
            <p className="text-xs text-heritage-brown/60 dark:text-stone-400 max-w-sm mx-auto leading-relaxed mb-8">
              You haven't bookmarked any clans, vocabulary words, leaders, or history cards yet. Tap the bookmark icon on any item while exploring.
            </p>
            <div className="flex justify-center gap-4">
              <Link to="/clans" className="btn-primary inline-block text-xs uppercase tracking-wider py-3 px-6 shadow-md">
                Discover Clans
              </Link>
              <Link to="/language" className="btn-secondary inline-block text-xs uppercase tracking-wider py-3 px-6">
                Explore Dialect
              </Link>
            </div>
          </motion.div>
        ) : (
          /* Bookmarks Content List */
          <div className="space-y-8">
            <AnimatePresence mode="popLayout">
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {paginatedItems.map((item, idx) => (
                    <motion.div
                      layout
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="bg-white dark:bg-stone-900 border border-heritage-brown/10 dark:border-stone-800 rounded-3xl p-6 hover:shadow-lg transition-all flex flex-col justify-between relative group"
                    >
                      {/* Top ribbon info */}
                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-heritage-cream dark:bg-stone-800 border border-heritage-brown/5 dark:border-stone-700 text-[10px] font-black uppercase tracking-widest text-heritage-brown/70 dark:text-stone-300 rounded-full">
                            {getIconForType(item.type)}
                            <span>{item.type}</span>
                          </span>
                          
                          <button
                            onClick={() => handleRemoveBookmark(item.id, item.title)}
                            className="p-1.5 rounded-lg text-heritage-brown/30 dark:text-stone-600 hover:text-rose-600 dark:hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all cursor-pointer"
                            title="Remove Bookmark"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Title & Body */}
                        <div className="space-y-2">
                          <h4 className="text-lg font-serif font-black text-heritage-brown dark:text-white leading-snug group-hover:text-heritage-terracotta transition-colors">
                            {item.title}
                          </h4>
                          {item.subtitle && (
                            <p className="text-[11px] font-mono font-bold text-heritage-terracotta uppercase tracking-widest">
                              {item.subtitle}
                            </p>
                          )}
                          {item.detail && (
                            <p className="text-xs text-heritage-brown/70 dark:text-stone-400 leading-relaxed font-medium line-clamp-3">
                              {item.detail}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Navigation trigger button */}
                      <div className="pt-6 mt-6 border-t border-heritage-brown/5 dark:border-stone-800 flex justify-between items-center">
                        <span className="text-[10px] font-semibold text-heritage-brown/40 dark:text-stone-500">
                          Curated display
                        </span>
                        <Link
                          to={getDestinationLink(item)}
                          className="text-xs font-bold text-heritage-terracotta hover:text-heritage-terracotta/80 flex items-center gap-1 cursor-pointer"
                        >
                          <span>Examine Record</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                /* List Presentation */
                <div className="space-y-4">
                  {paginatedItems.map((item) => (
                    <motion.div
                      layout
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                      className="bg-white dark:bg-stone-900 border border-heritage-brown/10 dark:border-stone-800 rounded-2xl p-5 hover:shadow-md transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-heritage-cream dark:bg-stone-800 flex items-center justify-center shrink-0 border border-heritage-brown/5 dark:border-stone-700">
                          {getIconForType(item.type)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-base font-serif font-bold text-heritage-brown dark:text-white">
                              {item.title}
                            </h4>
                            <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-heritage-brown/40 dark:text-stone-500 bg-heritage-cream/50 dark:bg-stone-950 rounded border border-heritage-brown/5">
                              {item.type}
                            </span>
                          </div>
                          {item.subtitle && (
                            <p className="text-[10px] font-mono font-bold text-heritage-terracotta uppercase tracking-widest mt-0.5">
                              {item.subtitle}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-heritage-brown/5">
                        <Link
                          to={getDestinationLink(item)}
                          className="px-4 py-2 bg-heritage-cream dark:bg-stone-800 hover:bg-heritage-terracotta dark:hover:bg-heritage-terracotta hover:text-white rounded-xl text-xs font-bold text-heritage-brown dark:text-stone-300 flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <span>Examine</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => handleRemoveBookmark(item.id, item.title)}
                          className="p-2 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white rounded-xl transition-all cursor-pointer border border-rose-100 dark:border-rose-900/40"
                          title="Remove bookmark"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 pt-8">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="px-4 py-2 bg-white dark:bg-stone-900 border border-heritage-brown/10 dark:border-stone-800 rounded-xl text-xs font-bold text-heritage-brown dark:text-stone-300 hover:bg-heritage-terracotta hover:text-white disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-heritage-brown transition-all cursor-pointer"
                >
                  &larr; Previous Page
                </button>
                <span className="text-xs font-bold text-heritage-brown/60 dark:text-stone-400 uppercase tracking-wider">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className="px-4 py-2 bg-white dark:bg-stone-900 border border-heritage-brown/10 dark:border-stone-800 rounded-xl text-xs font-bold text-heritage-brown dark:text-stone-300 hover:bg-heritage-terracotta hover:text-white disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-heritage-brown transition-all cursor-pointer"
                >
                  Next Page &rarr;
                </button>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
