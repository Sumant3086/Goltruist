require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name")
  .then(r => {
    console.log('Tables found:', r.rows.map(x => x.table_name).join(', '));
    pool.end();
  })
  .catch(e => { console.error(e.message); pool.end(); });
