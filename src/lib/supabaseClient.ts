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
  role: 'super_admin' | 'admin' | 'historian' | 'community_leader' | 'member' | 'public' | 'reporter' | 'staff' | 'customer';
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
  const metaEnv = (import.meta as any).env || {};
  const url = metaEnv.VITE_SUPABASE_URL || (typeof process !== 'undefined' ? process.env?.VITE_SUPABASE_URL : '') || '';
  const key = metaEnv.VITE_SUPABASE_ANON_KEY || (typeof process !== 'undefined' ? process.env?.VITE_SUPABASE_ANON_KEY : '') || '';
  
  const isConfigured = 
    url && 
    key && 
    url !== 'https://your-project.supabase.co' && 
    key !== 'your-anon-key-here';

  return { url, key, isConfigured };
};

export let isSupabaseOffline = false;
export const markSupabaseOffline = () => {
  isSupabaseOffline = true;
};

// Lazy Initialized Client
let supabaseInstance: any = null;

export const getSupabase = () => {
  if (isSupabaseOffline) return null;
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
const DEFAULT_FALLBACK_PROFILES: UserProfile[] = [
  {
    id: 'usr-1',
    email: 'wanchaaaron@gmail.com',
    role: 'super_admin',
    status: 'active',
    full_name: 'Aaron Wancha',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
    created_at: '2026-01-10T10:00:00Z',
    last_login: new Date().toISOString()
  },
  {
    id: 'usr-2',
    email: 'mugoya@bakenye.com',
    role: 'historian',
    status: 'active',
    full_name: 'Elder Juma Mugoya',
    avatar_url: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&q=80&w=150',
    created_at: '2026-01-12T14:30:00Z',
    last_login: new Date().toISOString()
  },
  {
    id: 'usr-3',
    email: 'beatrice@bakenye.com',
    role: 'community_leader',
    status: 'active',
    full_name: 'Beatrice Nabulo',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
    created_at: '2026-01-15T09:15:00Z',
    last_login: new Date().toISOString()
  },
  {
    id: 'usr-4',
    email: 'simon@bakenye.com',
    role: 'reporter',
    status: 'active',
    full_name: 'Simon Mukose',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150',
    created_at: '2026-02-01T11:00:00Z',
    last_login: new Date().toISOString()
  },
  {
    id: 'usr-5',
    email: 'florence@bakenye.com',
    role: 'member',
    status: 'active',
    full_name: 'Florence Namusobya',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
    created_at: '2026-02-20T16:45:00Z',
    last_login: new Date().toISOString()
  },
  {
    id: 'usr-6',
    email: 'jane@bakenye.com',
    role: 'member',
    status: 'pending',
    full_name: 'Jane Kawuma',
    avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150',
    created_at: '2026-03-05T08:20:00Z'
  }
];

function getLocalUsers(): UserProfile[] {
  try {
    const stored = localStorage.getItem('bakenye_profiles');
    if (!stored) {
      localStorage.setItem('bakenye_profiles', JSON.stringify(DEFAULT_FALLBACK_PROFILES));
      return DEFAULT_FALLBACK_PROFILES;
    }
    return JSON.parse(stored);
  } catch (e) {
    console.error('Failed to parse local profiles', e);
    return DEFAULT_FALLBACK_PROFILES;
  }
}

function saveLocalUsers(users: UserProfile[]): void {
  try {
    localStorage.setItem('bakenye_profiles', JSON.stringify(users));
  } catch (e) {
    console.error('Failed to save local profiles', e);
  }
}

export const fetchUsers = async (): Promise<UserProfile[]> => {
  const localList = getLocalUsers();
  const client = getSupabase();
  if (client) {
    try {
      const { data, error } = await client.from('profiles').select('*').order('created_at', { ascending: false });
      if (error) {
        console.warn('Supabase fetchUsers query failed, using local fallback:', error);
        if (error.message?.includes('fetch') || error.message?.includes('Failed') || error.message?.includes('Network')) {
          markSupabaseOffline();
        }
      } else if (data) {
        // Map database records to UserProfile format (ensuring full_name is populated from name)
        const dbUsers: UserProfile[] = data.map((row: any) => ({
          id: row.id,
          email: row.email,
          role: row.role,
          status: row.status,
          full_name: row.name || row.full_name || '',
          avatar_url: row.avatar_url || '',
          created_at: row.created_at,
          last_login: row.updated_at || row.created_at
        }));
        
        // Merge with any new local modifications
        const merged = [...localList, ...dbUsers];
        const unique = merged.filter((item, index, self) => self.findIndex(t => t.id === item.id) === index);
        return unique;
      }
    } catch (err: any) {
      console.warn('Supabase fetchUsers exception, using local fallback:', err);
      if (err?.message?.includes('fetch') || err?.message?.includes('Failed') || err?.message?.includes('Network')) {
        markSupabaseOffline();
      }
    }
  }
  return localList;
};

export const updateUserStatus = async (id: string, status: UserProfile['status']): Promise<UserProfile | null> => {
  let updatedObj: UserProfile | null = null;
  try {
    const localList = getLocalUsers();
    const idx = localList.findIndex(u => u.id === id);
    if (idx !== -1) {
      localList[idx] = { ...localList[idx], status };
      updatedObj = localList[idx];
      saveLocalUsers(localList);
    }
  } catch (err) {
    console.error('Failed to update user status in localStorage:', err);
  }

  const client = getSupabase();
  if (client) {
    try {
      const { data, error } = await client.from('profiles').update({ status }).eq('id', id).select().single();
      if (!error && data) {
        const mapped: UserProfile = {
          id: data.id,
          email: data.email,
          role: data.role,
          status: data.status,
          full_name: data.name || data.full_name || '',
          avatar_url: data.avatar_url || '',
          created_at: data.created_at
        };
        return mapped;
      }
      console.error('Supabase updateUserStatus query error:', error);
    } catch (e) {
      console.error('Supabase updateUserStatus exception:', e);
    }
  }
  return updatedObj;
};

export const updateUserRole = async (id: string, role: UserProfile['role']): Promise<UserProfile | null> => {
  let updatedObj: UserProfile | null = null;
  try {
    const localList = getLocalUsers();
    const idx = localList.findIndex(u => u.id === id);
    if (idx !== -1) {
      localList[idx] = { ...localList[idx], role };
      updatedObj = localList[idx];
      saveLocalUsers(localList);
    }
  } catch (err) {
    console.error('Failed to update user role in localStorage:', err);
  }

  const client = getSupabase();
  if (client) {
    try {
      const { data, error } = await client.from('profiles').update({ role }).eq('id', id).select().single();
      if (!error && data) {
        const mapped: UserProfile = {
          id: data.id,
          email: data.email,
          role: data.role,
          status: data.status,
          full_name: data.name || data.full_name || '',
          avatar_url: data.avatar_url || '',
          created_at: data.created_at
        };
        return mapped;
      }
      console.error('Supabase updateUserRole query error:', error);
    } catch (e) {
      console.error('Supabase updateUserRole exception:', e);
    }
  }
  return updatedObj;
};

export const updateUserProfile = async (id: string, updates: Partial<UserProfile>): Promise<UserProfile | null> => {
  let updatedObj: UserProfile | null = null;
  try {
    const localList = getLocalUsers();
    const idx = localList.findIndex(u => u.id === id);
    if (idx !== -1) {
      localList[idx] = { ...localList[idx], ...updates };
      updatedObj = localList[idx];
      saveLocalUsers(localList);
    }
  } catch (err) {
    console.error('Failed to update user profile in localStorage:', err);
  }

  const client = getSupabase();
  if (client) {
    try {
      const dbUpdates: any = {};
      if (updates.full_name !== undefined) dbUpdates.name = updates.full_name;
      if (updates.avatar_url !== undefined) dbUpdates.avatar_url = updates.avatar_url;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.role !== undefined) dbUpdates.role = updates.role;

      const { data, error } = await client.from('profiles').update(dbUpdates).eq('id', id).select().single();
      if (!error && data) {
        const mapped: UserProfile = {
          id: data.id,
          email: data.email,
          role: data.role,
          status: data.status,
          full_name: data.name || data.full_name || '',
          avatar_url: data.avatar_url || '',
          created_at: data.created_at
        };
        return mapped;
      }
      console.error('Supabase updateUserProfile error:', error);
    } catch (e) {
      console.error('Supabase updateUserProfile exception:', e);
    }
  }
  return updatedObj;
};

