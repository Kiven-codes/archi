/**
 * config/supabaseClient.js
 *
 * Exports TWO Supabase clients with distinct permission levels:
 *
 *  • supabase (anonClient)  — uses the public anon key.
 *    Respects RLS policies.  Safe for read operations exposed to
 *    the outside world (e.g. fetching project data).
 *
 *  • supabaseAdmin           — uses the service_role key.
 *    BYPASSES RLS entirely.  Use only for privileged server-side
 *    operations (e.g. reading contact messages, admin writes).
 *    Never send this client's responses directly to the browser.
 */

import { createClient } from '@supabase/supabase-js';

const {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY,
} = process.env;

// ── Validate env vars at startup ───────────────────────────
if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    '[supabaseClient] Missing required Supabase environment variables. ' +
    'Check SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY in your .env file.'
  );
}

// ── Shared client options ──────────────────────────────────
const clientOptions = {
  auth: {
    // Disable automatic token refresh on the server — not needed for a REST API.
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
};

/**
 * Public Supabase client (anon key).
 * Honour RLS policies — use for public-facing queries.
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, clientOptions);

/**
 * Admin Supabase client (service_role key).
 * Bypasses RLS — use only for server-side privileged operations.
 */
export const supabaseAdmin = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  clientOptions,
);
