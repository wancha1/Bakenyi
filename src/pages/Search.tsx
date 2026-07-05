import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search as SearchIcon, 
  Shield, 
  User, 
  Clock, 
  Volume2, 
  BookOpen, 
  ArrowRight, 
  X, 
  SlidersHorizontal, 
  ArrowUpDown, 
  RotateCcw,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { getSupabase } from '../lib/supabaseClient';

export interface SearchItem {
  id: string;
  category: 'Clan' | 'Leader' | 'History Timeline' | 'Oral History' | 'Article';
  title: string;
  subtitle: string;
  description: string;
  targetPath: string;
}

type CategoryFilter = 'All' | 'Clan' | 'Leader' | 'History Timeline' | 'Oral History' | 'Article';
type SortOrder = 'relevance' | 'alpha-asc' | 'alpha-desc';

const CATEGORIES: { label: string; value: CategoryFilter; icon: React.ReactNode; color: string }[] = [
  { label: 'All Results', value: 'All', icon: <Sparkles className="w-4 h-4" />, color: 'text-heritage-terracotta bg-heritage-terracotta/5 border-heritage-terracotta/20' },
  { label: 'Clans', value: 'Clan', icon: <Shield className="w-4 h-4" />, color: 'text-blue-600 bg-blue-500/5 border-blue-500/20' },
  { label: 'Leaders & Custodians', value: 'Leader', icon: <User className="w-4 h-4" />, color: 'text-emerald-600 bg-emerald-500/5 border-emerald-500/20' },
  { label: 'History & Timelines', value: 'History Timeline', icon: <Clock className="w-4 h-4" />, color: 'text-amber-600 bg-amber-500/5 border-amber-500/20' },
  { label: 'Oral Tracks', value: 'Oral History', icon: <Volume2 className="w-4 h-4" />, color: 'text-purple-600 bg-purple-500/5 border-purple-500/20' },
  { label: 'Published Articles', value: 'Article', icon: <BookOpen className="w-4 h-4" />, color: 'text-rose-600 bg-rose-500/5 border-rose-500/20' }
];

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const queryParam = searchParams.get('q') || '';
  const categoryParam = (searchParams.get('category') as CategoryFilter) || 'All';
  const sortParam = (searchParams.get('sort') as SortOrder) || 'relevance';

  const [searchTerm, setSearchTerm] = useState(queryParam);
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>(categoryParam);
  const [sortBy, setSortBy] = useState<SortOrder>(sortParam);
  const [showFilters, setShowFilters] = useState(true);
  const [searchDatabase, setSearchDatabase] = useState<SearchItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch dynamic search elements from Supabase
  useEffect(() => {
    async function fetchSearchDatabase() {
      setLoading(true);
      const client = getSupabase();
      if (!client) {
        setSearchDatabase([]);
        setLoading(false);
        return;
      }

      const items: SearchItem[] = [];

      // 1. Fetch Articles
      try {
        const { data, error } = await client.from('articles').select('id, title, summary, content');
        if (!error && data) {
          data.forEach((row: any) => {
            items.push({
              id: `article-${row.id}`,
              category: 'Article',
              title: row.title,
              subtitle: row.summary || 'Heritage Article',
              description: row.content || '',
              targetPath: `/articles/${row.id}`
            });
          });
        }
      } catch (e) {
        console.warn('Search: failed to fetch articles:', e);
      }

      // 2. Fetch Gallery (Oral History/Media)
      try {
        const { data, error } = await client.from('gallery').select('id, title, image_url');
        if (!error && data) {
          data.forEach((row: any) => {
            let titleVal = row.title;
            let desc = '';
            let cat = 'Oral History';
            try {
              if (titleVal.startsWith('{')) {
                const parsed = JSON.parse(titleVal);
                titleVal = parsed.title;
                desc = parsed.description || '';
                cat = parsed.category || 'Oral History';
              }
            } catch (e) {}

            items.push({
              id: `gallery-${row.id}`,
              category: cat === 'History' ? 'History Timeline' : 'Oral History',
              title: titleVal,
              subtitle: desc || 'Media File',
              description: desc || '',
              targetPath: `/gallery`
            });
          });
        }
      } catch (e) {
        console.warn('Search: failed to fetch gallery:', e);
      }

      // 3. Fetch Clans
      try {
        const { data, error } = await client.from('clans').select('*');
        if (!error && data) {
          data.forEach((row: any) => {
            items.push({
              id: `clan-${row.id || row.name}`,
              category: 'Clan',
              title: row.name,
              subtitle: row.totem || '',
              description: row.desc || row.motto || '',
              targetPath: `/clans?q=${row.name}`
            });
          });
        }
      } catch (e) {
        console.warn('Search: clans table query failed:', e);
      }

      // 4. Fetch Leaders
      let leadersLoaded = false;
      try {
        const { data, error } = await client.from('leaders').select('*');
        if (!error && data) {
          leadersLoaded = true;
          data.forEach((row: any) => {
            items.push({
              id: `leader-${row.id || row.name}`,
              category: 'Leader',
              title: row.name,
              subtitle: row.role || '',
              description: row.bio || row.expertise || '',
              targetPath: `/leadership?q=${row.name}`
            });
          });
        }
      } catch (e) {
        console.warn('Search: leaders table query failed:', e);
      }

      if (!leadersLoaded) {
        try {
          const { data, error } = await client.from('profiles').select('*').in('role', ['admin', 'staff']);
          if (!error && data) {
            data.forEach((row: any) => {
              items.push({
                id: `leader-profile-${row.id}`,
                category: 'Leader',
                title: row.full_name || row.email,
                subtitle: row.role === 'admin' ? 'Cultural Council Admin' : 'Cultural Council Staff',
                description: 'Custodian of Bakenyi cultural heritage.',
                targetPath: `/leadership`
              });
            });
          }
        } catch (e) {
          console.warn('Search: failed to fetch profiles:', e);
        }
      }

      // 5. Fetch Oral History tracks
      try {
        const { data, error } = await client.from('oral_history').select('*');
        if (!error && data) {
          data.forEach((row: any) => {
            items.push({
              id: `oral-${row.id || row.title}`,
              category: 'Oral History',
              title: row.title,
              subtitle: row.elder || '',
              description: row.topic || '',
              targetPath: `/history?track=${row.id}`
            });
          });
        }
      } catch (e) {
        console.warn('Search: oral_history table query failed:', e);
      }

      // 6. Fetch History timeline events
      try {
        const { data, error } = await client.from('timeline_events').select('*');
        if (!error && data) {
          data.forEach((row: any) => {
            items.push({
              id: `timeline-${row.id || row.title}`,
              category: 'History Timeline',
              title: row.title,
              subtitle: row.period || '',
              description: row.desc || '',
              targetPath: `/history`
            });
          });
        }
      } catch (e) {
        console.warn('Search: timeline_events table query failed:', e);
      }

      setSearchDatabase(items);
      setLoading(false);
    }

    fetchSearchDatabase();
  }, []);

  // Sync state with URL Search Params
  useEffect(() => {
    setSearchTerm(searchParams.get('q') || '');
    const cat = searchParams.get('category') as CategoryFilter;
    if (cat && ['All', 'Clan', 'Leader', 'History Timeline', 'Oral History', 'Article'].includes(cat)) {
      setSelectedCategory(cat);
    } else {
      setSelectedCategory('All');
    }
    const sort = searchParams.get('sort') as SortOrder;
    if (sort && ['relevance', 'alpha-asc', 'alpha-desc'].includes(sort)) {
      setSortBy(sort);
    } else {
      setSortBy('relevance');
    }
  }, [searchParams]);

  // Update URL params
  const updateUrlParams = (newQuery: string, newCat: CategoryFilter, newSort: SortOrder) => {
    const params: Record<string, string> = {};
    if (newQuery.trim() !== '') params.q = newQuery;
    if (newCat !== 'All') params.category = newCat;
    if (newSort !== 'relevance') params.sort = newSort;
    setSearchParams(params);
  };

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    updateUrlParams(val, selectedCategory, sortBy);
  };

  const handleCategorySelect = (cat: CategoryFilter) => {
    setSelectedCategory(cat);
    updateUrlParams(searchTerm, cat, sortBy);
  };

  const handleSortSelect = (sort: SortOrder) => {
    setSortBy(sort);
    updateUrlParams(searchTerm, selectedCategory, sort);
  };

  const handleClearAll = () => {
    setSearchTerm('');
    setSelectedCategory('All');
    setSortBy('relevance');
    setSearchParams({});
  };

  // Live filter and sort database items
  const processedResults = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    
    // 1. Text Search Filter
    let items = searchDatabase;
    if (query !== '') {
      items = searchDatabase.filter(item => 
        item.title.toLowerCase().includes(query) ||
        item.subtitle.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
      );
    }

    // 2. Category Filter
    if (selectedCategory !== 'All') {
      items = items.filter(item => item.category === selectedCategory);
    }

    // 3. Sorting
    const sorted = [...items];
    if (sortBy === 'alpha-asc') {
      sorted.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'alpha-desc') {
      sorted.sort((a, b) => b.title.localeCompare(a.title));
    } else if (sortBy === 'relevance' && query !== '') {
      // Sort by relevance (title match first, then subtitle, then desc)
      sorted.sort((a, b) => {
        const aTitleMatch = a.title.toLowerCase().includes(query) ? 2 : 0;
        const aSubMatch = a.subtitle.toLowerCase().includes(query) ? 1 : 0;
        const bTitleMatch = b.title.toLowerCase().includes(query) ? 2 : 0;
        const bSubMatch = b.subtitle.toLowerCase().includes(query) ? 1 : 0;
        return (bTitleMatch + bSubMatch) - (aTitleMatch + aSubMatch);
      });
    }

    return sorted;
  }, [searchTerm, selectedCategory, sortBy]);

  // Categories counts mapping
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: searchDatabase.length };
    searchDatabase.forEach(item => {
      counts[item.category] = (counts[item.category] || 0) + 1;
    });
    return counts;
  }, [searchDatabase]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Clan':
        return <Shield className="w-5 h-5 text-blue-600" />;
      case 'Leader':
        return <User className="w-5 h-5 text-emerald-600" />;
      case 'History Timeline':
        return <Clock className="w-5 h-5 text-amber-600" />;
      case 'Oral History':
        return <Volume2 className="w-5 h-5 text-purple-600" />;
      default:
        return <BookOpen className="w-5 h-5 text-rose-600" />;
    }
  };

  const getCategoryStyle = (category: string) => {
    switch (category) {
      case 'Clan':
        return 'text-blue-700 bg-blue-50 border-blue-200/50 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800/30';
      case 'Leader':
        return 'text-emerald-700 bg-emerald-50 border-emerald-200/50 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800/30';
      case 'History Timeline':
        return 'text-amber-700 bg-amber-50 border-amber-200/50 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800/30';
      case 'Oral History':
        return 'text-purple-700 bg-purple-50 border-purple-200/50 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800/30';
      default:
        return 'text-rose-700 bg-rose-50 border-rose-200/50 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-800/30';
    }
  };

  const popularSuggestions = [
    { text: 'BaiseMugosa', label: 'Mugosa Clan' },
    { text: 'Ebiswa', label: 'Floating Islands' },
    { text: 'Moses', label: 'Elder Moses' },
    { text: 'Preservation', label: 'Lukenye Preservation' },
    { text: 'Canoe', label: 'Canoe Craft' }
  ];

  return (
    <div className="pt-24 min-h-screen bg-heritage-cream text-heritage-ink transition-colors duration-300">
      {/* Decorative top strip */}
      <div className="h-2 bg-gradient-to-r from-heritage-olive via-heritage-sand to-heritage-terracotta" />

      {/* Main Search Banner */}
      <div className="bg-heritage-brown/5 dark:bg-heritage-brown/10 py-12 md:py-16 border-b border-heritage-brown/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center space-x-2 bg-heritage-terracotta/10 text-heritage-terracotta px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-4"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Heritage Knowledge Base</span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-3xl md:text-5xl font-serif font-black text-heritage-brown mb-4 tracking-tight leading-none"
            >
              Site-Wide Search
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-sm md:text-base text-heritage-brown/70 dark:text-heritage-brown/80 mb-8 max-w-xl mx-auto font-medium"
            >
              Uncover the history, culture, clans, language, and ancestral wisdom of the Bakenyi people.
            </motion.p>

            {/* Search Input Box */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 }}
              className="relative max-w-2xl mx-auto"
            >
              <SearchIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-heritage-brown/40 dark:text-heritage-brown/50" />
              <input
                type="text"
                placeholder="Type here to search articles, clans, leaders, or timelines..."
                className="w-full bg-white dark:bg-heritage-cream/10 border-2 border-heritage-brown/10 focus:border-heritage-terracotta dark:focus:border-heritage-terracotta/60 rounded-2xl pl-13 pr-12 py-4.5 text-base text-heritage-brown focus:outline-none focus:shadow-md transition-all font-semibold"
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                id="main-search-input"
              />
              {searchTerm && (
                <button 
                  onClick={() => handleSearchChange('')}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-heritage-brown/40 hover:text-heritage-brown hover:scale-110 active:scale-95 transition-all p-1 bg-heritage-brown/5 hover:bg-heritage-brown/10 rounded-full"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </motion.div>

            {/* Quick Suggestions */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs"
            >
              <span className="text-heritage-brown/60 dark:text-heritage-brown/70 font-semibold mr-1 flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5" /> Popular topics:
              </span>
              {popularSuggestions.map((suggestion) => (
                <button
                  key={suggestion.text}
                  onClick={() => handleSearchChange(suggestion.text)}
                  className="px-3 py-1 bg-white/70 dark:bg-heritage-cream/5 hover:bg-heritage-terracotta/10 text-heritage-brown hover:text-heritage-terracotta font-semibold border border-heritage-brown/5 hover:border-heritage-terracotta/20 rounded-full transition-all cursor-pointer"
                >
                  {suggestion.label}
                </button>
              ))}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Results & Interactive Filters Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Left Column: Filter Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-heritage-cream/5 border border-heritage-brown/10 rounded-2xl p-5 shadow-sm sticky top-28">
              <div className="flex items-center justify-between mb-4 border-b border-heritage-brown/5 pb-3">
                <div className="flex items-center space-x-2 font-bold text-heritage-brown text-sm uppercase tracking-wider">
                  <SlidersHorizontal className="w-4 h-4" />
                  <span>Search Filters</span>
                </div>
                {(searchTerm || selectedCategory !== 'All' || sortBy !== 'relevance') && (
                  <button 
                    onClick={handleClearAll}
                    className="text-xs text-heritage-terracotta font-bold flex items-center gap-1 hover:underline cursor-pointer"
                    title="Reset all filters"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset
                  </button>
                )}
              </div>

              {/* Categories Filter Block */}
              <div className="space-y-1.5 mb-6">
                <h3 className="text-xs font-black text-heritage-brown/40 dark:text-heritage-brown/50 uppercase tracking-widest mb-2">
                  Category
                </h3>
                <div className="flex flex-col gap-1">
                  {CATEGORIES.map((cat) => {
                    const isSelected = selectedCategory === cat.value;
                    const count = cat.value === 'All' 
                      ? searchDatabase.length 
                      : categoryCounts[cat.value] || 0;
                    
                    return (
                      <button
                        key={cat.value}
                        onClick={() => handleCategorySelect(cat.value)}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all border text-left cursor-pointer ${
                          isSelected
                            ? 'bg-heritage-brown text-white border-heritage-brown shadow-sm'
                            : 'bg-transparent text-heritage-brown/80 hover:text-heritage-brown border-transparent hover:bg-heritage-brown/5 hover:border-heritage-brown/5'
                        }`}
                        id={`filter-category-${cat.value.replace(' ', '-')}`}
                      >
                        <div className="flex items-center space-x-2.5">
                          <span className={isSelected ? 'text-white' : 'text-heritage-brown/50'}>
                            {cat.icon}
                          </span>
                          <span>{cat.label}</span>
                        </div>
                        <span className={`px-2 py-0.5 text-[10px] rounded-full font-black ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-heritage-brown/10 text-heritage-brown/70'
                        }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sorting Filter Block */}
              <div className="pt-4 border-t border-heritage-brown/5">
                <h3 className="text-xs font-black text-heritage-brown/40 dark:text-heritage-brown/50 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  Sort By
                </h3>
                <div className="grid grid-cols-1 gap-1.5">
                  {[
                    { label: 'Best Match / Relevance', value: 'relevance' },
                    { label: 'Alphabetical (A - Z)', value: 'alpha-asc' },
                    { label: 'Alphabetical (Z - A)', value: 'alpha-desc' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleSortSelect(option.value as SortOrder)}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                        sortBy === option.value
                          ? 'bg-heritage-terracotta/10 text-heritage-terracotta border-heritage-terracotta/20 font-black'
                          : 'bg-transparent text-heritage-brown/70 hover:text-heritage-brown border-transparent hover:bg-heritage-brown/5'
                      }`}
                      id={`filter-sort-${option.value}`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Search Results Feed */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Search metadata and status bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-heritage-cream/5 border border-heritage-brown/10 rounded-2xl px-5 py-4 shadow-sm">
              <div className="text-xs font-bold text-heritage-brown/70">
                Found <span className="text-heritage-terracotta text-sm font-black">{processedResults.length}</span> matching records 
                {selectedCategory !== 'All' && <> in <span className="text-heritage-olive uppercase tracking-wider">{selectedCategory}</span></>}
                {searchTerm.trim() !== '' && <> for "<span className="text-heritage-brown font-black italic">{searchTerm}</span>"</>}
              </div>
              <div className="flex gap-2 flex-wrap text-[10px] font-black uppercase tracking-wider">
                <span className="px-2.5 py-1 rounded-full bg-heritage-brown/5 text-heritage-brown border border-heritage-brown/5">
                  Total Items: {searchDatabase.length}
                </span>
                {selectedCategory !== 'All' && (
                  <button 
                    onClick={() => handleCategorySelect('All')}
                    className="px-2.5 py-1 rounded-full bg-heritage-terracotta/10 text-heritage-terracotta border border-heritage-terracotta/20 hover:bg-heritage-terracotta/20 transition-all flex items-center gap-1 cursor-pointer"
                  >
                    Category: {selectedCategory} <X className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Results Grid / List */}
            <AnimatePresence mode="popLayout">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-heritage-cream/5 border border-heritage-brown/10 rounded-[32px]">
                  <div className="relative w-12 h-12">
                    <div className="absolute top-0 left-0 w-full h-full border-4 border-heritage-terracotta/20 rounded-full"></div>
                    <div className="absolute top-0 left-0 w-full h-full border-4 border-t-heritage-terracotta border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                  </div>
                  <p className="mt-4 text-xs font-bold text-heritage-brown/60 tracking-wider uppercase animate-pulse">
                    Querying Bakenye knowledge tables...
                  </p>
                </div>
              ) : processedResults.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {processedResults.map((item, index) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.25, delay: Math.min(index * 0.05, 0.4) }}
                      key={item.id}
                      onClick={() => navigate(item.targetPath)}
                      className="heritage-card group relative flex flex-col p-6 cursor-pointer border-2 border-transparent hover:border-heritage-terracotta/10 hover:shadow-lg dark:hover:bg-heritage-cream/5 transition-all duration-300"
                    >
                      {/* Category Badge & Icon */}
                      <div className="flex items-center justify-between mb-4">
                        <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${getCategoryStyle(item.category)}`}>
                          {item.category}
                        </span>
                        <div className="p-2 bg-heritage-cream dark:bg-white/5 border border-heritage-brown/10 rounded-xl group-hover:scale-110 group-hover:bg-white transition-all duration-300">
                          {getCategoryIcon(item.category)}
                        </div>
                      </div>

                      {/* Title & Subtitle */}
                      <div className="flex-grow">
                        <h2 className="text-xl font-serif font-bold text-heritage-brown group-hover:text-heritage-terracotta transition-colors duration-200 mb-1.5 leading-snug">
                          {item.title}
                        </h2>
                        <h3 className="text-xs font-bold text-heritage-brown/70 dark:text-heritage-brown/85 italic mb-3">
                          {item.subtitle}
                        </h3>
                        <p className="text-xs text-heritage-brown/50 dark:text-heritage-brown/75 leading-relaxed">
                          {item.description}
                        </p>
                      </div>

                      {/* Action trigger */}
                      <div className="mt-6 pt-4 border-t border-heritage-brown/5 flex items-center justify-between text-xs font-bold text-heritage-terracotta group-hover:text-heritage-terracotta/80 transition-colors">
                        <span>Explore Topic</span>
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-heritage-terracotta/5 group-hover:bg-heritage-terracotta group-hover:text-white transition-all duration-300 -translate-x-1 group-hover:translate-x-0">
                          <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white dark:bg-heritage-cream/5 border border-heritage-brown/10 rounded-[32px] p-12 text-center shadow-sm"
                >
                  <div className="w-16 h-16 bg-heritage-brown/5 rounded-full flex items-center justify-center mx-auto mb-6">
                    <SearchIcon className="w-8 h-8 text-heritage-brown/30" />
                  </div>
                  <h3 className="text-xl font-serif font-bold text-heritage-brown mb-2">
                    No results match your criteria
                  </h3>
                  <p className="text-sm text-heritage-brown/50 dark:text-heritage-brown/70 max-w-md mx-auto mb-6">
                    We couldn't find anything matching your exact search. Try adjusting your query or category filters, or explore our recommended topics.
                  </p>
                  <div className="flex justify-center gap-3">
                    <button 
                      onClick={handleClearAll}
                      className="px-5 py-2.5 bg-heritage-brown hover:bg-heritage-brown/90 text-white rounded-xl text-xs font-bold transition-all hover:shadow-md flex items-center gap-2 cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Reset All Filters
                    </button>
                    <button 
                      onClick={() => handleSearchChange('Baise')}
                      className="px-5 py-2.5 bg-heritage-cream border border-heritage-brown/10 hover:border-heritage-terracotta/25 hover:bg-heritage-terracotta/5 text-heritage-brown rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      Search "Baise"
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </div>
      </div>
    </div>
  );
}
