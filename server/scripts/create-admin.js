require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function run() {
  const hash = await bcrypt.hash('admin123', 10);
  await pool.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ('Admin', 'admin@gmail.com', $1, 'admin')
     ON CONFLICT (email) DO UPDATE SET password_hash = $1, role = 'admin'`,
    [hash]
  );
  console.log('✅ Admin created: admin@gmail.com / admin123');
  await pool.end();
}

run().catch(e => { console.error(e.message); pool.end(); });
