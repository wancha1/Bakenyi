import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { createArticle, getArticles, getArticleById } from './src/lib/supabase.js';
import { getContentRegistry, updateRegistryItemStatus } from './src/lib/heritageService.js';

dotenv.config();

const url = process.env.VITE_SUPABASE_URL || '';
const key = process.env.VITE_SUPABASE_ANON_KEY || '';

console.log('--- Publishing Pipeline End-to-End Trace ---');

async function trace() {
  const client = createClient(url, key);
  
  // Step 1 & 2 & 3: Content Creation
  console.log('\n[Step 1, 2, 3] Elder Creates Content (Article)');
  const testId = 'test-article-' + Date.now();
  const testPayload = {
    title: 'Wisdom of the Bakenye Elders',
    excerpt: 'A test chronicled story of the Bakenye cultural wisdom.',
    content: 'Full story content about the heritage, clans, and traditions of the Bakenye people.',
    category: 'Heritage',
    author: 'Elder Juma Mugoya',
    publishedAt: new Date().toISOString().split('T')[0],
    status: 'pending', // Submitted for vetting
    views: 0,
    tags: ['Wisdom', 'Heritage']
  };

  console.log('- Frontend Component: ArticlesManager.tsx (Add Article Dialog)');
  console.log('- Action: Submitting article payload with status "pending"');
  
  const { data: created, error } = await createArticle(testPayload as any);
  
  if (error) {
    console.log('- Result: Failed to create article.');
    console.log('- Error:', error);
  } else {
    console.log('- Result: Succeeded (Frontend view)');
    console.log('- Record ID:', created?.id);
    console.log('- Status after creation:', created?.status);
  }

  // Check database table existence and direct DB state
  console.log('\n[DB Verification] Verifying record presence in Supabase:');
  const recordId = created?.id || testId;
  
  console.log('- Query: SELECT status FROM public.heritage_articles WHERE id =', recordId);
  const { data: dbRecord, error: dbErr } = await client
    .from('heritage_articles')
    .select('id, status')
    .eq('id', recordId)
    .maybeSingle();
    
  if (dbErr) {
    console.log('- DB Error:', dbErr.message);
    console.log('- Cause: Table public.heritage_articles does NOT exist or RLS blocked select.');
  } else if (dbRecord) {
    console.log('- DB Status:', dbRecord.status);
  } else {
    console.log('- DB Status: Record NOT FOUND in database (likely fell back to localStorage)');
  }

  // Step 4: Moderator Retrieval
  console.log('\n[Step 4] Moderator retrieves the record for moderation queue');
  console.log('- Frontend Component: DashboardView.tsx (Vetting Queue Tab)');
  console.log('- Query: SELECT * FROM public.content_registry ORDER BY created_at DESC');
  
  try {
    const registry = await getContentRegistry();
    const registryItem = registry.find(item => item.record_id === recordId || item.title === testPayload.title);
    if (registryItem) {
      console.log('- Result: Record found in moderation queue registry!');
      console.log('- Registry Record ID:', registryItem.id);
      console.log('- Registry Record Status:', registryItem.status);
    } else {
      console.log('- Result: Record NOT found in moderation queue registry.');
      console.log('- Cause: Either table content_registry is missing, or trigger did not sync because the insert on heritage_articles failed.');
    }
  } catch (err: any) {
    console.log('- Error:', err.message);
  }

  // Step 5 & 6: Moderator Approves Record
  console.log('\n[Step 5, 6] Moderator approves the record');
  console.log('- Frontend Component: DashboardView.tsx (Approve / Vet Button click)');
  console.log('- Action: Calling updateRegistryItemStatus with status "approved"');
  
  const updateSuccess = await updateRegistryItemStatus(recordId, 'approved');
  console.log('- Result Succeeded:', updateSuccess);
  
  if (updateSuccess) {
    console.log('- Status after approval in local/DB: Succeeded');
  } else {
    console.log('- Result: Failed to update status in registry.');
  }

  // Step 7 & 8: Public Retrieval
  console.log('\n[Step 7, 8] Public website queries the approved record and displays it');
  console.log('- Frontend Component: Articles.tsx (Public Articles list page)');
  console.log('- Query: SELECT * FROM public.heritage_articles WHERE status = "published"');
  
  const publicArticles = await getArticles(true);
  const foundInPublic = publicArticles.find(a => a.id === recordId);
  
  if (foundInPublic) {
    console.log('- Result: Succeeded! The article appears on the live website.');
    console.log('- Status in public retrieval:', foundInPublic.status);
  } else {
    console.log('- Result: Failed! The article does NOT appear on the live website.');
    console.log('- Cause: The record status is not "published", or the fetch failed / fell back.');
  }
}

trace();
