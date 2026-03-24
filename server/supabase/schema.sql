-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users
create table users (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text unique not null,
  password_hash text not null,
  role text not null default 'subscriber', -- 'subscriber' | 'admin'
  charity_id uuid references charities(id),
  charity_percentage numeric default 10,
  created_at timestamptz default now()
);

-- Charities
create table charities (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  image_url text,
  featured boolean default false,
  active boolean default true,
  created_at timestamptz default now()
);

-- Subscriptions
create table subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid unique references users(id) on delete cascade,
  plan text not null, -- 'monthly' | 'yearly'
  status text not null default 'active', -- 'active' | 'cancelled' | 'lapsed'
  razorpay_order_id text,
  razorpay_payment_id text,
  started_at timestamptz default now(),
  expires_at timestamptz,
  created_at timestamptz default now()
);

-- Scores
create table scores (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  score integer not null check (score >= 1 and score <= 45),
  played_at date not null,
  created_at timestamptz default now()
);

-- Draws
create table draws (
  id uuid primary key default uuid_generate_v4(),
  numbers integer[] not null,
  mode text default 'random',
  published boolean default false,
  draw_date timestamptz default now(),
  prize_pool numeric default 0,
  tiers jsonb,
  created_at timestamptz default now()
);

-- Draw Entries (one per subscriber per draw)
create table draw_entries (
  id uuid primary key default uuid_generate_v4(),
  draw_id uuid references draws(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  scores_snapshot integer[],
  matched_count integer default 0,
  created_at timestamptz default now(),
  unique(draw_id, user_id)
);

-- Winners
create table winners (
  id uuid primary key default uuid_generate_v4(),
  draw_id uuid references draws(id),
  user_id uuid references users(id),
  match_type text not null, -- '5_match' | '4_match' | '3_match'
  prize_amount numeric default 0,
  proof_url text,
  verification_status text default 'pending', -- 'pending' | 'approved' | 'rejected'
  payment_status text default 'unpaid', -- 'unpaid' | 'pending' | 'paid' | 'rejected'
  created_at timestamptz default now()
);

-- Contributions (per subscription payment)
create table contributions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id),
  subscription_id uuid references subscriptions(id),
  charity_amount numeric default 0,
  prize_pool_amount numeric default 0,
  total_amount numeric default 0,
  created_at timestamptz default now()
);

-- Indexes
create index on scores(user_id);
create index on subscriptions(user_id);
create index on draw_entries(draw_id);
create index on draw_entries(user_id);
create index on winners(user_id);
create index on winners(draw_id);
