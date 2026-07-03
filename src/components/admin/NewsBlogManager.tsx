import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Edit, Trash2, BookOpen, Loader2, Check, AlertCircle, 
  Bold, Italic, Heading, List, ListOrdered, ArrowLeft, X, 
  Search, Calendar, User, Tag, Eye, EyeOff, CheckCircle2, Clock
} from 'lucide-react';
import { 
  getNewsArticles, createNewsArticle, updateNewsArticle, deleteNewsArticle,
  getBlogPosts, createBlogPost, updateBlogPost, deleteBlogPost,
  getCategories, CategoryItem, NewsBlogItem
} from '../../lib/firebaseContentService';
import { auth } from '../../lib/firebase';
import { storageService } from '../../services/appwriteServices';

interface NewsBlogManagerProps {
  type: 'news' | 'blogs';
  userRole: string;
}

export default function NewsBlogManager({ type, userRole }: NewsBlogManagerProps) {
  const [items, setItems] = useState<NewsBlogItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  
  // Editor State
  const [isEditing, setIsEditing] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<NewsBlogItem> | null>(null);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  
  // File upload state
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageDragActive, setImageDragActive] = useState(false);
  const [customImageUrl, setCustomImageUrl] = useState('');

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    loadData();
  }, [type]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      // Load categories
      const cats = await getCategories();
      setCategories(cats);

      // Load items (include drafts for CMS admin views)
      const data = type === 'news' ? await getNewsArticles(true) : await getBlogPosts(true);
      setItems(data);
    } catch (err: any) {
      setError('Failed to load records from the database.');
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

  const handleCreateNew = () => {
    const today = new Date().toISOString().split('T')[0];
    setEditingItem({
      title: '',
      slug: '',
      summary: '',
      content: '',
      category: categories[0]?.name || 'History',
      authorId: auth.currentUser?.uid || '',
      authorName: auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0] || 'Contributor',
      featuredImage: '',
      tags: [],
      status: 'draft'
    });
    setIsEditing(true);
    setActiveTab('edit');
  };

  const handleEdit = (item: NewsBlogItem) => {
    setEditingItem({ ...item });
    setIsEditing(true);
    setActiveTab('edit');
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete this ${type === 'news' ? 'news dispatch' : 'blog post'}?`)) return;
    
    setLoading(true);
    try {
      if (type === 'news') {
        await deleteNewsArticle(id);
      } else {
        await deleteBlogPost(id);
      }
      showNotification('Deleted successfully.');
      loadData();
    } catch (err: any) {
      showNotification('Delete failed. Verify role permissions.', false);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof NewsBlogItem, value: any) => {
    if (editingItem) {
      const updated = { ...editingItem, [field]: value };
      if (field === 'title') {
        // Auto generate slug
        updated.slug = value.toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim();
      }
      setEditingItem(updated);
    }
  };

  const insertMarkdownHelper = (prefix: string, suffix = '') => {
    const textarea = textareaRef.current;
    if (!textarea || !editingItem) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);
    
    const replacement = prefix + (selectedText || 'text') + suffix;
    const newValue = text.substring(0, start) + replacement + text.substring(end);
    
    handleInputChange('content', newValue);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + (selectedText || 'text').length);
    }, 50);
  };

  // Image upload with Appwrite Storage (Fallback to custom URL)
  const handleImageFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      showNotification('Please upload a valid image file.', false);
      return;
    }
    setUploadingImage(true);
    try {
      const url = await storageService.uploadFile(file);
      handleInputChange('featuredImage', url);
      showNotification('Image uploaded successfully to Appwrite Storage!');
    } catch (err: any) {
      console.error("Appwrite Storage Upload Error:", err);
      showNotification(`Appwrite Storage upload failed: ${err.message || err}`, false);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    if (!editingItem.title?.trim()) {
      showNotification('Title is required.', false);
      return;
    }
    if (!editingItem.content?.trim()) {
      showNotification('Content is required.', false);
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        title: editingItem.title,
        slug: editingItem.slug || editingItem.title.toLowerCase().replace(/\s+/g, '-'),
        summary: editingItem.summary || editingItem.content.slice(0, 150),
        content: editingItem.content,
        featuredImage: editingItem.featuredImage || 'https://images.unsplash.com/photo-1523805009345-7448845a9e53?auto=format&fit=crop&q=80&w=800',
        authorId: editingItem.authorId || auth.currentUser?.uid || 'anonymous',
        authorName: editingItem.authorName || auth.currentUser?.displayName || 'Anonymous',
        category: editingItem.category || 'History',
        tags: editingItem.tags || [],
        status: editingItem.status || 'draft'
      };

      // Apply role constraints in payload just in case rules block them
      if (userRole === 'reporter') {
        payload.status = 'draft'; // Reporter can only write drafts
      } else if (userRole === 'editor' && payload.status === 'published') {
        payload.status = 'pending'; // Editor can only write draft or pending review
      }

      if (editingItem.id) {
        if (type === 'news') {
          await updateNewsArticle(editingItem.id, payload);
        } else {
          await updateBlogPost(editingItem.id, payload);
        }
        showNotification('Record updated successfully.');
      } else {
        if (type === 'news') {
          await createNewsArticle(payload);
        } else {
          await createBlogPost(payload);
        }
        showNotification('Created successfully.');
      }
      setIsEditing(false);
      setEditingItem(null);
      loadData();
    } catch (err: any) {
      showNotification(err.message || 'Operation denied due to role permissions.', false);
    } finally {
      setLoading(false);
    }
  };

  // Filter items
  const filteredItems = items.filter(item => {
    const matchesSearch = 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.authorName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === 'All' || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl flex items-start space-x-3 shadow-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span className="text-sm font-semibold">{error}</span>
        </div>
      )}
      {success && (
        <div className="bg-heritage-olive/10 border border-heritage-olive/20 text-heritage-olive px-6 py-4 rounded-2xl flex items-start space-x-3 shadow-sm">
          <Check className="w-5 h-5 shrink-0 mt-0.5" />
          <span className="text-sm font-semibold">{success}</span>
        </div>
      )}

      {isEditing && editingItem ? (
        <div className="bg-white rounded-[32px] border border-heritage-brown/5 shadow-xl overflow-hidden">
          {/* Editor Header */}
          <div className="bg-heritage-brown text-white p-6 md:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <button 
                onClick={() => { setIsEditing(false); setEditingItem(null); }}
                className="flex items-center space-x-2 text-heritage-sand hover:text-white transition-colors text-xs font-bold uppercase tracking-widest cursor-pointer mb-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Cancel & Return</span>
              </button>
              <h2 className="text-2xl font-serif font-bold">
                {editingItem.id ? `Edit ${type === 'news' ? 'Dispatch' : 'Blog'}` : `Draft New ${type === 'news' ? 'Dispatch' : 'Blog'}`}
              </h2>
            </div>
            
            {/* Status Selector based on User Role permissions */}
            <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-2.5 rounded-2xl">
              <span className="text-xs font-bold uppercase tracking-wider text-heritage-sand">Status:</span>
              <div className="flex gap-1 bg-black/20 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => handleInputChange('status', 'draft')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                    editingItem.status === 'draft' ? 'bg-heritage-terracotta text-white' : 'text-white/60 hover:text-white'
                  }`}
                >
                  Draft
                </button>
                
                {userRole !== 'reporter' && (
                  <button
                    type="button"
                    onClick={() => handleInputChange('status', 'pending')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                      editingItem.status === 'pending' ? 'bg-amber-600 text-white' : 'text-white/60 hover:text-white'
                    }`}
                  >
                    Review
                  </button>
                )}

                {(userRole === 'admin' || userRole === 'super_admin') && (
                  <button
                    type="button"
                    onClick={() => handleInputChange('status', 'published')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                      editingItem.status === 'published' ? 'bg-heritage-olive text-white' : 'text-white/60 hover:text-white'
                    }`}
                  >
                    Publish
                  </button>
                )}
              </div>
            </div>
          </div>

          <form onSubmit={handleSave} className="p-6 md:p-8 space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Form Fields Left */}
              <div className="lg:col-span-8 space-y-6">
                
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-heritage-brown/50">Title</label>
                  <input 
                    type="text" 
                    value={editingItem.title || ''}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Enter an elegant heritage title..."
                    className="w-full bg-heritage-cream/20 border border-heritage-brown/10 rounded-2xl px-5 py-4 text-heritage-brown placeholder-heritage-brown/30 font-bold focus:bg-white focus:border-heritage-terracotta outline-none transition-all"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-heritage-brown/50">Summary / Excerpt</label>
                  <textarea 
                    value={editingItem.summary || ''}
                    onChange={(e) => handleInputChange('summary', e.target.value)}
                    placeholder="Provide a quick, punchy 2-sentence summary of this article..."
                    rows={2}
                    className="w-full bg-heritage-cream/20 border border-heritage-brown/10 rounded-2xl p-5 text-heritage-brown placeholder-heritage-brown/30 font-medium focus:bg-white focus:border-heritage-terracotta outline-none transition-all resize-none text-sm leading-relaxed"
                  />
                </div>

                {/* Markdown text editor */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center pb-2 border-b border-heritage-brown/5">
                    <label className="text-xs font-black uppercase tracking-widest text-heritage-brown/50">Article Content (Markdown)</label>
                    <div className="flex items-center gap-2 bg-heritage-cream/30 p-1 rounded-xl border border-heritage-brown/5 text-xs">
                      <button
                        type="button"
                        onClick={() => setActiveTab('edit')}
                        className={`px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider transition-all cursor-pointer ${
                          activeTab === 'edit' ? 'bg-white text-heritage-brown shadow-sm font-black' : 'text-heritage-brown/50'
                        }`}
                      >
                        Editor
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('preview')}
                        className={`px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider transition-all cursor-pointer ${
                          activeTab === 'preview' ? 'bg-white text-heritage-brown shadow-sm font-black' : 'text-heritage-brown/50'
                        }`}
                      >
                        Preview
                      </button>
                    </div>
                  </div>

                  {activeTab === 'edit' ? (
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-1.5 bg-heritage-cream/30 p-2 rounded-xl border border-heritage-brown/5">
                        <button type="button" onClick={() => insertMarkdownHelper('**', '**')} className="p-2 hover:bg-white rounded-lg text-heritage-brown/70 hover:text-heritage-brown cursor-pointer"><Bold className="w-4 h-4" /></button>
                        <button type="button" onClick={() => insertMarkdownHelper('*', '*')} className="p-2 hover:bg-white rounded-lg text-heritage-brown/70 hover:text-heritage-brown cursor-pointer"><Italic className="w-4 h-4" /></button>
                        <span className="h-4 w-px bg-heritage-brown/10 mx-1" />
                        <button type="button" onClick={() => insertMarkdownHelper('## ')} className="px-2 py-1 hover:bg-white rounded-lg text-heritage-brown/70 hover:text-heritage-brown text-xs cursor-pointer">H2</button>
                        <button type="button" onClick={() => insertMarkdownHelper('### ')} className="px-2 py-1 hover:bg-white rounded-lg text-heritage-brown/70 hover:text-heritage-brown text-xs cursor-pointer">H3</button>
                        <span className="h-4 w-px bg-heritage-brown/10 mx-1" />
                        <button type="button" onClick={() => insertMarkdownHelper('- ')} className="p-2 hover:bg-white rounded-lg text-heritage-brown/70 hover:text-heritage-brown cursor-pointer"><List className="w-4 h-4" /></button>
                        <button type="button" onClick={() => insertMarkdownHelper('1. ')} className="p-2 hover:bg-white rounded-lg text-heritage-brown/70 hover:text-heritage-brown cursor-pointer"><ListOrdered className="w-4 h-4" /></button>
                      </div>

                      <textarea 
                        ref={textareaRef}
                        value={editingItem.content || ''}
                        onChange={(e) => handleInputChange('content', e.target.value)}
                        placeholder="Begin drafting your article body content here..."
                        rows={16}
                        className="w-full bg-heritage-cream/10 border border-heritage-brown/10 rounded-2xl p-6 text-heritage-brown placeholder-heritage-brown/20 font-mono text-sm leading-relaxed focus:bg-white focus:border-heritage-terracotta outline-none transition-all"
                        required
                      />
                    </div>
                  ) : (
                    <div className="bg-heritage-cream/10 border border-heritage-brown/10 rounded-2xl p-6 md:p-8 min-h-[400px] overflow-y-auto max-h-[600px] prose">
                      {editingItem.content ? (
                        <div className="space-y-4 text-heritage-brown text-sm">
                          {editingItem.content.split('\n\n').map((para, i) => (
                            <p key={i} className="leading-relaxed">{para}</p>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-20 text-heritage-brown/20 uppercase font-black text-xs">
                          <BookOpen className="w-8 h-8 mx-auto mb-2" />
                          <span>No content</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

              </div>

              {/* Sidebar Rights */}
              <div className="lg:col-span-4 space-y-6">
                
                <div className="bg-heritage-brown/5 border border-heritage-brown/10 rounded-2xl p-6 space-y-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center space-x-2 py-4 bg-heritage-terracotta hover:bg-heritage-brown text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Check className="w-5 h-5" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsEditing(false); setEditingItem(null); }}
                    className="w-full text-center py-3 border border-heritage-brown/10 hover:bg-white text-heritage-brown/70 hover:text-heritage-brown rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
                  >
                    Cancel Draft
                  </button>
                </div>

                <div className="bg-white border border-heritage-brown/10 rounded-2xl p-6 space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-heritage-brown pb-2 border-b border-heritage-brown/5">
                    Metadata
                  </h4>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-heritage-brown/50">Category</label>
                    <select
                      value={editingItem.category || ''}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                      className="w-full bg-heritage-cream/30 border border-heritage-brown/10 rounded-xl px-3 py-2.5 text-xs text-heritage-brown font-bold focus:outline-none focus:border-heritage-terracotta"
                    >
                      {categories.map(cat => (
                        <option key={cat.slug} value={cat.name}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-heritage-brown/50">Keywords (Comma Separated)</label>
                    <input 
                      type="text"
                      placeholder="e.g. History, Clan, Heritage"
                      value={editingItem.tags?.join(', ') || ''}
                      onChange={(e) => handleInputChange('tags', e.target.value.split(',').map((t: string) => t.trim()).filter(Boolean))}
                      className="w-full bg-heritage-cream/30 border border-heritage-brown/10 rounded-xl px-4 py-2.5 text-xs text-heritage-brown font-bold focus:outline-none focus:border-heritage-terracotta"
                    />
                  </div>
                </div>

                {/* Image upload widget */}
                <div className="bg-white border border-heritage-brown/10 rounded-2xl p-6 space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-heritage-brown pb-2 border-b border-heritage-brown/5">
                    Banner Cover Image
                  </h4>

                  {editingItem.featuredImage ? (
                    <div className="space-y-2">
                      <div className="relative aspect-video rounded-xl overflow-hidden border border-heritage-brown/10">
                        <img src={editingItem.featuredImage} alt="Cover" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleInputChange('featuredImage', '')}
                          className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full hover:bg-black cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <span className="text-[10px] break-all font-mono text-heritage-brown/40">{editingItem.featuredImage}</span>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Drag & drop */}
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
                          imageDragActive ? 'border-heritage-terracotta bg-heritage-terracotta/5' : 'border-heritage-brown/10 hover:bg-heritage-cream/10'
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
                          <div className="flex flex-col items-center space-y-2">
                            <Loader2 className="w-6 h-6 text-heritage-terracotta animate-spin" />
                            <span className="text-[10px] font-black uppercase tracking-wider text-heritage-brown/60">Uploading...</span>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <Plus className="w-6 h-6 text-heritage-brown/30 mx-auto" />
                            <p className="text-xs font-bold text-heritage-brown">Upload Image file</p>
                          </div>
                        )}
                      </div>

                      {/* Direct URL input fallback */}
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase tracking-widest text-heritage-brown/50">Or Paste Image URL</label>
                        <div className="flex gap-2">
                          <input 
                            type="text"
                            placeholder="https://images.unsplash.com..."
                            value={customImageUrl}
                            onChange={(e) => setCustomImageUrl(e.target.value)}
                            className="flex-grow bg-heritage-cream/30 border border-heritage-brown/10 rounded-xl px-3 py-1.5 text-xs text-heritage-brown focus:outline-none focus:border-heritage-terracotta"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (customImageUrl.trim()) {
                                handleInputChange('featuredImage', customImageUrl.trim());
                                setCustomImageUrl('');
                                showNotification('Custom image URL applied!');
                              }
                            }}
                            className="bg-heritage-brown text-white px-3 rounded-xl text-xs font-bold cursor-pointer"
                          >
                            Apply
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

              </div>

            </div>
          </form>
        </div>
      ) : (
        /* Grid table lists */
        <div className="bg-white rounded-[32px] border border-heritage-brown/5 shadow-sm p-6 md:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-heritage-brown/5">
            <div>
              <h2 className="text-xl font-serif font-bold text-heritage-brown">
                {type === 'news' ? 'Kyoga Dispatches (News)' : 'Cultural Heritage Blog'}
              </h2>
              <p className="text-xs text-heritage-brown/50 font-medium">Create and publish community stories</p>
            </div>
            
            <button
              onClick={handleCreateNew}
              className="flex items-center space-x-2 px-5 py-3 bg-heritage-terracotta hover:bg-heritage-brown text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-md active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Create {type === 'news' ? 'Dispatch' : 'Post'}</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-heritage-cream/20 p-4 rounded-2xl border border-heritage-brown/5">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-heritage-brown/30" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-heritage-brown/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-heritage-brown placeholder-heritage-brown/30 font-medium outline-none focus:border-heritage-terracotta"
              />
            </div>

            <div className="flex gap-1 bg-white p-1 rounded-xl border border-heritage-brown/10 overflow-x-auto w-full sm:w-auto">
              <button
                onClick={() => setFilterCategory('All')}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                  filterCategory === 'All' ? 'bg-heritage-terracotta text-white' : 'text-heritage-brown/60 hover:text-heritage-brown'
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.slug}
                  onClick={() => setFilterCategory(cat.name)}
                  className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                    filterCategory === cat.name ? 'bg-heritage-terracotta text-white' : 'text-heritage-brown/60 hover:text-heritage-brown'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-heritage-terracotta animate-spin mb-3" />
              <p className="text-[10px] uppercase font-black tracking-widest text-heritage-brown/40">Refreshing database...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-heritage-brown/5 rounded-[24px]">
              <BookOpen className="w-12 h-12 text-heritage-brown/20 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-heritage-brown">No articles found</h4>
              <p className="text-xs text-heritage-brown/40 max-w-sm mx-auto mt-1">Start writing to populate the archives.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-heritage-brown/10 text-[9px] font-black uppercase tracking-widest text-heritage-brown/40 pb-3">
                    <th className="py-3">Title</th>
                    <th className="py-3 hidden md:table-cell">Author</th>
                    <th className="py-3 hidden lg:table-cell">Category</th>
                    <th className="py-3">Status</th>
                    <th className="py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-heritage-brown/5 text-xs">
                  {filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-heritage-cream/10 transition-colors">
                      <td className="py-4 pr-4 max-w-xs md:max-w-md">
                        <span className="font-bold text-heritage-brown text-sm block truncate">{item.title}</span>
                        <span className="text-[10px] text-heritage-brown/40 font-mono block mt-0.5">{item.slug}</span>
                      </td>
                      <td className="py-4 hidden md:table-cell text-heritage-brown/70 font-semibold">{item.authorName}</td>
                      <td className="py-4 hidden lg:table-cell">
                        <span className="px-2 py-0.5 rounded-full bg-heritage-cream text-heritage-brown/70 font-black text-[9px] uppercase tracking-wider">{item.category}</span>
                      </td>
                      <td className="py-4">
                        <span className={`px-2.5 py-1 rounded-full font-black text-[9px] uppercase tracking-wider flex items-center gap-1 w-fit ${
                          item.status === 'published' ? 'bg-heritage-olive/10 text-heritage-olive' :
                          item.status === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-heritage-brown/10 text-heritage-brown/60'
                        }`}>
                          {item.status === 'published' ? <Check className="w-3 h-3" /> :
                           item.status === 'pending' ? <Clock className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          <span>{item.status}</span>
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Role edit gating */}
                          {(userRole === 'admin' || userRole === 'super_admin' || item.authorId === auth.currentUser?.uid) && (
                            <button
                              onClick={() => handleEdit(item)}
                              className="p-2.5 hover:bg-heritage-terracotta/10 text-heritage-brown/50 hover:text-heritage-terracotta rounded-xl transition-all cursor-pointer"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                          {(userRole === 'admin' || userRole === 'super_admin') && (
                            <button
                              onClick={() => handleDelete(item.id!)}
                              className="p-2.5 hover:bg-red-50 text-heritage-brown/50 hover:text-red-500 rounded-xl transition-all cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
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
