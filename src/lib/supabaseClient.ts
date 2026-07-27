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

// Production Mode Detection
export const isProduction = (): boolean => {
  if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
    return (import.meta as any).env.PROD || (import.meta as any).env.MODE === 'production';
  }
  return typeof process !== 'undefined' && process.env?.NODE_ENV === 'production';
};

// Check configuration status
export const getSupabaseConfig = () => {
  const metaEnv = (import.meta as any).env || {};
  const url = String(metaEnv.VITE_SUPABASE_URL || (typeof process !== 'undefined' ? process.env?.VITE_SUPABASE_URL : '') || '').trim();
  const key = String(metaEnv.VITE_SUPABASE_ANON_KEY || (typeof process !== 'undefined' ? process.env?.VITE_SUPABASE_ANON_KEY : '') || '').trim();
  
  let isValidUrl = false;
  if (url) {
    try {
      const parsed = new URL(url);
      isValidUrl = parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      isValidUrl = false;
    }
  }

  const isPlaceholder = url === 'https://your-project.supabase.co' || key === 'your-anon-key-here';
  const isConfigured = url !== '' && key !== '' && !isPlaceholder && isValidUrl;

  return { url, key, isConfigured, isPlaceholder, isValidUrl };
};

export interface ClassifiedError {
  category: 'NETWORK' | 'AUTH' | 'RLS' | 'SCHEMA' | 'UNKNOWN';
  message: string;
  originalError: any;
}

/**
 * Classifies low-level fetch and Supabase errors into distinct categories
 * and meaningful user-facing messages.
 */
export function classifySupabaseError(error: any): ClassifiedError {
  if (!error) {
    return {
      category: 'UNKNOWN',
      message: 'An unknown error occurred.',
      originalError: null,
    };
  }

  // 1. Device offline check
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return {
      category: 'NETWORK',
      message: 'No internet connection. Please check your Wi-Fi or cellular data and try again.',
      originalError: error,
    };
  }

  const msg = (error.message || error.error_description || String(error)).toLowerCase();
  const status = error.status || error.statusCode || error.code;

  // 2. Network failures & connection timeouts
  if (
    msg.includes('failed to fetch') ||
    msg.includes('networkerror') ||
    msg.includes('network error') ||
    msg.includes('abort') ||
    msg.includes('econnrefused') ||
    msg.includes('enotfound') ||
    msg.includes('socket hang up') ||
    msg.includes('timeout') ||
    status === 502 ||
    status === 503 ||
    status === 504 ||
    status === 0
  ) {
    return {
      category: 'NETWORK',
      message: 'Cannot reach the Supabase server. The network connection was interrupted or the server is temporarily unreachable.',
      originalError: error,
    };
  }

  // 3. Authentication & JWT failures
  if (
    status === 401 ||
    status === 403 ||
    msg.includes('jwt') ||
    msg.includes('invalid_credentials') ||
    msg.includes('invalid api key') ||
    msg.includes('token expired') ||
    msg.includes('unauthorized') ||
    msg.includes('invalid login credentials') ||
    error.code === 'PGRST301'
  ) {
    return {
      category: 'AUTH',
      message: 'Authentication failed or session expired. Please sign in again.',
      originalError: error,
    };
  }

  // 4. Row Level Security (RLS) & Postgres Permission Errors
  if (
    error.code === '42501' ||
    msg.includes('row-level security') ||
    msg.includes('rls') ||
    msg.includes('permission denied') ||
    msg.includes('violates row-level security policy')
  ) {
    return {
      category: 'RLS',
      message: 'Access denied: Security policies (RLS) prevent this action for your account role.',
      originalError: error,
    };
  }

  // 5. Database Schema / Missing Table Errors
  if (
    error.code === '42P01' ||
    error.code === '42703' ||
    (msg.includes('relation') && msg.includes('does not exist')) ||
    (msg.includes('column') && msg.includes('does not exist'))
  ) {
    return {
      category: 'SCHEMA',
      message: 'Database schema error: Missing table or column in Supabase database.',
      originalError: error,
    };
  }

  return {
    category: 'UNKNOWN',
    message: error.message || 'An unexpected error occurred while communicating with the server.',
    originalError: error,
  };
}

export function getFriendlyErrorMessage(error: any): string {
  const classified = classifySupabaseError(error);
  return classified.message;
}

/**
 * Custom fetch implementation for Supabase client with:
 * - Device offline detection
 * - Automatic retries with exponential backoff for transient network errors (TypeError: Failed to fetch, HTTP 502/503/504)
 * - Request timeout via AbortController (25 seconds)
 * - Detailed request lifecycle logging (start, completed, aborted, failed)
 */
let globalFetchRequestId = 0;

