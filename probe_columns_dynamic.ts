import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const url = process.env.VITE_SUPABASE_URL || '';
const key = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(url, key);

async function checkColumns(tableName: string, cols: string[]) {
  console.log(`\nChecking table: "${tableName}"`);
  for (const col of cols) {
    const { error } = await supabase.from(tableName).select(col).limit(1);
    if (error && error.code === '42703') {
      console.log(`  - ${col}: Column does NOT exist`);
    } else if (error) {
      console.log(`  - ${col}: Exists (but error: ${error.message})`);
    } else {
      console.log(`  - ${col}: EXISTS!`);
    }
  }
}

async function run() {
  await checkColumns('profiles', ['id', 'email', 'role', 'status', 'is_admin', 'created_at', 'updated_at']);
  await checkColumns('articles', ['id', 'title', 'excerpt', 'content', 'category', 'author', 'publishedAt', 'published_at', 'imageUrl', 'image_url', 'pdfUrl', 'pdf_url', 'views', 'status', 'tags']);
  await checkColumns('contributions', ['id', 'title', 'description', 'type', 'status', 'imageUrl', 'image_url', 'userId', 'user_id', 'userEmail', 'user_email', 'submittedAt', 'submitted_at']);
  await checkColumns('gallery', ['id', 'imageUrl', 'image_url', 'title', 'category', 'description', 'createdAt', 'created_at', 'contributionId', 'contribution_id']);
}

run();
