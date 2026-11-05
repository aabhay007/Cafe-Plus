import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.TURSO_DATABASE_URL || 'libsql://cafe-plus-abhay007.aws-eu-west-1.turso.io';
const authToken = process.env.TURSO_AUTH_TOKEN;

console.log('Connecting to Turso...');
console.log('URL:', url);
console.log('Auth Token:', authToken ? `${authToken.substring(0, 10)}...` : 'MISSING (Please set TURSO_AUTH_TOKEN)');

if (!authToken) {
  console.log('\n❌ TURSO_AUTH_TOKEN is required to connect to your Turso cloud database.');
  console.log('To generate one, run: turso db tokens create cafe-plus-abhay007');
  console.log('Or copy it from your Turso Dashboard.\n');
  process.exit(1);
}

const db = createClient({ url, authToken });

try {
  const res = await db.execute('SELECT 1 as connected');
  console.log('\n✅ Successfully connected to Turso cloud database!', res.rows);
} catch (err) {
  console.error('\n❌ Failed to connect to Turso:', err.message);
}
