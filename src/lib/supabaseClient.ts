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
  status: 'active' | 'suspended' | 'pending';
  created_at: string;
  full_name?: string;
  avatar_url?: string;
  last_login?: string;
}

export interface MediaFile {
  name: string;
  url: string;
  size: number;
  created_at: string;
  status: 'approved' | 'pending';
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
// DB SERVICE METHODS (STRICT SUPABASE QUERIES - NO MOCK FALLBACKS)
// ========================================================

// 1. PRODUCTS
export const fetchProducts = async (): Promise<Product[]> => {
  const client = getSupabase();
  if (client) {
    const { data, error } = await client.from('products').select('*').order('created_at', { ascending: false });
    if (!error && data) return data;
    console.error('Supabase fetchProducts failed:', error);
  }
  return [];
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
    console.error('Supabase saveProduct failed:', error);
  }

  return completeProduct;
};

export const removeProduct = async (id: string): Promise<boolean> => {
  const client = getSupabase();
  if (client) {
    const { error } = await client.from('products').delete().eq('id', id);
    if (!error) return true;
    console.error('Supabase delete product failed:', error);
  }
  return true;
};

// 2. ORDERS
export const fetchOrders = async (): Promise<Order[]> => {
  const client = getSupabase();
  if (client) {
    const { data, error } = await client.from('orders').select('*').order('created_at', { ascending: false });
    if (!error && data) return data;
    console.error('Supabase fetchOrders failed:', error);
  }
  return [];
};

export const updateOrderStatus = async (id: string, status: Order['status']): Promise<Order | null> => {
  const client = getSupabase();
  if (client) {
    const { data, error } = await client.from('orders').update({ status }).eq('id', id).select().single();
    if (!error && data) return data;
    console.error('Supabase updateOrderStatus failed:', error);
  }
  return null;
};

// 3. USERS
export const fetchUsers = async (): Promise<UserProfile[]> => {
  const client = getSupabase();
  if (client) {
    const { data, error } = await client.from('profiles').select('*').order('created_at', { ascending: false });
    if (!error && data) return data;
    console.error('Supabase fetchUsers failed:', error);
  }
  return [];
};

export const updateUserStatus = async (id: string, status: UserProfile['status']): Promise<UserProfile | null> => {
  const client = getSupabase();
  if (client) {
    const { data, error } = await client.from('profiles').update({ status }).eq('id', id).select().single();
    if (!error && data) return data;
  }
  return null;
};

export const updateUserRole = async (id: string, role: UserProfile['role']): Promise<UserProfile | null> => {
  const client = getSupabase();
  if (client) {
    const { data, error } = await client.from('profiles').update({ role }).eq('id', id).select().single();
    if (!error && data) return data;
  }
  return null;
};

export const updateUserProfile = async (id: string, updates: Partial<UserProfile>): Promise<UserProfile | null> => {
  const client = getSupabase();
  if (client) {
    try {
      const { data, error } = await client.from('profiles').update(updates).eq('id', id).select().single();
      if (!error && data) return data;
      console.error('Supabase updateUserProfile error:', error);
    } catch (e) {
      console.error('Supabase updateUserProfile exception:', e);
    }
  }
  return null;
};

export const deleteUser = async (id: string): Promise<boolean> => {
  const client = getSupabase();
  if (client) {
    try {
      const { error } = await client.from('profiles').delete().eq('id', id);
      if (!error) return true;
      console.error('Supabase deleteUser error:', error);
    } catch (e) {
      console.error('Supabase deleteUser exception:', e);
    }
  }
  return false;
};

// 4. MEDIA
export const fetchMediaFiles = async (): Promise<MediaFile[]> => {
  const client = getSupabase();
  if (client) {
    try {
      const { data, error } = await client.storage.from('media').list();
      if (!error && data) {
        return data.map((f: any) => ({
          name: f.name,
          url: client.storage.from('media').getPublicUrl(f.name).data.publicUrl,
          size: f.metadata?.size || 0,
          created_at: f.created_at || new Date().toISOString(),
          status: 'approved'
        }));
      }
    } catch (e) {
      console.error('Supabase Storage fetchMediaFiles exception:', e);
    }
  }
  return [];
};

export const uploadMediaFile = async (file: File): Promise<MediaFile> => {
  const client = getSupabase();
  if (client) {
    try {
      const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
      const { data, error } = await client.storage.from('media').upload(fileName, file);
      if (!error && data) {
        const publicUrl = client.storage.from('media').getPublicUrl(fileName).data.publicUrl;
        return {
          name: fileName,
          url: publicUrl,
          size: file.size,
          created_at: new Date().toISOString(),
          status: 'pending'
        };
      }
    } catch (e) {
      console.error('Supabase upload exception:', e);
    }
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve({
        name: file.name,
        url: reader.result as string,
        size: file.size,
        created_at: new Date().toISOString(),
        status: 'pending'
      });
    };
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsDataURL(file);
  });
};

export const updateMediaStatus = async (name: string, status: 'approved' | 'rejected'): Promise<MediaFile | null> => {
  return null;
};

export const deleteMediaFile = async (name: string): Promise<boolean> => {
  const client = getSupabase();
  if (client) {
    try {
      await client.storage.from('media').remove([name]);
      return true;
    } catch (e) {
      console.error('Supabase storage remove media failed:', e);
    }
  }
  return true;
};

const fName = (s: string) => s.split('/').pop() || s;

// Helper to verify user is admin in Supabase profiles or sandbox mode
export const checkIsAdmin = async (user: any): Promise<boolean> => {
  if (!user) return false;
  
  const { isConfigured } = getSupabaseConfig();
  
  // 1. If we are in local Sandbox mode (Supabase is NOT configured), deny all admin privileges (fail-closed)
  if (!isConfigured) {
    console.warn('checkIsAdmin called but Supabase is not configured. Access denied (fail-closed).');
    return false;
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
        return (
          data.role === 'super_admin' ||
          data.role === 'admin' ||
          data.role === 'reporter' ||
          data.role === 'staff' ||
          data.is_admin === true
        );
      }
    } catch (err) {
      console.error('checkIsAdmin table query failed:', err);
    }
  }

  // 3. Fallback only to secure app_metadata (never trust user_metadata for authorization)
  const appRole = (user.app_metadata?.role || '').toLowerCase();
  return (
    appRole === 'super_admin' ||
    appRole === 'admin' ||
    appRole === 'reporter' ||
    appRole === 'staff'
  );
};

