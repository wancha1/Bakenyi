import { Article } from '../types/article';
import { bakenyiArticles } from '../data/articlesData';
import { getSupabase, fetchUsers } from './supabaseClient';
import { validateAndCompressAudio, AudioValidationOptions, formatFileSize } from './audioUtils';
import { queueOfflineItem, flushOfflineQueue, registerOnlineSyncListener } from './syncService';

export { validateAndCompressAudio, formatFileSize, queueOfflineItem, flushOfflineQueue, registerOnlineSyncListener };
export type { AudioValidationOptions };

/**
 * Generates an RFC4122-compliant version 4 UUID.
 * This guarantees database compatibility for tables requiring UUID primary keys.
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export const isSupabaseConfigured = (): boolean => {
  return getSupabase() !== null;
};

// Supabase client direct reference
export const supabase = getSupabase();

export async function filterRealArticles(items: any[]): Promise<any[]> {
  try {
    const users = await fetchUsers();
    const realUserIds = new Set(users.map(u => u.id));
    return items.filter(item => {
      if (item.status === 'approved' || item.status === 'published') {
        return true;
      }
      const creatorId = item.created_by;
      return creatorId && realUserIds.has(creatorId);
    });
  } catch (e) {
    console.error('Failed to filter real articles:', e);
    return [];
  }
}

export async function filterRealContributions(items: any[]): Promise<any[]> {
  try {
    const users = await fetchUsers();
    const realUserIds = new Set(users.map(u => u.id));
    return items.filter(item => {
      if (item.status === 'approved' || item.status === 'published') {
        return true;
      }
      return item.userId && realUserIds.has(item.userId);
    });
  } catch (e) {
    console.error('Failed to filter real contributions:', e);
    return [];
  }
}

// ==========================================
// UNIFIED AUTHENTICATION SERVICES (SUPABASE)
// ==========================================

export async function signIn(email: string, password: string): Promise<{ user: any; error: Error | null }> {
  const client = getSupabase();
  if (!client) {
    return { user: null, error: new Error('Supabase client is not configured.') };
  }

  try {
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    
    // Also ensure they have a profile row in the profiles table for role-based features
    if (data.user) {
      // Check if profile exists first
      const { data: profile } = await client
        .from('profiles')
        .select('role, is_admin')
        .eq('id', data.user.id)
        .maybeSingle();
      
      if (!profile) {
        // Create initial profile only if it does not exist, with default member privileges
        await client.from('profiles').insert({
          id: data.user.id,
          email: data.user.email,
          role: 'member',
          is_admin: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    }

    return { user: data.user, error: null };
  } catch (err: any) {
    return { user: null, error: err };
  }
}

export async function signOut(): Promise<{ error: Error | null }> {
  const client = getSupabase();
  if (!client) return { error: null };

  try {
    const { error } = await client.auth.signOut();
    if (error) throw error;
    return { error: null };
  } catch (err: any) {
    return { error: err };
  }
}

export async function getCurrentUser(): Promise<any> {
  const client = getSupabase();
  if (!client) return null;

  try {
    const { data: { user } } = await client.auth.getUser();
    return user;
  } catch {
    return null;
  }
}

// ==========================================
// UNIFIED DATABASE & ARTICLES SERVICES (SUPABASE)
// ==========================================

// Helper functions for offline-capable localStorage caching of heritage articles
function getLocalArticles(): Article[] {
  try {
    const stored = localStorage.getItem('bakenye_articles');
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error('Failed to parse local articles', e);
    return [];
  }
}

function saveLocalArticles(articles: Article[]): void {
  try {
    localStorage.setItem('bakenye_articles', JSON.stringify(articles));
  } catch (e) {
    console.error('Failed to save local articles', e);
  }
}

/**
 * Fetches all articles from Supabase.
 * @param onlyPublished If true, only returns articles with status === 'published'.
 */
export async function getArticles(onlyPublished = true): Promise<Article[]> {
  const localList = getLocalArticles();
  const client = getSupabase();
  if (!client) {
    console.warn('Supabase client is not configured.');
    const filtered = onlyPublished ? localList.filter(a => a.status === 'published') : localList;
    return filterRealArticles(filtered);
  }

  try {
    const { data, error } = await client
      .from('heritage_articles')
      .select('id, title, content, status, created_at, updated_at, published_at, summary, created_by')
      .order('published_at', { ascending: false });

    if (error) throw error;

    const dbArticles = (data || []).map((row: any) => ({
      id: row.id,
      title: row.title,
      excerpt: row.summary || '',
      content: row.content || '',
      category: 'Heritage', // default or custom category if needed
      author: 'Bakenyi Committee', // default author
      publishedAt: row.published_at || row.created_at || new Date().toISOString().split('T')[0],
      status: row.status || 'published',
      views: 0,
      tags: ['Heritage'],
      created_by: row.created_by
    }));

    const merged = [...localList, ...dbArticles];
    const unique = merged.filter((item, index, self) => self.findIndex(t => t.id === item.id) === index);
    const filtered = onlyPublished ? unique.filter(a => a.status === 'published') : unique;
    return filterRealArticles(filtered);
  } catch (err) {
    console.warn('Supabase fetch articles failed:', err);
    return [];
  }
}

/**
 * Fetches an article by its ID.
 */
export async function getArticleById(id: string): Promise<Article | null> {
  const localList = getLocalArticles();
  const localMatch = localList.find(a => a.id === id);
  if (localMatch) {
    const isReal = await filterRealArticles([localMatch]);
    return isReal.length > 0 ? isReal[0] : null;
  }

  const client = getSupabase();
  if (!client) {
    console.warn('Supabase client is not configured.');
    return null;
  }

  try {
    const { data, error } = await client
      .from('heritage_articles')
      .select('id, title, content, status, created_at, updated_at, published_at, summary, created_by')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;

    if (data) {
      const art = {
        id: data.id,
        title: data.title,
        excerpt: data.summary || '',
        content: data.content || '',
        category: 'Heritage',
        author: 'Bakenyi Committee',
        publishedAt: data.published_at || data.created_at || new Date().toISOString().split('T')[0],
        status: data.status || 'published',
        views: 0,
        tags: ['Heritage'],
        created_by: data.created_by
      };
      const isReal = await filterRealArticles([art]);
      return isReal.length > 0 ? isReal[0] : null;
    }
  } catch (err) {
    console.warn(`Supabase read for ID ${id} failed:`, err);
  }

  return null;
}

