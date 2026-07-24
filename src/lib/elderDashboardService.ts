import { getSupabase } from './supabaseClient';

export interface ElderSubmission {
  id: string;
  title: string;
  type: 'article' | 'event' | 'media' | 'announcement';
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'published' | 'archived' | 'revision';
  createdAt: string;
  updatedAt: string;
  summary?: string;
  body?: string;
  category?: string;
  coverImage?: string;
  elderFeedback?: string;
  reviewedBy?: string;
  originalTable: 'articles' | 'events' | 'gallery' | 'announcements' | 'contributions';
  originalData: any;
}

export interface ElderMediaItem {
  id: string;
  title: string;
  description: string;
  url: string;
  type: 'image' | 'video' | 'audio' | 'document';
  category: string;
  albumId?: string;
  createdAt: string;
  createdBy?: string;
  status: string;
}

export interface ElderEventItem {
  id: string;
  title: string;
  description: string;
  location: string;
  startDatetime: string;
  endDatetime: string;
  coverImage?: string;
  organizer: string;
  contact?: string;
  capacity?: number;
  status: string;
  createdAt: string;
  createdBy?: string;
}

export interface ElderAnnouncementItem {
  id: string;
  title: string;
  message: string;
  category: string;
  priority: 'low' | 'normal' | 'high' | 'emergency';
  startDate: string;
  endDate?: string;
  status: string;
  createdAt: string;
  createdBy?: string;
}

export interface ElderNotificationItem {
  id: string;
  title: string;
  body: string;
  type: 'system' | 'moderation' | 'social' | 'alert' | 'approved' | 'revision' | 'feedback';
  timestamp: string;
  isRead: boolean;
  link?: string;
}

export interface ElderProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl: string;
  bio: string;
  role: string;
}

function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
  const randomSuffix = Math.random().toString(36).substring(2, 7);
  return `${base || 'article'}-${randomSuffix}`;
}

/**
 * Fetch Elder Profile
 */
export async function fetchElderProfile(userId: string): Promise<{ profile: ElderProfile | null; error: Error | null }> {
  const client = getSupabase();
  if (!client) {
    return { profile: null, error: new Error('Database client unavailable') };
  }

  try {
    const { data, error } = await client
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return {
        profile: {
          id: userId,
          email: '',
          name: 'Elder Leader',
          avatarUrl: '',
          bio: '',
          role: 'community_leader'
        },
        error: null
      };
    }

    return {
      profile: {
        id: data.id,
        email: data.email || '',
        name: data.name || 'Elder Leader',
        avatarUrl: data.avatar_url || '',
        bio: data.bio || '',
        role: data.role || 'community_leader'
      },
      error: null
    };
  } catch (err: any) {
    return { profile: null, error: err };
  }
}

/**
 * Update Elder Profile
 */
export async function updateElderProfile(
  userId: string,
  updates: { name?: string; avatarUrl?: string; bio?: string }
): Promise<{ success: boolean; error: Error | null }> {
  const client = getSupabase();
  if (!client) {
    return { success: false, error: new Error('Database client unavailable') };
  }

  try {
    const patch: Record<string, any> = {
      updated_at: new Date().toISOString()
    };
    if (updates.name !== undefined) patch.name = updates.name;
    if (updates.avatarUrl !== undefined) patch.avatar_url = updates.avatarUrl;
    if (updates.bio !== undefined) patch.bio = updates.bio;

    const { error } = await client
      .from('profiles')
      .update(patch)
      .eq('id', userId);

    if (error) throw error;
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err };
  }
}

/**
 * Fetch All Submissions for an Elder across tables
 */
