import { getSupabase } from './supabaseClient';
import { generateUUID } from './supabase';
import { Status, News, Announcement, Event } from '../types/heritage';

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
  initializeLocalStorage();
  const localList: Status[] = JSON.parse(localStorage.getItem('bakenye_statuses') || '[]');

  if (!client) {
    const now = new Date();
    return onlyApproved
      ? localList.filter(s => s.status === 'approved' && !s.is_archived && new Date(s.expires_at) > now)
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
      ? mapped.filter(s => s.status === 'approved' && !s.is_archived && new Date(s.expires_at) > now)
      : mapped;
  } catch (err) {
    console.warn('Supabase fetch statuses failed, using sandbox fallback:', err);
    const now = new Date();
    return onlyApproved
      ? localList.filter(s => s.status === 'approved' && !s.is_archived && new Date(s.expires_at) > now)
      : localList;
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
      author_id: status.author_id,
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
    const isUUID = (str?: string) => str ? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str) : false;

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
  initializeLocalStorage();
  const localList: News[] = JSON.parse(localStorage.getItem('bakenye_news') || '[]');

  if (!client) {
    return onlyPublished ? localList.filter(n => n.status === 'published') : localList;
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
  } catch (err) {
    console.warn('Supabase fetch news failed, using sandbox fallback:', err);
    return onlyPublished ? localList.filter(n => n.status === 'published') : localList;
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
      author_id: news.author_id,
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
    const isUUID = (str?: string) => str ? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str) : false;

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
  initializeLocalStorage();
  const localList: Announcement[] = JSON.parse(localStorage.getItem('bakenye_announcements') || '[]');

  if (!client) {
    const now = new Date();
    return onlyApproved
      ? localList.filter(a => a.status === 'approved' && new Date(a.start_date) <= now && (!a.end_date || new Date(a.end_date) >= now))
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
      ? mapped.filter(a => a.status === 'approved' && new Date(a.start_date) <= now && (!a.end_date || new Date(a.end_date) >= now))
      : mapped;
  } catch (err) {
    console.warn('Supabase fetch announcements failed, using sandbox fallback:', err);
    const now = new Date();
    return onlyApproved
      ? localList.filter(a => a.status === 'approved' && new Date(a.start_date) <= now && (!a.end_date || new Date(a.end_date) >= now))
      : localList;
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
      created_by: announcement.created_by,
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
    const isUUID = (str?: string) => str ? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str) : false;

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
  initializeLocalStorage();
  const localList: Event[] = JSON.parse(localStorage.getItem('bakenye_events') || '[]');

  if (!client) {
    return onlyApproved ? localList.filter(e => e.status === 'approved') : localList;
  }

  try {
    const { data, error } = await client
      .from('events')
      .select('*')
      .order('start_datetime', { ascending: true });

    if (error) throw error;

    const mapped: Event[] = (data || []).map((row: any) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      location: row.location,
      start_datetime: row.start_datetime,
      end_datetime: row.end_datetime,
      cover_image: row.cover_image,
      organizer: row.organizer,
      contact: row.contact,
      rsvp_settings: row.rsvp_settings || { enabled: false, limit: null },
      map_location: row.map_location || { latitude: null, longitude: null },
      created_by: row.created_by,
      approved_by: row.approved_by,
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at
    }));

    return onlyApproved ? mapped.filter(e => e.status === 'approved') : mapped;
  } catch (err) {
    console.warn('Supabase fetch events failed, using sandbox fallback:', err);
    return onlyApproved ? localList.filter(e => e.status === 'approved') : localList;
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
      contact: event.contact,
      rsvp_settings: event.rsvp_settings,
      map_location: event.map_location,
      created_by: event.created_by,
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
    const isUUID = (str?: string) => str ? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str) : false;

    // Filter and map fields to ensure we don't send extra/unsupported columns to Supabase
    const dbRecord: any = {};
    if (updates.title !== undefined) dbRecord.title = updates.title;
    if (updates.description !== undefined) dbRecord.description = updates.description;
    if (updates.location !== undefined) dbRecord.location = updates.location;
    if (updates.start_datetime !== undefined) dbRecord.start_datetime = updates.start_datetime;
    if (updates.end_datetime !== undefined) dbRecord.end_datetime = updates.end_datetime;
    if (updates.cover_image !== undefined) dbRecord.cover_image = updates.cover_image;
    if (updates.organizer !== undefined) dbRecord.organizer = updates.organizer;
    if (updates.contact !== undefined) dbRecord.contact = updates.contact;
    if (updates.rsvp_settings !== undefined) dbRecord.rsvp_settings = updates.rsvp_settings;
    if (updates.map_location !== undefined) dbRecord.map_location = updates.map_location;
    if (updates.created_by !== undefined && isUUID(updates.created_by)) dbRecord.created_by = updates.created_by;
    if (updates.approved_by !== undefined && isUUID(updates.approved_by)) dbRecord.approved_by = updates.approved_by;
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
