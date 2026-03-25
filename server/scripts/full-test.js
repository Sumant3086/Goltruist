/**
 * Full PRD compliance test
 * Run: node scripts/full-test.js
 */
require('dotenv').config();
const http = require('http');

const BASE = 'http://localhost:5000';
let passed = 0, failed = 0;

function req(method, path, body, token) {
  return new Promise((resolve) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: 'localhost', port: 5000,
      path: `/api${path}`, method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    };
    const r = http.request(opts, (res) => {
      let raw = '';
      res.on('data', d => raw += d);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    r.on('error', e => resolve({ status: 0, body: e.message }));
    if (data) r.write(data);
    r.end();
  });
}

function test(name, pass, detail = '') {
  if (pass) { console.log(`  ✅ ${name}`); passed++; }
  else { console.log(`  ❌ ${name}${detail ? ' — ' + detail : ''}`); failed++; }
}

async function run() {
  console.log('\n=== GolfTrust PRD Compliance Test ===\n');

  // ── Health ──────────────────────────────────────────
  console.log('[ Health ]');
  const health = await req('GET', '/health');
  test('Server running', health.body?.status === 'ok');

  // ── Auth ────────────────────────────────────────────
  console.log('\n[ Auth ]');
  const ts = Date.now();
  const reg = await req('POST', '/auth/register', { name: 'PRD Tester', email: `prd${ts}@test.com`, password: 'test1234' });
  test('Register new user', reg.status === 200 && reg.body.token, JSON.stringify(reg.body));
  const userToken = reg.body.token;
  const userId = reg.body.user?.id;

  const login = await req('POST', '/auth/login', { email: `prd${ts}@test.com`, password: 'test1234' });
  test('Login returns token', login.status === 200 && login.body.token);

  const loginBad = await req('POST', '/auth/login', { email: `prd${ts}@test.com`, password: 'wrongpass' });
  test('Bad password rejected (401)', loginBad.status === 401);

  // ── Charities ───────────────────────────────────────
  console.log('\n[ Charities ]');
  const charities = await req('GET', '/charities');
  test('Get all charities', charities.status === 200 && Array.isArray(charities.body));
  test('Has seeded charities', charities.body?.length >= 6, `got ${charities.body?.length}`);

  const featured = await req('GET', '/charities?featured=true');
  test('Featured filter works', featured.status === 200 && featured.body?.length > 0);

  const charityId = charities.body?.[0]?.id;
  const charityDetail = await req('GET', `/charities/${charityId}`);
  test('Charity detail page', charityDetail.status === 200 && charityDetail.body?.name);

  // ── User Profile ────────────────────────────────────
  console.log('\n[ User Profile ]');
  const profile = await req('GET', '/users/me', null, userToken);
  test('Get own profile', profile.status === 200 && profile.body?.email);

  const updateProfile = await req('PATCH', '/users/me', { charity_id: charityId, charity_percentage: 15 }, userToken);
  test('Update charity & percentage', updateProfile.status === 200);

  const profileAfter = await req('GET', '/users/me', null, userToken);
  test('Charity % updated to 15', profileAfter.body?.charity_percentage == 15);

  // ── Scores (no subscription) ─────────────────────────
  console.log('\n[ Scores — Subscription Gate ]');
  const scoreNoSub = await req('POST', '/scores', { score: 30, played_at: '2026-03-01' }, userToken);
  test('Score blocked without subscription (403)', scoreNoSub.status === 403, scoreNoSub.body?.error);

  const scoreRange1 = await req('POST', '/scores', { score: 0, played_at: '2026-03-01' }, userToken);
  test('Score 0 rejected (400)', scoreRange1.status === 400);

  const scoreRange2 = await req('POST', '/scores', { score: 46, played_at: '2026-03-01' }, userToken);
  test('Score 46 rejected (400)', scoreRange2.status === 400);

  // ── Subscriptions ───────────────────────────────────
  console.log('\n[ Subscriptions ]');
  const subStatus = await req('GET', '/subscriptions/status', null, userToken);
  test('Subscription status returns', subStatus.status === 200);
  test('No active subscription initially', subStatus.body?.active === false);

  const orderInvalid = await req('POST', '/subscriptions/create-order', { plan: 'invalid' }, userToken);
  test('Invalid plan rejected (400)', orderInvalid.status === 400);

  const orderMonthly = await req('POST', '/subscriptions/create-order', { plan: 'monthly' }, userToken);
  test('Monthly order created', orderMonthly.status === 200 && orderMonthly.body?.order_id, orderMonthly.body?.error);

  const orderYearly = await req('POST', '/subscriptions/create-order', { plan: 'yearly' }, userToken);
  test('Yearly order created', orderYearly.status === 200 && orderYearly.body?.order_id);

  // ── Draws (public) ──────────────────────────────────
  console.log('\n[ Draws ]');
  const draws = await req('GET', '/draws');
  test('Get draws (public)', draws.status === 200 && Array.isArray(draws.body));

  const latest = await req('GET', '/draws/latest');
  test('Latest draw (404 ok if none)', latest.status === 200 || latest.status === 404);

  // ── Admin Setup ─────────────────────────────────────
  console.log('\n[ Admin — Setup ]');
  // Register admin user
  const adminReg = await req('POST', '/auth/register', { name: 'Admin User', email: `admin${ts}@test.com`, password: 'admin1234' });
  const adminId = adminReg.body?.user?.id;
  const adminToken1 = adminReg.body?.token;

  // Promote via DB directly
  const { Pool } = require('pg');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await pool.query(`UPDATE users SET role = 'admin' WHERE id = $1`, [adminId]);
  await pool.end();

  // Re-login to get admin token
  const adminLogin = await req('POST', '/auth/login', { email: `admin${ts}@test.com`, password: 'admin1234' });
  const adminToken = adminLogin.body?.token;
  test('Admin login', adminLogin.status === 200 && adminToken);

  // ── Admin Analytics ─────────────────────────────────
  console.log('\n[ Admin — Analytics ]');
  const analytics = await req('GET', '/admin/analytics', null, adminToken);
  test('Analytics returns', analytics.status === 200);
  test('Has total_users field', analytics.body?.total_users !== undefined);
  test('Has total_prize_pool field', analytics.body?.total_prize_pool !== undefined);
  test('Has total_charity_contributed', analytics.body?.total_charity_contributed !== undefined);

  // ── Admin Users ─────────────────────────────────────
  console.log('\n[ Admin — Users ]');
  const adminUsers = await req('GET', '/admin/users', null, adminToken);
  test('Get all users', adminUsers.status === 200 && Array.isArray(adminUsers.body));
  test('Users list not empty', adminUsers.body?.length > 0);

  const updateUser = await req('PATCH', `/admin/users/${userId}`, { name: 'Updated Name' }, adminToken);
  test('Admin can update user name', updateUser.status === 200);

  const userScores = await req('GET', `/admin/users/${userId}/scores`, null, adminToken);
  test('Admin can view user scores', userScores.status === 200 && Array.isArray(userScores.body));

  // ── Admin Charities ──────────────────────────────────
  console.log('\n[ Admin — Charities ]');
  const newCharity = await req('POST', '/admin/charities', { name: 'Test Charity', description: 'Test desc', featured: false }, adminToken);
  test('Admin can create charity', newCharity.status === 200 && newCharity.body?.id);
  const newCharityId = newCharity.body?.id;

  const updateCharity = await req('PATCH', `/admin/charities/${newCharityId}`, { featured: true }, adminToken);
  test('Admin can update charity', updateCharity.status === 200);

  const deleteCharity = await req('DELETE', `/admin/charities/${newCharityId}`, null, adminToken);
  test('Admin can deactivate charity', deleteCharity.status === 200);

  // ── Admin Draws ──────────────────────────────────────
  console.log('\n[ Admin — Draws ]');
  const simulate = await req('POST', '/admin/draws/simulate', { mode: 'random' }, adminToken);
  test('Simulate random draw', simulate.status === 200 && simulate.body?.numbers?.length === 5);
  test('Simulated numbers in range 1-45', simulate.body?.numbers?.every(n => n >= 1 && n <= 45));

  const simulateWeighted = await req('POST', '/admin/draws/simulate', { mode: 'weighted' }, adminToken);
  test('Simulate weighted draw', simulateWeighted.status === 200 && simulateWeighted.body?.numbers?.length === 5);

  const runDraft = await req('POST', '/admin/draws/run', { mode: 'random', publish: false }, adminToken);
  test('Run draw (draft)', runDraft.status === 200 && runDraft.body?.draw?.id);
  const draftDrawId = runDraft.body?.draw?.id;

  const publishDraw = await req('PATCH', `/admin/draws/${draftDrawId}/publish`, null, adminToken);
  test('Publish draw', publishDraw.status === 200 && publishDraw.body?.published === true);

  const adminDraws = await req('GET', '/admin/draws', null, adminToken);
  test('Admin sees all draws (incl unpublished)', adminDraws.status === 200 && adminDraws.body?.length > 0);

  const runPublished = await req('POST', '/admin/draws/run', { mode: 'random', publish: true }, adminToken);
  test('Run & publish draw in one step', runPublished.status === 200 && runPublished.body?.draw?.published === true);
  test('Jackpot rollover field present', runPublished.body?.jackpot_rolled_over !== undefined);

  // ── Public draws after publish ───────────────────────
  const publicDraws = await req('GET', '/draws');
  test('Published draws visible publicly', publicDraws.status === 200 && publicDraws.body?.length > 0);

  const latestAfter = await req('GET', '/draws/latest');
  test('Latest draw returns after publish', latestAfter.status === 200 && latestAfter.body?.numbers);

  // ── Admin Winners ────────────────────────────────────
  console.log('\n[ Admin — Winners ]');
  const adminWinners = await req('GET', '/admin/winners', null, adminToken);
  test('Admin can list winners', adminWinners.status === 200 && Array.isArray(adminWinners.body));

  // ── Non-admin blocked ────────────────────────────────
  console.log('\n[ Security ]');
  const blockedAnalytics = await req('GET', '/admin/analytics', null, userToken);
  test('Non-admin blocked from admin routes (403)', blockedAnalytics.status === 403);

  const noToken = await req('GET', '/users/me');
  test('Unauthenticated request blocked (401)', noToken.status === 401);

  // ── Summary ──────────────────────────────────────────
  console.log(`\n${'='.repeat(40)}`);
  console.log(`RESULTS: ${passed} passed, ${failed} failed out of ${passed + failed} tests`);
  if (failed === 0) console.log('🎉 All tests passed!');
  else console.log(`⚠️  ${failed} test(s) need attention`);
  console.log('='.repeat(40));
}

run().catch(console.error);
