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
    vlogs,
    stories,
    vocab
  ] = await Promise.all([
    // 1. Articles (approved or published)
    runQuery(
      client
        .from('articles')
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
    // 3. Events
    runQuery(
      client
        .from('events')
        .select('id, title, description, location, organizer, status')
    ),
    // 4. Clans
    runQuery(
      client
        .from('clans')
        .select('id, name, totem, motto, desc')
    ),
    // 5. Leaders
    runQuery(
      client
        .from('leaders')
        .select('id, name, role, bio, expertise')
    ),
    // 6. Vlogs
    runQuery(
      client
        .from('vlogs')
        .select('id, title, description, video_url')
    ),
    // 7. Stories
    runQuery(
      client
        .from('stories')
        .select('id, title, summary, content')
    ),
    // 8. Vocabulary
    runQuery(
      client
        .from('vocabulary')
        .select('id, lukenye, english, usage, category, example_sentence')
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

  // Map 6. Vlogs
  vlogs.forEach((row: any) => {
    allItems.push({
      id: `vlog-${row.id}`,
      originalId: row.id,
      category: 'Oral History',
      title: row.title,
      subtitle: 'Video Log & Oral History',
      description: row.description || '',
      targetPath: `/history`
    });
  });

  // Map 7. Stories
  stories.forEach((row: any) => {
    allItems.push({
      id: `story-${row.id}`,
      originalId: row.id,
      category: 'Timeline',
      title: row.title,
      subtitle: row.summary || 'Cultural Story',
      description: row.content || '',
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
