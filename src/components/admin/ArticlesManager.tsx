import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  FileText, 
  Image as ImageIcon, 
  Upload, 
  Loader2, 
  Check, 
  AlertCircle, 
  Bold, 
  Italic, 
  Heading, 
  List, 
  ListOrdered, 
  ArrowLeft, 
  BookOpen, 
  Download, 
  X, 
  ExternalLink,
  Search,
  Calendar,
  User,
  Tag
} from 'lucide-react';
import { Article } from '../../types/article';
import { getArticles, createArticle, updateArticle, deleteArticle, uploadMedia, isSupabaseConfigured } from '../../lib/supabase';

export default function ArticlesManager() {
  // State
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  
  // Editor State
  const [isEditing, setIsEditing] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Partial<Article> | null>(null);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  
  // File upload state
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  
  // Drag and drop state
  const [imageDragActive, setImageDragActive] = useState(false);
  const [pdfDragActive, setPdfDragActive] = useState(false);

  // Textarea ref for inserting markdown helpers
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    setLoading(true);
    try {
      // getArticles(false) loads all articles (including drafts)
      const data = await getArticles(false);
      setArticles(data);
    } catch (err) {
      setError('Failed to load articles from database.');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (msg: string, isSuccess = true) => {
    if (isSuccess) {
      setSuccess(msg);
      setTimeout(() => setSuccess(''), 4000);
    } else {
      setError(msg);
      setTimeout(() => setError(''), 5000);
    }
  };

  // Open Form for creating new article
  const handleCreateNew = () => {
    const today = new Date().toISOString().split('T')[0];
    setEditingArticle({
      title: '',
      excerpt: '',
      content: '',
      category: 'History',
      author: 'Cultural Editor',
      publishedAt: today,
      imageUrl: '',
      pdfUrl: '',
      tags: [],
      status: 'draft',
      views: 0
    });
    setIsEditing(true);
    setActiveTab('edit');
  };

  // Open Form for editing existing article
  const handleEdit = (article: Article) => {
    setEditingArticle({ ...article });
    setIsEditing(true);
    setActiveTab('edit');
  };

  // Handle article deletion
  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this article? This action cannot be undone.')) return;
    
    try {
      const { success: delSuccess, error: delError } = await deleteArticle(id);
      if (delError) throw delError;
      
      showNotification('Article deleted successfully.');
      loadArticles();
    } catch (err: any) {
      showNotification(err.message || 'Failed to delete article.', false);
    }
  };

  // Handle Form input changes
  const handleInputChange = (field: keyof Article, value: any) => {
    if (editingArticle) {
      setEditingArticle({
        ...editingArticle,
        [field]: value
      });
    }
  };

  // Helper to insert Markdown markers at current cursor selection
  const insertMarkdownHelper = (prefix: string, suffix = '') => {
    const textarea = textareaRef.current;
    if (!textarea || !editingArticle) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);
    
    const replacement = prefix + (selectedText || 'text') + suffix;
    const newValue = text.substring(0, start) + replacement + text.substring(end);
    
    handleInputChange('content', newValue);
    
    // Reset focus and selection
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + (selectedText || 'text').length);
    }, 50);
  };

  // File Upload Handlers (Drag & Drop + Input Click)
  const handleImageFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      showNotification('Please upload a valid image file (PNG, JPG, WEBP).', false);
      return;
    }
    setUploadingImage(true);
    try {
      const { url, error: uploadErr } = await uploadMedia(file, 'images');
      if (uploadErr) throw uploadErr;
      
      handleInputChange('imageUrl', url);
      showNotification('Featured image uploaded successfully!');
    } catch (err: any) {
      showNotification(err.message || 'Image upload failed.', false);
    } finally {
      setUploadingImage(false);
    }
  };

  const handlePdfFile = async (file: File) => {
    if (file.type !== 'application/pdf') {
      showNotification('Please upload a valid PDF document.', false);
      return;
    }
    setUploadingPdf(true);
    try {
      const { url, error: uploadErr } = await uploadMedia(file, 'pdfs');
      if (uploadErr) throw uploadErr;
      
      handleInputChange('pdfUrl', url);
      showNotification('PDF attachment uploaded successfully!');
    } catch (err: any) {
      showNotification(err.message || 'PDF upload failed.', false);
    } finally {
      setUploadingPdf(false);
    }
  };

  // Save changes (Create or Update)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingArticle) return;

    if (!editingArticle.title?.trim()) {
      showNotification('Article title is required.', false);
      return;
    }
    if (!editingArticle.excerpt?.trim()) {
      showNotification('A short summary/excerpt is required.', false);
      return;
    }
    if (!editingArticle.content?.trim()) {
      showNotification('Article content is required.', false);
      return;
    }

    setLoading(true);
    try {
      if (editingArticle.id) {
        // Update
        const { error: saveErr } = await updateArticle(editingArticle.id, editingArticle);
        if (saveErr) throw saveErr;
        showNotification('Article updated successfully.');
      } else {
        // Create
        const { error: saveErr } = await createArticle(editingArticle as Omit<Article, 'id'>);
        if (saveErr) throw saveErr;
        showNotification('New article created successfully.');
      }
      setIsEditing(false);
      setEditingArticle(null);
      loadArticles();
    } catch (err: any) {
      showNotification(err.message || 'Failed to save article.', false);
    } finally {
      setLoading(false);
    }
  };

  // Filtering articles list
  const filteredArticles = articles.filter(art => {
    const matchesSearch = 
      art.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      art.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
      art.author.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === 'All' || art.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [
    'Community News',
    'Culture',
    'Heritage',
    'Leadership',
    'History',
    'Announcements'
  ];

  return (
    <div className="space-y-6">
      {/* Banner status notifications */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl flex items-start space-x-3 shadow-sm animate-fade-in">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span className="text-sm font-semibold">{error}</span>
        </div>
      )}
      {success && (
        <div className="bg-heritage-olive/10 border border-heritage-olive/20 text-heritage-olive px-6 py-4 rounded-2xl flex items-start space-x-3 shadow-sm animate-fade-in">
          <Check className="w-5 h-5 shrink-0 mt-0.5" />
          <span className="text-sm font-semibold">{success}</span>
        </div>
      )}

      {/* Editor Panel */}
      {isEditing && editingArticle ? (
        <div className="bg-white rounded-[32px] border border-heritage-brown/5 shadow-xl overflow-hidden animate-fade-in">
          {/* Header row */}
          <div className="bg-heritage-brown text-white p-6 md:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <button 
                onClick={() => { setIsEditing(false); setEditingArticle(null); }}
                className="flex items-center space-x-2 text-heritage-sand hover:text-white transition-colors text-xs font-bold uppercase tracking-widest cursor-pointer mb-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Cancel & Return</span>
              </button>
              <h2 className="text-2xl font-serif font-bold">
                {editingArticle.id ? 'Edit Heritage Article' : 'Draft New Article'}
              </h2>
            </div>
            
            {/* Status toggle */}
            <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-2.5 rounded-2xl">
              <span className="text-xs font-bold uppercase tracking-wider text-heritage-sand">Status:</span>
              <div className="flex gap-1 bg-black/20 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => handleInputChange('status', 'draft')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                    editingArticle.status === 'draft' 
                      ? 'bg-heritage-terracotta text-white' 
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  Draft
                </button>
                <button
                  type="button"
                  onClick={() => handleInputChange('status', 'published')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                    editingArticle.status === 'published' 
                      ? 'bg-heritage-olive text-white' 
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  Publish
                </button>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSave} className="p-6 md:p-8 space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left Form: Fields */}
              <div className="lg:col-span-8 space-y-6">
                
                {/* Title */}
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-heritage-brown/50">Article Title</label>
                  <input 
                    type="text" 
                    value={editingArticle.title || ''}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="e.g. The Traditional Canoe Races of Paliisa District"
                    className="w-full bg-heritage-cream/20 border border-heritage-brown/10 rounded-2xl px-5 py-4 text-heritage-brown placeholder-heritage-brown/30 font-bold focus:bg-white focus:border-heritage-terracotta outline-none transition-all"
                    required
                  />
                </div>

                {/* Excerpt */}
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-heritage-brown/50">Brief Excerpt / Summary</label>
                  <textarea 
                    value={editingArticle.excerpt || ''}
                    onChange={(e) => handleInputChange('excerpt', e.target.value)}
                    placeholder="Provide a compelling 2-3 sentence summary of the article to capture readers' attention on list views..."
                    rows={2}
                    className="w-full bg-heritage-cream/20 border border-heritage-brown/10 rounded-2xl p-5 text-heritage-brown placeholder-heritage-brown/30 font-medium focus:bg-white focus:border-heritage-terracotta outline-none transition-all resize-none text-sm leading-relaxed"
                    required
                  />
                </div>

                {/* Custom Tabbed Markdown / Rich-Text Editor */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center pb-2 border-b border-heritage-brown/5">
                    <label className="text-xs font-black uppercase tracking-widest text-heritage-brown/50">Article Body Content</label>
                    <div className="flex items-center gap-2 bg-heritage-cream/30 p-1 rounded-xl border border-heritage-brown/5 text-xs">
                      <button
                        type="button"
                        onClick={() => setActiveTab('edit')}
                        className={`px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider transition-all cursor-pointer ${
                          activeTab === 'edit' 
                            ? 'bg-white text-heritage-brown shadow-sm font-black' 
                            : 'text-heritage-brown/50 hover:text-heritage-brown'
                        }`}
                      >
                        Editor
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('preview')}
                        className={`px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider transition-all cursor-pointer ${
                          activeTab === 'preview' 
                            ? 'bg-white text-heritage-brown shadow-sm font-black' 
                            : 'text-heritage-brown/50 hover:text-heritage-brown'
                        }`}
                      >
                        Live Preview
                      </button>
                    </div>
                  </div>

                  {activeTab === 'edit' ? (
                    <div className="space-y-2">
                      {/* Rich Text formatting assistance tools bar */}
                      <div className="flex flex-wrap items-center gap-1.5 bg-heritage-cream/30 p-2 rounded-xl border border-heritage-brown/5">
                        <button
                          type="button"
                          onClick={() => insertMarkdownHelper('**', '**')}
                          className="p-2 hover:bg-white rounded-lg text-heritage-brown/70 hover:text-heritage-brown transition-all cursor-pointer"
                          title="Bold Text"
                        >
                          <Bold className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => insertMarkdownHelper('*', '*')}
                          className="p-2 hover:bg-white rounded-lg text-heritage-brown/70 hover:text-heritage-brown transition-all cursor-pointer"
                          title="Italic Text"
                        >
                          <Italic className="w-4 h-4" />
                        </button>
                        <span className="h-4 w-px bg-heritage-brown/10 mx-1" />
                        <button
                          type="button"
                          onClick={() => insertMarkdownHelper('## ')}
                          className="px-2 py-1 hover:bg-white rounded-lg text-heritage-brown/70 hover:text-heritage-brown transition-all font-bold text-xs cursor-pointer"
                          title="Header 2 (Main Section)"
                        >
                          H2
                        </button>
                        <button
                          type="button"
                          onClick={() => insertMarkdownHelper('### ')}
                          className="px-2 py-1 hover:bg-white rounded-lg text-heritage-brown/70 hover:text-heritage-brown transition-all font-bold text-xs cursor-pointer"
                          title="Header 3 (Subsection)"
                        >
                          H3
                        </button>
                        <span className="h-4 w-px bg-heritage-brown/10 mx-1" />
                        <button
                          type="button"
                          onClick={() => insertMarkdownHelper('- ')}
                          className="p-2 hover:bg-white rounded-lg text-heritage-brown/70 hover:text-heritage-brown transition-all cursor-pointer"
                          title="Bullet List"
                        >
                          <List className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => insertMarkdownHelper('1. ')}
                          className="p-2 hover:bg-white rounded-lg text-heritage-brown/70 hover:text-heritage-brown transition-all cursor-pointer"
                          title="Numbered List"
                        >
                          <ListOrdered className="w-4 h-4" />
                        </button>
                        <span className="h-4 w-px bg-heritage-brown/10 mx-1" />
                        <button
                          type="button"
                          onClick={() => insertMarkdownHelper('\n\n### ', '\n\n')}
                          className="text-[10px] uppercase font-black tracking-widest text-heritage-terracotta hover:bg-white px-2.5 py-1 rounded-lg transition-all cursor-pointer ml-auto"
                        >
                          Add Section Break
                        </button>
                      </div>

                      {/* Main text box */}
                      <textarea 
                        ref={textareaRef}
                        value={editingArticle.content || ''}
                        onChange={(e) => handleInputChange('content', e.target.value)}
                        placeholder="Write your article using clean markdown layout here..."
                        rows={16}
                        className="w-full bg-heritage-cream/10 border border-heritage-brown/10 rounded-2xl p-6 text-heritage-brown placeholder-heritage-brown/20 font-mono text-sm leading-relaxed focus:bg-white focus:border-heritage-terracotta outline-none transition-all"
                        required
                      />
                    </div>
                  ) : (
                    /* Elegant Live Rendering Matching The Public View */
                    <div className="bg-heritage-cream/10 border border-heritage-brown/10 rounded-2xl p-6 md:p-8 min-h-[400px] overflow-y-auto max-h-[600px] prose">
                      {editingArticle.content ? (
                        <div className="space-y-6 text-heritage-brown text-base">
                          {editingArticle.content.split('\n\n').map((paragraph, index) => {
                            if (paragraph.startsWith('### ')) {
                              return (
                                <h3 key={index} className="text-xl font-serif font-bold text-heritage-brown pt-4">
                                  {paragraph.replace('### ', '')}
                                </h3>
                              );
                            }
                            if (paragraph.startsWith('## ')) {
                              return (
                                <h2 key={index} className="text-2xl font-serif font-black text-heritage-brown pt-6 border-b border-heritage-brown/5 pb-1">
                                  {paragraph.replace('## ', '')}
                                </h2>
                              );
                            }
                            if (paragraph.startsWith('1. ') || paragraph.startsWith('- ')) {
                              const isOrdered = paragraph.startsWith('1. ');
                              const items = paragraph.split('\n');
                              return (
                                <ul key={index} className={`list-inside ${isOrdered ? 'list-decimal' : 'list-disc'} pl-4 space-y-1.5`}>
                                  {items.map((item, subIndex) => {
                                    const cleanItem = item.replace(/^\d+\.\s+/, '').replace(/^-\s+/, '');
                                    const parts = cleanItem.split('**');
                                    return (
                                      <li key={subIndex} className="text-heritage-brown/80 font-medium text-sm">
                                        {parts.map((p, i) => i % 2 === 1 ? <strong key={i} className="text-heritage-brown font-black">{p}</strong> : p)}
                                      </li>
                                    );
                                  })}
                                </ul>
                              );
                            }

                            const parts = paragraph.split('**');
                            return (
                              <p key={index} className="leading-relaxed text-sm font-medium">
                                {parts.map((p, i) => i % 2 === 1 ? <strong key={i} className="text-heritage-brown font-black">{p}</strong> : p)}
                              </p>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-24 text-heritage-brown/20 font-black uppercase text-xs tracking-widest">
                          <BookOpen className="w-8 h-8 mb-2" />
                          <span>No content written yet</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

              </div>

              {/* Right Form Sidebar: Metadata & Asset Uploads */}
              <div className="lg:col-span-4 space-y-6">
                
                {/* Save Block */}
                <div className="bg-heritage-brown/5 border border-heritage-brown/10 rounded-2xl p-6 space-y-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center space-x-2 py-4 bg-heritage-terracotta hover:bg-heritage-brown text-white rounded-xl text-sm font-black uppercase tracking-wider transition-all shadow-md cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Check className="w-5 h-5" />
                        <span>{editingArticle.id ? 'Update Article' : 'Publish Article'}</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsEditing(false); setEditingArticle(null); }}
                    className="w-full text-center py-3 border border-heritage-brown/10 hover:bg-white text-heritage-brown/70 hover:text-heritage-brown rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
                  >
                    Cancel Draft
                  </button>
                </div>

                {/* Basic Metadata */}
                <div className="bg-white border border-heritage-brown/10 rounded-2xl p-6 space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-heritage-brown pb-2 border-b border-heritage-brown/5">
                    Article Metadata
                  </h4>

                  {/* Category */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-heritage-brown/50">Category</label>
                    <select
                      value={editingArticle.category || 'History'}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                      className="w-full bg-heritage-cream/30 border border-heritage-brown/10 rounded-xl px-3 py-2.5 text-xs text-heritage-brown font-bold focus:outline-none focus:border-heritage-terracotta"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  {/* Author */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-heritage-brown/50">Author Name</label>
                    <input 
                      type="text"
                      value={editingArticle.author || ''}
                      onChange={(e) => handleInputChange('author', e.target.value)}
                      className="w-full bg-heritage-cream/30 border border-heritage-brown/10 rounded-xl px-4 py-2.5 text-xs text-heritage-brown font-bold focus:outline-none focus:border-heritage-terracotta"
                      required
                    />
                  </div>

                  {/* Date */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-heritage-brown/50">Publication Date</label>
                    <input 
                      type="date"
                      value={editingArticle.publishedAt || ''}
                      onChange={(e) => handleInputChange('publishedAt', e.target.value)}
                      className="w-full bg-heritage-cream/30 border border-heritage-brown/10 rounded-xl px-4 py-2.5 text-xs text-heritage-brown font-bold focus:outline-none focus:border-heritage-terracotta"
                      required
                    />
                  </div>

                  {/* Tags */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-heritage-brown/50">Keywords (Comma Separated)</label>
                    <input 
                      type="text"
                      placeholder="Migration, Kyoga, Clan, Language"
                      value={editingArticle.tags?.join(', ') || ''}
                      onChange={(e) => handleInputChange('tags', e.target.value.split(',').map((t: string) => t.trim()).filter(Boolean))}
                      className="w-full bg-heritage-cream/30 border border-heritage-brown/10 rounded-xl px-4 py-2.5 text-xs text-heritage-brown font-bold focus:outline-none focus:border-heritage-terracotta"
                    />
                  </div>
                </div>

                {/* Featured Image Upload with Drag-and-Drop */}
                <div className="bg-white border border-heritage-brown/10 rounded-2xl p-6 space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-heritage-brown pb-2 border-b border-heritage-brown/5">
                    Featured Image
                  </h4>

                  {editingArticle.imageUrl ? (
                    <div className="space-y-3">
                      <div className="relative aspect-video rounded-xl overflow-hidden border border-heritage-brown/10">
                        <img 
                          src={editingArticle.imageUrl} 
                          alt="Featured preview" 
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleInputChange('imageUrl', '')}
                          className="absolute top-2 right-2 p-2 bg-black/60 hover:bg-black text-white rounded-full transition-colors cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-[9px] text-heritage-brown/50 font-mono break-all">{editingArticle.imageUrl}</p>
                    </div>
                  ) : (
                    <div 
                      onDragEnter={(e) => { e.preventDefault(); setImageDragActive(true); }}
                      onDragLeave={(e) => { e.preventDefault(); setImageDragActive(false); }}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={async (e) => {
                        e.preventDefault();
                        setImageDragActive(false);
                        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                          await handleImageFile(e.dataTransfer.files[0]);
                        }
                      }}
                      className={`border-2 border-dashed rounded-2xl p-6 text-center transition-colors relative cursor-pointer ${
                        imageDragActive 
                          ? 'border-heritage-terracotta bg-heritage-terracotta/5' 
                          : 'border-heritage-brown/10 hover:border-heritage-terracotta/40 hover:bg-heritage-cream/10'
                      }`}
                    >
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={async (e) => {
                          if (e.target.files && e.target.files[0]) {
                            await handleImageFile(e.target.files[0]);
                          }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        disabled={uploadingImage}
                      />
                      {uploadingImage ? (
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <Loader2 className="w-6 h-6 text-heritage-terracotta animate-spin" />
                          <span className="text-[10px] font-black uppercase tracking-wider text-heritage-brown/60">Uploading Image...</span>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <Upload className="w-6 h-6 text-heritage-brown/30 mx-auto" />
                          <p className="text-xs font-bold text-heritage-brown">Drag & drop image file</p>
                          <p className="text-[10px] text-heritage-brown/40">or click to browse</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* PDF Document Upload with Drag-and-Drop */}
                <div className="bg-white border border-heritage-brown/10 rounded-2xl p-6 space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-heritage-brown pb-2 border-b border-heritage-brown/5">
                    PDF Attachment / Downloads
                  </h4>

                  {editingArticle.pdfUrl ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3.5 bg-heritage-cream/30 border border-heritage-brown/10 rounded-xl">
                        <div className="flex items-center space-x-2 min-w-0">
                          <FileText className="w-5 h-5 text-heritage-terracotta shrink-0" />
                          <span className="text-[11px] font-bold text-heritage-brown truncate">Document Active</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleInputChange('pdfUrl', '')}
                          className="p-1.5 bg-heritage-brown/5 hover:bg-heritage-brown/10 text-heritage-brown rounded-lg transition-colors cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-[9px] text-heritage-brown/50 font-mono break-all">{editingArticle.pdfUrl}</p>
                    </div>
                  ) : (
                    <div 
                      onDragEnter={(e) => { e.preventDefault(); setPdfDragActive(true); }}
                      onDragLeave={(e) => { e.preventDefault(); setPdfDragActive(false); }}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={async (e) => {
                        e.preventDefault();
                        setPdfDragActive(false);
                        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                          await handlePdfFile(e.dataTransfer.files[0]);
                        }
                      }}
                      className={`border-2 border-dashed rounded-2xl p-6 text-center transition-colors relative cursor-pointer ${
                        pdfDragActive 
                          ? 'border-heritage-terracotta bg-heritage-terracotta/5' 
                          : 'border-heritage-brown/10 hover:border-heritage-terracotta/40 hover:bg-heritage-cream/10'
                      }`}
                    >
                      <input 
                        type="file" 
                        accept="application/pdf"
                        onChange={async (e) => {
                          if (e.target.files && e.target.files[0]) {
                            await handlePdfFile(e.target.files[0]);
                          }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        disabled={uploadingPdf}
                      />
                      {uploadingPdf ? (
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <Loader2 className="w-6 h-6 text-heritage-terracotta animate-spin" />
                          <span className="text-[10px] font-black uppercase tracking-wider text-heritage-brown/60">Uploading PDF...</span>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <FileText className="w-6 h-6 text-heritage-brown/30 mx-auto" />
                          <p className="text-xs font-bold text-heritage-brown">Drag & drop PDF document</p>
                          <p className="text-[10px] text-heritage-brown/40">or click to browse</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

              </div>

            </div>
          </form>
        </div>
      ) : (
        /* List & Search View of articles */
        <div className="bg-white rounded-[32px] border border-heritage-brown/5 shadow-sm p-6 md:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-heritage-brown/5">
            <div>
              <h2 className="text-xl font-serif font-bold text-heritage-brown">Manage Repository Articles</h2>
              <p className="text-xs text-heritage-brown/50 font-medium">Create, modify and control Bakenyi publications</p>
            </div>
            
            <button
              onClick={handleCreateNew}
              className="flex items-center space-x-2 px-5 py-3 bg-heritage-terracotta hover:bg-heritage-brown text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-md shadow-heritage-terracotta/10 hover:shadow-none active:scale-95 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Draft New Article</span>
            </button>
          </div>

          {/* Search/Filters bar */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-heritage-cream/20 p-4 rounded-2xl border border-heritage-brown/5">
            {/* Search */}
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-heritage-brown/30" />
              <input
                type="text"
                placeholder="Search repository..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-heritage-brown/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-heritage-brown placeholder-heritage-brown/30 font-medium outline-none focus:border-heritage-terracotta"
              />
            </div>

            {/* Quick selector filter */}
            <div className="flex gap-1 bg-white p-1 rounded-xl border border-heritage-brown/10 w-full sm:w-auto overflow-x-auto shrink-0">
              {['All', 'History', 'Culture', 'Announcements'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                    (cat === 'All' && filterCategory === 'All') || filterCategory === cat
                      ? 'bg-heritage-terracotta text-white'
                      : 'text-heritage-brown/60 hover:text-heritage-brown'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Main List */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <Loader2 className="w-8 h-8 text-heritage-terracotta animate-spin mb-3" />
              <p className="text-[10px] uppercase font-black tracking-widest text-heritage-brown/40">Refreshing list...</p>
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-heritage-brown/5 rounded-[24px]">
              <BookOpen className="w-12 h-12 text-heritage-brown/20 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-heritage-brown">No Articles Match Query</h4>
              <p className="text-xs text-heritage-brown/40 max-w-sm mx-auto leading-relaxed mt-1">
                There are no articles fitting this query. Create a new draft to get started.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-heritage-brown/10 text-[9px] font-black uppercase tracking-widest text-heritage-brown/40 pb-3">
                    <th className="py-3 font-black">Title</th>
                    <th className="py-3 font-black hidden md:table-cell">Author</th>
                    <th className="py-3 font-black hidden lg:table-cell">Category</th>
                    <th className="py-3 font-black">Status</th>
                    <th className="py-3 font-black text-right">Controls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-heritage-brown/5 text-xs">
                  {filteredArticles.map((art) => (
                    <tr key={art.id} className="group hover:bg-heritage-cream/10 transition-colors">
                      <td className="py-4 pr-4">
                        <div className="min-w-0 font-serif">
                          <span className="font-bold text-heritage-brown hover:text-heritage-terracotta text-sm block">
                            {art.title}
                          </span>
                          <span className="text-[10px] text-heritage-brown/40 font-mono block mt-0.5">
                            Published: {art.publishedAt} • ID: {art.id}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 hidden md:table-cell text-heritage-brown/70 font-semibold">
                        {art.author}
                      </td>
                      <td className="py-4 hidden lg:table-cell">
                        <span className="px-2.5 py-1 rounded-full bg-heritage-cream text-heritage-brown/70 font-black text-[9px] uppercase tracking-wider">
                          {art.category}
                        </span>
                      </td>
                      <td className="py-4">
                        <span className={`px-2.5 py-1 rounded-full font-black text-[9px] uppercase tracking-wider ${
                          art.status === 'published' 
                            ? 'bg-heritage-olive/10 text-heritage-olive' 
                            : 'bg-amber-50 text-amber-600'
                        }`}>
                          {art.status || 'draft'}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleEdit(art)}
                            className="p-2.5 hover:bg-heritage-terracotta/10 text-heritage-brown/50 hover:text-heritage-terracotta rounded-xl transition-all cursor-pointer"
                            title="Edit Article"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(art.id)}
                            className="p-2.5 hover:bg-red-50 text-heritage-brown/50 hover:text-red-500 rounded-xl transition-all cursor-pointer"
                            title="Delete Article"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <a
                            href={`/articles/${art.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2.5 hover:bg-heritage-brown/5 text-heritage-brown/40 hover:text-heritage-brown rounded-xl transition-all inline-block"
                            title="Open Public View"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
