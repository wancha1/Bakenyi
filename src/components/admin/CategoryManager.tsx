import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, Tag, Loader2, Check, AlertCircle, Search 
} from 'lucide-react';
import { 
  getCategories, createCategory, deleteCategory, CategoryItem 
} from '../../lib/firebaseContentService';

interface CategoryManagerProps {
  userRole: string;
}

export default function CategoryManager({ userRole }: CategoryManagerProps) {
  const [items, setItems] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Form states
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const canManage = userRole === 'admin' || userRole === 'super_admin';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getCategories();
      setItems(data);
    } catch (err: any) {
      setError('Failed to fetch categories.');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) {
      showNotification('Access denied. Only Admins can manage categories.', false);
      return;
    }
    if (!newName.trim()) {
      showNotification('Category Name is required.', false);
      return;
    }

    setLoading(true);
    try {
      const slug = newName.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').trim();
      await createCategory({
        name: newName.trim(),
        slug,
        description: newDesc.trim() || `Articles regarding Bakenyi ${newName}`
      });
      setNewName('');
      setNewDesc('');
      showNotification('Category created successfully!');
      loadData();
    } catch (err: any) {
      showNotification('Failed to create category.', false);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!canManage) {
      showNotification('Access denied.', false);
      return;
    }
    if (!window.confirm('Are you sure you want to delete this category?')) return;

    setLoading(true);
    try {
      await deleteCategory(id);
      showNotification('Category deleted successfully.');
      loadData();
    } catch (err: any) {
      showNotification('Delete failed. Verify role permissions.', false);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Creator Form */}
        {canManage && (
          <div className="lg:col-span-5 bg-white border border-heritage-brown/10 rounded-[32px] p-6 md:p-8 shadow-sm h-fit space-y-6">
            <div>
              <h3 className="text-lg font-serif font-bold text-heritage-brown">Create Category</h3>
              <p className="text-xs text-heritage-brown/50 font-medium">Add taxonomies to classify articles</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-heritage-brown/50">Category Name</label>
                <input 
                  type="text"
                  placeholder="e.g. Traditional Food"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-heritage-cream/20 border border-heritage-brown/10 rounded-2xl px-4 py-3 text-xs text-heritage-brown font-bold focus:outline-none focus:border-heritage-terracotta"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-heritage-brown/50">Description</label>
                <textarea 
                  placeholder="e.g. Customs, culinary recipes, and fish types prepared by the Bakenyi people"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  rows={4}
                  className="w-full bg-heritage-cream/20 border border-heritage-brown/10 rounded-2xl px-4 py-3 text-xs text-heritage-brown font-medium focus:outline-none focus:border-heritage-terracotta resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-heritage-terracotta hover:bg-heritage-brown text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer flex justify-center items-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" /><span>Save Category</span></>}
              </button>
            </form>
          </div>
        )}

        {/* Categories List */}
        <div className={`${canManage ? 'lg:col-span-7' : 'lg:col-span-12'} bg-white border border-heritage-brown/10 rounded-[32px] p-6 md:p-8 shadow-sm space-y-6`}>
          <div>
            <h2 className="text-xl font-serif font-bold text-heritage-brown">Classification taxonomies</h2>
            <p className="text-xs text-heritage-brown/50 font-medium">Classify your News and Blogs publications</p>
          </div>

          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-heritage-brown/30" />
            <input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-heritage-cream/20 border border-heritage-brown/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-heritage-brown placeholder-heritage-brown/30 font-medium outline-none"
            />
          </div>

          {loading && items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-heritage-terracotta animate-spin mb-3" />
              <p className="text-[10px] uppercase font-black tracking-widest text-heritage-brown/40 font-bold">Refreshing list...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-heritage-brown/5 rounded-[24px]">
              <Tag className="w-12 h-12 text-heritage-brown/20 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-heritage-brown">No categories found</h4>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredItems.map(item => (
                <div key={item.id} className="flex justify-between items-center p-4 bg-heritage-cream/10 border border-heritage-brown/5 rounded-2xl">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Tag className="w-3.5 h-3.5 text-heritage-terracotta" />
                      <span className="text-sm font-bold text-heritage-brown">{item.name}</span>
                    </div>
                    <p className="text-[11px] text-heritage-brown/60 leading-normal">{item.description}</p>
                    <span className="text-[9px] text-heritage-brown/40 font-mono">slug: {item.slug}</span>
                  </div>

                  {canManage && (
                    <button
                      onClick={() => handleDelete(item.id!)}
                      className="p-2.5 hover:bg-red-50 text-heritage-brown/40 hover:text-red-500 rounded-xl transition-all cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
