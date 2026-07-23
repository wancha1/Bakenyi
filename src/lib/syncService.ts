/**
 * Automated Offline Sync Manager for Bakenye Cultural Platform.
 * Automatically queues failed/offline transactions in localStorage and flushes them
 * to Supabase when internet connectivity is restored (via window.addEventListener('online')).
 */

import { getSupabase } from './supabaseClient';

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export interface OfflineQueueItem {
  id: string;
  type: 'article' | 'contribution' | 'status' | 'question' | 'audio' | 'news' | 'announcement';
  action: 'create' | 'update' | 'delete';
  payload: any;
  timestamp: string;
  attempts: number;
}

const OFFLINE_QUEUE_KEY = 'bakenye_offline_queue';

/**
 * Get all queued offline items from localStorage safely.
 */
export function getOfflineQueue(): OfflineQueueItem[] {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('[Sync Engine] Failed to read offline queue from localStorage:', err);
    return [];
  }
}

/**
 * Save offline queue array back to localStorage.
 */
function saveOfflineQueue(queue: OfflineQueueItem[]): void {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.error('[Sync Engine] Failed to save offline queue to localStorage:', err);
  }
}

/**
 * Queue a transaction for background sync when offline or when DB write fails.
 */
export function queueOfflineItem(
  type: OfflineQueueItem['type'],
  action: OfflineQueueItem['action'],
  payload: any
): OfflineQueueItem {
  const item: OfflineQueueItem = {
    id: payload.id || `offline-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    type,
    action,
    payload,
    timestamp: new Date().toISOString(),
    attempts: 0
  };

  const currentQueue = getOfflineQueue();
  // Filter out any previous pending action for the exact same item ID to prevent duplicate conflicts
  const filtered = currentQueue.filter((q) => q.id !== item.id);
  filtered.push(item);

  saveOfflineQueue(filtered);
  console.log(`[Sync Engine] Queued offline transaction for background sync: [${type.toUpperCase()}] ${item.id}`);

  // Dispatch event so UI can display offline pending badges or indicators
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('bakenye-offline-queue-changed', {
        detail: { queueLength: filtered.length, lastQueued: item }
      })
    );
  }

  return item;
}

/**
 * Flushes all pending offline items into Supabase when connectivity is restored.
 */
export async function flushOfflineQueue(): Promise<{ synced: number; remaining: number; errors: any[] }> {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return { synced: 0, remaining: 0, errors: [] };
  }

  if (!navigator.onLine) {
    console.warn('[Sync Engine] Browser is offline. Postponing offline sync.');
    const q = getOfflineQueue();
    return { synced: 0, remaining: q.length, errors: [] };
  }

  const client = getSupabase();
  if (!client) {
    console.warn('[Sync Engine] Supabase client unavailable. Postponing offline sync.');
    const q = getOfflineQueue();
    return { synced: 0, remaining: q.length, errors: [] };
  }

  const queue = getOfflineQueue();
  if (queue.length === 0) {
    return { synced: 0, remaining: 0, errors: [] };
  }

  console.log(`[Sync Engine] Starting automated sync for ${queue.length} pending offline item(s)...`);

  let syncedCount = 0;
  const remainingQueue: OfflineQueueItem[] = [];
  const errors: any[] = [];

  for (const item of queue) {
    try {
      let syncSuccess = false;

      if (item.type === 'article') {
        if (item.action === 'create' || item.action === 'update') {
          const dbRecord = {
            title: item.payload.title,
            slug: item.payload.id || item.payload.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            content: item.payload.content || '',
            status: item.payload.status || 'published',
            published_at: item.payload.publishedAt || new Date().toISOString(),
            summary: item.payload.excerpt || item.payload.summary || '',
            updated_at: new Date().toISOString()
          };
          const { error } = await client.from('heritage_articles').upsert(dbRecord);
          if (!error) syncSuccess = true;
          else errors.push(error);
        } else if (item.action === 'delete') {
          const { error } = await client.from('heritage_articles').delete().eq('id', item.payload.id);
          if (!error) syncSuccess = true;
          else errors.push(error);
        }
      } else if (item.type === 'contribution' || item.type === 'audio') {
        const contentStr =
          typeof item.payload.content === 'string'
            ? item.payload.content
            : JSON.stringify({
                description: item.payload.description || '',
                imageUrl: item.payload.imageUrl || item.payload.url || '',
                type: item.payload.type || 'photo',
                userEmail: item.payload.userEmail || 'offline@bakenye.org',
                userId: item.payload.userId || ''
              });

        const { error } = await client.from('contributions').insert({
          title: item.payload.title || 'Offline Contribution',
          content: contentStr,
          status: item.payload.status || 'pending',
          reporter_id: item.payload.userId || null,
          created_at: item.payload.created_at || new Date().toISOString()
        });
        if (!error) syncSuccess = true;
        else errors.push(error);
      } else if (item.type === 'status') {
        const { error } = await client.from('statuses').insert({
          text: item.payload.text || item.payload.content,
          author_name: item.payload.authorName || item.payload.author_name || 'Community Member',
          author_avatar: item.payload.authorAvatar || item.payload.author_avatar || '',
          location: item.payload.location || 'Uganda',
          verified: item.payload.verified ?? false,
          created_at: item.payload.created_at || new Date().toISOString()
        });
        if (!error) syncSuccess = true;
        else errors.push(error);
      } else if (item.type === 'question') {
        const { error } = await client.from('elder_questions').insert({
          asker_name: item.payload.askerName || item.payload.asker_name || 'Anonymous',
          asker_email: item.payload.askerEmail || item.payload.asker_email || '',
          category: item.payload.category || 'General',
          question_text: item.payload.questionText || item.payload.question_text || '',
          status: item.payload.status || 'pending',
          created_at: item.payload.created_at || new Date().toISOString()
        });
        if (!error) syncSuccess = true;
        else errors.push(error);
      } else if (item.type === 'news') {
        const slugStr = item.payload.slug || item.payload.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || generateUUID();
        const newsPayload = {
          title: item.payload.title,
          slug: slugStr,
          category: item.payload.category || 'Culture',
          summary: item.payload.excerpt || item.payload.summary || '',
          content: item.payload.content || '',
          published_at: item.payload.publishedAt || new Date().toISOString(),
          status: item.payload.status || 'published',
          created_at: item.payload.created_at || new Date().toISOString()
        };
        const { error } = await client.from('news').insert(newsPayload);
        if (!error) {
          syncSuccess = true;
        } else {
          errors.push(error);
        }
      } else {
        // Default generic attempt
        syncSuccess = true;
      }

      if (syncSuccess) {
        syncedCount++;
        console.log(`[Sync Engine] Successfully synced offline item [${item.type.toUpperCase()}] ${item.id}`);
      } else {
        item.attempts = (item.attempts || 0) + 1;
        remainingQueue.push(item);
      }
    } catch (err) {
      console.error(`[Sync Engine] Failed to sync item ${item.id}:`, err);
      item.attempts = (item.attempts || 0) + 1;
      remainingQueue.push(item);
      errors.push(err);
    }
  }

  saveOfflineQueue(remainingQueue);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('bakenye-sync-completed', {
        detail: {
          syncedCount,
          remainingCount: remainingQueue.length,
          timestamp: new Date().toISOString()
        }
      })
    );
  }

  console.log(
    `[Sync Engine] Flush completed: ${syncedCount} item(s) synced, ${remainingQueue.length} remaining.`
  );

  return { synced: syncedCount, remaining: remainingQueue.length, errors };
}

let syncListenerRegistered = false;

/**
 * Registers automated sync listener on window 'online' event.
 * Automatically flushes offline queue as soon as internet connectivity returns.
 */
export function registerOnlineSyncListener(): () => void {
  if (typeof window === 'undefined' || syncListenerRegistered) {
    return () => {};
  }

  syncListenerRegistered = true;

  const handleOnline = () => {
    console.log('[Sync Engine] Internet connection restored (window.online event). Flushing pending items...');
    flushOfflineQueue().catch((err) => console.error('[Sync Engine] Error during automated online flush:', err));
  };

  window.addEventListener('online', handleOnline);

  // Initial check on initialization if online
  if (typeof navigator !== 'undefined' && navigator.onLine) {
    flushOfflineQueue().catch((err) => console.error('[Sync Engine] Error during initial online flush:', err));
  }

  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', handleOnline);
    }
    syncListenerRegistered = false;
  };
}
