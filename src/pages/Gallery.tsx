import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Maximize2, Tag, Facebook, Twitter, Download, Loader2 } from 'lucide-react';
import { db, collection, query, orderBy, onSnapshot } from '../lib/firebase';
import { loadGallery } from '../lib/contentParser';

const galleryImages = [
  {
    id: "h1",
    src: "https://images.unsplash.com/photo-1523805009345-7448845a9e53?auto=format&fit=crop&q=80&w=800",
    title: "Canoe on Lake Kyoga",
    category: "Landscape",
    desc: "A traditional wooden canoe at sunset, reflecting the Bakenyi's deep connection to the floating islands of Lake Kyoga."
  },
  {
    id: "h2",
    src: "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&q=80&w=800",
    title: "Basket Weaving Art",
    category: "Craft",
    desc: "Intricate patterns passed down through generations, utilizing local reeds and papyrus from the marshlands."
  },
  {
    id: "h3",
    src: "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&q=80&w=800",
    title: "Ancestral Site",
    category: "History",
    desc: "A sacred gathering place where Lukenye is still spoken in its purest form during seasonal ceremonies."
  },
  {
    id: "h4",
    src: "https://images.unsplash.com/photo-1493246507139-91e8bef99c02?auto=format&fit=crop&q=80&w=800",
    title: "Community Festival",
    category: "Tradition",
    desc: "Celebration of the harvest, bringing together clans from across the region to share stories and feast."
  }
];

const categories = ["All", "Landscape", "Tradition", "Craft", "History"];

interface DBImage {
  id: string;
  imageUrl: string;
  title: string;
  category: string;
  description: string;
}

