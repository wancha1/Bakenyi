import { getSupabase } from './supabaseClient';
import { generateUUID } from './supabase';
import { Status, News, Announcement, Event, CommunityHighlight, Notice, ContentRegistryItem, ContentRevision, AnalyticsMetric } from '../types/heritage';

const isUUID = (str?: string) => str ? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str) : false;

async function resolveUserUUID(client: any, userId?: string): Promise<string> {
  if (userId && isUUID(userId)) {
    return userId;
  }
  try {
    const userRes = await client.auth.getUser();
    if (userRes.data?.user?.id) {
      return userRes.data.user.id;
    }
  } catch (e) {
    // ignore
  }
  try {
    const { data } = await client.from('profiles').select('id').limit(1);
    if (data && data.length > 0) {
      return data[0].id;
    }
  } catch (e) {
    // ignore
  }
  return '00000000-0000-0000-0000-000000000000'; // fallback
}

// ==========================================
// PRE-POPULATED SANDBOX/MOCK DATA
// ==========================================

const mockStatuses: Status[] = [
  {
    id: 'status-1',
    text: 'Preserving the Lukenye language, one word at a time! Check our vocabulary section.',
    media_items: [
      { url: 'https://images.unsplash.com/photo-1516280440614-37939bbacd6a?auto=format&fit=crop&q=80', type: 'image' }
    ],
    link: '/language',
    author_id: 'mock-elder',
    view_count: 42,
    visibility: 'public',
    status: 'approved',
    reactions: { 'like': 12, 'love': 8 },
    comments: [],
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    is_archived: false
  },
  {
    id: 'status-2',
    text: 'Live demonstration of traditional canoe crafting starts in an hour!',
    media_items: [
      { url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80', type: 'image' }
    ],
    author_id: 'mock-reporter',
    view_count: 27,
    visibility: 'public',
    status: 'approved',
    reactions: { 'like': 5 },
    comments: [],
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    is_archived: false
  }
];

const mockNews: News[] = [
  {
    id: 'news-1',
    title: 'Lukenye Language Digitization Project Initiated',
    slug: 'lukenye-language-digitization-project-initiated',
    summary: 'The Bakenyi Cultural Heritage Committee has launched an initiative to record oral literature and proverbs to prevent linguistic erosion.',
    content: 'The Bakenyi community has historically relied on oral traditions to pass down ancestral wisdom. In partnership with digital historians, our Council of Elders (super_admins) has greenlit a systematic campaign to build a comprehensive audio-visual repository of the Lukenye dialect, ensuring future generations can hear and learn their native tongue.',
    cover_image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80',
    author_id: 'mock-reporter',
    category: 'Heritage',
    tags: ['Linguistics', 'Digitization', 'Preservation'],
    featured: true,
    status: 'published',
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'news-2',
    title: 'Elders Council Convenes on Ebiswa Farming Preservation',
    slug: 'elders-council-convenes-on-ebiswa-farming-preservation',
    summary: 'Elders meet to outline sustainable methods for defending and showcasing floating island agricultural techniques near Lake Kyoga.',
    content: 'The floating island (Ebiswa) farming method of the Bakenyi is unique to Lake Kyoga and surrounding water channels. Highlighting ecological sustainability and ancestral ingenuity, the summit discussed ways to resist soil salinization and pass down these techniques through hands-on educational camps.',
    cover_image: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80',
    author_id: 'mock-elder',
    category: 'Culture',
    tags: ['Ebiswa', 'Agriculture', 'Elders'],
    featured: false,
    status: 'published',
    published_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

const mockAnnouncements: Announcement[] = [
  {
    id: 'ann-1',
    title: 'Annual Bakenyi Clan Leaders Gathering',
    message: 'The supreme Council of Elders announces the upcoming annual summit of all Bakenyi clan leaders and custodians. We will discuss historical documentation, clan registers, and totem restoration.',
    category: 'meetings',
    priority: 'high',
    start_date: new Date().toISOString(),
    end_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    pinned: true,
    created_by: 'mock-elder',
    status: 'approved',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'ann-2',
    title: 'Emergency: Protect Wetland Boundaries',
    message: 'Urgent notice regarding encroachment on natural cultural conservation wetland reserves. All Bakenyi wardens and fishers are advised to monitor the Lake Kyoga banks.',
    category: 'emergencies',
    priority: 'emergency',
    start_date: new Date().toISOString(),
    pinned: false,
    created_by: 'mock-admin',
    status: 'approved',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

const mockEvents: Event[] = [
  {
    id: 'eve-1',
    title: 'Traditional Canoe Crafting Workshop',
    description: 'A comprehensive, hands-on masterclass led by senior cultural craftsmen on the ancestral Bakenyi techniques of molding and stitching durable canoes from single logs.',
    location: 'Lake Kyoga Shoreline Site, Nakasongola',
    start_datetime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    end_datetime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(),
    cover_image: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?auto=format&fit=crop&q=80',
    organizer: 'Elder Moses Mukasa',
    contact: 'moses@bakenyiarchive.org',
    rsvp_settings: { enabled: true, limit: 30, rsvps: [] },
    map_location: { latitude: 1.345, longitude: 32.456 },
    created_by: 'mock-elder',
    status: 'approved',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// Initialize local storage fallbacks if empty
const initializeLocalStorage = () => {
  if (!localStorage.getItem('bakenye_statuses')) {
    localStorage.setItem('bakenye_statuses', JSON.stringify(mockStatuses));
  }
  if (!localStorage.getItem('bakenye_news')) {
    localStorage.setItem('bakenye_news', JSON.stringify(mockNews));
  }
  if (!localStorage.getItem('bakenye_announcements')) {
    localStorage.setItem('bakenye_announcements', JSON.stringify(mockAnnouncements));
  }
  if (!localStorage.getItem('bakenye_events')) {
    localStorage.setItem('bakenye_events', JSON.stringify(mockEvents));
  }
};

initializeLocalStorage();

// ==========================================
// STATUSES SERVICE
// ==========================================

export async function getStatuses(onlyApproved = true): Promise<Status[]> {
  const client = getSupabase();

  if (!client) {
    initializeLocalStorage();
    const localList = JSON.parse(localStorage.getItem('bakenye_statuses') || '[]');
    const now = new Date();
    return onlyApproved
      ? localList.filter((s: any) => s.status === 'approved' && !s.is_archived && (!s.expires_at || new Date(s.expires_at) > now))
      : localList;
  }

  try {
    const { data, error } = await client
      .from('statuses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const mapped: Status[] = (data || []).map((row: any) => ({
      id: row.id,
      text: row.text,
      media_items: row.media_items || [],
      link: row.link,
      author_id: row.author_id,
      view_count: row.view_count || 0,
      visibility: row.visibility || 'public',
      status: row.status || 'pending',
      reactions: row.reactions || {},
      comments: row.comments || [],
      created_at: row.created_at,
      expires_at: row.expires_at,
      is_archived: row.is_archived || false,
      approved_by: row.approved_by,
      approved_at: row.approved_at
    }));

    const now = new Date();
    return onlyApproved
      ? mapped.filter(s => s.status === 'approved' && !s.is_archived && (!s.expires_at || new Date(s.expires_at) > now))
      : mapped;
  } catch (err: any) {
    console.warn('Supabase fetch statuses failed:', err);
    return [];
  }
}

export async function createStatus(status: Omit<Status, 'id'>): Promise<{ data: Status | null; error: Error | null }> {
  const client = getSupabase();
  initializeLocalStorage();
  const id = generateUUID();
  const newStatus: Status = { ...status, id };

  const localList = JSON.parse(localStorage.getItem('bakenye_statuses') || '[]');
  localList.unshift(newStatus);
  localStorage.setItem('bakenye_statuses', JSON.stringify(localList));

  if (!client) {
    return { data: newStatus, error: null };
  }

  try {
    const dbRecord = {
      id,
      text: status.text,
      media_items: status.media_items || [],
      link: status.link,
      author_id: await resolveUserUUID(client, status.author_id),
      view_count: status.view_count,
      visibility: status.visibility,
      status: status.status,
      reactions: status.reactions,
      comments: status.comments,
      created_at: status.created_at,
      expires_at: status.expires_at,
      is_archived: status.is_archived
    };

    const { error } = await client.from('statuses').insert(dbRecord);
    if (error) throw error;
    return { data: newStatus, error: null };
  } catch (err: any) {
    console.error('Failed to save status to Supabase:', err);
    return { data: newStatus, error: err };
  }
}

export async function updateStatus(id: string, updates: Partial<Status>): Promise<{ data: Status | null; error: Error | null }> {
  const client = getSupabase();
  initializeLocalStorage();
  const localList = JSON.parse(localStorage.getItem('bakenye_statuses') || '[]');
  const idx = localList.findIndex((s: any) => s.id === id);
  let updatedRecord: Status | null = null;

  if (idx !== -1) {
    localList[idx] = { ...localList[idx], ...updates };
    updatedRecord = localList[idx];
    localStorage.setItem('bakenye_statuses', JSON.stringify(localList));
  }

  if (!client) {
    return { data: updatedRecord, error: null };
  }

  try {
    // Filter and map fields to ensure we don't send extra/unsupported columns to Supabase
    const dbRecord: any = {};
    if (updates.text !== undefined) dbRecord.text = updates.text;
    if (updates.media_items !== undefined) dbRecord.media_items = updates.media_items;
    if (updates.link !== undefined) dbRecord.link = updates.link;
    if (updates.author_id !== undefined && isUUID(updates.author_id)) dbRecord.author_id = updates.author_id;
    if (updates.view_count !== undefined) dbRecord.view_count = updates.view_count;
    if (updates.visibility !== undefined) dbRecord.visibility = updates.visibility;
    if (updates.status !== undefined) dbRecord.status = updates.status;
    if (updates.reactions !== undefined) dbRecord.reactions = updates.reactions;
    if (updates.comments !== undefined) dbRecord.comments = updates.comments;
    if (updates.created_at !== undefined) dbRecord.created_at = updates.created_at;
    if (updates.expires_at !== undefined) dbRecord.expires_at = updates.expires_at;
    if (updates.is_archived !== undefined) dbRecord.is_archived = updates.is_archived;
    if (updates.approved_by !== undefined && isUUID(updates.approved_by)) dbRecord.approved_by = updates.approved_by;
    if (updates.approved_at !== undefined) dbRecord.approved_at = updates.approved_at;

    let query = client.from('statuses').update(dbRecord);
    if (isUUID(id)) {
      query = query.eq('id', id);
    } else if (updatedRecord && updatedRecord.text) {
      query = query.eq('text', updatedRecord.text);
    } else {
      // Non-UUID mock data without unique text identifier -> local storage success is sufficient
      return { data: updatedRecord, error: null };
    }

    const { error } = await query;
    if (error) throw error;
    return { data: updatedRecord, error: null };
  } catch (err: any) {
    console.error('Failed to update status on Supabase:', err);
    return { data: updatedRecord, error: err };
  }
}

export async function deleteStatus(id: string): Promise<boolean> {
  const client = getSupabase();
  initializeLocalStorage();
  const localList = JSON.parse(localStorage.getItem('bakenye_statuses') || '[]');
  const filtered = localList.filter((s: any) => s.id !== id);
  localStorage.setItem('bakenye_statuses', JSON.stringify(filtered));

  if (!client) return true;

  try {
    const { error } = await client.from('statuses').delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Failed to delete status on Supabase:', err);
    return false;
  }
}

// ==========================================
// NEWS SERVICE
// ==========================================

export async function getNews(onlyPublished = true): Promise<News[]> {
  const client = getSupabase();

  if (!client) {
    initializeLocalStorage();
    const localList = JSON.parse(localStorage.getItem('bakenye_news') || '[]');
    return onlyPublished ? localList.filter((n: any) => n.status === 'published') : localList;
  }

  try {
    const { data, error } = await client
      .from('news')
      .select('*')
      .order('published_at', { ascending: false });

    if (error) throw error;

    const mapped: News[] = (data || []).map((row: any) => ({
      id: row.id,
      title: row.title,
      slug: row.slug,
      summary: row.summary,
      content: row.content,
      cover_image: row.cover_image,
      author_id: row.author_id,
      category: row.category,
      tags: row.tags || [],
      featured: row.featured || false,
      status: row.status,
      published_at: row.published_at,
      approved_by: row.approved_by,
      approved_at: row.approved_at,
      created_at: row.created_at,
      updated_at: row.updated_at
    }));

    return onlyPublished ? mapped.filter(n => n.status === 'published') : mapped;
  } catch (err: any) {
    console.warn('Supabase fetch news failed:', err);
    return [];
  }
}

export async function createNews(news: Omit<News, 'id'>): Promise<{ data: News | null; error: Error | null }> {
  const client = getSupabase();
  initializeLocalStorage();
  const id = generateUUID();
  const newNews: News = { ...news, id };

  const localList = JSON.parse(localStorage.getItem('bakenye_news') || '[]');
  localList.unshift(newNews);
  localStorage.setItem('bakenye_news', JSON.stringify(localList));

  if (!client) {
    return { data: newNews, error: null };
  }

  try {
    const dbRecord = {
      id,
      title: news.title,
      slug: news.slug,
      summary: news.summary,
      content: news.content,
      cover_image: news.cover_image,
      author_id: await resolveUserUUID(client, news.author_id),
      category: news.category,
      tags: news.tags,
      featured: news.featured,
      status: news.status,
      published_at: news.published_at,
      created_at: news.created_at,
      updated_at: news.updated_at
    };

    const { error } = await client.from('news').insert(dbRecord);
    if (error) throw error;
    return { data: newNews, error: null };
  } catch (err: any) {
    console.error('Failed to save news to Supabase:', err);
    return { data: newNews, error: err };
  }
}

export async function updateNews(id: string, updates: Partial<News>): Promise<{ data: News | null; error: Error | null }> {
  const client = getSupabase();
  initializeLocalStorage();
  const localList = JSON.parse(localStorage.getItem('bakenye_news') || '[]');
  const idx = localList.findIndex((n: any) => n.id === id);
  let updatedRecord: News | null = null;

  if (idx !== -1) {
    localList[idx] = { ...localList[idx], ...updates };
    updatedRecord = localList[idx];
    localStorage.setItem('bakenye_news', JSON.stringify(localList));
  }

  if (!client) {
    return { data: updatedRecord, error: null };
  }

  try {
    // Filter and map fields to ensure we don't send extra/unsupported columns to Supabase
    const dbRecord: any = {};
    if (updates.title !== undefined) dbRecord.title = updates.title;
    if (updates.slug !== undefined) dbRecord.slug = updates.slug;
    if (updates.summary !== undefined) dbRecord.summary = updates.summary;
    if (updates.content !== undefined) dbRecord.content = updates.content;
    if (updates.cover_image !== undefined) dbRecord.cover_image = updates.cover_image;
    if (updates.author_id !== undefined && isUUID(updates.author_id)) dbRecord.author_id = updates.author_id;
    if (updates.category !== undefined) dbRecord.category = updates.category;
    if (updates.tags !== undefined) dbRecord.tags = updates.tags;
    if (updates.featured !== undefined) dbRecord.featured = updates.featured;
    if (updates.status !== undefined) dbRecord.status = updates.status;
    if (updates.published_at !== undefined) dbRecord.published_at = updates.published_at;
    if (updates.approved_by !== undefined && isUUID(updates.approved_by)) dbRecord.approved_by = updates.approved_by;
    if (updates.approved_at !== undefined) dbRecord.approved_at = updates.approved_at;
    dbRecord.updated_at = new Date().toISOString();

    let query = client.from('news').update(dbRecord);
    if (isUUID(id)) {
      query = query.eq('id', id);
    } else if (updatedRecord && updatedRecord.slug) {
      query = query.eq('slug', updatedRecord.slug);
    } else if (updatedRecord && updatedRecord.title) {
      query = query.eq('title', updatedRecord.title);
    } else {
      // Non-UUID mock data without unique text identifier -> local storage success is sufficient
      return { data: updatedRecord, error: null };
    }

    const { error } = await query;
    if (error) throw error;
    return { data: updatedRecord, error: null };
  } catch (err: any) {
    console.error('Failed to update news on Supabase:', err);
    return { data: updatedRecord, error: err };
  }
}

export async function deleteNews(id: string): Promise<boolean> {
  const client = getSupabase();
  initializeLocalStorage();
  const localList = JSON.parse(localStorage.getItem('bakenye_news') || '[]');
  const filtered = localList.filter((n: any) => n.id !== id);
  localStorage.setItem('bakenye_news', JSON.stringify(filtered));

  if (!client) return true;

  try {
    const { error } = await client.from('news').delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Failed to delete news on Supabase:', err);
    return false;
  }
}

// ==========================================
// ANNOUNCEMENTS SERVICE
// ==========================================

export async function getAnnouncements(onlyApproved = true): Promise<Announcement[]> {
  const client = getSupabase();

  if (!client) {
    initializeLocalStorage();
    const localList = JSON.parse(localStorage.getItem('bakenye_announcements') || '[]');
    const now = new Date();
    return onlyApproved
      ? localList.filter((a: any) => a.status === 'approved' && (!a.start_date || new Date(a.start_date) <= now) && (!a.end_date || new Date(a.end_date) >= now))
      : localList;
  }

  try {
    const { data, error } = await client
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const mapped: Announcement[] = (data || []).map((row: any) => ({
      id: row.id,
      title: row.title,
      message: row.message,
      category: row.category,
      priority: row.priority,
      start_date: row.start_date,
      end_date: row.end_date,
      pinned: row.pinned || false,
      created_by: row.created_by,
      approved_by: row.approved_by,
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at
    }));

    const now = new Date();
    return onlyApproved
      ? mapped.filter(a => a.status === 'approved' && (!a.start_date || new Date(a.start_date) <= now) && (!a.end_date || new Date(a.end_date) >= now))
      : mapped;
  } catch (err: any) {
    console.warn('Supabase fetch announcements failed:', err);
    return [];
  }
}

export async function createAnnouncement(announcement: Omit<Announcement, 'id'>): Promise<{ data: Announcement | null; error: Error | null }> {
  const client = getSupabase();
  initializeLocalStorage();
  const id = generateUUID();
  const newAnn: Announcement = { ...announcement, id };

  const localList = JSON.parse(localStorage.getItem('bakenye_announcements') || '[]');
  localList.unshift(newAnn);
  localStorage.setItem('bakenye_announcements', JSON.stringify(localList));

  if (!client) {
    return { data: newAnn, error: null };
  }

  try {
    const dbRecord = {
      id,
      title: announcement.title,
      message: announcement.message,
      category: announcement.category,
      priority: announcement.priority,
      start_date: announcement.start_date,
      end_date: announcement.end_date,
      pinned: announcement.pinned,
      created_by: await resolveUserUUID(client, announcement.created_by),
      status: announcement.status,
      created_at: announcement.created_at,
      updated_at: announcement.updated_at
    };

    const { error } = await client.from('announcements').insert(dbRecord);
    if (error) throw error;
    return { data: newAnn, error: null };
  } catch (err: any) {
    console.error('Failed to save announcement to Supabase:', err);
    return { data: newAnn, error: err };
  }
}

export async function updateAnnouncement(id: string, updates: Partial<Announcement>): Promise<{ data: Announcement | null; error: Error | null }> {
  const client = getSupabase();
  initializeLocalStorage();
  const localList = JSON.parse(localStorage.getItem('bakenye_announcements') || '[]');
  const idx = localList.findIndex((a: any) => a.id === id);
  let updatedRecord: Announcement | null = null;

  if (idx !== -1) {
    localList[idx] = { ...localList[idx], ...updates };
    updatedRecord = localList[idx];
    localStorage.setItem('bakenye_announcements', JSON.stringify(localList));
  }

  if (!client) {
    return { data: updatedRecord, error: null };
  }

  try {
    // Filter and map fields to ensure we don't send extra/unsupported columns to Supabase
    const dbRecord: any = {};
    if (updates.title !== undefined) dbRecord.title = updates.title;
    if (updates.message !== undefined) dbRecord.message = updates.message;
    if (updates.category !== undefined) dbRecord.category = updates.category;
    if (updates.priority !== undefined) dbRecord.priority = updates.priority;
    if (updates.start_date !== undefined) dbRecord.start_date = updates.start_date;
    if (updates.end_date !== undefined) dbRecord.end_date = updates.end_date;
    if (updates.pinned !== undefined) dbRecord.pinned = updates.pinned;
    if (updates.created_by !== undefined && isUUID(updates.created_by)) dbRecord.created_by = updates.created_by;
    if (updates.approved_by !== undefined && isUUID(updates.approved_by)) dbRecord.approved_by = updates.approved_by;
    if (updates.status !== undefined) dbRecord.status = updates.status;
    if (updates.created_at !== undefined) dbRecord.created_at = updates.created_at;
    dbRecord.updated_at = new Date().toISOString();

    let query = client.from('announcements').update(dbRecord);
    if (isUUID(id)) {
      query = query.eq('id', id);
    } else if (updatedRecord && updatedRecord.title) {
      query = query.eq('title', updatedRecord.title);
    } else {
      // Non-UUID mock data without unique text identifier -> local storage success is sufficient
      return { data: updatedRecord, error: null };
    }

    const { error } = await query;
    if (error) throw error;
    return { data: updatedRecord, error: null };
  } catch (err: any) {
    console.error('Failed to update announcement on Supabase:', err);
    return { data: updatedRecord, error: err };
  }
}

export async function deleteAnnouncement(id: string): Promise<boolean> {
  const client = getSupabase();
  initializeLocalStorage();
  const localList = JSON.parse(localStorage.getItem('bakenye_announcements') || '[]');
  const filtered = localList.filter((a: any) => a.id !== id);
  localStorage.setItem('bakenye_announcements', JSON.stringify(filtered));

  if (!client) return true;

  try {
    const { error } = await client.from('announcements').delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Failed to delete announcement on Supabase:', err);
    return false;
  }
}

// ==========================================
// EVENTS SERVICE
// ==========================================

export async function getEvents(onlyApproved = true): Promise<Event[]> {
  const client = getSupabase();

  if (!client) {
    initializeLocalStorage();
    const localList = JSON.parse(localStorage.getItem('bakenye_events') || '[]');
    return onlyApproved ? localList.filter((e: any) => e.status === 'approved') : localList;
  }

  try {
    const { data, error } = await client
      .from('events')
      .select('id, title, description, location, start_datetime, end_datetime, cover_image, organizer, status, created_at, updated_at')
      .order('start_datetime', { ascending: true });

    if (error) throw error;

    const mapped: Event[] = (data || []).map((row: any) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      location: row.location,
      start_datetime: row.start_datetime || '',
      end_datetime: row.end_datetime || '',
      cover_image: row.cover_image || '',
      organizer: row.organizer,
      contact: '',
      rsvp_settings: { enabled: false, limit: null },
      map_location: { latitude: null, longitude: null },
      created_by: '',
      approved_by: '',
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at
    }));

    return onlyApproved ? mapped.filter(e => e.status === 'approved') : mapped;
  } catch (err: any) {
    console.warn('Supabase fetch events failed:', err);
    return [];
  }
}

export async function createEvent(event: Omit<Event, 'id'>): Promise<{ data: Event | null; error: Error | null }> {
  const client = getSupabase();
  initializeLocalStorage();
  const id = generateUUID();
  const newEvent: Event = { ...event, id };

  const localList = JSON.parse(localStorage.getItem('bakenye_events') || '[]');
  localList.unshift(newEvent);
  localStorage.setItem('bakenye_events', JSON.stringify(localList));

  if (!client) {
    return { data: newEvent, error: null };
  }

  try {
    const dbRecord = {
      id,
      title: event.title,
      description: event.description,
      location: event.location,
      start_datetime: event.start_datetime,
      end_datetime: event.end_datetime,
      cover_image: event.cover_image,
      organizer: event.organizer,
      created_by: await resolveUserUUID(client, event.created_by),
      status: event.status,
      created_at: event.created_at,
      updated_at: event.updated_at
    };

    const { error } = await client.from('events').insert(dbRecord);
    if (error) throw error;
    return { data: newEvent, error: null };
  } catch (err: any) {
    console.error('Failed to save event to Supabase:', err);
    return { data: newEvent, error: err };
  }
}

export async function updateEvent(id: string, updates: Partial<Event>): Promise<{ data: Event | null; error: Error | null }> {
  const client = getSupabase();
  initializeLocalStorage();
  const localList = JSON.parse(localStorage.getItem('bakenye_events') || '[]');
  const idx = localList.findIndex((e: any) => e.id === id);
  let updatedRecord: Event | null = null;

  if (idx !== -1) {
    localList[idx] = { ...localList[idx], ...updates };
    updatedRecord = localList[idx];
    localStorage.setItem('bakenye_events', JSON.stringify(localList));
  }

  if (!client) {
    return { data: updatedRecord, error: null };
  }

  try {
    // Filter and map fields to ensure we don't send extra/unsupported columns to Supabase
    const dbRecord: any = {};
    if (updates.title !== undefined) dbRecord.title = updates.title;
    if (updates.description !== undefined) dbRecord.description = updates.description;
    if (updates.location !== undefined) dbRecord.location = updates.location;
    if (updates.start_datetime !== undefined) dbRecord.start_datetime = updates.start_datetime;
    if (updates.end_datetime !== undefined) dbRecord.end_datetime = updates.end_datetime;
    if (updates.cover_image !== undefined) dbRecord.cover_image = updates.cover_image;
    if (updates.organizer !== undefined) dbRecord.organizer = updates.organizer;
    if (updates.status !== undefined) dbRecord.status = updates.status;
    if (updates.created_at !== undefined) dbRecord.created_at = updates.created_at;
    dbRecord.updated_at = new Date().toISOString();

    let query = client.from('events').update(dbRecord);
    if (isUUID(id)) {
      query = query.eq('id', id);
    } else if (updatedRecord && updatedRecord.title) {
      query = query.eq('title', updatedRecord.title);
    } else {
      // Non-UUID mock data without unique text identifier -> local storage success is sufficient
      return { data: updatedRecord, error: null };
    }

    const { error } = await query;
    if (error) throw error;
    return { data: updatedRecord, error: null };
  } catch (err: any) {
    console.error('Failed to update event on Supabase:', err);
    return { data: updatedRecord, error: err };
  }
}

export async function deleteEvent(id: string): Promise<boolean> {
  const client = getSupabase();
  initializeLocalStorage();
  const localList = JSON.parse(localStorage.getItem('bakenye_events') || '[]');
  const filtered = localList.filter((e: any) => e.id !== id);
  localStorage.setItem('bakenye_events', JSON.stringify(filtered));

  if (!client) return true;

  try {
    const { error } = await client.from('events').delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Failed to delete event on Supabase:', err);
    return false;
  }
}

// ==========================================
// COMMUNITY HIGHLIGHTS SERVICE
// ==========================================

export async function getCommunityHighlights(onlyPublished = true): Promise<CommunityHighlight[]> {
  const client = getSupabase();
  if (!client) {
    return [];
  }
  try {
    let query = client.from('community_highlights').select('*').order('created_at', { ascending: false });
    if (onlyPublished) {
      query = query.or('status.eq.published,status.eq.approved');
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Supabase fetch community highlights failed:', err);
    return [];
  }
}

export async function createCommunityHighlight(highlight: Omit<CommunityHighlight, 'id'>): Promise<{ data: CommunityHighlight | null; error: Error | null }> {
  const client = getSupabase();
  const id = generateUUID();
  const newHighlight: CommunityHighlight = { ...highlight, id } as CommunityHighlight;
  if (!client) return { data: newHighlight, error: null };
  try {
    const { error } = await client.from('community_highlights').insert({ ...highlight, id });
    if (error) throw error;
    return { data: newHighlight, error: null };
  } catch (err: any) {
    console.error('Failed to save community highlight to Supabase:', err);
    return { data: newHighlight, error: err };
  }
}

export async function updateCommunityHighlight(id: string, updates: Partial<CommunityHighlight>): Promise<{ data: CommunityHighlight | null; error: Error | null }> {
  const client = getSupabase();
  if (!client) return { data: null, error: new Error('Supabase client is not configured.') };
  try {
    const { data, error } = await client.from('community_highlights').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single();
    if (error) throw error;
    return { data, error: null };
  } catch (err: any) {
    console.error('Failed to update community highlight on Supabase:', err);
    return { data: null, error: err };
  }
}

export async function deleteCommunityHighlight(id: string): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;
  try {
    const { error } = await client.from('community_highlights').delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Failed to delete community highlight on Supabase:', err);
    return false;
  }
}

// ==========================================
// NOTICES SERVICE
// ==========================================

export async function getNotices(onlyApproved = true): Promise<Notice[]> {
  const client = getSupabase();
  if (!client) return [];
  try {
    let query = client.from('notices').select('*').order('created_at', { ascending: false });
    if (onlyApproved) {
      query = query.or('status.eq.published,status.eq.approved');
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Supabase fetch notices failed:', err);
    return [];
  }
}

export async function createNotice(notice: Omit<Notice, 'id'>): Promise<{ data: Notice | null; error: Error | null }> {
  const client = getSupabase();
  const id = generateUUID();
  const newNotice: Notice = { ...notice, id } as Notice;
  if (!client) return { data: newNotice, error: null };
  try {
    const { error } = await client.from('notices').insert({ ...notice, id });
    if (error) throw error;
    return { data: newNotice, error: null };
  } catch (err: any) {
    console.error('Failed to save notice to Supabase:', err);
    return { data: newNotice, error: err };
  }
}

export async function updateNotice(id: string, updates: Partial<Notice>): Promise<{ data: Notice | null; error: Error | null }> {
  const client = getSupabase();
  if (!client) return { data: null, error: new Error('Supabase client is not configured.') };
  try {
    const { data, error } = await client.from('notices').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single();
    if (error) throw error;
    return { data, error: null };
  } catch (err: any) {
    console.error('Failed to update notice on Supabase:', err);
    return { data: null, error: err };
  }
}

export async function deleteNotice(id: string): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;
  try {
    const { error } = await client.from('notices').delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Failed to delete notice on Supabase:', err);
    return false;
  }
}

// ==========================================
// UNIFIED CONTENT REGISTRY SERVICE
// ==========================================

export async function getContentRegistry(statusFilter?: string): Promise<ContentRegistryItem[]> {
  const client = getSupabase();
  if (!client) return [];
  try {
    let query = client.from('content_registry').select('*').order('created_at', { ascending: false });
    if (statusFilter && statusFilter !== 'All') {
      query = query.eq('status', statusFilter);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Supabase fetch content registry failed:', err);
    return [];
  }
}

export async function updateRegistryItemStatus(recordId: string, status: string, approvedBy?: string): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;
  try {
    const { data: registryItem, error: fetchErr } = await client
      .from('content_registry')
      .select('table_name')
      .eq('record_id', recordId)
      .single();
    
    if (fetchErr || !registryItem) {
      console.error('Failed to locate table name for registry item update:', fetchErr);
      return false;
    }

    let targetStatus = status;
    const table = registryItem.table_name;
    
    if (['community_highlights', 'notices'].includes(table)) {
      // These tables natively support the full standard status set
      targetStatus = status;
    } else if (table === 'heritage_articles') {
      if (status === 'submitted' || status === 'under_review') targetStatus = 'pending';
      else if (status === 'needs_revision') targetStatus = 'rejected';
      else if (status === 'approved') targetStatus = 'approved';
      else if (status === 'published') targetStatus = 'published';
      else if (status === 'archived') targetStatus = 'archived';
      else if (status === 'draft') targetStatus = 'draft';
    } else if (table === 'news') {
      if (status === 'submitted' || status === 'under_review') targetStatus = 'pending';
      else if (status === 'needs_revision') targetStatus = 'draft';
      else if (status === 'approved' || status === 'published') targetStatus = 'published';
      else if (status === 'archived') targetStatus = 'archived';
      else if (status === 'draft') targetStatus = 'draft';
    } else if (['events', 'announcements', 'clans', 'leaders', 'vocabulary'].includes(table)) {
      if (status === 'submitted' || status === 'under_review') targetStatus = 'pending';
      else if (status === 'needs_revision') targetStatus = 'rejected';
      else if (status === 'approved' || status === 'published') targetStatus = 'approved';
    }

    const updatePayload: any = { status: targetStatus };
    if (approvedBy) {
      updatePayload.approved_by = approvedBy;
      updatePayload.approved_at = new Date().toISOString();
      if (status === 'published' || status === 'approved') {
        updatePayload.published_at = new Date().toISOString();
      }
    }

    const { error: updateErr } = await client
      .from(registryItem.table_name)
      .update(updatePayload)
      .eq('id', recordId);

    if (updateErr) throw updateErr;
    return true;
  } catch (err) {
    console.error('Failed to update registry item status on Supabase:', err);
    return false;
  }
}

// ==========================================
// SOURCE CONTENT RETRIEVAL SERVICE
// ==========================================

export async function getSourceTableContent(tableName: string, recordId: string): Promise<any | null> {
  const client = getSupabase();
  if (!client) return null;
  try {
    const { data, error } = await client
      .from(tableName)
      .select('*')
      .eq('id', recordId)
      .maybeSingle();
    if (error) throw error;
    return data;
  } catch (err) {
    console.error(`Failed to fetch source table content from ${tableName} for record ${recordId}:`, err);
    return null;
  }
}

// ==========================================
// UNIFIED MODERATION & REVISIONS TIMELINE SERVICE
// ==========================================

export async function getUnifiedModerationHistory(recordId: string): Promise<any[]> {
  const client = getSupabase();
  if (!client) return [];
  const history: any[] = [];
  
  // 1. Fetch content_revisions
  try {
    const { data: revisions, error: revErr } = await client
      .from('content_revisions')
      .select('*')
      .eq('record_id', recordId)
      .order('created_at', { ascending: false });
    
    if (!revErr && revisions) {
      for (const rev of revisions) {
        history.push({
          id: rev.id,
          source: 'revision',
          created_at: rev.created_at,
          notes: rev.revision_notes || 'Content revised',
          actor_id: rev.editor_id,
          details: {
            previous: rev.previous_version,
            current: rev.current_version,
            content_type: rev.content_type
          }
        });
      }
    }
  } catch (err) {
    console.warn('Could not fetch content_revisions:', err);
  }

  // 2. Fetch audit_logs
  try {
    const { data: audits, error: auditErr } = await client
      .from('audit_logs')
      .select('*')
      .eq('target_id', recordId)
      .order('created_at', { ascending: false });

    if (!auditErr && audits) {
      for (const audit of audits) {
        history.push({
          id: audit.id,
          source: 'audit',
          created_at: audit.created_at,
          notes: audit.event_type === 'STATUS_CHANGE' 
            ? `Status changed from ${((audit.old_values as any)?.status || 'N/A').toUpperCase()} to ${((audit.new_values as any)?.status || 'N/A').toUpperCase()}`
            : `Audit event: ${audit.event_type}`,
          actor_id: audit.actor_id,
          details: {
            old_values: audit.old_values,
            new_values: audit.new_values,
            event_type: audit.event_type
          }
        });
      }
    }
  } catch (err) {
    console.warn('Could not fetch audit_logs (likely due to RLS restrictions):', err);
  }

  // Sort unified history by created_at descending
  history.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Resolve actor profiles if possible
  const uniqueActorIds = Array.from(new Set(history.map(h => h.actor_id).filter(Boolean))) as string[];
  if (uniqueActorIds.length > 0) {
    try {
      const { data: profiles, error: profErr } = await client
        .from('profiles')
        .select('id, email, name')
        .in('id', uniqueActorIds);
      
      if (!profErr && profiles) {
        const profileMap = new Map<string, any>();
        for (const p of profiles) {
          profileMap.set(p.id, p);
        }
        for (const item of history) {
          if (item.actor_id && profileMap.has(item.actor_id)) {
            const p = profileMap.get(item.actor_id);
            item.actor_name = p.name || p.email?.split('@')[0] || 'Unknown';
            item.actor_email = p.email;
          } else {
            item.actor_name = 'System / Automated';
          }
        }
      }
    } catch (err) {
      console.warn('Failed to resolve profile profiles for history items:', err);
    }
  }

  return history;
}

// ==========================================
// REVISIONS HISTORY SERVICE
// ==========================================

export async function getContentRevisions(recordId: string): Promise<ContentRevision[]> {
  const client = getSupabase();
  if (!client) return [];
  try {
    const { data, error } = await client
      .from('content_revisions')
      .select('*')
      .eq('record_id', recordId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Supabase fetch revisions failed:', err);
    return [];
  }
}

// ==========================================
// PERFORMANCE-SAFE ANALYTICS SERVICE
// ==========================================

export async function logAnalyticsMetric(
  metricType: 'view' | 'search' | 'download',
  contentType?: string,
  contentId?: string,
  metaData: any = {}
): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;
  try {
    const userRes = await client.auth.getUser();
    const userId = userRes.data?.user?.id || null;

    const { error } = await client.from('analytics_metrics').insert({
      metric_type: metricType,
      content_type: contentType,
      content_id: contentId,
      user_id: userId,
      meta_data: metaData
    });
    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('Logging analytics metric failed:', err);
    return false;
  }
}

