import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Article } from '../types/article';
import { bakenyiArticles } from '../data/articlesData';

// Retrieve environment variables
const SUPABASE_URL = (import.meta as any).env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = (): boolean => {
  try {
    if (typeof SUPABASE_URL !== 'string' || typeof SUPABASE_ANON_KEY !== 'string') {
      return false;
    }
    const url = SUPABASE_URL.trim();
    const key = SUPABASE_ANON_KEY.trim();
    
    if (url === '' || key === '') {
      return false;
    }
    
    // Prevent using placeholder strings from default templates
    if (url.includes('placeholder') || url.includes('your-supabase') || key.includes('placeholder') || key.includes('your-supabase')) {
      return false;
    }
    
    // Ensure it is a valid HTTP or HTTPS URL
    return url.startsWith('http://') || url.startsWith('https://');
  } catch {
    return false;
  }
};

// Initialize real Supabase client if credentials are provided with a safe fallback
const initSupabaseClient = (): SupabaseClient | null => {
  if (!isSupabaseConfigured()) {
    return null;
  }
  try {
    return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } catch (err) {
    console.warn('Supabase initialization failed, falling back to local sandbox emulation:', err);
    return null;
  }
};

export const supabase: SupabaseClient | null = initSupabaseClient();

// ==========================================
// MOCK / EMULATION LAYER FOR OFFLINE-FIRST
// ==========================================

const EMULATED_ARTICLES_KEY = 'supabase_emulated_articles';
const EMULATED_AUTH_KEY = 'supabase_emulated_session';

// Initialize emulated articles with static data if local storage is empty
const getEmulatedArticles = (): Article[] => {
  const stored = localStorage.getItem(EMULATED_ARTICLES_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse emulated articles from localStorage', e);
    }
  }
  
  // Seed with static articles (all marked as published by default)
  const seeded = bakenyiArticles.map(art => ({
    ...art,
    status: art.status || 'published'
  }));
  localStorage.setItem(EMULATED_ARTICLES_KEY, JSON.stringify(seeded));
  return seeded;
};

const saveEmulatedArticles = (articles: Article[]) => {
  localStorage.setItem(EMULATED_ARTICLES_KEY, JSON.stringify(articles));
};

// Interface for Emulated User Session
export interface EmulatedUser {
  id: string;
  email: string;
  role: 'admin' | 'public';
}

// ==========================================
// UNIFIED AUTHENTICATION SERVICES
// ==========================================

export async function signIn(email: string, password: string): Promise<{ user: any; error: Error | null }> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return { user: data.user, error: null };
    } catch (err: any) {
      return { user: null, error: new Error(err.message || 'Supabase authentication failed.') };
    }
  } else {
    // Emulated Auth: check if password matches a standard mock admin pass
    // This allows the user to log in instantly with any admin-looking email (e.g. admin@bakenyi.org) and password 'admin123'
    if (email.includes('admin') && password === 'admin123') {
      const mockUser: EmulatedUser = {
        id: 'emulated-admin-uuid-123456',
        email,
        role: 'admin'
      };
      localStorage.setItem(EMULATED_AUTH_KEY, JSON.stringify(mockUser));
      return { user: mockUser, error: null };
    } else {
      return { 
        user: null, 
        error: new Error('Invalid Admin credentials. (Hint: Use email with "admin" and password "admin123" for local sandbox access.)') 
      };
    }
  }
}

export async function signOut(): Promise<{ error: Error | null }> {
  if (isSupabaseConfigured() && supabase) {
    const { error } = await supabase.auth.signOut();
    return { error: error ? new Error(error.message) : null };
  } else {
    localStorage.removeItem(EMULATED_AUTH_KEY);
    return { error: null };
  }
}

export async function getCurrentUser(): Promise<any> {
  if (isSupabaseConfigured() && supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } else {
    const stored = localStorage.getItem(EMULATED_AUTH_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return null;
      }
    }
    return null;
  }
}

// ==========================================
// UNIFIED DATABASE & ARTICLES SERVICES
// ==========================================

/**
 * Fetches all articles from either Supabase or the emulated database.
 * @param onlyPublished If true, only returns articles with status === 'published'.
 */
export async function getArticles(onlyPublished = true): Promise<Article[]> {
  if (isSupabaseConfigured() && supabase) {
    try {
      let query = supabase
        .from('articles')
        .select('*')
        .order('publishedAt', { ascending: false });

      if (onlyPublished) {
        query = query.eq('status', 'published');
      }

      const { data, error } = await query;
      if (error) throw error;
      
      // If table exists but is empty, fallback or seed it
      if (!data || data.length === 0) {
        // Return emulated articles as a helpful default
        const emulated = getEmulatedArticles();
        return onlyPublished ? emulated.filter(a => a.status === 'published') : emulated;
      }

      return data as Article[];
    } catch (err) {
      console.warn('Failed to fetch from real Supabase database, falling back to local storage', err);
      const emulated = getEmulatedArticles();
      return onlyPublished ? emulated.filter(a => a.status === 'published') : emulated;
    }
  } else {
    const emulated = getEmulatedArticles();
    const sorted = [...emulated].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    return onlyPublished ? sorted.filter(a => a.status === 'published') : sorted;
  }
}

