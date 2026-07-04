import { createClient } from '@supabase/supabase-js';

// Types for production E-Commerce
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  stock: number;
  status: 'active' | 'draft' | 'out_of_stock';
  created_at?: string;
}

export interface Order {
  id: string;
  customer_name: string;
  customer_email: string;
  total_amount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  items_count: number;
  created_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  role: 'admin' | 'staff' | 'customer';
  status: 'active' | 'suspended';
  created_at: string;
}

export interface MediaFile {
  name: string;
  url: string;
  size: number;
  created_at: string;
}

// Check configuration status
export const getSupabaseConfig = () => {
  const url = (import.meta as any).env.VITE_SUPABASE_URL || '';
  const key = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || '';
  
  const isConfigured = 
    url && 
    key && 
    url !== 'https://your-project.supabase.co' && 
    key !== 'your-anon-key-here';

  return { url, key, isConfigured };
};

// Lazy Initialized Client
let supabaseInstance: any = null;

export const getSupabase = () => {
  const { url, key, isConfigured } = getSupabaseConfig();
  if (!isConfigured) return null;
  
  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(url, key);
    } catch (err) {
      console.error('Failed to create Supabase client:', err);
      return null;
    }
  }
  return supabaseInstance;
};

// ========================================================
// DEMO/SANDBOX FALLBACK DATA (For when client keys aren't set)
// ========================================================

