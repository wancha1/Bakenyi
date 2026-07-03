import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Calendar, User, Tag, ArrowRight, BookOpen, SlidersHorizontal, Loader2 } from 'lucide-react';
import { getBlogPosts, NewsBlogItem, formatFirebaseDate } from '../lib/firebaseContentService';

const ITEMS_PER_PAGE = 6;

export default function BlogPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedTag, setSelectedTag] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [blogsList, setBlogsList] = useState<NewsBlogItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Load blog articles from Firestore
  useEffect(() => {
    async function fetchBlogs() {
      try {
        const data = await getBlogPosts(false); // Only fetch published
        setBlogsList(data);
      } catch (err) {
        console.error("Failed to fetch blog essays:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchBlogs();
  }, []);

  // Filter blogs
  const filteredBlogs = useMemo(() => {
    return blogsList.filter(post => {
      const matchesSearch = 
        (post.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (post.authorName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.content.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = 
        selectedCategory === 'All' || 
        (post.category || '').toLowerCase() === selectedCategory.toLowerCase();

      // Handle tags which could be an array or string
      const tags = post.tags as any;
      const matchesTag = 
        selectedTag === 'All' ||
        (Array.isArray(tags) && tags.some(t => t.toLowerCase() === selectedTag.toLowerCase())) ||
        (typeof tags === 'string' && tags.toLowerCase() === selectedTag.toLowerCase());

      return matchesSearch && matchesCategory && matchesTag;
    });
  }, [blogsList, searchQuery, selectedCategory, selectedTag]);

  // Extract all categories
  const categories = useMemo(() => {
    const list = new Set<string>();
    blogsList.forEach(post => {
      if (post.category) {
        list.add(post.category);
      }
    });
    return ['All', ...Array.from(list)];
  }, [blogsList]);

  // Extract all tags
  const tagsList = useMemo(() => {
    const list = new Set<string>();
    blogsList.forEach(post => {
      const tags = post.tags as any;
      if (Array.isArray(tags)) {
        tags.forEach(t => list.add(t));
      } else if (typeof tags === 'string' && tags.trim() !== '') {
        list.add(tags);
      }
    });
    return ['All', ...Array.from(list)];
  }, [blogsList]);

  // Paginate
  const paginatedBlogs = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredBlogs.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredBlogs, currentPage]);

  const totalPages = Math.ceil(filteredBlogs.length / ITEMS_PER_PAGE);

  // Calculate reading time
  const getReadingTime = (text: string) => {
    const wordsPerMinute = 200;
    const words = text.split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return `${minutes} min read`;
  };

  if (loading) {
    return (
      <div className="pt-32 min-h-screen bg-heritage-cream dark:bg-zinc-950 flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-heritage-terracotta animate-spin mb-4" />
        <span className="text-xs font-black uppercase tracking-widest text-heritage-brown/40">Loading Essays...</span>
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
            <BookOpen className="w-3.5 h-3.5" />
            <span>Cultural Chronicles</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-serif font-bold text-white mb-6"
          >
            Bakenyi Heritage Blog
          </motion.h1>
          <p className="text-heritage-sand max-w-2xl mx-auto text-base md:text-lg font-medium leading-relaxed">
            In-depth perspectives, academic essays, and traditional lore written by Bakenyi scholars and keepers of tradition.
          </p>
        </div>
      </section>

      {/* Main Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        
        {/* Search & Category Controllers */}
        <div className="flex flex-col gap-6 mb-12 bg-white/50 dark:bg-zinc-900/50 p-6 rounded-[32px] border border-heritage-brown/5 dark:border-zinc-800">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            {/* Search Box */}
            <div className="relative flex-grow max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-heritage-brown/40 dark:text-zinc-500" />
              <input 
                type="text" 
                placeholder="Search blog content, author or keywords..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="w-full bg-white dark:bg-zinc-950 border border-heritage-brown/10 dark:border-zinc-850 rounded-xl pl-11 pr-4 py-3 text-sm text-heritage-brown dark:text-white placeholder-heritage-brown/40 focus:outline-none focus:border-heritage-terracotta transition-all"
              />
            </div>

            {/* Categories filter */}
            <div className="flex items-center space-x-2 overflow-x-auto scrollbar-none select-none">
              <span className="text-[10px] font-black uppercase tracking-wider text-heritage-brown/40 dark:text-zinc-500 whitespace-nowrap">
                Category:
              </span>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => { setSelectedCategory(cat); setCurrentPage(1); }}
                  className={`px-3.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider transition-all border shrink-0 cursor-pointer ${
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

          {/* Tags list (under search and categories) */}
          <div className="flex items-center space-x-2 overflow-x-auto scrollbar-none select-none pt-2 border-t border-heritage-brown/5 dark:border-zinc-800">
            <span className="text-[10px] font-black uppercase tracking-wider text-heritage-brown/40 dark:text-zinc-500 whitespace-nowrap">
              Tags:
            </span>
            {tagsList.map((tag) => (
              <button
                key={tag}
                onClick={() => { setSelectedTag(tag); setCurrentPage(1); }}
                className={`px-2.5 py-1 rounded-lg text-[9px] font-bold transition-all shrink-0 cursor-pointer ${
                  selectedTag === tag 
                    ? 'bg-heritage-brown text-white border-heritage-brown' 
                    : 'bg-white/40 dark:bg-zinc-950/40 hover:bg-heritage-brown/5 text-heritage-brown/50 dark:text-zinc-400 border border-heritage-brown/5 dark:border-zinc-800'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>

        {/* Blogs Grid */}
        {paginatedBlogs.length > 0 ? (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <AnimatePresence mode="popLayout">
                {paginatedBlogs.map((post) => (
                  <motion.article
                    layout
                    key={post.slug}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex flex-col bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl border border-heritage-brown/5 dark:border-zinc-800 hover:-translate-y-1 transition-all duration-350 group cursor-pointer"
                  >
                    <Link to={`/blog/${post.slug}`} className="flex flex-col h-full">
                      <div className="aspect-[16/10] relative overflow-hidden bg-heritage-brown/5">
                        <img 
                          src={post.featuredImage || "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&q=80&w=800"} 
                          alt={post.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                        {post.category && (
                          <div className="absolute top-4 left-4 px-3 py-1 bg-heritage-olive text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-sm">
                            {post.category}
                          </div>
                        )}
                      </div>
                      
                      <div className="p-6 flex flex-col flex-grow justify-between">
                        <div>
                          <div className="flex items-center justify-between text-[10px] font-bold text-heritage-brown/40 dark:text-zinc-500 mb-3">
                            <span className="flex items-center space-x-1">
                              <User className="w-3.5 h-3.5 text-heritage-terracotta" />
                              <span>{post.authorName}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>{formatFirebaseDate(post.publishedAt || post.createdAt)}</span>
                            </span>
                          </div>
                          
                          <h3 className="text-lg md:text-xl font-serif font-bold text-heritage-brown dark:text-white leading-snug group-hover:text-heritage-terracotta dark:group-hover:text-heritage-sand transition-colors mb-3 line-clamp-2">
                            {post.title}
                          </h3>
                          
                          <p className="text-xs text-heritage-brown/60 dark:text-zinc-400 line-clamp-3 leading-relaxed mb-4">
                            {post.content.replace(/[#*`]/g, '').slice(0, 160)}...
                          </p>
                        </div>

                        {/* Tags list */}
                        <div className="flex flex-wrap gap-1.5 mb-4 mt-2">
                          {Array.isArray(post.tags) ? (
                            post.tags.slice(0, 3).map((t, idx) => (
                              <span key={idx} className="px-2 py-0.5 bg-heritage-brown/5 dark:bg-zinc-800 text-[9px] text-heritage-brown/50 dark:text-zinc-400 font-bold rounded">
                                #{t}
                              </span>
                            ))
                          ) : typeof post.tags === 'string' && post.tags ? (
                            <span className="px-2 py-0.5 bg-heritage-brown/5 dark:bg-zinc-800 text-[9px] text-heritage-brown/50 dark:text-zinc-400 font-bold rounded">
                              #{post.tags}
                            </span>
                          ) : null}
                        </div>

                        <div className="pt-4 border-t border-heritage-brown/5 dark:border-zinc-800 flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-heritage-brown dark:text-zinc-400 group-hover:text-heritage-terracotta transition-colors mt-auto">
                          <span className="text-heritage-olive/80 dark:text-heritage-sand/80 font-bold">
                            {getReadingTime(post.content)}
                          </span>
                          <span className="flex items-center space-x-1 font-black">
                            <span>Read Essay</span>
                            <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1.5 transition-transform" />
                          </span>
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
            <BookOpen className="w-12 h-12 text-heritage-brown/20 dark:text-zinc-600 mx-auto mb-4" />
            <h3 className="text-xl font-serif font-bold text-heritage-brown dark:text-white mb-2">No Essays Found</h3>
            <p className="text-sm text-heritage-brown/50 dark:text-zinc-400 max-w-md mx-auto">
              We couldn't find any blog essays matching your current filters. Try resetting the tag or category selection.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