/**
 * Creates a new article in Supabase.
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

  // Always save to localStorage first for reliable offline resilience
  try {
    const localList = getLocalArticles();
    localList.unshift(newArticle);
    saveLocalArticles(localList);
  } catch (localErr) {
    console.error('Failed to store article in localStorage cache:', localErr);
  }

  const client = getSupabase();
  if (!client) {
    return { data: newArticle, error: null };
  }

  try {
    const dbRecord: any = {
      title: article.title,
      slug: generatedId,
      content: article.content || '',
      status: article.status || 'draft',
      published_at: article.publishedAt || new Date().toISOString().split('T')[0],
      summary: article.excerpt || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Auto-resolve logged-in user for created_by field
    try {
      const { data: userData } = await client.auth.getUser();
      if (userData?.user?.id) {
        dbRecord.created_by = userData.user.id;
      }
    } catch (userErr) {
      console.warn('Could not retrieve user ID for created_by field:', userErr);
    }

    // Try inserting into heritage_articles
    const { data: insertedData, error } = await client
      .from('heritage_articles')
      .insert(dbRecord)
      .select('id')
      .maybeSingle();

    if (error) throw error;

    let assignedId = generatedId;
    if (insertedData?.id) {
      assignedId = insertedData.id;
    }

    const savedArticle: Article = {
      ...newArticle,
      id: assignedId
    };

    return { data: savedArticle, error: null };
  } catch (err: any) {
    console.warn('Supabase create article failed, but article has been saved to offline/localStorage cache successfully.', err);
    return { data: newArticle, error: null };
  }
}

/**
 * Updates an existing article.
 */
