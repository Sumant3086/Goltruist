require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

// Using picsum.photos — reliable, no auth, works everywhere
const charities = [
  {
    name: 'Cancer Care Foundation',
    description: 'Supporting cancer patients and their families with treatment, counselling, and financial aid across India.',
    image_url: 'https://picsum.photos/seed/cancer/600/400',
    featured: true,
  },
  {
    name: 'Green Earth Initiative',
    description: 'Planting trees and restoring ecosystems across rural India. Every subscription plants a tree.',
    image_url: 'https://picsum.photos/seed/green/600/400',
    featured: true,
  },
  {
    name: 'Child Education Trust',
    description: 'Providing quality education and scholarships to underprivileged children in remote areas.',
    image_url: 'https://picsum.photos/seed/education/600/400',
    featured: true,
  },
  {
    name: 'Animal Rescue Network',
    description: 'Rescuing, rehabilitating and rehoming stray and injured animals across major Indian cities.',
    image_url: 'https://picsum.photos/seed/animal/600/400',
    featured: false,
  },
  {
    name: 'Clean Water Project',
    description: 'Building wells and water purification systems in drought-affected villages across Rajasthan and Maharashtra.',
    image_url: 'https://picsum.photos/seed/water/600/400',
    featured: false,
  },
  {
    name: 'Elderly Care Society',
    description: 'Running care homes and community support programs for abandoned and destitute elderly citizens.',
    image_url: 'https://picsum.photos/seed/elderly/600/400',
    featured: false,
  },
];

async function reseed() {
  const client = await pool.connect();
  try {
    for (const c of charities) {
      await client.query(
        `UPDATE charities SET image_url = $1 WHERE name = $2`,
        [c.image_url, c.name]
      );
      console.log(`✅ Updated: ${c.name}`);
    }
    console.log('\nDone.');
  } finally {
    client.release();
    await pool.end();
  }
}

reseed();
