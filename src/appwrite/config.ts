import { Client, Account, Databases, Storage } from 'appwrite';

const endpoint = (import.meta as any).env.VITE_APPWRITE_ENDPOINT || 'https://syd.cloud.appwrite.io/v1';
const projectId = (import.meta as any).env.VITE_APPWRITE_PROJECT_ID || '6a4798740009f5062fff';

export const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId);

// Safely define the ping() method to test endpoint connection
(client as any).ping = async function() {
  try {
    // A non-blocking fetch call to verify server connectivity without failing CORS checks
    await fetch(endpoint, { method: 'GET', mode: 'no-cors' });
    console.log("Appwrite connection ping sent successfully.");
  } catch (err) {
    console.warn("Appwrite connection ping failed to reach the server:", err);
  }
};

// Ping Appwrite server on application initialization
try {
  (client as any).ping();
} catch (pingErr) {
  console.warn("Appwrite connection ping could not be verified on load", pingErr);
}

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

export const DATABASE_ID = (import.meta as any).env.VITE_APPWRITE_DATABASE_ID || 'bakenyi_db';
export const COLLECTION_USERS = (import.meta as any).env.VITE_APPWRITE_USERS_COLLECTION_ID || 'users';
export const COLLECTION_NEWS = (import.meta as any).env.VITE_APPWRITE_NEWS_COLLECTION_ID || 'news';
export const COLLECTION_BLOGS = (import.meta as any).env.VITE_APPWRITE_BLOGS_COLLECTION_ID || 'blogs';
export const COLLECTION_VLOGS = (import.meta as any).env.VITE_APPWRITE_VLOGS_COLLECTION_ID || 'vlogs';
export const COLLECTION_GALLERY = (import.meta as any).env.VITE_APPWRITE_GALLERY_COLLECTION_ID || 'gallery';
export const COLLECTION_CATEGORIES = (import.meta as any).env.VITE_APPWRITE_CATEGORIES_COLLECTION_ID || 'categories';
export const COLLECTION_COMMENTS = (import.meta as any).env.VITE_APPWRITE_COMMENTS_COLLECTION_ID || 'comments';
export const COLLECTION_CONTRIBUTIONS = (import.meta as any).env.VITE_APPWRITE_CONTRIBUTIONS_COLLECTION_ID || 'contributions';
export const COLLECTION_ARTICLES = (import.meta as any).env.VITE_APPWRITE_ARTICLES_COLLECTION_ID || 'articles';
export const BUCKET_ID = (import.meta as any).env.VITE_APPWRITE_STORAGE_BUCKET_ID || 'bakenyi_bucket';
