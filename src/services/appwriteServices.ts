import { ID, Query, Permission, Role } from 'appwrite';
import { 
  client, 
  account, 
  databases, 
  storage, 
  DATABASE_ID, 
  COLLECTION_USERS, 
  COLLECTION_NEWS, 
  COLLECTION_BLOGS, 
  COLLECTION_VLOGS, 
  COLLECTION_GALLERY, 
  COLLECTION_CATEGORIES, 
  COLLECTION_COMMENTS, 
  COLLECTION_CONTRIBUTIONS, 
  COLLECTION_ARTICLES, 
  BUCKET_ID 
} from '../appwrite/config';

// --- Shared Types ---
export type UserRole = 'super_admin' | 'admin' | 'editor' | 'reporter';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  status: 'active' | 'inactive' | 'pending';
  createdAt: string;
}

export interface NewsBlogItem {
  id?: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  featuredImage: string;
  authorId: string;
  authorName: string;
  category: string;
  tags: string[];
  status: 'draft' | 'pending' | 'published';
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface VlogItem {
  id?: string;
  title: string;
  thumbnailImage: string;
  youtubeUrl: string;
  description: string;
  publishDate: string;
}

export interface GalleryAlbum {
  id?: string;
  title: string;
  description?: string;
  images: Array<{ url: string; caption?: string }>;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface CategoryItem {
  id?: string;
  name: string;
  slug: string;
  description?: string;
  createdAt: string;
}

export interface CommentItem {
  id?: string;
  articleId: string;
  authorName: string;
  authorEmail: string;
  content: string;
  createdAt: string;
}

export interface ContributionItem {
  id?: string;
  userId: string;
  userEmail: string;
  title: string;
  description: string;
  type: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  imageUrl: string;
}

// ==========================================
// 1. AUTH SERVICE
// ==========================================
export const authService = {
  async getCurrentUser() {
    try {
      const u = await account.get();
      return {
        uid: u.$id,
        email: u.email,
        displayName: u.name,
        emailVerified: u.emailVerification,
      };
    } catch (err) {
      return null;
    }
  },

  async login(email: string, password: string) {
    return await account.createEmailPasswordSession(email, password);
  },

  async register(email: string, password: string, name: string) {
    const userId = ID.unique();
    await account.create(userId, email, password, name || email.split('@')[0]);
    return await account.createEmailPasswordSession(email, password);
  },

  async logout() {
    try {
      return await account.deleteSession('current');
    } catch (err) {
      console.warn("No active session to logout from", err);
    }
  },

  loginWithGoogle() {
    return account.createOAuth2Session(
      'google' as any,
      window.location.origin + window.location.pathname,
      window.location.origin + window.location.pathname
    );
  }
};

// ==========================================
// 2. USER SERVICE
// ==========================================
export const userService = {
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const doc = await databases.getDocument(DATABASE_ID, COLLECTION_USERS, uid);
      return {
        uid: doc.$id,
        email: doc.email,
        displayName: doc.displayName,
        role: doc.role as UserRole,
        status: doc.status,
        createdAt: doc.$createdAt,
      };
    } catch (err) {
      console.warn(`Profile for user ${uid} not found.`, err);
      return null;
    }
  },

  async getAllUsers(): Promise<UserProfile[]> {
    try {
      const res = await databases.listDocuments(DATABASE_ID, COLLECTION_USERS);
      return res.documents.map(doc => ({
        uid: doc.$id,
        email: doc.email,
        displayName: doc.displayName,
        role: doc.role as UserRole,
        status: doc.status,
        createdAt: doc.$createdAt,
      }));
    } catch (err) {
      console.error("Failed to list users from Appwrite", err);
      return [];
    }
  },

  async createUserProfile(uid: string, email: string, displayName: string, role: UserRole = 'reporter'): Promise<UserProfile> {
    const isBootstrappedAdmin = email === 'wanchaaaron@gmail.com';
    const finalRole: UserRole = isBootstrappedAdmin ? 'super_admin' : role;
    
    const profileData = {
      email,
      displayName: displayName || email.split('@')[0],
      role: finalRole,
      status: 'active'
    };

    try {
      const doc = await databases.createDocument(DATABASE_ID, COLLECTION_USERS, uid, profileData);
      return {
        uid: doc.$id,
        email: doc.email,
        displayName: doc.displayName,
        role: doc.role as UserRole,
        status: doc.status,
        createdAt: doc.$createdAt,
      };
    } catch (err) {
      // If it already exists, just update and return it
      try {
        const doc = await databases.updateDocument(DATABASE_ID, COLLECTION_USERS, uid, profileData);
        return {
          uid: doc.$id,
          email: doc.email,
          displayName: doc.displayName,
          role: doc.role as UserRole,
          status: doc.status,
          createdAt: doc.$createdAt,
        };
      } catch (innerErr) {
        console.error("Failed to create/update user profile in Appwrite", innerErr);
        return {
          uid,
          email,
          displayName,
          role: finalRole,
          status: 'active',
          createdAt: new Date().toISOString()
        };
      }
    }
  },

