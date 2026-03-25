const db = require('../config/db');

async function generateDrawNumbers(mode = 'random') {
  if (mode === 'random') return pickRandom(5, 1, 45);

  // Weighted by score frequency
  const { rows } = await db.query(`SELECT score FROM scores`);
  if (!rows.length) return pickRandom(5, 1, 45);

  const freq = {};
  rows.forEach(({ score }) => { freq[score] = (freq[score] || 0) + 1; });

  const pool = [];
  for (let n = 1; n <= 45; n++) {
    const weight = freq[n] || 1;
    for (let w = 0; w < weight; w++) pool.push(n);
  }

  const picked = new Set();
  while (picked.size < 5) picked.add(pool[Math.floor(Math.random() * pool.length)]);
  return [...picked].sort((a, b) => a - b);
}

function pickRandom(count, min, max) {
  const picked = new Set();
  while (picked.size < count)
    picked.add(Math.floor(Math.random() * (max - min + 1)) + min);
  return [...picked].sort((a, b) => a - b);
}

function matchScores(userScores, drawNumbers) {
  const drawSet = new Set(drawNumbers);
  return userScores.filter(s => drawSet.has(s)).length;
}

function calculateTiers(totalPool, jackpotCarryover = 0) {
  return {
    five_match:  (totalPool * 0.40) + jackpotCarryover,
    four_match:  totalPool * 0.35,
    three_match: totalPool * 0.25,
  };
}

module.exports = { generateDrawNumbers, matchScores, calculateTiers };