export async function updateArticle(id: string, articleUpdates: Partial<Article>): Promise<{ data: Article | null; error: Error | null }> {
  let updatedArticleObj: Article | null = null;
  try {
    const localList = getLocalArticles();
    const idx = localList.findIndex(a => a.id === id);
    if (idx !== -1) {
      localList[idx] = { ...localList[idx], ...articleUpdates };
      updatedArticleObj = localList[idx];
      saveLocalArticles(localList);
    } else {
      const current = await getArticleById(id);
      if (current) {
        const updated = { ...current, ...articleUpdates };
        localList.unshift(updated);
        updatedArticleObj = updated;
        saveLocalArticles(localList);
      }
    }
  } catch (localErr) {
    console.error('Failed to update article in localStorage cache:', localErr);
  }

  const client = getSupabase();
  if (!client) {
    return { data: updatedArticleObj || (await getArticleById(id)), error: null };
  }

  try {
    const current = await getArticleById(id);
    if (!current) {
      return { data: null, error: new Error('Article not found.') };
    }
    const updated = { ...current, ...articleUpdates };

    const dbRecord: any = {
      updated_at: new Date().toISOString()
    };
    if (articleUpdates.title !== undefined) {
      dbRecord.title = articleUpdates.title;
      dbRecord.slug = articleUpdates.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
    if (articleUpdates.content !== undefined) dbRecord.content = articleUpdates.content;
    if (articleUpdates.status !== undefined) dbRecord.status = articleUpdates.status;
    if (articleUpdates.publishedAt !== undefined) dbRecord.published_at = articleUpdates.publishedAt;
    if (articleUpdates.excerpt !== undefined) dbRecord.summary = articleUpdates.excerpt;

    // Update heritage_articles
    const { error } = await client.from('heritage_articles').update(dbRecord).eq('id', id);
    if (error) throw error;

    return { data: updated, error: null };
  } catch (err: any) {
    console.warn(`Supabase update article ${id} failed, but successfully updated in offline/localStorage cache.`, err);
    return { data: updatedArticleObj || (await getArticleById(id)), error: null };
  }
}

/**
 * Deletes an article from the database.
 */
export async function deleteArticle(id: string): Promise<{ success: boolean; error: Error | null }> {
  try {
    const localList = getLocalArticles();
    const filtered = localList.filter(a => a.id !== id);
    saveLocalArticles(filtered);
  } catch (localErr) {
    console.error('Failed to delete article from localStorage cache:', localErr);
  }

  const client = getSupabase();
  if (!client) {
    return { success: true, error: null };
  }

  try {
    const { error } = await client.from('heritage_articles').delete().eq('id', id);
    if (error) throw error;
    return { success: true, error: null };
  } catch (err: any) {
    console.warn(`Supabase delete article ${id} failed, but successfully deleted from offline/localStorage cache.`, err);
    return { success: true, error: null };
  }
}

// ==========================================
// UNIFIED STORAGE SERVICES (EMULATED & REAL)
// ==========================================

function getBucketNameForFile(file: File, type?: string): string {
  const nameLower = file.name.toLowerCase();
  const mimeLower = file.type.toLowerCase();

  if (type === 'avatars') {
    return 'avatars';
  }
  if (type === 'event-media' || nameLower.includes('event') || nameLower.includes('flyer') || nameLower.includes('poster')) {
    return 'event-media';
  }
  if (type === 'pdfs' || mimeLower === 'application/pdf' || nameLower.endsWith('.pdf')) {
    return 'documents';
  }
  if (mimeLower.startsWith('audio/') || nameLower.match(/\.(mp3|wav|webm|ogg|m4a)$/)) {
    return 'heritage-audio';
  }
  if (mimeLower.startsWith('video/') || nameLower.match(/\.(mp4|mov|avi|mkv)$/)) {
    return 'heritage-video';
  }
  if (type === 'system-assets') {
    return 'system-assets';
  }
  
  // Default fallback is heritage-images for all general images or files
  return 'heritage-images';
}

export async function uploadMedia(file: File, type: 'images' | 'pdfs'): Promise<{ url: string; error: Error | null }> {
  // If uploading audio via uploadMedia, validate size & compress first
  let fileToUpload = file;
  if (file.type.startsWith('audio/') || file.name.match(/\.(mp3|wav|webm|ogg|m4a)$/i)) {
    const valResult = await validateAndCompressAudio(file);
    if (valResult.error) {
      return { url: '', error: valResult.error };
    }
    fileToUpload = new File([valResult.blob], file.name, { type: valResult.blob.type || file.type });
  }

  const client = getSupabase();
  if (!client) {
    return emulateFileUpload(fileToUpload);
  }

  try {
    const bucketName = getBucketNameForFile(fileToUpload, type);
    const fileExt = fileToUpload.name.split('.').pop();
    const uniqueId = Math.random().toString(36).substring(2, 10);
    
    // Fetch authenticated user id to isolate path
    const { data: { session } } = await client.auth.getSession();
    const userId = session?.user?.id;
    
    const baseName = `${Date.now()}_${uniqueId}.${fileExt}`;
    const fileName = userId ? `${userId}/${baseName}` : baseName;
    
    // First ensure the bucket exists/we can upload to it
    const { data, error } = await client.storage.from(bucketName).upload(fileName, fileToUpload);
    if (error) {
      console.warn(`Storage upload to ${bucketName} failed (bucket might not exist), falling back to Base64:`, error);
      return emulateFileUpload(fileToUpload);
    }

    const { data: { publicUrl } } = client.storage.from(bucketName).getPublicUrl(fileName);
    return { url: publicUrl, error: null };
  } catch (err: any) {
    return emulateFileUpload(fileToUpload);
  }
}

export async function uploadAudioFile(
  blob: Blob,
  fileName: string,
  options?: AudioValidationOptions
): Promise<{ url: string; compressed?: boolean; originalSize?: number; finalSize?: number; error: Error | null }> {
  // 1. Client-side audio maximum size validation & optional compression
  const valResult = await validateAndCompressAudio(blob, options);
  if (valResult.error) {
    return {
      url: '',
      compressed: false,
      originalSize: valResult.originalSize,
      finalSize: valResult.compressedSize,
      error: valResult.error
    };
  }

  const processedBlob = valResult.blob;
  const file = new File([processedBlob], fileName, { type: processedBlob.type || 'audio/webm' });
  const client = getSupabase();

  if (!client) {
    queueOfflineItem('audio', 'create', { fileName, blobSize: processedBlob.size });
    const emulated = await emulateFileUpload(file);
    return {
      url: emulated.url,
      compressed: valResult.isCompressed,
      originalSize: valResult.originalSize,
      finalSize: valResult.compressedSize,
      error: emulated.error
    };
  }

  try {
    const bucketName = 'heritage-audio';
    
    // Fetch authenticated user id to isolate path
    const { data: { session } } = await client.auth.getSession();
    const userId = session?.user?.id;
    
    const baseName = `${Date.now()}_${fileName}`;
    const filePath = userId ? `${userId}/oral-histories/${baseName}` : `oral-histories/${baseName}`;
    
    const { data, error } = await client.storage.from(bucketName).upload(filePath, file);
    if (error) {
      console.warn(`Storage upload of audio to ${bucketName} failed, falling back to Base64 and offline queue:`, error);
      queueOfflineItem('audio', 'create', { fileName, filePath, blobSize: processedBlob.size });
      const emulated = await emulateFileUpload(file);
      return {
        url: emulated.url,
        compressed: valResult.isCompressed,
        originalSize: valResult.originalSize,
        finalSize: valResult.compressedSize,
        error: null
      };
    }

    const { data: { publicUrl } } = client.storage.from(bucketName).getPublicUrl(filePath);
    return {
      url: publicUrl,
      compressed: valResult.isCompressed,
      originalSize: valResult.originalSize,
      finalSize: valResult.compressedSize,
      error: null
    };
  } catch (err: any) {
    queueOfflineItem('audio', 'create', { fileName, blobSize: processedBlob.size });
    const emulated = await emulateFileUpload(file);
    return {
      url: emulated.url,
      compressed: valResult.isCompressed,
      originalSize: valResult.originalSize,
      finalSize: valResult.compressedSize,
      error: null
    };
  }
}

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

// ==========================================
// UNIFIED CONTRIBUTIONS SERVICES (SUPABASE)
// ==========================================

export interface Contribution {
  id: string;
  title: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  // Parsed from the content JSON string
  description: string;
  imageUrl: string;
  type: string;
  userEmail: string;
  userId: string;
}

export async function getContributions(userId?: string): Promise<Contribution[]> {
  const client = getSupabase();
  if (!client) {
    const stored = localStorage.getItem('supabase_emulated_contributions') || '[]';
    const localList = JSON.parse(stored);
    const filtered = userId ? localList.filter((item: any) => item.userId === userId) : localList;
    return filterRealContributions(filtered);
  }

  try {
    let query = client.from('contributions').select('id, title, content, status, created_at');
    
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;

    const list: Contribution[] = (data || []).map((row: any) => {
      let parsed = { description: '', imageUrl: '', type: 'photo', userEmail: 'anonymous@bakenyi.org', userId: '' };
      try {
        if (row.content) {
          parsed = JSON.parse(row.content);
        }
      } catch (e) {
        parsed.description = row.content || '';
      }

      return {
        id: row.id,
        title: row.title,
        status: row.status || 'pending',
        created_at: row.created_at,
        description: parsed.description || '',
        imageUrl: parsed.imageUrl || '',
        type: parsed.type || 'photo',
        userEmail: parsed.userEmail || '',
        userId: parsed.userId || ''
      };
    });

    const filtered = userId ? list.filter(item => item.userId === userId) : list;
    return filterRealContributions(filtered);
  } catch (err) {
    console.error('getContributions failed, falling back to local emulated storage:', err);
    const stored = localStorage.getItem('supabase_emulated_contributions') || '[]';
    const localList = JSON.parse(stored);
    const filtered = userId ? localList.filter((item: any) => item.userId === userId) : localList;
    return filterRealContributions(filtered);
  }
}

export async function createContribution(
  title: string,
  description: string,
  type: string,
  imageUrl: string,
  userEmail: string,
  userId: string,
  status: 'pending' | 'approved' | 'rejected' = 'pending'
): Promise<{ data: Contribution | null; error: Error | null }> {
  const client = getSupabase();
  const id = generateUUID();
  const contentStr = JSON.stringify({ description, imageUrl, type, userEmail, userId });

  const contributionObj: Contribution = {
    id,
    title,
    status,
    created_at: new Date().toISOString(),
    description,
    imageUrl,
    type,
    userEmail,
    userId
  };

  if (!client) {
    const stored = localStorage.getItem('supabase_emulated_contributions') || '[]';
    const list = JSON.parse(stored);
    list.unshift(contributionObj);
    localStorage.setItem('supabase_emulated_contributions', JSON.stringify(list));
    return { data: contributionObj, error: null };
  }

  try {
    // Avoid sending custom string id if primary key is uuid
    const { data: dbData, error } = await client
      .from('contributions')
      .insert({
        title,
        content: contentStr,
        status,
        reporter_id: userId,
        created_at: new Date().toISOString()
      })
      .select('id, title, content, status, created_at')
      .single();

    if (error) {
      // Fallback with custom generated ID in case UUID schema is not set
      const { error: errorWithId } = await client.from('contributions').insert({
        id,
        title,
        content: contentStr,
        status,
        reporter_id: userId,
        created_at: new Date().toISOString()
      });
      if (errorWithId) throw errorWithId;
      return { data: contributionObj, error: null };
    }
    
    const returnedId = dbData?.id || id;
    return { 
      data: {
        ...contributionObj,
        id: returnedId,
        created_at: dbData?.created_at || contributionObj.created_at
      }, 
      error: null 
    };
  } catch (err: any) {
    console.error('createContribution failed:', err);
    return { data: null, error: err };
  }
}

export async function updateContributionStatus(id: string, status: 'pending' | 'approved' | 'rejected'): Promise<{ success: boolean; error: Error | null }> {
  const client = getSupabase();
  if (!client) {
    const stored = localStorage.getItem('supabase_emulated_contributions') || '[]';
    const list: Contribution[] = JSON.parse(stored);
    const idx = list.findIndex(c => c.id === id);
    if (idx !== -1) {
      list[idx].status = status;
      localStorage.setItem('supabase_emulated_contributions', JSON.stringify(list));
    }
    return { success: true, error: null };
  }

  try {
    const isUUID = (str?: string) => str ? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str) : false;
    let query = client.from('contributions').update({ status });
    if (isUUID(id)) {
      query = query.eq('id', id);
    } else {
      query = query.eq('title', id);
    }
    const { error } = await query;
    if (error) {
      // If we queried by UUID and failed, try falling back by matching title
      if (isUUID(id)) {
        await client.from('contributions').update({ status }).eq('title', id);
      } else {
        throw error;
      }
    }
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err };
  }
}

