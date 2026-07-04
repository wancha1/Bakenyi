import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const url = process.env.VITE_SUPABASE_URL || '';
const key = process.env.VITE_SUPABASE_ANON_KEY || '';

console.log('VITE_SUPABASE_URL:', url ? 'Present' : 'Missing');
console.log('VITE_SUPABASE_ANON_KEY:', key ? 'Present' : 'Missing');

if (!url || !key) {
  console.log('Supabase credentials are missing from environment!');
  process.exit(1);
}

const supabase = createClient(url, key);

async function probeTable(tableName: string) {
  try {
    const { data, error, status } = await supabase.from(tableName).select('*').limit(1);
    if (status === 404) {
      return { exists: false, error: 'Table not found' };
    }
    if (error) {
      return { exists: true, error: error.message, data };
    }
    return { exists: true, error: null, data };
  } catch (err: any) {
    return { exists: false, error: err.message };
  }
}

async function run() {
  console.log('Probing Supabase tables...');
  const tables = [
    'profiles',
    'articles',
    'contributions',
    'clans',
    'leadership',
    'gallery',
    'orders',
    'products',
    'users'
  ];

  for (const table of tables) {
    const res = await probeTable(table);
    console.log(`Table "${table}": exists=${res.exists}, error=${res.error ? `"${res.error}"` : 'none'}, hasData=${res.data ? res.data.length > 0 : 'no'}`);
    if (res.exists && res.data && res.data.length > 0) {
      console.log(`  Sample record keys:`, Object.keys(res.data[0]));
      console.log(`  Sample record data:`, JSON.stringify(res.data[0]).substring(0, 300));
    }
  }

  // Probe user profile columns
  console.log('\nAnalyzing profiles columns by doing a schema probe...');
  try {
    const { data, error } = await supabase.from('profiles').select('*').limit(1);
    if (!error && data && data.length > 0) {
      console.log('Profiles columns found:', Object.keys(data[0]));
    } else {
      console.log('Could not get schema of profiles (empty or access denied). Trying to insert dummy to see error or schema...');
    }
  } catch (e) {
    console.error('Error in profiles analysis:', e);
  }
}

run();