  async updateUserRole(uid: string, role: UserRole): Promise<void> {
    try {
      await databases.updateDocument(DATABASE_ID, COLLECTION_USERS, uid, { role });
    } catch (err) {
      console.error(`Failed to update user role for ${uid}`, err);
      throw err;
    }
  }
};

// ==========================================
// 3. NEWS SERVICE
// ==========================================
export const newsService = {
  async getNewsArticles(includeDrafts = false): Promise<NewsBlogItem[]> {
    try {
      const queries = [Query.orderDesc('$createdAt')];
      if (!includeDrafts) {
        queries.push(Query.equal('status', 'published'));
      }
      const res = await databases.listDocuments(DATABASE_ID, COLLECTION_NEWS, queries);
      return res.documents.map(doc => ({
        id: doc.$id,
        title: doc.title,
        slug: doc.slug,
        summary: doc.summary,
        content: doc.content,
        featuredImage: doc.featuredImage,
        authorId: doc.authorId,
        authorName: doc.authorName,
        category: doc.category,
        tags: doc.tags || [],
        status: doc.status as 'draft' | 'pending' | 'published',
        createdAt: doc.$createdAt,
        updatedAt: doc.$updatedAt,
        publishedAt: doc.publishedAt,
      }));
    } catch (err) {
      console.warn("Failed to fetch news from Appwrite, using fallback empty array", err);
      return [];
    }
  },

  async createNewsArticle(item: Omit<NewsBlogItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const doc = await databases.createDocument(DATABASE_ID, COLLECTION_NEWS, ID.unique(), {
        title: item.title,
        slug: item.slug,
        summary: item.summary,
        content: item.content,
        featuredImage: item.featuredImage,
        authorId: item.authorId,
        authorName: item.authorName,
        category: item.category,
        tags: item.tags,
        status: item.status,
        publishedAt: item.status === 'published' ? new Date().toISOString() : null
      });
      return doc.$id;
    } catch (err) {
      console.error("Failed to create news article in Appwrite", err);
      throw err;
    }
  },

  async updateNewsArticle(id: string, item: Partial<NewsBlogItem>): Promise<void> {
    try {
      const updateData: any = { ...item };
      if (item.status === 'published') {
        updateData.publishedAt = new Date().toISOString();
      }
      await databases.updateDocument(DATABASE_ID, COLLECTION_NEWS, id, updateData);
    } catch (err) {
      console.error(`Failed to update news article ${id}`, err);
      throw err;
    }
  },

  async deleteNewsArticle(id: string): Promise<void> {
    try {
      await databases.deleteDocument(DATABASE_ID, COLLECTION_NEWS, id);
    } catch (err) {
      console.error(`Failed to delete news article ${id}`, err);
      throw err;
    }
  }
};

// ==========================================
// 4. BLOG SERVICE
// ==========================================
export const blogService = {
  async getBlogPosts(includeDrafts = false): Promise<NewsBlogItem[]> {
    try {
      const queries = [Query.orderDesc('$createdAt')];
      if (!includeDrafts) {
        queries.push(Query.equal('status', 'published'));
      }
      const res = await databases.listDocuments(DATABASE_ID, COLLECTION_BLOGS, queries);
      return res.documents.map(doc => ({
        id: doc.$id,
        title: doc.title,
        slug: doc.slug,
        summary: doc.summary,
        content: doc.content,
        featuredImage: doc.featuredImage,
        authorId: doc.authorId,
        authorName: doc.authorName,
        category: doc.category,
        tags: doc.tags || [],
        status: doc.status as 'draft' | 'pending' | 'published',
        createdAt: doc.$createdAt,
        updatedAt: doc.$updatedAt,
        publishedAt: doc.publishedAt,
      }));
    } catch (err) {
      console.warn("Failed to fetch blogs from Appwrite, using fallback empty array", err);
      return [];
    }
  },

  async createBlogPost(item: Omit<NewsBlogItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const doc = await databases.createDocument(DATABASE_ID, COLLECTION_BLOGS, ID.unique(), {
        title: item.title,
        slug: item.slug,
        summary: item.summary,
        content: item.content,
        featuredImage: item.featuredImage,
        authorId: item.authorId,
        authorName: item.authorName,
        category: item.category,
        tags: item.tags,
        status: item.status,
        publishedAt: item.status === 'published' ? new Date().toISOString() : null
      });
      return doc.$id;
    } catch (err) {
      console.error("Failed to create blog post in Appwrite", err);
      throw err;
    }
  },

  async updateBlogPost(id: string, item: Partial<NewsBlogItem>): Promise<void> {
    try {
      const updateData: any = { ...item };
      if (item.status === 'published') {
        updateData.publishedAt = new Date().toISOString();
      }
      await databases.updateDocument(DATABASE_ID, COLLECTION_BLOGS, id, updateData);
    } catch (err) {
      console.error(`Failed to update blog post ${id}`, err);
      throw err;
    }
  },

  async deleteBlogPost(id: string): Promise<void> {
    try {
      await databases.deleteDocument(DATABASE_ID, COLLECTION_BLOGS, id);
    } catch (err) {
      console.error(`Failed to delete blog post ${id}`, err);
      throw err;
    }
  }
};