export async function fetchElderSubmissions(userId: string): Promise<{ submissions: ElderSubmission[]; error: Error | null }> {
  const client = getSupabase();
  if (!client) {
    return { submissions: [], error: new Error('Database client unavailable') };
  }

  try {
    // 1. Articles
    const { data: articles, error: artErr } = await client
      .from('articles')
      .select('*')
      .eq('author_id', userId)
      .order('created_at', { ascending: false });

    if (artErr) console.warn('Articles fetch error:', artErr);

    // 2. Events
    const { data: events, error: evErr } = await client
      .from('events')
      .select('*')
      .eq('author_id', userId)
      .order('created_at', { ascending: false });

    if (evErr) console.warn('Events fetch error:', evErr);

    // 3. Media / Gallery
    const { data: galleryItems, error: medErr } = await client
      .from('gallery')
      .select('*')
      .eq('uploaded_by', userId)
      .order('created_at', { ascending: false });

    if (medErr) console.warn('Gallery fetch error:', medErr);

    // 4. Announcements
    const { data: announcements, error: annErr } = await client
      .from('announcements')
      .select('*')
      .eq('created_by', userId)
      .order('created_at', { ascending: false });

    if (annErr) console.warn('Announcements fetch error:', annErr);

    // 5. Contributions
    const { data: contributions, error: conErr } = await client
      .from('contributions')
      .select('*')
      .eq('reporter_id', userId)
      .order('created_at', { ascending: false });

    if (conErr) console.warn('Contributions fetch error:', conErr);

    const submissionsList: ElderSubmission[] = [];

    (articles || []).forEach(art => {
      submissionsList.push({
        id: art.id,
        title: art.title,
        type: 'article',
        status: art.status as any,
        createdAt: art.created_at,
        updatedAt: art.updated_at || art.created_at,
        summary: art.summary || '',
        body: art.content || '',
        coverImage: art.featured_image || art.cover_image || undefined,
        originalTable: 'articles',
        originalData: art
      });
    });

    (events || []).forEach(ev => {
      submissionsList.push({
        id: ev.id,
        title: ev.title,
        type: 'event',
        status: ev.status as any,
        createdAt: ev.created_at,
        updatedAt: ev.updated_at || ev.created_at,
        summary: `${ev.location} | ${new Date(ev.starts_at).toLocaleDateString()}`,
        body: ev.description || '',
        coverImage: ev.image_url || ev.cover_image || undefined,
        originalTable: 'events',
        originalData: ev
      });
    });

    (galleryItems || []).forEach(m => {
      submissionsList.push({
        id: m.id,
        title: m.title,
        type: 'media',
        status: 'published',
        createdAt: m.created_at,
        updatedAt: m.created_at,
        summary: m.caption || m.event || '',
        body: m.image_url,
        category: 'Gallery',
        originalTable: 'gallery',
        originalData: m
      });
    });

    (announcements || []).forEach(ann => {
      submissionsList.push({
        id: ann.id,
        title: ann.title,
        type: 'announcement',
        status: ann.status as any,
        createdAt: ann.created_at,
        updatedAt: ann.updated_at || ann.created_at,
        summary: `Category: ${ann.category} | Priority: ${ann.priority}`,
        body: ann.message,
        originalTable: 'announcements',
        originalData: ann
      });
    });

    (contributions || []).forEach(c => {
      const cContent = c.content || {};
      submissionsList.push({
        id: c.id,
        title: c.title,
        type: cContent.type === 'event' ? 'event' : cContent.type === 'media' ? 'media' : 'article',
        status: c.status as any,
        createdAt: c.created_at,
        updatedAt: c.created_at,
        summary: cContent.summary || cContent.description || '',
        body: cContent.body || cContent.content || '',
        coverImage: cContent.imageUrl || cContent.eventPoster,
        originalTable: 'contributions',
        originalData: c
      });
    });

    submissionsList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return { submissions: submissionsList, error: null };
  } catch (err: any) {
    return { submissions: [], error: err };
  }
}

/**
 * Fetch Media Vault items
 */
export async function fetchElderMediaList(userId?: string): Promise<{ media: ElderMediaItem[]; error: Error | null }> {
  const client = getSupabase();
  if (!client) {
    return { media: [], error: new Error('Database client unavailable') };
  }

  try {
    let query = client
      .from('gallery')
      .select('*')
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('uploaded_by', userId);
    }

    const { data, error } = await query;
    if (error) throw error;

    const list: ElderMediaItem[] = (data || []).map(item => ({
      id: item.id,
      title: item.title,
      description: item.caption || item.event || '',
      url: item.image_url,
      type: 'image',
      category: 'Gallery',
      albumId: undefined,
      createdAt: item.created_at,
      createdBy: item.uploaded_by,
      status: 'approved'
    }));

    return { media: list, error: null };
  } catch (err: any) {
    return { media: [], error: err };
  }
}

