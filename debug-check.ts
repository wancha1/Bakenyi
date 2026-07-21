import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const url = process.env.VITE_SUPABASE_URL || '';
const key = process.env.VITE_SUPABASE_ANON_KEY || '';

console.log('VITE_SUPABASE_URL:', url ? 'Present' : 'Missing');
console.log('VITE_SUPABASE_ANON_KEY:', key ? 'Present' : 'Missing');

if (!url || !key) {
  console.log('Supabase credentials are not configured in environment variables.');
  process.exit(0);
}

const supabase = createClient(url, key);

async function checkTables() {
  try {
    console.log('\n--- Checking profiles ---');
    const { data: profiles, error: pErr } = await supabase.from('profiles').select('id, email, role, name').limit(5);
    if (pErr) console.error('Profiles error:', pErr);
    else console.log('Profiles:', profiles);

    console.log('\n--- Checking heritage_articles ---');
    const { data: articles, error: aErr } = await supabase.from('heritage_articles').select('id, title, status, created_by').limit(5);
    if (aErr) console.error('Articles error:', aErr);
    else console.log('Articles:', articles);

    console.log('\n--- Checking content_registry ---');
    const { data: registry, error: rErr } = await supabase.from('content_registry').select('id, record_id, title, status, table_name').limit(5);
    if (rErr) console.error('Registry error:', rErr);
    else console.log('Registry:', registry);

  } catch (e) {
    console.error('Error querying Supabase:', e);
  }
}

checkTables();
