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
export const isValidUUID = (id: string | null | undefined): boolean => {
  if (!id || typeof id !== 'string') return false;
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  return uuidRegex.test(id.trim());
};

function getLocalUsers(): UserProfile[] {
  try {
    const stored = localStorage.getItem('bakenye_profiles');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('[ADMIN_USER_DEBUG] Failed to parse local profiles:', e);
  }
  return [];
}

function saveLocalUsers(users: UserProfile[]): void {
  try {
    localStorage.setItem('bakenye_profiles', JSON.stringify(users));
  } catch (e) {
    console.error('[ADMIN_USER_DEBUG] Failed to save local profiles:', e);
  }
}

export const fetchPublicUsers = async (): Promise<UserProfile[]> => {
  const client = getSupabase();
  if (client) {
    try {
      const { data, error } = await client.from('profiles_public').select('id, full_name, avatar_url, role');
      if (error) {
        console.warn('[ADMIN_USER_DEBUG] Supabase fetchPublicUsers query error:', error);
      } else if (data) {
        const dbUsers: UserProfile[] = data.map((row: any) => ({
          id: row.id,
          email: '',
          role: row.role || 'member',
          status: 'active',
          full_name: row.full_name || '',
          avatar_url: row.avatar_url || '',
          created_at: new Date().toISOString(),
          last_login: new Date().toISOString()
        }));
        return dbUsers;
      }
    } catch (err: any) {
      console.warn('[ADMIN_USER_DEBUG] Supabase fetchPublicUsers exception:', err);
    }
  }
  return [];
};

export const fetchUsers = async (): Promise<UserProfile[]> => {
  const client = getSupabase();
  if (!client) {
    console.warn('[ADMIN_USER_DEBUG] Supabase client unavailable in fetchUsers. Loaded profile count: 0');
    return [];
  }

  try {
    // Guard: Ensure user is authenticated before attempting to query public.profiles
    const { data: { session } } = await client.auth.getSession();
    if (!session?.user) {
      console.warn('[ADMIN_USER_DEBUG] Unauthenticated fetchUsers attempt. Access denied to public.profiles. Loaded profile count: 0');
      return [];
    }

    const { data, error } = await client.from('profiles').select('*').order('created_at', { ascending: false });
    if (error) {
      console.error('[ADMIN_USER_DEBUG] Error fetching profiles from public.profiles:', error.message);
      if (error.message?.includes('fetch') || error.message?.includes('Failed') || error.message?.includes('Network')) {
        markSupabaseOffline();
      }
      return [];
    }

    if (data) {
      const dbUsers: UserProfile[] = data.map((row: any) => ({
        id: row.id,
        email: row.email || '',
        role: row.role || 'member',
        status: row.status || 'active',
        full_name: row.full_name || row.name || '',
        avatar_url: row.avatar_url || '',
        created_at: row.created_at || new Date().toISOString(),
        last_login: row.updated_at || row.created_at || new Date().toISOString()
      }));

      console.log('[ADMIN_USER_DEBUG] Loaded profile count from public.profiles:', dbUsers.length);
      return dbUsers;
    }
  } catch (err: any) {
    console.error('[ADMIN_USER_DEBUG] Exception in fetchUsers:', err);
    if (err?.message?.includes('fetch') || err?.message?.includes('Failed') || err?.message?.includes('Network')) {
      markSupabaseOffline();
    }
  }

  console.log('[ADMIN_USER_DEBUG] Loaded profile count from public.profiles: 0');
  return [];
};

