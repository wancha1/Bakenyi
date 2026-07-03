import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { Calendar, Tag, ArrowLeft, ArrowRight, User, Share2, Facebook, Twitter, Link2, BookOpen, Loader2 } from 'lucide-react';
import { getBlogPosts, NewsBlogItem, formatFirebaseDate } from '../lib/firebaseContentService';

export default function BlogDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [post, setPost] = useState<NewsBlogItem | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<NewsBlogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBlogDetail() {
      setLoading(true);
      try {
        const allBlogs = await getBlogPosts(false); // Only fetch published
        const currentPost = allBlogs.find(p => p.slug === slug);
        if (currentPost) {
          setPost(currentPost);
          
          const related = allBlogs
            .filter(p => p.slug !== currentPost.slug)
            .sort((a, b) => {
              const catA = a.category === currentPost.category ? 1 : 0;
              const catB = b.category === currentPost.category ? 1 : 0;
              return catB - catA;
            })
            .slice(0, 3);
          setRelatedPosts(related);
        } else {
          setPost(null);
        }
      } catch (err) {
        console.error("Error loading blog details:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchBlogDetail();
  }, [slug]);

  const shareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank', 'noopener,noreferrer');
  };

  const shareTwitter = () => {
    if (!post) return;
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(post.title || '')}`, '_blank', 'noopener,noreferrer');
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Link copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="pt-32 min-h-screen bg-heritage-cream dark:bg-zinc-950 flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-heritage-terracotta animate-spin mb-4" />
        <span className="text-xs font-black uppercase tracking-widest text-heritage-brown/40">Loading Essay Details...</span>
      </div>
    );
  }

  // If post not found, fallback
  if (!post) {
    return (
      <div className="pt-32 pb-24 text-center min-h-screen bg-heritage-cream dark:bg-zinc-950">
        <div className="max-w-md mx-auto px-4">
          <h2 className="text-3xl font-serif font-bold text-heritage-brown dark:text-white mb-4">Blog Post Not Found</h2>
          <p className="text-heritage-brown/60 dark:text-zinc-400 mb-8">
            The blog essay you are looking for does not exist or has been archived.
          </p>
          <Link 
            to="/blog"
            className="inline-flex items-center space-x-2 py-3 px-6 bg-heritage-brown text-white rounded-xl font-bold text-xs uppercase tracking-widest"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Blog</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 min-h-screen bg-heritage-cream dark:bg-zinc-950 transition-colors duration-300 pb-20">
      
      {/* Editorial Header */}
      <section className="bg-heritage-olive dark:bg-zinc-900 pt-12 pb-24 px-4 text-white text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto relative z-10">
          <button 
            onClick={() => navigate('/blog')}
            className="inline-flex items-center space-x-2 text-heritage-sand hover:text-white transition-colors text-xs font-bold uppercase tracking-widest mb-8 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Blog list</span>
          </button>

          <div className="flex flex-wrap justify-center items-center gap-4 mb-4 text-xs font-semibold text-heritage-sand">
            <span className="flex items-center space-x-1.5 bg-white/10 px-3 py-1 rounded-full border border-white/5">
              <User className="w-3.5 h-3.5 text-heritage-sand" />
              <span>By {post.authorName}</span>
            </span>
            <span className="flex items-center space-x-1.5 bg-white/10 px-3 py-1 rounded-full border border-white/5">
              <Calendar className="w-3.5 h-3.5" />
              <span>Published {formatFirebaseDate(post.publishedAt || post.createdAt)}</span>
            </span>
            {post.category && (
              <span className="flex items-center space-x-1.5 bg-heritage-terracotta text-white px-3 py-1 rounded-full shadow-sm">
                <Tag className="w-3.5 h-3.5" />
                <span>{post.category}</span>
              </span>
            )}
          </div>

          <h1 className="text-3xl md:text-5xl font-serif font-bold text-white leading-tight mb-8 max-w-3xl mx-auto">
            {post.title}
          </h1>
        </div>
      </section>

      {/* Main Content Layout */}
      <div className="max-w-4xl mx-auto px-4 md:px-6 -mt-12 relative z-20">
        
        {/* Featured Image */}
        <div className="aspect-[16/9] w-full rounded-3xl overflow-hidden border border-heritage-brown/5 dark:border-zinc-850 shadow-2xl mb-12 bg-zinc-900">
          <img 
            src={post.featuredImage || "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&q=80&w=800"} 
            alt={post.title} 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Sidebar */}
          <div className="lg:col-span-3 lg:sticky lg:top-32 h-fit flex lg:flex-col gap-4 border-b lg:border-b-0 lg:border-r border-heritage-brown/5 dark:border-zinc-800 pb-6 lg:pb-0 lg:pr-8">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-heritage-brown/40 dark:text-zinc-500 w-full lg:mb-2">
              Share Essay
            </h3>
            <button 
              onClick={shareFacebook}
              className="flex items-center justify-center space-x-2 py-2.5 px-4 bg-white dark:bg-zinc-900 border border-heritage-brown/10 dark:border-zinc-800 text-heritage-brown dark:text-zinc-300 rounded-xl hover:bg-heritage-brown hover:text-white dark:hover:bg-zinc-800 transition-all font-bold text-[10px] uppercase tracking-wider flex-1 lg:flex-none cursor-pointer"
            >
              <Facebook className="w-4 h-4 text-blue-600" />
              <span>Facebook</span>
            </button>
            <button 
              onClick={shareTwitter}
              className="flex items-center justify-center space-x-2 py-2.5 px-4 bg-white dark:bg-zinc-900 border border-heritage-brown/10 dark:border-zinc-800 text-heritage-brown dark:text-zinc-300 rounded-xl hover:bg-heritage-brown hover:text-white dark:hover:bg-zinc-800 transition-all font-bold text-[10px] uppercase tracking-wider flex-1 lg:flex-none cursor-pointer"
            >
              <Twitter className="w-4 h-4 text-sky-500" />
              <span>Twitter</span>
            </button>
            <button 
              onClick={copyLink}
              className="flex items-center justify-center space-x-2 py-2.5 px-4 bg-white dark:bg-zinc-900 border border-heritage-brown/10 dark:border-zinc-800 text-heritage-brown dark:text-zinc-300 rounded-xl hover:bg-heritage-brown hover:text-white dark:hover:bg-zinc-800 transition-all font-bold text-[10px] uppercase tracking-wider flex-1 lg:flex-none cursor-pointer"
            >
              <Link2 className="w-4 h-4 text-emerald-600" />
              <span>Copy Link</span>
            </button>
          </div>

          {/* Blog Rich Text Body */}
          <div className="lg:col-span-9 bg-white dark:bg-zinc-900 p-8 md:p-12 rounded-3xl border border-heritage-brown/5 dark:border-zinc-850 shadow-sm">
            <div className="font-serif text-heritage-brown dark:text-zinc-200 leading-relaxed text-base md:text-lg">
              <ReactMarkdown
                components={{
                  h1: ({ node, ...props }) => <h1 className="text-3xl font-serif font-bold text-heritage-brown dark:text-white mt-8 mb-4 border-b border-heritage-brown/10 pb-2" {...props} />,
                  h2: ({ node, ...props }) => <h2 className="text-2xl font-serif font-bold text-heritage-brown dark:text-white mt-8 mb-4" {...props} />,
                  h3: ({ node, ...props }) => <h3 className="text-xl font-serif font-bold text-heritage-brown dark:text-white mt-6 mb-3" {...props} />,
                  p: ({ node, ...props }) => <p className="mb-6 text-heritage-brown/80 dark:text-zinc-300 leading-relaxed" {...props} />,
                  ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-6 space-y-2 pl-4" {...props} />,
                  ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-6 space-y-2 pl-4" {...props} />,
                  li: ({ node, ...props }) => <li className="text-heritage-brown/80 dark:text-zinc-300" {...props} />,
                  blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-heritage-terracotta bg-heritage-cream/40 dark:bg-zinc-950/40 p-4 rounded-r-xl italic my-6 text-heritage-brown dark:text-zinc-300" {...props} />,
                  strong: ({ node, ...props }) => <strong className="font-bold text-heritage-brown dark:text-white" {...props} />,
                }}
              >
                {post.content}
              </ReactMarkdown>
            </div>

            {/* Tags footer */}
            {post.tags && (
              <div className="mt-12 pt-6 border-t border-heritage-brown/5 dark:border-zinc-800 flex flex-wrap gap-2">
                {Array.isArray(post.tags) ? (
                  post.tags.map((t, idx) => (
                    <span key={idx} className="px-3 py-1 bg-heritage-brown/5 dark:bg-zinc-850 text-xs font-semibold text-heritage-brown/60 dark:text-zinc-400 rounded-lg">
                      #{t}
                    </span>
                  ))
                ) : (
                  <span className="px-3 py-1 bg-heritage-brown/5 dark:bg-zinc-850 text-xs font-semibold text-heritage-brown/60 dark:text-zinc-400 rounded-lg">
                    #{post.tags}
                  </span>
                )}
              </div>
            )}

            {/* Author Bio Box */}
            <div className="mt-12 p-6 bg-heritage-cream/30 dark:bg-zinc-950/30 rounded-2xl border border-heritage-brown/5 dark:border-zinc-800 flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-heritage-olive text-white flex items-center justify-center font-serif text-lg font-bold shrink-0 shadow-md">
                {(post.authorName || 'U')[0].toUpperCase()}
              </div>
              <div>
                <h4 className="font-serif font-bold text-heritage-brown dark:text-white text-base">
                  {post.authorName}
                </h4>
                <p className="text-xs text-heritage-brown/50 dark:text-zinc-400 mt-1 font-semibold uppercase tracking-wider">
                  Bakenyi Heritage Platform Contributor
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Related Essays Section */}
        {relatedPosts.length > 0 && (
          <section className="mt-20 pt-12 border-t border-heritage-brown/10 dark:border-zinc-800">
            <h3 className="text-2xl font-serif font-bold text-heritage-brown dark:text-white mb-8">
              Related Essays
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {relatedPosts.map((rPost) => (
                <Link 
                  key={rPost.slug}
                  to={`/blog/${rPost.slug}`}
                  className="group flex flex-col bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg border border-heritage-brown/5 dark:border-zinc-800/60 hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="aspect-[16/10] overflow-hidden bg-heritage-cream">
                    <img 
                      src={rPost.featuredImage || "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&q=80&w=800"} 
                      alt={rPost.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="p-5 flex-grow flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-heritage-terracotta mb-1 block">
                        {rPost.category}
                      </span>
                      <h4 className="text-base font-serif font-bold text-heritage-brown dark:text-white leading-tight group-hover:text-heritage-terracotta dark:group-hover:text-heritage-sand transition-colors line-clamp-2">
                        {rPost.title}
                      </h4>
                    </div>
                    <div className="flex items-center space-x-1 text-[9px] font-black uppercase tracking-widest text-heritage-brown/40 dark:text-zinc-500 mt-4 pt-3 border-t border-heritage-brown/5">
                      <span>Read Essay</span>
                      <ArrowRight className="w-3.5 h-3.5 text-heritage-terracotta transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  );
}
