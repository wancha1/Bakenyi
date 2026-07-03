import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit, Trash2, Youtube, Loader2, Check, AlertCircle, 
  ArrowLeft, Search, Calendar, Link
} from 'lucide-react';
import { 
  getVlogs, createVlog, updateVlog, deleteVlog, VlogItem 
} from '../../lib/firebaseContentService';

interface VlogsManagerProps {
  userRole: string;
}

export default function VlogsManager({ userRole }: VlogsManagerProps) {
  const [items, setItems] = useState<VlogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Editor State
  const [isEditing, setIsEditing] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<VlogItem> | null>(null);

  const canManage = userRole === 'admin' || userRole === 'super_admin';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getVlogs();
      setItems(data);
    } catch (err: any) {
      setError('Failed to fetch video logs from the database.');
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
    if (!canManage) {
      showNotification('Access denied. Only Admins can manage vlogs.', false);
      return;
    }
    setEditingItem({
      title: '',
      thumbnailImage: '',
      youtubeUrl: '',
      description: '',
      publishDate: new Date().toISOString().split('T')[0]
    });
    setIsEditing(true);
  };

  const handleEdit = (item: VlogItem) => {
    if (!canManage) {
      showNotification('Access denied. Only Admins can manage vlogs.', false);
      return;
    }
    setEditingItem({ ...item });
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    if (!canManage) {
      showNotification('Access denied. Only Admins can delete vlogs.', false);
      return;
    }
    if (!window.confirm('Are you sure you want to delete this vlog entry?')) return;

    setLoading(true);
    try {
      await deleteVlog(id);
      showNotification('Deleted successfully.');
      loadData();
    } catch (err: any) {
      showNotification('Delete failed. Verify role permissions.', false);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof VlogItem, value: any) => {
    if (editingItem) {
      const updated = { ...editingItem, [field]: value };
      if (field === 'youtubeUrl') {
        // Try to auto-derive a high quality YouTube thumbnail if not custom set
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = value.match(regExp);
        if (match && match[2] && match[2].length === 11) {
          const videoId = match[2];
          updated.thumbnailImage = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
        }
      }
      setEditingItem(updated);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    if (!editingItem.title?.trim()) {
      showNotification('Title is required.', false);
      return;
    }
    if (!editingItem.youtubeUrl?.trim()) {
      showNotification('YouTube URL is required.', false);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title: editingItem.title,
        thumbnailImage: editingItem.thumbnailImage || 'https://images.unsplash.com/photo-1461151304267-38535e780c79?auto=format&fit=crop&q=80&w=800',
        youtubeUrl: editingItem.youtubeUrl,
        description: editingItem.description || '',
        publishDate: editingItem.publishDate || new Date().toISOString()
      };

      if (editingItem.id) {
        await updateVlog(editingItem.id, payload);
        showNotification('Video updated successfully.');
      } else {
        await createVlog(payload);
        showNotification('Created successfully.');
      }
      setIsEditing(false);
      setEditingItem(null);
      loadData();
    } catch (err: any) {
      showNotification('Operation denied. Permission constraints in place.', false);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter(item => 
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <div className="bg-white rounded-[32px] border border-heritage-brown/5 shadow-xl overflow-hidden max-w-3xl mx-auto">
          <div className="bg-heritage-brown text-white p-6 md:p-8">
            <button 
              onClick={() => { setIsEditing(false); setEditingItem(null); }}
              className="flex items-center space-x-2 text-heritage-sand hover:text-white transition-colors text-xs font-bold uppercase tracking-widest cursor-pointer mb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Cancel & Return</span>
            </button>
            <h2 className="text-2xl font-serif font-bold">
              {editingItem.id ? 'Edit Vlog Entry' : 'Publish New Vlog'}
            </h2>
          </div>

          <form onSubmit={handleSave} className="p-6 md:p-8 space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-heritage-brown/50">Vlog Title</label>
              <input 
                type="text" 
                value={editingItem.title || ''}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="e.g. Traditional Canoeing Ceremony on Lake Kyoga"
                className="w-full bg-heritage-cream/20 border border-heritage-brown/10 rounded-2xl px-5 py-4 text-heritage-brown placeholder-heritage-brown/30 font-bold focus:bg-white focus:border-heritage-terracotta outline-none transition-all"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-heritage-brown/50">YouTube Link</label>
                <div className="relative">
                  <Youtube className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-red-600" />
                  <input 
                    type="url" 
                    value={editingItem.youtubeUrl || ''}
                    onChange={(e) => handleInputChange('youtubeUrl', e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full bg-heritage-cream/20 border border-heritage-brown/10 rounded-2xl pl-11 pr-5 py-4 text-heritage-brown placeholder-heritage-brown/30 font-bold focus:bg-white focus:border-heritage-terracotta outline-none transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-heritage-brown/50">Publish Date</label>
                <input 
                  type="date" 
                  value={editingItem.publishDate ? editingItem.publishDate.split('T')[0] : ''}
                  onChange={(e) => handleInputChange('publishDate', e.target.value)}
                  className="w-full bg-heritage-cream/20 border border-heritage-brown/10 rounded-2xl px-5 py-4 text-heritage-brown font-bold focus:bg-white focus:border-heritage-terracotta outline-none transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-heritage-brown/50">Thumbnail Image URL</label>
              <input 
                type="text" 
                value={editingItem.thumbnailImage || ''}
                onChange={(e) => handleInputChange('thumbnailImage', e.target.value)}
                placeholder="Derived automatically from youtube URL or enter manual"
                className="w-full bg-heritage-cream/20 border border-heritage-brown/10 rounded-2xl px-5 py-4 text-heritage-brown placeholder-heritage-brown/30 font-semibold focus:bg-white focus:border-heritage-terracotta outline-none transition-all"
              />
              {editingItem.thumbnailImage && (
                <div className="aspect-video w-full max-w-sm rounded-xl overflow-hidden border border-heritage-brown/10 mt-2">
                  <img src={editingItem.thumbnailImage} alt="Thumbnail preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-heritage-brown/50">Vlog Description</label>
              <textarea 
                value={editingItem.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Tell users what this video vlog shares about the Bakenyi values..."
                rows={4}
                className="w-full bg-heritage-cream/20 border border-heritage-brown/10 rounded-2xl p-5 text-heritage-brown placeholder-heritage-brown/30 font-medium focus:bg-white focus:border-heritage-terracotta outline-none transition-all resize-none text-sm leading-relaxed"
              />
            </div>

            <div className="flex gap-4 pt-4 border-t border-heritage-brown/5 justify-end">
              <button
                type="button"
                onClick={() => { setIsEditing(false); setEditingItem(null); }}
                className="px-5 py-3 border border-heritage-brown/10 hover:bg-heritage-cream/10 text-heritage-brown/70 hover:text-heritage-brown rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center space-x-2 px-6 py-3 bg-heritage-terracotta hover:bg-heritage-brown text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4" /><span>Save Vlog</span></>}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-white rounded-[32px] border border-heritage-brown/5 shadow-sm p-6 md:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-heritage-brown/5">
            <div>
              <h2 className="text-xl font-serif font-bold text-heritage-brown">Video Log Archives (Vlogs)</h2>
              <p className="text-xs text-heritage-brown/50 font-medium">Link, organize, and showcase Bakenyi cultural documentary content</p>
            </div>
            {canManage && (
              <button
                onClick={handleCreateNew}
                className="flex items-center space-x-2 px-5 py-3 bg-heritage-terracotta hover:bg-heritage-brown text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>Link Vlog</span>
              </button>
            )}
          </div>

          <div className="relative w-full sm:max-w-md bg-heritage-cream/20 p-2.5 rounded-2xl border border-heritage-brown/5">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-heritage-brown/30" />
            <input
              type="text"
              placeholder="Search vlogs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-heritage-brown/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-heritage-brown placeholder-heritage-brown/30 font-medium outline-none focus:border-heritage-terracotta"
            />
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-heritage-terracotta animate-spin mb-3" />
              <p className="text-[10px] uppercase font-black tracking-widest text-heritage-brown/40">Refreshing archives...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-heritage-brown/5 rounded-[24px]">
              <Youtube className="w-12 h-12 text-heritage-brown/20 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-heritage-brown">No vlogs linked</h4>
              <p className="text-xs text-heritage-brown/40 max-w-sm mx-auto mt-1">Start linking heritage video logs to showcase them to subscribers.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map((item) => (
                <div key={item.id} className="bg-heritage-cream/10 border border-heritage-brown/10 rounded-2xl overflow-hidden hover:shadow-md transition-all group">
                  <div className="aspect-video relative overflow-hidden bg-black">
                    <img src={item.thumbnailImage} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute top-3 left-3 px-2 py-0.5 rounded bg-red-600 text-white font-black text-[9px] uppercase tracking-wider flex items-center gap-1">
                      <Youtube className="w-3 h-3" />
                      <span>YouTube</span>
                    </div>
                  </div>
                  <div className="p-5 space-y-3">
                    <div>
                      <span className="text-[10px] text-heritage-brown/40 font-mono flex items-center gap-1 mb-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(item.publishDate).toLocaleDateString()}
                      </span>
                      <h4 className="font-serif font-bold text-heritage-brown leading-snug line-clamp-2">{item.title}</h4>
                    </div>
                    
                    <p className="text-xs text-heritage-brown/60 line-clamp-3 leading-relaxed">{item.description}</p>
                    
                    {canManage && (
                      <div className="flex items-center justify-end gap-1.5 pt-3 border-t border-heritage-brown/5">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-2 hover:bg-heritage-terracotta/10 text-heritage-brown/50 hover:text-heritage-terracotta rounded-lg transition-all cursor-pointer"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id!)}
                          className="p-2 hover:bg-red-50 text-heritage-brown/50 hover:text-red-500 rounded-lg transition-all cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
