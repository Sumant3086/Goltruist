require('dotenv').config();
const { Pool } = require('pg');

const pass = encodeURIComponent('Goltruist123');
const ref = 'kqsjpgbhjhwkkiamediq';

const attempts = [
  // Transaction pooler port 6543
  `postgresql://postgres.${ref}:${pass}@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres`,
  `postgresql://postgres.${ref}:${pass}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`,
  `postgresql://postgres.${ref}:${pass}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`,
  `postgresql://postgres.${ref}:${pass}@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`,
  // Session pooler port 5432
  `postgresql://postgres.${ref}:${pass}@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres`,
  `postgresql://postgres.${ref}:${pass}@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres`,
  `postgresql://postgres.${ref}:${pass}@aws-0-us-east-1.pooler.supabase.com:5432/postgres`,
];

async function tryUrl(url) {
  const display = url.replace(pass, '***');
  const pool = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 6000 });
  try {
    await pool.query('SELECT 1');
    console.log(`✅ WORKS: ${display}`);
    await pool.end();
    return url;
  } catch (e) {
    console.log(`❌ ${e.message.slice(0, 55)}`);
    await pool.end();
    return null;
  }
}

(async () => {
  for (const url of attempts) {
    const result = await tryUrl(url);
    if (result) {
      console.log('\nUse this DATABASE_URL in Vercel env vars:');
      console.log(result.replace(pass, 'Goltruist123'));
      break;
    }
  }
})();
