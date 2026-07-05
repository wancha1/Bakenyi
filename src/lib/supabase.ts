import { Article } from '../types/article';
import { bakenyiArticles } from '../data/articlesData';
import { getSupabase } from './supabaseClient';

export const isSupabaseConfigured = (): boolean => {
  return getSupabase() !== null;
};

// Supabase client direct reference
export const supabase = getSupabase();

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
      const emailLower = email.toLowerCase();
      const isAdmin = 
        emailLower === 'admin@bakenye.com' || 
        emailLower === 'admin@bakenyi.org' || 
        emailLower === 'wanchaaaron@gmail.com' || 
        emailLower === 'aaronwancha@gmail.com';
      
      const role = isAdmin ? 'admin' : 'customer';
      
      // Upsert profile record
      await client.from('profiles').upsert({
        id: data.user.id,
        email: data.user.email,
        role: role,
        is_admin: isAdmin,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });
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

/**
 * Fetches all articles from Supabase with dynamic seeding fallback.
 * @param onlyPublished If true, only returns articles with status === 'published'.
 */
export async function getArticles(onlyPublished = true): Promise<Article[]> {
  const client = getSupabase();
  if (!client) {
    // If no client, fallback to localStorage with pre-seeded data
    const stored = localStorage.getItem('bakenye_demo_articles');
    let list: Article[] = [];
    if (stored) {
      list = JSON.parse(stored);
    } else {
      list = bakenyiArticles.map(art => ({
        ...art,
        status: art.status || 'published'
      }));
      localStorage.setItem('bakenye_demo_articles', JSON.stringify(list));
    }
    
    // Inject a pending article if missing to support the vetting workflow
    const hasPending = list.some(a => a.status === 'pending');
    if (!hasPending) {
      const pendingMock: Article = {
        id: 'mock-pending-art-1',
        title: 'Preserving the Soga Clan Drums: Oral Traditions',
        excerpt: 'A comprehensive study on the rhythmic heritage of Soga clan drums and their communicative historical purposes.',
        content: '# Oral Rhythms of the Soga\n\nFor generations, the drums have signaled times of harvesting, celebration, and spiritual consensus. This report details the specific timber used in drumming construction and the lineage of the master drummers.',
        category: 'Heritage',
        author: 'Reporter Nakabuye',
        publishedAt: new Date(Date.now() - 3600 * 1000).toISOString().split('T')[0],
        status: 'pending',
        views: 0,
        tags: ['Heritage', 'Oral Tradition']
      };
      list.unshift(pendingMock);
      localStorage.setItem('bakenye_demo_articles', JSON.stringify(list));
    }
    
    return onlyPublished ? list.filter(a => a.status === 'published') : list;
  }

  try {
    const { data, error } = await client
      .from('articles')
      .select('id, title, content, status, created_at, updated_at, published_at, summary')
      .order('published_at', { ascending: false });

    if (error) throw error;

    if (data && data.length > 0) {
      // Map database schema to frontend Article model
      const articles = data.map((row: any) => ({
        id: row.id,
        title: row.title,
        excerpt: row.summary || '',
        content: row.content || '',
        category: 'Heritage', // default or custom category if needed
        author: 'Bakenyi Committee', // default author
        publishedAt: row.published_at || row.created_at || new Date().toISOString().split('T')[0],
        status: row.status || 'published',
        views: 0,
        tags: ['Heritage']
      }));

      return onlyPublished ? articles.filter(a => a.status === 'published') : articles;
    }

    // Database is empty - let's seed it dynamically from bakenyiArticles
    console.log('Articles table is empty, seeding with bakenyiArticles...');
    const seedList = bakenyiArticles.map(art => ({
      id: art.id,
      title: art.title,
      content: art.content || '',
      status: 'published',
      published_at: art.publishedAt || new Date().toISOString(),
      summary: art.excerpt || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    // Perform individual inserts or bulk insert to bypass schema constraint differences
    for (const record of seedList) {
      await client.from('articles').upsert(record);
    }

    // Fetch again after seeding
    const { data: reFetched } = await client
      .from('articles')
      .select('id, title, content, status, created_at, updated_at, published_at, summary');

    if (reFetched) {
      const articles = reFetched.map((row: any) => ({
        id: row.id,
        title: row.title,
        excerpt: row.summary || '',
        content: row.content || '',
        category: 'Heritage',
        author: 'Bakenyi Committee',
        publishedAt: row.published_at || row.created_at || new Date().toISOString().split('T')[0],
        status: row.status || 'published',
        views: 0,
        tags: ['Heritage']
      }));
      return onlyPublished ? articles.filter(a => a.status === 'published') : articles;
    }

    return bakenyiArticles;
  } catch (err) {
    console.warn('Supabase fetch failed, falling back to static list:', err);
    return bakenyiArticles;
  }
}

/**
 * Fetches an article by its ID.
 */
export async function getArticleById(id: string): Promise<Article | null> {
  const client = getSupabase();
  if (!client) {
    const stored = localStorage.getItem('bakenye_demo_articles');
    if (stored) {
      const list: Article[] = JSON.parse(stored);
      const art = list.find(a => a.id === id);
      if (art) return art;
    }
    const localArticle = bakenyiArticles.find(a => a.id === id);
    return localArticle || null;
  }

  try {
    const { data, error } = await client
      .from('articles')
      .select('id, title, content, status, created_at, updated_at, published_at, summary')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (data) {
      return {
        id: data.id,
        title: data.title,
        excerpt: data.summary || '',
        content: data.content || '',
        category: 'Heritage',
        author: 'Bakenyi Committee',
        publishedAt: data.published_at || data.created_at || new Date().toISOString().split('T')[0],
        status: data.status || 'published',
        views: 0,
        tags: ['Heritage']
      };
    }
  } catch (err) {
    console.warn(`Supabase read for ID ${id} failed:`, err);
  }

  const localArticle = bakenyiArticles.find(a => a.id === id);
  return localArticle || null;
}

/**
 * Creates a new article in Supabase.
 */
export async function createArticle(article: Omit<Article, 'id'>): Promise<{ data: Article | null; error: Error | null }> {
  const client = getSupabase();
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

  // Sandbox Save
  const stored = localStorage.getItem('bakenye_demo_articles');
  const list = stored ? JSON.parse(stored) : [];
  list.unshift(newArticle);
  localStorage.setItem('bakenye_demo_articles', JSON.stringify(list));

  if (!client) {
    return { data: newArticle, error: null };
  }

  try {
    const dbRecord = {
      id: generatedId,
      title: article.title,
      content: article.content || '',
      status: article.status || 'draft',
      published_at: article.publishedAt || new Date().toISOString().split('T')[0],
      summary: article.excerpt || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error } = await client.from('articles').insert(dbRecord);
    if (error) throw error;
    return { data: newArticle, error: null };
  } catch (err: any) {
    console.error('Supabase create article failed:', err);
    return { data: null, error: err };
  }
}

/**
 * Updates an existing article.
 */
export async function updateArticle(id: string, articleUpdates: Partial<Article>): Promise<{ data: Article | null; error: Error | null }> {
  const client = getSupabase();
  
  // Sandbox update
  const stored = localStorage.getItem('bakenye_demo_articles');
  let updatedRecord: Article | null = null;
  if (stored) {
    const list: Article[] = JSON.parse(stored);
    const index = list.findIndex(a => a.id === id);
    if (index !== -1) {
      list[index] = { ...list[index], ...articleUpdates };
      updatedRecord = list[index];
      localStorage.setItem('bakenye_demo_articles', JSON.stringify(list));
    }
  }

  if (!client) {
    if (updatedRecord) {
      return { data: updatedRecord, error: null };
    }
    return { data: null, error: new Error('Article not found in sandbox.') };
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
    if (articleUpdates.title !== undefined) dbRecord.title = articleUpdates.title;
    if (articleUpdates.content !== undefined) dbRecord.content = articleUpdates.content;
    if (articleUpdates.status !== undefined) dbRecord.status = articleUpdates.status;
    if (articleUpdates.publishedAt !== undefined) dbRecord.published_at = articleUpdates.publishedAt;
    if (articleUpdates.excerpt !== undefined) dbRecord.summary = articleUpdates.excerpt;

    const { error } = await client.from('articles').update(dbRecord).eq('id', id);
    if (error) throw error;

    return { data: updated, error: null };
  } catch (err: any) {
    console.error(`Supabase update article ${id} failed:`, err);
    return { data: null, error: err };
  }
}

/**
 * Deletes an article from the database.
 */
export async function deleteArticle(id: string): Promise<{ success: boolean; error: Error | null }> {
  const client = getSupabase();
  
  const stored = localStorage.getItem('bakenye_demo_articles');
  if (stored) {
    const list: Article[] = JSON.parse(stored);
    const filtered = list.filter(a => a.id !== id);
    localStorage.setItem('bakenye_demo_articles', JSON.stringify(filtered));
  }

  if (!client) {
    return { success: true, error: null };
  }

  try {
    const { error } = await client.from('articles').delete().eq('id', id);
    if (error) throw error;
    return { success: true, error: null };
  } catch (err: any) {
    console.error(`Supabase delete article ${id} failed:`, err);
    return { success: false, error: err };
  }
}

// ==========================================
// UNIFIED STORAGE SERVICES (EMULATED & REAL)
// ==========================================

export async function uploadMedia(file: File, type: 'images' | 'pdfs'): Promise<{ url: string; error: Error | null }> {
  const client = getSupabase();
  if (!client) {
    return emulateFileUpload(file);
  }

  try {
    const bucketName = type === 'images' ? 'media' : 'pdf-attachments';
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 10)}.${fileExt}`;
    
    // First ensure the bucket exists/we can upload to it
    const { data, error } = await client.storage.from(bucketName).upload(fileName, file);
    if (error) {
      console.warn(`Storage upload to ${bucketName} failed (bucket might not exist), falling back to Base64:`, error);
      return emulateFileUpload(file);
    }

    const { data: { publicUrl } } = client.storage.from(bucketName).getPublicUrl(fileName);
    return { url: publicUrl, error: null };
  } catch (err: any) {
    return emulateFileUpload(file);
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
    return JSON.parse(stored);
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

    if (userId) {
      return list.filter(item => item.userId === userId);
    }
    return list;
  } catch (err) {
    console.error('getContributions failed:', err);
    return [];
  }
}

export async function createContribution(
  title: string,
  description: string,
  type: string,
  imageUrl: string,
  userEmail: string,
  userId: string
): Promise<{ data: Contribution | null; error: Error | null }> {
  const client = getSupabase();
  const id = `contrib-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const contentStr = JSON.stringify({ description, imageUrl, type, userEmail, userId });

  const contributionObj: Contribution = {
    id,
    title,
    status: 'pending',
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
    const { error } = await client.from('contributions').insert({
      id,
      title,
      content: contentStr,
      status: 'pending',
      created_at: new Date().toISOString()
    });

    if (error) throw error;
    return { data: contributionObj, error: null };
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
    const { error } = await client.from('contributions').update({ status }).eq('id', id);
    if (error) throw error;
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
}

export async function getGalleryImages(): Promise<GalleryImage[]> {
  const client = getSupabase();
  
  const staticGallery = [
    {
      id: "h1",
      title: "Canoe on Lake Kyoga",
      imageUrl: "https://images.unsplash.com/photo-1523805009345-7448845a9e53?auto=format&fit=crop&q=80&w=800",
      category: "Landscape",
      description: "A traditional wooden canoe at sunset, reflecting the Bakenyi's deep connection to the floating islands of Lake Kyoga."
    },
    {
      id: "h2",
      title: "Basket Weaving Art",
      imageUrl: "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&q=80&w=800",
      category: "Craft",
      description: "Intricate patterns passed down through generations, utilizing local reeds and papyrus from the marshlands."
    },
    {
      id: "h3",
      title: "Ancestral Site",
      imageUrl: "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&q=80&w=800",
      category: "History",
      description: "A sacred gathering place where Lukenye is still spoken in its purest form during seasonal ceremonies."
    },
    {
      id: "h4",
      title: "Community Festival",
      imageUrl: "https://images.unsplash.com/photo-1493246507139-91e8bef99c02?auto=format&fit=crop&q=80&w=800",
      category: "Tradition",
      description: "Celebration of the harvest, bringing together clans from across the region to share stories and feast."
    }
  ];

  if (!client) {
    const stored = localStorage.getItem('supabase_emulated_gallery') || '[]';
    return [...JSON.parse(stored), ...staticGallery];
  }

  try {
    const { data, error } = await client.from('gallery').select('id, title, image_url, created_at');
    if (error) throw error;

    if (data && data.length > 0) {
      const list = data.map((row: any) => {
        let titleVal = row.title;
        let desc = '';
        let cat = 'General';
        
        // Check if title is serialized JSON holding title, description and category
        try {
          if (titleVal.startsWith('{')) {
            const parsed = JSON.parse(titleVal);
            titleVal = parsed.title;
            desc = parsed.description || '';
            cat = parsed.category || 'General';
          }
        } catch (e) {}

        return {
          id: row.id,
          title: titleVal,
          imageUrl: row.image_url,
          created_at: row.created_at,
          description: desc,
          category: cat
        };
      });

      return [...list, ...staticGallery];
    }

    // Database is empty, let's seed with staticGallery
    console.log('Gallery table is empty, seeding...');
    for (const img of staticGallery) {
      const titleStr = JSON.stringify({ title: img.title, description: img.description, category: img.category });
      await client.from('gallery').upsert({
        id: img.id,
        title: titleStr,
        image_url: img.imageUrl,
        created_at: new Date().toISOString()
      });
    }

    // Fetch again
    const { data: reFetched } = await client.from('gallery').select('id, title, image_url, created_at');
    if (reFetched) {
      return reFetched.map((row: any) => {
        let titleVal = row.title;
        let desc = '';
        let cat = 'General';
        try {
          if (titleVal.startsWith('{')) {
            const parsed = JSON.parse(titleVal);
            titleVal = parsed.title;
            desc = parsed.description || '';
            cat = parsed.category || 'General';
          }
        } catch (e) {}

        return {
          id: row.id,
          title: titleVal,
          imageUrl: row.image_url,
          created_at: row.created_at,
          description: desc,
          category: cat
        };
      });
    }

    return staticGallery;
  } catch (err) {
    console.error('getGalleryImages failed:', err);
    return staticGallery;
  }
}

export async function addGalleryImage(
  title: string,
  imageUrl: string,
  description: string,
  category: string
): Promise<{ data: GalleryImage | null; error: Error | null }> {
  const client = getSupabase();
  const id = `gal-${Date.now()}`;
  const titleStr = JSON.stringify({ title, description, category });

  const galleryObj: GalleryImage = {
    id,
    title,
    imageUrl,
    created_at: new Date().toISOString(),
    description,
    category
  };

  if (!client) {
    const stored = localStorage.getItem('supabase_emulated_gallery') || '[]';
    const list = JSON.parse(stored);
    list.unshift(galleryObj);
    localStorage.setItem('supabase_emulated_gallery', JSON.stringify(list));
    return { data: galleryObj, error: null };
  }

  try {
    const { error } = await client.from('gallery').insert({
      id,
      title: titleStr,
      image_url: imageUrl,
      created_at: new Date().toISOString()
    });

    if (error) throw error;
    return { data: galleryObj, error: null };
  } catch (err: any) {
    console.error('addGalleryImage failed:', err);
    return { data: null, error: err };
  }
}