// ==========================================
// UNIFIED GALLERY SERVICES (SUPABASE)
// ==========================================

export interface GalleryImage {
  id: string;
  title: string;
  imageUrl: string;
  created_at?: string;
  description: string;
  category: string;
  status?: 'pending' | 'approved' | 'rejected';
}

const DEFAULT_GALLERY_IMAGES: GalleryImage[] = [
  {
    id: 'g-1',
    title: 'Nile Vista Sunset',
    imageUrl: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&q=80&w=800',
    description: 'A stunning sunset reflecting off the waters of the river Nile near Bakenye historical settlement.',
    category: 'Landscape',
    status: 'approved',
    created_at: new Date('2026-01-15').toISOString()
  },
  {
    id: 'g-2',
    title: 'Traditional Fishing Canoe',
    imageUrl: 'https://images.unsplash.com/photo-1501535033-a593e6afb94d?auto=format&fit=crop&q=80&w=800',
    description: 'Handcrafted wooden canoe used by the Bakenyi fishermen for centuries on the Nile marshes.',
    category: 'Craft',
    status: 'approved',
    created_at: new Date('2026-01-20').toISOString()
  },
  {
    id: 'g-3',
    title: 'Sacred Ritual Drum',
    imageUrl: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&q=80&w=800',
    description: 'Ceremonial drum adorned with traditional patterns, utilized in regional assemblies and elder boards.',
    category: 'Tradition',
    status: 'approved',
    created_at: new Date('2026-01-25').toISOString()
  },
  {
    id: 'g-4',
    title: 'Historical Settlement Grounds',
    imageUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&q=80&w=800',
    description: 'Ancient grounds where the first clans gathered, now preserved as a heritage sanctuary.',
    category: 'History',
    status: 'approved',
    created_at: new Date('2026-02-01').toISOString()
  },
  {
    id: 'g-5',
    title: 'Wetland Papyrus Harvesting',
    imageUrl: 'https://images.unsplash.com/photo-1523805009345-7448845a9e53?auto=format&fit=crop&q=80&w=800',
    description: 'Bakenyi artisans collecting wild papyrus reeds to weave traditional mats and housing components.',
    category: 'Craft',
    status: 'approved',
    created_at: new Date('2026-02-05').toISOString()
  },
  {
    id: 'g-6',
    title: 'Bakenyi Cultural Assembly',
    imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=800',
    description: 'Community gathering showcasing oral histories, traditional songs, and communal dialogue.',
    category: 'Tradition',
    status: 'approved',
    created_at: new Date('2026-02-10').toISOString()
  }
];

export async function getGalleryImages(includePending = false): Promise<GalleryImage[]> {
  const client = getSupabase();
  if (!client) {
    return DEFAULT_GALLERY_IMAGES;
  }

  try {
    const { data, error } = await client
      .from('media')
      .select('id, title, description, file_url, category, status, created_at')
      .eq('file_type', 'image');

    if (error) throw error;

    if (data && data.length > 0) {
      const mapped = data.map((row: any) => {
        let titleVal = row.title;
        let desc = row.description || '';
        let cat = row.category || 'General';
        let statusVal: 'pending' | 'approved' | 'rejected' = row.status || 'approved';
        
        try {
          if (titleVal && titleVal.startsWith('{')) {
            const parsed = JSON.parse(titleVal);
            titleVal = parsed.title;
            desc = parsed.description || desc;
            cat = parsed.category || cat;
            statusVal = parsed.status || statusVal;
          }
        } catch (e) {}

        return {
          id: row.id,
          title: titleVal,
          imageUrl: row.file_url,
          created_at: row.created_at,
          description: desc,
          category: cat,
          status: statusVal
        };
      });

      return includePending ? mapped : mapped.filter(img => img.status === 'approved');
    }

    return DEFAULT_GALLERY_IMAGES;
  } catch (err) {
    console.warn('getGalleryImages query failed, using high-quality defaults:', err);
    return includePending 
      ? DEFAULT_GALLERY_IMAGES 
      : DEFAULT_GALLERY_IMAGES.filter(img => img.status === 'approved');
  }
}

export async function addGalleryImage(
  title: string,
  imageUrl: string,
  description: string,
  category: string,
  status: 'pending' | 'approved' | 'rejected' = 'pending'
): Promise<{ data: GalleryImage | null; error: Error | null }> {
  const client = getSupabase();
  const id = generateUUID();

  const galleryObj: GalleryImage = {
    id,
    title,
    imageUrl,
    created_at: new Date().toISOString(),
    description,
    category,
    status
  };

  if (!client) {
    return { data: null, error: new Error('Supabase client is not configured.') };
  }

  try {
    const { data: dbData, error } = await client
      .from('media')
      .insert({
        title,
        description,
        file_url: imageUrl,
        file_type: 'image',
        category,
        status,
        created_at: new Date().toISOString()
      })
      .select('id, title, description, file_url, category, status, created_at')
      .maybeSingle();

    if (error) throw error;

    const returnedId = dbData?.id || id;
    return { 
      data: {
        id: returnedId,
        title: dbData?.title || title,
        imageUrl: dbData?.file_url || imageUrl,
        created_at: dbData?.created_at || galleryObj.created_at,
        description: dbData?.description || description,
        category: dbData?.category || category,
        status: dbData?.status || status
      }, 
      error: null 
    };
  } catch (err: any) {
    console.error('addGalleryImage failed:', err);
    return { data: null, error: err };
  }
}

export async function updateGalleryImageStatus(id: string, status: 'pending' | 'approved' | 'rejected'): Promise<{ success: boolean; error: Error | null }> {
  const client = getSupabase();
  if (!client) return { success: false, error: new Error('Supabase client is not configured.') };

  try {
    const { error: mediaErr } = await client.from('media').update({ status }).eq('id', id);
    if (mediaErr) throw mediaErr;
    return { success: true, error: null };
  } catch (err: any) {
    console.error('updateGalleryImageStatus failed:', err);
    return { success: false, error: err };
  }
}

// ==========================================
// UNIFIED CONTACT MESSAGES SERVICES
// ==========================================
export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: 'pending' | 'open' | 'closed';
  created_at?: string;
  admin_notes?: string;
}

export async function createContactMessage(msg: Omit<ContactMessage, 'id'>): Promise<{ data: ContactMessage | null; error: Error | null }> {
  const client = getSupabase();
  const id = generateUUID();
  const completeMsg = { ...msg, id, status: 'pending' as const, created_at: new Date().toISOString() };

  const stored = localStorage.getItem('bakenye_contact_messages') || '[]';
  const list = JSON.parse(stored);
  list.unshift(completeMsg);
  localStorage.setItem('bakenye_contact_messages', JSON.stringify(list));

  if (!client) {
    return { data: completeMsg, error: null };
  }

  try {
    const { data, error } = await client.from('contact_messages').insert({
      name: msg.name,
      email: msg.email,
      phone: msg.phone || '',
      subject: msg.subject,
      message: msg.message,
      status: 'pending',
      admin_notes: msg.admin_notes || ''
    }).select().single();

    if (error) {
      // Fallback with ID in case schema expects text ID
      const { error: errorWithId } = await client.from('contact_messages').insert(completeMsg);
      if (errorWithId) throw errorWithId;
      return { data: completeMsg, error: null };
    }

    return { data: data || completeMsg, error: null };
  } catch (err: any) {
    console.warn('Supabase contact_messages write failed, saved to local cache:', err);
    return { data: completeMsg, error: null };
  }
}