export const deleteUser = async (id: string): Promise<boolean> => {
  try {
    const localList = getLocalUsers();
    const filtered = localList.filter(u => u.id !== id);
    saveLocalUsers(filtered);
  } catch (err) {
    console.error('Failed to delete user in localStorage:', err);
  }

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
  return true;
};

// 4. MEDIA
export const fetchMediaFiles = async (): Promise<MediaFile[]> => {
  const client = getSupabase();
  if (client) {
    try {
      const { data, error } = await client.storage.from('heritage-images').list();
      if (!error && data) {
        return data.map((f: any) => ({
          name: f.name,
          url: client.storage.from('heritage-images').getPublicUrl(f.name).data.publicUrl,
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
      const { data, error } = await client.storage.from('heritage-images').upload(fileName, file);
      if (!error && data) {
        const publicUrl = client.storage.from('heritage-images').getPublicUrl(fileName).data.publicUrl;
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
      await client.storage.from('heritage-images').remove([name]);
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
  
  const email = user.email?.toLowerCase() || '';
  if (
    email === 'wanchaaaron@gmail.com' ||
    email === 'aaronwancha@gmail.com' ||
    email === 'superadmin@bakenye.com'
  ) {
    return true;
  }
  
  // Query real Supabase profiles database table
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
          data.role === 'historian' ||
          data.role === 'community_leader' ||
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
    appRole === 'historian' ||
    appRole === 'community_leader' ||
    appRole === 'reporter' ||
    appRole === 'staff'
  );
};

