import dotenv from 'dotenv';

dotenv.config();

const url = process.env.VITE_SUPABASE_URL || '';
const key = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!url || !key) {
  console.log('Supabase credentials are missing!');
  process.exit(1);
}

async function run() {
  try {
    const res = await fetch(`${url}/rest/v1/`, {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
      }
    });

    if (!res.ok) {
      console.error('Failed to fetch. Status:', res.status);
      const text = await res.text();
      console.error('Body:', text);
      return;
    }

    const doc = await res.json() as any;
    console.log('API Title:', doc.info?.title);
    console.log('Available Tables/Paths:');
    
    const paths = Object.keys(doc.paths || {});
    for (const p of paths) {
      if (p !== '/' && !p.includes('/rpc/')) {
        console.log(`- ${p}`);
      }
    }

    console.log('\n--- Table Schemas ---');
    const definitions = doc.definitions || {};
    for (const [name, def] of Object.entries(definitions)) {
      console.log(`\nTable: ${name}`);
      const d = def as any;
      if (d.properties) {
        console.log('  Columns:');
        for (const [colName, colProp] of Object.entries(d.properties)) {
          const cp = colProp as any;
          console.log(`    - ${colName} (${cp.type || 'unknown'})${cp.description ? `: ${cp.description}` : ''}`);
        }
      }
    }

  } catch (err: any) {
    console.error('Failed to fetch OpenAPI spec from Supabase:', err.message);
  }
}

run();