export async function getContactMessages(): Promise<ContactMessage[]> {
  const client = getSupabase();
  const stored = localStorage.getItem('bakenye_contact_messages') || '[]';
  const localList = JSON.parse(stored);

  if (!client) {
    return localList;
  }

  try {
    const { data, error } = await client.from('contact_messages').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn('Supabase fetch messages failed:', err);
    return localList;
  }
}

export async function updateContactMessageStatus(id: string, status: 'pending' | 'open' | 'closed', adminNotes?: string): Promise<boolean> {
  const client = getSupabase();
  const stored = localStorage.getItem('bakenye_contact_messages') || '[]';
  const list = JSON.parse(stored);
  const idx = list.findIndex((m: any) => m.id === id);
  if (idx !== -1) {
    list[idx].status = status;
    if (adminNotes !== undefined) list[idx].admin_notes = adminNotes;
    localStorage.setItem('bakenye_contact_messages', JSON.stringify(list));
  }

  if (!client) return true;

  try {
    const { error } = await client.from('contact_messages').update({ status, admin_notes: adminNotes }).eq('id', id);
    if (error) {
      if (list[idx]) {
        await client.from('contact_messages').update({ status, admin_notes: adminNotes }).eq('name', list[idx].name);
      }
    }
    return true;
  } catch (err) {
    console.error('Failed to update contact message:', err);
    return false;
  }
}

// ==========================================
// UNIFIED CLAN SERVICES
// ==========================================
export interface Clan {
  id: string;
  name: string;
  totem: string;
  motto?: string;
  desc?: string;
  status: 'pending' | 'approved' | 'rejected' | 'archived';
  history?: string;
  origin?: string;
  leadership?: string;
  custodian?: string;
  gallery_urls?: string[];
  document_urls?: string[];
  created_at?: string;
}

const DEFAULT_FALLBACK_CLANS: Clan[] = [];

export async function getClans(onlyApproved = true): Promise<Clan[]> {
  const client = getSupabase();

  if (!client) {
    const stored = localStorage.getItem('bakenye_clans');
    if (!stored) {
      localStorage.setItem('bakenye_clans', JSON.stringify(DEFAULT_FALLBACK_CLANS));
    }
    const localList = JSON.parse(localStorage.getItem('bakenye_clans') || '[]');
    return onlyApproved ? localList.filter((c: any) => c.status === 'approved') : localList;
  }

  try {
    const { data, error } = await client.from('clans').select('*').order('name', { ascending: true });
    if (error) throw error;
    
    const mapped = (data || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      totem: row.totem || '',
      motto: row.motto || '',
      desc: row.desc || row.description || '',
      status: row.status || 'approved',
      history: row.history || '',
      origin: row.origin || '',
      leadership: row.leadership || '',
      custodian: row.custodian || '',
      gallery_urls: row.gallery_urls ? (typeof row.gallery_urls === 'string' ? JSON.parse(row.gallery_urls) : row.gallery_urls) : [],
      document_urls: row.document_urls ? (typeof row.document_urls === 'string' ? JSON.parse(row.document_urls) : row.document_urls) : [],
      created_at: row.created_at
    }));

    return onlyApproved ? mapped.filter(c => c.status === 'approved') : mapped;
  } catch (err) {
    console.warn('Supabase fetch clans failed:', err);
    return [];
  }
}

export async function createClan(clan: Omit<Clan, 'id'>): Promise<{ data: Clan | null; error: Error | null }> {
  const client = getSupabase();
  const id = generateUUID();
  const completeClan = { ...clan, id, created_at: new Date().toISOString() };

  const stored = localStorage.getItem('bakenye_clans') || '[]';
  const list = JSON.parse(stored);
  list.unshift(completeClan);
  localStorage.setItem('bakenye_clans', JSON.stringify(list));

  if (!client) {
    return { data: completeClan, error: null };
  }

  try {
    const dbRecord = {
      name: clan.name,
      totem: clan.totem,
      motto: clan.motto || '',
      desc: clan.desc || '',
      status: clan.status || 'pending',
      history: clan.history || '',
      origin: clan.origin || '',
      leadership: clan.leadership || '',
      custodian: clan.custodian || '',
      gallery_urls: JSON.stringify(clan.gallery_urls || []),
      document_urls: JSON.stringify(clan.document_urls || [])
    };

    const { data, error } = await client.from('clans').insert(dbRecord).select().single();
    if (error) {
      const { error: errorWithId } = await client.from('clans').insert({ ...dbRecord, id });
      if (errorWithId) throw errorWithId;
      return { data: completeClan, error: null };
    }
    return { data: data || completeClan, error: null };
  } catch (err: any) {
    console.warn('Supabase create clan write failed, cached locally:', err);
    return { data: completeClan, error: null };
  }
}

export async function updateClan(id: string, updates: Partial<Clan>): Promise<boolean> {
  const client = getSupabase();
  const stored = localStorage.getItem('bakenye_clans') || '[]';
  const list = JSON.parse(stored);
  const idx = list.findIndex((c: any) => c.id === id);
  if (idx !== -1) {
    list[idx] = { ...list[idx], ...updates };
    localStorage.setItem('bakenye_clans', JSON.stringify(list));
  }

  if (!client) return true;

  try {
    const dbRecord: any = {};
    if (updates.name !== undefined) dbRecord.name = updates.name;
    if (updates.totem !== undefined) dbRecord.totem = updates.totem;
    if (updates.motto !== undefined) dbRecord.motto = updates.motto;
    if (updates.desc !== undefined) dbRecord.desc = updates.desc;
    if (updates.status !== undefined) dbRecord.status = updates.status;
    if (updates.history !== undefined) dbRecord.history = updates.history;
    if (updates.origin !== undefined) dbRecord.origin = updates.origin;
    if (updates.leadership !== undefined) dbRecord.leadership = updates.leadership;
    if (updates.custodian !== undefined) dbRecord.custodian = updates.custodian;
    if (updates.gallery_urls !== undefined) dbRecord.gallery_urls = JSON.stringify(updates.gallery_urls);
    if (updates.document_urls !== undefined) dbRecord.document_urls = JSON.stringify(updates.document_urls);

    const { error } = await client.from('clans').update(dbRecord).eq('id', id);
    if (error) {
      if (list[idx]) {
        await client.from('clans').update(dbRecord).eq('name', list[idx].name);
      }
    }
    return true;
  } catch (err) {
    console.error('Failed to update clan:', err);
    return false;
  }
}

