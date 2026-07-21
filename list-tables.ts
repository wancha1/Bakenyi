import dotenv from 'dotenv';

dotenv.config();

const url = process.env.VITE_SUPABASE_URL || '';
const key = process.env.VITE_SUPABASE_ANON_KEY || '';

async function fetchSwaggerSchema() {
  if (!url || !key) {
    console.error('Supabase URL or Key is missing.');
    return;
  }
  
  try {
    const response = await fetch(`${url}/rest/v1/`, {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
      }
    });
    
    if (!response.ok) {
      console.error('HTTP Error fetching schema:', response.status, response.statusText);
      return;
    }
    
    const data = await response.json();
    console.log('PostgREST exposed endpoints:');
    if (data.paths) {
      const paths = Object.keys(data.paths);
      console.log(paths.filter(p => p !== '/' && !p.includes('{')));
    } else {
      console.log('No paths found in Swagger schema.');
    }
  } catch (e) {
    console.error('Error fetching Swagger schema:', e);
  }
}

fetchSwaggerSchema();