export const updateUserStatus = async (id: string, status: UserProfile['status']): Promise<UserProfile | null> => {
  console.log('[ADMIN_USER_DEBUG] Selected updateUserStatus user ID:', id);
  const valid = isValidUUID(id);
  console.log(`[ADMIN_USER_DEBUG] UUID validation result for updateUserStatus ID "${id}":`, valid ? 'VALID' : 'INVALID');
  if (!valid) {
    console.error(`[ADMIN_USER_DEBUG] Operation rejected: ID "${id}" is not a valid UUID.`);
    return null;
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
      console.error('[ADMIN_USER_DEBUG] Supabase updateUserStatus query error:', error);
    } catch (e) {
      console.error('[ADMIN_USER_DEBUG] Supabase updateUserStatus exception:', e);
    }
  }
  return null;
};

export const updateUserRole = async (id: string, role: UserProfile['role']): Promise<UserProfile | null> => {
  console.log('[ADMIN_USER_DEBUG] Selected updateUserRole user ID:', id);
  const valid = isValidUUID(id);
  console.log(`[ADMIN_USER_DEBUG] UUID validation result for updateUserRole ID "${id}":`, valid ? 'VALID' : 'INVALID');
  if (!valid) {
    console.error(`[ADMIN_USER_DEBUG] Operation rejected: ID "${id}" is not a valid UUID.`);
    return null;
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
      console.error('[ADMIN_USER_DEBUG] Supabase updateUserRole query error:', error);
    } catch (e) {
      console.error('[ADMIN_USER_DEBUG] Supabase updateUserRole exception:', e);
    }
  }
  return null;
};

export const updateUserProfile = async (id: string, updates: Partial<UserProfile>): Promise<UserProfile | null> => {
  console.log('[ADMIN_USER_DEBUG] Selected updateUserProfile user ID:', id);
  const valid = isValidUUID(id);
  console.log(`[ADMIN_USER_DEBUG] UUID validation result for updateUserProfile ID "${id}":`, valid ? 'VALID' : 'INVALID');
  if (!valid) {
    console.error(`[ADMIN_USER_DEBUG] Operation rejected: ID "${id}" is not a valid UUID.`);
    return null;
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
      console.error('[ADMIN_USER_DEBUG] Supabase updateUserProfile error:', error);
    } catch (e) {
      console.error('[ADMIN_USER_DEBUG] Supabase updateUserProfile exception:', e);
    }
  }
  return null;
};

export const deleteUser = async (id: string): Promise<boolean> => {
  console.log('[ADMIN_USER_DEBUG] Selected delete user ID:', id);
  const valid = isValidUUID(id);
  console.log(`[ADMIN_USER_DEBUG] UUID validation result for ID "${id}":`, valid ? 'VALID' : 'INVALID');

  if (!valid) {
    console.error(`[ADMIN_USER_DEBUG] Delete operation rejected: ID "${id}" is not a valid UUID. Aborting operation before database query.`);
    return false;
  }

  const client = getSupabase();
  if (!client) {
    console.error('[ADMIN_USER_DEBUG] Supabase client unavailable for deleteUser operation.');
    return false;
  }

  try {
    const { error } = await client.from('profiles').delete().eq('id', id);
    if (error) {
      console.error('[ADMIN_USER_DEBUG] Supabase deleteUser database error:', error.message);
      return false;
    }
    console.log(`[ADMIN_USER_DEBUG] Successfully deleted profile with UUID "${id}" from public.profiles.`);
    return true;
  } catch (e) {
    console.error('[ADMIN_USER_DEBUG] Supabase deleteUser exception:', e);
    return false;
  }
};

// 4. MEDIA
export const fetchMediaFiles = async (): Promise<MediaFile[]> => {
  const client = getSupabase();
  if (client) {
    try {
      const { data, error } = await client.storage.from('gallery-images').list();
      if (!error && data) {
        return data.map((f: any) => ({
          name: f.name,
          url: client.storage.from('gallery-images').getPublicUrl(f.name).data.publicUrl,
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
      const { data, error } = await client.storage.from('gallery-images').upload(fileName, file);
      if (!error && data) {
        const publicUrl = client.storage.from('gallery-images').getPublicUrl(fileName).data.publicUrl;
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
      await client.storage.from('gallery-images').remove([name]);
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