export async function deleteClan(id: string): Promise<boolean> {
  const client = getSupabase();
  const stored = localStorage.getItem('bakenye_clans') || '[]';
  const list = JSON.parse(stored);
  const filtered = list.filter((c: any) => c.id !== id);
  localStorage.setItem('bakenye_clans', JSON.stringify(filtered));

  if (!client) return true;

  try {
    await client.from('clans').delete().eq('id', id);
    return true;
  } catch (err) {
    console.error('Failed to delete clan:', err);
    return false;
  }
}

// ==========================================
// UNIFIED ELDERS & LEADERS SERVICES
// ==========================================
export interface Leader {
  id: string;
  name: string;
  role: string;
  bio: string;
  photo_url?: string;
  expertise?: string;
  clan?: string;
  contact_email?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at?: string;
}

const DEFAULT_FALLBACK_LEADERS: Leader[] = [];

export async function getLeaders(onlyApproved = true): Promise<Leader[]> {
  const client = getSupabase();

  if (!client) {
    const stored = localStorage.getItem('bakenye_leaders');
    if (!stored) {
      localStorage.setItem('bakenye_leaders', JSON.stringify(DEFAULT_FALLBACK_LEADERS));
    }
    const localList = JSON.parse(localStorage.getItem('bakenye_leaders') || '[]');
    return onlyApproved ? localList.filter((l: any) => l.status === 'approved') : localList;
  }

  try {
    const { data, error } = await client
      .from('leaders')
      .select('id, full_name, title, biography, clan_id, status, created_at')
      .order('full_name', { ascending: true });
    
    if (error) throw error;

    const mapped = (data || []).map((row: any) => ({
      id: row.id,
      name: row.full_name || '',
      role: row.title || '',
      bio: row.biography || '',
      photo_url: '',
      expertise: 'Cultural Custodian',
      clan: row.clan_id || '',
      contact_email: '',
      status: row.status || 'approved',
      created_at: row.created_at
    }));

    return onlyApproved ? mapped.filter(l => l.status === 'approved') : mapped;
  } catch (err: any) {
    console.warn('Supabase fetch leaders failed:', err);
    return [];
  }
}

export async function createLeader(leader: Omit<Leader, 'id'>): Promise<{ data: Leader | null; error: Error | null }> {
  const client = getSupabase();
  if (!client) {
    return { data: null, error: new Error('Supabase client is not configured.') };
  }

  try {
    const dbRecord = {
      full_name: leader.name,
      title: leader.role,
      biography: leader.bio,
      clan_id: leader.clan || '',
      status: leader.status || 'pending'
    };

    const { data, error } = await client.from('leaders').insert(dbRecord).select().single();
    if (error) throw error;

    const mapped: Leader = {
      id: data.id,
      name: data.full_name || '',
      role: data.title || '',
      bio: data.biography || '',
      photo_url: '',
      expertise: 'Cultural Custodian',
      clan: data.clan_id || '',
      contact_email: '',
      status: data.status || 'approved',
      created_at: data.created_at
    };
    return { data: mapped, error: null };
  } catch (err: any) {
    console.error('Supabase create leader failed:', err);
    return { data: null, error: err };
  }
}

export async function updateLeader(id: string, updates: Partial<Leader>): Promise<boolean> {
  const client = getSupabase();
  if (!client) throw new Error('Supabase client is not configured.');

  try {
    const dbRecord: any = {};
    if (updates.name !== undefined) dbRecord.full_name = updates.name;
    if (updates.role !== undefined) dbRecord.title = updates.role;
    if (updates.bio !== undefined) dbRecord.biography = updates.bio;
    if (updates.clan !== undefined) dbRecord.clan_id = updates.clan;
    if (updates.status !== undefined) dbRecord.status = updates.status;

    const { error } = await client.from('leaders').update(dbRecord).eq('id', id);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Failed to update leader:', err);
    return false;
  }
}

export async function deleteLeader(id: string): Promise<boolean> {
  const client = getSupabase();
  if (!client) throw new Error('Supabase client is not configured.');

  try {
    const { error } = await client.from('leaders').delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Failed to delete leader:', err);
    return false;
  }
}

// ==========================================
// UNIFIED VOCABULARY & GLOSSARY SERVICES
// ==========================================
export interface Vocabulary {
  id: string;
  lukenye: string;
  english: string;
  category: string;
  usage?: string;
  audio_url?: string;
  example_sentence?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at?: string;
}

const DEFAULT_FALLBACK_VOCABULARY: Vocabulary[] = [];

export async function getVocabulary(onlyApproved = true): Promise<Vocabulary[]> {
  const client = getSupabase();

  if (!client) {
    const stored = localStorage.getItem('bakenye_vocabulary');
    if (!stored) {
      localStorage.setItem('bakenye_vocabulary', JSON.stringify(DEFAULT_FALLBACK_VOCABULARY));
    }
    const localList = JSON.parse(localStorage.getItem('bakenye_vocabulary') || '[]');
    return onlyApproved ? localList.filter((v: any) => v.status === 'approved') : localList;
  }

  try {
    const { data, error } = await client.from('vocabulary').select('*').order('id', { ascending: true });
    if (error) throw error;

    const mapped = (data || []).map((row: any) => ({
      id: row.id,
      lukenye: row.lukenye,
      english: row.english,
      category: row.category || 'phrase',
      usage: row.usage || '',
      audio_url: row.audio_url || '',
      example_sentence: row.example_sentence || '',
      status: row.status || 'approved',
      created_at: row.created_at
    }));

    return onlyApproved ? mapped.filter(v => v.status === 'approved') : mapped;
  } catch (err) {
    console.warn('Supabase fetch vocabulary failed:', err);
    return [];
  }
}

export async function createVocabulary(vocab: Omit<Vocabulary, 'id'>): Promise<{ data: Vocabulary | null; error: Error | null }> {
  const client = getSupabase();
  const id = generateUUID();
  const completeVocab = { ...vocab, id, created_at: new Date().toISOString() };

  const stored = localStorage.getItem('bakenye_vocabulary') || '[]';
  const list = JSON.parse(stored);
  list.unshift(completeVocab);
  localStorage.setItem('bakenye_vocabulary', JSON.stringify(list));

  if (!client) {
    return { data: completeVocab, error: null };
  }

  try {
    const dbRecord = {
      lukenye: vocab.lukenye,
      english: vocab.english,
      category: vocab.category,
      usage: vocab.usage || '',
      audio_url: vocab.audio_url || '',
      example_sentence: vocab.example_sentence || '',
      status: vocab.status || 'pending'
    };

    const { data, error } = await client.from('vocabulary').insert(dbRecord).select().single();
    if (error) {
      const { error: errorWithId } = await client.from('vocabulary').insert({ ...dbRecord, id });
      if (errorWithId) throw errorWithId;
      return { data: completeVocab, error: null };
    }
    return { data: data || completeVocab, error: null };
  } catch (err: any) {
    console.warn('Supabase create vocabulary write failed, cached locally:', err);
    return { data: completeVocab, error: null };
  }
}

