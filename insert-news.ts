import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const url = process.env.VITE_SUPABASE_URL || '';
const key = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(url, key);

async function testInsertNews() {
  try {
    const payload = {
      title: 'Test News Title',
      slug: 'test-news-slug-' + Math.random().toString(36).substring(2, 7),
      summary: 'Test summary',
      content: 'Test content here',
      category: 'General',
      status: 'draft'
    };

    console.log('Inserting news record...');
    const { data, error } = await supabase.from('news').insert(payload).select();
    if (error) {
      console.error('Insert news failed:', error);
    } else {
      console.log('Insert news succeeded! Record:', data);
    }
  } catch (e) {
    console.error('Exception:', e);
  }
}

testInsertNews();
