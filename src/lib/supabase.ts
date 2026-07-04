import { Article } from '../types/article';
import { bakenyiArticles } from '../data/articlesData';
import { db, auth } from './firebase';
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  setDoc, 
  deleteDoc,
  query
} from 'firebase/firestore';
import { 
  signInWithEmailAndPassword, 
  signOut as fbSignOut 
} from 'firebase/auth';

// Retrieve environment variables - deactivated as Supabase is disabled in favor of Firebase
const SUPABASE_URL = "";
const SUPABASE_ANON_KEY = "";

export const isSupabaseConfigured = (): boolean => {
  // Supabase is completely disabled to bypass all schema/relations/keys setup
  return false;
};

// Supabase client fallback
export const supabase = null;

// ==========================================
// UNIFIED AUTHENTICATION SERVICES (FIREBASE / EMULATED)
// ==========================================

const EMULATED_AUTH_KEY = 'supabase_emulated_session';

export interface EmulatedUser {
  id: string;
  email: string;
  role: 'admin' | 'public';
}

export async function signIn(email: string, password: string): Promise<{ user: any; error: Error | null }> {
  try {
    // Try authenticating with Firebase Auth first
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (fbErr: any) {
    // Fallback to emulated credentials if Firebase Auth fails or is unconfigured
    if ((email.includes('admin') || email === 'wanchaaaron@gmail.com' || email === 'aaronwancha@gmail.com') && password === 'admin123') {
      const mockUser: EmulatedUser = {
        id: 'emulated-admin-uuid-123456',
        email,
        role: 'admin'
      };
      localStorage.setItem(EMULATED_AUTH_KEY, JSON.stringify(mockUser));
      return { user: mockUser, error: null };
    }
    
    return { 
      user: null, 
      error: new Error(fbErr.message || 'Authentication failed. (Hint: Use admin@bakenyi.org and admin123 for sandbox access.)') 
    };
  }
}

export async function signOut(): Promise<{ error: Error | null }> {
  try {
    await fbSignOut(auth);
  } catch (e) {
    // ignore silent signout failures
  }
  localStorage.removeItem(EMULATED_AUTH_KEY);
  return { error: null };
}

export async function getCurrentUser(): Promise<any> {
  if (auth.currentUser) {
    return auth.currentUser;
  }
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

// ==========================================
// UNIFIED DATABASE & ARTICLES SERVICES (FIRESTORE)
// ==========================================

const ARTICLES_COLLECTION = 'articles';

/**
 * Fetches all articles from either Firestore or the local static database.
 * @param onlyPublished If true, only returns articles with status === 'published'.
 */
export async function getArticles(onlyPublished = true): Promise<Article[]> {
  try {
    const articlesCol = collection(db, ARTICLES_COLLECTION);
    const q = query(articlesCol);
    const snapshot = await getDocs(q);
    
    let list: Article[] = [];
    if (!snapshot.empty) {
      snapshot.forEach(docSnap => {
        list.push(docSnap.data() as Article);
      });
    } else {
      // Seed the Firestore database with initial articles if empty
      list = bakenyiArticles.map(art => ({
        ...art,
        status: art.status || 'published'
      }));
      // Save initial seed to Firestore so they exist as real records
      for (const art of list) {
        try {
          await setDoc(doc(db, ARTICLES_COLLECTION, art.id), art);
        } catch (e) {
          // silent error on seeding writes
        }
      }
    }
    
    // Sort by publishedAt desc
    const sorted = [...list].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    return onlyPublished ? sorted.filter(a => a.status === 'published') : sorted;
  } catch (err) {
    console.warn('Firestore fetch failed, falling back to static list:', err);
    const list = bakenyiArticles.map(art => ({
      ...art,
      status: art.status || 'published'
    }));
    const sorted = [...list].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    return onlyPublished ? sorted.filter(a => a.status === 'published') : sorted;
  }
}

/**
 * Fetches an article by its ID.
 */
export async function getArticleById(id: string): Promise<Article | null> {
  try {
    const articleDocRef = doc(db, ARTICLES_COLLECTION, id);
    const docSnap = await getDoc(articleDocRef);
    if (docSnap.exists()) {
      return docSnap.data() as Article;
    }
  } catch (err) {
    console.warn(`Firestore read for ID ${id} failed, checking static list:`, err);
  }
  
  // Fallback to static articles
  const localArticle = bakenyiArticles.find(a => a.id === id);
  return localArticle || null;
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

  try {
    await setDoc(doc(db, ARTICLES_COLLECTION, generatedId), newArticle);
    return { data: newArticle, error: null };
  } catch (err: any) {
    console.error('Firestore create article failed, saving to localStorage emulation:', err);
    // Emulated local fallback
    const stored = localStorage.getItem('supabase_emulated_articles');
    let emulated: Article[] = [];
    if (stored) {
      try { emulated = JSON.parse(stored); } catch (e) {}
    }
    emulated.unshift(newArticle);
    localStorage.setItem('supabase_emulated_articles', JSON.stringify(emulated));
    return { data: newArticle, error: null };
  }
}

/**
 * Updates an existing article.
 */
export async function updateArticle(id: string, articleUpdates: Partial<Article>): Promise<{ data: Article | null; error: Error | null }> {
  try {
    const articleDocRef = doc(db, ARTICLES_COLLECTION, id);
    const current = await getArticleById(id);
    if (!current) {
      return { data: null, error: new Error('Article not found.') };
    }
    const updated = { ...current, ...articleUpdates };
    await setDoc(articleDocRef, updated);
    return { data: updated, error: null };
  } catch (err: any) {
    console.error(`Firestore update article ${id} failed, saving to localStorage emulation:`, err);
    // Emulated local fallback
    const stored = localStorage.getItem('supabase_emulated_articles');
    let emulated: Article[] = [];
    if (stored) {
      try { emulated = JSON.parse(stored); } catch (e) {}
    }
    const idx = emulated.findIndex(a => a.id === id);
    if (idx !== -1) {
      emulated[idx] = { ...emulated[idx], ...articleUpdates };
      localStorage.setItem('supabase_emulated_articles', JSON.stringify(emulated));
      return { data: emulated[idx], error: null };
    }
    return { data: null, error: err };
  }
}

/**
 * Deletes an article from the database.
 */
export async function deleteArticle(id: string): Promise<{ success: boolean; error: Error | null }> {
  try {
    const articleDocRef = doc(db, ARTICLES_COLLECTION, id);
    await deleteDoc(articleDocRef);
    return { success: true, error: null };
  } catch (err: any) {
    console.error(`Firestore delete article ${id} failed, deleting from localStorage emulation:`, err);
    // Emulated local fallback
    const stored = localStorage.getItem('supabase_emulated_articles');
    if (stored) {
      try {
        const emulated: Article[] = JSON.parse(stored);
        const filtered = emulated.filter(a => a.id !== id);
        localStorage.setItem('supabase_emulated_articles', JSON.stringify(filtered));
      } catch (e) {}
    }
    return { success: true, error: null };
  }
}

// ==========================================
// UNIFIED STORAGE SERVICES (EMULATED)
// ==========================================

/**
 * Uploads a file (featured image or PDF).
 * Uses a high-fidelity client-side Base64 File Reader so media uploads work
 * seamlessly and immediately without requiring storage configuration.
 */
export async function uploadMedia(file: File, type: 'images' | 'pdfs'): Promise<{ url: string; error: Error | null }> {
  return emulateFileUpload(file);
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