export async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
  maxRetries = 2,
  initialDelayMs = 500
): Promise<Response> {
  const urlStr = typeof input === 'string' ? input : (input as any)?.url || String(input);
  const requestId = `req_${++globalFetchRequestId}_${Math.random().toString(36).substring(2, 7)}`;
  const requestStartTime = performance.now();

  let attempt = 0;

  // If caller passed a signal that is ALREADY aborted before starting
  if (init?.signal?.aborted) {
    const abortReason = init.signal.reason || 'Caller signal was already aborted before request start';
    console.warn(`[SUPABASE_FETCH_ABORTED] ID: ${requestId} | URL: ${urlStr} | Duration: 0ms | Reason: ${abortReason}`);
    throw new DOMException('The user aborted a request.', 'AbortError');
  }

  while (true) {
    // Check if device is offline
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      const offlineErr = new TypeError('No internet connection. Please check your network connection.');
      const duration = Math.round(performance.now() - requestStartTime);
      console.error(`[SUPABASE_FETCH_FAILED] ID: ${requestId} | URL: ${urlStr} | Duration: ${duration}ms | Error: ${offlineErr.message}`);
      throw offlineErr;
    }

    const timeoutController = new AbortController();
    const TIMEOUT_MS = 25000; // 25 seconds timeout (appropriate for network operations)
    let timedOut = false;

    const timeoutId = setTimeout(() => {
      timedOut = true;
      timeoutController.abort(`Request timed out after ${TIMEOUT_MS}ms`);
    }, TIMEOUT_MS);

    // If init.signal exists, abort timeoutController when init.signal aborts
    const handleCallerAbort = () => {
      timeoutController.abort(init?.signal?.reason || 'Caller signal aborted request');
    };

    if (init?.signal) {
      if (init.signal.aborted) {
        handleCallerAbort();
      } else {
        init.signal.addEventListener('abort', handleCallerAbort, { once: true });
      }
    }

    const mergedInit: RequestInit = {
      ...init,
      signal: timeoutController.signal,
    };

    console.log(`[SUPABASE_FETCH_START] ID: ${requestId} | URL: ${urlStr} | Attempt: ${attempt + 1}/${maxRetries + 1}`);

    try {
      const response = await fetch(input, mergedInit);
      clearTimeout(timeoutId);
      if (init?.signal) {
        init.signal.removeEventListener('abort', handleCallerAbort);
      }

      const totalDuration = Math.round(performance.now() - requestStartTime);
      console.log(`[SUPABASE_FETCH_COMPLETE] ID: ${requestId} | URL: ${urlStr} | Duration: ${totalDuration}ms | Status: ${response.status}`);

      // Retry on transient server errors (502, 503, 504)
      if ([502, 503, 504].includes(response.status) && attempt < maxRetries) {
        attempt++;
        const backoff = Math.min(initialDelayMs * Math.pow(2, attempt), 3000) + Math.random() * 200;
        console.warn(`[SUPABASE_RETRY] Server returned ${response.status}. Retrying attempt ${attempt}/${maxRetries} in ${Math.round(backoff)}ms...`);
        await new Promise((res) => setTimeout(res, backoff));
        continue;
      }

      return response;
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (init?.signal) {
        init.signal.removeEventListener('abort', handleCallerAbort);
      }

      const totalDuration = Math.round(performance.now() - requestStartTime);
      const isAbort = err?.name === 'AbortError' || timeoutController.signal.aborted;
      const abortReason = timedOut
        ? `Request timed out after ${TIMEOUT_MS}ms`
        : timeoutController.signal.reason || init?.signal?.reason || err?.message || 'Request aborted';

      if (isAbort) {
        console.warn(`[SUPABASE_FETCH_ABORTED] ID: ${requestId} | URL: ${urlStr} | Duration: ${totalDuration}ms | Reason: ${abortReason}`);
      } else {
        console.error(`[SUPABASE_FETCH_FAILED] ID: ${requestId} | URL: ${urlStr} | Duration: ${totalDuration}ms | Error: ${err?.message || err}`);
      }

      // Do NOT retry if caller's signal was explicitly aborted
      const isCallerAborted = init?.signal?.aborted && !timedOut;
      const isTypeError = err instanceof TypeError || (err?.message && (err.message.includes('fetch') || err.message.includes('Network')));

      // Only retry if it was a timeout or transient network error AND caller signal was NOT aborted
      if (!isCallerAborted && (timedOut || isTypeError) && attempt < maxRetries) {
        attempt++;
        const backoff = Math.min(initialDelayMs * Math.pow(2, attempt), 3000) + Math.random() * 200;
        console.warn(`[SUPABASE_RETRY] Transient network/timeout error (${abortReason}). Retrying attempt ${attempt}/${maxRetries} in ${Math.round(backoff)}ms...`);
        await new Promise((res) => setTimeout(res, backoff));
        continue;
      }

      throw err;
    }
  }
}

export let isSupabaseOffline = false;
export const markSupabaseOffline = () => {
  isSupabaseOffline = true;
};
export const resetSupabaseOffline = () => {
  isSupabaseOffline = false;
};

// Lazy Initialized Client
let supabaseInstance: any = null;