/**
 * Fetches an article by its ID.
 */
export async function getArticleById(id: string): Promise<Article | null> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Article;
    } catch (err) {
      console.warn(`Failed to fetch article ${id} from Supabase, looking in local storage`, err);
      const emulated = getEmulatedArticles();
      return emulated.find(a => a.id === id) || null;
    }
  } else {
    const emulated = getEmulatedArticles();
    return emulated.find(a => a.id === id) || null;
  }
}

/**
 * Creates a new article in the database.
 */
export async function createArticle(article: Omit<Article, 'id'>): Promise<{ data: Article | null; error: Error | null }> {
  const generatedId = article.title.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || `article-${Date.now()}`;

  const newArticle: Article = {
    ...article,
    id: generatedId,
    views: article.views || 0,
    publishedAt: article.publishedAt || new Date().toISOString().split('T')[0],
    status: article.status || 'draft'
  };

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('articles')
        .insert([newArticle])
        .select()
        .single();

      if (error) throw error;
      return { data: data as Article, error: null };
    } catch (err: any) {
      console.warn('Failed to insert article in Supabase, saving locally instead:', err);
      // Fallback local insert
      const emulated = getEmulatedArticles();
      emulated.unshift(newArticle);
      saveEmulatedArticles(emulated);
      return { data: newArticle, error: null };
    }
  } else {
    const emulated = getEmulatedArticles();
    // Check if ID already exists, if so append unique timestamp
    let finalId = generatedId;
    if (emulated.some(a => a.id === finalId)) {
      finalId = `${generatedId}-${Date.now().toString().slice(-4)}`;
    }
    const finalArticle = { ...newArticle, id: finalId };
    emulated.unshift(finalArticle);
    saveEmulatedArticles(emulated);
    return { data: finalArticle, error: null };
  }
}

/**
 * Updates an existing article.
 */
export async function updateArticle(id: string, articleUpdates: Partial<Article>): Promise<{ data: Article | null; error: Error | null }> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('articles')
        .update(articleUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data: data as Article, error: null };
    } catch (err: any) {
      console.warn(`Failed to update article ${id} on Supabase, saving locally instead`, err);
      const emulated = getEmulatedArticles();
      const idx = emulated.findIndex(a => a.id === id);
      if (idx !== -1) {
        emulated[idx] = { ...emulated[idx], ...articleUpdates };
        saveEmulatedArticles(emulated);
        return { data: emulated[idx], error: null };
      }
      return { data: null, error: new Error('Article not found to update.') };
    }
  } else {
    const emulated = getEmulatedArticles();
    const idx = emulated.findIndex(a => a.id === id);
    if (idx !== -1) {
      emulated[idx] = { ...emulated[idx], ...articleUpdates };
      saveEmulatedArticles(emulated);
      return { data: emulated[idx], error: null };
    }
    return { data: null, error: new Error('Article not found.') };
  }
}

/**
 * Deletes an article from the database.
 */
export async function deleteArticle(id: string): Promise<{ success: boolean; error: Error | null }> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { error } = await supabase
        .from('articles')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true, error: null };
    } catch (err: any) {
      console.warn(`Failed to delete article ${id} on Supabase, deleting locally instead`, err);
      const emulated = getEmulatedArticles();
      const filtered = emulated.filter(a => a.id !== id);
      saveEmulatedArticles(filtered);
      return { success: true, error: null };
    }
  } else {
    const emulated = getEmulatedArticles();
    const filtered = emulated.filter(a => a.id !== id);
    saveEmulatedArticles(filtered);
    return { success: true, error: null };
  }
}

// ==========================================
// UNIFIED STORAGE SERVICES
// ==========================================

/**
 * Uploads a file (featured image or PDF) to Supabase Storage.
 * If Supabase is not configured, it reads the file as a Base64 data URL 
 * so it remains fully functional and previewable locally.
 */
export async function uploadMedia(file: File, type: 'images' | 'pdfs'): Promise<{ url: string; error: Error | null }> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const bucketName = type === 'images' ? 'featured-images' : 'pdf-attachments';
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload file to bucket
      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      if (!data?.publicUrl) {
        throw new Error('Failed to retrieve the uploaded media public URL');
      }

      return { url: data.publicUrl, error: null };
    } catch (err: any) {
      console.warn('Real Supabase Storage upload failed, falling back to local file emulation:', err);
      return emulateFileUpload(file);
    }
  } else {
    return emulateFileUpload(file);
  }
}

// Emulates storage by reading the file into a base64 Data URL
async function emulateFileUpload(file: File): Promise<{ url: string; error: Error | null }> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve({ url: reader.result as string, error: null });
    };
    reader.onerror = () => {
      resolve({ url: '', error: new Error('Failed to read and emulate file upload.') });
    };
    reader.readAsDataURL(file);
  });
}