const getDemoProducts = (): Product[] => {
  const stored = localStorage.getItem('bakenye_demo_products');
  if (stored) return JSON.parse(stored);
  
  const initial: Product[] = [
    {
      id: 'p-1',
      name: 'Organic Ugandan Shea Butter',
      description: '100% pure cold-pressed unrefined shea butter sourced from northern Uganda. Deeply moisturizing and rich in vitamins.',
      price: 24.99,
      image_url: 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?auto=format&fit=crop&q=80&w=400',
      category: 'Cosmetics',
      stock: 45,
      status: 'active',
      created_at: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: 'p-2',
      name: 'Bakenye Handmade Craft Basket',
      description: 'Intricately woven traditional basket made from natural sisal and papyrus fibers by local artisans.',
      price: 35.00,
      image_url: 'https://images.unsplash.com/photo-1531835551805-16d864c8d311?auto=format&fit=crop&q=80&w=400',
      category: 'Home Decor',
      stock: 12,
      status: 'active',
      created_at: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: 'p-3',
      name: 'Single-Origin Arabica Coffee (500g)',
      description: 'Medium roast Mount Elgon Arabica coffee beans. Rich chocolate aroma with a subtle citrus acidity.',
      price: 18.50,
      image_url: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&q=80&w=400',
      category: 'Beverages',
      stock: 80,
      status: 'active',
      created_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: 'p-4',
      name: 'Heritage Barkcloth Handbag',
      description: 'Eco-friendly designer bag crafted from authentic mutuba tree barkcloth, trimmed with vegan leather.',
      price: 65.00,
      image_url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=400',
      category: 'Fashion',
      stock: 0,
      status: 'out_of_stock',
      created_at: new Date(Date.now() - 22 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: 'p-5',
      name: 'Organic Dried Hibiscus Flowers (Tea)',
      description: 'Sun-dried Ugandan roselle calyces, ideal for brewing rich antioxidant-loaded herbal teas.',
      price: 9.99,
      image_url: 'https://images.unsplash.com/photo-1506368249639-73a05d6f6488?auto=format&fit=crop&q=80&w=400',
      category: 'Beverages',
      stock: 120,
      status: 'draft',
      created_at: new Date().toISOString()
    }
  ];
  localStorage.setItem('bakenye_demo_products', JSON.stringify(initial));
  return initial;
};

const getDemoOrders = (): Order[] => {
  const stored = localStorage.getItem('bakenye_demo_orders');
  if (stored) return JSON.parse(stored);
  
  const initial: Order[] = [
    {
      id: 'ord-8831',
      customer_name: 'Sarah Nakimera',
      customer_email: 'sarah.nak@example.com',
      total_amount: 59.98,
      status: 'delivered',
      items_count: 2,
      created_at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: 'ord-8832',
      customer_name: 'John Mukasa',
      customer_email: 'j.mukasa@example.org',
      total_amount: 35.00,
      status: 'processing',
      items_count: 1,
      created_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString()
    },
    {
      id: 'ord-8833',
      customer_name: 'Aaron Wanch',
      customer_email: 'wanchaaaron@gmail.com',
      total_amount: 104.50,
      status: 'pending',
      items_count: 3,
      created_at: new Date(Date.now() - 20 * 3600 * 1000).toISOString()
    },
    {
      id: 'ord-8834',
      customer_name: 'Florence Nabakooza',
      customer_email: 'florence@example.com',
      total_amount: 18.50,
      status: 'shipped',
      items_count: 1,
      created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: 'ord-8835',
      customer_name: 'David Ochieng',
      customer_email: 'david.och@example.net',
      total_amount: 215.00,
      status: 'cancelled',
      items_count: 4,
      created_at: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString()
    }
  ];
  localStorage.setItem('bakenye_demo_orders', JSON.stringify(initial));
  return initial;
};

const getDemoUsers = (): UserProfile[] => {
  const stored = localStorage.getItem('bakenye_demo_users');
  if (stored) return JSON.parse(stored);
  
  const initial: UserProfile[] = [
    {
      id: 'usr-1',
      email: 'wanchaaaron@gmail.com',
      role: 'admin',
      status: 'active',
      created_at: new Date(Date.now() - 100 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: 'usr-2',
      email: 'sarah.nak@example.com',
      role: 'customer',
      status: 'active',
      created_at: new Date(Date.now() - 12 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: 'usr-3',
      email: 'j.mukasa@example.org',
      role: 'customer',
      status: 'active',
      created_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: 'usr-4',
      email: 'jane.staff@bakenye.com',
      role: 'staff',
      status: 'active',
      created_at: new Date(Date.now() - 40 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: 'usr-5',
      email: 'malicious.spammer@trash.com',
      role: 'customer',
      status: 'suspended',
      created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString()
    }
  ];
  localStorage.setItem('bakenye_demo_users', JSON.stringify(initial));
  return initial;
};

const getDemoMedia = (): MediaFile[] => {
  const stored = localStorage.getItem('bakenye_demo_media');
  if (stored) return JSON.parse(stored);
  
  const initial: MediaFile[] = [
    {
      name: 'ugandan_shea_butter.jpg',
      url: 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?auto=format&fit=crop&q=80&w=400',
      size: 142050,
      created_at: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString()
    },
    {
      name: 'handmade_basket.jpg',
      url: 'https://images.unsplash.com/photo-1531835551805-16d864c8d311?auto=format&fit=crop&q=80&w=400',
      size: 210540,
      created_at: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString()
    },
    {
      name: 'arabica_coffee_beans.jpg',
      url: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&q=80&w=400',
      size: 180320,
      created_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString()
    },
    {
      name: 'barkcloth_designer_bag.jpg',
      url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=400',
      size: 345110,
      created_at: new Date(Date.now() - 22 * 24 * 3600 * 1000).toISOString()
    }
  ];
  localStorage.setItem('bakenye_demo_media', JSON.stringify(initial));
  return initial;
};

// ========================================================
// DB SERVICE METHODS (BRIDGED REAL AND SANDBOX MODES)
// ========================================================

// 1. PRODUCTS
export const fetchProducts = async (): Promise<Product[]> => {
  const client = getSupabase();
  if (client) {
    const { data, error } = await client.from('products').select('*').order('created_at', { ascending: false });
    if (!error && data) return data;
    console.error('Supabase fetchProducts failed, loading sandbox:', error);
  }
  return getDemoProducts();
};

export const saveProduct = async (product: Omit<Product, 'id'> & { id?: string }): Promise<Product> => {
  const client = getSupabase();
  const id = product.id || 'p-' + Math.random().toString(36).substr(2, 9);
  const completeProduct: Product = {
    ...product,
    id,
    created_at: product.created_at || new Date().toISOString()
  } as Product;

  if (client) {
    const { data, error } = await client.from('products').upsert(completeProduct).select().single();
    if (!error && data) return data;
    console.error('Supabase saveProduct failed, writing to sandbox:', error);
  }

  // Sandbox Save
  const list = getDemoProducts();
  const index = list.findIndex(p => p.id === id);
  if (index !== -1) {
    list[index] = completeProduct;
  } else {
    list.unshift(completeProduct);
  }
  localStorage.setItem('bakenye_demo_products', JSON.stringify(list));
  return completeProduct;
};

export const removeProduct = async (id: string): Promise<boolean> => {
  const client = getSupabase();
  if (client) {
    const { error } = await client.from('products').delete().eq('id', id);
    if (!error) return true;
    console.error('Supabase delete product failed, deleting from sandbox:', error);
  }

  const list = getDemoProducts();
  const filtered = list.filter(p => p.id !== id);
  localStorage.setItem('bakenye_demo_products', JSON.stringify(filtered));
  return true;
};

// 2. ORDERS
export const fetchOrders = async (): Promise<Order[]> => {
  const client = getSupabase();
  if (client) {
    const { data, error } = await client.from('orders').select('*').order('created_at', { ascending: false });
    if (!error && data) return data;
    console.error('Supabase fetchOrders failed, loading sandbox:', error);
  }
  return getDemoOrders();
};

export const updateOrderStatus = async (id: string, status: Order['status']): Promise<Order | null> => {
  const client = getSupabase();
  if (client) {
    const { data, error } = await client.from('orders').update({ status }).eq('id', id).select().single();
    if (!error && data) return data;
    console.error('Supabase updateOrderStatus failed:', error);
  }

  const list = getDemoOrders();
  const index = list.findIndex(o => o.id === id);
  if (index !== -1) {
    list[index].status = status;
    localStorage.setItem('bakenye_demo_orders', JSON.stringify(list));
    return list[index];
  }
  return null;
};

// 3. USERS
export const fetchUsers = async (): Promise<UserProfile[]> => {
  const client = getSupabase();
  if (client) {
    // Queries profiles table or auth users list proxy (if secure setup)
    const { data, error } = await client.from('profiles').select('*').order('created_at', { ascending: false });
    if (!error && data) return data;
    console.error('Supabase fetchUsers failed, loading sandbox:', error);
  }
  return getDemoUsers();
};

export const updateUserStatus = async (id: string, status: UserProfile['status']): Promise<UserProfile | null> => {
  const client = getSupabase();
  if (client) {
    const { data, error } = await client.from('profiles').update({ status }).eq('id', id).select().single();
    if (!error && data) return data;
  }
  
  const list = getDemoUsers();
  const index = list.findIndex(u => u.id === id);
  if (index !== -1) {
    list[index].status = status;
    localStorage.setItem('bakenye_demo_users', JSON.stringify(list));
    return list[index];
  }
  return null;
};

// 4. MEDIA
export const fetchMediaFiles = async (): Promise<MediaFile[]> => {
  const client = getSupabase();
  if (client) {
    try {
      // Fetch files from Supabase Storage media bucket
      const { data, error } = await client.storage.from('media').list();
      if (!error && data) {
        return data.map((f: any) => ({
          name: f.name,
          url: client.storage.from('media').getPublicUrl(f.name).data.publicUrl,
          size: f.metadata?.size || 0,
          created_at: f.created_at || new Date().toISOString()
        }));
      }
    } catch (e) {
      console.error('Supabase Storage fetchMediaFiles exception, loading sandbox:', e);
    }
  }
  return getDemoMedia();
};

export const uploadMediaFile = async (file: File): Promise<MediaFile> => {
  const client = getSupabase();
  if (client) {
    try {
      const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
      const { data, error } = await client.storage.from('media').upload(fileName, file);
      if (!error && data) {
        const publicUrl = client.storage.from('media').getPublicUrl(fileName).data.publicUrl;
        const newMedia: MediaFile = {
          name: fileName,
          url: publicUrl,
          size: file.size,
          created_at: new Date().toISOString()
        };
        // Log inside standard lists
        const list = getDemoMedia();
        list.unshift(newMedia);
        localStorage.setItem('bakenye_demo_media', JSON.stringify(list));
        return newMedia;
      }
    } catch (e) {
      console.error('Supabase upload exception:', e);
    }
  }

  // Sandbox reader
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const newMedia: MediaFile = {
        name: file.name,
        url: reader.result as string,
        size: file.size,
        created_at: new Date().toISOString()
      };
      const list = getDemoMedia();
      list.unshift(newMedia);
      localStorage.setItem('bakenye_demo_media', JSON.stringify(list));
      resolve(newMedia);
    };
    reader.onerror = () => reject(new Error('Failed to read and store file in sandbox.'));
    reader.readAsDataURL(file);
  });
};

export const deleteMediaFile = async (name: string): Promise<boolean> => {
  const client = getSupabase();
  if (client) {
    try {
      await client.storage.from('media').remove([name]);
    } catch (e) {
      console.error('Supabase storage remove media failed:', e);
    }
  }

  const list = getDemoMedia();
  const filtered = list.filter(m => fName(m.name) !== fName(name));
  localStorage.setItem('bakenye_demo_media', JSON.stringify(filtered));
  return true;
};

const fName = (s: string) => s.split('/').pop() || s;

// Helper to verify user is admin in Supabase profiles or sandbox mode
export const checkIsAdmin = async (user: any): Promise<boolean> => {
  if (!user) return false;
  
  // 1. Bypass sandbox/known admin accounts immediately
  const email = user.email?.toLowerCase() || '';
  if (
    email === 'admin@bakenye.com' || 
    email === 'admin@bakenyi.org' || 
    email === 'wanchaaaron@gmail.com'
  ) {
    return true;
  }

  // 2. Query real Supabase profiles database table
  const client = getSupabase();
  if (client) {
    try {
      const { data, error } = await client
        .from('profiles')
        .select('role, is_admin')
        .eq('id', user.id)
        .single();
      
      if (!error && data) {
        return data.role === 'admin' || data.is_admin === true;
      }
    } catch (err) {
      console.error('checkIsAdmin table query failed:', err);
    }
  }

  // 3. Metadata or profile key fallback
  return (
    user.role === 'admin' || 
    user.user_metadata?.role === 'admin' || 
    user.app_metadata?.role === 'admin'
  );
};

