import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const url = process.env.VITE_SUPABASE_URL || '';
const key = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(url, key);

async function probeColumnVariants(tableName: string, variants: string[]) {
  console.log(`\nProbing column variants for table "${tableName}":`);
  for (const variant of variants) {
    const { error } = await supabase.from(tableName).select(variant).limit(1);
    if (!error) {
      console.log(`  [FOUND] ${variant}`);
    } else if (error.code !== '42703') {
      console.log(`  [FOUND WITH ERROR] ${variant} (Error: ${error.message})`);
    }
  }
}

async function run() {
  await probeColumnVariants('articles', [
    'id', 'title', 'content', 'status', 'created_at', 'updated_at', 'published_at',
    'excerpt', 'summary', 'body', 'intro',
    'category', 'category_name', 'topic',
    'author', 'author_name', 'creator',
    'image', 'image_url', 'imageUrl', 'cover', 'cover_image', 'thumbnail',
    'pdf', 'pdf_url', 'pdfUrl', 'doc_url', 'document_url', 'attachment',
    'views', 'view_count', 'clicks', 'reads',
    'tags', 'keywords', 'labels'
  ]);

  await probeColumnVariants('contributions', [
    'id', 'title', 'description', 'content', 'type', 'category', 'status',
    'image', 'image_url', 'imageUrl', 'file_url', 'fileUrl',
    'user_id', 'userId', 'user_email', 'userEmail', 'email', 'author_email',
    'submitted_at', 'submittedAt', 'created_at', 'createdAt',
    'user_name', 'userName'
  ]);

  await probeColumnVariants('gallery', [
    'id', 'title', 'description', 'category', 'image_url', 'imageUrl', 'src', 'url',
    'created_at', 'createdAt', 'submitted_by', 'user_id', 'contribution_id', 'contributionId'
  ]);
}

run();
