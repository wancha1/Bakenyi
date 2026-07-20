import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Newspaper, 
  Calendar, 
  User, 
  Tag, 
  ChevronRight, 
  ArrowRight, 
  Clock, 
  Bell, 
  AlertCircle,
  Eye,
  Bookmark,
  Share2
} from 'lucide-react';
import { getNews } from '../lib/heritageService';
import { News as NewsType } from '../types/heritage';
import SEO from '../components/SEO';

export default function News() {
  const [newsList, setNewsList] = useState<NewsType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    async function fetchNews() {
      setLoading(true);
      try {
        const data = await getNews(true); // only published news
        setNewsList(data);
      } catch (err) {
        console.error('Error fetching news:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchNews();
  }, []);

  // Categories
  const categories = [
    'All',
    'Council Dispatch',
    'Community News',
    'Cultural Update',
    'Platform Announcement',
    'Preservation Notice'
  ];

  // Filters
  const filteredNews = newsList.filter(item => {
    const matchesSearch = 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.summary && item.summary.toLowerCase().includes(searchTerm.toLowerCase())) ||
      item.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Featured News (usually the first featured news item or the most recent)
  const featuredItem = filteredNews.find(item => item.featured) || filteredNews[0];
  const regularNews = featuredItem 
    ? filteredNews.filter(item => item.id !== featuredItem.id) 
    : filteredNews;

  // Pagination
  const totalPages = Math.ceil(regularNews.length / itemsPerPage);
  const paginatedNews = regularNews.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Recent';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-heritage-cream py-12 px-4 sm:px-6 lg:px-8">
      <SEO 
        title="Community Dispatches & News | Bakenye Cultural Heritage"
        description="Stay updated with Council dispatches, general community news, system notifications, and preservation notices from the Bakenye council."
        keywords="bakenye, news, dispatches, council bulletins, announcements"
      />

      {/* Decorative top grid banner */}
      <div className="absolute top-0 inset-x-0 h-80 bg-gradient-to-b from-heritage-terracotta/5 to-transparent pointer-events-none" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Header Section */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-heritage-terracotta/10 border border-heritage-terracotta/20 text-heritage-terracotta text-xs font-black uppercase tracking-widest mb-4 animate-fade-in">
            <Newspaper className="w-3.5 h-3.5" />
            <span>Official Dispatches</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-sans font-black tracking-tight text-heritage-ink mb-3 leading-none">
            Platform Dispatches & News
          </h1>
          <p className="text-sm font-medium text-heritage-brown/75 leading-relaxed">
            Stay informed with authentic cultural updates, council communications, development updates, and announcements from the Bakenye cultural guardians.
          </p>
        </div>

        {/* Search & Categories Bar */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-heritage-brown/10 mb-8 flex flex-col md:flex-row gap-4 justify-between items-center">
          {/* Search Input */}
          <div className="relative w-full md:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-heritage-brown/40" />
            <input
              type="text"
              placeholder="Search dispatches, tags, updates..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 bg-heritage-cream/50 border border-heritage-brown/15 rounded-xl text-xs font-semibold focus:outline-none focus:border-heritage-terracotta text-heritage-ink placeholder-heritage-brown/40 transition-all"
            />
          </div>

          {/* Categories Horizontal scroll */}
          <div className="flex gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none justify-start md:justify-end">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider border whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-heritage-terracotta border-heritage-terracotta text-white shadow-sm'
                    : 'bg-stone-50 border-heritage-brown/10 hover:border-heritage-terracotta/30 text-heritage-brown/70 hover:text-heritage-terracotta'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          /* Loading Skeletons */
          <div className="space-y-8">
            <div className="bg-white border border-heritage-brown/10 rounded-2xl p-6 md:p-8 animate-pulse grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-7 h-64 bg-stone-100 rounded-xl" />
              <div className="md:col-span-5 space-y-4 py-2">
                <div className="h-4 bg-stone-100 rounded w-1/4" />
                <div className="h-8 bg-stone-100 rounded w-3/4" />
                <div className="h-4 bg-stone-100 rounded w-full" />
                <div className="h-4 bg-stone-100 rounded w-5/6" />
                <div className="h-10 bg-stone-100 rounded w-1/3" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white border border-heritage-brown/10 rounded-2xl p-4 animate-pulse space-y-3">
                  <div className="h-40 bg-stone-100 rounded-xl" />
                  <div className="h-4 bg-stone-100 rounded w-1/3" />
                  <div className="h-6 bg-stone-100 rounded w-3/4" />
                  <div className="h-4 bg-stone-100 rounded w-full" />
                </div>
              ))}
            </div>
          </div>
        ) : filteredNews.length === 0 ? (
          /* Empty State */
          <div className="text-center py-16 bg-white border border-heritage-brown/10 rounded-2xl p-8 max-w-md mx-auto">
            <AlertCircle className="w-12 h-12 text-heritage-brown/40 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-heritage-ink mb-1">No Dispatches Found</h3>
            <p className="text-xs text-heritage-brown/60 mb-6 leading-relaxed">
              We couldn't find any news articles matching your current search criteria. Try modifying your search term or choosing another category.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('All');
              }}
              className="px-4 py-2 bg-heritage-terracotta hover:bg-heritage-terracotta/90 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="space-y-12">
            
            {/* Featured Post Highlight */}
            {featuredItem && currentPage === 1 && (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="bg-white border border-heritage-brown/10 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all group grid grid-cols-1 lg:grid-cols-12"
              >
                {/* Image side */}
                <div className="lg:col-span-7 h-64 sm:h-80 lg:h-full relative overflow-hidden bg-stone-900">
                  {featuredItem.cover_image ? (
                    <img 
                      src={featuredItem.cover_image} 
                      alt={featuredItem.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 brightness-95"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-stone-950/90 relative">
                      <div className="absolute inset-0 cultural-pattern opacity-10" />
                      <Newspaper className="w-16 h-16 text-heritage-terracotta opacity-20" />
                    </div>
                  )}
                  {/* Category label overlay */}
                  <span className="absolute top-4 left-4 bg-heritage-terracotta text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full shadow-sm">
                    {featuredItem.category}
                  </span>
                </div>

                {/* Content side */}
                <div className="lg:col-span-5 p-6 sm:p-8 lg:p-10 flex flex-col justify-center">
                  <div className="flex items-center gap-4 text-heritage-brown/50 text-[11px] font-bold mb-4">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-heritage-terracotta" />
                      {formatDate(featuredItem.published_at || featuredItem.created_at)}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />
                      Council Council
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-sans font-black tracking-tight text-heritage-ink mb-4 group-hover:text-heritage-terracotta transition-colors leading-tight">
                    <Link to={`/news/${featuredItem.id}`}>
                      {featuredItem.title}
                    </Link>
                  </h2>

                  <p className="text-xs sm:text-sm text-heritage-brown/80 font-medium leading-relaxed mb-6">
                    {featuredItem.summary || (featuredItem.content ? featuredItem.content.substring(0, 160) + '...' : '')}
                  </p>

                  <div className="flex flex-wrap gap-1 mb-6">
                    {featuredItem.tags.slice(0, 3).map(t => (
                      <span key={t} className="text-[9px] font-black uppercase tracking-wider text-heritage-brown/60 bg-heritage-cream px-2 py-0.5 rounded-md flex items-center gap-0.5">
                        <Tag className="w-2.5 h-2.5 text-heritage-terracotta" />
                        {t}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-heritage-brown/5">
                    <Link 
                      to={`/news/${featuredItem.id}`}
                      className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-heritage-terracotta hover:text-heritage-terracotta/80 group-hover:gap-2.5 transition-all"
                    >
                      <span>Read Dispatch</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                    
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-amber-700 text-[9px] font-black uppercase tracking-wider">
                      Featured
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Grid of regular news dispatches */}
            <div>
              {currentPage === 1 && (
                <h3 className="text-xs font-black uppercase tracking-widest text-heritage-brown/40 border-b border-heritage-brown/10 pb-2 mb-6">
                  Recent Dispatches & Bulletins
                </h3>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                  {paginatedNews.map((item, idx) => (
                    <motion.article
                      key={item.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3, delay: idx * 0.05 }}
                      className="bg-white border border-heritage-brown/10 rounded-2xl overflow-hidden hover:shadow-md transition-all group flex flex-col h-full"
                    >
                      {/* Cover Thumbnail */}
                      <div className="h-44 relative bg-stone-900 overflow-hidden shrink-0">
                        {item.cover_image ? (
                          <img 
                            src={item.cover_image} 
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 brightness-95"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-stone-950/90 relative">
                            <div className="absolute inset-0 cultural-pattern opacity-10" />
                            <Newspaper className="w-10 h-10 text-heritage-terracotta opacity-20" />
                          </div>
                        )}
                        <span className="absolute top-3 left-3 bg-stone-900/80 backdrop-blur-md text-heritage-cream text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border border-heritage-cream/10">
                          {item.category}
                        </span>
                      </div>

                      {/* Content Body */}
                      <div className="p-5 flex flex-col flex-grow">
                        <div className="flex items-center gap-3 text-heritage-brown/40 text-[10px] font-bold mb-3">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-heritage-terracotta" />
                            {formatDate(item.published_at || item.created_at)}
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-heritage-ink group-hover:text-heritage-terracotta transition-colors line-clamp-2 leading-snug mb-2 font-sans">
                          <Link to={`/news/${item.id}`}>
                            {item.title}
                          </Link>
                        </h4>

                        <p className="text-xs text-heritage-brown/70 leading-relaxed font-medium line-clamp-3 mb-4 flex-grow">
                          {item.summary || (item.content ? item.content.substring(0, 110) + '...' : '')}
                        </p>

                        <div className="flex flex-wrap gap-1 mb-4">
                          {item.tags.slice(0, 2).map(t => (
                            <span key={t} className="text-[8px] font-black uppercase tracking-wider text-heritage-brown/50 bg-stone-50 border border-heritage-brown/5 px-2 py-0.5 rounded">
                              #{t}
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-heritage-brown/5 mt-auto">
                          <Link 
                            to={`/news/${item.id}`}
                            className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-heritage-terracotta hover:text-heritage-terracotta/80 group-hover:gap-2 transition-all"
                          >
                            <span>Details</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    </motion.article>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="p-2 rounded-lg border border-heritage-brown/10 bg-white hover:bg-stone-50 disabled:opacity-40 text-heritage-brown cursor-pointer transition-colors"
                >
                  &larr;
                </button>
                <span className="text-xs font-black uppercase tracking-widest text-heritage-brown/60 px-4">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  className="p-2 rounded-lg border border-heritage-brown/10 bg-white hover:bg-stone-50 disabled:opacity-40 text-heritage-brown cursor-pointer transition-colors"
                >
                  &rarr;
                </button>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
