import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  setDoc, 
  query, 
  orderBy,
  updateDoc,
  increment
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { handleFirestoreError, OperationType } from './firestoreUtils';
import { Article } from '../types/article';
import { bakenyiArticles } from '../data/articlesData';

const ARTICLES_COLLECTION = 'articles';

/**
 * Checks if the current authenticated user has admin privileges.
 */
export function isUserAdmin(): boolean {
  const email = auth.currentUser?.email;
  return (email === 'wanchaaaron@gmail.com' || email === 'aaronwancha@gmail.com') && auth.currentUser?.emailVerified === true;
}

/**
 * Seeds the Firestore database with initial articles if they don't exist.
 * This is designed to fail gracefully if the user doesn't have write permissions.
 */
export async function seedArticlesIfEmpty(): Promise<void> {
  if (!isUserAdmin()) return; // Only admins can seed

  try {
    const articlesCol = collection(db, ARTICLES_COLLECTION);
    const snapshot = await getDocs(articlesCol);
    if (snapshot.empty) {
      console.log('Seeding initial Bakenyi articles into Firestore...');
      for (const article of bakenyiArticles) {
        await setDoc(doc(db, ARTICLES_COLLECTION, article.id), {
          ...article,
          views: article.views || 0,
        });
      }
      console.log('Seeding completed successfully.');
    }
  } catch (error) {
    console.warn('Silent Seeding Warning: Seeding did not complete. This is normal if write permissions are restricted.', error);
  }
}

/**
 * Fetches all articles from Firestore.
 * Falls back to static articles if offline or if no records are found in Firestore.
 */
export async function fetchArticles(): Promise<Article[]> {
  try {
    const articlesCol = collection(db, ARTICLES_COLLECTION);
    const snapshot = await getDocs(articlesCol);
    
    if (snapshot.empty) {
      // Try to seed if we're admin, then return the static list
      await seedArticlesIfEmpty();
      return bakenyiArticles;
    }

    const articles: Article[] = [];
    snapshot.forEach((docSnap) => {
      articles.push(docSnap.data() as Article);
    });

    // Sort by publication date descending
    return articles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  } catch (error) {
    console.warn('Firestore articles fetch failed, falling back to local data.', error);
    // Since this might be due to offline status or permissions, we fallback to local static data
    return bakenyiArticles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  }
}

/**
 * Fetches a single article by ID.
 * Falls back to local list if Firestore fetch fails or if the article is not found in Firestore.
 */
export async function fetchArticleById(id: string): Promise<Article | null> {
  try {
    const articleDocRef = doc(db, ARTICLES_COLLECTION, id);
    const docSnap = await getDoc(articleDocRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as Article;
    }
    
    // Fallback to static articles
    const localArticle = bakenyiArticles.find(a => a.id === id);
    return localArticle || null;
  } catch (error) {
    console.warn(`Firestore article fetch for ID ${id} failed. Falling back to local data.`, error);
    const localArticle = bakenyiArticles.find(a => a.id === id);
    return localArticle || null;
  }
}

/**
 * Increments the view count of an article.
 * Fails silently so it doesn't disrupt reading.
 */
export async function incrementArticleViews(id: string): Promise<void> {
  try {
    if (!isUserAdmin()) return; // Restrict updates to admins as per security rules or ignore
    const articleDocRef = doc(db, ARTICLES_COLLECTION, id);
    await updateDoc(articleDocRef, {
      views: increment(1)
    });
  } catch (error) {
    // Silently ignore updates if not allowed or offline
  }
}