/**
 * Fetch Events for Operational Calendar
 */
export async function fetchElderEventsList(userId?: string): Promise<{ events: ElderEventItem[]; error: Error | null }> {
  const client = getSupabase();
  if (!client) {
    return { events: [], error: new Error('Database client unavailable') };
  }

  try {
    let query = client
      .from('events')
      .select('*')
      .order('starts_at', { ascending: true });

    if (userId) {
      query = query.eq('author_id', userId);
    }

    const { data, error } = await query;
    if (error) throw error;

    const list: ElderEventItem[] = (data || []).map(item => ({
      id: item.id,
      title: item.title,
      description: item.description || '',
      location: item.location,
      startDatetime: item.starts_at,
      endDatetime: item.ends_at,
      coverImage: item.image_url || item.cover_image || undefined,
      organizer: item.organizer,
      contact: item.contact || undefined,
      capacity: item.capacity || undefined,
      status: item.status,
      createdAt: item.created_at,
      createdBy: item.author_id
    }));

    return { events: list, error: null };
  } catch (err: any) {
    return { events: [], error: err };
  }
}

/**
 * Fetch Elder Notifications
 */
export async function fetchElderNotificationsList(userId: string): Promise<{ notifications: ElderNotificationItem[]; error: Error | null }> {
  const client = getSupabase();
  if (!client) {
    return { notifications: [], error: new Error('Database client unavailable') };
  }

  try {
    const { data, error } = await client
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const list: ElderNotificationItem[] = (data || []).map(n => ({
      id: n.id,
      title: n.title,
      body: n.message,
      type: n.type as any,
      timestamp: new Date(n.created_at).toLocaleString(),
      isRead: n.is_read,
      link: n.link
    }));

    return { notifications: list, error: null };
  } catch (err: any) {
    return { notifications: [], error: err };
  }
}

/**
 * Mark Single Notification Read
 */
export async function markNotificationRead(notifId: string): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;
  try {
    const { error } = await client
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notifId);
    return !error;
  } catch {
    return false;
  }
}

/**
 * Mark All Notifications Read
 */
export async function markAllNotificationsRead(userId: string): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;
  try {
    const { error } = await client
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId);
    return !error;
  } catch {
    return false;
  }
}

/**
 * Save Article Submission (Create or Update)
 */
