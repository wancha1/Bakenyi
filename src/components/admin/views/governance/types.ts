export interface ContentItem {
  id: string;
  pageId: string;
  title: string;
  summary?: string;
  content: string;
  status: 'published' | 'draft' | 'archived' | 'pending';
  author: string;
  authorEmail?: string;
  category?: string;
  type?: 'article' | 'image' | 'video' | 'audio' | 'proverb' | 'dictionary' | 'totem' | 'other';
  mediaUrl?: string;
  createdAt: string;
  updatedAt: string;
  views: number;
  likes: number;
  version: number;
  // Page-specific dynamic fields (saved in JSON or flattened)
  extraFields?: Record<string, string>;
}

export interface GovernancePage {
  id: string;
  label: string;
  parent?: string;
  category: string;
  icon: string;
}

export interface VersionRecord {
  id: string;
  itemId: string;
  pageId: string;
  version: number;
  title: string;
  content: string;
  summary?: string;
  updatedAt: string;
  actor: string;
  extraFields?: Record<string, string>;
}

export interface PageAuditLog {
  id: string;
  pageId: string;
  timestamp: string;
  actor: string;
  action: string;
  details: string;
  status: 'Success' | 'Warning' | 'Error';
}
