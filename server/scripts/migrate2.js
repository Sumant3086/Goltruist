require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

const statements = [
  `create extension if not exists "uuid-ossp"`,

  `create table if not exists charities (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    description text,
    image_url text,
    featured boolean default false,
    active boolean default true,
    created_at timestamptz default now()
  )`,

  `create table if not exists users (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    email text unique not null,
    password_hash text not null,
    role text not null default 'subscriber',
    charity_id uuid references charities(id),
    charity_percentage numeric default 10,
    created_at timestamptz default now()
  )`,

  `create table if not exists subscriptions (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid unique references users(id) on delete cascade,
    plan text not null,
    status text not null default 'active',
    razorpay_order_id text,
    razorpay_payment_id text,
    started_at timestamptz default now(),
    expires_at timestamptz,
    created_at timestamptz default now()
  )`,

  `create table if not exists scores (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references users(id) on delete cascade,
    score integer not null check (score >= 1 and score <= 45),
    played_at date not null,
    created_at timestamptz default now()
  )`,

  `create table if not exists draws (
    id uuid primary key default uuid_generate_v4(),
    numbers integer[] not null,
    mode text default 'random',
    published boolean default false,
    draw_date timestamptz default now(),
    prize_pool numeric default 0,
    tiers jsonb,
    created_at timestamptz default now()
  )`,

  `create table if not exists draw_entries (
    id uuid primary key default uuid_generate_v4(),
    draw_id uuid references draws(id) on delete cascade,
    user_id uuid references users(id) on delete cascade,
    scores_snapshot integer[],
    matched_count integer default 0,
    created_at timestamptz default now(),
    unique(draw_id, user_id)
  )`,

  `create table if not exists winners (
    id uuid primary key default uuid_generate_v4(),
    draw_id uuid references draws(id),
    user_id uuid references users(id),
    match_type text not null,
    prize_amount numeric default 0,
    proof_url text,
    verification_status text default 'pending',
    payment_status text default 'unpaid',
    created_at timestamptz default now()
  )`,

  `create table if not exists contributions (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references users(id),
    subscription_id uuid references subscriptions(id),
    charity_amount numeric default 0,
    prize_pool_amount numeric default 0,
    total_amount numeric default 0,
    created_at timestamptz default now()
  )`,

  `create index if not exists idx_scores_user on scores(user_id)`,
  `create index if not exists idx_subs_user on subscriptions(user_id)`,
  `create index if not exists idx_entries_draw on draw_entries(draw_id)`,
  `create index if not exists idx_entries_user on draw_entries(user_id)`,
  `create index if not exists idx_winners_user on winners(user_id)`,
  `create index if not exists idx_winners_draw on winners(draw_id)`,
];

async function run() {
  const client = await pool.connect();
  for (const stmt of statements) {
    try {
      await client.query(stmt);
      console.log('✅', stmt.trim().split('\n')[0].slice(0, 60));
    } catch (err) {
      console.error('❌', stmt.trim().split('\n')[0].slice(0, 60));
      console.error('  ', err.message);
    }
  }
  client.release();
  await pool.end();
  console.log('\nDone.');
}

run();