export async function saveElderArticle(
  userId: string,
  articleData: {
    id?: string;
    title: string;
    summary?: string;
    body: string;
    coverImage?: string;
    status: 'draft' | 'pending';
  }
): Promise<{ data: any; error: Error | null }> {
  const client = getSupabase();
  if (!client) {
    return { data: null, error: new Error('Database client unavailable') };
  }

  try {
    if (articleData.id) {
      // Update existing
      const { data, error } = await client
        .from('articles')
        .update({
          title: articleData.title,
          summary: articleData.summary || '',
          content: articleData.body,
          featured_image: articleData.coverImage || null,
          status: articleData.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', articleData.id)
        .eq('author_id', userId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } else {
      // Insert new
      const slug = generateSlug(articleData.title);
      const { data, error } = await client
        .from('articles')
        .insert({
          title: articleData.title,
          slug,
          summary: articleData.summary || '',
          content: articleData.body,
          featured_image: articleData.coverImage || null,
          status: articleData.status,
          author_id: userId
        })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    }
  } catch (err: any) {
    return { data: null, error: err };
  }
}

/**
 * Save Event Submission (Create or Update)
 */
export async function saveElderEvent(
  userId: string,
  eventData: {
    id?: string;
    title: string;
    description: string;
    location: string;
    eventDate?: string;
    eventTime?: string;
    coverImage?: string;
    organizer?: string;
    contact?: string;
    status: 'draft' | 'pending';
  }
): Promise<{ data: any; error: Error | null }> {
  const client = getSupabase();
  if (!client) {
    return { data: null, error: new Error('Database client unavailable') };
  }

  try {
    let startIso = new Date().toISOString();
    if (eventData.eventDate) {
      const dateStr = `${eventData.eventDate}T${eventData.eventTime ? eventData.eventTime.substring(0, 5) : '09:00'}:00`;
      const parsed = new Date(dateStr);
      if (!isNaN(parsed.getTime())) {
        startIso = parsed.toISOString();
      }
    }
    const endIso = new Date(new Date(startIso).getTime() + 3600000 * 3).toISOString();

    if (eventData.id) {
      const { data, error } = await client
        .from('events')
        .update({
          title: eventData.title,
          description: eventData.description,
          location: eventData.location,
          starts_at: startIso,
          ends_at: endIso,
          image_url: eventData.coverImage || null,
          organizer: eventData.organizer || 'Elder Council',
          contact: eventData.contact || '',
          status: eventData.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', eventData.id)
        .eq('author_id', userId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } else {
      const { data, error } = await client
        .from('events')
        .insert({
          title: eventData.title,
          description: eventData.description,
          location: eventData.location,
          starts_at: startIso,
          ends_at: endIso,
          image_url: eventData.coverImage || null,
          organizer: eventData.organizer || 'Elder Council',
          contact: eventData.contact || '',
          status: eventData.status,
          author_id: userId
        })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    }
  } catch (err: any) {
    return { data: null, error: err };
  }
}

/**
 * Save Announcement Submission (Create or Update)
 */
export async function saveElderAnnouncement(
  userId: string,
  annData: {
    id?: string;
    title: string;
    message: string;
    category?: string;
    priority?: 'low' | 'normal' | 'high' | 'emergency';
    status: 'draft' | 'pending';
  }
): Promise<{ data: any; error: Error | null }> {
  const client = getSupabase();
  if (!client) {
    return { data: null, error: new Error('Database client unavailable') };
  }

  try {
    if (annData.id) {
      const { data, error } = await client
        .from('announcements')
        .update({
          title: annData.title,
          message: annData.message,
          category: annData.category || 'community',
          priority: annData.priority || 'normal',
          status: annData.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', annData.id)
        .eq('created_by', userId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } else {
      const { data, error } = await client
        .from('announcements')
        .insert({
          title: annData.title,
          message: annData.message,
          category: annData.category || 'community',
          priority: annData.priority || 'normal',
          status: annData.status,
          created_by: userId
        })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    }
  } catch (err: any) {
    return { data: null, error: err };
  }
}

/**
 * Save Media Resource
 */
export async function saveElderMedia(
  userId: string,
  mediaData: {
    title: string;
    description: string;
    fileUrl: string;
    fileType: 'image' | 'video' | 'audio' | 'document';
    category?: string;
    albumId?: string;
    status: 'pending' | 'draft';
  }
): Promise<{ data: any; error: Error | null }> {
  const client = getSupabase();
  if (!client) {
    return { data: null, error: new Error('Database client unavailable') };
  }

  try {
    const { data, error } = await client
      .from('gallery')
      .insert({
        title: mediaData.title,
        caption: mediaData.description,
        image_url: mediaData.fileUrl,
        event: mediaData.category || 'General',
        uploaded_by: userId
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

/**
 * Delete Submission (Article, Event, Media, or Announcement)
 */
export async function deleteElderSubmission(
  userId: string,
  id: string,
  table: 'articles' | 'events' | 'gallery' | 'announcements' | 'contributions'
): Promise<{ success: boolean; error: Error | null }> {
  const client = getSupabase();
  if (!client) {
    return { success: false, error: new Error('Database client unavailable') };
  }

  try {
    let userField = 'author_id';
    if (table === 'contributions') userField = 'reporter_id';
    else if (table === 'gallery') userField = 'uploaded_by';
    else if (table === 'announcements') userField = 'created_by';

    const { error } = await client
      .from(table)
      .delete()
      .eq('id', id)
      .or(`${userField}.eq.${userId},created_by.eq.${userId}`);

    if (error) throw error;
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err };
  }
}
