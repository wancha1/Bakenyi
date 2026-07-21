import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const url = process.env.VITE_SUPABASE_URL || '';
const key = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(url, key);

async function probeArticles() {
  try {
    const dbRecord = {
      title: 'Probe Article',
      slug: 'probe-article',
      content: 'Probe content',
      status: 'pending'
    };
    
    console.log('Attempting to insert into heritage_articles...');
    const { data: hData, error: hErr } = await supabase.from('heritage_articles').insert(dbRecord).select();
    if (hErr) {
      console.log('heritage_articles insert failed:', hErr.message);
    } else {
      console.log('heritage_articles insert succeeded! Data:', hData);
    }

    console.log('\nAttempting to insert into articles...');
    const { data: aData, error: aErr } = await supabase.from('articles').insert(dbRecord).select();
    if (aErr) {
      console.log('articles insert failed:', aErr.message);
    } else {
      console.log('articles insert succeeded! Data:', aData);
    }

  } catch (e) {
    console.error('Probe articles exception:', e);
  }
}

probeArticles();
