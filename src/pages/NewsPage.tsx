import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Calendar, Tag, ArrowRight, Newspaper, SlidersHorizontal, Loader2 } from 'lucide-react';
import { getNewsArticles, NewsBlogItem, formatFirebaseDate } from '../lib/firebaseContentService';

const ITEMS_PER_PAGE = 6;

export default function NewsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [newsList, setNewsList] = useState<NewsBlogItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Load news dynamically from Firestore
  useEffect(() => {
    async function fetchNews() {
      try {
        const data = await getNewsArticles(false); // Only fetch published
        setNewsList(data);
      } catch (err) {
        console.error("Failed to load news dispatches", err);
      } finally {
        setLoading(false);
      }
    }
    fetchNews();
  }, []);

  // Filter news
  const filteredNews = useMemo(() => {
    return newsList.filter(post => {
      const matchesSearch = 
        (post.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (post.summary || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.content.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = 
        selectedCategory === 'All' || 
        (post.category || '').toLowerCase() === selectedCategory.toLowerCase();

      return matchesSearch && matchesCategory;
    });
  }, [newsList, searchQuery, selectedCategory]);

  // Categories list
  const categories = useMemo(() => {
    const list = new Set<string>();
    newsList.forEach(post => {
      if (post.category) {
        list.add(post.category);
      }
    });
    return ['All', ...Array.from(list)];
  }, [newsList]);

  // Highlight featured post (latest post overall)
  const featuredPost = newsList[0];
  const listPosts = useMemo(() => {
    if (searchQuery || selectedCategory !== 'All') {
      return filteredNews;
    }
    // Exclude featured post from grid if on page 1 of main listing
    return currentPage === 1 ? filteredNews.slice(1) : filteredNews;
  }, [filteredNews, searchQuery, selectedCategory, currentPage]);

  // Paginated posts
  const paginatedPosts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return listPosts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [listPosts, currentPage]);

  const totalPages = Math.ceil(listPosts.length / ITEMS_PER_PAGE);

  if (loading) {
    return (
      <div className="pt-32 min-h-screen bg-heritage-cream dark:bg-zinc-950 flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-heritage-terracotta animate-spin mb-4" />
        <span className="text-xs font-black uppercase tracking-widest text-heritage-brown/40">Loading Dispatches...</span>
      </div>
    );
  }

  return (
    <div className="pt-24 min-h-screen bg-heritage-cream dark:bg-zinc-950 transition-colors duration-300">
      {/* Banner Header */}
      <section className="bg-heritage-olive dark:bg-zinc-900 py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center space-x-2 px-3 py-1 bg-white/10 text-heritage-sand rounded-full text-xs font-bold uppercase tracking-widest mb-4"
          >
            <Newspaper className="w-3.5 h-3.5" />
            <span>Kyoga Dispatch</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-serif font-bold text-white mb-6"
          >
            Latest News & Announcements
          </motion.h1>
          <p className="text-heritage-sand max-w-2xl mx-auto text-base md:text-lg font-medium leading-relaxed">
            Real-time developments, environmental updates, and stories of preservation from Bakenyi communities.
          </p>
        </div>
      </section>

      {/* Main Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        
        {/* Featured Post Banner */}
        {featuredPost && !searchQuery && selectedCategory === 'All' && currentPage === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-16 bg-white dark:bg-zinc-900 rounded-[32px] border border-heritage-brown/5 dark:border-zinc-800 shadow-xl overflow-hidden hover:shadow-2xl transition-shadow duration-300"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12">
              <div className="lg:col-span-7 h-80 lg:h-auto relative">
                <img 
                  src={featuredPost.featuredImage || "https://images.unsplash.com/photo-1523805009345-7448845a9e53?auto=format&fit=crop&q=80&w=800"} 
                  alt={featuredPost.title} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-6 left-6 px-4 py-1.5 bg-heritage-terracotta text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-md">
                  Featured News
                </div>
              </div>
              <div className="lg:col-span-5 p-8 md:p-12 flex flex-col justify-center">
                <div className="flex items-center space-x-4 mb-4 text-xs font-semibold text-heritage-brown/50 dark:text-zinc-400">
                  <span className="flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5 text-heritage-terracotta" />
                    <span>{formatFirebaseDate(featuredPost.publishedAt || featuredPost.createdAt)}</span>
                  </span>
                  {featuredPost.category && (
                    <span className="flex items-center space-x-1">
                      <Tag className="w-3.5 h-3.5 text-heritage-olive" />
                      <span>{featuredPost.category}</span>
                    </span>
                  )}
                </div>
                <h2 className="text-2xl md:text-3xl font-serif font-bold text-heritage-brown dark:text-white mb-4 leading-tight hover:text-heritage-terracotta dark:hover:text-heritage-sand transition-colors">
                  <Link to={`/news/${featuredPost.slug}`}>{featuredPost.title}</Link>
                </h2>
                <p className="text-heritage-brown/60 dark:text-zinc-400 mb-8 leading-relaxed text-sm md:text-base">
                  {featuredPost.summary}
                </p>
                <div>
                  <Link 
                    to={`/news/${featuredPost.slug}`}
                    className="inline-flex items-center space-x-2 py-3 px-6 bg-heritage-brown dark:bg-zinc-800 hover:bg-heritage-terracotta dark:hover:bg-heritage-olive text-white rounded-xl transition-all font-bold text-xs uppercase tracking-widest shadow-md"
                  >
                    <span>Read Full Dispatch</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Filter / Search Controls */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-12 bg-white/50 dark:bg-zinc-900/50 p-6 rounded-[24px] border border-heritage-brown/5 dark:border-zinc-800">
          {/* Search Box */}
          <div className="relative flex-grow max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-heritage-brown/40 dark:text-zinc-500" />
            <input 
              type="text" 
              placeholder="Search articles and dispatches..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full bg-white dark:bg-zinc-950 border border-heritage-brown/10 dark:border-zinc-850 rounded-xl pl-11 pr-4 py-3 text-sm text-heritage-brown dark:text-white placeholder-heritage-brown/40 focus:outline-none focus:border-heritage-terracotta transition-all"
            />
          </div>

          {/* Categories bar */}
          <div className="flex items-center space-x-2 overflow-x-auto scrollbar-none select-none">
            <SlidersHorizontal className="w-4 h-4 text-heritage-brown/30 dark:text-zinc-500 hidden sm:block shrink-0" />
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => { setSelectedCategory(cat); setCurrentPage(1); }}
                className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border shrink-0 cursor-pointer ${
                  selectedCategory === cat 
                    ? 'bg-heritage-terracotta text-white border-heritage-terracotta shadow-sm' 
                    : 'bg-white dark:bg-zinc-950 hover:bg-heritage-brown/5 text-heritage-brown/60 dark:text-zinc-400 border-heritage-brown/10 dark:border-zinc-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grid List */}
        {paginatedPosts.length > 0 ? (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <AnimatePresence mode="popLayout">
                {paginatedPosts.map((post) => (
                  <motion.article
                    layout
                    key={post.slug}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex flex-col bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl border border-heritage-brown/5 dark:border-zinc-800/80 hover:-translate-y-1 transition-all duration-350 group cursor-pointer"
                  >
                    <Link to={`/news/${post.slug}`} className="flex flex-col h-full">
                      <div className="aspect-[16/10] relative overflow-hidden bg-heritage-brown/5">
                        <img 
                          src={post.featuredImage || "https://images.unsplash.com/photo-1523805009345-7448845a9e53?auto=format&fit=crop&q=80&w=800"} 
                          alt={post.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                        {post.category && (
                          <div className="absolute top-4 left-4 px-3 py-1 bg-white/90 dark:bg-zinc-900/95 text-[9px] font-black uppercase tracking-widest text-heritage-terracotta rounded-full border border-heritage-brown/5">
                            {post.category}
                          </div>
                        )}
                      </div>
                      
                      <div className="p-6 flex flex-col flex-grow justify-between">
                        <div>
                          <div className="flex items-center space-x-2 text-[10px] font-bold text-heritage-brown/40 dark:text-zinc-500 mb-2">
                            <Calendar className="w-3 h-3" />
                            <span>{formatFirebaseDate(post.publishedAt || post.createdAt)}</span>
                          </div>
                          <h3 className="text-lg md:text-xl font-serif font-bold text-heritage-brown dark:text-white leading-snug group-hover:text-heritage-terracotta dark:group-hover:text-heritage-sand transition-colors mb-3">
                            {post.title}
                          </h3>
                          <p className="text-xs text-heritage-brown/60 dark:text-zinc-400 line-clamp-3 leading-relaxed mb-4">
                            {post.summary}
                          </p>
                        </div>

                        <div className="pt-4 border-t border-heritage-brown/5 dark:border-zinc-800 flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-heritage-brown dark:text-zinc-400 group-hover:text-heritage-terracotta transition-colors mt-auto">
                          <span>Read Dispatch</span>
                          <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1.5 transition-transform" />
                        </div>
                      </div>
                    </Link>
                  </motion.article>
                ))}
              </AnimatePresence>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2 mt-16 select-none">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-heritage-brown/10 dark:border-zinc-800 rounded-xl text-xs font-bold uppercase tracking-widest text-heritage-brown/60 dark:text-zinc-400 disabled:opacity-40 disabled:pointer-events-none hover:bg-heritage-brown/5"
                >
                  Prev
                </button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${
                      currentPage === i + 1
                        ? 'bg-heritage-brown text-white shadow-md'
                        : 'border border-heritage-brown/10 dark:border-zinc-800 text-heritage-brown/60 dark:text-zinc-400 hover:bg-heritage-brown/5'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-heritage-brown/10 dark:border-zinc-800 rounded-xl text-xs font-bold uppercase tracking-widest text-heritage-brown/60 dark:text-zinc-400 disabled:opacity-40 disabled:pointer-events-none hover:bg-heritage-brown/5"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-24 bg-white dark:bg-zinc-900 rounded-[32px] border border-heritage-brown/5 dark:border-zinc-800">
            <Newspaper className="w-12 h-12 text-heritage-brown/20 dark:text-zinc-600 mx-auto mb-4" />
            <h3 className="text-xl font-serif font-bold text-heritage-brown dark:text-white mb-2">No News Found</h3>
            <p className="text-sm text-heritage-brown/50 dark:text-zinc-400 max-w-md mx-auto">
              We couldn't find any news dispatches matching your current filter criteria. Try adjusting your query.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
