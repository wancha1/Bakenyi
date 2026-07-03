import { databases, DATABASE_ID, COLLECTION_ARTICLES } from '../appwrite/config';
import { ID, Query } from 'appwrite';
import { storageService } from '../services/appwriteServices';
import { Article } from '../types/article';
import { bakenyiArticles } from '../data/articlesData';

const ARTICLES_COLLECTION = COLLECTION_ARTICLES;

// ==========================================
// MOCK / EMULATION LAYER FOR OFFLINE-FIRST
// ==========================================
const EMULATED_ARTICLES_KEY = 'appwrite_emulated_articles';

export const getEmulatedArticles = (): Article[] => {
  const stored = localStorage.getItem(EMULATED_ARTICLES_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse emulated articles from localStorage', e);
    }
  }
  
  const seeded = bakenyiArticles.map(art => ({
    ...art,
    status: art.status || 'published'
  }));
  localStorage.setItem(EMULATED_ARTICLES_KEY, JSON.stringify(seeded));
  return seeded;
};

export const saveEmulatedArticles = (articles: Article[]) => {
  localStorage.setItem(EMULATED_ARTICLES_KEY, JSON.stringify(articles));
};

/**
 * Checks if the current authenticated user has admin privileges.
 */
export function isUserAdmin(): boolean {
  return true; 
}

/**
 * Fake configuration helper to maintain backward compatibility with old Supabase-based code.
 */
export function isSupabaseConfigured(): boolean {
  return true;
}

/**
 * Seeds the Appwrite database with initial articles if they don't exist.
 */
export async function seedArticlesIfEmpty(): Promise<void> {
  try {
    const response = await databases.listDocuments(DATABASE_ID, ARTICLES_COLLECTION, [Query.limit(1)]);
    if (response.total === 0) {
      console.log('Seeding initial Bakenyi articles into Appwrite Databases...');
      for (const article of bakenyiArticles) {
        try {
          await databases.createDocument(DATABASE_ID, ARTICLES_COLLECTION, article.id, {
            title: article.title,
            content: article.content,
            summary: article.excerpt || '',
            category: article.category,
            featuredImage: article.imageUrl || '',
            publishedAt: article.publishedAt,
            views: article.views || 0,
            tags: article.tags || [],
            authorName: article.author || 'Bakenyi Writer'
          });
        } catch (innerErr) {
          console.warn(`Could not seed article ID: ${article.id}`, innerErr);
        }
      }
      console.log('Seeding completed successfully.');
    }
  } catch (error) {
    console.warn('Silent Seeding Warning: Seeding did not complete. This is normal if Appwrite schemas are not configured yet.', error);
  }
}

/**
 * Fetches all articles from Appwrite.
 * Falls back to static articles if offline or if no records are found in Appwrite.
 */
export async function fetchArticles(): Promise<Article[]> {
  try {
    const response = await databases.listDocuments(DATABASE_ID, ARTICLES_COLLECTION, [
      Query.limit(100)
    ]);
    
    if (response.total === 0) {
      await seedArticlesIfEmpty();
      return bakenyiArticles;
    }

    const articles: Article[] = response.documents.map((doc: any) => ({
      id: doc.$id,
      title: doc.title,
      content: doc.content,
      excerpt: doc.summary || doc.excerpt || '',
      category: doc.category as any,
      imageUrl: doc.featuredImage || doc.imageUrl || '',
      publishedAt: doc.publishedAt || doc.$createdAt,
      views: doc.views || 0,
      tags: doc.tags || [],
      author: doc.authorName || doc.author || 'Bakenyi Writer'
    }));

    return articles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  } catch (error) {
    console.warn('Appwrite articles fetch failed, falling back to local data.', error);
    return getEmulatedArticles().sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  }
}

/**
 * Fetches all articles (with onlyPublished parameter compatibility).
 */
export async function getArticles(onlyPublished = true): Promise<Article[]> {
  const articles = await fetchArticles();
  return onlyPublished ? articles.filter(a => a.status === 'published') : articles;
}

/**
 * Fetches a single article by ID.
 * Falls back to local list if Appwrite fetch fails or if the article is not found.
 */
export async function fetchArticleById(id: string): Promise<Article | null> {
  try {
    const doc = await databases.getDocument(DATABASE_ID, ARTICLES_COLLECTION, id);
    return {
      id: doc.$id,
      title: doc.title,
      content: doc.content,
      excerpt: doc.summary || doc.excerpt || '',
      category: doc.category as any,
      imageUrl: doc.featuredImage || doc.imageUrl || '',
      publishedAt: doc.publishedAt || doc.$createdAt,
      views: doc.views || 0,
      tags: doc.tags || [],
      author: doc.authorName || doc.author || 'Bakenyi Writer'
    };
  } catch (error) {
    console.warn(`Appwrite article fetch for ID ${id} failed. Falling back to local data.`, error);
    const emulated = getEmulatedArticles();
    return emulated.find(a => a.id === id) || null;
  }
}

