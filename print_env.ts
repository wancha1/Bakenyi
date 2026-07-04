import dotenv from 'dotenv';
dotenv.config();

console.log('Environment variables:');
for (const [key, val] of Object.entries(process.env)) {
  if (key.startsWith('VITE_') || key.includes('SUPABASE') || key.includes('DATABASE') || key.includes('POSTGRES')) {
    console.log(`${key}: ${val ? 'Present (length ' + val.length + ')' : 'Empty'}`);
  }
}
