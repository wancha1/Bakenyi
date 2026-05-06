import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Search, Maximize2, Tag } from 'lucide-react';

const galleryImages = [
  { id: 1, src: "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&q=80&w=800", title: "Sunrise at Lake Kyoga", category: "Landscape", desc: "A typical serene morning on the waters that define our life." },
  { id: 2, src: "https://images.unsplash.com/photo-1523805009345-7448845a9e53?auto=format&fit=crop&q=80&w=800", title: "Traditional Celebration", category: "Tradition", desc: "Community gathering during the harvest season." },
  { id: 3, src: "https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?auto=format&fit=crop&q=80&w=800", title: "Canoe Craftsmanship", category: "Craft", desc: "Dugout canoes are still crafted using ancestral techniques." },
  { id: 4, src: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=800", title: "Heritage Archive", category: "History", desc: "A collection of 19th-century artifacts found in the region." },
  { id: 5, src: "https://images.unsplash.com/photo-1493246507139-91e8bef99c02?auto=format&fit=crop&q=80&w=800", title: "The Floating Islands", category: "Landscape", desc: "Papyrus islands (Ebiswa) serve as ancient mobile bases." },
  { id: 6, src: "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&q=80&w=800", title: "Traditional Attire", category: "Tradition", desc: "Showcasing the vibrant colors of Bakenyi celebratory wear." },
  { id: 7, src: "https://images.unsplash.com/photo-1520110120835-c96534a4c984?auto=format&fit=crop&q=80&w=800", title: "River Nile Delta", category: "Landscape", desc: "Where the Nile meets Lake Kyoga, a fertile Bakenyi heartland." },
  { id: 8, src: "https://images.unsplash.com/photo-1509099836639-18ba1795216d?auto=format&fit=crop&q=80&w=800", title: "Pottery Exhibition", category: "Craft", desc: "Ancient pottery designs unique to the riverine lifestyle." }
];

const categories = ["All", "Landscape", "Tradition", "Craft", "History"];

export default function Gallery() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedImage, setSelectedImage] = useState<typeof galleryImages[0] | null>(null);

  const filteredImages = selectedCategory === "All" 
    ? galleryImages 
    : galleryImages.filter(img => img.category === selectedCategory);

  return (
    <div className="pt-24 min-h-screen bg-heritage-cream">
      {/* Header */}
      <section className="bg-heritage-olive py-16 px-4">
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
                className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${
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
      <section className="py-16 px-4 max-w-7xl mx-auto">
        <motion.div 
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {filteredImages.map((img) => (
              <motion.div
                layout
                key={img.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className="heritage-card cursor-pointer group relative"
                onClick={() => setSelectedImage(img)}
              >
                <div className="aspect-square relative overflow-hidden">
                  <img 
                    src={img.src} 
                    alt={img.title} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-heritage-brown/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-6 text-center">
                    <Maximize2 className="text-white w-8 h-8 mb-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0" />
                    <h3 className="text-white font-serif font-bold text-lg">{img.title}</h3>
                    <div className="flex items-center text-heritage-sand text-[10px] uppercase font-bold tracking-[0.2em] mt-2">
                       <Tag className="w-3 h-3 mr-1" />
                       {img.category}
                    </div>
                  </div>
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
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-heritage-brown/95 backdrop-blur-xl"
            onClick={() => setSelectedImage(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="relative max-w-4xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 z-50 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              
              <div className="grid grid-cols-1 md:grid-cols-5 h-full">
                <div className="md:col-span-3 bg-black flex items-center justify-center min-h-[300px]">
                  <img 
                    src={selectedImage.src} 
                    alt={selectedImage.title} 
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="md:col-span-2 p-8 flex flex-col">
                  <span className="text-heritage-terracotta font-bold text-xs uppercase tracking-widest mb-4">
                    {selectedImage.category}
                  </span>
                  <h2 className="text-3xl font-serif font-bold text-heritage-brown mb-4">
                    {selectedImage.title}
                  </h2>
                  <p className="text-heritage-brown/60 leading-relaxed mb-auto">
                    {selectedImage.desc}
                  </p>
                  <div className="pt-8 mt-8 border-t border-heritage-brown/10 flex items-center justify-between">
                    <button className="text-sm font-bold text-heritage-brown uppercase tracking-widest hover:text-heritage-terracotta">
                      Share Image
                    </button>
                    <button className="text-sm font-bold text-heritage-brown uppercase tracking-widest hover:text-heritage-terracotta">
                      Download HD
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
