require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

const charities = [
  { name: 'Cancer Care Foundation', description: 'Supporting cancer patients and their families with treatment, counselling, and financial aid across India.', image_url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600', featured: true },
  { name: 'Green Earth Initiative', description: 'Planting trees and restoring ecosystems across rural India. Every subscription plants a tree.', image_url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600', featured: true },
  { name: 'Child Education Trust', description: 'Providing quality education and scholarships to underprivileged children in remote areas.', image_url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600', featured: true },
  { name: 'Animal Rescue Network', description: 'Rescuing, rehabilitating and rehoming stray and injured animals across major Indian cities.', image_url: 'https://images.unsplash.com/photo-1548767797-d8c844163c4a?w=600', featured: false },
  { name: 'Clean Water Project', description: 'Building wells and water purification systems in drought-affected villages across Rajasthan and Maharashtra.', image_url: 'https://images.unsplash.com/photo-1541544537156-7627a7a4aa1c?w=600', featured: false },
  { name: 'Elderly Care Society', description: 'Running care homes and community support programs for abandoned and destitute elderly citizens.', image_url: 'https://images.unsplash.com/photo-1516307365426-bea591f05011?w=600', featured: false },
];

async function seed() {
  const client = await pool.connect();
  try {
    for (const c of charities) {
      await client.query(
        `INSERT INTO charities (name, description, image_url, featured, active)
         VALUES ($1, $2, $3, $4, true)
         ON CONFLICT DO NOTHING`,
        [c.name, c.description, c.image_url, c.featured]
      );
      console.log('✅ Seeded:', c.name);
    }
    console.log('\nSeed complete.');
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