export default function Gallery() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [dbImages, setDbImages] = useState<DBImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<{src: string, title: string, category: string, desc: string} | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'gallery'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DBImage[];
      setDbImages(docs);
      setLoading(false);
    }, (err) => {
      console.warn("Firestore gallery real-time listener error, using fallback state:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Load markdown gallery images
  const mdImages = useMemo(() => {
    try {
      const galleries = loadGallery();
      return galleries.flatMap((gallery) => {
        const images = gallery.frontmatter.images || [];
        return images.map((imgObj: any, idx: number) => ({
          id: `cms-${gallery.slug}-${idx}`,
          src: imgObj.image,
          title: imgObj.caption || gallery.frontmatter.title || 'Bakenyi Chronicles',
          category: 'Tradition', // CMS galleries are grouped as Tradition
          desc: gallery.content || gallery.frontmatter.title || ''
        }));
      });
    } catch (e) {
      console.warn('Failed to load markdown gallery items:', e);
      return [];
    }
  }, []);

  // Merge hardcoded, DB and CMS images
  const allImages = useMemo(() => {
    return [
      ...mdImages,
      ...dbImages.map(img => ({
        id: img.id,
        src: img.imageUrl,
        title: img.title,
        category: img.category,
        desc: img.description
      })),
      ...galleryImages
    ];
  }, [mdImages, dbImages]);

  const filteredImages = selectedCategory === "All" 
    ? allImages 
    : allImages.filter(img => img.category === selectedCategory);

  const shareOnFacebook = (imageTitle: string) => {
    const url = window.location.href;
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&t=${encodeURIComponent(imageTitle)}`, '_blank', 'noreferrer');
  };

  const shareOnTwitter = (imageTitle: string) => {
    const url = window.location.href;
    const text = `Check out "${imageTitle}" from the Bakenyi Cultural Heritage Platform:`;
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank', 'noreferrer');
  };

  return (
    <div className="pt-24 min-h-screen bg-heritage-cream dark:bg-zinc-950 transition-colors duration-300 pb-20">
      {/* Header */}
      <section className="bg-heritage-olive dark:bg-zinc-900 py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <motion.h1 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-4xl md:text-5xl font-serif font-bold text-white mb-6"
          >
            Visual Chronicles
          </motion.h1>
          <p className="text-heritage-sand max-w-2xl mx-auto text-lg mb-8 uppercase tracking-widest font-bold">
            A curated window into the Bakenyi world.
          </p>

          {/* Filter Bar */}
          <div className="flex flex-wrap justify-center gap-2 mt-8">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all cursor-pointer ${
                  selectedCategory === cat 
                    ? 'bg-heritage-terracotta text-white shadow-lg' 
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="py-16 px-4 max-w-7xl mx-auto min-h-[400px]">
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-heritage-terracotta animate-spin mb-4" />
            <p className="text-heritage-brown/40 dark:text-zinc-500 font-bold uppercase tracking-widest text-xs">Opening Archive...</p>
          </div>
        )}
        
        <motion.div 
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          <AnimatePresence mode="popLayout">
            {filteredImages.map((img) => (
              <motion.div
                layout
                key={img.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col group cursor-pointer"
                onClick={() => setSelectedImage(img)}
              >
                <div className="aspect-square relative overflow-hidden rounded-xl bg-heritage-brown/5 dark:bg-zinc-900 shadow-sm transition-all duration-500 group-hover:shadow-xl group-hover:-translate-y-1">
                  <img 
                    src={img.src} 
                    alt={img.title} 
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-heritage-brown/20 group-hover:bg-heritage-brown/40 transition-colors flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 transform scale-90 group-hover:scale-100 transition-transform duration-300">
                      <Maximize2 className="w-6 h-6" />
                    </div>
                  </div>
                </div>
                <div className="mt-4 px-1">
                  <div className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-[0.2em] text-heritage-terracotta mb-1">
                    <Tag className="w-3 h-3" />
                    <span>{img.category}</span>
                  </div>
                  <h3 className="text-heritage-brown dark:text-zinc-200 font-serif font-bold text-lg leading-tight group-hover:text-heritage-terracotta dark:group-hover:text-heritage-sand transition-colors">
                    {img.title}
                  </h3>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </section>

      {/* Modal / Lightbox */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-heritage-brown/95 dark:bg-zinc-950/95 backdrop-blur-xl"
            onClick={() => setSelectedImage(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="relative max-w-5xl w-full bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl border border-heritage-brown/5 dark:border-zinc-800"
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={() => setSelectedImage(null)}
                className="absolute top-6 right-6 z-50 p-2 bg-black/10 dark:bg-zinc-800 text-heritage-brown dark:text-zinc-200 hover:bg-black/20 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
              
              <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[500px]">
                <div className="lg:col-span-8 bg-heritage-cream/50 dark:bg-zinc-950/50 flex items-center justify-center p-4">
                  <img 
                    src={selectedImage.src} 
                    alt={selectedImage.title} 
                    className="max-h-[80vh] w-full object-contain rounded-xl shadow-lg"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="lg:col-span-4 p-10 flex flex-col justify-center bg-white dark:bg-zinc-900">
                  <div className="flex items-center space-x-2 text-heritage-terracotta mb-4">
                    <Tag className="w-4 h-4" />
                    <span className="text-xs font-black uppercase tracking-[0.3em]">{selectedImage.category}</span>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-serif font-bold text-heritage-brown dark:text-white mb-6 leading-tight">
                    {selectedImage.title}
                  </h2>
                  <p className="text-heritage-brown/60 dark:text-zinc-400 text-lg leading-relaxed mb-10">
                    {selectedImage.desc}
                  </p>
                  
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => shareOnFacebook(selectedImage.title)}
                        className="flex-grow flex items-center justify-center space-x-2 py-3 px-4 border border-heritage-brown/10 dark:border-zinc-800 text-heritage-brown dark:text-zinc-300 rounded-xl hover:bg-heritage-brown hover:text-white dark:hover:bg-zinc-800 transition-all group font-bold text-xs uppercase tracking-widest cursor-pointer"
                      >
                        <Facebook className="w-4 h-4" />
                        <span>Facebook</span>
                      </button>
                      <button 
                        onClick={() => shareOnTwitter(selectedImage.title)}
                        className="flex-grow flex items-center justify-center space-x-2 py-3 px-4 border border-heritage-brown/10 dark:border-zinc-800 text-heritage-brown dark:text-zinc-300 rounded-xl hover:bg-heritage-brown hover:text-white dark:hover:bg-zinc-800 transition-all group font-bold text-xs uppercase tracking-widest cursor-pointer"
                      >
                        <Twitter className="w-4 h-4" />
                        <span>Twitter</span>
                      </button>
                    </div>
                    <button className="w-full flex items-center justify-center space-x-2 py-4 bg-heritage-brown dark:bg-heritage-olive text-white rounded-xl hover:bg-heritage-terracotta transition-all font-bold text-xs uppercase tracking-widest shadow-lg shadow-heritage-brown/20 cursor-pointer">
                      <Download className="w-4 h-4" />
                      <span>Download Archive Quality</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
