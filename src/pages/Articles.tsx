import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  BookOpen, 
  Calendar, 
  User, 
  Share2, 
  Twitter, 
  Facebook, 
  Linkedin, 
  Copy, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Tag, 
  ArrowLeft, 
  Check, 
  Eye, 
  TrendingUp, 
  FolderOpen,
  Printer
} from 'lucide-react';
import { Article } from '../types/article';
import { getArticles, getArticleById } from '../lib/articlesService';

export default function Articles() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // State
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeArticle, setActiveArticle] = useState<Article | null>(null);
  
  // Search and Filter States (for list view)
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get('category') || 'All');
  const [currentPage, setCurrentPage] = useState(1);
  const [copied, setCopied] = useState(false);
  
  const articlesPerPage = 4;

  // Sync state with query parameters
  useEffect(() => {
    setSearchTerm(searchParams.get('q') || '');
    setSelectedCategory(searchParams.get('category') || 'All');
  }, [searchParams]);

  // Load articles
  useEffect(() => {
    async function loadArticles() {
      setLoading(true);
      const data = await getArticles(true);
      setArticles(data);
      setLoading(false);
    }
    loadArticles();
  }, []);

  // Handle active article selection based on URL parameter "id"
  useEffect(() => {
    if (id) {
      async function loadActiveArticle() {
        setLoading(true);
        const article = await getArticleById(id);
        if (article) {
          setActiveArticle(article);
        } else {
          setActiveArticle(null);
        }
        setLoading(false);
      }
      loadActiveArticle();
    } else {
      setActiveArticle(null);
    }
  }, [id]);

  // Category list
  const categories = [
    'All',
    'Community News',
    'Culture',
    'Heritage',
    'Leadership',
    'History',
    'Announcements'
  ];

  // Helper to count articles per category
  const getCategoryCount = (category: string) => {
    if (category === 'All') return articles.length;
    return articles.filter(a => a.category === category).length;
  };

  // Filter and search articles
  const filteredArticles = articles.filter(article => {
    const matchesSearch = 
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (article.tags && article.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase())));
      
    const matchesCategory = selectedCategory === 'All' || article.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Sort articles for recent and popular sidebars
  const recentArticles = [...articles]
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, 3);

  const popularArticles = [...articles]
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 3);

  // Pagination calculations
  const totalPages = Math.ceil(filteredArticles.length / articlesPerPage);
  const indexOfLastArticle = currentPage * articlesPerPage;
  const indexOfFirstArticle = indexOfLastArticle - articlesPerPage;
  const currentArticles = filteredArticles.slice(indexOfFirstArticle, indexOfLastArticle);

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setCurrentPage(1);
    
    const params: { [key: string]: string } = {};
    if (val) params.q = val;
    if (selectedCategory !== 'All') params.category = selectedCategory;
    setSearchParams(params);
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1);
    
    const params: { [key: string]: string } = {};
    if (searchTerm) params.q = searchTerm;
    if (category !== 'All') params.category = category;
    setSearchParams(params);
  };

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const text = activeArticle ? `Check out "${activeArticle.title}" on Bakenyi Heritage Platform:` : 'Read Bakenyi articles:';
    
    if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank');
    } else if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
    } else if (platform === 'linkedin') {
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
    } else if (platform === 'copy') {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // PDF Document Generation/Download
  const handleDownloadPDF = () => {
    if (!activeArticle) return;
    
    // Fallback printable frame or styled PDF representation
    // Let's create a beautiful styled print stylesheet and execute window.print()
    // It's exceptionally clean and lets the user save directly as a PDF via their native system print.
    const printContent = document.getElementById('printable-article');
    if (!printContent) return;

    window.print();
  };

  // Navigating to next and previous articles
  const getPrevNextArticles = () => {
    if (!activeArticle) return { prev: null, next: null };
    const currentIndex = articles.findIndex(a => a.id === activeArticle.id);
    if (currentIndex === -1) return { prev: null, next: null };
    
    const prev = currentIndex > 0 ? articles[currentIndex - 1] : null;
    const next = currentIndex < articles.length - 1 ? articles[currentIndex + 1] : null;
    
    return { prev, next };
  };

  const { prev: prevArticle, next: nextArticle } = getPrevNextArticles();

  // Rendering Loading Skeleton
  const renderSkeleton = () => (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-8 space-y-6">
        {[1, 2].map((n) => (
          <div key={n} className="bg-white border border-heritage-brown/10 rounded-2xl p-6 space-y-4 animate-pulse">
            <div className="h-48 bg-heritage-cream rounded-xl w-full" />
            <div className="h-6 bg-heritage-cream rounded w-3/4" />
            <div className="h-4 bg-heritage-cream rounded w-1/4" />
            <div className="space-y-2">
              <div className="h-4 bg-heritage-cream rounded w-full" />
              <div className="h-4 bg-heritage-cream rounded w-5/6" />
            </div>
            <div className="h-10 bg-heritage-cream rounded-full w-28" />
          </div>
        ))}
      </div>
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-white border border-heritage-brown/10 rounded-2xl p-6 h-60 animate-pulse" />
        <div className="bg-white border border-heritage-brown/10 rounded-2xl p-6 h-80 animate-pulse" />
      </div>
    </div>
  );

  return (
    <div className="pt-24 min-h-screen bg-heritage-cream relative">
      <div className="absolute inset-0 cultural-pattern opacity-5 pointer-events-none" />
      
      {/* Detail View Wrapper */}
      {activeArticle ? (
        <article id="printable-article" className="py-12 px-4 max-w-4xl mx-auto relative z-10 print:pt-0 print:pb-0">
          {/* Back button (Hidden in Print) */}
          <button
            onClick={() => navigate('/articles')}
            className="flex items-center space-x-2 text-heritage-brown/60 hover:text-heritage-terracotta transition-colors mb-8 font-bold text-xs uppercase tracking-widest cursor-pointer print:hidden"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to all articles</span>
          </button>

          {/* Category Tag */}
          <span className="inline-block px-3 py-1 rounded-full bg-heritage-terracotta/10 border border-heritage-terracotta/20 text-heritage-terracotta text-xs font-bold uppercase tracking-widest mb-4">
            {activeArticle.category}
          </span>

          {/* Title */}
          <h1 className="text-3xl md:text-5xl font-serif font-black text-heritage-brown tracking-tight leading-tight mb-6">
            {activeArticle.title}
          </h1>

          {/* Metadata Bar */}
          <div className="flex flex-wrap items-center gap-6 py-4 border-y border-heritage-brown/10 text-xs text-heritage-brown/70 mb-8 font-semibold tracking-wide">
            <span className="flex items-center">
              <User className="w-4 h-4 mr-2 text-heritage-terracotta" />
              {activeArticle.author}
            </span>
            <span className="flex items-center">
              <Calendar className="w-4 h-4 mr-2 text-heritage-terracotta" />
              {new Date(activeArticle.publishedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
            {activeArticle.views !== undefined && (
              <span className="flex items-center">
                <Eye className="w-4 h-4 mr-2 text-heritage-terracotta" />
                {activeArticle.views} views
              </span>
            )}
          </div>

          {/* Featured Image */}
          {activeArticle.imageUrl && (
            <div className="w-full h-64 md:h-112 rounded-3xl overflow-hidden mb-10 border border-heritage-brown/10 shadow-md">
              <img 
                src={activeArticle.imageUrl} 
                alt={activeArticle.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Main content with rich typography styling */}
          <div className="prose max-w-none text-heritage-brown/85 leading-relaxed text-base md:text-lg mb-12 space-y-6 tracking-wide">
            {activeArticle.content.split('\n\n').map((paragraph, index) => {
              // Simple Markdown Parsing for Headings
              if (paragraph.startsWith('### ')) {
                return (
                  <h3 key={index} className="text-2xl font-serif font-black text-heritage-brown pt-6 mb-3">
                    {paragraph.replace('### ', '')}
                  </h3>
                );
              }
              if (paragraph.startsWith('## ')) {
                return (
                  <h2 key={index} className="text-3xl font-serif font-black text-heritage-brown pt-8 mb-4 border-b border-heritage-brown/10 pb-2">
                    {paragraph.replace('## ', '')}
                  </h2>
                );
              }
              if (paragraph.startsWith('1. ') || paragraph.startsWith('- ')) {
                const isOrdered = paragraph.startsWith('1. ');
                const items = paragraph.split('\n');
                return (
                  <ul key={index} className={`list-inside ${isOrdered ? 'list-decimal' : 'list-disc'} pl-4 space-y-2 py-2`}>
                    {items.map((item, subIndex) => {
                      const cleanItem = item.replace(/^\d+\.\s+/, '').replace(/^-\s+/, '');
                      // Support inline bold **text**
                      const parts = cleanItem.split('**');
                      return (
                        <li key={subIndex} className="text-heritage-brown/80 font-medium">
                          {parts.map((p, i) => i % 2 === 1 ? <strong key={i} className="text-heritage-brown font-black">{p}</strong> : p)}
                        </li>
                      );
                    })}
                  </ul>
                );
              }

              // Normal Paragraph with optional inline bolding
              const parts = paragraph.split('**');
              return (
                <p key={index} className="indent-0 md:indent-4 first-of-type:indent-0 leading-relaxed font-medium">
                  {parts.map((p, i) => i % 2 === 1 ? <strong key={i} className="text-heritage-brown font-black">{p}</strong> : p)}
                </p>
              );
            })}
          </div>

          {/* Additional Images Grid (If available) */}
          {activeArticle.additionalImages && activeArticle.additionalImages.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12 print:hidden">
              {activeArticle.additionalImages.map((imgUrl, i) => (
                <div key={i} className="rounded-2xl overflow-hidden h-48 md:h-64 border border-heritage-brown/10 shadow-sm">
                  <img 
                    src={imgUrl} 
                    alt={`${activeArticle.title} secondary image`} 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Tags */}
          {activeArticle.tags && activeArticle.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center mb-8 pb-8 border-b border-heritage-brown/10 print:hidden">
              <Tag className="w-4 h-4 text-heritage-terracotta mr-1" />
              {activeArticle.tags.map((tag, idx) => (
                <span 
                  key={idx}
                  className="text-xs bg-heritage-brown/5 hover:bg-heritage-brown/10 text-heritage-brown font-semibold px-3 py-1 rounded-full border border-heritage-brown/5 transition-colors cursor-pointer"
                  onClick={() => {
                    navigate('/articles');
                    handleSearchChange(tag);
                  }}
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Action Row: PDF & Share (Hidden in Print) */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-6 py-6 border-b border-heritage-brown/10 mb-12 print:hidden">
            {/* Download/Print Button */}
            <button
              onClick={handleDownloadPDF}
              className="flex items-center justify-center space-x-3 px-6 py-3 bg-heritage-terracotta text-white rounded-full font-bold uppercase text-xs tracking-widest hover:bg-heritage-brown active:scale-95 transition-all shadow-md cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print or Save to PDF</span>
            </button>

            {/* Share Group */}
            <div className="flex items-center gap-3 justify-center">
              <span className="text-xs font-black uppercase tracking-widest text-heritage-brown/50 mr-2">Share:</span>
              <button
                onClick={() => handleShare('twitter')}
                className="p-3 bg-white border border-heritage-brown/10 hover:border-heritage-terracotta hover:text-heritage-terracotta rounded-full text-heritage-brown/80 transition-all shadow-sm active:scale-90"
                title="Share on Twitter"
              >
                <Twitter className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleShare('facebook')}
                className="p-3 bg-white border border-heritage-brown/10 hover:border-heritage-terracotta hover:text-heritage-terracotta rounded-full text-heritage-brown/80 transition-all shadow-sm active:scale-90"
                title="Share on Facebook"
              >
                <Facebook className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleShare('linkedin')}
                className="p-3 bg-white border border-heritage-brown/10 hover:border-heritage-terracotta hover:text-heritage-terracotta rounded-full text-heritage-brown/80 transition-all shadow-sm active:scale-90"
                title="Share on LinkedIn"
              >
                <Linkedin className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleShare('copy')}
                className={`p-3 border rounded-full transition-all shadow-sm active:scale-90 flex items-center justify-center relative ${
                  copied 
                    ? 'bg-heritage-olive border-heritage-olive text-white' 
                    : 'bg-white border-heritage-brown/10 hover:border-heritage-terracotta hover:text-heritage-terracotta text-heritage-brown/80'
                }`}
                title="Copy Link to Clipboard"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied && (
                  <span className="absolute -top-10 bg-heritage-brown text-white text-[10px] font-bold px-2 py-1 rounded shadow-md whitespace-nowrap">
                    Link Copied!
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Reader Pagination (Prev/Next Articles) (Hidden in Print) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 print:hidden">
            {prevArticle ? (
              <Link 
                to={`/articles/${prevArticle.id}`}
                className="group flex flex-col p-6 bg-white hover:bg-heritage-terracotta/5 border border-heritage-brown/10 hover:border-heritage-terracotta/20 rounded-2xl transition-all duration-300 text-left"
              >
                <span className="text-[10px] font-black uppercase tracking-widest text-heritage-brown/40 mb-2 flex items-center group-hover:text-heritage-terracotta/60 transition-colors">
                  <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                  Previous Article
                </span>
                <span className="font-serif font-bold text-base text-heritage-brown group-hover:text-heritage-terracotta transition-colors line-clamp-2">
                  {prevArticle.title}
                </span>
              </Link>
            ) : (
              <div className="hidden sm:block p-6 bg-heritage-brown/5 rounded-2xl border border-dashed border-heritage-brown/10" />
            )}

            {nextArticle ? (
              <Link 
                to={`/articles/${nextArticle.id}`}
                className="group flex flex-col p-6 bg-white hover:bg-heritage-terracotta/5 border border-heritage-brown/10 hover:border-heritage-terracotta/20 rounded-2xl transition-all duration-300 text-right"
              >
                <span className="text-[10px] font-black uppercase tracking-widest text-heritage-brown/40 mb-2 flex items-center justify-end group-hover:text-heritage-terracotta/60 transition-colors">
                  Next Article
                  <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </span>
                <span className="font-serif font-bold text-base text-heritage-brown group-hover:text-heritage-terracotta transition-colors line-clamp-2">
                  {nextArticle.title}
                </span>
              </Link>
            ) : (
              <div className="hidden sm:block p-6 bg-heritage-brown/5 rounded-2xl border border-dashed border-heritage-brown/10" />
            )}
          </div>
        </article>
      ) : (
        /* List View Wrapper */
        <div className="py-12 px-4 max-w-7xl mx-auto relative z-10">
          
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-black uppercase tracking-[0.2em] text-heritage-terracotta mb-3 block">
              Knowledge Repository
            </span>
            <h1 className="text-4xl md:text-6xl font-serif font-black text-heritage-brown tracking-tight leading-none mb-6">
              Published Writings & Articles
            </h1>
            <p className="text-heritage-brown/70 leading-relaxed text-sm md:text-base font-semibold">
              Delve into authentic stories, linguistic analyses, historical migrations, and cultural announcements curated by Bakenyi historians, language preservationists, and community leaders.
            </p>
          </div>

          {/* Search and Category Filter Bar */}
          <div className="bg-white border border-heritage-brown/10 rounded-3xl p-4 md:p-6 mb-12 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Search input */}
            <div className="relative flex-grow max-w-2xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-heritage-brown/40" />
              <input 
                type="text"
                placeholder="Search articles by title, keywords or author..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full bg-heritage-cream border border-heritage-brown/10 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-heritage-brown placeholder-heritage-brown/40 focus:bg-white focus:border-heritage-terracotta focus:outline-none transition-all font-medium"
              />
            </div>

            {/* Quick Categories list for desktop horizontal view */}
            <div className="flex flex-wrap gap-2">
              <span className="text-xs font-black uppercase tracking-widest text-heritage-brown/40 self-center mr-2 hidden xl:inline-block">
                Quick Filter:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {['All', 'History', 'Culture', 'Heritage', 'Announcements'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => handleCategorySelect(cat)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      selectedCategory === cat 
                        ? 'bg-heritage-terracotta text-white shadow-sm' 
                        : 'bg-heritage-cream hover:bg-heritage-brown/5 text-heritage-brown/70 hover:text-heritage-brown'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Page Content Layout */}
          {loading ? (
            renderSkeleton()
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              
              {/* Left Column: Articles Cards list */}
              <div className="lg:col-span-8 space-y-8">
                {currentArticles.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 gap-8">
                      {currentArticles.map((article, index) => (
                        <motion.div
                          key={article.id}
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: index * 0.05 }}
                          className="bg-white border border-heritage-brown/10 rounded-[28px] overflow-hidden hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col md:flex-row group"
                        >
                          {/* Image Box */}
                          {article.imageUrl && (
                            <div className="w-full md:w-[40%] h-48 md:h-auto overflow-hidden relative shrink-0">
                              <img 
                                src={article.imageUrl} 
                                alt={article.title}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                              <span className="absolute top-4 left-4 bg-heritage-brown/80 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                                {article.category}
                              </span>
                            </div>
                          )}

                          {/* Text/Content Box */}
                          <div className="p-6 md:p-8 flex flex-col justify-between flex-grow">
                            <div>
                              {/* Metadata line */}
                              <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-heritage-brown/50 mb-3">
                                <span className="flex items-center">
                                  <User className="w-3.5 h-3.5 mr-1 text-heritage-terracotta" />
                                  {article.author}
                                </span>
                                <span className="flex items-center">
                                  <Calendar className="w-3.5 h-3.5 mr-1 text-heritage-terracotta" />
                                  {new Date(article.publishedAt).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </span>
                              </div>

                              {/* Title */}
                              <h3 className="text-xl md:text-2xl font-serif font-black text-heritage-brown mb-3 group-hover:text-heritage-terracotta transition-colors leading-snug">
                                <Link to={`/articles/${article.id}`}>
                                  {article.title}
                                </Link>
                              </h3>

                              {/* Excerpt */}
                              <p className="text-heritage-brown/70 text-sm leading-relaxed mb-6 font-medium line-clamp-3">
                                {article.excerpt}
                              </p>
                            </div>

                            {/* Read More */}
                            <div className="flex items-center justify-between pt-4 border-t border-heritage-brown/5">
                              <Link 
                                to={`/articles/${article.id}`}
                                className="inline-flex items-center text-xs font-black uppercase tracking-wider text-heritage-terracotta group-hover:text-heritage-brown transition-colors"
                              >
                                <span>Read More</span>
                                <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                              </Link>
                              {article.views !== undefined && (
                                <span className="text-[10px] font-black text-heritage-brown/40 flex items-center uppercase tracking-widest">
                                  <Eye className="w-3.5 h-3.5 mr-1" />
                                  {article.views} views
                                </span>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {/* Pagination Bar */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-center space-x-2 pt-10 border-t border-heritage-brown/5">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className="p-2.5 rounded-full border border-heritage-brown/10 hover:border-heritage-terracotta hover:text-heritage-terracotta transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer text-heritage-brown"
                          title="Previous Page"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        
                        {Array.from({ length: totalPages }).map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setCurrentPage(i + 1)}
                            className={`w-9 h-9 rounded-full text-xs font-bold transition-all cursor-pointer ${
                              currentPage === i + 1 
                                ? 'bg-heritage-terracotta text-white shadow-sm font-black' 
                                : 'border border-heritage-brown/5 hover:border-heritage-terracotta text-heritage-brown/80'
                            }`}
                          >
                            {i + 1}
                          </button>
                        ))}

                        <button
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className="p-2.5 rounded-full border border-heritage-brown/10 hover:border-heritage-terracotta hover:text-heritage-terracotta transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer text-heritage-brown"
                          title="Next Page"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-20 bg-white border border-heritage-brown/10 rounded-3xl p-10">
                    <BookOpen className="w-16 h-16 text-heritage-brown/20 mx-auto mb-4" />
                    <p className="text-heritage-brown font-black text-xl mb-1">No Articles Found</p>
                    <p className="text-heritage-brown/50 text-sm max-w-md mx-auto leading-relaxed">
                      We couldn't find any articles matching your search query. Try broadening your keywords or selecting another category.
                    </p>
                    <button 
                      onClick={() => { setSearchTerm(''); setSelectedCategory('All'); setSearchParams({}); }}
                      className="mt-6 inline-block bg-heritage-terracotta hover:bg-heritage-brown text-white text-xs font-bold uppercase tracking-widest px-6 py-3 rounded-full transition-all cursor-pointer shadow-sm active:scale-95"
                    >
                      Clear Search & Filters
                    </button>
                  </div>
                )}
              </div>

              {/* Right Column: Sidebar */}
              <aside className="lg:col-span-4 space-y-8">
                
                {/* Search Bar (Hidden on Desktop because of header bar, shown as helper if needed) */}
                <div className="bg-white border border-heritage-brown/10 rounded-[28px] p-6 shadow-sm">
                  <h4 className="text-sm font-black uppercase tracking-widest text-heritage-brown mb-4 flex items-center pb-2 border-b border-heritage-brown/5">
                    <FolderOpen className="w-4 h-4 text-heritage-terracotta mr-2" />
                    <span>Explore Categories</span>
                  </h4>
                  <div className="space-y-1.5">
                    {categories.map((cat) => {
                      const count = getCategoryCount(cat);
                      if (cat !== 'All' && count === 0) return null; // Hide empty categories in sidebar
                      return (
                        <button
                          key={cat}
                          onClick={() => handleCategorySelect(cat)}
                          className={`w-full flex items-center justify-between p-3 rounded-xl text-left text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                            selectedCategory === cat 
                              ? 'bg-heritage-terracotta text-white shadow-sm' 
                              : 'hover:bg-heritage-brown/5 text-heritage-brown/85 hover:text-heritage-terracotta'
                          }`}
                        >
                          <span>{cat}</span>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                            selectedCategory === cat ? 'bg-white/20 text-white' : 'bg-heritage-cream text-heritage-brown/50'
                          }`}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Popular Articles */}
                {popularArticles.length > 0 && (
                  <div className="bg-white border border-heritage-brown/10 rounded-[28px] p-6 shadow-sm">
                    <h4 className="text-sm font-black uppercase tracking-widest text-heritage-brown mb-4 flex items-center pb-2 border-b border-heritage-brown/5">
                      <TrendingUp className="w-4 h-4 text-heritage-terracotta mr-2 animate-pulse" />
                      <span>Popular Reading</span>
                    </h4>
                    <div className="space-y-4">
                      {popularArticles.map((article) => (
                        <div key={article.id} className="flex gap-3 group items-start">
                          {article.imageUrl && (
                            <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-heritage-brown/10">
                              <img 
                                src={article.imageUrl} 
                                alt={article.title} 
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                          )}
                          <div className="min-w-0">
                            <span className="text-[9px] font-black uppercase text-heritage-terracotta tracking-wider block mb-0.5">
                              {article.category}
                            </span>
                            <h5 className="font-serif font-bold text-xs text-heritage-brown group-hover:text-heritage-terracotta transition-colors line-clamp-2 leading-snug">
                              <Link to={`/articles/${article.id}`}>
                                {article.title}
                              </Link>
                            </h5>
                            <span className="text-[9px] font-black text-heritage-brown/40 uppercase tracking-widest block mt-1">
                              {article.views || 0} views
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Articles */}
                {recentArticles.length > 0 && (
                  <div className="bg-white border border-heritage-brown/10 rounded-[28px] p-6 shadow-sm">
                    <h4 className="text-sm font-black uppercase tracking-widest text-heritage-brown mb-4 flex items-center pb-2 border-b border-heritage-brown/5">
                      <BookOpen className="w-4 h-4 text-heritage-terracotta mr-2" />
                      <span>Recent Publications</span>
                    </h4>
                    <div className="space-y-4">
                      {recentArticles.map((article) => (
                        <div key={article.id} className="group flex flex-col">
                          <span className="text-[9px] font-black uppercase text-heritage-brown/40 tracking-widest block mb-0.5">
                            {new Date(article.publishedAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                          <h5 className="font-serif font-bold text-sm text-heritage-brown group-hover:text-heritage-terracotta transition-colors leading-snug">
                            <Link to={`/articles/${article.id}`}>
                              {article.title}
                            </Link>
                          </h5>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </aside>

            </div>
          )}
        </div>
      )}
    </div>
  );
}
