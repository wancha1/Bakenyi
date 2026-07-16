export interface StatusMedia {
  url: string;
  type: 'image' | 'video' | 'audio';
}

export interface Status {
  id: string;
  text?: string;
  media_items?: StatusMedia[];
  link?: string;
  author_id: string;
  view_count: number;
  visibility: 'public' | 'private';
  status: 'draft' | 'pending' | 'approved' | 'archived' | 'expired';
  reactions: Record<string, number>;
  comments: {
    id: string;
    user_id: string;
    user_email: string;
    text: string;
    created_at: string;
  }[];
  created_at: string;
  expires_at: string;
  is_archived: boolean;
  approved_by?: string;
  approved_at?: string;
}

export interface News {
  id: string;
  title: string;
  slug: string;
  summary?: string;
  content: string;
  cover_image?: string;
  author_id: string;
  category: string;
  tags: string[];
  featured: boolean;
  status: 'draft' | 'pending' | 'approved' | 'published' | 'rejected' | 'archived';
  published_at?: string;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  category: 'meetings' | 'emergencies' | 'community notices' | 'scholarships' | 'ceremonies' | 'website notices';
  priority: 'low' | 'normal' | 'high' | 'emergency';
  start_date: string;
  end_date?: string;
  pinned: boolean;
  created_by: string;
  approved_by?: string;
  status: 'draft' | 'pending' | 'approved' | 'archived' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  location: string;
  start_datetime: string;
  end_datetime: string;
  cover_image?: string;
  organizer: string;
  contact?: string;
  rsvp_settings: {
    enabled: boolean;
    limit: number | null;
    rsvps?: string[];
  };
  map_location: {
    latitude: number | null;
    longitude: number | null;
  };
  created_by: string;
  approved_by?: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface CommunityHighlight {
  id: string;
  title: string;
  summary?: string;
  content: string;
  cover_image?: string;
  author_id?: string;
  status: 'draft' | 'submitted' | 'under_review' | 'needs_revision' | 'approved' | 'published' | 'archived';
  approved_by?: string;
  approved_at?: string;
  published_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Notice {
  id: string;
  title: string;
  message: string;
  priority: 'low' | 'normal' | 'high' | 'emergency';
  status: 'draft' | 'submitted' | 'under_review' | 'needs_revision' | 'approved' | 'published' | 'archived';
  created_by: string;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ContentRegistryItem {
  id: string;
  content_type: string;
  table_name: string;
  record_id: string;
  title: string;
  status: 'draft' | 'submitted' | 'under_review' | 'needs_revision' | 'approved' | 'published' | 'archived';
  author_id?: string;
  submitted_at?: string;
  approved_by?: string;
  approved_at?: string;
  published_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ContentRevision {
  id: string;
  content_type: string;
  record_id: string;
  editor_id?: string;
  previous_version?: any;
  current_version?: any;
  revision_notes?: string;
  created_at: string;
}

export interface AnalyticsMetric {
  id: string;
  metric_type: 'view' | 'search' | 'download';
  content_type?: string;
  content_id?: string;
  user_id?: string;
  meta_data?: any;
  created_at: string;
}

