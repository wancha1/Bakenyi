import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit, Trash2, Image as ImageIcon, Loader2, Check, AlertCircle, 
  ArrowLeft, Search, Calendar, X, Type, Upload
} from 'lucide-react';
import { 
  getGalleryAlbums, createGalleryAlbum, updateGalleryAlbum, deleteGalleryAlbum, GalleryAlbum 
} from '../../lib/firebaseContentService';
import { storageService } from '../../services/appwriteServices';

interface GalleryManagerProps {
  userRole: string;
}

export default function GalleryManager({ userRole }: GalleryManagerProps) {
  const [items, setItems] = useState<GalleryAlbum[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Editor State
  const [isEditing, setIsEditing] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<GalleryAlbum> | null>(null);

  // New Image item state
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newImageCaption, setNewImageCaption] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  const canManage = userRole !== 'reporter'; // Editors, Admins, Super Admins can write
  const canDelete = userRole === 'admin' || userRole === 'super_admin';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getGalleryAlbums();
      setItems(data);
    } catch (err: any) {
      setError('Failed to fetch gallery albums.');
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
      showNotification('Access denied. Reporters cannot create albums.', false);
      return;
    }
    setEditingItem({
      title: '',
      description: '',
      images: [],
      createdBy: 'admin'
    });
    setIsEditing(true);
  };

  const handleEdit = (item: GalleryAlbum) => {
    if (!canManage) {
      showNotification('Access denied.', false);
      return;
    }
    setEditingItem({ ...item });
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    if (!canDelete) {
      showNotification('Access denied. Only Admins can delete albums.', false);
      return;
    }
    if (!window.confirm('Are you sure you want to delete this gallery album?')) return;

    setLoading(true);
    try {
      await deleteGalleryAlbum(id);
      showNotification('Deleted successfully.');
      loadData();
    } catch (err: any) {
      showNotification('Delete failed. Verify role permissions.', false);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof GalleryAlbum, value: any) => {
    if (editingItem) {
      setEditingItem({ ...editingItem, [field]: value });
    }
  };

  const handleAddImage = () => {
    if (!newImageUrl.trim()) {
      showNotification('Please enter a valid Image URL or upload a file.', false);
      return;
    }
    if (editingItem) {
      const images = [...(editingItem.images || [])];
      images.push({
        url: newImageUrl.trim(),
        caption: newImageCaption.trim()
      });
      setEditingItem({ ...editingItem, images });
      setNewImageUrl('');
      setNewImageCaption('');
      showNotification('Image added to album draft!');
    }
  };

  const handleRemoveImage = (index: number) => {
    if (editingItem && editingItem.images) {
      const images = [...editingItem.images];
      images.splice(index, 1);
      setEditingItem({ ...editingItem, images });
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      showNotification('Please select a valid image file.', false);
      return;
    }
    setUploadingImage(true);
    try {
      const url = await storageService.uploadFile(file);
      setNewImageUrl(url);
      showNotification('Photo uploaded to storage. Now add a caption and click "Add Photo"');
    } catch (err: any) {
      console.error("Appwrite Storage Upload Error in Gallery:", err);
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
    if (!editingItem.images || editingItem.images.length === 0) {
      showNotification('Please add at least one photo to the album.', false);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title: editingItem.title,
        description: editingItem.description || '',
        images: editingItem.images,
        createdBy: editingItem.createdBy || 'admin'
      };

      if (editingItem.id) {
        await updateGalleryAlbum(editingItem.id, payload);
        showNotification('Album updated successfully.');
      } else {
        await createGalleryAlbum(payload);
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
    (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
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
        <div className="bg-white rounded-[32px] border border-heritage-brown/5 shadow-xl overflow-hidden">
          <div className="bg-heritage-brown text-white p-6 md:p-8">
            <button 
              onClick={() => { setIsEditing(false); setEditingItem(null); }}
              className="flex items-center space-x-2 text-heritage-sand hover:text-white transition-colors text-xs font-bold uppercase tracking-widest cursor-pointer mb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Cancel & Return</span>
            </button>
            <h2 className="text-2xl font-serif font-bold">
              {editingItem.id ? 'Edit Gallery Album' : 'Create Cultural Photo Album'}
            </h2>
          </div>

          <form onSubmit={handleSave} className="p-6 md:p-8 space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left Column inputs */}
              <div className="lg:col-span-7 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-heritage-brown/50">Album Event/Title</label>
                  <input 
                    type="text" 
                    value={editingItem.title || ''}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="e.g. Traditional Bakenyi Canoe Racing 2026"
                    className="w-full bg-heritage-cream/20 border border-heritage-brown/10 rounded-2xl px-5 py-4 text-heritage-brown placeholder-heritage-brown/30 font-bold focus:bg-white focus:border-heritage-terracotta outline-none transition-all"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-heritage-brown/50">Album Description</label>
                  <textarea 
                    value={editingItem.description || ''}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Provide a quick paragraph describing the significance or historical background of this event gallery..."
                    rows={3}
                    className="w-full bg-heritage-cream/20 border border-heritage-brown/10 rounded-2xl p-5 text-heritage-brown placeholder-heritage-brown/30 font-medium focus:bg-white focus:border-heritage-terracotta outline-none transition-all resize-none text-sm leading-relaxed"
                  />
                </div>

                {/* Adding images block */}
                <div className="bg-heritage-cream/10 border border-heritage-brown/5 rounded-2xl p-6 space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-heritage-brown/60">
                    Add Photo to Album
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Select/drag image */}
                    <div className="border border-dashed border-heritage-brown/10 hover:border-heritage-terracotta bg-white p-4 rounded-xl flex flex-col items-center justify-center text-center relative cursor-pointer min-h-[140px]">
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleImageUpload(e.target.files[0]);
                          }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        disabled={uploadingImage}
                      />
                      {uploadingImage ? (
                        <div className="flex flex-col items-center space-y-2">
                          <Loader2 className="w-6 h-6 text-heritage-terracotta animate-spin" />
                          <span className="text-[10px] uppercase font-black tracking-widest text-heritage-brown/40">Uploading...</span>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <Upload className="w-6 h-6 text-heritage-brown/30 mx-auto" />
                          <p className="text-xs font-bold text-heritage-brown">Upload Photo File</p>
                          <span className="text-[9px] text-heritage-brown/40">From computer/camera</span>
                        </div>
                      )}
                    </div>

                    {/* Manual url entry */}
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-heritage-brown/40">Or Image URL</label>
                        <input 
                          type="text" 
                          value={newImageUrl}
                          onChange={(e) => setNewImageUrl(e.target.value)}
                          placeholder="https://images.unsplash.com/..."
                          className="w-full bg-white border border-heritage-brown/10 rounded-xl px-3 py-2 text-xs text-heritage-brown focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-heritage-brown/40">Caption</label>
                        <input 
                          type="text" 
                          value={newImageCaption}
                          onChange={(e) => setNewImageCaption(e.target.value)}
                          placeholder="e.g. Traditional racing boat rowers"
                          className="w-full bg-white border border-heritage-brown/10 rounded-xl px-3 py-2 text-xs text-heritage-brown focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddImage}
                    className="w-full py-3 bg-heritage-brown hover:bg-heritage-terracotta text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer"
                  >
                    Add Photo To Draft List
                  </button>
                </div>
              </div>

              {/* Right Column visual preview grid */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-heritage-brown/5 border border-heritage-brown/10 rounded-2xl p-6 space-y-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center space-x-2 py-4 bg-heritage-terracotta hover:bg-heritage-brown text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Check className="w-5 h-5" /><span>Save Album</span></>}
                  </button>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-widest text-heritage-brown/40">
                    Album Photos Preview ({editingItem.images?.length || 0})
                  </h4>

                  {editingItem.images && editingItem.images.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4 max-h-[460px] overflow-y-auto pr-2">
                      {editingItem.images.map((img, idx) => (
                        <div key={idx} className="bg-white border border-heritage-brown/10 rounded-xl overflow-hidden relative group shadow-sm">
                          <div className="aspect-square relative bg-black/5">
                            <img src={img.url} alt={img.caption} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(idx)}
                              className="absolute top-1.5 right-1.5 p-1 bg-black/60 hover:bg-black text-white rounded-full cursor-pointer transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="p-2.5">
                            <p className="text-[10px] text-heritage-brown/80 font-bold leading-tight line-clamp-2">{img.caption || 'No caption provided'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-20 bg-heritage-cream/10 rounded-2xl border border-dashed border-heritage-brown/5">
                      <ImageIcon className="w-8 h-8 text-heritage-brown/20 mx-auto mb-2" />
                      <p className="text-xs text-heritage-brown/30 font-bold uppercase tracking-wider">No photos added yet</p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </form>
        </div>
      ) : (
        <div className="bg-white rounded-[32px] border border-heritage-brown/5 shadow-sm p-6 md:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-heritage-brown/5">
            <div>
              <h2 className="text-xl font-serif font-bold text-heritage-brown">Heritage Cultural Gallery</h2>
              <p className="text-xs text-heritage-brown/50 font-medium">Capture cultural moments, events, and family historical archives</p>
            </div>
            {canManage && (
              <button
                onClick={handleCreateNew}
                className="flex items-center space-x-2 px-5 py-3 bg-heritage-terracotta hover:bg-heritage-brown text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>Create Album</span>
              </button>
            )}
          </div>

          <div className="relative w-full sm:max-w-md bg-heritage-cream/20 p-2.5 rounded-2xl border border-heritage-brown/5">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-heritage-brown/30" />
            <input
              type="text"
              placeholder="Search albums..."
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
              <ImageIcon className="w-12 h-12 text-heritage-brown/20 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-heritage-brown">No gallery albums yet</h4>
              <p className="text-xs text-heritage-brown/40 max-w-sm mx-auto mt-1">Start creating visual event catalogs to populate the galleries.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map((item) => (
                <div key={item.id} className="bg-heritage-cream/10 border border-heritage-brown/10 rounded-2xl overflow-hidden hover:shadow-md transition-all group flex flex-col justify-between">
                  <div>
                    <div className="aspect-[4/3] relative overflow-hidden bg-black/5">
                      {item.images && item.images[0] ? (
                        <img src={item.images[0].url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-heritage-cream/30 text-heritage-brown/20">
                          <ImageIcon className="w-10 h-10" />
                        </div>
                      )}
                      <div className="absolute top-3 left-3 px-2 py-0.5 rounded bg-heritage-brown text-white font-black text-[9px] uppercase tracking-wider">
                        {item.images?.length || 0} Photos
                      </div>
                    </div>
                    <div className="p-5">
                      <h4 className="font-serif font-bold text-heritage-brown leading-snug text-base mb-1">{item.title}</h4>
                      {item.description && <p className="text-xs text-heritage-brown/60 line-clamp-3 leading-relaxed">{item.description}</p>}
                    </div>
                  </div>

                  {canManage && (
                    <div className="p-5 pt-0">
                      <div className="flex items-center justify-end gap-1.5 pt-3 border-t border-heritage-brown/5">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-2 hover:bg-heritage-terracotta/10 text-heritage-brown/50 hover:text-heritage-terracotta rounded-lg transition-all cursor-pointer"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(item.id!)}
                            className="p-2 hover:bg-red-50 text-heritage-brown/50 hover:text-red-500 rounded-lg transition-all cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
