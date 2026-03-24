require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function run() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS donations (
        id uuid primary key default uuid_generate_v4(),
        user_id uuid references users(id),
        charity_id uuid references charities(id),
        amount numeric not null,
        razorpay_order_id text,
        razorpay_payment_id text,
        created_at timestamptz default now()
      )
    `);
    console.log('✅ donations table created');

    await client.query(`
      CREATE TABLE IF NOT EXISTS jackpot (
        id int primary key default 1,
        carryover numeric default 0,
        updated_at timestamptz default now(),
        CHECK (id = 1)
      )
    `);
    await client.query(`INSERT INTO jackpot (id, carryover) VALUES (1, 0) ON CONFLICT DO NOTHING`);
    console.log('✅ jackpot table created');

  } catch (err) {
    console.error('❌', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}
run();