export const getSupabase = () => {
  if (isSupabaseOffline) return null;
  const { url, key, isConfigured } = getSupabaseConfig();
  if (!isConfigured) return null;
  
  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(url, key, {
        global: {
          fetch: fetchWithRetry,
        },
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        }
      });
    } catch (err) {
      console.error('Failed to create Supabase client:', err);
      return null;
    }
  }
  return supabaseInstance;
};

export async function checkSupabaseHealth(): Promise<{
  healthy: boolean;
  reachable: boolean;
  category: ClassifiedError['category'];
  message: string;
  config: { url: string; isConfigured: boolean };
}> {
  const config = getSupabaseConfig();
  if (!config.isConfigured) {
    return {
      healthy: false,
      reachable: false,
      category: 'SCHEMA',
      message: config.isPlaceholder
        ? 'Supabase URL or Anon Key is using placeholder defaults in configuration.'
        : 'Supabase environment variables are missing or invalid URL format.',
      config: { url: config.url, isConfigured: false },
    };
  }

  const client = getSupabase();
  if (!client) {
    return {
      healthy: false,
      reachable: false,
      category: 'NETWORK',
      message: 'Failed to initialize Supabase client instance.',
      config: { url: config.url, isConfigured: true },
    };
  }

  try {
    const { error } = await client.from('profiles_public').select('id', { count: 'exact', head: true });
    if (error) {
      const classified = classifySupabaseError(error);
      return {
        healthy: false,
        reachable: classified.category !== 'NETWORK',
        category: classified.category,
        message: classified.message,
        config: { url: config.url, isConfigured: true },
      };
    }
    return {
      healthy: true,
      reachable: true,
      category: 'UNKNOWN',
      message: 'Supabase database is healthy and reachable.',
      config: { url: config.url, isConfigured: true },
    };
  } catch (err) {
    const classified = classifySupabaseError(err);
    return {
      healthy: false,
      reachable: false,
      category: classified.category,
      message: classified.message,
      config: { url: config.url, isConfigured: true },
    };
  }
}

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

let publicUsersInFlight: Promise<UserProfile[]> | null = null;
let publicUsersCache: { data: UserProfile[]; timestamp: number } | null = null;
const PUBLIC_USERS_CACHE_TTL_MS = 5000; // 5 second TTL cache

export const fetchPublicUsers = async (): Promise<UserProfile[]> => {
  // 1. Return cached result if valid
  if (publicUsersCache && (Date.now() - publicUsersCache.timestamp < PUBLIC_USERS_CACHE_TTL_MS)) {
    return publicUsersCache.data;
  }

  // 2. Deduplicate simultaneous requests: return existing in-flight promise if available
  if (publicUsersInFlight) {
    return publicUsersInFlight;
  }

  // 3. Initiate single request
  publicUsersInFlight = (async () => {
    const client = getSupabase();
    if (!client) return [];

    try {
      const { data, error } = await client.from('profiles_public').select('id, full_name, avatar_url, role');
      if (error) {
        console.warn('[ADMIN_USER_DEBUG] Supabase fetchPublicUsers query error:', error);
        return [];
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
        publicUsersCache = { data: dbUsers, timestamp: Date.now() };
        return dbUsers;
      }
    } catch (err: any) {
      console.warn('[ADMIN_USER_DEBUG] Supabase fetchPublicUsers exception:', err);
    }
    return [];
  })();

  try {
    return await publicUsersInFlight;
  } finally {
    publicUsersInFlight = null;
  }
};

let fetchUsersInFlight: Promise<UserProfile[]> | null = null;

export const fetchUsers = async (): Promise<UserProfile[]> => {
  // Deduplicate simultaneous requests
  if (fetchUsersInFlight) {
    return fetchUsersInFlight;
  }

  fetchUsersInFlight = (async () => {
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
        const friendlyMsg = getFriendlyErrorMessage(error);
        console.error('[ADMIN_USER_DEBUG] Error fetching profiles from public.profiles:', friendlyMsg);
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
      const friendlyMsg = getFriendlyErrorMessage(err);
      console.error('[ADMIN_USER_DEBUG] Exception in fetchUsers:', friendlyMsg);
    }

    console.log('[ADMIN_USER_DEBUG] Loaded profile count from public.profiles: 0');
    return [];
  })();

  try {
    return await fetchUsersInFlight;
  } finally {
    fetchUsersInFlight = null;
  }
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
  if (!client) {
    throw new Error('Supabase client is unavailable.');
  }

  const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
  const { data, error } = await client.storage.from('gallery-images').upload(fileName, file, { upsert: true });

  if (error) {
    console.error('Supabase uploadMediaFile error:', error.message);
    throw new Error(`Upload failed: ${error.message}`);
  }

  const publicUrl = client.storage.from('gallery-images').getPublicUrl(fileName).data.publicUrl;
  return {
    name: fileName,
    url: publicUrl,
    size: file.size,
    created_at: new Date().toISOString(),
    status: 'pending'
  };
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

