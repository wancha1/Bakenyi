import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  X, 
  Filter, 
  Loader2, 
  CheckCircle, 
  FolderPlus,
  PackagePlus,
  Camera,
  Layers
} from 'lucide-react';
import { fetchProducts, saveProduct, removeProduct, Product } from '../../../lib/supabaseClient';

export default function ProductsView() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Form State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formStock, setFormStock] = useState('');
  const [formCategory, setFormCategory] = useState('Cosmetics');
  const [formStatus, setFormStatus] = useState<'active' | 'draft' | 'out_of_stock'>('active');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [isSubmitting, setIsFormSubmitting] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    filterAndSearchProducts();
  }, [products, search, categoryFilter, statusFilter]);

  async function loadProducts() {
    setIsLoading(true);
    try {
      const data = await fetchProducts();
      setProducts(data);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setIsLoading(false);
    }
  }

  function filterAndSearchProducts() {
    let result = [...products];

    // Search
    if (search.trim()) {
      const query = search.toLowerCase();
      result = result.filter(
        p => p.name.toLowerCase().includes(query) || p.description.toLowerCase().includes(query)
      );
    }

    // Category
    if (categoryFilter !== 'All') {
      result = result.filter(p => p.category === categoryFilter);
    }

    // Status
    if (statusFilter !== 'All') {
      result = result.filter(p => p.status === statusFilter);
    }

    setFilteredProducts(result);
  }

  // Categories present in dataset
  const categories = ['All', 'Cosmetics', 'Home Decor', 'Beverages', 'Fashion'];

  // Handle Edit Trigger
  function openEditModal(product: Product) {
    setEditingProduct(product);
    setFormName(product.name);
    setFormDescription(product.description);
    setFormPrice(product.price.toString());
    setFormStock(product.stock.toString());
    setFormCategory(product.category);
    setFormStatus(product.status);
    setFormImageUrl(product.image_url);
    setIsModalOpen(true);
  }

  // Handle New Trigger
  function openAddModal() {
    setEditingProduct(null);
    setFormName('');
    setFormDescription('');
    setFormPrice('');
    setFormStock('');
    setFormCategory('Cosmetics');
    setFormStatus('active');
    setFormImageUrl('');
    setIsModalOpen(true);
  }

  // Handle Delete
  async function handleDelete(id: string) {
    if (window.confirm('Are you sure you want to permanently delete this product?')) {
      try {
        await removeProduct(id);
        setProducts(prev => prev.filter(p => p.id !== id));
      } catch (err) {
        console.error('Failed to delete product:', err);
      }
    }
  }

  // Handle Submit
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formName || !formPrice || !formStock) {
      alert('Please fill out all required fields.');
      return;
    }

    setIsFormSubmitting(true);
    const payload: Omit<Product, 'id'> & { id?: string } = {
      name: formName,
      description: formDescription,
      price: parseFloat(formPrice) || 0,
      stock: parseInt(formStock) || 0,
      category: formCategory,
      status: parseInt(formStock) === 0 ? 'out_of_stock' : formStatus,
      image_url: formImageUrl || 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&q=80&w=400',
    };

    if (editingProduct) {
      payload.id = editingProduct.id;
    }

    try {
      const saved = await saveProduct(payload as any);
      
      setProducts(prev => {
        const list = [...prev];
        const idx = list.findIndex(p => p.id === saved.id);
        if (idx !== -1) {
          list[idx] = saved;
        } else {
          list.unshift(saved);
        }
        return list;
      });

      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to save product:', err);
      alert('Error saving product.');
    } finally {
      setIsFormSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-sans">Products</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-sans">
            Add, update, and monitor shop listing inventories.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-indigo-600/10 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Product</span>
        </button>
      </div>

      {/* Control Filters Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        {/* Search */}
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-200"
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full md:w-36 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 dark:text-slate-300"
          >
            {categories.map(c => (
              <option key={c} value={c}>
                {c === 'All' ? 'All Categories' : c}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full md:w-36 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 dark:text-slate-300"
          >
            <option value="All">All Statuses</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>
        </div>
      </div>

      {/* Main Table Block */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col justify-center items-center h-72 space-y-2">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            <span className="text-xs text-slate-400 dark:text-slate-500">Querying product data...</span>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 text-slate-400 dark:text-slate-500 space-y-2">
            <Search className="w-10 h-10 mx-auto opacity-50" />
            <p className="text-sm font-semibold">No products found</p>
            <p className="text-xs">Try adjusting your filters or search keywords.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700/40 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  <th className="p-4 w-16">Item</th>
                  <th className="p-4">Details</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Inventory</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-center w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/50 dark:divide-slate-700/30 text-xs">
                {filteredProducts.map((p) => {
                  const statusColors = {
                    active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300',
                    draft: 'bg-slate-100 text-slate-600 dark:bg-slate-700/30 dark:text-slate-400',
                    out_of_stock: 'bg-rose-100 text-rose-800 dark:bg-rose-950/30 dark:text-rose-300'
                  };

                  return (
                    <tr key={p.id} className="text-slate-600 dark:text-slate-300 hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                      <td className="p-4">
                        <img 
                          src={p.image_url} 
                          alt={p.name} 
                          className="w-11 h-11 object-cover rounded-xl border dark:border-slate-700 shadow-sm"
                          referrerPolicy="no-referrer"
                        />
                      </td>
                      <td className="p-4 space-y-0.5">
                        <div className="font-bold text-slate-900 dark:text-white text-sm leading-tight">{p.name}</div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 line-clamp-1 max-w-sm">{p.description}</div>
                      </td>
                      <td className="p-4 font-semibold text-slate-700 dark:text-slate-300">{p.category}</td>
                      <td className="p-4 font-bold text-slate-900 dark:text-white">${p.price.toFixed(2)}</td>
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className={`font-bold ${p.stock < 15 ? 'text-amber-500' : 'text-slate-800 dark:text-slate-200'}`}>
                            {p.stock} units
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {p.stock === 0 ? 'Out of Stock' : p.stock < 15 ? 'Low Stock' : 'Good Stock'}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${statusColors[p.status]}`}>
                          {p.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openEditModal(p)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg cursor-pointer transition-colors"
                            title="Edit"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg cursor-pointer transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit / Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/40">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-500" />
                <h3 className="text-base font-bold text-slate-800 dark:text-white font-sans">
                  {editingProduct ? 'Edit Product Record' : 'Add New Product Listing'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Scrollable Wrapper */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              {/* Product Name */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-600 dark:text-slate-400 block">Product Name *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g., Cold-Pressed Shea Butter"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-200 font-medium"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-600 dark:text-slate-400 block">Description</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Explain benefits, usage instructions, ingredients..."
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-200 font-medium"
                />
              </div>

              {/* Row: Category, Price, Stock */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Category */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-600 dark:text-slate-400 block">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-200 font-bold"
                  >
                    <option value="Cosmetics">Cosmetics</option>
                    <option value="Home Decor">Home Decor</option>
                    <option value="Beverages">Beverages</option>
                    <option value="Fashion">Fashion</option>
                  </select>
                </div>

                {/* Price */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-600 dark:text-slate-400 block">Price (USD) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    placeholder="e.g., 24.99"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-200 font-bold"
                  />
                </div>

                {/* Stock */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-600 dark:text-slate-400 block">Stock Level *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value)}
                    placeholder="e.g., 45"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-200 font-bold"
                  />
                </div>
              </div>

              {/* Image URL */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-600 dark:text-slate-400 block">Featured Image URL</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={formImageUrl}
                    onChange={(e) => setFormImageUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-200 font-medium"
                  />
                  {formImageUrl && (
                    <img 
                      src={formImageUrl} 
                      alt="Preview" 
                      className="w-9 h-9 object-cover rounded-lg border dark:border-slate-700 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  )}
                </div>
              </div>

              {/* Listing Status */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-600 dark:text-slate-400 block">Listing Status</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-700 dark:text-slate-300">
                    <input
                      type="radio"
                      name="formStatus"
                      checked={formStatus === 'active'}
                      onChange={() => setFormStatus('active')}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Active (Visible to public)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-700 dark:text-slate-300">
                    <input
                      type="radio"
                      name="formStatus"
                      checked={formStatus === 'draft'}
                      onChange={() => setFormStatus('draft')}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Draft (Admin internal)</span>
                  </label>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-1 shadow-sm shadow-indigo-600/10 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>{editingProduct ? 'Save Changes' : 'Create Listing'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
