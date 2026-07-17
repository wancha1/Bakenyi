import { getSupabase } from './supabaseClient';

export interface GlobalSearchResult {
  id: string;
  originalId: string;
  category: 'Heritage Articles' | 'News' | 'Events' | 'Clans' | 'Leaders' | 'Oral History' | 'Timeline' | 'Vocabulary';
  title: string;
  subtitle: string;
  description: string;
  targetPath: string;
}

export async function searchGlobal(query: string): Promise<GlobalSearchResult[]> {
  const client = getSupabase();
  if (!client) return [];

  const trimmedQuery = query.trim();
  const lowerQuery = trimmedQuery.toLowerCase();

  // Helper to safely execute a fetch and handle errors gracefully
  const runQuery = async <T>(promise: Promise<{ data: T[] | null; error: any }>): Promise<T[]> => {
    try {
      const { data, error } = await promise;
      if (error) {
        console.warn('Supabase query warning:', error);
        return [];
      }
      return data || [];
    } catch (e) {
      console.error('Supabase query execution error:', e);
      return [];
    }
  };

  // Execute queries in parallel respecting existing RLS and status rules
  const [
    articles,
    news,
    events,
    clans,
    leaders,
    oralHistory,
    timeline,
    vocab
  ] = await Promise.all([
    // 1. Heritage Articles (approved or published)
    runQuery(
      client
        .from('heritage_articles')
        .select('id, title, summary, content, status')
        .or('status.eq.published,status.eq.approved')
    ),
    // 2. News (published only)
    runQuery(
      client
        .from('news')
        .select('id, title, summary, content, status')
        .eq('status', 'published')
    ),
    // 3. Events (approved only)
    runQuery(
      client
        .from('events')
        .select('id, title, description, location, organizer, status')
        .eq('status', 'approved')
    ),
    // 4. Clans (approved only)
    runQuery(
      client
        .from('clans')
        .select('id, name, totem, motto, desc, status')
        .eq('status', 'approved')
    ),
    // 5. Leaders (approved only)
    runQuery(
      client
        .from('leaders')
        .select('id, name, role, bio, expertise, status')
        .eq('status', 'approved')
    ),
    // 6. Oral History (no status column, publicly viewable)
    runQuery(
      client
        .from('oral_history')
        .select('id, title, elder, narrator, topic')
    ),
    // 7. Timeline Events (no status column, publicly viewable)
    runQuery(
      client
        .from('timeline_events')
        .select('id, title, description, period, year')
    ),
    // 8. Vocabulary (approved only)
    runQuery(
      client
        .from('vocabulary')
        .select('id, lukenye, english, usage, category, example_sentence, status')
        .eq('status', 'approved')
    )
  ]);

  const allItems: GlobalSearchResult[] = [];

  // Map 1. Heritage Articles
  articles.forEach((row: any) => {
    allItems.push({
      id: `article-${row.id}`,
      originalId: row.id,
      category: 'Heritage Articles',
      title: row.title,
      subtitle: row.summary || 'Heritage Archive Chronicle',
      description: row.content || '',
      targetPath: `/articles/${row.id}`
    });
  });

  // Map 2. News
  news.forEach((row: any) => {
    allItems.push({
      id: `news-${row.id}`,
      originalId: row.id,
      category: 'News',
      title: row.title,
      subtitle: row.summary || 'Official Dispatch Memoir',
      description: row.content || '',
      targetPath: `/articles?category=Community News`
    });
  });

  // Map 3. Events
  events.forEach((row: any) => {
    allItems.push({
      id: `event-${row.id}`,
      originalId: row.id,
      category: 'Events',
      title: row.title,
      subtitle: `Gathering organized by ${row.organizer || 'Council'} at ${row.location || 'Paliisa'}`,
      description: row.description || '',
      targetPath: `/history`
    });
  });

  // Map 4. Clans
  clans.forEach((row: any) => {
    allItems.push({
      id: `clan-${row.id}`,
      originalId: row.id,
      category: 'Clans',
      title: row.name,
      subtitle: row.totem ? `Oluzilo (Totem): ${row.totem}` : (row.motto || 'Ancestral Clan'),
      description: row.desc || row.history || '',
      targetPath: `/clans?q=${encodeURIComponent(row.name)}`
    });
  });

  // Map 5. Leaders
  leaders.forEach((row: any) => {
    allItems.push({
      id: `leader-${row.id}`,
      originalId: row.id,
      category: 'Leaders',
      title: row.name,
      subtitle: row.role || 'Traditional Custodian & Elder',
      description: row.bio || row.expertise || '',
      targetPath: `/leadership?q=${encodeURIComponent(row.name)}`
    });
  });

  // Map 6. Oral History
  oralHistory.forEach((row: any) => {
    allItems.push({
      id: `oral-${row.id}`,
      originalId: row.id,
      category: 'Oral History',
      title: row.title,
      subtitle: row.elder ? `Recorded track from Elder ${row.elder}` : (row.narrator ? `Narrated by ${row.narrator}` : 'Oral History Chronicle'),
      description: row.topic || '',
      targetPath: `/history?track=${row.id}`
    });
  });

  // Map 7. Timeline
  timeline.forEach((row: any) => {
    allItems.push({
      id: `timeline-${row.id}`,
      originalId: row.id,
      category: 'Timeline',
      title: row.title,
      subtitle: row.year ? `Epoch: ${row.year}` : (row.period || 'Historical Era'),
      description: row.description || row.desc || '',
      targetPath: `/history`
    });
  });

  // Map 8. Vocabulary
  vocab.forEach((row: any) => {
    allItems.push({
      id: `vocab-${row.id}`,
      originalId: row.id,
      category: 'Vocabulary',
      title: row.lukenye,
      subtitle: `English Translation: "${row.english}"`,
      description: row.usage || row.example_sentence || '',
      targetPath: `/language?q=${encodeURIComponent(row.lukenye)}`
    });
  });

  // Filter with matching logic if search term is active
  if (lowerQuery !== '') {
    return allItems.filter(item =>
      item.title.toLowerCase().includes(lowerQuery) ||
      item.subtitle.toLowerCase().includes(lowerQuery) ||
      item.description.toLowerCase().includes(lowerQuery) ||
      item.category.toLowerCase().includes(lowerQuery)
    );
  }

  return allItems;
}
