import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Search, Maximize2, Tag, Facebook, Twitter, Download, Loader2, Plus, Upload, Check } from 'lucide-react';
import { getSupabase } from '../lib/supabaseClient';
import { getGalleryImages, addGalleryImage, uploadMedia, GalleryImage } from '../lib/supabase';

const categories = ["All", "Landscape", "Tradition", "Craft", "History"];

export default function Gallery() {
  const supabase = getSupabase();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [dbImages, setDbImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<{src: string, title: string, category: string, desc: string} | null>(null);
  
  // Custom upload modal state for authenticated contributors
  const [user, setUser] = useState<any>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploadCategory, setUploadCategory] = useState('Landscape');
  const [uploadFile, setUploadFile] = useState<string | null>(null);
  const [submittingImage, setSubmittingImage] = useState(false);

  useEffect(() => {
    // Auth Check
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }: any) => {
        setUser(session?.user || null);
      });
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
        setUser(session?.user || null);
      });
      return () => subscription.unsubscribe();
    }
  }, [supabase]);

  const loadGallery = async () => {
    setLoading(true);
    const images = await getGalleryImages();
    setDbImages(images);
    setLoading(false);
  };

  useEffect(() => {
    loadGallery();
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSubmittingImage(true);
      try {
        const { url, error } = await uploadMedia(file, 'images');
        if (error) throw error;
        setUploadFile(url);
      } catch (err: any) {
        alert(err.message || "Failed to upload file. Using local fallback.");
        const reader = new FileReader();
        reader.onloadend = () => {
          setUploadFile(reader.result as string);
        };
        reader.readAsDataURL(file);
      } finally {
        setSubmittingImage(false);
      }
    }
  };

  const handleAddImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !uploadTitle) return;

    setSubmittingImage(true);
    try {
      const { error } = await addGalleryImage(
        uploadTitle,
        uploadFile,
        uploadDesc,
        uploadCategory
      );
      if (error) throw error;
      
      setShowUploadModal(false);
      setUploadTitle('');
      setUploadDesc('');
      setUploadFile(null);
      await loadGallery();
    } catch (err: any) {
      alert(err.message || "Failed to submit image.");
    } finally {
      setSubmittingImage(false);
    }
  };

  const filteredImages = selectedCategory === "All" 
    ? dbImages 
    : dbImages.filter(img => img.category === selectedCategory);

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
    <div className="pt-24 min-h-screen bg-heritage-cream">
      {/* Header */}
      <section className="bg-heritage-olive py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-serif font-bold text-white mb-4"
          >
            Digital Gallery & Archive
          </motion.h1>
          <p className="text-heritage-sand/80 max-w-2xl mx-auto text-sm md:text-base font-medium uppercase tracking-widest leading-relaxed">
            Preserving Bakenyi history, craft, and ecology through visual storytelling.
          </p>
        </div>
      </section>

      {/* Main Grid Content */}
      <section className="py-16 px-4 max-w-7xl mx-auto">
        {/* Toolbar & Category Filters */}
        <div className="flex flex-col md:flex-row gap-6 items-center justify-between mb-12 border-b border-heritage-brown/10 pb-8">
          <div className="flex flex-wrap gap-2.5">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider border-2 transition-all cursor-pointer ${
                  selectedCategory === cat 
                    ? 'bg-heritage-olive border-heritage-olive text-white shadow-md' 
                    : 'bg-white border-heritage-brown/10 text-heritage-brown hover:border-heritage-olive/30'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {user && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="btn-primary flex items-center gap-2 px-6 py-3 shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Gallery Asset</span>
            </button>
          )}
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="w-12 h-12 text-heritage-olive animate-spin" />
            <p className="text-xs font-black uppercase tracking-widest text-heritage-brown/40">Loading Archive Assets...</p>
          </div>
        ) : filteredImages.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-[32px] border border-heritage-brown/5">
            <Tag className="w-12 h-12 text-heritage-brown/20 mx-auto mb-4" />
            <h3 className="text-xl font-serif font-bold text-heritage-brown mb-1">No Gallery Images Found</h3>
            <p className="text-sm text-heritage-brown/60">Be the first to contribute a photo to this category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredImages.map((img, index) => (
              <motion.div
                key={img.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-heritage-brown/5 group hover:shadow-xl transition-all flex flex-col text-left"
              >
                <div className="aspect-video relative overflow-hidden bg-heritage-cream/40">
                  <img 
                    src={img.imageUrl} 
                    alt={img.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                  <div className="absolute inset-0 bg-heritage-brown/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-3 transition-opacity">
                    <button
                      onClick={() => setSelectedImage({src: img.imageUrl, title: img.title, category: img.category, desc: img.description})}
                      className="p-3 bg-white/95 hover:bg-white text-heritage-brown rounded-full hover:scale-110 transition-transform shadow-md cursor-pointer"
                    >
                      <Maximize2 className="w-4.5 h-4.5" />
                    </button>
                  </div>
                </div>

                <div className="p-6 flex-grow flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-heritage-olive/10 text-heritage-olive">
                        {img.category}
                      </span>
                    </div>
                    <h3 className="font-serif font-bold text-xl text-heritage-brown mb-2">{img.title}</h3>
                    {img.description && (
                      <p className="text-xs text-heritage-brown/60 leading-relaxed font-medium mb-4 line-clamp-2">
                        {img.description}
                      </p>
                    )}
                  </div>
                  <div className="text-[10px] text-heritage-brown/40 font-bold border-t border-heritage-brown/5 pt-4">
                    Uploaded {new Date(img.created_at).toLocaleDateString()}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Upload Asset Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <div className="fixed inset-0 bg-heritage-brown/65 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[32px] p-8 max-w-lg w-full shadow-2xl relative text-left"
            >
              <button 
                onClick={() => setShowUploadModal(false)}
                className="absolute right-6 top-6 p-2 text-heritage-brown/40 hover:text-heritage-brown rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-2xl font-serif font-bold text-heritage-brown mb-6">Upload Gallery Asset</h2>

              <form onSubmit={handleAddImage} className="space-y-5">
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase tracking-widest text-heritage-brown/60 ml-1">Asset Title</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Traditional Canoes"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    className="w-full px-5 py-3.5 bg-heritage-cream/20 border-2 border-transparent focus:border-heritage-olive/20 rounded-2xl outline-none font-medium text-heritage-brown"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-black uppercase tracking-widest text-heritage-brown/60 ml-1">Category</label>
                    <select
                      value={uploadCategory}
                      onChange={(e) => setUploadCategory(e.target.value)}
                      className="w-full px-5 py-3.5 bg-heritage-cream/20 border-2 border-transparent focus:border-heritage-olive/20 rounded-2xl outline-none font-medium text-heritage-brown"
                    >
                      <option value="Landscape">Landscape</option>
                      <option value="Tradition">Tradition</option>
                      <option value="Craft">Craft</option>
                      <option value="History">History</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black uppercase tracking-widest text-heritage-brown/60 ml-1">Select File</label>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="modal-file-upload"
                      />
                      <label
                        htmlFor="modal-file-upload"
                        className="w-full px-5 py-3.5 bg-heritage-cream/40 border-2 border-dashed border-heritage-brown/15 hover:border-heritage-olive/45 rounded-2xl flex items-center justify-center gap-2 cursor-pointer font-bold text-xs text-heritage-brown transition-colors"
                      >
                        <Upload className="w-4 h-4 text-heritage-olive" />
                        <span>{uploadFile ? 'Change Photo' : 'Choose Photo'}</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black uppercase tracking-widest text-heritage-brown/60 ml-1">Description</label>
                  <textarea
                    rows={3}
                    placeholder="Provide cultural context or narrative..."
                    value={uploadDesc}
                    onChange={(e) => setUploadDesc(e.target.value)}
                    className="w-full px-5 py-3.5 bg-heritage-cream/20 border-2 border-transparent focus:border-heritage-olive/20 rounded-2xl outline-none font-medium text-heritage-brown resize-none"
                  />
                </div>

                {uploadFile && (
                  <div className="aspect-video rounded-2xl overflow-hidden border border-heritage-brown/5">
                    <img src={uploadFile} className="w-full h-full object-cover" alt="Selected Preview" />
                  </div>
                )}

                <button
                  disabled={submittingImage || !uploadFile}
                  type="submit"
                  className="w-full btn-primary py-4 font-bold flex items-center justify-center gap-2 mt-2 cursor-pointer"
                >
                  {submittingImage ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                  <span>Upload & Publish Asset</span>
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Image Lightbox Modal */}
      <AnimatePresence>
        {selectedImage && (
          <div className="fixed inset-0 bg-heritage-brown/95 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <button 
              onClick={() => setSelectedImage(null)}
              className="absolute right-6 top-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="max-w-4xl w-full flex flex-col md:flex-row bg-white rounded-[32px] overflow-hidden shadow-2xl text-left"
            >
              <div className="md:w-3/5 bg-heritage-brown flex items-center justify-center max-h-[80vh] md:max-h-none">
                <img src={selectedImage.src} className="w-full h-full object-contain" alt={selectedImage.title} />
              </div>
              <div className="md:w-2/5 p-8 md:p-12 flex flex-col justify-between">
                <div>
                  <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-heritage-olive/10 text-heritage-olive mb-4 inline-block">
                    {selectedImage.category}
                  </span>
                  <h2 className="text-3xl font-serif font-bold text-heritage-brown mb-4">{selectedImage.title}</h2>
                  {selectedImage.desc && (
                    <p className="text-sm text-heritage-brown/70 leading-relaxed font-medium mb-6">
                      {selectedImage.desc}
                    </p>
                  )}
                </div>

                <div className="border-t border-heritage-brown/10 pt-6">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => shareOnFacebook(selectedImage.title)}
                      className="p-3 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-2xl transition-colors cursor-pointer"
                      title="Share on Facebook"
                    >
                      <Facebook className="w-4.5 h-4.5" />
                    </button>
                    <button
                      onClick={() => shareOnTwitter(selectedImage.title)}
                      className="p-3 bg-sky-50 hover:bg-sky-100 text-sky-500 rounded-2xl transition-colors cursor-pointer"
                      title="Share on Twitter"
                    >
                      <Twitter className="w-4.5 h-4.5" />
                    </button>
                    <a
                      href={selectedImage.src}
                      download={selectedImage.title}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-grow py-3 px-6 bg-heritage-olive hover:bg-heritage-olive/95 text-white font-bold text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Archive Image</span>
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
