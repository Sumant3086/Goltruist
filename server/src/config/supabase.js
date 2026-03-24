const { createClient } = require('@supabase/supabase-js');

// Used only for Storage (file uploads) — all DB ops go through pg directly
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

module.exports = supabase;
