import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const url = process.env.VITE_SUPABASE_URL || '';
const key = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!url || !key) {
  console.log('Supabase credentials missing!');
  process.exit(1);
}

const supabase = createClient(url, key);

async function run() {
  console.log('Querying nonexistent columns on profiles to inspect the schema...');
  const { data, error } = await supabase
    .from('profiles')
    .select('non_existent_column_for_schema_inspection_xyz')
    .limit(1);

  if (error) {
    console.log('Error status:', error.code);
    console.log('Error message:', error.message);
    console.log('Error details:', error.details);
    console.log('Error hint:', error.hint);
  } else {
    console.log('Surprisingly succeeded!', data);
  }

  console.log('\nQuerying nonexistent columns on articles to inspect its schema...');
  const res2 = await supabase
    .from('articles')
    .select('non_existent_column_for_schema_inspection_xyz')
    .limit(1);

  if (res2.error) {
    console.log('Error status:', res2.error.code);
    console.log('Error message:', res2.error.message);
    console.log('Error details:', res2.error.details);
  }
}

run();
