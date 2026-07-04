import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const url = process.env.VITE_SUPABASE_URL || '';
const key = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(url, key);

async function probeColumnVariants(tableName: string, variants: string[]) {
  console.log(`\nProbing extra column variants for table "${tableName}":`);
  for (const variant of variants) {
    const { error } = await supabase.from(tableName).select(variant).limit(1);
    if (!error) {
      console.log(`  [FOUND] ${variant}`);
    }
  }
}

async function run() {
  await probeColumnVariants('articles', [
    'metadata', 'data', 'info', 'attributes', 'extra', 'json', 'payload', 'settings', 'options'
  ]);
  await probeColumnVariants('contributions', [
    'metadata', 'data', 'info', 'attributes', 'extra', 'json', 'payload', 'user', 'image', 'file'
  ]);
  await probeColumnVariants('gallery', [
    'metadata', 'data', 'info', 'description', 'category'
  ]);
}

run();