// ==========================================
// 5. VLOG SERVICE
// ==========================================
export const vlogService = {
  async getVlogs(): Promise<VlogItem[]> {
    try {
      const res = await databases.listDocuments(DATABASE_ID, COLLECTION_VLOGS, [Query.orderDesc('$createdAt')]);
      return res.documents.map(doc => ({
        id: doc.$id,
        title: doc.title,
        thumbnailImage: doc.thumbnailImage,
        youtubeUrl: doc.youtubeUrl,
        description: doc.description,
        publishDate: doc.publishDate,
      }));
    } catch (err) {
      console.warn("Failed to fetch vlogs from Appwrite", err);
      return [];
    }
  },

  async createVlog(item: Omit<VlogItem, 'id'>): Promise<string> {
    try {
      const doc = await databases.createDocument(DATABASE_ID, COLLECTION_VLOGS, ID.unique(), {
        title: item.title,
        thumbnailImage: item.thumbnailImage,
        youtubeUrl: item.youtubeUrl,
        description: item.description,
        publishDate: item.publishDate,
      });
      return doc.$id;
    } catch (err) {
      console.error("Failed to create vlog in Appwrite", err);
      throw err;
    }
  },

  async updateVlog(id: string, item: Partial<VlogItem>): Promise<void> {
    try {
      await databases.updateDocument(DATABASE_ID, COLLECTION_VLOGS, id, item);
    } catch (err) {
      console.error(`Failed to update vlog ${id}`, err);
      throw err;
    }
  },

  async deleteVlog(id: string): Promise<void> {
    try {
      await databases.deleteDocument(DATABASE_ID, COLLECTION_VLOGS, id);
    } catch (err) {
      console.error(`Failed to delete vlog ${id}`, err);
      throw err;
    }
  }
};

// ==========================================
// 6. GALLERY SERVICE
// ==========================================
export const galleryService = {
  async getGalleryAlbums(): Promise<GalleryAlbum[]> {
    try {
      const res = await databases.listDocuments(DATABASE_ID, COLLECTION_GALLERY, [Query.orderDesc('$createdAt')]);
      return res.documents.map(doc => {
        let imagesList = [];
        try {
          imagesList = typeof doc.images === 'string' ? JSON.parse(doc.images) : doc.images;
        } catch (e) {
          imagesList = [];
        }
        return {
          id: doc.$id,
          title: doc.title,
          description: doc.description,
          images: Array.isArray(imagesList) ? imagesList : [],
          createdAt: doc.$createdAt,
          updatedAt: doc.$updatedAt,
          createdBy: doc.createdBy || 'admin',
        };
      });
    } catch (err) {
      console.warn("Failed to fetch gallery from Appwrite", err);
      return [];
    }
  },

  async createGalleryAlbum(item: Omit<GalleryAlbum, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const doc = await databases.createDocument(DATABASE_ID, COLLECTION_GALLERY, ID.unique(), {
        title: item.title,
        description: item.description || '',
        images: JSON.stringify(item.images),
        createdBy: item.createdBy || 'admin',
      });
      return doc.$id;
    } catch (err) {
      console.error("Failed to create gallery album in Appwrite", err);
      throw err;
    }
  },

  async updateGalleryAlbum(id: string, item: Partial<GalleryAlbum>): Promise<void> {
    try {
      const payload: any = { ...item };
      if (item.images) {
        payload.images = JSON.stringify(item.images);
      }
      await databases.updateDocument(DATABASE_ID, COLLECTION_GALLERY, id, payload);
    } catch (err) {
      console.error(`Failed to update gallery album ${id}`, err);
      throw err;
    }
  },

  async deleteGalleryAlbum(id: string): Promise<void> {
    try {
      await databases.deleteDocument(DATABASE_ID, COLLECTION_GALLERY, id);
    } catch (err) {
      console.error(`Failed to delete gallery album ${id}`, err);
      throw err;
    }
  }
};

