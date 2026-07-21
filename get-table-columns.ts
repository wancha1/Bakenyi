import dotenv from 'dotenv';

dotenv.config();

const url = process.env.VITE_SUPABASE_URL || '';
const key = process.env.VITE_SUPABASE_ANON_KEY || '';

async function getTableColumns(tableName: string) {
  if (!url || !key) {
    console.error('Supabase URL or Key is missing.');
    return;
  }
  
  try {
    const response = await fetch(`${url}/rest/v1/${tableName}`, {
      method: 'OPTIONS',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
      }
    });
    
    if (!response.ok) {
      console.error(`HTTP Error for table '${tableName}':`, response.status, response.statusText);
      return;
    }
    
    const data = await response.json();
    console.log(`\n--- Columns for table '${tableName}' ---`);
    if (data.definitions && data.definitions[tableName]) {
      const properties = data.definitions[tableName].properties;
      console.log(Object.keys(properties).map(col => `${col}: ${properties[col].type}`));
    } else {
      console.log('Definitions not found in response:', JSON.stringify(data).substring(0, 500));
    }
  } catch (e) {
    console.error(`Error fetching columns for '${tableName}':`, e);
  }
}

async function run() {
  await getTableColumns('news');
  await getTableColumns('articles');
}

run();
