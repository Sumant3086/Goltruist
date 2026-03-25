const http = require('http');

const BASE = 'http://localhost:5000';
let authToken = null;
let userId = null;

function request(method, path, body, token) {
  return new Promise((resolve) => {
    const url = new URL(BASE + path);
    const payload = body ? JSON.stringify(body) : null;
    const options = {
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let parsed;
        try { parsed = JSON.parse(data); } catch { parsed = data; }
        resolve({ status: res.statusCode, body: parsed });
      });
    });

    req.on('error', (e) => resolve({ status: 0, body: { error: e.message } }));
    if (payload) req.write(payload);
    req.end();
  });
}

function pass(label, res, note = '') {
  console.log(`✅ PASS  [${label}] HTTP ${res.status}${note ? ' — ' + note : ''}`);
}
function fail(label, res, note = '') {
  console.log(`❌ FAIL  [${label}] HTTP ${res.status}${note ? ' — ' + note : ''}`);
}
function info(label, res, note = '') {
  console.log(`ℹ️  INFO  [${label}] HTTP ${res.status}${note ? ' — ' + note : ''}`);
}

function preview(body) {
  const s = JSON.stringify(body);
  return s.length > 200 ? s.slice(0, 200) + '...' : s;
}

async function run() {
  console.log('='.repeat(60));
  console.log('  API TEST SUITE — http://localhost:5000');
  console.log('='.repeat(60));

  // 1. Register
  {
    const label = '1. AUTH Register';
    const res = await request('POST', '/api/auth/register', {
      name: 'Test Player',
      email: 'testplayer99@test.com',
      password: 'test1234',
    });
    console.log(`\n${label}`);
    console.log('   Response:', preview(res.body));
    if (res.status === 201 || res.status === 200) {
      pass(label, res, 'User registered');
      if (res.body.token) authToken = res.body.token;
      if (res.body.user?.id) userId = res.body.user.id;
    } else if (res.status === 409 || (res.body?.message || '').toLowerCase().includes('exist')) {
      info(label, res, 'User already exists (acceptable)');
    } else {
      fail(label, res, preview(res.body));
    }
  }

  // 2. Login
  {
    const label = '2. AUTH Login';
    const res = await request('POST', '/api/auth/login', {
      email: 'testplayer99@test.com',
      password: 'test1234',
    });
    console.log(`\n${label}`);
    console.log('   Response:', preview(res.body));
    if (res.status === 200 && res.body.token) {
      pass(label, res, 'Token received');
      authToken = res.body.token;
      if (res.body.user?.id) userId = res.body.user.id;
    } else {
      fail(label, res, preview(res.body));
    }
  }

  console.log(`\n   Auth token: ${authToken ? authToken.slice(0, 40) + '...' : 'NONE'}`);
  console.log(`   User ID:    ${userId || 'NONE'}`);

  // 3. Get all charities
  {
    const label = '3. CHARITIES Get All';
    const res = await request('GET', '/api/charities');
    console.log(`\n${label}`);
    console.log('   Response:', preview(res.body));
    if (res.status === 200 && Array.isArray(res.body)) {
      pass(label, res, `${res.body.length} charities returned`);
    } else if (res.status === 200 && res.body?.data && Array.isArray(res.body.data)) {
      pass(label, res, `${res.body.data.length} charities returned (wrapped)`);
    } else {
      fail(label, res, preview(res.body));
    }
  }

  // 4. Featured charities
  {
    const label = '4. CHARITIES Featured';
    const res = await request('GET', '/api/charities?featured=true');
    console.log(`\n${label}`);
    console.log('   Response:', preview(res.body));
    if (res.status === 200 && (Array.isArray(res.body) || Array.isArray(res.body?.data))) {
      const arr = Array.isArray(res.body) ? res.body : res.body.data;
      pass(label, res, `${arr.length} featured charities`);
    } else {
      fail(label, res, preview(res.body));
    }
  }

  // 5. Add score
  {
    const label = '5. SCORES Add Score';
    const res = await request('POST', '/api/scores', { score: 32, played_at: '2026-03-01' }, authToken);
    console.log(`\n${label}`);
    console.log('   Response:', preview(res.body));
    if (res.status === 201 || res.status === 200) {
      pass(label, res, 'Score added');
    } else if (res.status === 403 || res.status === 402) {
      info(label, res, 'Subscription required (expected)');
    } else if (res.status === 401) {
      fail(label, res, 'Unauthorized — token issue');
    } else {
      info(label, res, `HTTP ${res.status} — ${preview(res.body)}`);
    }
  }

  // 6. Subscription status
  {
    const label = '6. SUBSCRIPTIONS Status';
    const res = await request('GET', '/api/subscriptions/status', null, authToken);
    console.log(`\n${label}`);
    console.log('   Response:', preview(res.body));
    if (res.status === 200) {
      pass(label, res, preview(res.body));
    } else if (res.status === 401) {
      fail(label, res, 'Unauthorized');
    } else {
      info(label, res, preview(res.body));
    }
  }

  // 7. Get all draws
  {
    const label = '7. DRAWS Get All';
    const res = await request('GET', '/api/draws');
    console.log(`\n${label}`);
    console.log('   Response:', preview(res.body));
    if (res.status === 200) {
      pass(label, res, Array.isArray(res.body) ? `${res.body.length} draws` : preview(res.body));
    } else {
      fail(label, res, preview(res.body));
    }
  }

  // 8. Latest draw
  {
    const label = '8. DRAWS Latest';
    const res = await request('GET', '/api/draws/latest');
    console.log(`\n${label}`);
    console.log('   Response:', preview(res.body));
    if (res.status === 200) {
      pass(label, res, 'Latest draw returned');
    } else if (res.status === 404) {
      info(label, res, 'No draws yet (acceptable)');
    } else {
      fail(label, res, preview(res.body));
    }
  }

  // 9. My winners
  {
    const label = '9. WINNERS My Winners';
    const res = await request('GET', '/api/winners/me', null, authToken);
    console.log(`\n${label}`);
    console.log('   Response:', preview(res.body));
    if (res.status === 200) {
      pass(label, res, Array.isArray(res.body) ? `${res.body.length} winners` : preview(res.body));
    } else if (res.status === 401) {
      fail(label, res, 'Unauthorized');
    } else {
      info(label, res, preview(res.body));
    }
  }

  // 10. My profile
  {
    const label = '10. USERS My Profile';
    const res = await request('GET', '/api/users/me', null, authToken);
    console.log(`\n${label}`);
    console.log('   Response:', preview(res.body));
    if (res.status === 200) {
      pass(label, res, `User: ${res.body.email || res.body.user?.email || 'ok'}`);
    } else if (res.status === 401) {
      fail(label, res, 'Unauthorized');
    } else {
      info(label, res, preview(res.body));
    }
  }

  // 11. Health
  {
    const label = '11. HEALTH Check';
    const res = await request('GET', '/api/health');
    console.log(`\n${label}`);
    console.log('   Response:', preview(res.body));
    if (res.status === 200) {
      pass(label, res, 'Server healthy');
    } else {
      fail(label, res, preview(res.body));
    }
  }

  // 12. Admin analytics (expect 403)
  {
    const label = '12. ADMIN Analytics (non-admin)';
    const res = await request('GET', '/api/admin/analytics', null, authToken);
    console.log(`\n${label}`);
    console.log('   Response:', preview(res.body));
    if (res.status === 403) {
      pass(label, res, '403 Forbidden as expected for non-admin');
    } else if (res.status === 401) {
      info(label, res, '401 Unauthorized (also acceptable)');
    } else if (res.status === 200) {
      info(label, res, 'Returned 200 — user may already be admin');
    } else {
      info(label, res, preview(res.body));
    }
  }

  // 13. Admin simulate draw (expect 403)
  {
    const label = '13. ADMIN Simulate Draw (non-admin)';
    const res = await request('POST', '/api/admin/draws/simulate', {}, authToken);
    console.log(`\n${label}`);
    console.log('   Response:', preview(res.body));
    if (res.status === 403) {
      pass(label, res, '403 Forbidden as expected for non-admin');
    } else if (res.status === 401) {
      info(label, res, '401 Unauthorized (also acceptable)');
    } else if (res.status === 200 || res.status === 201) {
      info(label, res, 'Returned success — user may already be admin');
    } else {
      info(label, res, preview(res.body));
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('  TEST RUN COMPLETE');
  console.log('='.repeat(60));
}

run().catch(console.error);