// ==========================================
// 7. COMMENT SERVICE
// ==========================================
export const commentService = {
  async getComments(articleId: string): Promise<CommentItem[]> {
    try {
      const res = await databases.listDocuments(DATABASE_ID, COLLECTION_COMMENTS, [
        Query.equal('articleId', articleId),
        Query.orderDesc('$createdAt')
      ]);
      return res.documents.map(doc => ({
        id: doc.$id,
        articleId: doc.articleId,
        authorName: doc.authorName,
        authorEmail: doc.authorEmail,
        content: doc.content,
        createdAt: doc.$createdAt
      }));
    } catch (err) {
      console.warn("Failed to fetch comments from Appwrite", err);
      return [];
    }
  },

  async createComment(item: Omit<CommentItem, 'id' | 'createdAt'>): Promise<string> {
    try {
      const doc = await databases.createDocument(DATABASE_ID, COLLECTION_COMMENTS, ID.unique(), {
        articleId: item.articleId,
        authorName: item.authorName,
        authorEmail: item.authorEmail,
        content: item.content
      });
      return doc.$id;
    } catch (err) {
      console.error("Failed to create comment in Appwrite", err);
      throw err;
    }
  },

  async deleteComment(id: string): Promise<void> {
    try {
      await databases.deleteDocument(DATABASE_ID, COLLECTION_COMMENTS, id);
    } catch (err) {
      console.error(`Failed to delete comment ${id}`, err);
      throw err;
    }
  }
};

// ==========================================
// 8. CATEGORY SERVICE
// ==========================================
export const categoryService = {
  async getCategories(): Promise<CategoryItem[]> {
    try {
      const res = await databases.listDocuments(DATABASE_ID, COLLECTION_CATEGORIES);
      return res.documents.map(doc => ({
        id: doc.$id,
        name: doc.name,
        slug: doc.slug,
        description: doc.description,
        createdAt: doc.$createdAt,
      }));
    } catch (err) {
      console.warn("Failed to fetch categories from Appwrite", err);
      return [];
    }
  },

  async createCategory(item: Omit<CategoryItem, 'id' | 'createdAt'>): Promise<string> {
    try {
      const doc = await databases.createDocument(DATABASE_ID, COLLECTION_CATEGORIES, ID.unique(), {
        name: item.name,
        slug: item.slug,
        description: item.description || ''
      });
      return doc.$id;
    } catch (err) {
      console.error("Failed to create category in Appwrite", err);
      throw err;
    }
  },

  async deleteCategory(id: string): Promise<void> {
    try {
      await databases.deleteDocument(DATABASE_ID, COLLECTION_CATEGORIES, id);
    } catch (err) {
      console.error(`Failed to delete category ${id}`, err);
      throw err;
    }
  }
};

// ==========================================
// 9. CONTRIBUTION SERVICE
// ==========================================
export const contributionService = {
  async getContributions(userId?: string): Promise<ContributionItem[]> {
    try {
      const queries = [Query.orderDesc('$createdAt')];
      if (userId) {
        queries.push(Query.equal('userId', userId));
      }
      const res = await databases.listDocuments(DATABASE_ID, COLLECTION_CONTRIBUTIONS, queries);
      return res.documents.map(doc => ({
        id: doc.$id,
        userId: doc.userId,
        userEmail: doc.userEmail,
        title: doc.title,
        description: doc.description,
        type: doc.type,
        status: doc.status as 'pending' | 'approved' | 'rejected',
        submittedAt: doc.$createdAt,
        imageUrl: doc.imageUrl
      }));
    } catch (err) {
      console.warn("Failed to fetch contributions from Appwrite", err);
      return [];
    }
  },

  async createContribution(item: Omit<ContributionItem, 'id' | 'submittedAt'>): Promise<string> {
    try {
      const doc = await databases.createDocument(DATABASE_ID, COLLECTION_CONTRIBUTIONS, ID.unique(), {
        userId: item.userId,
        userEmail: item.userEmail,
        title: item.title,
        description: item.description,
        type: item.type,
        status: item.status,
        imageUrl: item.imageUrl
      });
      return doc.$id;
    } catch (err) {
      console.error("Failed to create contribution in Appwrite", err);
      throw err;
    }
  }
};

// ==========================================
// 10. STORAGE (FILE UPLOAD) SERVICE
// ==========================================
export const storageService = {
  async uploadFile(file: File): Promise<string> {
    try {
      const response = await storage.createFile(BUCKET_ID, ID.unique(), file);
      // Generate preview URL
      const fileUrl = storage.getFileView(BUCKET_ID, response.$id);
      return typeof fileUrl === 'string' ? fileUrl : (fileUrl as any).href || String(fileUrl);
    } catch (err) {
      console.error("Failed to upload file to Appwrite Storage", err);
      throw err;
    }
  }
};