export async function updateVocabularyStatus(id: string, status: 'pending' | 'approved' | 'rejected'): Promise<boolean> {
  const client = getSupabase();
  const stored = localStorage.getItem('bakenye_vocabulary') || '[]';
  const list = JSON.parse(stored);
  const idx = list.findIndex((v: any) => v.id === id);
  if (idx !== -1) {
    list[idx].status = status;
    localStorage.setItem('bakenye_vocabulary', JSON.stringify(list));
  }

  if (!client) return true;

  try {
    const { error } = await client.from('vocabulary').update({ status }).eq('id', id);
    if (error) {
      if (list[idx]) {
        await client.from('vocabulary').update({ status }).eq('lukenye', list[idx].lukenye);
      }
    }
    return true;
  } catch (err) {
    console.error('Failed to update vocabulary status:', err);
    return false;
  }
}

// ==========================================
// UNIFIED STORY CATEGORIES SERVICES
// ==========================================
export interface StoryCategory {
  id: string;
  name: string;
  description?: string;
  fields?: string[];
  validation_rules?: string;
  upload_requirements?: string;
  is_archived?: boolean;
}

const defaultStoryCategories: StoryCategory[] = [
  {
    id: 'history',
    name: 'History & Timeline',
    description: 'Migration paths, ancestral settlements, and major historic events.',
    fields: ['Event Year', 'Historical Region', 'Witness Account'],
    validation_rules: 'Year must be numeric and before current year.',
    upload_requirements: 'At least one archive photo or certificate copy required.',
    is_archived: false
  },
  {
    id: 'clans',
    name: 'Clan Lore',
    description: 'Ancestral lineages, totems, and traditional roles.',
    fields: ['Clan Name', 'Totem Mascot', 'Motto Statement', 'Origin Region'],
    validation_rules: 'Clan name and Totem mascot are mandatory.',
    upload_requirements: 'Clan crest illustration or totem photo optional.',
    is_archived: false
  },
  {
    id: 'culture',
    name: 'Cultural Traditions',
    description: 'Floating island (Ebiswa) farming, canoe crafts, and rituals.',
    fields: ['Craft Name', 'Tools Used', 'Seasonal Relevance'],
    validation_rules: 'Provide details about Bakenyi-specific cultural traits.',
    upload_requirements: 'Instructional photo or sketch of the tool.',
    is_archived: false
  },
  {
    id: 'language',
    name: 'Oral Literature & Proverbs',
    description: 'Lukenye spoken sayings, proverbs, and audio tales.',
    fields: ['Lukenye Phrase', 'Literal English Translation', 'Cultural Meaning'],
    validation_rules: 'Input must capture the correct spelling in Lukenye.',
    upload_requirements: 'High-quality MP3 voice recording required.',
    is_archived: false
  }
];

export async function getStoryCategories(): Promise<StoryCategory[]> {
  const client = getSupabase();
  const stored = localStorage.getItem('bakenye_story_categories');
  if (!stored) {
    localStorage.setItem('bakenye_story_categories', JSON.stringify(defaultStoryCategories));
  }
  const localList = JSON.parse(localStorage.getItem('bakenye_story_categories') || '[]');

  if (!client) {
    return localList.filter((c: any) => !c.is_archived);
  }

  try {
    const { data, error } = await client.from('story_categories').select('*');
    if (error || !data || data.length === 0) {
      return localList.filter((c: any) => !c.is_archived);
    }
    return data.map((row: any) => ({
      id: row.id,
      name: row.name,
      description: row.description || '',
      fields: row.fields ? (typeof row.fields === 'string' ? JSON.parse(row.fields) : row.fields) : [],
      validation_rules: row.validation_rules || '',
      upload_requirements: row.upload_requirements || '',
      is_archived: row.is_archived || false
    }));
  } catch (err) {
    return localList.filter((c: any) => !c.is_archived);
  }
}

export async function saveStoryCategory(category: StoryCategory): Promise<boolean> {
  const client = getSupabase();
  const stored = localStorage.getItem('bakenye_story_categories') || '[]';
  const list = JSON.parse(stored);
  const idx = list.findIndex((c: any) => c.id === category.id);
  if (idx !== -1) {
    list[idx] = category;
  } else {
    list.push(category);
  }
  localStorage.setItem('bakenye_story_categories', JSON.stringify(list));

  if (!client) return true;

  try {
    const dbRecord = {
      id: category.id,
      name: category.name,
      description: category.description,
      fields: JSON.stringify(category.fields || []),
      validation_rules: category.validation_rules,
      upload_requirements: category.upload_requirements,
      is_archived: category.is_archived
    };
    await client.from('story_categories').upsert(dbRecord);
    return true;
  } catch (err) {
    return false;
  }
}

// ==========================================
// NOTIFICATIONS SERVICES (SUPABASE)
// ==========================================

export interface DBNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string; // 'system' | 'moderation' | 'social' | 'alert'
  link?: string;
  is_read: boolean;
  created_at: string;
}

export async function getUserNotifications(
  userId: string,
  limit = 10,
  offset = 0
): Promise<{ data: DBNotification[]; count: number; error: Error | null }> {
  const client = getSupabase();
  if (!client) {
    const stored = localStorage.getItem('bakenye_notifications') || '[]';
    try {
      const all = JSON.parse(stored);
      const sliced = all.slice(offset, offset + limit);
      return { data: sliced, count: all.length, error: null };
    } catch {
      return { data: [], count: 0, error: null };
    }
  }

  try {
    const { data, error, count } = await client
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return { data: data || [], count: count || 0, error: null };
  } catch (err: any) {
    console.error('getUserNotifications error:', err);
    return { data: [], count: 0, error: err };
  }
}

