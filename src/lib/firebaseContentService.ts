import { 
  UserProfile, 
  NewsBlogItem, 
  VlogItem, 
  GalleryAlbum, 
  CategoryItem, 
  UserRole,
  userService,
  newsService,
  blogService,
  vlogService,
  galleryService,
  categoryService
} from '../services/appwriteServices';

// Re-export types so all components can import them from this file
export type { UserRole, UserProfile, NewsBlogItem, VlogItem, GalleryAlbum, CategoryItem };

// --- Helper: Format Date ---
export function formatFirebaseDate(timestamp: any): string {
  if (!timestamp) return new Date().toLocaleDateString();
  if (typeof timestamp === 'string') {
    return new Date(timestamp).toLocaleDateString();
  }
  if (timestamp.seconds) {
    return new Date(timestamp.seconds * 1000).toLocaleDateString();
  }
  if (timestamp instanceof Date) {
    return timestamp.toLocaleDateString();
  }
  return new Date().toLocaleDateString();
}

// ==========================================
// 1. USERS COLLECTION SERVICE
// ==========================================
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  return await userService.getUserProfile(uid);
}

export async function getAllUsers(): Promise<UserProfile[]> {
  return await userService.getAllUsers();
}

export async function createUserProfile(uid: string, email: string, displayName: string, role: UserRole = 'reporter'): Promise<UserProfile> {
  return await userService.createUserProfile(uid, email, displayName, role);
}

export async function updateUserRole(uid: string, role: UserRole): Promise<void> {
  return await userService.updateUserRole(uid, role);
}

// ==========================================
// 2. NEWS COLLECTION SERVICE
// ==========================================
export async function getNewsArticles(includeDrafts = false): Promise<NewsBlogItem[]> {
  const articles = await newsService.getNewsArticles(includeDrafts);
  if (articles.length === 0) {
    // Return mock fallback lists just in case Appwrite is empty/unconfigured
    return [
      {
        id: 'canoe-on-lake-kyoga',
        title: 'Traditional Canoeing on Lake Kyoga',
        slug: 'canoe-on-lake-kyoga',
        summary: 'Explore the traditional canoeing techniques passed down through generations by the Bakenyi people.',
        content: 'This is a fallback article detailing Bakenyi heritage.',
        featuredImage: 'https://images.unsplash.com/photo-1523805009345-7448845a9e53?auto=format&fit=crop&q=80&w=800',
        authorId: 'system',
        authorName: 'Cultural Historian',
        category: 'History',
        tags: ['Heritage', 'Tradition'],
        status: 'published',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
  }
  return articles;
}

export async function createNewsArticle(item: Omit<NewsBlogItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  return await newsService.createNewsArticle(item);
}

export async function updateNewsArticle(id: string, item: Partial<NewsBlogItem>): Promise<void> {
  return await newsService.updateNewsArticle(id, item);
}

export async function deleteNewsArticle(id: string): Promise<void> {
  return await newsService.deleteNewsArticle(id);
}

// ==========================================
// 3. BLOGS COLLECTION SERVICE
// ==========================================
export async function getBlogPosts(includeDrafts = false): Promise<NewsBlogItem[]> {
  const blogs = await blogService.getBlogPosts(includeDrafts);
  if (blogs.length === 0) {
    return [
      {
        id: 'basket-weaving-heritage',
        title: 'The Art of Bakenyi Basket Weaving',
        slug: 'basket-weaving-heritage',
        summary: 'Discover the complex patterns and stories embedded within traditional Bakenyi woven baskets.',
        content: 'Woven crafts form the bedrock of local Bakenyi artistry.',
        featuredImage: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&q=80&w=800',
        authorId: 'system',
        authorName: 'Heritage Writer',
        category: 'Heritage',
        tags: ['Craft', 'Tradition'],
        status: 'published',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
  }
  return blogs;
}

export async function createBlogPost(item: Omit<NewsBlogItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  return await blogService.createBlogPost(item);
}

export async function updateBlogPost(id: string, item: Partial<NewsBlogItem>): Promise<void> {
  return await blogService.updateBlogPost(id, item);
}

export async function deleteBlogPost(id: string): Promise<void> {
  return await blogService.deleteBlogPost(id);
}

// ==========================================
// 4. VLOGS COLLECTION SERVICE
// ==========================================
export async function getVlogs(): Promise<VlogItem[]> {
  const vlogs = await vlogService.getVlogs();
  if (vlogs.length === 0) {
    return [
      {
        id: 'vlog-1',
        title: 'Bakenyi Cultural Songs and Rituals',
        thumbnailImage: 'https://images.unsplash.com/photo-1461151304267-38535e780c79?auto=format&fit=crop&q=80&w=800',
        youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        description: 'An immersive documentary highlighting oral histories and songs from the Bakenyi communities.',
        publishDate: new Date().toISOString()
      }
    ];
  }
  return vlogs;
}

export async function createVlog(item: Omit<VlogItem, 'id'>): Promise<string> {
  return await vlogService.createVlog(item);
}

export async function updateVlog(id: string, item: Partial<VlogItem>): Promise<void> {
  return await vlogService.updateVlog(id, item);
}

export async function deleteVlog(id: string): Promise<void> {
  return await vlogService.deleteVlog(id);
}

// ==========================================
// 5. GALLERY COLLECTION SERVICE
// ==========================================
export async function getGalleryAlbums(): Promise<GalleryAlbum[]> {
  const albums = await galleryService.getGalleryAlbums();
  if (albums.length === 0) {
    return [
      {
        id: 'default-album',
        title: 'Lake Kyoga Expedition',
        description: 'Captured moments of daily life, canoeing, and fishing on Lake Kyoga.',
        images: [
          { url: 'https://images.unsplash.com/photo-1523805009345-7448845a9e53?auto=format&fit=crop&q=80&w=800', caption: 'Sunset on the Lake' },
          { url: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&q=80&w=800', caption: 'Weaving Reeds' }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system'
      }
    ];
  }
  return albums;
}

export async function createGalleryAlbum(item: Omit<GalleryAlbum, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  return await galleryService.createGalleryAlbum(item);
}

export async function updateGalleryAlbum(id: string, item: Partial<GalleryAlbum>): Promise<void> {
  return await galleryService.updateGalleryAlbum(id, item);
}

export async function deleteGalleryAlbum(id: string): Promise<void> {
  return await galleryService.deleteGalleryAlbum(id);
}

// ==========================================
// 6. CATEGORIES COLLECTION SERVICE
// ==========================================
export async function getCategories(): Promise<CategoryItem[]> {
  const cats = await categoryService.getCategories();
  if (cats.length === 0) {
    const defaults = [
      { name: 'Community News', slug: 'community-news' },
      { name: 'Culture', slug: 'culture' },
      { name: 'Heritage', slug: 'heritage' },
      { name: 'Leadership', slug: 'leadership' },
      { name: 'History', slug: 'history' },
      { name: 'Announcements', slug: 'announcements' }
    ];
    return defaults.map(d => ({
      id: d.slug,
      name: d.name,
      slug: d.slug,
      description: `Articles regarding Bakenyi ${d.name}`,
      createdAt: new Date().toISOString()
    }));
  }
  return cats;
}

export async function createCategory(item: Omit<CategoryItem, 'id' | 'createdAt'>): Promise<string> {
  return await categoryService.createCategory(item);
}

export async function deleteCategory(id: string): Promise<void> {
  return await categoryService.deleteCategory(id);
}
