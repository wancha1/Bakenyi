import dotenv from 'dotenv';
dotenv.config();

console.log('Environment variables check:');
for (const key of Object.keys(process.env)) {
  if (key.includes('SUPABASE') || key.includes('DB') || key.includes('DATABASE') || key.includes('POSTGRES')) {
    console.log(`${key}: ${process.env[key] ? 'DEFINED (length: ' + process.env[key]?.length + ')' : 'UNDEFINED'}`);
  }
}
