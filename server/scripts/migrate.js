require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function migrate() {
  const sql = fs.readFileSync(path.join(__dirname, '../supabase/schema.sql'), 'utf8');

  // Split on semicolons, filter empty statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  const client = await pool.connect();
  try {
    for (const stmt of statements) {
      try {
        await client.query(stmt);
        const name = stmt.split('\n')[0].slice(0, 60);
        console.log(`✅ ${name}`);
      } catch (err) {
        console.error(`❌ Failed: ${stmt.slice(0, 80)}`);
        console.error(`   Error: ${err.message}`);
      }
    }
    console.log('\n✅ Migration complete');
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