export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  const client = getSupabase();
  if (!client) {
    const stored = localStorage.getItem('bakenye_notifications') || '[]';
    try {
      const all = JSON.parse(stored);
      const updated = all.map((n: any) => n.id === notificationId ? { ...n, isRead: true } : n);
      localStorage.setItem('bakenyi_notifications', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    return true;
  }

  try {
    const { error } = await client
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('markNotificationAsRead error:', err);
    return false;
  }
}

export async function markAllNotificationsAsRead(userId: string): Promise<boolean> {
  const client = getSupabase();
  if (!client) {
    const stored = localStorage.getItem('bakenye_notifications') || '[]';
    try {
      const all = JSON.parse(stored);
      const updated = all.map((n: any) => ({ ...n, isRead: true }));
      localStorage.setItem('bakenyi_notifications', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    return true;
  }

  try {
    const { error } = await client
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('markAllNotificationsAsRead error:', err);
    return false;
  }
}

export async function getUnreadNotificationsCount(userId: string): Promise<number> {
  const client = getSupabase();
  if (!client) {
    const stored = localStorage.getItem('bakenye_notifications') || '[]';
    try {
      const all = JSON.parse(stored);
      return all.filter((n: any) => !n.isRead).length;
    } catch {
      return 0;
    }
  }

  try {
    const { count, error } = await client
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;
    return count || 0;
  } catch (err) {
    console.error('getUnreadNotificationsCount error:', err);
    return 0;
  }
}

// ==========================================
// ANALYTICS SERVICE (READING METRICS)
// ==========================================

export interface DBAnalyticsMetric {
  id: string;
  metric_type: string;
  content_type?: string;
  content_id?: string;
  user_id?: string;
  meta_data: any;
  created_at: string;
}

export async function fetchAnalyticsMetrics(
  dateRangeDays = 30
): Promise<{ data: DBAnalyticsMetric[]; error: Error | null }> {
  const client = getSupabase();
  if (!client) {
    return { data: [], error: new Error('Supabase is not configured.') };
  }

  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - dateRangeDays);

    const { data, error } = await client
      .from('analytics_metrics')
      .select('*')
      .gte('created_at', cutoffDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (err: any) {
    console.error('fetchAnalyticsMetrics error:', err);
    return { data: [], error: err };
  }
}

// ==========================================
// ELDER Q&A SERVICE ("CONSULT AN ELDER")
// ==========================================

export interface ElderQuestion {
  id: string;
  name: string;
  email: string;
  question: string;
  category: string;
  status: 'pending' | 'answered' | 'rejected' | 'archived';
  answer?: string;
  answered_by?: string;
  answered_at?: string;
  created_at: string;
}

const DEFAULT_FALLBACK_QUESTIONS: ElderQuestion[] = [];

function initializeElderQuestionsStorage() {
  if (!localStorage.getItem('bakenye_elder_questions')) {
    localStorage.setItem('bakenye_elder_questions', JSON.stringify(DEFAULT_FALLBACK_QUESTIONS));
  }
}

export async function getElderQuestions(onlyAnswered = true): Promise<ElderQuestion[]> {
  const client = getSupabase();
  initializeElderQuestionsStorage();
  const localList = JSON.parse(localStorage.getItem('bakenye_elder_questions') || '[]');

  if (!client) {
    return onlyAnswered 
      ? localList.filter((q: any) => q.status === 'answered') 
      : localList;
  }

  try {
    const { data, error } = await client
      .from('elder_questions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    const mapped = (data || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      question: row.question,
      category: row.category || 'General',
      status: row.status,
      answer: row.answer,
      answered_by: row.answered_by,
      answered_at: row.answered_at,
      created_at: row.created_at
    }));

    return onlyAnswered 
      ? mapped.filter(q => q.status === 'answered') 
      : mapped;
  } catch (err: any) {
    console.warn('Supabase fetch elder questions failed, using local storage fallback:', err);
    return onlyAnswered 
      ? localList.filter((q: any) => q.status === 'answered') 
      : localList;
  }
}

export async function submitElderQuestion(msg: { name: string; email: string; question: string; category: string }): Promise<{ data: ElderQuestion | null; error: Error | null }> {
  const client = getSupabase();
  initializeElderQuestionsStorage();
  const id = generateUUID();
  const completeMsg: ElderQuestion = { 
    ...msg, 
    id, 
    status: 'pending', 
    created_at: new Date().toISOString() 
  };

  const stored = localStorage.getItem('bakenye_elder_questions') || '[]';
  const list = JSON.parse(stored);
  list.unshift(completeMsg);
  localStorage.setItem('bakenye_elder_questions', JSON.stringify(list));

  if (!client) {
    return { data: completeMsg, error: null };
  }

  try {
    const { data, error } = await client.from('elder_questions').insert({
      id,
      name: msg.name,
      email: msg.email,
      question: msg.question,
      category: msg.category,
      status: 'pending'
    }).select().single();

    if (error) {
      // Retry with simpler object
      const { error: errorSimple } = await client.from('elder_questions').insert({
        name: msg.name,
        email: msg.email,
        question: msg.question,
        category: msg.category,
        status: 'pending'
      });
      if (errorSimple) throw errorSimple;
    }

    return { data: data || completeMsg, error: null };
  } catch (err: any) {
    console.warn('Supabase elder_questions write failed, saved to local cache:', err);
    return { data: completeMsg, error: null };
  }
}

export async function updateElderQuestionStatus(id: string, status: ElderQuestion['status'], answer?: string, answeredBy?: string): Promise<boolean> {
  const client = getSupabase();
  initializeElderQuestionsStorage();
  const stored = localStorage.getItem('bakenye_elder_questions') || '[]';
  const list = JSON.parse(stored);
  const idx = list.findIndex((q: any) => q.id === id);
  
  if (idx !== -1) {
    list[idx].status = status;
    if (answer !== undefined) {
      list[idx].answer = answer;
      list[idx].answered_at = new Date().toISOString();
    }
    if (answeredBy !== undefined) {
      list[idx].answered_by = answeredBy;
    }
    localStorage.setItem('bakenye_elder_questions', JSON.stringify(list));
  }

  if (!client) return true;

  try {
    const updatePayload: any = { status };
    if (answer !== undefined) {
      updatePayload.answer = answer;
      updatePayload.answered_at = new Date().toISOString();
    }
    if (answeredBy !== undefined) {
      updatePayload.answered_by = answeredBy;
    }

    const { error } = await client
      .from('elder_questions')
      .update(updatePayload)
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Failed to update elder question status:', err);
    return false;
  }
}

export async function deleteElderQuestion(id: string): Promise<boolean> {
  const client = getSupabase();
  initializeElderQuestionsStorage();
  const stored = localStorage.getItem('bakenye_elder_questions') || '[]';
  const list = JSON.parse(stored);
  const filtered = list.filter((q: any) => q.id !== id);
  localStorage.setItem('bakenye_elder_questions', JSON.stringify(filtered));

  if (!client) return true;

  try {
    const { error } = await client
      .from('elder_questions')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Failed to delete elder question:', err);
    return false;
  }
}

export async function subscribeNewsletter(email: string): Promise<{ success: boolean; error: Error | null }> {
  const client = getSupabase();
  const id = generateUUID();
  const entry = {
    id,
    email,
    created_at: new Date().toISOString()
  };

  // Local storage backup
  const stored = localStorage.getItem('bakenye_newsletter_subscribers') || '[]';
  const list = JSON.parse(stored);
  if (!list.some((item: any) => item.email === email)) {
    list.unshift(entry);
    localStorage.setItem('bakenye_newsletter_subscribers', JSON.stringify(list));
  }

  if (!client) {
    return { success: true, error: null };
  }

  try {
    // 1. Try to insert to newsletter_subscribers table if it exists
    const { error: subError } = await client.from('newsletter_subscribers').insert({
      email,
      created_at: new Date().toISOString()
    });

    if (!subError) {
      return { success: true, error: null };
    }

    // 2. If it fails (e.g. table doesn't exist), log as a contact message
    const { error: msgError } = await client.from('contact_messages').insert({
      name: 'Newsletter Subscriber',
      email,
      phone: '',
      subject: 'Newsletter Signup',
      message: `A user has signed up for the cultural newsletter: ${email}`,
      status: 'pending'
    });

    if (msgError) throw msgError;

    return { success: true, error: null };
  } catch (err: any) {
    console.warn('Newsletter subscription saved locally, database logged:', err);
    return { success: true, error: null };
  }
}