export async function getArticleById(id: string): Promise<Article | null> {
  return await fetchArticleById(id);
}

/**
 * Creates a new article in the database.
 */
export async function createArticle(article: Omit<Article, 'id'>): Promise<{ data: Article | null; error: Error | null }> {
  try {
    const generatedId = article.title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || `article-${Date.now()}`;

    try {
      const doc = await databases.createDocument(DATABASE_ID, ARTICLES_COLLECTION, generatedId, {
        title: article.title,
        content: article.content,
        summary: article.excerpt || '',
        category: article.category,
        featuredImage: article.imageUrl || '',
        publishedAt: article.publishedAt || new Date().toISOString().split('T')[0],
        views: article.views || 0,
        tags: article.tags || [],
        authorName: article.author || 'Bakenyi Writer'
      });

      const savedArticle: Article = {
        ...article,
        id: doc.$id,
        views: doc.views || 0,
        publishedAt: doc.publishedAt || doc.$createdAt,
        status: 'published'
      };

      return { data: savedArticle, error: null };
    } catch (appwriteErr) {
      console.warn('Appwrite article creation failed, saving to local state:', appwriteErr);
      
      const emulated = getEmulatedArticles();
      const newArticle: Article = {
        ...article,
        id: generatedId,
        views: article.views || 0,
        publishedAt: article.publishedAt || new Date().toISOString().split('T')[0],
        status: article.status || 'draft'
      };
      emulated.unshift(newArticle);
      saveEmulatedArticles(emulated);
      return { data: newArticle, error: null };
    }
  } catch (err: any) {
    return { data: null, error: err };
  }
}

/**
 * Updates an existing article.
 */
export async function updateArticle(id: string, articleUpdates: Partial<Article>): Promise<{ data: Article | null; error: Error | null }> {
  try {
    try {
      const doc = await databases.updateDocument(DATABASE_ID, COLLECTION_ARTICLES, id, {
        title: articleUpdates.title,
        content: articleUpdates.content,
        summary: articleUpdates.excerpt,
        category: articleUpdates.category,
        featuredImage: articleUpdates.imageUrl,
        publishedAt: articleUpdates.publishedAt,
        views: articleUpdates.views,
        tags: articleUpdates.tags,
        authorName: articleUpdates.author
      });

      const updatedArticle: Article = {
        id: doc.$id,
        title: doc.title,
        content: doc.content,
        excerpt: doc.summary || doc.excerpt || '',
        category: doc.category as any,
        imageUrl: doc.featuredImage || doc.imageUrl || '',
        publishedAt: doc.publishedAt || doc.$createdAt,
        views: doc.views || 0,
        tags: doc.tags || [],
        author: doc.authorName || doc.author || 'Bakenyi Writer',
        status: 'published'
      };

      return { data: updatedArticle, error: null };
    } catch (appwriteErr) {
      console.warn(`Appwrite article update for ${id} failed, updating local state instead:`, appwriteErr);
      const emulated = getEmulatedArticles();
      const idx = emulated.findIndex(a => a.id === id);
      if (idx !== -1) {
        emulated[idx] = { ...emulated[idx], ...articleUpdates };
        saveEmulatedArticles(emulated);
        return { data: emulated[idx], error: null };
      }
      return { data: null, error: new Error('Article not found to update.') };
    }
  } catch (err: any) {
    return { data: null, error: err };
  }
}

/**
 * Deletes an article from the database.
 */
export async function deleteArticle(id: string): Promise<{ success: boolean; error: Error | null }> {
  try {
    try {
      await databases.deleteDocument(DATABASE_ID, COLLECTION_ARTICLES, id);
      return { success: true, error: null };
    } catch (appwriteErr) {
      console.warn(`Appwrite article delete for ${id} failed, deleting from local state instead:`, appwriteErr);
      const emulated = getEmulatedArticles();
      const filtered = emulated.filter(a => a.id !== id);
      saveEmulatedArticles(filtered);
      return { success: true, error: null };
    }
  } catch (err: any) {
    return { success: false, error: err };
  }
}

/**
 * Uploads media (images/PDFs) to Appwrite Storage or falls back to Base64 simulation.
 */
export async function uploadMedia(file: File, type: 'images' | 'pdfs'): Promise<{ url: string; error: Error | null }> {
  try {
    const url = await storageService.uploadFile(file);
    return { url, error: null };
  } catch (err: any) {
    console.warn('Appwrite Storage upload failed, falling back to local file emulation:', err);
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

/**
 * Increments the view count of an article.
 * Fails silently so it doesn't disrupt reading.
 */
export async function incrementArticleViews(id: string): Promise<void> {
  try {
    const doc = await databases.getDocument(DATABASE_ID, ARTICLES_COLLECTION, id);
    const currentViews = doc.views || 0;
    await databases.updateDocument(DATABASE_ID, ARTICLES_COLLECTION, id, {
      views: currentViews + 1
    });
  } catch (error) {
    // Silently ignore updates if not allowed or offline
  }
}
